# AI Settings Tab

**Date:** 2026-03-19
**Status:** Approved
**Scope:** New "AI Configuration" tab inside /settings page

## Problem

Users have no UI to manage their Anthropic API key, choose a default model, or see token usage. These are configured via env vars or direct DB edits.

## Solution

Add an "AI Configuration" tab to the existing Settings page with three sections: API Key, Model Selection, and Usage Summary.

## Existing Infrastructure

| Component | Status | Location |
|-----------|--------|----------|
| API key encryption (AES-256-GCM) | Done | `apps/server/src/shared/utils/crypto.util.ts` |
| GatewayConfig model | Done | `apps/server/prisma/schema/gateway-config.prisma` |
| GET/PUT /gateway-config | Done | `apps/server/src/gateway-config/gateway-config.controller.ts` |
| AdminOnly guard | Done | `apps/server/src/shared/guards/admin-only.guard.ts` |
| Token tracking per message | Done | `ChatMessage.inputTokens`, `ChatMessage.outputTokens`, `ChatMessage.model` |
| Chat models allowlist | Done | `apps/server/src/chat/chat-models.ts` |

## Design

### Section 1: API Key

- Display masked key from `GET /gateway-config` (shows `sk-ant...xxxx` or "Not configured")
- Text input to enter/update key
- Save calls `PUT /gateway-config` with `{ anthropicApiKey }`
- Green checkmark if key is set, warning icon if not

### Section 2: Default Model

- Dropdown populated from `GET /chat/models`
- Current value from `GET /gateway-config` → `agentModel`
- Save calls `PUT /gateway-config` with `{ agentModel }`
- Note: users can still pick a different model per conversation

### Section 3: Usage Summary (Current Month)

- Total input tokens, output tokens, total tokens
- Estimated cost based on model pricing
- Per-model breakdown table: model name | message count | input tokens | output tokens | estimated cost

**Pricing table (hardcoded in frontend):**

| Model | Input $/1M | Output $/1M |
|-------|-----------|------------|
| claude-haiku-4-5 | $0.80 | $4.00 |
| claude-sonnet-4-5 | $3.00 | $15.00 |
| claude-sonnet-4-6 | $3.00 | $15.00 |
| claude-opus-4-6 | $15.00 | $75.00 |

### New Backend Endpoint

`GET /gateway-config/usage?period=month`

Response:
```json
{
  "period": { "start": "2026-03-01", "end": "2026-03-31" },
  "totals": {
    "messageCount": 47,
    "inputTokens": 125000,
    "outputTokens": 35000
  },
  "byModel": [
    {
      "model": "claude-haiku-4-5-20251001",
      "messageCount": 40,
      "inputTokens": 100000,
      "outputTokens": 28000
    },
    {
      "model": "claude-sonnet-4-5-20250929",
      "messageCount": 7,
      "inputTokens": 25000,
      "outputTokens": 7000
    }
  ]
}
```

SQL (Prisma raw or aggregation):
```sql
SELECT model, COUNT(*) as "messageCount",
  SUM("inputTokens") as "inputTokens",
  SUM("outputTokens") as "outputTokens"
FROM "ChatMessage"
WHERE role = 'ASSISTANT'
  AND "createdAt" >= date_trunc('month', now())
  AND "conversationId" IN (
    SELECT id FROM "ChatConversation" WHERE "organisationId" = $1
  )
GROUP BY model
```

### Frontend Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/gateway-config-api.ts` | API client: getConfig, updateConfig, getUsage |
| `apps/web/src/components/settings/AiSettingsTab.tsx` | Main tab component with 3 sections |
| `apps/web/src/pages/SettingsPage.tsx` | Add "AI Configuration" tab |

### Backend Files

| File | Change |
|------|--------|
| `apps/server/src/gateway-config/gateway-config.controller.ts` | Add `GET /gateway-config/usage` endpoint |
| `apps/server/src/gateway-config/gateway-config.service.ts` | Add `getUsage(organisationId)` method |

### Security

- Admin-only access (existing guard on `/gateway-config`)
- API key never returned in plain text (existing masking)
- Usage endpoint scoped by organisationId (existing pattern)
- No new sensitive data exposed
