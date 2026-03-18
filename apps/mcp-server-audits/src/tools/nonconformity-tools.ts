import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling, userSelectSafe } from '#mcp-shared';

export function registerNonconformityTools(server: McpServer) {
  server.tool(
    'list_nonconformities',
    'List nonconformities with optional filters for status, severity, source, and CAP status. Returns paginated results with count. If not found, returns a not-found message. Do not invent or assume values.',
    {
      status: z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'VERIFIED_EFFECTIVE', 'VERIFIED_INEFFECTIVE', 'CLOSED', 'REJECTED']).optional().describe('Filter by NC status'),
      severity: z.enum(['MAJOR', 'MINOR', 'OBSERVATION']).optional().describe('Filter by severity'),
      source: z.enum(['TEST', 'INTERNAL_AUDIT', 'EXTERNAL_AUDIT', 'CERTIFICATION_AUDIT', 'INCIDENT', 'SELF_ASSESSMENT', 'MANAGEMENT_REVIEW', 'SURVEILLANCE_AUDIT', 'ISRA_GAP']).optional().describe('Filter by nonconformity source'),
      capStatus: z.enum(['NOT_REQUIRED', 'NOT_DEFINED', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED']).optional().describe('Filter by CAP status'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_nonconformities', async ({ status, severity, source, capStatus, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (status) where['status'] = status;
      if (severity) where['severity'] = severity;
      if (source) where['source'] = source;
      if (capStatus) where['capStatus'] = capStatus;

      const [results, count] = await Promise.all([
        prisma.nonconformity.findMany({
          where,
          skip,
          take,
          orderBy: { dateRaised: 'desc' },
          select: {
            id: true,
            ncId: true,
            title: true,
            dateRaised: true,
            source: true,
            severity: true,
            category: true,
            status: true,
            capStatus: true,
            targetClosureDate: true,
            isoClause: true,
            control: { select: { id: true, controlId: true, name: true } },
            responsibleUser: { select: userSelectSafe },
          },
        }),
        prisma.nonconformity.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, skip, take };
      if (count === 0) {
        response['note'] ='No nonconformities found matching the specified filters.';
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
    'get_nonconformity',
    'Get a single nonconformity with full details including CAP fields, verification fields, related control, responsible user, raised by, and closed by. If not found, returns a not-found message. Do not invent or assume values.',
    {
      id: z.string().describe('Nonconformity UUID'),
    },
    withErrorHandling('get_nonconformity', async ({ id }) => {
      const nc = await prisma.nonconformity.findUnique({
        where: { id },
        include: {
          control: { select: { id: true, controlId: true, name: true, theme: true, implementationStatus: true } },
          responsibleUser: { select: userSelectSafe },
          raisedBy: { select: userSelectSafe },
          closedBy: { select: userSelectSafe },
          verifiedBy: { select: userSelectSafe },
          capDraftedBy: { select: userSelectSafe },
          capApprovedBy: { select: userSelectSafe },
          capRejectedBy: { select: userSelectSafe },
        },
      });

      if (!nc) {
        return { content: [{ type: 'text' as const, text: `Nonconformity with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(nc, null, 2) }],
      };
    }),
  );

  server.tool(
    'search_nonconformities',
    'Search nonconformities by query matching against ncId, title, and description. Returns basic fields. If not found, returns a not-found message. Do not invent or assume values.',
    {
      query: z.string().max(200).describe('Search term (matches against ncId, title, description)'),
    },
    withErrorHandling('search_nonconformities', async ({ query }) => {
      const results = await prisma.nonconformity.findMany({
        where: {
          OR: [
            { ncId: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 50,
        orderBy: { dateRaised: 'desc' },
        select: {
          id: true,
          ncId: true,
          title: true,
          dateRaised: true,
          source: true,
          severity: true,
          category: true,
          status: true,
          capStatus: true,
          targetClosureDate: true,
          isoClause: true,
        },
      });

      const response: Record<string, unknown> = { results, count: results.length };
      if (results.length === 0) {
        response['note'] =`No nonconformities matched the search query '${query}'.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_nc_stats',
    'Get aggregate nonconformity statistics: count by status, severity, CAP status, source. Total open and overdue counts. If not found, returns a not-found message. Do not invent or assume values.',
    {},
    withErrorHandling('get_nc_stats', async () => {
      const now = new Date();

      const [
        total,
        byStatus,
        bySeverity,
        byCapStatus,
        bySource,
        openCount,
        overdueCount,
      ] = await Promise.all([
        prisma.nonconformity.count(),
        prisma.nonconformity.groupBy({ by: ['status'], _count: true }),
        prisma.nonconformity.groupBy({ by: ['severity'], _count: true }),
        prisma.nonconformity.groupBy({ by: ['capStatus'], _count: true }),
        prisma.nonconformity.groupBy({ by: ['source'], _count: true }),
        prisma.nonconformity.count({
          where: { status: { in: ['OPEN', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'DRAFT'] } },
        }),
        prisma.nonconformity.count({
          where: {
            targetClosureDate: { lt: now },
            status: { notIn: ['CLOSED', 'REJECTED', 'VERIFIED_EFFECTIVE'] },
          },
        }),
      ]);

      const stats = {
        total,
        open: openCount,
        overdue: overdueCount,
        byStatus: Object.fromEntries(byStatus.map((s: { status: string; _count: number }) => [s.status, s._count])),
        bySeverity: Object.fromEntries(bySeverity.map((s: { severity: string; _count: number }) => [s.severity, s._count])),
        byCapStatus: Object.fromEntries(byCapStatus.map((s: { capStatus: string; _count: number }) => [s.capStatus, s._count])),
        bySource: Object.fromEntries(bySource.map((s: { source: string; _count: number }) => [s.source, s._count])),
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(stats, null, 2) }],
      };
    }),
  );
}
