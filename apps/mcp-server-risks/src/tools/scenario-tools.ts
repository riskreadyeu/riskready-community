import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling, userSelectSafe } from '#mcp-shared';

export function registerScenarioTools(server: McpServer) {
  server.tool(
    'list_scenarios',
    'List risk scenarios with optional filters. Returns scenario ID, title, status, likelihood, impact, scores, and tolerance status. If not found, returns a not-found message. Do not invent or assume values.',
    {
      riskId: z.string().optional().describe('Filter by parent risk UUID'),
      status: z.enum(['DRAFT', 'ASSESSED', 'EVALUATED', 'TREATING', 'TREATED', 'ACCEPTED', 'MONITORING', 'ESCALATED', 'REVIEW', 'CLOSED', 'ARCHIVED']).optional().describe('Filter by scenario status'),
      toleranceStatus: z.enum(['WITHIN', 'EXCEEDS', 'CRITICAL']).optional().describe('Filter by tolerance status'),
      organisationId: z.string().describe('Organisation UUID (injected by gateway)'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_scenarios', async ({ riskId, status, toleranceStatus, organisationId, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (riskId) where.riskId = riskId;
      if (status) where.status = status;
      if (toleranceStatus) where.toleranceStatus = toleranceStatus;
      if (organisationId) where.risk = { organisationId };

      const [results, count] = await Promise.all([
        prisma.riskScenario.findMany({
          where,
          skip,
          take,
          orderBy: { scenarioId: 'asc' },
          select: {
            id: true,
            scenarioId: true,
            title: true,
            status: true,
            likelihood: true,
            impact: true,
            inherentScore: true,
            residualLikelihood: true,
            residualImpact: true,
            residualScore: true,
            toleranceStatus: true,
            toleranceGap: true,
            risk: { select: { id: true, riskId: true, title: true } },
            _count: { select: { controlLinks: true, treatmentPlans: true } },
          },
        }),
        prisma.riskScenario.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, skip, take };
      if (count === 0) {
        response.note = 'No risk scenarios found matching the specified filters.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_scenario',
    'Get a single risk scenario with full details: scores, controls, state history, and calculation metadata. If not found, returns a not-found message. Do not invent or assume values.',
    {
      id: z.string().describe('RiskScenario UUID'),
    },
    withErrorHandling('get_scenario', async ({ id }) => {
      const scenario = await prisma.riskScenario.findUnique({
        where: { id },
        include: {
          risk: { select: { id: true, riskId: true, title: true, organisationId: true } },
          controlLinks: {
            include: {
              control: { select: { id: true, controlId: true, name: true, implementationStatus: true } },
            },
          },
          treatmentPlans: {
            select: {
              id: true,
              treatmentId: true,
              title: true,
              status: true,
              treatmentType: true,
              progressPercentage: true,
            },
          },
          stateHistory: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              fromStatus: true,
              toStatus: true,
              transitionCode: true,
              triggeredBy: true,
              reason: true,
              createdAt: true,
            },
          },
          calculationHistory: {
            orderBy: { calculatedAt: 'desc' },
            take: 5,
            select: {
              id: true,
              trigger: true,
              likelihood: true,
              impact: true,
              inherentScore: true,
              residualScore: true,
              previousResidualScore: true,
              scoreChange: true,
              calculatedAt: true,
            },
          },
          createdBy: { select: userSelectSafe },
          updatedBy: { select: userSelectSafe },
        },
      });

      if (!scenario) {
        return { content: [{ type: 'text' as const, text: `Scenario with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(scenario, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_scenario_scores',
    'Get likelihood, impact, inherent/residual scores, and override status for a scenario. If not found, returns a not-found message. Do not invent or assume values.',
    {
      id: z.string().describe('RiskScenario UUID'),
    },
    withErrorHandling('get_scenario_scores', async ({ id }) => {
      const scenario = await prisma.riskScenario.findUnique({
        where: { id },
        select: {
          id: true,
          scenarioId: true,
          title: true,
          likelihood: true,
          impact: true,
          inherentScore: true,
          residualLikelihood: true,
          residualImpact: true,
          residualScore: true,
          calculatedResidualLikelihood: true,
          calculatedResidualImpact: true,
          calculatedResidualScore: true,
          residualOverridden: true,
          residualOverrideJustification: true,
          targetResidualScore: true,
          toleranceStatus: true,
          toleranceGap: true,
        },
      });

      if (!scenario) {
        return { content: [{ type: 'text' as const, text: `Scenario with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(scenario, null, 2) }],
      };
    }),
  );
}
