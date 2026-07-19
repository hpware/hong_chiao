import { z } from "zod";
import OpenAI from "openai";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { chromium, type Browser, type BrowserContext } from "playwright";
import { baseProcedure, createTRPCRouter } from "../init";
// tRPC tools
import {
  USER_AGENT,
  endpoint,
  trpcGetBrowserCookies as getBrowserCookies,
  trpcGetBrowserCookieByName as getBrowserCookieByName,
  type BrowserCookieType,
} from "@/components/univeralComponents";
// pxItems import
// bill / discount / reward / tuition
import GetBill from "@/components/px_items/bill";
import GetDiscount from "@/components/px_items/discount";
import GetReward from "@/components/px_items/reward";
import GetTuition from "@/components/px_items/tuition";

// certificate
import GetCertificate from "@/components/px_items/certificate";
import AddCertificate from "@/components/px_items/certificate/add";
import SubmitCertificate from "@/components/px_items/certificate/submit";

// credit-application
import GetCreditApplications from "@/components/px_items/credit-application";

// home
import GetAnnouncements from "@/components/px_items/home/announcements";
import GetHomeData from "@/components/px_items/home/data";

// leave stuff
import {
  GetLeaves,
  CreateLeave,
  DeleteLeave,
} from "@/components/px_items/leave";
import DownloadLeaveFile from "@/components/px_items/leave/downloadFile";
import GetLeaveDownloadHistory from "@/components/px_items/leave/downloadHistory";
import GetLeaveBasicInfo from "@/components/px_items/leave/getBasicInfo";
import GetLeaveClassDetails from "@/components/px_items/leave/getClassDetails";
import ObtainLeaveToken from "@/components/px_items/leave/obtainToken";
import SubmitLeave from "@/components/px_items/leave/submit";
import UploadLeaveFile from "@/components/px_items/leave/upload";

// user
import GetCaptchaImage from "@/components/px_items/user/captcha";
import LoginFunction from "@/components/px_items/user/login";
import GetUserName from "@/components/px_items/user/name";
import RenewTimeoutTimer from "@/components/px_items/user/renewTimeoutTimer";
import ChangePassword from "@/components/px_items/user/changePassword";
import LogoutRemote from "@/components/px_items/user/logout";

const missingApiUrlMessage =
  "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。";
const expiredSessionMessage = "Session 過期了或無效。請重新登入。";

function requireApiUrl() {
  const rawUrl = process.env.API_URL;

  if (!rawUrl) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: missingApiUrlMessage,
    });
  }

  return rawUrl;
}

async function requireBrowserCookies(apiUrl: string) {
  const cookieStore = await cookies();

  try {
    return {
      cookieStore,
      browserCookies: await getBrowserCookies(cookieStore, new URL(apiUrl)),
    };
  } catch {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: expiredSessionMessage,
    });
  }
}

