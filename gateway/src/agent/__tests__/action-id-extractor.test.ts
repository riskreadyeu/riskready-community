import { describe, it, expect } from 'vitest';
import { extractActionIdsFromToolResults } from '../action-id-extractor';

const UUID_1 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const UUID_2 = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const UUID_3 = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const UUID_4 = 'd4e5f6a7-b8c9-0123-defa-234567890123';

describe('extractActionIdsFromToolResults', () => {
  it('should extract actionId from tool result content string', () => {
    const toolResults = [
      {
        content: JSON.stringify({
          message: 'Action proposed successfully.',
          actionId: UUID_1,
          status: 'PENDING',
        }),
      },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toContain(UUID_1);
  });

  it('should handle multiple tool results', () => {
    const toolResults = [
      { content: JSON.stringify({ actionId: UUID_1, status: 'PENDING' }) },
      { content: JSON.stringify({ actionId: UUID_2, status: 'PENDING' }) },
      { content: JSON.stringify({ noActionId: true }) },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toEqual([UUID_1, UUID_2]);
  });

  it('should handle non-JSON content gracefully', () => {
    const toolResults = [
      { content: 'not json at all' },
      { content: JSON.stringify({ actionId: UUID_3 }) },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toEqual([UUID_3]);
  });

  it('should handle empty array', () => {
    const ids = extractActionIdsFromToolResults([]);
    expect(ids).toEqual([]);
  });

  it('should handle nested content arrays', () => {
    const toolResults = [
      {
        content: [{ type: 'text', text: JSON.stringify({ actionId: UUID_4 }) }],
      },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toEqual([UUID_4]);
  });

  it('should reject non-UUID actionId strings', () => {
    const toolResults = [
      { content: JSON.stringify({ actionId: 'action-123' }) },
      { content: JSON.stringify({ actionId: 'not-a-uuid' }) },
      { content: JSON.stringify({ actionId: 'a1' }) },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toEqual([]);
  });

  it('should reject actionId with SQL injection payload', () => {
    const toolResults = [
      {
        content: JSON.stringify({
          actionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890; DROP TABLE',
        }),
      },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toEqual([]);
  });

  it('should reject non-string actionId values', () => {
    const toolResults = [
      { content: JSON.stringify({ actionId: 12345 }) },
      { content: JSON.stringify({ actionId: null }) },
      { content: JSON.stringify({ actionId: { id: UUID_1 } }) },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toEqual([]);
  });

  it('should reject actionId with wrong UUID format (too short)', () => {
    const toolResults = [
      {
        content: JSON.stringify({
          actionId: 'a1b2c3d4-e5f6-7890-abcd-ef123456789',
        }),
      },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toEqual([]);
  });

  it('should accept valid UUIDs regardless of case', () => {
    const upperUuid = UUID_1.toUpperCase();
    const toolResults = [
      { content: JSON.stringify({ actionId: upperUuid }) },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toEqual([upperUuid]);
  });
});
