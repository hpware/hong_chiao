import { type NextRequest, NextResponse } from "next/server";
import { getRequestCookies } from "@/components/univeralComponents";
import GetCaptchaImage from "@/components/px_items/user/captcha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
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

    const existingSessionCookie = getRequestCookies(request, new URL(rawUrl), [
      "ASP.NET_SessionId",
    ]);

    const startTime = Date.now();
    const getCaptchaImage = await GetCaptchaImage(existingSessionCookie);
    const nextResponse = NextResponse.json(
      {
        success: getCaptchaImage.success,
        image: getCaptchaImage.image,
        duration: (Date.now() - startTime) / 1000,
      },
      { status: 200 },
    );

    for (const cookie of getCaptchaImage.setCookies) {
      nextResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: request.nextUrl.protocol === "https:",
        sameSite:
          cookie.sameSite === "None"
            ? "none"
            : cookie.sameSite === "Strict"
              ? "strict"
              : "lax",
        path: "/",
        expires:
          cookie.expires && cookie.expires > 0
            ? new Date(cookie.expires * 1000)
            : undefined,
      });
    }

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get captcha image" },
      { status: 500 },
    );
  }
};
