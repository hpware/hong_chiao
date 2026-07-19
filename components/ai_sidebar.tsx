"use client";
import {
  Dispatch,
  memo,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { getSemesterFromDate } from "@/lib/semester";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import OpenAI from "openai";

import {
  Bar,
  BarChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  type ChartConfig,
  type DitherColor,
} from "@/components/dither-kit";
import {
  BotIcon,
  SendIcon,
  SquareIcon,
  Trash2Icon,
  WrenchIcon,
  XIcon,
} from "lucide-react";

type AiSettings = {
  apiUrl: string;
  apiToken: string;
  aiModel: string;
  aiBypassCors: boolean;
};

type ChartSpec = {
  chartType: "bar" | "line" | "pie";
  title: string;
  label: string;
  points: { name: string; value: number }[];
};

function readAiSettings(): AiSettings {
  return {
    apiUrl: localStorage.getItem("ai_apiUrl") ?? "",
    apiToken: localStorage.getItem("ai_apiToken") ?? "",
    aiModel: localStorage.getItem("ai_model") ?? "",
    aiBypassCors: localStorage.getItem("ai_bypassCors") === "true",
  };
}

export default function AiSidebar({
  aiOpen,
  setAiOpen,
}: {
  aiOpen: boolean;
  setAiOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const isMobile = useIsMobile();

  // 手機: 用 Sheet 蓋住整頁
  if (isMobile) {
    return (
      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          <SheetTitle className="sr-only">AI 助理</SheetTitle>
          {aiOpen && <Panel />}
        </SheetContent>
      </Sheet>
    );
  }

  // 桌面: 內嵌右側欄，展開時把主內容往左推 (跟左側導覽列一樣)
  return (
    <aside
      className={`sticky top-0 hidden h-svh shrink-0 overflow-hidden border-l bg-background transition-[width] duration-200 ease-in-out md:block ${
        aiOpen ? "w-96 xl:w-[28rem]" : "w-0 border-l-transparent"
      }`}
    >
      <div className="flex h-full w-96 flex-col xl:w-[28rem]">
        {aiOpen && <Panel onClose={() => setAiOpen(false)} />}
      </div>
    </aside>
  );
}

function Panel({ onClose }: { onClose?: () => void }) {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  useEffect(() => {
    setSettings(readAiSettings());
  }, []);

  const missingSettings =
    settings !== null &&
    (settings.apiUrl.trim().length === 0 ||
      settings.apiToken.trim().length === 0 ||
      settings.aiModel.trim().length === 0);

  return (
    <>
      <div className="flex flex-row items-center gap-2 border-b p-4">
        <BotIcon className="size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-medium text-foreground">
            AI 助理
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {missingSettings || settings === null
              ? "尚未完成設定"
              : settings.aiModel}
          </p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="關閉 AI 助理"
            onClick={onClose}
          >
            <XIcon />
          </Button>
        )}
      </div>
      {settings === null ? (
        <div className="flex-1 space-y-3 p-4">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="ml-auto h-9 w-1/2" />
          <Skeleton className="h-9 w-2/3" />
        </div>
      ) : missingSettings ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm">
          <span>
            請先在
            <Link
              href="/settings#local_settings"
              className="text-blue-600 hover:text-blue-600/70 dark:text-blue-300 dark:hover:text-blue-300/70 underline transition-all duration-150"
            >
              設定
            </Link>
            先設定好 AI API, 模型和網址後再繼續
          </span>
        </div>
      ) : (
        <Chat settings={settings} />
      )}
    </>
  );
}

