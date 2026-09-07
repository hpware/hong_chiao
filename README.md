# 校務系統 Proxy
Most of the code is written by me, some by Codex (GPT-5.5).

## Demo
TPCU => https://tpcu-sw.yhw.tw/auth/login

## !! 注意 !!
本系統並非公司所開發系統，廠商的任何變更都會影響本程式。

## APIs
All of the APIs are in yaak/, install yaak and then import the yaak folder, then you have all of the endpoints avaliable!

## Privacy, encryption, and temporary storage

The server necessarily handles school data in plaintext while requesting and
processing it. Plaintext school records, page contents, and session cookies are
not written to server disk or stored in Redis.

Selected read-only tRPC responses may be retained for up to one hour in a
separate Redis content cache. Before storage, each response is encrypted with a
new AES-256-GCM key, and that key is wrapped with the current device's 2048-bit
RSA-OAEP public key. The corresponding non-exportable private key is saved in
that browser's IndexedDB and is not sent to the server. Cached entries are
bound to both the authenticated school session and the device key. This
protects a Redis snapshot from revealing the response, but it does not protect
against a compromised live server or same-origin browser code operating while
the user is signed in.

The content-cache Redis instance has disk persistence disabled, a 32 MB data
limit, a 64 MB container limit, a volatile LRU eviction policy, and a one-hour
TTL on every response. Entries can disappear earlier due to eviction or a
Redis restart, but a cache hit can also be up to one hour older than the school
system. Logout requests immediate deletion of that device's entries,
removes its private key, and creates a new key on a later login. School-data
mutations also rotate the device key. If Redis cannot purge immediately, the
old ciphertext is no longer decryptable and remains only until expiry or
eviction.

The implementation boundaries, invalidation behavior, and extension checklist
are documented in [`docs/device-cache.md`](docs/device-cache.md).

For abuse protection, the server hashes the client network address and stores
that hash with request counters in a private Redis service for 10 seconds. This
limited operational data remains in a separate server-side volatile Redis
instance, is never written to disk, and disappears when its short TTL expires
or Redis restarts. The rate-limit Redis is capped at 32 MB of data and its
container at 64 MB. If it is unavailable or full, API requests fail closed
instead of bypassing the limit. Warm network connections contain no shared user
session or response cache. Together, the two provided Redis containers have a
128 MB hard container-memory ceiling on the 1 GB VM.

While the site is open, the browser keeps fetched query results in volatile
memory to avoid duplicate requests and provide faster navigation. This browser
query cache is not written to disk and disappears when the page is reloaded or
closed. Separately, the displayed user name is stored in browser-local storage
until it is updated by a later login or the user clears the site's browser
data. The connection pool shares transport connections only; it does not share
user sessions or response data.

The optional AI assistant is disabled by default. If a user enables it, chat
content and data the user asks the assistant to query may be sent to the AI API
provider configured by that user. Retention by that provider is governed by
the provider's own privacy policy. The configured API key, AI settings, and AI
conversation history are also stored in browser local storage. That history can
include prompts, responses, charts, and school-derived tool results, and
persists across reloads and browser restarts until the user clears the chat or
the site's browser data. Users should enable this only on a trusted device;
same-origin code and browser extensions with site access may be able to read
the locally stored values.

<!--## Q&A
### 我的學校的系統有綁 SSO 還可以用這個系統嗎？
1. 登入系統還是依賴 SSO 與 你的校務系統，並把 Cookie 設定在 Proxy 上，這樣就可以了。-->
