import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CONTROLS_CONFIG } from '../../config';

@Injectable()
export class ControlService {
  constructor(private prisma: PrismaService) {}

  private async calculateBatchEffectiveness(controlIds: string[]) {
    if (controlIds.length === 0) {
      return new Map<string, {
        score: number;
        rating: string;
        passCount: number;
        partialCount: number;
        failCount: number;
        notTestedCount: number;
        totalLayers: number;
      }>();
    }

    // ControlLayer removed in community edition — return "Not Assessed" for all controls
    const effectivenessMap = new Map<string, {
      score: number;
      rating: string;
      passCount: number;
      partialCount: number;
      failCount: number;
      notTestedCount: number;
      totalLayers: number;
    }>();

    for (const controlId of controlIds) {
      effectivenessMap.set(controlId, {
        score: 0,
        rating: 'Not Assessed',
        passCount: 0,
        partialCount: 0,
        failCount: 0,
        notTestedCount: 0,
        totalLayers: 0,
      });
    }

    return effectivenessMap;
  }

  async create(data: {
    controlId: string;
    theme: string;
    name: string;
    description?: string;
    framework?: string;
    sourceStandard?: string;
    soc2Criteria?: string;
    tscCategory?: string;
    applicable?: boolean;
    justificationIfNa?: string;
    implementationStatus?: string;
    implementationDesc?: string;
    organisationId: string;
    createdById?: string;
  }) {
    const existing = await this.prisma.control.findUnique({
      where: {
        controlId_organisationId: {
          controlId: data.controlId,
          organisationId: data.organisationId,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Control with ID "${data.controlId}" already exists in this organisation.`,
      );
    }

    return this.prisma.control.create({
      data: {
        controlId: data.controlId,
        theme: data.theme as any,
        name: data.name,
        description: data.description,
        framework: (data.framework as any) || 'ISO',
        sourceStandard: data.sourceStandard,
        soc2Criteria: data.soc2Criteria,
        tscCategory: data.tscCategory,
        applicable: data.applicable ?? true,
        justificationIfNa: data.justificationIfNa,
        implementationStatus: (data.implementationStatus as any) || 'NOT_STARTED',
        implementationDesc: data.implementationDesc,
        organisationId: data.organisationId,
        createdById: data.createdById,
      },
      include: {
        _count: { select: { assessmentControls: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ControlWhereInput;
    orderBy?: Prisma.ControlOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.control.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { controlId: 'asc' },
        include: {
          _count: { select: { assessmentControls: true } },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          disabledBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.control.count({ where }),
    ]);

    const effectivenessMap = await this.calculateBatchEffectiveness(results.map((control) => control.id));
    const resultsWithEffectiveness = results.map((control) => ({
      ...control,
      effectiveness: effectivenessMap.get(control.id) || {
        score: 0,
        rating: 'Not Assessed',
        passCount: 0,
        partialCount: 0,
        failCount: 0,
        notTestedCount: 0,
        totalLayers: 0,
      },
    }));

    return { results: resultsWithEffectiveness, count };
  }

  async findOne(id: string) {
    const control = await this.prisma.control.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        organisation: { select: { id: true, name: true } },
        _count: { select: { assessmentControls: true } },
      },
    });

    if (control) {
      const effectiveness = await this.calculateControlEffectiveness(id);
      return { ...control, effectiveness };
    }

    return control;
  }

  async findByControlId(controlId: string, organisationId: string) {
    return this.prisma.control.findUnique({
      where: {
        controlId_organisationId: { controlId, organisationId },
      },
      include: {
        _count: { select: { assessmentControls: true } },
      },
    });
  }

  /**
   * Find controls by an array of IDs
   * Optimized for fetching multiple specific controls (e.g., linked to a risk scenario)
   */
  async findByIds(ids: string[]) {
    if (!ids || ids.length === 0) {
      return [];
    }

    const controls = await this.prisma.control.findMany({
      where: { id: { in: ids } },
      include: {
        _count: { select: { assessmentControls: true } },
      },
    });

    // Calculate effectiveness for each control
    const controlsWithEffectiveness = await Promise.all(
      controls.map(async (control) => {
        const effectiveness = await this.calculateControlEffectiveness(control.id);
        return { ...control, effectiveness };
      })
    );

    return controlsWithEffectiveness;
  }

  async update(id: string, data: Prisma.ControlUpdateInput) {
    const control = await this.prisma.control.findUnique({ where: { id } });
    if (!control) {
      throw new NotFoundException(
        `Control with ID ${id} not found. Cannot update a non-existent control. Please verify the control ID and try again.`,
      );
    }
    return this.prisma.control.update({
      where: { id },
      data,
      include: {
        _count: { select: { assessmentControls: true } },
      },
    });
  }

  async getStats(organisationId: string) {
    const [total, applicable, implemented, partial, notStarted, byTheme] = await Promise.all([
      this.prisma.control.count({ where: { organisationId } }),
      this.prisma.control.count({ where: { organisationId, applicable: true } }),
      this.prisma.control.count({ where: { organisationId, implementationStatus: 'IMPLEMENTED' } }),
      this.prisma.control.count({ where: { organisationId, implementationStatus: 'PARTIAL' } }),
      this.prisma.control.count({ where: { organisationId, implementationStatus: 'NOT_STARTED' } }),
      this.prisma.control.groupBy({
        by: ['theme'],
        where: { organisationId },
        _count: true,
      }),
    ]);

    return {
      total,
      applicable,
      notApplicable: total - applicable,
      implemented,
      partial,
      notStarted,
      byTheme: byTheme.reduce((acc, item) => {
        acc[item.theme] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async calculateControlEffectiveness(controlId: string): Promise<{
    score: number;
    rating: string;
    passCount: number;
    partialCount: number;
    failCount: number;
    notTestedCount: number;
    totalLayers: number;
  }> {
    // ControlLayer removed in community edition — return default "Not Assessed"
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
   * Disable a control manually (separate from regulatory applicability)
   */
  async disableControl(id: string, reason: string, userId: string) {
    const control = await this.prisma.control.findUnique({ where: { id } });
    if (!control) {
      throw new NotFoundException(`Control with ID ${id} not found`);
    }

    return this.prisma.control.update({
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
   * Enable a control manually
   * Cannot enable if control is not applicable (regulatory scope takes precedence)
   */
  async enableControl(id: string, userId: string) {
    const control = await this.prisma.control.findUnique({ where: { id } });
    if (!control) {
      throw new NotFoundException(`Control with ID ${id} not found`);
    }

    if (!control.applicable) {
      throw new BadRequestException(
        'Cannot enable a control that is not applicable. The control is out of regulatory scope.'
      );
    }

    return this.prisma.control.update({
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
