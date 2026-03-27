import { describe, expect, it } from 'vitest';

import { buildConversationMessages } from '../agent/conversation-builder.js';

describe('buildConversationMessages', () => {
  it('returns just the current message when history is empty', () => {
    const result = buildConversationMessages([], 'Hello');
    expect(result).toEqual([{ role: 'user', content: 'Hello' }]);
  });

  it('converts USER records to user role and ASSISTANT records to assistant role', () => {
    const result = buildConversationMessages(
      [
        { role: 'USER', content: 'First question' },
        { role: 'ASSISTANT', content: 'First answer' },
      ],
      'Second question',
    );
    expect(result).toEqual([
      { role: 'user', content: 'First question' },
      { role: 'assistant', content: 'First answer' },
      { role: 'user', content: 'Second question' },
    ]);
  });

  it('ignores toolCalls field and only includes text content', () => {
    const result = buildConversationMessages(
      [
        { role: 'USER', content: 'Do something', toolCalls: [{ id: 'tc1', name: 'some_tool' }] },
        { role: 'ASSISTANT', content: 'Done', toolCalls: [{ type: 'tool_result', content: 'ok' }] },
      ],
      'Next',
    );
    expect(result).toEqual([
      { role: 'user', content: 'Do something' },
      { role: 'assistant', content: 'Done' },
      { role: 'user', content: 'Next' },
    ]);
    // Ensure no toolCalls key in output
    for (const msg of result) {
      expect(Object.keys(msg)).not.toContain('toolCalls');
    }
  });

  it('caps history at 20 past messages', () => {
    const history = Array.from({ length: 30 }, (_, i) => ({
      role: (i % 2 === 0 ? 'USER' : 'ASSISTANT') as 'USER' | 'ASSISTANT',
      content: `message ${i}`,
    }));

    const result = buildConversationMessages(history, 'current');

    // The last 20 messages of history are used; history[10..29]
    // history[10] is USER (even index), so first converted message is user role
    // We just check that we don't have more than 21 messages total
    // (up to 20 history + 1 current, possibly merged)
    expect(result.length).toBeLessThanOrEqual(21);

    // The content of the very first history item used should be "message 10"
    // history[10] is USER → role 'user'
    expect(result[0].role).toBe('user');
    expect(result[0].content).toContain('message 10');
  });

  it('does not include messages beyond the 20 most recent', () => {
    const history = Array.from({ length: 25 }, (_, i) => ({
      role: (i % 2 === 0 ? 'USER' : 'ASSISTANT') as 'USER' | 'ASSISTANT',
      content: `msg-${i}`,
    }));

    const result = buildConversationMessages(history, 'now');
    const allContent = result.map((m) => m.content).join(' ');

    // msg-0 through msg-4 should not appear (only last 20 = msg-5..msg-24)
    expect(allContent).not.toContain('msg-0');
    expect(allContent).not.toContain('msg-4');
    expect(allContent).toContain('msg-5');
  });

  it('merges consecutive same-role messages to enforce alternation', () => {
    const result = buildConversationMessages(
      [
        { role: 'USER', content: 'Part A' },
        { role: 'USER', content: 'Part B' },
        { role: 'ASSISTANT', content: 'Reply' },
      ],
      'Follow up',
    );

    // The two USER messages should be merged into one
    expect(result[0]).toEqual({ role: 'user', content: 'Part A\n\nPart B' });
    expect(result[1]).toEqual({ role: 'assistant', content: 'Reply' });
    expect(result[2]).toEqual({ role: 'user', content: 'Follow up' });
    expect(result).toHaveLength(3);
  });

  it('merges current message into last history message when last is user role', () => {
    const result = buildConversationMessages(
      [
        { role: 'ASSISTANT', content: 'Here is some info' },
        { role: 'USER', content: 'Thank you, and also' },
      ],
      'what about this?',
    );

    expect(result).toEqual([
      { role: 'assistant', content: 'Here is some info' },
      { role: 'user', content: 'Thank you, and also\n\nwhat about this?' },
    ]);
  });

  it('appends current message as new user message when last history message is assistant', () => {
    const result = buildConversationMessages(
      [
        { role: 'USER', content: 'Question' },
        { role: 'ASSISTANT', content: 'Answer' },
      ],
      'New question',
    );

    expect(result).toEqual([
      { role: 'user', content: 'Question' },
      { role: 'assistant', content: 'Answer' },
      { role: 'user', content: 'New question' },
    ]);
  });

  it('handles a single assistant history message followed by current user message', () => {
    const result = buildConversationMessages(
      [{ role: 'ASSISTANT', content: 'Greeting' }],
      'Hello back',
    );

    expect(result).toEqual([
      { role: 'assistant', content: 'Greeting' },
      { role: 'user', content: 'Hello back' },
    ]);
  });

  it('handles exactly 20 history messages without truncation', () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: (i % 2 === 0 ? 'USER' : 'ASSISTANT') as 'USER' | 'ASSISTANT',
      content: `msg-${i}`,
    }));

    const result = buildConversationMessages(history, 'current');
    const allContent = result.map((m) => m.content).join(' ');

    expect(allContent).toContain('msg-0');
    expect(allContent).toContain('msg-19');
  });
});
