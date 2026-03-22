# AI Architecture — Deep Technical Reference

This document covers the internal implementation of RiskReady's agentic AI platform. It complements [AGENTIC_AI_PLATFORM.md](./AGENTIC_AI_PLATFORM.md) (capabilities overview) and [AI_ASSISTANT.md](./AI_ASSISTANT.md) (user guide) with developer-level detail on message flows, execution internals, and integration points.

## Table of Contents

1. [End-to-End Message Flow](#1-end-to-end-message-flow)
2. [Gateway Internals](#2-gateway-internals)
3. [MCP Tool Execution](#3-mcp-tool-execution)
4. [Human-in-the-Loop Approval](#4-human-in-the-loop-approval)
5. [AI Agents Council](#5-ai-agents-council)
6. [Scheduler and Autonomous Runs](#6-scheduler-and-autonomous-runs)
7. [Cross-Domain Workflows](#7-cross-domain-workflows)
8. [Agent Task Tracking](#8-agent-task-tracking)
9. [Skills Registry and Routing](#9-skills-registry-and-routing)
10. [Security Model](#10-security-model)
11. [Key Files Reference](#11-key-files-reference)

---

## 1. End-to-End Message Flow

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

`apps/web/src/lib/chat-api.ts` defines the typed API surface:

- `sendMessage(conversationId, { text })` — POSTs to `/chat/conversations/:id/messages`, receives `{ runId }`
- The frontend opens an SSE stream to `/chat/conversations/:id/messages/stream/:runId`

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

## 2. Gateway Internals

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
10. **Council decision**: Check if message qualifies for multi-agent council (see section 5)
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

**Prompt caching**: The system prompt is sent with `cache_control: { type: 'ephemeral' }`, enabling Anthropic's prompt caching. Since the system prompt (~5,000+ tokens including all MCP tool instructions) is identical across turns within a conversation, subsequent turns in the agentic loop hit the cache instead of re-processing the full prompt. This reduces latency and cost for multi-turn tool-use conversations where the agent makes several sequential tool calls.

```typescript
system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
```

**Token budget**: If `inputTokens + outputTokens > 500,000`, a budget-exceeded notice is appended and the loop stops.

### Tool Search (96% Token Reduction)

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

**Impact**: Input tokens dropped from ~180k to ~7k per council member, a 96% reduction. This makes running 6-member council sessions practical on cost-constrained deployments.

### MCP Proxy

`gateway/src/channels/mcp-http-transport.ts`

The gateway exposes an HTTPS endpoint at `POST /mcp` that accepts MCP JSON-RPC requests authenticated via Bearer token (API keys with `rr_sk_` prefix). This allows Claude Desktop to connect remotely without direct database access.

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

## 3. MCP Tool Execution

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

## 4. Human-in-the-Loop Approval

### The Invariant

**Every AI mutation goes through `createPendingAction()`**. The agent can only propose — never directly write to domain tables. This is enforced architecturally: MCP mutation tools call `createPendingAction()` which writes a `McpPendingAction` row with `status: PENDING` and returns `{ actionId }`.

### Status Lifecycle

```
PENDING ──approve──▶ APPROVED ──execute──▶ EXECUTED
   │                    │
   │                    └──execute fails──▶ FAILED ──retry──▶ PENDING
   │
   └──reject──▶ REJECTED
```

### Approval Service

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

### Approval Controller

`apps/server/src/mcp-approval/mcp-approval.controller.ts`

All endpoints guarded by `@AdminOnly()`.

**`POST /mcp-approvals/:id/approve` flow:**
1. `approvalService.approve()` — atomic status transition
2. `executorService.canExecute(actionType)` — check executor exists
3. `executorService.execute(actionType, payload, reviewedById)` — run domain service
4. On success: `markExecuted()` with result data
5. On failure: `markFailed()` with error message
6. Emit `approval.resolved` event (EventEmitter2) — triggers scheduler resume

### Executor Service

`apps/server/src/mcp-approval/mcp-approval-executor.service.ts`

Maintains `ExecutorMap = Map<McpActionType, Executor>` populated by 9 domain registrations. Before calling an executor, the service runs `stripMcpMeta()` which removes `reason` (always) and `organisationId` (for UPDATE/DELETE operations only — kept for CREATE/LINK).

**Example executor (risk domain):**
```typescript
// apps/server/src/mcp-approval/executors/risk.executors.ts
map.set('CREATE_RISK', (p, userId) =>
  riskService.create({ ...stripMcpMeta(p), createdById: userId }));

map.set('ASSESS_SCENARIO', (p, userId) =>
  scenarioService.update(p.scenarioId, {
    [p.assessmentType === 'residual' ? 'residualLikelihood' : 'likelihood']: p.likelihood,
    ...
  }));
```

---

## 5. AI Agents Council

The council is a multi-agent deliberation system that activates for complex, cross-domain questions.

### Trigger Decision (Classifier)

`gateway/src/council/council-classifier.ts`

The heuristic classifier convenes the council when either:
- The message spans **3+ distinct domain categories** (counted by `router.countDistinctDomains()`)
- The message contains a **council trigger phrase** (12 phrases: "overall posture", "board report", "security posture", "executive summary", "cross-domain", etc.)

**Member selection**: Maps domain keywords to specialist roles. The `ciso-strategist` is always included. If no specific keywords match, all 6 members participate.

**Pattern selection**:
| Message Pattern | Deliberation Pattern |
|----------------|---------------------|
| "risk acceptance" / "accept risk" / "risk appetite" | `challenge_response` |
| "investigate" / "root cause" / "trace" | `sequential_buildup` |
| Default | `parallel_then_synthesis` |

### The 6 Specialist Agents

Defined in `gateway/src/council/council-types.ts`:

| Role | MCP Server Access | Focus |
|------|-------------------|-------|
| `risk-analyst` | risks, controls, agent-ops | Risk register, scenarios, KRIs, treatment |
| `controls-auditor` | controls, evidence, audits, agent-ops | Control testing, SOA, gap analysis |
| `compliance-officer` | policies, controls, organisation, agent-ops | Policy lifecycle, regulatory mapping |
| `incident-commander` | incidents, itsm, evidence, agent-ops | Incident response, MTTR, lessons learned |
| `evidence-auditor` | evidence, audits, controls, agent-ops | Evidence coverage, expiry, requests |
| `ciso-strategist` | **all 9 servers** | Cross-domain synthesis, strategic view |

Each member gets a scoped `McpToolExecutor` with access only to its permitted servers.

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

### Persistence

| Model | Fields |
|-------|--------|
| `CouncilSession` | id, conversationId, question, pattern, participatingAgents[], consensusSummary, deliberation (Json), confidenceLevel, organisationId, timestamps |
| `CouncilOpinion` | id, sessionId (FK), agentRole, findings (Json), recommendations (Json), dissents (Json), dataSources (Json), confidence |

### Configuration

| Env Var | Default | Purpose |
|---------|---------|---------|
| `COUNCIL_ENABLED` | `true` | Master on/off switch |
| `COUNCIL_CLASSIFIER_MODE` | `heuristic` | `heuristic` or `llm` |
| `COUNCIL_MAX_MEMBERS` | `6` | Cap on members per session |
| `COUNCIL_MAX_TURNS_PER_MEMBER` | `15` | Max agentic turns per member |
| `COUNCIL_DEFAULT_PATTERN` | `parallel_then_synthesis` | Default deliberation pattern |
| `COUNCIL_MEMBER_MODEL` | (unset) | Override model for council members |

---

## 6. Scheduler and Autonomous Runs

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

The cron parser is a custom implementation supporting standard 5-field cron expressions (`* */5 1-5 * *`).

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

### Prisma Models

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

## 7. Cross-Domain Workflows

`gateway/src/workflows/`

### Built-in Workflow Definitions

| Workflow | Steps | Approval Gates |
|----------|-------|----------------|
| **incident-response-flow** | 1. Incident Analysis (incidents) → 2. Control Gap ID (controls, incidents) → 3. Risk Re-assessment (risks, controls) → 4. Treatment Proposal (risks, controls) | Step 4 |
| **weekly-risk-review** | 1. Tolerance Breach Check → 2. KRI Trend Analysis → 3. Overdue Treatment Review → 4. Executive Summary | None |
| **control-assurance-cycle** | 1. Assessment Status → 2. Gap Analysis → 3. NC Tracking | None |
| **policy-compliance-check** | 1. Overdue Reviews → 2. Exception Expiry → 3. Evidence Coverage | None |

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

---

## 8. Agent Task Tracking

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

---

## 9. Skills Registry and Routing

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

`countDistinctDomains(message)` counts unique domain categories (10 total: controls, compliance, risks, incidents, policies, evidence, audits, itsm, organisation). Used by the council classifier to decide if a message is cross-domain.

---

## 10. Security Model

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

- System prompt instructs strict tool-use-only behavior
- Grounding guard validates response text
- Prompt injection patterns logged as warnings
- Council member outputs not directly streamed to users (parsed first)

---

## 11. Key Files Reference

### Gateway Core
| File | Purpose |
|------|---------|
| `gateway/src/channels/internal.adapter.ts` | Fastify HTTP server: dispatch, stream, cancel |
| `gateway/src/agent/agent-runner.ts` | Core orchestration: conversation, memory, council, task tracking |
| `gateway/src/agent/message-loop.ts` | Anthropic Messages API streaming loop with tool call accumulation |
| `gateway/src/agent/tool-builder.ts` | Tool search + defer_loading builder |
| `gateway/src/agent/tool-schema-loader.ts` | Loads tool schemas from skill registry |
| `gateway/src/agent/model-capabilities.ts` | Model capability detection for tool search support |
| `gateway/src/agent/conversation-builder.ts` | Conversation history builder |
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
| `apps/server/src/gateway-config/mcp-key.service.ts` | MCP API key management (create, validate, revoke) |
| `apps/server/src/gateway-config/mcp-key.controller.ts` | MCP API key REST endpoints |

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
