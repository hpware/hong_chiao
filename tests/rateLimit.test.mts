import assert from "node:assert/strict";
import { createServer, type Socket } from "node:net";
import test from "node:test";
import { checkRateLimit, clientIp, rateLimitIdentifier, validateRateLimitConfig } from "../lib/rate-limit.ts";

test("rate limiter proxy and Redis regressions", async (t) => {
  const original = { ...process.env };
  t.after(() => { process.env = original; });
  process.env.ENABLE_RATE_LIMIT = "true";
  process.env.REDIS_URL = "redis://localhost:6379";

  await t.test("rejects unsupported Redis URL fields", () => {
    for (const url of ["rediss://localhost", "redis://user:pass@localhost", "redis://localhost/1", "redis://localhost?db=1", "https://localhost"]) {
      process.env.REDIS_URL = url;
      assert.throws(validateRateLimitConfig, /REDIS_URL/);
    }
    process.env.REDIS_URL = "redis://localhost:6379/0";
    assert.doesNotThrow(validateRateLimitConfig);
  });

  await t.test("uses the proxy IP; missing or invalid addresses cannot share a quota", () => {
    const headers = new Headers();
    assert.throws(() => clientIp(headers), /valid X-Real-IP/);
    headers.set("x-forwarded-for", "192.0.2.2");
    assert.throws(() => clientIp(headers), /valid X-Real-IP/);
    headers.set("x-real-ip", "192.0.2.1, 192.0.2.2");
    assert.throws(() => clientIp(headers), /valid X-Real-IP/);
    headers.set("x-real-ip", "192.0.2.1");
    assert.equal(clientIp(headers), "192.0.2.1");
    headers.set("x-real-ip", "2001:0db8:0:0:0:0:0:1");
    assert.equal(clientIp(headers), "2001:db8::1");
  });

  async function withRedis(reply: (socket: Socket) => void, check: () => Promise<void>) {
    const sockets = new Set<Socket>();
    const server = createServer((socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
      socket.once("data", () => reply(socket));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    process.env.REDIS_URL = `redis://127.0.0.1:${address.port}`;
    try { await check(); }
    finally {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  await t.test("login and CAPTCHA use the IP even when a session cookie exists", () => {
    const headers = new Headers({ "x-real-ip": "192.0.2.1" });
    assert.equal(rateLimitIdentifier(headers, "session-a", "ip"), "ip:192.0.2.1");
    assert.equal(rateLimitIdentifier(headers, "session-b", "ip"), "ip:192.0.2.1");
    assert.throws(() => rateLimitIdentifier(new Headers(), "session-a", "ip"), /valid X-Real-IP/);
  });

  await t.test("sessions are independent of IP and account cookies; missing sessions fall back to IP", () => {
    const headers = new Headers({ "x-real-ip": "192.0.2.1", cookie: "ssLoginID=student-a" });
    const identifier = rateLimitIdentifier(headers, "session-a");
    assert.match(identifier, /^session:[a-f0-9]{64}$/);
    assert.ok(!identifier.includes("session-a"));
    assert.equal(identifier, rateLimitIdentifier(new Headers(), "session-a"));
    assert.notEqual(identifier, rateLimitIdentifier(headers, "session-b"));
    assert.equal(rateLimitIdentifier(headers), "ip:192.0.2.1");
    assert.equal(rateLimitIdentifier(headers, ""), "ip:192.0.2.1");
  });

  await t.test("an exhausted session stays limited while another or renewed session gets a fresh quota", async () => {
    const headers = new Headers({ "x-real-ip": "192.0.2.1" });
    const oldSession = rateLimitIdentifier(headers, "old-session");
    const counts = new Map<string, number>([[`hong-chiao:platform:${oldSession}`, 80]]);
    const sockets = new Set<Socket>();
    const server = createServer((socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
      let command = "";
      socket.on("data", (chunk) => {
        command += chunk.toString();
        if (!command.endsWith("$5\r\n60000\r\n")) return;
        const key = command.split("\r\n").find((part) => part.startsWith("hong-chiao:platform:"));
        assert.ok(key);
        const count = (counts.get(key) ?? 0) + 1;
        counts.set(key, count);
        socket.end(`*2\r\n:${count}\r\n:60000\r\n`);
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    process.env.REDIS_URL = `redis://127.0.0.1:${address.port}`;
    try {
      assert.equal((await checkRateLimit(oldSession)).success, false);
      for (const session of ["other-student-session", "renewed-session"]) {
        const result = await checkRateLimit(rateLimitIdentifier(headers, session));
        assert.equal(result.success, true);
        assert.equal(result.remaining, 79);
      }
      assert.equal((await checkRateLimit(oldSession)).success, false);
    } finally {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  await t.test("clean EOF with empty or partial reply rejects promptly", { timeout: 2000 }, async () => {
    for (const reply of ["", "*2\r\n:1\r\n", "*2\r\n$4\r\nab"]) {
      await withRedis((socket) => socket.end(reply), async () => {
        await assert.rejects(checkRateLimit("192.0.2.1"), /before a complete response/);
      });
    }
  });

  await t.test("Redis error replies reject immediately with their message", { timeout: 2000 }, async () => {
    await withRedis((socket) => socket.write("-NOAUTH Authentication required\r\n"), async () => {
      await assert.rejects(checkRateLimit("192.0.2.1"), /NOAUTH/);
    });
  });

  await t.test("a silent Redis connection has a bounded deadline", { timeout: 7000 }, async () => {
    await withRedis(() => {}, async () => {
      await assert.rejects(checkRateLimit("192.0.2.1"), /timed out/);
    });
  });

  await t.test("fragmented successful responses and quota exhaustion", async () => {
    for (const count of [1, 80, 81]) {
      await withRedis((socket) => {
        socket.write(`*2\r\n:${count}\r\n`);
        setTimeout(() => socket.end(":50000\r\n"), 10);
      }, async () => {
        const result = await checkRateLimit("192.0.2.1");
        assert.equal(result.success, count <= 80);
        assert.equal(result.remaining, Math.max(0, 80 - count));
      });
    }
  });

  await t.test("disabled limiter needs neither proxy nor Redis", async () => {
    process.env.ENABLE_RATE_LIMIT = "false";
    process.env.REDIS_URL = "invalid";
    assert.doesNotThrow(validateRateLimitConfig);
    assert.equal(clientIp(new Headers()), "");
    assert.equal(rateLimitIdentifier(new Headers(), "session-a"), "");
    assert.equal(rateLimitIdentifier(new Headers(), undefined, "ip"), "");
    assert.equal((await checkRateLimit("")).success, true);
  });
});
