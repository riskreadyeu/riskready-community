import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyAuditAction, Prisma } from '@prisma/client';

@Injectable()
export class PolicyAuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    documentId: string;
    action: PolicyAuditAction;
    description: string;
    performedById: string;
    previousValue?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }) {
    const { documentId, action, description, performedById, previousValue, newValue, ipAddress, userAgent, sessionId } = data;

    return this.prisma.policyDocumentAuditLog.create({
      data: {
        document: { connect: { id: documentId } },
        action,
        description,
        performedBy: { connect: { id: performedById } },
        previousValue: previousValue ? previousValue : undefined,
        newValue: newValue ? newValue : undefined,
        ipAddress,
        userAgent,
        sessionId,
      },
    });
  }

  async getDocumentAuditLog(documentId: string, params?: {
    skip?: number;
    take?: number;
    action?: PolicyAuditAction;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { skip, take, action, startDate, endDate } = params || {};

    const where: Prisma.PolicyDocumentAuditLogWhereInput = {
      documentId,
      ...(action && { action }),
      ...(startDate || endDate) && {
        performedAt: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      },
    };

    const [results, count] = await Promise.all([
      this.prisma.policyDocumentAuditLog.findMany({
        where,
        skip,
        take,
        orderBy: { performedAt: 'desc' },
        include: {
          performedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.policyDocumentAuditLog.count({ where }),
    ]);

    return { results, count };
  }

  async getOrganisationAuditLog(organisationId: string, params?: {
    skip?: number;
    take?: number;
    action?: PolicyAuditAction;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }) {
    const { skip, take, action, startDate, endDate, userId } = params || {};

    const where: Prisma.PolicyDocumentAuditLogWhereInput = {
      document: { organisationId },
      ...(action && { action }),
      ...(userId && { performedById: userId }),
      ...(startDate || endDate) && {
        performedAt: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      },
    };

    const [results, count] = await Promise.all([
      this.prisma.policyDocumentAuditLog.findMany({
        where,
        skip,
        take,
        orderBy: { performedAt: 'desc' },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          performedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.policyDocumentAuditLog.count({ where }),
    ]);

    return { results, count };
  }

  async getRecentActivity(organisationId: string, limit: number = 10) {
    return this.prisma.policyDocumentAuditLog.findMany({
      where: {
        document: { organisationId },
      },
      take: limit,
      orderBy: { performedAt: 'desc' },
      include: {
        document: { select: { id: true, documentId: true, title: true, documentType: true } },
        performedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async getActivityStats(organisationId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [byAction, byUser, byDocument, timeline] = await Promise.all([
      this.prisma.policyDocumentAuditLog.groupBy({
        by: ['action'],
        where: {
          document: { organisationId },
          performedAt: { gte: startDate },
        },
        _count: true,
      }),
      this.prisma.policyDocumentAuditLog.groupBy({
        by: ['performedById'],
        where: {
          document: { organisationId },
          performedAt: { gte: startDate },
        },
        _count: true,
        orderBy: { _count: { performedById: 'desc' } },
        take: 10,
      }),
      this.prisma.policyDocumentAuditLog.groupBy({
        by: ['documentId'],
        where: {
          document: { organisationId },
          performedAt: { gte: startDate },
        },
        _count: true,
        orderBy: { _count: { documentId: 'desc' } },
        take: 10,
      }),
      // Daily activity count
      this.prisma.$queryRaw`
        SELECT DATE("performedAt") as date, COUNT(*) as count
        FROM "PolicyDocumentAuditLog" pal
        JOIN "PolicyDocument" pd ON pal."documentId" = pd.id
        WHERE pd."organisationId" = ${organisationId}
          AND pal."performedAt" >= ${startDate}
        GROUP BY DATE("performedAt")
        ORDER BY date
      `,
    ]);

    return {
      byAction: byAction.reduce((acc, item) => {
        acc[item.action] = item._count;
        return acc;
      }, {} as Record<string, number>),
      topUsers: byUser,
      topDocuments: byDocument,
      timeline,
    };
  }

  async exportAuditLog(params: {
    organisationId: string;
    documentId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    const { organisationId, documentId, startDate, endDate } = params;

    const where: Prisma.PolicyDocumentAuditLogWhereInput = {
      document: { organisationId },
      ...(documentId && { documentId }),
      performedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    return this.prisma.policyDocumentAuditLog.findMany({
      where,
      orderBy: { performedAt: 'asc' },
      include: {
        document: { select: { documentId: true, title: true } },
        performedBy: { select: { email: true, firstName: true, lastName: true } },
      },
    });
  }
}
