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

interface PendingToolUse {
  id: string;
  name: string;
  inputJson: string;
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
    const contentBlocks: Array<Anthropic.ContentBlock> = [];
    const pendingTools = new Map<number, PendingToolUse>();
    let currentTextBlock = '';

    const response = await client.messages.create({
      model,
      max_tokens: 16384,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: accumulatedMessages,
      tools: tools as unknown as Anthropic.Tool[],
      stream: true,
    });

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
          // Build the content block for the assistant message
          let parsedInput: Record<string, unknown> = {};
          try {
            parsedInput = pending.inputJson ? JSON.parse(pending.inputJson) : {};
          } catch {
            logger.warn({ tool: pending.name, json: pending.inputJson }, 'Failed to parse tool input JSON');
          }
          contentBlocks.push({
            type: 'tool_use',
            id: pending.id,
            name: pending.name,
            input: parsedInput,
          } as Anthropic.ContentBlockParam as unknown as Anthropic.ContentBlock);
        } else if (currentTextBlock) {
          contentBlocks.push({
            type: 'text',
            text: currentTextBlock,
          } as unknown as Anthropic.ContentBlock);
          currentTextBlock = '';
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

    // Execute each pending tool and build tool_result messages
    const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];

    for (const [, pending] of pendingTools) {
      let parsedInput: Record<string, unknown> = {};
      try {
        parsedInput = pending.inputJson ? JSON.parse(pending.inputJson) : {};
      } catch {
        // Already warned above
      }

      const serverName = parseServerName(pending.name);

      logger.debug({ tool: pending.name, turn }, 'Executing tool');
      const result = await executeTool(pending.name, parsedInput);

      const status = result.isError ? 'error' : 'success';

      toolCalls.push({ name: pending.name, server: serverName, status });
      toolResults.push({ toolName: pending.name, status, rawResult: result.content });

      onEvent({
        type: 'tool_done',
        tool: pending.name,
        server: serverName,
        status,
      });

      toolResultBlocks.push({
        type: 'tool_result',
        tool_use_id: pending.id,
        content: result.content,
        is_error: result.isError,
      });
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
