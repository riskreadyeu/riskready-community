# Phase 4: Wire WorkflowExecutor Into Scheduler

**Date:** 2026-03-11
**Status:** Approved
**Approach:** Scheduler Owns Workflows (Approach 1)

## Problem

The Phase 4 cross-domain workflow system has all building blocks implemented but they are not connected:

1. `WorkflowExecutor` exists but is never instantiated
2. `POST /agent-workflows/trigger` creates a PENDING `AgentTask` with `workflowId`, but nothing picks it up
3. Approval resume creates a standalone child task instead of re-entering the workflow at the next step

## Solution

Five focused changes to three existing files. No new files, no new architectural concepts.

### Change 1: `getWorkflowById()` helper

**File:** `gateway/src/workflows/types.ts`

Add a lookup function:

```typescript
export function getWorkflowById(id: string): WorkflowDefinition | undefined {
  return BUILT_IN_WORKFLOWS.find((w) => w.id === id);
}
```

### Change 2: Refactor step loop into shared method

**File:** `gateway/src/workflows/workflow-executor.ts`

Extract the step execution loop from `execute()` into a private method:

```typescript
private async executeSteps(
  workflow: WorkflowDefinition,
  parentTask: { id: string; organisationId: string; userId?: string | null },
  startIndex: number,
  cumulativeContext: string,
  execution: WorkflowExecution,
  emit?: (event: ChatEvent) => void,
): Promise<WorkflowExecution>
```

Both `execute()` and `resume()` call this shared method. `execute()` creates/updates the parent task then calls `executeSteps(workflow, parentTask, 0, '', execution, emit)`. `resume()` rebuilds context from completed steps then calls `executeSteps(workflow, parentTask, resumeIndex, context, execution, emit)`.

**Edge case: zero remaining steps.** When `startIndex >= workflow.steps.length` (e.g., resume after approval gate on the last step), `executeSteps()` skips the loop and marks the parent task COMPLETED. The "all steps completed" update (currently lines 178-188 of workflow-executor.ts) must be inside `executeSteps()`, not in `execute()`, so it fires correctly for both initial execution and resume.

### Change 3: `WorkflowExecutor.resume()` method

**File:** `gateway/src/workflows/workflow-executor.ts`

```typescript
async resume(
  workflow: WorkflowDefinition,
  parentTaskId: string,
  approvalOutcomes: string,
  emit?: (event: ChatEvent) => void,
): Promise<WorkflowExecution>
```

Steps:
1. Load parent task with child tasks ordered by `stepIndex`
2. Find the last completed step index
3. Rebuild cumulative context from completed child task results
4. Append approval outcomes to cumulative context
5. Set parent task status back to `IN_PROGRESS`
6. Call `executeSteps()` starting from `lastStepIndex + 1`

### Change 4: `WorkflowExecutor.execute()` — accept existing task ID

**File:** `gateway/src/workflows/workflow-executor.ts`

Modify `execute()` to accept an optional `existingTaskId` parameter:

```typescript
async execute(
  workflow: WorkflowDefinition,
  organisationId: string,
  userId: string = 'system',
  emit?: (event: ChatEvent) => void,
  existingTaskId?: string,    // NEW
): Promise<WorkflowExecution>
```

When `existingTaskId` is provided (i.e., the trigger endpoint already created the parent task), update the existing task to `IN_PROGRESS` instead of creating a new one. This prevents duplicate parent tasks and stops the scheduler from re-picking the same PENDING task on every tick.

When `existingTaskId` is not provided (e.g., direct programmatic invocation), create a new parent task as before.

### Change 5: `SchedulerService.processWorkflowTasks()`

**File:** `gateway/src/scheduler/scheduler.service.ts`

New private method added to the `tick()` loop:

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

`processWorkflowTasks()`:
- Queries `AgentTask` where `workflowId IS NOT NULL AND status = PENDING AND parentTaskId IS NULL`
- Takes up to 5 at a time
- For each: resolves workflow definition via `getWorkflowById()`
- If definition not found: marks task FAILED with error message
- Otherwise: **immediately marks task as IN_PROGRESS** (prevents re-pickup on next tick), then enqueues execution through `LaneQueue` calling `workflowExecutor.execute(workflow, orgId, userId, emit, task.id)`
- **Error handling:** Wraps `this.queue.enqueue()` in try/catch. If queue is full, logs warning and reverts task to PENDING for retry on next tick. Mirrors the existing pattern in `processAwaitingApprovalTasks()`.

