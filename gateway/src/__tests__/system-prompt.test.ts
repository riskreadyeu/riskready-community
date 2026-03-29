// gateway/src/__tests__/system-prompt.test.ts

import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT } from '../agent/system-prompt.js';

describe('SYSTEM_PROMPT', () => {
  it('contains a <compliance_disclaimer> section', () => {
    expect(SYSTEM_PROMPT).toContain('<compliance_disclaimer>');
    expect(SYSTEM_PROMPT).toContain('</compliance_disclaimer>');
  });

  it('instructs agent to mention "qualified compliance professional"', () => {
    expect(SYSTEM_PROMPT).toContain('qualified compliance professional');
  });

  it('contains a <context> section', () => {
    expect(SYSTEM_PROMPT).toContain('<context>');
    expect(SYSTEM_PROMPT).toContain('</context>');
  });

  it('replaces {DATE} placeholder with the current date', () => {
    expect(SYSTEM_PROMPT).not.toContain('{DATE}');
    const today = new Date().toISOString().split('T')[0];
    expect(SYSTEM_PROMPT).toContain(`Today's date: ${today}`);
  });
});
