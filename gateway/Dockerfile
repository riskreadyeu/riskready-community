FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# --- Gateway dependencies ---
COPY gateway/package.json gateway/package-lock.json* ./
RUN npm ci --ignore-scripts --legacy-peer-deps

# Prisma schema from server for client generation
COPY apps/server/prisma ./prisma
RUN npx prisma@5 generate --schema=./prisma/schema

# Gateway source
COPY gateway/src ./src
COPY gateway/tsconfig.json ./
COPY gateway/skills.yaml ./skills.yaml

# Rewrite MCP paths for container layout
RUN sed -i 's|\.\./mcp-server-|./mcp-servers/mcp-server-|g' skills.yaml

# --- Shared packages used by MCP servers ---
COPY packages/mcp-shared/package.json packages/mcp-shared/package-lock.json* ./packages/mcp-shared/
COPY packages/mcp-shared/src ./packages/mcp-shared/src
COPY packages/mcp-shared/tsconfig.json ./packages/mcp-shared/tsconfig.json
RUN cd /app/packages/mcp-shared \
    && npm ci --ignore-scripts --legacy-peer-deps \
    && mkdir -p node_modules/.prisma node_modules/@prisma \
    && ln -sf /app/node_modules/.prisma/client node_modules/.prisma/client \
    && ln -sf /app/node_modules/@prisma/client node_modules/@prisma/client

# --- MCP servers ---
# controls
COPY apps/mcp-server-controls/package.json apps/mcp-server-controls/package-lock.json ./mcp-servers/mcp-server-controls/
COPY apps/mcp-server-controls/src ./mcp-servers/mcp-server-controls/src
COPY apps/mcp-server-controls/tsconfig.json ./mcp-servers/mcp-server-controls/tsconfig.json

# risks
COPY apps/mcp-server-risks/package.json apps/mcp-server-risks/package-lock.json ./mcp-servers/mcp-server-risks/
COPY apps/mcp-server-risks/src ./mcp-servers/mcp-server-risks/src
COPY apps/mcp-server-risks/tsconfig.json ./mcp-servers/mcp-server-risks/tsconfig.json

# evidence
COPY apps/mcp-server-evidence/package.json apps/mcp-server-evidence/package-lock.json ./mcp-servers/mcp-server-evidence/
COPY apps/mcp-server-evidence/src ./mcp-servers/mcp-server-evidence/src
COPY apps/mcp-server-evidence/tsconfig.json ./mcp-servers/mcp-server-evidence/tsconfig.json

# policies
COPY apps/mcp-server-policies/package.json apps/mcp-server-policies/package-lock.json ./mcp-servers/mcp-server-policies/
COPY apps/mcp-server-policies/src ./mcp-servers/mcp-server-policies/src
COPY apps/mcp-server-policies/tsconfig.json ./mcp-servers/mcp-server-policies/tsconfig.json

# organisation
COPY apps/mcp-server-organisation/package.json apps/mcp-server-organisation/package-lock.json ./mcp-servers/mcp-server-organisation/
COPY apps/mcp-server-organisation/src ./mcp-servers/mcp-server-organisation/src
COPY apps/mcp-server-organisation/tsconfig.json ./mcp-servers/mcp-server-organisation/tsconfig.json

# itsm
COPY apps/mcp-server-itsm/package.json apps/mcp-server-itsm/package-lock.json ./mcp-servers/mcp-server-itsm/
COPY apps/mcp-server-itsm/src ./mcp-servers/mcp-server-itsm/src
COPY apps/mcp-server-itsm/tsconfig.json ./mcp-servers/mcp-server-itsm/tsconfig.json

# audits
COPY apps/mcp-server-audits/package.json apps/mcp-server-audits/package-lock.json ./mcp-servers/mcp-server-audits/
COPY apps/mcp-server-audits/src ./mcp-servers/mcp-server-audits/src
COPY apps/mcp-server-audits/tsconfig.json ./mcp-servers/mcp-server-audits/tsconfig.json

# incidents
COPY apps/mcp-server-incidents/package.json apps/mcp-server-incidents/package-lock.json ./mcp-servers/mcp-server-incidents/
COPY apps/mcp-server-incidents/src ./mcp-servers/mcp-server-incidents/src
COPY apps/mcp-server-incidents/tsconfig.json ./mcp-servers/mcp-server-incidents/tsconfig.json

# agent-ops
COPY apps/mcp-server-agent-ops/package.json apps/mcp-server-agent-ops/package-lock.json ./mcp-servers/mcp-server-agent-ops/
COPY apps/mcp-server-agent-ops/src ./mcp-servers/mcp-server-agent-ops/src
COPY apps/mcp-server-agent-ops/tsconfig.json ./mcp-servers/mcp-server-agent-ops/tsconfig.json

# Install dependencies for all MCP servers + symlink Prisma client + fix #mcp-shared import
RUN for srv in controls risks evidence policies organisation itsm audits incidents agent-ops; do \
      cd /app/mcp-servers/mcp-server-${srv} \
      && npm ci --ignore-scripts --legacy-peer-deps \
      && mkdir -p node_modules/.prisma node_modules/@prisma \
      && ln -sf /app/node_modules/.prisma/client node_modules/.prisma/client \
      && ln -sf /app/node_modules/@prisma/client node_modules/@prisma/client; \
    done

# Symlink _mcp-shared inside each server (source symlinks don't survive COPY)
RUN for srv in controls risks evidence policies organisation itsm audits incidents agent-ops; do \
      ln -sf /app/packages/mcp-shared /app/mcp-servers/mcp-server-${srv}/_mcp-shared; \
    done

# --- Production stage ---
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=builder /app ./

# Non-root user
RUN chown -R node:node /app
USER node

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -qO- http://localhost:3100/health || exit 1

CMD ["npx", "tsx", "src/main.ts"]
