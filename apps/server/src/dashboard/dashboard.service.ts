import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardMetrics {
  riskScore: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  openRisks: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  complianceRate: {
    percentage: number;
    frameworksTracked: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  pendingActions: {
    total: number;
    dueThisWeek: number;
    overdue: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  activeIncidents: {
    total: number;
    critical: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  policies: {
    total: number;
    pendingReview: number;
    pendingApproval: number;
  };
  controls: {
    total: number;
    implemented: number;
    notImplemented: number;
  };
}

export interface RecentActivityItem {
  id: string;
  type: 'risk' | 'control' | 'policy' | 'incident' | 'evidence' | 'audit';
  title: string;
  detail: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
}

export interface UpcomingTask {
  id: string;
  type: 'review' | 'assessment' | 'approval' | 'test' | 'remediation';
  title: string;
  dueDate: Date;
  status: 'urgent' | 'in_progress' | 'not_started';
  assignee?: string;
  entityId?: string;
  entityType?: string;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(organisationId?: string): Promise<DashboardMetrics> {
    const now = new Date();

    // Get risk counts by score ranges
    const riskScenarios = await this.prisma.riskScenario.findMany({
      where: { status: { notIn: ['CLOSED', 'ACCEPTED'] } },
      select: { id: true, residualScore: true, inherentScore: true },
    });

    const openRisks = riskScenarios.length;
    let criticalRisks = 0;
    let highRisks = 0;
    let mediumRisks = 0;
    let lowRisks = 0;
    let totalScore = 0;

    // Risk scoring thresholds for 5x5 matrix (max score = 25)
    // Critical: 16-25 (4x4+), High: 9-15 (3x3+), Medium: 4-8 (2x2+), Low: 1-3
    for (const risk of riskScenarios) {
      const score = risk.residualScore ?? risk.inherentScore ?? 0;
      totalScore += score;

      if (score >= 16) criticalRisks++;
      else if (score >= 9) highRisks++;
      else if (score >= 4) mediumRisks++;
      else lowRisks++;
    }

    const avgRiskScore = openRisks > 0 ? Math.round(totalScore / openRisks) : 0;

    // Get policy counts
    const [totalPolicies, pendingReviewPolicies, pendingApprovalPolicies] = await Promise.all([
      this.prisma.policyDocument.count(),
      this.prisma.policyDocument.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.policyDocument.count({ where: { status: 'PENDING_APPROVAL' } }),
    ]);

    // Get control counts by implementation status
    const [totalControls, implementedControls] = await Promise.all([
      this.prisma.control.count({ where: { enabled: true } }),
      this.prisma.control.count({
        where: {
          enabled: true,
          implementationStatus: 'IMPLEMENTED',
        },
      }),
    ]);

    // Get pending actions
    const pendingApprovals = await this.prisma.approvalStep.count({
      where: { status: 'IN_REVIEW' },
    });

    const overdueReviews = await this.prisma.policyDocument.count({
      where: {
        nextReviewDate: { lt: now },
        status: 'PUBLISHED',
      },
    });

    const pendingActionsTotal = pendingApprovals + overdueReviews + pendingReviewPolicies + pendingApprovalPolicies;

    // Calculate compliance rate from control implementation
    const complianceRate = totalControls > 0
      ? Math.round((implementedControls / totalControls) * 100)
      : 0;

    // Count distinct frameworks tracked
    const frameworkGroups = await this.prisma.control.groupBy({
      by: ['framework'],
      where: { enabled: true },
    });
    const frameworksTracked = frameworkGroups.length;

    // Get active incidents from database
    const [activeIncidentTotal, criticalIncidents] = await Promise.all([
      this.prisma.incident.count({
        where: { status: { notIn: ['CLOSED', 'POST_INCIDENT'] } },
      }),
      this.prisma.incident.count({
        where: {
          status: { notIn: ['CLOSED', 'POST_INCIDENT'] },
          severity: 'CRITICAL',
        },
      }),
    ]);

    // Count actions due this week
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    const dueThisWeek = await this.prisma.policyDocument.count({
      where: {
        nextReviewDate: { gte: now, lte: endOfWeek },
        status: 'PUBLISHED',
      },
    });

    return {
      riskScore: {
        current: avgRiskScore,
        previous: 0,
        change: 0,
        trend: 'stable' as const,
      },
      openRisks: {
        total: openRisks,
        critical: criticalRisks,
        high: highRisks,
        medium: mediumRisks,
        low: lowRisks,
        change: 0,
        trend: 'stable' as const,
      },
      complianceRate: {
        percentage: complianceRate,
        frameworksTracked,
        change: 0,
        trend: 'stable' as const,
      },
      pendingActions: {
        total: pendingActionsTotal,
        dueThisWeek,
        overdue: overdueReviews,
        change: 0,
        trend: 'stable' as const,
      },
      activeIncidents: {
        total: activeIncidentTotal,
        critical: criticalIncidents,
        change: 0,
        trend: 'stable' as const,
      },
      policies: {
        total: totalPolicies,
        pendingReview: pendingReviewPolicies,
        pendingApproval: pendingApprovalPolicies,
      },
      controls: {
        total: totalControls,
        implemented: implementedControls,
        notImplemented: totalControls - implementedControls,
      },
    };
  }

  async getRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
    const activities: RecentActivityItem[] = [];

    // Get recent risk updates
    const recentRisks = await this.prisma.riskScenario.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        scenarioId: true,
        title: true,
        updatedAt: true,
      },
    });

    for (const risk of recentRisks) {
      activities.push({
        id: risk.id,
        type: 'risk',
        title: `Risk ${risk.scenarioId} updated`,
        detail: risk.title,
        timestamp: risk.updatedAt,
      });
    }

    // Get recent policy audit logs
    const recentPolicyLogs = await this.prisma.policyDocumentAuditLog.findMany({
      take: 5,
      orderBy: { performedAt: 'desc' },
      include: {
        document: { select: { documentId: true, title: true } },
        performedBy: { select: { firstName: true, lastName: true } },
      },
    });

    for (const log of recentPolicyLogs) {
      activities.push({
        id: log.id,
        type: 'policy',
        title: `${log.action}: ${log.document.documentId}`,
        detail: log.document.title,
        timestamp: log.performedAt,
        userName: `${log.performedBy?.firstName || ''} ${log.performedBy?.lastName || ''}`.trim(),
      });
    }

    // Sort all activities by timestamp and return top N
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getUpcomingTasks(limit = 10): Promise<UpcomingTask[]> {
    const now = new Date();
    const tasks: UpcomingTask[] = [];

    // Get policies due for review
    const policiesDueForReview = await this.prisma.policyDocument.findMany({
      where: {
        nextReviewDate: { gte: now },
        status: 'PUBLISHED',
      },
      orderBy: { nextReviewDate: 'asc' },
      take: 5,
      select: {
        id: true,
        documentId: true,
        title: true,
        nextReviewDate: true,
      },
    });

    for (const policy of policiesDueForReview) {
      if (policy.nextReviewDate) {
        const daysUntilDue = Math.ceil(
          (policy.nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        tasks.push({
          id: policy.id,
          type: 'review',
          title: `Review ${policy.documentId}`,
          dueDate: policy.nextReviewDate,
          status: daysUntilDue <= 7 ? 'urgent' : 'not_started',
          entityId: policy.id,
          entityType: 'policy',
        });
      }
    }

    // Get pending approvals
    const pendingApprovals = await this.prisma.approvalStep.findMany({
      where: { status: 'IN_REVIEW' },
      take: 5,
      include: {
        workflow: {
          include: {
            document: { select: { documentId: true, title: true } },
          },
        },
      },
    });

    for (const step of pendingApprovals) {
      tasks.push({
        id: step.id,
        type: 'approval',
        title: `Approve ${step.workflow.document.documentId}`,
        dueDate: step.dueDate || new Date(),
        status: 'in_progress',
        entityId: step.workflow.documentId,
        entityType: 'policy',
      });
    }

    // Sort by due date and return
    return tasks
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, limit);
  }

  async getRiskTrendData(months = 6): Promise<Array<{ month: string; critical: number; high: number; medium: number; low: number }>> {
    // Get current risk counts
    const riskScenarios = await this.prisma.riskScenario.findMany({
      where: { status: { notIn: ['CLOSED', 'ACCEPTED'] } },
      select: { residualScore: true, inherentScore: true },
    });

    let critical = 0, high = 0, medium = 0, low = 0;
    for (const risk of riskScenarios) {
      const score = risk.residualScore ?? risk.inherentScore ?? 0;
      if (score >= 16) critical++;
      else if (score >= 9) high++;
      else if (score >= 4) medium++;
      else low++;
    }

    // Generate dynamic month labels from the last N months
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: Array<{ month: string; critical: number; high: number; medium: number; low: number }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        month: monthNames[d.getMonth()]!,
        critical,
        high,
        medium,
        low,
      });
    }

    return result;
  }

  async getComplianceData(): Promise<Array<{ framework: string; score: number }>> {
    // Get control counts by framework
    const frameworks = await this.prisma.control.groupBy({
      by: ['framework'],
      where: { enabled: true },
      _count: { id: true },
    });

    const implementedByFramework = await this.prisma.control.groupBy({
      by: ['framework'],
      where: { enabled: true, implementationStatus: 'IMPLEMENTED' },
      _count: { id: true },
    });

    const implementedMap = new Map(
      implementedByFramework.map(f => [f.framework, f._count.id])
    );

    return frameworks.slice(0, 5).map(fw => {
      const total = fw._count.id;
      const implemented = implementedMap.get(fw.framework) || 0;
      const score = total > 0 ? Math.round((implemented / total) * 100) : 0;

      return {
        framework: fw.framework,
        score,
      };
    });
  }
}
