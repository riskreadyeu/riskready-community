import { PolicyDocumentService } from '../../policies/services/policy-document.service';
import { DocumentExceptionService } from '../../policies/services/document-exception.service';
import { ChangeRequestService } from '../../policies/services/change-request.service';
import { ExecutorMap, stripMcpMeta } from './types';

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
    const { documentId, ...rest } = p as { documentId: string; [k: string]: any };
    return policyDocumentService.update(documentId, stripMcpMeta(rest) as any, userId);
  });

  // --- Policy lifecycle (all via updateStatus) ---

  executors.set('SUBMIT_POLICY_REVIEW', (p, userId) =>
    policyDocumentService.updateStatus(p['documentId'], 'PENDING_REVIEW' as any, userId),
  );

  executors.set('APPROVE_POLICY', (p, userId) =>
    policyDocumentService.updateStatus(p['documentId'], 'APPROVED' as any, userId),
  );

  executors.set('PUBLISH_POLICY', (p, userId) =>
    policyDocumentService.updateStatus(p['documentId'], 'PUBLISHED' as any, userId),
  );

  executors.set('RETIRE_POLICY', (p, userId) =>
    policyDocumentService.updateStatus(p['documentId'], 'RETIRED' as any, userId),
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
