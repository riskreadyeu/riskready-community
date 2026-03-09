import { PolicyDocumentService } from '../../policies/services/policy-document.service';
import { DocumentExceptionService } from '../../policies/services/document-exception.service';
import { ChangeRequestService } from '../../policies/services/change-request.service';
import { ExecutorMap } from './types';

export interface PolicyExecutorServices {
  policyDocumentService: PolicyDocumentService;
  documentExceptionService: DocumentExceptionService;
  changeRequestService: ChangeRequestService;
}

export function registerPolicyExecutors(executors: ExecutorMap, services: PolicyExecutorServices): void {
  const { policyDocumentService, documentExceptionService, changeRequestService } = services;

  // --- Policy CRUD ---

  executors.set('CREATE_POLICY', (p, userId) =>
    policyDocumentService.create(p as any, userId),
  );

  executors.set('UPDATE_POLICY', (p, userId) => {
    const { policyId, ...data } = p as { policyId: string; [k: string]: any };
    return policyDocumentService.update(policyId, data as any, userId);
  });

  // --- Policy lifecycle (all via updateStatus) ---

  executors.set('SUBMIT_POLICY_REVIEW', (p, userId) =>
    policyDocumentService.updateStatus(p['policyId'], 'PENDING_REVIEW' as any, userId),
  );

  executors.set('APPROVE_POLICY', (p, userId) =>
    policyDocumentService.updateStatus(p['policyId'], 'APPROVED' as any, userId),
  );

  executors.set('PUBLISH_POLICY', (p, userId) =>
    policyDocumentService.updateStatus(p['policyId'], 'PUBLISHED' as any, userId),
  );

  executors.set('RETIRE_POLICY', (p, userId) =>
    policyDocumentService.updateStatus(p['policyId'], 'RETIRED' as any, userId),
  );

  // --- Exceptions ---

  executors.set('CREATE_POLICY_EXCEPTION', (p, userId) =>
    documentExceptionService.create({
      ...p,
      requestedById: userId,
      expiryDate: p['expiryDate'] ? new Date(p['expiryDate']) : undefined,
      startDate: p['startDate'] ? new Date(p['startDate']) : undefined,
    } as any),
  );

  executors.set('APPROVE_POLICY_EXCEPTION', (p, userId) =>
    documentExceptionService.approve(p['exceptionId'], {
      approvedById: userId,
      approvalComments: p['approvalComments'],
    }),
  );

  // --- Change Requests ---

  executors.set('CREATE_POLICY_CHANGE_REQUEST', (p, userId) =>
    changeRequestService.create({
      ...p,
      requestedById: userId,
      targetDate: p['targetDate'] ? new Date(p['targetDate']) : undefined,
    } as any),
  );
}
