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
    const start = params.get("start");
    const end = params.get("end");
    const year = params.get("year");
    const semistry = params.get("semi");
    if (!start || !end || !year || !semistry) {
      statusCode = 400;
      throw new Error("需要 start, end, year, semi 的變數。");
    }
    const parsedStartDate = new Date(start).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parsedEndDate = new Date(end).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    if (parsedStartDate === undefined || !parsedEndDate === undefined) {
      statusCode = 400;
      throw new Error("Date parsing error, please try again.");
    }
    const buildURLParams = new URLSearchParams();
    buildURLParams.append("DateStart", parsedStartDate);
    buildURLParams.append("DateStop", parsedEndDate);
    buildURLParams.append("SemiYear", year);
    buildURLParams.append("Semistry", semistry);

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.post(
      endpoint(apiUrl, "/YSD21/YSD21/YSD21_GetDatePaiKeS"),
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
    return Response.json(apiResponse);
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
