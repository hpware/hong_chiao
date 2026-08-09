"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { PDFViewer } from "@embedpdf/react-pdf-viewer";
import { useTheme } from "@/components/theme-provider";

const BILL_QUERY_TOAST_ID = "tuition-bill-query";

function parseAmount(value: string | undefined) {
  const normalized = value?.replaceAll(",", "").replace(/[^\d.-]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export default function Page() {
  const trpc = useTRPC();
  const { theme, toggleTheme } = useTheme();
  const { data, error, isPending, isError } = useQuery(
    trpc.tuition.billDownloadId.queryOptions(undefined, {
      staleTime: 30 * 60 * 1000,
      retry: 2,
    }),
  );

  useEffect(() => {
    if (isPending) {
      toast.loading("正在取得繳費單...", { id: BILL_QUERY_TOAST_ID });
      return;
    }

    if (isError) {
      toast.error(error?.message ?? "無法取得繳費單", {
        id: BILL_QUERY_TOAST_ID,
      });
      return;
    }

    if (data) {
      toast.success("繳費單已準備", { id: BILL_QUERY_TOAST_ID });
    }
  }, [data, error, isError, isPending]);

  useEffect(
    () => () => {
      toast.dismiss(BILL_QUERY_TOAST_ID);
    },
    [],
  );

  return (
    <main className="space-y-5 p-4">
      <header>
        <h1 className="text-xl font-semibold">繳費單</h1>
        <p className="text-sm text-muted-foreground">下載與提供繳費單</p>
      </header>
      <div className="">
        {isPending ? (
          <span>Loading...</span>
        ) : (
          <PDFViewer
            className="h-[calc(100vh-20vh)] md:h-[calc(100vh-13vh)]"
            config={{
              src: `/api/downloads/tuition_bill/${data?.id}`,
              disabledCategories: [
                "annotation",
                "form",
                "redaction",
                "panel",
                "insert",
              ],
              theme: {
                preference: theme,
              },
              export: {
                defaultFileName: data?.name ?? "檔案.pdf",
              },
              i18n: {
                defaultLocale: "zh-TW",
                fallbackLocale: "en",
              },
            }}
          />
        )}
      </div>
    </main>
  );
}
