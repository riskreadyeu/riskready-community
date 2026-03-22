# Agent Security Audit — 8-Point Framework

This audit evaluates RiskReady Community Edition against an 8-point agent security framework. Both connection modes are assessed independently:

- **Web App via Gateway** — Users interact through the React web UI, which routes messages through the Fastify AI Gateway to 9 MCP servers. The gateway adds capabilities like the AI Agents Council, memory, streaming UI, and scheduled workflows.
- **Claude Desktop via MCP Proxy** — Users connect Claude Desktop (or Claude Code) directly to the MCP servers through an authenticated HTTPS proxy endpoint. The proxy is stateless and adds no intermediate AI processing.

Each point is scored from 1-10 for both modes, with specific evidence and identified gaps.

---

## 1. Identity & Authorization

**Gateway: 9/10 | Proxy: 10/10**

- **Per-user JWT auth** (web app) and **per-user API keys** with `rr_sk_` prefix (proxy)
- **Per-tool permission scoping**: API keys can be limited to `read`, `write`, or specific domains (e.g., `risks`, `controls`)
- **Source tracking**: every log entry includes `source: 'web_ui' | 'mcp_proxy' | 'scheduler'`
- API keys track `lastUsedAt` for usage auditing

**Gap**: Cannot distinguish human-initiated from agent-initiated tool calls within the same source. When a user sends a message and Claude calls 5 tools, all 5 log as the same source with no differentiation between "user asked for this" and "agent decided to do this."

---

## 2. Memory & Data Retention

**Gateway: 7/10 | Proxy: 8/10**

- **Gateway**: MemoryDistiller stores conversation insights with 90-day auto-expiry. Expired memories are filtered from search results.
- **Proxy**: Stateless — no memory between calls. Claude Desktop manages its own conversation history locally, outside of RiskReady's control.

**Gap**: No admin UI for viewing or deleting stored memories. Administrators cannot inspect what the gateway has retained or perform targeted deletion.

---

## 3. Tool Trust & Indirect Injection

**Both: 9/10**

- All **254 tools are first-party**, defined in-repo, with Zod-validated schemas including `.max()` bounds on string inputs
- **No third-party MCP servers** and no dynamic tool loading — the tool surface is fixed at build time
- `TOOL_NAME_PATTERN` regex validates tool names before dispatch, preventing tool name injection
- Indirect injection is mitigated by `createPendingAction` — even if Claude is tricked into proposing a destructive change, it enters the human approval queue

**Gap**: Database records with malicious content (e.g., poisoned titles or descriptions) could influence Claude's reasoning. While mutations are gated, read-path data is trusted.

---

## 4. Blast Radius

**Gateway: 8/10 | Proxy: 10/10**

- **No HTTP outbound**: the gateway only calls the Anthropic API; the proxy has zero outbound network calls
- **Per-tool scoping** on API keys limits the impact of a leaked key
- **Rate limiting**: 100 tool calls per minute per API key
- **Council batching** (2 members at a time) limits concurrent resource usage

**Gateway gap**: The Council multi-agent trust chain — the CISO Strategist synthesises output from 5 other council members. A compromised or confused member's output propagates through synthesis.

---

## 5. Human Checkpoints

**Gateway: 9/10 | Proxy: 8/10**

- Every `propose_*` tool creates an `McpPendingAction` record requiring explicit human approval before database mutation
- **Action severity classification**: low (create), medium (update), high (lifecycle transitions), critical (delete)
- `approval.created` event emitted for future notification wiring
- The approval feedback loop allows the agent to check outcomes and adapt — if rejected, it reads reviewer notes and offers revised proposals

**Gap**: No push notification delivery yet. The `approval.created` event is logged and triggers internal event handlers, but no email or Slack notification is sent to reviewers.

---

## 6. Output Validation

**Gateway: 8/10 | Proxy: 7/10**

- **Credential scanning**: agent output is scanned for API keys, JWTs, AWS keys, and connection strings before saving
- **PII redaction** on stored messages (gateway) and tool results (proxy)
- **Grounding guard** catches hallucinated failure claims (gateway only)
- `isValidUUID` validates extracted action IDs to prevent fabricated references

