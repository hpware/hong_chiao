"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function MainSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  // if in login then no sidebar
  if (pathname === "/auth/login") {
    return null;
  }
  // fetch user id
  const userId = localStorage.getItem("user");
  return (
    <Sidebar>
      <SidebarHeader className="flex items-center gap-2">
        <span className="text-lg font-semibold pt-2">
          {process.env.NEXT_PUBLIC_SCHOOL_NAME || ""}校務系統反代
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>請假</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <span>舊假單</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <span>申請</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-row items-center gap-2">
          {userId}{" "}
          <a href="/api/auth/logout">
            <Button>logout</Button>
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
