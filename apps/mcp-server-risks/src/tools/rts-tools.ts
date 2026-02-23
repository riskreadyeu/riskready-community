import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerRTSTools(server: McpServer) {
  server.tool(
    'list_rts',
    'List Risk Tolerance Statements with optional status filter.',
    {
      status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'RETIRED']).optional().describe('Filter by RTS status'),
      organisationId: z.string().optional().describe('Filter by organisation UUID'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_rts', async ({ status, organisationId, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (organisationId) where.organisationId = organisationId;

      const [results, count] = await Promise.all([
        prisma.riskToleranceStatement.findMany({
          where,
          skip,
          take,
          orderBy: { rtsId: 'asc' },
          select: {
            id: true,
            rtsId: true,
            title: true,
            domain: true,
            proposedToleranceLevel: true,
            status: true,
            appetiteLevel: true,
            category: true,
            toleranceThreshold: true,
            effectiveDate: true,
            reviewDate: true,
            approvedDate: true,
            _count: { select: { risks: true, scenarios: true, kris: true } },
          },
        }),
        prisma.riskToleranceStatement.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, skip, take };
      if (count === 0) {
        response.note = 'No Risk Tolerance Statements found matching the specified filters.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_rts',
    'Get a single Risk Tolerance Statement with full details: linked risks, evaluations, and approval info.',
    {
      id: z.string().describe('RiskToleranceStatement UUID'),
    },
    withErrorHandling('get_rts', async ({ id }) => {
      const rts = await prisma.riskToleranceStatement.findUnique({
        where: { id },
        include: {
          risks: {
            select: { id: true, riskId: true, title: true, status: true, inherentScore: true, residualScore: true },
          },
          scenarios: {
            select: { id: true, scenarioId: true, title: true, status: true, toleranceStatus: true },
          },
          kris: {
            select: { id: true, kriId: true, name: true, status: true, currentValue: true },
          },
          toleranceEvaluations: {
            orderBy: { evaluatedAt: 'desc' },
            take: 5,
          },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      if (!rts) {
        return { content: [{ type: 'text' as const, text: `RTS with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(rts, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_rts_stats',
    'Get aggregate RTS statistics: total count, by status, by tolerance level.',
    {
      organisationId: z.string().optional().describe('Organisation UUID'),
    },
    withErrorHandling('get_rts_stats', async ({ organisationId }) => {
      const where: Record<string, unknown> = {};
      if (organisationId) where.organisationId = organisationId;

      const [total, byStatus, byLevel] = await Promise.all([
        prisma.riskToleranceStatement.count({ where }),
        prisma.riskToleranceStatement.groupBy({ by: ['status'], _count: true, where }),
        prisma.riskToleranceStatement.groupBy({ by: ['proposedToleranceLevel'], _count: true, where }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            total,
            byStatus: Object.fromEntries(byStatus.map((s: Record<string, unknown>) => [s.status, s._count])),
            byToleranceLevel: Object.fromEntries(byLevel.map((l: Record<string, unknown>) => [l.proposedToleranceLevel, l._count])),
          }, null, 2),
        }],
      };
    }),
  );
}
