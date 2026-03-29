import { EvidenceService } from '../../evidence/services/evidence.service';
import { EvidenceLinkService } from '../../evidence/services/evidence-link.service';
import { EvidenceRequestService } from '../../evidence/services/evidence-request.service';
import { ExecutorMap, prepareCreatePayload, stripMcpMeta } from './types';
import {
  validatePayload,
  CreateEvidencePayload,
  UpdateEvidencePayload,
  LinkEvidencePayload,
  CreateEvidenceRequestPayload,
  FulfillEvidenceRequestPayload,
  CloseEvidenceRequestPayload,
} from './payload-schemas';

export interface EvidenceExecutorServices {
  evidenceService: EvidenceService;
  evidenceLinkService: EvidenceLinkService;
  evidenceRequestService: EvidenceRequestService;
}

export function registerEvidenceExecutors(executors: ExecutorMap, services: EvidenceExecutorServices): void {
  const { evidenceService, evidenceLinkService, evidenceRequestService } = services;

  // --- Evidence CRUD ---

  executors.set('CREATE_EVIDENCE', (p, userId) => {
    const validated = validatePayload(CreateEvidencePayload, p, 'CREATE_EVIDENCE');
    return evidenceService.create({ ...prepareCreatePayload(validated), createdById: userId } as any);
  });

  executors.set('UPDATE_EVIDENCE', (p, userId) => {
    const { evidenceId, ...data } = validatePayload(UpdateEvidencePayload, p, 'UPDATE_EVIDENCE');
    return evidenceService.update(evidenceId, { ...stripMcpMeta(data), updatedById: userId } as any);
  });

  // --- Evidence Links ---

  executors.set('LINK_EVIDENCE', (p, userId) => {
    const validated = validatePayload(LinkEvidencePayload, p, 'LINK_EVIDENCE');
    return evidenceLinkService.linkEvidence(
      validated.evidenceId,
      validated.targetType as any, // Prisma enum
      validated.targetId,
      validated.linkType as any,
      validated.notes,
      userId,
    );
  });

  // --- Evidence Requests ---

  executors.set('CREATE_EVIDENCE_REQUEST', (p, userId) => {
    const validated = validatePayload(CreateEvidenceRequestPayload, p, 'CREATE_EVIDENCE_REQUEST');
    return evidenceRequestService.create({
      ...prepareCreatePayload(validated),
      requestedById: userId,
      createdById: userId,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
    } as any);
  });

  executors.set('FULFILL_EVIDENCE_REQUEST', (p, userId) => {
    const validated = validatePayload(FulfillEvidenceRequestPayload, p, 'FULFILL_EVIDENCE_REQUEST');
    return evidenceRequestService.submitEvidence(
      validated.requestId,
      validated.evidenceId,
      userId,
      validated.notes,
    );
  });

  executors.set('CLOSE_EVIDENCE_REQUEST', (p) => {
    const validated = validatePayload(CloseEvidenceRequestPayload, p, 'CLOSE_EVIDENCE_REQUEST');
    const action = validated.action || 'accept';
    if (action === 'reject') {
      return evidenceRequestService.rejectSubmission(validated.requestId, validated.reason || '');
    }
    if (action === 'cancel') {
      return evidenceRequestService.cancel(validated.requestId);
    }
    return evidenceRequestService.acceptSubmission(validated.requestId);
  });
}
