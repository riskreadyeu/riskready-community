# Phase 4: Wire WorkflowExecutor Into Scheduler — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the existing WorkflowExecutor to the SchedulerService so that triggered workflows are picked up, executed step-by-step, and resumed correctly after approval gates.

**Architecture:** The scheduler already coordinates autonomous work (cron schedules, approval resumes). We add workflow pickup and workflow-aware resume as two new methods in the same polling loop. The WorkflowExecutor gets a refactored step loop and a new `resume()` method.

**Tech Stack:** TypeScript, Vitest, Prisma, gateway internals (LaneQueue, AgentRunner)

**Spec:** `docs/superpowers/specs/2026-03-11-phase4-workflow-wiring-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `gateway/src/workflows/types.ts` | Modify | Add `getWorkflowById()` helper |
| `gateway/src/workflows/workflow-executor.ts` | Modify | Refactor step loop into `executeSteps()`, add `resume()`, add `existingTaskId` param |
| `gateway/src/scheduler/scheduler.service.ts` | Modify | Add `processWorkflowTasks()`, workflow-aware resume, `parentTaskId: null` filter |
| `gateway/src/workflows/__tests__/types.test.ts` | Create | Tests for `getWorkflowById()` |
| `gateway/src/workflows/__tests__/workflow-executor.test.ts` | Create | Tests for `execute()`, `resume()`, `executeSteps()` edge cases |
| `gateway/src/scheduler/__tests__/scheduler.service.test.ts` | Create | Tests for `processWorkflowTasks()` and workflow-aware resume |

---

## Chunk 1: getWorkflowById helper

### Task 1: Add `getWorkflowById()` to types.ts

**Files:**
- Modify: `gateway/src/workflows/types.ts`
- Create: `gateway/src/workflows/__tests__/types.test.ts`

- [ ] **Step 1: Write the failing test**

Create `gateway/src/workflows/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getWorkflowById, BUILT_IN_WORKFLOWS } from '../types.js';

