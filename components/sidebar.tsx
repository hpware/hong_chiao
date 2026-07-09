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
  InfoIcon,
  LogOut,
  Moon,
  PenLine,
  School,
  Sun,
  User2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

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
    title: "就學抵免",
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
  const trpc = useTRPC();
  const [userId, setUserId] = useState("");
  // Only hit the server when we don't already have the name cached locally.
  const [needsFetch, setNeedsFetch] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem("user");
    if (cached) setUserId(cached);
    else setNeedsFetch(true);
  }, []);

  const userNameQuery = useQuery(
    trpc.user.name.queryOptions(undefined, { enabled: needsFetch }),
  );
  useEffect(() => {
    if (userNameQuery.data?.name) {
      setUserId(userNameQuery.data.name);
      localStorage.setItem("user", userNameQuery.data.name);
    }
  }, [userNameQuery.data?.name]);

  const schoolName = useMemo(
    () => process.env.NEXT_PUBLIC_SCHOOL_NAME || "校務系統",
    [],
  );

  const renewQuery = useQuery(
    trpc.user.renewTimer.queryOptions(undefined, {
      refetchInterval: 10 * 60 * 1000,
    }),
  );
  // On an expired/invalid session the procedure throws UNAUTHORIZED — kick to logout.
  useEffect(() => {
    if (renewQuery.error?.data?.code === "UNAUTHORIZED") {
      toast.error("Session 過期 請重新登入");
      router.push("/api/auth/logout?expired=true");
    }
  }, [renewQuery.error, router]);

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
              isActive={pathname === "/settings"}
              className="transition-all duration-100"
            >
              <Link href={"/settings"} onClick={() => setOpenMobile(false)}>
                <User2 />
                <span>{userId || "使用者"}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="w-full">
            <SidebarMenuButton
              asChild
              tooltip="關於此平台"
              isActive={pathname === "/platform/about"}
              className="transition-all duration-100"
            >
              <Link
                href={"/platform/about"}
                onClick={() => setOpenMobile(false)}
              >
                <InfoIcon />
                <span>關於此平台</span>
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
