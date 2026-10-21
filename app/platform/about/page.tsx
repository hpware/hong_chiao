import type { Metadata } from "next";
import Link from "next/link";
import nextPackage from "next/package.json";
import reactPackage from "react/package.json";
import { isExactReleaseVersion } from "@/lib/build-version";
import {
  Award,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  Cpu,
  ExternalLink,
  GitCommit,
  GitPullRequest,
  Globe,
  HeartHandshake,
  Info,
  Layers,
  Receipt,
  Server,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "關於此平台",
};

interface SystemInfoProps {
  appVersion: string;
  commitSha: string;
  schoolName: string;
  ownerEmail?: string;
  isRateLimitEnabled: boolean;
  isRelease: boolean;
  releaseUrl: string;
  commitUrl: string;
}

function AboutHeader({
  appVersion,
  releaseUrl,
}: {
  appVersion: string;
  releaseUrl: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>開源校務系統代理介面</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Hong Chiao (紅橋)
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            專為大專院校學生與教職員打造的現代化、響應式且注重隱私的校務系統反向代理介面，提供更順暢便利的校園數位體驗。
          </p>
        </div>

        <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background/80 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>版本：</span>
            <a
              href={releaseUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              {appVersion}
            </a>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background/80 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>授權：MIT License</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServerInfoCard({
  appVersion,
  commitSha,
  schoolName,
  ownerEmail,
  isRateLimitEnabled,
  isRelease,
  releaseUrl,
  commitUrl,
}: SystemInfoProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Server className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">伺服器與系統資訊</h2>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Version & Commit */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <GitCommit className="w-4 h-4 text-primary" />
              <span>版本與 Commit</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">應用程式版本：</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <a
                    href={releaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    {appVersion}
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-sans ${
                      isRelease
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {isRelease ? "Release" : "Dev"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">伺服器 Commit：</span>
                {commitSha && commitSha !== "unknown" ? (
                  <a
                    href={commitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>{commitSha.slice(0, 7)}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                ) : (
                  <span className="font-mono text-muted-foreground">unknown</span>
                )}
              </div>
            </div>
          </div>

          {/* Framework & Runtime */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-primary" />
              <span>框架與執行環境</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Next.js 版本：</span>
                <span className="font-mono font-medium">{nextPackage.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">React 版本：</span>
                <span className="font-mono font-medium">{reactPackage.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Node.js 環境：</span>
                <span className="font-mono font-medium">{process.version}</span>
              </div>
            </div>
          </div>

          {/* Platform Environment */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Globe className="w-4 h-4 text-primary" />
              <span>運行設定</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">目標學校：</span>
                <span className="font-medium truncate max-w-[160px]">
                  {schoolName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">流量限制 (Rate Limit)：</span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    isRateLimitEnabled
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isRateLimitEnabled ? "bg-emerald-500" : "bg-muted-foreground"
                    }`}
                  />
                  {isRateLimitEnabled ? "已啟用" : "未啟用"}
                </span>
              </div>
              {ownerEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">管理員：</span>
                  <a
                    href={`mailto:${ownerEmail}`}
                    className="font-mono text-xs hover:underline text-primary"
                  >
                    {ownerEmail}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureHighlights() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">設計理念與特色</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-2.5 shadow-sm hover:border-primary/40 transition-colors">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-base">現代化極速體驗</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            以 Next.js 16 App Router 與 Tailwind CSS 重構舊式校務介面，支援深色/淺色主題與行動裝置最佳化，提供流暢快速的操作體驗。
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-2.5 shadow-sm hover:border-primary/40 transition-colors">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-base">隱私安全優先</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            本代理系統絕不持久化儲存您的學號密碼或認證憑證。所有操作均以直接轉發代理形式與校務系統通訊，保障您的資訊隱私。
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-2.5 shadow-sm hover:border-primary/40 transition-colors">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500">
            <Bot className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-base">內建 AI 智慧助理</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            整合對話式 AI 助理，能即時協助回答選課時程、請假流程與學雜費等校務相關疑問，大幅提升校園生活效率。
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-2.5 shadow-sm hover:border-primary/40 transition-colors">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-base">完整功能模組涵蓋</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            支援學雜費單與補繳單 PDF 線上預覽下載、假單申請與審核追蹤、獎懲紀錄查詢以及課程學分抵免等全方位校務功能。
          </p>
        </div>
      </div>
    </section>
  );
}

function ModuleNavigation() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">主要功能模組</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/tuition"
          className="group rounded-xl border bg-card p-4 space-y-2 shadow-sm hover:border-primary/50 hover:shadow-md transition-colors"
        >
          <div className="flex items-center justify-between">
            <Receipt className="w-5 h-5 text-primary" />
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h4 className="font-semibold text-sm">學雜費專區</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            即時查詢繳費進度、下載原檔 PDF 繳費單與抵免項目申請。
          </p>
        </Link>

        <Link
          href="/leave"
          className="group rounded-xl border bg-card p-4 space-y-2 shadow-sm hover:border-primary/50 hover:shadow-md transition-colors"
        >
          <div className="flex items-center justify-between">
            <Calendar className="w-5 h-5 text-primary" />
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h4 className="font-semibold text-sm">請假系統</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            隨時送出各類假單與附件上傳，精準掌握各關卡審核狀態。
          </p>
        </Link>

        <Link
          href="/reward"
          className="group rounded-xl border bg-card p-4 space-y-2 shadow-sm hover:border-primary/50 hover:shadow-md transition-colors"
        >
          <div className="flex items-center justify-between">
            <Award className="w-5 h-5 text-primary" />
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h4 className="font-semibold text-sm">獎懲與學分</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            歷年獎懲紀錄透明查詢，學分抵免審查歷史一目了然。
          </p>
        </Link>

        <Link
          href="/settings"
          className="group rounded-xl border bg-card p-4 space-y-2 shadow-sm hover:border-primary/50 hover:shadow-md transition-colors"
        >
          <div className="flex items-center justify-between">
            <Info className="w-5 h-5 text-primary" />
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h4 className="font-semibold text-sm">系統與設定</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            深淺主題隨心切換、安全通道密碼修改與工作階段管理。
          </p>
        </Link>
      </div>
    </section>
  );
}

function CommunityCard() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <HeartHandshake className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">開源社群與參與貢獻</h2>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Hong Chiao 為完全開源專案。有任何想新增的功能、發現的問題，或是想為您的學校進行適配？歡迎直接在 GitHub 上提出 Issue 或 Fork 本專案提交 Pull Request！
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href="https://github.com/hpware/hong_chiao"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <GitPullRequest className="w-4 h-4" />
            <span>GitHub 儲存庫</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>

          <a
            href="https://github.com/hpware/hong_chiao/issues"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            <span>回報問題 (Issue)</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>

          <a
            href="https://github.com/hpware/hong_chiao/releases"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            <span>更新紀錄 (Changelog)</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>

          <a
            href="https://github.com/hpware/hong_chiao/blob/master/LICENSE"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            <span>MIT 授權條款</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  const appVersion = process.env.APP_VERSION || "0.0.0";
  const commitSha = process.env.APP_COMMIT_SHA || "unknown";
  const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME || "校務系統反代";
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
  const isRateLimitEnabled = process.env.ENABLE_RATE_LIMIT === "true";
  const isRelease = isExactReleaseVersion(appVersion);

  const releaseUrl = isRelease
    ? `https://github.com/hpware/hong_chiao/releases/tag/${appVersion.startsWith("v") ? appVersion : `v${appVersion}`}`
    : "https://github.com/hpware/hong_chiao/releases";

  const commitUrl =
    commitSha && commitSha !== "unknown"
      ? `https://github.com/hpware/hong_chiao/commit/${commitSha}`
      : "https://github.com/hpware/hong_chiao";

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
      <AboutHeader appVersion={appVersion} releaseUrl={releaseUrl} />
      <ServerInfoCard
        appVersion={appVersion}
        commitSha={commitSha}
        schoolName={schoolName}
        ownerEmail={ownerEmail}
        isRateLimitEnabled={isRateLimitEnabled}
        isRelease={isRelease}
        releaseUrl={releaseUrl}
        commitUrl={commitUrl}
      />
      <FeatureHighlights />
      <ModuleNavigation />
      <CommunityCard />

      {/* Disclaimer */}
      <footer className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
        <p>
          <span className="font-semibold text-foreground">免責聲明：</span>
          本系統為第三方獨立開源校務系統代理介面，與任何學校官方單位或商業校務軟體廠商無任何直接隸屬或背書關係。所有資料均透過安全通道直接與學校原廠校務系統互動，如遇學校官方系統維護或政策更迭，請以各校官方公告為準。
        </p>
      </footer>
    </div>
  );
}
