import { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  let statusCode = 500;
  try {
    const params = request.nextUrl.searchParams;
    const year = Number(params.get("year"));
    const month = Number(params.get("month"));
    if (!(year > 1911 && year < 4000)) {
      statusCode = 400;
      throw new Error("Invalid year input.");
    }
    const calcROCYear = year - 1911;
    if (!(month > 0 && month < 13)) {
      statusCode = 400;
      throw new Error("阿一年只有 12 個月內 怎麼會多或少???");
    }
    if (month > 1 && month < 8)
      return Response.json({ rocYear: calcROCYear - 1, semistry: 2 });
    else return Response.json({ rocYear: calcROCYear, semistry: 1 });
  } catch (e: any) {
    return Response.json(
      {
        rocYear: null,
        error: e.message,
      },
      {
        status: statusCode,
        statusText: e.messsage,
      },
    );
  }
};
