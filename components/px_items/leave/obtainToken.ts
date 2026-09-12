import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint, getHiddenInputValue } from "@/components/univeralComponents";

export default async function ObtainLeaveToken(
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

  const response = await client.post(
    endpoint(apiUrl, "/YSD21/YSD21/YSD21Detail"),
    {
      data: buildURLParams.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );

  return getHiddenInputValue(
    await response.text(),
    "__RequestVerificationToken",
  );
}
