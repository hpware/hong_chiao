import { Agent, type Dispatcher } from "undici";

export type UpstreamCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
};

export type UpstreamCookies = UpstreamCookie[];

type StoredCookie = UpstreamCookie & {
  hostOnly: boolean;
};

type RequestOptions = Omit<RequestInit, "body" | "method" | "redirect"> & {
  data?: BodyInit | null;
};

type ChromeFetchOptions = {
  requestTimeoutMs?: number;
};

const MAX_REDIRECTS = 20;
const REQUEST_TIMEOUT_MS = 30_000;
const UPSTREAM_CONNECTIONS = 32;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

// One process-wide pool lets separate API requests and users reuse warm TLS
// connections. The cap still allows bursts to run concurrently without an
// unbounded number of clients overwhelming the upstream school system.
const upstreamDispatcher = new Agent({
  allowH2: true,
  connections: UPSTREAM_CONNECTIONS,
  connectTimeout: 10_000,
  keepAliveTimeout: 60_000,
  keepAliveMaxTimeout: 10 * 60_000,
  pipelining: 1,
});

type NodeRequestInit = RequestInit & {
  dispatcher: Dispatcher;
};

function defaultCookiePath(pathname: string) {
  const lastSlash = pathname.lastIndexOf("/");
  return lastSlash <= 0 ? "/" : pathname.slice(0, lastSlash);
}

function splitSetCookieHeader(header: string) {
  return header.split(/,(?=\s*[^;,=\s]+=[^;,]*)/);
}

function getSetCookieHeaders(headers: Headers) {
  const headersWithSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };
  const values = headersWithSetCookie.getSetCookie?.();
  if (values && values.length > 0) return values;

  const combined = headers.get("set-cookie");
  return combined ? splitSetCookieHeader(combined) : [];
}

function domainMatches(hostname: string, cookie: StoredCookie) {
  const domain = cookie.domain.replace(/^\./, "").toLowerCase();
  const host = hostname.toLowerCase();
  return cookie.hostOnly
    ? host === domain
    : host === domain || host.endsWith(`.${domain}`);
}

function pathMatches(pathname: string, cookiePath: string) {
  if (pathname === cookiePath) return true;
  if (!pathname.startsWith(cookiePath)) return false;
  return cookiePath.endsWith("/") || pathname.charAt(cookiePath.length) === "/";
}

function isExpired(cookie: UpstreamCookie) {
  return (
    cookie.expires !== undefined &&
    cookie.expires >= 0 &&
    cookie.expires <= Date.now() / 1000
  );
}

async function isValidCookieDomain(
  requestHostname: string,
  cookieDomain: string,
) {
  const hostname = requestHostname.toLowerCase();
  const domain = cookieDomain.replace(/^\./, "").toLowerCase();
  const matchesRequest = hostname === domain || hostname.endsWith(`.${domain}`);
  if (!matchesRequest) return false;

  const { getDomain } = await import("tldts");

  return getDomain(domain, { allowPrivateDomains: true }) !== null;
}

function redirectReferer(previousUrl: URL, nextUrl: URL) {
  if (previousUrl.protocol === "https:" && nextUrl.protocol === "http:") {
    return undefined;
  }

  return previousUrl.origin === nextUrl.origin
    ? previousUrl.toString()
    : `${previousUrl.origin}/`;
}

/**
 * A response whose body has already been read off the socket.
 *
 * `get`/`post` return this instead of a raw `Response` so that ignoring the
 * result cannot leak a connection: undici keeps a socket checked out of the
 * pool until the body is read or cancelled, and Playwright used to hide that
 * by tearing down a browser process per call. Buffering up front makes the
 * safe thing the default; `ChromeFetchClient.stream` is the opt-in escape
 * hatch for callers that genuinely need to pipe the body onward.
 */
export class ChromeFetchResponse {
  readonly status: number;
  readonly statusText: string;
  readonly ok: boolean;
  readonly url: string;
  readonly headers: Headers;
  private readonly buffer: ArrayBuffer;
  private decoded?: string;

