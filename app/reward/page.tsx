// can't do this yet, since I dont have the data to make this work.
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Table from "@/components/table";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { getSemesterFromDate } from "@/lib/semester";
import { useTRPC } from "@/trpc/client";

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
  const [requestType, setRequestType] = useState<{
    year: number;
    sem: number;
  }>(getSemesterFromDate);
  const [isDeleting, setIsDeleting] = useState<string[]>([]);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteLeave = useMutation(trpc.leave.delete.mutationOptions());
  const { data } = useQuery(
    trpc.leave.list.queryOptions({
      year: requestType.year,
      semi: requestType.sem,
    }),
  );
  const memoedData = useMemo(() => {
    const leaveData = data as LeaveResponse | undefined;
    const leaveRows = Array.isArray(leaveData?.data) ? leaveData.data : [];

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
        <h1 className="text-xl font-semibold">獎懲</h1>
        <p className="text-sm text-muted-foreground">
          功能尚未完成。(學校尚未正式啟用前沒辦法看到 Schema :\)
        </p>
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
                      size="sm"
                      onClick={() => {
                        setIsDeleting((prev) => [
                          ...prev,
                          String(row.original.Objid),
                        ]);
                        toast.promise(
                          async () => {
                            const objId = Number(row.original.Objid);
                            const res = await deleteLeave.mutateAsync({
                              id: objId,
                            });
                            if (!res.success) {
                              throw new Error("刪除失敗");
                            }
                            queryClient.invalidateQueries({
                              queryKey: trpc.leave.list.queryKey({
                                year: requestType.year,
                                semi: requestType.sem,
                              }),
                            });
                            setIsDeleting((prev) => [
                              ...prev.filter((id) => id !== row.original.Objid),
                            ]);
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
