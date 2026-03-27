import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { addDays, isPast, isFuture, differenceInDays } from 'date-fns';

export interface TreatmentNotification {
  type: 'OVERDUE' | 'DUE_SOON' | 'COMPLETED' | 'APPROVED' | 'ACTION_OVERDUE' | 'ACTION_DUE_SOON';
  treatmentPlanId: string;
  treatmentId: string;
  title: string;
  message: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recipientIds: string[];
  actionId?: string;
  dueDate?: Date;
}

@Injectable()
export class TreatmentNotificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check for overdue treatment plans and generate notifications
   */
  async checkOverdueTreatments(): Promise<TreatmentNotification[]> {
    const overduePlans = await this.prisma.treatmentPlan.findMany({
      where: {
        status: { in: ['APPROVED', 'IN_PROGRESS'] },
        targetEndDate: { lt: new Date() },
      },
      include: {
        riskOwner: { select: { id: true } },
        implementer: { select: { id: true } },
      },
    });

    return overduePlans.map(plan => {
      const daysOverdue = plan.targetEndDate 
        ? differenceInDays(new Date(), plan.targetEndDate)
        : 0;

      const recipientIds = [
        plan.riskOwner?.id,
        plan.implementer?.id,
      ].filter(Boolean) as string[];

      return {
        type: 'OVERDUE',
        treatmentPlanId: plan.id,
        treatmentId: plan.treatmentId,
        title: plan.title,
        message: `Treatment plan "${plan.title}" is ${daysOverdue} day(s) overdue. Target completion was ${plan.targetEndDate?.toLocaleDateString()}.`,
        priority: daysOverdue > 30 ? 'HIGH' : daysOverdue > 7 ? 'MEDIUM' : 'LOW',
        recipientIds,
        dueDate: plan.targetEndDate || undefined,
      };
    });
  }

  /**
   * Check for treatment plans due soon (within 7 days)
   */
  async checkTreatmentsDueSoon(): Promise<TreatmentNotification[]> {
    const sevenDaysFromNow = addDays(new Date(), 7);
    
    const dueSoonPlans = await this.prisma.treatmentPlan.findMany({
      where: {
        status: { in: ['APPROVED', 'IN_PROGRESS'] },
        targetEndDate: {
          gte: new Date(),
          lte: sevenDaysFromNow,
        },
      },
      include: {
        riskOwner: { select: { id: true } },
        implementer: { select: { id: true } },
      },
    });

    return dueSoonPlans.map(plan => {
      const daysUntilDue = plan.targetEndDate 
        ? differenceInDays(plan.targetEndDate, new Date())
        : 0;

      const recipientIds = [
        plan.riskOwner?.id,
        plan.implementer?.id,
      ].filter(Boolean) as string[];

      return {
        type: 'DUE_SOON',
        treatmentPlanId: plan.id,
        treatmentId: plan.treatmentId,
        title: plan.title,
        message: `Treatment plan "${plan.title}" is due in ${daysUntilDue} day(s). Target completion: ${plan.targetEndDate?.toLocaleDateString()}.`,
        priority: daysUntilDue <= 2 ? 'HIGH' : 'MEDIUM',
        recipientIds,
        dueDate: plan.targetEndDate || undefined,
      };
    });
  }

  /**
   * Check for overdue treatment actions
   */
  async checkOverdueActions(): Promise<TreatmentNotification[]> {
    const overdueActions = await this.prisma.treatmentAction.findMany({
      where: {
        status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
      },
      include: {
        treatmentPlan: {
          select: {
            id: true,
            treatmentId: true,
            title: true,
            riskOwner: { select: { id: true } },
            implementer: { select: { id: true } },
          },
        },
        assignedTo: { select: { id: true } },
      },
    });

    return overdueActions.map(action => {
      const daysOverdue = action.dueDate 
        ? differenceInDays(new Date(), action.dueDate)
        : 0;

      const recipientIds = [
        action.assignedTo?.id,
        action.treatmentPlan.implementer?.id,
      ].filter(Boolean) as string[];

      return {
        type: 'ACTION_OVERDUE',
        treatmentPlanId: action.treatmentPlan.id,
        treatmentId: action.treatmentPlan.treatmentId,
        title: action.treatmentPlan.title,
        message: `Action "${action.title}" in treatment plan "${action.treatmentPlan.title}" is ${daysOverdue} day(s) overdue.`,
        priority: daysOverdue > 14 ? 'HIGH' : daysOverdue > 3 ? 'MEDIUM' : 'LOW',
        recipientIds,
        actionId: action.id,
        dueDate: action.dueDate || undefined,
      };
    });
  }

  /**
   * Check for actions due soon (within 3 days)
   */
  async checkActionsDueSoon(): Promise<TreatmentNotification[]> {
    const threeDaysFromNow = addDays(new Date(), 3);
    
    const dueSoonActions = await this.prisma.treatmentAction.findMany({
      where: {
        status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
        dueDate: {
          gte: new Date(),
          lte: threeDaysFromNow,
        },
      },
      include: {
        treatmentPlan: {
          select: {
            id: true,
            treatmentId: true,
            title: true,
            riskOwner: { select: { id: true } },
            implementer: { select: { id: true } },
          },
        },
        assignedTo: { select: { id: true } },
      },
    });

    return dueSoonActions.map(action => {
      const daysUntilDue = action.dueDate 
        ? differenceInDays(action.dueDate, new Date())
        : 0;

      const recipientIds = [
        action.assignedTo?.id,
        action.treatmentPlan.implementer?.id,
      ].filter(Boolean) as string[];

      return {
        type: 'ACTION_DUE_SOON',
        treatmentPlanId: action.treatmentPlan.id,
        treatmentId: action.treatmentPlan.treatmentId,
        title: action.treatmentPlan.title,
        message: `Action "${action.title}" in treatment plan "${action.treatmentPlan.title}" is due in ${daysUntilDue} day(s).`,
        priority: daysUntilDue <= 1 ? 'HIGH' : 'MEDIUM',
        recipientIds,
        actionId: action.id,
        dueDate: action.dueDate || undefined,
      };
    });
  }

  /**
   * Generate notification for completed treatment
   */
  async notifyTreatmentCompleted(treatmentPlanId: string): Promise<TreatmentNotification | null> {
    const plan = await this.prisma.treatmentPlan.findUnique({
      where: { id: treatmentPlanId },
      include: {
        riskOwner: { select: { id: true } },
        implementer: { select: { id: true } },
        createdBy: { select: { id: true } },
      },
    });

    if (!plan || plan.status !== 'COMPLETED') {
      return null;
    }

    const recipientIds = [
      plan.riskOwner?.id,
      plan.implementer?.id,
      plan.createdBy?.id,
    ].filter(Boolean) as string[];

    return {
      type: 'COMPLETED',
      treatmentPlanId: plan.id,
      treatmentId: plan.treatmentId,
      title: plan.title,
      message: `Treatment plan "${plan.title}" has been completed. ${plan.currentResidualScore ? `Final residual score: ${plan.currentResidualScore}` : ''}`,
      priority: 'MEDIUM',
      recipientIds,
    };
  }

  /**
   * Generate notification for approved treatment
   */
  async notifyTreatmentApproved(treatmentPlanId: string): Promise<TreatmentNotification | null> {
    const plan = await this.prisma.treatmentPlan.findUnique({
      where: { id: treatmentPlanId },
      include: {
        riskOwner: { select: { id: true } },
        implementer: { select: { id: true } },
        createdBy: { select: { id: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!plan || plan.status !== 'APPROVED') {
      return null;
    }

    const recipientIds = [
      plan.riskOwner?.id,
      plan.implementer?.id,
      plan.createdBy?.id,
    ].filter(Boolean) as string[];

    const approverName = plan.approvedBy 
      ? `${plan.approvedBy.firstName} ${plan.approvedBy.lastName}`.trim()
      : 'Unknown';

    return {
      type: 'APPROVED',
      treatmentPlanId: plan.id,
      treatmentId: plan.treatmentId,
      title: plan.title,
      message: `Treatment plan "${plan.title}" has been approved by ${approverName}. Implementation can now begin.`,
      priority: 'MEDIUM',
      recipientIds,
    };
  }

  /**
   * Get all pending notifications for a user
   */
  async getUserNotifications(userId: string): Promise<TreatmentNotification[]> {
    const [overdue, dueSoon, overdueActions, dueSoonActions] = await Promise.all([
      this.checkOverdueTreatments(),
      this.checkTreatmentsDueSoon(),
      this.checkOverdueActions(),
      this.checkActionsDueSoon(),
    ]);

    const allNotifications = [...overdue, ...dueSoon, ...overdueActions, ...dueSoonActions];
    
    // Filter to only notifications for this user
    return allNotifications.filter(notification => 
      notification.recipientIds.includes(userId)
    );
  }

  /**
   * Get notification summary statistics
   */
  async getNotificationStats(userId: string): Promise<{
    total: number;
    high: number;
    medium: number;
    low: number;
    byType: Record<string, number>;
  }> {
    const notifications = await this.getUserNotifications(userId);

    return {
      total: notifications.length,
      high: notifications.filter(n => n.priority === 'HIGH').length,
      medium: notifications.filter(n => n.priority === 'MEDIUM').length,
      low: notifications.filter(n => n.priority === 'LOW').length,
      byType: notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
