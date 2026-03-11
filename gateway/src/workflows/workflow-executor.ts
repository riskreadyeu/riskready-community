// gateway/src/workflows/workflow-executor.ts

import { prisma } from '../prisma.js';
import { logger } from '../logger.js';
import { AgentRunner } from '../agent/agent-runner.js';
import type { UnifiedMessage, ChatEvent } from '../channels/types.js';
import type { WorkflowDefinition, WorkflowExecution } from './types.js';
import { randomUUID } from 'node:crypto';

export class WorkflowExecutor {
  private agentRunner: AgentRunner;

  constructor(agentRunner: AgentRunner) {
    this.agentRunner = agentRunner;
  }

  /**
   * Execute a workflow definition from start.
   * If existingTaskId is provided, updates that task instead of creating a new one.
   */
  async execute(
    workflow: WorkflowDefinition,
    organisationId: string,
    userId: string = 'system',
    emit?: (event: ChatEvent) => void,
    existingTaskId?: string,
  ): Promise<WorkflowExecution> {
    let parentTask: { id: string; organisationId: string; userId?: string | null };

    if (existingTaskId) {
      // Reuse the task created by the trigger endpoint
      parentTask = await prisma.agentTask.update({
        where: { id: existingTaskId },
        data: {
          status: 'IN_PROGRESS',
          title: `Workflow: ${workflow.name}`,
          instruction: workflow.description,
          workflowId: workflow.id,
        },
      });
    } else {
      parentTask = await prisma.agentTask.create({
        data: {
          organisationId,
          title: `Workflow: ${workflow.name}`,
          instruction: workflow.description,
          workflowId: workflow.id,
          trigger: 'USER_REQUEST',
          status: 'IN_PROGRESS',
          userId,
        },
      });
    }

    const execution: WorkflowExecution = {
      workflowId: workflow.id,
      parentTaskId: parentTask.id,
      organisationId,
      currentStepIndex: 0,
      status: 'running',
      stepResults: [],
    };

    return this.executeSteps(workflow, parentTask, 0, '', execution, emit);
  }

  /**
   * Resume a workflow after an approval gate has been resolved.
   * Rebuilds cumulative context from completed steps, then continues from the next step.
   */
  async resume(
    workflow: WorkflowDefinition,
    parentTaskId: string,
    approvalOutcomes: string,
    emit?: (event: ChatEvent) => void,
  ): Promise<WorkflowExecution> {
    const parentTask = await prisma.agentTask.findUnique({
      where: { id: parentTaskId },
      include: { childTasks: { orderBy: { stepIndex: 'asc' } } },
    });

    if (!parentTask) {
      throw new Error(`Workflow parent task not found: ${parentTaskId}`);
    }

    // Find the last completed step index
    const completedSteps = parentTask.childTasks.filter(
      (t: { stepIndex: number | null }) => t.stepIndex !== null
    );

    const lastStepIndex = completedSteps.length > 0
      ? Math.max(...completedSteps.map((t: { stepIndex: number | null }) => t.stepIndex!))
      : -1;

    const resumeFromStep = lastStepIndex + 1;

    // Rebuild cumulative context from completed steps
    let cumulativeContext = completedSteps
      .filter((t: { result: string | null }) => t.result)
      .map((t: { stepIndex: number | null; result: string | null }) =>
        `**${workflow.steps[t.stepIndex!]!.name}:**\n${t.result!.slice(0, 3000)}`
      )
      .join('\n\n');

    // Append approval outcomes
    cumulativeContext += `\n\n**Approval Outcomes:**\n${approvalOutcomes}`;

    // Mark parent as IN_PROGRESS again
    await prisma.agentTask.update({
      where: { id: parentTaskId },
      data: { status: 'IN_PROGRESS' },
    });

    const execution: WorkflowExecution = {
      workflowId: workflow.id,
      parentTaskId,
      organisationId: parentTask.organisationId,
      currentStepIndex: resumeFromStep,
      status: 'running',
      stepResults: completedSteps.map((t: { stepIndex: number | null; id: string; status: string; result: string | null }) => ({
        stepIndex: t.stepIndex!,
        taskId: t.id,
        status: t.status,
        result: t.result || undefined,
      })),
    };

    return this.executeSteps(
      workflow,
      { id: parentTaskId, organisationId: parentTask.organisationId, userId: parentTask.userId },
      resumeFromStep,
      cumulativeContext,
      execution,
      emit,
    );
  }

