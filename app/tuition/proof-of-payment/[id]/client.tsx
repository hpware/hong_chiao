"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PdfViewer } from "@/components/pdf-viewer";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export default function ProofViewer({ id, name }: { id: string; name: string }) {
  const { theme } = useTheme();
  const pdfUrl = `/api/downloads/tuition_bill/${encodeURIComponent(id)}?${new URLSearchParams(
    { type: "Temp", fileName: name },
  )}`;

  return (
    <main className="space-y-4 p-3 md:p-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-xl font-semibold">繳費證明</h1>
          <p className="max-w-xl truncate text-sm text-muted-foreground">
            {name}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/tuition/proof-of-payment">
            <ArrowLeft />
            重新選擇
          </Link>
        </Button>
      </header>

      <PdfViewer
        className="h-[calc(100vh-10.5rem)] min-h-96 overflow-hidden rounded-xl border"
        fileName={name}
        src={pdfUrl}
        theme={theme}
      />
    </main>
  );
}
