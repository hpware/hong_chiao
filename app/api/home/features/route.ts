import { chromium, type Browser, type BrowserContext } from "playwright";
import { type NextRequest, NextResponse } from "next/server";
import {
  USER_AGENT,
  endpoint,
  getBrowserCookies,
} from "@/components/univeralComponents";

type FeatureType = {
  name: string;
  requireBrowser: boolean;
  requestComponent: (
    apiUrl: string,
    context: BrowserContext,
  ) => Promise<boolean>;
  isEnabled: boolean;
};

const featureList: FeatureType[] = [
  {
    name: "discount",
    requireBrowser: true,
    requestComponent: async (apiUrl: string, context: BrowserContext) => {
      const buildURLParams = new URLSearchParams();
      buildURLParams.append("Qmodel", "");
      const response = await context.request.post(
        endpoint(apiUrl, "/YSJStu/YSJSTU/YSJSTU_QryNotify"),
        {
          data: buildURLParams.toString(),
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        },
      );
      const result = await response.json();
      if (result.isOK === true) {
        return true;
      }
      return false;
    },
    isEnabled: true,
  },
];
/*
  FORMAT
  {
    name: "discount",
    requireBrowser: false,
    requestComponent: async (apiUrl: string, context: BrowserContext) => {},
    isEnabled: true, // 如果設定 false, 系統則是直接回覆 false, 如果是 true, 系統會ㄧ requireBrowser 指數來進行判斷
  }
*/

export const GET = async (request: NextRequest) => {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let statusCode = 500;
  try {
    const rawUrl = process.env.API_URL;

    if (!rawUrl) {
      return NextResponse.json(
        {
          error:
            "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
        },
        { status: 500 },
      );
    }

    const apiUrl = rawUrl;
    const url = new URL(apiUrl);
    statusCode = 401;
    const browserCookies = await getBrowserCookies(request, statusCode, url);
    statusCode = 500;
    //get vars
    const params = request.nextUrl.searchParams;
    const semiYear = params.get("year");
    const semistry = params.get("semi");

    const featureSelection = params.get("feature")?.split(",,"); // ,, as a separator for multiple features
    // vars
    let findFeatures: FeatureType[] = [];
    let requiresBrowser = false;
    let featureDoesNotExist: string[] = [];
    //checks

    if (!(semiYear && semistry)) {
      statusCode = 400;
      throw new Error("阿你忘了填 ?year 或(和) ?semi");
    }
    if (Number(semiYear) < 1) {
      statusCode = 400;
      throw new Error(`有民國${semiYear}嗎`);
    }
    if (semistry !== "1" && semistry !== "2") {
      statusCode = 400;
      throw new Error(`?semi 只支援 1 或 2`);
    }
    if (!featureSelection || !(featureSelection.length > 0)) {
      findFeatures = featureList;
      requiresBrowser = true;
    } else {
      featureSelection.forEach((item: string) => {
        const foundFeature = featureList.find(
          (feature) => feature.name === item,
        );
        if (!foundFeature) {
          featureDoesNotExist.push(item);
        } else {
          findFeatures.push(foundFeature);
          if (foundFeature.requireBrowser) {
            requiresBrowser = true;
          }
        }
      });
    }

    if (requiresBrowser) {
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({ userAgent: USER_AGENT });
      await context.addCookies(browserCookies);
    }

    const dataArray = await Promise.all(
      findFeatures.map(async (data: FeatureType) => {
        if (!data.isEnabled) return { name: data.name, disabled: true };
        if (data.requireBrowser) {
          if (!context) {
            return {
              name: data.name,
              error: "Browser context is required but not available.",
            };
          }
          const result = await data.requestComponent(apiUrl, context);
          return { name: data.name, disabled: result };
        }
        return {
          name: data.name,
          disabled: false,
        };
      }),
    );

    return Response.json({
      success: true,
      error: featureDoesNotExist.length > 0 ? featureDoesNotExist : "",
      data: dataArray,
    });
  } catch (error: any) {
    console.error(error);
    return Response.json(
      {
        successs: false,
        error: error.message,
        data: [],
      },
      {
        status: statusCode,
      },
    );
  }
};
