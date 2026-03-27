import { describe, it, expect } from 'vitest';
import { isValidUUID, truncateString } from '../validators.js';

describe('isValidUUID', () => {
  it('accepts valid UUID v4', () => {
    expect(isValidUUID('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
  });

  it('accepts uppercase UUID', () => {
    expect(isValidUUID('A1B2C3D4-E5F6-7890-ABCD-EF1234567890')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });

  it('rejects non-UUID string', () => {
    expect(isValidUUID('action-123')).toBe(false);
  });

  it('rejects UUID with wrong length', () => {
    expect(isValidUUID('a1b2c3d4-e5f6-7890-abcd-ef123456789')).toBe(false);
  });

  it('rejects string with injection payload', () => {
    expect(isValidUUID('a1b2c3d4-e5f6-7890-abcd-ef1234567890; DROP TABLE')).toBe(false);
  });
});

describe('truncateString', () => {
  it('returns string unchanged if under limit', () => {
    expect(truncateString('hello', 10)).toBe('hello');
  });

  it('truncates and adds suffix when over limit', () => {
    const result = truncateString('a'.repeat(100), 50);
    expect(result.length).toBeLessThanOrEqual(50 + '[TRUNCATED]'.length);
    expect(result).toContain('[TRUNCATED]');
  });

  it('handles exact length', () => {
    expect(truncateString('hello', 5)).toBe('hello');
  });
});
