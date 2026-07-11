import { notFound } from "next/navigation";

export default function ServerSchoolServerSpeedTestPage() {
  if (!process.env.NEXT_PUBLIC_SCHOOL_SPEEDTEST_SERVER) {
    notFound();
  }

}
