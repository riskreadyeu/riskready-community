import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, RAGStatus, TrendDirection, CollectionFrequency, RiskTier, ControlFramework } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KRIService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.KeyRiskIndicatorWhereInput;
    orderBy?: Prisma.KeyRiskIndicatorOrderByWithRelationInput;
  }) {
    const [results, count] = await Promise.all([
      this.prisma.keyRiskIndicator.findMany({
        ...params,
        include: {
          risk: { select: { id: true, riskId: true, title: true } },
          _count: { select: { history: true } },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.keyRiskIndicator.count({ where: params?.where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    const kri = await this.prisma.keyRiskIndicator.findUnique({
      where: { id },
      include: {
        risk: { select: { id: true, riskId: true, title: true, organisationId: true } },
        history: {
          orderBy: { measuredAt: 'desc' },
          take: 20,
        },
        toleranceStatements: {
          select: { id: true, rtsId: true, title: true, status: true },
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    if (!kri) {
      throw new NotFoundException(`KRI with ID ${id} not found`);
    }
    return kri;
  }

  async create(data: {
    kriId: string;
    name: string;
    description?: string;
    formula?: string;
    unit?: string;
    thresholdGreen?: string;
    thresholdAmber?: string;
    thresholdRed?: string;
    frequency?: CollectionFrequency;
    dataSource?: string;
    automated?: boolean;
    tier?: RiskTier;
    framework?: ControlFramework;
    soc2Criteria?: string;
    riskId: string;
    createdById: string;
  }) {
    const existing = await this.prisma.keyRiskIndicator.findFirst({
      where: { kriId: data.kriId, riskId: data.riskId },
    });
    if (existing) {
      throw new ConflictException(`KRI with ID ${data.kriId} already exists for this risk`);
    }

    return this.prisma.keyRiskIndicator.create({
      data: {
        kriId: data.kriId,
        name: data.name,
        description: data.description,
        formula: data.formula,
        unit: data.unit || '%',
        thresholdGreen: data.thresholdGreen,
        thresholdAmber: data.thresholdAmber,
        thresholdRed: data.thresholdRed,
        frequency: data.frequency || 'MONTHLY',
        dataSource: data.dataSource,
        automated: data.automated || false,
        tier: data.tier || 'CORE',
        framework: data.framework || 'ISO',
        soc2Criteria: data.soc2Criteria,
        riskId: data.riskId,
        createdById: data.createdById,
        updatedById: data.createdById,
      },
      include: {
        risk: { select: { id: true, riskId: true, title: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    formula?: string;
    unit?: string;
    thresholdGreen?: string;
    thresholdAmber?: string;
    thresholdRed?: string;
    frequency?: CollectionFrequency;
    dataSource?: string;
    automated?: boolean;
    tier?: RiskTier;
    soc2Criteria?: string;
    updatedById: string;
  }) {
    const kri = await this.prisma.keyRiskIndicator.findUnique({ where: { id } });
    if (!kri) {
      throw new NotFoundException(`KRI with ID ${id} not found`);
    }

    return this.prisma.keyRiskIndicator.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        formula: data.formula,
        unit: data.unit,
        thresholdGreen: data.thresholdGreen,
        thresholdAmber: data.thresholdAmber,
        thresholdRed: data.thresholdRed,
        frequency: data.frequency,
        dataSource: data.dataSource,
        automated: data.automated,
        tier: data.tier,
        soc2Criteria: data.soc2Criteria,
        updatedById: data.updatedById,
      },
      include: {
        risk: { select: { id: true, riskId: true, title: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string) {
    const kri = await this.prisma.keyRiskIndicator.findUnique({ where: { id } });
    if (!kri) {
      throw new NotFoundException(`KRI with ID ${id} not found`);
    }
    return this.prisma.keyRiskIndicator.delete({ where: { id } });
  }

  async recordMeasurement(kriId: string, data: {
    value: string;
    notes?: string;
    measuredById: string;
  }) {
    const kri = await this.prisma.keyRiskIndicator.findUnique({ where: { id: kriId } });
    if (!kri) {
      throw new NotFoundException(`KRI with ID ${kriId} not found`);
    }

    // Determine RAG status based on thresholds (simplified comparison)
    const status = this.determineRAGStatus(data.value, kri);

    // Determine trend from last measurement
    const lastMeasurement = await this.prisma.kRIHistory.findFirst({
      where: { kriId },
      orderBy: { measuredAt: 'desc' },
    });
    const trend = this.determineTrend(data.value, lastMeasurement?.value);

    // Create history entry and update current state in a transaction
    const [history] = await this.prisma.$transaction([
      this.prisma.kRIHistory.create({
        data: {
          kriId,
          value: data.value,
          status,
          measuredAt: new Date(),
          measuredBy: data.measuredById,
          notes: data.notes,
        },
      }),
      this.prisma.keyRiskIndicator.update({
        where: { id: kriId },
        data: {
          currentValue: data.value,
          status,
          trend,
          lastMeasured: new Date(),
          updatedById: data.measuredById,
        },
      }),
    ]);

    return history;
  }

  async getHistory(kriId: string, limit = 50) {
    return this.prisma.kRIHistory.findMany({
      where: { kriId },
      orderBy: { measuredAt: 'desc' },
      take: limit,
    });
  }

  async getStats(organisationId?: string) {
    const where: Prisma.KeyRiskIndicatorWhereInput = {};
    if (organisationId) {
      where.risk = { organisationId };
    }

    const [total, byStatus, byTrend, byTier] = await Promise.all([
      this.prisma.keyRiskIndicator.count({ where }),
      this.prisma.keyRiskIndicator.groupBy({ by: ['status'], _count: true, where }),
      this.prisma.keyRiskIndicator.groupBy({ by: ['trend'], _count: true, where }),
      this.prisma.keyRiskIndicator.groupBy({ by: ['tier'], _count: true, where }),
    ]);

    return {
      total,
      ragDistribution: Object.fromEntries(byStatus.map(s => [s.status ?? 'NOT_MEASURED', s._count])),
      trendBreakdown: Object.fromEntries(byTrend.map(t => [t.trend ?? 'NEW', t._count])),
      byTier: Object.fromEntries(byTier.map(t => [t.tier, t._count])),
    };
  }

  private determineRAGStatus(value: string, kri: { thresholdGreen?: string | null; thresholdAmber?: string | null; thresholdRed?: string | null }): RAGStatus {
    // Simple numeric comparison if value is a number
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'AMBER' as RAGStatus;

    // Try to extract numeric thresholds
    const greenNum = kri.thresholdGreen ? parseFloat(kri.thresholdGreen.replace(/[^0-9.-]/g, '')) : null;
    const redNum = kri.thresholdRed ? parseFloat(kri.thresholdRed.replace(/[^0-9.-]/g, '')) : null;

    if (greenNum !== null && numValue >= greenNum) return 'GREEN' as RAGStatus;
    if (redNum !== null && numValue <= redNum) return 'RED' as RAGStatus;
    return 'AMBER' as RAGStatus;
  }

  private determineTrend(currentValue: string, previousValue?: string): TrendDirection {
    if (!previousValue) return 'STABLE' as TrendDirection;
    const current = parseFloat(currentValue);
    const previous = parseFloat(previousValue);
    if (isNaN(current) || isNaN(previous)) return 'STABLE' as TrendDirection;
    if (current > previous) return 'IMPROVING' as TrendDirection;
    if (current < previous) return 'DECLINING' as TrendDirection;
    return 'STABLE' as TrendDirection;
  }
}
