import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RiskExportOptions {
  organisationId?: string;
  format: 'json' | 'csv';
  includeScenarios?: boolean;
  includeKRIs?: boolean;
  includeTreatments?: boolean;
  includeControls?: boolean;
}

export interface RiskRegisterRow {
  riskId: string;
  title: string;
  description: string;
  tier: string;
  status: string;
  framework: string;
  riskOwner: string;
  inherentLikelihood: string;
  inherentImpact: string;
  inherentScore: number | null;
  residualLikelihood: string;
  residualImpact: string;
  residualScore: number | null;
  toleranceStatus: string;
  treatmentStatus: string;
  linkedControls: number;
  kriCount: number;
  lastAssessed: string;
  createdAt: string;
}

@Injectable()
export class RiskExportService {
  private readonly logger = new Logger(RiskExportService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Export risk register data
   */
  async exportRiskRegister(options: RiskExportOptions): Promise<{
    data: RiskRegisterRow[] | string;
    filename: string;
    contentType: string;
  }> {
    const risks = await this.prisma.risk.findMany({
      where: options.organisationId ? { organisationId: options.organisationId } : undefined,
      orderBy: { riskId: 'asc' },
    });

    const rows: RiskRegisterRow[] = [];

    for (const risk of risks) {
      // Get scenarios separately
      const scenarios = await this.prisma.riskScenario.findMany({
        where: { riskId: risk.id },
        take: 1,
      });
      const primaryScenario = scenarios[0];

      // Get treatment plans
      const treatmentPlans = await this.prisma.treatmentPlan.findMany({
        where: { riskId: risk.id },
        select: { status: true },
      });
      const activeTreatment = treatmentPlans.find((t: { status: string }) => 
        ['DRAFT', 'PROPOSED', 'APPROVED', 'IN_PROGRESS'].includes(t.status)
      );

      // Get counts - count controls linked to scenarios of this risk
      const controlCount = await this.prisma.riskScenarioControl.count({
        where: { scenario: { riskId: risk.id } },
      });
      const kriCount = await this.prisma.keyRiskIndicator.count({
        where: { riskId: risk.id },
      });

      // Get risk owner
      let riskOwnerName = '';
      if (risk.riskOwner) {
        const owner = await this.prisma.user.findUnique({
          where: { id: risk.riskOwner },
          select: { firstName: true, lastName: true, email: true },
        });
        if (owner) {
          riskOwnerName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email;
        }
      }

      rows.push({
        riskId: risk.riskId,
        title: risk.title,
        description: risk.description || '',
        tier: risk.tier,
        status: risk.status,
        framework: risk.framework,
        riskOwner: riskOwnerName,
        inherentLikelihood: primaryScenario?.likelihood || '',
        inherentImpact: primaryScenario?.impact || '',
        inherentScore: primaryScenario?.inherentScore ?? risk.inherentScore,
        residualLikelihood: primaryScenario?.residualLikelihood || '',
        residualImpact: primaryScenario?.residualImpact || '',
        residualScore: primaryScenario?.residualScore ?? risk.residualScore,
        toleranceStatus: primaryScenario?.toleranceStatus || '',
        treatmentStatus: activeTreatment?.status || 'NONE',
        linkedControls: controlCount,
        kriCount: kriCount,
        lastAssessed: risk.updatedAt.toISOString().split('T')[0]!,
        createdAt: risk.createdAt.toISOString().split('T')[0]!,
      });
    }

    if (options.format === 'csv') {
      const csv = this.convertToCSV(rows as unknown as Record<string, unknown>[]);
      return {
        data: csv,
        filename: `risk-register-${new Date().toISOString().split('T')[0]}.csv`,
        contentType: 'text/csv',
      };
    }

    return {
      data: rows,
      filename: `risk-register-${new Date().toISOString().split('T')[0]}.json`,
      contentType: 'application/json',
    };
  }

  /**
   * Export risk heat map data
   */
  async exportHeatMapData(organisationId?: string): Promise<{
    matrix: number[][];
    risks: { riskId: string; title: string; likelihood: number; impact: number; score: number }[];
  }> {
    const scenarios = await this.prisma.riskScenario.findMany({
      where: organisationId ? { risk: { organisationId } } : undefined,
      include: {
        risk: { select: { riskId: true, title: true } },
      },
    });

    // 5x5 matrix for likelihood (rows) x impact (cols)
    const matrix: number[][] = Array(5).fill(null).map(() => Array(5).fill(0));
    const likelihoodMap: Record<string, number> = {
      RARE: 0, UNLIKELY: 1, POSSIBLE: 2, LIKELY: 3, ALMOST_CERTAIN: 4,
    };
    const impactMap: Record<string, number> = {
      NEGLIGIBLE: 0, MINOR: 1, MODERATE: 2, MAJOR: 3, SEVERE: 4,
    };

    const risks: { riskId: string; title: string; likelihood: number; impact: number; score: number }[] = [];

    for (const scenario of scenarios) {
      const likelihoodIdx = likelihoodMap[scenario.likelihood || ''] ?? -1;
      const impactIdx = impactMap[scenario.impact || ''] ?? -1;

      if (likelihoodIdx >= 0 && impactIdx >= 0) {
        matrix[likelihoodIdx]![impactIdx]!++;
        risks.push({
          riskId: scenario.risk.riskId,
          title: scenario.risk.title,
          likelihood: likelihoodIdx + 1,
          impact: impactIdx + 1,
          score: scenario.residualScore || scenario.inherentScore || 0,
        });
      }
    }

    return { matrix, risks };
  }

  /**
   * Export treatment plan summary
   */
  async exportTreatmentSummary(organisationId?: string): Promise<{
    data: any[];
    summary: {
      total: number;
      byStatus: Record<string, number>;
      overdue: number;
      completedThisMonth: number;
    };
  }> {
    const plans = await this.prisma.treatmentPlan.findMany({
      where: organisationId ? { organisationId } : undefined,
      include: {
        risk: { select: { riskId: true, title: true } },
        riskOwner: { select: { firstName: true, lastName: true, email: true } },
        implementer: { select: { firstName: true, lastName: true, email: true } },
        actions: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const byStatus: Record<string, number> = {};
    let overdue = 0;
    let completedThisMonth = 0;

    const data = plans.map(plan => {
      byStatus[plan.status] = (byStatus[plan.status] || 0) + 1;

      if (plan.targetEndDate && plan.targetEndDate < now && 
          ['APPROVED', 'IN_PROGRESS'].includes(plan.status)) {
        overdue++;
      }

      if (plan.status === 'COMPLETED' && plan.actualEndDate && plan.actualEndDate >= startOfMonth) {
        completedThisMonth++;
      }

      const completedActions = plan.actions.filter(a => a.status === 'COMPLETED').length;

      return {
        treatmentId: plan.treatmentId,
        title: plan.title,
        riskId: plan.risk.riskId,
        riskTitle: plan.risk.title,
        type: plan.treatmentType,
        status: plan.status,
        priority: plan.priority,
        progress: plan.progressPercentage || 0,
        actionsTotal: plan.actions.length,
        actionsCompleted: completedActions,
        targetEndDate: plan.targetEndDate?.toISOString().split('T')[0] || '',
        riskOwner: plan.riskOwner 
          ? `${plan.riskOwner.firstName || ''} ${plan.riskOwner.lastName || ''}`.trim()
          : '',
        implementer: plan.implementer
          ? `${plan.implementer.firstName || ''} ${plan.implementer.lastName || ''}`.trim()
          : '',
      };
    });

    return {
      data,
      summary: {
        total: plans.length,
        byStatus,
        overdue,
        completedThisMonth,
      },
    };
  }

  /**
   * Export KRI dashboard data
   */
  async exportKRIDashboard(organisationId?: string): Promise<{
    kris: any[];
    summary: {
      total: number;
      byStatus: Record<string, number>;
      breached: number;
      approaching: number;
    };
  }> {
    const kris = await this.prisma.keyRiskIndicator.findMany({
      where: organisationId ? { risk: { organisationId } } : undefined,
      include: {
        risk: { select: { riskId: true, title: true } },
        history: {
          take: 5,
          orderBy: { measuredAt: 'desc' },
        },
      },
      orderBy: { kriId: 'asc' },
    });

    const byStatus: Record<string, number> = {};
    let breached = 0;
    let approaching = 0;

    const data = kris.map(kri => {
      const status = kri.status || 'NOT_MEASURED';
      byStatus[status] = (byStatus[status] || 0) + 1;

      if (status === 'RED') breached++;
      if (status === 'AMBER') approaching++;

      return {
        kriId: kri.kriId,
        name: kri.name,
        riskId: kri.risk.riskId,
        riskTitle: kri.risk.title,
        currentValue: kri.currentValue,
        status: kri.status,
        trend: kri.trend,
        thresholdGreen: kri.thresholdGreen,
        thresholdAmber: kri.thresholdAmber,
        thresholdRed: kri.thresholdRed,
        lastMeasured: kri.lastMeasured?.toISOString().split('T')[0] || '',
        frequency: kri.frequency,
        recentValues: kri.history.map(h => ({
          value: h.value,
          status: h.status,
          date: h.measuredAt.toISOString().split('T')[0],
        })),
      };
    });

    return {
      kris: data,
      summary: {
        total: kris.length,
        byStatus,
        breached,
        approaching,
      },
    };
  }

  /**
   * Convert array of objects to CSV string
   */
  private convertToCSV(data: Record<string, unknown>[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]!);
    const csvRows: string[] = [];

    // Header row
    csvRows.push(headers.join(','));

    // Data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma or quote
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}
