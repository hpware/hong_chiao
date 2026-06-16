import { chromium } from "playwright";
import { type NextRequest, NextResponse } from "next/server";
import {
  USER_AGENT,
  endpoint,
  getRequestCookies,
  getHiddenInputValue,
} from "@/components/univeralComponents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginRequestBody = {
  username: string;
  password: string;
  captcha: string;
};

type CaptchaResponse = Array<unknown> & {
  1?: {
    ValidateCode?: string;
  };
};

export const POST = async (request: NextRequest) => {
  let statusCode = 500;
  const body = (await request.json()) as LoginRequestBody;

  if (!body.username || !body.password || !body.captcha) {
    return NextResponse.json(
      { error: '缺少 "username", "password" 或 "captcha" 的數值' },
      { status: 400 },
    );
  }

  const rawUrl = process.env.API_URL;

  if (!rawUrl) {
    return NextResponse.json(
      {
        error: "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
      },
      { status: 500 },
    );
  }
  // calc time
  const startTime = Date.now();
  const apiUrl = rawUrl;
  const origin = new URL(apiUrl).origin;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: USER_AGENT });

  try {
    // Only restore the session cookie so the captcha (ValidateCode) generated
    // during getCaptcha is found in the same session. Do NOT restore the stale
    // __RequestVerificationToken cookie: this route's own GET below establishes
    // a fresh anti-forgery pair, and re-injecting the old token at path "/"
    // produces a duplicate cookie that breaks anti-forgery validation.
    const requestCookies = getRequestCookies(request, new URL(apiUrl), [
      "ASP.NET_SessionId",
    ]);
    if (requestCookies.length > 0) {
      await context.addCookies(requestCookies);
    }

    const loginPage = await context.request.get(
      endpoint(apiUrl, "/B2KPortal/Login.aspx"),
    );
    const loginPageHTML = await loginPage.text();
    const getHiddenRequestVerificationToken = getHiddenInputValue(
      loginPageHTML,
      "__RequestVerificationToken",
    );

    const form = new URLSearchParams();
    form.append(
      "__RequestVerificationToken",
      getHiddenRequestVerificationToken,
    );
    form.append("LoginMode", "");
    form.append("LoginID", body.username);
    form.append("Password", body.password);
    form.append("ValidateCode", body.captcha);
    form.append("ClearLock", "0");

    const loginResponse = await context.request.post(
      endpoint(apiUrl, "/B2KPortal/Login.aspx"),
      {
        data: form.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const html = await loginResponse.text();
    const hdfText = getHiddenInputValue(html, "hdfMessage");

    const loginResult = {
      status: loginResponse.status(),
      statusText: loginResponse.statusText(),
      url: loginResponse.url(),
      hdfText,
      html,
      changePasswordNotice: loginResponse
        .url()
        .endsWith("/Account/ChangePassword"),
    };

    const sessionCookies = await context.cookies(origin);
    const duration = Date.now() - startTime;
    const nextResponse = NextResponse.json({
      success: loginResult.url !== endpoint(apiUrl, "/B2KPortal/Login.aspx"),
      remoteStatus: loginResult.status,
      statusText: loginResult.statusText,
      url: loginResult.url,
      hdfText: loginResult.hdfText,
      duration,
      changePasswordNotice: loginResult.changePasswordNotice,
    });
    for (const cookie of sessionCookies) {
      nextResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: request.nextUrl.protocol === "https:",
        sameSite:
          cookie.sameSite === "None"
            ? "none"
            : cookie.sameSite === "Strict"
              ? "strict"
              : "lax",
        path: "/",
        expires:
          cookie.expires && cookie.expires > 0
            ? new Date(cookie.expires * 1000)
            : undefined,
      });
    }

    return nextResponse;
  } finally {
    await context.close();
    await browser.close();
  }
};
