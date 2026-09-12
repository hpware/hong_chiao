import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";
import { m } from "motion/react";

function getDetailDataViaSpanColTitle(html: string, item: string) {
  const escapedItem = item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<span\\s+class=["']colTitle["']>\\s*` +
      `${escapedItem}\\s*[：:]\\s*` +
      `</span>\\s*` +
      `<span>\\s*([^<]*?)\\s*</span>`,
    "i",
  );

  return pattern.exec(html)?.[1]?.trim() ?? "";
}

export default async function GetTuition(
  browserCookies: UpstreamCookies,
  year: string,
  semistry: string,
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const buildURLParams = new URLSearchParams();
  buildURLParams.append("ppqmodel[SemiYear]", year);
  buildURLParams.append("ppqmodel[Semistry]", semistry);

  const client = createChromeFetch(browserCookies);

  const response = await client.post(
    endpoint(apiUrl, "/YMR_Stu/YMR/StuQryTuitionDtl"),
    {
      data: buildURLParams.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );
  const responseText = await response.text();
  if (responseText.includes("查無學雜費資訊!")) {
    return { success: false, data: null, message: "查無學雜費資訊!" };
  }
  const parseData = {
    name: getDetailDataViaSpanColTitle(responseText, "姓名"),
    class: getDetailDataViaSpanColTitle(responseText, "班級"),
    details: {
      total: getDetailDataViaSpanColTitle(responseText, "總額"),
      discounts: getDetailDataViaSpanColTitle(responseText, "減項"),
      due: getDetailDataViaSpanColTitle(responseText, "應收"),
      paid: getDetailDataViaSpanColTitle(responseText, "已收"),
      refund: getDetailDataViaSpanColTitle(responseText, "應補/退"),
    },
  };
  return { success: true, data: parseData, message: null };
}
