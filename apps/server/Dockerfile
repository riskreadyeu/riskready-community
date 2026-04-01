# NOTE: For production, pin to specific digest: FROM node:20-bookworm-slim@sha256:<digest>
# Run: docker pull node:20-bookworm-slim && docker inspect --format='{{index .RepoDigests 0}}' node:20-bookworm-slim
FROM node:20-bookworm-slim AS build
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json .swcrc .npmrc ./
COPY tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma

RUN npm ci

COPY src ./src

RUN npx prisma generate --schema=prisma/schema
RUN npm run build

FROM build AS migrate
CMD ["sh", "-c", "npx prisma db push --schema=prisma/schema --skip-generate && npx prisma db seed"]

# NOTE: For production, pin to specific digest: FROM node:20-bookworm-slim@sha256:<digest>
# Run: docker pull node:20-bookworm-slim && docker inspect --format='{{index .RepoDigests 0}}' node:20-bookworm-slim
FROM node:20-bookworm-slim
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates wget \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/.npmrc ./.npmrc
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

RUN npm prune --omit=dev

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

USER node

CMD ["node", "dist/main.js"]
