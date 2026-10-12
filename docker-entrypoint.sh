#!/bin/sh
set -eu

missing=""

check_required() {
  name="$1"
  value="$(printenv "$name" 2>/dev/null || true)"

  if [ -z "$(printf '%s' "$value" | tr -d '[:space:]')" ]; then
    missing="${missing}${name}
"
  fi
}

check_required API_URL
check_required NEXT_PUBLIC_APP_URL
check_required NEXT_PUBLIC_OWNER_EMAIL

rate_limit_enabled="$(printf '%s' "${ENABLE_RATE_LIMIT:-}" | tr '[:upper:]' '[:lower:]')"
case "$rate_limit_enabled" in
  1|true|yes|on)
    check_required REDIS_URL
    ;;
esac

if [ "$(printf '%s' "${NEXT_PUBLIC_OWNER_EMAIL:-}" | tr -d '[:space:]')" = "changeme@example.com" ]; then
  missing="${missing}NEXT_PUBLIC_OWNER_EMAIL (still set to changeme@example.com)
"
fi

if [ -n "$missing" ]; then
  printf '%s\n' "Missing required configuration:" >&2
  printf '%s' "$missing" >&2
  exec node scripts/serve-config-error.mts "$missing"
fi

exec node server.js
