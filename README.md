# 校務系統 Proxy
Most of the code is written by me, some by Codex (GPT-5.5).

## Demo
TPCU => https://tpcu-sw.yhw.tw/auth/login

## !! 注意 !!
本系統並非公司所開發系統，廠商的任何變更都會影響本程式。

## APIs
All of the APIs are in yaak/, install yaak and then import the yaak folder, then you have all of the endpoints avaliable!

## Optional rate limiting

`ENABLE_RATE_LIMIT` defaults to `false`; normal `docker compose up -d` does not start Redis or wait for it.

Before enabling the limiter, put the app behind a trusted reverse proxy. Generate a secret with `openssl rand -hex 32`, set it as `RATE_LIMIT_PROXY_SECRET` on the app, and configure the proxy to **overwrite** both headers on every request (never forward client-supplied values). For example, in an nginx proxy location:

```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Rate-Limit-Proxy-Secret "<same generated secret>";
proxy_pass http://127.0.0.1:10419;
```

Keep the secret server-side and restrict the app port to the proxy with firewall rules or a loopback binding (`127.0.0.1:10419:3000` for a proxy on the Docker host). Use a private network or TLS between proxy and app. If nginx is itself behind another proxy, configure its trusted client-address handling first. The limiter accepts only authenticated proxy requests with a valid `X-Real-IP`; it does not fall back to `X-Forwarded-For` or a shared unknown-client quota.

Set `ENABLE_RATE_LIMIT=true`. For bundled Redis, use `REDIS_URL=redis://redis:6379` and start with `docker compose --profile rate-limit up -d` (add `-f docker-compose.prod.yml` before `--profile` for the published image). For external Redis, set `REDIS_URL` and omit the profile. There is no Redis startup dependency; while Redis is unavailable, limited operations fail, but local logout still clears cookies and redirects.

The Redis transport currently supports only `redis://host:port` with database 0 (optional `/0`). Credentials, `rediss://`, nonzero databases, query parameters and fragments are rejected at server startup when limiting is enabled.

<!--## Q&A
### 我的學校的系統有綁 SSO 還可以用這個系統嗎？
1. 登入系統還是依賴 SSO 與 你的校務系統，並把 Cookie 設定在 Proxy 上，這樣就可以了。-->
