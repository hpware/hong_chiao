"use client";
import { useQuery } from "@tanstack/react-query";
import Table from "@/components/table";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { getSemesterFromDate } from "@/lib/semester";

import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { toast } from "sonner";
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

  const { data: basicData } = useQuery({
    queryKey: ["basicData", requestType.year, requestType.sem],
    queryFn: async () => {
      const response = await fetch(
        `/api/leave/getBasicInfo?year=${requestType.year}&semi=${requestType.sem}`,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch leave data");
      }
      return response.json();
    },
  });
  const { data: tableData } = useQuery({
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

  const uploadFiles = () => {
    toast.promise(async () => {
      throw new Error(
        "上傳失敗，你的 Session 可能已被遠端伺服器限制，建議重新登入後再上傳。",
      );
    }, {});
  };

  return (
    <div className="pt-2">
      <div className="p-2">
        <h1 className="text-xl font-semibold">新假單</h1>
        <p className="text-sm text-muted-foreground">送出新假單 :)</p>
      </div>
      <div className="h-full justify-center p-2">
        <div className="flex w-full flex-col md:flex-row space-y-2 md:space-x-2">
          <div>
            <label className="text-sm">假別</label>
            <NativeSelect>
              {basicData?.typesOfLeave.map(
                (type: { id: string; name: string; warnindDay: string }) => (
                  <NativeSelectOption key={type.id} value={type.id}>
                    {type.name}
                  </NativeSelectOption>
                ),
              ) || []}
            </NativeSelect>
          </div>
          <div>
            <label className="text-sm">事由</label>
            <Input type="text" placeholder="請輸入請假事由" />
          </div>
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
                accessorKey: "day",
              },
              {
                header: "節次",
                accessorKey: "table",
                cell: ({ row }) => {
                  const periods = row.original.table as {
                    classIndex: string;
                    sendData: string | null;
                    show: boolean;
                    selected: boolean;
                  }[];
                  return (
                    <div className="flex flex-wrap gap-1">
                      {periods
                        .filter((period) => period.show)
                        .map((period) => (
                          <span
                            key={period.classIndex}
                            className={`rounded px-2 py-1 text-sm ${
                              period.selected
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary"
                            }`}
                          >
                            第{period.classIndex}節
                          </span>
                        ))}
                    </div>
                  );
                },
              },
            ]}
            data={tableData?.renderItems || []}
          />
        </form>
      </div>
    </div>
  );
}
