import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Client from "./client";

export const metadata: Metadata = {
  title: "申請獎學金",
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  if (!id) {
    notFound();
  }
  return <Client id={id.toString().toUpperCase()} />;
}
