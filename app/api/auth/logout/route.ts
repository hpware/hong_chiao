import { chromium, type Browser, type BrowserContext } from "playwright";
import { type NextRequest, NextResponse } from "next/server";
import {
  authCookieNames,
  USER_AGENT,
  endpoint,
} from "@/components/univeralComponents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToLogin(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL),
  );

  for (const cookieName of authCookieNames) {
    response.cookies.delete(cookieName);
  }

  response.cookies.delete("ssLoginForLDAP");

  return response;
}

export const GET = async (request: NextRequest) => {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    const rawUrl = process.env.API_URL;

    if (!rawUrl) {
      return NextResponse.json(
        { error: "Missing API_URL environment variable" },
        { status: 500 },
      );
    }

    const apiUrl = rawUrl;
    const url = new URL(apiUrl);
    const browserCookies = authCookieNames.map((cookieName) => {
      const value = request.cookies.get(cookieName)?.value;

      if (value === undefined) {
        throw new Error(`No session found: missing ${cookieName}`);
      }

      return {
        name: cookieName,
        value,
        domain: url.hostname,
        path: "/",
        secure: url.protocol === "https:",
        sameSite: "Lax" as const,
      };
    });

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    await context.request.post(
      endpoint(apiUrl, "/YB2K/B2KPortal/B2KPortal/ReUrlContent"),
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );

    const logoutResult = await context.request.post(
      endpoint(apiUrl, "/YB2K/B2KPortal/B2KPortal/Logout"),
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );

    if (!logoutResult.ok()) {
      throw new Error(`Logout failed with status ${logoutResult.status()}`);
    }
    return redirectToLogin(request);
  } catch (error: unknown) {
    console.error(error);
    return redirectToLogin(request);
  } finally {
    await context?.close();
    await browser?.close();
  }
};
