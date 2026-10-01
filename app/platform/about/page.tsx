import type { Metadata } from "next";
import Link from "next/link";
import nextPackage from "next/package.json";

export const metadata: Metadata = {
  title: "關於",
};

export default function Page() {
  const appVersion = process.env.APP_VERSION;
  const commitSha = process.env.APP_COMMIT_SHA;

  return (
    <div>
      <div className="p-2">
        <h1 className="text-xl font-semibold">關於</h1>
        <p className="text-sm text-muted-foreground">關於本系統的資訊。</p>
      </div>
      <div className="h-full justify-center p-2 text-sm">
        <div>
          <div>
            <span>應用程式版本：</span>
            <span className="font-mono">{appVersion}</span>
          </div>
          <div>
            <span>伺服器 Commit：</span>
            {commitSha && commitSha !== "unknown" ? (
              <a
                href={`https://github.com/hpware/hong_chiao/commit/${commitSha}`}
                className="font-mono underline"
              >
                {commitSha.slice(0, 7)}
              </a>
            ) : (
              <span className="font-mono">unknown</span>
            )}
          </div>
          <div>
            <span>Next.js 版本：</span>
            <span className="font-mono">{nextPackage.version}</span>
          </div>
        </div>
        <div className="flex flex-col pt-2">
          <span>
            有什麼你想更換的嗎? 歡迎 Fork 這個專案並再使用 PR
            送出更改，搞不好會送上正式版 :D
          </span>
          <span>
            <Link
              href="https://github.com/hpware/hong_chiao"
              className="underline text-blue-500 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-200 transition-all duration-300"
            >
              GH Repo!
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
