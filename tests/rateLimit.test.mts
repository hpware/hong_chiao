import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryRateLimiter } from "../lib/rate-limit.ts";

test("rate limiter rejects requests beyond a client's window", () => {
  const limiter = new InMemoryRateLimiter({ maxRequests: 2, windowMs: 1_000 });

  assert.equal(limiter.check("client-a", 0).allowed, true);
  assert.equal(limiter.check("client-a", 100).allowed, true);
  const rejected = limiter.check("client-a", 200);

  assert.equal(rejected.allowed, false);
  assert.equal(rejected.remaining, 0);
  assert.equal(rejected.retryAfterSeconds, 1);
});

test("rate limiter keeps clients independent", () => {
  const limiter = new InMemoryRateLimiter({ maxRequests: 1, windowMs: 1_000 });

  assert.equal(limiter.check("client-a", 0).allowed, true);
  assert.equal(limiter.check("client-a", 1).allowed, false);
  assert.equal(limiter.check("client-b", 1).allowed, true);
});

test("rate limiter allows requests after the window resets", () => {
  const limiter = new InMemoryRateLimiter({ maxRequests: 1, windowMs: 1_000 });

  assert.equal(limiter.check("client-a", 0).allowed, true);
  assert.equal(limiter.check("client-a", 999).allowed, false);
  assert.equal(limiter.check("client-a", 1_000).allowed, true);
});

test("checking capacity does not consume quota", () => {
  const limiter = new InMemoryRateLimiter({ maxRequests: 1, windowMs: 1_000 });

  assert.equal(limiter.check("client-a", 0, false).allowed, true);
  assert.equal(limiter.check("client-a", 1, false).allowed, true);
  assert.equal(limiter.check("client-a", 2).allowed, true);
  assert.equal(limiter.check("client-a", 3).allowed, false);
});
