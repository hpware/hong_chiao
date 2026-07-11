// not ready yet
"use client";
import { useQuery } from "@tanstack/react-query";
import Table from "@/components/table";
import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";

type CreditApplicationRow = {
  objid: string;
  SemiYear: string;
  Semistry: string;
  Code: string;
  Title: string;
  UnOrgText: string;
  UnPerText: string;
  Memo: string;
  Status: string;
  StatusText: string;
  Quota: string;
  Apply: string;
  Method: string;
  URL: string;
  StartDate: string;
  EndDate: string;
  UpLoadDate: string;
};

type CreditApplicationResponse = {
  data?: CreditApplicationRow[];
  error?: string;
  errMsg?: string;
};

export default function Page() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.creditApplication.list.queryOptions());

  const creditApplicationRows = useMemo(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  return (
    <div className="pt-2">
      <div className="p-2">
        <h1 className="text-xl font-semibold">獎學金</h1>
        <p className="text-sm text-muted-foreground">申請獎學金。</p>
      </div>
      <div className="h-full justify-center p-2">
        {/*<div className="flex flex-row justify-end space-x-2 py-4">
        </div>*/}
        <Table
          columns={[
            { header: "獎助項目", accessorKey: "Title" },
            { header: "承辦單位", accessorKey: "UnOrgText" },
            { header: "開始日期", accessorKey: "StartDate" },
            { header: "結束日期", accessorKey: "EndDate" },
            { header: "上傳期限", accessorKey: "UpLoadDate" },
            { header: "名額", accessorKey: "Quota" },
            { header: "申請", accessorKey: "Apply" },
            {
              header: "連結",
              accessorKey: "URL",
              cell: ({ row }) => (
                <div className="flex flex-row space-x-2">
                  {row.original.URL ? (
                    <Link
                      href={row.original.URL}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button className="px-2 py-0 m-0">
                        學校資訊
                        <ExternalLink className="size-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">無</span>
                  )}
                  <Link
                    href="/credit-application/apply/[id]"
                    as={`/credit-application/apply/${row.original.Code}`}
                  >
                    <Button className="px-2 py-0 m-0">申請</Button>
                  </Link>
                </div>
              ),
            },
          ]}
          data={creditApplicationRows || []}
        />
      </div>
    </div>
  );
}
