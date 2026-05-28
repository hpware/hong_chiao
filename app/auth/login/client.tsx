"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  CodeXmlIcon,
  Eye,
  EyeClosed,
  LockKeyholeIcon,
  RectangleEllipsisIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Client() {
  const router = useRouter();
  const [displayPassword, setDisplayPassword] = useState(false);
  return (
    <div className="absolute inset-0 justify-center items-center flex flex-col">
      <div className="justify-center border-2 rounded-lg p-8">
        <form
          className="flex flex-col space-y-2"
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
                router.push("/");
                return {
                  duration: res.duration,
                };
                /*  success:
                    loginResult.url === endpoint(apiUrl, "/YB2K/B2KPortal/") ? true : false,
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
            <LockKeyholeIcon className="w-10 h-1" />
            <span className="text-2xl">
              登入{process.env.NEXT_PUBLIC_SCHOOL_NAME}校務系統反代
            </span>
          </div>
          <div>
            <label className="text-lg flex flex-row space-x-1 items-center">
              <UserIcon />
              <span>學號:</span>
            </label>{" "}
            <Input
              className="p-1"
              type="text"
              placeholder="Ex: 5xxxxxxx 或 4xxxxxxx"
              name="username"
            />
          </div>
          <div>
            <label className="text-lg flex flex-row space-x-1 items-center">
              <RectangleEllipsisIcon />
              <span>密碼:</span>
            </label>
            <div className="flex flex-row space-x-1">
              <Input
                className="p-1"
                type={displayPassword ? "text" : "password"}
                name="password"
              />
              <Button
                type="button"
                onClick={() => {
                  setDisplayPassword(!displayPassword);
                }}
              >
                {displayPassword ? <EyeClosed /> : <Eye />}
              </Button>
            </div>
          </div>

          <div className="flex justify-between pt-2 items-center">
            <span className="text-sm text-accent-foreground/70 items-center">
              伺服器不會儲存您的帳號密碼與 Cookie。
            </span>
            <Button type="submit">登入</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
