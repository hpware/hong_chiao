import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";

export default async function GetCreditApplicationData(
  browserCookies: UpstreamCookies,
  id: string,
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const client = createChromeFetch(browserCookies);

  const detailParams = new URLSearchParams();
  detailParams.append("ppqmodel[RMID]", id);
  detailParams.append("ppqmodel[RMDtlID]", "");
  const detailResponse = await client.post(
    endpoint(apiUrl, "/YSKStu/YSKStu/YSK111SDetail"),
    {
      data: detailParams.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );
  await client.discard(detailResponse);

  const queryParams = new URLSearchParams();
  queryParams.append("ppqmodel[objid]", "1");
  queryParams.append("ppqmodel[IsDtl]", "1");
  const response = await client.post(
    endpoint(apiUrl, "/YSKStu/YSKStu/YSK11_Qry"),
    {
      data: queryParams.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );
  const result = JSON.parse(await response.text());
  const data = Array.isArray(result.obj) ? result.obj[0] : result.obj;

  return {
    success: result.OK,
    errMsg: result.MSG,
    data: data
      ? {
          metadata: {
            id: data.objid,
            year: data.SemiYear,
            semi: data.Semistry,
            code: data.Code,
            title: data.Title,
            rmTitle: data.RMTitle,
            status: data.Status,
            publishOrg: {
              id: data.UnOrg,
              name: data.UnOrgText,
              personId: data.UnPer,
              personName: data.UnPerText,
              phoneExt: data.OfficePhoneExt,
              email: data.EMail,
            },
            note: data.Memo,
          },
          text: data.Method,
          url: data.URL,
          startDate: data.StartDate,
          endDate: data.EndDate,
          uploadDate: data.UploadDate,
          reward: data.reward,
          requirements: (data.ApplyList ?? []).map((item: any) => ({
            logic: item.Logic,
            logicText: item.LogicText,
            text: `${item.Operand} ${item.Operator} ${item.Value}`,
            note: data.Memo,
            year: item.Year,
            semi: item.Semi,
          })),
          documents: (data.DocList ?? []).map((item: any) => ({
            text: item.Code,
            required: item.Choose === "必備",
            file: {
              name: item.ShowFileName,
              url: item.fileTitle,
            },
          })),
          details: data.DetailList ?? [],
        }
      : null,
  };
}
