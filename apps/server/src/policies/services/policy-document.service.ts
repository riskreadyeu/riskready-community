import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, DocumentStatus, DocumentType, PolicyAuditAction } from '@prisma/client';
import { PolicyAuditService } from './policy-audit.service';

@Injectable()
export class PolicyDocumentService {
  constructor(
    private prisma: PrismaService,
    private auditService: PolicyAuditService,
  ) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.PolicyDocumentWhereInput;
    orderBy?: Prisma.PolicyDocumentOrderByWithRelationInput;
    organisationId?: string;
  }) {
    const { skip, take, where, orderBy, organisationId } = params || {};
    
    const whereClause: Prisma.PolicyDocumentWhereInput = {
      ...where,
      ...(organisationId && { organisationId }),
    };

    const [results, count] = await Promise.all([
      this.prisma.policyDocument.findMany({
        skip,
        take,
        where: whereClause,
        orderBy: orderBy || { documentId: 'asc' },
        include: {
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
          authorUser: { select: { id: true, email: true, firstName: true, lastName: true } },
          approver: { select: { id: true, email: true, firstName: true, lastName: true } },
          parentDocument: { select: { id: true, documentId: true, title: true } },
          _count: {
            select: {
              childDocuments: true,
              versionHistory: true,
              reviewHistory: true,
              acknowledgments: true,
              controlMappings: true,
              riskMappings: true,
              exceptions: true,
              changeRequests: true,
            },
          },
        },
      }),
      this.prisma.policyDocument.count({ where: whereClause }),
    ]);

    return { results, count };
  }

  async findOne(id: string) {
    const document = await this.prisma.policyDocument.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        authorUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        approver: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        parentDocument: { select: { id: true, documentId: true, title: true } },
        childDocuments: {
          select: { id: true, documentId: true, title: true, documentType: true, status: true },
          orderBy: { documentId: 'asc' },
        },
        versionHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        reviewHistory: {
          orderBy: { reviewDate: 'desc' },
          take: 5,
          include: {
            reviewedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        approvalWorkflows: {
          orderBy: { initiatedAt: 'desc' },
          take: 1,
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' },
              include: {
                approver: { select: { id: true, email: true, firstName: true, lastName: true } },
              },
            },
          },
        },
        controlMappings: {
          include: {
            control: { select: { id: true, controlId: true, name: true, theme: true } },
          },
        },
        riskMappings: {
          include: {
            risk: { select: { id: true, riskId: true, title: true, status: true } },
          },
        },
        relatedDocuments: {
          include: {
            targetDocument: { select: { id: true, documentId: true, title: true, documentType: true } },
          },
        },
        referencedBy: {
          include: {
            sourceDocument: { select: { id: true, documentId: true, title: true, documentType: true } },
          },
        },
        attachments: {
          include: {
            uploadedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        organisation: { select: { id: true, name: true } },
        _count: {
          select: {
            acknowledgments: true,
            exceptions: true,
            changeRequests: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async findByDocumentId(documentId: string, organisationId: string) {
    return this.prisma.policyDocument.findUnique({
      where: {
        documentId_organisationId: { documentId, organisationId },
      },
      include: {
        childDocuments: {
          select: { id: true, documentId: true, title: true, documentType: true },
        },
      },
    });
  }

  async create(data: Prisma.PolicyDocumentCreateInput, userId?: string) {
    const document = await this.prisma.policyDocument.create({
      data: {
        ...data,
        createdBy: userId ? { connect: { id: userId } } : undefined,
      },
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        organisation: { select: { id: true, name: true } },
      },
    });

    // Log audit event
    if (userId) {
      await this.auditService.log({
        documentId: document.id,
        action: 'CREATED',
        description: `Document "${document.title}" (${document.documentId}) created`,
        performedById: userId,
      });
    }

    return document;
  }

  async update(id: string, data: Prisma.PolicyDocumentUpdateInput, userId?: string) {
    const existing = await this.findOne(id);
    
    const document = await this.prisma.policyDocument.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId ? { connect: { id: userId } } : undefined,
      },
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        organisation: { select: { id: true, name: true } },
      },
    });

    // Log audit event
    if (userId) {
      await this.auditService.log({
        documentId: document.id,
        action: 'UPDATED',
        description: `Document "${document.title}" (${document.documentId}) updated`,
        performedById: userId,
        previousValue: { title: existing.title, status: existing.status },
        newValue: { title: document.title, status: document.status },
      });
    }

    return document;
  }

  async updateStatus(id: string, status: DocumentStatus, userId?: string) {
    const existing = await this.findOne(id);
    
    const document = await this.prisma.policyDocument.update({
      where: { id },
      data: {
        status,
        ...(status === 'PUBLISHED' && { effectiveDate: new Date() }),
        ...(status === 'RETIRED' && { retirementDate: new Date() }),
        updatedBy: userId ? { connect: { id: userId } } : undefined,
      },
    });

    // Log audit event based on status change
    if (userId) {
      const actionMap: Record<DocumentStatus, string> = {
        DRAFT: 'UPDATED',
        PENDING_REVIEW: 'SUBMITTED_FOR_REVIEW',
        PENDING_APPROVAL: 'SUBMITTED_FOR_APPROVAL',
        APPROVED: 'APPROVED',
        PUBLISHED: 'PUBLISHED',
        UNDER_REVISION: 'UPDATED',
        SUPERSEDED: 'SUPERSEDED',
        RETIRED: 'RETIRED',
        ARCHIVED: 'ARCHIVED',
      };

      await this.auditService.log({
        documentId: document.id,
        action: actionMap[status] as PolicyAuditAction,
        description: `Document status changed from ${existing.status} to ${status}`,
        performedById: userId,
        previousValue: { status: existing.status },
        newValue: { status },
      });
    }

    return document;
  }

  async delete(id: string, userId?: string, softDelete: boolean = true) {
    const document = await this.findOne(id);

    if (softDelete) {
      // Soft delete by archiving
      return this.updateStatus(id, 'ARCHIVED', userId);
    }

    // Hard delete
    await this.prisma.policyDocument.delete({ where: { id } });

    if (userId) {
      // Note: audit log entry won't be linked to document after deletion
      // In production, consider logging to a separate system
    }

    return { deleted: true, documentId: document.documentId };
  }

  async getHierarchy(organisationId: string) {
    const documents = await this.prisma.policyDocument.findMany({
      where: { organisationId },
      select: {
        id: true,
        documentId: true,
        title: true,
        documentType: true,
        status: true,
        parentDocumentId: true,
        version: true,
        nextReviewDate: true,
      },
      orderBy: { documentId: 'asc' },
    });

    // Build hierarchy tree
    interface DocumentTreeNode extends Record<string, unknown> { children: DocumentTreeNode[] }
    const buildTree = (parentId: string | null): DocumentTreeNode[] => {
      return documents
        .filter(doc => doc.parentDocumentId === parentId)
        .map(doc => ({
          ...doc,
          children: buildTree(doc.id),
        }));
    };

    return buildTree(null);
  }

  async getStats(organisationId: string) {
    const [
      total,
      byType,
      byStatus,
      reviewsDue,
      reviewsOverdue,
      pendingAcknowledgments,
      activeExceptions,
    ] = await Promise.all([
      this.prisma.policyDocument.count({ where: { organisationId } }),
      this.prisma.policyDocument.groupBy({
        by: ['documentType'],
        where: { organisationId },
        _count: true,
      }),
      this.prisma.policyDocument.groupBy({
        by: ['status'],
        where: { organisationId },
        _count: true,
      }),
      this.prisma.policyDocument.count({
        where: {
          organisationId,
          status: 'PUBLISHED',
          nextReviewDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            gte: new Date(),
          },
        },
      }),
      this.prisma.policyDocument.count({
        where: {
          organisationId,
          status: 'PUBLISHED',
          nextReviewDate: { lt: new Date() },
        },
      }),
      this.prisma.documentAcknowledgment.count({
        where: {
          document: { organisationId },
          isAcknowledged: false,
        },
      }),
      this.prisma.documentException.count({
        where: {
          organisationId,
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.documentType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      reviewsDue,
      reviewsOverdue,
      pendingAcknowledgments,
      activeExceptions,
    };
  }

  async search(params: {
    organisationId: string;
    query?: string;
    documentType?: DocumentType;
    status?: DocumentStatus;
    tags?: string[];
    controlId?: string;
    riskId?: string;
    skip?: number;
    take?: number;
  }) {
    const { organisationId, query, documentType, status, tags, controlId, riskId, skip, take } = params;

    const where: Prisma.PolicyDocumentWhereInput = {
      organisationId,
      ...(documentType && { documentType }),
      ...(status && { status }),
      ...(tags?.length && { tags: { hasSome: tags } }),
      ...(controlId && { controlMappings: { some: { controlId } } }),
      ...(riskId && { riskMappings: { some: { riskId } } }),
      ...(query && {
        OR: [
          { documentId: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { keywords: { hasSome: [query] } },
        ],
      }),
    };

    const [results, count] = await Promise.all([
      this.prisma.policyDocument.findMany({
        where,
        skip,
        take,
        orderBy: { documentId: 'asc' },
        select: {
          id: true,
          documentId: true,
          title: true,
          documentType: true,
          status: true,
          version: true,
          nextReviewDate: true,
          owner: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.policyDocument.count({ where }),
    ]);

    return { results, count };
  }

  async getUpcomingReviews(organisationId: string, days: number = 30) {
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.prisma.policyDocument.findMany({
      where: {
        organisationId,
        status: 'PUBLISHED',
        nextReviewDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      select: {
        id: true,
        documentId: true,
        title: true,
        documentType: true,
        nextReviewDate: true,
        reviewFrequency: true,
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { nextReviewDate: 'asc' },
    });
  }

  async getOverdueReviews(organisationId: string) {
    return this.prisma.policyDocument.findMany({
      where: {
        organisationId,
        status: 'PUBLISHED',
        nextReviewDate: { lt: new Date() },
      },
      select: {
        id: true,
        documentId: true,
        title: true,
        documentType: true,
        nextReviewDate: true,
        lastReviewDate: true,
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { nextReviewDate: 'asc' },
    });
  }

  async generateDocumentId(type: DocumentType, organisationId: string, parentDocumentId?: string) {
    const prefixMap: Record<DocumentType, string> = {
      POLICY: 'POL',
      STANDARD: 'STD',
      PROCEDURE: 'PRO',
      WORK_INSTRUCTION: 'WI',
      FORM: 'FRM',
      TEMPLATE: 'TPL',
      CHECKLIST: 'CHK',
      GUIDELINE: 'GDL',
      RECORD: 'REC',
    };

    const prefix = prefixMap[type];

    if (parentDocumentId) {
      // Get parent document ID for hierarchical naming
      const parent = await this.prisma.policyDocument.findUnique({
        where: { id: parentDocumentId },
        select: { documentId: true },
      });

      if (parent) {
        // Count existing children
        const childCount = await this.prisma.policyDocument.count({
          where: { organisationId, parentDocumentId },
        });

        // Extract numeric part from parent and append child number
        const parentNum = parent.documentId.replace(/[^0-9-]/g, '');
        return `${prefix}-${parentNum}-${String(childCount + 1).padStart(2, '0')}`;
      }
    }

    // Count existing documents of this type
    const count = await this.prisma.policyDocument.count({
      where: { organisationId, documentType: type },
    });

    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }
}
