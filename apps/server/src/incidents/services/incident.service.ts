import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, IncidentStatus, IncidentSeverity, IncidentCategory, IncidentSource, IncidentResolutionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// ============================================
// TYPES
// ============================================

interface CreateIncidentDto {
  title: string;
  description: string;
  severity: IncidentSeverity;
  category?: IncidentCategory;
  source: IncidentSource;
  sourceRef?: string;
  detectedAt: Date | string;
  occurredAt?: Date | string;
  reporterId?: string;
  handlerId?: string;
  incidentManagerId?: string;
  incidentTypeId?: string;
  attackVectorId?: string;
  organisationId?: string;
  confidentialityBreach?: boolean;
  integrityBreach?: boolean;
  availabilityBreach?: boolean;
}

interface UpdateIncidentDto {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  status?: IncidentStatus;
  source?: IncidentSource;
  sourceRef?: string;
  detectedAt?: Date | string;
  occurredAt?: Date | string;
  reportedAt?: Date | string;
  classifiedAt?: Date | string;
  containedAt?: Date | string;
  eradicatedAt?: Date | string;
  recoveredAt?: Date | string;
  closedAt?: Date | string;
  reporterId?: string;
  handlerId?: string;
  incidentManagerId?: string;
  incidentTypeId?: string;
  attackVectorId?: string;
  isConfirmed?: boolean;
  resolutionType?: IncidentResolutionType;
  confidentialityBreach?: boolean;
  integrityBreach?: boolean;
  availabilityBreach?: boolean;
  evidencePreserved?: boolean;
  chainOfCustodyMaintained?: boolean;
  rootCauseIdentified?: boolean;
  lessonsLearnedCompleted?: boolean;
  correctiveActionsIdentified?: boolean;
}

interface IncidentFilters {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  source?: IncidentSource;
  handlerId?: string;
  incidentManagerId?: string;
  organisationId?: string;
  search?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  isConfirmed?: boolean;
}

// ============================================
// SERVICE
// ============================================

