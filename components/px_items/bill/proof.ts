import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as JsonRecord;
}

function findString(
  payload: JsonRecord,
  keys: readonly string[],
): string | undefined {
  const containers = [
    payload,
    asRecord(payload.Data),
    asRecord(payload.data),
    asRecord(payload.obj),
    asRecord(payload.rmodel),
    asRecord(payload.rModel),
  ].filter((value): value is JsonRecord => value !== undefined);

  for (const container of containers) {
    for (const key of keys) {
      const value = container[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }

  return undefined;
}

export default async function GetBillProof(
  browserCookies: UpstreamCookies,
  year: string,
  semi: string,
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const buildURLParams = new URLSearchParams();
  buildURLParams.append("SemiYear", year);
  buildURLParams.append("Semistry", semi);
  buildURLParams.append("KindType", "01");
  buildURLParams.append("Steps", "-1");

  const client = createChromeFetch(browserCookies);
  const response = await client.post(
    endpoint(apiUrl, "/YMR_Stu/YMR/PayCertify_DownloadbyStu"),
    {
      data: buildURLParams.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`遠端伺服器錯誤（${response.status}）`);
  }

  const apiResponse = asRecord(await response.json());
  if (!apiResponse) throw new Error("遠端伺服器回傳了無效資料");

  if (apiResponse.OnNoLogin === true) throw new Error("伺服器已登出");
  if (apiResponse.IsOK !== true) {
    throw new Error(
      findString(apiResponse, ["Msg", "message", "Message"]) ??
        "遠端伺服器錯誤",
    );
  }

  const generatedFileName = findString(apiResponse, ["FileName"]);
  const id = generatedFileName
    ?.split(/[\\/]/)
    .at(-1)
    ?.replace(/\.pdf$/i, "");
  if (!id) throw new Error("校務系統回傳的繳費證明檔名無效");

  return {
    success: true,
    id,
    name: findString(apiResponse, ["FileDownloadName"]) ?? "繳費證明.pdf",
  };
}
