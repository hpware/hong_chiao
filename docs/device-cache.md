# Encrypted device response cache

This cache speeds up selected read-only tRPC queries without placing readable
school records in Redis. It is deliberately separate from the rate limiter.
Content eviction must never weaken request limits.

## Data flow

1. On the first cacheable request, the browser creates a 2048-bit RSA-OAEP key
   pair. The non-exportable private key stays in IndexedDB.
2. The browser exports only the public key, fingerprints it into the
   `hc_cache_device` cookie, and sends the public key with cacheable requests.
3. The server binds the cache key to a process-keyed hash of the authenticated
   school-session cookies, the device fingerprint, the procedure path, and its
   input. Restarting the application therefore also abandons existing cache
   entries without exposing the session values.
4. On a miss, the server gets the normal tRPC response, encrypts it with a new
   AES-256-GCM key, and wraps that key with the device RSA public key.
5. Redis receives only the encrypted envelope. The browser unwraps and decrypts
   the response before tRPC sees it.

AES-GCM authenticated additional data binds the ciphertext to its request
method, procedure path, query input, device ID, response status, and content
type. Moving an otherwise valid envelope to another Redis key or editing its
plaintext metadata therefore makes browser decryption fail.

The school response is necessarily plaintext in the application process before
encryption. This design protects stored cache contents; it is not end-to-end
encryption against the running server.

A hit can be up to one hour older than the upstream school system. Keep the
allowlist limited to reads where that staleness is acceptable; changes made
outside this application cannot trigger local invalidation.

## Boundaries

- `lib/device-cache-protocol.ts` owns protocol constants, the explicit query
  allowlist, and envelope validation. Add a query here only if it is read-only
  and safe to remain stale for up to one hour.
- `lib/device-cache-client.ts` owns IndexedDB keys, request headers, decryption,
  browser-key deletion, and multi-tab key-lifecycle notifications.
- `lib/encrypted-response-cache.ts` owns session/device scoping, encryption,
  Redis access, expiry, and purge behavior.
- `lib/redis-connection.ts` contains the shared connection lifecycle used by
  both isolated Redis workloads.
- `app/api/trpc/[trpc]/route.ts` is the only tRPC integration point.

Do not add caching inside individual routers. Keeping it at the serialized HTTP
boundary prevents decrypted values from being retained by the server cache.

## Invalidation and logout

- School-data and authentication mutations request a purge and rotate the
  browser key. The AI proxy and read-only proof-download mutation are explicit
  exceptions. New mutations rotate by default. If Redis is temporarily
  unavailable during a purge, old ciphertext is therefore undecryptable and
  remains only until its TTL or eviction.
- Logout and password changes delete the browser private key.
- The direct logout endpoint requests a Redis purge before clearing cookies and
  marks the login redirect so the browser removes any key left after direct
  navigation.
- Every Redis entry also expires after one hour and may be evicted sooner.

If the same browser signs in as another account without a normal logout, its
existing device key cannot address the previous account's cache because the
cache scope includes the authenticated school session.

## Resource limits

`CACHE_REDIS_URL` must point to the content-cache Redis instance, not the
rate-limit Redis instance. The provided Compose configuration disables disk
persistence, caps the content dataset at 32 MB, caps the container at 64 MB,
and uses `volatile-lru` because every content key has a TTL.

Content caching fails open: if its Redis instance is unavailable, requests use
fresh upstream responses. The app only waits for the cache container to start,
whereas the separate rate-limit Redis must pass its health check because abuse
protection intentionally fails closed. After a cache connection failure, the
app waits 30 seconds before trying that optional Redis service again.

## Testing changes

Run:

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm run build
pnpm exec react-doctor --verbose --scope changed
docker compose config --quiet
docker compose -f docker-compose.prod.yml config --quiet
```
