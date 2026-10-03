import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type CreditApplicationDocument = {
  No: string;
  Code: string;
  Choose: string;
  FileTitle: string;
  ShowFileName: string;
  SPath: string;
  DPath: string;
};

export default function DocList({
  documents,
}: {
  documents: readonly CreditApplicationDocument[];
}) {
  if (documents.length === 0) return null;

  return (
    <section aria-labelledby="credit-application-documents" className="space-y-3">
      <h2 id="credit-application-documents" className="text-base font-semibold">
        申請文件
      </h2>
      <ul className="divide-y rounded-md border">
        {documents.map((document) => {
          const fileTitle = document.FileTitle.trim();
          const fileName = document.ShowFileName.trim() || fileTitle;
          const downloadUrl = fileTitle
            ? `/api/downloads/credit-application/${encodeURIComponent(fileTitle)}?${new URLSearchParams({ fileName })}`
            : null;

          return (
            <li
              key={document.No}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <FileText
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {document.No}. {document.Code}
                    </span>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {document.Choose}
                    </span>
                  </div>
                  <p className="break-words text-xs text-muted-foreground">
                    {downloadUrl ? fileName : "未提供下載檔案"}
                  </p>
                </div>
              </div>
              {downloadUrl ? (
                <Button asChild size="sm" variant="outline" className="self-start sm:self-auto">
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`下載${document.Code}：${fileName}（另開視窗）`}
                  >
                    <Download className="size-3.5" aria-hidden="true" />
                    下載檔案
                  </a>
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
