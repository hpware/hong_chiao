import { z } from "zod";
import { cookies } from "next/headers";
import { baseProcedure, createTRPCRouter } from "../init";
// tRPC validators
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
import LogoutRemote from "@/components/px_items/user/logout";
import ChangePasswordRequest from "@/components/px_items/user/changePassword";
import RenewTimeoutTimer from "@/components/px_items/user/renewTimeoutTimer";

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
      // Persisting cookies only works over the HTTP route-handler path. If this
      // query is prefetched during Server Component render, `cookieStore.set`
      // throws ("Cookies can only be modified in a Server Action or Route
      // Handler") — swallow it so the prefetch still returns the image; the
      // client's HTTP fetch is what actually persists the session cookies.
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
      } catch {
        // no-op: not in a cookie-writable context (RSC prefetch)
      }
      return {
        success: image.success,
        image: image.image,
        duration: (Date.now() - startTime) / 1000,
      };
    }),
  }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
