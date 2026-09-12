import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";

export default async function GetLeaveDownloadHistory(
  browserCookies: UpstreamCookies,
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const buildURLParams = new URLSearchParams();
  buildURLParams.append("example", "example");

  const client = createChromeFetch(browserCookies);

  const response = await client.post(endpoint(apiUrl, "/"), {
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
    status: response.status,
    success: apiResponse.IsOK,
    data: apiResponse.LeaveS,
  };
}
