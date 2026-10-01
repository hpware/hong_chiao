import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";
import packageJson from "./package.json";

function getCommitSha(): string {
  if (process.env.BUILD_COMMIT_SHA) return process.env.BUILD_COMMIT_SHA;

  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    APP_VERSION: packageJson.version,
    APP_COMMIT_SHA: getCommitSha(),
  },
};

export default nextConfig;
