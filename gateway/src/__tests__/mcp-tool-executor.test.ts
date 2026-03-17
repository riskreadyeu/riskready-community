import { describe, it, expect, vi } from 'vitest';

// Mock the MCP SDK modules so tests don't require the package to be installed in gateway
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    callTool: vi.fn().mockResolvedValue({ content: [], isError: false }),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: vi.fn().mockImplementation(() => ({})),
}));

import { McpToolExecutor, TOOL_NAME_PATTERN, ToolResult } from '../agent/mcp-tool-executor.js';

describe('TOOL_NAME_PATTERN', () => {
  it('accepts valid tool names', () => {
    const validNames = [
      'mcp__riskready-risks__list_risks',
      'mcp__riskready-controls__get_control',
      'mcp__riskready-incidents__propose_create_incident',
      'mcp__riskready-agent-ops__list_agent_tasks',
      'mcp__riskready-organisation__get_department',
      'mcp__riskready-audits__propose_close_nc',
    ];
    for (const name of validNames) {
      expect(name, `Expected "${name}" to match pattern`).toMatch(TOOL_NAME_PATTERN);
    }
  });

  it('rejects names without mcp__ prefix', () => {
    expect('riskready-risks__list_risks').not.toMatch(TOOL_NAME_PATTERN);
  });

  it('rejects names with path traversal characters', () => {
    expect('mcp__../etc__passwd').not.toMatch(TOOL_NAME_PATTERN);
    expect('mcp__riskready-risks__../evil').not.toMatch(TOOL_NAME_PATTERN);
  });

  it('rejects names with uppercase letters', () => {
    expect('mcp__RiskyServer__list_risks').not.toMatch(TOOL_NAME_PATTERN);
    expect('mcp__riskready-risks__List_Risks').not.toMatch(TOOL_NAME_PATTERN);
  });

  it('rejects empty segments', () => {
    expect('mcp____list_risks').not.toMatch(TOOL_NAME_PATTERN);
    expect('mcp__riskready-risks__').not.toMatch(TOOL_NAME_PATTERN);
    expect('__riskready-risks__list_risks').not.toMatch(TOOL_NAME_PATTERN);
  });

  it('rejects names with only two segments', () => {
    expect('mcp__riskready-risks').not.toMatch(TOOL_NAME_PATTERN);
  });

  it('rejects names that start with uppercase after mcp__', () => {
    expect('mcp__Riskready-risks__list_risks').not.toMatch(TOOL_NAME_PATTERN);
  });
});

describe('McpToolExecutor.parseToolName', () => {
  it('correctly splits a valid tool name into serverName and toolName', () => {
    const result = McpToolExecutor.parseToolName('mcp__riskready-risks__list_risks');
    expect(result).toEqual({ serverName: 'riskready-risks', toolName: 'list_risks' });
  });

  it('correctly parses tool names with hyphens in server name', () => {
    const result = McpToolExecutor.parseToolName('mcp__riskready-agent-ops__list_agent_tasks');
    expect(result).toEqual({ serverName: 'riskready-agent-ops', toolName: 'list_agent_tasks' });
  });

  it('correctly parses tool names with underscores in tool name', () => {
    const result = McpToolExecutor.parseToolName('mcp__riskready-controls__propose_create_control');
    expect(result).toEqual({ serverName: 'riskready-controls', toolName: 'propose_create_control' });
  });

  it('returns null for a name missing mcp prefix', () => {
    const result = McpToolExecutor.parseToolName('riskready-risks__list_risks');
    expect(result).toBeNull();
  });

  it('returns null for a name with only two parts', () => {
    const result = McpToolExecutor.parseToolName('mcp__riskready-risks');
    expect(result).toBeNull();
  });

  it('returns null for a name with too many parts', () => {
    // split by __ gives 4 parts which is !== 3
    const result = McpToolExecutor.parseToolName('mcp__riskready__risks__list_risks');
    expect(result).toBeNull();
  });
});

