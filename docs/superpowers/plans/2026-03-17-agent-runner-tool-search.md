# Agent Runner Tool Search Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Agent SDK `query()` with raw Anthropic Messages API using tool_search_tool, defer_loading, programmatic tool calling, and fine-grained streaming — reducing input tokens from ~228k to ~15-25k per request.

**Architecture:** Four new modules (tool-schema-loader, tool-builder, mcp-tool-executor, message-loop) replace the Agent SDK's `query()` inside AgentRunner.execute(). The gateway shell (RunManager, LaneQueue, InternalAdapter, SkillRegistry, etc.) is untouched. A feature flag `USE_TOOL_SEARCH` enables gradual rollout.

**Tech Stack:** `@anthropic-ai/sdk` (already a dependency), `@modelcontextprotocol/sdk` (already in packages/mcp-shared), TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-03-17-agent-runner-tool-search-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `gateway/src/agent/tool-schema-loader.ts` | Spawns each MCP server at startup, calls `tools/list` to get full JSON schemas, caches them. Shut down servers after. |
| `gateway/src/agent/tool-builder.ts` | Converts cached MCP tool schemas into Anthropic API format with `defer_loading: true`, `allowed_callers` split by read/write, and optional `code_execution` tool. |
| `gateway/src/agent/mcp-tool-executor.ts` | Spawns MCP servers on-demand, calls tools via JSON-RPC stdio, forces organisationId, validates tool names. Per-conversation pooling with idle timeout. |
| `gateway/src/agent/conversation-builder.ts` | Converts ChatMessage[] DB records into Anthropic `MessageParam[]`. Text-only for past messages, current message as-is. |
| `gateway/src/agent/message-loop.ts` | Core agentic loop: streaming Messages API call → process events → execute tools → loop until done. Emits ChatEvents for SSE. |
| `gateway/src/__tests__/tool-builder.test.ts` | Unit tests for tool definition building |
| `gateway/src/__tests__/conversation-builder.test.ts` | Unit tests for message format conversion |
| `gateway/src/__tests__/mcp-tool-executor.test.ts` | Unit tests for tool execution with mocked MCP |
| `gateway/src/__tests__/message-loop.test.ts` | Unit tests for the agentic loop with mocked Anthropic client |

### Modified files

| File | Change |
|------|--------|
| `gateway/src/agent/agent-runner.ts` | Add feature-flagged path using new modules instead of Agent SDK `query()` |
| `gateway/src/gateway.ts` | Load tool schemas at startup, pass to AgentRunner |
| `gateway/src/council/council-orchestrator.ts` | Add feature-flagged path using `runMessageLoop()` instead of `query()` |
| `gateway/package.json` | (Later) Remove `@anthropic-ai/claude-agent-sdk` after validation |

### Unchanged files

RunManager, LaneQueue, InternalAdapter, ToolCatalog, Router, MemoryService, SearchService, MemoryDistiller, SchedulerService, config, types, grounding-guard, block-extractor, action-id-extractor, system-prompt, chat.service, chat.controller.

---

## Chunk 1: Foundation Modules (tool-schema-loader, tool-builder, conversation-builder)

### Task 1: Tool Schema Loader

**Files:**
- Create: `gateway/src/agent/tool-schema-loader.ts`
- Create: `gateway/src/__tests__/tool-schema-loader.test.ts`

- [ ] **Step 1: Write the test for loading tool schemas from a mock MCP server**

```typescript
// gateway/src/__tests__/tool-schema-loader.test.ts
import { describe, expect, it, vi } from 'vitest';
import { loadToolSchemas, type FullToolSchema } from '../agent/tool-schema-loader.js';

describe('loadToolSchemas', () => {
  it('returns full tool schemas with input_schema from MCP servers', async () => {
    // Mock the MCP client spawning — we'll test the parsing logic
    const mockSchemas: FullToolSchema[] = [
      {
        name: 'list_risks',
        description: 'List risks in the register',
        inputSchema: {
          type: 'object',
          properties: {
            organisationId: { type: 'string' },
            skip: { type: 'number' },
          },
          required: ['organisationId'],
        },
        serverName: 'riskready-risks',
      },
    ];

    expect(mockSchemas[0].inputSchema.properties).toBeDefined();
    expect(mockSchemas[0].serverName).toBe('riskready-risks');
  });

  it('prefixes tool names with mcp__serverName__', () => {
    const fullName = `mcp__riskready-risks__list_risks`;
    expect(fullName).toMatch(/^mcp__[a-z][a-z0-9-]*__[a-z][a-z0-9_]*$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd gateway && npx vitest run src/__tests__/tool-schema-loader.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement tool-schema-loader**

```typescript
// gateway/src/agent/tool-schema-loader.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from '../logger.js';
import type { SkillRegistry } from './skill-registry.js';

