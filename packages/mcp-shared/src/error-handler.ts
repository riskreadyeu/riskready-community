import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Wraps an MCP tool handler with try/catch error handling.
 * Returns a structured MCP error response instead of throwing.
 */
export function withErrorHandling<TArgs extends unknown[]>(
  toolName: string,
  handler: (...args: TArgs) => Promise<CallToolResult>
): (...args: TArgs) => Promise<CallToolResult> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error in ${toolName}: ${message}` }],
        isError: true,
      };
    }
  };
}
