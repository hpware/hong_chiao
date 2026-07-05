import { type NextRequest, NextResponse } from "next/server";
import { getRequestCookies } from "@/components/univeralComponents";
import LoginFunction from "@/components/px_items/user/login";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginRequestBody = {
  username: string;
  password: string;
  captcha: string;
};

export const POST = async (request: NextRequest) => {
  let statusCode = 500;
  try {
    const body = (await request.json()) as LoginRequestBody;

    if (!body.username || !body.password || !body.captcha) {
      return NextResponse.json(
        { error: '缺少 "username", "password" 或 "captcha" 的數值' },
        { status: 400 },
      );
    }
    if (!process.env.API_URL) {
      return NextResponse.json(
        {
          error:
            "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
        },
        { status: 500 },
      );
    }
    const browserCookies = getRequestCookies(
      request,
      new URL(process.env.API_URL),
      ["ASP.NET_SessionId"],
    );

    const startTime = Date.now();
    const exec = await LoginFunction(
      body.username,
      body.password,
      body.captcha,
      browserCookies,
    );
    if (exec.error != null) {
      statusCode = 500;
      throw new Error(exec.error);
    }
    if (!exec.success) {
      statusCode = 400;
      throw new Error(exec.hdfText);
    }
    const nextResponse = NextResponse.json({
      success: exec.success,
      remoteStatus: exec.remoteStatus,
      statusText: exec.statusText,
      url: exec.url,
      hdfText: exec.hdfText,
      changePasswordNotice: exec.changePasswordNotice,
      duration: (Date.now() - startTime) / 1000,
    });
    for (const cookie of exec.setCookies) {
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
  } catch (e: any) {
    return Response.json(
      {
        success: false,
        remoteStatus: "",
        statusText: "",
        url: "",
        hdfText: e.message,
        changePasswordNotice: "",
        duration: "",
      },
      {
        status: statusCode,
      },
    );
  }
};
