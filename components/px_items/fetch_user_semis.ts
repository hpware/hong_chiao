import { chromium, type Browser, type BrowserContext } from "playwright";
import {
  USER_AGENT,
  endpoint,
  type BrowserCookieType,
} from "@/components/univeralComponents";

export default async function FetchUserSemisters(
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

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.get(
      endpoint(apiUrl, "/YMR_Stu/YMR/StuPayCertifyDownLoad"),
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const html = await response.text();
    const parseAllUserSemis = [
      ...html.matchAll(/SemiYear="(\d+)"\s+Semi="(\d+)"/g),
    ].map((match) => {
      return {
        year: match[1],
        semi: match[2],
      };
    });
    return parseAllUserSemis;
  } finally {
    await context?.close();
    await browser?.close();
  }
}
