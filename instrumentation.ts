export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateRateLimitConfig } = await import("./lib/rate-limit");
    validateRateLimitConfig();
  }
}
