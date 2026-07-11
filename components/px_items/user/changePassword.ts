import { chromium, type Browser, type BrowserContext } from "playwright";
import {
  USER_AGENT,
  endpoint,
  getHiddenInputValue,
  type BrowserCookieType,
} from "@/components/univeralComponents";

export default async function ChangePasswordRequest(
  browserCookies: BrowserCookieType,
  newPassword: string,
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
    buildURLParams.append("Password", newPassword);
    buildURLParams.append("ConfirmPassword", newPassword);
    buildURLParams.append("IsChgPsW", "False");

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.post(
      endpoint(apiUrl, "/B2KPortal/Account/ChangePassword"),
      {
        data: buildURLParams.toString(),
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const html = await response.text();
    const hdfText = getHiddenInputValue(html, "hdfMessage");
    return {
      success: hdfText === "OK",
      message: hdfText || `更換密碼失敗，遠端伺服器回應 ${response.status()}。`,
      remoteStatus: response.status(),
      statusText: response.statusText(),
      url: response.url(),
    };
  } finally {
    await context?.close();
    await browser?.close();
  }
}
