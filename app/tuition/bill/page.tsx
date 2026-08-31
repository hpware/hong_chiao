"use client";

import { useQuery } from "@tanstack/react-query";
import { PdfViewer } from "@/components/pdf-viewer";
import { useTheme } from "@/components/theme-provider";
import { useTRPC } from "@/trpc/client";

export default function Page() {
  const { theme } = useTheme();
  const trpc = useTRPC();
  const bill = useQuery(
    trpc.tuition.billDownloadId.queryOptions(undefined, {
      staleTime: 30 * 60 * 1000,
      retry: 2,
    }),
  );
  const billId = bill.data?.id;
  const billName = bill.data?.name ?? "繳費單.pdf";
  const pdfUrl = billId
    ? `/api/downloads/tuition_bill/${encodeURIComponent(billId)}?${new URLSearchParams(
        { type: "TuitionBill", fileName: billName },
      )}`
    : undefined;

  return (
    <main className="space-y-5 p-2">
      <header>
        <h1 className="text-xl font-semibold">繳費單</h1>
        <p className="text-sm text-muted-foreground">下載與預覽繳費單</p>
      </header>

      <span>
        {bill.isPending ? "正在取得繳費單 ID…" : null}
      </span>

      {bill.error && (
        <p className="text-sm text-destructive">
          {bill.error.message}
        </p>
      )}

      {pdfUrl && (
        <PdfViewer
          className="h-[calc(100vh-20vh)] md:h-[calc(100vh-13vh)]"
          fileName={billName}
          src={pdfUrl}
          theme={theme}
        />
      )}
    </main>
  );
}
