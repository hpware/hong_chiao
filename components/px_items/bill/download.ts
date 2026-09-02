import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint, getHiddenInputValue } from "@/components/univeralComponents";

export default async function GetBill(
  browserCookies: UpstreamCookies,
  pathTag: "Temp" | "TuitionBill",
  fileId: string,
  signal?: AbortSignal,
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }
  if (!URL.canParse(apiUrl)) {
    throw new Error("API_URL 不是有效的網址，請詢問伺服器管理員。");
  }
  const apiOrigin = new URL(apiUrl).origin;

  const client = createChromeFetch(browserCookies);
  const fetchRequestVerificationToken = await client.get(
    endpoint(apiUrl, "/YMR_Stu/YMR/StuPayCertifyDownLoad"),
  );
  if (!fetchRequestVerificationToken.ok) {
    throw new Error(
      `無法取得下載驗證資訊：${fetchRequestVerificationToken.status}`,
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
  const response = await client.stream(downloadUrl, {
    cache: "no-store",
    method: "POST",
    data: buildURLParams,
    signal,
    headers: {
      Accept: "application/pdf, application/octet-stream, */*",
      Origin: apiOrigin,
      Referer: endpoint(apiUrl, "/YMR_Stu/YMR/StuPayCertifyDownLoad"),
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });

  if (!response.ok) {
    await client.discard(response);
    throw new Error(`下載檔案失敗：上游回應 ${response.status}`);
  }
  if (!response.body) {
    throw new Error("下載檔案失敗：上游沒有回傳檔案串流");
  }

  return response;
}
