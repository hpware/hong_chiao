import { type NextRequest, NextResponse } from "next/server";
import { getBrowserCookies } from "@/components/univeralComponents";
import { CreateLeave, GetLeaves } from "@/components/px_items/leave";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (
  request: NextRequest,
  websiteContext: { params: Promise<{ id: string }> },
) => {
  const { id } = await websiteContext.params;
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
    //get vars
    const params = request.nextUrl.searchParams;
    const semiYear = params.get("year");
    const semistry = params.get("semi");
    if (!(semiYear && semistry)) {
      statusCode = 400;
      throw new Error("阿你忘了填 ?year 或(和) ?semi");
    }
    if (Number(semiYear) < 1) {
      statusCode = 400;
      throw new Error(`有民國${semiYear}嗎`);
    }
    if (semistry !== "1" && semistry !== "2") {
      statusCode = 400;
      throw new Error(`?semi 只支援 1 或 2`);
    }
    const data = await GetLeaves(browserCookies, semiYear, semistry);

    if (data.failedLogin) {
      statusCode = 401;
      throw new Error("Session 過期了或無效。請重新登入。");
    }
    return Response.json(data);
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

// 編輯傳送
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
    const semiYear = body.year;
    const semistry = body.sem;
    if (!(semiYear && semistry)) {
      statusCode = 400;
      throw new Error("阿你忘了填 year 或(和) sem");
    }
    if (Number(semiYear) < 1) {
      statusCode = 400;
      throw new Error(`有民國${semiYear}嗎`);
    }
    if (semistry !== "1" && semistry !== "2") {
      statusCode = 400;
      throw new Error(`sem 只支援 1 或 2`);
    }

    statusCode = 500;
    const { pageLoad: apiResponseLoadCheckLeaveCode, createResponse } =
      await CreateLeave(browserCookies, body);
    if (!apiResponseLoadCheckLeaveCode.IsOK) {
      statusCode = 400;
      throw new Error("無法載入請假資料");
    }
    const list = apiResponseLoadCheckLeaveCode.LeaveStdS.map(
      (data: {
        Objid: number;
        ALCode: string;
        ALTitle: string;
        SemiYear: number;
        Semistry: number;
        KoKau: string | null;
        WarningDay: string;
        IsWebApply: boolean | null;
        IsQuanQin: boolean | null;
      }) => data.ALCode,
    );
    if (!list || !Array.isArray(list) || list.length === 0) {
      statusCode = 400;
      throw new Error("沒有找到符合條件的請假記錄");
    }
    if (!list.includes(body.typeOfLeave)) {
      statusCode = 400;
      throw new Error("你選的假別不存在");
    }
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
