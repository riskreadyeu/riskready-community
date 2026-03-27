import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateChangeDto, UpdateChangeDto } from '../dto/change.dto';

interface AssetLink {
  assetId: string;
  impactType?: string;
  notes?: string;
}

interface ProcessLink {
  type?: string;
  [key: string]: unknown;
}

@Injectable()
export class ChangeService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ChangeWhereInput;
    orderBy?: Prisma.ChangeOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.change.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          requester: { select: { id: true, email: true, firstName: true, lastName: true } },
          implementer: { select: { id: true, email: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true, departmentCode: true } },
          _count: {
            select: {
              approvals: true,
              assetLinks: true,
            },
          },
        },
      }),
      this.prisma.change.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    const change = await this.prisma.change.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, email: true, firstName: true, lastName: true } },
        implementer: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, departmentCode: true } },
        vendor: { select: { id: true, name: true, dependencyType: true } },
        parentChange: { select: { id: true, changeRef: true, title: true } },
        childChanges: { select: { id: true, changeRef: true, title: true, status: true } },
        approvals: {
          include: {
            approver: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        assetLinks: {
          include: {
            asset: { select: { id: true, assetTag: true, name: true, assetType: true, businessCriticality: true } },
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            changedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!change) {
      throw new NotFoundException(`Change with ID ${id} not found`);
    }

    return change;
  }

  async create(data: CreateChangeDto & { impactedProcesses?: ProcessLink[] }, userId: string) {
    const changeRef = await this.generateChangeRef();

    // Prepare asset links if provided
    const assetLinks = (data.impactedAssets as unknown as AssetLink[] | undefined)?.map((a: AssetLink) => ({
      assetId: a.assetId,
      impactType: a.impactType || 'DIRECT',
      notes: a.notes,
    })) || [];

    return this.prisma.change.create({
      data: {
        changeRef,
        title: data.title,
        description: data.description,
        changeType: data.changeType,
        category: data.category,
        priority: data.priority || 'MEDIUM',
        securityImpact: data.securityImpact || 'LOW',
        status: 'DRAFTED',
        requester: { connect: { id: userId } },
        department: data.departmentId ? { connect: { id: data.departmentId } } : undefined,
        businessJustification: data.businessJustification,
        impactAssessment: data.impactAssessment,
        affectedServices: data.impactedProcesses
          ? [...(data.affectedServices || []), ...data.impactedProcesses.map((p: ProcessLink) => ({ type: 'process', ...p }))] as Prisma.InputJsonValue
          : data.affectedServices as Prisma.InputJsonValue | undefined,
        userImpact: data.userImpact,
        riskLevel: data.riskLevel || 'medium',
        riskAssessment: data.riskAssessment,
        backoutPlan: data.backoutPlan,
        rollbackTime: data.rollbackTime,
        testPlan: data.testPlan,
        plannedStart: data.plannedStart ? new Date(data.plannedStart) : undefined,
        plannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : undefined,
        maintenanceWindow: data.maintenanceWindow || false,
        outageRequired: data.outageRequired || false,
        estimatedDowntime: data.estimatedDowntime,
        cabRequired: data.cabRequired || false,
        pirRequired: data.pirRequired || false,
        successCriteria: data.successCriteria,
        createdBy: { connect: { id: userId } },
        assetLinks: assetLinks.length > 0 ? { create: assetLinks } : undefined,
      },
      include: {
        requester: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, departmentCode: true } },
        assetLinks: { include: { asset: { select: { id: true, name: true, assetTag: true, assetType: true } } } },
      },
    });
  }

  async update(id: string, data: UpdateChangeDto & { impactedAssets?: AssetLink[]; impactedProcesses?: ProcessLink[] }, userId: string) {
    const change = await this.prisma.change.findUnique({ where: { id } });
    if (!change) {
      throw new NotFoundException(`Change with ID ${id} not found`);
    }

    // Record history for significant field changes
    const fieldsToTrack = ['status', 'priority', 'securityImpact', 'plannedStart', 'plannedEnd'];
    const historyEntries: { field: string; oldValue: string; newValue: string; action: string; changedById: string }[] = [];

    for (const field of fieldsToTrack) {
      const dataRecord = data as Record<string, unknown>;
      const changeRecord = change as unknown as Record<string, unknown>;
      if (dataRecord[field] !== undefined && dataRecord[field] !== changeRecord[field]) {
        historyEntries.push({
          field,
          oldValue: String(changeRecord[field] || ''),
          newValue: String(dataRecord[field]),
          action: 'updated',
          changedById: userId,
        });
      }
    }

    // Handle impacted assets update
    if (data.impactedAssets !== undefined) {
      // Delete existing asset links and recreate
      await this.prisma.changeAsset.deleteMany({ where: { changeId: id } });
      
      if (data.impactedAssets.length > 0) {
        await this.prisma.changeAsset.createMany({
          data: data.impactedAssets.map((a: AssetLink) => ({
            changeId: id,
            assetId: a.assetId,
            impactType: a.impactType || 'DIRECT',
            notes: a.notes,
          })),
        });
      }
    }

    // Prepare update data (exclude impactedAssets as it's handled separately)
    const { impactedAssets, impactedProcesses, ...updateData } = data;

    return this.prisma.change.update({
      where: { id },
      data: {
        ...updateData,
        affectedServices: impactedProcesses
          ? [...((change as unknown as Record<string, unknown>)['affectedServices'] as Prisma.InputJsonValue[] || []), ...impactedProcesses.map((p: ProcessLink) => ({ type: 'process', ...p }))] as Prisma.InputJsonValue
          : undefined,
        plannedStart: updateData.plannedStart ? new Date(updateData.plannedStart) : undefined,
        plannedEnd: updateData.plannedEnd ? new Date(updateData.plannedEnd) : undefined,
        updatedById: userId,
        history: historyEntries.length > 0 ? { create: historyEntries } : undefined,
      } as Prisma.ChangeUncheckedUpdateInput,
      include: {
        requester: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, departmentCode: true } },
        assetLinks: { include: { asset: { select: { id: true, name: true, assetTag: true, assetType: true } } } },
      },
    });
  }

  async submit(id: string, userId: string) {
    const change = await this.prisma.change.findUnique({ where: { id } });
    if (!change) throw new NotFoundException(`Change with ID ${id} not found`);
    if (change.status !== 'DRAFTED') {
      throw new BadRequestException('Only drafted changes can be submitted');
    }

    return this.prisma.change.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        history: {
          create: {
            field: 'status',
            oldValue: 'DRAFTED',
            newValue: 'SUBMITTED',
            action: 'submitted',
            changedById: userId,
          },
        },
      },
    });
  }

  async delete(id: string) {
    const change = await this.prisma.change.findUnique({ where: { id } });
    if (!change) throw new NotFoundException(`Change with ID ${id} not found`);
    if (!['DRAFTED', 'CANCELLED'].includes(change.status)) {
      throw new BadRequestException('Only drafted or cancelled changes can be deleted');
    }

    return this.prisma.change.delete({ where: { id } });
  }

  async getSummary() {
    const [total, byStatus, byType, byPriority, pendingApproval, thisMonth] = await Promise.all([
      this.prisma.change.count(),
      this.prisma.change.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.change.groupBy({
        by: ['changeType'],
        _count: { _all: true },
      }),
      this.prisma.change.groupBy({
        by: ['priority'],
        _count: { _all: true },
      }),
      this.prisma.change.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.prisma.change.count({
        where: {
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ]);

    return {
      total,
      pendingApproval,
      thisMonth,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      }, {} as Record<string, number>),
      byType: byType.reduce((acc, item) => {
        acc[item.changeType] = item._count._all;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count._all;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async linkAssets(changeId: string, assetLinks: Array<{ assetId: string; impactType: string; notes?: string }>) {
    // Delete existing links and create new ones
    await this.prisma.changeAsset.deleteMany({ where: { changeId } });

    return this.prisma.changeAsset.createMany({
      data: assetLinks.map((link) => ({
        changeId,
        assetId: link.assetId,
        impactType: link.impactType,
        notes: link.notes,
      })),
    });
  }

  async getHistory(id: string) {
    const change = await this.prisma.change.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!change) throw new NotFoundException(`Change with ID ${id} not found`);

    return this.prisma.changeHistory.findMany({
      where: { changeId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        changedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async getCalendar(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const changes = await this.prisma.change.findMany({
      where: {
        OR: [
          {
            plannedStart: { gte: start, lte: end },
          },
          {
            plannedEnd: { gte: start, lte: end },
          },
          {
            AND: [
              { plannedStart: { lte: start } },
              { plannedEnd: { gte: end } },
            ],
          },
        ],
        status: { notIn: ['DRAFTED', 'CANCELLED', 'REJECTED'] },
      },
      select: {
        id: true,
        changeRef: true,
        title: true,
        changeType: true,
        category: true,
        priority: true,
        status: true,
        plannedStart: true,
        plannedEnd: true,
        maintenanceWindow: true,
        outageRequired: true,
        estimatedDowntime: true,
        requester: { select: { id: true, firstName: true, lastName: true } },
        assetLinks: {
          select: {
            asset: { select: { id: true, assetTag: true, name: true, businessCriticality: true } },
          },
        },
      },
      orderBy: { plannedStart: 'asc' },
    });

    return {
      startDate: start,
      endDate: end,
      changes,
    };
  }

  async getCabDashboard() {
    const [
      pendingApproval,
      awaitingCab,
      upcomingChanges,
      recentApproved,
      recentRejected,
      emergencyThisMonth,
      successRate,
    ] = await Promise.all([
      // Changes pending any approval
      this.prisma.change.findMany({
        where: { status: 'PENDING_APPROVAL' },
        include: {
          requester: { select: { id: true, firstName: true, lastName: true } },
          approvals: {
            include: {
              approver: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          assetLinks: {
            select: {
              asset: { select: { businessCriticality: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),

      // Changes requiring CAB review
      this.prisma.change.count({
        where: {
          cabRequired: true,
          status: { in: ['SUBMITTED', 'PENDING_APPROVAL'] },
        },
      }),

      // Upcoming approved changes (next 7 days)
      this.prisma.change.findMany({
        where: {
          status: { in: ['APPROVED', 'SCHEDULED'] },
          plannedStart: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          requester: { select: { id: true, firstName: true, lastName: true } },
          implementer: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { plannedStart: 'asc' },
        take: 10,
      }),

      // Recently approved (last 7 days)
      this.prisma.change.count({
        where: {
          status: 'APPROVED',
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Recently rejected (last 7 days)
      this.prisma.change.count({
        where: {
          status: 'REJECTED',
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Emergency changes this month
      this.prisma.change.count({
        where: {
          changeType: 'EMERGENCY',
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),

      // Success rate (last 30 days)
      Promise.all([
        this.prisma.change.count({
          where: {
            status: 'COMPLETED',
            successful: true,
            actualEnd: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.change.count({
          where: {
            status: { in: ['COMPLETED', 'FAILED', 'ROLLED_BACK'] },
            actualEnd: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]),
    ]);

    const [successfulCount, totalCompleted] = successRate;
    const calculatedSuccessRate = totalCompleted > 0 ? Math.round((successfulCount / totalCompleted) * 100) : 100;

    return {
      pendingApproval,
      awaitingCab,
      upcomingChanges,
      stats: {
        recentApproved,
        recentRejected,
        emergencyThisMonth,
        successRate: calculatedSuccessRate,
      },
    };
  }

  private async generateChangeRef(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CHG-${year}-`;

    const lastChange = await this.prisma.change.findFirst({
      where: { changeRef: { startsWith: prefix } },
      orderBy: { changeRef: 'desc' },
    });

    let nextNumber = 1;
    if (lastChange) {
      const match = lastChange.changeRef.match(/-(\d+)$/);
      if (match?.[1]) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }
}
