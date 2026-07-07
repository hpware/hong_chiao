import { type NextRequest, NextResponse } from "next/server";
import { getBrowserCookies } from "@/components/univeralComponents";
import GetLeaveBasicInfo from "@/components/px_items/leave/getBasicInfo";

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
    //get vars
    const params = request.nextUrl.searchParams;
    const year = params.get("year");
    const semistry = params.get("semi");
    if (!year || !semistry) {
      statusCode = 400;
      throw new Error("需要 year, semi 的變數。");
    }

    const apiResponse = await GetLeaveBasicInfo(
      browserCookies,
      year,
      semistry,
    );

    if (!apiResponse.IsOK) {
      statusCode = 401;
      throw new Error("Session 過期了或無效。請重新登入。");
    }
    return Response.json({
      success: apiResponse.IsOK,
      typesOfLeave: apiResponse.LeaveStdS.map(
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
        }) => ({
          id: data.ALCode,
          name: data.ALTitle,
          warnindDay: data.WarningDay, // 這到底要幹嘛的
        }),
      ),
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
