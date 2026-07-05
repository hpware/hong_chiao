import { type NextRequest, NextResponse } from "next/server";
import { getBrowserCookies } from "@/components/univeralComponents";
import GetUserName from "@/components/px_items/user/name";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  try {
    let statusCode = 500;
    const rawUrl = process.env.API_URL;

    if (!rawUrl) {
      throw new Error(
        "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
      );
    }
    const apiUrl = rawUrl;
    const url = new URL(apiUrl);
    statusCode = 401;
    const browserCookies = await getBrowserCookies(request, statusCode, url);
    const startTime = Date.now();
    const getName = await GetUserName(browserCookies);
    return Response.json({
      success: getName.success,
      name: getName.name,
      error: null,
      duration: Date.now() - startTime,
    });
  } catch (e: any) {
    return Response.json({
      success: false,
      name: null,
      error: e.message,
      duration: 0,
    });
  }
};
