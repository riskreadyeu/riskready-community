import { NonconformityService } from '../../audits/services/nonconformity.service';
import { ExecutorMap, stripMcpMeta } from './types';

export interface AuditExecutorServices {
  nonconformityService: NonconformityService;
}

export function registerAuditExecutors(executors: ExecutorMap, services: AuditExecutorServices): void {
  const { nonconformityService } = services;

  // --- Nonconformity CRUD ---

  executors.set('CREATE_NONCONFORMITY', (p, userId) =>
    nonconformityService.create({ ...stripMcpMeta(p), raisedById: userId } as any),
  );

  executors.set('UPDATE_NONCONFORMITY', (p) => {
    const { ncId, ...data } = p as { ncId: string; [k: string]: any };
    return nonconformityService.update(ncId, stripMcpMeta(data) as any);
  });

  // --- Nonconformity transitions ---

  executors.set('TRANSITION_NONCONFORMITY', (p) =>
    nonconformityService.update(p['ncId'], { status: p['targetStatus'] } as any),
  );

  // --- CAP workflow ---

  executors.set('SUBMIT_CAP', (p, userId) =>
    nonconformityService.submitCapForApproval(p['ncId'], userId),
  );

  executors.set('APPROVE_CAP', (p, userId) =>
    nonconformityService.approveCap(p['ncId'], userId, p['approvalComments']),
  );

  executors.set('REJECT_CAP', (p, userId) =>
    nonconformityService.rejectCap(p['ncId'], userId, p['rejectionReason']),
  );

  // --- Close ---

  executors.set('CLOSE_NONCONFORMITY', (p, userId) =>
    nonconformityService.close(p['ncId'], userId),
  );
}
