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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, LogOut, PenLine, School, User2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

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
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [userId, setUserId] = useState("");

  if (pathname === "/auth/login") {
    return null;
  }

  useEffect(() => {
    setUserId(localStorage.getItem("user") || "");
  }, []);

  const schoolName = useMemo(
    () => process.env.NEXT_PUBLIC_SCHOOL_NAME || "校務系統",
    [],
  );

  const renewSession = useCallback(async () => {
    const response = await fetch("/api/auth/renewTimeoutTimer?kick=direct");
    const data = await response.json();
    if (response.status === 401 || response.status === 307) {
      // sess expired

      router.push("/api/auth/logout?expired=true");
    }
    if (!response.ok) {
      throw new Error(data.error || "Failed to renew session");
    }

    return data;
  }, []);

  const renewQuery = useQuery({
    queryKey: ["renewSession"],
    queryFn: renewSession,
  });
  // renew every ten minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        renewQuery.refetch();
      },
      10 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [renewQuery.refetch]);

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            onClick={() => setOpenMobile(false)}
            className="min-w-0 flex flex-1 items-center justify-center gap-3 rounded-lg pt-2 group-data-[collapsible=icon]:justify-center transition-all duration-100"
          >
            <School className="size-6 shrink-0 md:size-5" />
            <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">
              {schoolName}校務系統反代
            </span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="關閉導覽選單"
            onClick={() => setOpenMobile(false)}
          >
            <X className="size-5" />
          </Button>
        </div>
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
                      className="transition-all duration-100"
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpenMobile(false)}
                      >
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

      <SidebarFooter className="mt-4 border-t border-white/10 items-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={userId || "使用者"}
              isActive={pathname === "/profile"}
              className="transition-all duration-100"
            >
              <Link href={"/profile"} onClick={() => setOpenMobile(false)}>
                <User2 />
                <span>{userId || "使用者"}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="登出"
              isActive={false}
              className="transition-all duration-100"
            >
              <a href={"/api/auth/logout"} onClick={() => setOpenMobile(false)}>
                <LogOut />
                <span>登出</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
