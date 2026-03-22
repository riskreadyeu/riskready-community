# MCP Proxy — Remote MCP Server for Claude Desktop

**Date:** 2026-03-19
**Status:** Approved
**Scope:** Add HTTPS MCP endpoint to the gateway so Claude Desktop can connect remotely with per-user API key auth

## Problem

Claude Desktop users can connect directly to MCP servers via stdio, but this requires:
- Local database access (no remote connections)
- No security controls (no auth, no audit, no org scoping)
- 9 separate MCP server entries in config

The web app gateway has all security controls but only speaks HTTP — Claude Desktop can't connect to it.

## Solution

Add a new `/mcp` endpoint to the existing gateway that speaks the MCP protocol over HTTP+SSE. Claude Desktop connects as a remote MCP server using a per-user API key.

## Architecture

```
Claude Desktop / Claude Code / Any MCP Client
  │
  │  HTTPS + Authorization: Bearer rr_sk_...
  │
  ▼
Gateway /mcp (MCP HTTP+SSE transport)
  ├── Validate API key → resolve user + org
  ├── tools/list → return all 254 tool schemas
  ├── tools/call →
  │     ├── Inject organisationId (from API key's org)
  │     ├── Log tool call (userId, tool, timestamp)
  │     ├── Validate tool name (TOOL_NAME_PATTERN regex)
  │     ├── Forward to McpToolExecutor
  │     ├── Redact PII from result
  │     └── Return result
  └── Rate limit: 100 tool calls/minute per key
```

### Claude Desktop Config

```json
{
  "mcpServers": {
    "riskready": {
      "type": "url",
      "url": "https://riskready.example.com/mcp",
      "headers": {
        "Authorization": "Bearer rr_sk_abc123def456..."
      }
    }
  }
}
```

One server, one URL, one API key. Replaces 9 separate stdio server entries.

## API Key Management

### Model

```prisma
model McpApiKey {
  id             String   @id @default(cuid())
  prefix         String   // First 8 chars for display: "rr_sk_ab"
  keyHash        String   // bcrypt hash of the full key
  name           String   // User-given label: "My laptop", "CI/CD"
  userId         String
  organisationId String
  lastUsedAt     DateTime?
  createdAt      DateTime @default(now())
  revokedAt      DateTime?

  @@index([prefix])
  @@index([userId])
  @@index([organisationId])
}
```

### Key Format

`rr_sk_` + 40 random hex chars = `rr_sk_a1b2c3d4e5f6...` (46 chars total)

- Prefix `rr_sk_` enables secret scanner detection
- Key shown once on creation, never again
- Stored as bcrypt hash in DB
- `prefix` stored in plain text for display/lookup

### API Key Lifecycle

1. **Create**: User clicks "Create MCP API Key" in AI Settings → enters name → key generated and displayed once
2. **Use**: Claude Desktop sends key in Authorization header → gateway validates via bcrypt → resolves user + org
3. **Audit**: `lastUsedAt` updated on each use
4. **Revoke**: User clicks "Revoke" in AI Settings → `revokedAt` set → key rejected on next use

### Endpoints (NestJS)

- `POST /api/gateway-config/mcp-keys` — Create new key (returns full key once)
- `GET /api/gateway-config/mcp-keys` — List keys (prefix, name, lastUsedAt, createdAt — never the full key)
- `DELETE /api/gateway-config/mcp-keys/:id` — Revoke key

Admin-only access via existing `AdminOnlyGuard`.

## MCP Transport Implementation

### Protocol

The MCP spec defines HTTP+SSE transport:
- Client sends JSON-RPC requests via HTTP POST to `/mcp`
- Server responds with JSON-RPC responses
- For streaming (if needed), server uses SSE

### Request Flow

```
POST /mcp
Authorization: Bearer rr_sk_...
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

Response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      { "name": "mcp__riskready-risks__list_risks", "description": "...", "inputSchema": {...} },
      ...
    ]
  },
  "id": 1
}
```

### Tool Call Flow

```
POST /mcp
Authorization: Bearer rr_sk_...

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "mcp__riskready-risks__list_risks",
    "arguments": { "skip": 0, "take": 10 }
  },
  "id": 2
}
```

Gateway:
1. Validate API key → get userId, organisationId
2. Validate tool name against `TOOL_NAME_PATTERN`
3. Inject `organisationId` into arguments
4. Call `McpToolExecutor.execute()`
5. Redact PII from result
6. Log: `{ userId, tool, org, timestamp, durationMs }`
7. Return JSON-RPC response

## Security (OWASP AI Mapping)

| OWASP AI | Control |
|----------|---------|
| LLM01: Prompt Injection | Not applicable — proxy doesn't construct prompts |
| LLM02: Info Disclosure | PII redaction on all tool results |
| LLM06: Excessive Agency | organisationId injected, createPendingAction enforced via MCP servers |
| LLM10: Unbounded Cost | Rate limit 100 calls/min per key; no API cost (user's subscription) |
| Authentication | Per-user API key, bcrypt hashed, revocable |
| Authorization | Key scoped to user + org |
| Audit | Every tool call logged with identity |

## Files to Create

| File | Purpose |
|------|---------|
| `gateway/src/channels/mcp-http-transport.ts` | MCP HTTP+SSE transport handler on `/mcp` |
| `apps/server/prisma/schema/mcp-api-key.prisma` | McpApiKey model |
| `apps/server/src/gateway-config/mcp-key.service.ts` | API key CRUD + validation |
| `apps/server/src/gateway-config/mcp-key.controller.ts` | REST endpoints for key management |
| `apps/server/src/gateway-config/mcp-key.dto.ts` | DTOs for create/list |

## Files to Modify

| File | Change |
|------|--------|
| `gateway/src/gateway.ts` | Register MCP HTTP transport |
| `apps/web/src/components/settings/AiSettingsTab.tsx` | Add API key management section |
| `apps/web/src/lib/gateway-config-api.ts` | Add key CRUD functions |
| `documentation/CLAUDE_DESKTOP_INTEGRATION.md` | Add remote connection instructions |

## What Doesn't Change

Web app chat, internal HTTP adapter, agent runner, council, scheduler, all 9 MCP servers, approval workflow.
