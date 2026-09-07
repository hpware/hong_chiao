import type { AppProcedurePath } from "@/trpc/procedure-path";

export const DEVICE_CACHE_COOKIE = "hc_cache_device";
export const DEVICE_PUBLIC_KEY_HEADER = "x-hc-device-public-key";
export const ENCRYPTED_RESPONSE_HEADER = "x-hc-encrypted-response";
export const DEVICE_CACHE_STATUS_HEADER = "x-hc-device-cache";
export const DEVICE_CACHE_TTL_SECONDS = 60 * 60;

export const DEVICE_CACHE_ALGORITHM = "RSA-OAEP-256+A256GCM";

export type EncryptedResponseEnvelope = {
  version: 1;
  algorithm: typeof DEVICE_CACHE_ALGORITHM;
  status: number;
  contentType: string;
  iv: string;
  ciphertext: string;
  wrappedKey: string;
};

type EncryptedResponseIdentity = {
  method: string;
  url: string;
  deviceId: string;
  status: number;
  contentType: string;
};

export function createEncryptedResponseAdditionalData(
  identity: EncryptedResponseIdentity,
) {
  const url = new URL(identity.url, "http://localhost");
  return JSON.stringify({
    version: 1,
    algorithm: DEVICE_CACHE_ALGORITHM,
    request: `${identity.method.toUpperCase()}:${url.pathname}${url.search}`,
    deviceId: identity.deviceId,
    status: identity.status,
    contentType: identity.contentType,
  });
}

const cacheableProcedures: ReadonlySet<string> = new Set([
  "indexPage.basicLeaveData",
  "home.data",
  "home.announcements",
  "home.features",
  "leave.list",
  "leave.downloadHistory",
  "leave.basicInfo",
  "leave.classDetails",
  "certificate.list",
  "tuition.get",
  "tuition.discount.get",
  "tuition.billDownloadId",
  "reward.get",
  "creditApplication.list",
  "creditApplication.details",
  "creditApplication.yourData",
  "user.name",
] as const satisfies readonly AppProcedurePath[]);

const nonRotatingMutations: ReadonlySet<string> = new Set([
  "tuition.proofDownloadId",
  "openaiCompletionProxy",
] as const satisfies readonly AppProcedurePath[]);

export function getTrpcProcedurePaths(url: string) {
  const pathname = new URL(url, "http://localhost").pathname;
  const marker = "/api/trpc/";
  const markerIndex = pathname.indexOf(marker);
  if (markerIndex === -1) return [];

  const encodedPaths = pathname.slice(markerIndex + marker.length);
  if (!encodedPaths) return [];

  try {
    return decodeURIComponent(encodedPaths).split(",");
  } catch {
    return [];
  }
}

export function isCacheableTrpcRequest(method: string, url: string) {
  if (method.toUpperCase() !== "GET") return false;
  const paths = getTrpcProcedurePaths(url);
  return (
    paths.length > 0 && paths.every((path) => cacheableProcedures.has(path))
  );
}

export function rotatesDeviceCacheKey(method: string, url: string) {
  if (method.toUpperCase() !== "POST") return false;
  const paths = getTrpcProcedurePaths(url);
  return (
    paths.length > 0 && paths.some((path) => !nonRotatingMutations.has(path))
  );
}

export function isEncryptedResponseEnvelope(
  value: unknown,
): value is EncryptedResponseEnvelope {
  if (typeof value !== "object" || value === null) return false;

  const envelope = value as Record<string, unknown>;
  return (
    envelope.version === 1 &&
    envelope.algorithm === DEVICE_CACHE_ALGORITHM &&
    typeof envelope.status === "number" &&
    Number.isInteger(envelope.status) &&
    envelope.status >= 100 &&
    envelope.status <= 599 &&
    typeof envelope.contentType === "string" &&
    typeof envelope.iv === "string" &&
    typeof envelope.ciphertext === "string" &&
    typeof envelope.wrappedKey === "string"
  );
}
