"use client";

import { PDFViewer } from "@embedpdf/react-pdf-viewer";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LOCAL_EMBEDPDF_CONFIG } from "@/lib/embedpdf";

type PdfViewerProps = {
  className: string;
  fileName: string;
  src: string;
  theme: "light" | "dark";
};

function getErrorMessage(buffer: ArrayBuffer): string {
  const text = new TextDecoder().decode(buffer).trim();
  if (!text) return "伺服器沒有回傳 PDF 檔案。";
  if (/^<!doctype html|^<html/i.test(text)) {
    return "下載端點回傳了網頁而不是 PDF，請重新登入後再試。";
  }

  try {
    const payload: unknown = JSON.parse(text);
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
    ) {
      return payload.error;
    }
  } catch {
    // The upstream may return a plain-text error instead of JSON.
  }

  return text.slice(0, 300);
}

function isPdf(buffer: ArrayBuffer): boolean {
  const headerLength = Math.min(buffer.byteLength, 1024);
  const header = new TextDecoder("latin1").decode(
    new Uint8Array(buffer, 0, headerLength),
  );
  return header.includes("%PDF-");
}

export function PdfViewer({ className, fileName, src, theme }: PdfViewerProps) {
  const pdf = useQuery({
    queryKey: ["pdf-file", src],
    queryFn: async ({ signal }) => {
      const response = await fetch(src, {
        cache: "no-store",
        credentials: "same-origin",
        signal,
      });
      if (
        response.redirected &&
        new URL(response.url).pathname === "/auth/login"
      ) {
        throw new Error("登入狀態已失效，請重新登入後再試。");
      }
      const buffer = await response.arrayBuffer();

      if (!response.ok) {
        throw new Error(getErrorMessage(buffer));
      }
      if (!isPdf(buffer)) {
        throw new Error(getErrorMessage(buffer));
      }

      return new Blob([buffer], { type: "application/pdf" });
    },
    retry: false,
  });
  const [objectUrl, setObjectUrl] = useState<string>();

  useEffect(() => {
    if (!pdf.data) return;

    const url = URL.createObjectURL(pdf.data);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pdf.data]);

  if (pdf.error) {
    return <p className="text-sm text-destructive">{pdf.error.message}</p>;
  }

  if (pdf.isPending || !objectUrl) {
    return <p className="text-sm text-muted-foreground">正在下載 PDF…</p>;
  }

  return (
    <PDFViewer
      key={objectUrl}
      className={className}
      config={{
        ...LOCAL_EMBEDPDF_CONFIG,
        src: objectUrl,
        disabledCategories: [
          "annotation",
          "form",
          "redaction",
          "panel",
          "insert",
        ],
        theme: { preference: theme },
        export: { defaultFileName: fileName },
        i18n: { defaultLocale: "zh-TW", fallbackLocale: "en" },
      }}
    />
  );
}
