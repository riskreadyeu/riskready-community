export interface ToolBuildOptions {
  allowCodeExecution: boolean;
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

  // Always: tool search
  tools.push({
    type: 'tool_search_tool_bm25_20251119',
    name: 'tool_search_tool_bm25',
  });

  // Conditional: code execution
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
