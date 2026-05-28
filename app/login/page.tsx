"use client";
import { toast } from "sonner";
export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-32 px-16 bg-white dark:bg-black">
      <h1 className="text-2xl">Login</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.promise(
            async () => {
              const formData = new FormData(e.currentTarget);
              const req = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  username: formData.get("username"),
                  password: formData.get("password"),
                }),
              });
              return await req.json();
            },
            {
              success: (final) =>
                `登入完成 耗時 ${Number(final.duration / 1000).toPrecision(2)} 秒`,
              loading: "登入中...",
              error: (e) =>
                `登入失敗: ${e instanceof Error ? e.message : JSON.stringify(e)}`,
            },
          );
        }}
        className="flex flex-col gap-4"
      >
        <input type="text" placeholder="username" name="username" />
        <input type="password" placeholder="password" name="password" />
        <button>submit</button>
      </form>
    </div>
  );
}
