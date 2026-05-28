import { Metadata } from "next";
import Client from "./client";

export const metadata: Metadata = {
  title: "登入",
  description: "登入頁面",
};

export default function Page() {
  return <Client />;
}
