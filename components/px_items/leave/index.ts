import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";

type LeaveBody = {
  year: string;
  sem: string;
  startDate: string;
  endDate: string;
  typeOfLeave: string;
  reason: string;
  periods: string[];
};

export async function GetLeaves(
  browserCookies: UpstreamCookies,
  semiYear: string,
  semistry: string,
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const buildURLParams = new URLSearchParams();
  buildURLParams.append("SemiYear", semiYear);
  buildURLParams.append("Semistry", semistry);
  buildURLParams.append("ApplyDateS", "");
  buildURLParams.append("ApplyDateE", "");
  buildURLParams.append("ClassDateS", "");
  buildURLParams.append("ClassDateE", "");

  const client = createChromeFetch(browserCookies);

  const response = await client.post(
    endpoint(apiUrl, "/YSD21/YSD21/YSD21_GetLeaveS"),
    {
      data: buildURLParams.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );
  const leaveResponse = JSON.parse(await response.text());

  return leaveResponse.OnNoLogin
    ? {
        failedLogin: true,
        res: leaveResponse,
      }
    : {
        failedLogin: false,
        status: response.status,
        success: leaveResponse.IsOK,
        data: leaveResponse.LeaveS,
      };
}

export async function CreateLeave(
  browserCookies: UpstreamCookies,
  body: LeaveBody,
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const semiYear = body.year;
  const semistry = body.sem;

  const client = createChromeFetch(browserCookies);

  const buildURLParamsLoadCheckLeaveCode = new URLSearchParams();
  buildURLParamsLoadCheckLeaveCode.append("SemiYear", semiYear);
  buildURLParamsLoadCheckLeaveCode.append("Semistry", semistry);
  buildURLParamsLoadCheckLeaveCode.append("ObjId", "0");
  const resPageLoadCheckLeaveCode = await client.post(
    endpoint(apiUrl, "/YSD21/YSD21/YSD21Detail_PageLoad"),
    {
      data: buildURLParamsLoadCheckLeaveCode.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );
  const apiResponseLoadCheckLeaveCode = JSON.parse(
    await resPageLoadCheckLeaveCode.text(),
  );

  const buildURLParams = new URLSearchParams();
  buildURLParams.append("model[LeaveId]", "");
  buildURLParams.append("model[SemiYear]", semiYear);
  buildURLParams.append("model[Semistry]", semistry);
  buildURLParams.append("model[DateStart]", body.startDate);
  buildURLParams.append("model[DateStop]", body.endDate);
  buildURLParams.append("model[LeaveCode]", body.typeOfLeave);
  buildURLParams.append("model[Cause]", body.reason);

  body.periods.forEach((period: string) => {
    buildURLParams.append("model[DatePaiKeS][]", `${period}`);
  });

  const response = await client.post(
    endpoint(apiUrl, "/YSD21/YSD21/YSD21Detail_SaveLeave"),
    {
      data: buildURLParams.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );

  return {
    pageLoad: apiResponseLoadCheckLeaveCode,
    createResponse: JSON.parse(await response.text()),
  };
}

export async function DeleteLeave(browserCookies: UpstreamCookies, id: number) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const buildURLParams = new URLSearchParams();
  buildURLParams.append("Objid", `${id}`);

  const client = createChromeFetch(browserCookies);

  const response = await client.post(
    endpoint(apiUrl, "/YSD21/YSD21/YSD21_DelLeaveApply"),
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
