import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateCapacityPlanDto,
  RecordCapacityDto,
  UpdateCapacityPlanDto,
} from '../dto/capacity.dto';

@Injectable()
export class CapacityService {
  constructor(private prisma: PrismaService) {}

  async recordCapacity(assetId: string, data: RecordCapacityDto) {
    // Create capacity record
    const record = await this.prisma.capacityRecord.create({
      data: {
        ...data,
        assetId,
      },
    });

    // Update asset capacity status based on thresholds
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        cpuThresholdPercent: true,
        memoryThresholdPercent: true,
        storageThresholdPercent: true,
      },
    });

    if (asset) {
      const status = this.calculateCapacityStatus(
        data,
        asset.cpuThresholdPercent || 80,
        asset.memoryThresholdPercent || 80,
        asset.storageThresholdPercent || 80,
      );

      await this.prisma.asset.update({
        where: { id: assetId },
        data: {
          cpuUsagePercent: data.cpuUsagePercent,
          memoryUsagePercent: data.memoryUsagePercent,
          storageUsagePercent: data.storageUsagePercent,
          capacityStatus: status,
        },
      });
    }

    return record;
  }

  async getCapacityHistory(assetId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.capacityRecord.findMany({
      where: {
        assetId,
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'asc' },
    });
  }

  async getCapacityTrend(assetId: string) {
    const records = await this.getCapacityHistory(assetId, 30);

    if (records.length < 2) {
      return { trend: 'UNKNOWN', growthRate: null };
    }

    // Calculate average growth for storage (most common capacity concern)
    const storageValues = records
      .filter((r) => r.storageUsagePercent !== null)
      .map((r) => r.storageUsagePercent as number);

    if (storageValues.length < 2) {
      return { trend: 'UNKNOWN', growthRate: null };
    }

    const firstHalf = storageValues.slice(0, Math.floor(storageValues.length / 2));
    const secondHalf = storageValues.slice(Math.floor(storageValues.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const growthRate = ((secondAvg - firstAvg) / firstAvg) * 100;

    let trend: string;
    if (growthRate > 5) trend = 'growing';
    else if (growthRate < -5) trend = 'declining';
    else trend = 'stable';

    return { trend, growthRate: Math.round(growthRate * 100) / 100 };
  }

  async getAssetsAtRisk() {
    return this.prisma.asset.findMany({
      where: {
        status: 'ACTIVE',
        capacityStatus: { in: ['WARNING', 'CRITICAL', 'EXHAUSTED'] },
      },
      select: {
        id: true,
        assetTag: true,
        name: true,
        assetType: true,
        businessCriticality: true,
        capacityStatus: true,
        cpuUsagePercent: true,
        memoryUsagePercent: true,
        storageUsagePercent: true,
        projectedExhaustionDate: true,
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: [
        { capacityStatus: 'desc' },
        { businessCriticality: 'asc' },
      ],
    });
  }

  async getCapacitySummary() {
    const [total, byStatus, criticalAtRisk] = await Promise.all([
      this.prisma.asset.count({ where: { status: 'ACTIVE' } }),
      this.prisma.asset.groupBy({
        by: ['capacityStatus'],
        where: { status: 'ACTIVE' },
        _count: { _all: true },
      }),
      this.prisma.asset.count({
        where: {
          status: 'ACTIVE',
          businessCriticality: 'CRITICAL',
          capacityStatus: { in: ['WARNING', 'CRITICAL', 'EXHAUSTED'] },
        },
      }),
    ]);

    return {
      totalActive: total,
      criticalAtRisk,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.capacityStatus] = item._count._all;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Capacity Plans
  async findCapacityPlans(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.CapacityPlanWhereInput;
  }) {
    const { skip, take, where } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.capacityPlan.findMany({
        skip,
        take,
        where,
        include: {
          asset: { select: { id: true, assetTag: true, name: true, assetType: true } },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.capacityPlan.count({ where }),
    ]);
    return { results, count };
  }

  async findCapacityPlanById(id: string) {
    return this.prisma.capacityPlan.findUnique({
      where: { id },
      include: {
        asset: { select: { id: true, assetTag: true, name: true, assetType: true, status: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async createCapacityPlan(data: CreateCapacityPlanDto) {
    return this.prisma.capacityPlan.create({
      data: data as Prisma.CapacityPlanUncheckedCreateInput,
      include: {
        asset: { select: { id: true, assetTag: true, name: true, assetType: true } },
      },
    });
  }

  async updateCapacityPlan(id: string, data: UpdateCapacityPlanDto) {
    return this.prisma.capacityPlan.update({
      where: { id },
      data: data as Prisma.CapacityPlanUncheckedUpdateInput,
    });
  }

  private calculateCapacityStatus(
    data: { cpuUsagePercent?: number; memoryUsagePercent?: number; storageUsagePercent?: number },
    cpuThreshold: number,
    memoryThreshold: number,
    storageThreshold: number,
  ): 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EXHAUSTED' | 'UNKNOWN' {
    const values = [
      { usage: data.cpuUsagePercent, threshold: cpuThreshold },
      { usage: data.memoryUsagePercent, threshold: memoryThreshold },
      { usage: data.storageUsagePercent, threshold: storageThreshold },
    ].filter((v) => v.usage !== undefined && v.usage !== null);

    if (values.length === 0) return 'UNKNOWN';

    // Check for exhausted (any at 100%)
    if (values.some((v) => v.usage! >= 100)) return 'EXHAUSTED';

    // Check for critical (any at 95%+)
    if (values.some((v) => v.usage! >= 95)) return 'CRITICAL';

    // Check for warning (any above threshold)
    if (values.some((v) => v.usage! >= v.threshold)) return 'WARNING';

    return 'NORMAL';
  }
}
