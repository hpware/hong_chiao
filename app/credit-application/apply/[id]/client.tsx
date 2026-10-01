"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Table from "@/components/table";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
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

  const application = getApplyDetails?.data?.[0];

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
    <div className="space-y-5 p-4 sm:p-6">
      <header className="space-y-5 border-b pb-5">
        <div className="space-y-3">
          <Link
            href="/credit-application"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
            獎學金
          </Link>
          <h1 className="break-words text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
            {application?.Title ?? "載入中..."}
          </h1>
        </div>
        {application ? (
          <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
            <div className="min-w-0 sm:col-span-2 xl:col-span-1">
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <UserIcon className="size-4 shrink-0" aria-hidden="true" />
                承辦資訊
              </dt>
              <dd className="mt-1.5 space-y-1 pl-6">
                <span className="block font-medium">
                  {application.UnPerText}
                </span>
                <span className="block break-words text-muted-foreground">
                  {application.UnOrgText}
                </span>
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                申請期間
              </dt>
              <dd className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-6 font-medium tabular-nums">
                <span>{application.StartDate}</span>
                <span className="text-muted-foreground">至</span>
                <span>{application.EndDate}</span>
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
                上傳期限
              </dt>
              <dd className="mt-1.5 pl-6 font-medium tabular-nums">
                {application.UpLoadDate}
              </dd>
            </div>
          </dl>
        ) : null}
      </header>
      <section className="space-y-4">
        {application?.Memo ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            備註：{application.Memo}
          </p>
        ) : null}
        <div className="space-y-2">
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
    </div>
  );
}
