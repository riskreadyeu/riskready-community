import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyEvidenceCollectorService } from './policy-evidence-collector.service';

// ============================================
// SCHEDULED JOBS FOR POLICY MANAGEMENT
// Policy Document Workflow Improvements
// ============================================

@Injectable()
export class PolicySchedulerService {
  private readonly logger = new Logger(PolicySchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PolicyEvidenceCollectorService))
    private readonly evidenceCollector: PolicyEvidenceCollectorService,
  ) {}

  // ============================================
  // JOB 1: POLICY REVIEW OVERDUE
  // Find PUBLISHED documents past nextReviewDate
  // Daily at 6 AM
  // ============================================

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async checkOverdueDocumentReviews(): Promise<void> {
    const jobLog = await this.startJob('POLICY_REVIEW_OVERDUE', 'CRON');

    try {
      const now = new Date();

      // Find published documents with past review dates
      const overdueDocuments = await this.prisma.policyDocument.findMany({
        where: {
          status: 'PUBLISHED',
          nextReviewDate: { lt: now },
        },
        include: {
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
          organisation: { select: { id: true, name: true } },
        },
      });

      let processed = 0;
      let failed = 0;

      for (const document of overdueDocuments) {
        try {
          const daysOverdue = Math.ceil(
            (now.getTime() - (document.nextReviewDate?.getTime() || now.getTime())) /
              (24 * 60 * 60 * 1000),
          );

          // Check if we already logged this recently (within 24 hours)
          const recentLog = await this.prisma.policyDocumentAuditLog.findFirst({
            where: {
              documentId: document.id,
              action: 'REVIEWED',
              description: { contains: 'Review overdue alert' },
              performedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          });

          if (!recentLog) {
            // Create audit log for overdue review
            await this.prisma.policyDocumentAuditLog.create({
              data: {
                document: { connect: { id: document.id } },
                action: 'REVIEWED',
                description: `Review overdue alert: Document "${document.title}" is ${daysOverdue} days overdue for review`,
                performedBy: document.documentOwnerId
                  ? { connect: { id: document.documentOwnerId } }
                  : undefined,
              },
            });
          }

          processed++;
        } catch (error) {
          this.logger.error(
            `Failed to process overdue review for ${document.id}`,
            error,
          );
          failed++;
        }
      }

      await this.completeJob(jobLog.id, processed, processed - failed, failed);
    } catch (error) {
      await this.failJob(jobLog.id, error);
    }
  }

  // ============================================
  // JOB 2: POLICY APPROVAL STALE
  // Find IN_REVIEW approval steps past dueDate
  // Every 2 hours
  // ============================================

  @Cron('0 */2 * * *') // Every 2 hours
  async checkStaleApprovals(): Promise<void> {
    const jobLog = await this.startJob('POLICY_APPROVAL_STALE', 'CRON');

    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Find approval steps that are overdue
      const overdueSteps = await this.prisma.approvalStep.findMany({
        where: {
          status: 'IN_REVIEW',
          dueDate: { lt: now },
        },
        include: {
          workflow: {
            include: {
              document: { select: { id: true, documentId: true, title: true } },
            },
          },
          approver: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      let processed = 0;
      let failed = 0;

      for (const step of overdueSteps) {
        try {
          const dueDate = step.dueDate;
          if (!dueDate) {
            processed++;
            continue;
          }

          const daysOverdue = Math.ceil(
            (now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000),
          );

          // Escalation logic: > 3 days overdue - mark step as escalated
          if (daysOverdue > 3 && !step.escalated) {
            await this.prisma.approvalStep.update({
              where: { id: step.id },
              data: { escalated: true },
            });

            // Log audit for escalation
            await this.prisma.policyDocumentAuditLog.create({
              data: {
                document: { connect: { id: step.workflow.documentId } },
                action: 'UPDATED',
                description: `Approval step "${step.stepName}" escalated: ${daysOverdue} days overdue`,
              },
            });
          }

          // Escalation logic: > 7 days overdue - escalate entire workflow
          if (daysOverdue > 7 && step.workflow.status !== 'ESCALATED') {
            await this.prisma.documentApprovalWorkflow.update({
              where: { id: step.workflowId },
              data: { status: 'ESCALATED' },
            });

            // Log audit for workflow escalation
            await this.prisma.policyDocumentAuditLog.create({
              data: {
                document: { connect: { id: step.workflow.documentId } },
                action: 'UPDATED',
                description: `Approval workflow escalated: Step "${step.stepName}" is ${daysOverdue} days overdue`,
              },
            });
          }

          processed++;
        } catch (error) {
          this.logger.error(
            `Failed to process stale approval step ${step.id}`,
            error,
          );
          failed++;
        }
      }

      await this.completeJob(jobLog.id, processed, processed - failed, failed);
    } catch (error) {
      await this.failJob(jobLog.id, error);
    }
  }

  // ============================================
  // JOB 3: POLICY REVIEW REMINDER
  // Send reminders at 30/14/7 days before review
  // Daily at 7 AM
  // ============================================

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async sendReviewReminders(): Promise<void> {
    const jobLog = await this.startJob('POLICY_REVIEW_REMINDER', 'CRON');

    try {
      const now = new Date();
      const reminderThresholds = [30, 14, 7]; // Days before review

      let processed = 0;
      let failed = 0;

      for (const days of reminderThresholds) {
        try {
          const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
          const targetDateStart = new Date(targetDate);
          targetDateStart.setHours(0, 0, 0, 0);
          const targetDateEnd = new Date(targetDate);
          targetDateEnd.setHours(23, 59, 59, 999);

          // Find documents with review due in exactly X days
          const upcomingReviews = await this.prisma.policyDocument.findMany({
            where: {
              status: 'PUBLISHED',
              nextReviewDate: {
                gte: targetDateStart,
                lte: targetDateEnd,
              },
            },
            include: {
              owner: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
          });

          for (const document of upcomingReviews) {
            try {
              // Check if we already sent a reminder for this threshold
              const existingReminder = await this.prisma.policyDocumentAuditLog.findFirst({
                where: {
                  documentId: document.id,
                  action: 'REVIEWED',
                  description: { contains: `${days}-day review reminder` },
                  performedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                },
              });

              if (!existingReminder) {
                // Create audit log for reminder
                await this.prisma.policyDocumentAuditLog.create({
                  data: {
                    document: { connect: { id: document.id } },
                    action: 'REVIEWED',
                    description: `${days}-day review reminder: Document "${document.title}" is due for review on ${document.nextReviewDate?.toISOString().split('T')[0]}`,
                    performedBy: document.documentOwnerId
                      ? { connect: { id: document.documentOwnerId } }
                      : undefined,
                  },
                });
              }

              processed++;
            } catch (error) {
              this.logger.error(
                `Failed to process review reminder for ${document.id}`,
                error,
              );
              failed++;
            }
          }
        } catch (error) {
          this.logger.error(`Failed to process ${days}-day reminders`, error);
          failed++;
        }
      }

      await this.completeJob(jobLog.id, processed, processed - failed, failed);
    } catch (error) {
      await this.failJob(jobLog.id, error);
    }
  }

  // ============================================
  // JOB 4: POLICY EXCEPTION EXPIRY
  // Warn expiring exceptions, auto-expire past due
  // Daily at 8 AM
  // ============================================

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExceptionExpiry(): Promise<void> {
    const jobLog = await this.startJob('POLICY_EXCEPTION_EXPIRY', 'CRON');

    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      let processed = 0;
      let failed = 0;

      // Find exceptions expiring in next 30 days (for warning)
      const expiringExceptions = await this.prisma.documentException.findMany({
        where: {
          status: 'APPROVED',
          expiryDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      for (const exception of expiringExceptions) {
        try {
          const daysUntilExpiry = Math.ceil(
            ((exception.expiryDate?.getTime() || now.getTime()) - now.getTime()) /
              (24 * 60 * 60 * 1000),
          );

          // Only send reminder at 30, 14, 7 day marks
          if ([30, 14, 7].includes(daysUntilExpiry)) {
            // Check if we already sent this reminder
            const existingReminder = await this.prisma.policyDocumentAuditLog.findFirst({
              where: {
                documentId: exception.documentId,
                action: 'UPDATED',
                description: { contains: `${daysUntilExpiry}-day exception expiry` },
                performedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
              },
            });

            if (!existingReminder) {
              await this.prisma.policyDocumentAuditLog.create({
                data: {
                  document: { connect: { id: exception.documentId } },
                  action: 'UPDATED',
                  description: `${daysUntilExpiry}-day exception expiry warning: Exception "${exception.title}" expires on ${exception.expiryDate?.toISOString().split('T')[0]}`,
                  performedBy: exception.requestedById
                    ? { connect: { id: exception.requestedById } }
                    : undefined,
                },
              });
            }
          }

          processed++;
        } catch (error) {
          this.logger.error(
            `Failed to process expiring exception ${exception.id}`,
            error,
          );
          failed++;
        }
      }

      // Find and auto-expire past-due exceptions
      const expiredExceptions = await this.prisma.documentException.findMany({
        where: {
          status: 'APPROVED',
          expiryDate: { lt: now },
        },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
        },
      });

      for (const exception of expiredExceptions) {
        try {
          // Auto-expire the exception
          await this.prisma.documentException.update({
            where: { id: exception.id },
            data: { status: 'EXPIRED' },
          });

          // Log audit for auto-expiration
          await this.prisma.policyDocumentAuditLog.create({
            data: {
              document: { connect: { id: exception.documentId } },
              action: 'UPDATED',
              description: `Exception "${exception.title}" auto-expired past due date`,
            },
          });

          processed++;
        } catch (error) {
          this.logger.error(
            `Failed to auto-expire exception ${exception.id}`,
            error,
          );
          failed++;
        }
      }

      await this.completeJob(jobLog.id, processed, processed - failed, failed);
    } catch (error) {
      await this.failJob(jobLog.id, error);
    }
  }

  // ============================================
  // JOB 5: POLICY ACKNOWLEDGMENT OVERDUE
  // Mark overdue acknowledgments
  // Daily at 9 AM
  // ============================================

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkOverdueAcknowledgments(): Promise<void> {
    const jobLog = await this.startJob('POLICY_ACKNOWLEDGMENT_OVERDUE', 'CRON');

    try {
      const now = new Date();

      // Find acknowledgments that are not acknowledged, not already marked overdue, and past due date
      const overdueAcknowledgments = await this.prisma.documentAcknowledgment.findMany({
        where: {
          isAcknowledged: false,
          isOverdue: false,
          dueDate: { lt: now },
        },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      let processed = 0;
      let failed = 0;

      for (const acknowledgment of overdueAcknowledgments) {
        try {
          const daysOverdue = Math.ceil(
            (now.getTime() - (acknowledgment.dueDate?.getTime() || now.getTime())) /
              (24 * 60 * 60 * 1000),
          );

          // Mark as overdue
          await this.prisma.documentAcknowledgment.update({
            where: { id: acknowledgment.id },
            data: { isOverdue: true },
          });

          // Log audit for overdue acknowledgment
          await this.prisma.policyDocumentAuditLog.create({
            data: {
              document: { connect: { id: acknowledgment.documentId } },
              action: 'UPDATED',
              description: `Acknowledgment overdue: ${acknowledgment.user.email} has not acknowledged "${acknowledgment.document.title}" (${daysOverdue} days overdue)`,
              performedBy: { connect: { id: acknowledgment.userId } },
            },
          });

          processed++;
        } catch (error) {
          this.logger.error(
            `Failed to process overdue acknowledgment ${acknowledgment.id}`,
            error,
          );
          failed++;
        }
      }

      await this.completeJob(jobLog.id, processed, processed - failed, failed);
    } catch (error) {
      await this.failJob(jobLog.id, error);
    }
  }

  // ============================================
  // JOB 6: POLICY EVIDENCE COLLECTION
  // Auto-collect evidence for Control 5.1
  // Weekly at Sunday 2 AM
  // ============================================

  @Cron('0 2 * * 0') // Every Sunday at 2 AM
  async collectPolicyEvidence(): Promise<void> {
    const jobLog = await this.startJob('POLICY_EVIDENCE_COLLECTION', 'CRON');

    try {
      // Get all organisations
      const organisations = await this.prisma.organisationProfile.findMany({
        select: { id: true, name: true },
      });

      let processed = 0;
      let succeeded = 0;
      let failed = 0;

      for (const org of organisations) {
        try {
          const result = await this.evidenceCollector.collectAllEvidence(org.id);
          processed++;
          if (result.errors.length === 0) {
            succeeded++;
            this.logger.log(
              `Evidence collection for ${org.name}: ${result.collected} collected, ${result.linked} linked`,
            );
          } else {
            failed++;
            this.logger.warn(
              `Evidence collection for ${org.name} completed with errors: ${result.errors.join(', ')}`,
            );
          }
        } catch (error) {
          this.logger.error(`Failed to collect evidence for ${org.name}`, error);
          failed++;
        }
      }

      await this.completeJob(jobLog.id, processed, succeeded, failed);
    } catch (error) {
      await this.failJob(jobLog.id, error);
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async startJob(jobName: string, jobType: string): Promise<{ id: string }> {
    // ScheduledJobLog removed in community edition — return stub
    return { id: 'stub' };
  }

  private async completeJob(
    jobId: string,
    processed: number,
    succeeded: number,
    failed: number,
  ): Promise<void> {
    // ScheduledJobLog removed in community edition — no-op
    this.logger.log(
      `Job ${jobId} completed: ${succeeded}/${processed} succeeded, ${failed} failed`,
    );
  }

  private async failJob(jobId: string, error: unknown): Promise<void> {
    // ScheduledJobLog removed in community edition — no-op
    this.logger.error(`Job ${jobId} failed:`, error);
  }

  // ============================================
  // MANUAL TRIGGER METHODS (for testing/admin)
  // ============================================

  async runJob(jobName: string): Promise<unknown> {
    switch (jobName) {
      case 'POLICY_REVIEW_OVERDUE':
        return this.checkOverdueDocumentReviews();
      case 'POLICY_APPROVAL_STALE':
        return this.checkStaleApprovals();
      case 'POLICY_REVIEW_REMINDER':
        return this.sendReviewReminders();
      case 'POLICY_EXCEPTION_EXPIRY':
        return this.checkExceptionExpiry();
      case 'POLICY_ACKNOWLEDGMENT_OVERDUE':
        return this.checkOverdueAcknowledgments();
      case 'POLICY_EVIDENCE_COLLECTION':
        return this.collectPolicyEvidence();
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }

  async getJobHistory(limit: number = 50): Promise<unknown[]> {
    // ScheduledJobLog removed in community edition — return empty
    return [];
  }
}
