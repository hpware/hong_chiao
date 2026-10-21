FROM node:24-bookworm-slim AS base

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
ARG BUILD_COMMIT_SHA
ARG BUILD_VERSION
ENV BUILD_COMMIT_SHA=$BUILD_COMMIT_SHA
ENV BUILD_VERSION=$BUILD_VERSION
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN pnpm run build
RUN if [ -n "$BUILD_COMMIT_SHA" ]; then \
      grep -Fq "$BUILD_COMMIT_SHA" .next/server/app/platform/about.html; \
    fi
RUN if [ -n "$BUILD_VERSION" ]; then \
      grep -Fq "$BUILD_VERSION" .next/server/app/platform/about.html; \
    fi

# prod
FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY docker-entrypoint.sh ./docker-entrypoint.sh
COPY scripts/serve-config-error.mts ./scripts/serve-config-error.mts

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
