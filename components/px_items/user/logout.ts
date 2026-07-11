import { chromium, type Browser, type BrowserContext } from "playwright";
import {
  USER_AGENT,
  endpoint,
  type BrowserCookieType,
} from "@/components/univeralComponents";

export default async function LogoutRemote(browserCookies: BrowserCookieType) {
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
    await context.addCookies(browserCookies);

    await context.request.post(
      endpoint(apiUrl, "/B2KPortal/B2KPortal/ReUrlContent"),
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );

    const logoutResult = await context.request.post(
      endpoint(apiUrl, "/B2KPortal/B2KPortal/Logout"),
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );

    if (!logoutResult.ok()) {
      throw new Error(`登出失敗，原因： ${logoutResult.status()}`);
    }
  } finally {
    await context?.close();
    await browser?.close();
  }
}
