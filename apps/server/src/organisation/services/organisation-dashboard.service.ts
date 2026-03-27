import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrganisationDashboardService {
  constructor(private prisma: PrismaService) { }

  async getOverview() {
    const [
      departmentCount,
      userCount,
      processCount,
      dependencyCount,
      committeeCount,
      regulatorCount,
      locationCount,
      productCount,
      platformCount,
      contextIssueCount,
      companyProfile
    ] = await Promise.all([
      this.prisma.department.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.businessProcess.count({ where: { isActive: true } }),
      this.prisma.externalDependency.count(),
      this.prisma.securityCommittee.count({ where: { isActive: true } }),
      this.prisma.regulator.count({ where: { isActive: true } }),
      this.prisma.location.count({ where: { isActive: true } }),
      this.prisma.productService.count({ where: { isActive: true } }),
      this.prisma.technologyPlatform.count({ where: { isActive: true } }),
      this.prisma.contextIssue.count({ where: { isActive: true } }),
      this.prisma.organisationProfile.findFirst({ orderBy: { createdAt: 'desc' }, select: { name: true } }),
    ]);

    return {
      departments: departmentCount,
      users: userCount,
      processes: processCount,
      dependencies: dependencyCount,
      committees: committeeCount,
      regulators: regulatorCount,
      locations: locationCount,
      products: productCount,
      platforms: platformCount,
      contextIssues: contextIssueCount,
      companyName: companyProfile?.name || 'Organisation',
    };
  }

  async getInsights() {
    const now = new Date();
    const insights: Array<{
      type: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      title: string;
      description: string;
      link?: string;
    }> = [];

    // Check for overdue action items
    const overdueActions = await this.prisma.meetingActionItem.count({
      where: {
        dueDate: { lt: now },
        status: { notIn: ['completed', 'cancelled'] },
      },
    });
    if (overdueActions > 0) {
      insights.push({
        type: 'action_items',
        priority: overdueActions > 5 ? 'critical' : 'high',
        title: `${overdueActions} Overdue Action Items`,
        description: 'Action items from committee meetings are past their due date',
        link: '/organisation/meeting-action-items?status=overdue',
      });
    }

    // Check for upcoming meetings (next 7 days)
    const upcomingMeetings = await this.prisma.committeeMeeting.count({
      where: {
        meetingDate: {
          gte: now,
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        status: 'scheduled',
      },
    });
    if (upcomingMeetings > 0) {
      insights.push({
        type: 'meetings',
        priority: 'medium',
        title: `${upcomingMeetings} Upcoming Meetings`,
        description: 'Committee meetings scheduled in the next 7 days',
        link: '/organisation/committee-meetings',
      });
    }

    // Check for pending decisions
    const pendingDecisions = await this.prisma.meetingDecision.count({
      where: {
        implemented: false,
        decisionType: 'approved',
      },
    });
    if (pendingDecisions > 0) {
      insights.push({
        type: 'decisions',
        priority: 'medium',
        title: `${pendingDecisions} Pending Implementations`,
        description: 'Approved decisions awaiting implementation',
        link: '/organisation/meeting-decisions?implemented=false',
      });
    }

    // Check for critical dependencies
    const criticalDeps = await this.prisma.externalDependency.count({
      where: { criticalityLevel: 'critical' },
    });
    if (criticalDeps > 0) {
      insights.push({
        type: 'dependencies',
        priority: 'high',
        title: `${criticalDeps} Critical Dependencies`,
        description: 'External dependencies marked as critical',
        link: '/organisation/dependencies?criticality=critical',
      });
    }

    // Check for expiring contracts (next 90 days)
    const expiringContracts = await this.prisma.externalDependency.count({
      where: {
        contractEnd: {
          gte: now,
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      },
    });
    if (expiringContracts > 0) {
      insights.push({
        type: 'contracts',
        priority: 'medium',
        title: `${expiringContracts} Expiring Contracts`,
        description: 'Vendor contracts expiring in the next 90 days',
        link: '/organisation/dependencies',
      });
    }

    // [New] Check for End-of-Life Technology (next 90 days)
    const eolTech = await this.prisma.technologyPlatform.count({
      where: {
        endOfLifeDate: {
          gte: now,
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        isActive: true,
      },
    });
    if (eolTech > 0) {
      insights.push({
        type: 'technology',
        priority: 'high',
        title: `${eolTech} Tech Platforms Reaching EOL`,
        description: 'Technology platforms reaching End-of-Life soon',
        link: '/organisation/technology-platforms',
      });
    }

    // [New] Check for High Risk Context Issues
    const criticalIssues = await this.prisma.contextIssue.count({
      where: {
        impactLevel: 'critical',
        status: 'open',
      },
    });
    if (criticalIssues > 0) {
      insights.push({
        type: 'context',
        priority: 'critical',
        title: `${criticalIssues} Critical Context Issues`,
        description: 'Internal/External issues with critical impact',
        link: '/organisation/context-issues?impact=critical',
      });
    }

    return {
      count: insights.length,
      insights: insights.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
    };
  }

  async getDepartmentSummary() {
    const [total, active, stats, byCriticality] = await Promise.all([
      this.prisma.department.count(),
      this.prisma.department.count({ where: { isActive: true } }),
      this.prisma.department.aggregate({
        _sum: { headcount: true, budget: true },
        where: { isActive: true },
      }),
      this.prisma.department.groupBy({
        by: ['criticalityLevel'],
        _count: true,
        where: { isActive: true },
      }),
    ]);

    return {
      total,
      active,
      totalHeadcount: stats._sum.headcount || 0,
      totalBudget: stats._sum.budget?.toString() || '0',
      byCriticality: byCriticality.reduce((acc, item) => {
        if (item.criticalityLevel) {
          acc[item.criticalityLevel] = item._count;
        }
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
