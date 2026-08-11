import { chromium, type Browser, type BrowserContext } from "playwright";
import {
  USER_AGENT,
  endpoint,
  type BrowserCookieType,
  getHiddenInputValue,
} from "@/components/univeralComponents";

export default async function GetBill(
  browserCookies: BrowserCookieType,
  pathTag: "Temp" | "TuitionBill",
  fileId: string,
  signal?: AbortSignal,
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
    const fetchRequestVerificationToken = await context.request.get(
      endpoint(apiUrl, "/YMR_Stu/YMR/StuPayCertifyDownLoad"),
    );
    if (!fetchRequestVerificationToken.ok()) {
      throw new Error(
        `無法取得下載驗證資訊：${fetchRequestVerificationToken.status()}`,
      );
    }

    const getRequestVerificationToken = getHiddenInputValue(
      await fetchRequestVerificationToken.text(),
      "__RequestVerificationToken",
    );
    if (!getRequestVerificationToken) {
      throw new Error("下載頁面缺少驗證資訊");
    }

    const buildURLParams = new URLSearchParams();
    buildURLParams.append("PathTag", pathTag);
    buildURLParams.append("FileId", fileId);
    buildURLParams.append("ShowFileName", fileId);
    buildURLParams.append(
      "__RequestVerificationToken",
      getRequestVerificationToken,
    );

    const downloadUrl = endpoint(apiUrl, "/YMR_Stu/YMR/DownLoad");
    const authenticatedCookies = await context.cookies(downloadUrl);
    const response = await fetch(downloadUrl, {
      method: "POST",
      body: buildURLParams,
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/pdf, application/octet-stream, */*",
        Cookie: authenticatedCookies
          .map(({ name, value }) => `${name}=${value}`)
          .join("; "),
        Origin: new URL(apiUrl).origin,
        Referer: endpoint(apiUrl, "/YMR_Stu/YMR/StuPayCertifyDownLoad"),
        "User-Agent": USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    });

    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`下載檔案失敗：上游回應 ${response.status}`);
    }
    if (!response.body) {
      throw new Error("下載檔案失敗：上游沒有回傳檔案串流");
    }

    return response;
  } finally {
    await context?.close();
    await browser?.close();
  }
}
