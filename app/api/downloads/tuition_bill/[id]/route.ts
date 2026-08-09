import GetUserName from "@/components/px_items/user/name";
import { endpoint, getBrowserCookies } from "@/components/univeralComponents";
import { getSemesterFromDate } from "@/lib/semester";
import { NextRequest } from "next/server";

export const GET = async (
  request: NextRequest,
  websiteContext: { params: Promise<{ id: string }> },
) => {
  const rawUrl = process.env.API_URL;
  if (!rawUrl) {
    return Response.json(
      {
        error: "尚未登入！",
      },
      { status: 500 },
    );
  }
  const apiUrl = rawUrl;
  const url = new URL(apiUrl);
  const browserCookies = await getBrowserCookies(request, 200, url);
  const getUserName = await GetUserName(browserCookies);

  const { id } = await websiteContext.params;
  const getThingy = await fetch(
    endpoint(process.env.WCFY_API_URL!, `WcfYAcc/Files/TuitionBill/${id}.pdf`),
  );
  return new Response(new Uint8Array(await getThingy.arrayBuffer()), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="tuition_bill.pdf"; filename*=UTF-8''${encodeURIComponent(`${getUserName.name}_${process.env.NEXT_PUBLIC_SCHOOL_NAME}繳費單.pdf`)}`,
    },
  });
};
