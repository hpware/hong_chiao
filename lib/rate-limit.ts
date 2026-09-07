type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

type Window = {
  count: number;
  resetsAt: number;
};

type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
};

export class InMemoryRateLimiter {
  private readonly windows = new Map<string, Window>();
  private readonly options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = options;
  }

  check(key: string, now = Date.now()): RateLimitResult {
    const existing = this.windows.get(key);
    const window =
      !existing || existing.resetsAt <= now
        ? { count: 0, resetsAt: now + this.options.windowMs }
        : existing;

    if (window.count >= this.options.maxRequests) {
      return {
        allowed: false,
        limit: this.options.maxRequests,
        remaining: 0,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((window.resetsAt - now) / 1000),
        ),
      };
    }

    window.count += 1;
    this.windows.set(key, window);
    this.pruneExpired(now);

    return {
      allowed: true,
      limit: this.options.maxRequests,
      remaining: this.options.maxRequests - window.count,
      retryAfterSeconds: 0,
    };
  }

  private pruneExpired(now: number) {
    if (this.windows.size < 1_000) return;

    for (const [key, window] of this.windows) {
      if (window.resetsAt <= now) this.windows.delete(key);
    }
  }
}

const clientLimiter = new InMemoryRateLimiter({
  maxRequests: 30,
  windowMs: 10_000,
});
const serverLimiter = new InMemoryRateLimiter({
  maxRequests: 200,
  windowMs: 10_000,
});

function getCookie(cookieHeader: string, name: string) {
  const prefix = `${name}=`;
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
}

function requestKey(request: Request) {
  const sessionId = getCookie(
    request.headers.get("cookie") ?? "",
    "ASP.NET_SessionId",
  );
  if (sessionId) return `session:${sessionId}`;

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  const address =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    forwardedFor?.trim() ??
    "unknown";
  return `address:${address}`;
}

export function checkApiRateLimit(request: Request) {
  const clientResult = clientLimiter.check(requestKey(request));
  if (!clientResult.allowed) return clientResult;

  const serverResult = serverLimiter.check("server");
  return serverResult.allowed ? clientResult : serverResult;
}

export function tooManyRequests(result: RateLimitResult) {
  return Response.json(
    { error: "請求太頻繁，請稍後再試。" },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}
