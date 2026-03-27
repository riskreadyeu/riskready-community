import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling, userSelectSafe } from '#mcp-shared';

export function registerTreatmentTools(server: McpServer) {
  server.tool(
    'list_treatment_plans',
    'List treatment plans with optional filters. Returns plan ID, title, type, status, priority, and progress. If not found, returns a not-found message. Do not invent or assume values.',
    {
      status: z.enum(['DRAFT', 'PROPOSED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).optional().describe('Filter by treatment status'),
      type: z.enum(['MITIGATE', 'TRANSFER', 'ACCEPT', 'AVOID', 'SHARE']).optional().describe('Filter by treatment type'),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Filter by priority'),
      riskId: z.string().optional().describe('Filter by parent risk UUID'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_treatment_plans', async ({ status, type, priority, riskId, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (type) where.treatmentType = type;
      if (priority) where.priority = priority;
      if (riskId) where.riskId = riskId;

      const [results, count] = await Promise.all([
        prisma.treatmentPlan.findMany({
          where,
          skip,
          take,
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
            actualEndDate: true,
            estimatedCost: true,
            risk: { select: { id: true, riskId: true, title: true } },
            _count: { select: { actions: true } },
          },
        }),
        prisma.treatmentPlan.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, skip, take };
      if (count === 0) {
        response.note = 'No treatment plans found matching the specified filters.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_treatment_plan',
    'Get a single treatment plan with full details: actions, dependencies, history, and financial info. If not found, returns a not-found message. Do not invent or assume values.',
    {
      id: z.string().describe('TreatmentPlan UUID'),
    },
    withErrorHandling('get_treatment_plan', async ({ id }) => {
      const plan = await prisma.treatmentPlan.findUnique({
        where: { id },
        include: {
          risk: { select: { id: true, riskId: true, title: true } },
          scenario: { select: { id: true, scenarioId: true, title: true } },
          actions: {
            orderBy: { actionId: 'asc' },
            include: {
              assignedTo: { select: userSelectSafe },
            },
          },
          history: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
              user: { select: userSelectSafe },
            },
          },
          sourceDependencies: {
            include: {
              targetTreatment: { select: { id: true, treatmentId: true, title: true, status: true } },
            },
          },
          targetDependencies: {
            include: {
              sourceTreatment: { select: { id: true, treatmentId: true, title: true, status: true } },
            },
          },
          riskOwner: { select: userSelectSafe },
          implementer: { select: userSelectSafe },
          approvedBy: { select: userSelectSafe },
          createdBy: { select: userSelectSafe },
          updatedBy: { select: userSelectSafe },
        },
      });

      if (!plan) {
        return { content: [{ type: 'text' as const, text: `Treatment plan with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(plan, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_treatment_stats',
    'Get aggregate treatment plan statistics: total count, by status, by type, progress distribution. If not found, returns a not-found message. Do not invent or assume values.',
    {
      organisationId: z.string().optional().describe('Organisation UUID'),
    },
    withErrorHandling('get_treatment_stats', async ({ organisationId }) => {
      const where: Record<string, unknown> = {};
      if (organisationId) where.organisationId = organisationId;

      const [total, byStatus, byType, byPriority, plans] = await Promise.all([
        prisma.treatmentPlan.count({ where }),
        prisma.treatmentPlan.groupBy({ by: ['status'], _count: true, where }),
        prisma.treatmentPlan.groupBy({ by: ['treatmentType'], _count: true, where }),
        prisma.treatmentPlan.groupBy({ by: ['priority'], _count: true, where }),
        prisma.treatmentPlan.findMany({
          where,
          take: 1000,
          select: { progressPercentage: true },
        }),
      ]);

      const avgProgress = plans.length > 0
        ? Math.round(plans.reduce((sum: number, p: { progressPercentage: number }) => sum + p.progressPercentage, 0) / plans.length)
        : 0;

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            total,
            averageProgress: avgProgress,
            byStatus: Object.fromEntries(byStatus.map((s: Record<string, unknown>) => [s.status, s._count])),
            byType: Object.fromEntries(byType.map((t: Record<string, unknown>) => [t.treatmentType, t._count])),
            byPriority: Object.fromEntries(byPriority.map((p: Record<string, unknown>) => [p.priority, p._count])),
          }, null, 2),
        }],
      };
    }),
  );
}
