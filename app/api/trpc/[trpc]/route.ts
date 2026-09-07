import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";
import { checkApiRateLimit, tooManyRequests } from "@/lib/rate-limit";

const handler = (req: Request) => {
  const rateLimit = checkApiRateLimit(req);
  if (!rateLimit.allowed) return tooManyRequests(rateLimit);

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  });
};
export { handler as GET, handler as POST };