export interface FullToolSchema {
  name: string;                    // e.g. 'list_risks'
  fullName: string;                // e.g. 'mcp__riskready-risks__list_risks'
  description: string;
  inputSchema: Record<string, unknown>;
  serverName: string;
}

export async function loadToolSchemas(
  registry: SkillRegistry,
  databaseUrl: string,
  basePath: string,
): Promise<FullToolSchema[]> {
  const allSchemas: FullToolSchema[] = [];
  const allSkills = registry.listAll();

  for (const skill of allSkills) {
    const serverConfigs = registry.getMcpServers([skill.name], databaseUrl, basePath);
    const config = serverConfigs[skill.name];
    if (!config) continue;

    try {
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: { ...process.env, ...config.env },
      });

      const client = new Client({ name: 'schema-loader', version: '1.0.0' });
      await client.connect(transport);

      const { tools } = await client.listTools();

      for (const tool of tools) {
        allSchemas.push({
          name: tool.name,
          fullName: `mcp__${skill.name}__${tool.name}`,
          description: tool.description ?? '',
          inputSchema: (tool.inputSchema as Record<string, unknown>) ?? { type: 'object', properties: {} },
          serverName: skill.name,
        });
      }

      await client.close();
      logger.debug({ server: skill.name, tools: tools.length }, 'Loaded tool schemas');
    } catch (err) {
      logger.error({ err, server: skill.name }, 'Failed to load tool schemas');
    }
  }

  logger.info({ totalTools: allSchemas.length }, 'Tool schemas loaded');
  return allSchemas;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd gateway && npx vitest run src/__tests__/tool-schema-loader.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add gateway/src/agent/tool-schema-loader.ts gateway/src/__tests__/tool-schema-loader.test.ts
git commit -m "feat(gateway): add tool schema loader for MCP server introspection"
```

---

### Task 2: Tool Builder

**Files:**
- Create: `gateway/src/agent/tool-builder.ts`
- Create: `gateway/src/__tests__/tool-builder.test.ts`

- [ ] **Step 1: Write tests for tool definition building**

```typescript
// gateway/src/__tests__/tool-builder.test.ts
import { describe, expect, it } from 'vitest';
import { buildToolDefinitions, type ToolBuildOptions } from '../agent/tool-builder.js';
import type { FullToolSchema } from '../agent/tool-schema-loader.js';

const MOCK_SCHEMAS: FullToolSchema[] = [
  {
    name: 'list_risks',
    fullName: 'mcp__riskready-risks__list_risks',
    description: 'List risks',
    inputSchema: { type: 'object', properties: { organisationId: { type: 'string' } } },
    serverName: 'riskready-risks',
  },
  {
    name: 'propose_create_risk',
    fullName: 'mcp__riskready-risks__propose_create_risk',
    description: 'Propose creating a risk',
    inputSchema: { type: 'object', properties: { title: { type: 'string' } } },
    serverName: 'riskready-risks',
  },
];

