import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as limiter from "../lib/rate-limit.ts";

const require = createRequire(import.meta.url);

test("tRPC separates IP procedures from session procedures and rejects exhausted quotas", async (t) => {
  const original = process.env.ENABLE_RATE_LIMIT;
  process.env.ENABLE_RATE_LIMIT = "true";
  t.after(() => {
    if (original === undefined) delete process.env.ENABLE_RATE_LIMIT;
    else process.env.ENABLE_RATE_LIMIT = original;
  });
  const identifiers: string[] = [];
  let allowed = true;
  const exports = {} as typeof import("../trpc/init.ts");
  const source = ts.transpileModule(readFileSync(new URL("../trpc/init.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  runInNewContext(source, {
    exports,
    require(name: string): unknown {
      if (name === "next/headers") return { cookies: async () => ({ get: () => ({ value: "session-a" }) }) };
      if (name === "@/lib/rate-limit") return {
        ...limiter,
        async checkRateLimit(identifier: string) {
          identifiers.push(identifier);
          return { success: allowed };
        },
      };
      return require(name);
    },
  });
  const router = exports.createTRPCRouter({
    login: exports.ipLimitedProcedure.mutation(() => "login"),
    captcha: exports.ipLimitedProcedure.query(() => "captcha"),
    data: exports.baseProcedure.query(() => "data"),
  });
  const headers = new Headers({ "x-real-ip": "192.0.2.1" });
  const context = await exports.createTRPCContext({ headers });
  assert.equal(context.sessionId, "session-a");
  const caller = router.createCaller(context);
  assert.equal(await caller.login(), "login");
  assert.equal(await caller.captcha(), "captcha");
  assert.equal(await caller.data(), "data");
  assert.deepEqual(identifiers, ["ip:192.0.2.1", "ip:192.0.2.1", limiter.rateLimitIdentifier(headers, "session-a")]);
  allowed = false;
  await assert.rejects(caller.data(), { code: "TOO_MANY_REQUESTS" });
  await assert.rejects(caller.login(), { code: "TOO_MANY_REQUESTS" });
});
