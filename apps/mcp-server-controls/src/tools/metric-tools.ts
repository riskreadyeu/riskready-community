import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';

export function registerMetricTools(server: McpServer) {
  server.tool(
    'list_metrics',
    'List metrics for a control with RAG status, trend, and current value. In Community Edition, metrics are linked directly to controls.',
    {
      controlId: z.string().describe('Control UUID'),
    },
    async ({ controlId }) => {
      const metrics = await prisma.controlMetric.findMany({
        where: { controlId },
        orderBy: { metricId: 'asc' },
        select: {
          id: true,
          metricId: true,
          name: true,
          description: true,
          formula: true,
          unit: true,
          currentValue: true,
          status: true,
          trend: true,
          lastMeasured: true,
          greenThreshold: true,
          amberThreshold: true,
          redThreshold: true,
          dataSource: true,
          collectionFrequency: true,
          owner: true,
          automationStatus: true,
        },
      });

      const response: any = { metrics, count: metrics.length };
      if (metrics.length === 0) {
        response.note = 'No metrics found for this control.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    },
  );

  server.tool(
    'get_metric',
    'Get a single control metric with full details and measurement history.',
    {
      id: z.string().describe('ControlMetric UUID'),
    },
    async ({ id }) => {
      const metric = await prisma.controlMetric.findUnique({
        where: { id },
        include: {
          control: { select: { id: true, controlId: true, name: true } },
          history: {
            orderBy: { measuredAt: 'desc' },
            take: 20,
          },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      if (!metric) {
        return { content: [{ type: 'text' as const, text: `Metric with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(metric, null, 2) }],
      };
    },
  );

  server.tool(
    'get_metric_dashboard',
    'Get an organisation-wide metric summary: total metrics, RAG distribution, trend breakdown, collection status.',
    {},
    async () => {
      const [total, byStatus, byTrend, metrics] = await Promise.all([
        prisma.controlMetric.count(),
        prisma.controlMetric.groupBy({ by: ['status'], _count: true }),
        prisma.controlMetric.groupBy({ by: ['trend'], _count: true }),
        prisma.controlMetric.findMany({
          select: { lastMeasured: true, collectionFrequency: true },
        }),
      ]);

      const measured = metrics.filter(m => m.lastMeasured !== null).length;
      const notMeasured = metrics.filter(m => m.lastMeasured === null).length;

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalMetrics: total,
            ragDistribution: Object.fromEntries(byStatus.map(s => [s.status ?? 'NOT_MEASURED', s._count])),
            trendBreakdown: Object.fromEntries(byTrend.map(t => [t.trend ?? 'NEW', t._count])),
            collectionStatus: { measured, notMeasured },
          }, null, 2),
        }],
      };
    },
  );
}
