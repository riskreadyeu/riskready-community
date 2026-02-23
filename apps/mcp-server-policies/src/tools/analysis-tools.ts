import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerAnalysisTools(server: McpServer) {
  server.tool(
    'get_review_calendar',
    'Get upcoming policy review calendar — documents due for review in the next 90 days plus overdue reviews.',
    {},
    withErrorHandling('get_review_calendar', async () => {
      const now = new Date();
      const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const [overdue, upcoming] = await Promise.all([
        prisma.policyDocument.findMany({
          where: {
            nextReviewDate: { lt: now },
            status: { in: ['APPROVED', 'PUBLISHED'] },
          },
          take: 1000,
          select: {
            id: true,
            documentId: true,
            title: true,
            documentType: true,
            nextReviewDate: true,
            reviewFrequency: true,
            documentOwner: true,
            owner: { select: { id: true, name: true } },
          },
          orderBy: { nextReviewDate: 'asc' },
        }),
        prisma.policyDocument.findMany({
          where: {
            nextReviewDate: { gte: now, lte: ninetyDaysFromNow },
            status: { in: ['APPROVED', 'PUBLISHED'] },
          },
          take: 1000,
          select: {
            id: true,
            documentId: true,
            title: true,
            documentType: true,
            nextReviewDate: true,
            reviewFrequency: true,
            documentOwner: true,
            owner: { select: { id: true, name: true } },
          },
          orderBy: { nextReviewDate: 'asc' },
        }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            overdueCount: overdue.length,
            upcomingCount: upcoming.length,
            overdue,
            upcoming,
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_policy_compliance_matrix',
    'Get a compliance matrix showing policy coverage across controls — identifies gaps where controls lack policy coverage.',
    {},
    withErrorHandling('get_policy_compliance_matrix', async () => {
      const controls = await prisma.control.findMany({
        where: { applicable: true },
        take: 1000,
        select: {
          id: true,
          controlId: true,
          name: true,
          theme: true,
          implementationStatus: true,
          documentMappings: {
            select: {
              id: true,
              mappingType: true,
              coverage: true,
              document: {
                select: {
                  id: true,
                  documentId: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: { controlId: 'asc' },
      });

      const covered = controls.filter((c: typeof controls[number]) => c.documentMappings.length > 0);
      const uncovered = controls.filter((c: typeof controls[number]) => c.documentMappings.length === 0);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalControls: controls.length,
            coveredCount: covered.length,
            uncoveredCount: uncovered.length,
            coverageRate: controls.length > 0
              ? Math.round((covered.length / controls.length) * 100)
              : 0,
            uncoveredControls: uncovered.map((c: typeof controls[number]) => ({
              id: c.id,
              controlId: c.controlId,
              name: c.name,
              theme: c.theme,
            })),
            coveredControls: covered.map((c: typeof controls[number]) => ({
              id: c.id,
              controlId: c.controlId,
              name: c.name,
              theme: c.theme,
              policyCount: c.documentMappings.length,
              policies: c.documentMappings.map((m: typeof c.documentMappings[number]) => ({
                documentId: m.document.documentId,
                title: m.document.title,
                status: m.document.status,
                mappingType: m.mappingType,
                coverage: m.coverage,
              })),
            })),
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_exception_report',
    'Get a report on policy exceptions — active, expiring soon, and overdue for review.',
    {},
    withErrorHandling('get_exception_report', async () => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [active, expiringSoon, expired, byDocument] = await Promise.all([
        prisma.documentException.count({
          where: { status: { in: ['APPROVED', 'ACTIVE'] } },
        }),
        prisma.documentException.findMany({
          where: {
            status: { in: ['APPROVED', 'ACTIVE'] },
            expiryDate: { gte: now, lte: thirtyDaysFromNow },
          },
          take: 1000,
          select: {
            id: true,
            exceptionId: true,
            title: true,
            status: true,
            expiryDate: true,
            residualRisk: true,
            document: { select: { id: true, documentId: true, title: true } },
          },
          orderBy: { expiryDate: 'asc' },
        }),
        prisma.documentException.findMany({
          where: {
            status: { in: ['APPROVED', 'ACTIVE'] },
            expiryDate: { lt: now },
          },
          take: 1000,
          select: {
            id: true,
            exceptionId: true,
            title: true,
            status: true,
            expiryDate: true,
            residualRisk: true,
            document: { select: { id: true, documentId: true, title: true } },
          },
          orderBy: { expiryDate: 'asc' },
        }),
        prisma.documentException.groupBy({
          by: ['documentId'],
          where: { status: { in: ['APPROVED', 'ACTIVE'] } },
          _count: { _all: true },
        }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            activeExceptions: active,
            expiringSoonCount: expiringSoon.length,
            expiredCount: expired.length,
            documentsWithExceptions: byDocument.length,
            expiringSoon,
            expired,
          }, null, 2),
        }],
      };
    }),
  );
}
