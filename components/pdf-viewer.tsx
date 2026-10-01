"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type PdfViewerProps = {
  className: string;
  fileName: string;
  src: string;
  theme: "light" | "dark";
};

const PDFJS_VIEWER_SCRIPT =
  "/_appassets/vendor/pdfjs/viewer/pdfjs-viewer-element.js";

let pdfJsViewerPromise: Promise<void> | undefined;

function loadPdfJsViewer(): Promise<void> {
  if (customElements.get("pdfjs-viewer-element")) {
    return Promise.resolve();
  }

  pdfJsViewerPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = PDFJS_VIEWER_SCRIPT;
    script.addEventListener(
      "load",
      () => {
        void customElements
          .whenDefined("pdfjs-viewer-element")
          .then(() => resolve());
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => {
        pdfJsViewerPromise = undefined;
        script.remove();
        reject(new Error("Unable to load the PDF.js viewer."));
      },
      { once: true },
    );
    document.head.append(script);
  });

  return pdfJsViewerPromise;
}

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
  const [loadError, setLoadError] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string>();
  const [viewerReady, setViewerReady] = useState(false);
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
      if (!response.ok || !isPdf(buffer)) {
        throw new Error(getErrorMessage(buffer));
      }

      return new Blob([buffer], { type: "application/pdf" });
    },
    retry: false,
  });

  useEffect(() => {
    let active = true;

    void loadPdfJsViewer().then(
      () => {
        if (active) setViewerReady(true);
      },
      () => {
        if (active) setLoadError(true);
      },
    );

    return () => {
      active = false;
    };
  }, []);

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

  if (loadError) {
    return (
      <p className="text-sm text-destructive">
        無法載入 PDF 檢視器，請重新整理後再試。
      </p>
    );
  }

  if (pdf.isPending || !objectUrl) {
    return <p className="text-sm text-muted-foreground">正在下載 PDF…</p>;
  }

  if (!viewerReady) {
    return <p className="text-sm text-muted-foreground">正在載入檢視器…</p>;
  }

  return (
    <pdfjs-viewer-element
      c-map-url="/_appassets/vendor/pdfjs/cmaps/"
      className={className}
      iframe-title={`${fileName} PDF 檢視器`}
      icc-url="/_appassets/vendor/pdfjs/iccs/"
      image-resources-path="/_appassets/vendor/pdfjs/viewer/images/"
      locale="zh-TW"
      locale-src-template="/_appassets/vendor/pdfjs/l10n/{locale}/viewer.ftl"
      pagemode="none"
      sandbox-bundle-src="/_appassets/vendor/pdfjs/pdf.sandbox.mjs"
      src={objectUrl}
      standard-font-data-url="/_appassets/vendor/pdfjs/standard_fonts/"
      viewer-css-theme={theme === "dark" ? "DARK" : "LIGHT"}
      wasm-url="/_appassets/vendor/pdfjs/wasm/"
      zoom="page-width"
    />
  );
}
