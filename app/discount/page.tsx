"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Table from "@/components/table";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

type LeaveRow = {
  Objid?: number | string;
  LeaveTitle?: string;
  ApplyDate?: string;
  ClassDate?: string;
  Days?: number | string;
  leaveDays?: number;
};

type LeaveResponse = {
  data?: LeaveRow[];
};

export default function Page() {
  const queryClient = useQueryClient();
  const { data } = useQuery<LeaveResponse>({
    queryKey: ["leaveData"],
    queryFn: async () => {
      const convertYear = await fetch(
        "/api/leave/convertDateToSemiYear?year&month",
      );
      const convertYearData = await convertYear.json();
      const response = await fetch(
        `/api/leave?year=${convertYearData.rocYear}&sem=${convertYearData.semistry}`,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch leave data");
      }
      return response.json();
    },
  });
  const memoedData = useMemo(() => {
    const leaveRows = Array.isArray(data?.data) ? data.data : [];

    return leaveRows.flatMap((item) => {
      const leaveDays = Number(item.Days ?? item.leaveDays);
      if (!Number.isFinite(leaveDays) || leaveDays <= 0) {
        return [];
      }
      return {
        ...item,
        leaveDays,
      };
    });
  }, [data]);
  return (
    <div className="pt-2">
      <div className="p-2">
        <h1 className="text-xl font-semibold">抵免申請</h1>
        <p className="text-sm text-muted-foreground">功能尚未完成。</p>
      </div>{" "}
      <div className="h-full justify-center p-2">
        <Table
          columns={[
            { header: "請假類別", accessorKey: "LeaveTitle" },
            { header: "上課日期", accessorKey: "ClassDate" },
            { header: "送出日期", accessorKey: "ApplyDate" },
            { header: "請假天數", accessorKey: "leaveDays" },
            {
              header: "",
              id: "Objid",
              cell: ({ row }) => {
                return (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        toast.promise(
                          async () => {
                            const objId = Number(row.original.Objid);
                            const req = await fetch("/api/leave", {
                              method: "DELETE",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                id: objId,
                              }),
                            });
                            const res = await req.json();
                            if (!res.success) {
                              throw new Error(res.error || "刪除失敗");
                            }
                            queryClient.invalidateQueries({
                              queryKey: ["leaveData"],
                            });
                            return;
                          },
                          {
                            success: "刪除成功!",
                            loading: "刪除中...",
                            error: (e) => `刪除失敗 原因: ${e.message}`,
                          },
                        );
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                );
              },
            },
          ]}
          data={memoedData || []}
        />
      </div>
    </div>
  );
}
