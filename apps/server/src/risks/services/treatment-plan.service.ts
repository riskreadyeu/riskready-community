import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, TreatmentType, TreatmentStatus, TreatmentPriority, ActionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RISKS_CONFIG } from '../../config';
import {
  isWithinTolerance,
  calculateTargetResidualScore,
  calculateExpectedReduction
} from '../utils/risk-scoring';

@Injectable()
export class TreatmentPlanService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.TreatmentPlanWhereInput;
    orderBy?: Prisma.TreatmentPlanOrderByWithRelationInput;
  }) {
    const [results, count] = await Promise.all([
      this.prisma.treatmentPlan.findMany({
        ...params,
        include: {
          risk: { select: { id: true, riskId: true, title: true, tier: true, status: true } },
          riskOwner: { select: { id: true, email: true, firstName: true, lastName: true } },
          implementer: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { actions: true } },
        },
      }),
      this.prisma.treatmentPlan.count({ where: params?.where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    const plan = await this.prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        risk: {
          select: {
            id: true,
            riskId: true,
            title: true,
            tier: true,
            status: true,
            inherentScore: true,
            residualScore: true,
          }
        },
        actions: {
          orderBy: { actionId: 'asc' },
          include: {
            assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        riskOwner: { select: { id: true, email: true, firstName: true, lastName: true } },
        implementer: { select: { id: true, email: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Treatment Plan with ID ${id} not found`);
    }

    // Auto-populate missing fields with computed defaults
    const computedDefaults = await this.computeDefaults(plan);

    return {
      ...plan,
      // Apply computed defaults for missing fields
      targetResidualScore: plan.targetResidualScore ?? computedDefaults.targetResidualScore,
      targetStartDate: plan.targetStartDate ?? computedDefaults.targetStartDate,
      targetEndDate: plan.targetEndDate ?? computedDefaults.targetEndDate,
      costBenefit: plan.costBenefit ?? computedDefaults.costBenefit,
      expectedReduction: plan.expectedReduction ?? computedDefaults.expectedReduction,
      // Flag to indicate which fields are computed (for UI to show as suggestions)
      _computed: computedDefaults._computed,
    };
  }

  /**
   * Compute smart defaults for missing treatment plan fields
   * based on associated risk scenario data
   */
  private async computeDefaults(plan: {
    riskId: string;
    targetResidualScore: number | null;
    expectedReduction: number | null;
    targetStartDate: Date | null;
    targetEndDate: Date | null;
    costBenefit: string | null;
    createdAt: Date;
    risk?: { residualScore: number | null } | null;
  }) {
    const computed: string[] = [];

    // Get risk scenario data for calculations
    const scenario = await this.prisma.riskScenario.findFirst({
      where: { riskId: plan.riskId },
      select: {
        residualScore: true,
        inherentScore: true,
        toleranceThreshold: true,
        toleranceStatus: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const currentScore = scenario?.residualScore ?? plan.risk?.residualScore ?? 0;
    const threshold = scenario?.toleranceThreshold ?? RISKS_CONFIG.tolerance.defaultThreshold;
    const toleranceStatus = scenario?.toleranceStatus ?? 'EXCEEDS';

    // Calculate target residual score if missing
    let targetResidualScore: number | null = null;
    if (plan.targetResidualScore === null) {
      targetResidualScore = Math.max(1, threshold - RISKS_CONFIG.treatment.targetScoreOffset);
      computed.push('targetResidualScore');
    }

    // Calculate expected reduction if missing
    let expectedReduction: number | null = null;
    if (plan.expectedReduction === null && currentScore > 0) {
      const targetScore = plan.targetResidualScore ?? targetResidualScore ?? 0;
      expectedReduction = Math.max(0, currentScore - targetScore);
      computed.push('expectedReduction');
    }

    // Calculate target start date if missing (use createdAt)
    let targetStartDate: Date | null = null;
    if (plan.targetStartDate === null) {
      targetStartDate = plan.createdAt;
      computed.push('targetStartDate');
    }

    // Calculate target end date if missing (based on priority/tolerance)
    let targetEndDate: Date | null = null;
    if (plan.targetEndDate === null) {
      const startDate = plan.targetStartDate ?? targetStartDate ?? new Date();
      const { deadlines } = RISKS_CONFIG.treatment;
      const daysToAdd = toleranceStatus === 'CRITICAL' ? deadlines.CRITICAL
        : toleranceStatus === 'EXCEEDS' ? deadlines.EXCEEDS
        : deadlines.DEFAULT;
      targetEndDate = new Date(startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      computed.push('targetEndDate');
    }

    // Generate cost/benefit summary if missing
    let costBenefit: string | null = null;
    if (!plan.costBenefit) {
      const targetScore = plan.targetResidualScore ?? targetResidualScore ?? 0;
      costBenefit = `Reducing risk from ${toleranceStatus} tolerance to WITHIN tolerance. Expected score reduction: ${currentScore} → ${targetScore} (${currentScore - targetScore} points).`;
      computed.push('costBenefit');
    }

    return {
      targetResidualScore,
      targetStartDate,
      targetEndDate,
      costBenefit,
      expectedReduction,
      _computed: computed,
    };
  }

  async findByRisk(riskId: string) {
    return this.prisma.treatmentPlan.findMany({
      where: { riskId },
      include: {
        actions: {
          orderBy: { actionId: 'asc' },
        },
        riskOwner: { select: { id: true, email: true, firstName: true, lastName: true } },
        implementer: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { actions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(organisationId?: string) {
    const where = organisationId ? { organisationId } : {};
    
    const [total, byStatus, byType, byPriority] = await Promise.all([
      this.prisma.treatmentPlan.count({ where }),
      this.prisma.treatmentPlan.groupBy({
        by: ['status'],
        _count: true,
        where,
      }),
      this.prisma.treatmentPlan.groupBy({
        by: ['treatmentType'],
        _count: true,
        where,
      }),
      this.prisma.treatmentPlan.groupBy({
        by: ['priority'],
        _count: true,
        where,
      }),
    ]);

    // Calculate overdue count
    const overdueCount = await this.prisma.treatmentPlan.count({
      where: {
        ...where,
        status: { in: ['IN_PROGRESS', 'APPROVED'] },
        targetEndDate: { lt: new Date() },
      },
    });

    // Calculate completed this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const completedThisMonth = await this.prisma.treatmentPlan.count({
      where: {
        ...where,
        status: 'COMPLETED',
        actualEndDate: { gte: startOfMonth },
      },
    });

    return {
      total,
      overdueCount,
      completedThisMonth,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      byType: Object.fromEntries(byType.map(t => [t.treatmentType, t._count])),
      byPriority: Object.fromEntries(byPriority.map(p => [p.priority, p._count])),
    };
  }

  async create(data: {
    treatmentId: string;
    title: string;
    description: string;
    treatmentType?: TreatmentType;
    priority?: TreatmentPriority;
    status?: TreatmentStatus;
    targetResidualScore?: number;
    expectedReduction?: number;
    estimatedCost?: number;
    costBenefit?: string;
    targetStartDate?: Date;
    targetEndDate?: Date;
    riskOwnerId?: string;
    implementerId?: string;
    acceptanceRationale?: string;
    acceptanceCriteria?: string;
    acceptanceConditions?: Prisma.InputJsonValue;
    acceptanceExpiryDate?: Date;
    controlIds?: string;
    riskId: string;
    scenarioId?: string; // Optional link to specific scenario
    organisationId: string;
    createdById: string;
  }) {
    // Check for duplicate treatmentId
    const existing = await this.prisma.treatmentPlan.findFirst({
      where: { treatmentId: data.treatmentId, organisationId: data.organisationId },
    });
    if (existing) {
      throw new ConflictException(`Treatment Plan with ID ${data.treatmentId} already exists`);
    }

    // Check for existing active treatment plans for this risk (prevent duplicates)
    const activeStatuses: TreatmentStatus[] = [
      TreatmentStatus.DRAFT,
      TreatmentStatus.PROPOSED,
      TreatmentStatus.APPROVED,
      TreatmentStatus.IN_PROGRESS,
    ];
    const existingActivePlan = await this.prisma.treatmentPlan.findFirst({
      where: {
        riskId: data.riskId,
        status: { in: activeStatuses },
      },
      select: { treatmentId: true, status: true },
    });
    if (existingActivePlan) {
      throw new ConflictException(
        `Risk already has an active treatment plan (${existingActivePlan.treatmentId}, status: ${existingActivePlan.status}). ` +
        `Complete or cancel the existing plan before creating a new one.`
      );
    }

    // Get current risk score for validation and auto-calculation
    const risk = await this.prisma.risk.findUnique({
      where: { id: data.riskId },
      select: { residualScore: true },
    });
    if (!risk) {
      throw new NotFoundException(`Risk not found`);
    }

    // Get scenario's tolerance threshold for validation
    const scenario = await this.prisma.riskScenario.findFirst({
      where: { riskId: data.riskId },
      select: { toleranceThreshold: true },
      orderBy: { createdAt: 'desc' },
    });
    const toleranceThreshold = scenario?.toleranceThreshold ?? RISKS_CONFIG.tolerance.defaultThreshold;

    let targetResidualScore = data.targetResidualScore;
    let expectedReduction = data.expectedReduction;

    // Auto-calculate if one is provided but not the other
    if (risk.residualScore) {
      if (expectedReduction && !targetResidualScore) {
        targetResidualScore = calculateTargetResidualScore(risk.residualScore, expectedReduction);
      } else if (targetResidualScore && !expectedReduction) {
        expectedReduction = calculateExpectedReduction(risk.residualScore, targetResidualScore);
      }
    }

    // Validate target score meets tolerance thresholds (unless ACCEPT type)
    if (targetResidualScore && data.treatmentType !== 'ACCEPT') {
      const isAcceptable = isWithinTolerance(targetResidualScore, toleranceThreshold);
      if (!isAcceptable) {
        throw new BadRequestException(
          `Target residual score (${targetResidualScore}) still exceeds risk tolerance threshold (${toleranceThreshold}). ` +
          `Consider additional treatments or use ACCEPT treatment type with proper justification.`
        );
      }
    }

    // Validate ACCEPT type has required fields
    if (data.treatmentType === 'ACCEPT' && !data.acceptanceRationale) {
      throw new BadRequestException(
        'ACCEPT treatment type requires acceptanceRationale to be provided'
      );
    }

    return this.prisma.treatmentPlan.create({
      data: {
        treatmentId: data.treatmentId,
        title: data.title,
        description: data.description,
        treatmentType: data.treatmentType || 'MITIGATE',
        priority: data.priority || 'MEDIUM',
        status: data.status || 'DRAFT',
        targetResidualScore,
        currentResidualScore: risk.residualScore,
        expectedReduction,
        estimatedCost: data.estimatedCost,
        costBenefit: data.costBenefit,
        targetStartDate: data.targetStartDate,
        targetEndDate: data.targetEndDate,
        riskOwnerId: data.riskOwnerId,
        implementerId: data.implementerId,
        acceptanceRationale: data.acceptanceRationale,
        acceptanceCriteria: data.acceptanceCriteria,
        acceptanceConditions: data.acceptanceConditions || [],
        acceptanceExpiryDate: data.acceptanceExpiryDate,
        controlIds: data.controlIds,
        riskId: data.riskId,
        scenarioId: data.scenarioId,
        organisationId: data.organisationId,
        createdById: data.createdById,
      },
      include: {
        risk: { select: { id: true, riskId: true, title: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    treatmentType?: TreatmentType;
    priority?: TreatmentPriority;
    status?: TreatmentStatus;
    targetResidualScore?: number;
    currentResidualScore?: number;
    expectedReduction?: number;
    estimatedCost?: number;
    actualCost?: number;
    costBenefit?: string;
    roi?: number;
    proposedDate?: Date;
    approvedDate?: Date;
    targetStartDate?: Date;
    targetEndDate?: Date;
    actualStartDate?: Date;
    actualEndDate?: Date;
    riskOwnerId?: string;
    implementerId?: string;
    approvedById?: string;
    acceptanceRationale?: string;
    acceptanceCriteria?: string;
    acceptanceConditions?: Prisma.InputJsonValue;
    acceptanceExpiryDate?: Date;
    progressPercentage?: number;
    progressNotes?: string;
    controlIds?: string;
    updatedById?: string;
  }) {
    return this.prisma.treatmentPlan.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        treatmentType: data.treatmentType,
        priority: data.priority,
        status: data.status,
        targetResidualScore: data.targetResidualScore,
        currentResidualScore: data.currentResidualScore,
        expectedReduction: data.expectedReduction,
        estimatedCost: data.estimatedCost,
        actualCost: data.actualCost,
        costBenefit: data.costBenefit,
        roi: data.roi,
        proposedDate: data.proposedDate,
        approvedDate: data.approvedDate,
        targetStartDate: data.targetStartDate,
        targetEndDate: data.targetEndDate,
        actualStartDate: data.actualStartDate,
        actualEndDate: data.actualEndDate,
        riskOwnerId: data.riskOwnerId,
        implementerId: data.implementerId,
        approvedById: data.approvedById,
        acceptanceRationale: data.acceptanceRationale,
        acceptanceCriteria: data.acceptanceCriteria,
        acceptanceConditions: data.acceptanceConditions,
        acceptanceExpiryDate: data.acceptanceExpiryDate,
        progressPercentage: data.progressPercentage,
        progressNotes: data.progressNotes,
        controlIds: data.controlIds,
        updatedById: data.updatedById,
      },
      include: {
        risk: { select: { id: true, riskId: true, title: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { actions: true } },
      },
    });
  }

  async approve(id: string, approvedById: string) {
    return this.prisma.treatmentPlan.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedDate: new Date(),
        approvedById,
        updatedById: approvedById,
      },
      include: {
        approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateProgress(id: string, progressPercentage: number, progressNotes?: string, updatedById?: string) {
    const status = progressPercentage >= 100 ? 'COMPLETED' : 'IN_PROGRESS';
    const actualEndDate = progressPercentage >= 100 ? new Date() : undefined;

    // When treatment is completed, capture actual residual score for effectiveness tracking
    let currentResidualScore: number | undefined;
    if (progressPercentage >= 100) {
      const plan = await this.prisma.treatmentPlan.findUnique({
        where: { id },
        select: { riskId: true },
      });
      
      if (plan) {
        const risk = await this.prisma.risk.findUnique({
          where: { id: plan.riskId },
          select: { residualScore: true },
        });
        currentResidualScore = risk?.residualScore || undefined;
      }
    }

    return this.prisma.treatmentPlan.update({
      where: { id },
      data: {
        progressPercentage,
        progressNotes,
        status,
        actualEndDate,
        currentResidualScore,
        updatedById,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.treatmentPlan.delete({
      where: { id },
    });
  }

  // Treatment Action methods
  async createAction(data: {
    actionId: string;
    title: string;
    description?: string;
    status?: ActionStatus;
    priority?: TreatmentPriority;
    dueDate?: Date;
    assignedToId?: string;
    estimatedHours?: number;
    treatmentPlanId: string;
    createdById: string;
  }) {
    // Check for duplicate actionId within the treatment plan
    const existing = await this.prisma.treatmentAction.findFirst({
      where: { actionId: data.actionId, treatmentPlanId: data.treatmentPlanId },
    });
    if (existing) {
      throw new ConflictException(`Action with ID ${data.actionId} already exists in this treatment plan`);
    }

    return this.prisma.treatmentAction.create({
      data: {
        actionId: data.actionId,
        title: data.title,
        description: data.description,
        status: data.status || 'NOT_STARTED',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate,
        assignedToId: data.assignedToId,
        estimatedHours: data.estimatedHours,
        treatmentPlanId: data.treatmentPlanId,
        createdById: data.createdById,
      },
      include: {
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateAction(id: string, data: {
    title?: string;
    description?: string;
    status?: ActionStatus;
    priority?: TreatmentPriority;
    dueDate?: Date;
    completedDate?: Date;
    assignedToId?: string;
    estimatedHours?: number;
    actualHours?: number;
    completionNotes?: string;
    blockerNotes?: string;
  }) {
    const action = await this.prisma.treatmentAction.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate,
        completedDate: data.completedDate,
        assignedToId: data.assignedToId,
        estimatedHours: data.estimatedHours,
        actualHours: data.actualHours,
        completionNotes: data.completionNotes,
        blockerNotes: data.blockerNotes,
      },
      include: {
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        treatmentPlan: { select: { id: true } },
      },
    });

    // Auto-update treatment plan progress based on actions
    await this.recalculatePlanProgress(action.treatmentPlan.id);

    return action;
  }

  async deleteAction(id: string) {
    const action = await this.prisma.treatmentAction.findUnique({
      where: { id },
      select: { treatmentPlanId: true },
    });

    await this.prisma.treatmentAction.delete({
      where: { id },
    });

    if (action) {
      await this.recalculatePlanProgress(action.treatmentPlanId);
    }
  }

  private async recalculatePlanProgress(treatmentPlanId: string) {
    const actions = await this.prisma.treatmentAction.findMany({
      where: { treatmentPlanId },
      select: { status: true },
    });

    if (actions.length === 0) return;

    const completed = actions.filter(a => a.status === 'COMPLETED').length;
    const progressPercentage = Math.round((completed / actions.length) * 100);

    await this.prisma.treatmentPlan.update({
      where: { id: treatmentPlanId },
      data: { progressPercentage },
    });
  }
}
