import { describe, it, expect } from 'vitest';
import { redactPII } from '../pii-redactor.js';

describe('redactPII', () => {
  it('redacts email addresses', () => {
    expect(redactPII('Contact jane.doe@company.com for details'))
      .toBe('Contact [EMAIL REDACTED] for details');
  });

  it('redacts multiple emails', () => {
    const result = redactPII('From: a@b.com, To: c@d.org');
    expect(result).not.toContain('a@b.com');
    expect(result).not.toContain('c@d.org');
  });

  it('leaves non-PII text unchanged', () => {
    const text = 'Risk R-01 has score 15.5 with 3 scenarios';
    expect(redactPII(text)).toBe(text);
  });

  it('handles empty string', () => {
    expect(redactPII('')).toBe('');
  });
});