  constructor(response: Response, buffer: ArrayBuffer) {
    this.status = response.status;
    this.statusText = response.statusText;
    this.ok = response.ok;
    this.url = response.url;
    this.headers = response.headers;
    this.buffer = buffer;
  }

  async arrayBuffer() {
    return this.buffer;
  }

  async text() {
    this.decoded ??= new TextDecoder().decode(this.buffer);
    return this.decoded;
  }

  async json() {
    return JSON.parse(await this.text());
  }
}

export class ChromeFetchClient {
  private cookiesStore: StoredCookie[];
  private requestTimeoutMs: number;

  constructor(cookies: UpstreamCookies = [], options: ChromeFetchOptions = {}) {
    this.cookiesStore = cookies.map((cookie) => ({
      ...cookie,
      domain: cookie.domain.replace(/^\./, "").toLowerCase(),
      path: cookie.path || "/",
      hostOnly: !cookie.domain.startsWith("."),
    }));
    this.requestTimeoutMs = options.requestTimeoutMs ?? REQUEST_TIMEOUT_MS;
  }

  async get(url: string, options: Omit<RequestOptions, "data"> = {}) {
    return this.buffered(await this.fetch(url, { ...options, method: "GET" }));
  }

  async post(url: string, options: RequestOptions = {}) {
    const { data, ...init } = options;
    return this.buffered(
      await this.fetch(url, { ...init, method: "POST", body: data }),
    );
  }

  /**
   * Perform a request and hand back the raw streaming `Response`.
   *
   * The caller then owns the body and MUST either consume it or pass it to
   * `discard`. Only use this to pipe a body straight through to the client
   * (see `bill/download.ts`); prefer `get`/`post` everywhere else.
   */
  stream(
    url: string,
    options: RequestOptions & { method?: "GET" | "POST" } = {},
  ) {
    const { data, method = "GET", ...init } = options;
    return this.fetch(url, { ...init, method, body: data });
  }

  cookies(url?: string) {
    const parsedUrl = url ? new URL(url) : null;
    const activeCookies: StoredCookie[] = [];
    const matchingCookies: UpstreamCookies = [];

    for (const storedCookie of this.cookiesStore) {
      if (isExpired(storedCookie)) continue;
      activeCookies.push(storedCookie);

      if (
        parsedUrl &&
        (!domainMatches(parsedUrl.hostname, storedCookie) ||
          !pathMatches(parsedUrl.pathname, storedCookie.path) ||
          (storedCookie.secure && parsedUrl.protocol !== "https:"))
      ) {
        continue;
      }

      const { hostOnly: _hostOnly, ...cookie } = storedCookie;
      matchingCookies.push(cookie);
    }

    this.cookiesStore = activeCookies;
    return matchingCookies;
  }

  /** Release a streaming response the caller has decided not to read. */
  async discard(response: Response) {
    await response.body?.cancel();
  }

  /** Drain a response onto the heap so its socket returns to the pool. */
  private async buffered(response: Response) {
    return new ChromeFetchResponse(response, await response.arrayBuffer());
  }

