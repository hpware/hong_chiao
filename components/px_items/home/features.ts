import { chromium, type Browser, type BrowserContext } from "playwright";
import {
  USER_AGENT,
  endpoint,
  type BrowserCookieType,
} from "@/components/univeralComponents";

type Feature = {
  name: string;
  requireBrowser: boolean;
  requestComponent: (context: BrowserContext) => Promise<boolean>;
  isEnabled: boolean;
};

export default async function GetFeatures(
  browserCookies: BrowserCookieType,
  feature?: string,
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const featureList: Feature[] = [
    {
      name: "discount",
      requireBrowser: true,
      requestComponent: async (context) => {
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
  const featureSelection = feature?.split(",,");
  const selectedFeatures =
    featureSelection && featureSelection.length > 0
      ? featureSelection.flatMap((item) => {
          const foundFeature = featureList.find(
            (featureItem) => featureItem.name === item,
          );
          return foundFeature ? [foundFeature] : [];
        })
      : featureList;
  const missingFeatures =
    featureSelection?.filter(
      (item) =>
        !featureList.some((featureItem) => featureItem.name === item),
    ) ?? [];

  if (!selectedFeatures.some((item) => item.requireBrowser)) {
    return {
      missingFeatures,
      data: selectedFeatures.map((item) => ({
        name: item.name,
        disabled: !item.isEnabled,
      })),
    };
  }

  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    const browserContext = context;
    await browserContext.addCookies(browserCookies);

    return {
      missingFeatures,
      data: await Promise.all(
        selectedFeatures.map(async (item) => {
          if (!item.isEnabled) return { name: item.name, disabled: true };
          if (!item.requireBrowser)
            return { name: item.name, disabled: false };
          return {
            name: item.name,
            disabled: await item.requestComponent(browserContext),
          };
        }),
      ),
    };
  } finally {
    await context?.close();
    await browser?.close();
  }
}
