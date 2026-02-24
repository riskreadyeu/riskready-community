import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Request,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedRequest } from '../shared/types';

/**
 * REST API for managing agent workflows and viewing execution status.
 * Workflows are executed by the gateway's WorkflowExecutor via AgentSchedule entries.
 */
@Controller('agent-workflows')
export class AgentWorkflowController {
  constructor(private prisma: PrismaService) {}

  /**
   * List all workflow-type tasks (tasks with workflowId set and no parentTaskId).
   */
  @Get()
  async listWorkflows(
    @Query('organisationId') organisationId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const where: Record<string, unknown> = {
      workflowId: { not: null },
      parentTaskId: null, // Only top-level workflow tasks
    };
    if (organisationId) where['organisationId'] = organisationId;
    if (status) where['status'] = status;

    const [results, count] = await Promise.all([
      this.prisma.agentTask.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: skip ? parseInt(skip, 10) : 0,
        take: take ? parseInt(take, 10) : 20,
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
        },
      }),
      this.prisma.agentTask.count({ where }),
    ]);

    return { results, count };
  }

  /**
   * Get detailed workflow execution status including all step results.
   */
  @Get(':taskId')
  async getWorkflow(@Param('taskId') taskId: string) {
    const task = await this.prisma.agentTask.findUnique({
      where: { id: taskId },
      include: {
        childTasks: {
          orderBy: { stepIndex: 'asc' },
          include: {
            childTasks: {
              select: { id: true, title: true, status: true },
            },
          },
        },
      },
    });

    if (!task) {
      return { error: 'Workflow task not found' };
    }

    return task;
  }

  /**
   * Trigger a built-in workflow by its workflow ID.
   * This creates the parent task entry; the gateway picks it up.
   */
  @Post('trigger')
  async triggerWorkflow(
    @Request() req: AuthenticatedRequest,
    @Body() data: {
      workflowId: string;
      organisationId: string;
      instruction?: string;
    },
  ) {
    const task = await this.prisma.agentTask.create({
      data: {
        organisationId: data.organisationId,
        title: `Workflow: ${data.workflowId}`,
        instruction: data.instruction || `Execute workflow ${data.workflowId}`,
        workflowId: data.workflowId,
        trigger: 'USER_REQUEST',
        status: 'PENDING',
        userId: req.user?.id || 'system',
      },
    });

    return {
      message: 'Workflow triggered. The gateway scheduler will execute it.',
      taskId: task.id,
      workflowId: data.workflowId,
    };
  }

  /**
   * List available built-in workflow definitions.
   */
  @Get('definitions/built-in')
  async listBuiltInWorkflows() {
    // Return the definitions from the workflow types module
    // These are hardcoded in gateway/src/workflows/types.ts
    return {
      workflows: [
        {
          id: 'incident-response-flow',
          name: 'Incident Response Flow',
          description: 'Comprehensive incident analysis: impact assessment, control gap identification, risk re-assessment, and treatment proposal.',
          steps: 4,
          tags: ['incident', 'risk', 'controls'],
        },
        {
          id: 'weekly-risk-review',
          name: 'Weekly Risk Review',
          description: 'Automated weekly review: tolerance breaches, KRI trends, overdue treatments, and executive summary.',
          steps: 4,
          tags: ['risk', 'kri', 'executive'],
        },
        {
          id: 'control-assurance-cycle',
          name: 'Control Assurance Cycle',
          description: 'Assessment status review, gap analysis, and nonconformity tracking.',
          steps: 3,
          tags: ['controls', 'audits', 'assessment'],
        },
        {
          id: 'policy-compliance-check',
          name: 'Policy Compliance Check',
          description: 'Policy review status, exception expiry, and evidence coverage analysis.',
          steps: 3,
          tags: ['policies', 'evidence', 'compliance'],
        },
      ],
    };
  }
}
