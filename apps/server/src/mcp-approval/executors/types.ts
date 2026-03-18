import { McpActionType } from '@prisma/client';

// Payload is dynamically typed from MCP action requests - use `any` to allow property access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExecutorPayload = Record<string, any>;
export type Executor = (payload: ExecutorPayload, reviewedById: string) => Promise<unknown>;
export type ExecutorMap = Map<McpActionType, Executor>;

/** Strip MCP metadata fields (e.g. organisationId injected by McpToolExecutor) before passing to Prisma */
const MCP_META_KEYS = ['organisationId', 'reason'];

export function stripMcpMeta<T extends Record<string, unknown>>(payload: T): Omit<T, 'organisationId' | 'reason'> {
  const cleaned = { ...payload };
  for (const key of MCP_META_KEYS) {
    delete (cleaned as Record<string, unknown>)[key];
  }
  return cleaned as Omit<T, 'organisationId' | 'reason'>;
}
