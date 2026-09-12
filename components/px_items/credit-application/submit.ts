import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";

type CreditApplicationFile = {
  name: string;
  file: {
    fileName: string;
    dPath: string;
    sPath: string;
  };
};

type CreditApplication = {
  id: string;
  descript?: string;
  appendFiles: CreditApplicationFile[];
};

export default async function SubmitCreditApplication(
  browserCookies: UpstreamCookies,
  application: CreditApplication,
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const buildURLParams = new URLSearchParams();
  buildURLParams.append("ppqmodel[objid]", "");
  buildURLParams.append("ppqmodel[RMID]", application.id);
  buildURLParams.append("ppqmodel[RMDtlID]", "");
  buildURLParams.append("ppqmodel[Descript]", application.descript || "");
  application.appendFiles.forEach((item, index) => {
    buildURLParams.append(`ppqmodel[AppendidxS][${index}][InId]`, item.name);
    buildURLParams.append(
      `ppqmodel[AppendidxS][${index}][ShowFileName]`,
      item.file.fileName,
    );
    buildURLParams.append(
      `ppqmodel[AppendidxS][${index}][DPath]`,
      item.file.dPath,
    );
    buildURLParams.append(
      `ppqmodel[AppendidxS][${index}][SPath]`,
      item.file.sPath,
    );
    buildURLParams.append(
      `ppqmodel[AppendidxS][${index}][FileTitle]`,
      item.file.fileName,
    );
  });

  const client = createChromeFetch(browserCookies);

  const response = await client.post(
    endpoint(apiUrl, "/YSKStu/YSKStu/YSK11_Save"),
    {
      data: buildURLParams.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );
  const result = JSON.parse(await response.text());

  return {
    success: result.OK,
    errMsg: result.MSG,
    other: result.obj,
  };
}
