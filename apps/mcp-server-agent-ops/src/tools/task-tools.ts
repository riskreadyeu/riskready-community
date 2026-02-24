import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerTaskTools(server: McpServer) {
  server.tool(
    'create_agent_task',
    'Create a new agent task to track multi-step work. Use this for complex operations that span multiple tool calls or require approval gates.',
    {
      organisationId: z.string().describe('Organisation UUID'),
      title: z.string().describe('Short title describing the task'),
      instruction: z.string().describe('Detailed instruction for the task'),
      parentTaskId: z.string().optional().describe('Parent task ID for sub-tasks'),
      workflowId: z.string().optional().describe('Workflow ID if part of a workflow'),
      stepIndex: z.number().int().optional().describe('Step index within a workflow'),
    },
    withErrorHandling('create_agent_task', async ({ organisationId, title, instruction, parentTaskId, workflowId, stepIndex }) => {
      const task = await prisma.agentTask.create({
        data: {
          organisationId,
          title,
          instruction,
          parentTaskId,
          workflowId,
          stepIndex,
          status: 'PENDING',
          trigger: parentTaskId ? 'WORKFLOW_STEP' : 'USER_REQUEST',
        },
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            message: 'Task created successfully.',
            taskId: task.id,
            title: task.title,
            status: task.status,
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'update_agent_task',
    'Update the status or result of an agent task. Use this to track progress as you work through multi-step operations.',
    {
      taskId: z.string().describe('Task UUID'),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED']).optional().describe('New task status'),
      result: z.string().optional().describe('Result summary or output'),
      errorMessage: z.string().optional().describe('Error message if task failed'),
      actionIds: z.array(z.string()).optional().describe('Action IDs to append to the task'),
    },
    withErrorHandling('update_agent_task', async ({ taskId, status, result, errorMessage, actionIds }) => {
      const existing = await prisma.agentTask.findUnique({ where: { id: taskId } });
      if (!existing) {
        return {
          content: [{ type: 'text' as const, text: `Task with ID ${taskId} not found` }],
          isError: true,
        };
      }

      const data: Record<string, unknown> = {};
      if (status) data.status = status;
      if (result) data.result = result;
      if (errorMessage) data.errorMessage = errorMessage;
      if (status === 'COMPLETED' || status === 'FAILED') {
        data.completedAt = new Date();
      }
      if (actionIds && actionIds.length > 0) {
        data.actionIds = [...existing.actionIds, ...actionIds];
      }

      const task = await prisma.agentTask.update({
        where: { id: taskId },
        data,
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            message: 'Task updated successfully.',
            taskId: task.id,
            title: task.title,
            status: task.status,
            completedAt: task.completedAt,
          }, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_agent_task',
    'Get full details of an agent task including child tasks and linked action IDs.',
    {
      taskId: z.string().describe('Task UUID'),
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
      organisationId: z.string().describe('Organisation UUID'),
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
