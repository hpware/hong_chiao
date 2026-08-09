"use client";

import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import ErrorNotFound from "@/components/error";

export default function NotFound() {
  return (
    <div className="absolute inset-0 flex flex-col flex flex-col items-center justify-center gap-8 px-6 text-center select-none z-3">
      <ErrorNotFound text="您要找的頁面可能已被移除、改名，或暫時無法使用。" />
    </div>
  );
}
