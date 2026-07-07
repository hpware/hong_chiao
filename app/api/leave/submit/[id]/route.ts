//YSD21/YSD21/YSD21_SendLeave

import { type NextRequest, NextResponse } from "next/server";
import { getBrowserCookies } from "@/components/univeralComponents";
import SubmitLeave from "@/components/px_items/leave/submit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = async (
  request: NextRequest,
  websiteContext: { params: Promise<{ id: string }> },
) => {
  const { id } = await websiteContext.params;
  let statusCode = 500;

  try {
    const body = await request.json();
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

    const createResponse = await SubmitLeave(browserCookies, id);

    if (createResponse.IsOK !== true) {
      statusCode = 401;
      throw new Error(
        `${createResponse.Message || "Session 過期了或無效。請重新登入。"}`,
      );
    }
    return Response.json({
      createResponse,
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
