import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, ExceptionStatus, ApprovalLevel, ReviewFrequency } from '@prisma/client';
import { PolicyAuditService } from './policy-audit.service';

@Injectable()
export class DocumentExceptionService {
  constructor(
    private prisma: PrismaService,
    private auditService: PolicyAuditService,
  ) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    organisationId?: string;
    documentId?: string;
    status?: ExceptionStatus;
  }) {
    const { skip, take, organisationId, documentId, status } = params || {};

    const where: Prisma.DocumentExceptionWhereInput = {
      ...(organisationId && { organisationId }),
      ...(documentId && { documentId }),
      ...(status && { status }),
    };

    const [results, count] = await Promise.all([
      this.prisma.documentException.findMany({
        skip,
        take,
        where,
        orderBy: { requestedAt: 'desc' },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.documentException.count({ where }),
    ]);

    return { results, count };
  }

  async findOne(id: string) {
    const exception = await this.prisma.documentException.findUnique({
      where: { id },
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
        requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!exception) {
      throw new NotFoundException(`Exception with ID ${id} not found`);
    }

    return exception;
  }

  async create(data: {
    documentId: string;
    organisationId: string;
    title: string;
    description: string;
    justification: string;
    scope: string;
    affectedEntities?: string[];
    riskAssessment: string;
    residualRisk: string;
    compensatingControls?: string;
    startDate?: Date;
    expiryDate: Date;
    approvalLevel: ApprovalLevel;
    reviewFrequency?: ReviewFrequency;
    requestedById: string;
  }) {
    const { documentId, organisationId, requestedById, reviewFrequency = 'QUARTERLY', ...rest } = data;

    // Generate exception ID
    const count = await this.prisma.documentException.count({
      where: { organisationId },
    });
    const year = new Date().getFullYear();
    const exceptionId = `EXC-${year}-${String(count + 1).padStart(3, '0')}`;

    // Calculate next review date
    const nextReviewDate = this.calculateNextReviewDate(reviewFrequency);

    const exception = await this.prisma.documentException.create({
      data: {
        exceptionId,
        document: { connect: { id: documentId } },
        organisation: { connect: { id: organisationId } },
        requestedBy: { connect: { id: requestedById } },
        status: 'REQUESTED',
        reviewFrequency,
        nextReviewDate,
        ...rest,
      },
      include: {
        document: { select: { id: true, documentId: true, title: true } },
        requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    await this.auditService.log({
      documentId,
      action: 'EXCEPTION_REQUESTED',
      description: `Exception ${exceptionId} requested: ${data.title}`,
      performedById: requestedById,
      newValue: { exceptionId, residualRisk: data.residualRisk, expiryDate: data.expiryDate },
    });

    return exception;
  }

  async approve(id: string, data: { approvedById: string; approvalComments?: string }) {
    const exception = await this.findOne(id);

    if (exception.status !== 'REQUESTED' && exception.status !== 'UNDER_REVIEW') {
      throw new NotFoundException('Exception cannot be approved in current status');
    }

    const updated = await this.prisma.documentException.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: { connect: { id: data.approvedById } },
        approvalDate: new Date(),
        approvalComments: data.approvalComments,
      },
    });

    await this.auditService.log({
      documentId: exception.documentId,
      action: 'EXCEPTION_APPROVED',
      description: `Exception ${exception.exceptionId} approved`,
      performedById: data.approvedById,
    });

    return updated;
  }

  async activate(id: string, userId: string) {
    const exception = await this.findOne(id);

    if (exception.status !== 'APPROVED') {
      throw new NotFoundException('Exception must be approved before activation');
    }

    return this.prisma.documentException.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startDate: new Date(),
      },
    });
  }

  async revoke(id: string, data: { reason: string; userId: string }) {
    const exception = await this.findOne(id);

    if (!['APPROVED', 'ACTIVE'].includes(exception.status)) {
      throw new NotFoundException('Exception cannot be revoked in current status');
    }

    const updated = await this.prisma.documentException.update({
      where: { id },
      data: {
        status: 'REVOKED',
        closedAt: new Date(),
        closureReason: data.reason,
      },
    });

    await this.auditService.log({
      documentId: exception.documentId,
      action: 'UPDATED',
      description: `Exception ${exception.exceptionId} revoked: ${data.reason}`,
      performedById: data.userId,
    });

    return updated;
  }

  async close(id: string, data: { reason: string; userId: string }) {
    const exception = await this.findOne(id);

    const updated = await this.prisma.documentException.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closureReason: data.reason,
      },
    });

    await this.auditService.log({
      documentId: exception.documentId,
      action: 'UPDATED',
      description: `Exception ${exception.exceptionId} closed: ${data.reason}`,
      performedById: data.userId,
    });

    return updated;
  }

  async getExpiring(organisationId: string, days: number = 30) {
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.prisma.documentException.findMany({
      where: {
        organisationId,
        status: 'ACTIVE',
        expiryDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        document: { select: { id: true, documentId: true, title: true } },
        requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getExpired(organisationId: string) {
    const expired = await this.prisma.documentException.findMany({
      where: {
        organisationId,
        status: 'ACTIVE',
        expiryDate: { lt: new Date() },
      },
    });

    // Auto-expire these exceptions
    if (expired.length > 0) {
      await this.prisma.documentException.updateMany({
        where: {
          id: { in: expired.map(e => e.id) },
        },
        data: { status: 'EXPIRED' },
      });
    }

    return expired;
  }

  async getStats(organisationId: string) {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [total, byStatus, expiring, reviewsDue] = await Promise.all([
      this.prisma.documentException.count({ where: { organisationId } }),
      this.prisma.documentException.groupBy({
        by: ['status'],
        where: { organisationId },
        _count: true,
      }),
      this.prisma.documentException.count({
        where: {
          organisationId,
          status: 'ACTIVE',
          expiryDate: { lte: thirtyDays, gte: now },
        },
      }),
      this.prisma.documentException.count({
        where: {
          organisationId,
          status: 'ACTIVE',
          nextReviewDate: { lte: thirtyDays },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      active: byStatus.find(s => s.status === 'ACTIVE')?._count || 0,
      pending: byStatus.filter(s => ['REQUESTED', 'UNDER_REVIEW'].includes(s.status)).reduce((sum, s) => sum + s._count, 0),
      expiring,
      reviewsDue,
    };
  }

  async review(id: string, data: { userId: string; notes?: string }) {
    const exception = await this.findOne(id);

    if (exception.status !== 'ACTIVE') {
      throw new NotFoundException('Only active exceptions can be reviewed');
    }

    const nextReviewDate = this.calculateNextReviewDate(exception.reviewFrequency);

    return this.prisma.documentException.update({
      where: { id },
      data: {
        lastReviewDate: new Date(),
        nextReviewDate,
      },
    });
  }

  private calculateNextReviewDate(frequency: ReviewFrequency): Date {
    const now = new Date();
    const frequencyDays: Record<ReviewFrequency, number> = {
      MONTHLY: 30,
      QUARTERLY: 90,
      SEMI_ANNUAL: 180,
      ANNUAL: 365,
      BIENNIAL: 730,
      TRIENNIAL: 1095,
      ON_CHANGE: 90,
      AS_NEEDED: 90,
    };

    return new Date(now.getTime() + frequencyDays[frequency] * 24 * 60 * 60 * 1000);
  }
}
