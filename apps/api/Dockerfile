# --- stage 1 : build ---
FROM node:20-alpine AS build

RUN apk add --no-cache openssl

RUN corepack enable

WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @supfile/shared build
RUN pnpm --filter @supfile/api exec prisma generate
RUN pnpm --filter @supfile/api build

# --- stage 2 : runtime ---
FROM node:20-alpine AS runtime

RUN apk add --no-cache openssl

ENV NODE_ENV=production

WORKDIR /repo

COPY --from=build /repo/pnpm-workspace.yaml /repo/package.json ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/api ./apps/api

WORKDIR /repo/apps/api

VOLUME ["/data"]
ENV STORAGE_PATH=/data

EXPOSE 3000

CMD sh -c "./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma && node dist/main.js"
