import type { PrismaClient, ChatMessage } from '@prisma/client';
import { MemoryService } from './memory.service.js';
import { logger } from '../logger.js';

const DISTILL_PROMPT = `Analyze this conversation and extract key information to remember for future conversations. Extract:

1. PREFERENCES: Any stated user preferences or communication style notes
2. CONTEXT: Organization-specific context (industry, regulations, team structure, processes)
3. KNOWLEDGE: Key facts, decisions, or conclusions reached

For each item, provide:
- type: PREFERENCE | CONTEXT | KNOWLEDGE
- content: A concise, factual statement (1-2 sentences max)
- tags: Relevant keywords for search

Respond ONLY with a JSON array of objects. If there's nothing worth remembering, respond with [].

Example:
[
  {"type": "PREFERENCE", "content": "User prefers detailed risk matrices over heat maps", "tags": ["risk", "visualization", "preference"]},
  {"type": "CONTEXT", "content": "Organization is in financial services sector, subject to DORA regulation", "tags": ["dora", "financial", "regulation"]}
]`;

export class MemoryDistiller {
  constructor(
    private memoryService: MemoryService,
    private callLLM: (prompt: string) => Promise<string>,
  ) {}

  async distillConversation(
    messages: ChatMessage[],
    organisationId: string,
    userId: string,
  ): Promise<number> {
    if (messages.length < 2) return 0;

    const transcript = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    const prompt = `${DISTILL_PROMPT}\n\nConversation:\n${transcript}`;

    try {
      const response = await this.callLLM(prompt);

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return 0;

      const items = JSON.parse(jsonMatch[0]) as Array<{
        type: 'PREFERENCE' | 'CONTEXT' | 'KNOWLEDGE';
        content: string;
        tags: string[];
      }>;

      let stored = 0;
      for (const item of items) {
        if (!item.content || !item.type) continue;
        await this.memoryService.store({
          type: item.type,
          content: item.content,
          tags: item.tags ?? [],
          source: 'ai_distilled',
          organisationId,
          userId,
        });
        stored++;
      }

      return stored;
    } catch (err) {
      logger.error({ err }, 'Failed to distill conversation');
      return 0;
    }
  }
}
