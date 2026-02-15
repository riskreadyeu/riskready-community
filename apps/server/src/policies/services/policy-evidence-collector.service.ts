import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EvidenceService } from '../../evidence/services/evidence.service';
import { EvidenceLinkService } from '../../evidence/services/evidence-link.service';
import { EvidenceType } from '@prisma/client';

/**
 * PolicyEvidenceCollectorService
 *
 * Automatically collects evidence from the Policy Module and links it to
 * Control 5.1 (Policies for information security) layers and tests.
 *
 * Layer Mapping:
 * - GOVERNANCE: Policy Development and Approval → Approval workflow records
 * - PLATFORM: Policy Communication and Acknowledgment → Acknowledgment records
 * - CONSUMPTION: Topic-Specific Policy Framework → Policy documents inventory
 * - OVERSIGHT: Policy Review and Maintenance → Review and change request records
 */

interface CollectedEvidence {
  title: string;
  description: string;
  sourceType: 'APPROVAL' | 'ACKNOWLEDGMENT' | 'REVIEW' | 'CHANGE_REQUEST' | 'DOCUMENT';
  sourceId: string;
  layerId: string;
  policyId?: string;
  metadata: Record<string, any>;
}

@Injectable()
export class PolicyEvidenceCollectorService {
  private readonly logger = new Logger(PolicyEvidenceCollectorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evidenceService: EvidenceService,
    private readonly evidenceLinkService: EvidenceLinkService,
  ) {}

  /**
   * Collect all evidence from the policy module for Control 5.1
   */
  async collectAllEvidence(organisationId: string): Promise<{
    collected: number;
    linked: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let collected = 0;
    let linked = 0;

    // Find Control 5.1
    const control = await this.prisma.control.findFirst({
      where: {
        OR: [
          { controlId: '5.1' },
          { name: { contains: 'Policies for information security' } },
        ],
      },
    });

    if (!control) {
      errors.push('Control 5.1 not found');
      return { collected, linked, errors };
    }

    // Layers not available in Community Edition — use control ID as fallback
    const layerMap: Record<string, string> = {
      governance: control.id,
      platform: control.id,
      oversight: control.id,
    };

    // Collect evidence from each source
    try {
      const approvalEvidence = await this.collectApprovalEvidence(organisationId, layerMap['governance']!);
      collected += approvalEvidence.length;
      linked += await this.createAndLinkEvidence(approvalEvidence);
    } catch (e: unknown) {
      errors.push(`Approval evidence error: ${e instanceof Error ? e.message : String(e)}`);
    }

    try {
      const ackEvidence = await this.collectAcknowledgmentEvidence(organisationId, layerMap['platform']!);
      collected += ackEvidence.length;
      linked += await this.createAndLinkEvidence(ackEvidence);
    } catch (e: unknown) {
      errors.push(`Acknowledgment evidence error: ${e instanceof Error ? e.message : String(e)}`);
    }

    try {
      const reviewEvidence = await this.collectReviewEvidence(organisationId, layerMap['oversight']!);
      collected += reviewEvidence.length;
      linked += await this.createAndLinkEvidence(reviewEvidence);
    } catch (e: unknown) {
      errors.push(`Review evidence error: ${e instanceof Error ? e.message : String(e)}`);
    }

    try {
      const changeEvidence = await this.collectChangeRequestEvidence(organisationId, layerMap['oversight']!);
      collected += changeEvidence.length;
      linked += await this.createAndLinkEvidence(changeEvidence);
    } catch (e: unknown) {
      errors.push(`Change request evidence error: ${e instanceof Error ? e.message : String(e)}`);
    }

    try {
      const docEvidence = await this.collectDocumentEvidence(organisationId, layerMap['consumption']!);
      collected += docEvidence.length;
      linked += await this.createAndLinkEvidence(docEvidence);
    } catch (e: unknown) {
      errors.push(`Document evidence error: ${e instanceof Error ? e.message : String(e)}`);
    }

    this.logger.log(`Evidence collection complete: ${collected} collected, ${linked} linked`);
    return { collected, linked, errors };
  }

