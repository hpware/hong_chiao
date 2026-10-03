"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PdfViewer } from "@/components/pdf-viewer";
import { useTheme } from "@/components/theme-provider";
import { useTRPC } from "@/trpc/client";

export default function Page() {
  return (
    <Suspense fallback={<p>正在取得繳費單 ID…</p>}>
      <Bill />
    </Suspense>
  );
}

function Bill() {
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");
  const semesterParam = searchParams.get("semester");
  const year = Number(yearParam);
  const semester = Number(semesterParam);
  const hasTerm = yearParam !== null || semesterParam !== null;
  const term: { year: number; semester: 1 | 2 } | undefined =
    Number.isSafeInteger(year) && year > 0 && (semester === 1 || semester === 2)
      ? { year, semester }
      : undefined;
  const invalidTerm = hasTerm && !term;
  const { theme } = useTheme();
  const trpc = useTRPC();
  const bill = useQuery(
    trpc.tuition.billDownloadId.queryOptions(invalidTerm ? skipToken : term, {
      staleTime: 30 * 60 * 1000,
      retry: 2,
    }),
  );
  const billId = invalidTerm ? undefined : bill.data?.id;
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
        {invalidTerm
          ? "無法辨識學年度或學期"
          : bill.isPending
            ? "正在取得繳費單 ID…"
            : null}
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
