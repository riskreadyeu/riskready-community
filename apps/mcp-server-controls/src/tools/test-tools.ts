import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerTestTools(server: McpServer) {
  server.tool(
    'get_test',
    'Get a full test definition (AssessmentTest) with procedure, evidence requirements, and execution history.',
    {
      id: z.string().describe('AssessmentTest UUID'),
    },
    withErrorHandling('get_test', async ({ id }) => {
      const test = await prisma.assessmentTest.findUnique({
        where: { id },
        include: {
          assessment: { select: { id: true, assessmentRef: true, title: true, status: true } },
          scopeItem: { select: { id: true, code: true, name: true, description: true, scopeType: true, criticality: true } },
          assignedTester: { select: { id: true, email: true, firstName: true, lastName: true } },
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
          assessor: { select: { id: true, email: true, firstName: true, lastName: true } },
          executions: {
            orderBy: { executionDate: 'desc' },
            take: 10,
            select: {
              id: true,
              executionDate: true,
              result: true,
              findings: true,
              recommendations: true,
              evidenceLocation: true,
              evidenceNotes: true,
              evidenceFileIds: true,
              durationMinutes: true,
              samplesReviewed: true,
              periodStart: true,
              periodEnd: true,
              createdAt: true,
              tester: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
          },
        },
      });
      // Note: get_test uses include (returns all scalar fields) so findings, recommendations,
      // testMethod, rootCause, rootCauseNotes, remediationEffort, estimatedHours, estimatedCost,
      // skipJustification are all included automatically.

      if (!test) {
        return { content: [{ type: 'text' as const, text: `Assessment test with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(test, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_test_executions',
    'Get execution history for an assessment test instance. Returns all past executions with results, findings, and evidence.',
    {
      assessmentTestId: z.string().describe('AssessmentTest UUID'),
    },
    withErrorHandling('get_test_executions', async ({ assessmentTestId }) => {
      const executions = await prisma.assessmentExecution.findMany({
        where: { assessmentTestId },
        orderBy: { executionDate: 'desc' },
        select: {
          id: true,
          executionDate: true,
          result: true,
          findings: true,
          recommendations: true,
          evidenceLocation: true,
          evidenceNotes: true,
          evidenceFileIds: true,
          durationMinutes: true,
          samplesReviewed: true,
          periodStart: true,
          periodEnd: true,
          createdAt: true,
          tester: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      const response: Record<string, unknown> = { executions, count: executions.length };
      if (executions.length === 0) {
        response.note = 'No execution history found for this test.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'list_test_templates',
    'Browse test templates. In the Community Edition, this returns assessment tests grouped by test code pattern as templates.',
    {
      layer: z.enum(['GOVERNANCE', 'PLATFORM', 'CONSUMPTION', 'OVERSIGHT']).optional().describe('Filter by layer type prefix (GOV-, PLAT-, CON-, OVS-)'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_test_templates', async ({ layer, skip, take }) => {
      // In community edition, there are no LayerTest templates.
      // Instead, return distinct testCode/testName combinations from AssessmentTest as "templates".
      const prefixMap: Record<string, string> = {
        GOVERNANCE: 'GOV-',
        PLATFORM: 'PLAT-',
        CONSUMPTION: 'CON-',
        OVERSIGHT: 'OVS-',
      };

      const where: Record<string, unknown> = {};
      if (layer && prefixMap[layer]) {
        where.testCode = { startsWith: prefixMap[layer] };
      }

      const templates = await prisma.assessmentTest.findMany({
        where,
        distinct: ['testCode'],
        select: {
          testCode: true,
          testName: true,
        },
        skip,
        take,
        orderBy: { testCode: 'asc' },
      });

      const response: Record<string, unknown> = {
        templates: templates.map(t => ({
          testCode: t.testCode,
          testName: t.testName,
          note: 'Community Edition: templates derived from existing assessment tests',
        })),
        count: templates.length,
        skip,
        take,
      };
      if (templates.length === 0) {
        response.note = 'No test templates found.';
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