describe('McpToolExecutor.execute', () => {
  const makeExecutor = (overrides: Partial<{
    organisationId: string;
    getServerConfig: (name: string) => { command: string; args: string[]; env?: Record<string, string> } | undefined;
    testCallTool: (serverName: string, toolName: string, input: Record<string, unknown>) => Promise<ToolResult>;
  }> = {}) => {
    return new McpToolExecutor({
      organisationId: overrides.organisationId ?? 'org-123',
      getServerConfig: overrides.getServerConfig ?? (() => undefined),
      _testCallTool: overrides.testCallTool,
    });
  };

  it('returns an error result for invalid tool names', async () => {
    const executor = makeExecutor();
    const result = await executor.execute('invalid_tool_name', {});
    expect(result.isError).toBe(true);
    expect(result.content).toContain('Invalid tool name');
  });

  it('returns an error result for tool names with uppercase', async () => {
    const executor = makeExecutor();
    const result = await executor.execute('mcp__RiskyServer__list_risks', {});
    expect(result.isError).toBe(true);
    expect(result.content).toContain('Invalid tool name');
  });

  it('returns an error result when server config is not found', async () => {
    const executor = makeExecutor({
      getServerConfig: () => undefined,
    });
    const result = await executor.execute('mcp__riskready-risks__list_risks', {});
    expect(result.isError).toBe(true);
    expect(result.content).toContain('Server config not found');
  });

  it('force-injects organisationId into the tool input', async () => {
    const capturedInputs: Record<string, unknown>[] = [];
    const executor = makeExecutor({
      organisationId: 'org-injected-456',
      testCallTool: async (_serverName, _toolName, input) => {
        capturedInputs.push({ ...input });
        return { content: 'ok', isError: false };
      },
    });

    await executor.execute('mcp__riskready-risks__list_risks', { someParam: 'value' });

    expect(capturedInputs).toHaveLength(1);
    expect(capturedInputs[0].organisationId).toBe('org-injected-456');
  });

  it('overrides any model-supplied organisationId with the executor organisationId', async () => {
    const capturedInputs: Record<string, unknown>[] = [];
    const executor = makeExecutor({
      organisationId: 'org-real',
      testCallTool: async (_serverName, _toolName, input) => {
        capturedInputs.push({ ...input });
        return { content: 'ok', isError: false };
      },
    });

    await executor.execute('mcp__riskready-risks__list_risks', {
      organisationId: 'org-attacker-injected',
    });

    expect(capturedInputs[0].organisationId).toBe('org-real');
  });

  it('calls _testCallTool with the correct serverName and toolName', async () => {
    const calls: Array<{ serverName: string; toolName: string }> = [];
    const executor = makeExecutor({
      testCallTool: async (serverName, toolName, _input) => {
        calls.push({ serverName, toolName });
        return { content: 'ok', isError: false };
      },
    });

    await executor.execute('mcp__riskready-controls__get_control', { id: 'ctrl-1' });

    expect(calls).toHaveLength(1);
    expect(calls[0].serverName).toBe('riskready-controls');
    expect(calls[0].toolName).toBe('get_control');
  });

  it('returns the result from _testCallTool', async () => {
    const executor = makeExecutor({
      testCallTool: async () => ({ content: 'test result content', isError: false }),
    });

    const result = await executor.execute('mcp__riskready-risks__list_risks', {});
    expect(result.content).toBe('test result content');
    expect(result.isError).toBe(false);
  });

  it('returns error result when _testCallTool returns isError: true', async () => {
    const executor = makeExecutor({
      testCallTool: async () => ({ content: 'something went wrong', isError: true }),
    });

    const result = await executor.execute('mcp__riskready-risks__list_risks', {});
    expect(result.isError).toBe(true);
    expect(result.content).toBe('something went wrong');
  });
});
