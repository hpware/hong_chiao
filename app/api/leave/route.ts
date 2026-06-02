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
    const semiYear = params.get("year");
    const semistry = params.get("sem");
    if (!(semiYear && semistry)) {
      statusCode = 400;
      throw new Error("阿你忘了填 ?year 或(和) ?sem");
    }
    if (Number(semiYear) < 1) {
      statusCode = 400;
      throw new Error(`有民國${semiYear}嗎`);
    }
    if (!(semistry !== "0" && semistry !== "1")) {
      statusCode = 400;
      throw new Error(`?sem 只支援 0 或 1`);
    }
    const buildURLParams = new URLSearchParams();
    buildURLParams.append("SemiYear", semiYear);
    buildURLParams.append("Semistry", semistry);
    buildURLParams.append("ApplyDateS", "");
    buildURLParams.append("ApplyDateE", "");
    buildURLParams.append("ClassDateS", "");
    buildURLParams.append("ClassDateE", "");

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.post(
      endpoint(apiUrl, "/YB2K/YSD21/YSD21/YSD21_GetLeaveS"),
      {
        data: buildURLParams.toString(),
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const responseText = await response.text();
    const leaveResponse = JSON.parse(responseText);

    const data = leaveResponse.OnNoLogin
      ? {
          failedLogin: true,
          res: leaveResponse,
        }
      : {
          failedLogin: false,
          status: response.status(),
          // passed results
          ok: leaveResponse.IsOK,
          data: leaveResponse.LeaveS,
        };

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
  } finally {
    await context?.close();
    await browser?.close();
  }
};

// 創立
export const POST = async (request: NextRequest) => {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
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
    if (!body.id) {
      statusCode = 400;
      throw new Error("`id` 是必須包含的欄位");
    }
    if (typeof body.id !== "number") {
      statusCode = 400;
      throw new Error("`id` 一定要是數字");
    }
    statusCode = 500;
    const buildURLParams = new URLSearchParams();
    buildURLParams.append("Objid", body.id);

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.post(
      endpoint(apiUrl, "/YB2K/YSD21/YSD21/YSD21Detail_SaveLeave"),
      {
        data: buildURLParams.toString(),
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const responseText = await response.text();
    const createResponse = JSON.parse(responseText);

    if (createResponse.IsOK !== true) {
      statusCode = 401;
      throw new Error("Session 過期了或無效。請重新登入。");
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
  } finally {
    await context?.close();
    await browser?.close();
  }
};

export const DELETE = async (request: NextRequest) => {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
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
    if (!body.id) {
      statusCode = 400;
      throw new Error("`id` 是必須包含的欄位");
    }
    if (typeof body.id !== "number") {
      statusCode = 400;
      throw new Error("`id` 一定要是數字");
    }
    statusCode = 500;
    const buildURLParams = new URLSearchParams();
    buildURLParams.append("Objid", body.id);

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.post(
      endpoint(apiUrl, "/YB2K/YSD21/YSD21/YSD21_DelLeaveApply"),
      {
        data: buildURLParams.toString(),
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const responseText = await response.text();
    const deleteResponse = JSON.parse(responseText);

    if (deleteResponse.IsOK !== true) {
      statusCode = 401;
      throw new Error("Session 過期了或無效。請重新登入。");
    }
    return Response.json({
      success: deleteResponse.IsOK,
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
