import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  aggregateControlEffectiveness,
  calculateResidualFromControlEffectiveness,
  AggregatedControlEffectiveness,
  ControlStrength,
  mapEffectivenessScoreToStrength,
  valueToLikelihoodLevel,
  valueToImpactLevel,
} from '../utils/risk-scoring';
import { LikelihoodLevel, ImpactLevel } from '@prisma/client';

/**
 * Control-Risk Integration Service
 * 
 * Connects the Control Module's effectiveness testing with the Risk Module's
 * residual risk calculation. This enables automatic residual score calculation
 * based on the effectiveness of linked controls.
 */
@Injectable()
export class ControlRiskIntegrationService {
  private readonly logger = new Logger(ControlRiskIntegrationService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate control effectiveness for a single control
   * Uses AssessmentTest results from the latest completed assessment
   *
   * Scores: PASS=100%, PARTIAL=50%, FAIL=0%
   */
  async calculateControlEffectiveness(controlId: string): Promise<{
    score: number;
    rating: string;
    passCount: number;
    partialCount: number;
    failCount: number;
    notTestedCount: number;
    totalLayers: number;
  }> {
    // ControlLayer removed in community edition — return fixed "not assessed"
    return {
      score: 0,
      rating: 'Not Assessed',
      passCount: 0,
      partialCount: 0,
      failCount: 0,
      notTestedCount: 0,
      totalLayers: 0,
    };
  }

  /**
   * Get aggregated control effectiveness for a risk
   *
   * @deprecated Use getControlEffectivenessForScenario instead.
   * Control linking is now at the scenario level (RiskScenarioControl).
   * Risk-level control linking has been removed.
   *
   * @param riskId - The risk ID (no longer used)
   * @returns Empty result - controls are now linked at scenario level
   */
  async getControlEffectivenessForRisk(
    riskId: string
  ): Promise<AggregatedControlEffectiveness> {
    // DEPRECATED: Risk-level control linking has been removed.
    // Controls should be linked at the scenario level using RiskScenarioControl.
    // This method now returns empty results. Use getControlEffectivenessForScenario instead.
    this.logger.warn(
      `[DEPRECATED] getControlEffectivenessForRisk called for risk ${riskId}. ` +
      `Risk-level control linking has been removed. Use getControlEffectivenessForScenario instead.`
    );

    return {
      controlCount: 0,
      averageScore: 0,
      overallStrength: 'NONE',
      preventiveStrength: 'NONE',
      detectiveStrength: 'NONE',
      controlDetails: [],
    };
  }

  /**
   * Get aggregated control effectiveness for a risk scenario
   * Uses the scenario's own linked controls (via RiskScenarioControl junction table)
   *
   * @param scenarioId - The scenario ID
   * @returns Aggregated effectiveness of scenario's directly linked controls
   */
  async getControlEffectivenessForScenario(
    scenarioId: string
  ): Promise<AggregatedControlEffectiveness> {
    // Get scenario's directly linked controls via RiskScenarioControl junction table
    const controlLinks = await this.prisma.riskScenarioControl.findMany({
      where: { scenarioId },
      include: {
        control: {
          select: {
            id: true,
            controlId: true,
            name: true,
          },
        },
      },
    });

    if (controlLinks.length === 0) {
      return {
        controlCount: 0,
        averageScore: 0,
        overallStrength: 'NONE',
        preventiveStrength: 'NONE',
        detectiveStrength: 'NONE',
        controlDetails: [],
      };
    }

    // Calculate effectiveness for each linked control, applying effectiveness weights
    const controlEffectiveness = await Promise.all(
      controlLinks.map(async (link) => {
        const effectiveness = await this.calculateControlEffectiveness(link.control.id);
        // Apply effectiveness weight from the link (0-100)
        const weightedScore = Math.round((effectiveness.score * link.effectivenessWeight) / 100);
        return {
          controlId: link.control.controlId,
          controlName: link.control.name,
          score: weightedScore,
          rating: effectiveness.rating,
          effectivenessWeight: link.effectivenessWeight,
          isPrimaryControl: link.isPrimaryControl,
        };
      })
    );

    return aggregateControlEffectiveness(controlEffectiveness);
  }

  /**
   * Calculate and update residual scores for a risk scenario based on linked controls
   * 
   * @param scenarioId - The scenario ID to update
   * @param userId - User performing the update (for audit trail)
   * @returns Updated scenario with residual scores
   */
  async calculateResidualFromControls(
    scenarioId: string,
    userId?: string
  ): Promise<{
    scenarioId: string;
    inherentScore: number;
    residualScore: number;
    residualLikelihood: LikelihoodLevel | null;
    residualImpact: ImpactLevel | null;
    riskReduction: number;
    controlEffectiveness: AggregatedControlEffectiveness;
  }> {
    const scenario = await this.prisma.riskScenario.findUnique({
      where: { id: scenarioId },
      select: {
        id: true,
        likelihood: true,
        impact: true,
        inherentScore: true,
        riskId: true,
      },
    });

    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const effectiveImpact = scenario.impact;

    // Get control effectiveness from scenario's directly linked controls
    const controlEffectiveness = await this.getControlEffectivenessForScenario(
      scenarioId
    );

    // Calculate residual using the effective impact
    const residualResult = calculateResidualFromControlEffectiveness(
      scenario.likelihood,
      effectiveImpact,
      controlEffectiveness
    );

    // Update scenario with calculated residual values
    // Also update the actual residual fields since user clicked auto-calculate
    await this.prisma.riskScenario.update({
      where: { id: scenarioId },
      data: {
        // Store calculated values for reference
        calculatedResidualLikelihood: residualResult.residualLikelihood,
        calculatedResidualImpact: residualResult.residualImpact,
        calculatedResidualScore: residualResult.residualScore,
        // Also update actual residual fields (auto-calculate sets these)
        residualLikelihood: residualResult.residualLikelihood,
        residualImpact: residualResult.residualImpact,
        residualScore: residualResult.residualScore,
        // Mark as not overridden since we just auto-calculated
        residualOverridden: false,
        residualOverrideJustification: null,
        updatedById: userId,
      },
    });

    // Recalculate parent risk scores
    await this.recalculateParentRiskScores(scenario.riskId, userId);

    return {
      scenarioId,
      inherentScore: residualResult.inherentScore,
      residualScore: residualResult.residualScore,
      residualLikelihood: residualResult.residualLikelihood,
      residualImpact: residualResult.residualImpact,
      riskReduction: residualResult.riskReduction,
      controlEffectiveness,
    };
  }

  /**
   * Recalculate all scenario residuals for a risk based on controls
   *
   * @deprecated This method uses the deprecated getControlEffectivenessForRisk internally.
   * Prefer calling calculateResidualFromControls per scenario instead.
   *
   * @param riskId - The risk ID
   * @param userId - User performing the update
   * @returns Updated scenarios
   */
  async recalculateAllScenarioResiduals(
    riskId: string,
    userId?: string
  ): Promise<{
    riskId: string;
    updatedScenarios: number;
    controlEffectiveness: AggregatedControlEffectiveness;
    newRiskScore: { inherent: number; residual: number };
  }> {
    // Get all scenarios for this risk
    const scenarios = await this.prisma.riskScenario.findMany({
      where: { riskId },
      select: { id: true },
    });

    // Get control effectiveness once
    const controlEffectiveness = await this.getControlEffectivenessForRisk(riskId);

    // Update each scenario
    for (const scenario of scenarios) {
      await this.calculateResidualFromControls(scenario.id, userId);
    }

    // Get updated risk scores
    const risk = await this.prisma.risk.findUnique({
      where: { id: riskId },
      select: { inherentScore: true, residualScore: true },
    });

    return {
      riskId,
      updatedScenarios: scenarios.length,
      controlEffectiveness,
      newRiskScore: {
        inherent: risk?.inherentScore || 0,
        residual: risk?.residualScore || 0,
      },
    };
  }

  /**
   * Recalculate parent risk scores from scenarios (MAX aggregation)
   */
  private async recalculateParentRiskScores(
    riskId: string,
    userId?: string
  ): Promise<void> {
    const scenarios = await this.prisma.riskScenario.findMany({
      where: { riskId },
      select: {
        inherentScore: true,
        residualScore: true,
      },
    });

    const inherentScores = scenarios
      .map((s) => s.inherentScore || 0)
      .filter((s) => s > 0);
    const residualScores = scenarios
      .map((s) => s.residualScore || 0)
      .filter((s) => s > 0);

    const maxInherent = inherentScores.length > 0 ? Math.max(...inherentScores) : null;
    const maxResidual = residualScores.length > 0 ? Math.max(...residualScores) : null;

    await this.prisma.risk.update({
      where: { id: riskId },
      data: {
        inherentScore: maxInherent,
        residualScore: maxResidual,
        updatedById: userId,
      },
    });
  }

  /**
   * Get control effectiveness summary for display
   * Returns a formatted summary suitable for UI display
   *
   * @deprecated Control linking is now at the scenario level (RiskScenarioControl).
   * Use getControlEffectivenessForScenario instead.
   * This method will be removed in a future version.
   */
  async getControlEffectivenessSummary(riskId: string): Promise<{
    hasControls: boolean;
    summary: string;
    strength: ControlStrength;
    details: Array<{
      controlId: string;
      name: string;
      score: number;
      rating: string;
      strength: ControlStrength;
      likelihoodReduction: number;
      impactReduction: number;
    }>;
  }> {
    const effectiveness = await this.getControlEffectivenessForRisk(riskId);

    if (effectiveness.controlCount === 0) {
      return {
        hasControls: false,
        summary: 'No controls linked',
        strength: 'NONE',
        details: [],
      };
    }

    const CONTROL_EFFECTIVENESS_VALUES = {
      NONE: { likelihoodReduction: 0, impactReduction: 0 },
      WEAK: { likelihoodReduction: 1, impactReduction: 0 },
      MODERATE: { likelihoodReduction: 1, impactReduction: 1 },
      STRONG: { likelihoodReduction: 2, impactReduction: 1 },
      VERY_STRONG: { likelihoodReduction: 3, impactReduction: 2 },
    };

    const details = effectiveness.controlDetails.map((c) => ({
      controlId: c.controlId,
      name: c.controlName,
      score: c.score,
      rating: c.rating,
      strength: c.strength,
      likelihoodReduction: CONTROL_EFFECTIVENESS_VALUES[c.strength].likelihoodReduction,
      impactReduction: CONTROL_EFFECTIVENESS_VALUES[c.strength].impactReduction,
    }));

    const summaryParts = [
      `${effectiveness.controlCount} control(s)`,
      `${effectiveness.averageScore}% average effectiveness`,
      `Overall: ${effectiveness.overallStrength}`,
    ];

    return {
      hasControls: true,
      summary: summaryParts.join(' | '),
      strength: effectiveness.overallStrength,
      details,
    };
  }

}

