import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerKRITools(server: McpServer) {
  server.tool(
    'list_kris',
    'List Key Risk Indicators with optional filters. Returns KRI ID, name, current value, RAG status, and trend.',
    {
      riskId: z.string().optional().describe('Filter by parent risk UUID'),
      status: z.enum(['GREEN', 'AMBER', 'RED']).optional().describe('Filter by RAG status'),
      tier: z.enum(['CORE', 'EXTENDED', 'ADVANCED']).optional().describe('Filter by tier'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_kris', async ({ riskId, status, tier, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (riskId) where.riskId = riskId;
      if (status) where.status = status;
      if (tier) where.tier = tier;

      const [results, count] = await Promise.all([
        prisma.keyRiskIndicator.findMany({
          where,
          skip,
          take,
          orderBy: { kriId: 'asc' },
          select: {
            id: true,
            kriId: true,
            name: true,
            description: true,
            unit: true,
            currentValue: true,
            status: true,
            trend: true,
            lastMeasured: true,
            thresholdGreen: true,
            thresholdAmber: true,
            thresholdRed: true,
            frequency: true,
            dataSource: true,
            automated: true,
            tier: true,
            risk: { select: { id: true, riskId: true, title: true } },
          },
        }),
        prisma.keyRiskIndicator.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, skip, take };
      if (count === 0) {
        response.note = 'No KRIs found matching the specified filters.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_kri',
    'Get a single Key Risk Indicator with full details and measurement history.',
    {
      id: z.string().describe('KeyRiskIndicator UUID'),
    },
    withErrorHandling('get_kri', async ({ id }) => {
      const kri = await prisma.keyRiskIndicator.findUnique({
        where: { id },
        include: {
          risk: { select: { id: true, riskId: true, title: true } },
          history: {
            orderBy: { measuredAt: 'desc' },
            take: 20,
          },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      if (!kri) {
        return { content: [{ type: 'text' as const, text: `KRI with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(kri, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_kri_dashboard',
    'Get an organisation-wide KRI summary: total KRIs, RAG distribution, trend breakdown, collection status.',
    {},
    withErrorHandling('get_kri_dashboard', async () => {
      const [total, byStatus, byTrend, kris] = await Promise.all([
        prisma.keyRiskIndicator.count(),
        prisma.keyRiskIndicator.groupBy({ by: ['status'], _count: true }),
        prisma.keyRiskIndicator.groupBy({ by: ['trend'], _count: true }),
        prisma.keyRiskIndicator.findMany({
          take: 1000,
          select: { lastMeasured: true, frequency: true },
        }),
      ]);

      const measured = kris.filter((k: { lastMeasured: Date | null; frequency: string | null }) => k.lastMeasured !== null).length;
      const notMeasured = kris.filter((k: { lastMeasured: Date | null; frequency: string | null }) => k.lastMeasured === null).length;

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalKRIs: total,
            ragDistribution: Object.fromEntries(byStatus.map((s: Record<string, unknown>) => [s.status ?? 'NOT_MEASURED', s._count])),
            trendBreakdown: Object.fromEntries(byTrend.map((t: Record<string, unknown>) => [t.trend ?? 'NEW', t._count])),
            collectionStatus: { measured, notMeasured },
          }, null, 2),
        }],
      };
    }),
  );
}
