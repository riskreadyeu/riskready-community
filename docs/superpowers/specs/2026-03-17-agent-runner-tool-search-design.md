# Agent Runner: Tool Search + Programmatic Calling + Fine-Grained Streaming

**Date:** 2026-03-17
**Status:** Draft
**Scope:** Replace Agent SDK `query()` with raw Anthropic Messages API in `AgentRunner.execute()` and `CouncilOrchestrator`

## Problem

The gateway sends all 253 MCP tool definitions into every Claude API call. For "show me top risks", this costs **228k input tokens** — the vast majority being tool schemas Claude never uses. The Claude Agent SDK's `query()` function doesn't support `defer_loading`, `tool_search_tool`, `code_execution` (programmatic tool calling), or `eager_input_streaming`.

## Solution

Replace the Agent SDK's `query()` with direct use of `@anthropic-ai/sdk` Messages API, enabling three Anthropic platform features:

1. **Tool Search** (`tool_search_tool_bm25_20251119` + `defer_loading: true`) — 85% token reduction
2. **Programmatic Tool Calling** (`code_execution_20260120` + `allowed_callers`) — batch tool calls in code, reduce round trips
3. **Fine-Grained Tool Streaming** (`eager_input_streaming: true`) — lower latency SSE to UI

### Expected Token Impact

| Metric | Before | After |
|--------|--------|-------|
| Tool definitions in context | ~77k tokens (253 tools) | ~500 tokens (tool_search_tool only) |
| Per-search discovery | N/A | ~3k tokens (3-5 tools loaded) |
| Typical first request | ~228k input tokens | ~15-25k input tokens |
| Multi-tool workflows | N round trips | 1 code_execution run |

## Architecture

The gateway stays intact. Only `AgentRunner.execute()` and `CouncilOrchestrator.deliberate()` change internally.

```
Gateway (unchanged)
├── RunManager (SSE pub/sub)
├── LaneQueue (fair scheduling)
├── SkillRegistry (MCP server spawning + tool listing)
├── ToolCatalog (BM25 — now feeds defer_loading tool list)
├── InternalAdapter (SSE streaming)
├── MemoryService / SearchService / Distiller
├── SchedulerService
│
├── AgentRunner ← CHANGES
│   └── MessageLoop (new)
│       ├── Anthropic Messages API (stream: true)
│       │   ├── tool_search_tool_bm25 (always loaded)
│       │   ├── code_execution_20260120 (opt-in per org)
│       │   └── 253 MCP tools with defer_loading: true
│       ├── McpToolExecutor (new) — spawns MCP servers, calls tools
│       └── Same emit() / ChatEvent interface
│
└── CouncilOrchestrator ← CHANGES (same pattern)
```

## Design Refinements

Based on architecture review (polymathic-engineer) and security review (OWASP + OWASP AI):

1. **Server pooling per-conversation, not per-run** — a user sending 5 messages about risks shouldn't spawn `riskready-risks` 5 times. Use reference-counted pool with 60s idle timeout.
2. **Text-only history for past messages** — only the current turn gets full tool blocks. Past messages are text-only to control token growth.
3. **Split `allowed_callers` by read/write** — read-only tools (`list_*`, `get_*`, `search_*`) use `["code_execution_20260120"]` for batching. Mutation tools (`propose_*`) use `["direct"]` only — they must be explicit and one-at-a-time for human-in-the-loop approval.
4. **`code_execution` is opt-in per org** — not ZDR-eligible per Anthropic docs. Default off in Community Edition. Controlled by `allowCodeExecution` in org gateway config.
5. **Container reuse** — pass `container_id` across turns within a run to maintain state in code_execution.
6. **Token budget tracking** — log before/after metrics per request to prove the 85% reduction.

## Detailed Design

### 1. New Module: `gateway/src/agent/message-loop.ts`

The core agentic loop that replaces `query()`. Handles the multi-turn conversation with Claude via the streaming Messages API.

```typescript
interface MessageLoopOptions {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: Anthropic.MessageParam[];
  tools: Anthropic.Tool[];           // All 253 MCP tools with defer_loading: true
  maxTurns: number;
  signal: AbortSignal;
  onEvent: (event: ChatEvent) => void;  // SSE emission
  executeTool: (name: string, input: Record<string, unknown>) => Promise<ToolResult>;
}

interface MessageLoopResult {
  text: string;
  toolCalls: ToolCallRecord[];
  usage: { inputTokens: number; outputTokens: number };
}

async function runMessageLoop(options: MessageLoopOptions): Promise<MessageLoopResult>
```

