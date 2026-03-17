import { describe, expect, it } from 'vitest';

import { applyGroundingGuard } from '../grounding-guard.js';

describe('applyGroundingGuard', () => {
  it('replaces unsupported permission claims after successful tool calls', () => {
    const result = applyGroundingGuard({
      text: 'I do not have permission to access your risk data because of restrictions in your organisation.',
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
    expect(result.text.toLowerCase()).not.toContain('i do not have permission');
  });

  it('preserves permission claims when a tool actually reported an authorization error', () => {
    const text = 'I cannot access the risk tools because the tool returned permission denied.';
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

  it('falls back to successful tool call metadata when structured tool summaries are unavailable', async () => {
    const grounding = await import('../grounding-guard.js') as any;
    const toolResults = grounding.withFallbackGroundingToolResults([], [
      { name: 'mcp__riskready-risks__list_risks', status: 'done' },
      { name: 'mcp__riskready-risks__get_risk_dashboard', status: 'done' },
    ]);

    const result = applyGroundingGuard({
      text: 'I do not have access to the risk tools because of restrictions in the system.',
      toolResults,
    });

    expect(result.wasRewritten).toBe(true);
    expect(result.text).toContain('I queried 2 tool(s) successfully.');
    expect(result.text).toContain('mcp__riskready-risks__list_risks');
    expect(result.text).toContain('mcp__riskready-risks__get_risk_dashboard');
  });

  it('does NOT rewrite normal GRC text that incidentally contains access/permission words', () => {
    const text = `Here are the top risks in your register:

1. **R-01 Unauthorized Access to Customer Data** — Inherent score: High
2. **R-02 Weak Access Control Configuration** — Inherent score: Medium
3. **R-03 Third-party Permission Escalation** — Inherent score: High

These risks relate to access management and permission governance across your organisation.`;

    const result = applyGroundingGuard({
      text,
      toolResults: [
        {
          toolName: 'mcp__riskready-risks__list_risks',
          status: 'success',
          rawResult: {
            content: [{ type: 'text', text: JSON.stringify({ total: 3, results: [] }) }],
          },
        },
      ],
    });

    expect(result.wasRewritten).toBe(false);
    expect(result.text).toBe(text);
  });
});
