// gateway/src/agent/agent-runner.ts

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../prisma.js';
import { logger } from '../logger.js';
import { SYSTEM_PROMPT } from './system-prompt.js';
import type { UnifiedMessage, ChatEvent } from '../channels/types.js';
import { MemoryService } from '../memory/memory.service.js';
import { SearchService } from '../memory/search.service.js';
import { MemoryDistiller } from '../memory/distiller.js';
import { extractBlock } from './block-extractor.js';
import { extractActionIdsFromToolResults } from './action-id-extractor.js';
import { resolveConversationModel } from '../model-resolution.js';
import { applyGroundingGuard, type GuardToolResult, withFallbackGroundingToolResults } from '../grounding-guard.js';
import { runMessageLoop } from './message-loop.js';
import { McpToolExecutor } from './mcp-tool-executor.js';
import { buildToolDefinitions } from './tool-builder.js';
import { buildConversationMessages } from './conversation-builder.js';
import type { FullToolSchema } from './tool-schema-loader.js';
import type { SkillRegistry } from './skill-registry.js';

interface HistoryMessage {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

export interface AgentRunnerDeps {
  databaseUrl: string;
  getMcpServers: (messageText?: string) => Record<string, { command: string; args: string[]; env?: Record<string, string> }>;
  memoryService?: MemoryService;
  searchService?: SearchService;
  distiller?: MemoryDistiller;
  getDbConfig?: (organisationId: string) => Promise<{ anthropicApiKey?: string; agentModel: string; maxAgentTurns: number } | null>;
  toolSchemas?: FullToolSchema[];
  skillRegistry?: SkillRegistry;
  basePath?: string;
}

export interface CouncilHook {
  shouldConvene(message: string): boolean;
  deliberate(
    question: string,
    organisationId: string,
    conversationId: string,
    signal: AbortSignal,
    emit: (event: ChatEvent) => void,
    mcpServers: Record<string, { command: string; args: string[]; env?: Record<string, string> }>,
    getDbConfig?: (organisationId: string) => Promise<{ anthropicApiKey?: string; agentModel: string; maxAgentTurns: number } | null>,
  ): Promise<{ text: string; sessionId: string }>;
}

export class AgentRunner {
  private deps: AgentRunnerDeps;
  private councilHook: CouncilHook | null = null;

  constructor(deps: AgentRunnerDeps) {
    this.deps = deps;
  }

  setCouncilHook(hook: CouncilHook): void {
    this.councilHook = hook;
  }

  updateToolSchemas(schemas: FullToolSchema[]): void {
    this.deps.toolSchemas = schemas;
  }

  private async ensureConversation(
    conversationId: string,
    msg: UnifiedMessage,
  ) {
    const existing = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });

    if (existing) {
      if (existing.userId !== msg.userId || existing.organisationId !== msg.organisationId) {
        throw new Error('Conversation does not belong to the supplied user and organisation.');
      }
      return existing;
    }