**Loop logic:**
1. Call `client.messages.stream()` with tool_search_tool + code_execution + deferred tools
2. Process streamed events → emit `text_delta`, `tool_start`, `tool_done` ChatEvents
3. When `stop_reason === 'tool_use'`:
   - For `tool_use` blocks: spawn MCP server via `McpToolExecutor`, call tool, get result
   - For `server_tool_use` (tool_search): handled automatically by API (returns `tool_reference` blocks)
   - For `code_execution` results: handled automatically by API (container lifecycle)
4. Append tool results as `tool_result` messages, loop back to step 1
5. When `stop_reason === 'end_turn'` or turns exhausted: return final result
6. Respect `signal` for cancellation at each turn boundary

### 2. New Module: `gateway/src/agent/mcp-tool-executor.ts`

Handles spawning MCP servers and executing individual tool calls. Replaces what the Agent SDK did internally.

```typescript
interface McpToolExecutor {
  execute(toolName: string, input: Record<string, unknown>): Promise<ToolResult>;
  shutdown(): Promise<void>;
}

interface ToolResult {
  content: string;
  isError: boolean;
}
```

**Implementation:**
- Validate tool name against `^mcp__[a-z][a-z0-9-]*__[a-z][a-z0-9_]*$` regex before dispatch (A03: Injection)
- Parse tool name: `mcp__riskready-risks__list_risks` → server `riskready-risks`, tool `list_risks`
- **Force-inject `organisationId`** into every tool call input, overriding whatever Claude provides (A01: Access Control). The model may hallucinate or be prompt-injected into passing a different org's ID — never trust it.
- Get server config from `SkillRegistry.getMcpServers()`
- Spawn MCP server as stdio child process (or reuse if already spawned in this conversation)
- Call tool via MCP protocol (JSON-RPC over stdio)
- Return result text
- **Server pooling**: per-conversation with 60s idle timeout, not per-run. Shut down idle servers automatically.

```typescript
class McpToolExecutor {
  private organisationId: string; // Set at construction, immutable

  async execute(toolName: string, input: Record<string, unknown>): Promise<ToolResult> {
    // A03: Validate tool name format
    if (!/^mcp__[a-z][a-z0-9-]*__[a-z][a-z0-9_]*$/.test(toolName)) {
      return { content: `Invalid tool name: ${toolName}`, isError: true };
    }
    // A01: Force org scoping — never trust model-supplied organisationId
    input.organisationId = this.organisationId;
    // ... spawn and call
  }
}
```

We already have `@modelcontextprotocol/sdk` as a dependency via `packages/mcp-shared`. Use `Client` from that SDK to connect to spawned servers.

### 3. Tool Definition Builder: `gateway/src/agent/tool-builder.ts`

Converts MCP tool schemas from `SkillRegistry.getToolSets()` into Anthropic API tool format with `defer_loading: true`.

```typescript
function buildToolDefinitions(
  toolSets: ServerToolSet[],
): Anthropic.Tool[]
```

**Output format — read-only tools (list_*, get_*, search_*):**
```json
{
  "name": "mcp__riskready-risks__list_risks",
  "description": "List risks in the register with optional filters",
  "input_schema": { ... },
  "defer_loading": true,
  "allowed_callers": ["code_execution_20260120"]
}
```

**Output format — mutation tools (propose_*):**
```json
{
  "name": "mcp__riskready-risks__propose_create_risk",
  "description": "Propose creating a new risk (requires human approval)",
  "input_schema": { ... },
  "defer_loading": true,
  "allowed_callers": ["direct"]
}
```

Mutation tools use `"direct"` only — they must be explicit, one-at-a-time calls so the human-in-the-loop approval flow works correctly. Read-only tools use `"code_execution_20260120"` so Claude can batch them in a single script.

**Always-loaded tools (no defer_loading):**
```json
[
  { "type": "tool_search_tool_bm25_20251119", "name": "tool_search_tool_bm25" }
]
```

**Conditionally loaded (when org has `allowCodeExecution: true`):**
```json
[
  { "type": "code_execution_20260120", "name": "code_execution" }
]
```

When `code_execution` is disabled, all tools fall back to `"allowed_callers": ["direct"]`.

### 4. Refactored `AgentRunner.execute()`

The method keeps the same signature and external behavior. Changes are internal:

**Before:**
```typescript
const queryIterator = queryFn({ prompt, options: { mcpServers, ... } });
for await (const message of queryIterator) { ... }
```

