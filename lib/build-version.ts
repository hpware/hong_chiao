export function resolveBuildVersion(
  injectedVersion: string | undefined,
  readGitVersion: () => string,
  fallbackVersion: string = "0.0.0",
): string {
  if (injectedVersion?.trim()) return injectedVersion.trim();

  try {
    const gitVersion = readGitVersion().trim();
    if (gitVersion) return gitVersion;
  } catch {
    // Git is unavailable or command failed
  }

  const fallback = fallbackVersion.trim();
  return fallback || "0.0.0";
}

export function isExactReleaseVersion(version: string | undefined): boolean {
  if (!version || version === "unknown" || version === "0.0.0") return false;
  const trimmed = version.trim();
  // Git describe strings with -N-g<hash> or dirty markers are not exact release tags
  if (/-[0-9]+-g[0-9a-f]+/i.test(trimmed) || trimmed.includes("-dirty")) {
    return false;
  }
  // Matches v1.2.3, 1.2.3, v0.11.1, etc.
  return /^v?\d+(\.\d+)*(-[a-zA-Z0-9.]+)?$/.test(trimmed);
}
