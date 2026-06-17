import { chromium, type Browser, type BrowserContext } from "playwright";
import { type NextRequest, NextResponse } from "next/server";
import {
  USER_AGENT,
  endpoint,
  getBrowserCookies,
} from "@/components/univeralComponents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (
  request: NextRequest,
  websiteContext: { params: Promise<{ id: string }> },
) => {
  const { id } = await websiteContext.params;
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
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
    //const params = request.nextUrl.searchParams;
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);
    const buildURLParams = new URLSearchParams();
    buildURLParams.append("ppqmodel[objid]", "2");
    buildURLParams.append("ppqmodel[Code]", id);
    buildURLParams.append("ppqmodel[Title]", "aa");
    buildURLParams.append("ppqmodel[RMTitle]", "");

    // set new status cookie
    await context.request.post(
      endpoint(apiUrl, "/YSKStu/YSKStu/YSK111SDetail"),
      {
        data: buildURLParams.toString(),
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const buildURLParams2 = new URLSearchParams();
    buildURLParams2.append("ppqmodel[objid]", "1");
    buildURLParams2.append("ppqmodel[IsDtl]", "1");
    const response = await context.request.post(
      endpoint(apiUrl, "/YSKStu/YSKStu/YSK11_Qry"),
      {
        data: buildURLParams2.toString(),
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const responseText = await response.text();
    const data = JSON.parse(responseText);

    if (!data.OK) {
      statusCode = 401;
      throw new Error("Session 過期了或無效。請重新登入。");
    }
    const d = data.obj[0];
    return Response.json({
      success: data.OK,
      errMsg: data.MSG,
      data: {
        metadata: {
          id: d.objid,
          year: d.SemiYear,
          semi: d.Semistry,
          code: d.Code,
          title: d.Title,
          rmTitle: d.RMTitle,
          status: d.Status,
          publishOrg: {
            id: d.UnOrg,
            name: d.UnOrgText,
            personId: d.UnPer,
            personName: d.UnPerText,
            phoneExt: d.OfficePhoneExt,
            email: d.EMail,
          },
          note: d.Memo,
        },
        text: d.Method,
        url: d.URL,
        startDate: d.StartDate,
        endDate: d.EndDate,
        uploadDate: d.UploadDate,
        reward: d.reward,
        requirements: d.ApplyList.map((i: any) => ({
          logic: i.Logic,
          logicText: i.LogicText,
          text: `${i.Operand} ${i.Operator} ${i.Value}`,
          note: d.Memo,
          year: i.Year,
          semi: i.Semi,
        })),
        documents: d.DocList.map((i: any) => ({
          text: i.Code,
          required: i.Choose === "必備",
          file: {
            name: i.ShowFileName,
            url: i.fileTitle,
          },
        })),
        details: d.DetailList, // idk
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
  } finally {
    await context?.close();
    await browser?.close();
  }
};
