import { z } from "zod";
import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";

export default async function GetBillBalance(
  browserCookies: UpstreamCookies,
  year: string,
  semi: string,
) {
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
  buildURLParams.append("ReportType", "BillBalance");

  const client = createChromeFetch(browserCookies);

  const response = await client.post(
    endpoint(apiUrl, "/YMR_Stu/YMR/Bill_DownloadbyStu"),
    {
      data: buildURLParams.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );
  const apiResponse = z
    .object({
      OnNoLogin: z.boolean().optional(),
      IsOK: z.boolean(),
      Msg: z.string().nullish(),
      FileDownloadName: z.string().optional(),
      OutFileName: z.string().optional(),
    })
    .parse(await response.json());

  if (apiResponse.OnNoLogin) throw new Error("伺服器已登出");
  if (!apiResponse.IsOK) throw new Error(apiResponse.Msg ?? "遠端伺服器錯誤");

  if (!apiResponse.FileDownloadName) {
    throw new Error("校務系統回傳的補繳費單檔名無效");
  }

  return {
    success: true,
    id: apiResponse.FileDownloadName.replace(".pdf", ""),
    name: apiResponse.OutFileName ?? "補繳費單.pdf",
  };
}