const toolDefs: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_home_summary",
      description: "取得使用者的請假天數統計與缺曠紀錄摘要",
      parameters: {
        type: "object",
        properties: {
          year: {
            type: "number",
            description: "民國學年 (例: 114)，省略代表目前學期",
          },
          semistry: {
            type: "number",
            description: "學期 (1 或 2)，省略代表目前學期",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_leaves",
      description: "取得使用者的請假單列表",
      parameters: {
        type: "object",
        properties: {
          year: {
            type: "number",
            description: "民國學年 (例: 114)，省略代表目前學期",
          },
          semistry: {
            type: "number",
            description: "學期 (1 或 2)，省略代表目前學期",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_rewards",
      description: "取得使用者的獎懲紀錄",
      parameters: {
        type: "object",
        properties: {
          year: {
            type: "number",
            description: "民國學年 (例: 114)，省略代表目前學期",
          },
          semistry: {
            type: "number",
            description: "學期 (1 或 2)，省略代表目前學期",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tuition",
      description: "Obtain the user's tuition payment information.",
      parameters: {
        type: "object",
        properties: {
          year: {
            type: "number",
            description: "民國學年 (例: 114)，省略代表目前學期",
          },
          semistry: {
            type: "number",
            description: "學期 (1 或 2)，省略代表目前學期",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_announcements",
      description: "Get the school announcements.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_name",
      description: "The user's name.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "render_chart",
      description:
        "This is for you, an AI chatbot, to render a pie chart to the user. This pie chart is rendered within the chat already, you do not need to use the markdown image tag to render it.",
      parameters: {
        type: "object",
        properties: {
          chartType: { type: "string", enum: ["bar", "line", "pie"] },
          title: { type: "string", description: "Title of the pie chart" },
          label: {
            type: "string",
            description: "Value name (for example: Days)",
          },
          points: {
            type: "array",
            description: "資料點，依想顯示的順序排列",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Item Name" },
                value: { type: "number" },
              },
              required: ["name", "value"],
            },
          },
        },
        required: ["chartType", "title", "label", "points"],
      },
    },
  },
];

const toolLabels: Record<string, string> = {
  get_home_summary: "請假與缺曠摘要",
  get_leaves: "請假單",
  get_rewards: "獎懲紀錄",
  get_tuition: "學費資訊",
  get_announcements: "公告",
  get_user_name: "使用者姓名",
  render_chart: "圖表",
};

function parseChartSpec(args: Record<string, unknown>): ChartSpec {
  const chartType = args.chartType;
  if (chartType !== "bar" && chartType !== "line" && chartType !== "pie")
    throw new Error("chartType 只支援 bar, line 或 pie");
  const title = typeof args.title === "string" ? args.title : "";
  const label = typeof args.label === "string" ? args.label : "";
  if (!Array.isArray(args.points)) throw new Error("points 必須是陣列");
  let points = args.points
    .map((p) => ({
      name: String((p as Record<string, unknown>)?.name ?? ""),
      value: Number((p as Record<string, unknown>)?.value),
    }))
    .filter((p) => p.name.length > 0 && Number.isFinite(p.value))
    .slice(0, 40);
  if (points.length === 0) throw new Error("points 裡沒有有效的資料點");
  // 圓餅圖最多 6 塊，多的合併成「其他」，顏色固定不輪迴
  if (chartType === "pie" && points.length > 6) {
    const rest = points.slice(5).reduce((sum, p) => sum + p.value, 0);
    points = [...points.slice(0, 5), { name: "其他", value: rest }];
  }
  return { chartType, title, label, points };
}

function Chat({ settings }: { settings: AiSettings }) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant" | "tool" | "chart";
      content: string;
      chart?: ChartSpec;
    }[]
  >([]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<OpenAI.Chat.Completions.ChatCompletionMessageParam[]>(
    [],
  );
  // auto load Chat
  useEffect(() => {
    const saved = localStorage.getItem("ai_chat");
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);
  // auto save chat to localStorage.
  useEffect(() => {
    if (messages.length === 0) {
      localStorage.removeItem("ai_chat");
      return;
    }
    if (messages[messages.length - 1].role === "assistant") {
      localStorage.setItem("ai_chat", JSON.stringify(messages));
    }
  }, [messages]);

  const directUrl = settings.apiUrl.trim().replace(/\/+$/, "");
  // 直連模式才需要瀏覽器端的 OpenAI client；
  // 勾選「透過伺服器傳送」時改走 tRPC 的 openaiCompletionProxy
  const client = useMemo(
    () =>
      settings.aiBypassCors
        ? null
        : new OpenAI({
            apiKey: settings.apiToken,
            baseURL: settings.apiUrl.trim().replace(/\/+$/, ""),
            dangerouslyAllowBrowser: true,
          }),
    [settings],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function runTool(name: string, args: Record<string, unknown>) {
    const current = getSemesterFromDate();
    const year = typeof args.year === "number" ? args.year : current.year;
    const semistry =
      typeof args.semistry === "number" ? args.semistry : current.sem;
    switch (name) {
      case "get_home_summary":
        return queryClient.fetchQuery(
          trpc.home.data.queryOptions({ year, semistry }),
        );
      case "get_leaves":
        return queryClient.fetchQuery(
          trpc.leave.list.queryOptions({ year, semi: semistry }),
        );
      case "get_rewards":
        return queryClient.fetchQuery(
          trpc.reward.get.queryOptions({ year, semistry }),
        );
      case "get_tuition":
        return queryClient.fetchQuery(
          trpc.tuition.get.queryOptions({ year, semistry }),
        );
      case "get_announcements":
        return queryClient.fetchQuery(trpc.home.announcements.queryOptions());
      case "get_user_name":
        return queryClient.fetchQuery(trpc.user.name.queryOptions());
      case "render_chart": {
        const spec = parseChartSpec(args);
        setMessages((prev) => [
          ...prev,
          { role: "chart", content: spec.title, chart: spec },
        ]);
        return { success: true, message: "圖表已顯示給使用者" };
      }
      default:
        throw new Error(`未知的工具: ${name}`);
    }
  }

  async function send() {
    const content = input.trim();
    if (content.length === 0 || loading) return;
    setInput("");
    setError("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content }]);
    const controller = new AbortController();
    abortRef.current = controller;

    const current = getSemesterFromDate();
    const systemMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
      role: "system",
      content: `你是校務系統反代網站裡的 AI 助理，協助學生查詢自己的校務資料。今天是 ${new Date().toLocaleDateString("zh-TW")}，目前是 ${current.year} 學年第 ${current.sem} 學期 (民國學年)。需要使用者資料時請使用提供的工具查詢，不要瞎掰。適合視覺化的數字 (比較、趨勢、佔比) 可以用 render_chart 畫圖表給使用者看。請用繁體中文回覆，並保持簡潔。`,
    };
    const api = [...apiRef.current, { role: "user" as const, content }];

    try {
      // Tool-call 迴圈: 模型要求查資料 → 執行 → 把結果回傳給模型，直到它給出文字回覆
      for (let round = 0; round < 6; round++) {
        const requestMessages = [systemMessage, ...api];
        const stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk> =
          client !== null
            ? await client.chat.completions.create(
                {
                  model: settings.aiModel,
                  messages: requestMessages,
                  tools: toolDefs,
                  stream: true,
                },
                { signal: controller.signal },
              )
            : await trpcClient.openaiCompletionProxy.mutate(
                {
                  api: {
                    url: directUrl,
                    key: settings.apiToken,
                    model: settings.aiModel,
                  },
                  messages: requestMessages as unknown as Record<
                    string,
                    unknown
                  >[],
                  tools: toolDefs as unknown as Record<string, unknown>[],
                },
                { signal: controller.signal },
              );

        let text = "";
        // index 對應模型回傳的 tool_call index，可能不連續
        const toolCallSlots: {
          id: string;
          name: string;
          arguments: string;
        }[] = [];
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          if (!delta) continue;
          if (delta.content) {
            const isFirst = text.length === 0;
            text += delta.content;
            const chunkText = text;
            setMessages((prev) => {
              if (isFirst)
                return [...prev, { role: "assistant", content: chunkText }];
              const next = [...prev];
              next[next.length - 1] = {
                role: "assistant",
                content: chunkText,
              };
              return next;
            });
          }
          for (const tc of delta.tool_calls ?? []) {
            const slot = (toolCallSlots[tc.index] ??= {
              id: "",
              name: "",
              arguments: "",
            });
            if (tc.id) slot.id = tc.id;
            if (tc.function?.name) slot.name += tc.function.name;
            if (tc.function?.arguments) slot.arguments += tc.function.arguments;
          }
        }

        const toolCalls = toolCallSlots.filter(Boolean);
        if (toolCalls.length === 0) {
          api.push({ role: "assistant", content: text });
          break;
        }

        api.push({
          role: "assistant",
          content: text.length > 0 ? text : null,
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        });
        for (const tc of toolCalls) {
          // render_chart 會直接在對話裡放上圖表，不需要再顯示查詢中的提示
          if (tc.name !== "render_chart")
            setMessages((prev) => [
              ...prev,
              {
                role: "tool",
                content: `查詢${toolLabels[tc.name] ?? tc.name}`,
              },
            ]);
          let result: string;
          try {
            result = JSON.stringify(
              await runTool(
                tc.name,
                tc.arguments.length > 0 ? JSON.parse(tc.arguments) : {},
              ),
            );
          } catch (err) {
            result = JSON.stringify({
              error: err instanceof Error ? err.message : "查詢失敗",
            });
          }
          // 避免超長回傳塞爆模型的 context
          api.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result.slice(0, 20000),
          });
        }
        if (controller.signal.aborted) break;
      }
      apiRef.current = api;
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error(err);
        setError(err instanceof Error ? err.message : "未知錯誤");
      }
      apiRef.current = api;
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="pt-6 text-center text-sm text-muted-foreground">
            開始跟 {settings.aiModel} 聊天吧！
          </p>
        )}
        {messages.map((message, i) =>
          message.role === "chart" && message.chart !== undefined ? (
            <AiChart key={i} chart={message.chart} />
          ) : message.role === "tool" ? (
            <p
              key={i}
              className="flex flex-row items-center gap-1 text-xs text-muted-foreground"
            >
              <WrenchIcon className="size-3" />
              {message.content}
            </p>
          ) : (
            <div
              key={i}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] break-words rounded-lg px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "whitespace-pre-wrap bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "assistant" ? (
                  <MarkdownContent content={message.content} />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ),
        )}
        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <p className="text-sm text-muted-foreground">思考中...</p>
        )}
        {error.length > 0 && (
          <p className="text-sm text-destructive">錯誤: {error}</p>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex w-full flex-row items-center gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="清除對話"
          disabled={loading || messages.length === 0}
          onClick={() => {
            setMessages([]);
            setError("");
            apiRef.current = [];
          }}
        >
          <Trash2Icon />
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入訊息..."
          autoFocus
        />
        {loading ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="停止回應"
            onClick={stop}
          >
            <SquareIcon />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            aria-label="送出訊息"
            disabled={input.trim().length === 0}
          >
            <SendIcon />
          </Button>
        )}
      </form>
    </>
  );
}

// 圓餅圖的固定色序 (不輪迴)；「其他」固定用灰色
const PIE_COLORS: DitherColor[] = [
  "blue",
  "green",
  "orange",
  "purple",
  "pink",
  "red",
];

const AiChart = memo(function AiChart({ chart }: { chart: ChartSpec }) {
  if (chart.chartType === "pie") {
    const config: ChartConfig = {};
    chart.points.forEach((point, i) => {
      config[point.name] = {
        label: point.name,
        color: point.name === "其他" ? "grey" : (PIE_COLORS[i] ?? "grey"),
      };
    });
    return (
      <div className="rounded-lg border p-3">
        <p className="text-sm font-medium">{chart.title}</p>
        <div className="mt-2 h-52">
          <PieChart
            data={chart.points}
            config={config}
            dataKey="value"
            nameKey="name"
            bloom="low"
          >
            <Pie variant="gradient" />
            <Legend />
          </PieChart>
        </div>
      </div>
    );
  }

  const config: ChartConfig = {
    value: { label: chart.label, color: "blue" },
  };
  const Chart = chart.chartType === "line" ? LineChart : BarChart;
  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm font-medium">{chart.title}</p>
      <div className="mt-2 h-44">
        <Chart data={chart.points} config={config} bloom="low">
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip labelKey="name" />
          {chart.chartType === "line" ? (
            <Line dataKey="value" />
          ) : (
            <Bar dataKey="value" variant="gradient" />
          )}
        </Chart>
      </div>
    </div>
  );
});

// 聊天氣泡裡的精簡 markdown 樣式。react-markdown 輸出 React 元素，
// 預設不會渲染原始 HTML，所以不需要 DOMPurify
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-2 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-2 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-background/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_hr]:border-border [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-background/60 [&_pre]:p-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:pl-5">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
