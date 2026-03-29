import { NonconformityService } from '../../audits/services/nonconformity.service';
import { ExecutorMap, prepareCreatePayload, stripMcpMeta } from './types';
import {
  validatePayload,
  CreateNonconformityPayload,
  UpdateNonconformityPayload,
  TransitionNonconformityPayload,
  NCIdPayload,
  ApproveCapPayload,
  RejectCapPayload,
} from './payload-schemas';

export interface AuditExecutorServices {
  nonconformityService: NonconformityService;
}

export function registerAuditExecutors(executors: ExecutorMap, services: AuditExecutorServices): void {
  const { nonconformityService } = services;

  // --- Nonconformity CRUD ---

  executors.set('CREATE_NONCONFORMITY', (p, userId) => {
    const validated = validatePayload(CreateNonconformityPayload, p, 'CREATE_NONCONFORMITY');
    return nonconformityService.create({ ...prepareCreatePayload(validated), raisedById: userId } as any);
  });

  executors.set('UPDATE_NONCONFORMITY', (p) => {
    const { ncId, ...data } = validatePayload(UpdateNonconformityPayload, p, 'UPDATE_NONCONFORMITY');
    return nonconformityService.update(ncId, stripMcpMeta(data) as any);
  });

  // --- Nonconformity transitions ---

  executors.set('TRANSITION_NONCONFORMITY', (p) => {
    const validated = validatePayload(TransitionNonconformityPayload, p, 'TRANSITION_NONCONFORMITY');
    return nonconformityService.update(validated.ncId, { status: validated.targetStatus } as any);
  });

  // --- CAP workflow ---

  executors.set('SUBMIT_CAP', (p, userId) => {
    const validated = validatePayload(NCIdPayload, p, 'SUBMIT_CAP');
    return nonconformityService.submitCapForApproval(validated.ncId, userId);
  });

  executors.set('APPROVE_CAP', (p, userId) => {
    const validated = validatePayload(ApproveCapPayload, p, 'APPROVE_CAP');
    return nonconformityService.approveCap(validated.ncId, userId, validated.approvalComments);
  });

  executors.set('REJECT_CAP', (p, userId) => {
    const validated = validatePayload(RejectCapPayload, p, 'REJECT_CAP');
    return nonconformityService.rejectCap(validated.ncId, userId, validated.rejectionReason as any);
  });

  // --- Close ---

  executors.set('CLOSE_NONCONFORMITY', (p, userId) => {
    const validated = validatePayload(NCIdPayload, p, 'CLOSE_NONCONFORMITY');
    return nonconformityService.close(validated.ncId, userId);
  });
}
