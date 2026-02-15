import { Prisma } from '@prisma/client';
import { RequestContext } from '../shared/context/request-context';
import { isExcludedModel, maskSensitiveData } from '../shared/constants/audit-config';

const AUDITED_ACTIONS = new Set(['create', 'update', 'delete', 'upsert']);

/** Compute which fields changed between old and new data. */
export function computeChangedFields(
  oldData: Record<string, any> | null,
  newData: Record<string, any> | null,
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
function extractRecordId(result: any): string {
  if (!result) return 'unknown';
  return result.id ?? result.Id ?? 'unknown';
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
export function createAuditMiddleware(prisma: any): Prisma.Middleware {
  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
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
      const recordId = extractRecordId(result);

      const auditData: any = {
        action,
        model: params.model,
        recordId: String(recordId),
        source: ctx ? 'api' : 'system',
      };

      // Context from AsyncLocalStorage
      if (ctx) {
        auditData.userId = ctx.userId;
        auditData.userEmail = ctx.userEmail;
        auditData.organisationId = ctx.organisationId;
        auditData.ipAddress = ctx.ipAddress;
        auditData.userAgent = ctx.userAgent;
        auditData.requestId = ctx.requestId;
      }

      // Capture data based on action type
      if (action === 'CREATE') {
        auditData.newData = maskSensitiveData(result);
      } else if (action === 'UPDATE') {
        auditData.newData = maskSensitiveData(result);
        auditData.changedFields = params.args?.data
          ? Object.keys(params.args.data)
          : [];
      } else if (action === 'DELETE') {
        auditData.oldData = maskSensitiveData(result);
      }

      await prisma.auditLog.create({ data: auditData });
    } catch (error) {
      // Log but don't throw — audit failures must not break the application
      console.error(`[AuditMiddleware] Failed to write audit log for ${params.model}.${params.action}:`, error);
    }

    return result;
  };
}
