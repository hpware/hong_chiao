import { z } from "zod";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { baseProcedure, createTRPCRouter } from "../init";
// tRPC tools
import {
  trpcGetBrowserCookies as getBrowserCookies,
  trpcGetBrowserCookieByName as getBrowserCookieByName,
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
import ChangePasswordRequest from "@/components/px_items/user/changePassword";

export const appRouter = createTRPCRouter({
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
  indexPage: createTRPCRouter({
    basicLeaveData: baseProcedure
      .input(
        z.object({
          year: z.number(),
          semistry: z.number(),
        }),
      )
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
        const browserCookies = await getBrowserCookies(cookieStore, url);
        const data = await GetHomeData(
          browserCookies,
          String(opts.input.year),
          String(opts.input.semistry),
        );

        if (!data.OK) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: data.MSG ?? "Session 過期了或無效。請重新登入。",
          });
        }
        return Response.json({
          success: data.OK,
          error: data.MSG,
          data: {
            leaves: [
              {
                type: "曠課",
                data: data.obj.Score.Item1,
              },
              {
                type: "病假",
                data: data.obj.Score.Item2,
              },
              {
                type: "公假",
                data: data.obj.Score.Item3,
              },
              {
                type: "事假",
                data: data.obj.Score.Item4,
              },
              {
                type: "喪假",
                data: data.obj.Score.Item5,
              },
              {
                type: "產假",
                data: data.obj.Score.Item6,
              },
              {
                type: "操行分數",
                data: data.obj.Score.Item7,
              },
            ],
            absent: data.obj.Absent,
          },
        });
      }),
  }),
  // auth/user
  user: createTRPCRouter({
    getCaptcha: baseProcedure.query(async (opts) => {
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
    // logout is still the same. Due to the component requires redirecting to the login page.
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

      // Missing session cookies == already logged out.
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
      const browserCookies = await getBrowserCookies(cookieStore, url);
      const startTime = Date.now();
      const getName = await GetUserName(browserCookies);
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
  }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