function throwBadRequest(message: string) {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

function throwUnauthorized(message = expiredSessionMessage) {
  throw new TRPCError({ code: "UNAUTHORIZED", message });
}

function validateYearSemi(year: number | string, semi: number | string) {
  const semiYear = String(year);
  const semistry = String(semi);

  if (!(semiYear && semistry)) {
    throwBadRequest("阿你忘了填 ?year 或(和) ?semi");
  }
  if (Number(semiYear) < 1) {
    throwBadRequest(`有民國${semiYear}嗎`);
  }
  if (semistry !== "1" && semistry !== "2") {
    throwBadRequest(`?semi 只支援 1 或 2`);
  }

  return { semiYear, semistry };
}

function mapHomeData(data: any) {
  return {
    success: data.OK,
    errMsg: data.MSG,
    data: {
      leaves: [
        { type: "曠課", data: data.obj.Score.Item1 },
        { type: "病假", data: data.obj.Score.Item2 },
        { type: "公假", data: data.obj.Score.Item3 },
        { type: "事假", data: data.obj.Score.Item4 },
        { type: "喪假", data: data.obj.Score.Item5 },
        { type: "產假", data: data.obj.Score.Item6 },
        { type: "操行分數", data: data.obj.Score.Item7 },
      ],
      absent: data.obj.Absent,
    },
  };
}

function cleanLeaveClassItems(
  items: {
    ClassDate: string;
    DayOfWeek: string;
    Ocid01: string | null;
    Show01: boolean;
    selected01: boolean;
    Ocid10: string | null;
    Show10: boolean;
    selected10: boolean;
    Ocid20: string | null;
    Show20: boolean;
    selected20: boolean;
    Ocid30: string | null;
    Show30: boolean;
    selected30: boolean;
    Ocid40: string | null;
    Show40: boolean;
    selected40: boolean;
    Ocid45: string | null;
    Show45: boolean;
    selected45: boolean;
    Ocid50: string | null;
    Show50: boolean;
    selected50: boolean;
    Ocid60: string | null;
    Show60: boolean;
    selected60: boolean;
    Ocid70: string | null;
    Show70: boolean;
    selected70: boolean;
    Ocid80: string | null;
    Show80: boolean;
    selected80: boolean;
    Ocid90: string | null;
    Show90: boolean;
    selected90: boolean;
    Ocid100: string | null;
    Show100: boolean;
    selected100: boolean;
    Ocid110: string | null;
    Show110: boolean;
    selected110: boolean;
    Ocid120: string | null;
    Show120: boolean;
    selected120: boolean;
    Ocid130: string | null;
    Show130: boolean;
    selected130: boolean;
    Ocid140: string | null;
    Show140: boolean;
    selected140: boolean;
    Ocid150: string | null;
    Show150: boolean;
    selected150: boolean;
  }[],
) {
  const rows = [
    ["01", 99998],
    ["10", 1],
    ["20", 2],
    ["30", 3],
    ["40", 4],
    ["45", 9999],
    ["50", 5],
    ["60", 6],
    ["70", 7],
    ["80", 8],
    ["90", 9],
    ["100", 10],
    ["110", 11],
    ["120", 12],
    ["130", 13],
    ["140", 14],
    ["150", 15],
  ] as const;

  return items.map((item: any) => ({
    date: item.ClassDate,
    day: item.DayOfWeek,
    table: rows.map(([key, classIndex]) => ({
      classIndex,
      sendData: item[`Ocid${key}`],
      show: item[`Show${key}`],
      selected: item[`selected${key}`],
    })),
  }));
}

function toROCDate(input: string | number | Date) {
  const parts = new Intl.DateTimeFormat("zh-TW-u-ca-roc", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(input));
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const year = get("year");
  const month = get("month");
  const day = get("day");

  if (!year || !month || !day)
    throwBadRequest("Date parsing error, please try again.");
  return `${year}/${month}/${day}`;
}

async function withBrowser<T>(
  browserCookies: BrowserCookieType,
  callback: (context: BrowserContext) => Promise<T>,
) {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);
    return await callback(context);
  } finally {
    await context?.close();
    await browser?.close();
  }
}

