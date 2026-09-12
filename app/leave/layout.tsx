import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "假單管理",
};

export default function Layout({ children }: { children: ReactNode }) {
  notFound();
  return children;
}
