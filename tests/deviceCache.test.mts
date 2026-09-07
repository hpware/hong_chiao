import assert from "node:assert/strict";
import {
  constants,
  createDecipheriv,
  generateKeyPairSync,
  privateDecrypt,
} from "node:crypto";
import test from "node:test";
import {
  createEncryptedResponseAdditionalData,
  isCacheableTrpcRequest,
  isEncryptedResponseEnvelope,
  rotatesDeviceCacheKey,
} from "../lib/device-cache-protocol.ts";
import { encryptResponseBody } from "../lib/encrypted-response-cache.ts";

test("only explicitly selected read-only tRPC procedures are cacheable", () => {
  assert.equal(
    isCacheableTrpcRequest(
      "GET",
      "https://example.test/api/trpc/home.data?batch=1&input=test",
    ),
    true,
  );
  assert.equal(
    isCacheableTrpcRequest(
      "GET",
      "https://example.test/api/trpc/home.data,user.renewTimer?batch=1",
    ),
    false,
  );
  assert.equal(
    isCacheableTrpcRequest(
      "POST",
      "https://example.test/api/trpc/home.data",
    ),
    false,
  );
});

test("school mutations and authentication changes rotate the device key", () => {
  assert.equal(
    rotatesDeviceCacheKey(
      "POST",
      "https://example.test/api/trpc/user.logout",
    ),
    true,
  );
  assert.equal(
    rotatesDeviceCacheKey(
      "POST",
      "https://example.test/api/trpc/user.changePassword",
    ),
    true,
  );
  assert.equal(
    rotatesDeviceCacheKey(
      "POST",
      "https://example.test/api/trpc/leave.create",
    ),
    true,
  );
  assert.equal(
    rotatesDeviceCacheKey(
      "POST",
      "https://example.test/api/trpc/openaiCompletionProxy",
    ),
    false,
  );
});

test("server envelopes decrypt only with the matching device private key", () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2_048,
  });
  const publicKeyBase64 = publicKey
    .export({ format: "der", type: "spki" })
    .toString("base64");
  const plaintext = Buffer.from("private school response");
  const additionalData = createEncryptedResponseAdditionalData({
    method: "GET",
    url: "https://example.test/api/trpc/reward.get?input=semester-1",
    deviceId: "device-a",
    status: 200,
    contentType: "application/json",
  });
  const envelope = encryptResponseBody(
    plaintext,
    publicKeyBase64,
    200,
    "application/json",
    additionalData,
  );

  assert.equal(isEncryptedResponseEnvelope(envelope), true);
  const contentKey = privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(envelope.wrappedKey, "base64"),
  );
  const encryptedWithTag = Buffer.from(envelope.ciphertext, "base64");
  const authTag = encryptedWithTag.subarray(encryptedWithTag.length - 16);
  const encrypted = encryptedWithTag.subarray(0, -16);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    contentKey,
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAAD(Buffer.from(additionalData, "utf8"));
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  assert.deepEqual(decrypted, plaintext);

  const substitutedDecipher = createDecipheriv(
    "aes-256-gcm",
    contentKey,
    Buffer.from(envelope.iv, "base64"),
  );
  substitutedDecipher.setAAD(
    Buffer.from(
      createEncryptedResponseAdditionalData({
        method: "GET",
        url: "https://example.test/api/trpc/reward.get?input=semester-2",
        deviceId: "device-a",
        status: 200,
        contentType: "application/json",
      }),
      "utf8",
    ),
  );
  substitutedDecipher.setAuthTag(authTag);
  substitutedDecipher.update(encrypted);
  assert.throws(() => substitutedDecipher.final());

  const otherDevice = generateKeyPairSync("rsa", { modulusLength: 2_048 });
  assert.throws(() =>
    privateDecrypt(
      {
        key: otherDevice.privateKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(envelope.wrappedKey, "base64"),
    ),
  );
});

test("invalid encrypted response envelopes are rejected", () => {
  assert.equal(isEncryptedResponseEnvelope(null), false);
  assert.equal(
    isEncryptedResponseEnvelope({
      version: 1,
      algorithm: "plain-text",
      status: 200,
      contentType: "application/json",
      iv: "a",
      ciphertext: "b",
      wrappedKey: "c",
    }),
    false,
  );
});
