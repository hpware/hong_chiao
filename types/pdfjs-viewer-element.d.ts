import type { PdfjsViewerElement } from "pdfjs-viewer-element";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type PdfjsViewerAttributes = DetailedHTMLProps<
  HTMLAttributes<PdfjsViewerElement>,
  PdfjsViewerElement
> & {
  "c-map-url"?: string;
  "iframe-title"?: string;
  "icc-url"?: string;
  "image-resources-path"?: string;
  locale?: string;
  "locale-src-template"?: string;
  pagemode?: "attachments" | "bookmarks" | "layers" | "none" | "thumbs";
  "sandbox-bundle-src"?: string;
  src?: string;
  "standard-font-data-url"?: string;
  "viewer-css-theme"?: "AUTOMATIC" | "DARK" | "LIGHT";
  "wasm-url"?: string;
  zoom?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "pdfjs-viewer-element": PdfjsViewerAttributes;
    }
  }
}
