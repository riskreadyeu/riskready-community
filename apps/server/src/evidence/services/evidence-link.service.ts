import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type LinkEntityType =
  | 'control'
  | 'layer'
  | 'nonconformity'
  | 'incident'
  | 'risk'
  | 'treatment'
  | 'policy'
  | 'vendor'
  | 'assessment'
  | 'contract'
  | 'asset'
  | 'change'
  | 'application'
  | 'isra';

@Injectable()
export class EvidenceLinkService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // LINK EVIDENCE TO ENTITY
  // ============================================

  async linkEvidence(
    evidenceId: string,
    entityType: LinkEntityType,
    entityId: string,
    linkType?: string,
    notes?: string,
    createdById?: string,
  ) {
    // Verify evidence exists
    const evidence = await this.prisma.evidence.findUnique({ where: { id: evidenceId } });
    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${evidenceId} not found`);
    }

    // Create link based on entity type
    switch (entityType) {
      case 'control':
        return this.prisma.evidenceControl.create({
          data: { evidenceId, controlId: entityId, linkType, notes, createdById },
          include: {
            evidence: { select: { id: true, evidenceRef: true, title: true } },
            control: { select: { id: true, controlId: true, name: true } },
          },
        });

      case 'layer':
        // Layer evidence linking not supported - link to control instead
        throw new BadRequestException('Layer linking not supported. Link evidence to the control instead.');

      case 'nonconformity':
        return this.prisma.evidenceNonconformity.create({
          data: { evidenceId, nonconformityId: entityId, linkType, notes, createdById },
          include: {
            evidence: { select: { id: true, evidenceRef: true, title: true } },
            nonconformity: { select: { id: true, ncId: true, title: true } },
          },
        });

      case 'incident':
        return this.prisma.evidenceIncident.create({
          data: { evidenceId, incidentId: entityId, linkType, notes, createdById },
          include: {
            evidence: { select: { id: true, evidenceRef: true, title: true } },
            incident: { select: { id: true, referenceNumber: true, title: true } },
          },
        });

      case 'risk':
        return this.prisma.evidenceRisk.create({
          data: { evidenceId, riskId: entityId, linkType, notes, createdById },
          include: {
            evidence: { select: { id: true, evidenceRef: true, title: true } },
            risk: { select: { id: true, riskId: true, title: true } },
          },
        });

      case 'treatment':
        return this.prisma.evidenceTreatment.create({
          data: { evidenceId, treatmentId: entityId, linkType, notes, createdById },
          include: {
            evidence: { select: { id: true, evidenceRef: true, title: true } },
            treatment: { select: { id: true, treatmentId: true, title: true } },
          },
        });

      case 'policy':
        return this.prisma.evidencePolicy.create({
          data: { evidenceId, policyId: entityId, linkType, notes, createdById },
          include: {
            evidence: { select: { id: true, evidenceRef: true, title: true } },
            policy: { select: { id: true, documentId: true, title: true } },
          },
        });

      // TODO: Add when EvidenceVendor model is created
      case 'vendor':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      // TODO: Add when EvidenceAssessment model is created
      case 'assessment':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      // TODO: Add when EvidenceContract model is created
      case 'contract':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      case 'asset':
        return this.prisma.evidenceAsset.create({
          data: { evidenceId, assetId: entityId, linkType, notes, createdById },
          include: {
            evidence: { select: { id: true, evidenceRef: true, title: true } },
            asset: { select: { id: true, assetTag: true, name: true } },
          },
        });

      case 'change':
        return this.prisma.evidenceChange.create({
          data: { evidenceId, changeId: entityId, linkType, notes, createdById },
          include: {
            evidence: { select: { id: true, evidenceRef: true, title: true } },
            change: { select: { id: true, changeRef: true, title: true } },
          },
        });

      // TODO: Add when EvidenceApplication model is created
      case 'application':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      // TODO: Add when EvidenceISRA model is created
      case 'isra':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      default:
        throw new BadRequestException(`Unknown entity type: ${entityType}`);
    }
  }

  // ============================================
  // UNLINK EVIDENCE FROM ENTITY
  // ============================================

  async unlinkEvidence(evidenceId: string, entityType: LinkEntityType, entityId: string) {
    switch (entityType) {
      case 'control':
        return this.prisma.evidenceControl.deleteMany({
          where: { evidenceId, controlId: entityId },
        });

      case 'layer':
        throw new BadRequestException('Layer unlinking not supported.');

      case 'nonconformity':
        return this.prisma.evidenceNonconformity.deleteMany({
          where: { evidenceId, nonconformityId: entityId },
        });

      case 'incident':
        return this.prisma.evidenceIncident.deleteMany({
          where: { evidenceId, incidentId: entityId },
        });

      case 'risk':
        return this.prisma.evidenceRisk.deleteMany({
          where: { evidenceId, riskId: entityId },
        });

      case 'treatment':
        return this.prisma.evidenceTreatment.deleteMany({
          where: { evidenceId, treatmentId: entityId },
        });

      case 'policy':
        return this.prisma.evidencePolicy.deleteMany({
          where: { evidenceId, policyId: entityId },
        });

      // TODO: Add when EvidenceVendor model is created
      case 'vendor':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      // TODO: Add when EvidenceAssessment model is created
      case 'assessment':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      // TODO: Add when EvidenceContract model is created
      case 'contract':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      case 'asset':
        return this.prisma.evidenceAsset.deleteMany({
          where: { evidenceId, assetId: entityId },
        });

      case 'change':
        return this.prisma.evidenceChange.deleteMany({
          where: { evidenceId, changeId: entityId },
        });

      // TODO: Add when EvidenceApplication model is created
      case 'application':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      // TODO: Add when EvidenceISRA model is created
      case 'isra':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      default:
        throw new BadRequestException(`Unknown entity type: ${entityType}`);
    }
  }

  // ============================================
  // GET EVIDENCE FOR ENTITY
  // ============================================

  async getEvidenceForEntity(entityType: LinkEntityType, entityId: string) {
    switch (entityType) {
      case 'control':
        return this.prisma.evidenceControl.findMany({
          where: { controlId: entityId },
          include: {
            evidence: {
              include: {
                collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
              },
            },
          },
        });

      case 'layer':
        // Layer evidence not supported - return empty array
        return [];

      case 'nonconformity':
        return this.prisma.evidenceNonconformity.findMany({
          where: { nonconformityId: entityId },
          include: {
            evidence: {
              include: {
                collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
              },
            },
          },
        });

      case 'incident':
        return this.prisma.evidenceIncident.findMany({
          where: { incidentId: entityId },
          include: {
            evidence: {
              include: {
                collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
              },
            },
          },
        });

      case 'risk':
        return this.prisma.evidenceRisk.findMany({
          where: { riskId: entityId },
          include: {
            evidence: {
              include: {
                collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
              },
            },
          },
        });

      case 'treatment':
        return this.prisma.evidenceTreatment.findMany({
          where: { treatmentId: entityId },
          include: {
            evidence: {
              include: {
                collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
              },
            },
          },
        });

      case 'policy':
        return this.prisma.evidencePolicy.findMany({
          where: { policyId: entityId },
          include: {
            evidence: {
              include: {
                collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
              },
            },
          },
        });

      // TODO: Add when EvidenceVendor model is created
      case 'vendor':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      // TODO: Add when EvidenceAssessment model is created
      case 'assessment':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      // TODO: Add when EvidenceContract model is created
      case 'contract':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      case 'asset':
        return this.prisma.evidenceAsset.findMany({
          where: { assetId: entityId },
          include: {
            evidence: {
              include: {
                collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
              },
            },
          },
        });

      case 'change':
        return this.prisma.evidenceChange.findMany({
          where: { changeId: entityId },
          include: {
            evidence: {
              include: {
                collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
              },
            },
          },
        });

      // TODO: Add when EvidenceApplication model is created
      case 'application':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      // TODO: Add when EvidenceISRA model is created
      case 'isra':
        throw new BadRequestException(`Entity type '${entityType}' is not yet supported`);

      default:
        throw new BadRequestException(`Unknown entity type: ${entityType}`);
    }
  }

  // ============================================
  // BULK LINK
  // ============================================

  async bulkLinkEvidence(
    evidenceIds: string[],
    entityType: LinkEntityType,
    entityId: string,
    linkType?: string,
    createdById?: string,
  ) {
    const results = await Promise.all(
      evidenceIds.map((evidenceId) =>
        this.linkEvidence(evidenceId, entityType, entityId, linkType, undefined, createdById),
      ),
    );
    return results;
  }
}

