FROM node:20-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN pnpm run build

# prod
FROM mcr.microsoft.com/playwright:v1.60.0-noble AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright ./node_modules/.pnpm/playwright@1.60.0/node_modules/playwright
COPY --from=builder /app/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core ./node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core

EXPOSE 3000

CMD ["node", "server.js"]
