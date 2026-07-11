"use client";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { TRPCReactProvider } from "@/trpc/client";
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
    !pathname.startsWith("/api/") && !pathname.startsWith("/_next/");

  return (
    <TRPCReactProvider>
      <SidebarProvider>
        <TooltipProvider>
          {showShell ? (
            <>
              {sidebar}
              <SidebarInset>
                <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/70 bg-background/95 px-3 backdrop-blur md:hidden">
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
                </header>
                {children}
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
