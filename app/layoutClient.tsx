"use client";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { TRPCReactProvider } from "@/trpc/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import AiSidebar from "@/components/ai_sidebar";
//NEXT_PUBLIC_APP_URL
export default function Client({
  children,
  sidebar,
  rightSidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  rightSidebar: React.ReactNode;
}) {
  const pathname = usePathname();
  const showShell =
    pathname !== "/auth/login" &&
    !pathname.startsWith("/_appassets/") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/");

  const [aiOpen, setAiOpen] = useState(false);

  return (
    <TRPCReactProvider>
      <SidebarProvider>
        <TooltipProvider>
          {showShell ? (
            <>
              {sidebar}
              <SidebarInset>
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/70 bg-background/95 px-3 backdrop-blur md:hidden">
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

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAiOpen(!aiOpen)}
                    aria-label="開啟 AI"
                  ></Button>
                </header>
                {children}
                <AiSidebar aiOpen={aiOpen} setAiOpen={setAiOpen} />
              </SidebarInset>
            </>
          ) : (
            children
          )}
        </TooltipProvider>
      </SidebarProvider>
    </TRPCReactProvider>
  );
}
