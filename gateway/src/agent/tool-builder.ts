export interface ToolBuildOptions {
  allowCodeExecution: boolean;
  /** Skip tool_search_tool and defer_loading for models that don't support it (e.g. Opus 4) */
  disableToolSearch?: boolean;
}

export interface FullToolSchema {
  name: string;
  fullName: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverName: string;
}

function isMutation(toolName: string): boolean {
  return toolName.includes('propose_');
}

export function buildToolDefinitions(
  schemas: FullToolSchema[],
  options: ToolBuildOptions,
): Record<string, unknown>[] {
  const tools: Record<string, unknown>[] = [];
  const useToolSearch = !options.disableToolSearch;

  if (useToolSearch) {
    // Tool search: Claude discovers tools on demand (85%+ token reduction)
    tools.push({
      type: 'tool_search_tool_bm25_20251119',
      name: 'tool_search_tool_bm25',
    });
  }

  // Conditional: code execution
  if (options.allowCodeExecution) {
    tools.push({
      type: 'code_execution_20260120',
      name: 'code_execution',
    });
  }

  // MCP tools
  for (const schema of schemas) {
    const tool: Record<string, unknown> = {
      name: schema.fullName,
      description: schema.description,
      input_schema: schema.inputSchema,
    };

    // Only defer loading when tool search is enabled
    if (useToolSearch) {
      tool.defer_loading = true;
    }

    if (options.allowCodeExecution) {
      tool.allowed_callers = isMutation(schema.name)
        ? ['direct']
        : ['code_execution_20260120'];
    }

    tools.push(tool);
  }

  return tools;
}
