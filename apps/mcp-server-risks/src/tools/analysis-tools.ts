import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerAnalysisTools(server: McpServer) {
  server.tool(
    'get_risk_heatmap',
    'Get risk heatmap data: likelihood x impact matrix for all scenarios with scores. If not found, returns a not-found message. Do not invent or assume values.',
    {
      organisationId: z.string().describe('Organisation UUID (injected by gateway)'),
    },
    withErrorHandling('get_risk_heatmap', async ({ organisationId }) => {
      const where: Record<string, unknown> = {};
      if (organisationId) {
        where.risk = { organisationId };
      }

      const scenarios = await prisma.riskScenario.findMany({
        where: { ...where, inherentScore: { not: null } },
        take: 1000,
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
          toleranceStatus: true,
          risk: { select: { riskId: true, title: true } },
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ scenarios, count: scenarios.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_tolerance_breaches',
    'Get scenarios exceeding their Risk Tolerance Statement thresholds. If not found, returns a not-found message. Do not invent or assume values.',
    {},
    withErrorHandling('get_tolerance_breaches', async () => {
      const breaches = await prisma.riskScenario.findMany({
        where: {
          toleranceStatus: { in: ['EXCEEDS', 'CRITICAL'] },
        },
        take: 1000,
        select: {
          id: true,
          scenarioId: true,
          title: true,
          status: true,
          inherentScore: true,
          residualScore: true,
          toleranceStatus: true,
          toleranceThreshold: true,
          toleranceGap: true,
          risk: { select: { riskId: true, title: true } },
        },
        orderBy: { toleranceGap: 'desc' },
      });

      const response: Record<string, unknown> = { breaches, count: breaches.length };
      if (breaches.length === 0) {
        response.note = 'No scenarios exceeding tolerance thresholds. All risks are within tolerance.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_treatment_progress',
    'Get overall treatment completion rates and overdue treatments. If not found, returns a not-found message. Do not invent or assume values.',
    {},
    withErrorHandling('get_treatment_progress', async () => {
      const [active, overdue] = await Promise.all([
        prisma.treatmentPlan.findMany({
          where: { status: { in: ['APPROVED', 'IN_PROGRESS'] } },
          take: 1000,
          select: {
            id: true,
            treatmentId: true,
            title: true,
            status: true,
            progressPercentage: true,
            targetEndDate: true,
            priority: true,
            risk: { select: { riskId: true, title: true } },
            _count: { select: { actions: true } },
          },
          orderBy: { targetEndDate: 'asc' },
        }),
        prisma.treatmentPlan.findMany({
          where: {
            status: { in: ['APPROVED', 'IN_PROGRESS'] },
            targetEndDate: { lt: new Date() },
          },
          take: 1000,
          select: {
            id: true,
            treatmentId: true,
            title: true,
            targetEndDate: true,
            progressPercentage: true,
            priority: true,
            risk: { select: { riskId: true, title: true } },
          },
        }),
      ]);

      const response: Record<string, unknown> = {
        activeTreatments: active,
        activeCount: active.length,
        overdueTreatments: overdue,
        overdueCount: overdue.length,
      };
      if (active.length === 0) {
        response.note = 'No active treatment plans found.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_kri_alerts',
    'Get KRIs in RED status or with DECLINING trend that need attention. If not found, returns a not-found message. Do not invent or assume values.',
    {},
    withErrorHandling('get_kri_alerts', async () => {
      const alerts = await prisma.keyRiskIndicator.findMany({
        where: {
          OR: [
            { status: 'RED' },
            { trend: 'DECLINING' },
          ],
        },
        take: 1000,
        select: {
          id: true,
          kriId: true,
          name: true,
          currentValue: true,
          status: true,
          trend: true,
          unit: true,
          lastMeasured: true,
          thresholdRed: true,
          risk: { select: { riskId: true, title: true } },
        },
        orderBy: [{ status: 'asc' }, { kriId: 'asc' }],
      });

      const response: Record<string, unknown> = { alerts, count: alerts.length };
      if (alerts.length === 0) {
        response.note = 'No KRI alerts. All KRIs are within acceptable thresholds and trends.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_risk_dashboard',
    'Get aggregate risk posture summary: risk counts, scenario distribution, tolerance status, treatment progress. If not found, returns a not-found message. Do not invent or assume values.',
    {
      organisationId: z.string().describe('Organisation UUID (injected by gateway)'),
    },
    withErrorHandling('get_risk_dashboard', async ({ organisationId }) => {
      const riskWhere: Record<string, unknown> = {};
      if (organisationId) riskWhere.organisationId = organisationId;

      const [
        totalRisks,
        risksByStatus,
        totalScenarios,
        scenariosByStatus,
        scenariosByTolerance,
        totalKRIs,
        krisByStatus,
        totalTreatments,
        treatmentsByStatus,
      ] = await Promise.all([
        prisma.risk.count({ where: riskWhere }),
        prisma.risk.groupBy({ by: ['status'], _count: true, where: riskWhere }),
        prisma.riskScenario.count(),
        prisma.riskScenario.groupBy({ by: ['status'], _count: true }),
        prisma.riskScenario.groupBy({ by: ['toleranceStatus'], _count: true }),
        prisma.keyRiskIndicator.count(),
        prisma.keyRiskIndicator.groupBy({ by: ['status'], _count: true }),
        prisma.treatmentPlan.count(),
        prisma.treatmentPlan.groupBy({ by: ['status'], _count: true }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            risks: {
              total: totalRisks,
              byStatus: Object.fromEntries(risksByStatus.map((s: Record<string, unknown>) => [s.status, s._count])),
            },
            scenarios: {
              total: totalScenarios,
              byStatus: Object.fromEntries(scenariosByStatus.map((s: Record<string, unknown>) => [s.status, s._count])),
              byTolerance: Object.fromEntries(scenariosByTolerance.map((t: Record<string, unknown>) => [t.toleranceStatus ?? 'NOT_EVALUATED', t._count])),
            },
            kris: {
              total: totalKRIs,
              byRAG: Object.fromEntries(krisByStatus.map((s: Record<string, unknown>) => [s.status ?? 'NOT_MEASURED', s._count])),
            },
            treatments: {
              total: totalTreatments,
              byStatus: Object.fromEntries(treatmentsByStatus.map((s: Record<string, unknown>) => [s.status, s._count])),
            },
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_overdue_treatments',
    'Get treatment plans past their target end date. If not found, returns a not-found message. Do not invent or assume values.',
    {
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('get_overdue_treatments', async ({ skip, take }) => {
      const [results, count] = await Promise.all([
        prisma.treatmentPlan.findMany({
          where: {
            status: { in: ['DRAFT', 'PROPOSED', 'APPROVED', 'IN_PROGRESS'] },
            targetEndDate: { lt: new Date() },
          },
          skip,
          take,
          orderBy: { targetEndDate: 'asc' },
          select: {
            id: true,
            treatmentId: true,
            title: true,
            status: true,
            priority: true,
            targetEndDate: true,
            progressPercentage: true,
            risk: { select: { riskId: true, title: true } },
          },
        }),
        prisma.treatmentPlan.count({
          where: {
            status: { in: ['DRAFT', 'PROPOSED', 'APPROVED', 'IN_PROGRESS'] },
            targetEndDate: { lt: new Date() },
          },
        }),
      ]);

      const response: Record<string, unknown> = { results, total: count, skip, take };
      if (count === 0) {
        response.note = 'No overdue treatment plans. All active treatments are on track.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );
}
