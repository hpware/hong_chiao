"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  CodeXmlIcon,
  Eye,
  EyeClosed,
  InfoIcon,
  LockKeyholeIcon,
  RectangleEllipsisIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LoginBG from "./login_bg.jpg";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Client() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const [displayPassword, setDisplayPassword] = useState(false);
  const [username, setUsername] = useState("");
  const isExpired = params.get("expired") === "true";
  const prefillUserId = params.get("prefill") === "true";

  useEffect(() => {
    if (isExpired) toast.error("登入逾時，請重新登入");
  }, [isExpired]);

  useEffect(() => {
    setUsername(prefillUserId ? (localStorage.getItem("studentId") ?? "") : "");
  }, [prefillUserId]);

  // The login screen always renders in dark mode regardless of the stored
  // preference. Restore the user's theme when leaving the page.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    const previousColorScheme = root.style.colorScheme;
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    return () => {
      root.classList.toggle("dark", wasDark);
      root.style.colorScheme = previousColorScheme;
    };
  }, []);
  const { data: getCaptcha } = useQuery(trpc.user.getCaptcha.queryOptions());
  const loginMutation = useMutation(trpc.user.login.mutationOptions());

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
              // Capture the form synchronously: e.currentTarget is reset to null
              // by React once this handler returns, before the async callback runs.
              const form = e.currentTarget;
              toast.promise(
                async () => {
                  const data = new FormData(form);
                  const username = data.get("username");
                  const password = data.get("password");
                  const captcha = data.get("captcha");
                  // checks
                  if (
                    username === null ||
                    !username ||
                    password === null ||
                    !password ||
                    captcha === null ||
                    !captcha
                  )
                    throw new Error("使用者帳戶, 密碼或驗證碼不可是空白");
                  let res;
                  try {
                    res = await loginMutation.mutateAsync({
                      username: String(username),
                      password: String(password),
                      captcha: String(captcha),
                    });
                  } catch (err) {
                    // The mutation throws (UNAUTHORIZED) on bad credentials —
                    // clear and refresh the captcha, then rethrow for the toast.
                    const captchaInput = form.querySelector(
                      'input[name="captcha"]',
                    ) as HTMLInputElement | null;
                    if (captchaInput) captchaInput.value = "";
                    queryClient.invalidateQueries(
                      trpc.user.getCaptcha.queryFilter(),
                    );
                    throw err;
                  }
                  localStorage.setItem("studentId", String(username)); // only used for the reset password flow (auto relogin)
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
                    changePasswordNotice: res.changePasswordNotice,
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
                    `登入成功! 耗時${Number(res.duration).toPrecision(2)}秒${res.changePasswordNotice ? "，另外您的密碼以六個月沒更換，請盡快更換系統密碼。" : ""}`,
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
              <Input
                className="px-3 py-2"
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
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
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setDisplayPassword(!displayPassword);
                  }}
                  tabIndex={-1}
                >
                  {displayPassword ? <Eye /> : <EyeClosed />}
                </Button>
              </div>
              <div className="pt-2">
                <label className="text-lg flex flex-row space-x-1 items-center">
                  <ShieldCheckIcon />
                  <span>驗證碼:</span>
                </label>
                <div className="flex flex-row space-x-1 max-w-80">
                  {getCaptcha?.image ? (
                    <Image
                      src={getCaptcha.image}
                      alt="captcha"
                      width={150}
                      height={40}
                      onClick={() => {
                        queryClient.invalidateQueries(
                          trpc.user.getCaptcha.queryFilter(),
                        );
                      }}
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center rounded border text-sm text-muted-foreground"
                      style={{ width: 150, height: 40 }}
                    >
                      載入中…
                    </div>
                  )}
                  <Input className="px-3 py-2" type="text" name="captcha" />
                </div>{" "}
              </div>
            </div>

            <div className="flex justify-between pt-2 items-center">
              <Tooltip>
                <TooltipTrigger type="button">
                  <InfoIcon className="text-accent-foreground/70" />
                </TooltipTrigger>
                <TooltipContent className="flex flex-col">
                  <span>學校主機可隨時恢復到原先的密碼</span>
                  <span>伺服器不會儲存您的帳號密碼與 Cookies</span>
                </TooltipContent>
              </Tooltip>
              <Button type="submit">登入</Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
