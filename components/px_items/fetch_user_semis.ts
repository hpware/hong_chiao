import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";

import { endpoint } from "@/components/univeralComponents";

export default async function FetchUserSemisters(
  browserCookies: UpstreamCookies,
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const client = createChromeFetch(browserCookies);
  const response = await client.get(
    endpoint(apiUrl, "/YMR_Stu/YMR/StuPayCertifyDownLoad"),
    {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );
  const html = await response.text();
  const parseAllUserSemis = [
    ...html.matchAll(/SemiYear="(\d+)"\s+Semi="(\d+)"/g),
  ]
    .map((match) => {
      return {
        year: match[1],
        semi: match[2],
      };
    })
    // Newest semester first. These are regex capture groups, so they are
    // strings — compare them as numbers rather than lexically.
    .sort(
      (a, b) =>
        Number(b.year) - Number(a.year) || Number(b.semi) - Number(a.semi),
    );
  return parseAllUserSemis;
}
