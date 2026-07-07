import { chromium, type Browser, type BrowserContext } from "playwright";
import {
  USER_AGENT,
  endpoint,
  type BrowserCookieType,
} from "@/components/univeralComponents";

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
  browserCookies: BrowserCookieType,
  semiYear: string,
  semistry: string,
) {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
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

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.post(
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
          status: response.status(),
          success: leaveResponse.IsOK,
          data: leaveResponse.LeaveS,
        };
  } finally {
    await context?.close();
    await browser?.close();
  }
}

export async function CreateLeave(
  browserCookies: BrowserCookieType,
  body: LeaveBody,
) {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      throw new Error(
        "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
      );
    }

    const semiYear = body.year;
    const semistry = body.sem;

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const buildURLParamsLoadCheckLeaveCode = new URLSearchParams();
    buildURLParamsLoadCheckLeaveCode.append("SemiYear", semiYear);
    buildURLParamsLoadCheckLeaveCode.append("Semistry", semistry);
    buildURLParamsLoadCheckLeaveCode.append("ObjId", "0");
    const resPageLoadCheckLeaveCode = await context.request.post(
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

    const response = await context.request.post(
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
  } finally {
    await context?.close();
    await browser?.close();
  }
}

export async function DeleteLeave(
  browserCookies: BrowserCookieType,
  id: number,
) {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      throw new Error(
        "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
      );
    }

    const buildURLParams = new URLSearchParams();
    buildURLParams.append("Objid", `${id}`);

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.post(
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
  } finally {
    await context?.close();
    await browser?.close();
  }
}
