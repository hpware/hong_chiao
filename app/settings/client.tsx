"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeClosed, RectangleEllipsisIcon, Scale } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Client() {
  return (
    <div className="pt-2">
      <div className="p-2">
        <h1 className="text-xl font-semibold">設定</h1>
        <h2 className="text-sm text-muted-foreground">設定與更改使用者資訊</h2>
      </div>
      <div className="pt-4 pl-2 mr-3">
        <section id="password" />
        <ResetPassword />
      </div>
      <div className="pt-4 pl-2 mr-3">
        <section id="details" />
        <ChangeUserInfo />
      </div>
    </div>
  );
}

function ResetPassword() {
  const [displayPassword, setDisplayPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  return (
    <div className="border rounded p-2">
      <h3 className="text-md">變更密碼</h3>
      <form
        className="flex flex-col space-y-2 mt-2"
        onSubmit={(e) => {
          e.preventDefault();
          toast.promise(async () => {
            const allowedCharSet =
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]&!@#\$%\^\*()+=_~{8,20}$/;
            const formData = new FormData(e.currentTarget);
            const oldPassword = formData.get("oldPassword")?.toString() || "";
            const newPassword = formData.get("newPassword")?.toString() || "";
            const confirmPassword =
              formData.get("confirmPassword")?.toString() || "";

            if (!allowedCharSet.test(newPassword)) {
              throw new Error(
                "密碼需要包含 8~20 位的英文大小寫與數字，並僅可以包含這些符號 &!@#$%^*()+=_~。",
              );
            }

            if (newPassword !== confirmPassword) {
              throw new Error("新密碼與確認密碼不匹配");
            }
            if (newPassword === oldPassword) {
              throw new Error("新密碼不可跟前三次一樣");
            }
            const changePasswordRequest = await fetch(
              "/api/auth/changePassword",
              {
                method: "POST",
              },
            );
          });
        }}
      >
        <div>
          <label className="text-sm flex flex-row space-x-1 items-center">
            <RectangleEllipsisIcon />
            <span>舊密碼:</span>
          </label>
          <div className="flex flex-row space-x-1">
            <Input
              className="px-3 py-2"
              type={displayPassword.old ? "text" : "password"}
              name="password"
            />
            <Button
              type="button"
              onClick={() => {
                setDisplayPassword((prev) => ({
                  ...prev,
                  old: !prev.old,
                }));
              }}
              tabIndex={-1}
            >
              {displayPassword.old ? <Eye /> : <EyeClosed />}
            </Button>
          </div>
        </div>
        <div>
          <label className="text-sm flex flex-row space-x-1 items-center">
            <RectangleEllipsisIcon />
            <span>新密碼:</span>
          </label>
          <div className="flex flex-row space-x-1">
            <Input
              className="px-3 py-2"
              type={displayPassword.new ? "text" : "password"}
              name="password"
            />
            <Button
              type="button"
              onClick={() => {
                setDisplayPassword((prev) => ({
                  ...prev,
                  new: !prev.new,
                }));
              }}
              tabIndex={-1}
            >
              {displayPassword.new ? <Eye /> : <EyeClosed />}
            </Button>
          </div>
        </div>
        <div>
          <label className="text-sm flex flex-row space-x-1 items-center">
            <RectangleEllipsisIcon />
            <span>再重複新密碼:</span>
          </label>
          <div className="flex flex-row space-x-1">
            <Input
              className="px-3 py-2"
              type={displayPassword.confirm ? "text" : "password"}
              name="password"
            />
            <Button
              type="button"
              onClick={() => {
                setDisplayPassword((prev) => ({
                  ...prev,
                  confirm: !prev.confirm,
                }));
              }}
              tabIndex={-1}
            >
              {displayPassword.confirm ? <Eye /> : <EyeClosed />}
            </Button>
          </div>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            注意！新密碼不可跟前三次一樣，並需要包含 8~20 位的英文大小寫與數字
          </span>
          <Button type="submit">送出</Button>
        </div>
      </form>
    </div>
  );
}

function ChangeUserInfo() {
  return (
    <div className="border rounded p-2">
      <h3 className="text-md">更改使用者資訊</h3>
      <form
        className="flex flex-col space-y-2 mt-2"
        onSubmit={(e) => {
          e.preventDefault();
          toast.promise(async () => {
            const formData = new FormData(e.currentTarget);
            const oldPassword = formData.get("oldPassword")?.toString() || "";
            const newPassword = formData.get("newPassword")?.toString() || "";
            const confirmPassword =
              formData.get("confirmPassword")?.toString() || "";

            const changePasswordRequest = await fetch(
              "/api/auth/changePassword",
              {
                method: "POST",
              },
            );
          });
        }}
      >
        <div className="flex justify-end text-sm text-muted-foreground">
          <Button type="submit">送出</Button>
        </div>
      </form>
    </div>
  );
}
