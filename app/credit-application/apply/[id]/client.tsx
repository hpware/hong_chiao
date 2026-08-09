"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Table from "@/components/table";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarClock, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { rejects } from "node:assert";
import { getSemesterFromDate } from "@/lib/semester";
import Link from "next/link";
import { useTRPC } from "@/trpc/client";
import ErrorNotFound from "@/components/error";

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
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const {
    data: getApplyDetails,
    error,
    failureReason,
  } = useQuery(
    trpc.creditApplication.details.queryOptions(
      {
        id: id,
      },
      {
        retry: false,
      },
    ),
  );

  const { data } = useQuery(
    trpc.creditApplication.yourData.queryOptions(
      { id: id },
      { enabled: !error },
    ),
  );

  if (error) {
    return (
      <div className="pt-2">
        <div className="p-2 z-50">
          <h1 className="text-xl font-semibold">
            <Link
              href="../"
              className="underline hover:text-blue-500 dark:hover:text-blue-200"
            >
              獎學金
            </Link>{" "}
            / 不存在的物件
          </h1>
          <p className="text-sm text-muted-foreground">申請獎學金。</p>
        </div>
        <div className="relative flex items-center justify-center h-full">
          <ErrorNotFound text={failureReason?.message ?? "此物件不存在"} />
        </div>
        <div className="h-full justify-center p-2"></div>
      </div>
    );
  }

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
          / {getApplyDetails?.data[0].Title ?? "載入中..."}
        </h1>
        <p className="text-sm text-muted-foreground">申請獎學金。</p>
      </div>
      <form className="flex flex-col space-x-4 p-2">
        {getApplyDetails?.data.length > 0 ? (
          <div>
            <span className="flex flex-row">
              <CalendarClock />
              &nbsp;申請範圍: {getApplyDetails?.data[0].StartDate}~
              {getApplyDetails?.data[0].EndDate}
            </span>
          </div>
        ) : null}
        {JSON.stringify(getApplyDetails)}
      </form>
      <div className="h-full justify-center p-2"></div>
    </div>
  );
}
