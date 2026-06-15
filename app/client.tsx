"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getSemesterFromDate } from "@/lib/semester";

type LeaveResponse = {
  success: boolean;
  errMsg: string;
  data: {
    leaves: {
      type: string;
      data: number;
    }[];
    absent: {}[];
  };
};

export default function Client() {
  const [userId, setUserId] = useState("");
  const semester = getSemesterFromDate();

  useEffect(() => {
    setUserId(localStorage.getItem("user") || "");
  }, []);

  const { data: queryData } = useQuery<LeaveResponse>({
    queryKey: ["homeData", semester.year, semester.sem],
    queryFn: async () => {
      const response = await fetch(
        `/api/home/data?year=${semester.year}&semistry=${semester.sem}`,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch leave data");
      }
      return response.json();
    },
  });
  useEffect(() => {
    const checkLocalStorage = localStorage.getItem("user");

    if (checkLocalStorage) {
      setUserId(checkLocalStorage);
    } else {
      const fetchUserId = async () => {
        try {
          const response = await fetch("/api/userInfo/name");
          if (!response.ok) {
            throw new Error("Failed to fetch user ID");
          }
          const data = await response.json();
          setUserId(data.name);
        } catch (error) {
          console.error("Error fetching user ID:", error);
        }
      };
      fetchUserId();
    }
  }, []);
  const cards = useMemo(() => {
    const leaveCards =
      queryData?.data.leaves.map((item) => ({
        key: item.type,
        label: item.type,
        value: item.data,
      })) ?? [];

    return [
      ...leaveCards,
      {
        key: "absent-count",
        label: "缺曠紀錄",
        value: queryData?.data.absent.length ?? 0,
      },
    ];
  }, [queryData]);

  return (
    <div>
      <div className="pt-7 pl-7">
        <span className="italic text-2xl">
          <span className="text-bold">{userId || "使用者"}</span>{" "}
          <span className="">您好!</span>
        </span>
      </div>
      <div className="grid gap-3 px-7 sm:grid-cols-2 lg:grid-cols-3 pt-5">
        {cards.map((card) => (
          <div
            key={card.key}
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
