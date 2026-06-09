// this API path is just here for now, in the near future this will be used to get the captcha image for the login page.
import { chromium } from "playwright";
import { type NextRequest, NextResponse } from "next/server";
import { USER_AGENT, endpoint } from "@/components/univeralComponents";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginRequestBody = {
  username: string;
  password: string;
};

type CaptchaResponse = Array<unknown> & {
  1?: {
    ValidateCode?: string;
    ImgSrc?: string;
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

export const GET = async (request: NextRequest) => {
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

    await context.request.get(endpoint(apiUrl, "/B2KPortal/Login.aspx"));

    const captchaResponse = await context.request.get(
      endpoint(apiUrl, "/B2KPortal/Account/CreateValidateCode"),
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );
    const captchaText = await captchaResponse.text();
    let captchaJson: CaptchaResponse;

    try {
      captchaJson = JSON.parse(captchaText) as CaptchaResponse;
    } catch {
      return NextResponse.json(
        {
          error: "Captcha endpoint did not return JSON",
          remoteStatus: captchaResponse.status(),
          url: captchaResponse.url(),
          bodyPreview: captchaText.slice(0, 200),
        },
        { status: 502 },
      );
    }

    const duration = Date.now() - startTime;
    const nextResponse = NextResponse.json(
      {
        image: captchaJson[1]?.ImgSrc || null,
        duration,
      },
      { status: 200 },
    );

    const browserCookies = await context.cookies();
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
