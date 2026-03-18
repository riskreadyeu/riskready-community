import { EvidenceService } from '../../evidence/services/evidence.service';
import { EvidenceLinkService } from '../../evidence/services/evidence-link.service';
import { EvidenceRequestService } from '../../evidence/services/evidence-request.service';
import { ExecutorMap, stripMcpMeta } from './types';

export interface EvidenceExecutorServices {
  evidenceService: EvidenceService;
  evidenceLinkService: EvidenceLinkService;
  evidenceRequestService: EvidenceRequestService;
}

export function registerEvidenceExecutors(executors: ExecutorMap, services: EvidenceExecutorServices): void {
  const { evidenceService, evidenceLinkService, evidenceRequestService } = services;

  // --- Evidence CRUD ---

  executors.set('CREATE_EVIDENCE', (p, userId) =>
    evidenceService.create({ ...stripMcpMeta(p), createdById: userId } as any),
  );

  executors.set('UPDATE_EVIDENCE', (p, userId) => {
    const { evidenceId, ...data } = p as { evidenceId: string; [k: string]: any };
    return evidenceService.update(evidenceId, { ...stripMcpMeta(data), updatedById: userId } as any);
  });

  // --- Evidence Links ---

  executors.set('LINK_EVIDENCE', (p, userId) =>
    evidenceLinkService.linkEvidence(
      p['evidenceId'],
      p['targetType'],
      p['targetId'],
      p['linkType'],
      p['notes'],
      userId,
    ),
  );

  // --- Evidence Requests ---

  executors.set('CREATE_EVIDENCE_REQUEST', (p, userId) =>
    evidenceRequestService.create({
      ...p,
      requestedById: userId,
      createdById: userId,
      dueDate: p['dueDate'] ? new Date(p['dueDate']) : undefined,
    } as any),
  );

  executors.set('FULFILL_EVIDENCE_REQUEST', (p, userId) =>
    evidenceRequestService.submitEvidence(p['requestId'], p['evidenceId'], userId, p['notes']),
  );

  executors.set('CLOSE_EVIDENCE_REQUEST', (p) =>
    evidenceRequestService.acceptSubmission(p['requestId']),
  );
}