**After:**
```typescript
const executor = new McpToolExecutor(skillRegistry, databaseUrl, basePath);
try {
  const result = await runMessageLoop({
    apiKey,
    model,
    systemPrompt: SYSTEM_PROMPT,
    messages: buildConversationMessages(history, userMessage, memoryContext, taskContext),
    tools: buildToolDefinitions(skillRegistry.getToolSets()),
    maxTurns,
    signal,
    onEvent: emit,
    executeTool: (name, input) => executor.execute(name, input),
  });
  // ... same post-processing (grounding guard, action extraction, block extraction, save to DB)
} finally {
  await executor.shutdown();
}
```

**Key differences:**
- No `permissionMode: 'dontAsk'` — there's no permission mode in the raw API, eliminating the hallucination source
- No `env` passing — API key is passed directly to the Anthropic client
- No `cleanEnv` / `CLAUDECODE` deletion — not needed
- Conversation history as proper `MessageParam[]` instead of concatenated text string
- Tool results flow through our `McpToolExecutor` instead of the Agent SDK's internal MCP handling

### 5. Conversation Message Format

Currently history is a concatenated text string. With the raw API, we use proper message format:

```typescript
function buildConversationMessages(
  history: ChatMessage[],
  userMessage: string,
  memoryContext: string,
  taskContext: string,
): Anthropic.MessageParam[]
```

This converts stored `ChatMessage` records into proper `{role: 'user' | 'assistant', content: ...}` message params. Memory context and task context go into the system prompt or a prefixed user message.

**Important:** Past messages use **text-only content** (no tool_use/tool_result blocks) to control token growth. Only the current turn includes full tool blocks. This matches what the Agent SDK was doing implicitly with concatenated text history.

### 6. Streaming Event Mapping

The Anthropic streaming API emits events that map directly to our existing ChatEvent types:

| Anthropic Stream Event | ChatEvent | Notes |
|----------------------|-----------|-------|
| `content_block_start` (type: text) | — | No emission needed |
| `content_block_delta` (type: text_delta) | `text_delta` | Same as current |
| `content_block_start` (type: tool_use) | `tool_start` | Extract tool name |
| `content_block_stop` (tool_use) | — | Tool execution starts |
| Tool result received | `tool_done` | After McpToolExecutor returns |
| `content_block_start` (type: server_tool_use) | — | Tool search, transparent |
| `message_start` | — | Extract usage for tracking |
| `message_delta` | — | Extract usage, stop_reason |
| Final text after all turns | — | Accumulated fullText |
| Loop complete | `done` | With messageId |
| Error | `error` | With message |

### 7. Council Orchestrator Changes

