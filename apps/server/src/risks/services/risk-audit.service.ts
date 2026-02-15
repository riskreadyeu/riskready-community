import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  entityType: 'RISK' | 'SCENARIO' | 'TREATMENT' | 'KRI' | 'ACCEPTANCE';
  entityId: string;
  action: string;
  actorId: string | null;
  actorEmail: string | null;
  details: Record<string, unknown>;
}

export interface AuditSummary {
  totalChanges: number;
  byEntityType: Record<string, number>;
  byAction: Record<string, number>;
  recentChanges: AuditEntry[];
}

@Injectable()
export class RiskAuditService {
  private readonly logger = new Logger(RiskAuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get complete audit trail for a risk and all related entities
   */
  async getRiskAuditTrail(riskId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ entries: AuditEntry[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const startDate = options?.startDate;
    const endDate = options?.endDate;

    const entries: AuditEntry[] = [];

    // Get scenario state history
    const scenarios = await this.prisma.riskScenario.findMany({
      where: { riskId },
      select: { id: true },
    });
    const scenarioIds = scenarios.map(s => s.id);

    if (scenarioIds.length > 0) {
      const stateHistory = await this.prisma.scenarioStateHistory.findMany({
        where: {
          scenarioId: { in: scenarioIds },
          ...(startDate && { createdAt: { gte: startDate } }),
          ...(endDate && { createdAt: { lte: endDate } }),
        },
        include: {
          actor: { select: { id: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      for (const history of stateHistory) {
        entries.push({
          id: history.id,
          timestamp: history.createdAt,
          entityType: 'SCENARIO',
          entityId: history.scenarioId,
          action: `STATE_TRANSITION: ${history.fromStatus || 'INITIAL'} → ${history.toStatus}`,
          actorId: history.actorId,
          actorEmail: history.actor?.email || null,
          details: {
            transitionCode: history.transitionCode,
            fromStatus: history.fromStatus,
            toStatus: history.toStatus,
            notes: history.notes,
          },
        });
      }
    }

    // Get risk calculation history
    const calculationHistory = await this.prisma.riskCalculationHistory.findMany({
      where: {
        scenario: { riskId },
        ...(startDate && { calculatedAt: { gte: startDate } }),
        ...(endDate && { calculatedAt: { lte: endDate } }),
      },
      include: {
        calculatedBy: { select: { id: true, email: true } },
      },
      orderBy: { calculatedAt: 'desc' },
    });

    for (const calc of calculationHistory) {
      entries.push({
        id: calc.id,
        timestamp: calc.calculatedAt,
        entityType: 'SCENARIO',
        entityId: calc.scenarioId,
        action: `SCORE_CALCULATED: ${calc.trigger}`,
        actorId: calc.calculatedById,
        actorEmail: calc.calculatedBy?.email || null,
        details: {
          trigger: calc.trigger,
          inherentScore: calc.inherentScore,
          residualScore: calc.residualScore,
          likelihood: calc.likelihood,
          impact: calc.impact,
        },
      });
    }

    // AssessmentSnapshot removed in community edition — no snapshot entries
    const snapshots: Array<{
      id: string;
      snapshotDate: Date;
      reason: string;
      createdById: string;
      createdBy: { id: string; email: string | null };
      version: number;
      inherentScore: number | null;
      residualScore: number | null;
    }> = [];

    for (const snapshot of snapshots) {
      entries.push({
        id: snapshot.id,
        timestamp: snapshot.snapshotDate,
        entityType: 'RISK',
        entityId: riskId,
        action: `SNAPSHOT_CREATED: ${snapshot.reason}`,
        actorId: snapshot.createdById,
        actorEmail: snapshot.createdBy?.email || null,
        details: {
          version: snapshot.version,
          reason: snapshot.reason,
          inherentScore: snapshot.inherentScore,
          residualScore: snapshot.residualScore,
        },
      });
    }

    // Get KRI history
    const kris = await this.prisma.keyRiskIndicator.findMany({
      where: { riskId },
      select: { id: true },
    });
    const kriIds = kris.map(k => k.id);

    if (kriIds.length > 0) {
      const kriHistory = await this.prisma.kRIHistory.findMany({
        where: {
          kriId: { in: kriIds },
          ...(startDate && { measuredAt: { gte: startDate } }),
          ...(endDate && { measuredAt: { lte: endDate } }),
        },
        include: {
          kri: { select: { kriId: true, name: true } },
        },
        orderBy: { measuredAt: 'desc' },
      });

      for (const history of kriHistory) {
        entries.push({
          id: history.id,
          timestamp: history.measuredAt,
          entityType: 'KRI',
          entityId: history.kriId,
          action: `KRI_MEASURED: ${history.status}`,
          actorId: history.measuredBy,
          actorEmail: null,
          details: {
            kriId: history.kri.kriId,
            kriName: history.kri.name,
            value: history.value,
            status: history.status,
            notes: history.notes,
          },
        });
      }
    }

    // Sort all entries by timestamp descending
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = entries.length;
    const paginatedEntries = entries.slice(offset, offset + limit);

    return { entries: paginatedEntries, total };
  }

  /**
   * Get audit summary for a risk
   */
  async getRiskAuditSummary(riskId: string, days: number = 30): Promise<AuditSummary> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { entries, total } = await this.getRiskAuditTrail(riskId, {
      startDate,
      limit: 1000,
    });

    const byEntityType: Record<string, number> = {};
    const byAction: Record<string, number> = {};

    for (const entry of entries) {
      byEntityType[entry.entityType] = (byEntityType[entry.entityType] ?? 0) + 1;
      const actionType = entry.action.split(':')[0]!;
      byAction[actionType] = (byAction[actionType] ?? 0) + 1;
    }

    return {
      totalChanges: total,
      byEntityType,
      byAction,
      recentChanges: entries.slice(0, 10),
    };
  }

  /**
   * Get audit trail for a specific scenario
   */
  async getScenarioAuditTrail(scenarioId: string, limit: number = 50): Promise<AuditEntry[]> {
    const entries: AuditEntry[] = [];

    // State history
    const stateHistory = await this.prisma.scenarioStateHistory.findMany({
      where: { scenarioId },
      include: {
        actor: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    for (const history of stateHistory) {
      entries.push({
        id: history.id,
        timestamp: history.createdAt,
        entityType: 'SCENARIO',
        entityId: scenarioId,
        action: `STATE_TRANSITION: ${history.fromStatus || 'INITIAL'} → ${history.toStatus}`,
        actorId: history.actorId,
        actorEmail: history.actor?.email || null,
        details: {
          transitionCode: history.transitionCode,
          fromStatus: history.fromStatus,
          toStatus: history.toStatus,
          notes: history.notes,
        },
      });
    }

    // Calculation history
    const calcHistory = await this.prisma.riskCalculationHistory.findMany({
      where: { scenarioId },
      include: {
        calculatedBy: { select: { id: true, email: true } },
      },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
    });

    for (const calc of calcHistory) {
      entries.push({
        id: calc.id,
        timestamp: calc.calculatedAt,
        entityType: 'SCENARIO',
        entityId: scenarioId,
        action: `SCORE_CALCULATED: ${calc.trigger}`,
        actorId: calc.calculatedById,
        actorEmail: calc.calculatedBy?.email || null,
        details: {
          trigger: calc.trigger,
          inherentScore: calc.inherentScore,
          residualScore: calc.residualScore,
        },
      });
    }

    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return entries.slice(0, limit);
  }

  /**
   * Get organization-wide audit summary
   */
  async getOrganizationAuditSummary(organisationId: string, days: number = 7): Promise<{
    totalChanges: number;
    stateTransitions: number;
    calculations: number;
    snapshots: number;
    kriMeasurements: number;
    topChangedRisks: { riskId: string; title: string; changeCount: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [stateTransitions, calculations, snapshots, kriMeasurements] = await Promise.all([
      this.prisma.scenarioStateHistory.count({
        where: {
          scenario: { risk: { organisationId } },
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.riskCalculationHistory.count({
        where: {
          scenario: { risk: { organisationId } },
          calculatedAt: { gte: startDate },
        },
      }),
      Promise.resolve(0), // AssessmentSnapshot removed in community edition
      this.prisma.kRIHistory.count({
        where: {
          kri: { risk: { organisationId } },
          measuredAt: { gte: startDate },
        },
      }),
    ]);

    // Get top changed risks
    const riskChanges = await this.prisma.scenarioStateHistory.groupBy({
      by: ['scenarioId'],
      where: {
        scenario: { risk: { organisationId } },
        createdAt: { gte: startDate },
      },
      _count: true,
      orderBy: { _count: { scenarioId: 'desc' } },
      take: 5,
    });

    const topChangedRisks = await Promise.all(
      riskChanges.map(async (rc) => {
        const scenario = await this.prisma.riskScenario.findUnique({
          where: { id: rc.scenarioId },
          include: { risk: { select: { riskId: true, title: true } } },
        });
        return {
          riskId: scenario?.risk.riskId || '',
          title: scenario?.risk.title || '',
          changeCount: rc._count,
        };
      })
    );

    return {
      totalChanges: stateTransitions + calculations + snapshots + kriMeasurements,
      stateTransitions,
      calculations,
      snapshots,
      kriMeasurements,
      topChangedRisks,
    };
  }
}
