import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';

export function registerAnalysisTools(server: McpServer) {
  server.tool(
    'get_expiring_evidence',
    'Get evidence records that are expiring within a specified number of days. Helps plan evidence renewal.',
    {
      days: z.number().int().min(1).max(365).default(30).optional().describe('Number of days to look ahead (default 30)'),
    },
    async (params) => {
      const daysAhead = params.days || 30;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const expiring = await prisma.evidence.findMany({
        where: {
          validUntil: { lte: futureDate, gte: new Date() },
          status: { notIn: ['EXPIRED', 'ARCHIVED'] },
        },
        orderBy: { validUntil: 'asc' },
        select: {
          id: true,
          evidenceRef: true,
          title: true,
          evidenceType: true,
          status: true,
          validUntil: true,
          renewalRequired: true,
          collectedBy: { select: { id: true, name: true } },
          _count: { select: { controlLinks: true } },
        },
      });

      // Also get already expired but not yet archived
      const alreadyExpired = await prisma.evidence.findMany({
        where: {
          validUntil: { lt: new Date() },
          status: { notIn: ['EXPIRED', 'ARCHIVED'] },
        },
        orderBy: { validUntil: 'asc' },
        select: {
          id: true,
          evidenceRef: true,
          title: true,
          validUntil: true,
          status: true,
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            expiringWithinDays: daysAhead,
            expiringCount: expiring.length,
            alreadyExpiredCount: alreadyExpired.length,
            expiring,
            alreadyExpired,
          }, null, 2),
        }],
      };
    },
  );

  server.tool(
    'get_evidence_coverage',
    'Get evidence coverage analysis: which controls have linked evidence and which do not.',
    {},
    async () => {
      const controlsWithEvidence = await prisma.evidenceControl.findMany({
        select: {
          controlId: true,
          control: { select: { controlId: true, name: true, theme: true } },
        },
      });

      const uniqueControlIds = new Set(controlsWithEvidence.map((e: typeof controlsWithEvidence[number]) => e.controlId));

      const totalControls = await prisma.control.count({ where: { applicable: true } });
      const controlsWithoutEvidence = await prisma.control.findMany({
        where: {
          applicable: true,
          id: { notIn: Array.from(uniqueControlIds) },
        },
        select: {
          id: true,
          controlId: true,
          name: true,
          theme: true,
        },
        take: 50,
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalApplicableControls: totalControls,
            controlsWithEvidence: uniqueControlIds.size,
            controlsWithoutEvidence: totalControls - uniqueControlIds.size,
            coveragePercentage: totalControls > 0
              ? Math.round((uniqueControlIds.size / totalControls) * 100)
              : 0,
            missingEvidence: controlsWithoutEvidence,
          }, null, 2),
        }],
      };
    },
  );

  server.tool(
    'get_request_aging',
    'Get aging report for open evidence requests. Shows overdue and approaching-due requests.',
    {},
    async () => {
      const openStatuses = ['OPEN', 'IN_PROGRESS'] as const;
      const now = new Date();

      const requests = await prisma.evidenceRequest.findMany({
        where: { status: { in: [...openStatuses] } },
        select: {
          id: true,
          requestRef: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignedTo: { select: { id: true, name: true } },
          contextType: true,
          contextRef: true,
        },
        orderBy: { dueDate: 'asc' },
      });

      const overdue = requests.filter((r: typeof requests[number]) => r.dueDate < now);
      const dueSoon = requests.filter((r: typeof requests[number]) => {
        const sevenDays = new Date();
        sevenDays.setDate(sevenDays.getDate() + 7);
        return r.dueDate >= now && r.dueDate <= sevenDays;
      });
      const onTrack = requests.filter((r: typeof requests[number]) => {
        const sevenDays = new Date();
        sevenDays.setDate(sevenDays.getDate() + 7);
        return r.dueDate > sevenDays;
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalOpen: requests.length,
            overdueCount: overdue.length,
            dueSoonCount: dueSoon.length,
            onTrackCount: onTrack.length,
            overdue,
            dueSoon,
          }, null, 2),
        }],
      };
    },
  );
}
