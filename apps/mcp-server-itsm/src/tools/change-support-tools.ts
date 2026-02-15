import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';

export function registerChangeSupportTools(server: McpServer) {
  server.tool(
    'get_change_approvals',
    'List approvals for a specific change request. Shows approver, status, decision, and comments.',
    {
      changeId: z.string().describe('Change UUID'),
    },
    async ({ changeId }) => {
      const change = await prisma.change.findUnique({
        where: { id: changeId },
        select: { id: true, changeRef: true, title: true },
      });
      if (!change) {
        return { content: [{ type: 'text' as const, text: `Change with ID ${changeId} not found` }], isError: true };
      }

      const approvals = await prisma.changeApproval.findMany({
        where: { changeId },
        include: {
          approver: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      const response: any = {
        change: { id: change.id, changeRef: change.changeRef, title: change.title },
        approvals,
        count: approvals.length,
      };
      if (approvals.length === 0) {
        response.note = `No approvals found for change ${change.changeRef}.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    },
  );

  server.tool(
    'get_pending_change_approvals',
    'Find all pending approvals across all change requests. Useful for approval queue management.',
    {},
    async () => {
      const approvals = await prisma.changeApproval.findMany({
        where: { status: 'PENDING' },
        include: {
          change: {
            select: {
              id: true,
              changeRef: true,
              title: true,
              changeType: true,
              priority: true,
              securityImpact: true,
              status: true,
            },
          },
          approver: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      const response: any = { approvals, count: approvals.length };
      if (approvals.length === 0) {
        response.note = 'No pending change approvals found.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    },
  );

  server.tool(
    'get_change_history',
    'List audit history for a specific change request. Shows field changes, actions, and who made them.',
    {
      changeId: z.string().describe('Change UUID'),
    },
    async ({ changeId }) => {
      const change = await prisma.change.findUnique({
        where: { id: changeId },
        select: { id: true, changeRef: true, title: true },
      });
      if (!change) {
        return { content: [{ type: 'text' as const, text: `Change with ID ${changeId} not found` }], isError: true };
      }

      const history = await prisma.changeHistory.findMany({
        where: { changeId },
        include: {
          changedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const response: any = {
        change: { id: change.id, changeRef: change.changeRef, title: change.title },
        history,
        count: history.length,
      };
      if (history.length === 0) {
        response.note = `No history records found for change ${change.changeRef}.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    },
  );

  server.tool(
    'list_change_templates',
    'List change templates for standard/pre-approved changes. Filter by active status and category.',
    {
      isActive: z.boolean().optional().describe('Filter by active status'),
      category: z.enum([
        'ACCESS_CONTROL', 'CONFIGURATION', 'INFRASTRUCTURE', 'APPLICATION', 'DATABASE',
        'SECURITY', 'NETWORK', 'BACKUP_DR', 'MONITORING', 'VENDOR', 'DOCUMENTATION', 'OTHER',
      ]).optional().describe('Filter by change category'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    async ({ isActive, category, skip, take }) => {
      const where: any = {};
      if (isActive !== undefined) where.isActive = isActive;
      if (category) where.category = category;

      const [results, count] = await Promise.all([
        prisma.changeTemplate.findMany({
          where,
          skip,
          take,
          orderBy: { templateCode: 'asc' },
          select: {
            id: true,
            templateCode: true,
            name: true,
            description: true,
            category: true,
            securityImpact: true,
            riskLevel: true,
            autoApprove: true,
            maxDuration: true,
            applicableAssetTypes: true,
            isActive: true,
            lastReviewDate: true,
            nextReviewDate: true,
          },
        }),
        prisma.changeTemplate.count({ where }),
      ]);

      const response: any = { results, total: count, skip, take };
      if (count === 0) {
        response.note = 'No change templates found matching the specified filters.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    },
  );

  server.tool(
    'get_change_template',
    'Get a single change template with full details including instructions, backout plan, and test plan.',
    {
      id: z.string().describe('Change template UUID'),
    },
    async ({ id }) => {
      const template = await prisma.changeTemplate.findUnique({
        where: { id },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      if (!template) {
        return { content: [{ type: 'text' as const, text: `Change template with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(template, null, 2) }],
      };
    },
  );
}