  /**
   * Map layers to their functional purpose
   */
  private mapLayers(layers: any[]): Record<string, string> {
    const map: Record<string, string> = {};

    for (const layer of layers) {
      const layerType = layer.layer;

      if (layerType === 'GOVERNANCE') {
        map['governance'] = layer.id;
      } else if (layerType === 'PLATFORM') {
        map['platform'] = layer.id;
      } else if (layerType === 'CONSUMPTION') {
        map['consumption'] = layer.id;
      } else if (layerType === 'OVERSIGHT') {
        map['oversight'] = layer.id;
      }
    }

    return map;
  }

  /**
   * Map source type to appropriate EvidenceType enum value
   */
  private mapSourceTypeToEvidenceType(sourceType: string): EvidenceType {
    switch (sourceType) {
      case 'APPROVAL':
        return EvidenceType.APPROVAL_RECORD;
      case 'REVIEW':
        return EvidenceType.REPORT;
      case 'CHANGE_REQUEST':
        return EvidenceType.APPROVAL_RECORD;
      case 'DOCUMENT':
        return EvidenceType.DOCUMENT;
      case 'ACKNOWLEDGMENT':
        return EvidenceType.APPROVAL_RECORD;
      default:
        return EvidenceType.DOCUMENT;
    }
  }

