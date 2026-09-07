import { type NextRequest, NextResponse } from "next/server";
import { authCookieNames } from "@/lib/auth-cookies";
import LogoutRemote from "@/components/px_items/user/logout";
import { checkApiRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { purgeDeviceResponseCache } from "@/lib/encrypted-response-cache";
import { DEVICE_CACHE_COOKIE } from "@/lib/device-cache-protocol";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const logoutCookieNames = [
  ...authCookieNames,
  "ssLoginForLDAP",
  DEVICE_CACHE_COOKIE,
] as const;

function redirectToLogin(request: NextRequest, isExpired = false) {
  const loginUrl = new URL(
    "/auth/login",
    process.env.NEXT_PUBLIC_APP_URL || request.url,
  );
  loginUrl.searchParams.set("loggedOut", "true");
  if (isExpired) loginUrl.searchParams.set("expired", "true");
  if (request.nextUrl.searchParams.get("prefill") === "true") {
    loginUrl.searchParams.set("prefill", "true");
  }
  const response = NextResponse.redirect(
    loginUrl,
  );

  for (const cookieName of logoutCookieNames) {
    response.cookies.delete(cookieName);
  }
  response.headers.set("Cache-Control", "private, no-store");

  return response;
}

export const GET = async (request: NextRequest) => {
  const rateLimit = await checkApiRateLimit(request);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const params = request.nextUrl.searchParams;
  const isExpired = params.get("expired") === "true";
  await purgeDeviceResponseCache(request);

  try {
    const rawUrl = process.env.API_URL;
    if (!rawUrl) {
      throw new Error(
        "Cannot log out of the upstream service: API_URL is missing",
      );
    }
    const apiUrl = rawUrl;
    const url = new URL(apiUrl);
    const browserCookies = authCookieNames.flatMap((cookieName) => {
      const value = request.cookies.get(cookieName)?.value;

      if (value === undefined) {
        return [];
      }

      return [
        {
          name: cookieName,
          value,
          domain: url.hostname,
          path: "/",
          secure: url.protocol === "https:",
          sameSite: "Lax" as const,
        },
      ];
    });

    if (browserCookies.length > 0) await LogoutRemote(browserCookies);
    return redirectToLogin(request, isExpired);
  } catch (error: unknown) {
    console.error(error);
    return redirectToLogin(request, isExpired);
  }
};
