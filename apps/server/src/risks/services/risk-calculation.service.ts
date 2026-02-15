import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RiskEventBusService } from './risk-event-bus.service';
import { ToleranceEngineService } from './tolerance-engine.service';
import { CalculationTrigger, Prisma, LikelihoodLevel, ImpactLevel } from '@prisma/client';
import {
  mapEffectivenessScoreToStrength,
  CONTROL_EFFECTIVENESS,
  ControlStrength,
} from '../utils/risk-scoring';

// ============================================
// RISK CALCULATION SERVICE
// Simplified 5×5 Likelihood × Impact model
// Factors are manual 1-5 inputs; impact uses BIRT weighted average
// Control effectiveness applies ONLY to residual calculation
// ============================================

// Factor score ranges
const FACTOR_MIN = 1;
const FACTOR_MAX = 5;

// Risk zones
export type RiskZone = 'TERMINATE' | 'TREAT' | 'TOLERATE' | 'TRANSFER';

/**
 * Factor scores for inherent likelihood calculation
 * All factors are manual 1-5 inputs.
 * Likelihood = average(F1, F2, F3) rounded to nearest integer.
 */
export interface FactorScores {
  f1ThreatFrequency: number;
  f2ControlEffectiveness: number;
  f3GapVulnerability: number;
  f4IncidentHistory: number;
  f5AttackSurface: number;
  f6Environmental: number;
}

export interface ImpactScores {
  i1Financial: number;
  i2Operational: number;
  i3Regulatory: number;
  i4Reputational: number;
  i5Strategic: number;
}

export interface ControlEffectivenessResult {
  controlCount: number;
  averageScore: number;
  overallStrength: ControlStrength;
  likelihoodReduction: number;
  impactReduction: number;
  appliedToResidual: boolean;
}

export interface CalculationResult {
  scenarioId: string;
  factors: FactorScores;
  impacts: ImpactScores;
  likelihood: number;
  impact: number;
  inherentScore: number;
  residualLikelihood: number;
  residualImpact: number;
  residualScore: number;
  previousResidualScore: number | null;
  scoreChange: number | null;
  zone: RiskZone;
  controlEffectiveness: ControlEffectivenessResult;
  calculationTrace: CalculationTrace;
  calculatedAt: Date;
}

export interface CalculationTrace {
  factorContributions: Record<string, { raw: number; weighted: number; sources: string[] }>;
  impactContributions: Record<string, { value: number; sources: string[] }>;
  controlEffectiveness: {
    controlCount: number;
    averageScore: number;
    strength: ControlStrength;
    likelihoodReduction: number;
    impactReduction: number;
  };
  likelihoodFormula: string;
  impactFormula: string;
  residualFormula: string;
  scoreFormula: string;
  linkedEntities: {
    assets: string[];
    vendors: string[];
    applications: string[];
    controls: string[];
  };
}

export interface BulkCalculationResult {
  riskId: string;
  scenariosCalculated: number;
  highestResidualScore: number;
  zone: RiskZone;
  results: CalculationResult[];
}

@Injectable()
export class RiskCalculationService {
  private readonly logger = new Logger(RiskCalculationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: RiskEventBusService,
    private readonly toleranceEngine: ToleranceEngineService,
  ) { }

