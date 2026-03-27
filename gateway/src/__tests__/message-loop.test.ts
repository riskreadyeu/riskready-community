import { describe, it, expect, vi } from 'vitest';
import { runMessageLoop, MessageLoopOptions, MessageLoopResult } from '../agent/message-loop.js';
import type { ChatEvent } from '../channels/types.js';
import type { ToolResult } from '../agent/mcp-tool-executor.js';

// Helper: create a fake async iterable of streaming events
async function* fakeStream(events: Array<Record<string, unknown>>) {
  for (const event of events) {
    yield event;
  }
}

// Helper: build a minimal set of options with sensible defaults
function makeOptions(overrides: Partial<MessageLoopOptions> = {}): MessageLoopOptions {
  return {
    client: {
      messages: {
        create: vi.fn().mockResolvedValue(fakeStream([])),
      },
    } as unknown as MessageLoopOptions['client'],
    model: 'claude-sonnet-4-20250514',
    systemPrompt: 'You are a test assistant.',
    messages: [{ role: 'user' as const, content: 'Hello' }],
    tools: [],
    maxTurns: 5,
    signal: new AbortController().signal,
    onEvent: vi.fn(),
    executeTool: vi.fn().mockResolvedValue({ content: 'ok', isError: false }),
    ...overrides,
  };
}

// Helper: create streaming events for a text-only response
function textResponseEvents(text: string): Array<Record<string, unknown>> {
  return [
    {
      type: 'message_start',
      message: { usage: { input_tokens: 100, output_tokens: 0 } },
    },
    {
      type: 'content_block_start',
      index: 0,
      content_block: { type: 'text', text: '' },
    },
    {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text },
    },
    {
      type: 'content_block_stop',
      index: 0,
    },
    {
      type: 'message_delta',
      delta: { stop_reason: 'end_turn' },
      usage: { output_tokens: 25 },
    },
    { type: 'message_stop' },
  ];
}

// Helper: create streaming events for a tool_use response
function toolUseResponseEvents(
  toolId: string,
  toolName: string,
  inputJson: string,
): Array<Record<string, unknown>> {
  return [
    {
      type: 'message_start',
      message: { usage: { input_tokens: 150, output_tokens: 0 } },
    },
    {
      type: 'content_block_start',
      index: 0,
      content_block: { type: 'tool_use', id: toolId, name: toolName, input: {} },
    },
    {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'input_json_delta', partial_json: inputJson },
    },
    {
      type: 'content_block_stop',
      index: 0,
    },
    {
      type: 'message_delta',
      delta: { stop_reason: 'tool_use' },
      usage: { output_tokens: 30 },
    },
    { type: 'message_stop' },
  ];
}

