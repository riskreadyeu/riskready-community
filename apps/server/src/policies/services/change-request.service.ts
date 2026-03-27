import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, ChangeRequestStatus, ChangePriority, ChangeType } from '@prisma/client';
import { PolicyAuditService } from './policy-audit.service';

@Injectable()
export class ChangeRequestService {
  constructor(
    private prisma: PrismaService,
    private auditService: PolicyAuditService,
  ) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    organisationId?: string;
    documentId?: string;
    status?: ChangeRequestStatus;
  }) {
    const { skip, take, organisationId, documentId, status } = params || {};

    const where: Prisma.DocumentChangeRequestWhereInput = {
      ...(organisationId && { organisationId }),
      ...(documentId && { documentId }),
      ...(status && { status }),
    };

    const [results, count] = await Promise.all([
      this.prisma.documentChangeRequest.findMany({
        skip,
        take,
        where,
        orderBy: { requestedAt: 'desc' },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          implementedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.documentChangeRequest.count({ where }),
    ]);

    return { results, count };
  }

  async findOne(id: string) {
    const changeRequest = await this.prisma.documentChangeRequest.findUnique({
      where: { id },
      include: {
        document: {
          select: {
            id: true,
            documentId: true,
            title: true,
            documentType: true,
            version: true,
            status: true,
          },
        },
        requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        implementedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!changeRequest) {
      throw new NotFoundException(`Change request with ID ${id} not found`);
    }

    return changeRequest;
  }

  async create(data: {
    documentId: string;
    organisationId: string;
    title: string;
    description: string;
    justification: string;
    changeType: ChangeType;
    priority: ChangePriority;
    impactAssessment?: string;
    affectedDocuments?: string[];
    affectedProcesses?: string[];
    affectedSystems?: string[];
    targetDate?: Date;
    requestedById: string;
  }) {
    const { documentId, organisationId, requestedById, ...rest } = data;

    // Generate change request ID
    const count = await this.prisma.documentChangeRequest.count({
      where: { organisationId },
    });
    const year = new Date().getFullYear();
    const changeRequestId = `CR-${year}-${String(count + 1).padStart(3, '0')}`;

    const changeRequest = await this.prisma.documentChangeRequest.create({
      data: {
        changeRequestId,
        document: { connect: { id: documentId } },
        organisation: { connect: { id: organisationId } },
        requestedBy: { connect: { id: requestedById } },
        status: 'SUBMITTED',
        ...rest,
      },
      include: {
        document: { select: { id: true, documentId: true, title: true } },
        requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    await this.auditService.log({
      documentId,
      action: 'UPDATED',
      description: `Change request ${changeRequestId} submitted: ${data.title}`,
      performedById: requestedById,
      newValue: { changeRequestId, changeType: data.changeType, priority: data.priority },
    });

    return changeRequest;
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    justification?: string;
    changeType?: ChangeType;
    priority?: ChangePriority;
    impactAssessment?: string;
    affectedDocuments?: string[];
    affectedProcesses?: string[];
    affectedSystems?: string[];
    targetDate?: Date;
  }) {
    return this.prisma.documentChangeRequest.update({
      where: { id },
      data,
      include: {
        document: { select: { id: true, documentId: true, title: true } },
        requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async approve(id: string, data: { approvedById: string; approvalComments?: string }) {
    const changeRequest = await this.findOne(id);

    if (changeRequest.status !== 'SUBMITTED' && changeRequest.status !== 'UNDER_REVIEW') {
      throw new NotFoundException('Change request cannot be approved in current status');
    }

    const updated = await this.prisma.documentChangeRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: { connect: { id: data.approvedById } },
        approvalDate: new Date(),
        approvalComments: data.approvalComments,
      },
    });

    await this.auditService.log({
      documentId: changeRequest.documentId,
      action: 'APPROVED',
      description: `Change request ${changeRequest.changeRequestId} approved`,
      performedById: data.approvedById,
    });

    return updated;
  }

  async reject(id: string, data: { approvedById: string; approvalComments: string }) {
    const changeRequest = await this.findOne(id);

    if (changeRequest.status !== 'SUBMITTED' && changeRequest.status !== 'UNDER_REVIEW') {
      throw new NotFoundException('Change request cannot be rejected in current status');
    }

    const updated = await this.prisma.documentChangeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: { connect: { id: data.approvedById } },
        approvalDate: new Date(),
        approvalComments: data.approvalComments,
      },
    });

    await this.auditService.log({
      documentId: changeRequest.documentId,
      action: 'REJECTED',
      description: `Change request ${changeRequest.changeRequestId} rejected`,
      performedById: data.approvedById,
    });

    return updated;
  }

  async startImplementation(id: string, implementedById: string) {
    const changeRequest = await this.findOne(id);

    if (changeRequest.status !== 'APPROVED') {
      throw new NotFoundException('Change request must be approved before implementation');
    }

    const updated = await this.prisma.documentChangeRequest.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        implementedBy: { connect: { id: implementedById } },
      },
    });

    // Update document status to under revision
    await this.prisma.policyDocument.update({
      where: { id: changeRequest.documentId },
      data: { status: 'UNDER_REVISION' },
    });

    return updated;
  }

  async completeImplementation(id: string, data: { newVersionId?: string }) {
    const changeRequest = await this.findOne(id);

    if (changeRequest.status !== 'IN_PROGRESS') {
      throw new NotFoundException('Change request must be in progress to complete');
    }

    const updated = await this.prisma.documentChangeRequest.update({
      where: { id },
      data: {
        status: 'IMPLEMENTED',
        implementedAt: new Date(),
        actualCompletionDate: new Date(),
        newVersionId: data.newVersionId,
      },
    });

    if (changeRequest.implementedBy) {
      await this.auditService.log({
        documentId: changeRequest.documentId,
        action: 'UPDATED',
        description: `Change request ${changeRequest.changeRequestId} implemented`,
        performedById: changeRequest.implementedBy.id,
      });
    }

    return updated;
  }

  async verify(id: string, userId: string) {
    const changeRequest = await this.findOne(id);

    if (changeRequest.status !== 'IMPLEMENTED') {
      throw new NotFoundException('Change request must be implemented before verification');
    }

    return this.prisma.documentChangeRequest.update({
      where: { id },
      data: { status: 'VERIFIED' },
    });
  }

  async getStats(organisationId: string) {
    const [total, byStatus, byPriority] = await Promise.all([
      this.prisma.documentChangeRequest.count({ where: { organisationId } }),
      this.prisma.documentChangeRequest.groupBy({
        by: ['status'],
        where: { organisationId },
        _count: true,
      }),
      this.prisma.documentChangeRequest.groupBy({
        by: ['priority'],
        where: { organisationId, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS'] } },
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {} as Record<string, number>),
      pending: byStatus.filter(s => ['SUBMITTED', 'UNDER_REVIEW'].includes(s.status)).reduce((sum, s) => sum + s._count, 0),
      inProgress: byStatus.find(s => s.status === 'IN_PROGRESS')?._count || 0,
    };
  }
}
