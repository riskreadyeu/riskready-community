import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerAnalysisTools(server: McpServer) {
  server.tool(
    'get_gap_analysis',
    'Get gap analysis from assessment results — identifies controls with FAIL or PARTIAL test results. Optionally scoped to a specific assessment.',
    {
      assessmentId: z.string().optional().describe('Assessment UUID (if omitted, uses latest completed assessment)'),
    },
    withErrorHandling('get_gap_analysis', async ({ assessmentId }) => {
      // If no assessment specified, find the latest completed one
      let targetAssessmentId = assessmentId;
      if (!targetAssessmentId) {
        const latest = await prisma.assessment.findFirst({
          where: { status: 'COMPLETED' },
          orderBy: { actualEndDate: 'desc' },
          select: { id: true },
        });
        targetAssessmentId = latest?.id;
      }

      if (targetAssessmentId) {
        // Assessment-based gap analysis: find tests with FAIL or PARTIAL results
        const failedTests = await prisma.assessmentTest.findMany({
          where: {
            assessmentId: targetAssessmentId,
            result: { in: ['FAIL', 'PARTIAL'] },
          },
          take: 1000,
          select: {
            id: true,
            testCode: true,
            testName: true,
            result: true,
            findings: true,
            recommendations: true,
            rootCause: true,
            remediationEffort: true,
            scopeItem: { select: { id: true, code: true, name: true } },
          },
          orderBy: { testCode: 'asc' },
        });

        const assessment = await prisma.assessment.findUnique({
          where: { id: targetAssessmentId },
          select: { id: true, assessmentRef: true, title: true, status: true, totalTests: true, passedTests: true, failedTests: true },
        });

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              assessment,
              gaps: failedTests,
              summary: {
                totalGaps: failedTests.length,
                failCount: failedTests.filter(t => t.result === 'FAIL').length,
                partialCount: failedTests.filter(t => t.result === 'PARTIAL').length,
              },
            }, null, 2),
          }],
        };
      }

      // Fallback: implementation-status-based gap analysis (no completed assessments)
      const controls = await prisma.control.findMany({
        where: { applicable: true, enabled: true },
        take: 1000,
        select: {
          id: true,
          controlId: true,
          name: true,
          theme: true,
          implementationStatus: true,
        },
        orderBy: { controlId: 'asc' },
      });

      const gaps = controls.filter(c => c.implementationStatus !== 'IMPLEMENTED');
      const total = controls.length;
      const implemented = controls.filter(c => c.implementationStatus === 'IMPLEMENTED').length;

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            assessment: null,
            note: 'No completed assessments found. Showing implementation-status-based gap analysis.',
            gaps: gaps.map(c => ({
              controlId: c.controlId,
              name: c.name,
              theme: c.theme,
              implementationStatus: c.implementationStatus,
            })),
            summary: {
              total,
              implemented,
              partial: controls.filter(c => c.implementationStatus === 'PARTIAL').length,
              notStarted: controls.filter(c => c.implementationStatus === 'NOT_STARTED').length,
              completionRate: total > 0 ? Math.round((implemented / total) * 100) : 0,
            },
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_overdue_tests',
    'Get assessment tests that are past their due date. Helps identify testing gaps.',
    {
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('get_overdue_tests', async ({ skip, take }) => {
      const now = new Date();

      // Find assessments past their due date with incomplete tests
      const overdueTests = await prisma.assessmentTest.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          assessment: {
            dueDate: { lt: now },
            status: { in: ['IN_PROGRESS', 'UNDER_REVIEW'] },
          },
        },
        skip,
        take,
        include: {
          assessment: {
            select: { id: true, assessmentRef: true, title: true, dueDate: true, status: true },
          },
          scopeItem: { select: { id: true, code: true, name: true } },
          assignedTester: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { assessment: { dueDate: 'asc' } },
      });

      const count = await prisma.assessmentTest.count({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          assessment: {
            dueDate: { lt: now },
            status: { in: ['IN_PROGRESS', 'UNDER_REVIEW'] },
          },
        },
      });

      const response: Record<string, unknown> = {
        overdueTests: overdueTests.map(t => ({
          ...t,
          daysOverdue: t.assessment.dueDate
            ? Math.floor((now.getTime() - t.assessment.dueDate.getTime()) / (1000 * 60 * 60 * 24))
            : null,
        })),
        total: count,
        skip,
        take,
      };
      if (count === 0) {
        response.note = 'No overdue tests found. All active assessments are on track.';
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
    'get_assessment_completion_summary',
    'Get detailed completion summary for a specific assessment: test counts by status and result, completion percentage, and overdue count.',
    {
      assessmentId: z.string().describe('Assessment UUID'),
    },
    withErrorHandling('get_assessment_completion_summary', async ({ assessmentId }) => {
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        select: { id: true, assessmentRef: true, title: true, status: true, dueDate: true, totalTests: true, completedTests: true, passedTests: true, failedTests: true },
      });

      if (!assessment) {
        return { content: [{ type: 'text' as const, text: `Assessment ${assessmentId} not found` }], isError: true };
      }

      const [byStatus, byResult] = await Promise.all([
        prisma.assessmentTest.groupBy({
          by: ['status'],
          where: { assessmentId },
          _count: true,
        }),
        prisma.assessmentTest.groupBy({
          by: ['result'],
          where: { assessmentId },
          _count: true,
        }),
      ]);

      const now = new Date();
      const overdueCount = assessment.dueDate && assessment.dueDate < now
        ? await prisma.assessmentTest.count({
            where: { assessmentId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
          })
        : 0;

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            assessment: {
              id: assessment.id,
              ref: assessment.assessmentRef,
              title: assessment.title,
              status: assessment.status,
              dueDate: assessment.dueDate,
            },
            byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
            byResult: Object.fromEntries(byResult.map(r => [r.result, r._count])),
            completionRate: assessment.totalTests > 0
              ? Math.round((assessment.completedTests / assessment.totalTests) * 100)
              : 0,
            overdueCount,
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_control_coverage_matrix',
    'Get each applicable control with its latest assessment test result and metric RAG status. Useful for a holistic control health view.',
    {
      organisationId: z.string().optional().describe('Organisation UUID (all orgs if omitted)'),
    },
    withErrorHandling('get_control_coverage_matrix', async ({ organisationId }) => {
      const where: Record<string, unknown> = { applicable: true, enabled: true };
      if (organisationId) where.organisationId = organisationId;

      const controls = await prisma.control.findMany({
        where,
        take: 1000,
        orderBy: { controlId: 'asc' },
        select: {
          id: true,
          controlId: true,
          name: true,
          theme: true,
          implementationStatus: true,
          metrics: {
            select: { id: true, metricId: true, name: true, status: true, trend: true },
            orderBy: { metricId: 'asc' },
          },
          assessmentControls: {
            select: {
              assessment: {
                select: {
                  id: true,
                  assessmentRef: true,
                  status: true,
                  tests: {
                    select: { result: true },
                    orderBy: { updatedAt: 'desc' },
                    take: 1,
                  },
                },
              },
            },
            orderBy: { assessment: { createdAt: 'desc' } },
            take: 1,
          },
        },
      });

      const matrix = controls.map(c => {
        const latestAssessment = c.assessmentControls[0]?.assessment;
        const latestTestResult = latestAssessment?.tests[0]?.result ?? null;
        const metricSummary = c.metrics.length > 0
          ? {
              total: c.metrics.length,
              green: c.metrics.filter(m => m.status === 'GREEN').length,
              amber: c.metrics.filter(m => m.status === 'AMBER').length,
              red: c.metrics.filter(m => m.status === 'RED').length,
            }
          : null;

        return {
          controlId: c.controlId,
          name: c.name,
          theme: c.theme,
          implementationStatus: c.implementationStatus,
          latestTestResult,
          latestAssessmentRef: latestAssessment?.assessmentRef ?? null,
          metricSummary,
        };
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ controls: matrix, total: matrix.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_tester_workload',
    'Get per-tester breakdown of assigned, pending, and completed tests across active assessments.',
    {},
    withErrorHandling('get_tester_workload', async () => {
      const tests = await prisma.assessmentTest.findMany({
        where: {
          assessment: { status: { in: ['IN_PROGRESS', 'UNDER_REVIEW'] } },
          assignedTesterId: { not: null },
        },
        take: 1000,
        select: {
          status: true,
          assignedTester: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      const workloadMap = new Map<string, { tester: { id: string; email: string; firstName: string | null; lastName: string | null }; pending: number; inProgress: number; completed: number; skipped: number; total: number }>();

      for (const t of tests) {
        if (!t.assignedTester) continue;
        const key = t.assignedTester.id;
        if (!workloadMap.has(key)) {
          workloadMap.set(key, { tester: t.assignedTester, pending: 0, inProgress: 0, completed: 0, skipped: 0, total: 0 });
        }
        const entry = workloadMap.get(key)!;
        entry.total++;
        if (t.status === 'PENDING') entry.pending++;
        else if (t.status === 'IN_PROGRESS') entry.inProgress++;
        else if (t.status === 'COMPLETED') entry.completed++;
        else if (t.status === 'SKIPPED') entry.skipped++;
      }

      const workload = Array.from(workloadMap.values()).sort((a, b) => b.total - a.total);

      const response: Record<string, unknown> = { testers: workload, totalTesters: workload.length };
      if (workload.length === 0) {
        response.note = 'No testers have assigned tests in active assessments.';
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
