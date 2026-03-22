import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling, createPendingAction, zId } from '#mcp-shared';

export function registerTaskTools(server: McpServer) {
  server.tool(
    'create_agent_task',
    'Create a new agent task to track multi-step work. Use this for complex operations that span multiple tool calls or require approval gates.',
    {
      organisationId: zId.describe('Organisation UUID'),
      title: z.string().describe('Short title describing the task'),
      instruction: z.string().describe('Detailed instruction for the task'),
      parentTaskId: zId.optional().describe('Parent task ID for sub-tasks'),
      workflowId: z.string().optional().describe('Workflow ID if part of a workflow'),
      stepIndex: z.number().int().optional().describe('Step index within a workflow'),
    },
    withErrorHandling('create_agent_task', async (params) => {
      return createPendingAction({
        actionType: 'CREATE_AGENT_TASK',
        summary: `Create agent task: "${params.title}"`,
        reason: `Task instruction: ${params.instruction.slice(0, 200)}`,
        payload: params,
        mcpToolName: 'create_agent_task',
        organisationId: params.organisationId,
      });
    }),
  );

  server.tool(
    'update_agent_task',
    'Update the status or result of an agent task. Use this to track progress as you work through multi-step operations.',
    {
      taskId: zId.describe('Task UUID'),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED']).optional().describe('New task status'),
      result: z.string().optional().describe('Result summary or output'),
      errorMessage: z.string().optional().describe('Error message if task failed'),
      actionIds: z.array(zId).optional().describe('Action IDs to append to the task'),
    },
    withErrorHandling('update_agent_task', async (params) => {
      const existing = await prisma.agentTask.findUniqueOrThrow({ where: { id: params.taskId } });
      return createPendingAction({
        actionType: 'UPDATE_AGENT_TASK',
        summary: `Update agent task ${params.taskId}: status=${params.status ?? 'unchanged'}`,
        reason: params.result ? `Result: ${params.result.slice(0, 200)}` : undefined,
        payload: params,
        mcpToolName: 'update_agent_task',
        organisationId: existing.organisationId,
      });
    }),
  );

  server.tool(
    'get_agent_task',
    'Get full details of an agent task including child tasks and linked action IDs.',
    {
      taskId: zId.describe('Task UUID'),
    },
    withErrorHandling('get_agent_task', async ({ taskId }) => {
      const task = await prisma.agentTask.findUnique({
        where: { id: taskId },
        include: {
          childTasks: {
            select: {
              id: true,
              title: true,
              status: true,
              stepIndex: true,
              completedAt: true,
            },
            orderBy: { stepIndex: 'asc' },
          },
          parentTask: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      if (!task) {
        return {
          content: [{ type: 'text' as const, text: `Task with ID ${taskId} not found` }],
          isError: true,
        };
      }

      // If the task has action IDs, fetch their statuses
      let actionStatuses: Array<{ id: string; status: string; summary: string }> = [];
      if (task.actionIds.length > 0) {
        actionStatuses = await prisma.mcpPendingAction.findMany({
          where: { id: { in: task.actionIds } },
          select: { id: true, status: true, summary: true },
        });
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ ...task, actionStatuses }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'list_agent_tasks',
    'List agent tasks for an organisation with optional status filter.',
    {
      organisationId: zId.describe('Organisation UUID'),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED']).optional().describe('Filter by task status'),
      limit: z.number().int().min(1).max(100).default(20).describe('Max results to return'),
    },
    withErrorHandling('list_agent_tasks', async ({ organisationId, status, limit }) => {
      const where: Record<string, unknown> = { organisationId };
      if (status) where.status = status;

      const [results, count] = await Promise.all([
        prisma.agentTask.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            title: true,
            status: true,
            trigger: true,
            workflowId: true,
            stepIndex: true,
            actionIds: true,
            createdAt: true,
            completedAt: true,
          },
        }),
        prisma.agentTask.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, limit };
      if (count === 0) {
        response.note = status
          ? `No tasks with status ${status} found.`
          : 'No tasks found for this organisation.';
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
