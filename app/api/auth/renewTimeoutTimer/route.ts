import { type NextRequest, NextResponse } from "next/server";
import { getBrowserCookies } from "@/components/univeralComponents";
import RenewTimeoutTimer from "@/components/px_items/user/renewTimeoutTimer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  let statusCode = 500;
  const params = request.nextUrl.searchParams;
  const kick = params.get("kick");

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
    statusCode = 401;
    const browserCookies = await getBrowserCookies(request, statusCode, url);
    statusCode = 500;

    const responseText = await RenewTimeoutTimer(browserCookies);
    if (responseText !== "OK") {
      if (kick === "direct") {
        statusCode = 307;
        return Response.redirect(
          new URL("/api/auth/logout", process.env.NEXT_PUBLIC_APP_URL),
        );
      }
      statusCode = 401;
      throw new Error("Session 過期了或無效。請重新登入。");
    }
    return Response.json({
      success: responseText === "OK",
    });
  } catch (e: any) {
    console.error(e);
    return Response.json(
      {
        error: e.message,
      },
      {
        status: statusCode,
      },
    );
  }
};
