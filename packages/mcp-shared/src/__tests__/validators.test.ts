import { describe, it, expect } from 'vitest';
import { zodUuidOrCuid } from '../security/validators.js';

describe('zodUuidOrCuid', () => {
  it('accepts valid UUID v4', () => {
    expect(() => zodUuidOrCuid.parse('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
  });

  it('accepts valid CUID', () => {
    expect(() => zodUuidOrCuid.parse('clh2k3v0m0000l508hkjrd8s7')).not.toThrow();
  });

  it('rejects arbitrary strings', () => {
    expect(() => zodUuidOrCuid.parse('not-a-valid-id')).toThrow();
  });

  it('rejects empty string', () => {
    expect(() => zodUuidOrCuid.parse('')).toThrow();
  });
});
