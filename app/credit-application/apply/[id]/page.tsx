import { notFound } from "next/navigation";
import Client from "./client";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  if (!id) {
    notFound();
  }
  return <Client id={id.toString().toUpperCase()} />;
}
