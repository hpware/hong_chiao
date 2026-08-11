import type { Metadata } from "next";
import Client from "./client";

export const metadata: Metadata = {
  title: "首頁",
};

export default function Page() {
  return <Client />;
}
