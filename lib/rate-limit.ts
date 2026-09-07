import { createHmac, randomBytes } from "node:crypto";
import { createClient } from "redis";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  status: 200 | 429 | 503;
};

const CLIENT_LIMIT = 30;
const SERVER_LIMIT = 200;
const WINDOW_MS = 10_000;
const SERVER_KEY = "hong-chiao:rate-limit:server";
const CLIENT_KEY_PREFIX = "hong-chiao:rate-limit:client:";
const ADDRESS_HASH_KEY = randomBytes(32);

const RATE_LIMIT_SCRIPT = `
local server_count = tonumber(redis.call("GET", KEYS[1]) or "0")
local client_count = tonumber(redis.call("GET", KEYS[2]) or "0")
local server_limit = tonumber(ARGV[1])
local client_limit = tonumber(ARGV[2])
local window_ms = tonumber(ARGV[3])

if server_count >= server_limit then
  return {0, server_limit, 0, redis.call("PTTL", KEYS[1])}
end

if client_count >= client_limit then
  return {0, client_limit, 0, redis.call("PTTL", KEYS[2])}
end

server_count = redis.call("INCR", KEYS[1])
if server_count == 1 then
  redis.call("PEXPIRE", KEYS[1], window_ms)
end

client_count = redis.call("INCR", KEYS[2])
if client_count == 1 then
  redis.call("PEXPIRE", KEYS[2], window_ms)
end

return {1, client_limit, client_limit - client_count, 0}
`;

function createRateLimitClient(url: string) {
  return createClient({
    url,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 1_000,
      reconnectStrategy: (retries) => Math.min(100 * 2 ** retries, 2_000),
    },
  });
}

type RedisClient = ReturnType<typeof createRateLimitClient>;

let clientPromise: Promise<RedisClient> | undefined;

function getRedisClient(): Promise<RedisClient> {
  if (clientPromise) return clientPromise;

  const url = process.env.REDIS_URL;
  if (!url) {
    return Promise.reject(new Error("REDIS_URL is required"));
  }

  const client = createRateLimitClient(url);
  client.on("error", (error) => {
    console.error("Redis rate limiter error", error);
  });

  const connecting = client.connect().catch((error: unknown) => {
    clientPromise = undefined;
    client.destroy();
    throw error;
  });
  clientPromise = connecting;
  return connecting;
}

function requestAddress(request: Request) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .at(-1);
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    forwardedFor?.trim() ??
    "unknown"
  );
}

function clientKey(request: Request) {
  const addressHash = createHmac("sha256", ADDRESS_HASH_KEY)
    .update(requestAddress(request))
    .digest("base64url");
  return `${CLIENT_KEY_PREFIX}${addressHash}`;
}

function isNumericValue(value: unknown): value is number | string {
  return (
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" &&
      value.trim() !== "" &&
      !Number.isNaN(Number(value)))
  );
}

export function parseRateLimitReply(reply: unknown): RateLimitResult {
  if (
    !Array.isArray(reply) ||
    reply.length !== 4 ||
    !reply.every(isNumericValue)
  ) {
    throw new Error("Redis returned an invalid rate-limit response");
  }

  const [allowedValue, limitValue, remainingValue, retryAfterMsValue] =
    reply.map(Number);
  if (
    (allowedValue !== 0 && allowedValue !== 1) ||
    limitValue < 1 ||
    remainingValue < 0
  ) {
    throw new Error("Redis returned an invalid rate-limit response");
  }

  const allowed = allowedValue === 1;
  return {
    allowed,
    limit: limitValue,
    remaining: remainingValue,
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil(Math.max(0, retryAfterMsValue) / 1_000)),
    status: allowed ? 200 : 429,
  };
}

export async function checkApiRateLimit(
  request: Request,
): Promise<RateLimitResult> {
  try {
    const client = await getRedisClient();
    const reply = await client.eval(RATE_LIMIT_SCRIPT, {
      keys: [SERVER_KEY, clientKey(request)],
      arguments: [String(SERVER_LIMIT), String(CLIENT_LIMIT), String(WINDOW_MS)],
    });
    return parseRateLimitReply(reply);
  } catch (error: unknown) {
    console.error("Unable to check the Redis rate limit", error);
    return {
      allowed: false,
      limit: 0,
      remaining: 0,
      retryAfterSeconds: 1,
      status: 503,
    };
  }
}

export function rateLimitResponse(result: RateLimitResult) {
  const unavailable = result.status === 503;
  return Response.json(
    {
      error: unavailable
        ? "流量保護服務暫時無法使用，請稍後再試。"
        : "請求太頻繁，請稍後再試。",
    },
    {
      status: result.status,
      headers: {
        "Cache-Control": "private, no-store",
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}
