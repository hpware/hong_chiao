"use client";

import { PDFViewer } from "@embedpdf/react-pdf-viewer";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import { LOCAL_EMBEDPDF_CONFIG } from "@/lib/embedpdf";

type PdfFile = { blob: Blob; name: string };

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
  const billId = bill.data?.id;
  const billName = bill.data?.name ?? "繳費單.pdf";
  const file = useQuery({
    queryKey: ["tuition-bill-pdf", billId, billName],
    enabled: Boolean(billId),
    queryFn: async ({ signal }) => {
      if (!billId) throw new Error("找不到繳費單 ID");

      const stream = await trpcClient.tuition.billDownload.query(
        { type: "TuitionBill", id: billId },
        { signal },
      );
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
      return { blob, name: billName } satisfies PdfFile;
    },
  });
  const [pdfUrl, setPdfUrl] = useState<string>();

  useEffect(() => {
    if (!file.data) return;

    const url = URL.createObjectURL(file.data.blob);
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file.data]);

  const loading = Boolean(billId && file.isPending);

  return (
    <main className="space-y-5 p-2">
      <header>
        <h1 className="text-xl font-semibold">繳費單</h1>
        <p className="text-sm text-muted-foreground">下載與預覽繳費單</p>
      </header>

      <span>
        {bill.isPending
          ? "正在取得繳費單 ID…"
          : loading
            ? "正在串流繳費單…"
            : null}
      </span>

      {(bill.error || file.error) && (
        <p className="text-sm text-destructive">
          {file.error?.message ?? bill.error?.message}
        </p>
      )}

      {file.data && pdfUrl && (
        <PDFViewer
          className="h-[calc(100vh-20vh)] md:h-[calc(100vh-13vh)]"
          config={{
            ...LOCAL_EMBEDPDF_CONFIG,
            src: pdfUrl,
            disabledCategories: [
              "annotation",
              "form",
              "redaction",
              "panel",
              "insert",
            ],
            theme: { preference: theme },
            export: { defaultFileName: file.data.name },
            i18n: { defaultLocale: "zh-TW", fallbackLocale: "en" },
          }}
        />
      )}
    </main>
  );
}
