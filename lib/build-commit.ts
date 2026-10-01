export function resolveBuildCommitSha(
  injectedSha: string | undefined,
  readGitSha: () => string,
): string {
  if (injectedSha?.trim()) return injectedSha.trim();

  try {
    return readGitSha().trim() || "unknown";
  } catch {
    return "unknown";
  }
}
