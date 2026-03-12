import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';
import { getSingleOrganisation } from './single-org.js';

export function registerAnalysisTools(server: McpServer) {
  server.tool(
    'get_org_dashboard',
    'Get an organisation dashboard summary — departments, locations, processes, committees, personnel, and key counts.',
    {},
    withErrorHandling('get_org_dashboard', async () => {
      const [
        departments,
        locations,
        processes,
        committees,
        keyPersonnel,
        externalDeps,
        regulators,
        frameworks,
        contextIssues,
        interestedParties,
      ] = await Promise.all([
        prisma.department.count({ where: { isActive: true } }),
        prisma.location.count({ where: { isActive: true } }),
        prisma.businessProcess.count({ where: { isActive: true } }),
        prisma.securityCommittee.count({ where: { isActive: true } }),
        prisma.keyPersonnel.count({ where: { isActive: true } }),
        prisma.externalDependency.count(),
        prisma.regulator.count({ where: { isActive: true } }),
        prisma.applicableFramework.count({ where: { isApplicable: true } }),
        prisma.contextIssue.count({ where: { isActive: true } }),
        prisma.interestedParty.count({ where: { isActive: true } }),
      ]);

      const org = await getSingleOrganisation({
        name: true,
        employeeCount: true,
        isoCertificationStatus: true,
        isDoraApplicable: true,
        isNis2Applicable: true,
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            organisation: org,
            counts: {
              departments,
              locations,
              processes,
              committees,
              keyPersonnel,
              externalDependencies: externalDeps,
              regulators,
              applicableFrameworks: frameworks,
              contextIssues,
              interestedParties,
            },
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_bia_summary',
    'Get Business Impact Analysis summary — process BIA completion rates, criticality distribution, recovery objectives.',
    {},
    withErrorHandling('get_bia_summary', async () => {
      const [total, biaCompleted, bcpEnabled, byCriticality, byBiaStatus] = await Promise.all([
        prisma.businessProcess.count({ where: { isActive: true } }),
        prisma.businessProcess.count({ where: { isActive: true, biaStatus: 'completed' } }),
        prisma.businessProcess.count({ where: { isActive: true, bcpEnabled: true } }),
        prisma.businessProcess.groupBy({
          by: ['criticalityLevel'],
          where: { isActive: true },
          _count: { _all: true },
        }),
        prisma.businessProcess.groupBy({
          by: ['biaStatus'],
          where: { isActive: true },
          _count: { _all: true },
        }),
      ]);

      const criticalProcesses = await prisma.businessProcess.findMany({
        where: { isActive: true, criticalityLevel: 'critical' },
        take: 1000,
        select: {
          id: true,
          name: true,
          processCode: true,
          biaStatus: true,
          bcpEnabled: true,
          recoveryTimeObjectiveMinutes: true,
          recoveryPointObjectiveMinutes: true,
          maximumTolerableDowntimeMinutes: true,
          processOwner: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { processCode: 'asc' },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalProcesses: total,
            biaCompletedCount: biaCompleted,
            biaCompletionRate: total > 0 ? Math.round((biaCompleted / total) * 100) : 0,
            bcpEnabledCount: bcpEnabled,
            byCriticality: Object.fromEntries(byCriticality.map((c: typeof byCriticality[number]) => [c.criticalityLevel, c._count._all])),
            byBiaStatus: Object.fromEntries(byBiaStatus.map((s: typeof byBiaStatus[number]) => [s.biaStatus, s._count._all])),
            criticalProcesses,
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_governance_activity_report',
    'Get governance activity report — recent committee meetings, open action items, upcoming meetings.',
    {},
    withErrorHandling('get_governance_activity_report', async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [recentMeetings, upcomingMeetings, openActions, overdueActions] = await Promise.all([
        prisma.committeeMeeting.findMany({
          where: {
            meetingDate: { gte: thirtyDaysAgo, lte: now },
            status: { not: 'cancelled' },
          },
          take: 1000,
          select: {
            id: true,
            title: true,
            meetingDate: true,
            status: true,
            quorumAchieved: true,
            committee: { select: { name: true } },
            _count: { select: { decisions: true, actionItems: true } },
          },
          orderBy: { meetingDate: 'desc' },
        }),
        prisma.committeeMeeting.findMany({
          where: {
            meetingDate: { gt: now, lte: thirtyDaysFromNow },
            status: 'scheduled',
          },
          take: 1000,
          select: {
            id: true,
            title: true,
            meetingDate: true,
            committee: { select: { name: true } },
          },
          orderBy: { meetingDate: 'asc' },
        }),
        prisma.meetingActionItem.count({
          where: { status: 'open' },
        }),
        prisma.meetingActionItem.count({
          where: {
            status: 'open',
            dueDate: { lt: now },
          },
        }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            recentMeetingsCount: recentMeetings.length,
            upcomingMeetingsCount: upcomingMeetings.length,
            openActionItems: openActions,
            overdueActionItems: overdueActions,
            recentMeetings,
            upcomingMeetings,
          }, null, 2),
        }],
      };
    }),
  );
}
