import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";

export default async function GetDiscount(browserCookies: UpstreamCookies) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const buildURLParams = new URLSearchParams();
  buildURLParams.append("Qmodel", "");
  const client = createChromeFetch(browserCookies);

  const basicHelpInfo = await client.post(
    endpoint(apiUrl, "/YSJStu/YSJSTU/YSJSTU_QryNotify"),
    {
      data: buildURLParams.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );
  const basicHelpInfoData = JSON.parse(await basicHelpInfo.text());

  const response = await client.post(
    endpoint(apiUrl, "/YSJStu/YSJSTU/YSJStu_PageLoad"),
    {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );
  const data = JSON.parse(await response.text());

  return {
    basicHelpInfoData,
    data,
  };
}
