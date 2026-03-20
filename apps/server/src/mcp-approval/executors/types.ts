import { McpActionType } from '@prisma/client';

// Payload is dynamically typed from MCP action requests - use `any` to allow property access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExecutorPayload = Record<string, any>;
export type Executor = (payload: ExecutorPayload, reviewedById: string, organisationId?: string) => Promise<unknown>;
export type ExecutorMap = Map<McpActionType, Executor>;

/** Strip ALL MCP metadata fields before passing to Prisma update/lifecycle calls */
const MCP_META_KEYS = ['organisationId', 'reason', 'mcpSessionId', 'mcpToolName'];

export function stripMcpMeta<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
  const cleaned = { ...payload };
  for (const key of MCP_META_KEYS) {
    delete (cleaned as Record<string, unknown>)[key];
  }
  return cleaned;
}

/** MCP-only fields that should never be passed to any Prisma create/update call */
const MCP_ONLY_KEYS = ['reason', 'mcpSessionId', 'mcpToolName'];

/**
 * Prepare an MCP payload for a service create() call.
 *
 * - Always strips MCP-only fields (reason, mcpSessionId, mcpToolName).
 * - When `relationalOrg` is true, converts flat `organisationId` to
 *   `organisation: { connect: { id } }` and strips `createdBy`/`createdById`
 *   (these are typically passed as a separate `userId` parameter).
 * - When `relationalFields` is provided, converts additional flat foreign keys
 *   to their `{ connect: { id } }` Prisma relational equivalents.
 */
export function prepareCreatePayload(
  payload: Record<string, unknown>,
  options?: {
    relationalOrg?: boolean;
    relationalFields?: Record<string, string>;
  },
): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cleaned = { ...payload };
  for (const key of MCP_ONLY_KEYS) {
    delete cleaned[key];
  }

  if (options?.relationalOrg && cleaned['organisationId']) {
    const orgId = cleaned['organisationId'];
    delete cleaned['organisationId'];
    delete cleaned['createdBy'];
    delete cleaned['createdById'];
    (cleaned as Record<string, unknown>)['organisation'] = { connect: { id: orgId } };
  }

  if (options?.relationalFields) {
    for (const [flatKey, relationName] of Object.entries(options.relationalFields)) {
      if (cleaned[flatKey] !== undefined && cleaned[flatKey] !== null) {
        const id = cleaned[flatKey];
        delete cleaned[flatKey];
        (cleaned as Record<string, unknown>)[relationName] = { connect: { id } };
      }
    }
  }

  return cleaned;
}
