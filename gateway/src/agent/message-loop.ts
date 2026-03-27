import type Anthropic from '@anthropic-ai/sdk';
import type { ChatEvent } from '../channels/types.js';
import type { ToolResult } from './mcp-tool-executor.js';
import { logger } from '../logger.js';

export interface ToolCallRecord {
  name: string;
  server: string;
  status: string;
}

export interface MessageLoopOptions {
  client: Anthropic;
  model: string;
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string | unknown[] }>;
  tools: Record<string, unknown>[];
  maxTurns: number;
  signal: AbortSignal;
  onEvent: (event: ChatEvent) => void;
  executeTool: (name: string, input: Record<string, unknown>) => Promise<ToolResult>;
  maxTokenBudget?: number;
}

export interface MessageLoopResult {
  text: string;
  toolCalls: ToolCallRecord[];
  toolResults: Array<{ toolName: string; status: 'success' | 'error'; rawResult: unknown }>;
  usage: { inputTokens: number; outputTokens: number };
}

// Fix 3: Local types to reduce unsafe casts
interface LoopContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface PendingToolUse {
  id: string;
  name: string;
  inputJson: string;
  parsedInput?: Record<string, unknown>; // Fix 2: cache parsed result
}

// Fix 4: API retry with exponential backoff
async function callWithRetry(
  fn: () => Promise<unknown>,
  maxRetries: number = 2,
  baseDelayMs: number = 1000,
): Promise<unknown> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const isRetryable = status === 529 || status === 500 || status === 502 || status === 503;
      if (!isRetryable || attempt === maxRetries) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      logger.warn({ status, attempt, delayMs: delay }, 'Retrying Anthropic API call');
      await new Promise(r => setTimeout(r, delay));
    }
  }
  // Unreachable, but satisfies TypeScript
  throw new Error('callWithRetry: unexpected exit');
}

