import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling, userSelectSafe } from '#mcp-shared';

export function registerPolicyTools(server: McpServer) {
  server.tool(
    'list_policy_documents',
    'List policy documents with optional filters. Returns document details with pagination. If not found, returns a not-found message. Do not invent or assume values.',
    {
      status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'UNDER_REVISION', 'SUPERSEDED', 'RETIRED', 'ARCHIVED']).optional().describe('Filter by document status'),
      documentType: z.enum(['POLICY', 'STANDARD', 'PROCEDURE', 'WORK_INSTRUCTION', 'FORM', 'TEMPLATE', 'CHECKLIST', 'GUIDELINE', 'RECORD']).optional().describe('Filter by document type'),
      classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional().describe('Filter by classification'),
      organisationId: z.string().describe('Organisation UUID (injected by gateway)'),
      skip: z.number().int().min(0).default(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).optional().describe('Page size (max 200)'),
    },
    withErrorHandling('list_policy_documents', async (params) => {
      const where: Record<string, unknown> = {};
      if (params.organisationId) where.organisationId = params.organisationId;
      if (params.status) where.status = params.status;
      if (params.documentType) where.documentType = params.documentType;
      if (params.classification) where.classification = params.classification;

      const [documents, total] = await Promise.all([
        prisma.policyDocument.findMany({
          where,
          skip: params.skip || 0,
          take: params.take || 50,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            documentId: true,
            title: true,
            documentType: true,
            status: true,
            classification: true,
            version: true,
            effectiveDate: true,
            expiryDate: true,
            nextReviewDate: true,
            reviewFrequency: true,
            approvalLevel: true,
            documentOwner: true,
            owner: { select: { id: true, firstName: true, lastName: true } },
            organisationId: true,
            _count: {
              select: {
                controlMappings: true,
                riskMappings: true,
                exceptions: true,
                changeRequests: true,
              },
            },
          },
        }),
        prisma.policyDocument.count({ where }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ documents, total, skip: params.skip || 0, take: params.take || 50 }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_policy_document',
    'Get a single policy document with full details. If not found, returns a not-found message. Do not invent or assume values.',
    {
      id: z.string().describe('PolicyDocument UUID'),
    },
    withErrorHandling('get_policy_document', async ({ id }) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id },
        include: {
          owner: { select: userSelectSafe },
          authorUser: { select: { id: true, firstName: true, lastName: true } },
          approver: { select: { id: true, firstName: true, lastName: true } },
          parentDocument: { select: { id: true, documentId: true, title: true } },
          _count: {
            select: {
              childDocuments: true,
              versionHistory: true,
              reviewHistory: true,
              controlMappings: true,
              riskMappings: true,
              exceptions: true,
              changeRequests: true,
              acknowledgments: true,
              sections: true,
            },
          },
        },
      });

      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${id} not found` }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(doc, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'search_policy_documents',
    'Search policy documents by document ID, title, or purpose. If not found, returns a not-found message. Do not invent or assume values.',
    {
      query: z.string().max(200).describe('Search term'),
      organisationId: z.string().describe('Organisation UUID (injected by gateway)'),
    },
    withErrorHandling('search_policy_documents', async ({ query, organisationId }) => {
      const documents = await prisma.policyDocument.findMany({
        where: {
          ...(organisationId && { organisationId }),
          OR: [
            { documentId: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } },
            { purpose: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          documentId: true,
          title: true,
          documentType: true,
          status: true,
          version: true,
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ documents, count: documents.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_policy_stats',
    'Get aggregate policy statistics: total count, by status, by type, review status, exception counts. If not found, returns a not-found message. Do not invent or assume values.',
    {},
    withErrorHandling('get_policy_stats', async () => {
      const now = new Date();

      const [total, byStatus, byType, overdueReviews, activeExceptions] = await Promise.all([
        prisma.policyDocument.count(),
        prisma.policyDocument.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.policyDocument.groupBy({ by: ['documentType'], _count: { _all: true } }),
        prisma.policyDocument.count({
          where: {
            nextReviewDate: { lt: now },
            status: { in: ['APPROVED', 'PUBLISHED'] },
          },
        }),
        prisma.documentException.count({
          where: { status: { in: ['APPROVED', 'ACTIVE'] } },
        }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            total,
            overdueReviews,
            activeExceptions,
            byStatus: Object.fromEntries(byStatus.map((s: typeof byStatus[number]) => [s.status, s._count._all])),
            byType: Object.fromEntries(byType.map((s: typeof byType[number]) => [s.documentType, s._count._all])),
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_policy_hierarchy',
    'Get the policy document hierarchy showing parent-child relationships. If not found, returns a not-found message. Do not invent or assume values.',
    {},
    withErrorHandling('get_policy_hierarchy', async () => {
      const documents = await prisma.policyDocument.findMany({
        where: { parentDocumentId: null },
        select: {
          id: true,
          documentId: true,
          title: true,
          documentType: true,
          status: true,
          childDocuments: {
            select: {
              id: true,
              documentId: true,
              title: true,
              documentType: true,
              status: true,
              childDocuments: {
                select: {
                  id: true,
                  documentId: true,
                  title: true,
                  documentType: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: { documentId: 'asc' },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ hierarchy: documents, topLevelCount: documents.length }, null, 2),
        }],
      };
    }),
  );
}
