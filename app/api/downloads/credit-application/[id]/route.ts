import DownloadPDFFromCreditApplicaiton from "@/components/px_items/credit-application/download";
import {
  getBrowserCookies,
  MissingSessionError,
} from "@/components/univeralComponents";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const downloadParamsSchema = z.object({
  id: z.string(),
  fileName: z.optional(z.string()),
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
      fileName: request.nextUrl.searchParams.get("fileName") ?? undefined,
    });
    if (!parsedParams.success) {
      return Response.json({ error: "下載參數無效。" }, { status: 400 });
    }

    // check auth
    const browserCookies = await getBrowserCookies(
      request,
      401,
      new URL(rawUrl),
    );
    const upstream = await DownloadPDFFromCreditApplicaiton(
      browserCookies,
      `${parsedParams.data.id}`,
      request.signal,
    );
    const fileName =
      request.nextUrl.searchParams.get("fileName")?.trim() ||
      parsedParams.data.id;
    const headers = new Headers();
    headers.set(
      "Content-Type",
      upstream.headers.get("content-type") ?? "application/octet-stream",
    );
    headers.set(
      "Content-Disposition",
      `inline; filename="document"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
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
    return Response.json(
      { error: message },
      { status: error instanceof MissingSessionError ? 401 : 502 },
    );
  }
};
