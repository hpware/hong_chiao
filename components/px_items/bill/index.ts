import { chromium, type Browser, type BrowserContext } from "playwright";
import {
  USER_AGENT,
  endpoint,
  type BrowserCookieType,
} from "@/components/univeralComponents";

export default async function GetBill(
  browserCookies: BrowserCookieType,
  year: string,
  semi: string,
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
    buildURLParams.append("SemiYear", year);
    buildURLParams.append("Semistry", semi);
    buildURLParams.append("KindType", "01");
    buildURLParams.append("Steps", "1");

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.post(
      endpoint(apiUrl, "/YMR_Stu/YMR/Bill_DownloadbyStu"),
      {
        data: buildURLParams.toString(),
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const apiResponse = await response.json();

    if (apiResponse.OnNoLogin) throw new Error("已伺服器被登出");
    if (!apiResponse.IsOK) throw new Error(apiResponse.Msg ?? "遠端伺服器錯誤");

    return {
      success: true,
      id: apiResponse.FileDownloadName.replace(".pdf", ""),
      name: apiResponse.OutFileName,
    };
  } finally {
    await context?.close();
    await browser?.close();
  }
}
