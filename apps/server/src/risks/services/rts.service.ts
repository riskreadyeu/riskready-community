import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, ToleranceLevel, RTSStatus, ControlFramework, ImpactCategory } from '@prisma/client';

type AppetiteLevel = string;
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RiskToleranceStatementService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.RiskToleranceStatementWhereInput;
    orderBy?: Prisma.RiskToleranceStatementOrderByWithRelationInput;
  }) {
    const [results, count] = await Promise.all([
      this.prisma.riskToleranceStatement.findMany({
        ...params,
        include: {
          _count: { select: { risks: true, scenarios: true, kris: true } },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.riskToleranceStatement.count({ where: params?.where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    const rts = await this.prisma.riskToleranceStatement.findUnique({
      where: { id },
      include: {
        risks: {
          select: { id: true, riskId: true, title: true, tier: true, status: true },
        },
        scenarios: {
          select: { id: true, scenarioId: true, title: true },
        },
        kris: {
          select: { id: true, kriId: true, name: true, status: true },
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!rts) {
      throw new NotFoundException(`Risk Tolerance Statement with ID ${id} not found`);
    }

    return rts;
  }

  async getStats(organisationId?: string) {
    const where = organisationId ? { organisationId } : {};

    // Get the selected appetite level from organisation profile
    let selectedAppetiteLevel: string | null = null;
    if (organisationId) {
      const profile = await this.prisma.organisationProfile.findUnique({
        where: { id: organisationId },
        select: { riskAppetite: true },
      });
      selectedAppetiteLevel = profile?.riskAppetite ?? null;
    }

    // Build where clause for matching RTS (those that match the selected appetite)
    const matchingWhere = selectedAppetiteLevel
      ? { ...where, appetiteLevel: selectedAppetiteLevel as AppetiteLevel, status: RTSStatus.ACTIVE }
      : { ...where, status: RTSStatus.ACTIVE };

    const [total, byStatus, byLevel, byDomain, matchingCount] = await Promise.all([
      this.prisma.riskToleranceStatement.count({ where }),
      this.prisma.riskToleranceStatement.groupBy({
        by: ['status'],
        _count: true,
        where,
      }),
      this.prisma.riskToleranceStatement.groupBy({
        by: ['proposedToleranceLevel'],
        _count: true,
        where,
      }),
      this.prisma.riskToleranceStatement.groupBy({
        by: ['domain'],
        _count: true,
        where,
      }),
      // Count only RTS matching the selected appetite level
      this.prisma.riskToleranceStatement.count({ where: matchingWhere }),
    ]);

    // Override the ACTIVE count with the matching count
    const byStatusMap = Object.fromEntries(byStatus.map(s => [s.status, s._count]));
    byStatusMap['ACTIVE'] = matchingCount;

    return {
      total,
      byStatus: byStatusMap,
      byLevel: Object.fromEntries(byLevel.map(l => [l.proposedToleranceLevel, l._count])),
      byDomain: byDomain.filter(d => d.domain).map(d => ({ domain: d.domain, count: d._count })),
      selectedAppetiteLevel,
    };
  }

  async create(data: {
    rtsId: string;
    title: string;
    objective: string;
    domain?: string;
    proposedToleranceLevel?: ToleranceLevel;
    proposedRTS: string;
    conditions?: Prisma.InputJsonValue;
    anticipatedOperationalImpact?: string;
    rationale?: string;
    status?: RTSStatus;
    framework?: ControlFramework;
    controlIds?: string;
    appetiteLevel?: AppetiteLevel;
    category?: ImpactCategory;
    toleranceThreshold?: number;
    effectiveDate?: Date;
    reviewDate?: Date;
    riskIds?: string[];
    scenarioIds?: string[];
    kriIds?: string[];
    organisationId: string;
    createdById: string;
  }) {
    // Check for duplicate rtsId
    const existing = await this.prisma.riskToleranceStatement.findFirst({
      where: { rtsId: data.rtsId, organisationId: data.organisationId },
    });
    if (existing) {
      throw new ConflictException(`RTS with ID ${data.rtsId} already exists`);
    }

    return this.prisma.riskToleranceStatement.create({
      data: {
        rtsId: data.rtsId,
        title: data.title,
        objective: data.objective,
        domain: data.domain,
        proposedToleranceLevel: data.proposedToleranceLevel || 'MEDIUM',
        proposedRTS: data.proposedRTS,
        conditions: data.conditions || [],
        anticipatedOperationalImpact: data.anticipatedOperationalImpact,
        rationale: data.rationale,
        status: data.status || 'DRAFT',
        framework: data.framework || 'ISO',
        controlIds: data.controlIds,
        appetiteLevel: data.appetiteLevel,
        category: data.category,
        toleranceThreshold: data.toleranceThreshold,
        effectiveDate: data.effectiveDate,
        reviewDate: data.reviewDate,
        organisationId: data.organisationId,
        createdById: data.createdById,
        risks: data.riskIds ? { connect: data.riskIds.map(id => ({ id })) } : undefined,
        scenarios: data.scenarioIds ? { connect: data.scenarioIds.map(id => ({ id })) } : undefined,
        kris: data.kriIds ? { connect: data.kriIds.map(id => ({ id })) } : undefined,
      },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { risks: true, scenarios: true, kris: true } },
      },
    });
  }

  async update(id: string, data: {
    title?: string;
    objective?: string;
    domain?: string;
    proposedToleranceLevel?: ToleranceLevel;
    proposedRTS?: string;
    conditions?: Prisma.InputJsonValue;
    anticipatedOperationalImpact?: string;
    rationale?: string;
    status?: RTSStatus;
    framework?: ControlFramework;
    controlIds?: string;
    appetiteLevel?: AppetiteLevel;
    category?: ImpactCategory;
    toleranceThreshold?: number;
    effectiveDate?: Date;
    reviewDate?: Date;
    approvedDate?: Date;
    approvedById?: string;
    riskIds?: string[];
    scenarioIds?: string[];
    kriIds?: string[];
    updatedById?: string;
  }) {
    // Build the update data
    const updateData: Prisma.RiskToleranceStatementUpdateInput = {
      title: data.title,
      objective: data.objective,
      domain: data.domain,
      proposedToleranceLevel: data.proposedToleranceLevel,
      proposedRTS: data.proposedRTS,
      conditions: data.conditions,
      anticipatedOperationalImpact: data.anticipatedOperationalImpact,
      rationale: data.rationale,
      status: data.status,
      framework: data.framework,
      controlIds: data.controlIds,
      appetiteLevel: data.appetiteLevel,
      category: data.category,
      toleranceThreshold: data.toleranceThreshold,
      effectiveDate: data.effectiveDate,
      reviewDate: data.reviewDate,
      approvedDate: data.approvedDate,
    };

    if (data.updatedById) {
      updateData.updatedBy = { connect: { id: data.updatedById } };
    }

    if (data.approvedById) {
      updateData.approvedBy = { connect: { id: data.approvedById } };
    }

    // Handle many-to-many relations
    if (data.riskIds !== undefined) {
      updateData.risks = { set: data.riskIds.map(rid => ({ id: rid })) };
    }
    if (data.scenarioIds !== undefined) {
      updateData.scenarios = { set: data.scenarioIds.map(sid => ({ id: sid })) };
    }
    if (data.kriIds !== undefined) {
      updateData.kris = { set: data.kriIds.map(kid => ({ id: kid })) };
    }

    return this.prisma.riskToleranceStatement.update({
      where: { id },
      data: updateData,
      include: {
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { risks: true, scenarios: true, kris: true } },
      },
    });
  }

  async approve(id: string, approvedById: string) {
    return this.prisma.riskToleranceStatement.update({
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

  async delete(id: string) {
    return this.prisma.riskToleranceStatement.delete({
      where: { id },
    });
  }

  async findByRisk(riskId: string) {
    return this.prisma.riskToleranceStatement.findMany({
      where: {
        risks: {
          some: { id: riskId },
        },
      },
      include: {
        _count: { select: { risks: true, scenarios: true, kris: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async linkRisks(rtsId: string, riskIds: string[]) {
    return this.prisma.riskToleranceStatement.update({
      where: { id: rtsId },
      data: {
        risks: { connect: riskIds.map(id => ({ id })) },
      },
      include: {
        risks: { select: { id: true, riskId: true, title: true, tier: true, status: true } },
        _count: { select: { risks: true, scenarios: true, kris: true } },
      },
    });
  }

  async unlinkRisks(rtsId: string, riskIds: string[]) {
    return this.prisma.riskToleranceStatement.update({
      where: { id: rtsId },
      data: {
        risks: { disconnect: riskIds.map(id => ({ id })) },
      },
      include: {
        risks: { select: { id: true, riskId: true, title: true, tier: true, status: true } },
        _count: { select: { risks: true, scenarios: true, kris: true } },
      },
    });
  }
}
