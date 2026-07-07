import { chromium, type Browser, type BrowserContext } from "playwright";
import {
  USER_AGENT,
  endpoint,
  type BrowserCookieType,
} from "@/components/univeralComponents";

export default async function GetDiscount(browserCookies: BrowserCookieType) {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      throw new Error(
        "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
      );
    }

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
    const basicHelpInfoData = JSON.parse(await basicHelpInfo.text());

    const response = await context.request.post(
      endpoint(apiUrl, "/YSJStu/YSJSTU/YSJStu_PageLoad"),
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const data = JSON.parse(await response.text());

    return {
      basicHelpInfoData,
      data,
    };
  } finally {
    await context?.close();
    await browser?.close();
  }
}
