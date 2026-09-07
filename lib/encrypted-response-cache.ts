import {
  constants,
  createCipheriv,
  createHash,
  createHmac,
  createPublicKey,
  publicEncrypt,
  randomBytes,
} from "node:crypto";
import { authCookieNames } from "./auth-cookies.ts";
import {
  DEVICE_CACHE_ALGORITHM,
  DEVICE_CACHE_COOKIE,
  DEVICE_CACHE_STATUS_HEADER,
  DEVICE_CACHE_TTL_SECONDS,
  DEVICE_PUBLIC_KEY_HEADER,
  ENCRYPTED_RESPONSE_HEADER,
  isCacheableTrpcRequest,
  isEncryptedResponseEnvelope,
  type EncryptedResponseEnvelope,
} from "./device-cache-protocol.ts";
import { RedisConnection, type RedisClient } from "./redis-connection.ts";

const CACHE_KEY_PREFIX = "hong-chiao:encrypted-response:v1:";
const DEVICE_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const PUBLIC_KEY_PATTERN = /^[A-Za-z0-9+/=]+$/;
const SESSION_SCOPE_KEY = randomBytes(32);

const cacheRedis = new RedisConnection(
  "CACHE_REDIS_URL",
  "encrypted response cache",
  30_000,
);

type DeviceCacheScope = {
  prefix: string;
  deviceId: string;
  publicKey: string | null;
};

function parseCookies(request: Request) {
  const values = new Map<string, string>();
  for (const item of request.headers.get("cookie")?.split(";") ?? []) {
    const separator = item.indexOf("=");
    if (separator === -1) continue;
    values.set(item.slice(0, separator).trim(), item.slice(separator + 1));
  }
  return values;
}

function sessionFingerprint(cookies: ReadonlyMap<string, string>) {
  const hash = createHmac("sha256", SESSION_SCOPE_KEY);
  for (const name of authCookieNames) {
    const value = cookies.get(name);
    if (!value) return null;
    hash.update(`${name.length}:${name}:${value.length}:${value};`);
  }
  return hash.digest("base64url");
}

function publicKeyFingerprint(publicKey: string) {
  return createHash("sha256")
    .update(Buffer.from(publicKey, "base64"))
    .digest("base64url");
}

function getDeviceCacheScope(
  request: Request,
  requirePublicKey: boolean,
): DeviceCacheScope | null {
  const cookies = parseCookies(request);
  const sessionId = sessionFingerprint(cookies);
  const deviceId = cookies.get(DEVICE_CACHE_COOKIE);
  if (!sessionId || !deviceId || !DEVICE_ID_PATTERN.test(deviceId)) return null;

  const publicKey = request.headers.get(DEVICE_PUBLIC_KEY_HEADER);
  if (requirePublicKey) {
    if (
      !publicKey ||
      publicKey.length > 1_024 ||
      !PUBLIC_KEY_PATTERN.test(publicKey) ||
      publicKeyFingerprint(publicKey) !== deviceId
    ) {
      return null;
    }
  }

  return {
    prefix: `${CACHE_KEY_PREFIX}${sessionId}:${deviceId}:`,
    deviceId,
    publicKey,
  };
}

function requestFingerprint(request: Request) {
  const url = new URL(request.url);
  return createHash("sha256")
    .update(`${request.method}:${url.pathname}${url.search}`)
    .digest("base64url");
}

function encryptedResponse(
  envelope: EncryptedResponseEnvelope,
  cacheStatus: "hit" | "miss",
) {
  return Response.json(envelope, {
    headers: {
      "Cache-Control": "private, no-store",
      [ENCRYPTED_RESPONSE_HEADER]: "1",
      [DEVICE_CACHE_STATUS_HEADER]: cacheStatus,
    },
  });
}

export function encryptResponseBody(
  body: Uint8Array,
  publicKeyBase64: string,
  status: number,
  contentType: string,
): EncryptedResponseEnvelope {
  const publicKey = createPublicKey({
    key: Buffer.from(publicKeyBase64, "base64"),
    format: "der",
    type: "spki",
  });
  if (
    publicKey.asymmetricKeyType !== "rsa" ||
    (publicKey.asymmetricKeyDetails?.modulusLength ?? 0) < 2_048
  ) {
    throw new Error("The device cache requires a 2048-bit RSA public key");
  }

  const contentKey = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", contentKey, iv);
  const encrypted = Buffer.concat([cipher.update(body), cipher.final()]);
  const ciphertext = Buffer.concat([encrypted, cipher.getAuthTag()]);
  const wrappedKey = publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    contentKey,
  );

  return {
    version: 1,
    algorithm: DEVICE_CACHE_ALGORITHM,
    status,
    contentType,
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    wrappedKey: wrappedKey.toString("base64"),
  };
}

export async function readEncryptedResponseCache(request: Request) {
  if (!isCacheableTrpcRequest(request.method, request.url)) return null;
  const scope = getDeviceCacheScope(request, true);
  if (!scope) return null;

  let client: RedisClient | undefined;
  try {
    client = await cacheRedis.getClient();
    const key = `${scope.prefix}${requestFingerprint(request)}`;
    const cached = await client.get(key);
    if (!cached) return null;

    const envelope: unknown = JSON.parse(cached);
    if (!isEncryptedResponseEnvelope(envelope)) {
      await client.del(key);
      return null;
    }
    return encryptedResponse(envelope, "hit");
  } catch (error: unknown) {
    if (client && !client.isReady) cacheRedis.discard(client);
    console.error("Unable to read the encrypted response cache", error);
    return null;
  }
}

export async function encryptAndCacheResponse(
  request: Request,
  response: Response,
) {
  if (!isCacheableTrpcRequest(request.method, request.url)) return response;
  const scope = getDeviceCacheScope(request, true);
  if (!scope?.publicKey) return response;

  const responseBody = new Uint8Array(await response.arrayBuffer());
  let envelope: EncryptedResponseEnvelope;
  try {
    envelope = encryptResponseBody(
      responseBody,
      scope.publicKey,
      response.status,
      response.headers.get("content-type") ?? "application/json",
    );
  } catch (error: unknown) {
    console.error("Unable to encrypt a device-cache response", error);
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  if (response.status === 200) {
    let client: RedisClient | undefined;
    try {
      client = await cacheRedis.getClient();
      await client.set(
        `${scope.prefix}${requestFingerprint(request)}`,
        JSON.stringify(envelope),
        { EX: DEVICE_CACHE_TTL_SECONDS },
      );
    } catch (error: unknown) {
      if (client && !client.isReady) cacheRedis.discard(client);
      console.error("Unable to write the encrypted response cache", error);
    }
  }

  return encryptedResponse(envelope, "miss");
}

export async function purgeDeviceResponseCache(request: Request) {
  const scope = getDeviceCacheScope(request, false);
  if (!scope) return;

  let client: RedisClient | undefined;
  try {
    client = await cacheRedis.getClient();
    for await (const keys of client.scanIterator({
      MATCH: `${scope.prefix}*`,
      COUNT: 100,
    })) {
      if (keys.length > 0) await client.unlink(keys);
    }
  } catch (error: unknown) {
    if (client && !client.isReady) cacheRedis.discard(client);
    console.error("Unable to purge the encrypted device cache", error);
  }
}
