"use client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
export default function Page() {
  const { data } = useQuery({
    queryKey: ["leaveData"],
    queryFn: async () => {
      const response = await fetch("/api/leave?year=114&sem=2");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch leave data");
      }
      return response.json();
    },
  });
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-32 px-16 bg-white dark:bg-black">
      <h1 className="text-2xl">Data Viewer</h1>
      <span>{JSON.stringify(data)}</span>
    </div>
  );
}
