import { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
  const body: {
    username: string;
    password: string;
  } = await request.json();
  const sysId = request.cookies.get("ASP.NET_SessionId")?.value;
  let allSysId = sysId;
  const getSession = await fetch(
    `${process.env.API_URL}/YB2K/B2KPortal/Login.aspx`,
    {
      method: "GET",
      headers: {
        ...(sysId ? { Cookie: `ASP.NET_SessionId=${sysId}` } : {}),
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      },
    },
  );
  if (!sysId) {
    const sysid = getSession.headers
      .get("Set-Cookie")
      ?.split(";")[0]
      .split("=")[1];
    allSysId = sysid;
    request.cookies.set({
      name: "ASP.NET_SessionId",
      value: String(sysid),
    });
  }
  const getCaptchaCode = await fetch(
    `${process.env.API_URL}/YB2K/B2KPortal/Account/CreateValidateCode`,
    {
      method: "GET",
      headers: {
        Cookie: `ASP.NET_SessionId=${allSysId}`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  const getCaptchaCodeResult = (await getCaptchaCode.json())[1].ValidateCode;
  console.log(getCaptchaCodeResult);
  // emu env
  const formBuilder = new URLSearchParams();
  formBuilder.append("LoginMode", "");
  formBuilder.append("LoginID", body.username);
  formBuilder.append("Password", body.password);
  formBuilder.append("ValidateCode", getCaptchaCodeResult);
  formBuilder.append("ClearLock", "0");
  console.log(formBuilder.toString());
  console.log(allSysId);

  // send login req
  const response = await fetch(
    `${process.env.API_URL}/YB2K/B2KPortal/Login.aspx`,
    {
      method: "POST",
      headers: {
        Cookie: `ASP.NET_SessionId=${allSysId}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      },
      body: formBuilder.toString(),
    },
  );

  const getHTMLResult = await response.text();
  return new Response(
    `${response.headers.get("Set-Cookie")}\n\n${getHTMLResult}`,
  );
};
