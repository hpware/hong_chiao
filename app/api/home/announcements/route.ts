import { chromium, type Browser, type BrowserContext } from "playwright";
import { type NextRequest, NextResponse } from "next/server";
import {
  USER_AGENT,
  endpoint,
  getBrowserCookies,
} from "@/components/univeralComponents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Announcement = {
  unit: string;
  date: string;
  content: string;
};

export const GET = async (request: NextRequest) => {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let statusCode = 500;

  try {
    const rawUrl = process.env.API_URL;

    if (!rawUrl) {
      return NextResponse.json(
        {
          error:
            "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
        },
        { status: 500 },
      );
    }
    const apiUrl = rawUrl;
    const url = new URL(apiUrl);
    statusCode = 401;
    const browserCookies = await getBrowserCookies(request, statusCode, url);
    statusCode = 500;

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ userAgent: USER_AGENT });
    await context.addCookies(browserCookies);

    const response = await context.request.get(endpoint(apiUrl, "/B2KPortal"), {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    });
    if (response.status() !== 200) {
      statusCode = 401;
      throw new Error("It seems like you are logged out?");
    }
    const responseText = await response.text();
    const page = await context.newPage();
    const announcements = await (async () => {
      try {
        await page.setContent(responseText);
        return await page.evaluate<Announcement[]>(() => {
          const normalizeText = (text: string | null | undefined) =>
            text?.replace(/\u00a0/g, " ").trim() ?? "";

          const splitLines = (text: string) =>
            text
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter(Boolean);

          const table = document.querySelector("#tblistOfAnnounce");
          if (!table) return [];

          return Array.from(table.querySelectorAll("tbody tr"))
            .map((row) => {
              const cells = Array.from(row.querySelectorAll("td"));
              const [unitCell, dateCell, topicCell] = cells;
              const labels = Array.from(
                topicCell?.querySelectorAll("label") ?? [],
              )
                .map((label) => normalizeText(label.textContent))
                .filter(Boolean);
              const [title = "", ...contentLabels] = labels;
              const content = contentLabels.flatMap(splitLines);

              return {
                unit: normalizeText(unitCell?.textContent),
                date: normalizeText(dateCell?.textContent),
                content: [title, ...content].filter(Boolean).join("\n"),
              };
            })
            .filter(
              (announcement) =>
                announcement.unit ||
                announcement.date ||
                announcement.content.length > 0,
            );
        });
      } finally {
        await page.close();
      }
    })();

    return Response.json({
      success: true,
      data: announcements,
    });
  } catch (e: any) {
    console.error(e);
    return Response.json(
      {
        error: e.message,
      },
      {
        status: statusCode,
      },
    );
  } finally {
    await context?.close();
    await browser?.close();
  }
};
