"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

export default function Page() {
  const router = useRouter();
  const trpc = useTRPC();
  const proof = useMutation(trpc.tuition.proofDownloadId.mutationOptions());
  const loadUserSemis = useQuery(trpc.user.participatingSemis.queryOptions());

  return (
    <main className="space-y-5 p-2">
      <header>
        <h1 className="text-xl font-semibold">下載繳費證明</h1>
        <p className="text-sm text-muted-foreground">下載與預覽繳費證明</p>
      </header>

      {loadUserSemis.data ? (
        <div>
          {loadUserSemis.data.data?.map((i) => {
            return (
              <section key={`${i.year}-${i.semi}`}>
                <Button
                  type="button"
                  disabled={proof.isPending}
                  onClick={() => {
                    toast.promise(
                      async () => {
                        const result = await proof.mutateAsync({
                          year: Number(i.year),
                          semester: Number(i.semi) as 1 | 2,
                        });
                        const query = new URLSearchParams({
                          name: result.name,
                        });
                        router.push(
                          `/tuition/proof-of-payment/${encodeURIComponent(result.id)}?${query}`,
                        );
                      },
                      {
                        loading: "正在準備繳費證明…",
                        success: "繳費證明已準備完成",
                        error: (error) =>
                          error instanceof Error
                            ? error.message
                            : "無法產生繳費證明，請稍後再試。",
                      },
                    );
                  }}
                >
                  民國{i.year}年度{i.semi}學期
                </Button>
              </section>
            );
          })}
        </div>
      ) : null}
    </main>
  );
}