**Proxy gap**: The proxy cannot see Claude Desktop's final response to the user. Credential scanning and grounding guards only apply to tool results, not the rendered output.

---

## 7. Cost Controls

**Gateway: 7/10 | Proxy: 10/10**

- **Gateway**: `maxTurns: 25` and `maxTokenBudget: 500k` per request, with token logging per request
- **Proxy**: Zero API cost to RiskReady — the user's Claude subscription pays for inference
- Rate limiting applies to both modes
- Council batching reduces concurrent API call cost

**Gateway gap**: No per-user spend budget or alerting. A single user could trigger expensive council sessions repeatedly without throttling beyond the per-request token budget.

---

## 8. Observability

**Gateway: 8/10 | Proxy: 9/10**

- Every tool call logged: `{ userId, tool, org, source, argKeys, durationMs }`
- **Behavioral baselines**: 200 calls/hour anomaly threshold with alerting
- API key `lastUsedAt` tracking
- Token usage logged per request and per council member
- **Prompt injection detection** with pattern-based telemetry

**Gap**: No tool result content logging (argument keys only, not values or results) — limits incident replay capability. No ML-based anomaly detection; thresholds are static.

---

## Summary Table

| Point | Gateway (Web UI) | MCP Proxy (Claude Desktop) |
|-------|:---:|:---:|
| 1. Identity & Authorization | 9/10 | 10/10 |
| 2. Memory & Data Retention | 7/10 | 8/10 |
| 3. Tool Trust & Indirect Injection | 9/10 | 9/10 |
| 4. Blast Radius | 8/10 | 10/10 |
| 5. Human Checkpoints | 9/10 | 8/10 |
| 6. Output Validation | 8/10 | 7/10 |
| 7. Cost Controls | 7/10 | 10/10 |
| 8. Observability | 8/10 | 9/10 |
| **Overall** | **8.1/10** | **8.9/10** |

---

## Why MCP Proxy Scores Higher

The MCP Proxy mode scores higher because simplicity reduces attack surface. The proxy is:

- **Stateless** — no conversation memory, no session state, no stored insights
- **No multi-agent** — no council trust chain, no synthesis step, no inter-agent communication
- **No HTTP outbound** — zero network calls beyond the authenticated MCP transport
- **Zero API cost** — the user's Claude subscription covers inference, eliminating cost control concerns entirely

The gateway adds significant capabilities — the AI Agents Council, streaming UI, conversation memory, scheduled workflows, and event-driven triggers — but each capability introduces additional attack surface that must be secured. The proxy trades functionality for a smaller, more auditable security perimeter.

---

## Security Controls Implemented

The following controls are implemented across both connection modes:

| Control | Purpose |
|---------|---------|
| `prepareCreatePayload()` / `stripMcpMeta()` | Payload sanitization — strips internal metadata before database writes |
| `scanAndRedactCredentials()` | Credential scanning on agent output before storage |
| `redactPII()` | PII redaction on stored messages and tool results |
| `detectInjectionPatterns()` | Prompt injection telemetry — pattern-based detection with logging |
| `trackToolCall()` | Behavioral anomaly detection — per-user call rate monitoring |
| `isToolAllowed()` | Per-tool permission enforcement against API key scopes |
| `TOOL_NAME_PATTERN` | Tool name validation regex — prevents tool name injection |
| `createPendingAction()` | Human-in-the-loop for all mutations — proposals require approval |
| `TIER_MAP` | Action severity classification (low/medium/high/critical) |
| Prompt caching | `cache_control: { type: 'ephemeral' }` reduces latency and cost |
| Council batching | `BATCH_SIZE = 2` limits concurrent council member execution |
| Rate limiting | 100 calls/min per API key across both modes |

---

## Remaining Gaps

These are identified areas for improvement, none of which represent critical vulnerabilities:

1. **Email/Slack notification delivery** for `approval.created` events — the event infrastructure exists but no delivery channel is wired
2. **Memory admin UI** for viewing and deleting stored memories — administrators currently cannot inspect or manage gateway memory
3. **ML-based anomaly detection** — current detection is threshold-based (200 calls/hour); no learned behavioral baselines
4. **Tool result content logging** for full incident replay — only argument keys are logged, not values or results, limiting forensic capability
