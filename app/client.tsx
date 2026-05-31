"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type LeaveRow = {
  Objid?: number | string;
  LeaveTitle?: string;
  ApplyDate?: string;
  ClassDate?: string;
  Days?: number | string;
  Sections?: number | string;
  leaveDays?: number;
};

type LeaveResponse = {
  data?: LeaveRow[];
};
export default function Client() {
  const [userId, setUserId] = useState("");
  useEffect(() => {
    setUserId(localStorage.getItem("user") || "");
  });
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
  const leaveSummary = useMemo(() => {
    const leaveRows = Array.isArray(data?.data) ? data.data : [];

    return leaveRows.reduce(
      (summary, item) => {
        const days = Number(item.Days ?? item.leaveDays);
        const sections = Number(item.Sections);

        return {
          days: summary.days + (Number.isFinite(days) && days > 0 ? days : 0),
          sections:
            summary.sections +
            (Number.isFinite(sections) && sections > 0 ? sections : 0),
        };
      },
      { days: 0, sections: 0 },
    );
  }, [data]);

  const summaryCards = [
    { label: "請假天數", value: leaveSummary.days },
    { label: "請假節數", value: leaveSummary.sections },
  ];

  return (
    <div>
      <div className="pt-7 pl-7">
        <span className="italic text-2xl">
          <span className="text-bold">{userId || "使用者"}</span>{" "}
          <span className="">您好!</span>
        </span>
      </div>
      <div className="grid gap-3 px-7 sm:grid-cols-2 lg:grid-cols-3 pt-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-background p-4 shadow-sm"
          >
            <div className="text-sm text-muted-foreground">{card.label}</div>
            <div className="mt-3 text-3xl font-semibold tabular-nums">
              {card.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
