import { chromium, type Browser, type BrowserContext } from "playwright";
import { type NextRequest, NextResponse } from "next/server";
import {
  BrowserCookieType,
  USER_AGENT,
  endpoint,
  getBrowserCookies,
} from "@/components/univeralComponents";

export default async function GetUserName(browserCookies: BrowserCookieType) {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let statusCode = 500;

  try {
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      throw new Error(
        "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
      );
    }
    statusCode = 500;
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.get(
      endpoint(apiUrl, "/YStuQuery/YStuQuery/YSDStuMain"),
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const responseText = await response.text();
    const getStudentName = (
      responseText.match(
        new RegExp(`<label>學生姓名：</label>\\s*<label>([^<]+)</label>`),
      )?.[0] || ""
    )
      .trim()
      .replace(/<label>學生姓名：<\/label>\s*<label>([^<]+)<\/label>/, "$1");
    return {
      success: true,
      error: null,
      name: getStudentName,
    };
  } catch (e: any) {
    console.error(e);
    return {
      success: false,
      error: e.message,
      name: null,
    };
  } finally {
    await context?.close();
    await browser?.close();
  }
}