@Injectable()
export class IncidentService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // REFERENCE NUMBER GENERATION
  // ============================================

  private async generateReferenceNumber(organisationId?: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = 'INC';

    // Get the count of incidents this year
    const count = await this.prisma.incident.count({
      where: {
        referenceNumber: {
          startsWith: `${prefix}-${year}-`,
        },
        ...(organisationId && { organisationId }),
      },
    });

    const nextNumber = (count + 1).toString().padStart(4, '0');
    return `${prefix}-${year}-${nextNumber}`;
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.IncidentWhereInput;
    orderBy?: Prisma.IncidentOrderByWithRelationInput;
    filters?: IncidentFilters;
  }) {
    const { skip, take, orderBy, filters } = params || {};
    
    // Build where clause from filters
    const where: Prisma.IncidentWhereInput = { ...params?.where };

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.severity) where.severity = filters.severity;
      if (filters.category) where.category = filters.category;
      if (filters.source) where.source = filters.source;
      if (filters.handlerId) where.handlerId = filters.handlerId;
      if (filters.incidentManagerId) where.incidentManagerId = filters.incidentManagerId;
      if (filters.organisationId) where.organisationId = filters.organisationId;
      if (filters.isConfirmed !== undefined) where.isConfirmed = filters.isConfirmed;

      if (filters.search) {
        where.OR = [
          { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.dateFrom || filters.dateTo) {
        where.detectedAt = {};
        if (filters.dateFrom) {
          where.detectedAt.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.detectedAt.lte = new Date(filters.dateTo);
        }
      }
    }

    const [results, count] = await Promise.all([
      this.prisma.incident.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { detectedAt: 'desc' },
        select: {
          id: true,
          referenceNumber: true,
          title: true,
          severity: true,
          status: true,
          category: true,
          source: true,
          detectedAt: true,
          isConfirmed: true,
          createdAt: true,
          incidentType: { select: { id: true, name: true, category: true } },
          handler: { select: { id: true, email: true, firstName: true, lastName: true } },
          organisation: { select: { id: true, legalName: true } },
          _count: {
            select: {
              affectedAssets: true,
              evidence: true,
              timeline: true,
              lessonsLearned: true,
            },
          },
        },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return { results, count };
  }

  async findOne(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        incidentType: true,
        attackVector: true,
        handler: { select: { id: true, email: true, firstName: true, lastName: true } },
        incidentManager: { select: { id: true, email: true, firstName: true, lastName: true } },
        reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
        organisation: { select: { id: true, legalName: true, name: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        affectedAssets: {
          include: {
            asset: { select: { id: true, assetTag: true, name: true, assetType: true, businessCriticality: true } },
          },
        },
        evidence: {
          orderBy: { collectedAt: 'desc' },
          include: {
            collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        timeline: {
          orderBy: { timestamp: 'desc' },
          include: {
            createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        lessonsLearned: {
          orderBy: { priority: 'asc' },
          include: {
            assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
            createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        controlLinks: {
          include: {
            control: { select: { id: true, controlId: true, name: true, theme: true, framework: true } },
          },
        },
        nonconformityLinks: {
          include: {
            nonconformity: { select: { id: true, ncId: true, title: true, severity: true, status: true } },
          },
        },
        relatedIncidents: {
          include: {
            relatedIncident: { select: { id: true, referenceNumber: true, title: true, status: true, severity: true } },
          },
        },
        relatedTo: {
          include: {
            sourceIncident: { select: { id: true, referenceNumber: true, title: true, status: true, severity: true } },
          },
        },
        _count: {
          select: {
            affectedAssets: true,
            evidence: true,
            timeline: true,
            lessonsLearned: true,
            controlLinks: true,
            nonconformityLinks: true,
          },
        },
      },
    });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    return incident;
  }

  async create(data: CreateIncidentDto, userId: string) {
    // Get organisation ID
    let organisationId = data.organisationId;
    if (!organisationId) {
      const org = await this.prisma.organisationProfile.findFirst();
      if (!org) {
        throw new BadRequestException('No organisation found. Please create an organisation first.');
      }
      organisationId = org.id;
    }

    // Generate reference number
    const referenceNumber = await this.generateReferenceNumber(organisationId);

    // Create incident
    const incident = await this.prisma.incident.create({
      data: {
        referenceNumber,
        title: data.title,
        description: data.description,
        severity: data.severity,
        category: data.category || 'OTHER',
        source: data.source,
        sourceRef: data.sourceRef,
        detectedAt: new Date(data.detectedAt),
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined,
        reporterId: data.reporterId,
        handlerId: data.handlerId,
        incidentManagerId: data.incidentManagerId,
        incidentTypeId: data.incidentTypeId,
        attackVectorId: data.attackVectorId,
        organisationId,
        confidentialityBreach: data.confidentialityBreach || false,
        integrityBreach: data.integrityBreach || false,
        availabilityBreach: data.availabilityBreach || false,
        status: 'DETECTED',
        createdById: userId,
        updatedById: userId,
      },
      include: {
        incidentType: true,
        handler: { select: { id: true, email: true, firstName: true, lastName: true } },
        reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    // Create initial timeline entry
    await this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId: incident.id,
        timestamp: new Date(),
        entryType: 'STATUS_CHANGE',
        title: 'Incident Created',
        description: `Incident ${referenceNumber} was created with severity ${data.severity}`,
        visibility: 'INTERNAL',
        isAutomated: true,
        createdById: userId,
      },
    });

    return incident;
  }

  async update(id: string, data: UpdateIncidentDto, userId: string) {
    const existing = await this.prisma.incident.findUnique({
      where: { id },
      select: { id: true, status: true, referenceNumber: true },
    });

    if (!existing) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    // Track status changes for timeline
    const statusChanged = data.status && data.status !== existing.status;
    const previousStatus = existing.status;

    const updateData: any = {
      ...data,
      detectedAt: data.detectedAt ? new Date(data.detectedAt) : undefined,
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined,
      reportedAt: data.reportedAt ? new Date(data.reportedAt) : undefined,
      classifiedAt: data.classifiedAt ? new Date(data.classifiedAt) : undefined,
      containedAt: data.containedAt ? new Date(data.containedAt) : undefined,
      eradicatedAt: data.eradicatedAt ? new Date(data.eradicatedAt) : undefined,
      recoveredAt: data.recoveredAt ? new Date(data.recoveredAt) : undefined,
      closedAt: data.closedAt ? new Date(data.closedAt) : undefined,
      updatedById: userId,
    };
    
    // Cast resolutionType to enum if provided
    if (data.resolutionType) {
      updateData.resolutionType = data.resolutionType as IncidentResolutionType;
    }

    const incident = await this.prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        incidentType: true,
        attackVector: true,
        handler: { select: { id: true, email: true, firstName: true, lastName: true } },
        incidentManager: { select: { id: true, email: true, firstName: true, lastName: true } },
        reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    // Create timeline entry for status change
    if (statusChanged) {
      await this.prisma.incidentTimelineEntry.create({
        data: {
          incidentId: id,
          timestamp: new Date(),
          entryType: 'STATUS_CHANGE',
          title: `Status Changed: ${previousStatus} → ${data.status}`,
          description: `Incident status was changed from ${previousStatus} to ${data.status}`,
          visibility: 'INTERNAL',
          isAutomated: true,
          createdById: userId,
        },
      });
    }

    return incident;
  }

  async delete(id: string) {
    const existing = await this.prisma.incident.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    return this.prisma.incident.delete({
      where: { id },
    });
  }

  // ============================================
  // STATUS MANAGEMENT
  // ============================================

  async updateStatus(id: string, status: IncidentStatus, userId: string, notes?: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      select: { id: true, status: true, referenceNumber: true },
    });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    // Validate status transition
    const validTransitions = this.getValidStatusTransitions(incident.status);
    if (!validTransitions.includes(status)) {
      throw new BadRequestException(
        `Invalid status transition from ${incident.status} to ${status}. Valid transitions: ${validTransitions.join(', ')}`,
      );
    }

    // Determine which timestamp to update based on status
    const timestampUpdate: Partial<Record<string, Date>> = {};
    switch (status) {
      case 'TRIAGED':
        timestampUpdate['reportedAt'] = new Date();
        break;
      case 'INVESTIGATING':
        timestampUpdate['classifiedAt'] = new Date();
        break;
      case 'CONTAINING':
        break;
      case 'ERADICATING':
        timestampUpdate['containedAt'] = new Date();
        break;
      case 'RECOVERING':
        timestampUpdate['eradicatedAt'] = new Date();
        break;
      case 'POST_INCIDENT':
        timestampUpdate['recoveredAt'] = new Date();
        break;
      case 'CLOSED':
        timestampUpdate['closedAt'] = new Date();
        break;
    }

    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        status,
        ...timestampUpdate,
        updatedById: userId,
      },
    });

    // Create timeline entry
    await this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId: id,
        timestamp: new Date(),
        entryType: 'STATUS_CHANGE',
        title: `Status Changed: ${incident.status} → ${status}`,
        description: notes || `Incident status was changed from ${incident.status} to ${status}`,
        visibility: 'INTERNAL',
        isAutomated: false,
        createdById: userId,
      },
    });

    return updated;
  }

  private getValidStatusTransitions(currentStatus: IncidentStatus): IncidentStatus[] {
    const transitions: Record<IncidentStatus, IncidentStatus[]> = {
      DETECTED: ['TRIAGED', 'CLOSED'],
      TRIAGED: ['INVESTIGATING', 'CLOSED'],
      INVESTIGATING: ['CONTAINING', 'ERADICATING', 'CLOSED'],
      CONTAINING: ['ERADICATING', 'INVESTIGATING', 'CLOSED'],
      ERADICATING: ['RECOVERING', 'CONTAINING', 'CLOSED'],
      RECOVERING: ['POST_INCIDENT', 'ERADICATING', 'CLOSED'],
      POST_INCIDENT: ['CLOSED'],
      CLOSED: ['DETECTED'], // Reopen capability
    };
    return transitions[currentStatus] || [];
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getStats(organisationId?: string) {
    const where = organisationId ? { organisationId } : {};

    const [
      total,
      byStatus,
      bySeverity,
      byCategory,
      openIncidents,
      closedThisMonth,
      avgResolutionTime,
      nis2Significant,
      doraMajor,
    ] = await Promise.all([
      this.prisma.incident.count({ where }),
      this.prisma.incident.groupBy({
        by: ['status'],
        _count: true,
        where,
      }),
      this.prisma.incident.groupBy({
        by: ['severity'],
        _count: true,
        where,
      }),
      this.prisma.incident.groupBy({
        by: ['category'],
        _count: true,
        where,
      }),
      this.prisma.incident.count({
        where: {
          ...where,
          status: { notIn: ['CLOSED', 'POST_INCIDENT'] },
        },
      }),
      this.prisma.incident.count({
        where: {
          ...where,
          closedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.getAverageResolutionTime(organisationId),
      // NIS2/DORA assessment models not available in Community Edition
      Promise.resolve(0),
      Promise.resolve(0),
    ]);

    // Notification model not available in Community Edition
    const pendingNotifications = 0;

    // Calculate MTTD (Mean Time to Detect) and MTTC (Mean Time to Contain)
    const [avgMTTD, avgMTTC] = await Promise.all([
      this.getAverageMTTD(organisationId),
      this.getAverageMTTC(organisationId),
    ]);

    return {
      total,
      open: openIncidents,
      closed: closedThisMonth,
      avgMTTD,
      avgMTTR: avgResolutionTime,
      avgMTTC,
      nis2Significant: nis2Significant,
      doraMajor: doraMajor,
      overdueNotifications: pendingNotifications,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      bySeverity: Object.fromEntries(bySeverity.map((s) => [s.severity, s._count])),
      byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c._count])),
    };
  }

  private async getAverageResolutionTime(organisationId?: string): Promise<number | null> {
    const closedIncidents = await this.prisma.incident.findMany({
      where: {
        ...(organisationId && { organisationId }),
        status: 'CLOSED',
        closedAt: { not: null },
      },
      select: {
        detectedAt: true,
        closedAt: true,
      },
      take: 100, // Last 100 closed incidents
      orderBy: { closedAt: 'desc' },
    });

    if (closedIncidents.length === 0) return null;

    const totalHours = closedIncidents.reduce((sum, inc) => {
      if (!inc.closedAt) return sum;
      const hours = (inc.closedAt.getTime() - inc.detectedAt.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return Math.round((totalHours / closedIncidents.length) * 10) / 10;
  }

  private async getAverageMTTD(organisationId?: string): Promise<number | null> {
    // MTTD: time from occurredAt to detectedAt
    const incidents = await this.prisma.incident.findMany({
      where: {
        ...(organisationId && { organisationId }),
        occurredAt: { not: null },
      },
      select: { occurredAt: true, detectedAt: true },
      take: 100,
      orderBy: { detectedAt: 'desc' },
    });

    if (incidents.length === 0) return null;

    const totalHours = incidents.reduce((sum, inc) => {
      if (!inc.occurredAt) return sum;
      const hours = (inc.detectedAt.getTime() - inc.occurredAt.getTime()) / (1000 * 60 * 60);
      return sum + Math.max(0, hours);
    }, 0);

    return Math.round((totalHours / incidents.length) * 10) / 10;
  }

  private async getAverageMTTC(organisationId?: string): Promise<number | null> {
    // MTTC: time from detectedAt to containedAt
    const incidents = await this.prisma.incident.findMany({
      where: {
        ...(organisationId && { organisationId }),
        containedAt: { not: null },
      },
      select: { detectedAt: true, containedAt: true },
      take: 100,
      orderBy: { containedAt: 'desc' },
    });

    if (incidents.length === 0) return null;

    const totalHours = incidents.reduce((sum, inc) => {
      if (!inc.containedAt) return sum;
      const hours = (inc.containedAt.getTime() - inc.detectedAt.getTime()) / (1000 * 60 * 60);
      return sum + Math.max(0, hours);
    }, 0);

    return Math.round((totalHours / incidents.length) * 10) / 10;
  }

  // ============================================
  // DASHBOARD DATA
  // ============================================

  async getDashboardData(organisationId?: string) {
    const where = organisationId ? { organisationId } : {};

    const [stats, recentIncidents, upcomingDeadlines, severityTrend] = await Promise.all([
      this.getStats(organisationId),
      this.prisma.incident.findMany({
        where,
        orderBy: { detectedAt: 'desc' },
        take: 10,
        include: {
          handler: { select: { id: true, firstName: true, lastName: true } },
          incidentType: { select: { name: true } },
        },
      }),
      this.getUpcomingDeadlines(organisationId),
      this.getSeverityTrend(organisationId),
    ]);

    return {
      stats,
      recentIncidents,
      upcomingDeadlines,
      severityTrend,
    };
  }

  private async getUpcomingDeadlines(organisationId?: string) {
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // NIS2/DORA/Notification models not available in Community Edition
    return {
      nis2: [] as any[],
      dora: [] as any[],
      notifications: [] as any[],
    };
  }

  private async getSeverityTrend(organisationId?: string) {
    const where = organisationId ? { organisationId } : {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const incidents = await this.prisma.incident.findMany({
      where: {
        ...where,
        detectedAt: { gte: thirtyDaysAgo },
      },
      select: {
        detectedAt: true,
        severity: true,
      },
      orderBy: { detectedAt: 'asc' },
    });

    // Group by week and severity
    const trend: Record<string, Record<string, number>> = {};
    incidents.forEach((inc) => {
      const weekStart = new Date(inc.detectedAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0]!;

      if (!trend[weekKey]) {
        trend[weekKey] = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      }
      const weekData = trend[weekKey]!;
      weekData[inc.severity] = (weekData[inc.severity] ?? 0) + 1;
    });

    return Object.entries(trend).map(([week, counts]) => ({
      week,
      ...counts,
    }));
  }

  // ============================================
  // ASSET MANAGEMENT
  // ============================================

  async addAffectedAsset(
    incidentId: string,
    assetId: string,
    impactType: string,
    notes?: string,
  ) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });
    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });
    if (!asset) {
      throw new NotFoundException(`Asset ${assetId} not found`);
    }

    return this.prisma.incidentAsset.create({
      data: {
        incidentId,
        assetId,
        impactType: impactType as any,
        notes,
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true, assetType: true } },
      },
    });
  }

  async removeAffectedAsset(incidentId: string, assetId: string) {
    return this.prisma.incidentAsset.delete({
      where: {
        incidentId_assetId: { incidentId, assetId },
      },
    });
  }

  // ============================================
  // CONTROL LINKS
  // ============================================

  async linkControl(
    incidentId: string,
    controlId: string,
    linkType: string,
    notes?: string,
  ) {
    return this.prisma.incidentControl.create({
      data: {
        incidentId,
        controlId,
        linkType,
        notes,
      },
      include: {
        control: { select: { id: true, controlId: true, name: true, theme: true } },
      },
    });
  }

  async unlinkControl(incidentId: string, controlId: string) {
    return this.prisma.incidentControl.delete({
      where: {
        incidentId_controlId: { incidentId, controlId },
      },
    });
  }
}

