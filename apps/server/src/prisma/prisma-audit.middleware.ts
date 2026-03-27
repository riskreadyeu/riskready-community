import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RequestContext } from '../shared/context/request-context';
import { isExcludedModel, maskSensitiveData } from '../shared/constants/audit-config';

const logger = new Logger('AuditMiddleware');

const AUDITED_ACTIONS = new Set(['create', 'update', 'delete', 'upsert']);

/** Compute which fields changed between old and new data. */
export function computeChangedFields(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
): string[] {
  if (!oldData || !newData) return [];
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  for (const key of allKeys) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changed.push(key);
    }
  }
  return changed;
}

/** Extract the record ID from a Prisma result. */
function extractRecordId(result: Record<string, unknown>): string {
  if (!result) return 'unknown';
  return String(result['id'] ?? result['Id'] ?? 'unknown');
}

/** Map Prisma action to AuditAction enum value. */
function toAuditAction(action: string): 'CREATE' | 'UPDATE' | 'DELETE' {
  if (action === 'create') return 'CREATE';
  if (action === 'delete') return 'DELETE';
  return 'UPDATE'; // update, upsert
}

/**
 * Creates a Prisma middleware function that logs all CUD operations to the AuditLog table.
 *
 * Uses AsyncLocalStorage (via RequestContext) to capture who performed the action.
 * Sensitive fields are masked. Excluded models (history tables, audit tables) are skipped.
 *
 * Audit writes are best-effort: if the audit insert fails, the main operation still succeeds.
 */
export function createAuditMiddleware(prisma: { auditLog: { create: (args: Prisma.AuditLogCreateArgs) => Promise<unknown> } }): Prisma.Middleware {
  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
    // Skip non-CUD operations and excluded models
    if (!AUDITED_ACTIONS.has(params.action) || !params.model || isExcludedModel(params.model)) {
      return next(params);
    }

    // Execute the original operation
    const result = await next(params);

    // Write audit log (best-effort, don't block main operation)
    try {
      const ctx = RequestContext.current();
      const action = toAuditAction(params.action);
      const resultRecord = result as Record<string, unknown>;
      const recordId = extractRecordId(resultRecord);

      const auditData: Prisma.AuditLogUncheckedCreateInput = {
        action,
        model: params.model!,
        recordId: String(recordId),
        source: ctx ? 'api' : 'system',
      };

      // Context from AsyncLocalStorage
      if (ctx) {
        auditData['userId'] = ctx.userId;
        auditData['userEmail'] = ctx.userEmail;
        auditData['organisationId'] = ctx.organisationId;
        auditData['ipAddress'] = ctx.ipAddress;
        auditData['userAgent'] = ctx.userAgent;
        auditData['requestId'] = ctx.requestId;
      }

      // Capture data based on action type
      if (action === 'CREATE') {
        auditData.newData = maskSensitiveData(resultRecord) as Prisma.InputJsonValue ?? Prisma.JsonNull;
      } else if (action === 'UPDATE') {
        auditData.newData = maskSensitiveData(resultRecord) as Prisma.InputJsonValue ?? Prisma.JsonNull;
        auditData.changedFields = params.args?.data
          ? Object.keys(params.args.data as Record<string, unknown>)
          : [];
      } else if (action === 'DELETE') {
        auditData.oldData = maskSensitiveData(resultRecord) as Prisma.InputJsonValue ?? Prisma.JsonNull;
      }

      await prisma.auditLog.create({ data: auditData });
    } catch (error) {
      // Log but don't throw — audit failures must not break the application
      logger.error(`Failed to write audit log for ${params.model}.${params.action}`, error instanceof Error ? error.stack : String(error));
    }

    return result;
  };
}
