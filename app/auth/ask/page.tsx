import { redirect } from "next/navigation";

export default function Page() {
  const subject = encodeURIComponent("Hong Chiao 校務系統反代問題");

  redirect(`mailto:projectask@yhw.tw?subject=${subject}`);
}
