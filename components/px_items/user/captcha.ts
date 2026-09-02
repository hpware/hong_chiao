import { NextResponse } from "next/server";
import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { endpoint } from "@/components/univeralComponents";

type CaptchaResponse = Array<unknown> & {
  1?: {
    ValidateCode?: string;
    ImgSrc?: string;
  };
};
export default async function GetCaptchaImage(
  existingSessionCookie: UpstreamCookies,
) {
  const rawUrl = process.env.API_URL;

  if (!rawUrl) {
    throw new Error("API_URL is not set.");
  }
  const apiUrl = rawUrl;
  const client = createChromeFetch(existingSessionCookie);
  try {
    const warmUpResponse = await client.get(
      endpoint(apiUrl, "/B2KPortal/Login.aspx"),
    );
    await client.discard(warmUpResponse);

    const captchaResponse = await client.get(
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
        remoteStatus: captchaResponse.status,
        url: captchaResponse.url,
        bodyPreview: captchaText.slice(0, 200),
        image: null,
        setCookies: [],
      };
    }
    const browserCookies = client.cookies();
    return {
      success: true,
      error: "",
      remoteStatus: captchaResponse.status,
      url: captchaResponse.url,
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
  }
}
