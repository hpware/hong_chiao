import type { Metadata } from "next";
import { readFileSync } from "fs";
import Link from "next/link";
import { resolve } from "path";

export const metadata: Metadata = {
  title: "關於",
};

function getPackageVersion(pkgPath: string): string {
  try {
    const json = JSON.parse(readFileSync(resolve(pkgPath), "utf-8"));
    return json.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

export default function Page() {
  const appVersion = getPackageVersion("./package.json");
  const nextVersion = getPackageVersion("./node_modules/next/package.json");

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
            <span>Next.js 版本：</span>
            <span className="font-mono">{nextVersion}</span>
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
        <section className="mt-4 rounded-lg border p-4">
          <h2 className="font-semibold">隱私與暫存說明</h2>
          <div className="mt-2 space-y-2 text-muted-foreground">
            <p>
              為了讓操作更快並避免伺服器被大量請求影響，本系統會在伺服器記憶體中暫時保留連線，以及用於流量限制的網路位址與請求次數。
              這些流量限制資料不會寫入磁碟或傳送至其他服務，並會在限制時段結束後自動清除；伺服器重新啟動時也會全部消失。
            </p>
            <p>
              伺服器不會快取校務系統回傳的個人資料、頁面內容或 Session
              Cookie。連線池只重複使用網路連線，不會在使用者之間共用登入狀態或回應內容。
            </p>
            <p>
              為了減少重複請求並提供較快的操作體驗，網站開啟期間，瀏覽器會在記憶體中暫存已取得的查詢結果；這項快取不會寫入磁碟，重新載入或關閉頁面後便會消失。
            </p>
            <p>
              顯示用的使用者名稱會另外儲存在瀏覽器本機。登出會清除登入
              Cookie；本機顯示名稱會保留到下次登入時被更新，或由使用者清除瀏覽器的網站資料。
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
