import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { ControlFramework, LikelihoodLevel, ImpactLevel, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  calculateScore,
  LIKELIHOOD_VALUES,
  IMPACT_VALUES,
} from '../utils/risk-scoring';
import { RiskService } from './risk.service';
import { ControlRiskIntegrationService } from './control-risk-integration.service';
import { RiskCalculationService } from './risk-calculation.service';

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
        // Status audit trail
        statusChangedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        // Control links for residual calculation
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

    // Auto-compute inherentScore when both likelihood and impact are provided
    const inherentScore = (data.likelihood && data.impact)
      ? calculateScore(data.likelihood, data.impact)
      : undefined;

    const scenario = await this.prisma.$transaction(async (tx) => {
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
          inherentScore,
          residualLikelihood: data.residualLikelihood,
          residualImpact: data.residualImpact,
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
    controlIds?: string;
    updatedById?: string;
  }) {
    // Get current scenario to know the riskId and current L/I values
    const current = await this.prisma.riskScenario.findUnique({
      where: { id },
      select: { riskId: true, likelihood: true, impact: true },
    });

    if (!current) {
      throw new NotFoundException(`Scenario with ID ${id} not found`);
    }

    // Auto-compute inherentScore when both likelihood and impact are available
    const effectiveLikelihood = data.likelihood ?? current.likelihood;
    const effectiveImpact = data.impact ?? current.impact;
    const inherentScore = (effectiveLikelihood && effectiveImpact)
      ? calculateScore(effectiveLikelihood, effectiveImpact)
      : undefined;

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
          inherentScore,
          residualLikelihood: data.residualLikelihood,
          residualImpact: data.residualImpact,
          residualOverrideJustification: data.residualOverrideJustification,
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
  // REMOVED: BIRT Impact Assessments + F1-F6 Factor Scoring
  // Simplified to 5×5 matrix: likelihood × impact = score
  // ============================================

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
