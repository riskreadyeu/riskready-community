# MCP Proxy Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Add HTTPS MCP endpoint to the gateway with per-user API key auth so Claude Desktop can connect remotely.

**Architecture:** New Prisma model (McpApiKey), NestJS key management endpoints, Fastify MCP HTTP transport, React UI for key CRUD.

**Spec:** `documentation/specs/2026-03-19-mcp-proxy-design.md`

---

## Task 1: Prisma Model — McpApiKey

**Files:**
- Create: `apps/server/prisma/schema/mcp-api-key.prisma`

Add the McpApiKey model with id, prefix, keyHash, name, userId, organisationId, lastUsedAt, createdAt, revokedAt. Run prisma generate.

---

## Task 2: API Key Service + Controller

**Files:**
- Create: `apps/server/src/gateway-config/mcp-key.service.ts`
- Create: `apps/server/src/gateway-config/mcp-key.controller.ts`
- Create: `apps/server/src/gateway-config/mcp-key.dto.ts`
- Modify: `apps/server/src/gateway-config/gateway-config.module.ts`

Service: createKey (generate rr_sk_ + 40 hex, bcrypt hash, store), listKeys (prefix, name, dates), revokeKey, validateKey (lookup by prefix, bcrypt compare, check not revoked, update lastUsedAt).

Controller: POST /api/gateway-config/mcp-keys, GET /api/gateway-config/mcp-keys, DELETE /api/gateway-config/mcp-keys/:id. AdminOnly guard.

---

## Task 3: MCP HTTP Transport

**Files:**
- Create: `gateway/src/channels/mcp-http-transport.ts`
- Modify: `gateway/src/gateway.ts`

Register POST /mcp route on the existing Fastify server. Parse JSON-RPC requests. Handle methods: initialize, tools/list, tools/call. Validate API key via HTTP call to NestJS (POST /api/gateway-config/mcp-keys/validate). Inject organisationId, forward to McpToolExecutor, redact PII, log, return JSON-RPC response.

---

## Task 4: API Key Validation Endpoint

**Files:**
- Modify: `apps/server/src/gateway-config/mcp-key.controller.ts`
- Modify: `apps/server/src/gateway-config/mcp-key.service.ts`

Add internal endpoint POST /api/gateway-config/mcp-keys/validate that the gateway calls to validate a key. Returns { valid, userId, organisationId } or { valid: false }. Protected by gateway secret (not JWT — the gateway calls this, not a browser).

---

## Task 5: Frontend — API Key Management

**Files:**
- Modify: `apps/web/src/components/settings/AiSettingsTab.tsx`
- Modify: `apps/web/src/lib/gateway-config-api.ts`

Add "MCP API Keys" section to AI Settings tab. Create key button (name input → shows key once), list existing keys (prefix, name, last used, revoke button), copy-to-clipboard for new keys, connection instructions shown after creation.

---

## Task 6: Update Documentation

**Files:**
- Modify: `documentation/CLAUDE_DESKTOP_INTEGRATION.md`

Add "Remote Connection" section with URL transport config example, API key setup instructions, and security notes.

---

## Task 7: Docker Test

Push, rebuild Docker, test full flow: create key in UI → configure Claude Desktop → verify tool calls work.
