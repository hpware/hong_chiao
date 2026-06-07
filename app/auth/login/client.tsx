"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  CodeXmlIcon,
  Eye,
  EyeClosed,
  LockKeyholeIcon,
  RectangleEllipsisIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LoginBG from "./login_bg.jpg";

export default function Client() {
  const router = useRouter();
  const params = useSearchParams();
  const [displayPassword, setDisplayPassword] = useState(false);
  const isExpired = params.get("expired") === "true";

  useEffect(() => {
    if (isExpired) toast.error("登入逾時，請重新登入");
  }, [isExpired]);

  return (
    <>
      {/*bg */}
      <div>
        <Image
          src={LoginBG}
          alt="Background image"
          className="fixed inset-0 z-0 object-cover object-center filter blur-sm opacity-50 w-screen h-screen select-none"
        />
        <span className="absolute bottom-2 right-2 text-xs text-accent-foreground/70 z-50 select-none">
          照片來自{" "}
          <Link
            href="https://unsplash.com/photos/mountains-covered-with-fogs-580TcQCVJ_4?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
            className="hover:text-blue-200 transition-all duration-100 cursor-pointer"
          >
            Unsplash
          </Link>
          。{" "}
          <a
            href="https://github.com/hpware/hong_chiao"
            target="_blank"
            className="hover:text-blue-200 transition-all duration-100 cursor-pointer"
          >
            網站 Source Code
          </a>
        </span>
      </div>
      <div className="absolute inset-0 justify-center items-center flex flex-col">
        <div className="justify-center border-2 rounded-lg p-8 shadow-xl bg-accent/80 z-50">
          <form
            className="flex flex-col space-y-2 select-none"
            onSubmit={(e) => {
              e.preventDefault();
              toast.promise(
                async () => {
                  const data = new FormData(e.currentTarget);
                  const username = data.get("username");
                  const password = data.get("password");
                  // checks
                  if (
                    username === null ||
                    !username ||
                    password === null ||
                    !password
                  )
                    throw new Error("使用者帳戶或密碼不可是空白");
                  const req = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      username,
                      password,
                    }),
                  });
                  const res = await req.json();
                  if (!res.success) {
                    throw new Error(`${res.hdfText}`);
                  }
                  localStorage.setItem("user", username.toString());
                  const nextPath = new URLSearchParams(
                    window.location.search,
                  ).get("next");
                  const finalRedirect =
                    nextPath?.startsWith("/") && !nextPath.startsWith("//")
                      ? nextPath
                      : "/";
                  router.push(finalRedirect);
                  return {
                    duration: res.duration,
                  };
                  /*  success:
                    loginResult.url === endpoint(apiUrl, "/B2KPortal/") ? true : false,
                  remoteStatus: loginResult.status,
                  statusText: loginResult.statusText,
                  url: loginResult.url,
                  duration, */
                },
                {
                  success: (res) =>
                    `登入成功! 耗時${Number(res.duration / 1000).toPrecision(2)}秒`,
                  loading: "登入中...",
                  error: (e) => `錯誤: ${e.message}`,
                },
              );
            }}
          >
            <div>
              <LockKeyholeIcon className="w-10 h-10" />
              <span className="text-2xl select-text">
                登入{process.env.NEXT_PUBLIC_SCHOOL_NAME}校務系統反代
              </span>
            </div>
            <div>
              <label className="text-lg flex flex-row space-x-1 items-center">
                <UserIcon />
                <span>學號:</span>
              </label>{" "}
              <Input className="px-3 py-2" type="text" name="username" />
            </div>
            <div>
              <label className="text-lg flex flex-row space-x-1 items-center">
                <RectangleEllipsisIcon />
                <span>密碼:</span>
              </label>
              <div className="flex flex-row space-x-1">
                <Input
                  className="px-3 py-2"
                  type={displayPassword ? "text" : "password"}
                  name="password"
                />
                <Button
                  type="button"
                  onClick={() => {
                    setDisplayPassword(!displayPassword);
                  }}
                  tabIndex={-1}
                >
                  {displayPassword ? <Eye /> : <EyeClosed />}
                </Button>
              </div>
            </div>

            <div className="flex justify-between pt-2 items-center">
              <span className="text-sm text-accent-foreground/70 items-center select-text">
                伺服器不會儲存您的帳號密碼與 Cookie。
              </span>
              <Button type="submit">登入</Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
