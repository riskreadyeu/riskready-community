import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, SOAStatus } from '@prisma/client';

@Injectable()
export class SOAService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.StatementOfApplicabilityWhereInput;
    orderBy?: Prisma.StatementOfApplicabilityOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    const [data, total] = await Promise.all([
      this.prisma.statementOfApplicability.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { entries: true } },
        },
      }),
      this.prisma.statementOfApplicability.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    return this.prisma.statementOfApplicability.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        entries: {
          orderBy: { controlId: 'asc' },
        },
        _count: { select: { entries: true } },
      },
    });
  }

  async findLatestByOrganisation(organisationId: string) {
    return this.prisma.statementOfApplicability.findFirst({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { entries: true } },
      },
    });
  }

  async getStats(organisationId?: string) {
    // Get latest SOA (optionally filtered by org)
    const whereClause = organisationId ? { organisationId } : {};
    const latest = await this.prisma.statementOfApplicability.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { entries: true } },
      },
    });

    if (!latest) {
      return {
        totalVersions: 0,
        latestVersion: null,
        latestStatus: null,
        applicableCount: 0,
        notApplicableCount: 0,
        implementedCount: 0,
        partialCount: 0,
        notStartedCount: 0,
      };
    }

    const entries = await this.prisma.sOAEntry.findMany({
      where: { soaId: latest.id },
    });

    const applicableCount = entries.filter(e => e.applicable).length;
    const notApplicableCount = entries.filter(e => !e.applicable).length;
    const implementedCount = entries.filter(e => e.implementationStatus === 'IMPLEMENTED').length;
    const partialCount = entries.filter(e => e.implementationStatus === 'PARTIAL').length;
    const notStartedCount = entries.filter(e => e.implementationStatus === 'NOT_STARTED').length;

    const totalVersions = await this.prisma.statementOfApplicability.count({
      where: whereClause,
    });

    return {
      totalVersions,
      latestVersion: latest.version,
      latestStatus: latest.status,
      applicableCount,
      notApplicableCount,
      implementedCount,
      partialCount,
      notStartedCount,
    };
  }

  async create(data: {
    version: string;
    name?: string;
    notes?: string;
    organisationId: string;
    createdById?: string;
  }) {
    return this.prisma.statementOfApplicability.create({
      data: {
        version: data.version,
        name: data.name,
        notes: data.notes,
        status: 'DRAFT',
        organisationId: data.organisationId,
        createdById: data.createdById,
        updatedById: data.createdById,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { entries: true } },
      },
    });
  }

  async createFromControls(data: {
    version: string;
    name?: string;
    notes?: string;
    organisationId: string;
    createdById?: string;
  }) {
    // Create SOA and populate entries from existing controls
    const controls = await this.prisma.control.findMany({
      where: { organisationId: data.organisationId },
      orderBy: { controlId: 'asc' },
    });

    const soa = await this.prisma.statementOfApplicability.create({
      data: {
        version: data.version,
        name: data.name,
        notes: data.notes,
        status: 'DRAFT',
        organisationId: data.organisationId,
        createdById: data.createdById,
        updatedById: data.createdById,
        entries: {
          create: controls.map(control => ({
            controlId: control.controlId,
            controlName: control.name,
            theme: control.theme,
            applicable: control.applicable,
            justificationIfNa: control.justificationIfNa,
            implementationStatus: control.implementationStatus,
            implementationDesc: control.implementationDesc,
            controlRecordId: control.id,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        entries: true,
        _count: { select: { entries: true } },
      },
    });

    return soa;
  }

  async createNewVersion(sourceId: string, data: {
    version: string;
    name?: string;
    notes?: string;
    createdById?: string;
  }) {
    // Get source SOA with entries
    const source = await this.prisma.statementOfApplicability.findUnique({
      where: { id: sourceId },
      include: { entries: true },
    });

    if (!source) {
      throw new NotFoundException(
        `Source SOA with ID ${sourceId} not found. Cannot create new version from a non-existent SOA. Please verify the source SOA ID and try again.`,
      );
    }

    // Create new version with copied entries
    const newSoa = await this.prisma.statementOfApplicability.create({
      data: {
        version: data.version,
        name: data.name,
        notes: data.notes,
        status: 'DRAFT',
        organisationId: source.organisationId,
        createdById: data.createdById,
        updatedById: data.createdById,
        entries: {
          create: source.entries.map(entry => ({
            controlId: entry.controlId,
            controlName: entry.controlName,
            theme: entry.theme,
            applicable: entry.applicable,
            justificationIfNa: entry.justificationIfNa,
            implementationStatus: entry.implementationStatus,
            implementationDesc: entry.implementationDesc,
            parentRiskId: entry.parentRiskId,
            scenarioIds: entry.scenarioIds,
            controlRecordId: entry.controlRecordId,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        entries: true,
        _count: { select: { entries: true } },
      },
    });

    return newSoa;
  }

  async update(id: string, data: {
    name?: string;
    notes?: string;
    updatedById?: string;
  }) {
    const soa = await this.prisma.statementOfApplicability.findUnique({ where: { id } });
    if (!soa) {
      throw new NotFoundException(
        `SOA with ID ${id} not found. Cannot update a non-existent SOA. Please verify the SOA ID and try again.`,
      );
    }
    return this.prisma.statementOfApplicability.update({
      where: { id },
      data: {
        name: data.name,
        notes: data.notes,
        updatedById: data.updatedById,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { entries: true } },
      },
    });
  }

  async submitForReview(id: string, updatedById?: string) {
    const soa = await this.prisma.statementOfApplicability.findUnique({ where: { id } });
    if (!soa) {
      throw new NotFoundException(
        `SOA with ID ${id} not found. Cannot submit a non-existent SOA for review. Please verify the SOA ID and try again.`,
      );
    }
    return this.prisma.statementOfApplicability.update({
      where: { id },
      data: {
        status: 'PENDING_REVIEW',
        updatedById,
      },
    });
  }

  async approve(id: string, approvedById: string) {
    // Mark previous approved versions as superseded
    const soa = await this.prisma.statementOfApplicability.findUnique({
      where: { id },
    });

    if (!soa) {
      throw new NotFoundException(
        `SOA with ID ${id} not found. Cannot approve a non-existent SOA. Please verify the SOA ID and try again.`,
      );
    }

    await this.prisma.statementOfApplicability.updateMany({
      where: {
        organisationId: soa.organisationId,
        status: 'APPROVED',
        id: { not: id },
      },
      data: { status: 'SUPERSEDED' },
    });

    return this.prisma.statementOfApplicability.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById,
        updatedById: approvedById,
      },
      include: {
        approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async delete(id: string) {
    const soa = await this.prisma.statementOfApplicability.findUnique({ where: { id } });
    if (!soa) {
      throw new NotFoundException(
        `SOA with ID ${id} not found. Cannot delete a non-existent SOA. Please verify the SOA ID and try again.`,
      );
    }
    return this.prisma.statementOfApplicability.delete({
      where: { id },
    });
  }

}
