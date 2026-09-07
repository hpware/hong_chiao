# 校務系統 Proxy
Most of the code is written by me, some by Codex (GPT-5.5).

## Demo
TPCU => https://tpcu-sw.yhw.tw/auth/login

## !! 注意 !!
本系統並非公司所開發系統，廠商的任何變更都會影響本程式。

## APIs
All of the APIs are in yaak/, install yaak and then import the yaak folder, then you have all of the endpoints avaliable!

## Privacy and in-memory state

The system does not retain school records on the server. School data exists in
server memory only while a request is being processed and returned, and is not
retained after the response or written to server disk. The server does not
cache personal records, page contents, or session cookies.

For abuse protection, the server temporarily stores a client network address
with request counters in process memory. This limited operational data is never
written to disk or sent to another service, is automatically removed after its
short limiting window, and disappears when the process restarts. Warm network
connections contain no shared user session or response cache.

While the site is open, the browser keeps fetched query results in volatile
memory to avoid duplicate requests and provide faster navigation. This query
cache is not written to disk and disappears when the page is reloaded or
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
