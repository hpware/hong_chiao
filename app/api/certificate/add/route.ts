import { chromium, type Browser, type BrowserContext } from "playwright";
import { type NextRequest, NextResponse } from "next/server";
import {
  USER_AGENT,
  endpoint,
  getBrowserCookies,
} from "@/components/univeralComponents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = async (request: NextRequest) => {
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
    //const params = request.nextUrl.searchParams;

    const buildURLParams = new URLSearchParams();
    buildURLParams.append("ppqmodel[objid]", "example");
    buildURLParams.append("ppqmodel[StuId]", "example");
    buildURLParams.append("ppqmodel[CerId]", "example");
    buildURLParams.append("ppqmodel[Type1]", "example");
    buildURLParams.append("ppqmodel[Type2]", "example");
    buildURLParams.append("ppqmodel[Score]", "example");
    buildURLParams.append("ppqmodel[Level]", "example");
    buildURLParams.append("ppqmodel[IssuDate]", "example");
    buildURLParams.append("ppqmodel[ShenCha]", "example"); // 成績???? 啊和 score 有什麼不同???

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.post(
      endpoint(apiUrl, "/YB2K/YEK_S/YEK/YEKStu_Save"),
      {
        data: buildURLParams.toString(),
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const responseText = await response.text();
    const data = JSON.parse(responseText);

    if (data.OK) {
      statusCode = 401;
      throw new Error("Session 過期了或無效。請重新登入。");
    }
    // tbd
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
  } finally {
    await context?.close();
    await browser?.close();
  }
};
