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
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";

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

  const formInputItems = [
    {
      name: "email",
      displayName: "電子信箱",
      type: "email",
      required: true,
    },
    {
      name: "phone",
      displayName: "住家電話",
      type: "tel",
      required: true,
    },
    {
      name: "indigenousStatus",
      displayName: "原住民族籍",
      type: "selector",
      required: false,
      selectorItems: [
        {
          name: "阿美族",
          mappedItem: "原_1",
        },
        {
          name: "泰雅族",
          mappedItem: "原_2",
        },
        {
          name: "排灣族",
          mappedItem: "原_3",
        },
        {
          name: "布農族",
          mappedItem: "原_4",
        },
        {
          name: "卑南族",
          mappedItem: "原_5",
        },
        {
          name: "鄒(曹)族",
          mappedItem: "原_6",
        },
        {
          name: "魯凱族",
          mappedItem: "原_7",
        },
        {
          name: "賽夏族",
          mappedItem: "原_8",
        },
        {
          name: "雅美族(達悟族)",
          mappedItem: "原_9",
        },
        {
          name: "邵族",
          mappedItem: "原_A",
        },
        {
          name: "噶瑪蘭族",
          mappedItem: "原_B",
        },
        {
          name: "太魯閣族(德魯固族)",
          mappedItem: "原_C",
        },
        {
          name: "凱奇萊雅族",
          mappedItem: "原_D",
        },
        {
          name: "賽德克族",
          mappedItem: "原_E",
        },
        {
          name: "拉阿魯哇族",
          mappedItem: "原_F",
        },
        {
          name: "卡那卡那富族",
          mappedItem: "原_G",
        },
      ],
    },
    {
      name: "livingOutside",
      displayName: "是否校外租屋",
      type: "checkbox",
      required: false,
    },
  ];
  return (
    <div className="pt-2">
      <div className="p-2">
        <h1 className="text-xl font-semibold">
          申請 {data?.data?.semiYear}-{data?.data?.semester} 就學抵免
        </h1>
        <p className="text-sm text-muted-foreground">申請就學抵免。</p>
      </div>{" "}
      <form
        className="flex flex-col space-x-4 p-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col md:flex-row text-sm items-center text-center justify-center">
          <span className="text-sm">
            註冊人資訊: {data?.data?.studentId} {data?.data?.studentName}。{" "}
          </span>
          <span className="text-red-300 text-sm">
            請先儲存再送出，送出後即不得更改
          </span>
        </div>
        <span
          className="text-sm overflow-scroll max-h-[calc(100vh-200px)] border p-2 rounded"
          dangerouslySetInnerHTML={{
            __html: isLoading
              ? "載入中..."
              : DOMPurify.sanitize(data?.data.note ?? "無資料"),
          }}
        ></span>
        <div className="flex flex-col gap-2 mt-2 border p-2 rounded">
          <span className="text-lg">表單</span>
          {formInputItems.map((item) => (
            <div
              className={`${item.type === "checkbox" ? "flex flex-row items-center space-x-2" : null}`}
            >
              <label htmlFor={item.name} className="text-sm">
                {item.displayName}
                {item.required ? (
                  <span className="text-red-500 dark:text-red-400 text-lg">
                    *
                  </span>
                ) : null}
              </label>
              {item.type === "selector" ? (
                <NativeSelect>
                  <NativeSelectOption value="">請選擇</NativeSelectOption>
                  {item.selectorItems?.map((selectorItem) => (
                    <NativeSelectOption value={selectorItem.mappedItem}>
                      {selectorItem.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : item.type === "checkbox" ? (
                <input type="checkbox" id={item.name} name={item.name} />
              ) : (
                <Input
                  type={item.type}
                  id={item.name}
                  name={item.name}
                  required={item.required}
                  className="w-full "
                />
              )}
            </div>
          ))}
          <div className="flex justify-end">
            <Button>送出</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
