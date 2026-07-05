import { chromium } from "playwright";
import { NextResponse } from "next/server";
import {
  USER_AGENT,
  endpoint,
  type BrowserCookieType,
} from "@/components/univeralComponents";

type CaptchaResponse = Array<unknown> & {
  1?: {
    ValidateCode?: string;
    ImgSrc?: string;
  };
};
export default async function GetCaptchaImage(
  existingSessionCookie: BrowserCookieType,
) {
  const rawUrl = process.env.API_URL;

  if (!rawUrl) {
    throw new Error("API_URL is not set.");
  }
  9;
  const apiUrl = rawUrl;
  const origin = new URL(apiUrl).origin;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: USER_AGENT });
  try {
    await context.addCookies(existingSessionCookie);
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
      return {
        success: false,
        error: "Captcha endpoint did not return JSON",
        remoteStatus: captchaResponse.status(),
        url: captchaResponse.url(),
        bodyPreview: captchaText.slice(0, 200),
        image: null,
        setCookies: [],
      };
    }
    const browserCookies = await context.cookies();
    return {
      success: true,
      error: "",
      remoteStatus: captchaResponse.status(),
      url: captchaResponse.url(),
      bodyPreview: captchaText.slice(0, 200),
      image: captchaJson[1]?.ImgSrc || null,
      setCookies: browserCookies,
    };
  } catch (e: any) {
    return {
      success: false,
      error: e.message,
      remoteStatus: "",
      url: "",
      bodyPreview: "",
      image: null,
      setCookies: [],
    };
  } finally {
    await context.close();
    await browser.close();
  }
}
