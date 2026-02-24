import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerActionTools(server: McpServer) {
  server.tool(
    'check_action_status',
    'Check the status of a previously proposed action by its ID. Returns status (PENDING/APPROVED/REJECTED/EXECUTED/FAILED), reviewer notes, and result data.',
    {
      actionId: z.string().describe('The action ID returned when the action was proposed'),
    },
    withErrorHandling('check_action_status', async ({ actionId }) => {
      const action = await prisma.mcpPendingAction.findUnique({
        where: { id: actionId },
        select: {
          id: true,
          actionType: true,
          status: true,
          summary: true,
          reason: true,
          reviewedAt: true,
          reviewNotes: true,
          executedAt: true,
          resultData: true,
          errorMessage: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!action) {
        return {
          content: [{ type: 'text' as const, text: `Action with ID ${actionId} not found` }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(action, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'list_pending_actions',
    'List pending actions for an organisation with optional status filter. Useful for checking what proposals are awaiting approval.',
    {
      organisationId: z.string().describe('Organisation UUID'),
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED']).optional().describe('Filter by action status'),
      limit: z.number().int().min(1).max(100).default(20).describe('Max results to return'),
    },
    withErrorHandling('list_pending_actions', async ({ organisationId, status, limit }) => {
      const where: Record<string, unknown> = { organisationId };
      if (status) where.status = status;

      const [results, count] = await Promise.all([
        prisma.mcpPendingAction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            actionType: true,
            status: true,
            summary: true,
            reason: true,
            reviewNotes: true,
            createdAt: true,
            reviewedAt: true,
            executedAt: true,
          },
        }),
        prisma.mcpPendingAction.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, limit };
      if (count === 0) {
        response.note = status
          ? `No actions with status ${status} found for this organisation.`
          : 'No actions found for this organisation.';
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
    'list_recent_actions',
    'List recent actions since a given date. Useful for reviewing what the agent has proposed and what happened to those proposals.',
    {
      organisationId: z.string().describe('Organisation UUID'),
      since: z.string().optional().describe('ISO date string — only return actions created after this date (defaults to last 24 hours)'),
      limit: z.number().int().min(1).max(100).default(20).describe('Max results to return'),
    },
    withErrorHandling('list_recent_actions', async ({ organisationId, since, limit }) => {
      const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const results = await prisma.mcpPendingAction.findMany({
        where: {
          organisationId,
          createdAt: { gte: sinceDate },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          actionType: true,
          status: true,
          summary: true,
          reason: true,
          reviewNotes: true,
          errorMessage: true,
          createdAt: true,
          reviewedAt: true,
          executedAt: true,
        },
      });

      const response: Record<string, unknown> = {
        results,
        count: results.length,
        since: sinceDate.toISOString(),
      };
      if (results.length === 0) {
        response.note = `No actions found since ${sinceDate.toISOString()}.`;
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2),
        }],
      };
    }),
  );
}
