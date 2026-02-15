import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

interface SearchResult {
  id: string;
  type: string;
  content: string;
  tags: string[];
  score: number;
}

export class SearchService {
  constructor(private prisma: PrismaClient) {}

  async hybridSearch(params: {
    query: string;
    embedding?: number[];
    organisationId: string;
    userId?: string;
    limit?: number;
  }): Promise<SearchResult[]> {
    const { query, embedding, organisationId, userId, limit = 10 } = params;

    // Build the userId filter: always include org-level (NULL), optionally include user-specific
    const userFilter = userId
      ? Prisma.sql`AND (m."userId" IS NULL OR m."userId" = ${userId})`
      : Prisma.sql`AND m."userId" IS NULL`;

    if (embedding && embedding.length === 1536) {
      const results = await this.prisma.$queryRaw<SearchResult[]>`
        SELECT
          m.id,
          m.type,
          m.content,
          m.tags,
          (
            0.6 * (1 - (m.embedding <=> ${embedding}::vector)) +
            0.4 * COALESCE(ts_rank(m.search_vector, plainto_tsquery('english', ${query})), 0)
          ) AS score
        FROM "Memory" m
        WHERE m."organisationId" = ${organisationId}
          ${userFilter}
          AND (m."expiresAt" IS NULL OR m."expiresAt" > NOW())
        ORDER BY score DESC
        LIMIT ${limit}
      `;
      return results;
    }

    const results = await this.prisma.$queryRaw<SearchResult[]>`
      SELECT
        m.id,
        m.type,
        m.content,
        m.tags,
        ts_rank(m.search_vector, plainto_tsquery('english', ${query})) AS score
      FROM "Memory" m
      WHERE m."organisationId" = ${organisationId}
        ${userFilter}
        AND (m."expiresAt" IS NULL OR m."expiresAt" > NOW())
        AND m.search_vector @@ plainto_tsquery('english', ${query})
      ORDER BY score DESC
      LIMIT ${limit}
    `;
    return results;
  }
}
