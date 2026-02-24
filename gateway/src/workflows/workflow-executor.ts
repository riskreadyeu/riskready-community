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
   * Creates a parent AgentTask for the workflow and child tasks for each step.
   */
  async execute(
    workflow: WorkflowDefinition,
    organisationId: string,
    userId: string = 'system',
    emit?: (event: ChatEvent) => void,
  ): Promise<WorkflowExecution> {
    const parentTask = await prisma.agentTask.create({
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

    const execution: WorkflowExecution = {
      workflowId: workflow.id,
      parentTaskId: parentTask.id,
      organisationId,
      currentStepIndex: 0,
      status: 'running',
      stepResults: [],
    };

    // Build cumulative context from step results
    let cumulativeContext = '';

    for (let i = 0; i < workflow.steps.length; i++) {
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
          organisationId,
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
          organisationId,
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
        organisationId,
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

          // The scheduler will detect the AWAITING_APPROVAL task and resume
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

    // All steps completed
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
