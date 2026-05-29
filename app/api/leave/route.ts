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
        { error: "Missing API_URL environment variable" },
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
      throw new Error("Session expired or invalid. Please log in again.");
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
