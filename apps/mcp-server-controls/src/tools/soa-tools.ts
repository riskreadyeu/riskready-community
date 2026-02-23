import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerSOATools(server: McpServer) {
  server.tool(
    'list_soas',
    'List Statement of Applicability (SOA) versions with status, approval info, and entry counts.',
    {
      status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUPERSEDED']).optional().describe('Filter by SOA status'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(50).default(20).describe('Page size (max 50)'),
    },
    withErrorHandling('list_soas', async ({ status, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      const [results, count] = await Promise.all([
        prisma.statementOfApplicability.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
            updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
            approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
            _count: { select: { entries: true } },
          },
        }),
        prisma.statementOfApplicability.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, skip, take };
      if (count === 0) {
        response.note = 'No Statements of Applicability found.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_soa',
    'Get a full Statement of Applicability with all entries showing control applicability decisions and implementation status.',
    {
      id: z.string().describe('StatementOfApplicability UUID'),
    },
    withErrorHandling('get_soa', async ({ id }) => {
      const soa = await prisma.statementOfApplicability.findUnique({
        where: { id },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          entries: {
            orderBy: { controlId: 'asc' },
          },
          _count: { select: { entries: true } },
        },
      });

      if (!soa) {
        return { content: [{ type: 'text' as const, text: `SOA with ID ${id} not found` }], isError: true };
      }

      // Add summary stats
      const entries = soa.entries;
      const summary = {
        totalEntries: entries.length,
        applicable: entries.filter(e => e.applicable).length,
        notApplicable: entries.filter(e => !e.applicable).length,
        implemented: entries.filter(e => e.implementationStatus === 'IMPLEMENTED').length,
        partial: entries.filter(e => e.implementationStatus === 'PARTIAL').length,
        notStarted: entries.filter(e => e.implementationStatus === 'NOT_STARTED').length,
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ ...soa, summary }, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_soa_entry',
    'Get a single SOA entry with applicability decision, implementation status, and linked control details.',
    {
      id: z.string().describe('SOAEntry UUID'),
    },
    withErrorHandling('get_soa_entry', async ({ id }) => {
      const entry = await prisma.sOAEntry.findUnique({
        where: { id },
        include: {
          soa: { select: { id: true, version: true, status: true, name: true } },
          controlRecord: {
            select: {
              id: true,
              controlId: true,
              name: true,
              description: true,
              theme: true,
              framework: true,
              sourceStandard: true,
              soc2Criteria: true,
              tscCategory: true,
              applicable: true,
              justificationIfNa: true,
              implementationStatus: true,
              implementationDesc: true,
            },
          },
        },
      });

      if (!entry) {
        return { content: [{ type: 'text' as const, text: `SOA entry with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(entry, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_soa_stats',
    'Get aggregate SOA statistics: total SOAs, by status, and latest SOA entry summary.',
    {},
    withErrorHandling('get_soa_stats', async () => {
      const [total, byStatus, latest] = await Promise.all([
        prisma.statementOfApplicability.count(),
        prisma.statementOfApplicability.groupBy({ by: ['status'], _count: true }),
        prisma.statementOfApplicability.findFirst({
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { entries: true } },
            entries: {
              select: { applicable: true, implementationStatus: true },
            },
          },
        }),
      ]);

      let latestSummary = null;
      if (latest) {
        const entries = latest.entries;
        latestSummary = {
          id: latest.id,
          version: latest.version,
          status: latest.status,
          totalEntries: entries.length,
          applicable: entries.filter(e => e.applicable).length,
          notApplicable: entries.filter(e => !e.applicable).length,
          implemented: entries.filter(e => e.implementationStatus === 'IMPLEMENTED').length,
          partial: entries.filter(e => e.implementationStatus === 'PARTIAL').length,
          notStarted: entries.filter(e => e.implementationStatus === 'NOT_STARTED').length,
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalSOAs: total,
            byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
            latestSOA: latestSummary,
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_latest_soa',
    'Get the most recent Statement of Applicability with full entries and summary statistics.',
    {
      organisationId: z.string().optional().describe('Organisation UUID (uses most recent SOA if omitted)'),
    },
    withErrorHandling('get_latest_soa', async ({ organisationId }) => {
      const where: Record<string, unknown> = {};
      if (organisationId) where.organisationId = organisationId;

      const soa = await prisma.statementOfApplicability.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          entries: {
            orderBy: { controlId: 'asc' },
          },
          _count: { select: { entries: true } },
        },
      });

      if (!soa) {
        return { content: [{ type: 'text' as const, text: 'No Statement of Applicability found' }], isError: true };
      }

      const entries = soa.entries;
      const summary = {
        totalEntries: entries.length,
        applicable: entries.filter(e => e.applicable).length,
        notApplicable: entries.filter(e => !e.applicable).length,
        implemented: entries.filter(e => e.implementationStatus === 'IMPLEMENTED').length,
        partial: entries.filter(e => e.implementationStatus === 'PARTIAL').length,
        notStarted: entries.filter(e => e.implementationStatus === 'NOT_STARTED').length,
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ ...soa, summary }, null, 2) }],
      };
    }),
  );
}
