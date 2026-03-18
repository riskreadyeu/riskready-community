import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerAnalysisTools(server: McpServer) {
  server.tool(
    'get_incident_trending',
    'Get incident trending data: counts by month for the last 12 months, broken down by severity. If not found, returns a not-found message. Do not invent or assume values.',
    {},
    withErrorHandling('get_incident_trending', async () => {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const incidents = await prisma.incident.findMany({
        where: { detectedAt: { gte: twelveMonthsAgo } },
        take: 1000,
        select: {
          detectedAt: true,
          severity: true,
        },
        orderBy: { detectedAt: 'asc' },
      });

      const monthlyTrend: Record<string, Record<string, number>> = {};
      for (const inc of incidents) {
        const monthKey = `${inc.detectedAt.getFullYear()}-${String(inc.detectedAt.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyTrend[monthKey]) {
          monthlyTrend[monthKey] = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, total: 0 };
        }
        monthlyTrend[monthKey]![inc.severity]!++;
        monthlyTrend[monthKey]!['total']!++;
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            period: { from: twelveMonthsAgo.toISOString(), to: new Date().toISOString() },
            totalIncidents: incidents.length,
            monthlyTrend,
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_mttr_report',
    'Get Mean Time To Respond/Resolve report. Calculates average time from detection to containment and closure. If not found, returns a not-found message. Do not invent or assume values.',
    {},
    withErrorHandling('get_mttr_report', async () => {
      const closedIncidents = await prisma.incident.findMany({
        where: { status: 'CLOSED', closedAt: { not: null } },
        take: 1000,
        select: {
          referenceNumber: true,
          severity: true,
          detectedAt: true,
          containedAt: true,
          closedAt: true,
        },
      });

      const stats: Record<string, { count: number; totalContainHours: number; totalResolveHours: number }> = {
        CRITICAL: { count: 0, totalContainHours: 0, totalResolveHours: 0 },
        HIGH: { count: 0, totalContainHours: 0, totalResolveHours: 0 },
        MEDIUM: { count: 0, totalContainHours: 0, totalResolveHours: 0 },
        LOW: { count: 0, totalContainHours: 0, totalResolveHours: 0 },
      };

      for (const inc of closedIncidents) {
        const sev = inc.severity;
        const sevStats = stats[sev];
        if (!sevStats) continue;
        sevStats.count++;
        if (inc.containedAt) {
          sevStats.totalContainHours += (inc.containedAt.getTime() - inc.detectedAt.getTime()) / (1000 * 60 * 60);
        }
        if (inc.closedAt) {
          sevStats.totalResolveHours += (inc.closedAt.getTime() - inc.detectedAt.getTime()) / (1000 * 60 * 60);
        }
      }

      const mttr: Record<string, { count: number; avgContainHours: number | null; avgResolveHours: number | null }> = {};
      for (const [sev, data] of Object.entries(stats)) {
        mttr[sev] = {
          count: data.count,
          avgContainHours: data.count > 0 ? Math.round(data.totalContainHours / data.count * 10) / 10 : null,
          avgResolveHours: data.count > 0 ? Math.round(data.totalResolveHours / data.count * 10) / 10 : null,
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalClosedIncidents: closedIncidents.length,
            mttrBySeverity: mttr,
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_incident_control_gaps',
    'Identify controls that were linked to incidents as failed or bypassed. Helps prioritize control improvements. If not found, returns a not-found message. Do not invent or assume values.',
    {},
    withErrorHandling('get_incident_control_gaps', async () => {
      const failedControls = await prisma.incidentControl.findMany({
        where: {
          linkType: { in: ['failed', 'bypassed'] },
        },
        take: 1000,
        select: {
          linkType: true,
          control: {
            select: {
              id: true,
              controlId: true,
              name: true,
              theme: true,
              implementationStatus: true,
            },
          },
          incident: {
            select: {
              referenceNumber: true,
              severity: true,
              status: true,
            },
          },
        },
      });

      // Group by control
      const controlGaps: Record<string, {
        control: { id: string; controlId: string; name: string; theme: string; implementationStatus: string };
        failedCount: number;
        bypassedCount: number;
        incidents: { referenceNumber: string; severity: string; linkType: string }[];
      }> = {};

      for (const link of failedControls) {
        const key = link.control.id;
        if (!controlGaps[key]) {
          controlGaps[key] = {
            control: link.control,
            failedCount: 0,
            bypassedCount: 0,
            incidents: [],
          };
        }
        if (link.linkType === 'failed') controlGaps[key].failedCount++;
        if (link.linkType === 'bypassed') controlGaps[key].bypassedCount++;
        controlGaps[key].incidents.push({
          referenceNumber: link.incident.referenceNumber,
          severity: link.incident.severity,
          linkType: link.linkType || 'unknown',
        });
      }

      const gaps = Object.values(controlGaps).sort((a, b) =>
        (b.failedCount + b.bypassedCount) - (a.failedCount + a.bypassedCount)
      );

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalControlGaps: gaps.length,
            gaps,
          }, null, 2),
        }],
      };
    }),
  );
}
