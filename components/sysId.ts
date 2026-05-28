import { NextRequest } from "next/server";
import generateRandomId from "./generateRandomId";

export default function getSysId(request: NextRequest) {
  const getSysIdCookie = request.cookies.get("ASP.NET_SessionId");
  if (!getSysIdCookie) {
    const newId = generateRandomId(8);
    request.cookies.set({
      name: "ASP.NET_SessionId",
      value: newId,
    });
    return newId;
  }
  const sysId = getSysIdCookie.value;
  return sysId;
}