Constructor change: instantiate `WorkflowExecutor` from the existing `AgentRunner`.

### Change 6: Workflow-aware approval resume

**File:** `gateway/src/scheduler/scheduler.service.ts`

Modify `processAwaitingApprovalTasks()`:

**Query filter change:** Add `parentTaskId: null` to the query. This excludes workflow child step tasks from the approval resume loop entirely. Child step tasks are managed by the workflow executor — they should not be independently resumed by the scheduler.

```typescript
const awaitingTasks = await prisma.agentTask.findMany({
  where: {
    status: 'AWAITING_APPROVAL',
    parentTaskId: null,           // NEW: only top-level tasks
  },
  take: 20,
});
```

**Branch on `task.workflowId`:**

- **If `task.workflowId` is set:** Load workflow definition via `getWorkflowById()`, build approval outcomes string (same logic as current), call `workflowExecutor.resume(workflow, task.id, outcomes)` through `LaneQueue`. Mark the task IN_PROGRESS before enqueueing.
- **If no `workflowId`:** Existing standalone resume path (unchanged)

## Edge Cases Addressed

| Edge Case | Handling |
|-----------|----------|
| Workflow definition not found | `processWorkflowTasks()` marks task FAILED with `"Unknown workflow: {id}"` |
| Resume when no steps remain | `executeSteps()` handles `startIndex >= steps.length` by marking parent COMPLETED |
| Duplicate parent task on trigger | `execute()` accepts `existingTaskId`, updates instead of creating |
| Re-pickup on next tick | Task marked IN_PROGRESS before enqueueing; PENDING tasks with IN_PROGRESS status are not re-queried |
| Queue full on enqueue | try/catch logs warning, reverts task to PENDING for retry |
| Child step tasks in AWAITING_APPROVAL | `parentTaskId: null` filter excludes them from scheduler's approval loop |
| Parent workflow task with no actionIds | `parentTaskId: null` filter + `workflowId` branch prevents premature auto-complete |

## Files Changed

| File | Change |
|------|--------|
| `gateway/src/workflows/types.ts` | Add `getWorkflowById()` |
| `gateway/src/workflows/workflow-executor.ts` | Refactor step loop into `executeSteps()`, add `resume()`, add `existingTaskId` param to `execute()` |
| `gateway/src/scheduler/scheduler.service.ts` | Add `processWorkflowTasks()`, workflow-aware resume, `parentTaskId: null` filter, constructor change |

## What Does NOT Change

- `gateway/src/gateway.ts` — no changes needed, scheduler already receives AgentRunner
- `apps/server/src/agent-workflow/agent-workflow.controller.ts` — trigger endpoint already creates PENDING tasks correctly
- Prisma schema — no model changes needed
- All other phases (1, 2, 3, 5) — untouched

## Execution Flow

### Trigger flow
```
User: POST /agent-workflows/trigger { workflowId: "weekly-risk-review" }
  -> NestJS creates AgentTask (workflowId="weekly-risk-review", status=PENDING, parentTaskId=null)
  -> Scheduler tick: processWorkflowTasks() finds it
  -> Marks task IN_PROGRESS immediately
  -> getWorkflowById("weekly-risk-review") returns definition
  -> WorkflowExecutor.execute(definition, orgId, userId, emit, existingTaskId)
  -> execute() updates existing task instead of creating new one
  -> Steps execute sequentially with cumulative context
  -> Parent task marked COMPLETED
```

### Approval gate flow
```
WorkflowExecutor hits step with approvalGate=true
  -> Step produces McpPendingAction proposals
  -> AgentRunner sets step task to AWAITING_APPROVAL (has parentTaskId, excluded from scheduler)
  -> WorkflowExecutor sets parent task to AWAITING_APPROVAL (parentTaskId=null, included in scheduler)
  -> ... human approves/rejects actions ...
  -> Scheduler tick: processAwaitingApprovalTasks() finds parent task (parentTaskId=null)
  -> Parent task has workflowId -> workflow resume path
  -> Checks child step task's actionIds for resolution
  -> WorkflowExecutor.resume(workflow, parentTaskId, outcomes)
  -> Rebuilds context from completed steps + approval outcomes
  -> Continues from next step (or marks COMPLETED if no steps remain)
```

### Scheduled workflow flow
```
AgentSchedule with instruction containing workflowId
  -> processDueSchedules() creates AgentTask (same as today)
  -> This is a regular scheduled task, NOT a workflow task
  -> Workflows are triggered via the trigger endpoint or future schedule integration
```
