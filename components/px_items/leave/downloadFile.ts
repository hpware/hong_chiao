import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";

export default async function DownloadLeaveFile(
  browserCookies: UpstreamCookies,
  slug: string,
  requestKey: string,
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const buildFormData = new FormData();
  buildFormData.append("__RequestVerificationToken", requestKey);
  buildFormData.append("ShowFileName", slug);
  buildFormData.append("FileId", slug);
  buildFormData.append("PathTag", "SDLeave");

  const client = createChromeFetch(browserCookies);

  const response = await client.post(
    endpoint(apiUrl, "/YSD21/YSD21/DownLoad"),
    {
      data: buildFormData.toString(),
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );
  const contentDisposition = response.headers.get("content-disposition") || "";
  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);

  return {
    body: await response.arrayBuffer(),
    filename: filenameMatch ? filenameMatch[1] : "downloaded_file",
  };
}