export const appRouter = createTRPCRouter({
  indexPage: createTRPCRouter({
    basicLeaveData: baseProcedure
      .input(
        z.object({
          year: z.number(),
          semistry: z.number(),
        }),
      )
      .query(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const data = await GetHomeData(
          browserCookies,
          String(opts.input.year),
          String(opts.input.semistry),
        );

        if (!data.OK) {
          throwUnauthorized(data.MSG ?? expiredSessionMessage);
        }
        return mapHomeData(data);
      }),
  }),
  home: createTRPCRouter({
    data: baseProcedure
      .input(z.object({ year: z.number(), semistry: z.number() }))
      .query(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const data = await GetHomeData(
          browserCookies,
          String(opts.input.year),
          String(opts.input.semistry),
        );

        if (!data.OK) throwUnauthorized(data.MSG || expiredSessionMessage);
        return mapHomeData(data);
      }),
    announcements: baseProcedure.query(async () => {
      const apiUrl = requireApiUrl();
      const { browserCookies } = await requireBrowserCookies(apiUrl);
      const announcements = await GetAnnouncements(browserCookies);

      return {
        success: true,
        data: announcements,
      };
    }),
    features: baseProcedure
      .input(
        z.object({
          year: z.union([z.number(), z.string()]),
          semi: z.union([z.number(), z.string()]),
          feature: z.string().optional(),
        }),
      )
      .query(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const { semiYear, semistry } = validateYearSemi(
          opts.input.year,
          opts.input.semi,
        );
        const featureList = [
          {
            name: "discount",
            requireBrowser: true,
            requestComponent: async (context: BrowserContext) => {
              const buildURLParams = new URLSearchParams();
              buildURLParams.append("Qmodel", "");
              const response = await context.request.post(
                endpoint(apiUrl, "/YSJStu/YSJSTU/YSJSTU_QryNotify"),
                {
                  data: buildURLParams.toString(),
                  headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type":
                      "application/x-www-form-urlencoded; charset=UTF-8",
                  },
                },
              );
              const result = await response.json();
              return result.isOK === true;
            },
            isEnabled: true,
          },
        ];
        const featureSelection = opts.input.feature?.split(",,");
        const findFeatures =
          featureSelection && featureSelection.length > 0
            ? featureSelection.flatMap((item) => {
                const foundFeature = featureList.find(
                  (featureItem) => featureItem.name === item,
                );
                return foundFeature ? [foundFeature] : [];
              })
            : featureList;
        const featureDoesNotExist =
          featureSelection?.filter(
            (item) =>
              !featureList.some((featureItem) => featureItem.name === item),
          ) ?? [];
        const requiresBrowser = findFeatures.some(
          (item) => item.requireBrowser,
        );
        const dataArray = requiresBrowser
          ? await withBrowser(browserCookies, async (context) =>
              Promise.all(
                findFeatures.map(async (item) => {
                  if (!item.isEnabled)
                    return { name: item.name, disabled: true };
                  if (!item.requireBrowser)
                    return { name: item.name, disabled: false };
                  return {
                    name: item.name,
                    disabled: await item.requestComponent(context),
                  };
                }),
              ),
            )
          : findFeatures.map((item) => ({
              name: item.name,
              disabled: !item.isEnabled,
            }));

        return {
          success: true,
          error: featureDoesNotExist.length > 0 ? featureDoesNotExist : "",
          data: dataArray,
          semiYear,
          semistry,
        };
      }),
  }),
  leave: createTRPCRouter({
    list: baseProcedure
      .input(z.object({ year: z.number(), semi: z.number() }))
      .query(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const { semiYear, semistry } = validateYearSemi(
          opts.input.year,
          opts.input.semi,
        );
        const data = await GetLeaves(browserCookies, semiYear, semistry);

        if (data.failedLogin) throwUnauthorized();
        return data;
      }),
    create: baseProcedure
      .input(
        z.object({
          year: z.number(),
          sem: z.number(),
          reason: z.string(),
          typeOfLeave: z.string(),
          periods: z.array(z.string()),
          startDate: z.string(),
          endDate: z.string(),
        }),
      )
      .mutation(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const { semiYear, semistry } = validateYearSemi(
          opts.input.year,
          opts.input.sem,
        );
        const { pageLoad, createResponse } = await CreateLeave(browserCookies, {
          ...opts.input,
          year: semiYear,
          sem: semistry,
        });

        if (!pageLoad.IsOK) throwBadRequest("無法載入請假資料");
        const list = pageLoad.LeaveStdS.map(
          (data: { ALCode: string }) => data.ALCode,
        );
        if (!list || !Array.isArray(list) || list.length === 0) {
          throwBadRequest("沒有找到符合條件的請假記錄");
        }
        if (!list.includes(opts.input.typeOfLeave)) {
          throwBadRequest("你選的假別不存在");
        }
        if (createResponse.IsOK !== true) {
          throwUnauthorized(createResponse.Message || expiredSessionMessage);
        }
        return { createResponse };
      }),
    update: baseProcedure
      .input(
        z.object({
          id: z.string(),
          year: z.number(),
          sem: z.number(),
          reason: z.string(),
          typeOfLeave: z.string(),
          periods: z.array(z.string()),
          startDate: z.string(),
          endDate: z.string(),
        }),
      )
      .mutation(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const { semiYear, semistry } = validateYearSemi(
          opts.input.year,
          opts.input.sem,
        );
        const { pageLoad, createResponse } = await CreateLeave(browserCookies, {
          ...opts.input,
          year: semiYear,
          sem: semistry,
        });

        if (!pageLoad.IsOK) throwBadRequest("無法載入請假資料");
        const list = pageLoad.LeaveStdS.map(
          (data: { ALCode: string }) => data.ALCode,
        );
        if (!list || !Array.isArray(list) || list.length === 0) {
          throwBadRequest("沒有找到符合條件的請假記錄");
        }
        if (!list.includes(opts.input.typeOfLeave)) {
          throwBadRequest("你選的假別不存在");
        }
        if (createResponse.IsOK !== true) {
          throwUnauthorized(createResponse.Message || expiredSessionMessage);
        }
        return { createResponse };
      }),
    delete: baseProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const deleteResponse = await DeleteLeave(browserCookies, opts.input.id);

        if (deleteResponse.IsOK !== true) throwUnauthorized();
        return { success: deleteResponse.IsOK };
      }),
    submit: baseProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const createResponse = await SubmitLeave(browserCookies, opts.input.id);

        if (createResponse.IsOK !== true) {
          throwUnauthorized(createResponse.Message || expiredSessionMessage);
        }
        return { createResponse };
      }),
    upload: baseProcedure.mutation(async () => {
      const apiUrl = requireApiUrl();
      const { browserCookies } = await requireBrowserCookies(apiUrl);
      const data = await UploadLeaveFile(browserCookies);

      if (data.failedLogin) throwUnauthorized();
      return data;
    }),
    downloadHistory: baseProcedure.query(async () => {
      const apiUrl = requireApiUrl();
      const { browserCookies } = await requireBrowserCookies(apiUrl);
      const data = await GetLeaveDownloadHistory(browserCookies);

      if (data.failedLogin) throwUnauthorized();
      return data;
    }),
    basicInfo: baseProcedure
      .input(z.object({ year: z.number(), semi: z.number() }))
      .query(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const apiResponse = await GetLeaveBasicInfo(
          browserCookies,
          String(opts.input.year),
          String(opts.input.semi),
        );

        if (!apiResponse.IsOK) throwUnauthorized();
        return {
          success: apiResponse.IsOK,
          typesOfLeave: apiResponse.LeaveStdS.map(
            (data: {
              ALCode: string;
              ALTitle: string;
              WarningDay: string;
            }) => ({
              id: data.ALCode,
              name: data.ALTitle,
              warnindDay: data.WarningDay,
            }),
          ),
        };
      }),
    classDetails: baseProcedure
      .input(
        z.object({
          start: z.string(),
          end: z.string(),
          year: z.number(),
          semi: z.number(),
        }),
      )
      .query(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const apiResponse = await GetLeaveClassDetails(
          browserCookies,
          toROCDate(opts.input.start),
          toROCDate(opts.input.end),
          String(opts.input.year),
          String(opts.input.semi),
        );

        if (!apiResponse.IsOK) throwUnauthorized();
        return {
          success: apiResponse.IsOK,
          status: apiResponse.rmodel.status,
          leaveId: apiResponse.rmodel.LeaveId,
          renderItems: cleanLeaveClassItems(apiResponse.rmodel.LeaveDateItemS),
        };
      }),
    obtainToken: baseProcedure.query(async () => {
      const startTime = Date.now();
      const apiUrl = requireApiUrl();
      const { browserCookies } = await requireBrowserCookies(apiUrl);
      const token = await ObtainLeaveToken(browserCookies);

      return {
        success: true,
        token,
        duration: (Date.now() - startTime) / 1000,
      };
    }),
    convertDateToSemiYear: baseProcedure
      .input(
        z.object({ year: z.number().optional(), month: z.number().optional() }),
      )
      .query((opts) => {
        const year = opts.input.year || new Date().getFullYear();
        const month = opts.input.month || new Date().getMonth() + 1;

        if (!(year > 1911 && year < 4000))
          throwBadRequest("Invalid year input.");
        if (!(month > 0 && month < 13)) {
          throwBadRequest("阿一年只有 12 個月內 怎麼會多或少???");
        }
        const calcROCYear = year - 1911;
        if (month > 1 && month < 8) {
          return { rocYear: calcROCYear - 1, semistry: 2 };
        }
        return { rocYear: calcROCYear, semistry: 1 };
      }),
  }),
  certificate: createTRPCRouter({
    list: baseProcedure.query(async () => {
      const apiUrl = requireApiUrl();
      const { browserCookies } = await requireBrowserCookies(apiUrl);
      const data = await GetCertificate(browserCookies);

      if (!data.OK) throwUnauthorized();
      return {
        success: data.OK,
        errMsg: data.MSG,
        data: data.obj,
      };
    }),
    add: baseProcedure.mutation(async () => {
      const apiUrl = requireApiUrl();
      const { browserCookies } = await requireBrowserCookies(apiUrl);
      const data = await AddCertificate(browserCookies);

      if (!data.OK) throwUnauthorized();
      return data;
    }),
    submit: baseProcedure.mutation(async () => {
      const apiUrl = requireApiUrl();
      const { browserCookies } = await requireBrowserCookies(apiUrl);
      const data = await SubmitCertificate(browserCookies);

      if (!data.OK) throwUnauthorized();
      return {
        success: data.OK,
        errMsg: data.MSG,
        data: data.obj,
      };
    }),
  }),
  tuition: createTRPCRouter({
    get: baseProcedure
      .input(z.object({ year: z.number(), semistry: z.number() }))
      .query(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const data = await GetTuition(
          browserCookies,
          String(opts.input.year),
          String(opts.input.semistry),
        );

        if (!data.success && data.message === null) throwUnauthorized();

        return data;
      }),
    discount: createTRPCRouter({
      get: baseProcedure.query(async () => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const { basicHelpInfoData, data } = await GetDiscount(browserCookies);

        if (!(basicHelpInfoData.IsOK && data.IsOK)) {
          throwUnauthorized(data.MSG || expiredSessionMessage);
        }
        const r = data.rmodel;
        const mapFamily = (f: any) => ({
          relation: f?.Relation ?? "",
          alive: f?.Alive ?? "",
          name: f?.Name ?? "",
          idNo: f?.IdNo ?? "",
          job: f?.Job ?? "",
          militaryRank: f?.MilitaryRank ?? "",
        });

        return {
          success: data.OK,
          errMsg: data.MSG,
          data: {
            note: basicHelpInfoData.Help,
            objId: r.objid,
            applyId: r.ApplyID,
            status: r.Status,
            semiYear: r.SemiYear,
            semester: r.Semistry,
            stage: r.Stage,
            studentId: r.StuId,
            studentName: r.StuName,
            orgName: r.OrgName,
            dayNight: r.DayNight,
            newsStr: r.NewsStr,
            isApply: r.IsApply,
            needCertified: r.NeedCertified,
            phoneNumber: r.PhoneNumber,
            mobileNumber: r.MobileNumber,
            email: r.Email,
            identity: r.Iden,
            originalClan: r.OrigClan,
            isBoarder: r.IsBoarders,
            idNo: r.idno,
            father: mapFamily(r.ReduceFamilyF),
            mother: mapFamily(r.ReduceFamilyM),
            guardian: mapFamily(r.ReduceFamilyG),
            spouse: mapFamily(r.ReduceFamilyS),
          },
        };
      }),
    }),
  }),
  bill: createTRPCRouter({
    get: baseProcedure
      .input(
        z.object({
          year: z.string(),
          semi: z.string(),
          kind: z.string(),
          step: z.string(),
        }),
      )
      .query(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const data = await GetBill(
          browserCookies,
          opts.input.year,
          opts.input.semi,
          opts.input.kind,
          opts.input.step,
        );

        if (data.failedLogin) throwUnauthorized();
        return data;
      }),
  }),
  reward: createTRPCRouter({
    get: baseProcedure
      .input(z.object({ year: z.number(), semistry: z.number() }))
      .query(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);
        const data = await GetReward(
          browserCookies,
          String(opts.input.year),
          String(opts.input.semistry),
        );

        if (!data.OK) throwUnauthorized();
        return {
          success: data.OK,
          errMsg: data.MSG,
          data: data.obj.DataList || [],
        };
      }),
  }),
  creditApplication: createTRPCRouter({
    list: baseProcedure.query(async () => {
      const apiUrl = requireApiUrl();
      const { browserCookies } = await requireBrowserCookies(apiUrl);
      const data = await GetCreditApplications(browserCookies);

      if (!data.OK) throwUnauthorized(data.MSG || expiredSessionMessage);
      const rows = Array.isArray(data.obj)
        ? data.obj
        : Array.isArray(data.obj?.DataList)
          ? data.obj.DataList
          : [];

      return {
        success: data.OK,
        errMsg: data.MSG,
        data: rows,
      };
    }),
    detail: baseProcedure
      .input(z.object({ id: z.string() }))
      .query(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);

        return withBrowser(browserCookies, async (context) => {
          const buildURLParams = new URLSearchParams();
          buildURLParams.append("ppqmodel[objid]", "2");
          buildURLParams.append("ppqmodel[Code]", opts.input.id);
          buildURLParams.append("ppqmodel[Title]", "aa");
          buildURLParams.append("ppqmodel[RMTitle]", "");

          await context.request.post(
            endpoint(apiUrl, "/YSKStu/YSKStu/YSK111SDetail"),
            {
              data: buildURLParams.toString(),
              headers: {
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type":
                  "application/x-www-form-urlencoded; charset=UTF-8",
              },
            },
          );
          const buildURLParams2 = new URLSearchParams();
          buildURLParams2.append("ppqmodel[objid]", "1");
          buildURLParams2.append("ppqmodel[IsDtl]", "1");
          const response = await context.request.post(
            endpoint(apiUrl, "/YSKStu/YSKStu/YSK11_Qry"),
            {
              data: buildURLParams2.toString(),
              headers: {
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type":
                  "application/x-www-form-urlencoded; charset=UTF-8",
              },
            },
          );
          const data = JSON.parse(await response.text());

          if (!data.OK) throwUnauthorized();
          const d = data.obj[0];
          return {
            success: data.OK,
            errMsg: data.MSG,
            data: {
              metadata: {
                id: d.objid,
                year: d.SemiYear,
                semi: d.Semistry,
                code: d.Code,
                title: d.Title,
                rmTitle: d.RMTitle,
                status: d.Status,
                publishOrg: {
                  id: d.UnOrg,
                  name: d.UnOrgText,
                  personId: d.UnPer,
                  personName: d.UnPerText,
                  phoneExt: d.OfficePhoneExt,
                  email: d.EMail,
                },
                note: d.Memo,
              },
              text: d.Method,
              url: d.URL,
              startDate: d.StartDate,
              endDate: d.EndDate,
              uploadDate: d.UploadDate,
              reward: d.reward,
              requirements: d.ApplyList.map((i: any) => ({
                logic: i.Logic,
                logicText: i.LogicText,
                text: `${i.Operand} ${i.Operator} ${i.Value}`,
                note: d.Memo,
                year: i.Year,
                semi: i.Semi,
              })),
              documents: d.DocList.map((i: any) => ({
                text: i.Code,
                required: i.Choose === "必備",
                file: {
                  name: i.ShowFileName,
                  url: i.fileTitle,
                },
              })),
              details: d.DetailList,
            },
          };
        });
      }),
    submitApplication: baseProcedure
      .input(
        z.object({
          id: z.string(),
          descript: z.string().optional(),
          appendFiles: z.array(
            z.object({
              name: z.string(),
              file: z.object({
                fileName: z.string(),
                dPath: z.string(),
                sPath: z.string(),
              }),
            }),
          ),
        }),
      )
      .mutation(async (opts) => {
        const apiUrl = requireApiUrl();
        const { browserCookies } = await requireBrowserCookies(apiUrl);

        return withBrowser(browserCookies, async (context) => {
          const buildURLParams = new URLSearchParams();
          buildURLParams.append("ppqmodel[objid]", "");
          buildURLParams.append("ppqmodel[RMID]", opts.input.id);
          buildURLParams.append("ppqmodel[RMDtlID]", "");
          buildURLParams.append(
            "ppqmodel[Descript]",
            opts.input.descript || "",
          );
          opts.input.appendFiles.forEach((item, index) => {
            buildURLParams.append(
              `ppqmodel[AppendidxS][${index}][InId]`,
              item.name,
            );
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
          const response = await context.request.post(
            endpoint(apiUrl, "/YSKStu/YSKStu/YSK11_Save"),
            {
              data: buildURLParams.toString(),
              headers: {
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type":
                  "application/x-www-form-urlencoded; charset=UTF-8",
              },
            },
          );
          const data = JSON.parse(await response.text());

          if (!data.OK) throwUnauthorized();
          return {
            success: data.OK,
            errMsg: data.MSG,
            other: data.obj,
          };
        });
      }),
  }),
  // auth/user
  user: createTRPCRouter({
    getCaptcha: baseProcedure
      .meta({
        useBatchLink: true,
      })
      .query(async (opts) => {
        const rawUrl = process.env.API_URL;

        if (!rawUrl) {
          return {
            success: false,
            image: "/_appassets/captcha_errors/cannotObtain.png",
            error:
              "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
          };
        }
        const apiUrl = rawUrl;
        const url = new URL(apiUrl);
        const cookieStore = await cookies();
        const browserCookies = await getBrowserCookieByName(
          cookieStore,
          new URL(rawUrl),
          ["ASP.NET_SessionId"],
        );
        const startTime = Date.now();
        const image = await GetCaptchaImage(browserCookies);

        try {
          for (const cookie of image.setCookies) {
            cookieStore.set(cookie.name, cookie.value, {
              httpOnly: cookie.httpOnly,
              secure: url.protocol === "https:",
              sameSite:
                cookie.sameSite === "None"
                  ? "none"
                  : cookie.sameSite === "Strict"
                    ? "strict"
                    : "lax",
              path: "/",
              expires:
                cookie.expires && cookie.expires > 0
                  ? new Date(cookie.expires * 1000)
                  : undefined,
            });
          }
        } catch {}
        return {
          success: image.success,
          image: image.image,
          duration: (Date.now() - startTime) / 1000,
        };
      }),
    login: baseProcedure
      .input(
        z.object({
          username: z.string(),
          password: z.string(),
          captcha: z.string(),
        }),
      )
      .meta({
        useBatchLink: true,
      })
      .mutation(async (opts) => {
        const rawUrl = process.env.API_URL;

        if (!rawUrl) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message:
              "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
          });
        }
        const apiUrl = rawUrl;
        const url = new URL(apiUrl);
        const cookieStore = await cookies();
        const browserCookies = await getBrowserCookieByName(
          cookieStore,
          new URL(rawUrl),
          ["ASP.NET_SessionId"],
        );
        const startTime = Date.now();
        const login = await LoginFunction(
          opts.input.username,
          opts.input.password,
          opts.input.captcha,
          browserCookies,
        );
        if (!login.success) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: login.error ?? "登入失敗，請檢查您的帳號密碼和驗證碼。",
          });
        }
        try {
          for (const cookie of login.setCookies) {
            cookieStore.set(cookie.name, cookie.value, {
              httpOnly: cookie.httpOnly,
              secure: url.protocol === "https:",
              sameSite:
                cookie.sameSite === "None"
                  ? "none"
                  : cookie.sameSite === "Strict"
                    ? "strict"
                    : "lax",
              path: "/",
              expires:
                cookie.expires && cookie.expires > 0
                  ? new Date(cookie.expires * 1000)
                  : undefined,
            });
          }
        } catch {}
        return {
          success: login.success,
          remoteStatus: login.remoteStatus,
          statusText: login.statusText,
          hdfText: login.hdfText,
          changePasswordNotice: login.changePasswordNotice,
          duration: (Date.now() - startTime) / 1000,
        };
      }),
    // logout is still the same. Due to some components that require redirecting to the login page.
    // this is for some applications that use muations to submit logouts, some will migrate through, but some not, like the sidebar button one, it will prob be changed, but the auto logout on session fail thingy will still use that endpoint.
    logout: baseProcedure
      .meta({
        useBatchLink: true,
      })
      .mutation(async () => {
        const rawUrl = process.env.API_URL;
        if (!rawUrl) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message:
              "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
          });
        }
        const apiUrl = rawUrl;
        const url = new URL(apiUrl);
        const cookieStore = await cookies();
        let browserCookies;
        try {
          browserCookies = await getBrowserCookies(cookieStore, url);
        } catch {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Session 過期了或無效。請重新登入。",
          });
        }

        await LogoutRemote(browserCookies);
        for (const cookieName of [
          "ASP.NET_SessionId",
          "ssClientIP",
          "ssAID",
          "ssSchID",
          "ssSchName",
          "ssLoginID",
          "ssLoginForLDAP",
          "ssLoginName",
        ]) {
          cookieStore.delete(cookieName);
        }
        return { success: true };
      }),
    renewTimer: baseProcedure.query(async () => {
      const rawUrl = process.env.API_URL;

      if (!rawUrl) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message:
            "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
        });
      }
      const url = new URL(rawUrl);
      const cookieStore = await cookies();

      let browserCookies;
      try {
        browserCookies = await getBrowserCookies(cookieStore, url);
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Session 過期了或無效。請重新登入。",
        });
      }

      const responseText = await RenewTimeoutTimer(browserCookies);
      if (responseText !== "OK") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Session 過期了或無效。請重新登入。",
        });
      }
      return { success: true };
    }),
    name: baseProcedure.query(async () => {
      const rawUrl = process.env.API_URL;

      if (!rawUrl) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message:
            "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
        });
      }
      const apiUrl = rawUrl;
      const url = new URL(apiUrl);
      const cookieStore = await cookies();
      let browserCookies;
      try {
        browserCookies = await getBrowserCookies(cookieStore, url);
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Session 過期了或無效。請重新登入。",
        });
      }
      const startTime = Date.now();
      const getName = await GetUserName(browserCookies);
      if (!getName.success) throwUnauthorized();
      return {
        success: getName.success,
        name: getName.name,
        error: null,
        duration: Date.now() - startTime,
      };
    }),
    detailedInfo: baseProcedure.query(async () => {
      return "Currently in WIP, please do not use this endpoint, this will change soon.";
    }),
    changePassword: baseProcedure
      .input(
        z.object({
          newPassword: z
            .string()
            .regex(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d&!@#$%^*()+=_~]{8,20}$/,
              "密碼需要包含 8~20 位的英文大小寫與數字，並僅可以包含這些符號 &!@#$%^*()+=_~。",
            ),
        }),
      )
      .mutation(async (opts) => {
        const rawUrl = process.env.API_URL;

        if (!rawUrl) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message:
              "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
          });
        }
        const apiUrl = rawUrl;
        const url = new URL(apiUrl);
        const cookieStore = await cookies();
        let browserCookies;
        try {
          browserCookies = await getBrowserCookies(cookieStore, url);
        } catch {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Session 過期了或無效。請重新登入。",
          });
        }
        const startTime = Date.now();
        const resetPassword = await ChangePassword(
          browserCookies,
          opts.input.newPassword,
        );
        if (!resetPassword.success)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: String(resetPassword.message).replace(
              "-clXObjS.SBAS:-clYObjS_BAS.BASSaveUserRole:-SBAS_SaveUserRole:",
              "",
            ),
          });
        for (const cookieName of [
          "ASP.NET_SessionId",
          "ssClientIP",
          "ssAID",
          "ssSchID",
          "ssSchName",
          "ssLoginID",
          "ssLoginForLDAP",
          "ssLoginName",
        ]) {
          cookieStore.delete(cookieName);
        }
        return {
          success: resetPassword.success,
          duration: (Date.now() - startTime) / 1000,
          message: String(resetPassword.message).replace(
            "-clXObjS.SBAS:-clYObjS_BAS.BASSaveUserRole:-SBAS_SaveUserRole:",
            "",
          ),
        };
        //錯誤: -clXObjS.SBAS:-clYObjS_BAS.BASSaveUserRole:-SBAS_SaveUserRole:新密碼與前兩代密碼重複，請重新設定新密碼。
        // nukr -:
      }),
  }),
  // 幫瀏覽器轉發 OpenAI 格式的聊天要求，避免被 CORS 阻擋；
  // 用 async generator 把上游的 SSE chunk 一路串流回前端
  openaiCompletionProxy: baseProcedure
    .input(
      z.object({
        api: z.object({
          url: z.string().startsWith("https://"),
          key: z.string().min(1),
          model: z.string().min(1),
        }),
        messages: z.array(z.record(z.string(), z.any())),
        tools: z.array(z.record(z.string(), z.any())).optional(),
      }),
    )
    .mutation(async function* (opts) {
      // 只有登入中的使用者能用，避免變成公開代理
      await requireBrowserCookies(requireApiUrl());

      const client = new OpenAI({
        apiKey: opts.input.api.key,
        baseURL: opts.input.api.url.replace(/\/+$/, ""),
      });
      const stream = await client.chat.completions.create(
        {
          model: opts.input.api.model,
          messages: opts.input
            .messages as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
          tools: opts.input.tools as
            OpenAI.Chat.Completions.ChatCompletionTool[] | undefined,
          stream: true,
        },
        { signal: opts.signal },
      );
      for await (const chunk of stream) {
        yield chunk;
      }
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
