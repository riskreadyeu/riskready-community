import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerPolicyMappingTools(server: McpServer) {
  server.tool(
    'get_policy_control_mappings',
    'Get control mappings for a policy document — shows which ISO 27001 controls the policy implements or supports.',
    {
      documentId: z.string().describe('PolicyDocument UUID'),
    },
    withErrorHandling('get_policy_control_mappings', async ({ documentId }) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id: documentId },
        select: { id: true, documentId: true, title: true },
      });
      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${documentId} not found` }], isError: true };
      }

      const mappings = await prisma.documentControlMapping.findMany({
        where: { documentId },
        take: 1000,
        select: {
          id: true,
          mappingType: true,
          coverage: true,
          notes: true,
          evidenceRequired: true,
          evidenceDescription: true,
          control: {
            select: {
              id: true,
              controlId: true,
              name: true,
              theme: true,
              implementationStatus: true,
            },
          },
        },
        orderBy: { control: { controlId: 'asc' } },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ document: doc, mappings, count: mappings.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_policy_risk_mappings',
    'Get risk mappings for a policy document — shows which risks the policy mitigates or addresses.',
    {
      documentId: z.string().describe('PolicyDocument UUID'),
    },
    withErrorHandling('get_policy_risk_mappings', async ({ documentId }) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id: documentId },
        select: { id: true, documentId: true, title: true },
      });
      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${documentId} not found` }], isError: true };
      }

      const mappings = await prisma.documentRiskMapping.findMany({
        where: { documentId },
        take: 1000,
        select: {
          id: true,
          relationshipType: true,
          notes: true,
          risk: {
            select: {
              id: true,
              riskId: true,
              title: true,
              category: true,
              status: true,
            },
          },
        },
        orderBy: { risk: { riskId: 'asc' } },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ document: doc, mappings, count: mappings.length }, null, 2),
        }],
      };
    }),
  );
}
