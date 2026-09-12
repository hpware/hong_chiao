import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";
import { checkApiRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const handler = async (req: Request) => {
  const rateLimit = await checkApiRateLimit(req);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
};
export { handler as GET, handler as POST };
