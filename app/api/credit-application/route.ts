import { type NextRequest, NextResponse } from "next/server";
import { getBrowserCookies } from "@/components/univeralComponents";
import GetCreditApplications from "@/components/px_items/credit-application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  let statusCode = 500;

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

    const data = await GetCreditApplications(browserCookies);

    if (!data.OK) {
      statusCode = 401;
      throw new Error(data.MSG || "Session 過期了或無效。請重新登入。");
    }
    const rows = Array.isArray(data.obj)
      ? data.obj
      : Array.isArray(data.obj?.DataList)
        ? data.obj.DataList
        : [];

    return Response.json({
      success: data.OK,
      errMsg: data.MSG,
      data: rows,
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
