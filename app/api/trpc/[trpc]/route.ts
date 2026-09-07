import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";
import { checkApiRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  encryptAndCacheResponse,
  purgeDeviceResponseCache,
  readEncryptedResponseCache,
} from "@/lib/encrypted-response-cache";
import { rotatesDeviceCacheKey } from "@/lib/device-cache-protocol";

const handler = async (req: Request) => {
  const rateLimit = await checkApiRateLimit(req);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const cachedResponse = await readEncryptedResponseCache(req);
  if (cachedResponse) return cachedResponse;

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  });
  response.headers.set("Cache-Control", "private, no-store");
  if (rotatesDeviceCacheKey(req.method, req.url)) {
    await purgeDeviceResponseCache(req);
  }
  return encryptAndCacheResponse(req, response);
};
export { handler as GET, handler as POST };
