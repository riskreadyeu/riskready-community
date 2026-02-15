import { Injectable, ConflictException, Inject, forwardRef, NotFoundException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { ControlFramework, LikelihoodLevel, ImpactLevel, ImpactCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  calculateScore,
  calculateWeightedImpact,
  weightedImpactToLevel,
  LIKELIHOOD_VALUES,
  IMPACT_VALUES,
  CategoryAssessment,
  CategoryWeight,
  DEFAULT_CATEGORY_WEIGHTS,
  // Import shared utilities instead of duplicating
  CONTROL_EFFECTIVENESS,
  mapEffectivenessScoreToStrength,
  valueToLikelihoodLevel,
  valueToImpactLevel,
} from '../utils/risk-scoring';
import { RiskService } from './risk.service';
import { ControlRiskIntegrationService } from './control-risk-integration.service';
import { RiskCalculationService } from './risk-calculation.service';

// Use shared CONTROL_EFFECTIVENESS for reduction values
// Maps effectiveness score to { likelihoodReduction, impactReduction }
function getControlStrengthReductions(score: number): { likelihood: number; impact: number } {
  const strength = mapEffectivenessScoreToStrength(score);
  const effectiveness = CONTROL_EFFECTIVENESS[strength];
  return {
    likelihood: effectiveness.likelihoodReduction,
    impact: effectiveness.impactReduction,
  };
}

@Injectable()
export class RiskScenarioService {
  private readonly logger = new Logger(RiskScenarioService.name);

  constructor(
    private prisma: PrismaService,
    private readonly riskService: RiskService,
    private readonly controlRiskIntegration: ControlRiskIntegrationService,
    private readonly riskCalculationService: RiskCalculationService,
  ) { }

  async findByRisk(riskId: string) {
    return this.prisma.riskScenario.findMany({
      where: { riskId },
      orderBy: { scenarioId: 'asc' },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.riskScenario.findUnique({
      where: { id },
      include: {
        risk: {
          select: { id: true, riskId: true, title: true, tier: true, framework: true },
        },
        impactAssessments: {
          orderBy: { category: 'asc' },
        },
        treatmentPlans: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            treatmentId: true,
            title: true,
            description: true,
            treatmentType: true,
            status: true,
            priority: true,
            progressPercentage: true,
            targetResidualScore: true,
            targetStartDate: true,
            targetEndDate: true,
            createdAt: true,
          },
        },
        // Status and calculation audit trail
        statusChangedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        lastCalculatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        // Entity links for factor calculation
        controlLinks: {
          include: {
            control: {
              select: {
                id: true,
                controlId: true,
                name: true,
                implementationStatus: true,
              },
            },
          },
        },
        assetLinks: {
          include: {
            asset: {
              select: { id: true, assetTag: true, name: true },
            },
          },
        },
        // State machine and workflow history
        stateHistory: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            actor: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        // Calculation history for audit
        calculationHistory: {
          take: 5,
          orderBy: { calculatedAt: 'desc' },
        },
        // Linked Risk Tolerance Statements
        toleranceStatements: {
          select: {
            id: true,
            rtsId: true,
            title: true,
            proposedToleranceLevel: true,
            domain: true,
            status: true,
          },
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
  }) {
    const [results, count] = await Promise.all([
      this.prisma.riskScenario.findMany({
        skip: params?.skip,
        take: params?.take,
        orderBy: [{ scenarioId: 'asc' }],
        include: {
          risk: {
            select: { id: true, riskId: true, title: true, tier: true, framework: true },
          },
        },
      }),
      this.prisma.riskScenario.count(),
    ]);
    return { results, count };
  }

  async create(data: {
    scenarioId: string;
    title: string;
    cause?: string;
    event?: string;
    consequence?: string;
    framework?: ControlFramework;
    likelihood?: LikelihoodLevel;
    impact?: ImpactLevel;
    residualLikelihood?: LikelihoodLevel;
    residualImpact?: ImpactLevel;
    sleLow?: number;
    sleLikely?: number;
    sleHigh?: number;
    aro?: number;
    ale?: number;
    controlIds?: string;
    riskId: string;
    createdById: string;
  }) {
    // Check for duplicate scenarioId before starting transaction
    const existing = await this.prisma.riskScenario.findFirst({
      where: { scenarioId: data.scenarioId },
    });
    if (existing) {
      throw new ConflictException(`Scenario with ID ${data.scenarioId} already exists`);
    }

    // Use interactive transaction for atomic creation + initial score calculation
    // Note: RiskCalculationService uses separate connection, but Prisma's read committed
    // isolation ensures it sees the committed scenario data
    const scenario = await this.prisma.$transaction(async (tx) => {
      // Create scenario with initial likelihood/impact values
      const newScenario = await tx.riskScenario.create({
        data: {
          scenarioId: data.scenarioId,
          title: data.title,
          cause: data.cause,
          event: data.event,
          consequence: data.consequence,
          framework: data.framework || 'ISO',
          likelihood: data.likelihood,
          impact: data.impact,
          residualLikelihood: data.residualLikelihood,
          residualImpact: data.residualImpact,
          sleLow: data.sleLow,
          sleLikely: data.sleLikely,
          sleHigh: data.sleHigh,
          aro: data.aro,
          ale: data.ale,
          controlIds: data.controlIds,
          riskId: data.riskId,
          createdById: data.createdById,
        },
        include: {
          risk: { select: { id: true, riskId: true, title: true } },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      return newScenario;
    });

    // Calculate scores after transaction commits (ensures scenario is visible)
    // Note: Calculation is separate to avoid long-running transaction locks
    try {
      await this.riskCalculationService.calculateScenario(scenario.id, 'MANUAL', undefined, data.createdById);
    } catch (error) {
      // Log warning but don't fail - scenario exists, scoring can be retried manually
      // Scores will be null until calculated, which is a valid state
      this.logger.warn(`Initial calculation for scenario ${scenario.id} failed: ${(error as Error).message}`);
    }

    // Recalculate parent risk scores (aggregates from all scenarios)
    try {
      await this.riskService.recalculateScores(data.riskId);
    } catch (error) {
      this.logger.warn(`Parent risk recalculation failed for ${data.riskId}: ${(error as Error).message}`);
    }

    return scenario;
  }

  async update(id: string, data: {
    title?: string;
    cause?: string;
    event?: string;
    consequence?: string;
    framework?: ControlFramework;
    likelihood?: LikelihoodLevel;
    impact?: ImpactLevel;
    residualLikelihood?: LikelihoodLevel;
    residualImpact?: ImpactLevel;
    residualOverrideJustification?: string;
    sleLow?: number;
    sleLikely?: number;
    sleHigh?: number;
    aro?: number;
    ale?: number;
    controlIds?: string;
    updatedById?: string;
  }) {
    // Get current scenario to know the riskId
    const current = await this.prisma.riskScenario.findUnique({
      where: { id },
      select: { riskId: true },
    });

    if (!current) {
      throw new NotFoundException(`Scenario with ID ${id} not found`);
    }

    // Update scenario atomically
    const scenario = await this.prisma.$transaction(async (tx) => {
      return tx.riskScenario.update({
        where: { id },
        data: {
          title: data.title,
          cause: data.cause,
          event: data.event,
          consequence: data.consequence,
          framework: data.framework,
          likelihood: data.likelihood,
          impact: data.impact,
          residualLikelihood: data.residualLikelihood,
          residualImpact: data.residualImpact,
          residualOverrideJustification: data.residualOverrideJustification,
          sleLow: data.sleLow,
          sleLikely: data.sleLikely,
          sleHigh: data.sleHigh,
          aro: data.aro,
          ale: data.ale,
          controlIds: data.controlIds,
          updatedById: data.updatedById,
        },
        include: {
          risk: { select: { id: true, riskId: true, title: true } },
          updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    });

    // Recalculate scores after transaction commits
    try {
      await this.riskCalculationService.calculateScenario(scenario.id, 'MANUAL', undefined, data.updatedById);
    } catch (error) {
      this.logger.warn(`Recalculation for scenario ${scenario.id} failed: ${(error as Error).message}`);
    }

    // Recalculate parent risk scores (aggregates from all scenarios)
    try {
      await this.riskService.recalculateScores(current.riskId);
    } catch (error) {
      this.logger.warn(`Parent risk recalculation failed for ${current.riskId}: ${(error as Error).message}`);
    }

    return scenario;
  }

  async delete(id: string) {
    // Get riskId before deletion
    const scenario = await this.prisma.riskScenario.findUnique({
      where: { id },
      select: { riskId: true },
    });

    if (!scenario) {
      throw new ConflictException(`Scenario with ID ${id} not found`);
    }

    await this.prisma.riskScenario.delete({
      where: { id },
    });

    // Recalculate parent risk scores after deletion
    await this.riskService.recalculateScores(scenario.riskId);
  }

  // ============================================
  // BIRT Impact Assessment Methods
  // ============================================

  /**
   * Get impact assessments for a scenario
   */
  async getImpactAssessments(scenarioId: string, isResidual: boolean = false) {
    return this.prisma.scenarioImpactAssessment.findMany({
      where: { scenarioId, isResidual },
      orderBy: { category: 'asc' },
    });
  }

  /**
   * Save impact assessments for a scenario
   * Creates or updates assessments and recalculates weighted impact
   */
  async saveImpactAssessments(
    scenarioId: string,
    assessments: Array<{
      category: ImpactCategory;
      level: ImpactLevel;
      value: number;
      rationale?: string;
    }>,
    isResidual: boolean = false,
    organisationId?: string
  ) {
    // Verify scenario exists
    const scenario = await this.prisma.riskScenario.findUnique({
      where: { id: scenarioId },
      select: { id: true, riskId: true },
    });

    if (!scenario) {
      throw new NotFoundException(`Scenario ${scenarioId} not found`);
    }

    // Save each assessment
    for (const assessment of assessments) {
      await this.prisma.scenarioImpactAssessment.upsert({
        where: {
          scenarioId_category_isResidual: {
            scenarioId,
            category: assessment.category,
            isResidual,
          },
        },
        update: {
          level: assessment.level,
          value: assessment.value,
          rationale: assessment.rationale,
        },
        create: {
          scenarioId,
          category: assessment.category,
          level: assessment.level,
          value: assessment.value,
          rationale: assessment.rationale,
          isResidual,
        },
      });
    }

    // Calculate weighted impact
    const weightedImpact = await this.calculateAndSaveWeightedImpact(
      scenarioId,
      isResidual,
      organisationId
    );

    // Recalculate parent risk scores
    await this.riskService.recalculateScores(scenario.riskId);

    return {
      scenarioId,
      isResidual,
      assessments: await this.getImpactAssessments(scenarioId, isResidual),
      weightedImpact,
    };
  }

  /**
   * Calculate weighted impact from assessments and save to scenario
   */
  private async calculateAndSaveWeightedImpact(
    scenarioId: string,
    isResidual: boolean,
    organisationId?: string
  ): Promise<number> {
    // Get all assessments for this scenario
    const assessments = await this.prisma.scenarioImpactAssessment.findMany({
      where: { scenarioId, isResidual },
    });

    if (assessments.length === 0) {
      return 0;
    }

    // Get weights (org-specific if available, else system defaults)
    let weights: CategoryWeight[] = DEFAULT_CATEGORY_WEIGHTS;

    if (organisationId) {
      // BirtOrgConfig removed in community edition — use default weights
      const orgConfigs: { category: string; weight: number }[] = [];

      if (orgConfigs.length > 0) {
        // Merge org weights with defaults
        weights = DEFAULT_CATEGORY_WEIGHTS.map((defaultWeight) => {
          const orgConfig = orgConfigs.find((c) => c.category === defaultWeight.category);
          return {
            category: defaultWeight.category,
            weight: orgConfig?.weight ?? defaultWeight.weight,
          };
        });
      }
    }

    // Calculate weighted impact
    const categoryAssessments: CategoryAssessment[] = assessments.map((a) => ({
      category: a.category,
      value: a.value,
    }));

    const weightedImpact = calculateWeightedImpact(categoryAssessments, weights);

    // Convert weighted impact to impact level (1-5 scale maps to impact levels)
    const impactLevel = weightedImpactToLevel(weightedImpact);

    // Get current scenario to check if likelihood exists
    const currentScenario = await this.prisma.riskScenario.findUnique({
      where: { id: scenarioId },
      select: {
        likelihood: true,
        residualLikelihood: true,
        riskId: true,
      },
    });

    // Build update data based on whether this is inherent or residual
    let updateData: any;
    if (isResidual) {
      updateData = {
        residualWeightedImpact: weightedImpact,
        residualImpact: impactLevel,
      };
      // Calculate residual score - use residualLikelihood if set, otherwise inherit from inherent
      const effectiveLikelihood = currentScenario?.residualLikelihood || currentScenario?.likelihood;
      if (effectiveLikelihood) {
        const likelihoodValue = LIKELIHOOD_VALUES[effectiveLikelihood];
        updateData.residualScore = likelihoodValue * weightedImpact;
        // If residualLikelihood wasn't set but we used inherent, also set residualLikelihood
        if (!currentScenario?.residualLikelihood && currentScenario?.likelihood) {
          updateData.residualLikelihood = currentScenario.likelihood;
        }
      }
    } else {
      updateData = {
        weightedImpact: weightedImpact,
        impact: impactLevel,
      };
      // Calculate inherent score if likelihood is available
      if (currentScenario?.likelihood) {
        const likelihoodValue = LIKELIHOOD_VALUES[currentScenario.likelihood];
        updateData.inherentScore = likelihoodValue * weightedImpact;
      }
      // Inherit missing residual categories from inherent (per-category, not all-or-nothing)
      await this.inheritMissingResidualAssessments(scenarioId);

      // Recalculate residual weighted impact (may have inherited categories)
      const residualWeighted = await this.calculateAndSaveWeightedImpact(scenarioId, true);
      if (residualWeighted > 0) {
        const residualLikelihood = currentScenario?.residualLikelihood || currentScenario?.likelihood;
        if (residualLikelihood) {
          const likelihoodValue = LIKELIHOOD_VALUES[residualLikelihood];
          updateData.residualScore = likelihoodValue * residualWeighted;
        }
        updateData.residualWeightedImpact = residualWeighted;
      }
    }

    await this.prisma.riskScenario.update({
      where: { id: scenarioId },
      data: updateData,
    });

    // Recalculate parent risk scores if score was updated
    if (currentScenario?.riskId && (updateData.inherentScore || updateData.residualScore)) {
      await this.riskService.recalculateScores(currentScenario.riskId);
    }

    return weightedImpact;
  }

  /**
   * Inherit missing residual impact assessments from inherent assessments
   * Per-category inheritance: only copies categories where residual doesn't exist
   * This fixes the "all-or-nothing" bug where having ONE residual assessment
   * would prevent inheriting ANY other categories from inherent.
   */
  private async inheritMissingResidualAssessments(scenarioId: string): Promise<number> {
    // Get all inherent assessments
    const inherentAssessments = await this.prisma.scenarioImpactAssessment.findMany({
      where: { scenarioId, isResidual: false },
    });

    if (inherentAssessments.length === 0) {
      return 0;
    }

    // Get existing residual categories
    const existingResidual = await this.prisma.scenarioImpactAssessment.findMany({
      where: { scenarioId, isResidual: true },
      select: { category: true },
    });
    const existingResidualCategories = new Set(existingResidual.map(r => r.category));

    // For each inherent category missing in residual, create a copy
    let inheritedCount = 0;
    for (const assessment of inherentAssessments) {
      if (!existingResidualCategories.has(assessment.category)) {
        await this.prisma.scenarioImpactAssessment.create({
          data: {
            scenarioId,
            category: assessment.category,
            level: assessment.level,
            value: assessment.value,
            rationale: assessment.rationale
              ? `[Inherited from inherent] ${assessment.rationale}`
              : 'Inherited from inherent assessment',
            isResidual: true,
          },
        });
        inheritedCount++;
      }
    }

    return inheritedCount;
  }

  /**
   * Delete an impact assessment
   */
  async deleteImpactAssessment(
    scenarioId: string,
    category: ImpactCategory,
    isResidual: boolean = false
  ) {
    const scenario = await this.prisma.riskScenario.findUnique({
      where: { id: scenarioId },
      select: { riskId: true },
    });

    if (!scenario) {
      throw new NotFoundException(`Scenario ${scenarioId} not found`);
    }

    await this.prisma.scenarioImpactAssessment.delete({
      where: {
        scenarioId_category_isResidual: {
          scenarioId,
          category,
          isResidual,
        },
      },
    });

    // Recalculate weighted impact
    await this.calculateAndSaveWeightedImpact(scenarioId, isResidual);

    // Recalculate parent risk scores
    await this.riskService.recalculateScores(scenario.riskId);

    return { deleted: true };
  }

  /**
   * Clear all impact assessments for a scenario
   */
  async clearImpactAssessments(scenarioId: string, isResidual?: boolean) {
    const scenario = await this.prisma.riskScenario.findUnique({
      where: { id: scenarioId },
      select: { riskId: true },
    });

    if (!scenario) {
      throw new NotFoundException(`Scenario ${scenarioId} not found`);
    }

    const where: any = { scenarioId };
    if (isResidual !== undefined) {
      where.isResidual = isResidual;
    }

    await this.prisma.scenarioImpactAssessment.deleteMany({ where });

    // Reset weighted impact
    const updateData: any = {};
    if (isResidual === undefined || isResidual === false) {
      updateData.weightedImpact = null;
    }
    if (isResidual === undefined || isResidual === true) {
      updateData.residualWeightedImpact = null;
    }

    await this.prisma.riskScenario.update({
      where: { id: scenarioId },
      data: updateData,
    });

    // Recalculate parent risk scores
    await this.riskService.recalculateScores(scenario.riskId);

    return { cleared: true };
  }

  // ============================================
  // LIKELIHOOD FACTOR SCORING (F1-F6)
  // ============================================

  /**
   * Get F1-F6 likelihood factor scores for a scenario
   * Includes justifications from linked data sources
   */
  async getLikelihoodFactorScores(scenarioId: string) {
    const scenario = await this.prisma.riskScenario.findUnique({
      where: { id: scenarioId },
      select: {
        title: true,
        f1ThreatFrequency: true,
        f1Source: true,
        f1Override: true,
        f1OverrideJustification: true,
        f2ControlEffectiveness: true,
        f2Source: true,
        f2Override: true,
        f2OverrideJustification: true,
        f3GapVulnerability: true,
        f3Source: true,
        f3Override: true,
        f3OverrideJustification: true,
        f4IncidentHistory: true,
        f4Source: true,
        f4Override: true,
        f4OverrideJustification: true,
        f5AttackSurface: true,
        f5Source: true,
        f5Override: true,
        f5OverrideJustification: true,
        f6Environmental: true,
        f6Source: true,
        f6Override: true,
        f6OverrideJustification: true,
        calculatedLikelihood: true,
        lastCalculatedAt: true,
        riskId: true,
      },
    });

    if (!scenario) {
      throw new NotFoundException(`Scenario ${scenarioId} not found`);
    }

    // Fetch justification data from linked sources (use scenario title for better matching)
    const justifications = await this.getFactorJustifications(scenario.riskId);

    // Check if all factors are scored
    const allScored =
      scenario.f1ThreatFrequency !== null &&
      scenario.f2ControlEffectiveness !== null &&
      scenario.f3GapVulnerability !== null &&
      scenario.f4IncidentHistory !== null &&
      scenario.f5AttackSurface !== null &&
      scenario.f6Environmental !== null;

    return {
      scores: {
        f1ThreatFrequency: scenario.f1ThreatFrequency,
        f2ControlEffectiveness: scenario.f2ControlEffectiveness,
        f3GapVulnerability: scenario.f3GapVulnerability,
        f4IncidentHistory: scenario.f4IncidentHistory,
        f5AttackSurface: scenario.f5AttackSurface,
        f6Environmental: scenario.f6Environmental,
      },
      overrides: {
        f1Override: scenario.f1Override,
        f1OverrideJustification: scenario.f1OverrideJustification,
        f2Override: scenario.f2Override,
        f2OverrideJustification: scenario.f2OverrideJustification,
        f3Override: scenario.f3Override,
        f3OverrideJustification: scenario.f3OverrideJustification,
        f4Override: scenario.f4Override,
        f4OverrideJustification: scenario.f4OverrideJustification,
        f5Override: scenario.f5Override,
        f5OverrideJustification: scenario.f5OverrideJustification,
        f6Override: scenario.f6Override,
        f6OverrideJustification: scenario.f6OverrideJustification,
      },
      sources: {
        f1Source: scenario.f1Source,
        f2Source: scenario.f2Source,
        f3Source: scenario.f3Source,
        f4Source: scenario.f4Source,
        f5Source: scenario.f5Source,
        f6Source: scenario.f6Source,
      },
      justifications,
      calculatedLikelihood: scenario.calculatedLikelihood,
      lastCalculatedAt: scenario.lastCalculatedAt,
      allScored,
    };
  }

  /**
   * Get justifications for each factor from linked data sources
   * F2-F6: From relevant linked entities (controls, vulnerabilities, incidents, etc.)
   */
  private async getFactorJustifications(
    riskId: string,
  ): Promise<{
    f2Justification?: string;
    f3Justification?: string;
    f4Justification?: string;
    f5Justification?: string;
    f6Justification?: string;
  }> {
    const justifications: {
      f2Justification?: string;
      f3Justification?: string;
      f4Justification?: string;
      f5Justification?: string;
      f6Justification?: string;
    } = {};

    // F2: Control effectiveness justification (aggregate from linked controls)
    // TODO: Add when control assessment data is linked

    // F4: Incident history justification
    const recentIncidents = await this.prisma.incident.count({
      where: {
        description: { contains: riskId },
        occurredAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }, // Last year
      },
    });
    if (recentIncidents > 0) {
      justifications.f4Justification = `${recentIncidents} related incident(s) in the past 12 months`;
    }

    return justifications;
  }

  /**
   * Get evidence data for F2-F6 likelihood factors
   * Returns linked data from controls, incidents, etc.
   */
  async getFactorEvidence(scenarioId: string) {
    const scenario = await this.prisma.riskScenario.findUnique({
      where: { id: scenarioId },
      select: {
        id: true,
        riskId: true,
        title: true,
        controlIds: true,
        // Use scenario-level control links instead of risk-level controls
        controlLinks: {
          include: {
            control: {
              select: {
                id: true,
                controlId: true,
                name: true,
                implementationStatus: true,
              },
            },
          },
        },
        risk: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!scenario) {
      throw new NotFoundException(`Scenario ${scenarioId} not found`);
    }

    const evidence: {
      f2?: {
        linkedControls?: Array<{
          id: string;
          controlId: string;
          name: string;
          effectiveness: number;
          lastTested?: string;
          maturity?: string;
        }>;
        averageEffectiveness?: number;
        gapCount?: number;
      };
      f3?: {
        openVulnerabilities?: number;
        criticalVulnerabilities?: number;
        auditFindings?: number;
        lastScanDate?: string;
        source?: string;
      };
      f4?: {
        incidents?: Array<{
          id: string;
          referenceNumber: string;
          title: string;
          severity: string;
          date: string;
        }>;
        incidentCount?: number;
        lastIncidentDate?: string;
      };
      f5?: {
        externalAssets?: number;
        internetFacing?: boolean;
        thirdPartyConnections?: number;
        cloudExposure?: string;
        source?: string;
      };
      f6?: {
        regulatoryPressure?: string;
        industryTargeting?: boolean;
        geopoliticalRisk?: string;
        recentAlerts?: string[];
      };
    } = {};

    // F2: Get control effectiveness data from scenario-level control links
    if (scenario.controlLinks && scenario.controlLinks.length > 0) {
      // For each control, get its implementation status (proxy for effectiveness)
      const controlsWithScores = scenario.controlLinks.map((link) => {
        // Map implementation status to effectiveness score
        const statusToEffectiveness: Record<string, number> = {
          IMPLEMENTED: 85,
          PARTIAL: 60,
          NOT_STARTED: 20,
        };
        const baseEffectiveness = statusToEffectiveness[link.control.implementationStatus] ?? 50;
        // Apply effectiveness weight from the link
        const effectiveness = Math.round((baseEffectiveness * link.effectivenessWeight) / 100);

        return {
          id: link.control.id,
          controlId: link.control.controlId,
          name: link.control.name,
          effectiveness,
          implementationStatus: link.control.implementationStatus,
        };
      });

      const totalEffectiveness = controlsWithScores.reduce((sum, c) => sum + c.effectiveness, 0);
      evidence.f2 = {
        linkedControls: controlsWithScores,
        averageEffectiveness: Math.round(totalEffectiveness / controlsWithScores.length),
        gapCount: controlsWithScores.filter((c) => c.effectiveness < 60).length,
      };
    }

    // F3: Get vulnerability/gap data (from audit findings if available)
    const auditFindings = await this.prisma.nonconformity.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });
    if (auditFindings > 0) {
      evidence.f3 = {
        auditFindings,
      };
    }

    // F4: Get incident history
    const incidents = await this.prisma.incident.findMany({
      where: {
        OR: [
          { description: { contains: scenario.title, mode: 'insensitive' } },
          { description: { contains: scenario.riskId, mode: 'insensitive' } },
        ],
      },
      orderBy: { occurredAt: 'desc' },
      take: 5,
      select: {
        id: true,
        referenceNumber: true,
        title: true,
        severity: true,
        occurredAt: true,
      },
    });

    if (incidents.length > 0) {
      evidence.f4 = {
        incidents: incidents.map((i) => ({
          id: i.id,
          referenceNumber: i.referenceNumber,
          title: i.title,
          severity: i.severity,
          date: i.occurredAt?.toISOString() || '',
        })),
        incidentCount: incidents.length,
        lastIncidentDate: incidents[0]?.occurredAt?.toISOString(),
      };
    }

    // F5: Attack surface - simplified, based on available data
    // In a real implementation, this would integrate with asset inventory
    evidence.f5 = {
      externalAssets: 0, // Would come from asset inventory
      internetFacing: false, // Would come from network topology
      thirdPartyConnections: 0, // Would come from vendor management
    };

    // F6: Environmental - from organization profile or regulatory framework
    // In a real implementation, this would integrate with regulatory tracking
    evidence.f6 = {
      regulatoryPressure: 'MEDIUM',
      industryTargeting: false,
    };

    return evidence;
  }

  /**
   * Update F1-F6 likelihood factor scores for a scenario
   * Manual scores are marked as overrides so automatic calculation respects them.
   * After updating, delegates to RiskCalculationService for consistent score calculation.
   */
  async updateLikelihoodFactorScores(
    scenarioId: string,
    data: {
      f1ThreatFrequency?: number;
      f2ControlEffectiveness?: number;
      f3GapVulnerability?: number;
      f4IncidentHistory?: number;
      f5AttackSurface?: number;
      f6Environmental?: number;
    },
    updatedById?: string
  ) {
    const scenario = await this.prisma.riskScenario.findUnique({
      where: { id: scenarioId },
      select: { id: true, riskId: true },
    });

    if (!scenario) {
      throw new NotFoundException(`Scenario ${scenarioId} not found`);
    }

    // Validate scores are 1-5
    const validateScore = (score: number | undefined, name: string) => {
      if (score !== undefined && (score < 1 || score > 5)) {
        throw new Error(`${name} must be between 1 and 5`);
      }
    };

    validateScore(data.f1ThreatFrequency, 'f1ThreatFrequency');
    validateScore(data.f2ControlEffectiveness, 'f2ControlEffectiveness');
    validateScore(data.f3GapVulnerability, 'f3GapVulnerability');
    validateScore(data.f4IncidentHistory, 'f4IncidentHistory');
    validateScore(data.f5AttackSurface, 'f5AttackSurface');
    validateScore(data.f6Environmental, 'f6Environmental');

    // Build update data - ONLY update factor scores and set override flags
    // Manual scores are marked as overrides so automatic calculation won't overwrite them
    const updateData: any = {
      updatedById,
    };

    if (data.f1ThreatFrequency !== undefined) {
      updateData.f1ThreatFrequency = data.f1ThreatFrequency;
      updateData.f1Override = true;
      updateData.f1Source = 'manual';
    }
    if (data.f2ControlEffectiveness !== undefined) {
      updateData.f2ControlEffectiveness = data.f2ControlEffectiveness;
      updateData.f2Override = true;
      updateData.f2Source = 'manual';
    }
    if (data.f3GapVulnerability !== undefined) {
      updateData.f3GapVulnerability = data.f3GapVulnerability;
      updateData.f3Override = true;
      updateData.f3Source = 'manual';
    }
    if (data.f4IncidentHistory !== undefined) {
      updateData.f4IncidentHistory = data.f4IncidentHistory;
      updateData.f4Override = true;
      updateData.f4Source = 'manual';
    }
    if (data.f5AttackSurface !== undefined) {
      updateData.f5AttackSurface = data.f5AttackSurface;
      updateData.f5Override = true;
      updateData.f5Source = 'manual';
    }
    if (data.f6Environmental !== undefined) {
      updateData.f6Environmental = data.f6Environmental;
      updateData.f6Override = true;
      updateData.f6Source = 'manual';
    }

    // Update factor scores and override flags
    await this.prisma.riskScenario.update({
      where: { id: scenarioId },
      data: updateData,
    });

    // Delegate all calculation to RiskCalculationService (single source of truth)
    // This ensures consistent score calculation and respects override flags
    const calculationResult = await this.riskCalculationService.calculateScenario(
      scenarioId,
      'MANUAL',
      undefined,
      updatedById,
    );

    // Explicitly sync the Calculated Score to the Database Enum Fields
    // (Bypasses potential missing sync in RiskCalculationService)
    if (calculationResult) {
      const newLikelihood = valueToLikelihoodLevel(calculationResult.likelihood);
      const newImpact = valueToImpactLevel(calculationResult.impact);

      if (newLikelihood || newImpact) {
        await this.prisma.riskScenario.update({
          where: { id: scenarioId },
          data: {
            likelihood: newLikelihood ?? undefined,
            impact: newImpact ?? undefined,
            inherentScore: calculationResult.inherentScore
          }
        });
      }
    }

    // Return updated scenario with calculation result
    const updated = await this.prisma.riskScenario.findUnique({
      where: { id: scenarioId },
      select: {
        id: true,
        f1ThreatFrequency: true,
        f1Override: true,
        f2ControlEffectiveness: true,
        f2Override: true,
        f3GapVulnerability: true,
        f3Override: true,
        f4IncidentHistory: true,
        f4Override: true,
        f5AttackSurface: true,
        f5Override: true,
        f6Environmental: true,
        f6Override: true,
        calculatedLikelihood: true,
        likelihood: true,
        inherentScore: true,
        residualScore: true,
        lastCalculatedAt: true,
      },
    });

    // Check if all 6 factors are now scored
    const allScored =
      updated?.f1ThreatFrequency !== null &&
      updated?.f2ControlEffectiveness !== null &&
      updated?.f3GapVulnerability !== null &&
      updated?.f4IncidentHistory !== null &&
      updated?.f5AttackSurface !== null &&
      updated?.f6Environmental !== null;

    return {
      ...updated,
      allScored,
      calculationResult: {
        likelihood: calculationResult.likelihood,
        impact: calculationResult.impact,
        inherentScore: calculationResult.inherentScore,
        residualScore: calculationResult.residualScore,
        zone: calculationResult.zone,
      },
    };
  }

  /**
   * Get residual likelihood factor scores for a scenario
   * Returns control-adjusted F1-F3 values with reduction breakdown and linked controls
   */
  async getResidualFactorScores(scenarioId: string) {
    const scenario = await this.prisma.riskScenario.findUnique({
      where: { id: scenarioId },
      select: {
        id: true,
        scenarioId: true,
        // Inherent factors (F1-F3 only)
        f1ThreatFrequency: true,
        f2ControlEffectiveness: true,
        f3GapVulnerability: true,
        // Override flags
        f1Override: true,
        f1OverrideJustification: true,
        f2Override: true,
        f2OverrideJustification: true,
        f3Override: true,
        f3OverrideJustification: true,
        // Residual values (user may override)
        residualLikelihood: true,
        calculatedResidualLikelihood: true,
        residualOverridden: true,
        residualOverrideJustification: true,
        residualOverriddenById: true,
        residualOverriddenAt: true,
        residualPreviousScore: true,
        // Get linked controls directly from scenario
        controlLinks: {
          include: {
            control: {
              select: {
                id: true,
                controlId: true,
                name: true,
                implementationStatus: true,
              },
            },
          },
        },
      },
    });

    if (!scenario) {
      throw new NotFoundException(`Scenario ${scenarioId} not found`);
    }

    // Map implementation status to effectiveness percentage
    const statusToEffectiveness: Record<string, number> = {
      IMPLEMENTED: 85,
      PARTIAL: 60,
      NOT_STARTED: 20,
    };

    // Process linked controls with effectiveness
    const linkedControls = scenario.controlLinks.map((link) => {
      const effectiveness = statusToEffectiveness[link.control.implementationStatus] ?? 50;

      // Calculate per-factor reduction (controls primarily affect F2, but can have secondary effects)
      // For simplicity, use a standard reduction model based on effectiveness
      const baseReduction = Math.round((100 - effectiveness) / 100 * 2 * 10) / 10; // 0-2 point reduction scale

      return {
        id: link.control.id, // Database ID for linking
        controlId: link.control.controlId,
        controlName: link.control.name,
        effectiveness,
        affectedFactors: ['F1', 'F2', 'F3'] as ('F1' | 'F2' | 'F3')[],
        reductionPerFactor: {
          f1: Math.round(baseReduction * 0.3 * 10) / 10, // 30% weight on F1
          f2: Math.round(baseReduction * 0.5 * 10) / 10, // 50% weight on F2
          f3: Math.round(baseReduction * 0.2 * 10) / 10, // 20% weight on F3
        },
      };
    });

    // Calculate total reductions per factor
    const totalReductions = {
      f1: linkedControls.reduce((sum, c) => sum + c.reductionPerFactor.f1, 0),
      f2: linkedControls.reduce((sum, c) => sum + c.reductionPerFactor.f2, 0),
      f3: linkedControls.reduce((sum, c) => sum + c.reductionPerFactor.f3, 0),
      totalReduction: 0,
    };
    totalReductions.totalReduction = totalReductions.f1 + totalReductions.f2 + totalReductions.f3;

    // Calculate residual factor scores (inherent - reduction, min 1)
    const f1Inherent = scenario.f1ThreatFrequency ?? 3;
    const f2Inherent = scenario.f2ControlEffectiveness ?? 3;
    const f3Inherent = scenario.f3GapVulnerability ?? 3;

    const calculatedResidualScores = {
      f1Residual: Math.max(1, Math.round((f1Inherent - totalReductions.f1) * 10) / 10),
      f2Residual: Math.max(1, Math.round((f2Inherent - totalReductions.f2) * 10) / 10),
      f3Residual: Math.max(1, Math.round((f3Inherent - totalReductions.f3) * 10) / 10),
    };

    // Calculate residual likelihood (weighted average of F1-F3, rounded)
    const calculatedResidualLikelihood = Math.round(
      (calculatedResidualScores.f1Residual * 0.34 +
        calculatedResidualScores.f2Residual * 0.33 +
        calculatedResidualScores.f3Residual * 0.33)
    );

    return {
      scenarioId: scenario.scenarioId,
      inherentScores: {
        f1ThreatFrequency: scenario.f1ThreatFrequency,
        f2ControlEffectiveness: scenario.f2ControlEffectiveness,
        f3GapVulnerability: scenario.f3GapVulnerability,
      },
      residualScores: {
        f1Residual: calculatedResidualScores.f1Residual,
        f2Residual: calculatedResidualScores.f2Residual,
        f3Residual: calculatedResidualScores.f3Residual,
      },
      calculatedResidualScores,
      controlReductions: totalReductions,
      calculatedResidualLikelihood,
      overrides: {
        f1Override: scenario.f1Override,
        f1OverrideJustification: scenario.f1OverrideJustification,
        f2Override: scenario.f2Override,
        f2OverrideJustification: scenario.f2OverrideJustification,
        f3Override: scenario.f3Override,
        f3OverrideJustification: scenario.f3OverrideJustification,
      },
      linkedControls,
    };
  }

  /**
   * Update residual factor scores for a scenario
   * Used for overriding calculated residual factors
   */
  async updateResidualFactorScores(
    scenarioId: string,
    data: {
      scores?: {
        f1Residual?: number;
        f2Residual?: number;
        f3Residual?: number;
      };
      overrides?: {
        f1Override?: boolean;
        f1OverrideJustification?: string;
        f2Override?: boolean;
        f2OverrideJustification?: string;
        f3Override?: boolean;
        f3OverrideJustification?: string;
      };
    },
    userId: string
  ) {
    // For now, we track overrides but don't have separate residual factor fields
    // The residual is calculated dynamically from inherent factors - control effectiveness
    // We just update the override flags for audit purposes
    if (data.overrides) {
      // Get current calculated score before override for audit trail
      const currentScenario = await this.prisma.riskScenario.findUnique({
        where: { id: scenarioId },
        select: { calculatedResidualScore: true },
      });

      await this.prisma.riskScenario.update({
        where: { id: scenarioId },
        data: {
          residualOverridden: true,
          residualOverrideJustification: [
            data.overrides.f1OverrideJustification,
            data.overrides.f2OverrideJustification,
            data.overrides.f3OverrideJustification,
          ]
            .filter(Boolean)
            .join('; ') || undefined,
          // Audit trail fields
          residualOverriddenById: userId,
          residualOverriddenAt: new Date(),
          residualPreviousScore: currentScenario?.calculatedResidualScore,
          updatedById: userId,
        },
      });
    }

    // Return the updated residual factor scores
    return this.getResidualFactorScores(scenarioId);
  }

  // ============================================
  // CONTROL LINKING METHODS
  // ============================================

  /**
   * Link a control to a scenario
   * Creates entry in RiskScenarioControl junction table
   */
  async linkControl(
    scenarioId: string,
    controlId: string,
    data?: {
      effectivenessWeight?: number;
      isPrimaryControl?: boolean;
      notes?: string;
    }
  ) {
    // Verify scenario exists
    const scenario = await this.prisma.riskScenario.findUnique({
      where: { id: scenarioId },
    });
    if (!scenario) {
      throw new NotFoundException(`Scenario ${scenarioId} not found`);
    }

    // Verify control exists
    const control = await this.prisma.control.findUnique({
      where: { id: controlId },
    });
    if (!control) {
      throw new NotFoundException(`Control ${controlId} not found`);
    }

    // Check if link already exists
    const existingLink = await this.prisma.riskScenarioControl.findUnique({
      where: {
        scenarioId_controlId: { scenarioId, controlId },
      },
    });
    if (existingLink) {
      throw new ConflictException('Control is already linked to this scenario');
    }

    // If setting as primary, unset any existing primary control
    if (data?.isPrimaryControl) {
      await this.prisma.riskScenarioControl.updateMany({
        where: { scenarioId, isPrimaryControl: true },
        data: { isPrimaryControl: false },
      });
    }

    return this.prisma.riskScenarioControl.create({
      data: {
        scenarioId,
        controlId,
        effectivenessWeight: data?.effectivenessWeight ?? 100,
        isPrimaryControl: data?.isPrimaryControl ?? false,
        notes: data?.notes,
      },
      include: {
        control: {
          select: {
            id: true,
            controlId: true,
            name: true,
            implementationStatus: true,
          },
        },
      },
    });
  }

  /**
   * Unlink a control from a scenario
   */
  async unlinkControl(scenarioId: string, controlId: string) {
    // Verify the link exists
    const link = await this.prisma.riskScenarioControl.findUnique({
      where: {
        scenarioId_controlId: { scenarioId, controlId },
      },
    });

    if (!link) {
      throw new NotFoundException('Control link not found');
    }

    await this.prisma.riskScenarioControl.delete({
      where: {
        scenarioId_controlId: { scenarioId, controlId },
      },
    });

    // If this was the primary control, set another as primary if available
    if (link.isPrimaryControl) {
      const remainingControls = await this.prisma.riskScenarioControl.findFirst({
        where: { scenarioId },
        orderBy: { createdAt: 'asc' },
      });

      if (remainingControls) {
        await this.prisma.riskScenarioControl.update({
          where: { id: remainingControls.id },
          data: { isPrimaryControl: true },
        });
      }
    }

    return { success: true, message: 'Control unlinked successfully' };
  }

  /**
   * Get controls linked to a scenario
   */
  async getLinkedControls(scenarioId: string) {
    return this.prisma.riskScenarioControl.findMany({
      where: { scenarioId },
      include: {
        control: {
          select: {
            id: true,
            controlId: true,
            name: true,
            theme: true,
            framework: true,
            implementationStatus: true,
          },
        },
      },
      orderBy: [
        { isPrimaryControl: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Update control link settings
   */
  async updateControlLink(
    scenarioId: string,
    controlId: string,
    data: {
      effectivenessWeight?: number;
      isPrimaryControl?: boolean;
      notes?: string;
    }
  ) {
    // Verify the link exists
    const link = await this.prisma.riskScenarioControl.findUnique({
      where: {
        scenarioId_controlId: { scenarioId, controlId },
      },
    });

    if (!link) {
      throw new NotFoundException('Control link not found');
    }

    // If setting as primary, unset any existing primary control
    if (data.isPrimaryControl && !link.isPrimaryControl) {
      await this.prisma.riskScenarioControl.updateMany({
        where: { scenarioId, isPrimaryControl: true },
        data: { isPrimaryControl: false },
      });
    }

    return this.prisma.riskScenarioControl.update({
      where: {
        scenarioId_controlId: { scenarioId, controlId },
      },
      data: {
        effectivenessWeight: data.effectivenessWeight,
        isPrimaryControl: data.isPrimaryControl,
        notes: data.notes,
      },
      include: {
        control: {
          select: {
            id: true,
            controlId: true,
            name: true,
            theme: true,
            framework: true,
            implementationStatus: true,
          },
        },
      },
    });
  }
}
