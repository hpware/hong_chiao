import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";

export default async function GetCreditApplications(
  browserCookies: UpstreamCookies,
  objectId: string = "all",
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const buildURLParams = new URLSearchParams();
  buildURLParams.append("ppqmodel[IsStu]", "1");
  if (objectId !== "all") buildURLParams.append("ppqmodel[objid]", objectId);

  const client = createChromeFetch(browserCookies);

  const response = await client.post(
    endpoint(apiUrl, "/YSKStu/YSKStu/YSK11_Qry"),
    {
      data: buildURLParams.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );
  return JSON.parse(await response.text());
}