  /**
   * Calculate risk scores for a single scenario
   *
   * Simplified model:
   * 1. Read stored factor scores (f1-f3) as manual 1-5 inputs
   * 2. Likelihood = average(f1, f2, f3) rounded to nearest integer
   * 3. Impact = max of BIRT category scores (or stored weightedImpact)
   * 4. inherentScore = likelihood × impact
   * 5. Control effectiveness reduces residual scores
   * 6. residualScore = residualLikelihood × residualImpact
   */
  async calculateScenario(
    scenarioId: string,
    trigger: CalculationTrigger = 'MANUAL',
    triggerEntityId?: string,
    userId?: string,
  ): Promise<CalculationResult> {
    const scenario = await this.prisma.riskScenario.findUnique({
      where: { id: scenarioId },
      include: {
        risk: true,
        assetLinks: {
          include: { asset: true },
        },
        controlLinks: {
          include: {
            control: true,
          },
        },
      },
    });

    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    // Extract stored scores
    const factors = this.extractFactorScores(scenario);
    const impacts = this.extractImpactScores(scenario);

    // Compute inherent scores
    const likelihood = this.calculateLikelihood(factors);
    const rawImpact = this.calculateImpact(impacts);
    const impact = scenario.weightedImpact ?? rawImpact;
    const inherentScore = Math.round(likelihood * impact);

    // Compute residual scores via control effectiveness
    const controlEffectiveness = await this.calculateControlEffectiveness(scenario);
    const residualLikelihood = this.applyControlReduction(likelihood, controlEffectiveness.likelihoodReduction);
    const residualImpact = this.applyControlReduction(impact, controlEffectiveness.impactReduction);
    const residualScore = Math.round(residualLikelihood * residualImpact * 10) / 10;
    const zone = this.determineZone(residualScore);

    // Build trace and change tracking
    const calculationTrace = this.buildCalculationTrace(
      scenario, factors, impacts, likelihood, impact,
      residualLikelihood, residualImpact, controlEffectiveness,
    );
    const previousResidualScore = scenario.residualScore;
    const scoreChange = previousResidualScore !== null ? residualScore - previousResidualScore : null;

    // Persist results atomically
    await this.persistCalculationResults(scenarioId, {
      factors, impacts, likelihood, impact, inherentScore,
      residualScore, previousResidualScore, scoreChange,
      calculationTrace, trigger, triggerEntityId, userId,
    });

    // Emit events
    await this.eventBus.emitScenarioCalculated(
      scenario.riskId, scenarioId,
      { residualScore, zone, scoreChange },
      trigger, userId,
    );
    if (scoreChange && scoreChange >= 4) {
      await this.createScoreIncreaseAlert(scenario.riskId, scenario.title, previousResidualScore!, residualScore);
    }

    const result: CalculationResult = {
      scenarioId, factors, impacts, likelihood, impact, inherentScore,
      residualLikelihood, residualImpact, residualScore,
      previousResidualScore, scoreChange, zone,
      controlEffectiveness, calculationTrace,
      calculatedAt: new Date(),
    };

    this.logger.log(
      `Calculated scenario ${scenarioId}: ` +
      `Inherent(L=${likelihood}, I=${impact}, S=${inherentScore}) -> ` +
      `Residual(L=${residualLikelihood}, I=${residualImpact}, S=${residualScore}) ` +
      `[${controlEffectiveness.controlCount} controls, ${controlEffectiveness.overallStrength}] Zone=${zone}`,
    );

    return result;
  }

  /**
   * Extract and clamp F1-F6 factor scores from a scenario record
   */
  private extractFactorScores(scenario: ScenarioWithLinks): FactorScores {
    return {
      f1ThreatFrequency: this.clampFactor(scenario.f1ThreatFrequency ?? 3),
      f2ControlEffectiveness: this.clampFactor(scenario.f2ControlEffectiveness ?? 3),
      f3GapVulnerability: this.clampFactor(scenario.f3GapVulnerability ?? 3),
      f4IncidentHistory: this.clampFactor(scenario.f4IncidentHistory ?? 3),
      f5AttackSurface: this.clampFactor(scenario.f5AttackSurface ?? 3),
      f6Environmental: this.clampFactor(scenario.f6Environmental ?? 3),
    };
  }

  /**
   * Extract I1-I5 impact scores from a scenario record
   */
  private extractImpactScores(scenario: ScenarioWithLinks): ImpactScores {
    return {
      i1Financial: scenario.i1Financial ?? 1,
      i2Operational: scenario.i2Operational ?? 1,
      i3Regulatory: scenario.i3Regulatory ?? 1,
      i4Reputational: scenario.i4Reputational ?? 1,
      i5Strategic: scenario.i5Strategic ?? 1,
    };
  }

