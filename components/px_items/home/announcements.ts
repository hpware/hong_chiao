import { chromium, type Browser, type BrowserContext } from "playwright";
import {
  USER_AGENT,
  endpoint,
  type BrowserCookieType,
} from "@/components/univeralComponents";

type Announcement = {
  unit: string;
  date: string;
  content: string;
};

export default async function GetAnnouncements(
  browserCookies: BrowserCookieType,
) {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      throw new Error(
        "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
      );
    }

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
      throw new Error("It seems like you are logged out?");
    }

    const page = await context.newPage();
    try {
      await page.setContent(await response.text());
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
  } finally {
    await context?.close();
    await browser?.close();
  }
}
