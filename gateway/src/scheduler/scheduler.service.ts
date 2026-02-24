// gateway/src/scheduler/scheduler.service.ts

import { prisma } from '../prisma.js';
import { logger } from '../logger.js';
import { AgentRunner } from '../agent/agent-runner.js';
import type { UnifiedMessage, ChatEvent } from '../channels/types.js';
import { randomUUID } from 'node:crypto';

/**
 * Minimal cron parser: supports standard 5-field cron expressions.
 * For production, consider using a library like 'cron-parser'.
 */
function getNextCronRun(cronExpression: string, after: Date = new Date()): Date {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  const [minuteSpec, hourSpec, daySpec, monthSpec, weekdaySpec] = parts;

  function matchesField(spec: string, value: number, min: number, max: number): boolean {
    if (spec === '*') return true;
    for (const part of spec.split(',')) {
      if (part.includes('/')) {
        const [rangeStr, stepStr] = part.split('/');
        const step = parseInt(stepStr!, 10);
        const start = rangeStr === '*' ? min : parseInt(rangeStr!, 10);
        for (let i = start; i <= max; i += step) {
          if (i === value) return true;
        }
      } else if (part.includes('-')) {
        const [lo, hi] = part.split('-').map(Number);
        if (value >= lo! && value <= hi!) return true;
      } else {
        if (parseInt(part, 10) === value) return true;
      }
    }
    return false;
  }

  // Start from the next minute
  const candidate = new Date(after);
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  // Scan forward up to 366 days
  const maxIterations = 366 * 24 * 60;
  for (let i = 0; i < maxIterations; i++) {
    const min = candidate.getMinutes();
    const hr = candidate.getHours();
    const day = candidate.getDate();
    const month = candidate.getMonth() + 1;
    const weekday = candidate.getDay();

    if (
      matchesField(minuteSpec!, min, 0, 59) &&
      matchesField(hourSpec!, hr, 0, 23) &&
      matchesField(daySpec!, day, 1, 31) &&
      matchesField(monthSpec!, month, 1, 12) &&
      matchesField(weekdaySpec!, weekday, 0, 6)
    ) {
      return candidate;
    }

    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  // Fallback: 24 hours from now
  return new Date(after.getTime() + 24 * 60 * 60 * 1000);
}

export class SchedulerService {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private agentRunner: AgentRunner;
  private pollIntervalMs: number;

  constructor(agentRunner: AgentRunner, pollIntervalMs = 60_000) {
    this.agentRunner = agentRunner;
    this.pollIntervalMs = pollIntervalMs;
  }

  start(): void {
    if (this.intervalHandle) return;
    logger.info({ pollIntervalMs: this.pollIntervalMs }, 'Scheduler started');

    // Run immediately, then on interval
    this.tick().catch((err) => logger.error({ err }, 'Scheduler tick error'));
    this.intervalHandle = setInterval(() => {
      if (this.running) {
        logger.debug('Scheduler tick skipped — previous tick still running');
        return;
      }
      this.tick().catch((err) => logger.error({ err }, 'Scheduler tick error'));
    }, this.pollIntervalMs);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    logger.info('Scheduler stopped');
  }

  private async tick(): Promise<void> {
    this.running = true;
    try {
      await this.processDueSchedules();
      await this.processAwaitingApprovalTasks();
    } finally {
      this.running = false;
    }
  }

  /**
   * Find and execute schedules whose nextRunAt has passed.
   */
  private async processDueSchedules(): Promise<void> {
    const now = new Date();

    const dueSchedules = await prisma.agentSchedule.findMany({
      where: {
        enabled: true,
        nextRunAt: { lte: now },
      },
      take: 10,
    });

    for (const schedule of dueSchedules) {
      try {
        logger.info({ scheduleId: schedule.id, name: schedule.name }, 'Executing scheduled task');

        // Create an AgentTask for tracking
        const task = await prisma.agentTask.create({
          data: {
            organisationId: schedule.organisationId,
            title: `Scheduled: ${schedule.name}`,
            instruction: schedule.instruction,
            trigger: 'SCHEDULED',
            status: 'PENDING',
          },
        });

        // Create a system conversation for the scheduled run
        const conversation = await prisma.chatConversation.create({
          data: {
            title: `[Scheduled] ${schedule.name}`,
            userId: schedule.createdBy || 'system',
            organisationId: schedule.organisationId,
          },
        });

        // Build a synthetic message
        const syntheticMsg: UnifiedMessage = {
          id: randomUUID(),
          channel: 'web',
          channelMessageId: randomUUID(),
          channelId: conversation.id,
          userId: schedule.createdBy || 'system',
          organisationId: schedule.organisationId,
          text: schedule.instruction,
          attachments: [],
          metadata: {
            conversationId: conversation.id,
            isScheduled: true,
            agentTaskId: task.id,
            scheduleId: schedule.id,
          },
          timestamp: new Date(),
        };

        // Execute with a 5-minute timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000);

        const noopEmit = (_event: ChatEvent) => {
          // Scheduled runs don't stream to a UI
        };

        try {
          await this.agentRunner.execute(syntheticMsg, controller.signal, noopEmit, task.id);
        } finally {
          clearTimeout(timeout);
        }

        // Update schedule
        const nextRunAt = getNextCronRun(schedule.cronExpression, now);
        await prisma.agentSchedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: now,
            nextRunAt,
            lastRunTaskId: task.id,
          },
        });

        logger.info({
          scheduleId: schedule.id,
          taskId: task.id,
          nextRunAt,
        }, 'Scheduled task completed');
      } catch (err) {
        logger.error({ err, scheduleId: schedule.id }, 'Scheduled task failed');

        // Still update nextRunAt so we don't retry immediately
        try {
          const nextRunAt = getNextCronRun(schedule.cronExpression, now);
          await prisma.agentSchedule.update({
            where: { id: schedule.id },
            data: { lastRunAt: now, nextRunAt },
          });
        } catch (updateErr) {
          logger.error({ err: updateErr }, 'Failed to update schedule after error');
        }
      }
    }
  }

  /**
   * Check tasks in AWAITING_APPROVAL — if all linked actions are resolved, trigger a resume run.
   */
  private async processAwaitingApprovalTasks(): Promise<void> {
    const awaitingTasks = await prisma.agentTask.findMany({
      where: { status: 'AWAITING_APPROVAL' },
      take: 20,
    });

    for (const task of awaitingTasks) {
      if (task.actionIds.length === 0) {
        // No actions to await — move to COMPLETED
        await prisma.agentTask.update({
          where: { id: task.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        continue;
      }

      // Check if all linked actions are resolved (not PENDING)
      const pendingCount = await prisma.mcpPendingAction.count({
        where: {
          id: { in: task.actionIds },
          status: 'PENDING',
        },
      });

      if (pendingCount > 0) continue; // Still waiting

      // All actions resolved — get their outcomes
      const actions = await prisma.mcpPendingAction.findMany({
        where: { id: { in: task.actionIds } },
        select: {
          id: true,
          actionType: true,
          status: true,
          summary: true,
          reviewNotes: true,
          errorMessage: true,
        },
      });

      const outcomes = actions.map((a) => {
        let detail = `- ${a.actionType}: ${a.status}`;
        if (a.reviewNotes) detail += ` (Notes: ${a.reviewNotes})`;
        if (a.errorMessage) detail += ` (Error: ${a.errorMessage})`;
        return detail;
      }).join('\n');

      // Create a resume child task
      const childTask = await prisma.agentTask.create({
        data: {
          organisationId: task.organisationId,
          title: `Resume: ${task.title}`,
          instruction: `The following proposals from your previous task have been resolved:\n\n${outcomes}\n\nOriginal task: ${task.instruction}\n\nPrevious result: ${task.result || 'None'}\n\nPlease review the outcomes and take any necessary follow-up actions. If proposals were rejected, consider revising your approach based on reviewer notes.`,
          parentTaskId: task.id,
          trigger: 'APPROVAL_RESUME',
          status: 'PENDING',
        },
      });

      // Mark original task as completed
      await prisma.agentTask.update({
        where: { id: task.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      // Create a system conversation for the resume
      const conversation = await prisma.chatConversation.create({
        data: {
          title: `[Resume] ${task.title}`,
          userId: task.userId || 'system',
          organisationId: task.organisationId,
        },
      });

      const syntheticMsg: UnifiedMessage = {
        id: randomUUID(),
        channel: 'web',
        channelMessageId: randomUUID(),
        channelId: conversation.id,
        userId: task.userId || 'system',
        organisationId: task.organisationId,
        text: childTask.instruction,
        attachments: [],
        metadata: {
          conversationId: conversation.id,
          isScheduled: true,
          agentTaskId: childTask.id,
        },
        timestamp: new Date(),
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000);
      const noopEmit = (_event: ChatEvent) => {};

      try {
        await this.agentRunner.execute(syntheticMsg, controller.signal, noopEmit, childTask.id);
      } catch (err) {
        logger.error({ err, taskId: childTask.id }, 'Approval resume task failed');
      } finally {
        clearTimeout(timeout);
      }
    }
  }
}

export { getNextCronRun };
