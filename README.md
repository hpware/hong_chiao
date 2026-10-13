# 校務系統 Proxy

Most of the code is written by me, some by Codex (GPT-5.5).

## Demo

TPCU => https://tpcu-sw.yhw.tw/auth/login

## !! 注意 !!

本系統並非公司所開發系統，廠商的任何變更都會影響本程式。

## 怎麼部署?

本專案使用 Docker compose 部署:

### 下載 compose.yml 與 .env

```bash
curl --output compose.yml https://raw.githubusercontent.com/hpware/hong_chiao/refs/heads/master/docker-compose.prod.yml
curl --output .env https://raw.githubusercontent.com/hpware/hong_chiao/refs/heads/master/.env.example
```

### 打開與設定 .env (環境變數)

```text
API_URL="" # 校務系統網址，重要！必須包含 YB2K 或相關字樣（如: https://sw.tpcu.edu.tw/YB2K 或 https://acad6.tnua.edu.tw/NEWB2K)
NEXT_PUBLIC_SCHOOL_NAME="" # 學校名稱 (可留空)
NEXT_PUBLIC_APP_URL=""
NEXT_PUBLIC_OWNER_EMAIL="changeme@example.com" ## 必須更改成你的信箱！！
ENABLE_RATE_LIMIT="false" # 開限制
REDIS_URL="redis://redis:6379"
```

這裡需要改許多東西

1. `NEXT_PUBLIC_OWNER_EMAIL` 需要是你的信箱 (這個會被顯示在網頁上)
2. `API_URL` 校務系統的網址
3. `NEXT_PUBLIC_APP_URL` 你要用的伺服器網址 這個可能是 `http://localhost:10419` 或是 `https://your-domain.tw`

> [!TIP]
> 如果你想要加 Rate limiting 的話 需要把 `#---------- ENABLE IF YOU WANT RATE LIMITING ---------------` 後面的 `#` 刪除，並在 env 設定 `ENABLE_RATE_LIMIT="true"` 與 Redis 網址。
