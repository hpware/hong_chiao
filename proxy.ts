import { NextResponse, type NextRequest } from "next/server";
import { authCookieNames } from "@/components/univeralComponents";

const publicPaths = new Set(["/auth/login", "/auth/ask"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block Internet Explorer before doing auth checks
  const userAgent = request.headers.get("user-agent") ?? "";
  const isIE = /MSIE|Trident\//i.test(userAgent);

  if (isIE) {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>IE 已不支援!</title>
</head>
<body>
  <h1 style="background:white;color:black;">
    Internet Explorer 已經不支援!<br>
    請升級您的瀏覽器。<br>
    建議使用
    <a href="https://www.mozilla.org/firefox/" style="color:blue;">
      Firefox
    </a>
    瀏覽器
  </h1>
</body>
</html>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  // Public routes don't require auth
  if (publicPaths.has(pathname)) {
    return NextResponse.next();
  }

  const hasAuthCookies = authCookieNames.every((cookieName) =>
    Boolean(request.cookies.get(cookieName)?.value),
  );

  if (!hasAuthCookies) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_appassets|favicon.ico|.*\\..*).*)",
  ],
};
