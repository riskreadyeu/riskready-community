# Agent Security Audit — 8-Point Framework

Comprehensive security assessment of RiskReady's AI implementation across two connection modes: the Web App (gateway-mediated) and the MCP Proxy (Claude Desktop via API key).

> **Last updated:** 2026-03-29 — reflects AI audit remediation (PR #32: 21 findings fixed).

## Summary

| Point | Gateway (Web UI) | MCP Proxy (Claude Desktop) |
|-------|:---:|:---:|
| 1. Identity & Authorization | 9/10 | 10/10 |
| 2. Memory & Data Retention | 8/10 | 8/10 |
| 3. Tool Trust & Indirect Injection | 10/10 | 9/10 |
| 4. Blast Radius | 9/10 | 10/10 |
| 5. Human Checkpoints | 9/10 | 8/10 |
| 6. Output Validation | 9/10 | 7/10 |
| 7. Cost Controls | 8/10 | 10/10 |
| 8. Observability | 9/10 | 9/10 |
| **Overall** | **8.9/10** | **8.9/10** |

---

## Detailed Justification

### 1. Identity & Authorization

**Gateway: 9/10**

Every request is authenticated via JWT with session cookies. The `McpToolExecutor` force-injects `organisationId` on every tool call (`mcp-tool-executor.ts:63`), overriding any model-supplied value. Source tracking logs whether a call came from `web_ui`, `scheduler`, or `mcp_proxy` (`agent-runner.ts:427`).

*Gap: Cannot distinguish human-initiated from agent-initiated tool calls within the same source.*

**MCP Proxy: 10/10**

Per-user API keys with `rr_sk_` prefix, bcrypt hashed (`mcp-key.service.ts:15`). Per-tool permission scoping via `isToolAllowed()` — keys can be limited to read-only, write, or specific domains (`mcp-http-transport.ts:69`). `organisationId` injected from the key's associated org. Source tracked as `mcp_proxy`. Keys are revocable, named, and show `lastUsedAt`.

*No gap — the API key IS the identity. Per-tool scoping provides least-privilege access.*

---

### 2. Memory & Data Retention

**Gateway: 8/10** *(was 7/10)*

The `MemoryDistiller` stores conversation insights with a 90-day TTL (`memory.service.ts:25`). Expired memories are filtered from search results (`search.service.ts:41`). Distilled memories are scanned for injection patterns before storage (`distiller.ts`). Memory recall is org+user scoped. **Recalled memories are now scanned for injection patterns before being injected into agent context** (`agent-runner.ts` — memory injection scanning), closing the risk of poisoned memories influencing agent behaviour across sessions.

*Gap: No admin UI for viewing or deleting stored memories.*

**MCP Proxy: 8/10**

Stateless — the proxy stores nothing between requests. No memory accumulation risk. Claude Desktop manages its own memory locally (Anthropic's responsibility). The proxy never contributes to or reads from the memory database.

*No gap for the proxy itself. Claude Desktop's local memory is outside your control.*

---

### 3. Tool Trust & Indirect Injection

**Gateway: 10/10** *(was 9/10)*

All 254 tools are first-party, in-repo. Zod schemas validate all inputs with shared `zId` and `zodUuidOrCuid` types for UUIDs/CUIDs (`security/validators.ts`), `.max()` bounds on strings/numbers/arrays, and enums for status fields. Tool names validated against `TOOL_NAME_PATTERN` regex (`/^mcp__[a-z][a-z0-9-]*__[a-z][a-z0-9_]*$/`) before dispatch (`mcp-tool-executor.ts:53`). No third-party MCP servers, no dynamic tool loading.

**Multi-layered injection defence (new):**
1. `detectInjectionPatterns()` scans user input for 12+ patterns including synonym variations, jailbreak attempts, and base64 payloads (`injection-detector.ts`)
2. `buildInjectionWarning()` injects an LLM-facing warning into the system prompt when injection patterns are detected, instructing the agent to treat the input as untrusted (`agent-runner.ts`)
3. `sanitizeToolResult()` scans MCP tool results for indirect prompt injection before passing them back to the LLM (`tool-result-sanitizer.ts`, `message-loop.ts`), wrapping suspicious content with `[TOOL DATA - TREAT AS UNTRUSTED]`
4. Memory recall injection scanning prevents poisoned memories from influencing agent behaviour (`agent-runner.ts`)

*Gap: Indirect prompt injection via poisoned database records remains theoretically possible, but now mitigated at three layers: tool result sanitization catches injection in returned data, the system prompt warning primes the LLM to distrust suspicious content, and `createPendingAction` ensures a human must approve any mutation.*

**MCP Proxy: 9/10**

Same Zod validation and tool name enforcement. Same `detectInjectionPatterns()` telemetry. However, the proxy cannot inject system prompt warnings or sanitize tool results — those defences are gateway-only.

*Gap: Proxy relies on Claude Desktop's built-in safety. No tool result sanitization layer.*

---

### 4. Blast Radius

**Gateway: 9/10** *(was 8/10)*

All mutations gated by `createPendingAction()` — consistently applied across all 254 tools with zero exceptions. No shell/file access (`allowedTools: ['mcp__*']`). `maxTurns: 25` caps agentic loops. `maxTokenBudget: 500k` hard cutoff. Council batched at 2 concurrent members. **Per-member token budget of 80K tokens** prevents runaway council sessions (`council-types.ts`, `council-orchestrator.ts`). **Council members are now restricted to read-only tools** — `filterReadOnlySchemas()` strips all `propose_*` and agent-ops mutation tools from council member tool sets (`council-orchestrator.ts`), preventing council members from generating approval requests. **Tool call tracker now supports enforcement mode** with configurable `maxTotalCalls` and `maxCallsPerTool` limits (`tool-call-tracker.ts`).

*Gap: Council multi-agent trust chain — CISO strategist synthesizes members' output. If one member's analysis is tainted by poisoned data, the synthesis inherits it. Mitigated by read-only restriction (members cannot act on tainted data) and weighted confidence scoring (low-evidence members have less influence).*

**MCP Proxy: 10/10**

Same mutation gate. **Zero HTTP outbound** — the proxy and MCP servers have no network access beyond PostgreSQL. A compromised agent cannot POST data anywhere. No multi-agent architecture (single agent only). Rate limited at 100 calls/min per key. A leaked key with `["read", "risks"]` scope can only read risk data — cannot write, cannot access other domains.

*No practical gap. The blast radius of a compromised proxy session is bounded by the key's scopes.*

---

### 5. Human Checkpoints

**Gateway: 9/10**

Full approval UI in the browser. Every `propose_*` tool creates `McpPendingAction` with status `PENDING`. `TIER_MAP` classifies actions by severity: low (create), medium (update), high (lifecycle transitions), critical (delete/disable) (`mcp-approval-executor.service.ts`). `approval.created` event emitted for future notification wiring. Rejected actions include `reviewNotes` fed back to the agent.

*Gap: No push notification delivery yet — event is logged but not emailed or Slacked.*

**MCP Proxy: 8/10**

Same `McpPendingAction` records created. Same tier classification. But no streaming UI in Claude Desktop — the user must actively check the web app's AI Approvals page or ask Claude `list_pending_actions`.

*Gap: Proposals could sit unnoticed if the user doesn't have the web app open.*

---

### 6. Output Validation

**Gateway: 9/10** *(was 8/10)*

**Credential scanning** covers 10 patterns (was 6): Anthropic keys, MCP keys, generic API keys, AWS keys, JWTs, PostgreSQL connection strings, **GitHub tokens (ghp/gho/ghu/ghs), GCP API keys, PEM private keys, and Slack tokens** (`credential-scanner.ts`).

**PII redaction** covers 6 categories (was 4): email addresses, phone numbers, credit card numbers, IBANs, **US Social Security Numbers, and IPv4 addresses** (with version number exclusion) (`pii-redactor.ts`).

**Grounding guard** detects 30+ hallucinated failure claim patterns and replaces with factual tool summaries (`grounding-guard.ts`). **Now also detects fabricated record IDs** — `checkGrounding()` compares IDs in agent responses (GRC-format like R-01/CTRL-042 and UUIDs) against IDs actually returned by tool calls, flagging suspected fabrications (`grounding-guard.ts`).

**Tool result sanitization** scans MCP tool outputs for embedded prompt injection patterns before they reach the LLM (`tool-result-sanitizer.ts`), closing the previously identified gap of embedded instructions in output.

**System prompt** now includes a **compliance disclaimer** instructing the agent to add regulatory advice warnings to GRC-relevant responses (`system-prompt.ts`).

*Gap: Grounding guard ID detection is regex-based; a fabricated ID that matches GRC naming conventions but references a different record type would not be caught. Full semantic grounding would require tool result content indexing.*

**MCP Proxy: 7/10**

Same credential scanning and PII redaction applied to tool results before they reach Claude Desktop (`mcp-http-transport.ts`). But the proxy **cannot see Claude's final response** to the user — that goes directly from Claude Desktop to the screen. No grounding guard, tool result sanitization, or compliance disclaimer possible in proxy mode.

*Gap: If Claude hallucinates a risk score or fabricates compliance status, the proxy can't catch it.*

---

### 7. Cost Controls

**Gateway: 8/10** *(was 7/10)*

`maxTurns: 25` per agent run (configurable per-org). `maxTokenBudget: 500k` with hard cutoff (`message-loop.ts:64`). **Per-council-member token budget: 80K** configurable via `COUNCIL_MAX_TOKENS_PER_MEMBER` env var (`council-types.ts`, `config.ts`). Prompt caching via `cache_control: { type: 'ephemeral' }` (`message-loop.ts:78`). Rate limits: 30 runs/user/hour, 100 runs/org/hour, 20 concurrent (`rate-limit.ts`). Council rate limited to 5 sessions/user/hour (`agent-runner.ts:59`). **Tool call tracker now enforcement-capable** with configurable `maxTotalCalls` and `maxCallsPerTool` limits — exceeding limits throws `ToolCallLimitError` (`tool-call-tracker.ts`). Token usage logged per request and per council member. **Council domain threshold configurable** via `COUNCIL_DOMAIN_THRESHOLD` env var (default 3), allowing operators to tune how easily multi-agent deliberation is triggered (`council-classifier.ts`, `config.ts`).

*Gap: No per-user spend budget or cost alerting. Mitigated by the council member token budget (80K per member caps the most expensive operation).*

**MCP Proxy: 10/10**

**Zero API cost** — the user pays their own Claude Desktop subscription. There are no tokens to budget, no API bills to track. Rate limit of 100 tool calls/min per key prevents tool abuse. Anomaly detection at 200 calls/hour.

*No gap. The cost model is structurally eliminated.*

---

### 8. Observability

**Gateway: 9/10** *(was 8/10)*

Token usage logged per request and per council member: `{ conversationId, inputTokens, outputTokens, totalTokens, toolCallCount, source }` (`agent-runner.ts:421`). Prompt injection patterns detected and logged with LLM-facing warnings (`injection-detector.ts`, `agent-runner.ts`). Credential detection warnings logged. `approval.created` events emitted. Source tracking distinguishes `web_ui` / `scheduler` / `mcp_proxy`.

**New observability (added):**
- **Grounding guard metrics**: `logGroundingMetrics()` logs structured events with `totalIdsChecked`, `fabricatedIdsFound`, and specific fabricated IDs. Warns when fabrications detected (`grounding-guard.ts`).
- **Council parse success rate**: `getParseMetrics()` tracks JSON success, legacy markdown fallback, and failure counts per council opinion parse. Logs parse method for every council member response (`council-opinion-parser.ts`).
- **Weighted confidence scoring**: Council confidence now computed via `calculateWeightedConfidence()` based on data richness (findings + data sources), providing more meaningful confidence signals than simple vote counting (`council-orchestrator.ts`).

*Gap: No tool result content logging (only tool names and argument keys — values may contain PII). No ML-based anomaly detection (threshold-based only). Cannot fully replay what data an agent saw during an incident.*

**MCP Proxy: 9/10**

Every tool call logged: `{ userId, tool, org, source, argKeys, durationMs }` (`mcp-http-transport.ts`). API key `lastUsedAt` updated on each use. Behavioral anomaly alerting at 200 calls/hour. Rate limit tracking per key. The proxy sees every tool call explicitly, making the audit trail more complete than the gateway's internal routing.

*Same gap: no tool result content logging, no ML-based anomaly detection.*

---

## Why the Scores Converged

The gateway (8.9) now matches the proxy (8.9), up from 8.1. The audit remediation closed several structural gaps:

- **Injection defence** went from telemetry-only to **three-layer enforcement** (input detection → system prompt warning → tool result sanitization)
- **Council blast radius** reduced by **read-only tool filtering** and **per-member token budgets**
- **Output validation** expanded with **4 new credential patterns, 2 new PII patterns, fabricated ID detection**, and **tool result sanitization**
- **Cost controls** hardened with **council member token budgets** and **enforcement-capable tool call tracking**
- **Observability** gained **grounding metrics** and **parse rate tracking**

The proxy still benefits from architectural simplicity (stateless, zero cost, per-tool scoped keys), while the gateway now provides comprehensive defence-in-depth that compensates for its inherent complexity.

---

## Security Controls Inventory

| Control | File | Purpose |
|---------|------|---------|
| `McpToolExecutor.organisationId` injection | `gateway/src/agent/mcp-tool-executor.ts:63` | Force org scoping on every tool call |
| `createPendingAction()` | `packages/mcp-shared/src/pending-action.ts` | Human-in-the-loop for all mutations |
| `TOOL_NAME_PATTERN` regex | `gateway/src/agent/mcp-tool-executor.ts:5` | Validate tool names before dispatch |
| `scanAndRedactCredentials()` | `gateway/src/agent/credential-scanner.ts` | Strip 10 credential patterns from output |
| `redactPII()` | `gateway/src/agent/pii-redactor.ts` | Strip 6 PII categories from stored messages |
| `detectInjectionPatterns()` | `gateway/src/agent/injection-detector.ts` | 12+ injection pattern detection |
| `buildInjectionWarning()` | `gateway/src/agent/injection-detector.ts` | LLM-facing warning for detected injections |
| `sanitizeToolResult()` | `gateway/src/agent/tool-result-sanitizer.ts` | Scan tool results for indirect injection |
| `checkGrounding()` | `gateway/src/agent/grounding-guard.ts` | Detect fabricated record IDs in responses |
| `logGroundingMetrics()` | `gateway/src/agent/grounding-guard.ts` | Observability for grounding checks |
| `ToolCallTracker` | `gateway/src/middleware/tool-call-tracker.ts` | Enforcement-capable tool call limiting |
| `filterReadOnlySchemas()` | `gateway/src/council/council-orchestrator.ts` | Restrict council members to read-only tools |
| `calculateWeightedConfidence()` | `gateway/src/council/council-orchestrator.ts` | Data-richness-weighted confidence scoring |
| `parseCouncilOpinion()` | `gateway/src/council/council-opinion-parser.ts` | Structured JSON parsing with Zod validation |
| `getParseMetrics()` | `gateway/src/council/council-opinion-parser.ts` | Council parse success rate tracking |
| `zodUuidOrCuid` | `packages/mcp-shared/src/security/validators.ts` | Shared UUID/CUID validation for IDs |
| `isToolAllowed()` | `gateway/src/channels/mcp-http-transport.ts` | Per-tool permission enforcement |
| `applyGroundingGuard()` | `gateway/src/grounding-guard.ts` | Catch hallucinated failure claims |
| `prepareCreatePayload()` | `apps/server/src/mcp-approval/executors/types.ts` | Sanitize MCP payloads for creates |
| `stripMcpMeta()` | `apps/server/src/mcp-approval/executors/types.ts` | Strip MCP metadata from updates |
| `TIER_MAP` | `apps/server/src/mcp-approval/mcp-approval-executor.service.ts` | Action severity classification |
| `callWithRetry()` | `gateway/src/agent/message-loop.ts` | API retry with exponential backoff |
| `zId` shared Zod type | `packages/mcp-shared/src/security/zod-types.ts` | UUID validation on all ID params |
| Prompt caching | `gateway/src/agent/message-loop.ts:78` | `cache_control: { type: 'ephemeral' }` |
| Council batching | `gateway/src/council/council-orchestrator.ts` | `BATCH_SIZE = 2` limits concurrent API calls |
| Council token budget | `gateway/src/council/council-types.ts` | `maxTokenBudgetPerMember: 80_000` |
| Council domain threshold | `gateway/src/council/council-types.ts` | Configurable via `COUNCIL_DOMAIN_THRESHOLD` |
| Council rate limit | `gateway/src/agent/agent-runner.ts:59` | 5 sessions/user/hour |
| Compliance disclaimer | `gateway/src/agent/system-prompt.ts` | Regulatory advice warning in responses |
| Memory TTL | `gateway/src/memory/memory.service.ts:25` | 90-day auto-expiry |
| Memory injection scan (storage) | `gateway/src/memory/distiller.ts` | Discard memories with injection patterns |
| Memory injection scan (recall) | `gateway/src/agent/agent-runner.ts` | Scan recalled memories before injection |

---

## Remaining Gaps

| Priority | Gap | Impact |
|----------|-----|--------|
| 1 | Email/Slack delivery for `approval.created` events | Claude Desktop users miss pending approvals |
| 2 | Memory admin UI for viewing/deleting memories | No way to audit or clear accumulated context |
| 3 | Tool result content logging (with PII redaction) | Can't fully replay what data an agent saw |
| 4 | ML-based anomaly detection | Currently threshold-based only |
| 5 | Semantic grounding (embedding-based ID verification) | Regex-based ID detection has coverage limits |
| 6 | Per-user spend budgets and cost alerting | No budget cap per user, only rate limits |

---

## Closed Gaps (PR #32)

| Former Gap | Resolution |
|------------|-----------|
| No scanning for embedded instructions in output | `sanitizeToolResult()` scans tool results for injection patterns |
| Council multi-agent trust chain (members can mutate) | `filterReadOnlySchemas()` restricts council to read-only tools |
| Injection detection telemetry-only, not enforced | `buildInjectionWarning()` injects LLM-facing warnings into system prompt |
| Limited credential scanner (6 patterns) | Expanded to 10 patterns: added GitHub, GCP, PEM, Slack |
| Limited PII redaction (4 categories) | Expanded to 6 categories: added SSN, IPv4 |
| No council token budget | `maxTokenBudgetPerMember: 80_000` configurable via env var |
| Tool call tracker log-only | `ToolCallTracker` class with enforcement mode |
| Fragile council opinion parsing (regex-only) | Zod-validated JSON parsing with legacy fallback |
| No fabricated record ID detection | `checkGrounding()` compares response IDs against tool result IDs |
| No grounding guard observability | `logGroundingMetrics()` with structured logging |
| No council parse rate tracking | `getParseMetrics()` tracks JSON/fallback/failure rates |
| Memory recall not scanned for injection | Memory injection scanning at recall time |
