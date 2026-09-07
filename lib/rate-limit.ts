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
  private cleanupTimer: NodeJS.Timeout | undefined;

  constructor(options: RateLimitOptions) {
    this.options = options;
  }

  check(key: string, now = Date.now(), consume = true): RateLimitResult {
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

    if (consume) {
      window.count += 1;
      this.windows.set(key, window);
      this.scheduleCleanup();
    }

    return {
      allowed: true,
      limit: this.options.maxRequests,
      remaining: this.options.maxRequests - window.count,
      retryAfterSeconds: 0,
    };
  }

  private pruneExpired(now: number) {
    for (const [key, window] of this.windows) {
      if (window.resetsAt <= now) this.windows.delete(key);
    }
  }

  private scheduleCleanup() {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setTimeout(() => {
      this.cleanupTimer = undefined;
      this.pruneExpired(Date.now());
      if (this.windows.size > 0) this.scheduleCleanup();
    }, this.options.windowMs);
    this.cleanupTimer.unref();
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

function requestKey(request: Request) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .at(-1);
  const address =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    forwardedFor?.trim() ??
    "unknown";
  return `address:${address}`;
}

export function checkApiRateLimit(request: Request) {
  const now = Date.now();
  const serverResult = serverLimiter.check("server", now, false);
  if (!serverResult.allowed) return serverResult;

  const key = requestKey(request);
  const clientResult = clientLimiter.check(key, now, false);
  if (!clientResult.allowed) return clientResult;

  serverLimiter.check("server", now);
  return clientLimiter.check(key, now);
}

export function tooManyRequests(result: RateLimitResult) {
  return Response.json(
    { error: "請求太頻繁，請稍後再試。" },
    {
      status: 429,
      headers: {
        "Cache-Control": "private, no-store",
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}
