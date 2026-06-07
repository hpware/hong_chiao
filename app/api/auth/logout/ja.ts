import { NextRequest } from "next/server";
import axios from "axios";
export const GET = async (request: NextRequest) => {
  try {
    const userSession = request.cookies.get("ASP.NET_SessionId")?.value;
    const clientIPRand = request.cookies.get("ssClientIP")?.value;
    const aid = request.cookies.get("ssAID")?.value;
    const schoolId = request.cookies.get("ssSchID")?.value;
    const schoolName = request.cookies.get("ssSchName")?.value;
    const loginId = request.cookies.get("ssLoginID")?.value;
    const loginName = request.cookies.get("ssLoginName")?.value;
    if (
      !userSession ||
      !clientIPRand ||
      !aid ||
      !schoolId ||
      !schoolName ||
      !loginId ||
      !loginName
    ) {
      throw new Error("No session found");
    }
    const reqReURLContent = await axios.post(
      `${process.env.API_URL}/B2KPortal/B2KPortal/ReUrlContent`,
      {},
      {
        headers: {
          Cookie: `ASP.NET_SessionId=${userSession};ssClientIP=${clientIPRand};ssAID=${aid};ssSchID=${schoolId};ssSchName=${schoolName};ssLoginID=${loginId};ssLoginName=${loginName}`,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );
    console.log(reqReURLContent);
    const req = await axios.post(
      `${process.env.API_URL}/B2KPortal/B2KPortal/Logout`,
      {},
      {
        headers: {
          Cookie: `ASP.NET_SessionId=${userSession};ssClientIP=${clientIPRand};ssAID=${aid};ssSchID=${schoolId};ssSchName=${schoolName};ssLoginID=${loginId};ssLoginName=${loginName}`,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          DNT: "1",
          Connection: "keep-alive",
          "Sec-GPC": "1",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
        },
      },
    );
    const res = req.data;
    console.log(res);
    request.cookies.delete("ssClientIP");
    request.cookies.delete("ssAID");
    request.cookies.delete("ssSchID");
    request.cookies.delete("ssSchName");
    request.cookies.delete("ssLoginID");
    request.cookies.delete("ssLoginName");
    request.cookies.delete("ASP.NET_SessionId");
    return new Response(JSON.stringify({ message: "Logout successful" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
