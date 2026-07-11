import { type NextRequest, NextResponse } from "next/server";
import { authCookieNames } from "@/components/univeralComponents";
import LogoutRemote from "@/components/px_items/user/logout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToLogin(request: NextRequest, isExpired = false) {
  const response = NextResponse.redirect(
    new URL(
      `/auth/login${isExpired ? "?expired=true" : ""}`,
      process.env.NEXT_PUBLIC_APP_URL,
    ),
  );

  for (const cookieName of [
    "ASP.NET_SessionId",
    "ssClientIP",
    "ssAID",
    "ssSchID",
    "ssSchName",
    "ssLoginID",
    "ssLoginForLDAP",
    "ssLoginName",
  ]) {
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
      return NextResponse.json(
        {
          error:
            "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
        },
        { status: 500 },
      );
    }
    const apiUrl = rawUrl;
    const url = new URL(apiUrl);
    const browserCookies = authCookieNames.map((cookieName) => {
      const value = request.cookies.get(cookieName)?.value;

      if (value === undefined) {
        throw new Error(`No session found: missing ${cookieName}`);
      }

      return {
        name: cookieName,
        value,
        domain: url.hostname,
        path: "/",
        secure: url.protocol === "https:",
        sameSite: "Lax" as const,
      };
    });

    await LogoutRemote(browserCookies);
    return redirectToLogin(request, isExpired);
  } catch (error: unknown) {
    console.error(error);
    return redirectToLogin(request, isExpired);
  }
};
