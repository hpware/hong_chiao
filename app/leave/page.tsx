"use client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import Table from "@/components/table";
import { useMemo } from "react";

type LeaveRow = {
  LeaveTitle?: string;
  ClassDate?: string;
  endDate?: string;
  leaveDays?: number | string;
  reason?: string;
};

type LeaveResponse = {
  data?: LeaveRow[];
};

export default function Page() {
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
      const leaveDays = Number(item.leaveDays);
      if (leaveDays <= 0) {
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
      <span></span>
      <div className="h-full justify-center p-2">
        <Table
          columns={[
            { header: "請假類別", accessorKey: "LeaveTitle" },
            { header: "上課日期", accessorKey: "ClassDate" },
            { header: "送出日期", accessorKey: "ApplyDate" },
            { header: "請假天數", accessorKey: "leaveDays" },
            { header: "Objid", accessorKey: "Objid" },
          ]}
          data={memoedData || []}
        />
      </div>
    </div>
  );
}
