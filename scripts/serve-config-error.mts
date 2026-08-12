import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const port: number = Number(process.env.PORT || 3000);
const host = "0.0.0.0";
const outputDirectory = "/tmp/hong-chiao-config-error";
const outputFile = join(outputDirectory, "index.html");
const missingParameters = (process.argv[2] || "")
  .split("\n")
  .map((parameter) => parameter.trim())
  .filter(Boolean);

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const items = missingParameters
  .map((parameter) => `<li><code>${escapeHtml(parameter)}</code></li>`)
  .join("\n");
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>系統設定錯誤與更改需求</title>
  </head>
  <body>
    <main>
      <h1>請更改系統 .env 與聯絡信箱 🙂</h1>
      <p>Next.js 並未開啟主要是因為伺服器管理員 (可能是你) 缺少了設定以下數值:</p>
      <ul>
        ${items}
      </ul>
      <p>設定完請跑 <code>docker compose up -d</code></p>
    </main>
  </body>
</html>
`;

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputFile, html, "utf8");

const server = createServer(async (_request, response) => {
  try {
    const page = await readFile(outputFile);
    response.writeHead(503, {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    });
    response.end(page);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Unable to read the configuration error page.\n");
  }
});

server.listen(port, host, () => {
  console.error(`Configuration error page listening on http://${host}:${port}`);
});
