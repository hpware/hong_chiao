import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const port = Number(process.env.PORT || 3000);
const host = "0.0.0.0";
const outputDirectory = "/tmp/hong-chiao-config-error";
const outputFile = join(outputDirectory, "index.html");
const missingParameters = (process.argv[2] || "")
  .split("\n")
  .map((parameter) => parameter.trim())
  .filter(Boolean);

const escapeHtml = (value) =>
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
    <title>Missing configuration</title>
  </head>
  <body>
    <main>
      <h1>Missing required configuration</h1>
      <p>The application did not start because these environment variables are missing or invalid:</p>
      <ul>
        ${items}
      </ul>
      <p>Set the variables and restart the container.</p>
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
  console.error(
    `Configuration error page listening on http://${host}:${port}`,
  );
});
