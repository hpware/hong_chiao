"use client";

import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { toast } from "sonner";
import { Legend, Pie, PieChart, Tooltip } from "@/components/dither-kit";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";
import type { inferRouterOutputs } from "@trpc/server";

// getBatches resolves with an async generator, so the router output is the
// generator itself — unwrap it to the type of a single yielded semester.
type TuitionBatch = inferRouterOutputs<AppRouter>["tuition"]["getBatches"];
type TuitionEntry =
  TuitionBatch extends AsyncGenerator<infer TYield> ? TYield : never;

function parseAmount(value: string | undefined) {
  const normalized = value?.replaceAll(",", "").replace(/[^\d.-]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

const semesterNames: Record<number, string> = { 1: "第一學期", 2: "第二學期" };

function formatSemester(year: number, semistry: number) {
  return `${year} 學年度 ${semesterNames[semistry] ?? `第 ${semistry} 學期`}`;
}

const SemesterCard = memo(function SemesterCard(props: {
  year: number;
  semistry: number;
  entry: TuitionEntry | undefined;
  isStreaming: boolean;
  isGeneratingProof: boolean;
  getProofOfPayment: (year: number, semistry: number) => void;
}) {
  const {
    year,
    semistry,
    entry,
    isStreaming,
    isGeneratingProof,
    getProofOfPayment,
  } = props;
  const details = entry?.details;
  // Amounts arrive as scraped strings ("12,345"), so compare them as numbers.
  const discounts = Math.max(0, parseAmount(details?.discounts));
  const requiredToPay = Math.max(0, parseAmount(details?.due));
  const paid = Math.max(0, parseAmount(details?.paid));
  const refundAdjustment = parseAmount(details?.refund);
  const balance = requiredToPay - paid - refundAdjustment;
  const outstanding = Math.max(0, balance);
  const refundable = Math.max(0, -balance);
  const detailedChart = [
    { name: "抵免", value: discounts },
    { name: "已繳", value: paid },
    { name: "待繳", value: outstanding },
    { name: "應退", value: refundable },
  ].filter((item) => item.value > 0);

  return (
    <section className="flex h-full flex-col gap-4 rounded-xl border bg-card p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <h2 className="font-medium">{formatSemester(year, semistry)}</h2>
          <p className="text-xs text-muted-foreground">
            抵免、已繳與補退金額
          </p>
          {details ? (
            <p
              className={`text-xs ${balance === 0 ? "text-muted-foreground" : balance > 0 ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}`}
            >
              {balance === 0
                ? "已付清"
                : balance > 0
                  ? `尚欠 ${outstanding.toLocaleString("zh-TW")}`
                  : `應退 ${refundable.toLocaleString("zh-TW")}`}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isGeneratingProof}
          onClick={() => getProofOfPayment(year, semistry)}
        >
          <Receipt aria-hidden="true" />
          繳費證明
        </Button>
      </header>
      {!entry && isStreaming ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          載入中...
        </div>
      ) : !details ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          查無學雜費資訊
        </div>
      ) : detailedChart.length > 0 ? (
        <div className="h-64">
          <PieChart
            data={detailedChart}
            config={{
              抵免: { label: "抵免", color: "blue" },
              已繳: { label: "已繳", color: "green" },
              待繳: { label: "待繳", color: "orange" },
              應退: { label: "應退", color: "purple" },
            }}
            dataKey="value"
            nameKey="name"
            innerRadius={0.55}
            bloom="low"
          >
            <Pie variant="gradient" />
            <Legend />
            <Tooltip
              valueFormatter={(value) => value.toLocaleString("zh-TW")}
            />
          </PieChart>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          沒有可繪製的金額資料
        </div>
      )}
    </section>
  );
});

export default function Page() {
  const router = useRouter();
  const trpc = useTRPC();
  const {
    data: participatingSemis,
    isPending: isLoadingParticipatingSemis,
    isError: isErrorParticipatingSemis,
  } = useQuery(trpc.user.participatingSemis.queryOptions());

  const {
    mutateAsync: generateProof,
    isPending: isGeneratingProof,
    variables: proofVariables,
  } = useMutation(trpc.tuition.proofDownloadId.mutationOptions());
  const getProofOfPayment = useCallback(
    (year: number, semistry: number) => {
      if (semistry !== 1 && semistry !== 2) {
        toast.error("無法辨識學期");
        return;
      }

      toast.promise(
        async () => {
          const result = await generateProof({
            year,
            semester: semistry,
          });
          const query = new URLSearchParams({ name: result.name });
          router.push(
            `/tuition/proof-of-payment/${encodeURIComponent(result.id)}?${query}`,
          );
        },
        {
          loading: "正在準備繳費證明…",
          success: "繳費證明已準備完成",
          error: (error) =>
            error instanceof Error
              ? error.message
              : "無法產生繳費證明，請稍後再試。",
        },
      );
    },
    [generateProof, router],
  );

  const semesters = participatingSemis?.data;
  const { data, isFetching, isError } = useQuery(
    trpc.tuition.getBatches.queryOptions(
      semesters
        ? semesters.map((i) => ({
            year: Number(i.year),
            semistry: Number(i.semi),
          }))
        : skipToken,
    ),
  );
  // Drive the list off the requested semesters, not off `data` — that way every
  // row is on screen immediately and fills in as its chunk streams back.
  const rows = (semesters ?? [])
    .map((i) => {
      const year = Number(i.year);
      const semistry = Number(i.semi);
      return {
        year,
        semistry,
        entry: data?.find(
          (entry) => entry.year === year && entry.semistry === semistry,
        ),
      };
    })
    .sort((a, b) => b.year - a.year || b.semistry - a.semistry);

  return (
    <main className="space-y-5 p-4">
      <header>
        <h1 className="text-xl font-semibold">學費</h1>
        <p className="text-sm text-muted-foreground">
          查看你的繳費資訊（資料僅供參考）
        </p>
      </header>

      {isLoadingParticipatingSemis ? (
        <p className="text-sm text-muted-foreground">載入中...</p>
      ) : isError || isErrorParticipatingSemis ? (
        <p className="text-sm text-destructive">無法取得學費資訊。</p>
      ) : rows.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <SemesterCard
              key={`${row.year}-${row.semistry}`}
              year={row.year}
              semistry={row.semistry}
              entry={row.entry}
              isStreaming={isFetching && !row.entry}
              isGeneratingProof={
                isGeneratingProof &&
                proofVariables?.year === row.year &&
                proofVariables.semester === row.semistry
              }
              getProofOfPayment={getProofOfPayment}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">查無學費資訊。</p>
      )}
    </main>
  );
}
