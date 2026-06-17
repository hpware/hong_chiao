import { chromium, type Browser, type BrowserContext } from "playwright";
import { type NextRequest, NextResponse } from "next/server";
import {
  USER_AGENT,
  endpoint,
  getBrowserCookies,
} from "@/components/univeralComponents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (
  request: NextRequest,
  websiteContext: { params: Promise<{ slug: string }> },
) => {
  const { slug } = await websiteContext.params;
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
    const requestKey = params.get("key");
    if (!requestKey) {
      statusCode = 400;
      throw new Error("需要 file, key 的變數。");
    }

    const buildFormData = new FormData();
    buildFormData.append("__RequestVerificationToken", requestKey);
    buildFormData.append("ShowFileName", slug);
    buildFormData.append("FileId", slug);
    buildFormData.append("PathTag", "SDLeave");

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.post(
      endpoint(apiUrl, "/YSD21/YSD21/DownLoad"),
      {
        data: buildFormData.toString(),
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const responseBlob = await response.body();
    const contentDisposition = response.headers()["content-disposition"] || "";
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch ? filenameMatch[1] : "downloaded_file";

    return new Response(new Uint8Array(responseBlob), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
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
