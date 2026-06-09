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
  const base = new URL(apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`);
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  return new URL(normalizedPath, base).toString();
}

export async function getBrowserCookies(
  request: NextRequest,
  statusCode: number,
  apiURL: URL,
) {
  return authCookieNames.map((cookieName) => {
    const value = request.cookies.get(cookieName)?.value;

    if (value === undefined) {
      statusCode = 401;
      throw new Error(`No session found: missing ${cookieName}`);
    }

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
}

export function getRequestCookies(
  request: NextRequest,
  apiURL: URL,
  cookieNames?: readonly string[],
) {
  const requestCookies = cookieNames
    ? cookieNames.flatMap((cookieName) => {
        const value = request.cookies.get(cookieName)?.value;
        return value === undefined ? [] : [{ name: cookieName, value }];
      })
    : request.cookies.getAll().map(({ name, value }) => ({ name, value }));

  return requestCookies.map(({ name, value }) => ({
    name,
    value,
    domain: apiURL.hostname,
    path: "/",
    secure:
      process.env.NODE_ENV === "production" && apiURL.protocol === "https:",
    sameSite: "Lax" as const,
  }));
}
