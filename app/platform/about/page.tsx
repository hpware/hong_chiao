import { readFileSync } from "fs";
import { resolve } from "path";

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
      </div>
    </div>
  );
}
