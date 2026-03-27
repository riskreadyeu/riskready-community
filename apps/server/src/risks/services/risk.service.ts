import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, RiskStatus, RiskTier, ControlFramework, LikelihoodLevel, ImpactLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { aggregateScores } from '../utils/risk-scoring';

@Injectable()
export class RiskService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.RiskWhereInput;
    orderBy?: Prisma.RiskOrderByWithRelationInput;
  }) {
    const [results, count] = await Promise.all([
      this.prisma.risk.findMany({
        ...params,
        include: {
          _count: { select: { scenarios: true, kris: true } },
          scenarios: {
            orderBy: { scenarioId: 'asc' },
            select: {
              id: true,
              scenarioId: true,
              title: true,
              likelihood: true,
              impact: true,
              inherentScore: true,
              residualLikelihood: true,
              residualImpact: true,
              residualScore: true,
              calculatedResidualLikelihood: true,
              calculatedResidualImpact: true,
              calculatedResidualScore: true,
            },
          },
        },
      }),
      this.prisma.risk.count({ where: params?.where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.risk.findUnique({
      where: { id },
      include: {
        _count: { 
          select: { 
            scenarios: true, 
            kris: true, 
            treatmentPlans: true,
            toleranceStatements: true,
          } 
        },
        scenarios: {
          orderBy: { scenarioId: 'asc' },
          include: {
            createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
            _count: { select: { controlLinks: true } },
            controlLinks: {
              select: {
                control: {
                  select: { id: true, controlId: true, name: true },
                },
              },
            },
          },
        },
        kris: {
          orderBy: { kriId: 'asc' },
          include: {
            createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        // NOTE: Risk-level controls removed - use scenario.controlLinks instead
        treatmentPlans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            treatmentId: true,
            title: true,
            treatmentType: true,
            priority: true,
            status: true,
            progressPercentage: true,
            targetEndDate: true,
          },
        },
        toleranceStatements: {
          select: {
            id: true,
            rtsId: true,
            title: true,
            domain: true,
            proposedToleranceLevel: true,
            status: true,
            proposedRTS: true,
          },
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async getStats(organisationId?: string) {
    const where = organisationId ? { organisationId } : {};
    
    const [total, byTier, byStatus, byFramework] = await Promise.all([
      this.prisma.risk.count({ where }),
      this.prisma.risk.groupBy({
        by: ['tier'],
        _count: true,
        where,
      }),
      this.prisma.risk.groupBy({
        by: ['status'],
        _count: true,
        where,
      }),
      this.prisma.risk.groupBy({
        by: ['framework'],
        _count: true,
        where,
      }),
    ]);

    const scenarioCount = await this.prisma.riskScenario.count();
    const kriCount = await this.prisma.keyRiskIndicator.count();

    return {
      total,
      scenarioCount,
      kriCount,
      byTier: Object.fromEntries(byTier.map(t => [t.tier, t._count])),
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      byFramework: Object.fromEntries(byFramework.map(f => [f.framework, f._count])),
    };
  }

  async create(data: {
    riskId: string;
    title: string;
    description?: string;
    tier?: RiskTier;
    status?: RiskStatus;
    framework?: ControlFramework;
    riskOwner?: string;
    likelihood?: LikelihoodLevel;
    impact?: ImpactLevel;
    applicable?: boolean;
    justificationIfNa?: string;
    soc2Criteria?: string;
    tscCategory?: string;
    orgSize?: string;
    organisationId: string;
    createdById: string;
  }) {
    // Check for duplicate riskId
    const existing = await this.prisma.risk.findFirst({
      where: { riskId: data.riskId, organisationId: data.organisationId },
    });
    if (existing) {
      throw new ConflictException(`Risk with ID ${data.riskId} already exists`);
    }

    return this.prisma.risk.create({
      data: {
        riskId: data.riskId,
        title: data.title,
        description: data.description,
        tier: data.tier || 'CORE',
        status: data.status || 'IDENTIFIED',
        framework: data.framework || 'ISO',
        riskOwner: data.riskOwner,
        likelihood: data.likelihood,
        impact: data.impact,
        applicable: data.applicable,
        justificationIfNa: data.justificationIfNa,
        soc2Criteria: data.soc2Criteria,
        tscCategory: data.tscCategory,
        orgSize: data.orgSize,
        organisationId: data.organisationId,
        createdById: data.createdById,
      },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    tier?: RiskTier;
    status?: RiskStatus;
    framework?: ControlFramework;
    likelihood?: LikelihoodLevel;
    impact?: ImpactLevel;
    inherentScore?: number;
    residualScore?: number;
    riskOwner?: string;
    treatmentPlan?: string;
    acceptanceCriteria?: string;
    applicable?: boolean;
    justificationIfNa?: string;
    soc2Criteria?: string;
    tscCategory?: string;
    orgSize?: string;
    updatedById?: string;
  }) {
    return this.prisma.risk.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        tier: data.tier,
        status: data.status,
        framework: data.framework,
        likelihood: data.likelihood,
        impact: data.impact,
        riskOwner: data.riskOwner,
        treatmentPlan: data.treatmentPlan,
        acceptanceCriteria: data.acceptanceCriteria,
        inherentScore: data.inherentScore,
        residualScore: data.residualScore,
        applicable: data.applicable,
        justificationIfNa: data.justificationIfNa,
        soc2Criteria: data.soc2Criteria,
        tscCategory: data.tscCategory,
        orgSize: data.orgSize,
        updatedById: data.updatedById,
      },
      include: {
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Recalculate parent risk scores from scenario scores
   * Uses MAX aggregation - highest scenario score becomes the risk score
   */
  async recalculateScores(riskId: string) {
    // Get all scenario scores for this risk
    const scenarios = await this.prisma.riskScenario.findMany({
      where: { riskId },
      select: { inherentScore: true, residualScore: true },
    });

    // Aggregate scores using MAX
    const { inherentScore, residualScore } = aggregateScores(scenarios);

    // Update the parent risk
    return this.prisma.risk.update({
      where: { id: riskId },
      data: {
        inherentScore: inherentScore || null,
        residualScore: residualScore || null,
      },
    });
  }

  async delete(id: string) {
    const risk = await this.prisma.risk.findUnique({ where: { id } });
    if (!risk) {
      throw new NotFoundException(`Risk with ID ${id} not found`);
    }
    return this.prisma.risk.delete({ where: { id } });
  }

  // NOTE: Risk-level control linking has been removed.
  // Use RiskScenarioService.linkControl/unlinkControl/getLinkedControls for scenario-level control linking.

  /**
   * Disable a risk manually (separate from regulatory applicability)
   */
  async disableRisk(id: string, reason: string, userId: string) {
    const risk = await this.prisma.risk.findUnique({ where: { id } });
    if (!risk) {
      throw new NotFoundException(`Risk with ID ${id} not found`);
    }

    return this.prisma.risk.update({
      where: { id },
      data: {
        enabled: false,
        disabledReason: reason,
        disabledAt: new Date(),
        disabledById: userId,
      },
      include: {
        disabledBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Enable a risk manually
   * Cannot enable if risk is not applicable (regulatory scope takes precedence)
   */
  async enableRisk(id: string, userId: string) {
    const risk = await this.prisma.risk.findUnique({ where: { id } });
    if (!risk) {
      throw new NotFoundException(`Risk with ID ${id} not found`);
    }

    if (!risk.applicable) {
      throw new BadRequestException(
        'Cannot enable a risk that is not applicable. The risk is out of regulatory scope.'
      );
    }

    return this.prisma.risk.update({
      where: { id },
      data: {
        enabled: true,
        disabledReason: null,
        disabledAt: null,
        disabledById: null,
      },
    });
  }
}

