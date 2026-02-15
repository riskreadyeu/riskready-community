import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerReferenceTools(server: McpServer) {
  server.tool(
    'list_regulators',
    'List regulators with optional filters.',
    {
      isActive: z.boolean().optional().describe('Filter by active status'),
      regulatorType: z.string().optional().describe('Filter by regulator type'),
      jurisdiction: z.string().optional().describe('Filter by jurisdiction'),
    },
    withErrorHandling('list_regulators', async (params) => {
      const where: Record<string, unknown> = {};
      if (params.isActive !== undefined) where.isActive = params.isActive;
      if (params.regulatorType) where.regulatorType = params.regulatorType;
      if (params.jurisdiction) where.jurisdiction = params.jurisdiction;

      const regulators = await prisma.regulator.findMany({
        where,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          acronym: true,
          regulatorType: true,
          jurisdiction: true,
          jurisdictionLevel: true,
          registrationStatus: true,
          registrationNumber: true,
          lastInspectionDate: true,
          nextInspectionDate: true,
          isActive: true,
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ regulators, count: regulators.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'list_applicable_frameworks',
    'List applicable regulatory and compliance frameworks.',
    {
      isApplicable: z.boolean().optional().describe('Filter by applicability'),
      frameworkType: z.string().optional().describe('Filter by framework type'),
      complianceStatus: z.string().optional().describe('Filter by compliance status'),
    },
    withErrorHandling('list_applicable_frameworks', async (params) => {
      const where: Record<string, unknown> = {};
      if (params.isApplicable !== undefined) where.isApplicable = params.isApplicable;
      if (params.frameworkType) where.frameworkType = params.frameworkType;
      if (params.complianceStatus) where.complianceStatus = params.complianceStatus;

      const frameworks = await prisma.applicableFramework.findMany({
        where,
        orderBy: { frameworkCode: 'asc' },
        select: {
          id: true,
          frameworkCode: true,
          name: true,
          frameworkType: true,
          isApplicable: true,
          complianceStatus: true,
          compliancePercentage: true,
          lastAssessmentDate: true,
          nextAssessmentDate: true,
          isCertifiable: true,
          certificationStatus: true,
          certificationExpiry: true,
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ frameworks, count: frameworks.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'list_context_issues',
    'List context issues (ISO 27001 Clause 4.1) — internal and external issues affecting the ISMS.',
    {
      issueType: z.string().optional().describe('Filter by issue type (e.g. "internal", "external")'),
      category: z.string().optional().describe('Filter by category'),
      status: z.string().optional().describe('Filter by status'),
    },
    withErrorHandling('list_context_issues', async (params) => {
      const where: Record<string, unknown> = {};
      if (params.issueType) where.issueType = params.issueType;
      if (params.category) where.category = params.category;
      if (params.status) where.status = params.status;

      const issues = await prisma.contextIssue.findMany({
        where,
        orderBy: { issueCode: 'asc' },
        select: {
          id: true,
          issueCode: true,
          issueType: true,
          category: true,
          title: true,
          description: true,
          impactLevel: true,
          likelihood: true,
          ismsRelevance: true,
          responseStrategy: true,
          trendDirection: true,
          status: true,
          escalatedToRisk: true,
          lastReviewDate: true,
          nextReviewDate: true,
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ issues, count: issues.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'list_interested_parties',
    'List interested parties (ISO 27001 Clause 4.2) — stakeholders and their requirements.',
    {
      partyType: z.string().optional().describe('Filter by party type'),
      isActive: z.boolean().optional().describe('Filter by active status'),
    },
    withErrorHandling('list_interested_parties', async (params) => {
      const where: Record<string, unknown> = {};
      if (params.partyType) where.partyType = params.partyType;
      if (params.isActive !== undefined) where.isActive = params.isActive;

      const parties = await prisma.interestedParty.findMany({
        where,
        orderBy: { partyCode: 'asc' },
        select: {
          id: true,
          partyCode: true,
          name: true,
          partyType: true,
          description: true,
          expectations: true,
          requirements: true,
          powerLevel: true,
          interestLevel: true,
          engagementStrategy: true,
          ismsRelevance: true,
          isActive: true,
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ parties, count: parties.length }, null, 2),
        }],
      };
    }),
  );
}
