import GetBillDownload from "@/components/px_items/bill/download";
import { getBrowserCookies } from "@/components/univeralComponents";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const downloadParamsSchema = z.object({
  id: z.uuid(),
  type: z.enum(["TuitionBill", "Temp"]),
});

export const GET = async (
  request: NextRequest,
  websiteContext: { params: Promise<{ id: string }> },
) => {
  try {
    const rawUrl = process.env.API_URL;
    if (!rawUrl) {
      return Response.json(
        { error: "伺服器管理員缺少 API_URL 的環境變數設定。" },
        { status: 503 },
      );
    }

    const { id } = await websiteContext.params;
    const parsedParams = downloadParamsSchema.safeParse({
      id,
      type: request.nextUrl.searchParams.get("type") ?? "TuitionBill",
    });
    if (!parsedParams.success) {
      return Response.json({ error: "下載參數無效。" }, { status: 400 });
    }

    const browserCookies = await getBrowserCookies(
      request,
      401,
      new URL(rawUrl),
    );
    const upstream = await GetBillDownload(
      browserCookies,
      parsedParams.data.type,
      `${parsedParams.data.id}.pdf`,
      request.signal,
    );
    const fileName =
      request.nextUrl.searchParams.get("fileName")?.trim() || "繳費單.pdf";
    const headers = new Headers();
    headers.set(
      "Content-Type",
      upstream.headers.get("content-type") ?? "application/pdf",
    );
    headers.set(
      "Content-Disposition",
      `inline; filename="document.pdf"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    headers.set("Cache-Control", "private, no-store");

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "下載檔案失敗。";
    return Response.json({ error: message }, { status: 502 });
  }
};
