import { type NextRequest, NextResponse } from "next/server";
import { authCookieNames } from "@/components/univeralComponents";
import LogoutRemote from "@/components/px_items/user/logout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const logoutCookieNames = [...authCookieNames, "ssLoginForLDAP"] as const;

function redirectToLogin(request: NextRequest, isExpired = false) {
  const response = NextResponse.redirect(
    new URL(
      `/auth/login${isExpired ? "?expired=true" : ""}`,
      process.env.NEXT_PUBLIC_APP_URL || request.url,
    ),
  );

  for (const cookieName of logoutCookieNames) {
    response.cookies.delete(cookieName);
  }

  return response;
}

export const GET = async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const isExpired = params.get("expired") === "true";

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
