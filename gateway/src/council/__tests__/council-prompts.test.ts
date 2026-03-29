import { describe, it, expect } from 'vitest';
import { getCouncilMemberPrompt } from '../council-prompts.js';

describe('Council member prompts', () => {
  it('includes a JSON example in the prompt', () => {
    const prompt = getCouncilMemberPrompt('risk-analyst');
    expect(prompt).toContain('```json');
    expect(prompt).toContain('"findings"');
    expect(prompt).toContain('"recommendations"');
    expect(prompt).toContain('"confidence"');
  });

  it('includes the example for all member roles', () => {
    const roles = ['risk-analyst', 'controls-auditor', 'compliance-officer', 'incident-commander', 'evidence-auditor', 'ciso-strategist'] as const;
    for (const role of roles) {
      const prompt = getCouncilMemberPrompt(role);
      expect(prompt).toContain('```json');
    }
  });

  it('includes a concrete few-shot example with realistic data', () => {
    const prompt = getCouncilMemberPrompt('controls-auditor');
    // Should contain realistic record IDs, not just placeholders
    expect(prompt).toContain('CTRL-042');
    expect(prompt).toContain('Expired access review');
    expect(prompt).toContain('"severity": "high"');
    expect(prompt).toContain('"priority": "immediate"');
  });
});
