import { describe, it, expect } from 'vitest';
import { buildToolDefinitions, FullToolSchema, ToolBuildOptions } from '../agent/tool-builder';

const MOCK_SCHEMAS: FullToolSchema[] = [
  {
    name: 'list_risks',
    fullName: 'mcp__riskready-risks__list_risks',
    description: 'List risks',
    inputSchema: { type: 'object', properties: {} },
    serverName: 'riskready-risks',
  },
  {
    name: 'propose_create_risk',
    fullName: 'mcp__riskready-risks__propose_create_risk',
    description: 'Propose creating a risk',
    inputSchema: { type: 'object', properties: {} },
    serverName: 'riskready-risks',
  },
  {
    name: 'get_risk_dashboard',
    fullName: 'mcp__riskready-risks__get_risk_dashboard',
    description: 'Get dashboard',
    inputSchema: { type: 'object', properties: {} },
    serverName: 'riskready-risks',
  },
];

describe('buildToolDefinitions', () => {
  describe('tool_search_tool_bm25', () => {
    it('is always included when code execution is enabled', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: true });
      const searchTool = tools.find((t) => t['name'] === 'tool_search_tool_bm25');
      expect(searchTool).toBeDefined();
      expect(searchTool!['type']).toBe('tool_search_tool_bm25_20251119');
    });

    it('is always included when code execution is disabled', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: false });
      const searchTool = tools.find((t) => t['name'] === 'tool_search_tool_bm25');
      expect(searchTool).toBeDefined();
      expect(searchTool!['type']).toBe('tool_search_tool_bm25_20251119');
    });

    it('is included even with empty schemas', () => {
      const tools = buildToolDefinitions([], { allowCodeExecution: false });
      const searchTool = tools.find((t) => t['name'] === 'tool_search_tool_bm25');
      expect(searchTool).toBeDefined();
    });
  });

  describe('code_execution tool', () => {
    it('is included when allowCodeExecution is true', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: true });
      const codeExec = tools.find((t) => t['name'] === 'code_execution');
      expect(codeExec).toBeDefined();
      expect(codeExec!['type']).toBe('code_execution_20260120');
    });

    it('is NOT included when allowCodeExecution is false', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: false });
      const codeExec = tools.find((t) => t['name'] === 'code_execution');
      expect(codeExec).toBeUndefined();
    });
  });

  describe('MCP tool defer_loading', () => {
    it('all MCP tools have defer_loading: true when code execution is enabled', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: true });
      const mcpTools = tools.filter((t) => !t['type']); // MCP tools don't have a type field
      expect(mcpTools.length).toBe(MOCK_SCHEMAS.length);
      for (const tool of mcpTools) {
        expect(tool['defer_loading']).toBe(true);
      }
    });

    it('all MCP tools have defer_loading: true when code execution is disabled', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: false });
      const mcpTools = tools.filter((t) => !t['type']);
      expect(mcpTools.length).toBe(MOCK_SCHEMAS.length);
      for (const tool of mcpTools) {
        expect(tool['defer_loading']).toBe(true);
      }
    });
  });

  describe('allowed_callers when code execution is enabled', () => {
    it('propose_* tools get allowed_callers: ["direct"]', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: true });
      const proposeTool = tools.find(
        (t) => t['name'] === 'mcp__riskready-risks__propose_create_risk',
      );
      expect(proposeTool).toBeDefined();
      expect(proposeTool!['allowed_callers']).toEqual(['direct']);
    });

    it('list_* tools get allowed_callers: ["code_execution_20260120"]', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: true });
      const listTool = tools.find((t) => t['name'] === 'mcp__riskready-risks__list_risks');
      expect(listTool).toBeDefined();
      expect(listTool!['allowed_callers']).toEqual(['code_execution_20260120']);
    });

    it('get_* tools get allowed_callers: ["code_execution_20260120"]', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: true });
      const getTool = tools.find(
        (t) => t['name'] === 'mcp__riskready-risks__get_risk_dashboard',
      );
      expect(getTool).toBeDefined();
      expect(getTool!['allowed_callers']).toEqual(['code_execution_20260120']);
    });
  });

  describe('allowed_callers when code execution is disabled', () => {
    it('MCP tools have no allowed_callers field', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: false });
      const mcpTools = tools.filter((t) => !t['type']);
      for (const tool of mcpTools) {
        expect(tool['allowed_callers']).toBeUndefined();
      }
    });

    it('propose_* tools have no allowed_callers field', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: false });
      const proposeTool = tools.find(
        (t) => t['name'] === 'mcp__riskready-risks__propose_create_risk',
      );
      expect(proposeTool).toBeDefined();
      expect(proposeTool!['allowed_callers']).toBeUndefined();
    });

    it('list_* tools have no allowed_callers field', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: false });
      const listTool = tools.find((t) => t['name'] === 'mcp__riskready-risks__list_risks');
      expect(listTool).toBeDefined();
      expect(listTool!['allowed_callers']).toBeUndefined();
    });
  });

  describe('MCP tool structure', () => {
    it('each MCP tool includes name, description, and input_schema', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: false });
      const mcpTools = tools.filter((t) => !t['type']);
      for (const tool of mcpTools) {
        expect(tool['name']).toBeDefined();
        expect(tool['description']).toBeDefined();
        expect(tool['input_schema']).toBeDefined();
      }
    });

    it('uses fullName as the tool name', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: false });
      const listTool = tools.find((t) => t['name'] === 'mcp__riskready-risks__list_risks');
      expect(listTool).toBeDefined();
    });
  });

  describe('total tool count', () => {
    it('with code execution enabled: 1 search + 1 code_execution + N MCP tools', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: true });
      expect(tools.length).toBe(1 + 1 + MOCK_SCHEMAS.length);
    });

    it('with code execution disabled: 1 search + N MCP tools', () => {
      const tools = buildToolDefinitions(MOCK_SCHEMAS, { allowCodeExecution: false });
      expect(tools.length).toBe(1 + MOCK_SCHEMAS.length);
    });
  });
});
