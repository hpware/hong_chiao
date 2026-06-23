#!/usr/bin/env tsx
/**
 * Release script
 * Usage: npx tsx scripts/release.ts [patch|minor|major]
 * Defaults to "patch" if no argument is given.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const ALLOWED: readonly string[] = ["patch", "minor", "major"];
const bump = ALLOWED.includes(process.argv[2] ?? "")
  ? (process.argv[2] as "patch" | "minor" | "major")
  : "patch";

const pkgPath = resolve(__dirname, "../package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };

const [majorStr, minorStr, patchStr] = pkg.version.split(".");
const major = Number(majorStr);
const minor = Number(minorStr);
const patch = Number(patchStr);

let nextVersion: string;
if (bump === "major") {
  nextVersion = `${major + 1}.0.0`;
} else if (bump === "minor") {
  nextVersion = `${major}.${minor + 1}.0`;
} else {
  nextVersion = `${major}.${minor}.${patch + 1}`;
}

pkg.version = nextVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

execSync("git add package.json");
execSync(`git commit -m "chore(release): v${nextVersion}"`);
execSync(`git tag v${nextVersion}`);

console.log(`Released v${nextVersion}`);
console.log("Push with: git push origin main --tags");
