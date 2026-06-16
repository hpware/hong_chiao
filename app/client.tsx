"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getSemesterFromDate } from "@/lib/semester";
import Link from "next/link";
import { ArrowRightToLine, HandCoins, RotateCcwKeyIcon } from "lucide-react";

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

const randomTitleText = ["您好！", "歡迎回來！"];
const randomDescText = [""];

export default function Client() {
  const semester = getSemesterFromDate();

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
  const { data: userId } = useQuery({
    queryKey: ["userId"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/userInfo/name");
        if (!response.ok) {
          throw new Error("Failed to fetch user ID");
        }
        const data = await response.json();
        localStorage.setItem("user", data.name);
        return data.name;
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    },
  });

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

  const titleText = useMemo(
    () => randomTitleText[Math.floor(Math.random() * randomTitleText.length)],
    [],
  );

  const commonItems = [
    {
      name: "申請請假",
      link: "/leave/new",
      icon: ArrowRightToLine,
    },
    {
      name: "獎學金",
      link: "/credit-application",
      icon: HandCoins,
    },
    {
      name: "更改密碼",
      link: "/settings#password",
      icon: RotateCcwKeyIcon,
    },
  ];

  return (
    <div>
      <div className="pt-7 pl-7">
        <span className="italic text-2xl">
          <span className="">{titleText}</span>{" "}
          <span className="text-bold">{userId || "使用者"}</span>
        </span>
        <span>{randomDescText}</span>
      </div>
      <div>
        <div className="border rounded mx-7 mt-3 mb-0 space-x-2 p-2">
          <span className="text-md">快速存取</span>
          <div className="flex flex-wrap space-x-3 pt-2">
            {commonItems.map((item) => {
              return (
                <Link
                  key={item.link}
                  href={item.link}
                  className="group justify-center items-center text-center"
                >
                  <div className="border rounded p-4 flex items-center justify-center bg-muted-foreground/5 group-hover:bg-muted backdrop-blur-xl transition-all duration-100">
                    <item.icon className="size-7 group-hover:-rotate-10 transition-all duration-300" />
                  </div>
                  <span className="text-sm text-center justify-center items-center">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <div className="grid gap-3 px-7 sm:grid-cols-2 lg:grid-cols-3 pt-5 mt-0">
        {cards.map((card) => {
          if (
            !(
              card.label === "缺曠紀錄" ||
              card.label === "曠課" ||
              card.label === "操行分數"
            )
          )
            return null;
          return (
            <div
              key={card.key}
              className="rounded-lg border border-border bg-background p-4 shadow-sm"
            >
              <div className="text-sm text-muted-foreground">{card.label}</div>
              <div className="mt-3 text-3xl font-semibold tabular-nums">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>
      <div className="rounded-lg border border-border bg-background p-4 shadow-sm"></div>
    </div>
  );
}