describe('runMessageLoop', () => {
  it('handles a text-only response and returns accumulated text', async () => {
    const events: ChatEvent[] = [];
    const opts = makeOptions({
      client: {
        messages: {
          create: vi.fn().mockResolvedValue(fakeStream(textResponseEvents('Hello there!'))),
        },
      } as unknown as MessageLoopOptions['client'],
      onEvent: (e) => events.push(e),
    });

    const result = await runMessageLoop(opts);

    expect(result.text).toBe('Hello there!');
    expect(result.toolCalls).toHaveLength(0);
    expect(result.toolResults).toHaveLength(0);

    const textDeltas = events.filter((e) => e.type === 'text_delta');
    expect(textDeltas).toHaveLength(1);
    expect(textDeltas[0].text).toBe('Hello there!');
  });

  it('handles tool_use: emits tool_start, calls executeTool, emits tool_done, then continues', async () => {
    const events: ChatEvent[] = [];
    const executeTool = vi.fn().mockResolvedValue({ content: '{"risks":[]}', isError: false } as ToolResult);

    // Turn 1: tool_use, Turn 2: text response
    const createMock = vi
      .fn()
      .mockResolvedValueOnce(
        fakeStream(toolUseResponseEvents('tool-1', 'mcp__riskready-risks__list_risks', '{"page":1}')),
      )
      .mockResolvedValueOnce(fakeStream(textResponseEvents('Here are the risks.')));

    const opts = makeOptions({
      client: { messages: { create: createMock } } as unknown as MessageLoopOptions['client'],
      onEvent: (e) => events.push(e),
      executeTool,
    });

    const result = await runMessageLoop(opts);

    // executeTool should have been called once
    expect(executeTool).toHaveBeenCalledOnce();
    expect(executeTool).toHaveBeenCalledWith('mcp__riskready-risks__list_risks', { page: 1 });

    // Should have tool_start and tool_done events
    const toolStarts = events.filter((e) => e.type === 'tool_start');
    expect(toolStarts).toHaveLength(1);
    expect(toolStarts[0].tool).toBe('mcp__riskready-risks__list_risks');

    const toolDones = events.filter((e) => e.type === 'tool_done');
    expect(toolDones).toHaveLength(1);
    expect(toolDones[0].tool).toBe('mcp__riskready-risks__list_risks');
    expect(toolDones[0].status).toBe('success');

    // Result should include the tool call and tool result
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].name).toBe('mcp__riskready-risks__list_risks');
    expect(result.toolResults).toHaveLength(1);
    expect(result.toolResults[0].status).toBe('success');

    // Final text from second turn
    expect(result.text).toBe('Here are the risks.');
  });

  it('respects maxTurns limit', async () => {
    // Every turn returns a tool_use, so it should stop after maxTurns
    const createMock = vi.fn().mockResolvedValue(
      fakeStream(toolUseResponseEvents('tool-1', 'mcp__riskready-risks__list_risks', '{}')),
    );

    // We need to return a new generator each call
    createMock.mockImplementation(() =>
      fakeStream(toolUseResponseEvents('tool-1', 'mcp__riskready-risks__list_risks', '{}')),
    );

    const opts = makeOptions({
      client: { messages: { create: createMock } } as unknown as MessageLoopOptions['client'],
      maxTurns: 3,
      executeTool: vi.fn().mockResolvedValue({ content: 'ok', isError: false }),
    });

    const result = await runMessageLoop(opts);

    // Should have been called exactly maxTurns times
    expect(createMock).toHaveBeenCalledTimes(3);
    expect(result.toolCalls).toHaveLength(3);
  });

  it('tracks token usage from message_start and message_delta events', async () => {
    const createMock = vi.fn().mockResolvedValue(fakeStream(textResponseEvents('test')));
    const opts = makeOptions({
      client: { messages: { create: createMock } } as unknown as MessageLoopOptions['client'],
    });

    const result = await runMessageLoop(opts);

    expect(result.usage.inputTokens).toBe(100);
    expect(result.usage.outputTokens).toBe(25);
  });

  it('accumulates token usage across multiple turns', async () => {
    const createMock = vi
      .fn()
      .mockResolvedValueOnce(
        fakeStream(toolUseResponseEvents('tool-1', 'mcp__riskready-risks__list_risks', '{}')),
      )
      .mockResolvedValueOnce(fakeStream(textResponseEvents('done')));

    const opts = makeOptions({
      client: { messages: { create: createMock } } as unknown as MessageLoopOptions['client'],
      executeTool: vi.fn().mockResolvedValue({ content: 'ok', isError: false }),
    });

    const result = await runMessageLoop(opts);

    // Turn 1: 150 input + 30 output, Turn 2: 100 input + 25 output
    expect(result.usage.inputTokens).toBe(250);
    expect(result.usage.outputTokens).toBe(55);
  });

  it('returns toolResults for grounding guard consumption', async () => {
    const executeTool = vi
      .fn()
      .mockResolvedValueOnce({ content: '{"data":"secret"}', isError: false } as ToolResult);

    const createMock = vi
      .fn()
      .mockResolvedValueOnce(
        fakeStream(toolUseResponseEvents('tool-1', 'mcp__riskready-risks__get_risk', '{"id":"r1"}')),
      )
      .mockResolvedValueOnce(fakeStream(textResponseEvents('Here is the risk.')));

    const opts = makeOptions({
      client: { messages: { create: createMock } } as unknown as MessageLoopOptions['client'],
      executeTool,
    });

    const result = await runMessageLoop(opts);

    expect(result.toolResults).toHaveLength(1);
    expect(result.toolResults[0].toolName).toBe('mcp__riskready-risks__get_risk');
    expect(result.toolResults[0].status).toBe('success');
    expect(result.toolResults[0].rawResult).toBe('{"data":"secret"}');
  });

  it('handles abort signal at turn boundary', async () => {
    const controller = new AbortController();
    controller.abort(); // Already aborted

    const createMock = vi.fn().mockResolvedValue(fakeStream(textResponseEvents('should not run')));

    const opts = makeOptions({
      client: { messages: { create: createMock } } as unknown as MessageLoopOptions['client'],
      signal: controller.signal,
    });

    const result = await runMessageLoop(opts);

    // Should not have called the API at all
    expect(createMock).not.toHaveBeenCalled();
    expect(result.text).toBe('');
  });

  it('records error status for failed tool executions', async () => {
    const events: ChatEvent[] = [];
    const executeTool = vi.fn().mockResolvedValue({ content: 'Tool failed', isError: true } as ToolResult);

    const createMock = vi
      .fn()
      .mockResolvedValueOnce(
        fakeStream(toolUseResponseEvents('tool-1', 'mcp__riskready-risks__list_risks', '{}')),
      )
      .mockResolvedValueOnce(fakeStream(textResponseEvents('Sorry, the tool failed.')));

    const opts = makeOptions({
      client: { messages: { create: createMock } } as unknown as MessageLoopOptions['client'],
      onEvent: (e) => events.push(e),
      executeTool,
    });

    const result = await runMessageLoop(opts);

    const toolDones = events.filter((e) => e.type === 'tool_done');
    expect(toolDones[0].status).toBe('error');
    expect(result.toolResults[0].status).toBe('error');
  });

  it('handles multiple tool calls in a single turn', async () => {
    const executeTool = vi.fn().mockResolvedValue({ content: 'ok', isError: false } as ToolResult);

    // Two tool_use blocks in one turn
    const multiToolEvents: Array<Record<string, unknown>> = [
      {
        type: 'message_start',
        message: { usage: { input_tokens: 200, output_tokens: 0 } },
      },
      {
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'tool_use', id: 'tool-1', name: 'mcp__riskready-risks__list_risks', input: {} },
      },
      {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'input_json_delta', partial_json: '{}' },
      },
      { type: 'content_block_stop', index: 0 },
      {
        type: 'content_block_start',
        index: 1,
        content_block: {
          type: 'tool_use',
          id: 'tool-2',
          name: 'mcp__riskready-controls__list_controls',
          input: {},
        },
      },
      {
        type: 'content_block_delta',
        index: 1,
        delta: { type: 'input_json_delta', partial_json: '{"page":1}' },
      },
      { type: 'content_block_stop', index: 1 },
      {
        type: 'message_delta',
        delta: { stop_reason: 'tool_use' },
        usage: { output_tokens: 50 },
      },
      { type: 'message_stop' },
    ];

    const createMock = vi
      .fn()
      .mockResolvedValueOnce(fakeStream(multiToolEvents))
      .mockResolvedValueOnce(fakeStream(textResponseEvents('All done.')));

    const opts = makeOptions({
      client: { messages: { create: createMock } } as unknown as MessageLoopOptions['client'],
      executeTool,
    });

    const result = await runMessageLoop(opts);

    expect(executeTool).toHaveBeenCalledTimes(2);
    expect(result.toolCalls).toHaveLength(2);
    expect(result.toolResults).toHaveLength(2);
  });
});