    return prisma.chatConversation.create({
      data: {
        id: conversationId,
        userId: msg.userId,
        organisationId: msg.organisationId,
      },
    });
  }

  async execute(
    msg: UnifiedMessage,
    signal: AbortSignal,
    emit: (event: ChatEvent) => void,
    taskId?: string,
  ): Promise<{ messageId: string }> {
    const conversationId = (msg.metadata.conversationId as string) ?? msg.channelId;

    // If running with a task, update status to IN_PROGRESS
    if (taskId) {
      try {
        await prisma.agentTask.update({
          where: { id: taskId },
          data: { status: 'IN_PROGRESS', conversationId },
        });
      } catch (err) {
        logger.warn({ err, taskId }, 'Failed to update task status to IN_PROGRESS');
      }
    }

    const conversation = await this.ensureConversation(conversationId, msg);

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content: msg.text,
        actionIds: [],
      },
    });

    // Auto-title conversation from first user message
    if (conversation && !conversation.title) {
      const title = msg.text.length > 80 ? msg.text.slice(0, 77) + '...' : msg.text;
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { title },
      });
    }

    // Touch updatedAt
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Build conversation history
    const history = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    // Recall relevant memories
    let memoryContext = '';
    if (this.deps.searchService) {
      try {
        const memories = await this.deps.searchService.hybridSearch({
          query: msg.text,
          organisationId: msg.organisationId,
          userId: msg.userId,
          limit: 10,
        });
        if (memories.length > 0) {
          memoryContext = '\n\nRelevant memories from previous conversations:\n' +
            memories.map((m) => `- [${m.type}] ${m.content}`).join('\n');
        }
      } catch (err) {
        logger.error({ err }, 'Memory recall failed');
      }
    }

    // Load task context if running with a task
    let taskContext = '';
    if (taskId) {
      try {
        const task = await prisma.agentTask.findUnique({
          where: { id: taskId },
          include: {
            childTasks: {
              select: { id: true, title: true, status: true, stepIndex: true },
              orderBy: { stepIndex: 'asc' },
            },
          },
        });
        if (task) {
          taskContext = `\n\nCurrent Task (ID: ${task.id}):
Title: ${task.title}
Instruction: ${task.instruction}
Status: ${task.status}
Trigger: ${task.trigger}`;
          if (task.result) taskContext += `\nPrevious result: ${task.result}`;
          if (task.actionIds.length > 0) taskContext += `\nLinked action IDs: ${task.actionIds.join(', ')}`;
          if (task.childTasks.length > 0) {
            taskContext += '\nSub-tasks:';
            for (const ct of task.childTasks) {
              taskContext += `\n  - [${ct.status}] ${ct.title}`;
            }
          }
        }
      } catch (err) {
        logger.warn({ err, taskId }, 'Failed to load task context');
      }
    }

    // Resolve per-org config
    let dbModel: string | undefined;
    let maxTurns = 25;
    let apiKey = process.env.ANTHROPIC_API_KEY;
    if (this.deps.getDbConfig) {
      const dbConfig = await this.deps.getDbConfig(msg.organisationId);
      if (dbConfig) {
        dbModel = dbConfig.agentModel || undefined;
        maxTurns = dbConfig.maxAgentTurns || maxTurns;
        if (dbConfig.anthropicApiKey) {
          apiKey = dbConfig.anthropicApiKey;
        }
      }
    }
    const model = resolveConversationModel({
      envModel: process.env.AGENT_MODEL,
      dbModel,
      conversationModel: conversation.model,
    });

    if (!apiKey) {
      throw new Error('No Anthropic API key configured');
    }

    if (!this.deps.toolSchemas?.length) {
      throw new Error('No tool schemas loaded — cannot run agent without tool definitions');
    }

    const client = new Anthropic({ apiKey });

    // Build server config accessor for the McpToolExecutor
    const executor = new McpToolExecutor({
      organisationId: msg.organisationId,
      getServerConfig: (serverName: string) => {
        if (!this.deps.skillRegistry || !this.deps.basePath) return undefined;
        const configs = this.deps.skillRegistry.getMcpServers(
          [serverName],
          this.deps.databaseUrl,
          this.deps.basePath,
        );
        return configs[serverName];
      },
    });

    let fullText = '';

    try {
      // Council decision: check if multi-agent deliberation is needed
      const mcpServers = this.deps.getMcpServers(msg.text);
      if (this.councilHook && this.councilHook.shouldConvene(msg.text)) {
        emit({ type: 'council_start' as ChatEvent['type'], message: 'Convening AI Agents Council for multi-perspective analysis...' });

        try {
          const result = await this.councilHook.deliberate(
            msg.text,
            msg.organisationId,
            conversationId,
            signal,
            emit,
            mcpServers,
            this.deps.getDbConfig,
          );

          fullText = result.text;

          // Emit text as delta for streaming
          emit({ type: 'text_delta', text: fullText });
          emit({ type: 'council_done' as ChatEvent['type'], message: 'Council deliberation complete' });
        } catch (err) {
          logger.error({ err }, 'Council deliberation failed, falling back to single agent');
          emit({ type: 'error', message: 'Council deliberation failed, using single agent...' });
          // Fall through to single-agent path below
        }
      }

      // Single-agent path (also fallback from council failure)
      let result: Awaited<ReturnType<typeof runMessageLoop>> | undefined;

      if (!fullText) {
        // Build conversation messages from history
        const pastMessages = (history as HistoryMessage[]).slice(0, -1); // exclude current user message
        const systemPromptWithContext = SYSTEM_PROMPT +
          (memoryContext ? `\n${memoryContext}` : '') +
          (taskContext ? `\n${taskContext}` : '') +
          `\n\nOrganisation ID: ${msg.organisationId}`;

        const messages = buildConversationMessages(pastMessages, msg.text);

        // Build tool definitions from loaded schemas
        const tools = buildToolDefinitions(this.deps.toolSchemas, {
          allowCodeExecution: false,
        });

        // Run the message loop
        result = await runMessageLoop({
          client,
          model,
          systemPrompt: systemPromptWithContext,
          messages,
          tools,
          maxTurns,
          signal,
          onEvent: emit,
          executeTool: (name, input) => executor.execute(name, input),
        });

        // Apply grounding guard
        const grounded = applyGroundingGuard({
          text: result.text || 'I was unable to generate a response.',
          toolResults: withFallbackGroundingToolResults(
            result.toolResults as GuardToolResult[],
            result.toolCalls,
          ),
        });
        fullText = grounded.text;
      }

      // Extract action IDs from tool results
      const collectedToolResults = result
        ? result.toolResults.map((tr) => ({
            content: tr.rawResult as string | Array<{ type?: string; text?: string }>,
          }))
        : [];
      const structuredIds = extractActionIdsFromToolResults(collectedToolResults);
      const regexIds: string[] = [];
      const regexPattern = /"actionId"\s*:\s*"([^"]+)"/g;
      let regexMatch;
      while ((regexMatch = regexPattern.exec(fullText)) !== null) {
        regexIds.push(regexMatch[1]);
      }
      const actionIds = [...new Set([...structuredIds, ...regexIds])];

      for (const actionId of actionIds) {
        emit({
          type: 'action_proposed',
          actionId,
          summary: 'Action proposed — check AI Approvals queue',
        });
      }

      // Extract blocks from tool results
      const blocks: Array<{ type: string; [key: string]: unknown }> = [];
      if (result) {
        for (const tr of result.toolResults) {
          const rawText = typeof tr.rawResult === 'string' ? tr.rawResult : JSON.stringify(tr.rawResult);
          const block = extractBlock(tr.toolName, rawText);
          if (block) {
            blocks.push(block);
            emit({ type: 'block', block });
          }
        }
      }

      // Log token usage
      const inputTokens = result?.usage.inputTokens ?? 0;
      const outputTokens = result?.usage.outputTokens ?? 0;
      if (inputTokens > 0 || outputTokens > 0) {
        logger.info({
          conversationId,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          toolCallCount: result?.toolCalls.length ?? 0,
        }, 'Token usage');
      }

      const toolCalls = result?.toolCalls ?? [];

      // Save assistant message
      const saved = await prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: fullText || 'I was unable to generate a response.',
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          actionIds: actionIds.length > 0 ? actionIds : [],
          blocks: blocks.length > 0 ? (blocks as any) : undefined,
          inputTokens: inputTokens || undefined,
          outputTokens: outputTokens || undefined,
          model: model || undefined,
        },
      });

      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      emit({ type: 'done', messageId: saved.id });

      // Update task with results if running with a task
      if (taskId) {
        try {
          const hasPendingActions = actionIds.length > 0;
          await prisma.agentTask.update({
            where: { id: taskId },
            data: {
              status: hasPendingActions ? 'AWAITING_APPROVAL' : 'COMPLETED',
              result: fullText.slice(0, 10000),
              actionIds: { push: actionIds },
              completedAt: hasPendingActions ? undefined : new Date(),
            },
          });
        } catch (err) {
          logger.warn({ err, taskId }, 'Failed to update task after execution');
        }
      }

      // Non-blocking: distill memories after conversation
      if (this.deps.distiller) {
        const allMessages = await prisma.chatMessage.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'asc' },
        });
        this.deps.distiller.distillConversation(allMessages, msg.organisationId, msg.userId)
          .catch((err) => logger.error({ err }, 'Memory distillation failed'));
      }

      return { messageId: saved.id };
    } catch (err) {
      // Update task as FAILED if running with a task
      if (taskId) {
        try {
          await prisma.agentTask.update({
            where: { id: taskId },
            data: {
              status: 'FAILED',
              errorMessage: err instanceof Error ? err.message : String(err),
              completedAt: new Date(),
            },
          });
        } catch (taskErr) {
          logger.warn({ err: taskErr, taskId }, 'Failed to mark task as FAILED');
        }
      }

      if (fullText) {
        await prisma.chatMessage.create({
          data: {
            conversationId,
            role: 'ASSISTANT',
            content: fullText,
            actionIds: [],
          },
        });
      }
      throw err;
    } finally {
      await executor.shutdown();
    }
  }
}
