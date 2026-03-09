import { McpActionType } from '@prisma/client';

// Payload is dynamically typed from MCP action requests - use `any` to allow property access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExecutorPayload = Record<string, any>;
export type Executor = (payload: ExecutorPayload, reviewedById: string) => Promise<unknown>;
export type ExecutorMap = Map<McpActionType, Executor>;
