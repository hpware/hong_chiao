import assert from "node:assert/strict";
import test from "node:test";
import { resolveBuildCommitSha } from "../lib/build-commit.ts";

test("uses the injected Docker commit SHA", () => {
  const sha = "0123456789abcdef0123456789abcdef01234567";
  assert.equal(
    resolveBuildCommitSha(sha, () => {
      throw new Error("Git should not be called when a SHA is injected");
    }),
    sha,
  );
});

test("uses unknown when neither an injected SHA nor Git is available", () => {
  assert.equal(
    resolveBuildCommitSha(undefined, () => {
      throw new Error("Git is unavailable");
    }),
    "unknown",
  );
  assert.equal(resolveBuildCommitSha("", () => "  "), "unknown");
});