  /**
   * Persist scenario update and calculation history in a single transaction
   */
  private async persistCalculationResults(
    scenarioId: string,
    params: {
      factors: FactorScores;
      impacts: ImpactScores;
      likelihood: number;
      impact: number;
      inherentScore: number;
      residualScore: number;
      previousResidualScore: number | null;
      scoreChange: number | null;
      calculationTrace: CalculationTrace;
      trigger: CalculationTrigger;
      triggerEntityId?: string;
      userId?: string;
    },
  ): Promise<void> {
    const {
      factors, impacts, likelihood, impact, inherentScore, residualScore,
      previousResidualScore, scoreChange, calculationTrace, trigger, triggerEntityId, userId,
    } = params;

    await this.prisma.$transaction(async (tx) => {
      this.logger.debug(`Syncing Score ${likelihood} to Enum ${this.mapScoreToLikelihood(likelihood)}`);

      await tx.riskScenario.update({
        where: { id: scenarioId },
        data: {
          f6Environmental: factors.f6Environmental,
          i1Financial: impacts.i1Financial,
          i2Operational: impacts.i2Operational,
          i3Regulatory: impacts.i3Regulatory,
          i4Reputational: impacts.i4Reputational,
          i5Strategic: impacts.i5Strategic,
          likelihood: this.mapScoreToLikelihood(likelihood),
          impact: this.mapScoreToImpact(impact),
          calculatedLikelihood: likelihood,
          calculatedImpact: impact,
          inherentScore,
          residualScore,
          lastCalculatedAt: new Date(),
          lastCalculatedById: userId,
          calculationTrigger: trigger,
          calculationTrace: calculationTrace as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.riskCalculationHistory.create({
        data: {
          scenarioId,
          trigger,
          triggerEntityId,
          triggerDetails: `Calculated via ${trigger}`,
          calculatedById: userId,
          ...factors,
          ...impacts,
          likelihood,
          impact,
          inherentScore,
          residualScore,
          previousResidualScore,
          scoreChange,
          calculationTrace: calculationTrace as unknown as Prisma.InputJsonValue,
        },
      });
    });
  }

  /**
   * Calculate all scenarios for a risk
   */
  async calculateRisk(
    riskId: string,
    trigger: CalculationTrigger = 'MANUAL',
    userId?: string,
  ): Promise<BulkCalculationResult> {
    const scenarios = await this.prisma.riskScenario.findMany({
      where: { riskId },
      select: { id: true },
    });

    const results: CalculationResult[] = [];

    for (const scenario of scenarios) {
      try {
        const result = await this.calculateScenario(scenario.id, trigger, undefined, userId);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to calculate scenario ${scenario.id}: ${(error as Error).message}`);
      }
    }

    const highestResidualScore = results.length > 0
      ? Math.max(...results.map((r) => r.residualScore))
      : 0;

    const zone = this.determineZone(highestResidualScore);

    await this.prisma.risk.update({
      where: { id: riskId },
      data: {
        residualScore: highestResidualScore,
        updatedAt: new Date(),
      },
    });

    await this.toleranceEngine.evaluateRisk(riskId, userId);

    return {
      riskId,
      scenariosCalculated: results.length,
      highestResidualScore,
      zone,
      results,
    };
  }

  /**
   * Recalculate all risks affected by a control change
   */
  async recalculateForControl(controlId: string, userId?: string): Promise<void> {
    const scenarioLinks = await this.prisma.riskScenarioControl.findMany({
      where: { controlId },
      select: { scenarioId: true },
    });

    for (const link of scenarioLinks) {
      await this.calculateScenario(link.scenarioId, 'CONTROL_TESTED', controlId, userId);
    }

    this.logger.log(`Recalculated ${scenarioLinks.length} scenarios for control ${controlId}`);
  }

  /**
   * Recalculate all risks affected by an asset change
   */
  async recalculateForAsset(assetId: string, userId?: string): Promise<void> {
    const scenarioLinks = await this.prisma.riskScenarioAsset.findMany({
      where: { assetId },
      select: { scenarioId: true },
    });

    for (const link of scenarioLinks) {
      await this.calculateScenario(link.scenarioId, 'ASSET_UPDATED', assetId, userId);
    }

    this.logger.log(`Recalculated ${scenarioLinks.length} scenarios for asset ${assetId}`);
  }

  /**
   * Recalculate all risks affected by a vendor assessment
   */
  async recalculateForVendor(vendorId: string, userId?: string): Promise<void> {
    this.logger.log(`recalculateForVendor called for vendor ${vendorId} — no-op (vendor links not available)`);
  }

  /**
   * Get calculation history for a scenario
   */
  async getCalculationHistory(scenarioId: string, limit: number = 20) {
    return this.prisma.riskCalculationHistory.findMany({
      where: { scenarioId },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
      include: {
        calculatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  // ============================================
  // AGGREGATE CALCULATIONS
  // ============================================

  /**
   * Calculate likelihood = average(F1, F2, F3) rounded to 1 decimal place
   */
  private calculateLikelihood(factors: FactorScores): number {
    const avg = (factors.f1ThreatFrequency + factors.f2ControlEffectiveness + factors.f3GapVulnerability) / 3;
    return Math.round(avg * 10) / 10;
  }

  private calculateImpact(impacts: ImpactScores): number {
    return Math.max(
      impacts.i1Financial,
      impacts.i2Operational,
      impacts.i3Regulatory,
      impacts.i4Reputational,
      impacts.i5Strategic,
    );
  }

  private determineZone(score: number): RiskZone {
    if (score >= 20) return 'TERMINATE';
    if (score >= 12) return 'TREAT';
    if (score >= 6) return 'TOLERATE';
    return 'TRANSFER';
  }

  // ============================================
  // CONTROL EFFECTIVENESS CALCULATION
  // ============================================

  /**
   * Calculate control effectiveness from linked controls
   * Returns aggregated strength that determines likelihood/impact reduction
   */
  private async calculateControlEffectiveness(
    scenario: ScenarioWithLinks,
  ): Promise<ControlEffectivenessResult> {
    const controlLinks = scenario.controlLinks ?? [];

    if (controlLinks.length === 0) {
      return {
        controlCount: 0,
        averageScore: 0,
        overallStrength: 'NONE',
        likelihoodReduction: 0,
        impactReduction: 0,
        appliedToResidual: false,
      };
    }

    let totalScore = 0;
    let validControls = 0;

    for (const link of controlLinks) {
      const control = link.control;

      const status = control.implementationStatus;
      if (status === 'IMPLEMENTED') {
        totalScore += 100;
        validControls++;
      } else if (status === 'PARTIAL') {
        totalScore += 50;
        validControls++;
      } else if (status === 'NOT_STARTED') {
        validControls++;
      }
    }

    if (validControls === 0) {
      return {
        controlCount: controlLinks.length,
        averageScore: 0,
        overallStrength: 'NONE',
        likelihoodReduction: 0,
        impactReduction: 0,
        appliedToResidual: false,
      };
    }

    const averageScore = Math.round(totalScore / validControls);
    const overallStrength = mapEffectivenessScoreToStrength(averageScore);

    const effectivenessConfig = CONTROL_EFFECTIVENESS[overallStrength];

    return {
      controlCount: controlLinks.length,
      averageScore,
      overallStrength,
      likelihoodReduction: effectivenessConfig.likelihoodReduction,
      impactReduction: effectivenessConfig.impactReduction,
      appliedToResidual: true,
    };
  }

  /**
   * Apply control reduction to a score, clamped to minimum 1
   */
  private applyControlReduction(score: number, reduction: number): number {
    if (reduction === 0) return score;
    const reduced = score - reduction;
    return Math.max(1, Math.round(reduced * 10) / 10);
  }

  // ============================================
  // HELPERS
  // ============================================

  private clampFactor(value: number): number {
    return Math.max(FACTOR_MIN, Math.min(FACTOR_MAX, Math.round(value)));
  }

  private buildCalculationTrace(
    scenario: ScenarioWithLinks,
    factors: FactorScores,
    impacts: ImpactScores,
    likelihood: number,
    impact: number,
    residualLikelihood: number,
    residualImpact: number,
    controlEffectiveness: ControlEffectivenessResult,
  ): CalculationTrace {
    const { likelihoodReduction, impactReduction, overallStrength, controlCount, averageScore } = controlEffectiveness;

    return {
      factorContributions: {
        F1: { raw: factors.f1ThreatFrequency, weighted: factors.f1ThreatFrequency, sources: ['manual_input'] },
        F2: { raw: factors.f2ControlEffectiveness, weighted: factors.f2ControlEffectiveness, sources: ['manual_input'] },
        F3: { raw: factors.f3GapVulnerability, weighted: factors.f3GapVulnerability, sources: ['manual_input'] },
        F4: { raw: factors.f4IncidentHistory, weighted: 0, sources: ['informational'] },
        F5: { raw: factors.f5AttackSurface, weighted: 0, sources: ['informational'] },
        F6: { raw: factors.f6Environmental, weighted: 0, sources: ['informational'] },
      },
      impactContributions: {
        I1: { value: impacts.i1Financial, sources: ['manual_input'] },
        I2: { value: impacts.i2Operational, sources: ['manual_input'] },
        I3: { value: impacts.i3Regulatory, sources: ['manual_input'] },
        I4: { value: impacts.i4Reputational, sources: ['manual_input'] },
        I5: { value: impacts.i5Strategic, sources: ['manual_input'] },
      },
      controlEffectiveness: {
        controlCount,
        averageScore,
        strength: overallStrength,
        likelihoodReduction,
        impactReduction,
      },
      likelihoodFormula: `avg(F1, F2, F3) = avg(${factors.f1ThreatFrequency}, ${factors.f2ControlEffectiveness}, ${factors.f3GapVulnerability}) = ${likelihood}`,
      impactFormula: `max(I1, I2, I3, I4, I5) = ${impact}`,
      residualFormula: controlCount > 0
        ? `RESIDUAL: L=${likelihood} - ${likelihoodReduction}(ctrl) = ${residualLikelihood}, I=${impact} - ${impactReduction}(ctrl) = ${residualImpact} [${controlCount} controls, ${averageScore}% avg, ${overallStrength} strength]`
        : `RESIDUAL: L=${residualLikelihood}, I=${residualImpact} [No controls linked]`,
      scoreFormula: `Inherent = ${likelihood} × ${impact} = ${Math.round(likelihood * impact)}, Residual = ${residualLikelihood} × ${residualImpact} = ${Math.round(residualLikelihood * residualImpact * 10) / 10}`,
      linkedEntities: {
        assets: scenario.assetLinks?.map((l) => l.asset.name) ?? [],
        vendors: [],
        applications: [],
        controls: scenario.controlLinks?.map((l) => l.control.name) ?? [],
      },
    };
  }

  private async createScoreIncreaseAlert(
    riskId: string,
    scenarioName: string,
    previousScore: number,
    newScore: number,
  ): Promise<void> {
    // No-op in community edition
  }

  private mapScoreToLikelihood(score: number): LikelihoodLevel {
    if (score >= 4.5) return 'ALMOST_CERTAIN';
    if (score >= 3.5) return 'LIKELY';
    if (score >= 2.5) return 'POSSIBLE';
    if (score >= 1.5) return 'UNLIKELY';
    return 'RARE';
  }

  private mapScoreToImpact(score: number): ImpactLevel {
    if (score >= 4.5) return 'SEVERE';
    if (score >= 3.5) return 'MAJOR';
    if (score >= 2.5) return 'MODERATE';
    if (score >= 1.5) return 'MINOR';
    return 'NEGLIGIBLE';
  }

}

// Type for scenario with all linked entities
type ScenarioWithLinks = {
  id: string;
  riskId: string;
  title: string;
  threatType?: string | null;
  inherentScore?: number | null;
  residualScore?: number | null;
  weightedImpact?: number | null;
  f1ThreatFrequency?: number | null;
  f2ControlEffectiveness?: number | null;
  f3GapVulnerability?: number | null;
  f4IncidentHistory?: number | null;
  f5AttackSurface?: number | null;
  f6Environmental?: number | null;
  i1Financial?: number | null;
  i2Operational?: number | null;
  i3Regulatory?: number | null;
  i4Reputational?: number | null;
  i5Strategic?: number | null;
  risk?: {
    id: string;
    title: string;
    riskId?: string | null;
    organisationId?: string | null;
  };
  assetLinks?: Array<{
    asset: {
      name: string;
    };
  }>;
  controlLinks?: Array<{
    effectivenessWeight?: number | null;
    control: {
      name: string;
      implementationStatus?: string | null;
    };
  }>;
};