export async function runMessageLoop(opts: MessageLoopOptions): Promise<MessageLoopResult> {
  const {
    client,
    model,
    systemPrompt,
    messages,
    tools,
    maxTurns,
    signal,
    onEvent,
    executeTool,
  } = opts;

  const accumulatedMessages = [...messages] as Anthropic.MessageParam[];
  let accumulatedText = '';
  const toolCalls: ToolCallRecord[] = [];
  const toolResults: Array<{ toolName: string; status: 'success' | 'error'; rawResult: unknown }> = [];
  const usage = { inputTokens: 0, outputTokens: 0 };

  for (let turn = 0; turn < maxTurns; turn++) {
    if (signal.aborted) {
      logger.debug('Message loop aborted before turn %d', turn);
      break;
    }

    const maxTokenBudget = opts.maxTokenBudget ?? 500_000;
    if (usage.inputTokens + usage.outputTokens > maxTokenBudget) {
      accumulatedText += '\n\n[Token budget exceeded. Ending conversation turn.]';
      break;
    }

    let stopReason: string | null = null;
    const contentBlocks: LoopContentBlock[] = [];
    const pendingTools = new Map<number, PendingToolUse>();
    let currentTextBlock = '';

    // Fix 4: Wrap API call with retry
    const response = await callWithRetry(() => client.messages.create({
      model,
      max_tokens: 16384,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: accumulatedMessages,
      tools: tools as unknown as Anthropic.Tool[],
      stream: true,
    }));

    for await (const event of response as AsyncIterable<Record<string, unknown>>) {
      const eventType = event.type as string;

      if (eventType === 'message_start') {
        const msg = event.message as { usage?: { input_tokens?: number; output_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number } };
        if (msg?.usage) {
          usage.inputTokens += (msg.usage.input_tokens ?? 0)
            + (msg.usage.cache_creation_input_tokens ?? 0)
            + (msg.usage.cache_read_input_tokens ?? 0);
          usage.outputTokens += msg.usage.output_tokens ?? 0;
        }
      } else if (eventType === 'content_block_start') {
        const index = event.index as number;
        const block = event.content_block as { type: string; id?: string; name?: string; text?: string };

        if (block.type === 'tool_use') {
          pendingTools.set(index, {
            id: block.id ?? '',
            name: block.name ?? '',
            inputJson: '',
          });
          onEvent({
            type: 'tool_start',
            tool: block.name,
            server: parseServerName(block.name ?? ''),
          });
        } else if (block.type === 'text') {
          currentTextBlock = block.text ?? '';
        }
      } else if (eventType === 'content_block_delta') {
        const index = event.index as number;
        const delta = event.delta as { type: string; text?: string; partial_json?: string };

        if (delta.type === 'text_delta' && delta.text) {
          currentTextBlock += delta.text;
          accumulatedText += delta.text;
          onEvent({ type: 'text_delta', text: delta.text });
        } else if (delta.type === 'input_json_delta' && delta.partial_json !== undefined) {
          const pending = pendingTools.get(index);
          if (pending) {
            pending.inputJson += delta.partial_json;
          }
        }
      } else if (eventType === 'content_block_stop') {
        const index = event.index as number;
        const pending = pendingTools.get(index);
        if (pending) {
          // Fix 2: Parse once, cache on pending object
          let parsedInput: Record<string, unknown> = {};
          try {
            parsedInput = pending.inputJson ? JSON.parse(pending.inputJson) : {};
          } catch {
            logger.warn({ tool: pending.name, json: pending.inputJson }, 'Failed to parse tool input JSON');
          }
          pending.parsedInput = parsedInput;
          contentBlocks.push({
            type: 'tool_use',
            id: pending.id,
            name: pending.name,
            input: parsedInput,
          });
        } else {
          // Fix 6: Always push text blocks, even if empty
          if (currentTextBlock !== undefined) {
            contentBlocks.push({
              type: 'text',
              text: currentTextBlock,
            });
            currentTextBlock = '';
          }
        }
      } else if (eventType === 'message_delta') {
        const delta = event.delta as { stop_reason?: string };
        const eventUsage = event.usage as { output_tokens?: number } | undefined;
        stopReason = delta?.stop_reason ?? null;
        if (eventUsage?.output_tokens) {
          usage.outputTokens += eventUsage.output_tokens;
        }
      }
    }

    // If stop_reason is not tool_use, we're done
    if (stopReason !== 'tool_use') {
      break;
    }

    // Build the assistant message with all content blocks
    accumulatedMessages.push({
      role: 'assistant',
      content: contentBlocks as unknown as Anthropic.ContentBlockParam[],
    });

    // Fix 1: Execute tools in parallel via Promise.allSettled
    const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];

    const toolExecutions = Array.from(pendingTools.values()).map(async (pending) => {
      const parsedInput = pending.parsedInput ?? {}; // Fix 2: use cached, no re-parse

      const serverName = parseServerName(pending.name);
      logger.debug({ tool: pending.name, turn }, 'Executing tool');
      const result = await executeTool(pending.name, parsedInput);
      const status = result.isError ? 'error' : 'success';

      return { pending, result, status, serverName };
    });

    const results = await Promise.allSettled(toolExecutions);

    for (const settled of results) {
      if (settled.status === 'fulfilled') {
        const { pending, result, status, serverName } = settled.value;
        toolCalls.push({ name: pending.name, server: serverName, status });
        toolResults.push({ toolName: pending.name, status: status as 'success' | 'error', rawResult: result.content });
        onEvent({ type: 'tool_done', tool: pending.name, server: serverName, status });
        toolResultBlocks.push({
          type: 'tool_result',
          tool_use_id: pending.id,
          content: result.content,
          is_error: result.isError,
        });
      } else {
        logger.error({ err: settled.reason }, 'Tool execution failed');
      }
    }

    accumulatedMessages.push({
      role: 'user',
      content: toolResultBlocks,
    });
  }

  return { text: accumulatedText, toolCalls, toolResults, usage };
}

function parseServerName(toolName: string): string {
  const parts = toolName.split('__');
  return parts.length >= 2 ? parts[1] : '';
}
