import { PolicyDocumentService } from '../../policies/services/policy-document.service';
import { DocumentExceptionService } from '../../policies/services/document-exception.service';
import { ChangeRequestService } from '../../policies/services/change-request.service';
import { ExecutorMap, prepareCreatePayload, stripMcpMeta } from './types';
import {
  validatePayload,
  CreatePolicyPayload,
  UpdatePolicyPayload,
  PolicyDocumentIdPayload,
  CreatePolicyExceptionPayload,
  ApprovePolicyExceptionPayload,
  CreatePolicyChangeRequestPayload,
} from './payload-schemas';

export interface PolicyExecutorServices {
  policyDocumentService: PolicyDocumentService;
  documentExceptionService: DocumentExceptionService;
  changeRequestService: ChangeRequestService;
}

export function registerPolicyExecutors(executors: ExecutorMap, services: PolicyExecutorServices): void {
  const { policyDocumentService, documentExceptionService, changeRequestService } = services;

  // --- Policy CRUD ---

  executors.set('CREATE_POLICY', (p, userId) => {
    const validated = validatePayload(CreatePolicyPayload, p, 'CREATE_POLICY');
    return policyDocumentService.create(
      prepareCreatePayload(validated, { relationalOrg: true }) as any,
      userId,
    );
  });

  executors.set('UPDATE_POLICY', (p, userId) => {
    const { documentId, ...rest } = validatePayload(UpdatePolicyPayload, p, 'UPDATE_POLICY');
    return policyDocumentService.update(documentId, stripMcpMeta(rest) as any, userId);
  });

  // --- Policy lifecycle (all via updateStatus) ---

  executors.set('SUBMIT_POLICY_REVIEW', (p, userId) => {
    const validated = validatePayload(PolicyDocumentIdPayload, p, 'SUBMIT_POLICY_REVIEW');
    return policyDocumentService.updateStatus(validated.documentId, 'PENDING_REVIEW' as any, userId);
  });

  executors.set('APPROVE_POLICY', (p, userId) => {
    const validated = validatePayload(PolicyDocumentIdPayload, p, 'APPROVE_POLICY');
    return policyDocumentService.updateStatus(validated.documentId, 'APPROVED' as any, userId);
  });

  executors.set('PUBLISH_POLICY', (p, userId) => {
    const validated = validatePayload(PolicyDocumentIdPayload, p, 'PUBLISH_POLICY');
    return policyDocumentService.updateStatus(validated.documentId, 'PUBLISHED' as any, userId);
  });

  executors.set('RETIRE_POLICY', (p, userId) => {
    const validated = validatePayload(PolicyDocumentIdPayload, p, 'RETIRE_POLICY');
    return policyDocumentService.updateStatus(validated.documentId, 'RETIRED' as any, userId);
  });

  // --- Exceptions ---

  executors.set('CREATE_POLICY_EXCEPTION', (p, userId) => {
    const validated = validatePayload(CreatePolicyExceptionPayload, p, 'CREATE_POLICY_EXCEPTION');
    return documentExceptionService.create({
      ...prepareCreatePayload(validated),
      requestedById: userId,
      expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : undefined,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
    } as any);
  });

  executors.set('APPROVE_POLICY_EXCEPTION', (p, userId) => {
    const validated = validatePayload(ApprovePolicyExceptionPayload, p, 'APPROVE_POLICY_EXCEPTION');
    return documentExceptionService.approve(validated.exceptionId, {
      approvedById: userId,
      approvalComments: validated.approvalComments,
    });
  });

  // --- Change Requests ---

  executors.set('CREATE_POLICY_CHANGE_REQUEST', (p, userId) => {
    const validated = validatePayload(CreatePolicyChangeRequestPayload, p, 'CREATE_POLICY_CHANGE_REQUEST');
    return changeRequestService.create({
      ...prepareCreatePayload(validated),
      requestedById: userId,
      targetDate: validated.targetDate ? new Date(validated.targetDate) : undefined,
    } as any);
  });
}
