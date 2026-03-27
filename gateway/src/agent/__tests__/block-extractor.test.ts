// gateway/src/agent/__tests__/block-extractor.test.ts
import { describe, it, expect } from 'vitest';
import { extractBlock } from '../block-extractor.js';

describe('extractBlock', () => {
  it('returns control_table block for list_controls tool', () => {
    const toolResult = JSON.stringify({
      count: 1,
      page: { skip: 0, take: 25 },
      results: [
        { id: 'c1', controlId: 'A.5.1', name: 'InfoSec Policies', theme: 'ORGANISATIONAL' },
      ],
    });
    const block = extractBlock('mcp__riskready-controls__list_controls', toolResult);
    expect(block).toBeDefined();
    expect(block!.type).toBe('control_table');
  });

  it('returns control_table block for search_controls tool', () => {
    const toolResult = JSON.stringify({
      count: 2,
      results: [
        { id: 'c1', controlId: 'A.5.1', name: 'InfoSec Policies', theme: 'ORGANISATIONAL' },
        { id: 'c2', controlId: 'A.5.2', name: 'InfoSec Roles', theme: 'ORGANISATIONAL' },
      ],
    });
    const block = extractBlock('mcp__riskready-controls__search_controls', toolResult);
    expect(block).toBeDefined();
    expect(block!.type).toBe('control_table');
    expect((block as any).data).toHaveLength(2);
  });

  it('returns null for unmapped tools', () => {
    const block = extractBlock('mcp__riskready-playbooks__search_playbooks', '{}');
    expect(block).toBeNull();
  });

  it('returns null for unparseable JSON', () => {
    const block = extractBlock('mcp__riskready-controls__list_controls', 'not json');
    expect(block).toBeNull();
  });
});
