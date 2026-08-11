"use client";

import { PDFViewer } from "@embedpdf/react-pdf-viewer";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { useTRPC, useTRPCClient } from "@/trpc/client";

type PdfFile = { url: string; name: string };

export default function Page() {
  const { theme } = useTheme();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const bill = useQuery(
    trpc.tuition.billDownloadId.queryOptions(undefined, {
      staleTime: 30 * 60 * 1000,
      retry: 2,
    }),
  );
  const [file, setFile] = useState<PdfFile>();
  const [loading, setLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string>();

  useEffect(() => {
    return () => {
      if (file) URL.revokeObjectURL(file.url);
    };
  }, [file]);

  async function loadPdf() {
    if (!bill.data?.id) return;

    setLoading(true);
    setDownloadError(undefined);

    try {
      const stream = await trpcClient.tuition.billDownload.query({
        type: "TuitionBill",
        id: bill.data.id,
      });
      const chunks: Uint8Array[] = [];

      for await (const chunk of stream) chunks.push(chunk);

      const size = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
      const bytes = new Uint8Array(size);
      let offset = 0;

      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }

      const blob = new Blob([bytes.buffer], { type: "application/pdf" });
      setFile({
        url: URL.createObjectURL(blob),
        name: bill.data.name ?? "繳費單.pdf",
      });
      toast.success("繳費單已準備");
    } catch (error) {
      const message = error instanceof Error ? error.message : "無法取得繳費單";
      setDownloadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-5 p-4">
      <header>
        <h1 className="text-xl font-semibold">繳費單</h1>
        <p className="text-sm text-muted-foreground">下載與預覽繳費單</p>
      </header>

      <span>
        {bill.isPending
          ? "正在取得繳費單 ID…"
          : loading
            ? "正在串流繳費單…"
            : "載入繳費單"}
      </span>

      {(bill.error || downloadError) && (
        <p className="text-sm text-destructive">
          {downloadError ?? bill.error?.message}
        </p>
      )}

      {file && (
        <PDFViewer
          className="h-[calc(100vh-20vh)] md:h-[calc(100vh-13vh)]"
          config={{
            src: file.url,
            disabledCategories: [
              "annotation",
              "form",
              "redaction",
              "panel",
              "insert",
            ],
            theme: { preference: theme },
            export: { defaultFileName: file.name },
            i18n: { defaultLocale: "zh-TW", fallbackLocale: "en" },
          }}
        />
      )}
    </main>
  );
}
