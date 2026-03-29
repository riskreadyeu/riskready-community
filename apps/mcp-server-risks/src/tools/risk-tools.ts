import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling, userSelectSafe } from '#mcp-shared';

export function registerRiskTools(server: McpServer) {
  server.tool(
    'list_risks',
    'List risks with optional filters. Returns risk ID, title, status, tier, scores, and scenario counts. If not found, returns a not-found message. Do not invent or assume values.',
    {
      status: z.enum(['IDENTIFIED', 'ASSESSED', 'TREATING', 'ACCEPTED', 'CLOSED', 'MONITORING']).optional().describe('Filter by risk status'),
      tier: z.enum(['CORE', 'EXTENDED', 'ADVANCED']).optional().describe('Filter by risk tier'),
      framework: z.enum(['ISO', 'SOC2', 'NIS2', 'DORA']).optional().describe('Filter by control framework'),
      organisationId: z.string().describe('Organisation UUID (injected by gateway)'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_risks', async ({ status, tier, framework, organisationId, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (tier) where.tier = tier;
      if (framework) where.framework = framework;
      if (organisationId) where.organisationId = organisationId; // gateway always injects this

      const [results, count] = await Promise.all([
        prisma.risk.findMany({
          where,
          skip,
          take,
          orderBy: { riskId: 'asc' },
          select: {
            id: true,
            riskId: true,
            title: true,
            description: true,
            tier: true,
            status: true,
            framework: true,
            applicable: true,
            enabled: true,
            likelihood: true,
            impact: true,
            inherentScore: true,
            residualScore: true,
            derivedStatus: true,
            maxScenarioScore: true,
            avgScenarioScore: true,
            scenarioCount: true,
            scenariosExceedingTolerance: true,
            _count: { select: { scenarios: true, kris: true, treatmentPlans: true } },
          },
        }),
        prisma.risk.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, skip, take };
      if (count === 0) {
        response.note = 'No risks found matching the specified filters.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_risk',
    'Get a single risk with full details: scenarios, KRIs, treatment plans, tolerance statements, and audit metadata. If not found, returns a not-found message. Do not invent or assume values.',
    {
      id: z.string().describe('Risk UUID'),
      organisationId: z.string().describe('Organisation UUID (injected by gateway)'),
    },
    withErrorHandling('get_risk', async ({ id, organisationId }) => {
      const risk = await prisma.risk.findFirst({
        where: { id, ...(organisationId && { organisationId }) },
        include: {
          scenarios: {
            orderBy: { scenarioId: 'asc' },
            select: {
              id: true,
              scenarioId: true,
              title: true,
              status: true,
              likelihood: true,
              impact: true,
              inherentScore: true,
              residualScore: true,
              toleranceStatus: true,
              _count: { select: { controlLinks: true } },
            },
          },
          kris: {
            orderBy: { kriId: 'asc' },
            select: {
              id: true,
              kriId: true,
              name: true,
              currentValue: true,
              status: true,
              trend: true,
              unit: true,
              lastMeasured: true,
            },
          },
          treatmentPlans: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              treatmentId: true,
              title: true,
              treatmentType: true,
              priority: true,
              status: true,
              progressPercentage: true,
              targetEndDate: true,
            },
          },
          toleranceStatements: {
            select: {
              id: true,
              rtsId: true,
              title: true,
              proposedToleranceLevel: true,
              status: true,
            },
          },
          _count: { select: { scenarios: true, kris: true, treatmentPlans: true, toleranceStatements: true } },
          createdBy: { select: userSelectSafe },
          updatedBy: { select: userSelectSafe },
        },
      });

      if (!risk) {
        return { content: [{ type: 'text' as const, text: `Risk with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(risk, null, 2) }],
      };
    }),
  );

  server.tool(
    'search_risks',
    'Search risks by title or riskId pattern. Returns matching risks with basic info. If not found, returns a not-found message. Do not invent or assume values.',
    {
      query: z.string().max(200).describe('Search term (matches against title and riskId)'),
      organisationId: z.string().describe('Organisation UUID (injected by gateway)'),
    },
    withErrorHandling('search_risks', async ({ query, organisationId }) => {
      const results = await prisma.risk.findMany({
        where: {
          ...(organisationId && { organisationId }),
          OR: [
            { riskId: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 50,
        orderBy: { riskId: 'asc' },
        select: {
          id: true,
          riskId: true,
          title: true,
          description: true,
          tier: true,
          status: true,
          inherentScore: true,
          residualScore: true,
          _count: { select: { scenarios: true } },
        },
      });

      const response: Record<string, unknown> = { results, count: results.length };
      if (results.length === 0) {
        response.note = `No risks matched the search query '${query}'.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_risk_stats',
    'Get aggregate risk statistics: total count, by status, by tier, by framework, scenario and KRI counts. If not found, returns a not-found message. Do not invent or assume values.',
    {
      organisationId: z.string().describe('Organisation UUID (injected by gateway)'),
    },
    withErrorHandling('get_risk_stats', async ({ organisationId }) => {
      const where: Record<string, unknown> = {};
      if (organisationId) where.organisationId = organisationId;
      const relWhere = organisationId ? { risk: { organisationId } } : {};

      const [total, byStatus, byTier, byFramework, scenarioCount, kriCount, treatmentCount] = await Promise.all([
        prisma.risk.count({ where }),
        prisma.risk.groupBy({ by: ['status'], _count: true, where }),
        prisma.risk.groupBy({ by: ['tier'], _count: true, where }),
        prisma.risk.groupBy({ by: ['framework'], _count: true, where }),
        prisma.riskScenario.count({ where: relWhere }),
        prisma.keyRiskIndicator.count({ where: relWhere }),
        prisma.treatmentPlan.count({ where: relWhere }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            total,
            scenarioCount,
            kriCount,
            treatmentCount,
            byStatus: Object.fromEntries(byStatus.map((s: Record<string, unknown>) => [s.status, s._count])),
            byTier: Object.fromEntries(byTier.map((t: Record<string, unknown>) => [t.tier, t._count])),
            byFramework: Object.fromEntries(byFramework.map((f: Record<string, unknown>) => [f.framework, f._count])),
          }, null, 2),
        }],
      };
    }),
  );
}
