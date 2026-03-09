import { describe, it, expect } from 'vitest';
import { extractActionIdsFromToolResults } from '../action-id-extractor';

describe('extractActionIdsFromToolResults', () => {
  it('should extract actionId from tool result content string', () => {
    const toolResults = [
      {
        content: JSON.stringify({
          message: 'Action proposed successfully.',
          actionId: 'action-123',
          status: 'PENDING',
        }),
      },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toContain('action-123');
  });

  it('should handle multiple tool results', () => {
    const toolResults = [
      { content: JSON.stringify({ actionId: 'a1', status: 'PENDING' }) },
      { content: JSON.stringify({ actionId: 'a2', status: 'PENDING' }) },
      { content: JSON.stringify({ noActionId: true }) },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toEqual(['a1', 'a2']);
  });

  it('should handle non-JSON content gracefully', () => {
    const toolResults = [
      { content: 'not json at all' },
      { content: JSON.stringify({ actionId: 'a3' }) },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toEqual(['a3']);
  });

  it('should handle empty array', () => {
    const ids = extractActionIdsFromToolResults([]);
    expect(ids).toEqual([]);
  });

  it('should handle nested content arrays', () => {
    const toolResults = [
      {
        content: [{ type: 'text', text: JSON.stringify({ actionId: 'a4' }) }],
      },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toEqual(['a4']);
  });
});
