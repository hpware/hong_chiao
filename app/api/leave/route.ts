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
    const browserCookies = await getBrowserCookies(request, statusCode, url);
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

    const page = await context.newPage();

    await page.goto(endpoint(apiUrl, "/"), {
      waitUntil: "domcontentloaded",
    });
    console.log(await page.title());
    const data = await page.evaluate(
      async ({ getListNum, bupString }) => {
        const req = await fetch(getListNum, {
          method: "POST",
          credentials: "include",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body: bupString,
        });
        return await req.text();
        //const res = await req.json();
        //if (res.OnNoLogin) {
        //  return {
        //    failedLogin: true,
        //    res: res,
        //  };
        //}
        //return {
        //  failedLogin: false,
        //  status: req.status,
        //  ok: res.IsOK,
        //  data: res.LeaveS,
        //  res: res,
        //};
      },
      {
        getListNum: endpoint(apiUrl, "/YB2K/YSD21/YSD21/YSD21_GetLeaveS"),
        bupString: buildURLParams.toString(),
      },
    );

    //if (data.failedLogin) {
    //  statusCode = 401;
    //  throw new Error("Session expired or invalid. Please log in again.");
    //}
    return new Response(data);
    //return Response.json({
    //  data: data,
    //});
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
