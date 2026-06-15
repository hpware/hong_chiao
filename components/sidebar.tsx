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
import { useTheme } from "@/components/theme-provider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  ClipboardList,
  DiamondPercentIcon,
  HandCoins,
  LogOut,
  Moon,
  PenLine,
  School,
  Sun,
  User2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

const navItems = [
  {
    title: "假單",
    items: [
      {
        title: "舊假單",
        href: "/leave",
        icon: ClipboardList,
      },
      {
        title: "申請",
        href: "/leave/new",
        icon: PenLine,
      },
    ],
  },
  {
    title: "獎學金",
    items: [
      {
        title: "獎學金",
        href: "/credit-application",
        icon: HandCoins,
      },
    ],
  },
  {
    title: "抵免申請",
    items: [
      {
        title: "抵免申請",
        href: "/discount",
        icon: DiamondPercentIcon,
      },
    ],
  },
  {
    title: "獎懲",
    items: [
      {
        title: "獎懲",
        href: "/reward",
        icon: Award,
      },
    ],
  },
];

export default function MainSidebar() {
  const pathname = usePathname();

  if (pathname === "/auth/login") {
    return null;
  }

  return <MainSidebarContent pathname={pathname} />;
}

function MainSidebarContent({ pathname }: { pathname: string }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const checkLocalStorage = localStorage.getItem("user");

    if (checkLocalStorage) {
      setUserId(checkLocalStorage);
    } else {
      const fetchUserId = async () => {
        try {
          const response = await fetch("/api/userInfo/name");
          if (!response.ok) {
            throw new Error("Failed to fetch user ID");
          }
          const data = await response.json();
          setUserId(data.name);
        } catch (error) {
          console.error("Error fetching user ID:", error);
        }
      };
      fetchUserId();
    }
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
  }, [router]);

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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
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
        {navItems.map((cat) => {
          return (
            <SidebarGroup key={cat.title}>
              <SidebarGroupLabel>{cat.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {cat.items.map((item) => {
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
          );
        })}
      </SidebarContent>

      <SidebarFooter className="mt-4 w-full items-stretch border-t border-sidebar-border">
        <SidebarMenu className="w-full">
          <SidebarMenuItem className="w-full">
            <SidebarThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem className="w-full">
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
          <SidebarMenuItem className="w-full">
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
    </Sidebar>
  );
}

function SidebarThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "切換為淺色模式" : "切換為深色模式";
  const Icon = isDark ? Sun : Moon;

  return (
    <SidebarMenuButton
      type="button"
      tooltip={label}
      className="w-full transition-all duration-100"
      onClick={toggleTheme}
      aria-label={label}
    >
      <Icon />
      <span>{isDark ? "淺色模式" : "深色模式"}</span>
    </SidebarMenuButton>
  );
}
