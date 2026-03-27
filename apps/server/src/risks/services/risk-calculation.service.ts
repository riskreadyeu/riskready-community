import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RiskEventBusService } from './risk-event-bus.service';
import { ToleranceEngineService } from './tolerance-engine.service';
import { CalculationTrigger, Prisma, LikelihoodLevel, ImpactLevel } from '@prisma/client';
import {
  LIKELIHOOD_VALUES,
  IMPACT_VALUES,
  mapEffectivenessScoreToStrength,
  CONTROL_EFFECTIVENESS,
  ControlStrength,
  valueToLikelihoodLevel,
  valueToImpactLevel,
} from '../utils/risk-scoring';

// ============================================
// RISK CALCULATION SERVICE
// Simple 5×5 Likelihood × Impact model
// Likelihood and Impact are manual enum inputs (1-5)
// Control effectiveness applies ONLY to residual calculation
// ============================================

// Risk zones
export type RiskZone = 'TERMINATE' | 'TREAT' | 'TOLERATE' | 'TRANSFER';

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
  likelihood: { level: string; value: number };
  impact: { level: string; value: number };
  controlEffectiveness: {
    controlCount: number;
    averageScore: number;
    strength: ControlStrength;
    likelihoodReduction: number;
    impactReduction: number;
  };
  inherentFormula: string;
  residualFormula: string;
  linkedEntities: {
    assets: string[];
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
   * Simple 5×5 model:
   * 1. Read likelihood and impact enum values directly
   * 2. inherentScore = likelihood × impact (1-25)
   * 3. Control effectiveness reduces residual scores
   * 4. residualScore = residualLikelihood × residualImpact
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

    // Read likelihood and impact directly from enum fields
    const likelihood = scenario.likelihood ? LIKELIHOOD_VALUES[scenario.likelihood] : 0;
    const impact = scenario.impact ? IMPACT_VALUES[scenario.impact] : 0;
    const inherentScore = likelihood * impact;

    // Compute residual scores via control effectiveness
    const controlEffectiveness = await this.calculateControlEffectiveness(scenario);
    const residualLikelihoodValue = this.applyControlReduction(likelihood, controlEffectiveness.likelihoodReduction);
    const residualImpactValue = this.applyControlReduction(impact, controlEffectiveness.impactReduction);
    const residualScore = residualLikelihoodValue * residualImpactValue;
    const zone = this.determineZone(residualScore);

    // Build trace and change tracking
    const calculationTrace = this.buildCalculationTrace(
      scenario, likelihood, impact,
      residualLikelihoodValue, residualImpactValue, controlEffectiveness,
    );
    const previousResidualScore = scenario.residualScore;
    const scoreChange = previousResidualScore !== null ? residualScore - previousResidualScore : null;

    // Persist results atomically
    await this.persistCalculationResults(scenarioId, {
      likelihood, impact, inherentScore,
      residualLikelihoodValue, residualImpactValue, residualScore,
      previousResidualScore, scoreChange,
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
      scenarioId, likelihood, impact, inherentScore,
      residualLikelihood: residualLikelihoodValue,
      residualImpact: residualImpactValue,
      residualScore,
      previousResidualScore, scoreChange, zone,
      controlEffectiveness, calculationTrace,
      calculatedAt: new Date(),
    };

    this.logger.log(
      `Calculated scenario ${scenarioId}: ` +
      `Inherent(L=${likelihood}, I=${impact}, S=${inherentScore}) -> ` +
      `Residual(L=${residualLikelihoodValue}, I=${residualImpactValue}, S=${residualScore}) ` +
      `[${controlEffectiveness.controlCount} controls, ${controlEffectiveness.overallStrength}] Zone=${zone}`,
    );

    return result;
  }

  /**
   * Persist scenario update and calculation history in a single transaction
   */
  private async persistCalculationResults(
    scenarioId: string,
    params: {
      likelihood: number;
      impact: number;
      inherentScore: number;
      residualLikelihoodValue: number;
      residualImpactValue: number;
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
      likelihood, impact, inherentScore, residualLikelihoodValue, residualImpactValue,
      residualScore, previousResidualScore, scoreChange,
      calculationTrace, trigger, triggerEntityId, userId,
    } = params;

    await this.prisma.$transaction(async (tx) => {
      await tx.riskScenario.update({
        where: { id: scenarioId },
        data: {
          inherentScore,
          calculatedResidualLikelihood: valueToLikelihoodLevel(residualLikelihoodValue),
          calculatedResidualImpact: valueToImpactLevel(residualImpactValue),
          calculatedResidualScore: residualScore,
          residualLikelihood: valueToLikelihoodLevel(residualLikelihoodValue),
          residualImpact: valueToImpactLevel(residualImpactValue),
          residualScore,
        },
      });

      await tx.riskCalculationHistory.create({
        data: {
          scenarioId,
          trigger,
          triggerEntityId,
          triggerDetails: `Calculated via ${trigger}`,
          calculatedById: userId,
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
  // PRIVATE HELPERS
  // ============================================

  private determineZone(score: number): RiskZone {
    if (score >= 20) return 'TERMINATE';
    if (score >= 12) return 'TREAT';
    if (score >= 6) return 'TOLERATE';
    return 'TRANSFER';
  }

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
    if (score === 0 || reduction === 0) return score;
    return Math.max(1, score - reduction);
  }

  private buildCalculationTrace(
    scenario: ScenarioWithLinks,
    likelihood: number,
    impact: number,
    residualLikelihood: number,
    residualImpact: number,
    controlEffectiveness: ControlEffectivenessResult,
  ): CalculationTrace {
    const { likelihoodReduction, impactReduction, overallStrength, controlCount, averageScore } = controlEffectiveness;

    return {
      likelihood: { level: scenario.likelihood ?? 'UNSET', value: likelihood },
      impact: { level: scenario.impact ?? 'UNSET', value: impact },
      controlEffectiveness: {
        controlCount,
        averageScore,
        strength: overallStrength,
        likelihoodReduction,
        impactReduction,
      },
      inherentFormula: `${likelihood} × ${impact} = ${likelihood * impact}`,
      residualFormula: controlCount > 0
        ? `L=${likelihood} - ${likelihoodReduction}(ctrl) = ${residualLikelihood}, I=${impact} - ${impactReduction}(ctrl) = ${residualImpact}, Score = ${residualLikelihood * residualImpact} [${controlCount} controls, ${averageScore}% avg, ${overallStrength} strength]`
        : `L=${residualLikelihood}, I=${residualImpact}, Score = ${residualLikelihood * residualImpact} [No controls linked]`,
      linkedEntities: {
        assets: scenario.assetLinks?.map((l) => l.asset.name) ?? [],
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
}

// Type for scenario with all linked entities
type ScenarioWithLinks = {
  id: string;
  riskId: string;
  title: string;
  likelihood?: LikelihoodLevel | null;
  impact?: ImpactLevel | null;
  inherentScore?: number | null;
  residualScore?: number | null;
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
