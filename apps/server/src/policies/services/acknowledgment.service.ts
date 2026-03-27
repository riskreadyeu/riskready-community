import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, AcknowledgmentMethod } from '@prisma/client';
import { PolicyAuditService } from './policy-audit.service';

@Injectable()
export class AcknowledgmentService {
  constructor(
    private prisma: PrismaService,
    private auditService: PolicyAuditService,
  ) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    documentId?: string;
    userId?: string;
    isAcknowledged?: boolean;
  }) {
    const { skip, take, documentId, userId, isAcknowledged } = params || {};

    const where: Prisma.DocumentAcknowledgmentWhereInput = {
      ...(documentId && { documentId }),
      ...(userId && { userId }),
      ...(isAcknowledged !== undefined && { isAcknowledged }),
    };

    const [results, count] = await Promise.all([
      this.prisma.documentAcknowledgment.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          document: { select: { id: true, documentId: true, title: true, documentType: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.documentAcknowledgment.count({ where }),
    ]);

    return { results, count };
  }

  async findOne(id: string) {
    const acknowledgment = await this.prisma.documentAcknowledgment.findUnique({
      where: { id },
      include: {
        document: { select: { id: true, documentId: true, title: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!acknowledgment) {
      throw new NotFoundException(`Acknowledgment with ID ${id} not found`);
    }

    return acknowledgment;
  }

  async getDocumentAcknowledgments(documentId: string) {
    const [acknowledged, pending] = await Promise.all([
      this.prisma.documentAcknowledgment.findMany({
        where: { documentId, isAcknowledged: true },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { acknowledgedAt: 'desc' },
      }),
      this.prisma.documentAcknowledgment.findMany({
        where: { documentId, isAcknowledged: false },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    return { acknowledged, pending };
  }

  async createAcknowledgmentRequest(data: {
    documentId: string;
    userIds: string[];
    dueDate?: Date;
  }) {
    const { documentId, userIds, dueDate } = data;

    // Get document details
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: documentId },
      select: { version: true, acknowledgmentDeadline: true },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Calculate due date if not provided
    const calculatedDueDate = dueDate || (
      document.acknowledgmentDeadline
        ? new Date(Date.now() + document.acknowledgmentDeadline * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
    );

    // Create acknowledgment records for each user
    const acknowledgments = await Promise.all(
      userIds.map(userId =>
        this.prisma.documentAcknowledgment.upsert({
          where: {
            documentId_userId_documentVersion: {
              documentId,
              userId,
              documentVersion: document.version,
            },
          },
          create: {
            document: { connect: { id: documentId } },
            documentVersion: document.version,
            user: { connect: { id: userId } },
            dueDate: calculatedDueDate,
            isAcknowledged: false,
          },
          update: {
            dueDate: calculatedDueDate,
          },
        })
      )
    );

    return acknowledgments;
  }

  async acknowledge(id: string, data: {
    method: AcknowledgmentMethod;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const acknowledgment = await this.findOne(id);

    if (acknowledgment.isAcknowledged) {
      return acknowledgment;
    }

    const updated = await this.prisma.documentAcknowledgment.update({
      where: { id },
      data: {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        method: data.method,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
      include: {
        document: { select: { id: true, documentId: true, title: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    await this.auditService.log({
      documentId: acknowledgment.documentId,
      action: 'ACKNOWLEDGED',
      description: `Document acknowledged via ${data.method}`,
      performedById: acknowledgment.userId,
    });

    return updated;
  }

  async getUserPendingAcknowledgments(userId: string) {
    return this.prisma.documentAcknowledgment.findMany({
      where: {
        userId,
        isAcknowledged: false,
      },
      include: {
        document: {
          select: {
            id: true,
            documentId: true,
            title: true,
            documentType: true,
            summary: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getOverdueAcknowledgments(organisationId: string) {
    const now = new Date();

    // Update overdue status
    await this.prisma.documentAcknowledgment.updateMany({
      where: {
        document: { organisationId },
        isAcknowledged: false,
        dueDate: { lt: now },
        isOverdue: false,
      },
      data: { isOverdue: true },
    });

    return this.prisma.documentAcknowledgment.findMany({
      where: {
        document: { organisationId },
        isAcknowledged: false,
        isOverdue: true,
      },
      include: {
        document: { select: { id: true, documentId: true, title: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getStats(organisationId: string) {
    const now = new Date();

    const [total, acknowledged, pending, overdue] = await Promise.all([
      this.prisma.documentAcknowledgment.count({
        where: { document: { organisationId } },
      }),
      this.prisma.documentAcknowledgment.count({
        where: { document: { organisationId }, isAcknowledged: true },
      }),
      this.prisma.documentAcknowledgment.count({
        where: { document: { organisationId }, isAcknowledged: false },
      }),
      this.prisma.documentAcknowledgment.count({
        where: {
          document: { organisationId },
          isAcknowledged: false,
          dueDate: { lt: now },
        },
      }),
    ]);

    const completionRate = total > 0 ? Math.round((acknowledged / total) * 100) : 0;

    return {
      total,
      acknowledged,
      pending,
      overdue,
      completionRate,
    };
  }

  async sendReminder(id: string) {
    const acknowledgment = await this.findOne(id);

    if (acknowledgment.isAcknowledged) {
      return { sent: false, reason: 'Already acknowledged' };
    }

    await this.prisma.documentAcknowledgment.update({
      where: { id },
      data: {
        remindersSent: { increment: 1 },
        lastReminderAt: new Date(),
      },
    });

    // In a real implementation, this would trigger an email notification
    // For now, just return success
    return { sent: true, reminderCount: acknowledgment.remindersSent + 1 };
  }

  async bulkSendReminders(organisationId: string, overdueOnly: boolean = false) {
    const where: Prisma.DocumentAcknowledgmentWhereInput = {
      document: { organisationId },
      isAcknowledged: false,
      ...(overdueOnly && { isOverdue: true }),
    };

    const pending = await this.prisma.documentAcknowledgment.findMany({
      where,
      select: { id: true },
    });

    await this.prisma.documentAcknowledgment.updateMany({
      where: { id: { in: pending.map(p => p.id) } },
      data: {
        remindersSent: { increment: 1 },
        lastReminderAt: new Date(),
      },
    });

    return { sent: pending.length };
  }
}
