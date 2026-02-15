import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ============================================
// TOLERANCE ENGINE SERVICE
// Evaluates risks against Risk Tolerance Statements
// Generates alerts when thresholds are exceeded
// ============================================

export interface ToleranceResult {
  status: 'WITHIN' | 'EXCEEDS' | 'NO_RTS_LINKED';
  riskId: string;
  riskTitle: string;
  riskScore: number;
  toleranceThreshold: number | null;
  gap: number | null;
  rtsId: string | null;
  rtsName: string | null;
  recommendedActions: string[];
  evaluatedAt: Date;
}

export interface BulkToleranceResult {
  organisationId: string;
  totalRisks: number;
  withinTolerance: number;
  exceedsTolerance: number;
  noRtsLinked: number;
  results: ToleranceResult[];
  evaluatedAt: Date;
}

@Injectable()
export class ToleranceEngineService {
  private readonly logger = new Logger(ToleranceEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluate a single risk against its linked RTS
   */
  async evaluateRisk(riskId: string, userId?: string): Promise<ToleranceResult> {
    const risk = await this.prisma.risk.findUnique({
      where: { id: riskId },
      include: {
        toleranceStatements: { take: 1 },
        scenarios: {
          where: { status: { notIn: ['CLOSED', 'ARCHIVED'] } },
          orderBy: { residualScore: 'desc' },
          take: 1,
        },
      },
    });

    if (!risk) {
      throw new Error(`Risk not found: ${riskId}`);
    }

    // Get the highest residual score from active scenarios
    const riskScore = risk.scenarios[0]?.residualScore ?? risk.residualScore ?? 0;

    // Check if RTS is linked
    const rts = risk.toleranceStatements?.[0];
    if (!rts) {
      const result: ToleranceResult = {
        status: 'NO_RTS_LINKED',
        riskId: risk.id,
        riskTitle: risk.title,
        riskScore,
        toleranceThreshold: null,
        gap: null,
        rtsId: null,
        rtsName: null,
        recommendedActions: ['Link this risk to a Risk Tolerance Statement to enable tolerance monitoring'],
        evaluatedAt: new Date(),
      };

      // Store evaluation
      await this.storeEvaluation(result, userId);
      return result;
    }

    // Get tolerance threshold from RTS
    const toleranceThreshold = this.getToleranceThreshold(rts);
    const gap = riskScore - toleranceThreshold;
    const exceeds = gap > 0;

    const result: ToleranceResult = {
      status: exceeds ? 'EXCEEDS' : 'WITHIN',
      riskId: risk.id,
      riskTitle: risk.title,
      riskScore,
      toleranceThreshold,
      gap: exceeds ? gap : null,
      rtsId: rts.id,
      rtsName: rts.title,
      recommendedActions: exceeds ? this.generateRecommendations(risk, gap) : [],
      evaluatedAt: new Date(),
    };

    // Store evaluation
    await this.storeEvaluation(result, userId);

    // Create alert if exceeds tolerance
    if (exceeds) {
      await this.createToleranceAlert(risk, result);
    }

    return result;
  }

  /**
   * Evaluate all risks for an organisation
   */
  async evaluateAllRisks(organisationId: string, userId?: string): Promise<BulkToleranceResult> {
    const risks = await this.prisma.risk.findMany({
      where: { organisationId },
      select: { id: true },
    });

    const results: ToleranceResult[] = [];
    let withinTolerance = 0;
    let exceedsTolerance = 0;
    let noRtsLinked = 0;

    for (const risk of risks) {
      try {
        const result = await this.evaluateRisk(risk.id, userId);
        results.push(result);

        switch (result.status) {
          case 'WITHIN':
            withinTolerance++;
            break;
          case 'EXCEEDS':
            exceedsTolerance++;
            break;
          case 'NO_RTS_LINKED':
            noRtsLinked++;
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to evaluate risk ${risk.id}: ${(error as Error).message}`);
      }
    }

    return {
      organisationId,
      totalRisks: risks.length,
      withinTolerance,
      exceedsTolerance,
      noRtsLinked,
      results,
      evaluatedAt: new Date(),
    };
  }

  /**
   * Get all risks that exceed their tolerance threshold
   */
  async getExceedingRisks(organisationId: string): Promise<ToleranceResult[]> {
    const evaluations = await this.prisma.toleranceEvaluation.findMany({
      where: {
        risk: { organisationId },
        status: 'EXCEEDS',
        isStale: false,
      },
      include: {
        risk: true,
        rts: true,
      },
      orderBy: { gap: 'desc' },
    });

    return evaluations.map((eval_) => ({
      status: 'EXCEEDS' as const,
      riskId: eval_.riskId,
      riskTitle: eval_.risk.title,
      riskScore: eval_.riskScore,
      toleranceThreshold: eval_.toleranceThreshold,
      gap: eval_.gap,
      rtsId: eval_.rtsId,
      rtsName: eval_.rts?.title ?? null,
      recommendedActions: eval_.recommendedActions as string[],
      evaluatedAt: eval_.evaluatedAt,
    }));
  }

  /**
   * Mark all evaluations for a risk as stale (e.g., when risk score changes)
   */
  async markEvaluationsStale(riskId: string): Promise<void> {
    await this.prisma.toleranceEvaluation.updateMany({
      where: { riskId, isStale: false },
      data: { isStale: true },
    });
  }

  /**
   * Get tolerance statistics for dashboard
   */
  async getToleranceStats(organisationId: string): Promise<{
    totalRisks: number;
    withinTolerance: number;
    exceedsTolerance: number;
    noRtsLinked: number;
    averageGap: number | null;
    maxGap: number | null;
  }> {
    const evaluations = await this.prisma.toleranceEvaluation.findMany({
      where: {
        risk: { organisationId },
        isStale: false,
      },
      select: {
        status: true,
        gap: true,
      },
    });

    const totalRisks = evaluations.length;
    const withinTolerance = evaluations.filter((e) => e.status === 'WITHIN').length;
    const exceedsTolerance = evaluations.filter((e) => e.status === 'EXCEEDS').length;
    const noRtsLinked = evaluations.filter((e) => e.status === 'NO_RTS_LINKED').length;

    const gaps = evaluations.filter((e) => e.gap !== null).map((e) => e.gap!);
    const averageGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
    const maxGap = gaps.length > 0 ? Math.max(...gaps) : null;

    return {
      totalRisks,
      withinTolerance,
      exceedsTolerance,
      noRtsLinked,
      averageGap,
      maxGap,
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private getToleranceThreshold(rts: { proposedToleranceLevel?: string | null }): number {
    // Derive threshold from proposedToleranceLevel
    switch (rts.proposedToleranceLevel) {
      case 'VERY_LOW':
        return 5; // Only accept very low risks
      case 'LOW':
        return 8;
      case 'MEDIUM':
        return 12;
      case 'HIGH':
        return 16;
      case 'VERY_HIGH':
        return 20;
      default:
        return 12; // Default to medium tolerance
    }
  }

  private generateRecommendations(risk: { title: string; status?: string | null }, gap: number): string[] {
    const recommendations: string[] = [];

    if (gap > 8) {
      recommendations.push('CRITICAL: Risk significantly exceeds tolerance. Immediate escalation required.');
      recommendations.push('Consider implementing additional controls or transferring risk.');
    } else if (gap > 4) {
      recommendations.push('HIGH PRIORITY: Develop treatment plan to reduce risk score.');
      recommendations.push('Review and strengthen existing controls.');
    } else {
      recommendations.push('Monitor closely and implement incremental improvements.');
    }

    if (risk.status === 'IDENTIFIED' || risk.status === 'OPEN') {
      recommendations.push('Move risk to UNDER_ASSESSMENT to begin formal treatment planning.');
    }

    recommendations.push('Schedule review meeting with risk owner and stakeholders.');

    return recommendations;
  }

  private async storeEvaluation(result: ToleranceResult, userId?: string): Promise<void> {
    // Mark previous evaluations as stale
    await this.markEvaluationsStale(result.riskId);

    // Create new evaluation record
    await this.prisma.toleranceEvaluation.create({
      data: {
        riskId: result.riskId,
        rtsId: result.rtsId,
        status: result.status,
        riskScore: result.riskScore,
        toleranceThreshold: result.toleranceThreshold,
        gap: result.gap,
        recommendedActions: result.recommendedActions,
        evaluatedAt: result.evaluatedAt,
        evaluatedById: userId,
        isStale: false,
      },
    });
  }

  private async createToleranceAlert(
    risk: { id: string; title: string },
    result: ToleranceResult,
  ): Promise<void> {
    // RiskAlert model removed in community edition — no-op
  }

  private formatAlertMessage(result: ToleranceResult): string {
    return `Risk score (${result.riskScore}) exceeds tolerance threshold (${result.toleranceThreshold}) by ${result.gap} points. ` +
      `Linked RTS: ${result.rtsName ?? 'Unknown'}. ` +
      `Recommended actions: ${result.recommendedActions.slice(0, 2).join('; ')}`;
  }

  private getAlertSeverity(gap: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (gap > 8) return 'CRITICAL';
    if (gap > 4) return 'HIGH';
    if (gap > 2) return 'MEDIUM';
    return 'LOW';
  }
}