  private async fetch(url: string, init: RequestInit) {
    let currentUrl = new URL(url);
    let method = init.method ?? "GET";
    let body = init.body;
    let referer: string | undefined;
    const requestHeaders = new Headers(init.headers);
    const timeoutSignal = AbortSignal.timeout(this.requestTimeoutMs);
    const signal = init.signal
      ? AbortSignal.any([init.signal, timeoutSignal])
      : timeoutSignal;

    for (let redirects = 0; redirects < MAX_REDIRECTS; redirects += 1) {
      const headers = new Headers(requestHeaders);
      headers.set("User-Agent", USER_AGENT);
      headers.set("Accept-Language", "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7");
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      if (referer && !headers.has("Referer")) {
        headers.set("Referer", referer);
      }
      if (method !== "GET" && method !== "HEAD" && !headers.has("Origin")) {
        headers.set("Origin", currentUrl.origin);
      }

      const cookieHeader = this.cookieHeader(currentUrl);
      if (cookieHeader) headers.set("Cookie", cookieHeader);
      else headers.delete("Cookie");

      const requestInit: NodeRequestInit = {
        ...init,
        body,
        dispatcher: upstreamDispatcher,
        headers,
        method,
        redirect: "manual",
        signal,
      };
      const response = await fetch(currentUrl, requestInit);
      await this.storeResponseCookies(response, currentUrl);

      const location = response.headers.get("location");
      if (!location || ![301, 302, 303, 307, 308].includes(response.status)) {
        return response;
      }
      if (redirects === MAX_REDIRECTS - 1) {
        await this.discard(response);
        throw new Error(`Too many redirects while requesting ${url}`);
      }

      const previousUrl = currentUrl;
      let nextUrl: URL;
      try {
        nextUrl = new URL(location, previousUrl);
      } catch (error) {
        await this.discard(response);
        throw error;
      }

      const crossesOrigin = previousUrl.origin !== nextUrl.origin;
      referer = redirectReferer(previousUrl, nextUrl);
      await this.discard(response);
      currentUrl = nextUrl;

      if (crossesOrigin) {
        requestHeaders.delete("Authorization");
        requestHeaders.delete("Proxy-Authorization");
        requestHeaders.delete("Referer");
        requestHeaders.delete("Origin");
        requestHeaders.delete("X-Requested-With");
      }

      if (
        response.status === 303 ||
        ((response.status === 301 || response.status === 302) &&
          method === "POST")
      ) {
        method = "GET";
        body = undefined;
        for (const header of [...requestHeaders.keys()]) {
          if (header.startsWith("content-")) requestHeaders.delete(header);
        }
      }
    }

    throw new Error(`Unable to complete request to ${url}`);
  }

  private cookieHeader(url: URL) {
    return this.cookies(url.toString())
      .sort((left, right) => right.path.length - left.path.length)
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");
  }

  private async storeResponseCookies(response: Response, requestUrl: URL) {
    for (const header of getSetCookieHeaders(response.headers)) {
      const [pair, ...attributes] = header.split(";");
      const separator = pair?.indexOf("=") ?? -1;
      if (!pair || separator < 1) continue;

      const cookie: StoredCookie = {
        name: pair.slice(0, separator).trim(),
        value: pair.slice(separator + 1).trim(),
        domain: requestUrl.hostname.toLowerCase(),
        path: defaultCookiePath(requestUrl.pathname),
        hostOnly: true,
      };
      let hasInvalidDomain = false;

      for (const rawAttribute of attributes) {
        const [rawName, ...rawValue] = rawAttribute.trim().split("=");
        const name = rawName?.toLowerCase();
        const value = rawValue.join("=");

        if (name === "domain" && value) {
          if (!(await isValidCookieDomain(requestUrl.hostname, value))) {
            hasInvalidDomain = true;
            break;
          }
          cookie.domain = value.replace(/^\./, "").toLowerCase();
          cookie.hostOnly = false;
        } else if (name === "path" && value) {
          cookie.path = value;
        } else if (name === "expires" && value) {
          const expires = Date.parse(value);
          if (!Number.isNaN(expires)) cookie.expires = expires / 1000;
        } else if (name === "max-age" && value) {
          const seconds = Number(value);
          if (!Number.isNaN(seconds)) {
            cookie.expires = Date.now() / 1000 + seconds;
          }
        } else if (name === "secure") {
          cookie.secure = true;
        } else if (name === "httponly") {
          cookie.httpOnly = true;
        } else if (name === "samesite") {
          const sameSite = value.toLowerCase();
          if (sameSite === "strict") cookie.sameSite = "Strict";
          if (sameSite === "lax") cookie.sameSite = "Lax";
          if (sameSite === "none") cookie.sameSite = "None";
        }
      }

      if (hasInvalidDomain) continue;

      this.cookiesStore = this.cookiesStore.filter(
        (stored) =>
          !(
            stored.name === cookie.name &&
            stored.domain === cookie.domain &&
            stored.path === cookie.path
          ),
      );
      if (!isExpired(cookie)) this.cookiesStore.push(cookie);
    }
  }
}

export function createChromeFetch(
  cookies: UpstreamCookies = [],
  options: ChromeFetchOptions = {},
) {
  return new ChromeFetchClient(cookies, options);
}
