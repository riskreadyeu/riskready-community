import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerChangeTools(server: McpServer) {
  server.tool(
    'list_changes',
    'List change requests with optional filters. Returns change ref, title, type, status, priority, and security impact.',
    {
      status: z.enum([
        'DRAFTED', 'SUBMITTED', 'PENDING_APPROVAL', 'NEEDS_INFO', 'APPROVED', 'REJECTED',
        'SCHEDULED', 'IMPLEMENTING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK',
        'CANCELLED', 'REVIEWED',
      ]).optional().describe('Filter by change status'),
      changeType: z.enum(['STANDARD', 'NORMAL', 'EMERGENCY']).optional().describe('Filter by change type'),
      category: z.enum([
        'ACCESS_CONTROL', 'CONFIGURATION', 'INFRASTRUCTURE', 'APPLICATION', 'DATABASE',
        'SECURITY', 'NETWORK', 'BACKUP_DR', 'MONITORING', 'VENDOR', 'DOCUMENTATION', 'OTHER',
      ]).optional().describe('Filter by change category'),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Filter by priority'),
      securityImpact: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).optional().describe('Filter by security impact level'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_changes', async ({ status, changeType, category, priority, securityImpact, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (changeType) where.changeType = changeType;
      if (category) where.category = category;
      if (priority) where.priority = priority;
      if (securityImpact) where.securityImpact = securityImpact;

      const [results, count] = await Promise.all([
        prisma.change.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            changeRef: true,
            title: true,
            description: true,
            changeType: true,
            category: true,
            priority: true,
            securityImpact: true,
            status: true,
            plannedStart: true,
            plannedEnd: true,
            actualStart: true,
            actualEnd: true,
            createdAt: true,
            requester: { select: { id: true, email: true, firstName: true, lastName: true } },
            department: { select: { id: true, name: true } },
            _count: { select: { approvals: true, assetLinks: true } },
          },
        }),
        prisma.change.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, skip, take };
      if (count === 0) {
        response.note = 'No changes found matching the specified filters.';
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
    'get_change',
    'Get a single change request with full details including approvals, affected assets, history, and related changes.',
    {
      id: z.string().describe('Change UUID'),
    },
    withErrorHandling('get_change', async ({ id }) => {
      const change = await prisma.change.findUnique({
        where: { id },
        include: {
          requester: { select: { id: true, email: true, firstName: true, lastName: true } },
          implementer: { select: { id: true, email: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true } },
          approvals: {
            include: {
              approver: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          assetLinks: {
            include: {
              asset: { select: { id: true, assetTag: true, name: true, assetType: true, businessCriticality: true } },
            },
          },
          history: {
            include: {
              changedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          parentChange: {
            select: { id: true, changeRef: true, title: true, status: true },
          },
          childChanges: {
            select: { id: true, changeRef: true, title: true, status: true },
          },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      if (!change) {
        return { content: [{ type: 'text' as const, text: `Change with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(change, null, 2) }],
      };
    }),
  );

  server.tool(
    'search_changes',
    'Search change requests by title, change reference, or description.',
    {
      query: z.string().max(200).describe('Search term (matches against title, changeRef, and description)'),
    },
    withErrorHandling('search_changes', async ({ query }) => {
      const results = await prisma.change.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { changeRef: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          changeRef: true,
          title: true,
          description: true,
          changeType: true,
          category: true,
          priority: true,
          securityImpact: true,
          status: true,
          plannedStart: true,
          plannedEnd: true,
          createdAt: true,
          requester: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      const response: Record<string, unknown> = { results, count: results.length };
      if (results.length === 0) {
        response.note = `No changes matched the search query '${query}'.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );
}
