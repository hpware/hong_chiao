import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import type { NextRequest, NextResponse } from "next/server";

const require = createRequire(import.meta.url);
const nextServer = require("next/server") as typeof import("next/server");
const source = ts.transpileModule(readFileSync(new URL("../app/api/auth/logout/route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;

for (const outcome of ["allowed", "limited", "redis-error", "invalid-ip", "upstream-error"] as const) {
  test(`logout clears cookies and redirects when ${outcome}`, async () => {
    let remoteCalls = 0;
    const exports: { GET?: (request: NextRequest) => Promise<NextResponse> } = {};
    runInNewContext(source, {
      exports, URL,
      process: { env: { API_URL: "https://upstream.example.test", NEXT_PUBLIC_APP_URL: "https://app.example.test" } },
      console: { error() {} },
      require(name: string): unknown {
        if (name === "next/server") return nextServer;
        if (name === "@/components/univeralComponents") return { authCookieNames: ["session", "session2"] };
        if (name === "@/components/px_items/user/logout") return async () => {
          remoteCalls++;
          if (outcome === "upstream-error") throw new Error("Remote logout failed");
        };
        if (name === "@/lib/rate-limit") return {
          rateLimitIdentifier() {
            if (outcome === "invalid-ip") throw new Error("Trusted proxy must supply a valid X-Real-IP");
            return "192.0.2.1";
          },
          async checkRateLimit() {
            if (outcome === "redis-error") throw new Error("Redis unavailable");
            return { success: outcome !== "limited" };
          },
        };
        throw new Error(`Unexpected import: ${name}`);
      },
    });
    assert.ok(exports.GET);
    const response = await exports.GET(new nextServer.NextRequest("https://app.example.test/api/auth/logout?expired=true", {
      headers: { cookie: "session=value; session2=value2; ssLoginForLDAP=value3" },
    }));
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "https://app.example.test/auth/login?expired=true");
    for (const name of ["session", "session2", "ssLoginForLDAP"]) {
      assert.equal(response.cookies.get(name)?.value, "");
      const expires = response.cookies.get(name)?.expires;
      assert.ok(expires instanceof Date);
      assert.equal(expires.getTime(), 0);
    }
    assert.equal(remoteCalls, outcome === "allowed" || outcome === "upstream-error" ? 1 : 0);
  });
}