Same pattern as AgentRunner — replace `query()` calls with `runMessageLoop()`. The council members each get their own `McpToolExecutor` instance with a filtered set of servers (already handled by the council's server routing).

Council can use fewer features (no need for code_execution in deliberation), so it may use a simpler variant:

```typescript
const result = await runMessageLoop({
  ...commonOptions,
  tools: buildToolDefinitions(memberToolSets), // filtered per-member
  maxTurns: config.maxTurnsPerMember,
});
```

### 8. What Gets Removed

- `@anthropic-ai/claude-agent-sdk` dependency — fully replaced
- `getQueryFn()` lazy import pattern
- `permissionMode: 'dontAsk'` — no longer exists
- `cleanEnv` / `CLAUDECODE` deletion — not needed
- `includePartialMessages` / `persistSession` — Agent SDK specific
- `stderr` callback — not needed (we control the process)
- Text-concatenated conversation history — replaced with proper MessageParam[]

### 9. What Stays Identical

- `AgentRunner` class interface and constructor
- `execute()` method signature: `(msg, signal, emit, taskId?) => Promise<{ messageId: string }>`
- All ChatEvent types and emission patterns
- Grounding guard post-processing
- Block extraction from tool results
- Action ID extraction from tool results
- Task persistence integration (IN_PROGRESS → COMPLETED/FAILED)
- Memory recall and distillation
- Model resolution chain
- Per-org API key and config loading
- Database persistence of ChatMessage records
- CouncilHook interface

## Security (OWASP + OWASP AI Top 10)

### A01: Broken Access Control
- **McpToolExecutor force-injects `organisationId`** into every tool call, overriding model-supplied values. The model may hallucinate or be prompt-injected into passing a different org's ID.
- Tool results are scoped by the MCP servers' own org filtering, but the executor adds a second layer of enforcement.

### A02: Cryptographic Failures
- API keys are passed directly to the Anthropic client constructor, never logged, never stored in the `MessageLoopOptions` after the loop completes.
- Per-org keys are decrypted from DB via AES-256-GCM in `loadDbConfig()` and live only in request-scoped memory.

### A03: Injection
- Tool names validated against `^mcp__[a-z][a-z0-9-]*__[a-z][a-z0-9_]*$` before dispatch — prevents path traversal or injection via crafted tool names.
- Tool inputs pass through MCP servers' Zod validation as a second defense layer.
- No string interpolation or shell commands in the tool execution path.

### A05: Security Misconfiguration — Code Execution Data Retention
- `code_execution_20260120` is **not ZDR-eligible** per Anthropic docs. Tool inputs and outputs pass through Anthropic's sandboxed containers.
- Code execution is **opt-in per org** via `allowCodeExecution` gateway config flag. Default: `false`.
- When disabled, all tools use `allowed_callers: ["direct"]` and no code_execution tool is included.

### A09: Security Logging
- Log which tools were discovered via tool search (tool names only, not inputs)
- Log tool execution: tool name, org ID, success/failure, duration
- **Never log tool input/output payloads at info level** — they may contain PII from the database. Debug level only, gated behind `LOG_LEVEL=debug`.
- Log token counts per request for cost monitoring and anomaly detection.

### OWASP AI — LLM01: Prompt Injection
- The `organisationId` force-injection in McpToolExecutor mitigates indirect prompt injection where a malicious tool result tries to make Claude call tools against a different org.
- The grounding guard catches hallucinated failure claims (existing defense, unchanged).
- Mutation tools (`propose_*`) require human approval — even if Claude is prompt-injected into proposing malicious changes, they won't execute without human review.

### OWASP AI — LLM04: Excessive Agency
- `maxTurns` limits how many API round trips Claude can make (default 25, configurable per org).
- Mutation tools create `McpPendingAction` records requiring human approval — Claude cannot directly modify data.
- `code_execution` batching is limited to read-only tools. Mutations cannot be batched in scripts.

## Error Handling

- **MCP server spawn failure:** Log error, return tool_result with `is_error: true`, let Claude decide next step
- **Tool execution timeout:** 30s per tool call, return timeout error as tool_result
- **API rate limit:** Bubble up to RunManager as `error` ChatEvent
- **Abort signal:** Check at each turn boundary, cancel in-flight API call
- **Max turns exceeded:** Return accumulated text, emit `done`

## Testing Strategy

1. **Unit tests** for `message-loop.ts` — mock Anthropic client, verify turn loop, tool dispatch
2. **Unit tests** for `mcp-tool-executor.ts` — mock MCP server spawn, verify tool call/response
3. **Unit tests** for `tool-builder.ts` — verify defer_loading and schema conversion
4. **Integration test** — real API call with a single MCP server, verify end-to-end streaming
5. **Existing tests** — `chat.service.spec.ts` and `grounding-guard.test.ts` should pass unchanged

## Migration

1. Implement new modules alongside existing code
2. Feature flag: `USE_TOOL_SEARCH=true` env var to switch between old and new paths
3. Test with flag on in Docker
4. Validate: average input tokens drops below 30k per request
5. Validate: error rate stays below 5%
6. Remove Agent SDK once validated
7. Remove feature flag

**Rollback criteria:** If average input tokens don't drop below 30k, or error rate exceeds 5%, flip `USE_TOOL_SEARCH=false` and investigate.

## Files to Create

| File | Purpose |
|------|---------|
| `gateway/src/agent/message-loop.ts` | Core agentic loop with streaming |
| `gateway/src/agent/mcp-tool-executor.ts` | MCP server spawning and tool execution |
| `gateway/src/agent/tool-builder.ts` | Convert MCP tools to Anthropic API format |
| `gateway/src/agent/conversation-builder.ts` | Build MessageParam[] from chat history |

## Files to Modify

| File | Change |
|------|--------|
| `gateway/src/agent/agent-runner.ts` | Replace query() with runMessageLoop() |
| `gateway/src/council/council-orchestrator.ts` | Replace query() with runMessageLoop() |
| `gateway/package.json` | Remove `@anthropic-ai/claude-agent-sdk` |
| `gateway/src/gateway.ts` | Pass SkillRegistry to AgentRunner for tool building |

## Files Unchanged

Everything else in the gateway: RunManager, LaneQueue, InternalAdapter, ToolCatalog, Router, MemoryService, SearchService, MemoryDistiller, SchedulerService, config, types, grounding-guard, block-extractor, action-id-extractor, system-prompt.
