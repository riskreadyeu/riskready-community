import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted — use vi.hoisted for shared mock state
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
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
  },
}));

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
