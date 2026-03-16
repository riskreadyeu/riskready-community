import { describe, expect, it } from 'vitest';

import { applyGroundingGuard } from '../grounding-guard.js';

describe('applyGroundingGuard', () => {
  it('replaces unsupported permission claims after successful tool calls', () => {
    const result = applyGroundingGuard({
      text: 'I cannot access your risk data because of permission restrictions in your organisation.',
      toolResults: [
        {
          toolName: 'mcp__riskready-risks__get_risk_dashboard',
          status: 'success',
          rawResult: {
            content: [{ type: 'text', text: JSON.stringify({ risks: { total: 15 } }) }],
          },
        },
        {
          toolName: 'mcp__riskready-risks__list_risks',
          status: 'success',
          rawResult: {
            content: [{ type: 'text', text: JSON.stringify({ total: 15, results: [{ riskId: 'R-01', title: 'Third-party concentration risk' }] }) }],
          },
        },
      ],
    });

    expect(result.wasRewritten).toBe(true);
    expect(result.text).toContain('I queried 2 tool(s) successfully.');
    expect(result.text).toContain('mcp__riskready-risks__get_risk_dashboard');
    expect(result.text).toContain('mcp__riskready-risks__list_risks');
    expect(result.text.toLowerCase()).not.toContain('permission restriction');
  });

  it('preserves permission claims when a tool actually reported an authorization error', () => {
    const text = 'I cannot access your risk data because the tool returned permission denied.';
    const result = applyGroundingGuard({
      text,
      toolResults: [
        {
          toolName: 'mcp__riskready-risks__list_risks',
          status: 'error',
          rawResult: {
            content: [{ type: 'text', text: 'permission denied for organisation org-1' }],
            isError: true,
          },
        },
      ],
    });

    expect(result.wasRewritten).toBe(false);
    expect(result.text).toBe(text);
  });
});
