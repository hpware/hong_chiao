import { type NextRequest, NextResponse } from "next/server";
import { endpoint } from "@/components/univeralComponents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (
  request: NextRequest,
  websiteContext: { params: Promise<{ slug: string }> },
) => {
  const { slug } = await websiteContext.params;
  let statusCode = 500;

  try {
    const rawUrl = process.env.API_URL;
    if (!rawUrl) {
      return NextResponse.json(
        {
          error:
            "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
        },
        { status: 500 },
      );
    }
    const apiUrl = rawUrl;
    statusCode = 500;
    const params = request.nextUrl.searchParams;
    const paramFileName = params.get("fileName");

    const response = await fetch(
      endpoint(rawUrl, `/YSCStu/Files/temp/${slug}`),
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `下載檔案失敗，伺服器回應狀態碼: ${response.status}，請稍後再試。`,
        },
        { status: response.status },
      );
    }
    if (!response.body) {
      return NextResponse.json(
        {
          error: "檔案串流不存在，請稍後再試。",
        },
        { status: 500 },
      );
    }
    const contentType =
      response.headers.get("content-type") ?? "application/octet-stream";
    const contentLength = response.headers.get("content-length");
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(paramFileName || slug)}"`,
    );
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch (e: any) {
    console.error(e);
    return Response.json(
      {
        error: e.message,
      },
      {
        status: statusCode,
      },
    );
  }
};
