import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TreatmentHistoryAction } from '@prisma/client';

@Injectable()
export class TreatmentHistoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log a history entry for a treatment plan
   */
  async logHistory(data: {
    treatmentPlanId: string;
    action: TreatmentHistoryAction;
    fieldName?: string;
    oldValue?: any;
    newValue?: any;
    description?: string;
    actionId?: string;
    userId?: string;
  }) {
    return this.prisma.treatmentPlanHistory.create({
      data: {
        treatmentPlanId: data.treatmentPlanId,
        action: data.action,
        fieldName: data.fieldName,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : undefined,
        newValue: data.newValue ? JSON.stringify(data.newValue) : undefined,
        description: data.description,
        actionId: data.actionId,
        userId: data.userId,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Get history for a treatment plan
   */
  async getHistory(treatmentPlanId: string, limit = 50) {
    return this.prisma.treatmentPlanHistory.findMany({
      where: { treatmentPlanId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get recent history across all treatment plans
   */
  async getRecentHistory(organisationId: string, limit = 100) {
    return this.prisma.treatmentPlanHistory.findMany({
      where: {
        treatmentPlan: { organisationId },
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        treatmentPlan: { select: { id: true, treatmentId: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get history by action type
   */
  async getHistoryByAction(
    treatmentPlanId: string,
    action: TreatmentHistoryAction
  ) {
    return this.prisma.treatmentPlanHistory.findMany({
      where: {
        treatmentPlanId,
        action,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get history for a specific user
   */
  async getUserHistory(userId: string, limit = 50) {
    return this.prisma.treatmentPlanHistory.findMany({
      where: { userId },
      include: {
        treatmentPlan: { select: { id: true, treatmentId: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Log treatment plan creation
   */
  async logCreated(treatmentPlanId: string, userId: string, planData: any) {
    return this.logHistory({
      treatmentPlanId,
      action: 'CREATED',
      description: `Treatment plan created: ${planData.title}`,
      newValue: planData,
      userId,
    });
  }

  /**
   * Log treatment plan update
   */
  async logUpdated(
    treatmentPlanId: string,
    userId: string,
    changes: { field: string; oldValue: any; newValue: any }[]
  ) {
    const descriptions = changes.map(c => `${c.field}: ${c.oldValue} → ${c.newValue}`);
    
    return this.logHistory({
      treatmentPlanId,
      action: 'UPDATED',
      description: `Updated: ${descriptions.join(', ')}`,
      userId,
    });
  }

  /**
   * Log treatment plan approval
   */
  async logApproved(treatmentPlanId: string, userId: string, approverName: string) {
    return this.logHistory({
      treatmentPlanId,
      action: 'APPROVED',
      description: `Treatment plan approved by ${approverName}`,
      userId,
    });
  }

  /**
   * Log status change
   */
  async logStatusChange(
    treatmentPlanId: string,
    userId: string,
    oldStatus: string,
    newStatus: string
  ) {
    return this.logHistory({
      treatmentPlanId,
      action: 'STATUS_CHANGED',
      fieldName: 'status',
      oldValue: oldStatus,
      newValue: newStatus,
      description: `Status changed from ${oldStatus} to ${newStatus}`,
      userId,
    });
  }

  /**
   * Log progress update
   */
  async logProgressUpdate(
    treatmentPlanId: string,
    userId: string,
    oldProgress: number,
    newProgress: number
  ) {
    return this.logHistory({
      treatmentPlanId,
      action: 'PROGRESS_UPDATED',
      fieldName: 'progressPercentage',
      oldValue: oldProgress,
      newValue: newProgress,
      description: `Progress updated from ${oldProgress}% to ${newProgress}%`,
      userId,
    });
  }

  /**
   * Log action added
   */
  async logActionAdded(
    treatmentPlanId: string,
    actionId: string,
    userId: string,
    actionTitle: string
  ) {
    return this.logHistory({
      treatmentPlanId,
      action: 'ACTION_ADDED',
      actionId,
      description: `Action added: ${actionTitle}`,
      userId,
    });
  }

  /**
   * Log action completed
   */
  async logActionCompleted(
    treatmentPlanId: string,
    actionId: string,
    userId: string,
    actionTitle: string
  ) {
    return this.logHistory({
      treatmentPlanId,
      action: 'ACTION_COMPLETED',
      actionId,
      description: `Action completed: ${actionTitle}`,
      userId,
    });
  }

  /**
   * Log treatment plan completion
   */
  async logCompleted(treatmentPlanId: string, userId: string) {
    return this.logHistory({
      treatmentPlanId,
      action: 'COMPLETED',
      description: 'Treatment plan completed',
      userId,
    });
  }
}
