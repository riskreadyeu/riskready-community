import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerAnalysisTools(server: McpServer) {
  server.tool(
    'get_nc_aging_report',
    'Get an aging report for open nonconformities. Calculates days open from dateRaised and groups by severity into aging buckets (0-30, 31-60, 61-90, 90+ days).',
    {},
    withErrorHandling('get_nc_aging_report', async () => {
      const now = new Date();

      const openNCs = await prisma.nonconformity.findMany({
        where: {
          status: { in: ['DRAFT', 'OPEN', 'IN_PROGRESS', 'AWAITING_VERIFICATION'] },
        },
        take: 1000,
        select: {
          id: true,
          ncId: true,
          title: true,
          severity: true,
          status: true,
          dateRaised: true,
          targetClosureDate: true,
          capStatus: true,
          control: { select: { id: true, controlId: true, name: true } },
          responsibleUser: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { dateRaised: 'asc' },
      });

      const buckets = {
        '0-30': [] as Array<Record<string, unknown>>,
        '31-60': [] as Array<Record<string, unknown>>,
        '61-90': [] as Array<Record<string, unknown>>,
        '90+': [] as Array<Record<string, unknown>>,
      };

      const bySeverity: Record<string, Record<string, number>> = {
        MAJOR: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
        MINOR: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
        OBSERVATION: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
      };

      for (const nc of openNCs) {
        const daysOpen = Math.floor((now.getTime() - nc.dateRaised.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = nc.targetClosureDate ? nc.targetClosureDate < now : false;

        const entry: Record<string, unknown> = {
          ...nc,
          daysOpen,
          isOverdue,
        };

        let bucket: keyof typeof buckets;
        if (daysOpen <= 30) bucket = '0-30';
        else if (daysOpen <= 60) bucket = '31-60';
        else if (daysOpen <= 90) bucket = '61-90';
        else bucket = '90+';

        buckets[bucket].push(entry);
        if (nc.severity in bySeverity) {
          const sevBucket = bySeverity[nc.severity];
          if (sevBucket) sevBucket[bucket]!++;
        }
      }

      const response: Record<string, unknown> = {
        totalOpen: openNCs.length,
        agingBuckets: {
          '0-30': { count: buckets['0-30'].length, items: buckets['0-30'] },
          '31-60': { count: buckets['31-60'].length, items: buckets['31-60'] },
          '61-90': { count: buckets['61-90'].length, items: buckets['61-90'] },
          '90+': { count: buckets['90+'].length, items: buckets['90+'] },
        },
        bySeverity,
      };

      if (openNCs.length === 0) {
        response['note'] = 'No open nonconformities found. All NCs are closed, rejected, or verified.';
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_cap_status_report',
    'Get a CAP pipeline breakdown for nonconformities that require corrective action. Shows counts by CAP status: NOT_DEFINED, DRAFT, PENDING_APPROVAL, APPROVED, REJECTED.',
    {},
    withErrorHandling('get_cap_status_report', async () => {
      const ncs = await prisma.nonconformity.findMany({
        where: {
          capStatus: { not: 'NOT_REQUIRED' },
        },
        take: 1000,
        select: {
          id: true,
          ncId: true,
          title: true,
          severity: true,
          status: true,
          capStatus: true,
          correctiveAction: true,
          targetClosureDate: true,
          responsibleUser: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { capStatus: 'asc' },
      });

      const pipeline: Record<string, Array<Record<string, unknown>>> = {
        NOT_DEFINED: [],
        DRAFT: [],
        PENDING_APPROVAL: [],
        APPROVED: [],
        REJECTED: [],
      };

      for (const nc of ncs) {
        if (nc.capStatus in pipeline) {
          pipeline[nc.capStatus]!.push(nc);
        }
      }

      const summary: Record<string, number> = {};
      for (const [status, items] of Object.entries(pipeline)) {
        summary[status] = items.length;
      }

      const response: Record<string, unknown> = {
        total: ncs.length,
        summary,
        pipeline: Object.fromEntries(
          Object.entries(pipeline).map(([status, items]) => [
            status,
            { count: items.length, items },
          ]),
        ),
      };

      if (ncs.length === 0) {
        response['note'] = 'No nonconformities require corrective action (all are NOT_REQUIRED or none exist).';
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_nc_by_control',
    'Group nonconformities by control, showing count per control. Includes control name and ID.',
    {},
    withErrorHandling('get_nc_by_control', async () => {
      const ncs = await prisma.nonconformity.findMany({
        where: {
          controlId: { not: null },
        },
        take: 1000,
        select: {
          id: true,
          ncId: true,
          title: true,
          severity: true,
          status: true,
          control: { select: { id: true, controlId: true, name: true } },
        },
        orderBy: { control: { controlId: 'asc' } },
      });

      const byControl = new Map<string, { control: Record<string, unknown>; count: number; ncs: Array<Record<string, unknown>> }>();

      for (const nc of ncs) {
        if (!nc.control) continue;
        const key = nc.control.id;
        if (!byControl.has(key)) {
          byControl.set(key, {
            control: nc.control,
            count: 0,
            ncs: [],
          });
        }
        const entry = byControl.get(key)!;
        entry.count++;
        entry.ncs.push({
          id: nc.id,
          ncId: nc.ncId,
          title: nc.title,
          severity: nc.severity,
          status: nc.status,
        });
      }

      const groups = Array.from(byControl.values()).sort((a, b) => b.count - a.count);

      const unlinkedCount = await prisma.nonconformity.count({
        where: { controlId: null },
      });

      const response: Record<string, unknown> = {
        controlGroups: groups,
        totalControlsWithNCs: groups.length,
        totalLinkedNCs: ncs.length,
        unlinkedNCs: unlinkedCount,
      };

      if (groups.length === 0) {
        response['note'] = 'No nonconformities are linked to controls.';
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2),
        }],
      };
    }),
  );
}
