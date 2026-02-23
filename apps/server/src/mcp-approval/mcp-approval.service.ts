import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { McpActionStatus, McpActionType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class McpApprovalService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    status?: McpActionStatus;
    actionType?: McpActionType;
    organisationId?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.McpPendingActionWhereInput = {};
    if (params?.status) where.status = params.status;
    if (params?.actionType) where.actionType = params.actionType;
    if (params?.organisationId) where.organisationId = params.organisationId;

    const [results, count] = await Promise.all([
      this.prisma.mcpPendingAction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params?.skip || 0,
        take: params?.take || 50,
        include: {
          reviewedBy: { select: { id: true, email: true } },
          organisation: { select: { id: true, name: true } },
        },
      }),
      this.prisma.mcpPendingAction.count({ where }),
    ]);

    return { results, count };
  }

  async findOne(id: string) {
    const action = await this.prisma.mcpPendingAction.findUnique({
      where: { id },
      include: {
        reviewedBy: { select: { id: true, email: true } },
        organisation: { select: { id: true, name: true } },
      },
    });

    if (!action) {
      throw new NotFoundException(`McpPendingAction ${id} not found`);
    }

    return action;
  }

  async getStats(organisationId?: string) {
    const where: Prisma.McpPendingActionWhereInput = {};
    if (organisationId) where.organisationId = organisationId;

    const counts = await this.prisma.mcpPendingAction.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const statusMap: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      EXECUTED: 0,
      FAILED: 0,
    };

    for (const row of counts) {
      statusMap[row.status] = row._count.status;
    }

    return {
      pending: statusMap['PENDING'],
      approved: statusMap['APPROVED'],
      rejected: statusMap['REJECTED'],
      executed: statusMap['EXECUTED'],
      failed: statusMap['FAILED'],
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
    };
  }

  async approve(id: string, reviewedById: string, reviewNotes?: string) {
    const action = await this.findOne(id);

    if (action.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot approve action with status ${action.status}. Only PENDING actions can be approved.`,
      );
    }

    return this.prisma.mcpPendingAction.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById,
        reviewedAt: new Date(),
        reviewNotes,
      },
      include: {
        reviewedBy: { select: { id: true, email: true } },
        organisation: { select: { id: true, name: true } },
      },
    });
  }

  async reject(id: string, reviewedById: string, reviewNotes?: string) {
    const action = await this.findOne(id);

    if (action.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot reject action with status ${action.status}. Only PENDING actions can be rejected.`,
      );
    }

    return this.prisma.mcpPendingAction.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById,
        reviewedAt: new Date(),
        reviewNotes,
      },
      include: {
        reviewedBy: { select: { id: true, email: true } },
        organisation: { select: { id: true, name: true } },
      },
    });
  }

  async markExecuted(id: string, resultData?: unknown) {
    return this.prisma.mcpPendingAction.update({
      where: { id },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
        resultData: resultData ?? undefined,
      },
    });
  }

  async markFailed(id: string, errorMessage: string) {
    return this.prisma.mcpPendingAction.update({
      where: { id },
      data: {
        status: 'FAILED',
        executedAt: new Date(),
        errorMessage,
      },
    });
  }

  async retry(id: string) {
    const action = await this.findOne(id);

    if (action.status !== 'FAILED') {
      throw new BadRequestException(
        `Cannot retry action with status ${action.status}. Only FAILED actions can be retried.`,
      );
    }

    return this.prisma.mcpPendingAction.update({
      where: { id },
      data: {
        status: 'PENDING',
        reviewedById: null,
        reviewedAt: null,
        reviewNotes: null,
        executedAt: null,
        resultData: Prisma.DbNull,
        errorMessage: null,
      },
      include: {
        reviewedBy: { select: { id: true, email: true } },
        organisation: { select: { id: true, name: true } },
      },
    });
  }
}
