import { type NextRequest, NextResponse } from "next/server";
import { getBrowserCookies } from "@/components/univeralComponents";
import GetDiscount from "@/components/px_items/discount";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const { basicHelpInfoData, data } = await GetDiscount(browserCookies);

    if (!(basicHelpInfoData.IsOK && data.IsOK)) {
      statusCode = 401;
      throw new Error(data.MSG || "Session 過期了或無效。請重新登入。");
    }

    const r = data.rmodel;

    const mapFamily = (f: any) => ({
      relation: f?.Relation ?? "",
      alive: f?.Alive ?? "",
      name: f?.Name ?? "",
      idNo: f?.IdNo ?? "",
      job: f?.Job ?? "",
      militaryRank: f?.MilitaryRank ?? "",
    });

    return Response.json({
      success: data.OK,
      errMsg: data.MSG,
      data: {
        note: basicHelpInfoData.Help,
        objId: r.objid,
        applyId: r.ApplyID,
        status: r.Status,
        semiYear: r.SemiYear,
        semester: r.Semistry,
        stage: r.Stage,
        studentId: r.StuId,
        studentName: r.StuName,
        orgName: r.OrgName,
        dayNight: r.DayNight,
        newsStr: r.NewsStr,
        isApply: r.IsApply,
        needCertified: r.NeedCertified,
        phoneNumber: r.PhoneNumber,
        mobileNumber: r.MobileNumber,
        email: r.Email,
        identity: r.Iden,
        originalClan: r.OrigClan,
        isBoarder: r.IsBoarders,
        idNo: r.idno,
        father: mapFamily(r.ReduceFamilyF),
        mother: mapFamily(r.ReduceFamilyM),
        guardian: mapFamily(r.ReduceFamilyG),
        spouse: mapFamily(r.ReduceFamilyS),
      },
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
