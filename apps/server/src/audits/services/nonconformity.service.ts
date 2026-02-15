import { Injectable, BadRequestException, ForbiddenException, OnModuleInit, Optional, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { NonconformitySource, NCSeverity, NCCategory, NCStatus, CAPStatus } from '@prisma/client';

// LayerType is defined in schema but not attached to a model, so Prisma doesn't export it
const LayerType = { GOVERNANCE: 'GOVERNANCE', PLATFORM: 'PLATFORM', CONSUMPTION: 'CONSUMPTION', OVERSIGHT: 'OVERSIGHT' } as const;
import { TestFailedEvent } from '../../shared/events/control-events';

@Injectable()
export class NonconformityService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    @Optional() private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    if (!this.eventEmitter) {
      console.warn('WARNING: EventEmitter is not available in NonconformityService - event listening disabled');
      return;
    }

    // Listen for test failed events and auto-create nonconformities
    this.eventEmitter.on('test.failed', async (event: TestFailedEvent) => {
      try {
        // Determine severity based on layer type
        const severity = event.layerType === LayerType.OVERSIGHT
          ? NCSeverity.MAJOR
          : NCSeverity.MINOR;

        await this.create({
          source: NonconformitySource.TEST,
          sourceReferenceId: event.assessmentTestId || event.testId,
          severity,
          category: NCCategory.CONTROL_FAILURE,
          status: NCStatus.DRAFT, // Auto-created NCs start as DRAFT for manual review
          title: `${event.layerType} Layer Test Failed: ${event.testName}`,
          description: `Layer test ${event.testCode} (${event.testName}) failed for ${event.layerType} layer in control ${event.controlControlId} (${event.controlName}).`,
          findings: event.findings || undefined,
          impact: `Control effectiveness cannot be assured. This may impact compliance and increase risk exposure.`,
          isoClause: event.sourceStandard || undefined,
          controlId: event.controlId,
          correctiveAction: event.recommendations || undefined,
          raisedById: event.updatedById,
        });
      } catch (err) {
        console.error('Failed to auto-create nonconformity from test.failed event:', err);
        // Don't throw - event listeners should not break the system
      }
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    source?: NonconformitySource;
    severity?: NCSeverity;
    status?: NCStatus;
    responsibleUserId?: string;
    controlId?: string;
  }) {
    const where: any = {};
    if (params?.source) where.source = params.source;
    if (params?.severity) where.severity = params.severity;
    if (params?.status) where.status = params.status;
    if (params?.responsibleUserId) where.responsibleUserId = params.responsibleUserId;
    if (params?.controlId) where.controlId = params.controlId;

    const [results, count] = await Promise.all([
      this.prisma.nonconformity.findMany({
        where,
        skip: params?.skip,
        take: params?.take,
        include: {
          control: { select: { id: true, controlId: true, name: true } },
          responsibleUser: { select: { id: true, email: true, firstName: true, lastName: true } },
          raisedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          verifiedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          closedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          // CAP workflow relations
          capDraftedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          capApprovedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          capRejectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: [{ dateRaised: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.nonconformity.count({ where }),
    ]);

    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.nonconformity.findUnique({
      where: { id },
      include: {
        control: { select: { id: true, controlId: true, name: true, description: true } },
        risks: {
          select: {
            id: true,
            riskId: true,
            title: true,
            status: true,
            likelihood: true,
            impact: true,
          },
        },
        responsibleUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        raisedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        verifiedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        closedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        // CAP workflow relations
        capDraftedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        capApprovedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        capRejectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: {
    source: NonconformitySource;
    severity: NCSeverity;
    category: NCCategory;
    title: string;
    description: string;
    findings?: string;
    rootCause?: string;
    impact?: string;
    isoClause?: string;
    sourceReferenceId?: string;
    controlId?: string;
    correctiveAction?: string;
    responsibleUserId?: string;
    targetClosureDate?: Date;
    status?: NCStatus; // Optional: defaults to OPEN, can be DRAFT for auto-created NCs
    raisedById: string;
  }) {
    // Generate NC ID (NC-YYYY-XXX format)
    const year = new Date().getFullYear();
    const count = await this.prisma.nonconformity.count({
      where: {
        ncId: { startsWith: `NC-${year}-` },
      },
    });
    const ncId = `NC-${year}-${String(count + 1).padStart(3, '0')}`;

    return this.prisma.nonconformity.create({
      data: {
        ...data,
        ncId,
        status: data.status || NCStatus.OPEN, // Use provided status or default to OPEN
      },
      include: {
        control: { select: { id: true, controlId: true, name: true } },
        responsibleUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        raisedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      findings?: string;
      rootCause?: string;
      impact?: string;
      severity?: NCSeverity;
      category?: NCCategory;
      status?: NCStatus;
      correctiveAction?: string;
      responsibleUserId?: string;
      targetClosureDate?: Date;
      verificationMethod?: string;
      verificationDate?: Date;
      verifiedById?: string;
      verificationResult?: string;
      verificationNotes?: string;
    },
  ) {
    return this.prisma.nonconformity.update({
      where: { id },
      data,
      include: {
        control: { select: { id: true, controlId: true, name: true } },
        responsibleUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        verifiedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async close(id: string, closedById: string) {
    return this.prisma.nonconformity.update({
      where: { id },
      data: {
        status: NCStatus.CLOSED,
        closedAt: new Date(),
        closedById,
      },
      include: {
        closedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.nonconformity.delete({ where: { id } });
  }

  async getStats() {
    const [total, byStatus, bySeverity, bySource, byCapStatus, overdue, pendingReview, pendingCapApproval] = await Promise.all([
      this.prisma.nonconformity.count(),
      this.prisma.nonconformity.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.nonconformity.groupBy({
        by: ['severity'],
        _count: true,
      }),
      this.prisma.nonconformity.groupBy({
        by: ['source'],
        _count: true,
      }),
      this.prisma.nonconformity.groupBy({
        by: ['capStatus'],
        _count: true,
      }),
      this.prisma.nonconformity.count({
        where: {
          status: { in: [NCStatus.OPEN, NCStatus.IN_PROGRESS] },
          targetClosureDate: { lt: new Date() },
        },
      }),
      this.prisma.nonconformity.count({
        where: {
          status: NCStatus.DRAFT,
        },
      }),
      this.prisma.nonconformity.count({
        where: {
          capStatus: CAPStatus.PENDING_APPROVAL,
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
      bySeverity: bySeverity.reduce((acc, item) => ({ ...acc, [item.severity]: item._count }), {}),
      bySource: bySource.reduce((acc, item) => ({ ...acc, [item.source]: item._count }), {}),
      byCapStatus: byCapStatus.reduce((acc, item) => ({ ...acc, [item.capStatus]: item._count }), {}),
      overdue,
      pendingReview,
      pendingCapApproval,
    };
  }

  async linkRisks(ncId: string, riskIds: string[]) {
    return this.prisma.nonconformity.update({
      where: { id: ncId },
      data: {
        risks: {
          connect: riskIds.map((id) => ({ id })),
        },
      },
      include: {
        risks: { select: { id: true, riskId: true, title: true } },
      },
    });
  }

  // ============================================
  // CAP WORKFLOW METHODS
  // ============================================

  /**
   * Save/Update CAP as draft
   * Can be called multiple times while in DRAFT or NOT_DEFINED status
   */
  async saveCapDraft(
    id: string,
    data: {
      correctiveAction: string;
      rootCause?: string;
      responsibleUserId: string;
      targetClosureDate: Date;
    },
    draftedById: string,
  ) {
    const nc = await this.prisma.nonconformity.findUnique({ where: { id } });
    if (!nc) throw new BadRequestException('Nonconformity not found');

    // Can only save draft if CAP is NOT_DEFINED, DRAFT, or REJECTED
    if (!['NOT_DEFINED', 'DRAFT', 'REJECTED'].includes(nc.capStatus)) {
      throw new BadRequestException(
        `Cannot edit CAP when status is ${nc.capStatus}. CAP must be in draft or rejected state.`,
      );
    }

    return this.prisma.nonconformity.update({
      where: { id },
      data: {
        correctiveAction: data.correctiveAction,
        rootCause: data.rootCause,
        responsibleUserId: data.responsibleUserId,
        targetClosureDate: data.targetClosureDate,
        capStatus: CAPStatus.DRAFT,
        capDraftedAt: new Date(),
        capDraftedById: draftedById,
        // Clear any previous rejection
        capRejectedAt: null,
        capRejectedById: null,
        capRejectionReason: null,
      },
      include: this.getFullInclude(),
    });
  }

  /**
   * Submit CAP for approval
   * Moves from DRAFT to PENDING_APPROVAL
   */
  async submitCapForApproval(id: string, submittedById: string) {
    const nc = await this.prisma.nonconformity.findUnique({ where: { id } });
    if (!nc) throw new BadRequestException('Nonconformity not found');

    // Must be in DRAFT status to submit
    if (nc.capStatus !== CAPStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot submit CAP when status is ${nc.capStatus}. CAP must be in draft state.`,
      );
    }

    // Validate required fields
    if (!nc.correctiveAction || !nc.responsibleUserId || !nc.targetClosureDate) {
      throw new BadRequestException(
        'CAP must have corrective action, responsible person, and target date before submission.',
      );
    }

    return this.prisma.nonconformity.update({
      where: { id },
      data: {
        capStatus: CAPStatus.PENDING_APPROVAL,
        capSubmittedAt: new Date(),
      },
      include: this.getFullInclude(),
    });
  }

  /**
   * Approve CAP
   * Moves from PENDING_APPROVAL to APPROVED
   * Also moves NC status to IN_PROGRESS (work can begin)
   */
  async approveCap(
    id: string,
    approvedById: string,
    approvalComments?: string,
  ) {
    const nc = await this.prisma.nonconformity.findUnique({ where: { id } });
    if (!nc) throw new BadRequestException('Nonconformity not found');

    // Must be in PENDING_APPROVAL status
    if (nc.capStatus !== CAPStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Cannot approve CAP when status is ${nc.capStatus}. CAP must be pending approval.`,
      );
    }

    // Self-approval prevention: person who drafted cannot approve
    if (nc.capDraftedById === approvedById) {
      throw new ForbiddenException(
        'You cannot approve a CAP that you drafted. Please have another team member approve it.',
      );
    }

    return this.prisma.nonconformity.update({
      where: { id },
      data: {
        capStatus: CAPStatus.APPROVED,
        capApprovedAt: new Date(),
        capApprovedById: approvedById,
        capApprovalComments: approvalComments,
        // Move NC to IN_PROGRESS - work can now begin
        status: NCStatus.IN_PROGRESS,
      },
      include: this.getFullInclude(),
    });
  }

  /**
   * Reject CAP
   * Moves from PENDING_APPROVAL back to REJECTED (can be re-drafted)
   */
  async rejectCap(
    id: string,
    rejectedById: string,
    rejectionReason: string,
  ) {
    const nc = await this.prisma.nonconformity.findUnique({ where: { id } });
    if (!nc) throw new BadRequestException('Nonconformity not found');

    // Must be in PENDING_APPROVAL status
    if (nc.capStatus !== CAPStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Cannot reject CAP when status is ${nc.capStatus}. CAP must be pending approval.`,
      );
    }

    // Rejection reason is required
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required.');
    }

    return this.prisma.nonconformity.update({
      where: { id },
      data: {
        capStatus: CAPStatus.REJECTED,
        capRejectedAt: new Date(),
        capRejectedById: rejectedById,
        capRejectionReason: rejectionReason,
        // Clear previous approval data
        capApprovedAt: null,
        capApprovedById: null,
        capApprovalComments: null,
      },
      include: this.getFullInclude(),
    });
  }

  /**
   * Mark CAP as not required (for Observations)
   */
  async markCapNotRequired(id: string, userId: string) {
    const nc = await this.prisma.nonconformity.findUnique({ where: { id } });
    if (!nc) throw new BadRequestException('Nonconformity not found');

    // Only Observations can skip CAP
    if (nc.severity !== NCSeverity.OBSERVATION) {
      throw new BadRequestException(
        'Only Observations can skip the CAP approval process. MAJOR and MINOR nonconformities require CAP approval.',
      );
    }

    return this.prisma.nonconformity.update({
      where: { id },
      data: {
        capStatus: CAPStatus.NOT_REQUIRED,
        // Move directly to IN_PROGRESS for observations
        status: NCStatus.IN_PROGRESS,
      },
      include: this.getFullInclude(),
    });
  }

  /**
   * Helper to get consistent include for all CAP operations
   */
  private getFullInclude() {
    return {
      control: { select: { id: true, controlId: true, name: true, description: true } },
      risks: {
        select: {
          id: true,
          riskId: true,
          title: true,
          status: true,
          likelihood: true,
          impact: true,
        },
      },
      responsibleUser: { select: { id: true, email: true, firstName: true, lastName: true } },
      raisedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      verifiedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      closedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      capDraftedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      capApprovedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      capRejectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
    };
  }
}
