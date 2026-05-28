"use client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

const queryClient = new QueryClient();

export default function Client({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const pathname = usePathname();
  const showShell = pathname !== "/auth/login";

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <TooltipProvider>
          {showShell ? (
            <>
              {sidebar}
              <SidebarInset>
                <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/70 bg-background/95 px-3 backdrop-blur md:hidden">
                  <SidebarTrigger
                    className="size-10 border border-border/70 bg-muted/40 text-foreground"
                    aria-label="開啟導覽選單"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {process.env.NEXT_PUBLIC_SCHOOL_NAME || "校務系統"}反代
                    </p>
                  </div>
                </header>
                {children}
              </SidebarInset>
            </>
          ) : (
            children
          )}
        </TooltipProvider>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
