# Local PDF.js viewer patch

`viewer/pdfjs-viewer-element.js` is vendored from `pdfjs-viewer-element` 4.0.2.

Keep this compatibility patch when updating the bundle: `applyIframeHash` passes
view parameters to PDF.js instead of assigning `iframe.contentWindow.location.hash`.
Navigating `about:srcdoc` can replace the viewer with an invalid-address page in
Firefox-based browsers such as Zen. `history.replaceState` is also unsuitable:
Firefox rejects changes to the srcdoc URL with a `SecurityError`.

Before initialization finishes, set `PDFViewerApplication.initialBookmark`;
after the initial view is set, dispatch PDF.js's `hashchange` event. Call this
from `setupViewerApp` immediately after applying viewer options so the initial
zoom, page, and sidebar settings are ready before PDF.js opens the document.
