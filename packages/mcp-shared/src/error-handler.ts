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
      const raw = error instanceof Error ? error.message : String(error);
      // Sanitize: remove connection strings, stack traces, Prisma internals
      const safeMessage = raw
        .replace(/postgresql:\/\/[^\s]+/gi, '[DB_CONNECTION]')
        .replace(/at\s+\S+\s+\(\S+:\d+:\d+\)/g, '') // stack frames
        .replace(/prisma\.\w+\.\w+/gi, '[DB_QUERY]')
        .slice(0, 200);
      return {
        content: [{ type: 'text', text: `Error in ${toolName}: ${safeMessage}` }],
        isError: true,
      };
    }
  };
}