  /**
   * Collect evidence from approval workflows
   */
  private async collectApprovalEvidence(
    organisationId: string,
    layerId: string,
  ): Promise<CollectedEvidence[]> {
    if (!layerId) return [];

    const approvals = await this.prisma.documentApprovalWorkflow.findMany({
      where: {
        document: { organisationId },
        status: 'APPROVED',
      },
      include: {
        document: { select: { id: true, documentId: true, title: true } },
        initiatedBy: { select: { firstName: true, lastName: true } },
        steps: {
          where: { status: 'APPROVED' },
          include: {
            approver: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 100, // Limit to recent approvals
    });

    return approvals.map((approval) => ({
      title: `Approval: ${approval.document.title}`,
      description: `Document "${approval.document.documentId}" approved through ${approval.workflowType} workflow on ${approval.completedAt?.toISOString().split('T')[0]}. Approved by: ${approval.steps.map(s => `${s.approver?.firstName} ${s.approver?.lastName}`).join(', ')}`,
      sourceType: 'APPROVAL' as const,
      sourceId: approval.id,
      layerId,
      policyId: approval.document.id,
      metadata: {
        workflowType: approval.workflowType,
        completedAt: approval.completedAt,
        stepsCount: approval.steps.length,
        documentId: approval.document.documentId,
      },
    }));
  }

  /**
   * Collect evidence from acknowledgments
   */
  private async collectAcknowledgmentEvidence(
    organisationId: string,
    layerId: string,
  ): Promise<CollectedEvidence[]> {
    if (!layerId) return [];

    // Get acknowledgment statistics by document
    const documents = await this.prisma.policyDocument.findMany({
      where: {
        organisationId,
        status: 'PUBLISHED',
      },
      include: {
        acknowledgments: {
          where: { isAcknowledged: true },
        },
        _count: {
          select: { acknowledgments: true },
        },
      },
    });

    const evidence: CollectedEvidence[] = [];

    for (const doc of documents) {
      const acknowledged = doc.acknowledgments.length;
      const total = doc._count.acknowledgments;

      if (acknowledged > 0) {
        evidence.push({
          title: `Acknowledgments: ${doc.title}`,
          description: `Document "${doc.documentId}" has been acknowledged by ${acknowledged} out of ${total} required users (${total > 0 ? Math.round(acknowledged / total * 100) : 0}% compliance).`,
          sourceType: 'ACKNOWLEDGMENT' as const,
          sourceId: doc.id,
          layerId,
          policyId: doc.id,
          metadata: {
            acknowledged,
            total,
            complianceRate: total > 0 ? (acknowledged / total * 100).toFixed(1) : '0',
            documentId: doc.documentId,
          },
        });
      }
    }

    return evidence;
  }

  /**
   * Collect evidence from document reviews
   */
  private async collectReviewEvidence(
    organisationId: string,
    layerId: string,
  ): Promise<CollectedEvidence[]> {
    if (!layerId) return [];

    const reviews = await this.prisma.documentReview.findMany({
      where: {
        document: { organisationId },
      },
      include: {
        document: { select: { id: true, documentId: true, title: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { reviewDate: 'desc' },
      take: 100,
    });

    return reviews.map((review) => ({
      title: `Review: ${review.document.title}`,
      description: `Document "${review.document.documentId}" reviewed on ${review.reviewDate.toISOString().split('T')[0]} by ${review.reviewedBy?.firstName} ${review.reviewedBy?.lastName}. Outcome: ${review.outcome}. ${review.findings || ''}`,
      sourceType: 'REVIEW' as const,
      sourceId: review.id,
      layerId,
      policyId: review.document.id,
      metadata: {
        reviewType: review.reviewType,
        outcome: review.outcome,
        reviewDate: review.reviewDate,
        nextReviewDate: review.nextReviewDate,
        documentId: review.document.documentId,
      },
    }));
  }

  /**
   * Collect evidence from change requests
   */
  private async collectChangeRequestEvidence(
    organisationId: string,
    layerId: string,
  ): Promise<CollectedEvidence[]> {
    if (!layerId) return [];

    const changeRequests = await this.prisma.documentChangeRequest.findMany({
      where: {
        organisationId,
        status: { in: ['IMPLEMENTED', 'VERIFIED'] },
      },
      include: {
        document: { select: { id: true, documentId: true, title: true } },
        requestedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { implementedAt: 'desc' },
      take: 100,
    });

    return changeRequests.map((cr) => ({
      title: `Change Request: ${cr.changeRequestId}`,
      description: `Change request "${cr.changeRequestId}" for document "${cr.document.documentId}" - ${cr.title}. Type: ${cr.changeType}, Priority: ${cr.priority}. ${cr.status === 'VERIFIED' ? 'Verified and complete.' : 'Implemented.'}`,
      sourceType: 'CHANGE_REQUEST' as const,
      sourceId: cr.id,
      layerId,
      policyId: cr.document.id,
      metadata: {
        changeRequestId: cr.changeRequestId,
        changeType: cr.changeType,
        priority: cr.priority,
        status: cr.status,
        documentId: cr.document.documentId,
      },
    }));
  }

  /**
   * Collect evidence from document inventory (for framework layer)
   */
  private async collectDocumentEvidence(
    organisationId: string,
    layerId: string,
  ): Promise<CollectedEvidence[]> {
    if (!layerId) return [];

    // Get document counts by type
    const typeCounts = await this.prisma.policyDocument.groupBy({
      by: ['documentType'],
      where: {
        organisationId,
        status: 'PUBLISHED',
      },
      _count: true,
    });

    const total = typeCounts.reduce((sum, t) => sum + t._count, 0);

    if (total === 0) return [];

    const breakdown = typeCounts
      .map((t) => `${t.documentType}: ${t._count}`)
      .join(', ');

    return [{
      title: 'Policy Document Inventory',
      description: `Organisation maintains ${total} published policy documents. Breakdown by type: ${breakdown}. This demonstrates a comprehensive topic-specific policy framework.`,
      sourceType: 'DOCUMENT' as const,
      sourceId: organisationId,
      layerId,
      metadata: {
        totalDocuments: total,
        byType: typeCounts.reduce((acc, t) => {
          acc[t.documentType] = t._count;
          return acc;
        }, {} as Record<string, number>),
        collectedAt: new Date().toISOString(),
      },
    }];
  }

  /**
   * Create evidence records using the evidence service and link to capabilities
   */
  private async createAndLinkEvidence(evidenceList: CollectedEvidence[]): Promise<number> {
    let linked = 0;

    for (const ev of evidenceList) {
      try {
        // Check if evidence already exists (by source reference to avoid duplicates)
        const existing = await this.prisma.evidence.findFirst({
          where: {
            sourceReference: ev.sourceId,
            sourceSystem: 'Policy Module',
          },
        });

        if (existing) {
          this.logger.debug(`Evidence for source ${ev.sourceId} already exists, skipping`);
          continue;
        }

        // Create the evidence record directly via Prisma for system-generated evidence
        // Map source type to appropriate EvidenceType enum value
        const evidenceType = this.mapSourceTypeToEvidenceType(ev.sourceType);

        // Generate evidence reference
        const year = new Date().getFullYear();
        const lastEvidence = await this.prisma.evidence.findFirst({
          where: {
            evidenceRef: { startsWith: `EVD-${year}-` },
          },
          orderBy: { evidenceRef: 'desc' },
        });

        let nextNumber = 1;
        if (lastEvidence) {
          const match = lastEvidence.evidenceRef.match(/EVD-\d{4}-(\d+)/);
          if (match?.[1]) {
            nextNumber = parseInt(match[1], 10) + 1;
          }
        }

        const evidenceRef = `EVD-${year}-${nextNumber.toString().padStart(4, '0')}`;

        const evidence = await this.prisma.evidence.create({
          data: {
            evidenceRef,
            title: ev.title,
            description: ev.description,
            evidenceType,
            status: 'APPROVED', // Auto-collected evidence is pre-approved
            classification: 'INTERNAL',
            category: 'Policy Management',
            subcategory: ev.sourceType,
            tags: [ev.sourceType, 'AUTO_COLLECTED', 'CONTROL_5.1'],
            sourceSystem: 'Policy Module',
            sourceReference: ev.sourceId,
            collectedAt: new Date(),
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Valid for 1 year
            approvedAt: new Date(), // Auto-approved
            notes: `Auto-collected from Policy Module on ${new Date().toISOString().split('T')[0]}`,
          },
        });

        // Link to layer using the evidence link service
        if (ev.layerId) {
          await this.evidenceLinkService.linkEvidence(
            evidence.id,
            'layer',
            ev.layerId,
            'operating', // Link type indicating operational evidence
            `Auto-collected from ${ev.sourceType} on ${new Date().toISOString().split('T')[0]}`,
          );
        }

        // Link to policy document if applicable
        if (ev.policyId) {
          await this.evidenceLinkService.linkEvidence(
            evidence.id,
            'policy',
            ev.policyId,
            'supporting',
          );
        }

        linked++;
      } catch (error: unknown) {
        this.logger.error(`Failed to create evidence for ${ev.title}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return linked;
  }

  /**
   * Get summary of collected evidence for Control 5.1
   */
  async getEvidenceSummary(organisationId: string): Promise<{
    byLayer: Record<string, number>;
    byType: Record<string, number>;
    total: number;
    lastCollected: Date | null;
  }> {
    // Find Control 5.1
    const control = await this.prisma.control.findFirst({
      where: {
        OR: [
          { controlId: '5.1' },
          { name: { contains: 'Policies for information security' } },
        ],
      },
    });

    if (!control) {
      return { byLayer: {}, byType: {}, total: 0, lastCollected: null };
    }

    // Get evidence linked to this control
    const evidenceLinks = await this.prisma.evidenceControl.findMany({
      where: { controlId: control.id },
      include: {
        evidence: true,
      },
    });

    // Layers not available in Community Edition
    const byLayer: Record<string, number> = {
      GOVERNANCE: 0,
      PLATFORM: 0,
      CONSUMPTION: 0,
      OVERSIGHT: 0,
    };
    const byType: Record<string, number> = {};
    let total = evidenceLinks.length;
    let lastCollected: Date | null = null;

    // Count evidence by type
    for (const link of evidenceLinks) {
      const type = link.evidence.category || 'Unknown';
      byType[type] = (byType[type] || 0) + 1;

      if (!lastCollected || (link.evidence.collectedAt && link.evidence.collectedAt > lastCollected)) {
        lastCollected = link.evidence.collectedAt;
      }
    }

    return { byLayer, byType, total, lastCollected };
  }
}
