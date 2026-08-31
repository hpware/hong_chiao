import { type NextRequest, NextResponse } from "next/server";
import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import {
  endpoint,
  getRequestCookies,
  getHiddenInputValue,
} from "@/components/univeralComponents";

type LoginRequestBody = {
  username: string;
  password: string;
  captcha: string;
};

export default async function LoginFunction(
  username: string,
  password: string,
  captcha: string,
  browserCookies: UpstreamCookies,
) {
  const rawUrl = process.env.API_URL;

  if (!rawUrl) {
    throw new Error("API_URL is not set.");
  }
  const apiUrl = rawUrl;
  const origin = new URL(apiUrl).origin;
  const client = createChromeFetch(browserCookies);

  try {
    const loginPage = await client.get(
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
    form.append("LoginID", username);
    form.append("Password", password);
    form.append("ValidateCode", captcha);
    form.append("ClearLock", "0");

    const loginResponse = await client.post(
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
    const sessionCookies = client.cookies(origin);
    return {
      success: loginResponse.url !== endpoint(apiUrl, "/B2KPortal/Login.aspx"),
      remoteStatus: loginResponse.status,
      statusText: loginResponse.statusText,
      url: loginResponse.url,
      hdfText,
      changePasswordNotice: loginResponse.url.endsWith(
        "/Account/ChangePassword",
      ),
      setCookies: sessionCookies,
      error: hdfText,
    };
  } catch (e: any) {
    return {
      success: false,
      remoteStatus: "",
      statusText: "",
      url: "",
      hdfText: "",
      changePasswordNotice: "",
      setCookies: [],
      error: e.message,
    };
  }
}
