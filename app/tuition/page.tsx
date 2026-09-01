"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Legend, Pie, PieChart, Tooltip } from "@/components/dither-kit";
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

function SemesterCard(props: {
  year: number;
  semistry: number;
  entry: TuitionEntry | undefined;
  isStreaming: boolean;
}) {
  const { year, semistry, entry, isStreaming } = props;
  const details = entry?.details;
  // Amounts arrive as scraped strings ("12,345"), so compare them as numbers.
  const outstanding = parseAmount(details?.due) - parseAmount(details?.paid);

  const detailedChart = useMemo(() => {
    const discounts = Math.max(0, parseAmount(details?.discounts));
    const requiredToPay = Math.max(0, parseAmount(details?.due));
    return [
      { name: "抵免", value: discounts },
      { name: "待繳", value: requiredToPay },
    ].filter((item) => item.value > 0);
  }, [details?.discounts, details?.due]);

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-2">
        <h2 className="font-medium">{formatSemester(year, semistry)}</h2>
        <p className="text-xs text-muted-foreground">已抵免與尚待繳納金額</p>
        {details ? (
          <p
            className={`text-xs ${outstanding == 0 ? "text-muted-foreground" : "text-red-700 dark:text-red-300"}`}
          >
            {outstanding == 0
              ? "已付清"
              : `尚欠 ${outstanding.toLocaleString("zh-TW")}`}
          </p>
        ) : null}
      </div>
      {/* Rows render before their chunk arrives, so an entry we haven't been
          handed yet is still loading rather than empty. */}
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
              待繳: { label: "待繳", color: "orange" },
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
}

export default function Page() {
  const trpc = useTRPC();
  const {
    data: participatingSemis,
    isPending: isLoadingParticipatingSemis,
    isError: isErrorParticipatingSemis,
  } = useQuery(trpc.user.participatingSemis.queryOptions());

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
    // Newest semester first.
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
              isStreaming={isFetching}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">查無學費資訊。</p>
      )}
    </main>
  );
}
