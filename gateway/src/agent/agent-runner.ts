// gateway/src/agent/agent-runner.ts

import { prisma } from '../prisma.js';
import { logger } from '../logger.js';
import { SYSTEM_PROMPT } from './system-prompt.js';
import type { UnifiedMessage, ChatEvent } from '../channels/types.js';
import { MemoryService } from '../memory/memory.service.js';
import { SearchService } from '../memory/search.service.js';
import { MemoryDistiller } from '../memory/distiller.js';
import { extractBlock, hasBlockMapping } from './block-extractor.js';
import { extractActionIdsFromToolResults } from './action-id-extractor.js';
import { resolveConversationModel } from '../model-resolution.js';
import { applyGroundingGuard, type GuardToolResult, withFallbackGroundingToolResults } from '../grounding-guard.js';

type QueryFn = typeof import('@anthropic-ai/claude-agent-sdk')['query'];

interface StreamEventPayload {
  type: string;
  content_block?: { type: string; name?: string };
  delta?: { type: string; text?: string };
}

interface AssistantMessage {
  type: string;
  message?: { content: Array<{ type: string; text?: string }> };
}

interface ResultMessage {
  type: string;
  subtype?: string;
  result?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number | null;
    cache_read_input_tokens?: number | null;
  };
}

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
  private queryFn: QueryFn | null = null;
  private deps: AgentRunnerDeps;
  private councilHook: CouncilHook | null = null;

  constructor(deps: AgentRunnerDeps) {
    this.deps = deps;
  }

  setCouncilHook(hook: CouncilHook): void {
    this.councilHook = hook;
  }

  private async getQueryFn(): Promise<QueryFn> {
    if (this.queryFn) return this.queryFn;
    const sdk = await import('@anthropic-ai/claude-agent-sdk');
    this.queryFn = sdk.query;
    return this.queryFn;
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
    const queryFn = await this.getQueryFn();
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

    // Build conversation history (cap at last 20 messages for context window)
    const MAX_HISTORY = 20;
    const history = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    let historyText: string;
    const pastMessages = history.slice(0, -1) as HistoryMessage[]; // exclude current user message
    if (pastMessages.length <= MAX_HISTORY) {
      historyText = pastMessages
        .map((m) => `${m.role === 'USER' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
    } else {
      const olderCount = pastMessages.length - MAX_HISTORY;
      const recent = pastMessages.slice(-MAX_HISTORY);
      historyText = `[Earlier in this conversation: ${olderCount} messages exchanged]\n\n` +
        recent
          .map((m) => `${m.role === 'USER' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n\n');
    }

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

    // File attachments are not supported in Community Edition
    const fileContext = '';

    const prompt = `Organisation ID: ${msg.organisationId}
${historyText ? `\nConversation history:\n${historyText}` : ''}${memoryContext}${taskContext}${fileContext}

User: ${msg.text}`;

    let fullText = '';
    const toolCalls: Array<{ name: string; server: string; status: string }> = [];
    const actionIds: string[] = [];
    const blocks: Array<{ type: string; [key: string]: unknown }> = [];
    const collectedToolResults: Array<{ content?: string | Array<{ type?: string; text?: string }> }> = [];
    const groundingToolResults: GuardToolResult[] = [];
    let contentBlockIndex = 0;
    const toolCallsByIndex = new Map<number, number>(); // content block index → toolCalls array index
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const abortController = new AbortController();

    // Link external signal to our controller, using { once } to prevent listener leak
    const onAbort = () => abortController.abort();
    signal.addEventListener('abort', onAbort, { once: true });

    try {
      // Build a clean env without CLAUDECODE to avoid "nested session" guard
      const cleanEnv = { ...process.env };
      delete cleanEnv.CLAUDECODE;

      // Load per-org config from DB, falling back to env vars
      let dbModel: string | undefined;
      let maxTurns = 25;
      if (this.deps.getDbConfig) {
        const dbConfig = await this.deps.getDbConfig(msg.organisationId);
        if (dbConfig) {
          dbModel = dbConfig.agentModel || undefined;
          maxTurns = dbConfig.maxAgentTurns || maxTurns;
          if (dbConfig.anthropicApiKey) {
            cleanEnv.ANTHROPIC_API_KEY = dbConfig.anthropicApiKey;
          }
        }
      }
      const model = resolveConversationModel({
        envModel: process.env.AGENT_MODEL,
        dbModel,
        conversationModel: conversation.model,
      });

      const mcpServers = this.deps.getMcpServers(msg.text);

      // Council decision: check if multi-agent deliberation is needed
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
      if (!fullText) {
        const queryIterator = queryFn({
          prompt,
          options: {
            abortController,
            env: cleanEnv,
            model,
            mcpServers,
            allowedTools: ['mcp__*'],
            permissionMode: 'dontAsk',
            maxTurns,
            includePartialMessages: true,
            tools: [],
            systemPrompt: SYSTEM_PROMPT,
            persistSession: false,
            stderr: (data: string) => {
              logger.debug({ stderr: data }, 'agent-sdk-stderr');
            },
          },
        });

        for await (const message of queryIterator) {
          if (signal.aborted) break;

          if (message.type === 'stream_event') {
            const event = (message as { type: string; event: StreamEventPayload }).event;

            // Track token usage per-event (supplementary — final totals come from result message)
            if (event.type === 'message_start') {
              const usage = (event as any).message?.usage;
              if (usage) {
                totalInputTokens += (usage.input_tokens ?? 0)
                  + (usage.cache_creation_input_tokens ?? 0)
                  + (usage.cache_read_input_tokens ?? 0);
              }
            }
            if (event.type === 'message_delta') {
              const usage = (event as any).usage;
              if (usage) {
                totalOutputTokens += (usage.output_tokens ?? 0);
                totalInputTokens += (usage.cache_creation_input_tokens ?? 0)
                  + (usage.cache_read_input_tokens ?? 0);
              }
            }

            if (event.type === 'content_block_start') {
              if (event.content_block?.type === 'tool_use') {
                const toolName: string = event.content_block.name ?? '';
                const server = toolName.split('__')[1] ?? 'unknown';
                const idx = toolCalls.push({ name: toolName, server, status: 'running' }) - 1;
                toolCallsByIndex.set(contentBlockIndex, idx);
                emit({ type: 'tool_start', tool: toolName, server });
              }
              contentBlockIndex++;
            }

            if (
              event.type === 'content_block_delta' &&
              event.delta?.type === 'text_delta'
            ) {
              const text: string = event.delta.text ?? '';
              fullText += text;
              emit({ type: 'text_delta', text });
            }

            if (event.type === 'content_block_stop') {
              const blockIdx = contentBlockIndex - 1;
              const toolIdx = toolCallsByIndex.get(blockIdx);
              if (toolIdx !== undefined && toolCalls[toolIdx]?.status === 'running') {
                toolCalls[toolIdx].status = 'done';
                emit({ type: 'tool_done', tool: toolCalls[toolIdx].name, status: 'success' });
              }
            }
          }

          // Collect tool results from assistant messages for structured action ID extraction
          if (message.type === 'assistant') {
            // kept for later regex fallback — no longer primary extraction
          }

          if (message.type === 'result') {
            const resultMsg = message as ResultMessage;
            if (resultMsg.subtype === 'success' && resultMsg.result && !fullText) {
              fullText += resultMsg.result;
            }
            // Prefer SDK-accumulated totals (includes cache tokens across all turns)
            if (resultMsg.usage) {
              totalInputTokens = (resultMsg.usage.input_tokens ?? 0)
                + (resultMsg.usage.cache_creation_input_tokens ?? 0)
                + (resultMsg.usage.cache_read_input_tokens ?? 0);
              totalOutputTokens = resultMsg.usage.output_tokens ?? 0;
            }
          }

          // Intercept tool results for block extraction and action ID collection
          if (message.type === 'tool_use_summary') {
            const toolSummary = message as any;
            if (toolSummary.tool_name && toolSummary.result) {
              const block = extractBlock(toolSummary.tool_name, toolSummary.result);
              if (block) {
                blocks.push(block);
                emit({ type: 'block', block });
              }
              // Collect for structured action ID extraction
              collectedToolResults.push({ content: toolSummary.result });
              groundingToolResults.push({
                toolName: toolSummary.tool_name,
                status: toolSummary.is_error ? 'error' : 'success',
                rawResult: {
                  content: [{ type: 'text', text: typeof toolSummary.result === 'string' ? toolSummary.result : JSON.stringify(toolSummary.result) }],
                  isError: toolSummary.is_error ?? false,
                },
              });
            }
          }
        }
      }

      // Extract action IDs: prefer structured tool results, regex on text as fallback
      const structuredIds = extractActionIdsFromToolResults(collectedToolResults);
      const regexIds: string[] = [];
      const regexPattern = /"actionId"\s*:\s*"([^"]+)"/g;
      let regexMatch;
      while ((regexMatch = regexPattern.exec(fullText)) !== null) {
        regexIds.push(regexMatch[1]);
      }
      const allActionIds = [...new Set([...structuredIds, ...regexIds])];
      for (const actionId of allActionIds) {
        if (!actionIds.includes(actionId)) {
          actionIds.push(actionId);
          emit({
            type: 'action_proposed',
            actionId,
            summary: 'Action proposed — check AI Approvals queue',
          });
        }
      }

      // Log block-eligible tools for debugging
      for (const tc of toolCalls) {
        if (tc.status === 'done' && hasBlockMapping(tc.name)) {
          logger.debug({ tool: tc.name }, 'Block-eligible tool completed');
        }
      }

      // Log token usage
      if (totalInputTokens > 0 || totalOutputTokens > 0) {
        logger.info({
          conversationId,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          totalTokens: totalInputTokens + totalOutputTokens,
          toolCallCount: toolCalls.length,
        }, 'Token usage');
      }

      const grounded = applyGroundingGuard({
        text: fullText || 'I was unable to generate a response.',
        toolResults: withFallbackGroundingToolResults(groundingToolResults, toolCalls),
      });
      fullText = grounded.text;

      const saved = await prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: fullText || 'I was unable to generate a response.',
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          actionIds: actionIds.length > 0 ? actionIds : [],
          blocks: blocks.length > 0 ? (blocks as any) : undefined,
          inputTokens: totalInputTokens || undefined,
          outputTokens: totalOutputTokens || undefined,
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
              result: fullText.slice(0, 10000), // cap at 10k chars
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
            toolCalls,
            actionIds,
            blocks: blocks.length > 0 ? (blocks as any) : undefined,
          },
        });
      }
      throw err;
    } finally {
      signal.removeEventListener('abort', onAbort);
    }
  }
}
