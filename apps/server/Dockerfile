FROM node:25-bookworm-slim AS build
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json .swcrc ./
COPY tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma

RUN npm ci

COPY src ./src

RUN npx prisma generate --schema=prisma/schema
RUN npm run build

FROM build AS migrate
CMD ["npx", "prisma", "db", "push", "--schema=prisma/schema", "--skip-generate"]

FROM node:25-bookworm-slim
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates wget \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

RUN npm prune --omit=dev

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

USER node

CMD ["node", "dist/main.js"]
