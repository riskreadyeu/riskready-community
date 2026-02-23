import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentType } from '@prisma/client';

@Injectable()
export class PolicyDashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(organisationId: string) {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      documentStats,
      reviewStats,
      approvalStats,
      acknowledgmentStats,
      exceptionStats,
      changeRequestStats,
    ] = await Promise.all([
      this.getDocumentStats(organisationId),
      this.getReviewStats(organisationId),
      this.getApprovalStats(organisationId),
      this.getAcknowledgmentStats(organisationId),
      this.getExceptionStats(organisationId),
      this.getChangeRequestStats(organisationId),
    ]);

    return {
      documents: documentStats,
      reviews: reviewStats,
      approvals: approvalStats,
      acknowledgments: acknowledgmentStats,
      exceptions: exceptionStats,
      changeRequests: changeRequestStats,
    };
  }

  private async getDocumentStats(organisationId: string) {
    const [total, byType, byStatus, published] = await Promise.all([
      this.prisma.policyDocument.count({ where: { organisationId } }),
      this.prisma.policyDocument.groupBy({
        by: ['documentType'],
        where: { organisationId },
        _count: true,
      }),
      this.prisma.policyDocument.groupBy({
        by: ['status'],
        where: { organisationId },
        _count: true,
      }),
      this.prisma.policyDocument.count({ where: { organisationId, status: 'PUBLISHED' } }),
    ]);

    return {
      total,
      published,
      byType: byType.reduce((acc, item) => {
        acc[item.documentType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private async getReviewStats(organisationId: string) {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [overdue, dueSoon, upcoming] = await Promise.all([
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
    ]);

    return { overdue, dueSoon, upcoming };
  }

  private async getApprovalStats(organisationId: string) {
    const [pending, inProgress, completedThisMonth] = await Promise.all([
      this.prisma.documentApprovalWorkflow.count({
        where: {
          document: { organisationId },
          status: 'PENDING',
        },
      }),
      this.prisma.documentApprovalWorkflow.count({
        where: {
          document: { organisationId },
          status: 'IN_PROGRESS',
        },
      }),
      this.prisma.documentApprovalWorkflow.count({
        where: {
          document: { organisationId },
          status: 'APPROVED',
          completedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return { pending, inProgress, completedThisMonth };
  }

  private async getAcknowledgmentStats(organisationId: string) {
    const now = new Date();

    const [total, acknowledged, pending, overdue] = await Promise.all([
      this.prisma.documentAcknowledgment.count({
        where: { document: { organisationId } },
      }),
      this.prisma.documentAcknowledgment.count({
        where: { document: { organisationId }, isAcknowledged: true },
      }),
      this.prisma.documentAcknowledgment.count({
        where: { document: { organisationId }, isAcknowledged: false },
      }),
      this.prisma.documentAcknowledgment.count({
        where: {
          document: { organisationId },
          isAcknowledged: false,
          dueDate: { lt: now },
        },
      }),
    ]);

    const completionRate = total > 0 ? Math.round((acknowledged / total) * 100) : 0;

    return { total, acknowledged, pending, overdue, completionRate };
  }

  private async getExceptionStats(organisationId: string) {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [active, expiring, pending] = await Promise.all([
      this.prisma.documentException.count({
        where: { organisationId, status: 'ACTIVE' },
      }),
      this.prisma.documentException.count({
        where: {
          organisationId,
          status: 'ACTIVE',
          expiryDate: { lte: thirtyDays, gte: now },
        },
      }),
      this.prisma.documentException.count({
        where: {
          organisationId,
          status: { in: ['REQUESTED', 'UNDER_REVIEW'] },
        },
      }),
    ]);

    return { active, expiring, pending };
  }

  private async getChangeRequestStats(organisationId: string) {
    const [pending, inProgress, completedThisMonth] = await Promise.all([
      this.prisma.documentChangeRequest.count({
        where: {
          organisationId,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
        },
      }),
      this.prisma.documentChangeRequest.count({
        where: {
          organisationId,
          status: 'IN_PROGRESS',
        },
      }),
      this.prisma.documentChangeRequest.count({
        where: {
          organisationId,
          status: { in: ['IMPLEMENTED', 'VERIFIED'] },
          actualCompletionDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return { pending, inProgress, completedThisMonth };
  }

  async getComplianceStatus(organisationId: string) {
    // Get control coverage
    const controls = await this.prisma.control.findMany({
      where: { organisationId, applicable: true },
      select: {
        id: true,
        documentMappings: { select: { coverage: true } },
      },
    });

    const totalControls = controls.length;
    const coveredControls = controls.filter(c => c.documentMappings.length > 0).length;
    const fullyCoveredControls = controls.filter(c => 
      c.documentMappings.some(m => m.coverage === 'FULL')
    ).length;

    // Get mandatory document checklist
    const mandatoryDocs = await this.getMandatoryDocumentStatus(organisationId);

    return {
      controlCoverage: {
        total: totalControls,
        covered: coveredControls,
        fullyCovered: fullyCoveredControls,
        percentage: totalControls > 0 ? Math.round((coveredControls / totalControls) * 100) : 0,
      },
      mandatoryDocuments: mandatoryDocs,
      overallScore: this.calculateOverallScore(
        coveredControls / totalControls,
        mandatoryDocs.completed / mandatoryDocs.total
      ),
    };
  }

  private async getMandatoryDocumentStatus(organisationId: string) {
    // ISO 27001 mandatory documents
    const mandatoryTypes: DocumentType[] = ['POLICY', 'STANDARD', 'PROCEDURE'];

    const documents = await this.prisma.policyDocument.findMany({
      where: {
        organisationId,
        documentType: { in: mandatoryTypes },
        status: 'PUBLISHED',
      },
      select: {
        documentType: true,
        documentId: true,
        controlMappings: { select: { controlId: true } },
      },
    });

    // This is simplified - in practice, you'd have a list of required documents
    const total = 15; // Approximate number of mandatory documents
    const completed = Math.min(documents.length, total);

    return {
      total,
      completed,
      percentage: Math.round((completed / total) * 100),
    };
  }

  private calculateOverallScore(controlCoverage: number, docCoverage: number): number {
    // Weighted average: 60% control coverage, 40% document coverage
    return Math.round((controlCoverage * 0.6 + docCoverage * 0.4) * 100);
  }

  async getActionsNeeded(organisationId: string) {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [overdueReviews, pendingApprovals, overdueAcks, expiringExceptions] = await Promise.all([
      this.prisma.policyDocument.findMany({
        where: {
          organisationId,
          status: 'PUBLISHED',
          nextReviewDate: { lt: now },
        },
        select: {
          id: true,
          documentId: true,
          title: true,
          nextReviewDate: true,
        },
        take: 5,
        orderBy: { nextReviewDate: 'asc' },
      }),
      this.prisma.approvalStep.findMany({
        where: {
          workflow: { document: { organisationId } },
          status: 'IN_REVIEW',
        },
        select: {
          id: true,
          stepName: true,
          dueDate: true,
          workflow: {
            select: {
              document: { select: { id: true, documentId: true, title: true } },
            },
          },
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.documentAcknowledgment.findMany({
        where: {
          document: { organisationId },
          isAcknowledged: false,
          dueDate: { lt: now },
        },
        select: {
          id: true,
          document: { select: { documentId: true, title: true } },
          user: { select: { firstName: true, lastName: true } },
          dueDate: true,
        },
        take: 5,
      }),
      this.prisma.documentException.findMany({
        where: {
          organisationId,
          status: 'ACTIVE',
          expiryDate: { lte: thirtyDays, gte: now },
        },
        select: {
          id: true,
          exceptionId: true,
          title: true,
          expiryDate: true,
        },
        take: 5,
        orderBy: { expiryDate: 'asc' },
      }),
    ]);

    return {
      overdueReviews,
      pendingApprovals,
      overdueAcknowledgments: overdueAcks,
      expiringExceptions,
    };
  }
}
