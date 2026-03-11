import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
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
  },
}));

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
        title: 'Workflow: Incident Response Flow',
      };

      mockPrisma.agentTask.findMany
        .mockResolvedValueOnce([])              // processWorkflowTasks (no pending)
        .mockResolvedValueOnce([workflowTask])  // processAwaitingApprovalTasks
        .mockResolvedValueOnce([{               // child step tasks query
          id: 'step-task-3',
          stepIndex: 3,
          status: 'AWAITING_APPROVAL',
          actionIds: ['action-1'],
          result: 'proposed treatment',
        }]);

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

      // Should have marked parent IN_PROGRESS for resume (pre-enqueue)
      expect(mockPrisma.agentTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'parent-1' },
          data: expect.objectContaining({ status: 'IN_PROGRESS' }),
        })
      );
    });
  });
});
