import {
  createChromeFetch,
  type UpstreamCookies,
} from "@/components/px_items/chromeFetch";
import { load } from "cheerio";
import { endpoint } from "@/components/univeralComponents";

type Announcement = {
  unit: string;
  date: string;
  content: string;
};

function normalizeText(text: string | null | undefined) {
  return text?.replace(/\u00a0/g, " ").trim() ?? "";
}

function splitLines(text: string) {
  return text.split(/\r?\n/).flatMap((line) => {
    const trimmedLine = line.trim();
    return trimmedLine ? [trimmedLine] : [];
  });
}

export default async function GetAnnouncements(
  browserCookies: UpstreamCookies,
) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      "伺服器管理員缺少 API_URL 的環境變數設定，請詢問伺服器管理員。",
    );
  }

  const client = createChromeFetch(browserCookies);

  const response = await client.get(endpoint(apiUrl, "/B2KPortal"), {
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
  if (response.status !== 200) {
    throw new Error("It seems like you are logged out?");
  }

  const $ = load(await response.text());
  return $("#tblistOfAnnounce tbody tr")
    .toArray()
    .reduce<Announcement[]>((announcements, row) => {
      const cells = $(row).find("td").toArray();
      const [unitCell, dateCell, topicCell] = cells;
      const labels = topicCell
        ? $(topicCell)
            .find("label")
            .toArray()
            .flatMap((label) => {
              const text = normalizeText($(label).text());
              return text ? [text] : [];
            })
        : [];
      const [title = "", ...contentLabels] = labels;
      const announcement = {
        unit: normalizeText(unitCell ? $(unitCell).text() : ""),
        date: normalizeText(dateCell ? $(dateCell).text() : ""),
        content: [
          ...(title ? [title] : []),
          ...contentLabels.flatMap(splitLines),
        ].join("\n"),
      };

      if (
        announcement.unit ||
        announcement.date ||
        announcement.content.length > 0
      ) {
        announcements.push(announcement);
      }
      return announcements;
    }, []);
}
