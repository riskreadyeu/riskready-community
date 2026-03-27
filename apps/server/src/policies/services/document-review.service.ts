import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, ReviewType, ReviewOutcome, ReviewFrequency } from '@prisma/client';
import { PolicyAuditService } from './policy-audit.service';
import { ChangeRequestService } from './change-request.service';

@Injectable()
export class DocumentReviewService {
  private readonly logger = new Logger(DocumentReviewService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: PolicyAuditService,
    @Inject(forwardRef(() => ChangeRequestService))
    private changeRequestService: ChangeRequestService,
  ) {}

  async findAll(documentId: string) {
    return this.prisma.documentReview.findMany({
      where: { documentId },
      orderBy: { reviewDate: 'desc' },
      include: {
        reviewedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async findOne(id: string) {
    const review = await this.prisma.documentReview.findUnique({
      where: { id },
      include: {
        document: { select: { id: true, documentId: true, title: true } },
        reviewedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async createReview(data: {
    documentId: string;
    reviewType: ReviewType;
    outcome: ReviewOutcome;
    findings?: string;
    recommendations?: string;
    actionItems?: string;
    changesRequired?: boolean;
    changeDescription?: string;
    reviewedById: string;
  }) {
    const { documentId, reviewType, outcome, findings, recommendations, actionItems, changesRequired, changeDescription, reviewedById } = data;

    // Get document to calculate next review date
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: documentId },
      select: { id: true, title: true, reviewFrequency: true, organisationId: true },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    const nextReviewDate = this.calculateNextReviewDate(document.reviewFrequency);

    // Use transaction for atomic operations
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create review record
      const review = await tx.documentReview.create({
        data: {
          document: { connect: { id: documentId } },
          reviewType,
          reviewDate: new Date(),
          outcome,
          findings,
          recommendations,
          actionItems,
          changesRequired: changesRequired || false,
          changeDescription,
          nextReviewDate,
          reviewedBy: { connect: { id: reviewedById } },
        },
        include: {
          reviewedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      // 2. Update document's review dates and status
      await tx.policyDocument.update({
        where: { id: documentId },
        data: {
          lastReviewDate: new Date(),
          nextReviewDate,
          // If outcome suggests major changes, set status to UNDER_REVISION
          ...(outcome === 'MAJOR_CHANGES' && { status: 'UNDER_REVISION' }),
          ...(outcome === 'RETIRE' && { status: 'RETIRED', retirementDate: new Date() }),
        },
      });

      // 3. Create audit log entry
      await tx.policyDocumentAuditLog.create({
        data: {
          document: { connect: { id: documentId } },
          action: 'REVIEWED',
          description: `Document reviewed: ${outcome}`,
          performedBy: { connect: { id: reviewedById } },
          newValue: { reviewType, outcome, nextReviewDate: nextReviewDate.toISOString() },
        },
      });

      return review;
    });

    // 4. Auto-create change request if outcome is MAJOR_CHANGES (outside transaction for service call)
    if (outcome === 'MAJOR_CHANGES') {
      try {
        const changeRequest = await this.changeRequestService.create({
          documentId,
          organisationId: document.organisationId,
          title: `Review-triggered changes for ${document.title}`,
          changeType: 'MAJOR_REVISION',
          priority: 'HIGH',
          description: changeDescription || 'Major changes required based on review findings',
          justification: findings || 'See review findings for details',
          requestedById: reviewedById,
        });

        // Log audit for auto-created change request
        await this.auditService.log({
          documentId,
          action: 'UPDATED',
          description: `Change request ${changeRequest.changeRequestId} auto-created from review`,
          performedById: reviewedById,
          newValue: { changeRequestId: changeRequest.changeRequestId, autoCreated: true },
        });
      } catch (error) {
        // Log error but don't fail the review creation
        this.logger.error('Failed to auto-create change request', error instanceof Error ? error.stack : String(error));
      }
    }

    return result;
  }

  async getUpcomingReviews(organisationId: string, days: number = 30) {
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.prisma.policyDocument.findMany({
      where: {
        organisationId,
        status: 'PUBLISHED',
        nextReviewDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      select: {
        id: true,
        documentId: true,
        title: true,
        documentType: true,
        nextReviewDate: true,
        reviewFrequency: true,
        lastReviewDate: true,
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { nextReviewDate: 'asc' },
    });
  }

  async getOverdueReviews(organisationId: string) {
    return this.prisma.policyDocument.findMany({
      where: {
        organisationId,
        status: 'PUBLISHED',
        nextReviewDate: { lt: new Date() },
      },
      select: {
        id: true,
        documentId: true,
        title: true,
        documentType: true,
        nextReviewDate: true,
        lastReviewDate: true,
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { nextReviewDate: 'asc' },
    });
  }

  async getReviewStats(organisationId: string) {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [overdue, dueSoon, upcoming, total] = await Promise.all([
      this.prisma.policyDocument.count({
        where: {
          organisationId,
          status: 'PUBLISHED',
          nextReviewDate: { lt: now },
        },
      }),
      this.prisma.policyDocument.count({
        where: {
          organisationId,
          status: 'PUBLISHED',
          nextReviewDate: { gte: now, lte: thirtyDays },
        },
      }),
      this.prisma.policyDocument.count({
        where: {
          organisationId,
          status: 'PUBLISHED',
          nextReviewDate: { gt: thirtyDays, lte: ninetyDays },
        },
      }),
      this.prisma.policyDocument.count({
        where: {
          organisationId,
          status: 'PUBLISHED',
          nextReviewDate: { not: null },
        },
      }),
    ]);

    return {
      overdue,
      dueSoon, // Within 30 days
      upcoming, // 30-90 days
      onSchedule: total - overdue - dueSoon,
      total,
    };
  }

  private calculateNextReviewDate(frequency: ReviewFrequency): Date {
    const now = new Date();
    const frequencyDays: Record<ReviewFrequency, number> = {
      MONTHLY: 30,
      QUARTERLY: 90,
      SEMI_ANNUAL: 180,
      ANNUAL: 365,
      BIENNIAL: 730,
      TRIENNIAL: 1095,
      ON_CHANGE: 365, // Default to annual for ON_CHANGE
      AS_NEEDED: 365, // Default to annual for AS_NEEDED
    };

    return new Date(now.getTime() + frequencyDays[frequency] * 24 * 60 * 60 * 1000);
  }

  async rescheduleReview(documentId: string, nextReviewDate: Date, userId?: string) {
    const document = await this.prisma.policyDocument.update({
      where: { id: documentId },
      data: { nextReviewDate },
    });

    if (userId) {
      await this.auditService.log({
        documentId,
        action: 'UPDATED',
        description: `Review rescheduled to ${nextReviewDate.toISOString().split('T')[0]}`,
        performedById: userId,
        newValue: { nextReviewDate },
      });
    }

    return document;
  }
}
