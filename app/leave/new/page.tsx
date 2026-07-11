"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import Table from "@/components/table";
import { memo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { getSemesterFromDate } from "@/lib/semester";
import { useTRPC } from "@/trpc/client";

import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

type Period = {
  classIndex: string | number;
  sendData: string | null;
  show: boolean;
  selected: boolean;
};

const PeriodButton = memo(function PeriodButton({
  period,
  onToggle,
}: {
  period: Period;
  onToggle: (period: Period, selected: boolean) => void;
}) {
  const [selected, setSelected] = useState(period.selected);

  return (
    <button
      type="button"
      onClick={() => {
        setSelected((current) => {
          const nextSelected = !current;

          onToggle(period, nextSelected);
          return nextSelected;
        });
      }}
      className={`rounded px-2 py-1 text-sm ${
        selected ? "bg-primary text-primary-foreground" : "bg-secondary"
      }`}
    >
      第{period.classIndex}節
    </button>
  );
});

export default function Page() {
  const trpc = useTRPC();
  const [requestType, setRequestType] = useState<{
    year: number;
    sem: number;
    startDate: string;
    endDate: string;
  }>(getInitialRequestType);
  const selectedPeriodsRef = useRef(new Map<string, string>());
  const createLeave = useMutation(trpc.leave.create.mutationOptions());

  const { data: basicData } = useQuery(
    trpc.leave.basicInfo.queryOptions({
      year: requestType.year,
      semi: requestType.sem,
    }),
  );
  const { data: tableData } = useQuery(
    trpc.leave.classDetails.queryOptions({
      start: requestType.startDate,
      end: requestType.endDate,
      year: requestType.year,
      semi: requestType.sem,
    }),
  );

  const uploadFiles = () => {
    toast.promise(
      async () => {
        throw new Error(
          "上傳失敗，你的 Session 可能已被遠端伺服器限制，建議重新登入後再上傳。",
        );
      },
      {
        success: "上傳成功！",
        loading: "上傳中...",
        error: (err) => err.message || "上傳失敗",
      },
    );
  };

  return (
    <>
      {/*<Dialog defaultOpen={true}>
        <DialogContent>
          <DialogTitle className="text-xl">注意!</DialogTitle>
          <DialogDescription className="text-md">
            上傳附件功能有時候學校伺服器端沒有儲存的時候，建議重新登入，並在上傳一次
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button>關閉</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
      <div className="pt-2">
        <div className="p-2">
          <h1 className="text-xl font-semibold">新假單</h1>
          <p className="text-sm text-muted-foreground">送出新假單 :)</p>
        </div>
        <div className="h-full justify-center p-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.promise(
                async () => {
                  const formData = new FormData(e.currentTarget);
                  const reason = formData.get("reason")?.toString() || "";
                  const typeOfLeave =
                    formData.get("typeOfLeave")?.toString() || "";

                  if (!reason) {
                    throw new Error("請輸入請假事由");
                  }
                  if (!typeOfLeave) {
                    throw new Error("請選擇假別");
                  }
                  if (selectedPeriodsRef.current.size === 0) {
                    throw new Error("請至少選擇一個節次");
                  }

                  await createLeave.mutateAsync({
                      year: requestType.year,
                      sem: requestType.sem,
                      reason,
                      typeOfLeave,
                      periods: Array.from(
                        selectedPeriodsRef.current.values(),
                      ).map((value) => value),
                      startDate: requestType.startDate,
                      endDate: requestType.endDate,
                  });
                },
                {
                  success: "假單提交成功！",
                  loading: "提交中...",
                  error: (err) => err.message || "假單提交失敗",
                },
              );
            }}
          >
            <div className="flex w-full flex-col md:flex-row space-y-2 md:space-x-2">
              <div>
                <label className="text-sm">假別</label>
                <NativeSelect name="typeOfLeave" defaultValue="">
                  {basicData?.typesOfLeave.map(
                    (type: {
                      id: string;
                      name: string;
                      warnindDay: string;
                    }) => (
                      <NativeSelectOption key={type.id} value={type.id}>
                        {type.name}
                      </NativeSelectOption>
                    ),
                  ) || []}
                </NativeSelect>
              </div>
              <div>
                <label className="text-sm">事由</label>
                <Input type="text" placeholder="請輸入請假事由" name="reason" />
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
                    const periods = row.original.table as Period[];
                    return (
                      <div className="flex flex-wrap gap-1">
                        {periods
                          .filter((period) => period.show)
                          .map((period) => (
                            <PeriodButton
                              key={`${row.original.date}:${period.classIndex}:${period.sendData ?? ""}`}
                              period={period}
                              onToggle={(nextPeriod, selected) => {
                                const key = `${row.original.date}:${nextPeriod.classIndex}`;

                                if (selected) {
                                  selectedPeriodsRef.current.set(
                                    key,
                                    `${row.original.date}|${nextPeriod.classIndex}0|${nextPeriod.sendData}`,
                                  );
                                } else {
                                  selectedPeriodsRef.current.delete(key);
                                }
                              }}
                            />
                          ))}
                      </div>
                    );
                  },
                },
              ]}
              data={tableData?.renderItems || []}
            />
            <div className="flex justify-end mt-4 space-x-2">
              {/*              <Button
                type="button"
                className="hover:cursor-pointer"
                onClick={uploadFiles}
              >
                上傳附件
              </Button> */}
              <Button type="submit">送出</Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
