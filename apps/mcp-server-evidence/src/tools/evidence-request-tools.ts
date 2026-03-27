import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling, userSelectSafe } from '#mcp-shared';

export function registerEvidenceRequestTools(server: McpServer) {
  server.tool(
    'list_evidence_requests',
    'List evidence requests with optional status filter. Returns request details with pagination. If not found, returns a not-found message. Do not invent or assume values.',
    {
      status: z.enum(['OPEN', 'IN_PROGRESS', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'OVERDUE']).optional().describe('Filter by request status'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().describe('Filter by priority'),
      skip: z.number().int().min(0).default(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).optional().describe('Page size (max 200)'),
    },
    withErrorHandling('list_evidence_requests', async (params) => {
      const where: Record<string, unknown> = {};
      if (params.status) where.status = params.status;
      if (params.priority) where.priority = params.priority;

      const [requests, total] = await Promise.all([
        prisma.evidenceRequest.findMany({
          where,
          skip: params.skip || 0,
          take: params.take || 50,
          orderBy: { dueDate: 'asc' },
          select: {
            id: true,
            requestRef: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            evidenceType: true,
            contextType: true,
            contextRef: true,
            requestedBy: { select: { id: true, firstName: true, lastName: true } },
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
            assignedDepartment: { select: { id: true, name: true } },
            _count: { select: { fulfillments: true } },
          },
        }),
        prisma.evidenceRequest.count({ where }),
      ]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ requests, total, skip: params.skip || 0, take: params.take || 50 }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_evidence_request',
    'Get a single evidence request with full details including fulfillment records. If not found, returns a not-found message. Do not invent or assume values.',
    {
      id: z.string().describe('EvidenceRequest UUID'),
    },
    withErrorHandling('get_evidence_request', async ({ id }) => {
      const request = await prisma.evidenceRequest.findUnique({
        where: { id },
        include: {
          requestedBy: { select: userSelectSafe },
          assignedTo: { select: userSelectSafe },
          assignedDepartment: { select: { id: true, name: true } },
          fulfillments: {
            include: {
              evidence: {
                select: { id: true, evidenceRef: true, title: true, status: true },
              },
              submittedBy: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      });

      if (!request) {
        return { content: [{ type: 'text' as const, text: `Evidence request ${id} not found` }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(request, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_my_requests',
    'Get evidence requests assigned to a specific user. If not found, returns a not-found message. Do not invent or assume values.',
    {
      userId: z.string().describe('User UUID of the assignee'),
      status: z.enum(['OPEN', 'IN_PROGRESS', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'OVERDUE']).optional().describe('Filter by status'),
    },
    withErrorHandling('get_my_requests', async ({ userId, status }) => {
      const where: Record<string, unknown> = { assignedToId: userId };
      if (status) where.status = status;

      const requests = await prisma.evidenceRequest.findMany({
        where,
        take: 1000,
        orderBy: { dueDate: 'asc' },
        select: {
          id: true,
          requestRef: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          contextType: true,
          contextRef: true,
          _count: { select: { fulfillments: true } },
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ requests, count: requests.length }, null, 2),
        }],
      };
    }),
  );
}
