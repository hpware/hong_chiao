import type { PDFViewerConfig } from "@embedpdf/react-pdf-viewer";

export const LOCAL_EMBEDPDF_CONFIG = {
  wasmUrl: "/_appassets/vendor/embedpdf/pdfium.wasm",
  fontFallback: null,
  fonts: {
    ui: null,
    signature: null,
  },
  stamp: {
    defaultLibrary: false,
    manifests: [],
  },
} satisfies Pick<
  PDFViewerConfig,
  "fontFallback" | "fonts" | "stamp" | "wasmUrl"
>;
