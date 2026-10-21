import assert from "node:assert/strict";
import test from "node:test";
import {
  isExactReleaseVersion,
  resolveBuildVersion,
} from "../lib/build-version.ts";

test("uses the injected build version", () => {
  const version = "v0.11.1";
  assert.equal(
    resolveBuildVersion(
      version,
      () => {
        throw new Error("Git should not be called when version is injected");
      },
      "0.0.0",
    ),
    version,
  );
});

test("falls back to git version when injected version is absent", () => {
  assert.equal(
    resolveBuildVersion(undefined, () => "v0.11.1", "0.0.0"),
    "v0.11.1",
  );
  assert.equal(
    resolveBuildVersion("", () => "v0.11.1", "0.0.0"),
    "v0.11.1",
  );
});

test("falls back to package.json version when neither injected version nor git is available", () => {
  assert.equal(
    resolveBuildVersion(
      undefined,
      () => {
        throw new Error("Git is unavailable");
      },
      "0.11.1",
    ),
    "0.11.1",
  );
  assert.equal(
    resolveBuildVersion("", () => "   ", "0.11.1"),
    "0.11.1",
  );
});

test("falls back to default 0.0.0 when everything fails", () => {
  assert.equal(
    resolveBuildVersion(
      undefined,
      () => {
        throw new Error("Git unavailable");
      },
      "",
    ),
    "0.0.0",
  );
});

test("isExactReleaseVersion identifies release versions correctly", () => {
  assert.equal(isExactReleaseVersion("v0.11.1"), true);
  assert.equal(isExactReleaseVersion("0.11.1"), true);
  assert.equal(isExactReleaseVersion("v0.1"), true);
  assert.equal(isExactReleaseVersion("v1.0.0-beta.1"), true);

  assert.equal(isExactReleaseVersion("v0.11.1-1-ge2da573"), false);
  assert.equal(isExactReleaseVersion("v0.11.1-dirty"), false);
  assert.equal(isExactReleaseVersion("unknown"), false);
  assert.equal(isExactReleaseVersion("0.0.0"), false);
  assert.equal(isExactReleaseVersion(""), false);
  assert.equal(isExactReleaseVersion(undefined), false);
});
