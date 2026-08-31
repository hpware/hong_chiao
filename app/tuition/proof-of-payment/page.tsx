"use client";

import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  FileCheck2,
  FileText,
  LoaderCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSemesterFromDate } from "@/lib/semester";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

export default function Page() {
  const router = useRouter();
  const trpc = useTRPC();
  const [semester, setSemester] = useState(getSemesterFromDate);
  const proof = useMutation(trpc.tuition.proofDownloadId.mutationOptions());

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    proof.mutate(
      {
        year: semester.year,
        semester: semester.sem as 1 | 2,
      },
      {
        onSuccess: (result) => {
          const query = new URLSearchParams({ name: result.name });
          router.push(
            `/tuition/proof-of-payment/${encodeURIComponent(result.id)}?${query}`,
          );
        },
      },
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-7 p-4 py-7 md:p-8 md:py-10">
      <header className="flex items-start gap-3.5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card text-primary shadow-xs">
          <FileCheck2 className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            繳費證明
          </h1>
          <p className="text-sm text-muted-foreground">
            選擇學期，即可預覽並下載學校核發的 PDF 證明。
          </p>
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="border-b px-5 py-4 md:px-6">
          <h2 className="font-medium">選擇繳費學期</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            預設為目前學期，你也可以查詢過往紀錄。
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 p-5 md:grid-cols-2 md:p-6">
            <label
              className="grid content-start gap-2 text-sm font-medium"
              htmlFor="proof-year"
            >
              學年度
              <div className="relative">
                <Input
                  id="proof-year"
                  type="number"
                  min={1}
                  required
                  className="h-12 pr-16 text-base tabular-nums"
                  value={semester.year}
                  onChange={(event) =>
                    setSemester((current) => ({
                      ...current,
                      year: Number(event.target.value),
                    }))
                  }
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                  民國年
                </span>
              </div>
            </label>

            <fieldset className="grid content-start gap-2">
              <legend className="text-sm font-medium">學期</legend>
              <div className="grid h-12 grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                {[1, 2].map((value) => {
                  const selected = semester.sem === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      disabled={proof.isPending}
                      className={cn(
                        "rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
                        selected
                          ? "bg-card text-foreground shadow-xs ring-1 ring-border/70"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() =>
                        setSemester((current) => ({
                          ...current,
                          sem: value,
                        }))
                      }
                    >
                      第{value === 1 ? "一" : "二"}學期
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {proof.error ? (
              <div
                role="alert"
                className="flex gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive md:col-span-2"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>
                  {proof.error.message || "無法產生繳費證明，請稍後再試。"}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 border-t bg-muted/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <FileText className="size-4 shrink-0" aria-hidden="true" />
              <span>
                民國 {semester.year} 學年度・第
                {semester.sem === 1 ? "一" : "二"}學期
              </span>
            </div>

            <Button
              className="w-full sm:w-auto"
              size="lg"
              disabled={proof.isPending}
            >
              {proof.isPending ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  正在準備
                </>
              ) : (
                <>
                  開啟繳費證明
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
