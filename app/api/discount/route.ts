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

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    const buildURLParams = new URLSearchParams();
    buildURLParams.append("Qmodel", "");
    await context.addCookies(browserCookies);

    const basicHelpInfo = await context.request.post(
      endpoint(apiUrl, "/YSJStu/YSJSTU/YSJSTU_QryNotify"),
      {
        data: buildURLParams.toString(),
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const basicHelpInfoText = await basicHelpInfo.text();
    const basicHelpInfoData = JSON.parse(basicHelpInfoText);

    const response = await context.request.post(
      endpoint(apiUrl, "/YSJStu/YSJSTU/YSJStu_PageLoad"),
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const responseText = await response.text();
    const data = JSON.parse(responseText);

    if (!(basicHelpInfoData.IsOK && data.IsOK)) {
      statusCode = 401;
      throw new Error(data.MSG || "Session 過期了或無效。請重新登入。");
    }

    return Response.json({
      success: data.OK,
      errMsg: data.MSG,
      data: {
        note: basicHelpInfoData.Help,
      },
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
