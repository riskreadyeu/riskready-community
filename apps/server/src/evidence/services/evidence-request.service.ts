import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EvidenceType,
  EvidenceRequestStatus,
  EvidenceRequestPriority,
  Prisma,
} from '@prisma/client';

@Injectable()
export class EvidenceRequestService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // FIND ALL
  // ============================================

  async findAll(params?: {
    skip?: number;
    take?: number;
    status?: EvidenceRequestStatus;
    priority?: EvidenceRequestPriority;
    assignedToId?: string;
    assignedDepartmentId?: string;
    requestedById?: string;
    contextType?: string;
    contextId?: string;
    overdue?: boolean;
  }) {
    const where: Prisma.EvidenceRequestWhereInput = {};

    if (params?.status) where.status = params.status;
    if (params?.priority) where.priority = params.priority;
    if (params?.assignedToId) where.assignedToId = params.assignedToId;
    if (params?.assignedDepartmentId) where.assignedDepartmentId = params.assignedDepartmentId;
    if (params?.requestedById) where.requestedById = params.requestedById;
    if (params?.contextType) where.contextType = params.contextType;
    if (params?.contextId) where.contextId = params.contextId;

    if (params?.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { in: [EvidenceRequestStatus.OPEN, EvidenceRequestStatus.IN_PROGRESS] };
    }

    const [results, count] = await Promise.all([
      this.prisma.evidenceRequest.findMany({
        where,
        skip: params?.skip,
        take: params?.take,
        include: {
          requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
          assignedDepartment: { select: { id: true, name: true, departmentCode: true } },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          fulfillments: {
            include: {
              evidence: { select: { id: true, evidenceRef: true, title: true, status: true } },
            },
          },
        },
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
      }),
      this.prisma.evidenceRequest.count({ where }),
    ]);

    return { results, count };
  }

  // ============================================
  // FIND ONE
  // ============================================

  async findOne(id: string) {
    const request = await this.prisma.evidenceRequest.findUnique({
      where: { id },
      include: {
        requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignedDepartment: { select: { id: true, name: true, departmentCode: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        fulfillments: {
          include: {
            evidence: {
              select: {
                id: true,
                evidenceRef: true,
                title: true,
                status: true,
                evidenceType: true,
                fileName: true,
                createdAt: true,
              },
            },
            submittedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Evidence request with ID ${id} not found`);
    }

    return request;
  }

  // ============================================
  // CREATE
  // ============================================

  async create(data: {
    title: string;
    description: string;
    evidenceType?: EvidenceType;
    requiredFormat?: string;
    acceptanceCriteria?: string;
    priority?: EvidenceRequestPriority;
    dueDate: Date;
    assignedToId?: string;
    assignedDepartmentId?: string;
    contextType?: string;
    contextId?: string;
    contextRef?: string;
    requestedById: string;
    createdById: string;
  }) {
    // Generate request reference
    const year = new Date().getFullYear();
    const lastRequest = await this.prisma.evidenceRequest.findFirst({
      where: {
        requestRef: { startsWith: `REQ-${year}-` },
      },
      orderBy: { requestRef: 'desc' },
    });

    let nextNumber = 1;
    if (lastRequest) {
      const match = lastRequest.requestRef.match(/REQ-\d{4}-(\d+)/);
      if (match?.[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const requestRef = `REQ-${year}-${nextNumber.toString().padStart(4, '0')}`;

    return this.prisma.evidenceRequest.create({
      data: {
        requestRef,
        title: data.title,
        description: data.description,
        evidenceType: data.evidenceType,
        requiredFormat: data.requiredFormat,
        acceptanceCriteria: data.acceptanceCriteria,
        priority: data.priority || EvidenceRequestPriority.MEDIUM,
        status: EvidenceRequestStatus.OPEN,
        dueDate: data.dueDate,
        assignedToId: data.assignedToId,
        assignedDepartmentId: data.assignedDepartmentId,
        contextType: data.contextType,
        contextId: data.contextId,
        contextRef: data.contextRef,
        requestedById: data.requestedById,
        createdById: data.createdById,
      },
      include: {
        requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignedDepartment: { select: { id: true, name: true, departmentCode: true } },
      },
    });
  }

  // ============================================
  // UPDATE
  // ============================================

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      evidenceType?: EvidenceType;
      requiredFormat?: string;
      acceptanceCriteria?: string;
      priority?: EvidenceRequestPriority;
      dueDate?: Date;
      assignedToId?: string;
      assignedDepartmentId?: string;
      notes?: string;
    },
  ) {
    const existing = await this.prisma.evidenceRequest.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Evidence request with ID ${id} not found`);
    }

    // Don't allow updates to closed/cancelled requests
    if (
      existing.status === EvidenceRequestStatus.ACCEPTED ||
      existing.status === EvidenceRequestStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot update a closed or cancelled request');
    }

    return this.prisma.evidenceRequest.update({
      where: { id },
      data,
      include: {
        requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignedDepartment: { select: { id: true, name: true, departmentCode: true } },
      },
    });
  }

  // ============================================
  // DELETE
  // ============================================

  async delete(id: string) {
    const existing = await this.prisma.evidenceRequest.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Evidence request with ID ${id} not found`);
    }

    return this.prisma.evidenceRequest.delete({ where: { id } });
  }

  // ============================================
  // STATUS TRANSITIONS
  // ============================================

  async startProgress(id: string) {
    const request = await this.prisma.evidenceRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Evidence request with ID ${id} not found`);
    }

    if (request.status !== EvidenceRequestStatus.OPEN) {
      throw new BadRequestException('Request must be OPEN to start progress');
    }

    return this.prisma.evidenceRequest.update({
      where: { id },
      data: { status: EvidenceRequestStatus.IN_PROGRESS },
    });
  }

  async submitEvidence(id: string, evidenceId: string, userId: string, notes?: string) {
    const request = await this.prisma.evidenceRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Evidence request with ID ${id} not found`);
    }

    const evidence = await this.prisma.evidence.findUnique({ where: { id: evidenceId } });
    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${evidenceId} not found`);
    }

    // Create fulfillment link
    await this.prisma.evidenceRequestFulfillment.create({
      data: {
        requestId: id,
        evidenceId,
        notes,
        submittedById: userId,
      },
    });

    // Update request status
    return this.prisma.evidenceRequest.update({
      where: { id },
      data: {
        status: EvidenceRequestStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });
  }

  async acceptSubmission(id: string) {
    const request = await this.prisma.evidenceRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Evidence request with ID ${id} not found`);
    }

    if (request.status !== EvidenceRequestStatus.SUBMITTED) {
      throw new BadRequestException('Request must be SUBMITTED to accept');
    }

    return this.prisma.evidenceRequest.update({
      where: { id },
      data: {
        status: EvidenceRequestStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });
  }

  async rejectSubmission(id: string, reason: string) {
    const request = await this.prisma.evidenceRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Evidence request with ID ${id} not found`);
    }

    if (request.status !== EvidenceRequestStatus.SUBMITTED) {
      throw new BadRequestException('Request must be SUBMITTED to reject');
    }

    return this.prisma.evidenceRequest.update({
      where: { id },
      data: {
        status: EvidenceRequestStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }

  async cancel(id: string) {
    const request = await this.prisma.evidenceRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Evidence request with ID ${id} not found`);
    }

    return this.prisma.evidenceRequest.update({
      where: { id },
      data: {
        status: EvidenceRequestStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  // ============================================
  // STATS
  // ============================================

  async getStats() {
    const [totalCount, byStatus, byPriority, overdueCount] = await Promise.all([
      this.prisma.evidenceRequest.count(),
      this.prisma.evidenceRequest.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.evidenceRequest.groupBy({
        by: ['priority'],
        _count: true,
      }),
      this.prisma.evidenceRequest.count({
        where: {
          dueDate: { lt: new Date() },
          status: { in: [EvidenceRequestStatus.OPEN, EvidenceRequestStatus.IN_PROGRESS] },
        },
      }),
    ]);

    return {
      total: totalCount,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
      byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item.priority]: item._count }), {}),
      overdue: overdueCount,
    };
  }

  // ============================================
  // GET MY REQUESTS (assigned to me)
  // ============================================

  async getMyRequests(userId: string) {
    return this.prisma.evidenceRequest.findMany({
      where: {
        assignedToId: userId,
        status: { in: [EvidenceRequestStatus.OPEN, EvidenceRequestStatus.IN_PROGRESS] },
      },
      include: {
        requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    });
  }
}

