import type { PrismaClient, MemoryType } from '@prisma/client';

interface StoreMemoryInput {
  type: MemoryType;
  content: string;
  tags: string[];
  source: string;
  organisationId: string;
  userId?: string;
  expiresAt?: Date;
}

export class MemoryService {
  constructor(private prisma: PrismaClient) {}

  async store(input: StoreMemoryInput) {
    return this.prisma.memory.create({
      data: {
        type: input.type,
        content: input.content,
        tags: input.tags,
        source: input.source,
        organisationId: input.organisationId,
        userId: input.userId ?? null,
        expiresAt: input.expiresAt ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90-day default TTL
      },
    });
  }

  async recallSimple(organisationId: string, userId: string, limit: number) {
    return this.prisma.memory.findMany({
      where: {
        organisationId,
        AND: [
          { OR: [{ userId: null }, { userId }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.memory.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
