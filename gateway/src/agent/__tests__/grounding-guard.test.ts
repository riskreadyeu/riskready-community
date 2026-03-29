import { describe, it, expect } from 'vitest';
import { checkGrounding } from '../grounding-guard.js';

describe('checkGrounding', () => {
  it('flags IDs in response that were not in tool results', () => {
    const toolResultIds = ['R-01', 'R-02', 'CTRL-042'];
    const responseText = 'Risk R-01 is critical. Also check R-99 for details.';
    const result = checkGrounding(responseText, toolResultIds);
    expect(result.suspectedFabricatedIds).toContain('R-99');
    expect(result.suspectedFabricatedIds).not.toContain('R-01');
  });

  it('returns clean when all IDs are grounded', () => {
    const toolResultIds = ['R-01', 'CTRL-042', 'INC-2025-001'];
    const responseText =
      'Risk R-01 linked to CTRL-042 from incident INC-2025-001.';
    const result = checkGrounding(responseText, toolResultIds);
    expect(result.suspectedFabricatedIds).toHaveLength(0);
  });

  it('detects fabricated UUIDs', () => {
    const toolResultIds = ['550e8400-e29b-41d4-a716-446655440000'];
    const responseText =
      'Found record 550e8400-e29b-41d4-a716-446655440000 and also 99999999-aaaa-bbbb-cccc-dddddddddddd.';
    const result = checkGrounding(responseText, toolResultIds);
    expect(result.suspectedFabricatedIds).toContain(
      '99999999-aaaa-bbbb-cccc-dddddddddddd',
    );
  });

  it('handles empty tool results gracefully', () => {
    const responseText = 'No data found.';
    const result = checkGrounding(responseText, []);
    expect(result.suspectedFabricatedIds).toHaveLength(0);
  });
});
