import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling, userSelectSafe } from '#mcp-shared';

export function registerEvidenceTools(server: McpServer) {
  server.tool(
    'list_evidence',
    'List evidence records with optional filters. Returns evidence details with pagination.',
    {
      status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED']).optional().describe('Filter by evidence status'),
      evidenceType: z.enum(['DOCUMENT', 'CERTIFICATE', 'REPORT', 'POLICY', 'PROCEDURE', 'SCREENSHOT', 'LOG', 'CONFIGURATION', 'NETWORK_CAPTURE', 'MEMORY_DUMP', 'DISK_IMAGE', 'MALWARE_SAMPLE', 'EMAIL', 'MEETING_NOTES', 'APPROVAL_RECORD', 'AUDIT_REPORT', 'ASSESSMENT_RESULT', 'TEST_RESULT', 'SCAN_RESULT', 'VIDEO', 'AUDIO', 'OTHER']).optional().describe('Filter by evidence type'),
      classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional().describe('Filter by classification'),
      category: z.string().optional().describe('Filter by category'),
      organisationId: z.string().optional().describe('Organisation UUID'),
      skip: z.number().int().min(0).default(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).optional().describe('Page size (max 200)'),
    },
    withErrorHandling('list_evidence', async (params) => {
      const where: Record<string, unknown> = {};
      if (params.organisationId) where.organisationId = params.organisationId;
      if (params.status) where.status = params.status;
      if (params.evidenceType) where.evidenceType = params.evidenceType;
      if (params.classification) where.classification = params.classification;
      if (params.category) where.category = params.category;

      const [evidence, total] = await Promise.all([
        prisma.evidence.findMany({
          where,
          skip: params.skip || 0,
          take: params.take || 50,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            evidenceRef: true,
            title: true,
            evidenceType: true,
            status: true,
            classification: true,
            category: true,
            fileName: true,
            validFrom: true,
            validUntil: true,
            collectedAt: true,
            version: true,
            collectedBy: { select: { id: true, firstName: true, lastName: true } },
            _count: {
              select: {
                controlLinks: true,
                riskLinks: true,
                incidentLinks: true,
                assetLinks: true,
                policyLinks: true,
              },
            },
          },
        }),
        prisma.evidence.count({ where }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ evidence, total, skip: params.skip || 0, take: params.take || 50 }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_evidence',
    'Get a single evidence record with full details including all link counts and review/approval information.',
    {
      id: z.string().describe('Evidence UUID'),
    },
    withErrorHandling('get_evidence', async ({ id }) => {
      const evidence = await prisma.evidence.findUnique({
        where: { id },
        include: {
          collectedBy: { select: userSelectSafe },
          reviewedBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
          rejectedBy: { select: { id: true, firstName: true, lastName: true } },
          _count: {
            select: {
              controlLinks: true,
              nonconformityLinks: true,
              incidentLinks: true,
              riskLinks: true,
              treatmentLinks: true,
              policyLinks: true,
              assetLinks: true,
              changeLinks: true,
              requestFulfillments: true,
            },
          },
        },
      });

      if (!evidence) {
        return { content: [{ type: 'text' as const, text: `Evidence ${id} not found` }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(evidence, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'search_evidence',
    'Search evidence by reference, title, or description.',
    {
      query: z.string().max(200).describe('Search term (matches against evidenceRef, title, description)'),
      organisationId: z.string().optional().describe('Organisation UUID'),
    },
    withErrorHandling('search_evidence', async ({ query, organisationId }) => {
      const evidence = await prisma.evidence.findMany({
        where: {
          ...(organisationId && { organisationId }),
          OR: [
            { evidenceRef: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          evidenceRef: true,
          title: true,
          evidenceType: true,
          status: true,
          classification: true,
          validUntil: true,
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ evidence, count: evidence.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_evidence_stats',
    'Get aggregate evidence statistics: total count, by status, by type, by classification, expiring soon.',
    {},
    withErrorHandling('get_evidence_stats', async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const [total, byStatus, byType, byClassification, expiringSoon] = await Promise.all([
        prisma.evidence.count(),
        prisma.evidence.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.evidence.groupBy({ by: ['evidenceType'], _count: { _all: true } }),
        prisma.evidence.groupBy({ by: ['classification'], _count: { _all: true } }),
        prisma.evidence.count({
          where: {
            validUntil: { lte: thirtyDaysFromNow, gte: new Date() },
            status: { notIn: ['EXPIRED', 'ARCHIVED'] },
          },
        }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            total,
            expiringSoon,
            byStatus: Object.fromEntries(byStatus.map((s: typeof byStatus[number]) => [s.status, s._count._all])),
            byType: Object.fromEntries(byType.map((s: typeof byType[number]) => [s.evidenceType, s._count._all])),
            byClassification: Object.fromEntries(byClassification.map((s: typeof byClassification[number]) => [s.classification, s._count._all])),
          }, null, 2),
        }],
      };
    }),
  );
}
