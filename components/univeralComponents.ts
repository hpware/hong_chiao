import { NextRequest } from "next/server";

export const authCookieNames = [
  "ASP.NET_SessionId",
  "ssClientIP",
  "ssAID",
  "ssSchID",
  "ssSchName",
  "ssLoginID",
  "ssLoginName",
] as const;

export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

export function endpoint(apiUrl: string, path: string): string {
  return new URL(path, apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`).toString();
}

export async function getBrowserCookies(
  request: NextRequest,
  statusCode: number,
  apiURL: URL,
) {
  const data = authCookieNames.map((cookieName) => {
    const value = request.cookies.get(cookieName)?.value;

    if (value === undefined) {
      statusCode = 401;
      throw new Error(`No session found: missing ${cookieName}`);
    }
    console.log(
      process.env.NODE_ENV === "production" && apiURL.protocol === "https:"
        ? "https://"
        : "http://",
    );
    return {
      name: cookieName,
      value,
      domain: apiURL.hostname,
      path: "/",
      secure:
        process.env.NODE_ENV === "production" && apiURL.protocol === "https:",
      sameSite: "Lax" as const,
    };
  });
  return data;
}
