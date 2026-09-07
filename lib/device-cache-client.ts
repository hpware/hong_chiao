"use client";

import {
  DEVICE_CACHE_COOKIE,
  DEVICE_CACHE_STATUS_HEADER,
  DEVICE_PUBLIC_KEY_HEADER,
  ENCRYPTED_RESPONSE_HEADER,
  createEncryptedResponseAdditionalData,
  isCacheableTrpcRequest,
  isEncryptedResponseEnvelope,
  rotatesDeviceCacheKey,
  type EncryptedResponseEnvelope,
} from "./device-cache-protocol.ts";

const DATABASE_NAME = "hong-chiao-device-cache";
const STORE_NAME = "keys";
const KEY_RECORD_ID = "current";

type StoredDeviceKeys = {
  id: typeof KEY_RECORD_ID;
  privateKey: CryptoKey;
  publicKey: CryptoKey;
};

type DeviceKeys = StoredDeviceKeys & {
  deviceId: string;
  publicKeyBase64: string;
};

let deviceKeysPromise: Promise<DeviceKeys> | undefined;
let keyLifecycleChannel: BroadcastChannel | undefined;

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionComplete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function deleteKeyDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Device key database is busy"));
  });
}

function getKeyLifecycleChannel() {
  if (typeof BroadcastChannel === "undefined") return undefined;
  if (!keyLifecycleChannel) {
    keyLifecycleChannel = new BroadcastChannel("hong-chiao-device-cache");
    keyLifecycleChannel.onmessage = () => {
      deviceKeysPromise = undefined;
    };
  }
  return keyLifecycleChannel;
}

async function openKeyDatabase() {
  const request = indexedDB.open(DATABASE_NAME, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    }
  };
  return requestResult(request);
}

function isStoredDeviceKeys(value: unknown): value is StoredDeviceKeys {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.id === KEY_RECORD_ID &&
    record.privateKey instanceof CryptoKey &&
    record.publicKey instanceof CryptoKey
  );
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function setDeviceCookie(deviceId: string) {
  document.cookie = `${DEVICE_CACHE_COOKIE}=${deviceId}; Path=/; Max-Age=31536000; SameSite=Strict${location.protocol === "https:" ? "; Secure" : ""}`;
}

async function describeKeys(keys: StoredDeviceKeys): Promise<DeviceKeys> {
  const publicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey("spki", keys.publicKey),
  );
  const deviceId = bytesToBase64(
    new Uint8Array(await crypto.subtle.digest("SHA-256", publicKeyBytes)),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

  setDeviceCookie(deviceId);
  return {
    ...keys,
    deviceId,
    publicKeyBase64: bytesToBase64(publicKeyBytes),
  };
}

async function loadOrCreateDeviceKeys() {
  const database = await openKeyDatabase();
  try {
    const readTransaction = database.transaction(STORE_NAME, "readonly");
    const readComplete = transactionComplete(readTransaction);
    const existing: unknown = await requestResult(
      readTransaction.objectStore(STORE_NAME).get(KEY_RECORD_ID),
    );
    await readComplete;
    if (isStoredDeviceKeys(existing)) return describeKeys(existing);

    const generated = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2_048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      false,
      ["encrypt", "decrypt"],
    );
    const keys: StoredDeviceKeys = {
      id: KEY_RECORD_ID,
      privateKey: generated.privateKey,
      publicKey: generated.publicKey,
    };
    const writeTransaction = database.transaction(STORE_NAME, "readwrite");
    const writeComplete = transactionComplete(writeTransaction);
    writeTransaction.objectStore(STORE_NAME).put(keys);
    await writeComplete;
    return describeKeys(keys);
  } finally {
    database.close();
  }
}

function getDeviceKeys() {
  getKeyLifecycleChannel();
  deviceKeysPromise ??= loadOrCreateDeviceKeys().catch((error: unknown) => {
    deviceKeysPromise = undefined;
    throw error;
  });
  return deviceKeysPromise;
}

async function decryptEnvelope(
  envelope: EncryptedResponseEnvelope,
  privateKey: CryptoKey,
  additionalData: string,
) {
  const contentKey = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    base64ToBytes(envelope.wrappedKey),
  );
  const aesKey = await crypto.subtle.importKey(
    "raw",
    contentKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToBytes(envelope.iv),
      tagLength: 128,
      additionalData: new TextEncoder().encode(additionalData),
    },
    aesKey,
    base64ToBytes(envelope.ciphertext),
  );
}

export async function clearDeviceCacheKey(keepServerCookie = false) {
  const pendingKeys = deviceKeysPromise;
  deviceKeysPromise = undefined;
  await pendingKeys?.catch(() => undefined);
  try {
    await deleteKeyDatabase();
  } finally {
    getKeyLifecycleChannel()?.postMessage("cleared");
    if (!keepServerCookie) {
      document.cookie = `${DEVICE_CACHE_COOKIE}=; Path=/; Max-Age=0; SameSite=Strict`;
    }
  }
}

export async function encryptedDeviceCacheFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const request = new Request(input, init);
  const cacheable = isCacheableTrpcRequest(request.method, request.url);
  let deviceKeys: DeviceKeys | undefined;
  let outgoingRequest = request;

  if (cacheable) {
    try {
      deviceKeys = await getDeviceKeys();
      setDeviceCookie(deviceKeys.deviceId);
      const headers = new Headers(request.headers);
      headers.set(DEVICE_PUBLIC_KEY_HEADER, deviceKeys.publicKeyBase64);
      outgoingRequest = new Request(request, { headers });
    } catch (error: unknown) {
      console.error("Unable to prepare the encrypted device cache", error);
    }
  }

  const response = await fetch(outgoingRequest);
  if (rotatesDeviceCacheKey(request.method, request.url)) {
    try {
      await clearDeviceCacheKey();
    } catch (error: unknown) {
      console.error("Unable to rotate the device cache key", error);
    }
  }
  if (response.headers.get(ENCRYPTED_RESPONSE_HEADER) !== "1") return response;
  if (!response.ok) return response;
  if (!deviceKeys) throw new Error("Encrypted response has no device key");

  const envelope: unknown = await response.json();
  if (!isEncryptedResponseEnvelope(envelope)) {
    throw new Error("The server returned an invalid encrypted response");
  }
  const plaintext = await decryptEnvelope(
    envelope,
    deviceKeys.privateKey,
    createEncryptedResponseAdditionalData({
      method: request.method,
      url: request.url,
      deviceId: deviceKeys.deviceId,
      status: envelope.status,
      contentType: envelope.contentType,
    }),
  );
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "Content-Type": envelope.contentType,
  });
  const cacheStatus = response.headers.get(DEVICE_CACHE_STATUS_HEADER);
  if (cacheStatus) headers.set(DEVICE_CACHE_STATUS_HEADER, cacheStatus);

  return new Response(plaintext, {
    status: envelope.status,
    headers,
  });
}
