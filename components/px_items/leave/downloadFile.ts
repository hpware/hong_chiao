import { chromium, type Browser, type BrowserContext } from "playwright";
import {
  USER_AGENT,
  endpoint,
  type BrowserCookieType,
} from "@/components/univeralComponents";

export default async function DownloadLeaveFile(
  browserCookies: BrowserCookieType,
  slug: string,
  requestKey: string,
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
    const contentDisposition = response.headers()["content-disposition"] || "";
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);

    return {
      body: await response.body(),
      filename: filenameMatch ? filenameMatch[1] : "downloaded_file",
    };
  } finally {
    await context?.close();
    await browser?.close();
  }
}
