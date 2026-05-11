# --- stage 1 : build ---
FROM node:20-alpine AS build

RUN corepack enable

WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @supfile/shared build
RUN pnpm --filter @supfile/api build
RUN pnpm --filter @supfile/api prisma generate

# --- stage 2 : runtime ---
FROM node:20-alpine AS runtime

RUN corepack enable

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/package.json ./package.json
COPY --from=build /repo/apps/api/prisma ./prisma
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages ./packages

VOLUME ["/data"]
ENV STORAGE_PATH=/data

EXPOSE 3000

CMD sh -c "npx prisma migrate deploy && node dist/main.js"
