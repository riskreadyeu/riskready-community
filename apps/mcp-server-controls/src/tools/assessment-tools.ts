import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { userSelectSafe, withErrorHandling } from '#mcp-shared';

export function registerAssessmentTools(server: McpServer) {
  server.tool(
    'list_assessments',
    'List control assessments with optional status filter. Returns assessment ref, title, status, dates, and test statistics.',
    {
      status: z.enum(['DRAFT', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED']).optional().describe('Filter by assessment status'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_assessments', async ({ status, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      const [results, count] = await Promise.all([
        prisma.assessment.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            leadTester: { select: userSelectSafe },
            reviewer: { select: userSelectSafe },
            _count: { select: { controls: true, tests: true, scopeItems: true } },
          },
        }),
        prisma.assessment.count({ where }),
      ]);

      const formatted = results.map(a => ({
        ...a,
        testStats: {
          total: a.totalTests,
          completed: a.completedTests,
          passed: a.passedTests,
          failed: a.failedTests,
          completionRate: a.totalTests > 0 ? Math.round((a.completedTests / a.totalTests) * 100) : 0,
        },
      }));

      const response: Record<string, unknown> = { results: formatted, total: count, skip, take };
      if (count === 0) {
        response.note = 'No assessments found matching the specified filters.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_assessment',
    'Get a single assessment with full details: controls in scope, scope items, test statistics, team, and dates.',
    {
      id: z.string().describe('Assessment UUID'),
    },
    withErrorHandling('get_assessment', async ({ id }) => {
      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          controls: {
            include: { control: { select: { id: true, controlId: true, name: true, theme: true, framework: true, implementationStatus: true } } },
          },
          scopeItems: {
            include: { scopeItem: { select: { id: true, code: true, name: true, description: true, scopeType: true, criticality: true, isActive: true } } },
          },
          tests: {
            select: { id: true, testCode: true, testName: true, status: true, result: true },
            orderBy: { testCode: 'asc' },
          },
          leadTester: { select: userSelectSafe },
          reviewer: { select: userSelectSafe },
          createdBy: { select: userSelectSafe },
        },
      });

      if (!assessment) {
        return { content: [{ type: 'text' as const, text: `Assessment with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(assessment, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_assessment_tests',
    'Get tests within an assessment with optional status/result filters. Returns test details with latest execution results.',
    {
      assessmentId: z.string().describe('Assessment UUID'),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']).optional().describe('Filter by test status'),
      result: z.enum(['PASS', 'PARTIAL', 'FAIL', 'NOT_TESTED', 'NOT_APPLICABLE']).optional().describe('Filter by test result'),
    },
    withErrorHandling('get_assessment_tests', async ({ assessmentId, status, result }) => {
      const where: Record<string, unknown> = { assessmentId };
      if (status) where.status = status;
      if (result) where.result = result;

      const tests = await prisma.assessmentTest.findMany({
        where,
        take: 1000,
        select: {
          id: true,
          testCode: true,
          testName: true,
          status: true,
          result: true,
          testMethod: true,
          findings: true,
          recommendations: true,
          rootCause: true,
          rootCauseNotes: true,
          remediationEffort: true,
          estimatedHours: true,
          estimatedCost: true,
          skipJustification: true,
          createdAt: true,
          updatedAt: true,
          scopeItem: { select: { id: true, code: true, name: true, scopeType: true, criticality: true } },
          assignedTester: { select: userSelectSafe },
          owner: { select: userSelectSafe },
          assessor: { select: userSelectSafe },
          _count: { select: { executions: true } },
        },
        orderBy: [{ testCode: 'asc' }],
      });

      const response: Record<string, unknown> = { tests, count: tests.length };
      if (tests.length === 0) {
        response.note = 'No tests found for this assessment with the specified filters.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_assessment_stats',
    'Get aggregate assessment statistics: total assessments, by status, completion rates, and test result distribution.',
    {},
    withErrorHandling('get_assessment_stats', async () => {
      const [total, byStatus, assessments] = await Promise.all([
        prisma.assessment.count(),
        prisma.assessment.groupBy({ by: ['status'], _count: true }),
        prisma.assessment.findMany({
          take: 1000,
          select: { totalTests: true, completedTests: true, passedTests: true, failedTests: true },
        }),
      ]);

      const totalTests = assessments.reduce((sum, a) => sum + a.totalTests, 0);
      const completedTests = assessments.reduce((sum, a) => sum + a.completedTests, 0);
      const passedTests = assessments.reduce((sum, a) => sum + a.passedTests, 0);
      const failedTests = assessments.reduce((sum, a) => sum + a.failedTests, 0);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalAssessments: total,
            byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
            testResults: {
              total: totalTests,
              completed: completedTests,
              passed: passedTests,
              failed: failedTests,
              completionRate: totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0,
            },
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_my_tests',
    'Get tests assigned to a specific tester. Useful for workload view and personal test queue.',
    {
      testerId: z.string().describe('User UUID of the tester'),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']).optional().describe('Filter by test status'),
    },
    withErrorHandling('get_my_tests', async ({ testerId, status }) => {
      const where: Record<string, unknown> = {
        OR: [
          { assignedTesterId: testerId },
          { ownerId: testerId },
          { assessorId: testerId },
        ],
        assessment: { status: { in: ['IN_PROGRESS', 'UNDER_REVIEW'] } },
      };
      if (status) where.status = status;

      const tests = await prisma.assessmentTest.findMany({
        where,
        take: 1000,
        include: {
          assessment: { select: { id: true, assessmentRef: true, title: true, status: true } },
          scopeItem: { select: { id: true, code: true, name: true, criticality: true } },
          assignedTester: { select: userSelectSafe },
          owner: { select: userSelectSafe },
          _count: { select: { executions: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      });

      const response: Record<string, unknown> = { tests, count: tests.length };
      if (tests.length === 0) {
        response.note = 'No tests assigned to this tester in active assessments.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_my_tests_count',
    'Get per-status test counts for a specific tester across active assessments. Lightweight alternative to get_my_tests.',
    {
      testerId: z.string().describe('User UUID of the tester'),
    },
    withErrorHandling('get_my_tests_count', async ({ testerId }) => {
      const counts = await prisma.assessmentTest.groupBy({
        by: ['status'],
        where: {
          OR: [
            { assignedTesterId: testerId },
            { ownerId: testerId },
            { assessorId: testerId },
          ],
          assessment: { status: { in: ['IN_PROGRESS', 'UNDER_REVIEW'] } },
        },
        _count: true,
      });

      const total = counts.reduce((sum, c) => sum + c._count, 0);

      const response: Record<string, unknown> = {
        testerId,
        byStatus: Object.fromEntries(counts.map(c => [c.status, c._count])),
        total,
      };
      if (total === 0) {
        response.note = 'No tests assigned to this tester in active assessments.';
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
