"use client";
import { useQuery } from "@tanstack/react-query";
import Table from "@/components/table";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { getSemesterFromDate } from "@/lib/semester";

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSemesterFromDateInput(dateString: string) {
  const date = dateString ? new Date(`${dateString}T00:00:00`) : new Date();

  return getSemesterFromDate(date);
}

function getInitialRequestType() {
  const today = formatDateInputValue(new Date());

  return {
    ...getSemesterFromDateInput(today),
    startDate: today,
    endDate: today,
  };
}

export default function Page() {
  const [requestType, setRequestType] = useState<{
    year: number;
    sem: number;
    startDate: string;
    endDate: string;
  }>(getInitialRequestType);

  const { data } = useQuery({
    queryKey: ["leaveDateData", requestType],
    queryFn: async () => {
      const response = await fetch(
        `/api/leave/getClassDetails?start=${requestType.startDate}&end=${requestType.endDate}&year=${requestType.year}&semi=${requestType.sem}`,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch leave data");
      }
      return response.json();
    },
  });
  return (
    <div className="pt-2">
      <div className="p-2">
        <h1 className="text-xl font-semibold">新假單</h1>
        <p className="text-sm text-muted-foreground">送出新假單 :)</p>
      </div>
      <div className="h-full justify-center p-2">
        <div className="flex w-full flex-col md:flex-row space-y-2">
          <div>
            <label className="text-sm">開始日期</label>
            <Input
              type="date"
              value={requestType.startDate}
              onChange={(e) => {
                const startDate = e.target.value;

                setRequestType((prev) => ({
                  ...prev,
                  ...getSemesterFromDateInput(startDate),
                  startDate,
                }));
              }}
            />
          </div>
          <div>
            <label className="text-sm">結束日期</label>
            <Input
              type="date"
              value={requestType.endDate}
              onChange={(e) => {
                setRequestType((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }));
              }}
            />
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Table
            columns={[
              {
                header: "日期",
                accessorKey: "date",
              },
              {
                header: "星期",
                accessorKey: "dayOfWeek",
              },
              {
                header: "節次",
                accessorKey: "periods",
                cell: ({ row }) => {
                  const periods = row.original.periods;
                  return (
                    <div className="flex flex-wrap gap-1">
                      {periods.map((period: string, index: number) => (
                        <span
                          key={index}
                          className="rounded bg-secondary px-2 py-1 text-sm"
                        >
                          {period}
                        </span>
                      ))}
                    </div>
                  );
                },
              },
            ]}
            data={data?.data || []}
          />
        </form>
      </div>
    </div>
  );
}
