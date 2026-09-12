import {
  createChromeFetch,
  type ChromeFetchClient,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";

type Feature = {
  name: string;
  requiresRequest: boolean;
  requestComponent: (client: ChromeFetchClient) => Promise<boolean>;
  isEnabled: boolean;
};

export default async function GetFeatures(
  browserCookies: UpstreamCookies,
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
      requiresRequest: true,
      requestComponent: async (client) => {
        const buildURLParams = new URLSearchParams();
        buildURLParams.append("Qmodel", "");
        const response = await client.post(
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
      (item) => !featureList.some((featureItem) => featureItem.name === item),
    ) ?? [];

  if (!selectedFeatures.some((item) => item.requiresRequest)) {
    return {
      missingFeatures,
      data: selectedFeatures.map((item) => ({
        name: item.name,
        disabled: !item.isEnabled,
      })),
    };
  }

  const client = createChromeFetch(browserCookies);

  return {
    missingFeatures,
    data: await Promise.all(
      selectedFeatures.map(async (item) => {
        if (!item.isEnabled) return { name: item.name, disabled: true };
        if (!item.requiresRequest) return { name: item.name, disabled: false };
        return {
          name: item.name,
          disabled: await item.requestComponent(client),
        };
      }),
    ),
  };
}
