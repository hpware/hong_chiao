import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { cookies } from "next/headers";
import {
  checkRateLimit,
  rateLimitIdentifier,
  type RateLimitScope,
} from "@/lib/rate-limit";

/**
 * This context creator accepts `headers` so it can be reused in both
 * the RSC server caller (where you pass `next/headers`) and the
 * API route handler (where you pass the request headers).
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    headers: opts.headers,
    sessionId: (await cookies()).get("ASP.NET_SessionId")?.value,
  };
};
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
  });

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
function limitedProcedure(scope: RateLimitScope) {
  return t.procedure.use(async ({ ctx, next }) => {
    const result = await checkRateLimit(
      rateLimitIdentifier(ctx.headers, ctx.sessionId, scope),
    );
    if (!result.success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "請求過於頻繁，請稍後再試。",
      });
    }
    return next();
  });
}

export const baseProcedure = limitedProcedure("session");
export const ipLimitedProcedure = limitedProcedure("ip");
