import assert from "node:assert/strict";
import test from "node:test";
import { parseRateLimitReply } from "../lib/rate-limit.ts";

test("parses an accepted Redis rate-limit response", () => {
  assert.deepEqual(parseRateLimitReply([1, 30, 29, 0]), {
    allowed: true,
    limit: 30,
    remaining: 29,
    retryAfterSeconds: 0,
    status: 200,
  });
});

test("parses a rejected Redis rate-limit response", () => {
  assert.deepEqual(parseRateLimitReply([0, 30, 0, 1_501]), {
    allowed: false,
    limit: 30,
    remaining: 0,
    retryAfterSeconds: 2,
    status: 429,
  });
});

test("uses a one-second retry when a rejected key has no TTL", () => {
  assert.equal(parseRateLimitReply([0, 200, 0, -1]).retryAfterSeconds, 1);
});

test("rejects malformed Redis responses", () => {
  assert.throws(() => parseRateLimitReply([1, 30, "invalid", 0]));
  assert.throws(() => parseRateLimitReply([2, 30, 29, 0]));
  assert.throws(() => parseRateLimitReply(null));
});
