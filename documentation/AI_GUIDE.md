# AI Platform Guide

RiskReady Community Edition ships an **autonomous agentic AI system** built on 9 MCP servers, 254 tools, a multi-agent council, scheduled workflows, and human-in-the-loop approval. This guide covers everything from connecting Claude to the deep implementation internals.

---

## Table of Contents

- [Connecting to MCP Servers](#connecting-to-mcp-servers)
- [The 9 MCP Servers](#the-9-mcp-servers)
- [How It Works](#how-it-works)
- [End-to-End Message Flow](#end-to-end-message-flow)
- [Gateway Internals](#gateway-internals)
- [MCP Tool Execution](#mcp-tool-execution)
- [Human-in-the-Loop Approval](#human-in-the-loop-approval)
- [AI Agents Council](#ai-agents-council)
- [Scheduler and Autonomous Runs](#scheduler-and-autonomous-runs)
- [Cross-Domain Workflows](#cross-domain-workflows)
- [Agent Task Tracking](#agent-task-tracking)
- [Skills Registry and Routing](#skills-registry-and-routing)
- [Tool Search Optimisation](#tool-search-optimisation)
- [MCP Proxy (Remote Claude Desktop)](#mcp-proxy-remote-claude-desktop)
- [Security Model](#security-model)
- [Agent Security Audit](#agent-security-audit)
- [Performance Benchmarks](#performance-benchmarks)
- [Anti-Hallucination Safeguards](#anti-hallucination-safeguards)
- [Example Queries](#example-queries)
- [Configuration Reference](#configuration-reference)
- [Key Files Reference](#key-files-reference)
- [Troubleshooting](#troubleshooting)

---

## Connecting to MCP Servers

Each MCP server runs as a standalone stdio process with direct database access. Connect via Claude Desktop, Claude Code, the remote MCP Proxy, or any MCP-compatible client.

### Option 1: Claude Desktop

Find your config file:

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

Add all 9 servers. Update the paths and `DATABASE_URL` to match your setup:

```json
{
  "mcpServers": {
    "riskready-risks": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-risks/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-controls": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-controls/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-policies": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-policies/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-evidence": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-evidence/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-incidents": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-incidents/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-audits": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-audits/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-itsm": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-itsm/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-organisation": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-organisation/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    },
    "riskready-agent-ops": {
      "command": "npx",
      "args": ["tsx", "/path/to/riskready-community/apps/mcp-server-agent-ops/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://riskready:riskready@localhost:5434/riskready?schema=public"
      }
    }
  }
}
```

Replace `/path/to/riskready-community` with your actual repo path. Restart Claude Desktop after saving.

### Option 2: Claude Code

RiskReady ships with a pre-configured `.mcp.json`. Or add servers manually:

```bash
claude mcp add riskready-controls npx tsx apps/mcp-server-controls/src/index.ts
claude mcp add riskready-risks npx tsx apps/mcp-server-risks/src/index.ts
claude mcp add riskready-policies npx tsx apps/mcp-server-policies/src/index.ts
claude mcp add riskready-organisation npx tsx apps/mcp-server-organisation/src/index.ts
claude mcp add riskready-itsm npx tsx apps/mcp-server-itsm/src/index.ts
claude mcp add riskready-evidence npx tsx apps/mcp-server-evidence/src/index.ts
claude mcp add riskready-audits npx tsx apps/mcp-server-audits/src/index.ts
claude mcp add riskready-incidents npx tsx apps/mcp-server-incidents/src/index.ts
claude mcp add riskready-agent-ops npx tsx apps/mcp-server-agent-ops/src/index.ts
```

Set the `DATABASE_URL` environment variable to point to your PostgreSQL instance.

### Option 3: Remote Connection (MCP Proxy)

Connect Claude Desktop without cloning the repo or running Node.js locally. The gateway exposes an MCP proxy at `/mcp` over HTTPS.

1. Log in to the RiskReady web UI → **Settings > AI Configuration**
2. Click **Create MCP API Key**, copy the key (starts with `rr_sk_`)
3. Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "riskready": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-riskready-instance.com/gateway/mcp",
        "--header",
        "Authorization: Bearer rr_sk_your_api_key_here"
      ]
    }
  }
}
```

#### Local vs Remote Comparison

| | Local (stdio) | Remote (MCP Proxy) |
|---|---|---|
| Database access | Direct (MCP servers connect to PostgreSQL) | Via gateway (API key authenticated) |
| Node.js required | Yes (on your machine) | No (only `npx mcp-remote`) |
| Rate limiting | None | 100 calls/minute per key |
| Organisation scoping | Manual (`organisationId` parameter) | Automatic (bound to API key) |

### Option 4: Any MCP Client (stdio)

```bash
DATABASE_URL="postgresql://riskready:riskready@localhost:5434/riskready" \
  npx tsx apps/mcp-server-risks/src/index.ts
```

The server communicates via stdin/stdout using MCP JSON-RPC.

### Database Connection

The MCP servers need a running PostgreSQL with the RiskReady schema. If using Docker Compose, the database is exposed on the port configured in `.env` (default: 5434).

```bash
# Verify connectivity
DATABASE_URL="postgresql://riskready:riskready@localhost:5434/riskready" \
  npx tsx -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p.risk.count().then(c => { console.log('Risks:', c); p.\$disconnect(); });
  "
```

---

## The 9 MCP Servers

Each server is a standalone process communicating via stdio. All query tools return data directly. All mutation tools (`propose_*`) create pending actions that require human approval.

| Server | Tools | Domain | Key Capabilities |
|--------|-------|--------|-----------------|
| Controls | 66 (30 query, 36 mutation) | ISO 27001 controls, SOA, assessments, metrics, scope | Gap analysis, effectiveness reports, coverage matrix |
| Risks | 34 (22 query, 12 mutation) | Risk register, scenarios, KRIs, treatments | Heat map, tolerance breaches, treatment progress |
| ITSM | 40 (25 query, 15 mutation) | CMDB assets, change management, capacity | CAB dashboard, change calendar |
| Organisation | 35 (23 query, 12 mutation) | Org profiles, departments, locations, governance | BIA summary, governance activity reports |
| Policies | 23 (14 query, 9 mutation) | Policy documents, versions, reviews, exceptions | Review calendar, compliance matrix |
| Incidents | 19 (11 query, 8 mutation) | Incident register, timelines, lessons learned | Trending, MTTR reports, control gap analysis |
| Evidence | 16 (10 query, 6 mutation) | Evidence repository, requests, multi-entity links | Coverage analysis, expiry tracking |
| Audits | 14 (7 query, 7 mutation) | Nonconformities, corrective action plans | Aging reports, CAP tracking |
| Agent Ops | 7 (7 query) | Agent self-awareness, task tracking | Approval feedback loop, multi-step workflows |

For detailed per-tool documentation, see [documentation/mcp-servers/](mcp-servers/).

---

## How It Works

```
                    ┌─────────────────────────────────────────┐
                    │             AI Gateway (Fastify :3100)   │
                    │                                         │
  User Message ───▶ │  Router ──▶ Agent Runner ──▶ Response   │
                    │               │      │                  │
  Cron Schedule ──▶ │  Scheduler ───┘      │                  │
                    │                      ▼                  │
  Domain Event ───▶ │  Triggers    Council Orchestrator       │
                    │               │                         │
                    │               ▼                         │
                    │     ┌─────────────────────┐             │
                    │     │  6 Specialist Agents │             │
                    │     │  (parallel analysis) │             │
                    │     └─────────┬───────────┘             │
                    │               ▼                         │
                    │        CISO Synthesis                   │
                    └───────────────┬─────────────────────────┘
                                    │
                    ┌───────────────▼─────────────────────────┐
                    │         9 MCP Servers (254 tools)        │
                    └───────────────┬─────────────────────────┘
                                    │
                    ┌───────────────▼─────────────────────────┐
                    │         PostgreSQL Database              │
                    │  McpPendingAction (approval queue)       │
                    │  AgentTask / AgentSchedule               │
                    │  CouncilSession / CouncilOpinion         │
                    └─────────────────────────────────────────┘
```

**Three execution paths:**

1. **User messages** — routed to relevant MCP servers by keyword matching. Query tools return data directly; mutation tools create pending actions for human approval.
2. **Council deliberation** — when a question spans 3+ GRC domains (or uses trigger phrases like "posture assessment"), 6 specialist agents analyse in parallel, then CISO synthesises.
3. **Autonomous runs** — scheduled workflows execute on cron, event triggers dispatch on critical incidents, approval resume continues after human review.

---

## End-to-End Message Flow

```
React Frontend                NestJS Server              AI Gateway                  Claude API
     │                             │                          │                          │
     │  POST /chat/.../messages    │                          │                          │
     │  { text }                   │                          │                          │
     │ ──────────────────────────▶ │                          │                          │
     │                             │  POST /dispatch          │                          │
     │                             │  x-gateway-secret        │                          │
     │                             │  x-user-id               │                          │
     │                             │  x-organisation-id       │                          │
     │                             │ ──────────────────────▶  │                          │
     │                             │                          │  messages.create          │
     │                             │  202 { runId }           │  (streaming)              │
     │  ◀────────────────────────  │ ◀──────────────────────  │ ──────────────────────▶  │
     │                             │                          │                          │
     │  GET /stream/:runId (SSE)   │  GET /stream/:runId      │   text_delta             │
     │ ──────────────────────────▶ │ ──────────────────────▶  │ ◀──────────────────────  │
     │                             │                          │                          │
     │  data: text_delta           │  SSE passthrough         │   tool_use               │
     │ ◀──────────────────────────────────────────────────── │ ◀──────────────────────  │
     │                             │                          │                          │
     │                             │                          │  MCP tool call (stdio)    │
     │                             │                          │ ──────▶ MCP Server        │
     │  data: tool_start           │                          │ ◀────── tool result       │
     │ ◀──────────────────────────────────────────────────── │                          │
     │  data: tool_done            │                          │  tool_result → Claude     │
     │ ◀──────────────────────────────────────────────────── │ ──────────────────────▶  │
     │                             │                          │                          │
     │  data: done                 │                          │  stop_reason: end_turn    │
     │ ◀──────────────────────────────────────────────────── │ ◀──────────────────────  │
```

### Frontend Layer

`apps/web/src/lib/chat-api.ts` — `sendMessage(conversationId, { text })` POSTs to `/chat/conversations/:id/messages`, receives `{ runId }`. The frontend opens an SSE stream to `/chat/conversations/:id/messages/stream/:runId`.

The `ChatEvent` union type covers all real-time events:
`text_delta | tool_start | tool_done | action_proposed | council_start | council_member_start | council_member_done | council_synthesis | council_done | done | error | block`

### NestJS ChatService

`apps/server/src/chat/chat.service.ts`

**`sendMessage()`:**
1. Validates conversation belongs to the requesting user and organisation
2. Loads gateway URL from `GatewayConfig` for the user's org
3. POSTs to `${gatewayUrl}/dispatch` with trusted headers (`x-user-id`, `x-organisation-id`, `x-conversation-id`, `x-gateway-secret`)
4. Stores `runOwners.set(runId, userId)` with a 10-minute TTL
5. Returns `{ runId }` to the frontend

**`proxyRunStream()`:**
1. Verifies requesting user owns the `runId` (deny-by-default if not found)
2. GETs `${gatewayUrl}/stream/${runId}` from the gateway
3. Pipes raw SSE bytes to the client — no parsing, transparent proxy

### Gateway InternalAdapter

`gateway/src/channels/internal.adapter.ts` — Fastify HTTP server (default port 3100)

| Route | Method | Purpose |
|-------|--------|---------|
| `/dispatch` | POST | Receive message, create `UnifiedMessage`, fire-and-forget to agent runner, return `202 { runId }` |
| `/stream/:runId` | GET | Open SSE connection, stream `ChatEvent` objects as `data: ...\n\n` frames |
| `/cancel/:runId` | POST | Signal abort for a running agent |
| `/health` | GET | Health check (unauthenticated) |

All routes except `/health` require `x-gateway-secret` verified with `timingSafeEqual`.

The `UnifiedMessage` type:
```typescript
{
  id: string;              // randomUUID()
  channel: string;         // "internal"
  userId: string;          // from x-user-id header
  organisationId: string;  // from x-organisation-id header
  text: string;            // user message
  metadata: {
    conversationId: string;
    isScheduled?: boolean;
    agentTaskId?: string;
  };
  timestamp: Date;
}
```

---

## Gateway Internals

### AgentRunner.execute()

`gateway/src/agent/agent-runner.ts` — the core orchestration method

Execution steps:
1. **Task tracking**: If `taskId` provided, update `AgentTask.status = IN_PROGRESS`
2. **Conversation**: `ensureConversation()` — create or validate ownership
3. **Persist user message**: Save to `ChatMessage` with `role: USER`
4. **Auto-title**: Set conversation title from first 80 chars of the first message
5. **History**: Load conversation history from `ChatMessage.findMany`
6. **Memory recall**: `SearchService.hybridSearch()` for relevant memories (semantic + keyword)
7. **Task context**: Load `AgentTask` including child tasks if `taskId` is set
8. **Config resolution**: Per-org model, `maxTurns` (default 25), API key from `GatewayConfig`
9. **Prompt injection detection**: Log warning for known patterns (does not block)
10. **Council decision**: Check if message qualifies for multi-agent council
11. **Execute**: Council path or single-agent `runMessageLoop()`
12. **Grounding guard**: Validate response text
13. **Extract actions**: Parse `actionId` UUIDs from tool results and response text
14. **Emit events**: `action_proposed` for each action, `block` for structured data
15. **Save response**: `ChatMessage` with `toolCalls`, `actionIds`, `blocks`, token counts
16. **Emit done**: With saved message ID
17. **Update task**: `AWAITING_APPROVAL` (if actions pending) or `COMPLETED`
18. **Memory distillation**: Async — extract and store key information
19. **Cleanup**: `executor.shutdown()` closes MCP stdio connections

### Message Loop (Anthropic Streaming)

`gateway/src/agent/message-loop.ts`

The agentic loop that drives Claude tool use:

```
while (turn < maxTurns):
    response = client.messages.create(stream: true)

    for each SSE event:
        text_delta      → accumulate text, emit to UI
        tool_use start  → create PendingToolUse entry
        input_json_delta → accumulate tool input JSON
        content_block_stop → finalize tool call

    if stop_reason != "tool_use":
        break  // agent is done

    // Execute all tool calls from this turn
    for each pending tool:
        result = executor.execute(toolName, input)
        emit tool_start / tool_done events

    // Append assistant + tool_result messages, loop again
```

**Prompt caching**: The system prompt is sent with `cache_control: { type: 'ephemeral' }`, enabling Anthropic's prompt caching. Since the system prompt (~5,000+ tokens) is identical across turns, subsequent turns hit the cache. This reduces latency and cost for multi-turn tool-use conversations.

```typescript
system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
```

**Token budget**: If `inputTokens + outputTokens > 500,000`, a budget-exceeded notice is appended and the loop stops.

### Lane Queue

`gateway/src/queue/lane-queue.ts`

Per-user job queue that prevents concurrent agent runs for the same user:
- **Max depth**: `QUEUE_MAX_DEPTH` (default 5) jobs per user
- Jobs are keyed by `userId` — each user gets their own lane
- Scheduler-generated jobs use synthetic `userId` values like `scheduler-${scheduleId}`

### Memory and Search

`gateway/src/memory/search.service.ts`

Hybrid search combining:
- **Semantic**: pgvector cosine similarity on message embeddings
- **Keyword**: Prisma full-text search on conversation content

Used by `AgentRunner` to inject relevant context from past conversations into the system prompt.

---

## MCP Tool Execution

### Tool Naming Convention

All tools follow: `mcp__<server-name>__<tool-name>`

Validated by `TOOL_NAME_PATTERN = /^mcp__[a-z][a-z0-9-]*__[a-z][a-z0-9_]*$/`

### McpToolExecutor

`gateway/src/agent/mcp-tool-executor.ts`

**`execute(fullToolName, input)`:**
1. Validate tool name pattern
2. Parse `serverName` and `toolName` from `mcp__<server>__<tool>`
3. **Security enforcement**: `input.organisationId = this.organisationId` — forced overwrite regardless of model input, preventing org-hopping
4. Look up server config via `SkillRegistry`
5. `getOrSpawnServer()` — get cached stdio connection or spawn new process
6. `connection.client.callTool({ name: toolName, arguments: input })` with 30-second timeout
7. Extract text content from response
8. Return `{ content: string, isError: boolean }`

**Server lifecycle**:
- Each MCP server gets its own `StdioClientTransport` + `Client`
- Connections cached per run in `this.connections`
- 60-second idle timer closes unused servers
- `shutdown()` closes all connections at end of each `AgentRunner.execute()` call

### MCP Server Pattern

Each MCP server follows the same structure:

```typescript
// apps/mcp-server-<domain>/src/index.ts
const server = new McpServer({ name: 'riskready-<domain>', version: '1.0.0' });

registerQueryTools(server);    // read-only tools
registerMutationTools(server); // propose_* tools

const transport = new StdioServerTransport();
await server.connect(transport);
```

Tool registration convention:
```typescript
server.tool(
  'tool_name',
  'Description of what this tool does',
  { /* Zod schema */ },
  withErrorHandling('tool_name', async (params) => { /* handler */ })
);
```

### mcp-shared Package

`packages/mcp-shared/src/` — shared utilities for all MCP servers:

| Export | Purpose |
|--------|---------|
| `withErrorHandling(name, handler)` | Wraps handlers with try/catch, returns structured errors |
| `createPendingAction(params)` | Creates `McpPendingAction` with `status: PENDING`, returns `{ actionId }` |
| `getDefaultOrganisationId()` | Single-org helper |
| `prisma` | Shared Prisma client instance |
| `userSelectSafe` | Safe user select fields (no passwordHash) |
| Prompt sanitizer, validators | Input validation utilities |

---

## Human-in-the-Loop Approval

### The Invariant

**Every AI mutation goes through `createPendingAction()`.** The agent can only propose — never directly write to domain tables. This is enforced architecturally: MCP mutation tools call `createPendingAction()` which writes a `McpPendingAction` row with `status: PENDING` and returns `{ actionId }`.

### Status Lifecycle

```
PENDING ──approve──▶ APPROVED ──execute──▶ EXECUTED
   │                    │
   │                    └──execute fails──▶ FAILED ──retry──▶ PENDING
   │
   └──reject──▶ REJECTED
```

### Approval Feedback Loop

The agent closes the loop on its proposals:
1. When the agent proposes a change, it notes the `actionId`.
2. It can check the status at any time using `check_action_status(actionId)`.
3. If **approved**, the agent knows it can proceed with dependent work.
4. If **rejected**, the agent reads the `reviewNotes` and offers a revised proposal.
5. For **scheduled runs**, the scheduler automatically resumes the agent when all linked proposals are resolved.

### Reviewing in the Web UI

1. Navigate to `/settings/mcp-approvals`
2. The **Pending** tab shows all proposed actions with action type, full payload, reason, and timestamp
3. Click **Approve** to execute or **Reject** to discard (with optional rejection notes)
4. The **Approved** and **Rejected** tabs provide a full audit history

### Approval Service Implementation

`apps/server/src/mcp-approval/mcp-approval.service.ts`

Both `approve()` and `reject()` use atomic `updateMany`:

```typescript
const result = await this.prisma.mcpPendingAction.updateMany({
  where: { id, status: 'PENDING' },  // atomic check-and-update
  data: { status: 'APPROVED', reviewedById, reviewedAt: new Date(), reviewNotes },
});
if (result.count === 0) throw new BadRequestException('Not pending');
```

This prevents TOCTOU race conditions where two concurrent approvals could both succeed.

### Approval Controller Flow

`apps/server/src/mcp-approval/mcp-approval.controller.ts` — all endpoints guarded by `@AdminOnly()`.

**`POST /mcp-approvals/:id/approve`:**
1. `approvalService.approve()` — atomic status transition
2. `executorService.canExecute(actionType)` — check executor exists
3. `executorService.execute(actionType, payload, reviewedById)` — run domain service
4. On success: `markExecuted()` with result data
5. On failure: `markFailed()` with error message
6. Emit `approval.resolved` event (EventEmitter2) — triggers scheduler resume

### Executor Service

`apps/server/src/mcp-approval/mcp-approval-executor.service.ts`

Maintains `ExecutorMap = Map<McpActionType, Executor>` populated by 9 domain registrations. Before calling an executor, the service runs `stripMcpMeta()` which removes `reason` (always) and `organisationId` (for UPDATE/DELETE operations only — kept for CREATE/LINK).

---

## AI Agents Council

For complex, cross-domain questions, the platform convenes a **council of 6 specialist AI agents** that analyse the question from their domain perspective, then a CISO Strategist synthesises findings.

### Council Members

| Role | MCP Server Access | Focus |
|------|-------------------|-------|
| `risk-analyst` | risks, controls, agent-ops | Risk register, scenarios, KRIs, treatment |
| `controls-auditor` | controls, evidence, audits, agent-ops | Control testing, SOA, gap analysis |
| `compliance-officer` | policies, controls, organisation, agent-ops | Policy lifecycle, regulatory mapping |
| `incident-commander` | incidents, itsm, evidence, agent-ops | Incident response, MTTR, lessons learned |
| `evidence-auditor` | evidence, audits, controls, agent-ops | Evidence coverage, expiry, requests |
| `ciso-strategist` | **all 9 servers** | Cross-domain synthesis, strategic view |

Each member gets a scoped `McpToolExecutor` with access only to its permitted servers.

### Trigger Decision (Classifier)

`gateway/src/council/council-classifier.ts`

The heuristic classifier convenes the council when either:
- The message spans **3+ distinct domain categories** (counted by `router.countDistinctDomains()`)
- The message contains a **council trigger phrase**:
  "overall posture", "maturity assessment", "board report", "council review", "multi-perspective", "full assessment", "comprehensive review", "posture assessment", "cross-domain", "holistic view", "executive summary", "security posture"

**Member selection**: Maps domain keywords to specialist roles. The `ciso-strategist` is always included. If no specific keywords match, all 6 members participate.

**Pattern selection**:

| Message Pattern | Deliberation Pattern |
|----------------|---------------------|
| "risk acceptance" / "accept risk" / "risk appetite" | `challenge_response` |
| "investigate" / "root cause" / "trace" | `sequential_buildup` |
| Default | `parallel_then_synthesis` |

### Deliberation Patterns

`gateway/src/council/council-orchestrator.ts`

**`parallel_then_synthesis`** (default):
```
Members run in batches of 2 (BATCH_SIZE = 2, for 512MB Docker memory)
     ↓
CISO synthesises all opinions
```

**`sequential_buildup`**:
```
Member 1 runs → findings injected into Member 2's context
     ↓
Member 2 runs → cumulative findings into Member 3
     ↓
... → CISO synthesises
```

**`challenge_response`**:
```
Member 1 proposes → Member 2 challenges (with Member 1's findings)
     ↓
Remaining members receive both perspectives
     ↓
CISO synthesises including dissents
```

### Orchestration Flow

`deliberate()` steps:
1. Create `CouncilSession` record (question, pattern, participants, organisationId)
2. Emit `council_start` event to the UI
3. Run members per pattern — each gets a private `runMessageLoop()` (output not streamed to user)
4. Parse each member's structured output (`## Findings`, `## Recommendations`, `## Dissents`, `## Data Sources`, `## Confidence`) via regex
5. Save `CouncilOpinion` records to DB
6. Emit `council_synthesis` event
7. Invoke `ciso-strategist` with all opinions as context for synthesis
8. Update `CouncilSession` with consensus summary, full deliberation JSON, confidence level
9. Render final markdown via `council-renderer.ts`
10. Return `{ text, sessionId }`

### Council Prompts

`gateway/src/council/council-prompts.ts`

Each role has a domain-specific system prompt. All share `SHARED_RULES` requiring:
- Structured output sections (Findings, Recommendations, Dissents, Data Sources, Confidence)
- Anti-fabrication rules ("If a tool returns empty results, say so")
- Tool-first approach ("Always query before concluding")

The `ciso-strategist` synthesis prompt instructs cross-domain correlation, recommendation deduplication, and preservation of dissenting opinions "for GRC audit trail."

### Council Output

Each council member produces:
- **Findings** with severity (critical/high/medium/low/info) and evidence
- **Recommendations** with priority (immediate/short_term/medium_term/long_term)
- **Dissents** against other members' conclusions
- **Data sources** and confidence level

The CISO Strategist synthesis produces:
- **Consensus Summary** — what the council agrees on
- **Cross-Domain Correlations** — links between domains (e.g., incident → control gap → risk)
- **Consolidated Recommendations** — prioritised with supporting agents
- **Dissenting Opinions** — preserved for GRC audit trail
- **Proposed Actions** — concrete next steps by domain
- **Confidence Level** — overall assessment confidence

### Streaming UX Events

| Event | When |
|-------|------|
| `council_start` | Council convened, lists participating agents |
| `council_member_start` | Individual agent begins analysis |
| `council_member_done` | Individual agent completes analysis |
| `council_synthesis` | CISO synthesis phase begins |
| `council_done` | Full deliberation complete |

### Persistence (Audit Trail)

Every council deliberation is persisted for GRC compliance:

| Model | Fields |
|-------|--------|
| `CouncilSession` | id, conversationId, question, pattern, participatingAgents[], consensusSummary, deliberation (Json), confidenceLevel, organisationId, timestamps |
| `CouncilOpinion` | id, sessionId (FK), agentRole, findings (Json), recommendations (Json), dissents (Json), dataSources (Json), confidence |

---

## Scheduler and Autonomous Runs

`gateway/src/scheduler/scheduler.service.ts`

Runs a `setInterval` (default 60-second poll) that executes three phases sequentially:

### Phase 1 — Process Due Schedules

Queries `AgentSchedule` where `enabled = true AND nextRunAt <= now`.

For each due schedule:
1. Create `AgentTask` with `trigger: SCHEDULED`
2. Create `ChatConversation` titled `[Scheduled] <name>`
3. Build a synthetic `UnifiedMessage` with `metadata.isScheduled: true`
4. Enqueue on `LaneQueue` → `agentRunner.execute()`
5. Advance `nextRunAt` via cron parser

### Phase 2 — Process Workflow Tasks

Queries `AgentTask` where `workflowId IS NOT NULL AND status = PENDING AND parentTaskId = NULL`.

For each:
1. Look up `WorkflowDefinition` by ID
2. Set `status: IN_PROGRESS` immediately (prevents re-pickup)
3. Enqueue `workflowExecutor.execute()` on `LaneQueue`

### Phase 3 — Resume After Approval

Queries `AgentTask` where `status = AWAITING_APPROVAL AND parentTaskId = NULL`.

**For workflow tasks**: Check child step tasks' `actionIds` — if all `McpPendingAction` records are resolved (non-PENDING), collect outcomes and enqueue `workflowExecutor.resume()`.

**For standalone tasks**: Check task's own `actionIds` — if all resolved, create a child `AgentTask` with `trigger: APPROVAL_RESUME` containing outcome summary + original instruction. Mark original as COMPLETED, enqueue `agentRunner.execute()` with the child task.

### Integration Diagram

```
                  60s poll
 SchedulerService ────────────▶ Phase 1: Due schedules
                                    │
                                    ▼
                              AgentRunner.execute()
                                    │
                              (agent proposes actions)
                                    │
                                    ▼
                              AgentTask.status = AWAITING_APPROVAL
                                    │
          Human approves            │
          ────────────────▶  approval.resolved event
                                    │
                              Phase 3: Resume
                                    │
                                    ▼
                              New AgentTask (APPROVAL_RESUME)
                                    │
                                    ▼
                              AgentRunner.execute() with outcomes
```

### Event Triggers

`apps/server/src/agent-triggers/agent-trigger.service.ts`

Listens for NestJS `EventEmitter2` events:
- `incident.created` — For CRITICAL/HIGH severity, dispatches analysis request to gateway
- `incident.status_changed` — Logged for audit trail
- `approval.resolved` — Logged (scheduler handles resume via polling)

### Database Models

```prisma
model AgentTask {
  id             String           @id @default(cuid())
  organisationId String
  title          String
  instruction    String           @db.Text
  workflowId     String?
  parentTaskId   String?          // self-relation for workflow steps
  stepIndex      Int?
  status         AgentTaskStatus  // PENDING | IN_PROGRESS | AWAITING_APPROVAL | COMPLETED | FAILED | CANCELLED
  trigger        AgentTaskTrigger // USER_REQUEST | SCHEDULED | EVENT | WORKFLOW_STEP | APPROVAL_RESUME
  conversationId String?
  userId         String?
  actionIds      String[]
  result         String?          @db.Text
  errorMessage   String?          @db.Text
  completedAt    DateTime?
}

model AgentSchedule {
  id             String    @id @default(cuid())
  organisationId String
  name           String
  cronExpression String
  instruction    String    @db.Text
  targetServers  String[]
  enabled        Boolean   @default(true)
  nextRunAt      DateTime?
  lastRunAt      DateTime?
  lastRunTaskId  String?
}
```

---

## Cross-Domain Workflows

`gateway/src/workflows/`

### Built-in Workflow Definitions

| Workflow | Steps | Default Schedule | Approval Gates |
|----------|-------|------------------|----------------|
| **Incident Response Flow** | Incident analysis → Control gap ID → Risk re-assessment → Treatment proposal | Monday 8 AM | Step 4 |
| **Weekly Risk Review** | Tolerance breaches → KRI trends → Overdue treatments → Executive summary | Monday 7 AM | None |
| **Control Assurance Cycle** | Assessment review → Gap analysis → Nonconformity tracking | Wednesday 8 AM | None |
| **Policy Compliance Check** | Overdue reviews → Exception expiry → Evidence coverage | 1st of month 9 AM | None |

All workflows ship **disabled by default**. Enable via the schedule management API.

### WorkflowExecutor

`gateway/src/workflows/workflow-executor.ts`

**`execute(workflow, orgId, userId, emitFn, taskId)`:**
1. Create parent `AgentTask` with `workflowId`
2. Call `executeSteps()` from step 0

**`executeSteps()` loop:**
```
for each step (from startIndex):
    1. Create child AgentTask (trigger: WORKFLOW_STEP, stepIndex)
    2. Create ChatConversation
    3. Build instruction + cumulative context (prior step results, truncated to 3000 chars each)
    4. Create synthetic UnifiedMessage
    5. agentRunner.execute() with 5-minute abort timeout
    6. Append result to cumulativeContext

    if step.approvalGate AND task.status == AWAITING_APPROVAL:
        set parent task to AWAITING_APPROVAL
        return  // scheduler Phase 3 will resume after approvals
```

**`resume(workflow, parentTaskId, outcomes)`:**
1. Rebuild cumulative context from all completed child tasks
2. Call `executeSteps()` from `lastStepIndex + 1`

### Workflow API

```
GET    /agent-workflows                    — List workflow executions
GET    /agent-workflows/:taskId            — Get workflow execution status
POST   /agent-workflows/trigger            — Trigger a built-in workflow
GET    /agent-workflows/definitions/built-in — List available workflow definitions
```

### Schedule Management API

```
GET    /api/agent-schedules          — List schedules
POST   /api/agent-schedules          — Create a schedule
PUT    /api/agent-schedules/:id      — Update a schedule
DELETE /api/agent-schedules/:id      — Delete a schedule
POST   /api/agent-schedules/:id/run-now — Trigger immediate execution
```

Cron expressions use standard 5-field format: `minute hour day month weekday` (e.g., `0 8 * * 1` = Monday at 8 AM).

---

## Agent Task Tracking

### MCP Tools (agent-ops server)

| Tool | Type | Purpose |
|------|------|---------|
| `create_agent_task` | Mutation (requires approval) | Propose creating a tracked task |
| `update_agent_task` | Mutation (requires approval) | Propose updating task status/result |
| `get_agent_task` | Read | Get task with children and action statuses |
| `list_agent_tasks` | Read | List tasks by org/status with pagination |
| `check_action_status` | Read | Check proposal outcome (approved/rejected/failed) |
| `list_pending_actions` | Read | List actions by status for an org |
| `list_recent_actions` | Read | Actions since a date (default: 24h) |

The read tools form the **approval feedback loop** — the agent uses them to learn whether its proposals were approved, rejected, or failed, and can adapt its approach accordingly.

The agent-ops server is **always loaded** regardless of routing, ensuring the agent can always check its own state.

---

## Skills Registry and Routing

### skills.yaml

`gateway/skills.yaml` defines all 9 MCP servers:

```yaml
servers:
  - name: riskready-risks
    description: "Risk register management..."
    tags: [grc, risks, risk-management]
    capabilities: [query, mutation]
    command: npx
    args: [tsx, ../mcp-server-risks/src/index.ts]
    requiresDb: true
    tools:
      - name: list_risks
        description: "List risks with optional filters"
        args: [status, tier, framework, organisationId, skip, take]
```

### SkillRegistry

`gateway/src/agent/skill-registry.ts`

- Loads `skills.yaml` at startup
- Pre-loads tool schemas from YAML (no need to spawn servers)
- Watches file for changes in development (5-second poll)
- `getMcpServers(skillNames, databaseUrl, basePath)` resolves relative paths and injects `DATABASE_URL` for `requiresDb: true` servers

### Router

`gateway/src/router/router.ts`

**`route(message)`** returns relevant `SkillDefinition` objects:
1. Check for explicit `@riskready-<server>` mention → return only that server
2. Scan `KEYWORD_TAG_MAP` (word-boundary regex) to build matched tag set
3. If no tags matched → return all servers
4. Return servers whose tags overlap with matched tags

`KEYWORD_TAG_MAP` maps domain vocabulary to categories. Examples:
- `control` → `['controls']`
- `iso 27001` → `['controls', 'compliance']`
- `ransomware` → `['incidents']`
- `kri` → `['risks']`

**Important**: The router's output drives the council classifier's domain-count decision, but `AgentRunner` always loads all tool schemas regardless of routing — routing is informational for council decisions only.

---

## Tool Search Optimisation

`gateway/src/agent/tool-builder.ts`, `gateway/src/agent/model-capabilities.ts`

With 254 tools across 9 MCP servers, sending all tool schemas in every API call consumed ~180,000 input tokens per request. The tool search refactor replaces this with Anthropic's built-in tool discovery:

1. **`tool_search_tool_bm25`**: A special tool type that lets Claude search for relevant tools by keyword instead of receiving all schemas upfront
2. **`defer_loading: true`**: Each tool definition is sent with deferred loading — Claude only receives the full schema when it discovers a tool via search
3. **Model capability detection** (`model-capabilities.ts`): Tool search is only enabled for models that support it (Sonnet 4.5+, Haiku 4.5+, Opus 4.6+). Older models fall back to sending all tool schemas.

```typescript
// tool-builder.ts
tools.push({ type: 'tool_search_tool_bm25_20251119', name: 'tool_search_tool_bm25' });

for (const schema of schemas) {
  tools.push({ name: schema.fullName, description: schema.description,
               input_schema: schema.inputSchema, defer_loading: true });
}
```

**Impact**: Input tokens dropped from ~180k to ~7k per council member, a **96% reduction**. This makes running 6-member council sessions practical on cost-constrained deployments.

---

## MCP Proxy (Remote Claude Desktop)

`gateway/src/channels/mcp-http-transport.ts`

The gateway exposes an HTTPS endpoint at `POST /mcp` that accepts MCP JSON-RPC requests authenticated via Bearer token (API keys with `rr_sk_` prefix).

**Request flow:**
1. Claude Desktop sends MCP JSON-RPC via `mcp-remote` bridge
2. Gateway validates the Bearer API key (bcrypt comparison)
3. Organisation and user are resolved from the API key
4. Tool calls are routed to the appropriate MCP server with enforced org scoping
5. Results are returned as JSON-RPC responses

**Security controls:**
- Per-key rate limiting (100 calls/minute)
- Organisation scoping enforced on every tool call
- API keys are bcrypt-hashed at rest, revocable via web UI
- Keys managed in `apps/server/src/gateway-config/mcp-key.service.ts`
- Per-tool permission scoping: API keys can be limited to `read`, `write`, or specific domains

---

## Security Model

### Organisation Isolation

| Layer | Enforcement |
|-------|-------------|
| **NestJS controllers** | `organisationId` derived from JWT, not query params. `findOne`/`update`/`delete` verify `record.organisationId === req.user.organisationId`. |
| **MCP tool executor** | `input.organisationId = this.organisationId` forced before every tool call |
| **MCP read tools** | `organisationId` filter in every `where` clause |
| **MCP mutation tools** | `createPendingAction()` stores `organisationId` from executor |
| **Approval controller** | `@AdminOnly()` guard on all endpoints |

### Gateway Authentication

- All requests to the gateway require `x-gateway-secret` header
- Verified with `crypto.timingSafeEqual`
- Gateway refuses to start without `GATEWAY_SECRET` or `JWT_SECRET` configured

### SSRF Prevention

- `gatewayUrl` validated against private IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)
- Only `http://` and `https://` schemes allowed
- Validated at both DTO and service layers

### Prompt Injection Mitigation

- System prompt instructs strict tool-use-only behaviour
- Grounding guard validates response text
- Prompt injection patterns logged as warnings
- Council member outputs not directly streamed to users (parsed first)

---

## Agent Security Audit

An 8-point security framework applied to both connection modes (Web App via Gateway and Claude Desktop via MCP Proxy).

### Scores

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

The MCP Proxy scores higher because simplicity reduces attack surface — it is stateless, has no multi-agent trust chain, makes zero outbound HTTP calls beyond MCP transport, and incurs zero API cost to RiskReady.

### Security Controls Implemented

| Control | Purpose |
|---------|---------|
| `prepareCreatePayload()` / `stripMcpMeta()` | Payload sanitization before database writes |
| `scanAndRedactCredentials()` | Credential scanning on agent output before storage |
| `redactPII()` | PII redaction on stored messages and tool results |
| `detectInjectionPatterns()` | Prompt injection telemetry with logging |
| `trackToolCall()` | Behavioral anomaly detection — per-user call rate monitoring |
| `isToolAllowed()` | Per-tool permission enforcement against API key scopes |
| `TOOL_NAME_PATTERN` | Tool name validation regex |
| `createPendingAction()` | Human-in-the-loop for all mutations |
| `TIER_MAP` | Action severity classification (low/medium/high/critical) |
| Council batching | `BATCH_SIZE = 2` limits concurrent member execution |
| Rate limiting | 100 calls/min per API key |

### Remaining Gaps

1. **Email/Slack notification delivery** for `approval.created` events — event infrastructure exists but no delivery channel is wired
2. **Memory admin UI** for viewing and deleting stored memories
3. **ML-based anomaly detection** — current detection is threshold-based (200 calls/hour)
4. **Tool result content logging** for full incident replay — only argument keys are logged

---

## Performance Benchmarks

Real-world benchmarks from the AI Agents Council running against a live GRC database with 15 risks, 40 controls, 30 scenarios, 8 KRIs, and 12 active incidents.

### Token Usage: Before & After Tool Search

| Metric | Before (Agent SDK) | After (Tool Search) | Reduction |
|--------|-------------------|---------------------|-----------|
| Input tokens per request | 228,610 | 8,586 | **96.2%** |
| Tool definitions in context | ~77k tokens | ~500 tokens | **99.4%** |
| Typical first request | ~228k tokens | ~1.4k tokens | **99.4%** |

### Full Council — Haiku 4.5 ($0.19)

| Council Member | Input Tokens | Output Tokens | Tool Calls | Cost |
|---------------|-------------|---------------|------------|------|
| risk-analyst | 1,269 | 3,493 | 0 | $0.015 |
| controls-auditor | 1,257 | 1,985 | 0 | $0.009 |
| incident-commander | 1,259 | 463 | 0 | $0.003 |
| compliance-officer | 31,230 | 6,856 | 13 | $0.052 |
| evidence-auditor | 50,496 | 8,254 | 19 | $0.073 |
| CISO synthesis | 3,920 | 9,488 | 0 | $0.042 |
| **Total** | **89,431** | **30,539** | **32** | **~$0.19** |

2/5 members successfully used tools. ~2 minute deliberation. Medium confidence.

### Full Council — Opus 4.6 ($10.08)

| Council Member | Input Tokens | Output Tokens | Tool Calls | Cost |
|---------------|-------------|---------------|------------|------|
| risk-analyst | 80,126 | 7,279 | 14 | $1.75 |
| controls-auditor | 96,661 | 7,119 | 21 | $1.98 |
| compliance-officer | 82,739 | 8,660 | 24 | $1.89 |
| incident-commander | 85,616 | 8,230 | 28 | $1.90 |
| evidence-auditor | ~80,000 | ~7,000 | ~15 | ~$1.73 |
| CISO synthesis | ~5,000 | ~10,000 | 0 | ~$0.83 |
| **Total** | **~430,000** | **~48,000** | **~102** | **~$10.08** |

5/5 members successfully used tools. ~4 minute deliberation. High confidence.

### Model Comparison

| Dimension | Haiku 4.5 | Opus 4.6 |
|-----------|-----------|----------|
| **Cost per council** | $0.19 | $10.08 |
| **Tool discovery** | 2/5 members | 5/5 members |
| **Total tool calls** | 32 | ~102 |
| **Analysis quality** | Medium — some generic | High — all data-backed |
| **Best for** | Quick checks, daily use | Board reports, audits |

### Model Selection

| Model | Best For | Trade-offs |
|---|---|---|
| **Claude Haiku** | Quick queries, simple lookups | Fastest and lowest cost. Less detailed analysis. |
| **Claude Sonnet** | Balanced analysis, most day-to-day work | Good balance of speed, cost, and depth. Recommended. |
| **Claude Opus** | Complex analysis, multi-step reasoning | Most capable. Higher cost and slower. |

### Pricing Reference

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|----------------------|
| Claude Haiku 4.5 | $0.80 | $4.00 |
| Claude Sonnet 4.5/4.6 | $3.00 | $15.00 |
| Claude Opus 4.6 | $15.00 | $75.00 |

---

## Anti-Hallucination Safeguards

The AI assistant is configured with strict safeguards enforced through the system prompt on every request:

- **Tool-grounded responses only.** The assistant only returns data retrieved from MCP tool calls. It never fabricates values, statistics, or identifiers.
- **Explicit handling of missing data.** If a tool returns null, empty, or "not configured", the assistant reports that explicitly rather than filling in plausible values.
- **Database-sourced identifiers.** All UUIDs, control IDs, assessment references come directly from the database. The assistant never guesses or invents identifiers.
- **Tool-first workflow.** The assistant always calls the relevant query tool before presenting record-specific details.
- **Quantitative integrity.** Monetary amounts, frequencies, percentages, and scores are presented only when returned by tools.
- **Tolerance status fidelity.** Risk tolerance status is reported using the exact value from the database, never calculated or overridden.

---

## Example Queries

### Querying Data

- "Show me all controls that are not yet implemented"
- "What is our current risk heat map?"
- "Which policies are overdue for review?"
- "List all critical assets without backup enabled"
- "What nonconformities are still open from the last audit?"

### Analysis

- "Run a gap analysis on our latest assessment"
- "Which controls have no linked evidence?"
- "What is our SOA implementation rate by theme?"
- "Which KRIs are in RED status?"
- "What is our mean time to resolve incidents?"

### Proposing Changes

- "Create a new risk for insider data exfiltration"
- "Record a PASS result for test GOV-01 in assessment ASM-2026-001"
- "Create a new policy for acceptable use of AI tools"
- "Raise a nonconformity for the failed access control test"

### Council Deliberations (multi-domain)

These queries automatically convene the AI Agents Council:

- "Give me a full security posture assessment covering risks, controls, and compliance"
- "Prepare a board report on our overall GRC maturity"
- "We had a ransomware incident — what are the cross-domain implications?"
- "Comprehensive review of our ISO 27001 readiness"

### Agent Self-Awareness

- "What is the status of my last proposal?"
- "Show me all pending actions"
- "What tasks are currently in progress?"

---

## Configuration Reference

### Council

| Variable | Default | Description |
|----------|---------|-------------|
| `COUNCIL_ENABLED` | `true` | Enable/disable the AI Agents Council |
| `COUNCIL_CLASSIFIER_MODE` | `heuristic` | `heuristic` (zero-cost keyword matching) or `llm` (fast LLM call) |
| `COUNCIL_MAX_MEMBERS` | `6` | Maximum council members per session |
| `COUNCIL_MAX_TURNS_PER_MEMBER` | `15` | Maximum agent turns per council member |
| `COUNCIL_DEFAULT_PATTERN` | `parallel_then_synthesis` | Default deliberation pattern |
| `COUNCIL_MEMBER_MODEL` | *(inherit)* | Model for council members (e.g., use a cheaper model for cost control) |

### Gateway

| Variable | Default | Description |
|----------|---------|-------------|
| `QUEUE_MAX_DEPTH` | `5` | Maximum queued AI jobs per user |
| `QUEUE_TIMEOUT_MS` | `300000` | AI job timeout in milliseconds (5 minutes) |
| `SKILL_IDLE_MS` | `600000` | MCP server idle timeout (10 minutes) |
| `LOG_LEVEL` | `info` | Gateway log verbosity (`debug`, `info`, `warn`, `error`) |

---

## Key Files Reference

### Gateway Core
| File | Purpose |
|------|---------|
| `gateway/src/channels/internal.adapter.ts` | Fastify HTTP server: dispatch, stream, cancel |
| `gateway/src/agent/agent-runner.ts` | Core orchestration: conversation, memory, council, task tracking |
| `gateway/src/agent/message-loop.ts` | Anthropic Messages API streaming loop with tool call accumulation |
| `gateway/src/agent/tool-builder.ts` | Tool search + defer_loading builder |
| `gateway/src/agent/model-capabilities.ts` | Model capability detection for tool search support |
| `gateway/src/agent/mcp-tool-executor.ts` | Stdio MCP client with org-scoping enforcement |
| `gateway/src/channels/mcp-http-transport.ts` | MCP proxy endpoint for remote Claude Desktop |
| `gateway/src/agent/system-prompt.ts` | Main agent system prompt |
| `gateway/src/agent/skill-registry.ts` | YAML loader, tool schema pre-loading |
| `gateway/src/router/router.ts` | Keyword routing, council trigger phrases |
| `gateway/src/config.ts` | GatewayConfig type and env var loading |
| `gateway/skills.yaml` | 9 MCP server definitions |

### Council
| File | Purpose |
|------|---------|
| `gateway/src/council/council-classifier.ts` | Heuristic trigger decision |
| `gateway/src/council/council-orchestrator.ts` | Full deliberation flow |
| `gateway/src/council/council-prompts.ts` | Per-role system prompts |
| `gateway/src/council/council-renderer.ts` | Markdown output renderer |
| `gateway/src/council/council-members.ts` | Agent builder, server filtering |
| `gateway/src/council/council-types.ts` | Types, MEMBER_SERVER_MAP |

### Scheduler and Workflows
| File | Purpose |
|------|---------|
| `gateway/src/scheduler/scheduler.service.ts` | Cron poll: schedules, workflows, approval resume |
| `gateway/src/workflows/types.ts` | WorkflowDefinition, 4 built-in workflows |
| `gateway/src/workflows/workflow-executor.ts` | Step execution, cumulative context, resume |

### Approval Pipeline
| File | Purpose |
|------|---------|
| `packages/mcp-shared/src/pending-action.ts` | `createPendingAction()` — the mutation gateway |
| `packages/mcp-shared/src/error-handler.ts` | `withErrorHandling()` wrapper |
| `apps/server/src/mcp-approval/mcp-approval.service.ts` | Atomic approve/reject state machine |
| `apps/server/src/mcp-approval/mcp-approval.controller.ts` | REST endpoints with executor dispatch |
| `apps/server/src/mcp-approval/mcp-approval-executor.service.ts` | ExecutorMap across 9 domains |
| `apps/server/src/mcp-approval/executors/*.ts` | Per-domain executor implementations |
| `apps/server/src/gateway-config/mcp-key.service.ts` | MCP API key management |

### Prisma Schema
| File | Purpose |
|------|---------|
| `apps/server/prisma/schema/agent-tasks.prisma` | AgentTask and AgentSchedule models |
| `apps/server/prisma/schema/council.prisma` | CouncilSession and CouncilOpinion audit trail |

### MCP Servers
| File | Purpose |
|------|---------|
| `apps/mcp-server-*/src/index.ts` | Server entry points |
| `apps/mcp-server-*/src/tools/*.ts` | Tool registrations |
| `apps/mcp-server-agent-ops/src/tools/action-tools.ts` | Approval feedback loop tools |
| `apps/mcp-server-agent-ops/src/tools/task-tools.ts` | Task tracking tools |

---

## Troubleshooting

### MCP server fails to start

- Verify that `npx` and `tsx` are installed and available on your PATH.
- Check that the `DATABASE_URL` environment variable is set correctly and points to a reachable PostgreSQL instance.
- Confirm the database has been migrated by running `npx prisma migrate status` from the project root.

### Tools return no data

- Verify the database is running: `psql $DATABASE_URL -c "SELECT 1"`
- Check that the database has been seeded or contains data for the domain you are querying.
- Try a broad query first (e.g., "List all controls") to confirm connectivity.

### Proposed actions not appearing

- Check that the assistant confirmed the action was proposed in its response.
- Navigate to `/settings/mcp-approvals` in the web UI and check the Pending tab.
- Verify the MCP server has write access to the database.

### Claude Desktop doesn't show the MCP servers

- Verify the config file path is correct for your OS.
- Check the JSON syntax is valid (no trailing commas).
- Restart Claude Desktop completely (quit, not just close).

### "organisationId is required"

Most tools need an `organisationId`. Ask Claude to find it: *"What organisations exist in the database?"*

### "Can't reach database server"

```bash
docker ps | grep postgres
docker port $(docker ps -q --filter name=db) 5432
```

### "Module not found" errors

```bash
cd /path/to/riskready-community
npm install
```
