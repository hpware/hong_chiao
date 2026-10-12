import { connect } from "node:net";

const WINDOW_MS = 60_000;
const REQUEST_LIMIT = 80;

export function isRateLimitEnabled(): boolean {
  const value = process.env.ENABLE_RATE_LIMIT?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

type RedisValue = string | number | null | RedisValue[];
export type RateLimitResult = { success: boolean; limit: number; remaining: number; reset: number };

const redisUrl = () => new URL(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");

function encodeCommand(command: string[]): Buffer {
  return Buffer.from(`*${command.length}\r\n${command.map((part) => `$${Buffer.byteLength(part)}\r\n${part}\r\n`).join("")}`);
}

function parseResponse(buffer: Buffer, offset = 0): { value: RedisValue; next: number } {
  const type = String.fromCharCode(buffer[offset]);
  const lineEnd = buffer.indexOf("\r\n", offset);
  if (lineEnd < 0) throw new Error("Incomplete Redis response");
  const line = buffer.subarray(offset + 1, lineEnd).toString();
  const next = lineEnd + 2;
  if (type === ":") return { value: Number(line), next };
  if (type === "+") return { value: line, next };
  if (type === "-") throw new Error(line);
  if (type === "$") {
    const length = Number(line);
    if (length < 0) return { value: null, next };
    return { value: buffer.subarray(next, next + length).toString(), next: next + length + 2 };
  }
  if (type === "*") {
    const values: RedisValue[] = [];
    let cursor = next;
    for (let index = 0; index < Number(line); index += 1) {
      const parsed = parseResponse(buffer, cursor);
      values.push(parsed.value);
      cursor = parsed.next;
    }
    return { value: values, next: cursor };
  }
  throw new Error(`Unsupported Redis response: ${type}`);
}

function redisEval(key: string): Promise<RedisValue> {
  const script = 'local count=redis.call("INCR",KEYS[1]); if count==1 then redis.call("PEXPIRE",KEYS[1],ARGV[1]) end; return {count,redis.call("PTTL",KEYS[1])}';
  const url = redisUrl();
  return new Promise((resolve, reject) => {
    const socket = connect({ host: url.hostname, port: Number(url.port || 6379) });
    let data = Buffer.alloc(0);
    socket.setTimeout(5_000);
    socket.once("connect", () => socket.write(encodeCommand(["EVAL", script, "1", key, String(WINDOW_MS)])));
    socket.on("data", (chunk: Buffer) => {
      data = Buffer.concat([data, chunk]);
      try {
        const parsed = parseResponse(data);
        socket.end();
        resolve(parsed.value);
      } catch {
        // RESP data can arrive in multiple chunks.
      }
    });
    socket.once("timeout", () => socket.destroy(new Error("Redis request timed out")));
    socket.once("error", reject);
  });
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  if (!isRateLimitEnabled()) return { success: true, limit: REQUEST_LIMIT, remaining: REQUEST_LIMIT, reset: Date.now() };
  const result = await redisEval(`hong-chiao:platform:${identifier}`);
  if (!Array.isArray(result) || typeof result[0] !== "number" || typeof result[1] !== "number") throw new Error("Invalid Redis rate-limit response");
  return { success: result[0] <= REQUEST_LIMIT, limit: REQUEST_LIMIT, remaining: Math.max(0, REQUEST_LIMIT - result[0]), reset: Date.now() + Math.max(0, result[1]) };
}

export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
