import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "繳費單",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
