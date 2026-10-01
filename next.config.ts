import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";
import { resolveBuildCommitSha } from "./lib/build-commit.ts";
import packageJson from "./package.json";

const commitSha = resolveBuildCommitSha(process.env.BUILD_COMMIT_SHA, () =>
  execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    APP_VERSION: packageJson.version,
    APP_COMMIT_SHA: commitSha,
  },
};

export default nextConfig;
