"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import {
  BotIcon,
  Eye,
  EyeClosed,
  KeyRoundIcon,
  LinkIcon,
  RectangleEllipsisIcon,
  Scale,
  WaypointsIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function Client() {
  const trpc = useTRPC();
  const router = useRouter();
  const pageComponents = [
    {
      section: "local_settings",
      component: <ChangeSiteSettingsOnThisDevice />,
    },
    {
      section: "password",
      component: <ResetPassword trpc={trpc} router={router} />,
    },
    {
      section: "details",
      component: <ChangeUserInfo />,
    },
  ];
  return (
    <div className="pt-2">
      <div className="p-2">
        <h1 className="text-xl font-semibold">設定</h1>
        <h2 className="text-sm text-muted-foreground">設定與更改使用者資訊</h2>
      </div>
      {pageComponents.map(({ section, component }) => (
        <div key={section} className="pt-4 pl-2 mr-3">
          <section id={section} />
          {component}
        </div>
      ))}
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
              variant="outline"
              size="icon"
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
              type={displayPassword.new ? "text" : "password"}
              name="confirmPassword"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
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

function ChangeSiteSettingsOnThisDevice() {
  const [displaySecureDetails, setDisplaySecureDetails] = useState({
    token: false,
  });
  const [preSetDetails, setPreSetDetails] = useState({
    apiUrl: "",
    apiToken: "",
    aiModel: "",
    aiBypassCors: "",
    aiDisabled: "",
  });

  useEffect(() => {
    setPreSetDetails({
      apiUrl: localStorage.getItem("ai_apiUrl") ?? "",
      apiToken: localStorage.getItem("ai_apiToken") ?? "",
      aiModel: localStorage.getItem("ai_model") ?? "",
      aiBypassCors: localStorage.getItem("ai_bypassCors") ?? "",
      aiDisabled: localStorage.getItem("ai_disabled") ?? "",
    });
  }, []);

  return (
    <div className="border rounded p-2">
      <h3 className="text-md">更改網站設定</h3>
      <form
        className="flex flex-col space-y-2 mt-2"
        onSubmit={(e) => {
          e.preventDefault();
          toast.promise(
            async () => {
              // 停用時輸入框會被 disabled、不會進到 FormData，
              // 所以改從受控的 state 讀值，停用時才不會把已存的設定清空
              const apiUrl = preSetDetails.apiUrl.trim();
              const apiToken = preSetDetails.apiToken.trim();
              const aiModel = preSetDetails.aiModel.trim();
              const aiBypassCors =
                preSetDetails.aiBypassCors === "true" ? "true" : "false";
              const aiDisabled =
                preSetDetails.aiDisabled === "true" ? "true" : "false";
              if (aiDisabled !== "true" && (!apiUrl || !apiToken || !aiModel))
                throw new Error("API URL, API Token 和 Model 都必須填寫");
              if (aiDisabled !== "true" && !apiUrl.startsWith("https://"))
                throw new Error("API URL 一定要是 https:// 開頭");
              // save
              localStorage.setItem("ai_apiUrl", apiUrl);
              localStorage.setItem("ai_apiToken", apiToken);
              localStorage.setItem("ai_model", aiModel);
              localStorage.setItem("ai_bypassCors", aiBypassCors);
              localStorage.setItem("ai_disabled", aiDisabled);
              window.dispatchEvent(new Event("ai-settings-changed"));
              setPreSetDetails({
                apiUrl,
                apiToken,
                aiModel,
                aiBypassCors,
                aiDisabled,
              });
            },
            {
              success: "設定已保存",
              error: (err) => `錯誤: ${err.message}`,
            },
          );
        }}
      >
        <div className="flex flex-row space-x-1 items-center">
          <label className="flex flex-row space-x-1 items-center text-lg py-1">
            <BotIcon />
            <span>AI 功能</span>
          </label>
          <Switch
            size="lg"
            name="aiDisabled"
            checked={preSetDetails.aiDisabled === "false"}
            onCheckedChange={(checked) => {
              setPreSetDetails((prev) => ({
                ...prev,
                aiDisabled: checked ? "false" : "true",
              }));
            }}
          />
        </div>
        <div>
          <label className="text-sm flex flex-row space-x-1 items-center">
            <LinkIcon className="p-1" />
            <span>AI API 網址 (OpenAI 格式):</span>
          </label>
          <div className="flex flex-row space-x-1">
            <Input
              className="px-3 py-2"
              name="ai_ApiUrl"
              type="text"
              value={preSetDetails.apiUrl}
              disabled={preSetDetails.aiDisabled === "true"}
              onChange={(e) => {
                setPreSetDetails((prev) => ({
                  ...prev,
                  apiUrl: e.target.value,
                }));
              }}
            />
          </div>
        </div>
        <div>
          <label className="text-sm flex flex-row space-x-1 items-center">
            <KeyRoundIcon className="p-1" />
            <span>AI API 金鑰:</span>
          </label>
          <div className="flex flex-row space-x-1">
            <Input
              className="px-3 py-2"
              name="ai_ApiToken"
              type={displaySecureDetails.token ? "text" : "password"}
              value={preSetDetails.apiToken}
              disabled={preSetDetails.aiDisabled === "true"}
              onChange={(e) => {
                setPreSetDetails((prev) => ({
                  ...prev,
                  apiToken: e.target.value,
                }));
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={preSetDetails.aiDisabled === "true"}
              onClick={() => {
                setDisplaySecureDetails((prev) => ({
                  ...prev,
                  token: !prev.token,
                }));
              }}
              tabIndex={-1}
            >
              {displaySecureDetails.token ? <Eye /> : <EyeClosed />}
            </Button>{" "}
          </div>
        </div>
        <div>
          <label className="text-sm flex flex-row space-x-1 items-center">
            <LinkIcon className="p-1" />
            <span>AI 模型:</span>
          </label>
          <div className="flex flex-row space-x-1">
            <Input
              className="px-3 py-2"
              name="ai_Model"
              type="text"
              value={preSetDetails.aiModel}
              disabled={preSetDetails.aiDisabled === "true"}
              onChange={(e) => {
                setPreSetDetails((prev) => ({
                  ...prev,
                  aiModel: e.target.value,
                }));
              }}
            />
          </div>
        </div>
        <div className="flex flex-row space-x-1 items-center">
          <label className="text-sm flex flex-row space-x-1 items-center">
            <WaypointsIcon className="p-1" />
            <span>AI 要求透過伺服器傳送 (建議開啟，避免AI公司阻擋要求)</span>
          </label>
          <Switch
            name="ai_BypassCors"
            disabled={preSetDetails.aiDisabled === "true"}
            checked={preSetDetails.aiBypassCors === "true"}
            onChange={(checked) => {
              setPreSetDetails((prev) => ({
                ...prev,
                aiBypassCors: checked ? "true" : "false",
              }));
            }}
          />
        </div>
        <div className="flex justify-end text-sm text-muted-foreground">
          <Button type="submit">送出</Button>
        </div>
      </form>
    </div>
  );
}
