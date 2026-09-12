"use client";

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

export function PdfViewer({ className, fileName, src, theme }: PdfViewerProps) {
  const [loadError, setLoadError] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);

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

  if (loadError) {
    return (
      <p className="text-sm text-destructive">
        無法載入 PDF 檢視器，請重新整理後再試。
      </p>
    );
  }

  if (!viewerReady) {
    return <p className="text-sm text-muted-foreground">正在載入 PDF…</p>;
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
      src={src}
      standard-font-data-url="/_appassets/vendor/pdfjs/standard_fonts/"
      viewer-css-theme={theme === "dark" ? "DARK" : "LIGHT"}
      wasm-url="/_appassets/vendor/pdfjs/wasm/"
      zoom="page-width"
    />
  );
}
