import type { Metadata } from "next";
import Link from "next/link";
import nextPackage from "next/package.json";
import reactPackage from "react/package.json";
import { isExactReleaseVersion } from "@/lib/build-version";
import { ExternalLink, GitCommit, GitPullRequest, Server, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "關於",
};

function getDisplayVersion(appVersion?: string, commitSha?: string): string {
  if (isExactReleaseVersion(appVersion) && appVersion) {
    return appVersion;
  }
  if (appVersion && appVersion !== "unknown" && appVersion !== "0.0.0") {
    return appVersion;
  }
  if (commitSha && commitSha !== "unknown") {
    return commitSha.slice(0, 7);
  }
  return "development";
}

function getVersionUrl(appVersion?: string, commitSha?: string): string {
  if (isExactReleaseVersion(appVersion) && appVersion) {
    const tag = appVersion.startsWith("v") ? appVersion : `v${appVersion}`;
    return `https://github.com/hpware/hong_chiao/releases/tag/${tag}`;
  }
  if (commitSha && commitSha !== "unknown") {
    return `https://github.com/hpware/hong_chiao/commit/${commitSha}`;
  }
  return "https://github.com/hpware/hong_chiao/releases";
}

export default function Page() {
  const appVersion = process.env.APP_VERSION;
  const commitSha = process.env.APP_COMMIT_SHA;
  const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME || "校務系統反代";

  const displayVersion = getDisplayVersion(appVersion, commitSha);
  const versionUrl = getVersionUrl(appVersion, commitSha);
  const isRelease = isExactReleaseVersion(appVersion);

  return (
    <div className="pt-2">
      <div className="p-2">
        <h1 className="text-xl font-semibold">關於</h1>
        <p className="text-sm text-muted-foreground">
          關於 Hong Chiao 平台與伺服器系統資訊。
        </p>
      </div>

      <div className="space-y-4 p-2 max-w-4xl text-sm">
        {/* 系統與版本資訊 */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 font-medium">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span>系統與版本資訊</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between border-b pb-2 sm:border-b-0 sm:pb-0">
              <span className="text-muted-foreground">應用程式版本：</span>
              <a
                href={versionUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>{displayVersion}</span>
                {isRelease && (
                  <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-sans">
                    Release
                  </span>
                )}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            </div>

            <div className="flex items-center justify-between border-b pb-2 sm:border-b-0 sm:pb-0">
              <span className="text-muted-foreground">伺服器 Commit：</span>
              {commitSha && commitSha !== "unknown" ? (
                <a
                  href={`https://github.com/hpware/hong_chiao/commit/${commitSha}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                >
                  <GitCommit className="h-3 w-3" />
                  <span>{commitSha.slice(0, 7)}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              ) : (
                <span className="font-mono text-muted-foreground">unknown</span>
              )}
            </div>

            <div className="flex items-center justify-between border-b pb-2 sm:border-b-0 sm:pb-0">
              <span className="text-muted-foreground">Next.js 版本：</span>
              <span className="font-mono">{nextPackage.version}</span>
            </div>

            <div className="flex items-center justify-between border-b pb-2 sm:border-b-0 sm:pb-0">
              <span className="text-muted-foreground">React 版本：</span>
              <span className="font-mono">{reactPackage.version}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Node.js 環境：</span>
              <span className="font-mono">{process.version}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">目標學校：</span>
              <span className="font-medium truncate max-w-[180px]">{schoolName}</span>
            </div>
          </div>
        </div>

        {/* 隱私與安全說明 */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 font-medium">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>隱私與安全說明</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            本系統以反向代理形式直接與學校校務系統通訊，絕不持久化儲存您的學號密碼或敏感資料，保障您的帳號與個人隱私安全。
          </p>
        </div>

        {/* 開源與參與貢獻 */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 font-medium">
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
            <span>開源社群與參與貢獻</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            有什麼你想更換或新增的功能嗎？歡迎 Fork 本專案並透過 Pull Request
            送出更改，或在 GitHub 提出 Issue 反應建議！
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
            <a
              href="https://github.com/hpware/hong_chiao"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>GitHub 儲存庫</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-muted-foreground">·</span>
            <a
              href="https://github.com/hpware/hong_chiao/issues"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>問題回報 (Issues)</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-muted-foreground">·</span>
            <a
              href="https://github.com/hpware/hong_chiao/releases"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>版本釋出 (Releases)</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-muted-foreground">·</span>
            <a
              href="https://github.com/hpware/hong_chiao/blob/master/LICENSE"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:underline inline-flex items-center gap-1"
            >
              <span>MIT License</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* 免責聲明 */}
        <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">免責聲明：</span>
          本系統為第三方獨立開源校務系統代理介面，與學校官方或商業校務軟體廠商無任何直接隸屬關係。所有資料均透過安全通道直接與學校校務系統互動。
        </div>
      </div>
    </div>
  );
}
