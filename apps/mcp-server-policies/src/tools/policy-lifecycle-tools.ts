import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerPolicyLifecycleTools(server: McpServer) {
  server.tool(
    'list_document_versions',
    'List version history for a policy document.',
    {
      documentId: z.string().describe('PolicyDocument UUID'),
    },
    withErrorHandling('list_document_versions', async ({ documentId }) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id: documentId },
        select: { id: true, documentId: true, title: true },
      });
      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${documentId} not found` }], isError: true };
      }

      const versions = await prisma.documentVersion.findMany({
        where: { documentId },
        take: 1000,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          version: true,
          majorVersion: true,
          minorVersion: true,
          changeType: true,
          changeSummary: true,
          changeDescription: true,
          approvedBy: true,
          approvalDate: true,
          createdAt: true,
          createdBy: { select: { id: true, name: true } },
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ document: doc, versions, count: versions.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'list_document_reviews',
    'List review history for a policy document.',
    {
      documentId: z.string().describe('PolicyDocument UUID'),
    },
    withErrorHandling('list_document_reviews', async ({ documentId }) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id: documentId },
        select: { id: true, documentId: true, title: true },
      });
      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${documentId} not found` }], isError: true };
      }

      const reviews = await prisma.documentReview.findMany({
        where: { documentId },
        take: 1000,
        orderBy: { reviewDate: 'desc' },
        select: {
          id: true,
          reviewType: true,
          reviewDate: true,
          outcome: true,
          findings: true,
          recommendations: true,
          changesRequired: true,
          nextReviewDate: true,
          reviewedBy: { select: { id: true, name: true } },
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ document: doc, reviews, count: reviews.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'list_document_exceptions',
    'List exceptions for a policy document.',
    {
      documentId: z.string().describe('PolicyDocument UUID'),
      status: z.enum(['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'EXPIRED', 'REVOKED', 'CLOSED']).optional().describe('Filter by status'),
    },
    withErrorHandling('list_document_exceptions', async ({ documentId, status }) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id: documentId },
        select: { id: true, documentId: true, title: true },
      });
      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${documentId} not found` }], isError: true };
      }

      const where: Record<string, unknown> = { documentId };
      if (status) where.status = status;

      const exceptions = await prisma.documentException.findMany({
        where,
        take: 1000,
        orderBy: { requestedAt: 'desc' },
        select: {
          id: true,
          exceptionId: true,
          title: true,
          status: true,
          approvalLevel: true,
          startDate: true,
          expiryDate: true,
          residualRisk: true,
          requestedBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ document: doc, exceptions, count: exceptions.length }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_acknowledgment_status',
    'Get acknowledgment status for a policy document — who has and hasn\'t acknowledged it.',
    {
      documentId: z.string().describe('PolicyDocument UUID'),
    },
    withErrorHandling('get_acknowledgment_status', async ({ documentId }) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id: documentId },
        select: { id: true, documentId: true, title: true, requiresAcknowledgment: true, version: true },
      });
      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${documentId} not found` }], isError: true };
      }

      const acknowledgments = await prisma.documentAcknowledgment.findMany({
        where: { documentId, documentVersion: doc.version },
        take: 1000,
        select: {
          id: true,
          isAcknowledged: true,
          acknowledgedAt: true,
          method: true,
          dueDate: true,
          isOverdue: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });

      const acknowledged = acknowledgments.filter((a: typeof acknowledgments[number]) => a.isAcknowledged);
      const pending = acknowledgments.filter((a: typeof acknowledgments[number]) => !a.isAcknowledged);
      const overdue = pending.filter((a: typeof pending[number]) => a.isOverdue);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            document: doc,
            version: doc.version,
            totalAssigned: acknowledgments.length,
            acknowledgedCount: acknowledged.length,
            pendingCount: pending.length,
            overdueCount: overdue.length,
            completionRate: acknowledgments.length > 0
              ? Math.round((acknowledged.length / acknowledgments.length) * 100)
              : 0,
            overdue,
            pending: pending.filter((a: typeof pending[number]) => !a.isOverdue),
          }, null, 2),
        }],
      };
    }),
  );
}
