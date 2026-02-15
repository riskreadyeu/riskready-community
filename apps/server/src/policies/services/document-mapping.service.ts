import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ControlMappingType, CoverageLevel, RiskRelationshipType, DocumentRelationType } from '@prisma/client';

@Injectable()
export class DocumentMappingService {
  constructor(private prisma: PrismaService) {}

  // =============================================
  // CONTROL MAPPINGS
  // =============================================

  async getControlMappings(documentId: string) {
    return this.prisma.documentControlMapping.findMany({
      where: { documentId },
      include: {
        control: {
          select: {
            id: true,
            controlId: true,
            name: true,
            theme: true,
            framework: true,
            implementationStatus: true,
          },
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addControlMapping(data: {
    documentId: string;
    controlId: string;
    mappingType?: ControlMappingType;
    coverage?: CoverageLevel;
    notes?: string;
    evidenceRequired?: boolean;
    evidenceDescription?: string;
    createdById?: string;
  }) {
    const { documentId, controlId, mappingType = 'IMPLEMENTS', coverage = 'FULL', notes, evidenceRequired, evidenceDescription, createdById } = data;

    // Check if mapping already exists
    const existing = await this.prisma.documentControlMapping.findUnique({
      where: { documentId_controlId: { documentId, controlId } },
    });

    if (existing) {
      throw new BadRequestException('Control mapping already exists');
    }

    return this.prisma.documentControlMapping.create({
      data: {
        document: { connect: { id: documentId } },
        control: { connect: { id: controlId } },
        mappingType,
        coverage,
        notes,
        evidenceRequired,
        evidenceDescription,
        createdBy: createdById ? { connect: { id: createdById } } : undefined,
      },
      include: {
        control: { select: { id: true, controlId: true, name: true, theme: true } },
      },
    });
  }

  async updateControlMapping(id: string, data: {
    mappingType?: ControlMappingType;
    coverage?: CoverageLevel;
    notes?: string;
    evidenceRequired?: boolean;
    evidenceDescription?: string;
  }) {
    return this.prisma.documentControlMapping.update({
      where: { id },
      data,
      include: {
        control: { select: { id: true, controlId: true, name: true, theme: true } },
      },
    });
  }

  async removeControlMapping(id: string) {
    await this.prisma.documentControlMapping.delete({ where: { id } });
    return { deleted: true };
  }

  async getDocumentsByControl(controlId: string) {
    return this.prisma.documentControlMapping.findMany({
      where: { controlId },
      include: {
        document: {
          select: {
            id: true,
            documentId: true,
            title: true,
            documentType: true,
            status: true,
            version: true,
          },
        },
      },
    });
  }

  // =============================================
  // RISK MAPPINGS
  // =============================================

  async getRiskMappings(documentId: string) {
    return this.prisma.documentRiskMapping.findMany({
      where: { documentId },
      include: {
        risk: {
          select: {
            id: true,
            riskId: true,
            title: true,
            status: true,
            inherentScore: true,
            residualScore: true,
          },
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addRiskMapping(data: {
    documentId: string;
    riskId: string;
    relationshipType?: RiskRelationshipType;
    notes?: string;
    createdById?: string;
  }) {
    const { documentId, riskId, relationshipType = 'MITIGATES', notes, createdById } = data;

    // Check if mapping already exists
    const existing = await this.prisma.documentRiskMapping.findUnique({
      where: { documentId_riskId: { documentId, riskId } },
    });

    if (existing) {
      throw new BadRequestException('Risk mapping already exists');
    }

    return this.prisma.documentRiskMapping.create({
      data: {
        document: { connect: { id: documentId } },
        risk: { connect: { id: riskId } },
        relationshipType,
        notes,
        createdBy: createdById ? { connect: { id: createdById } } : undefined,
      },
      include: {
        risk: { select: { id: true, riskId: true, title: true, status: true } },
      },
    });
  }

  async updateRiskMapping(id: string, data: {
    relationshipType?: RiskRelationshipType;
    notes?: string;
  }) {
    return this.prisma.documentRiskMapping.update({
      where: { id },
      data,
      include: {
        risk: { select: { id: true, riskId: true, title: true, status: true } },
      },
    });
  }

  async removeRiskMapping(id: string) {
    await this.prisma.documentRiskMapping.delete({ where: { id } });
    return { deleted: true };
  }

  async getDocumentsByRisk(riskId: string) {
    return this.prisma.documentRiskMapping.findMany({
      where: { riskId },
      include: {
        document: {
          select: {
            id: true,
            documentId: true,
            title: true,
            documentType: true,
            status: true,
          },
        },
      },
    });
  }

  // =============================================
  // DOCUMENT RELATIONS
  // =============================================

  async getDocumentRelations(documentId: string) {
    const [outgoing, incoming] = await Promise.all([
      this.prisma.documentRelation.findMany({
        where: { sourceDocumentId: documentId },
        include: {
          targetDocument: {
            select: {
              id: true,
              documentId: true,
              title: true,
              documentType: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.documentRelation.findMany({
        where: { targetDocumentId: documentId },
        include: {
          sourceDocument: {
            select: {
              id: true,
              documentId: true,
              title: true,
              documentType: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return { outgoing, incoming };
  }

  async addDocumentRelation(data: {
    sourceDocumentId: string;
    targetDocumentId: string;
    relationType: DocumentRelationType;
    description?: string;
    createdById?: string;
  }) {
    const { sourceDocumentId, targetDocumentId, relationType, description, createdById } = data;

    if (sourceDocumentId === targetDocumentId) {
      throw new BadRequestException('Cannot create relation to self');
    }

    // Check if relation already exists
    const existing = await this.prisma.documentRelation.findUnique({
      where: {
        sourceDocumentId_targetDocumentId_relationType: {
          sourceDocumentId,
          targetDocumentId,
          relationType,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Relation already exists');
    }

    return this.prisma.documentRelation.create({
      data: {
        sourceDocument: { connect: { id: sourceDocumentId } },
        targetDocument: { connect: { id: targetDocumentId } },
        relationType,
        description,
        createdBy: createdById ? { connect: { id: createdById } } : undefined,
      },
      include: {
        sourceDocument: { select: { id: true, documentId: true, title: true } },
        targetDocument: { select: { id: true, documentId: true, title: true } },
      },
    });
  }

  async removeDocumentRelation(id: string) {
    await this.prisma.documentRelation.delete({ where: { id } });
    return { deleted: true };
  }

  // =============================================
  // COVERAGE ANALYSIS
  // =============================================

  async getControlCoverageReport(organisationId: string) {
    const controls = await this.prisma.control.findMany({
      where: { organisationId, applicable: true },
      select: {
        id: true,
        controlId: true,
        name: true,
        theme: true,
        documentMappings: {
          include: {
            document: {
              select: {
                id: true,
                documentId: true,
                title: true,
                documentType: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { controlId: 'asc' },
    });

    const report = controls.map(control => ({
      controlId: control.controlId,
      name: control.name,
      theme: control.theme,
      documentCount: control.documentMappings.length,
      documents: control.documentMappings.map(m => ({
        documentId: m.document.documentId,
        title: m.document.title,
        type: m.document.documentType,
        status: m.document.status,
        mappingType: m.mappingType,
        coverage: m.coverage,
      })),
      hasCoverage: control.documentMappings.length > 0,
      hasFullCoverage: control.documentMappings.some(m => m.coverage === 'FULL'),
    }));

    const summary = {
      totalControls: controls.length,
      covered: report.filter(r => r.hasCoverage).length,
      fullyCovered: report.filter(r => r.hasFullCoverage).length,
      uncovered: report.filter(r => !r.hasCoverage).length,
      coveragePercentage: Math.round((report.filter(r => r.hasCoverage).length / controls.length) * 100),
    };

    return { controls: report, summary };
  }

  async getGapAnalysis(organisationId: string) {
    // Get all applicable controls without full document coverage
    const gaps = await this.prisma.control.findMany({
      where: {
        organisationId,
        applicable: true,
        OR: [
          { documentMappings: { none: {} } },
          { documentMappings: { every: { coverage: { not: 'FULL' } } } },
        ],
      },
      select: {
        id: true,
        controlId: true,
        name: true,
        theme: true,
        documentMappings: {
          select: {
            mappingType: true,
            coverage: true,
            document: {
              select: { documentId: true, title: true, status: true },
            },
          },
        },
      },
      orderBy: { controlId: 'asc' },
    });

    return gaps.map(control => ({
      controlId: control.controlId,
      name: control.name,
      theme: control.theme,
      gapType: control.documentMappings.length === 0 ? 'NO_DOCUMENTATION' : 'PARTIAL_COVERAGE',
      existingDocuments: control.documentMappings,
      recommendation: control.documentMappings.length === 0
        ? 'Create a new policy or procedure to address this control'
        : 'Review and enhance existing documentation to achieve full coverage',
    }));
  }
}
