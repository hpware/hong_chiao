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

const MAX_REDIRECTS = 20;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

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

export class ChromeFetchClient {
  private cookiesStore: StoredCookie[];

  constructor(cookies: UpstreamCookies = []) {
    this.cookiesStore = cookies.map((cookie) => ({
      ...cookie,
      domain: cookie.domain.replace(/^\./, "").toLowerCase(),
      path: cookie.path || "/",
      hostOnly: false,
    }));
  }

  get(url: string, options: Omit<RequestOptions, "data"> = {}) {
    return this.fetch(url, { ...options, method: "GET" });
  }

  post(url: string, options: RequestOptions = {}) {
    const { data, ...init } = options;
    return this.fetch(url, {
      ...init,
      method: "POST",
      body: data,
    });
  }

  cookies(url?: string) {
    const parsedUrl = url ? new URL(url) : null;
    this.cookiesStore = this.cookiesStore.filter(
      (cookie) => !isExpired(cookie),
    );

    return this.cookiesStore
      .filter(
        (cookie) =>
          !parsedUrl ||
          (domainMatches(parsedUrl.hostname, cookie) &&
            pathMatches(parsedUrl.pathname, cookie.path) &&
            (!cookie.secure || parsedUrl.protocol === "https:")),
      )
      .map(({ hostOnly: _hostOnly, ...cookie }) => cookie);
  }

  private async fetch(url: string, init: RequestInit) {
    let currentUrl = new URL(url);
    let method = init.method ?? "GET";
    let body = init.body;
    let referer: string | undefined;

    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      const headers = new Headers(init.headers);
      headers.set("User-Agent", USER_AGENT);
      headers.set("Accept-Language", "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7");
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      if (referer && !headers.has("Referer")) {
        headers.set("Referer", referer);
      }

      const cookieHeader = this.cookieHeader(currentUrl);
      if (cookieHeader) headers.set("Cookie", cookieHeader);
      else headers.delete("Cookie");

      const response = await fetch(currentUrl, {
        ...init,
        body,
        headers,
        method,
        redirect: "manual",
      });
      this.storeResponseCookies(response, currentUrl);

      const location = response.headers.get("location");
      if (!location || ![301, 302, 303, 307, 308].includes(response.status)) {
        return response;
      }
      if (redirects === MAX_REDIRECTS) {
        await response.body?.cancel();
        throw new Error(`Too many redirects while requesting ${url}`);
      }

      const previousUrl = currentUrl;
      currentUrl = new URL(location, previousUrl);
      referer = previousUrl.toString();
      await response.body?.cancel();

      if (
        response.status === 303 ||
        ((response.status === 301 || response.status === 302) &&
          method === "POST")
      ) {
        method = "GET";
        body = undefined;
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

  private storeResponseCookies(response: Response, requestUrl: URL) {
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

      for (const rawAttribute of attributes) {
        const [rawName, ...rawValue] = rawAttribute.trim().split("=");
        const name = rawName?.toLowerCase();
        const value = rawValue.join("=");

        if (name === "domain" && value) {
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

export function createChromeFetch(cookies: UpstreamCookies = []) {
  return new ChromeFetchClient(cookies);
}
