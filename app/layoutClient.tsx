"use client";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { TRPCReactProvider } from "@/trpc/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BotIcon } from "lucide-react";
import AiSidebar from "@/components/ai_sidebar";
//NEXT_PUBLIC_APP_URL
export default function Client({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const pathname = usePathname();
  const showShell =
    pathname !== "/auth/login" &&
    !pathname.startsWith("/_appassets/") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/");

  const [aiOpen, setAiOpen] = useState(false);

  const [aiDisabled, setAiDisabled] = useState(true);
  useEffect(() => {
    const readDisabled = () => {
      const disabled = localStorage.getItem("ai_disabled");
      if (disabled === null) localStorage.setItem("ai_disabled", "true"); // default disable AI features.
      setAiDisabled(disabled !== "false");
    };
    readDisabled();
    // 設定頁儲存後會發出這個事件，讓 AI 按鈕不用重新整理就出現
    window.addEventListener("ai-settings-changed", readDisabled);
    return () => window.removeEventListener("ai-settings-changed", readDisabled);
  }, []);
  return (
    <TRPCReactProvider>
      <SidebarProvider>
        <TooltipProvider>
          {showShell ? (
            <>
              {sidebar}
              {/* min-w-0 讓主內容在 AI 側欄展開時可以縮小，不會把側欄推出畫面外 */}
              <SidebarInset className="min-w-0">
                <header
                  className={`sticky top-0 z-30 flex h-14 items-center ${!aiDisabled && "justify-between"} gap-3 border-b border-border/70 bg-background/95 px-3 backdrop-blur md:hidden`}
                >
                  <SidebarTrigger
                    className="size-10 text-foreground"
                    aria-label="開啟導覽選單"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {process.env.NEXT_PUBLIC_SCHOOL_NAME || "未知"}
                      校務系統反代
                    </p>
                  </div>

                  {aiDisabled ? null : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAiOpen(!aiOpen)}
                      aria-label="開啟 AI"
                    >
                      <BotIcon className="size-5" />
                    </Button>
                  )}
                </header>
                {aiDisabled || aiOpen ? null : (
                  <Button
                    size="icon"
                    onClick={() => setAiOpen(true)}
                    aria-label="開啟 AI"
                    className="fixed bottom-4 right-4 z-30 hidden rounded-full shadow-md md:inline-flex"
                  >
                    <BotIcon className="size-5" />
                  </Button>
                )}
                {children}
              </SidebarInset>
              <AiSidebar aiOpen={aiOpen} setAiOpen={setAiOpen} />
            </>
          ) : (
            children
          )}
        </TooltipProvider>
      </SidebarProvider>
    </TRPCReactProvider>
  );
}
