import { describe, expect, it } from 'vitest';

import { resolveConversationModel } from '../model-resolution.js';

describe('resolveConversationModel — default model', () => {
  it('defaults to claude-sonnet-4-5-20250514 when no model is provided', () => {
    expect(
      resolveConversationModel({
        envModel: null,
        dbModel: null,
        conversationModel: null,
      }),
    ).toBe('claude-sonnet-4-5-20250514');
  });
});
