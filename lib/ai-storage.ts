import "client-only";

export type AiSettings = {
  apiUrl: string;
  apiToken: string;
  aiModel: string;
  aiBypassCors: boolean;
  aiDisabled: boolean;
};

export type AiChartSpec = {
  chartType: "bar" | "line" | "pie";
  title: string;
  label: string;
  points: { name: string; value: number }[];
};

export type AiChatMessage = {
  role: "user" | "assistant" | "tool" | "chart";
  content: string;
  chart?: AiChartSpec;
};

export const DEFAULT_AI_SETTINGS: AiSettings = {
  apiUrl: "",
  apiToken: "",
  aiModel: "",
  aiBypassCors: false,
  aiDisabled: true,
};

const DATABASE_NAME = "hong-chiao-proxy";
const DATABASE_VERSION = 1;
const STORE_NAME = "ai-items";
const SETTINGS_KEY = "settings";
const CHAT_KEY = "chat";
const MIGRATION_KEY = "local-storage-migrated";

const LEGACY_KEYS = [
  "ai_apiUrl",
  "ai_apiToken",
  "ai_model",
  "ai_bypassCors",
  "ai_disabled",
  "ai_chat",
] as const;

type StoredItem = {
  key: string;
  value: unknown;
};

let databasePromise: Promise<IDBDatabase> | undefined;
let migrationPromise: Promise<void> | undefined;

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), {
      once: true,
    });
    request.addEventListener(
      "error",
      () => reject(request.error ?? new Error("IndexedDB request failed")),
      { once: true },
    );
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener(
      "abort",
      () => reject(transaction.error ?? new Error("IndexedDB transaction aborted")),
      { once: true },
    );
    transaction.addEventListener(
      "error",
      () => reject(transaction.error ?? new Error("IndexedDB transaction failed")),
      { once: true },
    );
  });
}

function openDatabase(): Promise<IDBDatabase> {
  databasePromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.addEventListener(
      "upgradeneeded",
      () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      },
      { once: true },
    );
    request.addEventListener("success", () => resolve(request.result), {
      once: true,
    });
    request.addEventListener(
      "error",
      () => reject(request.error ?? new Error("Unable to open IndexedDB")),
      { once: true },
    );
  });
  return databasePromise;
}

function readLegacyItems(): Map<(typeof LEGACY_KEYS)[number], string> | null {
  try {
    const values = new Map<(typeof LEGACY_KEYS)[number], string>();
    for (const key of LEGACY_KEYS) {
      const value = window.localStorage.getItem(key);
      if (value !== null) values.set(key, value);
    }
    return values;
  } catch {
    return null;
  }
}

function parseLegacyChat(value: string | undefined): AiChatMessage[] | undefined {
  if (value === undefined) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return isAiChat(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

async function migrateLocalStorage(): Promise<void> {
  const database = await openDatabase();
  const markerTransaction = database.transaction(STORE_NAME, "readonly");
  const marker = await requestResult<StoredItem | undefined>(
    markerTransaction.objectStore(STORE_NAME).get(MIGRATION_KEY),
  );
  if (marker?.value === true) return;

  const legacy = readLegacyItems();
  if (legacy === null) return;

  // Keep the existence checks and writes in one transaction so two tabs doing
  // their first migration cannot overwrite newer IndexedDB values.
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const completed = transactionComplete(transaction);
  const store = transaction.objectStore(STORE_NAME);
  const [existingSettings, existingChat] = await Promise.all([
    requestResult<StoredItem | undefined>(store.get(SETTINGS_KEY)),
    requestResult<StoredItem | undefined>(store.get(CHAT_KEY)),
  ]);
  const hasLegacySettings = LEGACY_KEYS.slice(0, 5).some((key) =>
    legacy.has(key),
  );
  if (existingSettings === undefined && hasLegacySettings) {
    store.put({
      key: SETTINGS_KEY,
      value: {
        apiUrl: legacy.get("ai_apiUrl") ?? "",
        apiToken: legacy.get("ai_apiToken") ?? "",
        aiModel: legacy.get("ai_model") ?? "",
        aiBypassCors: legacy.get("ai_bypassCors") === "true",
        aiDisabled: legacy.get("ai_disabled") !== "false",
      } satisfies AiSettings,
    } satisfies StoredItem);
  }

  const legacyChat = parseLegacyChat(legacy.get("ai_chat"));
  if (existingChat === undefined && legacyChat !== undefined) {
    store.put({ key: CHAT_KEY, value: legacyChat } satisfies StoredItem);
  }
  store.put({ key: MIGRATION_KEY, value: true } satisfies StoredItem);
  await completed;

  try {
    for (const key of LEGACY_KEYS) window.localStorage.removeItem(key);
  } catch {
    // IndexedDB is already authoritative, so blocked legacy cleanup is harmless.
  }
}

async function ensureMigrated(): Promise<void> {
  migrationPromise ??= migrateLocalStorage();
  try {
    await migrationPromise;
  } catch (error) {
    migrationPromise = undefined;
    throw error;
  }
}

async function getItem(key: string): Promise<unknown> {
  await ensureMigrated();
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const item = await requestResult<StoredItem | undefined>(
    transaction.objectStore(STORE_NAME).get(key),
  );
  return item?.value;
}

async function setItem(key: string, value: unknown): Promise<void> {
  await ensureMigrated();
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put({ key, value } satisfies StoredItem);
  await transactionComplete(transaction);
}

async function deleteItem(key: string): Promise<void> {
  await ensureMigrated();
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(key);
  await transactionComplete(transaction);
}

function isAiSettings(value: unknown): value is AiSettings {
  if (typeof value !== "object" || value === null) return false;
  const settings = value as Record<string, unknown>;
  return (
    typeof settings.apiUrl === "string" &&
    typeof settings.apiToken === "string" &&
    typeof settings.aiModel === "string" &&
    typeof settings.aiBypassCors === "boolean" &&
    typeof settings.aiDisabled === "boolean"
  );
}

function isAiChat(value: unknown): value is AiChatMessage[] {
  return (
    Array.isArray(value) &&
    value.every((message: unknown) => {
      if (typeof message !== "object" || message === null) return false;
      const candidate = message as Record<string, unknown>;
      return (
        (candidate.role === "user" ||
          candidate.role === "assistant" ||
          candidate.role === "tool" ||
          candidate.role === "chart") &&
        typeof candidate.content === "string"
      );
    })
  );
}

export async function getAiSettings(): Promise<AiSettings> {
  await ensureMigrated();
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const completed = transactionComplete(transaction);
  const store = transaction.objectStore(STORE_NAME);
  const item = await requestResult<StoredItem | undefined>(
    store.get(SETTINGS_KEY),
  );
  if (isAiSettings(item?.value)) {
    await completed;
    return item.value;
  }
  const defaults = { ...DEFAULT_AI_SETTINGS };
  store.put({ key: SETTINGS_KEY, value: defaults } satisfies StoredItem);
  await completed;
  return defaults;
}

export function saveAiSettings(settings: AiSettings): Promise<void> {
  return setItem(SETTINGS_KEY, settings);
}

export async function getAiChat(): Promise<AiChatMessage[]> {
  const stored = await getItem(CHAT_KEY);
  return isAiChat(stored) ? stored : [];
}

export function saveAiChat(messages: AiChatMessage[]): Promise<void> {
  return setItem(CHAT_KEY, messages);
}

export function deleteAiChat(): Promise<void> {
  return deleteItem(CHAT_KEY);
}
