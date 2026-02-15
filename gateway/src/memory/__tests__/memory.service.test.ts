import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryService } from '../memory.service.js';

const mockPrisma = {
  memory: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  $queryRaw: vi.fn(),
};

describe('MemoryService', () => {
  let service: MemoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MemoryService(mockPrisma as any);
  });

  it('stores a memory entry', async () => {
    mockPrisma.memory.create.mockResolvedValue({
      id: 'mem-1',
      type: 'KNOWLEDGE',
      content: 'User prefers ISO 27001',
      tags: ['iso27001'],
      source: 'ai_distilled',
      organisationId: 'org-1',
      userId: 'user-1',
    });

    const result = await service.store({
      type: 'KNOWLEDGE',
      content: 'User prefers ISO 27001',
      tags: ['iso27001'],
      source: 'ai_distilled',
      organisationId: 'org-1',
      userId: 'user-1',
    });

    expect(result.id).toBe('mem-1');
    expect(mockPrisma.memory.create).toHaveBeenCalledOnce();
  });

  it('recalls memories for org and user', async () => {
    mockPrisma.memory.findMany.mockResolvedValue([
      { id: 'mem-1', content: 'relevant memory', type: 'KNOWLEDGE' },
    ]);

    const results = await service.recallSimple('org-1', 'user-1', 10);

    expect(results).toHaveLength(1);
    expect(mockPrisma.memory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organisationId: 'org-1' }),
      }),
    );
  });

  it('cleans up expired memories', async () => {
    mockPrisma.memory.deleteMany.mockResolvedValue({ count: 3 });

    const count = await service.cleanupExpired();

    expect(count).toBe(3);
    expect(mockPrisma.memory.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          expiresAt: expect.objectContaining({ lt: expect.any(Date) }),
        }),
      }),
    );
  });
});
