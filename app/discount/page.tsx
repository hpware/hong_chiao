"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Table from "@/components/table";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { rejects } from "node:assert";
import { getSemesterFromDate } from "@/lib/semester";
import DOMPurify from "dompurify";

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
  const {
    data: checkIfFeatureIsEnabled,
    isLoading: checkIfFeatureIsEnabledLoading,
  } = useQuery<{
    enabled: boolean;
  }>({
    queryKey: ["checkFeatureEnabled"],
    queryFn: async () => {
      const response = await fetch(
        "/api/home/features?year=114&semi=1&feature=discount", // static numbers as this does not require the year and semster to be set.
      );
      if (!response.ok) {
        throw new Error("Failed to check feature status");
      }
      return {
        enabled: (await response.json())[0].enabled,
      };
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["discountData"],
    queryFn: async () => {
      const response = await fetch(`/api/discount`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch leave data");
      }
      return response.json();
    },
  });
  //if (checkIfFeatureIsEnabledLoading) {
  //  return (
  //    <div className="pt-2">
  //      <div className="p-2">
  //        <h1 className="text-xl font-semibold">申請 抵免</h1>
  //        <p className="text-sm text-muted-foreground animate-pulse">
  //          檢查功能是否啟用中...
  //        </p>{" "}
  //      </div>{" "}
  //      <form className="flex items-center space-x-4 p-2"></form>
  //      <div className="h-full justify-center p-2"></div>
  //    </div>
  //  );
  //}
  //if (!checkIfFeatureIsEnabled?.enabled) {
  //  return (
  //    <div className="pt-2">
  //      <div className="p-2">
  //        <h1 className="text-xl font-semibold">申請 抵免</h1>
  //        <p className="text-sm text-muted-foreground animate-pulse">
  //          檢查功能是否啟用中...
  //        </p>{" "}
  //      </div>{" "}
  //      <form className="flex items-center space-x-4 p-2"></form>
  //      <div className="h-full justify-center p-2"></div>
  //    </div>
  //  );
  //}

  return (
    <div className="pt-2">
      <div className="p-2">
        <h1 className="text-xl font-semibold">申請 抵免</h1>
        <p className="text-sm text-muted-foreground">申請就學抵免。</p>
      </div>{" "}
      <form className="flex items-center space-x-4 p-2">
        <span
          className="text-sm overflow-scroll max-h-[calc(100vh-200px)] border p-2 rounded"
          dangerouslySetInnerHTML={{
            __html: isLoading
              ? "載入中..."
              : DOMPurify.sanitize(data?.data.note ?? "無資料"),
          }}
        ></span>
      </form>
    </div>
  );
}
