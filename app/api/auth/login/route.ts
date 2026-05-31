import { chromium } from "playwright";
import { type NextRequest, NextResponse } from "next/server";
import { USER_AGENT, endpoint } from "@/components/univeralComponents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginRequestBody = {
  username: string;
  password: string;
};

type CaptchaResponse = Array<unknown> & {
  1?: {
    ValidateCode?: string;
  };
};

function getHiddenInputValue(html: string, inputId: string) {
  const inputPattern = new RegExp(
    `<input\\b(?=[^>]*\\bid=["']${inputId}["'])[^>]*>`,
    "i",
  );
  const inputMatch = html.match(inputPattern);
  const valueMatch = inputMatch?.[0].match(/\bvalue=["']([^"']*)["']/i);

  return valueMatch?.[1] ?? "";
}

export const POST = async (request: NextRequest) => {
  const body = (await request.json()) as LoginRequestBody;

  if (!body.username || !body.password) {
    return NextResponse.json(
      { error: "Missing username or password" },
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
    const existingSessionId = request.cookies.get("ASP.NET_SessionId")?.value;

    if (existingSessionId) {
      const url = new URL(apiUrl);
      await context.addCookies([
        {
          name: "ASP.NET_SessionId",
          value: existingSessionId,
          domain: url.hostname,
          path: "/",
          httpOnly: true,
          secure: url.protocol === "https:",
          sameSite: "Lax",
        },
      ]);
    }

    await context.request.get(endpoint(apiUrl, "/YB2K/B2KPortal/Login.aspx"));

    const captchaResponse = await context.request.get(
      endpoint(apiUrl, "/YB2K/B2KPortal/Account/CreateValidateCode"),
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );
    const captchaJson = (await captchaResponse.json()) as CaptchaResponse;

    const validateCode = captchaJson[1]?.ValidateCode;

    if (!validateCode) {
      return NextResponse.json(
        {
          error: "Could not read ValidateCode from captcha response",
          captcha: captchaJson,
        },
        { status: 502 },
      );
    }

    const form = new URLSearchParams();
    form.append("LoginMode", "");
    form.append("LoginID", body.username);
    form.append("Password", body.password);
    form.append("ValidateCode", validateCode);
    form.append("ClearLock", "0");

    const loginResponse = await context.request.post(
      endpoint(apiUrl, "/YB2K/B2KPortal/Login.aspx"),
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
    };

    const browserCookies = await context.cookies(origin);
    const duration = Date.now() - startTime;
    const nextResponse = NextResponse.json({
      success:
        loginResult.url === endpoint(apiUrl, "/YB2K/B2KPortal/") ? true : false,
      remoteStatus: loginResult.status,
      statusText: loginResult.statusText,
      url: loginResult.url,
      hdfText: loginResult.hdfText,
      duration,
    });
    for (const cookie of browserCookies) {
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
