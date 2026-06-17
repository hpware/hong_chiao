// not ready yet
"use client";
import { useQuery } from "@tanstack/react-query";
import Table from "@/components/table";
import { useMemo } from "react";
import { ExternalLink } from "lucide-react";

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
  const { data } = useQuery<CreditApplicationResponse>({
    queryKey: ["creditApplicationData"],
    queryFn: async () => {
      const response = await fetch(`/api/credit-application`);
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(
          responseData.error || "Failed to fetch credit application data",
        );
      }
      if (responseData.error || responseData.errMsg) {
        throw new Error(responseData.error || responseData.errMsg);
      }
      return responseData;
    },
  });

  const creditApplicationRows = useMemo(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  return (
    <div className="pt-2">
      <div className="p-2">
        <h1 className="text-xl font-semibold">獎學金</h1>
        <p className="text-sm text-muted-foreground">申請獎學金。</p>
      </div>{" "}
      <div className="h-full justify-center p-2">
        <Table
          columns={[
            { header: "代碼", accessorKey: "Code" },
            { header: "獎助項目", accessorKey: "Title" },
            { header: "承辦單位", accessorKey: "UnOrgText" },
            { header: "承辦人", accessorKey: "UnPerText" },
            { header: "開始日期", accessorKey: "StartDate" },
            { header: "結束日期", accessorKey: "EndDate" },
            { header: "上傳期限", accessorKey: "UpLoadDate" },
            { header: "名額", accessorKey: "Quota" },
            { header: "申請", accessorKey: "Apply" },
            {
              header: "連結",
              accessorKey: "URL",
              cell: ({ row }) =>
                row.original.URL ? (
                  <a
                    href={row.original.URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    開啟
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">無</span>
                ),
            },
          ]}
          data={creditApplicationRows || []}
        />
      </div>
    </div>
  );
}
