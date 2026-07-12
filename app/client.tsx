"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useTRPC } from "@/trpc/client";
import { getSemesterFromDate } from "@/lib/semester";
import Link from "next/link";
import { BarChart } from "@/components/dither-kit/bar-chart";
import { Area } from "@/components/dither-kit/area";
import { XAxis } from "@/components/dither-kit/x-axis";
import { YAxis } from "@/components/dither-kit/y-axis";
import { Tooltip } from "@/components/dither-kit/tooltip";
import {
  ArrowRightToLine,
  DiamondPercentIcon,
  HandCoins,
  RotateCcwKeyIcon,
} from "lucide-react";
import Table from "@/components/table";
import DOMPurify from "dompurify";
import { Bar } from "@/components/dither-kit";

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

type Announcement = {
  unit: string;
  date: string;
  content: string;
};

type AnnouncementsResponse = {
  success: boolean;
  data: Announcement[];
};

const randomTitleText = ["您好！", "歡迎回來！"];
const randomDescText = [""];

export default function Client() {
  const trpc = useTRPC();
  const semester = getSemesterFromDate();

  const { data: queryData } = useQuery(
    trpc.home.data.queryOptions({
      year: semester.year,
      semistry: semester.sem,
    }),
  );

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

  const { data: announcements } = useQuery(
    trpc.home.announcements.queryOptions(),
  );

  const annoucementsData = useMemo(
    () => announcements?.data.map((item) => ({ ...item })) ?? [],
    [announcements],
  );

  const { data: userInfo } = useQuery(trpc.user.name.queryOptions());
  useEffect(() => {
    if (userInfo?.name) localStorage.setItem("user", userInfo.name);
  }, [userInfo?.name]);
  const userId = userInfo?.name;

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

  const leaveChart = useMemo(
    () =>
      queryData?.data.leaves.map((l) => ({ type: l.type, days: l.data })) ?? [],
    [queryData],
  );

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
          if (!(
            card.label === "缺曠紀錄" ||
            card.label === "曠課" ||
            card.label === "操行分數"
          ))
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
      {leaveChart.length > 0 && (
        <div className="mx-7 mt-5 h-[180px]">
          <BarChart
            data={leaveChart}
            config={{ days: { label: "天數", color: "blue" } }}
            bloom="low"
          >
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip labelKey="type" />
            <Bar dataKey="desktop" variant="gradient" />
            <Bar dataKey="mobile" variant="hatched" />{" "}
          </BarChart>
        </div>
      )}
      <div className="mt-5 mx-7">
        <h1 className="text-1xl">公布欄</h1>
        <Table
          columns={[
            {
              header: "",
              accessorKey: "date",
              cell: ({ row }) => (
                <span>
                  <span className="font-bold text-base">
                    {row.original.unit.trim().length === 0
                      ? "系統訊息"
                      : row.original.unit}
                  </span>
                  {"  "}
                  <span className="text-xs">
                    公告到:
                    {row.original.date.replace(/^\d{4}\/\d{2}\/\d{2}\~/, "")}
                  </span>
                </span>
              ),
            },
            {
              header: "公布資訊",
              accessorKey: "content",
              cell: ({ row }) => (
                <span
                  className="break-all"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      row.original.content.replaceAll("\n", "<br/>"),
                    ),
                  }}
                ></span>
              ),
            },
          ]}
          data={annoucementsData || []}
        />
      </div>

      {/*<div className="rounded-lg border border-border bg-background p-4 shadow-sm"></div> */}
    </div>
  );
}
