import { NextResponse, type NextRequest } from "next/server";
import { authCookieNames } from "@/components/univeralComponents";

const publicPaths = new Set(["/auth/login", "/auth/ask"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.has(pathname)) {
    return NextResponse.next();
  }

  const hasAuthCookies = authCookieNames.every((cookieName) =>
    Boolean(request.cookies.get(cookieName)?.value),
  );

  if (!hasAuthCookies) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
