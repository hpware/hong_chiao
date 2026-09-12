import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";

export default async function AddCertificate(browserCookies: UpstreamCookies) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const buildURLParams = new URLSearchParams();
  buildURLParams.append("ppqmodel[objid]", "example");
  buildURLParams.append("ppqmodel[StuId]", "example");
  buildURLParams.append("ppqmodel[CerId]", "example");
  buildURLParams.append("ppqmodel[Type1]", "example");
  buildURLParams.append("ppqmodel[Type2]", "example");
  buildURLParams.append("ppqmodel[Score]", "example");
  buildURLParams.append("ppqmodel[Level]", "example");
  buildURLParams.append("ppqmodel[IssuDate]", "example");
  buildURLParams.append("ppqmodel[ShenCha]", "example");

  const client = createChromeFetch(browserCookies);

  const response = await client.post(
    endpoint(apiUrl, "/YEK_S/YEK/YEKStu_Save"),
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
