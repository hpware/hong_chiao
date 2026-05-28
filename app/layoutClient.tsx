"use client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const queryClient = new QueryClient();

export default function Client({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
