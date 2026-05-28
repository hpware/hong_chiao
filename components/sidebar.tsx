"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsUpDown,
  ClipboardList,
  LogOut,
  PenLine,
  School,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const leaveItems = [
  {
    title: "舊假單",
    href: "/leave",
    icon: ClipboardList,
    description: "查詢請假紀錄",
  },
  {
    title: "申請",
    href: "/leave/new",
    icon: PenLine,
    description: "建立新的假單",
  },
];

export default function MainSidebar() {
  const pathname = usePathname();
  const [userId, setUserId] = useState("");

  useEffect(() => {
    setUserId(localStorage.getItem("user") || "");
  }, []);

  const schoolName = useMemo(
    () => process.env.NEXT_PUBLIC_SCHOOL_NAME || "校務系統",
    [],
  );

  if (pathname === "/auth/login") {
    return null;
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-white/10 bg-[linear-gradient(180deg,oklch(0.22_0.03_260)_0%,oklch(0.16_0.018_245)_48%,oklch(0.13_0.012_230)_100%)]"
    >
      <SidebarHeader className="p-4">
        <Link
          href="/"
          className="pt-2 justify-center flex items-center gap-3 rounded-lg group-data-[collapsible=icon]:justify-center"
        >
          <School className="size-5" />
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            {schoolName}校務系統反代
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>請假</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {leaveItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-4 border-t border-white/10 justify-between items-center">
        <div className="justify-center flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-white">
              {userId || ""}
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            className="text-white/58 hover:bg-white/10 hover:text-white group-data-[collapsible=icon]:hidden"
          >
            <a href="/api/auth/logout" aria-label="登出">
              <LogOut className="size-4" />
            </a>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
