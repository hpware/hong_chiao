"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Table from "@/components/table";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { rejects } from "node:assert";
import { getSemesterFromDate } from "@/lib/semester";
import Link from "next/link";

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

export default function Client({ id }: { id: string }) {
  const [requestType, setRequestType] = useState<{
    year: number;
    sem: number;
    editing: boolean;
    reviewing: boolean;
    passed: boolean;
    rejected: boolean;
  }>({
    ...getSemesterFromDate(),
    editing: true,
    reviewing: true,
    passed: true,
    rejected: true,
  });
  const queryClient = useQueryClient();
  const { data } = useQuery<LeaveResponse>({
    queryKey: ["leaveData"],
    queryFn: async () => {
      const response = await fetch(
        `/api/leave?year=${requestType.year}&semi=${requestType.sem}${requestType.editing ? "&editing=true" : ""}${requestType.reviewing ? "&reviewing=true" : ""}${requestType.passed ? "&passed=true" : ""}${requestType.rejected ? "&rejected=true" : ""}`,
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
        <h1 className="text-xl font-semibold">
          <Link
            href="../"
            className="underline hover:text-blue-500 dark:hover:text-blue-200"
          >
            獎學金
          </Link>{" "}
          / {id}
        </h1>
        <p className="text-sm text-muted-foreground">申請獎學金。</p>
      </div>{" "}
      <form className="flex items-center space-x-4 p-2"></form>
      <div className="h-full justify-center p-2"></div>
    </div>
  );
}
