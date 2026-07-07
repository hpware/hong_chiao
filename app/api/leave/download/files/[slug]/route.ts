import { type NextRequest, NextResponse } from "next/server";
import { getBrowserCookies } from "@/components/univeralComponents";
import DownloadLeaveFile from "@/components/px_items/leave/downloadFile";

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
    const url = new URL(apiUrl);
    statusCode = 401;
    const browserCookies = await getBrowserCookies(request, statusCode, url);
    statusCode = 500;
    //get vars
    const params = request.nextUrl.searchParams;
    const requestKey = params.get("key");
    if (!requestKey) {
      statusCode = 400;
      throw new Error("需要 file, key 的變數。");
    }

    const download = await DownloadLeaveFile(browserCookies, slug, requestKey);

    return new Response(new Uint8Array(download.body), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${download.filename}"`,
      },
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
