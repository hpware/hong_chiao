import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(
  new URL("../public/_appassets/vendor/pdfjs/viewer/pdfjs-viewer-element.js", import.meta.url),
  "utf8",
);

type ViewerApp = {
  isInitialViewSet: boolean;
  initialBookmark?: string;
  eventBus: { dispatch: (name: string, payload: { hash: string }) => void };
};
type Viewer = {
  iframe: {
    contentWindow: { PDFViewerApplication?: ViewerApp; readonly location?: never };
  };
  applyIframeHash: () => Promise<void>;
  setupViewerApp: () => Promise<unknown>;
  onViewerAppCreated: () => Promise<ViewerApp>;
  applyViewerOptions: () => void;
  applyViewerTheme: () => void;
  applyQueuedRuntimeStyles: () => void;
};

function createViewer(app?: ViewerApp): Viewer {
  const ViewerElement = runInNewContext(
    source.replaceAll("import.meta.url", '"https://example.test/viewer.js"')
      .replace(/export\{[^}]+\};?\s*$/, "o;"),
    {
      URL,
      HTMLElement: class {
        attachShadow() { return { innerHTML: "" }; }
        getAttribute(name: string) {
          return ({ zoom: "page-width", pagemode: "none", locale: "zh-TW" } as Record<string, string>)[name];
        }
      },
      window: { customElements: { get: () => true } },
    },
  ) as new () => Viewer;
  const viewer = new ViewerElement();
  viewer.iframe = {
    contentWindow: {
      PDFViewerApplication: app,
      // A srcdoc frame must never be navigated to apply view parameters.
      get location(): never { throw new Error("Unexpected iframe navigation"); },
    },
  };
  return viewer;
}

const expectedHash = "page=&zoom=page-width&pagemode=none&search=&phrase=&locale=zh-TW";

test("PDF viewer waits for the application without navigating srcdoc", async () => {
  await createViewer().applyIframeHash();
});

test("PDF viewer applies initial view settings during setup without navigating srcdoc", async () => {
  const app: ViewerApp = {
    isInitialViewSet: false,
    eventBus: { dispatch() { assert.fail("Initial settings must be queued"); } },
  };
  const viewer = createViewer(app);
  viewer.onViewerAppCreated = async () => app;
  viewer.applyViewerOptions = () => {};
  viewer.applyViewerTheme = () => {};
  viewer.applyQueuedRuntimeStyles = () => {};
  await viewer.setupViewerApp();
  assert.equal(app.initialBookmark, expectedHash);
});

test("PDF viewer applies runtime view settings through the PDF.js event bus", async () => {
  const events: string[] = [];
  const viewer = createViewer({
    isInitialViewSet: true,
    eventBus: { dispatch(name, payload) {
      events.push(name);
      assert.equal(payload.hash, expectedHash);
    } },
  });
  await viewer.applyIframeHash();
  assert.deepEqual(events, ["hashchange"]);
});
