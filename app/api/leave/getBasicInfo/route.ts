import { chromium, type Browser, type BrowserContext } from "playwright";
import { type NextRequest, NextResponse } from "next/server";
import {
  USER_AGENT,
  endpoint,
  getBrowserCookies,
} from "@/components/univeralComponents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
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
    const buildURLParams = new URLSearchParams();
    buildURLParams.append("SemiYear", year);
    buildURLParams.append("Semistry", semistry);
    buildURLParams.append("ObjId", "0");

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.post(
      endpoint(apiUrl, "/YSD21/YSD21/YSD21Detail_PageLoad"),
      {
        data: buildURLParams.toString(),
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const responseText = await response.text();
    const apiResponse = JSON.parse(responseText);

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
  } finally {
    await context?.close();
    await browser?.close();
  }
};
