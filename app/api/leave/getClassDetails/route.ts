import { type NextRequest, NextResponse } from "next/server";
import { getBrowserCookies } from "@/components/univeralComponents";
import GetLeaveClassDetails from "@/components/px_items/leave/getClassDetails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanItems(
  items: {
    ClassDate: string;
    ClassDateMG: string | null; // useless
    DayOfWeek: string;
    Ocid01: string | null;
    Show01: boolean;
    selected01: boolean;
    Ocid10: string | null;
    Show10: boolean;
    selected10: boolean;
    Ocid20: string | null;
    Show20: boolean;
    selected20: boolean;
    Ocid30: string | null;
    Show30: boolean;
    selected30: boolean;
    Ocid40: string | null;
    Show40: boolean;
    selected40: boolean;
    Ocid45: string | null;
    Show45: boolean;
    selected45: boolean;
    Ocid50: string | null;
    Show50: boolean;
    selected50: boolean;
    Ocid60: string | null;
    Show60: boolean;
    selected60: boolean;
    Ocid70: string | null;
    Show70: boolean;
    selected70: boolean;
    Ocid80: string | null;
    Show80: boolean;
    selected80: boolean;
    Ocid90: string | null;
    Show90: boolean;
    selected90: boolean;
    Ocid100: string | null;
    Show100: boolean;
    selected100: boolean;
    Ocid110: string | null;
    Show110: boolean;
    selected110: boolean;
    Ocid120: string | null;
    Show120: boolean;
    selected120: boolean;
    Ocid130: string | null;
    Show130: boolean;
    selected130: boolean;
    Ocid140: string | null;
    Show140: boolean;
    selected140: boolean;
    Ocid150: string | null;
    Show150: boolean;
    selected150: boolean;
  }[],
) {
  return items.map((item) => {
    return {
      date: item.ClassDate,
      day: item.DayOfWeek,
      table: [
        {
          classIndex: 99998,
          sendData: item.Ocid01,
          show: item.Show01,
          selected: item.selected01,
        },
        {
          classIndex: 1,
          sendData: item.Ocid10,
          show: item.Show10,
          selected: item.selected10,
        },
        {
          classIndex: 2,
          sendData: item.Ocid20,
          show: item.Show20,
          selected: item.selected20,
        },
        {
          classIndex: 3,
          sendData: item.Ocid30,
          show: item.Show30,
          selected: item.selected30,
        },
        {
          classIndex: 4,
          sendData: item.Ocid40,
          show: item.Show40,
          selected: item.selected40,
        },
        {
          classIndex: 9999, // null
          sendData: item.Ocid45,
          show: item.Show45,
          selected: item.selected45,
        },
        {
          classIndex: 5,
          sendData: item.Ocid50,
          show: item.Show50,
          selected: item.selected50,
        },
        {
          classIndex: 6,
          sendData: item.Ocid60,
          show: item.Show60,
          selected: item.selected60,
        },
        {
          classIndex: 7,
          sendData: item.Ocid70,
          show: item.Show70,
          selected: item.selected70,
        },
        {
          classIndex: 8,
          sendData: item.Ocid80,
          show: item.Show80,
          selected: item.selected80,
        },
        {
          classIndex: 9,
          sendData: item.Ocid90,
          show: item.Show90,
          selected: item.selected90,
        },
        {
          classIndex: 10,
          sendData: item.Ocid100,
          show: item.Show100,
          selected: item.selected100,
        },
        {
          classIndex: 11,
          sendData: item.Ocid110,
          show: item.Show110,
          selected: item.selected110,
        },
        {
          classIndex: 12,
          sendData: item.Ocid120,
          show: item.Show120,
          selected: item.selected120,
        },
        {
          classIndex: 13,
          sendData: item.Ocid130,
          show: item.Show130,
          selected: item.selected130,
        },
        {
          classIndex: 14,
          sendData: item.Ocid140,
          show: item.Show140,
          selected: item.selected140,
        },
        {
          classIndex: 15,
          sendData: item.Ocid150,
          show: item.Show150,
          selected: item.selected150,
        },
      ],
    };
  });
}

export const GET = async (request: NextRequest) => {
  let statusCode = 500;

  try {
    const rawUrl = process.env.API_URL;

    if (!rawUrl) {
      return NextResponse.json(
        {
          error:
            "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
        },
        { status: 500 },
      );
    }
    const apiUrl = rawUrl;
    const url = new URL(apiUrl);
    statusCode = 401;
    const browserCookies = await getBrowserCookies(request, statusCode, url);
    statusCode = 500;
    //get vars
    const params = request.nextUrl.searchParams;
    const start = params.get("start");
    const end = params.get("end");
    const year = params.get("year");
    const semistry = params.get("semi");
    if (!start || !end || !year || !semistry) {
      statusCode = 400;
      throw new Error("需要 start, end, year, semi 的變數。");
    }
    const toROCDate = (input: string | number | Date) => {
      const parts = new Intl.DateTimeFormat("zh-TW-u-ca-roc", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date(input));
      const get = (type: string) => parts.find((p) => p.type === type)!.value;
      return `${get("year")}/${get("month")}/${get("day")}`;
    };

    const parsedStartDate = toROCDate(start);
    const parsedEndDate = toROCDate(end);
    if (parsedStartDate === undefined || !parsedEndDate === undefined) {
      statusCode = 400;
      throw new Error("Date parsing error, please try again.");
    }

    const apiResponse = await GetLeaveClassDetails(
      browserCookies,
      parsedStartDate,
      parsedEndDate,
      year,
      semistry,
    );

    if (!apiResponse.IsOK) {
      statusCode = 401;
      throw new Error("Session 過期了或無效。請重新登入。");
    }
    return Response.json({
      success: apiResponse.IsOK,
      status: apiResponse.rmodel.status,
      leaveId: apiResponse.rmodel.LeaveId,
      renderItems: cleanItems(apiResponse.rmodel.LeaveDateItemS),
    });
  } catch (e: any) {
    console.error(e);
    return Response.json(
      {
        error: e.message,
      },
      {
        status: statusCode,
      },
    );
  }
};
