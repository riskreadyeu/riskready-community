import { describe, expect, it } from 'vitest';

import { resolveConversationModel } from '../model-resolution.js';

describe('resolveConversationModel', () => {
  it('prefers the conversation model over the organisation default', () => {
    expect(
      resolveConversationModel({
        envModel: 'claude-haiku-4-5-20251001',
        dbModel: 'claude-sonnet-4-5-20250929',
        conversationModel: 'claude-opus-4-20250514',
      }),
    ).toBe('claude-opus-4-20250514');
  });

  it('falls back to the organisation default when no conversation model exists', () => {
    expect(
      resolveConversationModel({
        envModel: 'claude-haiku-4-5-20251001',
        dbModel: 'claude-sonnet-4-5-20250929',
        conversationModel: null,
      }),
    ).toBe('claude-sonnet-4-5-20250929');
  });

  it('falls back to the environment model when neither override is set', () => {
    expect(
      resolveConversationModel({
        envModel: 'claude-haiku-4-5-20251001',
        dbModel: undefined,
        conversationModel: null,
      }),
    ).toBe('claude-haiku-4-5-20251001');
  });
});
