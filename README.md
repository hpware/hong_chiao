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

Before enabling the limiter, put the app behind a trusted reverse proxy that **overwrites** `X-Real-IP` on every request (never forward the client-supplied value). For example, in an nginx proxy location on the Docker host:

```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_pass http://127.0.0.1:10419;
```

Both Compose files bind the app port to `127.0.0.1:10419`, so remote callers must go through the proxy on the Docker host. For a containerized proxy, use a private Docker network and remove the published app port; for a proxy on another host, restrict app access to that proxy with firewall rules. Do not expose the app port publicly when limiting is enabled: the app trusts `X-Real-IP` and cannot verify who set it. If nginx is itself behind another proxy, configure its trusted client-address handling first. Missing or invalid `X-Real-IP` values are rejected; there is no fallback to `X-Forwarded-For` or a shared unknown-client quota.

Set `ENABLE_RATE_LIMIT=true`. For bundled Redis, use `REDIS_URL=redis://redis:6379` and start with `docker compose --profile rate-limit up -d` (add `-f docker-compose.prod.yml` before `--profile` for the published image). For external Redis, set `REDIS_URL` and omit the profile. There is no Redis startup dependency; while Redis is unavailable, limited operations fail, but local logout still clears cookies and redirects.

The Redis transport currently supports only `redis://host:port` with database 0 (optional `/0`). Credentials, `rediss://`, nonzero databases, query parameters and fragments are rejected at server startup when limiting is enabled.

<!--## Q&A
### 我的學校的系統有綁 SSO 還可以用這個系統嗎？
1. 登入系統還是依賴 SSO 與 你的校務系統，並把 Cookie 設定在 Proxy 上，這樣就可以了。-->
