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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";

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
        <h1 className="text-xl font-semibold">學費</h1>
        <p className="text-sm text-muted-foreground">
          看到你之前的繳費紀錄 (資料僅提供參考)
        </p>
      </div>{" "}
      <div className="h-full justify-center p-2">
        <form className="md:flex-row flex-col flex h-fit w-fit">
          <Input
            className="rounded mx-2 w-fit max-w-20"
            type="number"
            value={requestType.year}
          />
          <NativeSelect
            className="mx-2"
            value={requestType.sem}
            onChange={(e) =>
              setRequestType({ ...requestType, sem: Number(e.target.value) })
            }
          >
            <NativeSelectOption value={1}>第一學期</NativeSelectOption>
            <NativeSelectOption value={2}>第二學期</NativeSelectOption>
          </NativeSelect>
        </form>
      </div>
    </div>
  );
}
