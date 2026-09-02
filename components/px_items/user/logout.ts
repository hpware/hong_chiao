import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";

export default async function LogoutRemote(browserCookies: UpstreamCookies) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const client = createChromeFetch(browserCookies);

  const redirectResponse = await client.post(
    endpoint(apiUrl, "/B2KPortal/B2KPortal/ReUrlContent"),
    {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  await client.discard(redirectResponse);

  const logoutResult = await client.post(
    endpoint(apiUrl, "/B2KPortal/B2KPortal/Logout"),
    {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );

  if (!logoutResult.ok) {
    await client.discard(logoutResult);
    throw new Error(`登出失敗，原因： ${logoutResult.status}`);
  }
  await client.discard(logoutResult);
}
