import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChangeApprovalService {
  constructor(private prisma: PrismaService) {}

  async findByChange(changeId: string) {
    return this.prisma.changeApproval.findMany({
      where: { changeId },
      include: {
        approver: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findPendingByUser(userId: string) {
    return this.prisma.changeApproval.findMany({
      where: {
        approverId: userId,
        status: 'PENDING',
      },
      include: {
        change: {
          select: {
            id: true,
            changeRef: true,
            title: true,
            changeType: true,
            priority: true,
            securityImpact: true,
            plannedStart: true,
            requester: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async requestApproval(changeId: string, approvers: Array<{ userId: string; role: string; isRequired?: boolean }>) {
    const change = await this.prisma.change.findUnique({ where: { id: changeId } });
    if (!change) throw new NotFoundException(`Change with ID ${changeId} not found`);

    // Update change status to pending approval
    await this.prisma.change.update({
      where: { id: changeId },
      data: { status: 'PENDING_APPROVAL' },
    });

    // Create approval requests
    return this.prisma.changeApproval.createMany({
      data: approvers.map((approver) => ({
        changeId,
        approverId: approver.userId,
        approverRole: approver.role,
        isRequired: approver.isRequired !== false,
        status: 'PENDING',
      })),
    });
  }

  async approve(approvalId: string, userId: string, comments?: string, conditions?: string) {
    const approval = await this.prisma.changeApproval.findUnique({
      where: { id: approvalId },
      include: { change: true },
    });

    if (!approval) throw new NotFoundException(`Approval with ID ${approvalId} not found`);
    if (approval.approverId !== userId) {
      throw new BadRequestException('You are not authorized to approve this change');
    }
    if (approval.status !== 'PENDING') {
      throw new BadRequestException('This approval has already been processed');
    }

    // Update approval
    const updatedApproval = await this.prisma.changeApproval.update({
      where: { id: approvalId },
      data: {
        status: 'APPROVED',
        decision: 'approved',
        decidedAt: new Date(),
        comments,
        conditions,
      },
    });

    // Check if all required approvals are complete
    const pendingRequired = await this.prisma.changeApproval.count({
      where: {
        changeId: approval.changeId,
        isRequired: true,
        status: 'PENDING',
      },
    });

    // If no more pending required approvals, mark change as approved
    if (pendingRequired === 0) {
      await this.prisma.change.update({
        where: { id: approval.changeId },
        data: {
          status: 'APPROVED',
          history: {
            create: {
              field: 'status',
              oldValue: 'PENDING_APPROVAL',
              newValue: 'APPROVED',
              action: 'approved',
              changedById: userId,
              notes: 'All required approvals received',
            },
          },
        },
      });
    }

    return updatedApproval;
  }

  async reject(approvalId: string, userId: string, comments: string) {
    const approval = await this.prisma.changeApproval.findUnique({
      where: { id: approvalId },
      include: { change: true },
    });

    if (!approval) throw new NotFoundException(`Approval with ID ${approvalId} not found`);
    if (approval.approverId !== userId) {
      throw new BadRequestException('You are not authorized to reject this change');
    }
    if (approval.status !== 'PENDING') {
      throw new BadRequestException('This approval has already been processed');
    }

    // Update approval
    const updatedApproval = await this.prisma.changeApproval.update({
      where: { id: approvalId },
      data: {
        status: 'REJECTED',
        decision: 'rejected',
        decidedAt: new Date(),
        comments,
      },
    });

    // If this was a required approval, reject the change
    if (approval.isRequired) {
      await this.prisma.change.update({
        where: { id: approval.changeId },
        data: {
          status: 'REJECTED',
          history: {
            create: {
              field: 'status',
              oldValue: 'PENDING_APPROVAL',
              newValue: 'REJECTED',
              action: 'rejected',
              changedById: userId,
              notes: comments,
            },
          },
        },
      });
    }

    return updatedApproval;
  }
}