describe('getWorkflowById', () => {
  it('returns a workflow definition by ID', () => {
    const result = getWorkflowById('weekly-risk-review');
    expect(result).toBeDefined();
    expect(result!.id).toBe('weekly-risk-review');
    expect(result!.name).toBe('Weekly Risk Review');
  });

  it('returns undefined for unknown workflow ID', () => {
    const result = getWorkflowById('nonexistent-workflow');
    expect(result).toBeUndefined();
  });

  it('returns all four built-in workflows by their IDs', () => {
    const ids = ['incident-response-flow', 'weekly-risk-review', 'control-assurance-cycle', 'policy-compliance-check'];
    for (const id of ids) {
      expect(getWorkflowById(id)).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd gateway && npx vitest run src/workflows/__tests__/types.test.ts`
Expected: FAIL with "getWorkflowById is not exported"

- [ ] **Step 3: Write the implementation**

Add to the bottom of `gateway/src/workflows/types.ts`:

```typescript
/**
 * Look up a built-in workflow definition by its ID.
 */
export function getWorkflowById(id: string): WorkflowDefinition | undefined {
  return BUILT_IN_WORKFLOWS.find((w) => w.id === id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd gateway && npx vitest run src/workflows/__tests__/types.test.ts`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add gateway/src/workflows/types.ts gateway/src/workflows/__tests__/types.test.ts
git commit -m "feat(workflows): add getWorkflowById lookup helper"
```

---

## Chunk 2: Refactor WorkflowExecutor + add resume()

### Task 2: Refactor step loop into executeSteps()

**Files:**
- Modify: `gateway/src/workflows/workflow-executor.ts`
- Create: `gateway/src/workflows/__tests__/workflow-executor.test.ts`

- [ ] **Step 1: Write test for execute() with existingTaskId**

Create `gateway/src/workflows/__tests__/workflow-executor.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing executor
const mockPrisma = {
  agentTask: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  chatConversation: {
    create: vi.fn(),
  },
  mcpPendingAction: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
};

vi.mock('../../prisma.js', () => ({ prisma: mockPrisma }));
vi.mock('../../logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

import { WorkflowExecutor } from '../workflow-executor.js';
import type { WorkflowDefinition } from '../types.js';

const twoStepWorkflow: WorkflowDefinition = {
  id: 'test-workflow',
  name: 'Test Workflow',
  description: 'A test workflow',
  tags: ['test'],
  steps: [
    { name: 'Step One', instruction: 'Do step one', requiredServers: ['risks'], approvalGate: false },
    { name: 'Step Two', instruction: 'Do step two', requiredServers: ['controls'], approvalGate: false },
  ],
};

function makeMockRunner() {
  return {
    execute: vi.fn().mockResolvedValue(undefined),
  } as any;
}

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;
  let mockRunner: ReturnType<typeof makeMockRunner>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRunner = makeMockRunner();
    executor = new WorkflowExecutor(mockRunner);

    // Default mocks
    mockPrisma.chatConversation.create.mockResolvedValue({ id: 'conv-1' });
    mockPrisma.agentTask.findUnique.mockResolvedValue({ status: 'COMPLETED', result: 'step done' });
  });

  describe('execute() with existingTaskId', () => {
    it('updates existing task instead of creating a new one', async () => {
      const existingTaskId = 'existing-task-123';
      mockPrisma.agentTask.update.mockResolvedValue({
        id: existingTaskId,
        organisationId: 'org-1',
        userId: 'user-1',
      });
      mockPrisma.agentTask.create.mockResolvedValue({ id: 'step-task-1' });

      const result = await executor.execute(twoStepWorkflow, 'org-1', 'user-1', undefined, existingTaskId);

      // Should NOT create a new parent task
      const createCalls = mockPrisma.agentTask.create.mock.calls;
      const parentCreates = createCalls.filter(
        (c: any) => c[0].data.workflowId === 'test-workflow' && !c[0].data.parentTaskId
      );
      expect(parentCreates).toHaveLength(0);

      // Should update the existing task to IN_PROGRESS
      expect(mockPrisma.agentTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: existingTaskId },
          data: expect.objectContaining({ status: 'IN_PROGRESS' }),
        })
      );

      expect(result.parentTaskId).toBe(existingTaskId);
    });

    it('creates a new parent task when no existingTaskId provided', async () => {
      mockPrisma.agentTask.create.mockResolvedValueOnce({
        id: 'new-parent-task',
        organisationId: 'org-1',
        userId: 'user-1',
      });
      // Subsequent creates are step tasks
      mockPrisma.agentTask.create.mockResolvedValue({ id: 'step-task' });

      const result = await executor.execute(twoStepWorkflow, 'org-1', 'user-1');

      expect(result.parentTaskId).toBe('new-parent-task');
    });
  });

  describe('executeSteps() — zero remaining steps', () => {
    it('marks parent COMPLETED when startIndex >= steps.length', async () => {
      // Simulate resume after last step approval gate
      const parentTask = { id: 'parent-1', organisationId: 'org-1', userId: 'user-1' };

      mockPrisma.agentTask.findUnique.mockResolvedValueOnce({
        ...parentTask,
        childTasks: [
          { id: 'step-0', stepIndex: 0, status: 'COMPLETED', result: 'done' },
        ],
      });
      mockPrisma.agentTask.update.mockResolvedValue(parentTask);

      const singleStepWorkflow: WorkflowDefinition = {
        id: 'single-step',
        name: 'Single Step',
        description: 'One step with gate',
        tags: [],
        steps: [
          { name: 'Only Step', instruction: 'Do it', requiredServers: [], approvalGate: true },
        ],
      };

      const result = await executor.resume(singleStepWorkflow, 'parent-1', 'Action APPROVED');

      expect(result.status).toBe('completed');
      // Should mark parent COMPLETED
      expect(mockPrisma.agentTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'parent-1' },
          data: expect.objectContaining({ status: 'COMPLETED' }),
        })
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd gateway && npx vitest run src/workflows/__tests__/workflow-executor.test.ts`
Expected: FAIL — `execute()` doesn't accept `existingTaskId`, `resume()` doesn't exist

- [ ] **Step 3: Refactor execute() — extract executeSteps(), add existingTaskId param**

Modify `gateway/src/workflows/workflow-executor.ts`. The full updated file:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd gateway && npx vitest run src/workflows/__tests__/workflow-executor.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Run existing tests to check for regressions**

Run: `cd gateway && npx vitest run`
Expected: All existing tests still PASS

- [ ] **Step 6: Commit**

```bash
git add gateway/src/workflows/workflow-executor.ts gateway/src/workflows/__tests__/workflow-executor.test.ts
git commit -m "feat(workflows): refactor executeSteps, add resume() and existingTaskId support"
```

---

## Chunk 3: Scheduler workflow pickup + workflow-aware resume

### Task 3: Add processWorkflowTasks() and modify processAwaitingApprovalTasks()

**Files:**
- Modify: `gateway/src/scheduler/scheduler.service.ts`
- Create: `gateway/src/scheduler/__tests__/scheduler.service.test.ts`

- [ ] **Step 1: Write tests for processWorkflowTasks()**

Create `gateway/src/scheduler/__tests__/scheduler.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  agentTask: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
  },
  agentSchedule: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  chatConversation: {
    create: vi.fn(),
  },
  mcpPendingAction: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
};

vi.mock('../../prisma.js', () => ({ prisma: mockPrisma }));
vi.mock('../../logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

import { SchedulerService } from '../scheduler.service.js';

function makeMockRunner() {
  return { execute: vi.fn().mockResolvedValue(undefined) } as any;
}

function makeMockQueue() {
  return {
    enqueue: vi.fn().mockImplementation(async (job: any) => {
      // Execute the job immediately in tests
      const ac = new AbortController();
      await job.execute(ac.signal);
      return { success: true };
    }),
  } as any;
}

describe('SchedulerService', () => {
  let scheduler: SchedulerService;
  let mockRunner: ReturnType<typeof makeMockRunner>;
  let mockQueue: ReturnType<typeof makeMockQueue>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRunner = makeMockRunner();
    mockQueue = makeMockQueue();
    scheduler = new SchedulerService(mockRunner, mockQueue, 60_000);

    // Default: no due schedules
    mockPrisma.agentSchedule.findMany.mockResolvedValue([]);
  });

  describe('processWorkflowTasks', () => {
    it('picks up PENDING workflow tasks and executes them', async () => {
      const pendingWorkflowTask = {
        id: 'task-1',
        workflowId: 'weekly-risk-review',
        status: 'PENDING',
        parentTaskId: null,
        organisationId: 'org-1',
        userId: 'user-1',
      };

      // First call: workflow tasks query returns our task
      // Second call: awaiting approval query returns empty
      mockPrisma.agentTask.findMany
        .mockResolvedValueOnce([pendingWorkflowTask])  // processWorkflowTasks
        .mockResolvedValueOnce([]);                     // processAwaitingApprovalTasks

      // Mock for execute's parent task update
      mockPrisma.agentTask.update.mockResolvedValue({ id: 'task-1', organisationId: 'org-1', userId: 'user-1' });
      mockPrisma.agentTask.findUnique.mockResolvedValue({ status: 'COMPLETED', result: 'done' });
      mockPrisma.chatConversation.create.mockResolvedValue({ id: 'conv-1' });
      mockPrisma.agentTask.create.mockResolvedValue({ id: 'step-task-1' });

      // Trigger one tick manually
      await (scheduler as any).tick();

      // Should have marked task IN_PROGRESS before enqueueing
      expect(mockPrisma.agentTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-1' },
          data: expect.objectContaining({ status: 'IN_PROGRESS' }),
        })
      );

      // Should have enqueued a job
      expect(mockQueue.enqueue).toHaveBeenCalled();
    });

    it('marks task FAILED when workflow definition not found', async () => {
      const unknownWorkflowTask = {
        id: 'task-2',
        workflowId: 'nonexistent-workflow',
        status: 'PENDING',
        parentTaskId: null,
        organisationId: 'org-1',
        userId: 'user-1',
      };

      mockPrisma.agentTask.findMany
        .mockResolvedValueOnce([unknownWorkflowTask])
        .mockResolvedValueOnce([]);

      mockPrisma.agentTask.update.mockResolvedValue({});

      await (scheduler as any).tick();

      expect(mockPrisma.agentTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-2' },
          data: expect.objectContaining({
            status: 'FAILED',
            errorMessage: expect.stringContaining('nonexistent-workflow'),
          }),
        })
      );
    });

    it('catches queue full errors and reverts task to PENDING', async () => {
      const task = {
        id: 'task-3',
        workflowId: 'weekly-risk-review',
        status: 'PENDING',
        parentTaskId: null,
        organisationId: 'org-1',
        userId: 'user-1',
      };

      mockPrisma.agentTask.findMany
        .mockResolvedValueOnce([task])
        .mockResolvedValueOnce([]);

      mockPrisma.agentTask.update.mockResolvedValue({ id: 'task-3', organisationId: 'org-1', userId: 'user-1' });
      mockQueue.enqueue.mockRejectedValueOnce(new Error('Queue full for this user'));

      await (scheduler as any).tick();

      // Should revert to PENDING
      const updateCalls = mockPrisma.agentTask.update.mock.calls;
      const revertCall = updateCalls.find(
        (c: any) => c[0].where.id === 'task-3' && c[0].data.status === 'PENDING'
      );
      expect(revertCall).toBeDefined();
    });
  });

  describe('processAwaitingApprovalTasks — workflow-aware', () => {
    it('queries only top-level tasks (parentTaskId: null)', async () => {
      mockPrisma.agentTask.findMany
        .mockResolvedValueOnce([])   // processWorkflowTasks
        .mockResolvedValueOnce([]);  // processAwaitingApprovalTasks

      await (scheduler as any).tick();

      // The second findMany call (awaiting approval) should filter parentTaskId
      const awaitingCall = mockPrisma.agentTask.findMany.mock.calls[1];
      expect(awaitingCall[0].where).toEqual(
        expect.objectContaining({
          status: 'AWAITING_APPROVAL',
          parentTaskId: null,
        })
      );
    });

    it('uses workflow resume path when task has workflowId', async () => {
      const workflowTask = {
        id: 'parent-1',
        workflowId: 'incident-response-flow',
        status: 'AWAITING_APPROVAL',
        parentTaskId: null,
        organisationId: 'org-1',
        userId: 'user-1',
        actionIds: [],
        instruction: 'Execute workflow',
        result: null,
      };

      mockPrisma.agentTask.findMany
        .mockResolvedValueOnce([])              // processWorkflowTasks (no pending)
        .mockResolvedValueOnce([workflowTask]); // processAwaitingApprovalTasks

      // The child step task holds the actionIds
      const childStepTask = {
        id: 'step-task-3',
        stepIndex: 3,
        status: 'AWAITING_APPROVAL',
        actionIds: ['action-1'],
        result: 'proposed treatment',
      };

      // findMany for child tasks with actionIds
      mockPrisma.agentTask.findMany.mockResolvedValueOnce([childStepTask]);

      // All actions resolved
      mockPrisma.mcpPendingAction.count.mockResolvedValue(0);
      mockPrisma.mcpPendingAction.findMany.mockResolvedValue([
        { id: 'action-1', actionType: 'CREATE_TREATMENT_PLAN', status: 'APPROVED', summary: 'Treatment', reviewNotes: 'Good', errorMessage: null },
      ]);

      // Mock for resume flow
      mockPrisma.agentTask.findUnique.mockResolvedValue({
        id: 'parent-1',
        organisationId: 'org-1',
        userId: 'user-1',
        childTasks: [
          { id: 'step-0', stepIndex: 0, status: 'COMPLETED', result: 'analysis done' },
          { id: 'step-1', stepIndex: 1, status: 'COMPLETED', result: 'gaps found' },
          { id: 'step-2', stepIndex: 2, status: 'COMPLETED', result: 'risks assessed' },
          { id: 'step-task-3', stepIndex: 3, status: 'AWAITING_APPROVAL', result: 'proposed treatment' },
        ],
      });
      mockPrisma.agentTask.update.mockResolvedValue({});
      mockPrisma.chatConversation.create.mockResolvedValue({ id: 'conv-resume' });

      await (scheduler as any).tick();

      // Should have enqueued a resume job through the queue
      expect(mockQueue.enqueue).toHaveBeenCalled();

      // Should have marked parent IN_PROGRESS for resume
      expect(mockPrisma.agentTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'parent-1' },
          data: expect.objectContaining({ status: 'IN_PROGRESS' }),
        })
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd gateway && npx vitest run src/scheduler/__tests__/scheduler.service.test.ts`
Expected: FAIL — `processWorkflowTasks` doesn't exist, `processAwaitingApprovalTasks` doesn't filter `parentTaskId`

- [ ] **Step 3: Implement scheduler changes**

Modify `gateway/src/scheduler/scheduler.service.ts`:

1. Add import at top:
```typescript
import { WorkflowExecutor } from '../workflows/workflow-executor.js';
import { getWorkflowById } from '../workflows/types.js';
```

2. Add `workflowExecutor` field and constructor change:
```typescript
private workflowExecutor: WorkflowExecutor;

constructor(agentRunner: AgentRunner, queue: LaneQueue, pollIntervalMs = 60_000) {
  this.agentRunner = agentRunner;
  this.queue = queue;
  this.pollIntervalMs = pollIntervalMs;
  this.workflowExecutor = new WorkflowExecutor(agentRunner);
}
```

3. Add `processWorkflowTasks()` call to `tick()`:
```typescript
private async tick(): Promise<void> {
  this.running = true;
  try {
    await this.processDueSchedules();
    await this.processWorkflowTasks();
    await this.processAwaitingApprovalTasks();
  } finally {
    this.running = false;
  }
}
```

4. Add `processWorkflowTasks()` method (after `processDueSchedules()`):
```typescript
/**
 * Find PENDING workflow tasks (created by trigger endpoint) and execute them.
 */
private async processWorkflowTasks(): Promise<void> {
  const pendingWorkflows = await prisma.agentTask.findMany({
    where: {
      workflowId: { not: null },
      status: 'PENDING',
      parentTaskId: null,
    },
    take: 5,
  });

  for (const task of pendingWorkflows) {
    const workflow = getWorkflowById(task.workflowId!);
    if (!workflow) {
      await prisma.agentTask.update({
        where: { id: task.id },
        data: {
          status: 'FAILED',
          errorMessage: `Unknown workflow: ${task.workflowId}`,
          completedAt: new Date(),
        },
      });
      logger.error({ taskId: task.id, workflowId: task.workflowId }, 'Unknown workflow definition');
      continue;
    }

    // Mark IN_PROGRESS immediately to prevent re-pickup
    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: 'IN_PROGRESS' },
    });

    logger.info({ taskId: task.id, workflowId: workflow.id }, 'Executing workflow');

    const job: Job = {
      id: `workflow-${task.id}`,
      userId: `scheduler-workflow-${task.organisationId}`,
      execute: async (_signal) => {
        await this.workflowExecutor.execute(
          workflow,
          task.organisationId,
          task.userId || 'system',
          undefined,
          task.id,
        );
        return { success: true };
      },
    };

    try {
      await this.queue.enqueue(job);
    } catch (err) {
      logger.warn({ err, taskId: task.id }, 'Failed to enqueue workflow, reverting to PENDING');
      await prisma.agentTask.update({
        where: { id: task.id },
        data: { status: 'PENDING' },
      });
    }
  }
}
```

5. **Replace** the entire `processAwaitingApprovalTasks()` method body. The workflow branch must come **before** the `task.actionIds.length === 0` guard (which would auto-complete workflow parent tasks since they have no actionIds). One unified version:

```typescript
/**
 * Check tasks in AWAITING_APPROVAL — if all linked actions are resolved, trigger a resume run.
 */
private async processAwaitingApprovalTasks(): Promise<void> {
  const awaitingTasks = await prisma.agentTask.findMany({
    where: {
      status: 'AWAITING_APPROVAL',
      parentTaskId: null,      // Only top-level tasks — child step tasks managed by executor
    },
    take: 20,
  });

  for (const task of awaitingTasks) {
    // --- WORKFLOW TASKS: actionIds live on child step tasks, not the parent ---
    if (task.workflowId) {
      const childTasks = await prisma.agentTask.findMany({
        where: { parentTaskId: task.id, status: 'AWAITING_APPROVAL' },
        select: { actionIds: true },
      });
      const allChildActionIds = childTasks.flatMap((c) => c.actionIds);

      if (allChildActionIds.length === 0) {
        // No child actions to await — mark completed
        await prisma.agentTask.update({
          where: { id: task.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        continue;
      }

      // Check if all child actions are resolved
      const childPendingCount = await prisma.mcpPendingAction.count({
        where: { id: { in: allChildActionIds }, status: 'PENDING' },
      });

      if (childPendingCount > 0) continue; // Still waiting

      // All resolved — get outcomes
      const childActions = await prisma.mcpPendingAction.findMany({
        where: { id: { in: allChildActionIds } },
        select: { id: true, actionType: true, status: true, summary: true, reviewNotes: true, errorMessage: true },
      });

      const outcomes = childActions.map((a) => {
        let detail = `- ${a.actionType}: ${a.status}`;
        if (a.reviewNotes) detail += ` (Notes: ${a.reviewNotes})`;
        if (a.errorMessage) detail += ` (Error: ${a.errorMessage})`;
        return detail;
      }).join('\n');

      const workflow = getWorkflowById(task.workflowId);
      if (!workflow) {
        await prisma.agentTask.update({
          where: { id: task.id },
          data: { status: 'FAILED', errorMessage: `Cannot resume: unknown workflow ${task.workflowId}`, completedAt: new Date() },
        });
        continue;
      }

      // Mark IN_PROGRESS before enqueueing to prevent re-pickup on next tick
      await prisma.agentTask.update({
        where: { id: task.id },
        data: { status: 'IN_PROGRESS' },
      });

      logger.info({ taskId: task.id, workflowId: workflow.id }, 'Resuming workflow after approval');

      const resumeJob: Job = {
        id: `workflow-resume-${task.id}`,
        userId: `scheduler-workflow-${task.organisationId}`,
        execute: async (_signal) => {
          await this.workflowExecutor.resume(workflow, task.id, outcomes);
          return { success: true };
        },
      };

      try {
        await this.queue.enqueue(resumeJob);
      } catch (err) {
        logger.error({ err, taskId: task.id }, 'Workflow resume enqueue failed');
        // Revert to AWAITING_APPROVAL for retry
        await prisma.agentTask.update({
          where: { id: task.id },
          data: { status: 'AWAITING_APPROVAL' },
        });
      }
      continue;
    }

    // --- STANDALONE (non-workflow) TASKS: existing logic unchanged ---
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

    // Route through LaneQueue for mutual exclusion
    const resumeJob: Job = {
      id: syntheticMsg.id,
      userId: `scheduler-resume-${task.id}`,
      execute: async (signal) => {
        await this.agentRunner.execute(syntheticMsg, signal, (_event: ChatEvent) => {}, childTask.id);
        return { success: true };
      },
    };

    try {
      await this.queue.enqueue(resumeJob);
    } catch (err) {
      logger.error({ err, taskId: childTask.id }, 'Approval resume task failed');
    }
  }
}
```

- [ ] **Step 4: Run scheduler tests**

Run: `cd gateway && npx vitest run src/scheduler/__tests__/scheduler.service.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Run all tests**

Run: `cd gateway && npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add gateway/src/scheduler/scheduler.service.ts gateway/src/scheduler/__tests__/scheduler.service.test.ts
git commit -m "feat(scheduler): add workflow pickup and workflow-aware approval resume"
```

---

## Chunk 4: Integration verification

### Task 4: End-to-end verification

**Files:** None modified — verification only

- [ ] **Step 1: Verify TypeScript compiles**

Run: `cd gateway && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 2: Run full test suite**

Run: `cd gateway && npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Verify the trigger endpoint → executor flow manually**

Check that the NestJS controller creates tasks with the right shape by reading:
- `apps/server/src/agent-workflow/agent-workflow.controller.ts` — confirm `triggerWorkflow()` creates `AgentTask` with `workflowId`, `status: 'PENDING'`, `parentTaskId: null`
- Confirm this matches the `processWorkflowTasks()` query filter

- [ ] **Step 4: Final commit with all files**

```bash
git add -A
git status  # verify only expected files
git commit -m "feat: complete Phase 4 workflow wiring — executor, scheduler, resume"
```
