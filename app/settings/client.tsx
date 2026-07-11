"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeClosed, RectangleEllipsisIcon, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function Client() {
  const trpc = useTRPC();
  const router = useRouter();
  return (
    <div className="pt-2">
      <div className="p-2">
        <h1 className="text-xl font-semibold">設定</h1>
        <h2 className="text-sm text-muted-foreground">設定與更改使用者資訊</h2>
      </div>
      <div className="pt-4 pl-2 mr-3">
        <section id="password" />
        <ResetPassword trpc={trpc} router={router} />
      </div>
      <div className="pt-4 pl-2 mr-3">
        <section id="details" />
        <ChangeUserInfo />
      </div>
    </div>
  );
}

function ResetPassword({
  trpc,
  router,
}: {
  trpc: ReturnType<typeof useTRPC>;
  router: ReturnType<typeof useRouter>;
}) {
  const [displayPassword, setDisplayPassword] = useState({
    new: false,
    confirm: false,
  });
  const { mutateAsync: changePassword } = useMutation(
    trpc.user.changePassword.mutationOptions(),
  );
  return (
    <div className="border rounded p-2">
      <h3 className="text-md">變更密碼</h3>
      <form
        className="flex flex-col space-y-2 mt-2"
        onSubmit={(e) => {
          e.preventDefault();
          toast.promise(
            async () => {
              const allowedCharSet =
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d&!@#$%^*()+=_~]{8,20}$/;
              const formData = new FormData(e.currentTarget);
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
              const res = await changePassword({ newPassword });
              if (!res.success) {
                throw new Error(res.message);
              }
              router.push("/auth/login?prefill=true");
              return {
                success: true,
                duration: res.duration,
              };
            },
            {
              loading: "更換中...",
              success: (data) =>
                `密碼已成功更新，請重新登入。 (耗時${data.duration}s)`,
              error: (err) => {
                console.log(err);
                return `錯誤: ${err.message}`;
              },
            },
          );
        }}
      >
        <div>
          <label className="text-sm flex flex-row space-x-1 items-center">
            <RectangleEllipsisIcon />
            <span>新密碼:</span>
          </label>
          <div className="flex flex-row space-x-1">
            <Input
              className="px-3 py-2"
              type={displayPassword.new ? "text" : "password"}
              name="newPassword"
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
              name="confirmPassword"
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
            throw new Error("更改使用者資訊功能尚未完成。");
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
