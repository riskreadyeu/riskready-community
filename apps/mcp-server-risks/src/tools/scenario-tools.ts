import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerScenarioTools(server: McpServer) {
  server.tool(
    'list_scenarios',
    'List risk scenarios with optional filters. Returns scenario ID, title, status, scores, and tolerance status.',
    {
      riskId: z.string().optional().describe('Filter by parent risk UUID'),
      status: z.enum(['DRAFT', 'ASSESSED', 'EVALUATED', 'TREATING', 'TREATED', 'ACCEPTED', 'MONITORING', 'ESCALATED', 'REVIEW', 'CLOSED', 'ARCHIVED']).optional().describe('Filter by scenario status'),
      toleranceStatus: z.enum(['WITHIN', 'EXCEEDS', 'CRITICAL']).optional().describe('Filter by tolerance status'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_scenarios', async ({ riskId, status, toleranceStatus, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (riskId) where.riskId = riskId;
      if (status) where.status = status;
      if (toleranceStatus) where.toleranceStatus = toleranceStatus;

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
            quantitativeMode: true,
            aleMean: true,
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
    'Get a single risk scenario with full details: factor scores, assessments, controls, state history, and calculation metadata.',
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
          impactAssessments: true,
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
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
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
    'Get factor scores (F1-F6), impact scores (I1-I5), and calculation metadata for a scenario.',
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
          f1ThreatFrequency: true,
          f1Source: true,
          f1Override: true,
          f2ControlEffectiveness: true,
          f2Source: true,
          f2Override: true,
          f3GapVulnerability: true,
          f3Source: true,
          f3Override: true,
          f4IncidentHistory: true,
          f5AttackSurface: true,
          f6Environmental: true,
          i1Financial: true,
          i2Operational: true,
          i3Regulatory: true,
          i4Reputational: true,
          i5Strategic: true,
          calculatedLikelihood: true,
          calculatedImpact: true,
          likelihood: true,
          impact: true,
          inherentScore: true,
          residualLikelihood: true,
          residualImpact: true,
          residualScore: true,
          calculatedResidualScore: true,
          residualOverridden: true,
          residualOverrideJustification: true,
          weightedImpact: true,
          residualWeightedImpact: true,
          calculationTrigger: true,
          lastCalculatedAt: true,
          quantitativeMode: true,
          tefMin: true,
          tefMode: true,
          tefMax: true,
          aleMean: true,
          aleMedian: true,
          aleP90: true,
          aleP95: true,
          aleP99: true,
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
