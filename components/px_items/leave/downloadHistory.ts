import { chromium, type Browser, type BrowserContext } from "playwright";
import {
  USER_AGENT,
  endpoint,
  type BrowserCookieType,
} from "@/components/univeralComponents";

export default async function GetLeaveDownloadHistory(
  browserCookies: BrowserCookieType,
) {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      throw new Error(
        "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
      );
    }

    const buildURLParams = new URLSearchParams();
    buildURLParams.append("example", "example");

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.post(endpoint(apiUrl, "/"), {
      data: buildURLParams.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    });
    const apiResponse = JSON.parse(await response.text());

    if (apiResponse.OnNoLogin) {
      return {
        failedLogin: true,
        res: apiResponse,
      };
    }

    return {
      failedLogin: false,
      status: response.status(),
      success: apiResponse.IsOK,
      data: apiResponse.LeaveS,
    };
  } finally {
    await context?.close();
    await browser?.close();
  }
}
