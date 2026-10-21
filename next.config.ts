import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";
import { resolveBuildCommitSha } from "./lib/build-commit.ts";
import { resolveBuildVersion } from "./lib/build-version.ts";
import packageJson from "./package.json";

function getGitCommitSha(): string {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function getGitVersion(): string {
  try {
    const exactTag = execFileSync(
      "git",
      ["describe", "--tags", "--exact-match"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();
    if (exactTag) return exactTag;
  } catch {
    // Not on an exact tag
  }

  return execFileSync("git", ["describe", "--tags", "--always"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

const commitSha = resolveBuildCommitSha(
  process.env.BUILD_COMMIT_SHA,
  getGitCommitSha,
);

const appVersion = resolveBuildVersion(
  process.env.BUILD_VERSION || process.env.APP_VERSION,
  getGitVersion,
  packageJson.version,
);

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    APP_VERSION: appVersion,
    APP_COMMIT_SHA: commitSha,
  },
};

export default nextConfig;
