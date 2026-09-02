import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint, getHiddenInputValue } from "@/components/univeralComponents";

export default async function ChangePasswordRequest(
  browserCookies: UpstreamCookies,
  newPassword: string,
) {
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

  const client = createChromeFetch(browserCookies);

  const response = await client.post(
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
    message: hdfText || `更換密碼失敗，遠端伺服器回應 ${response.status}。`,
    remoteStatus: response.status,
    statusText: response.statusText,
    url: response.url,
  };
}