  /**
   * Shared step execution loop used by both execute() and resume().
   * Handles zero remaining steps (marks parent COMPLETED immediately).
   */
  private async executeSteps(
    workflow: WorkflowDefinition,
    parentTask: { id: string; organisationId: string; userId?: string | null },
    startIndex: number,
    cumulativeContext: string,
    execution: WorkflowExecution,
    emit?: (event: ChatEvent) => void,
  ): Promise<WorkflowExecution> {
    const userId = parentTask.userId || 'system';

    for (let i = startIndex; i < workflow.steps.length; i++) {
      const step = workflow.steps[i]!;
      execution.currentStepIndex = i;

      logger.info({
        workflowId: workflow.id,
        step: step.name,
        stepIndex: i,
      }, 'Executing workflow step');

      // Create child task for this step
      const stepTask = await prisma.agentTask.create({
        data: {
          organisationId: parentTask.organisationId,
          title: `Step ${i + 1}: ${step.name}`,
          instruction: step.instruction,
          parentTaskId: parentTask.id,
          workflowId: workflow.id,
          stepIndex: i,
          trigger: 'WORKFLOW_STEP',
          status: 'PENDING',
          userId,
        },
      });

      // Create conversation for this step
      const conversation = await prisma.chatConversation.create({
        data: {
          title: `[Workflow] ${workflow.name} — Step ${i + 1}: ${step.name}`,
          userId,
          organisationId: parentTask.organisationId,
        },
      });

      // Build instruction with cumulative context
      const stepInstruction = cumulativeContext
        ? `${step.instruction}\n\n--- Context from previous steps ---\n${cumulativeContext}`
        : step.instruction;

      const syntheticMsg: UnifiedMessage = {
        id: randomUUID(),
        channel: 'web',
        channelMessageId: randomUUID(),
        channelId: conversation.id,
        userId,
        organisationId: parentTask.organisationId,
        text: stepInstruction,
        attachments: [],
        metadata: {
          conversationId: conversation.id,
          isScheduled: true,
          agentTaskId: stepTask.id,
          workflowId: workflow.id,
          stepIndex: i,
        },
        timestamp: new Date(),
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const stepEmit = emit || ((_event: ChatEvent) => {});

      try {
        await this.agentRunner.execute(syntheticMsg, controller.signal, stepEmit, stepTask.id);

        // Reload the step task to get results
        const updatedStepTask = await prisma.agentTask.findUnique({
          where: { id: stepTask.id },
        });

        const stepResult = {
          stepIndex: i,
          taskId: stepTask.id,
          status: updatedStepTask?.status || 'UNKNOWN',
          result: updatedStepTask?.result || undefined,
        };
        execution.stepResults.push(stepResult);

        // Add to cumulative context
        if (updatedStepTask?.result) {
          cumulativeContext += `\n\n**${step.name}:**\n${updatedStepTask.result.slice(0, 3000)}`;
        }

        // Check if step hit an approval gate
        if (step.approvalGate && updatedStepTask?.status === 'AWAITING_APPROVAL') {
          execution.status = 'paused_at_gate';
          logger.info({
            workflowId: workflow.id,
            step: step.name,
            taskId: stepTask.id,
          }, 'Workflow paused at approval gate');

          // The scheduler will detect the AWAITING_APPROVAL parent task and resume
          await prisma.agentTask.update({
            where: { id: parentTask.id },
            data: { status: 'AWAITING_APPROVAL' },
          });

          return execution;
        }
      } catch (err) {
        logger.error({ err, workflowId: workflow.id, step: step.name }, 'Workflow step failed');
        execution.status = 'failed';
        execution.stepResults.push({
          stepIndex: i,
          taskId: stepTask.id,
          status: 'FAILED',
          result: err instanceof Error ? err.message : String(err),
        });

        await prisma.agentTask.update({
          where: { id: parentTask.id },
          data: {
            status: 'FAILED',
            errorMessage: `Failed at step ${i + 1}: ${step.name}`,
            completedAt: new Date(),
          },
        });

        return execution;
      } finally {
        clearTimeout(timeout);
      }
    }

    // All steps completed (including zero-step case on resume)
    execution.status = 'completed';
    await prisma.agentTask.update({
      where: { id: parentTask.id },
      data: {
        status: 'COMPLETED',
        result: `Workflow completed: ${execution.stepResults.length} steps executed`,
        completedAt: new Date(),
      },
    });

    logger.info({ workflowId: workflow.id, parentTaskId: parentTask.id }, 'Workflow completed');
    return execution;
  }
}
