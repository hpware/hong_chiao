"use client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
export default function Page() {
  const { data } = useQuery({
    queryKey: ["leaveData"],
    queryFn: async () => {
      const convertYear = await fetch(
        "/api/leave/convertDateToSemiYear?year&month",
      );
      const convertYearData = await convertYear.json();
      const response = await fetch(
        `/api/leave?year=${convertYearData.rocYear}&sem=${convertYearData.semistry}`,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch leave data");
      }
      return response.json();
    },
  });
  return <div></div>;
}
