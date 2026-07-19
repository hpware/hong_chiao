"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Legend,
  Pie,
  PieChart,
  Tooltip,
  type ChartConfig,
} from "@/components/dither-kit";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { getSemesterFromDate } from "@/lib/semester";
import { useTRPC } from "@/trpc/client";

function parseAmount(value: string | undefined) {
  const normalized = value?.replaceAll(",", "").replace(/[^\d.-]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export default function Page() {
  const [requestType, setRequestType] = useState<{
    year: number;
    sem: number;
  }>(getSemesterFromDate);
  const trpc = useTRPC();
  const { data, isPending, isError } = useQuery(
    trpc.tuition.get.queryOptions({
      year: requestType.year,
      semistry: requestType.sem,
    }),
  );

  const details = data?.data?.details;
  const duePaidChart = useMemo(() => {
    const due = Math.max(0, parseAmount(details?.due));
    const paid = Math.max(0, parseAmount(details?.paid));
    const collected = due > 0 ? Math.min(paid, due) : paid;
    const remaining = Math.max(0, due - paid);

    return [
      { name: "已收", value: collected },
      { name: "待收", value: remaining },
    ].filter((item) => item.value > 0);
  }, [details?.due, details?.paid]);

  const detailedChart = useMemo(() => {
    const discounts = Math.max(0, parseAmount(details?.discounts));
    const requiredToPay = Math.max(0, parseAmount(details?.due));
    return [
      { name: "抵免", value: discounts },
      { name: "待繳", value: requiredToPay },
    ].filter((item) => item.value > 0);
  }, [details?.due, details?.paid]);

  return (
    <main className="space-y-5 p-4">
      <header>
        <h1 className="text-xl font-semibold">學費</h1>
        <p className="text-sm text-muted-foreground">
          查看你的繳費資訊（資料僅供參考）
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="grid gap-1 text-sm" htmlFor="tuition-year">
          學年
          <Input
            id="tuition-year"
            className="w-24 tabular-nums"
            type="number"
            value={requestType.year}
            onChange={(event) =>
              setRequestType((current) => ({
                ...current,
                year: Number(event.target.value),
              }))
            }
          />
        </label>
        <label className="grid gap-1 text-sm" htmlFor="tuition-semester">
          學期
          <NativeSelect
            id="tuition-semester"
            value={requestType.sem}
            onChange={(event) =>
              setRequestType((current) => ({
                ...current,
                sem: Number(event.target.value),
              }))
            }
          >
            <NativeSelectOption value={1}>第一學期</NativeSelectOption>
            <NativeSelectOption value={2}>第二學期</NativeSelectOption>
          </NativeSelect>
        </label>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">載入中...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">無法取得學費資訊。</p>
      ) : details ? (
        <div className="space-y-4 flex">
          <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
            <section className="rounded-xl border bg-card p-4">
              <div className="mb-2">
                <h2 className="font-medium">繳費進度</h2>
                <p className="text-xs text-muted-foreground">
                  已收金額與尚待繳納金額
                </p>
              </div>
              {detailedChart.length > 0 ? (
                <div className="h-64">
                  <PieChart
                    data={detailedChart}
                    /*      { name: "抵免", value: discounts },
                        { name: "待繳", value: requiredToPay }, */
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
          </div>
          <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
            <section className="rounded-xl border bg-card p-4">
              <div className="mb-2">
                <h2 className="font-medium">繳費進度</h2>
                <p className="text-xs text-muted-foreground">
                  已收金額與尚待繳納金額
                </p>
              </div>
              {duePaidChart.length > 0 ? (
                <div className="h-64">
                  <PieChart
                    data={duePaidChart}
                    config={{
                      已收: { label: "已收", color: "green" },
                      待收: { label: "待收", color: "orange" },
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
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {data?.message ?? "查無學費資訊。"}
        </p>
      )}
    </main>
  );
}
