"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Table from "@/components/table";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Building,
  CalendarClock,
  CalendarOffIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { rejects } from "node:assert";
import { getSemesterFromDate } from "@/lib/semester";
import Link from "next/link";
import { useTRPC } from "@/trpc/client";
import ErrorNotFound from "@/components/error";
import {
  AI_CREDIT_APPLICATION_DRAFT_EVENT,
  getAiCreditApplicationDraftKey,
  type AiCreditApplicationDraft,
} from "@/lib/ai-page-actions";

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
  const [description, setDescription] = useState("");
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

  useEffect(() => {
    const normalizedId = id.toUpperCase();
    const draftKey = getAiCreditApplicationDraftKey(normalizedId);

    function applyDraft(draft: AiCreditApplicationDraft | undefined) {
      if (!draft || draft.applicationId.toUpperCase() !== normalizedId) return;
      setDescription(draft.description);
      sessionStorage.removeItem(draftKey);
    }

    const savedDraft = sessionStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        applyDraft(JSON.parse(savedDraft) as AiCreditApplicationDraft);
      } catch {
        sessionStorage.removeItem(draftKey);
      }
    }

    function handleDraft(event: Event) {
      applyDraft((event as CustomEvent<AiCreditApplicationDraft>).detail);
    }

    window.addEventListener(AI_CREDIT_APPLICATION_DRAFT_EVENT, handleDraft);
    return () =>
      window.removeEventListener(
        AI_CREDIT_APPLICATION_DRAFT_EVENT,
        handleDraft,
      );
  }, [id]);

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
      <section className="flex flex-col space-x-4 p-2">
        {getApplyDetails?.data.length > 0 ? (
          <div>
            <div className="flex flex-col lg:flex-row space-x-2">
              <span className="flex flex-row">
                <UserIcon />
                &nbsp;{getApplyDetails?.data[0].UnPerText} (
                {getApplyDetails?.data[0].UnOrgText})
              </span>
              <span className="flex flex-row">
                <CalendarClock />
                &nbsp;申請範圍: {getApplyDetails?.data[0].StartDate}~
                {getApplyDetails?.data[0].EndDate}
              </span>
              <span className="flex flex-row">
                <CalendarOffIcon />
                &nbsp;上傳期限: {getApplyDetails?.data[0].UpLoadDate}
              </span>
            </div>
            <span className="text-sm">
              備註: {getApplyDetails?.data[0].Memo}
            </span>
            <hr />
          </div>
        ) : null}
        <div className="mt-4 space-y-2">
          <label
            htmlFor="credit-application-description"
            className="text-sm font-medium"
          >
            申請說明&nbsp;&nbsp;
            <span className="text-muted-foreground">
              {description.length}/4000
            </span>
          </label>
          <textarea
            id="credit-application-description"
            data-ai-field="credit-application-description"
            value={description}
            maxLength={4000}
            rows={7}
            placeholder="請填寫申請原因或補充說明"
            className="w-full resize-y rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        {/*{JSON.stringify(getApplyDetails)} */}
      </section>
      <div className="h-full justify-center p-2"></div>
    </div>
  );
}