describe('buildToolDefinitions', () => {
  it('marks all MCP tools as defer_loading: true', () => {
    const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: false });
    const mcpTools = tools.filter((t: any) => t.name?.startsWith('mcp__'));
    for (const tool of mcpTools) {
      expect((tool as any).defer_loading).toBe(true);
    }
  });

  it('always includes tool_search_tool_bm25', () => {
    const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: false });
    const searchTool = tools.find((t: any) => t.type === 'tool_search_tool_bm25_20251119');
    expect(searchTool).toBeDefined();
  });

  it('sets allowed_callers to direct for propose_* tools', () => {
    const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: true });
    const mutation = tools.find((t: any) => t.name === 'mcp__riskready-risks__propose_create_risk');
    expect((mutation as any).allowed_callers).toEqual(['direct']);
  });

  it('sets allowed_callers to code_execution for read tools when code_execution enabled', () => {
    const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: true });
    const read = tools.find((t: any) => t.name === 'mcp__riskready-risks__list_risks');
    expect((read as any).allowed_callers).toEqual(['code_execution_20260120']);
  });

  it('sets allowed_callers to direct for all tools when code_execution disabled', () => {
    const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: false });
    const read = tools.find((t: any) => t.name === 'mcp__riskready-risks__list_risks');
    expect((read as any).allowed_callers).toBeUndefined();
  });

  it('includes code_execution tool only when enabled', () => {
    const withCode = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: true });
    const withoutCode = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: false });
    expect(withCode.find((t: any) => t.type === 'code_execution_20260120')).toBeDefined();
    expect(withoutCode.find((t: any) => t.type === 'code_execution_20260120')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd gateway && npx vitest run src/__tests__/tool-builder.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement tool-builder**

```typescript
// gateway/src/agent/tool-builder.ts
import type { FullToolSchema } from './tool-schema-loader.js';

export interface ToolBuildOptions {
  allowCodeExecution: boolean;
}

function isMutation(toolName: string): boolean {
  return toolName.includes('propose_');
}

export function buildToolDefinitions(
  schemas: FullToolSchema[],
  options: ToolBuildOptions,
): Record<string, unknown>[] {
  const tools: Record<string, unknown>[] = [];

  // Always-loaded: tool search
  tools.push({
    type: 'tool_search_tool_bm25_20251119',
    name: 'tool_search_tool_bm25',
  });

  // Conditionally loaded: code execution
  if (options.allowCodeExecution) {
    tools.push({
      type: 'code_execution_20260120',
      name: 'code_execution',
    });
  }

  // MCP tools — all deferred
  for (const schema of schemas) {
    const tool: Record<string, unknown> = {
      name: schema.fullName,
      description: schema.description,
      input_schema: schema.inputSchema,
      defer_loading: true,
    };

    if (options.allowCodeExecution) {
      tool.allowed_callers = isMutation(schema.name)
        ? ['direct']
        : ['code_execution_20260120'];
    }

    tools.push(tool);
  }

  return tools;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd gateway && npx vitest run src/__tests__/tool-builder.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add gateway/src/agent/tool-builder.ts gateway/src/__tests__/tool-builder.test.ts
git commit -m "feat(gateway): add tool builder with defer_loading and read/write caller split"
```

---

### Task 3: Conversation Builder

**Files:**
- Create: `gateway/src/agent/conversation-builder.ts`
- Create: `gateway/src/__tests__/conversation-builder.test.ts`

- [ ] **Step 1: Write tests for conversation message building**

```typescript
// gateway/src/__tests__/conversation-builder.test.ts
import { describe, expect, it } from 'vitest';
import { buildConversationMessages } from '../agent/conversation-builder.js';

describe('buildConversationMessages', () => {
  it('converts ChatMessage records into MessageParam array', () => {
    const history = [
      { role: 'USER' as const, content: 'Hello' },
      { role: 'ASSISTANT' as const, content: 'Hi there' },
    ];

    const result = buildConversationMessages(history, 'Show me risks');
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ role: 'user', content: 'Hello' });
    expect(result[1]).toEqual({ role: 'assistant', content: 'Hi there' });
    expect(result[2]).toEqual({ role: 'user', content: 'Show me risks' });
  });

  it('uses text-only content for past messages (no tool blocks)', () => {
    const history = [
      { role: 'USER' as const, content: 'List controls' },
      { role: 'ASSISTANT' as const, content: 'Here are the controls...', toolCalls: [{ name: 'list_controls' }] },
    ];

    const result = buildConversationMessages(history, 'Now show risks');
    // Past assistant message should be text-only, no tool blocks
    expect(result[1]).toEqual({ role: 'assistant', content: 'Here are the controls...' });
  });

  it('caps history at 20 past messages', () => {
    const history = Array.from({ length: 30 }, (_, i) => ({
      role: (i % 2 === 0 ? 'USER' : 'ASSISTANT') as 'USER' | 'ASSISTANT',
      content: `Message ${i}`,
    }));

    const result = buildConversationMessages(history, 'Current message');
    // 20 past + 1 current = 21
    expect(result).toHaveLength(21);
  });

  it('ensures alternating user/assistant roles', () => {
    const history = [
      { role: 'USER' as const, content: 'A' },
      { role: 'USER' as const, content: 'B' },  // Two user messages in a row
      { role: 'ASSISTANT' as const, content: 'C' },
    ];

    const result = buildConversationMessages(history, 'D');
    // Should merge consecutive same-role messages or handle gracefully
    for (let i = 1; i < result.length; i++) {
      expect(result[i].role).not.toBe(result[i - 1].role);
    }
  });

  it('returns just the current message when history is empty', () => {
    const result = buildConversationMessages([], 'First message');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ role: 'user', content: 'First message' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd gateway && npx vitest run src/__tests__/conversation-builder.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement conversation-builder**

```typescript
// gateway/src/agent/conversation-builder.ts

interface HistoryMessage {
  role: 'USER' | 'ASSISTANT';
  content: string;
  toolCalls?: unknown[];
}

interface MessageParam {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_HISTORY = 20;

export function buildConversationMessages(
  history: HistoryMessage[],
  currentMessage: string,
): MessageParam[] {
  // Cap history
  const recent = history.length > MAX_HISTORY
    ? history.slice(-MAX_HISTORY)
    : history;

  // Convert to MessageParam with text-only content (no tool blocks)
  const messages: MessageParam[] = [];
  for (const msg of recent) {
    const role = msg.role === 'USER' ? 'user' : 'assistant';

    // Merge consecutive same-role messages
    if (messages.length > 0 && messages[messages.length - 1].role === role) {
      messages[messages.length - 1].content += '\n\n' + msg.content;
    } else {
      messages.push({ role, content: msg.content });
    }
  }

  // Append current user message
  if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
    messages[messages.length - 1].content += '\n\n' + currentMessage;
  } else {
    messages.push({ role: 'user', content: currentMessage });
  }

  return messages;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd gateway && npx vitest run src/__tests__/conversation-builder.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add gateway/src/agent/conversation-builder.ts gateway/src/__tests__/conversation-builder.test.ts
git commit -m "feat(gateway): add conversation builder for proper MessageParam formatting"
```

---

## Chunk 2: MCP Tool Executor

### Task 4: MCP Tool Executor

**Files:**
- Create: `gateway/src/agent/mcp-tool-executor.ts`
- Create: `gateway/src/__tests__/mcp-tool-executor.test.ts`

- [ ] **Step 1: Write tests for tool execution**

```typescript
// gateway/src/__tests__/mcp-tool-executor.test.ts
import { describe, expect, it } from 'vitest';
import { McpToolExecutor, TOOL_NAME_PATTERN } from '../agent/mcp-tool-executor.js';

describe('TOOL_NAME_PATTERN', () => {
  it('accepts valid MCP tool names', () => {
    expect(TOOL_NAME_PATTERN.test('mcp__riskready-risks__list_risks')).toBe(true);
    expect(TOOL_NAME_PATTERN.test('mcp__riskready-agent-ops__check_action_status')).toBe(true);
  });

  it('rejects invalid tool names', () => {
    expect(TOOL_NAME_PATTERN.test('list_risks')).toBe(false);
    expect(TOOL_NAME_PATTERN.test('mcp__../../etc/passwd__evil')).toBe(false);
    expect(TOOL_NAME_PATTERN.test('')).toBe(false);
    expect(TOOL_NAME_PATTERN.test('mcp__UPPERCASE__tool')).toBe(false);
  });
});

describe('McpToolExecutor', () => {
  it('rejects invalid tool names with error result', async () => {
    const executor = new McpToolExecutor({
      organisationId: 'org-1',
      getServerConfig: () => undefined,
    });

    const result = await executor.execute('../../etc/passwd', {});
    expect(result.isError).toBe(true);
    expect(result.content).toContain('Invalid tool name');
  });

  it('returns error when server config not found', async () => {
    const executor = new McpToolExecutor({
      organisationId: 'org-1',
      getServerConfig: () => undefined,
    });

    const result = await executor.execute('mcp__unknown-server__some_tool', {});
    expect(result.isError).toBe(true);
    expect(result.content).toContain('not found');
  });

  it('force-injects organisationId into tool input', async () => {
    let capturedInput: Record<string, unknown> = {};

    const executor = new McpToolExecutor({
      organisationId: 'org-real',
      getServerConfig: () => ({
        command: 'echo',
        args: ['test'],
      }),
      // Override for testing — capture the input
      _testCallTool: async (_server, _tool, input) => {
        capturedInput = input;
        return { content: '{}', isError: false };
      },
    });

    await executor.execute('mcp__riskready-risks__list_risks', {
      organisationId: 'org-evil',  // Should be overridden
      skip: 0,
    });

    expect(capturedInput.organisationId).toBe('org-real');
  });

  it('parses server and tool name from full MCP tool name', () => {
    // Testing the static parse method
    const parsed = McpToolExecutor.parseToolName('mcp__riskready-risks__list_risks');
    expect(parsed).toEqual({ serverName: 'riskready-risks', toolName: 'list_risks' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd gateway && npx vitest run src/__tests__/mcp-tool-executor.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement mcp-tool-executor**

```typescript
// gateway/src/agent/mcp-tool-executor.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from '../logger.js';

export const TOOL_NAME_PATTERN = /^mcp__[a-z][a-z0-9-]*__[a-z][a-z0-9_]*$/;

const TOOL_TIMEOUT_MS = 30_000;
const IDLE_TIMEOUT_MS = 60_000;

export interface ToolResult {
  content: string;
  isError: boolean;
}

interface ServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface ServerConnection {
  client: Client;
  transport: StdioClientTransport;
  lastUsed: number;
  idleTimer?: ReturnType<typeof setTimeout>;
}

interface McpToolExecutorOptions {
  organisationId: string;
  getServerConfig: (serverName: string) => ServerConfig | undefined;
  // Test hook — allows injecting a mock tool caller
  _testCallTool?: (serverName: string, toolName: string, input: Record<string, unknown>) => Promise<ToolResult>;
}

export class McpToolExecutor {
  private organisationId: string;
  private getServerConfig: (serverName: string) => ServerConfig | undefined;
  private connections = new Map<string, ServerConnection>();
  private testCallTool?: McpToolExecutorOptions['_testCallTool'];

  constructor(options: McpToolExecutorOptions) {
    this.organisationId = options.organisationId;
    this.getServerConfig = options.getServerConfig;
    this.testCallTool = options._testCallTool;
  }

  static parseToolName(fullName: string): { serverName: string; toolName: string } | null {
    const parts = fullName.split('__');
    if (parts.length !== 3 || parts[0] !== 'mcp') return null;
    return { serverName: parts[1], toolName: parts[2] };
  }

  async execute(fullToolName: string, input: Record<string, unknown>): Promise<ToolResult> {
    // A03: Validate tool name
    if (!TOOL_NAME_PATTERN.test(fullToolName)) {
      return { content: `Invalid tool name: ${fullToolName}`, isError: true };
    }

    const parsed = McpToolExecutor.parseToolName(fullToolName);
    if (!parsed) {
      return { content: `Cannot parse tool name: ${fullToolName}`, isError: true };
    }

    // A01: Force org scoping
    input.organisationId = this.organisationId;

    // Test hook
    if (this.testCallTool) {
      return this.testCallTool(parsed.serverName, parsed.toolName, input);
    }

    const config = this.getServerConfig(parsed.serverName);
    if (!config) {
      return { content: `Server config not found for: ${parsed.serverName}`, isError: true };
    }

    try {
      const connection = await this.getOrSpawnServer(parsed.serverName, config);
      connection.lastUsed = Date.now();
      this.resetIdleTimer(parsed.serverName, connection);

      const result = await Promise.race([
        connection.client.callTool({ name: parsed.toolName, arguments: input }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tool call timed out')), TOOL_TIMEOUT_MS),
        ),
      ]);

      const text = (result.content as Array<{ type?: string; text?: string }>)
        ?.filter((c) => c.type === 'text')
        .map((c) => c.text ?? '')
        .join('\n') ?? JSON.stringify(result.content);

      logger.debug({ tool: fullToolName, org: this.organisationId }, 'Tool executed');

      return { content: text, isError: result.isError ?? false };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, tool: fullToolName }, 'Tool execution failed');
      return { content: `Tool execution error: ${message}`, isError: true };
    }
  }

  async shutdown(): Promise<void> {
    for (const [name, conn] of this.connections) {
      if (conn.idleTimer) clearTimeout(conn.idleTimer);
      try {
        await conn.client.close();
      } catch {
        // Best effort
      }
      logger.debug({ server: name }, 'MCP server connection closed');
    }
    this.connections.clear();
  }

  private async getOrSpawnServer(serverName: string, config: ServerConfig): Promise<ServerConnection> {
    const existing = this.connections.get(serverName);
    if (existing) return existing;

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: { ...process.env, ...config.env },
    });

    const client = new Client({ name: `executor-${serverName}`, version: '1.0.0' });
    await client.connect(transport);

    const connection: ServerConnection = {
      client,
      transport,
      lastUsed: Date.now(),
    };

    this.connections.set(serverName, connection);
    logger.debug({ server: serverName }, 'MCP server spawned');
    return connection;
  }

  private resetIdleTimer(serverName: string, connection: ServerConnection): void {
    if (connection.idleTimer) clearTimeout(connection.idleTimer);
    connection.idleTimer = setTimeout(async () => {
      try {
        await connection.client.close();
      } catch {
        // Best effort
      }
      this.connections.delete(serverName);
      logger.debug({ server: serverName }, 'MCP server idle-closed');
    }, IDLE_TIMEOUT_MS);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd gateway && npx vitest run src/__tests__/mcp-tool-executor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add gateway/src/agent/mcp-tool-executor.ts gateway/src/__tests__/mcp-tool-executor.test.ts
git commit -m "feat(gateway): add MCP tool executor with org injection and name validation"
```

---

## Chunk 3: Message Loop

### Task 5: Message Loop — Core Agentic Loop

**Files:**
- Create: `gateway/src/agent/message-loop.ts`
- Create: `gateway/src/__tests__/message-loop.test.ts`

- [ ] **Step 1: Write tests for the message loop**

```typescript
// gateway/src/__tests__/message-loop.test.ts
import { describe, expect, it, vi } from 'vitest';
import { runMessageLoop, type MessageLoopOptions } from '../agent/message-loop.js';

// Mock a minimal streaming response
function mockStreamResponse(contentBlocks: Array<{ type: string; text?: string; name?: string; input?: unknown; id?: string }>, stopReason = 'end_turn') {
  return {
    async *[Symbol.asyncIterator]() {
      // message_start
      yield { type: 'message_start', message: { usage: { input_tokens: 100 } } };

      for (let i = 0; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];
        yield { type: 'content_block_start', index: i, content_block: block };

        if (block.type === 'text' && block.text) {
          yield { type: 'content_block_delta', index: i, delta: { type: 'text_delta', text: block.text } };
        }

        yield { type: 'content_block_stop', index: i };
      }

      yield { type: 'message_delta', delta: { stop_reason: stopReason }, usage: { output_tokens: 50 } };
    },
    async finalMessage() {
      return {
        content: contentBlocks,
        stop_reason: stopReason,
        usage: { input_tokens: 100, output_tokens: 50 },
      };
    },
  };
}

describe('runMessageLoop', () => {
  it('emits text_delta events for text content', async () => {
    const events: Array<{ type: string; text?: string }> = [];

    const mockClient = {
      messages: {
        stream: () => mockStreamResponse([{ type: 'text', text: 'Hello world' }]),
      },
    };

    const result = await runMessageLoop({
      client: mockClient as any,
      model: 'claude-haiku-4-5-20251001',
      systemPrompt: 'You are helpful.',
      messages: [{ role: 'user', content: 'Hi' }],
      tools: [],
      maxTurns: 5,
      signal: new AbortController().signal,
      onEvent: (e) => events.push(e as any),
      executeTool: async () => ({ content: '{}', isError: false }),
    });

    expect(result.text).toBe('Hello world');
    expect(events.some(e => e.type === 'text_delta')).toBe(true);
    expect(result.usage.inputTokens).toBeGreaterThan(0);
  });

  it('respects maxTurns limit', async () => {
    let callCount = 0;

    const mockClient = {
      messages: {
        stream: () => {
          callCount++;
          if (callCount <= 3) {
            return mockStreamResponse(
              [{ type: 'tool_use', name: 'some_tool', input: {}, id: `tool_${callCount}` }],
              'tool_use',
            );
          }
          return mockStreamResponse([{ type: 'text', text: 'Done' }]);
        },
      },
    };

    const result = await runMessageLoop({
      client: mockClient as any,
      model: 'claude-haiku-4-5-20251001',
      systemPrompt: 'test',
      messages: [{ role: 'user', content: 'test' }],
      tools: [],
      maxTurns: 2,
      signal: new AbortController().signal,
      onEvent: () => {},
      executeTool: async () => ({ content: '{"ok": true}', isError: false }),
    });

    expect(callCount).toBeLessThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd gateway && npx vitest run src/__tests__/message-loop.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement message-loop**

```typescript
// gateway/src/agent/message-loop.ts
import type Anthropic from '@anthropic-ai/sdk';
import type { ChatEvent } from '../channels/types.js';
import type { ToolResult } from './mcp-tool-executor.js';
import { logger } from '../logger.js';

export interface ToolCallRecord {
  name: string;
  server: string;
  status: string;
}

export interface MessageLoopOptions {
  client: Anthropic;
  model: string;
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string | unknown[] }>;
  tools: Record<string, unknown>[];
  maxTurns: number;
  signal: AbortSignal;
  onEvent: (event: ChatEvent) => void;
  executeTool: (name: string, input: Record<string, unknown>) => Promise<ToolResult>;
}

export interface MessageLoopResult {
  text: string;
  toolCalls: ToolCallRecord[];
  toolResults: Array<{ toolName: string; status: 'success' | 'error'; rawResult: unknown }>;
  usage: { inputTokens: number; outputTokens: number };
}

export async function runMessageLoop(options: MessageLoopOptions): Promise<MessageLoopResult> {
  const {
    client, model, systemPrompt, tools, maxTurns, signal, onEvent, executeTool,
  } = options;

  let messages = [...options.messages] as Anthropic.MessageParam[];
  let fullText = '';
  const toolCalls: ToolCallRecord[] = [];
  const allToolResults: MessageLoopResult['toolResults'] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let turn = 0; turn < maxTurns; turn++) {
    if (signal.aborted) break;

    const stream = client.messages.stream({
      model,
      max_tokens: 16384,
      system: systemPrompt,
      messages,
      tools: tools as any,
      stream: true,
    });

    // Collect content blocks and stream events
    const contentBlocks: Array<{ type: string; id?: string; name?: string; input?: unknown; text?: string }> = [];
    let stopReason = 'end_turn';
    let turnText = '';

    for await (const event of stream) {
      if (signal.aborted) break;

      if (event.type === 'message_start') {
        const usage = (event as any).message?.usage;
        if (usage) totalInputTokens += usage.input_tokens ?? 0;
      }

      if (event.type === 'content_block_start') {
        const block = (event as any).content_block;
        contentBlocks.push({ ...block });

        if (block.type === 'tool_use' && block.name) {
          const server = block.name.split('__')[1] ?? 'unknown';
          toolCalls.push({ name: block.name, server, status: 'running' });
          onEvent({ type: 'tool_start', tool: block.name, server });
        }
      }

      if (event.type === 'content_block_delta') {
        const delta = (event as any).delta;
        if (delta?.type === 'text_delta' && delta.text) {
          turnText += delta.text;
          fullText += delta.text;
          onEvent({ type: 'text_delta', text: delta.text });
        }
        // Accumulate tool input JSON
        if (delta?.type === 'input_json_delta' && delta.partial_json) {
          const idx = (event as any).index;
          if (contentBlocks[idx]) {
            const current = (contentBlocks[idx].input as string) ?? '';
            contentBlocks[idx].input = current + delta.partial_json;
          }
        }
      }

      if (event.type === 'message_delta') {
        const delta = (event as any).delta;
        stopReason = delta?.stop_reason ?? stopReason;
        const usage = (event as any).usage;
        if (usage) totalOutputTokens += usage.output_tokens ?? 0;
      }
    }

    // If no tool calls, we're done
    if (stopReason !== 'tool_use') break;

    // Execute tool calls and build tool_result messages
    const assistantContent = contentBlocks.map((block) => {
      if (block.type === 'text') {
        return { type: 'text' as const, text: block.text ?? turnText };
      }
      if (block.type === 'tool_use') {
        let parsedInput: Record<string, unknown> = {};
        try {
          parsedInput = typeof block.input === 'string'
            ? JSON.parse(block.input)
            : (block.input as Record<string, unknown>) ?? {};
        } catch {
          parsedInput = {};
        }
        return {
          type: 'tool_use' as const,
          id: block.id ?? '',
          name: block.name ?? '',
          input: parsedInput,
        };
      }
      return block;
    });

    messages.push({ role: 'assistant', content: assistantContent as any });

    // Execute each tool call
    const toolResultBlocks: Array<{ type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }> = [];

    for (const block of assistantContent) {
      if (block.type !== 'tool_use') continue;

      const toolResult = await executeTool(block.name, block.input as Record<string, unknown>);

      // Track for grounding guard
      allToolResults.push({
        toolName: block.name,
        status: toolResult.isError ? 'error' : 'success',
        rawResult: { content: [{ type: 'text', text: toolResult.content }], isError: toolResult.isError },
      });

      toolResultBlocks.push({
        type: 'tool_result',
        tool_use_id: block.id ?? '',
        content: toolResult.content,
        is_error: toolResult.isError || undefined,
      });

      // Update tool call status and emit
      const tc = toolCalls.find((t) => t.name === block.name && t.status === 'running');
      if (tc) tc.status = 'done';
      onEvent({ type: 'tool_done', tool: block.name, status: toolResult.isError ? 'error' : 'success' });

      logger.debug({
        tool: block.name,
        isError: toolResult.isError,
      }, 'Tool result');
    }

    messages.push({ role: 'user', content: toolResultBlocks as any });
  }

  return {
    text: fullText,
    toolCalls,
    toolResults: allToolResults,
    usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd gateway && npx vitest run src/__tests__/message-loop.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add gateway/src/agent/message-loop.ts gateway/src/__tests__/message-loop.test.ts
git commit -m "feat(gateway): add message loop with streaming, tool dispatch, and turn management"
```

---

## Chunk 4: Integration — Wire Into AgentRunner and Gateway

### Task 6: Wire Tool Schema Loading Into Gateway Startup

**Files:**
- Modify: `gateway/src/gateway.ts`

- [ ] **Step 1: Add tool schema loading to Gateway constructor**

In `gateway/src/gateway.ts`, after the ToolCatalog initialization (around line 57), add:

```typescript
import { loadToolSchemas, type FullToolSchema } from './agent/tool-schema-loader.js';
import { buildToolDefinitions } from './agent/tool-builder.js';

// In the Gateway class:
private toolSchemas: FullToolSchema[] = [];
```

In `Gateway.start()`, before starting adapters, add schema loading:

```typescript
// Load full tool schemas from MCP servers (one-time at startup)
if (process.env.USE_TOOL_SEARCH === 'true') {
  const PROJECT_ROOT = join(process.cwd(), '..');
  this.toolSchemas = await loadToolSchemas(
    this.skillRegistry,
    config.databaseUrl,
    join(PROJECT_ROOT, 'apps'),
  );
  logger.info({ tools: this.toolSchemas.length }, 'Tool schemas loaded for tool search');
}
```

Pass schemas to AgentRunner via a new getter.

- [ ] **Step 2: Verify gateway still starts**

Run: `cd /tmp/riskready-community-install-fresh-20260317 && docker compose up --build gateway -d && docker compose logs gateway --tail 20`
Expected: Gateway starts, no errors. With `USE_TOOL_SEARCH` unset, no schema loading.

- [ ] **Step 3: Commit**

```bash
git add gateway/src/gateway.ts
git commit -m "feat(gateway): wire tool schema loading at startup behind feature flag"
```

---

### Task 7: Feature-Flag AgentRunner to Use New Path

**Files:**
- Modify: `gateway/src/agent/agent-runner.ts`

- [ ] **Step 1: Add feature-flagged new path in execute()**

At the top of `AgentRunner.execute()`, after the existing setup (conversation creation, message save, history loading, memory recall), add:

```typescript
// Feature flag: use new tool search path
if (process.env.USE_TOOL_SEARCH === 'true' && this.deps.toolSchemas?.length) {
  return this.executeWithToolSearch(msg, signal, emit, taskId, conversationId, conversation, historyText, memoryContext, taskContext);
}
// ... existing query() path below
```

Add a new private method `executeWithToolSearch()` that uses `runMessageLoop()`, `McpToolExecutor`, `buildToolDefinitions()`, and `buildConversationMessages()`.

This method:
1. Creates an `McpToolExecutor` with org-scoped server config getter
2. Creates an Anthropic client with the resolved API key
3. Builds conversation messages from history
4. Builds tool definitions with defer_loading
5. Calls `runMessageLoop()`
6. Applies grounding guard, extracts actions/blocks, saves to DB
7. Same ChatEvent emission as existing path

- [ ] **Step 2: Add toolSchemas to AgentRunnerDeps**

```typescript
export interface AgentRunnerDeps {
  // ... existing fields
  toolSchemas?: FullToolSchema[];
  skillRegistry?: SkillRegistry;
}
```

- [ ] **Step 3: Run existing tests to verify no regression**

Run: `cd gateway && npx vitest run`
Expected: All existing tests pass (grounding-guard, conversation-model, etc.)

Run: `cd apps/server && npx jest --testPathPattern=chat.service --forceExit`
Expected: All 7 chat tests pass

- [ ] **Step 4: Commit**

```bash
git add gateway/src/agent/agent-runner.ts
git commit -m "feat(gateway): add feature-flagged tool search path in AgentRunner"
```

---

### Task 8: Wire Council Orchestrator (Feature-Flagged)

**Files:**
- Modify: `gateway/src/council/council-orchestrator.ts`

- [ ] **Step 1: Add feature-flagged new path for council members**

Same pattern as AgentRunner — when `USE_TOOL_SEARCH=true`, use `runMessageLoop()` instead of `query()` for both member analysis and synthesis phases.

Council does NOT use `code_execution` (deliberation should be direct tool calls only).

- [ ] **Step 2: Run existing tests**

Run: `cd gateway && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add gateway/src/council/council-orchestrator.ts
git commit -m "feat(gateway): add feature-flagged tool search path in CouncilOrchestrator"
```

---

## Chunk 5: Docker Test and Validation

### Task 9: End-to-End Docker Test

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Pull and rebuild Docker with feature flag**

```bash
cd /tmp/riskready-community-install-fresh-20260317
git pull origin main
# Add USE_TOOL_SEARCH=true to docker-compose.yml gateway environment
docker compose up --build -d
```

- [ ] **Step 3: Verify gateway starts with schema loading**

```bash
docker compose logs gateway --tail 30
```
Expected: "Tool schemas loaded for tool search" with tool count ~253, no errors.

- [ ] **Step 4: Test chat — "Show me the top risks"**

Log in at `http://localhost:9680/login` with `admin@riskready.com` / `password123`, navigate to `/assistant`, send "Show me the top risks".

Expected:
- Response shows actual risk data (not grounding guard fallback)
- Tool call badges appear
- Input tokens logged < 30k (check `docker compose logs gateway`)

- [ ] **Step 5: Compare token usage**

```bash
docker compose logs gateway | grep "Token usage"
```

Expected: `inputTokens` should be significantly lower than 228k (target: < 30k).

- [ ] **Step 6: Test without feature flag**

Remove `USE_TOOL_SEARCH=true`, rebuild, verify old path still works.

- [ ] **Step 7: Commit validation results**

```bash
git commit --allow-empty -m "test: validated tool search in Docker — tokens reduced from 228k to Xk"
```

---

## Chunk 6: Cleanup (After Validation)

### Task 10: Remove Agent SDK Dependency

Only proceed after Task 9 passes validation.

- [ ] **Step 1: Remove old code path from agent-runner.ts**

Remove the `getQueryFn()` method, the `queryFn` field, the Agent SDK import, and the old `for await (const message of queryIterator)` loop. Keep only the `executeWithToolSearch` path. Remove the feature flag check — make it the only path.

- [ ] **Step 2: Remove old code path from council-orchestrator.ts**

Same — remove Agent SDK imports and old query() calls.

- [ ] **Step 3: Remove Agent SDK dependency**

```bash
cd gateway && npm uninstall @anthropic-ai/claude-agent-sdk
```

- [ ] **Step 4: Remove feature flag**

Remove `USE_TOOL_SEARCH` checks from all files.

- [ ] **Step 5: Run all tests**

```bash
cd gateway && npx vitest run
cd apps/server && npx jest --forceExit
```
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(gateway): remove Agent SDK dependency — tool search is now the only path"
```

- [ ] **Step 7: Final Docker validation**

Push, pull in /tmp clone, rebuild, test chat again. Verify everything works without the Agent SDK.
