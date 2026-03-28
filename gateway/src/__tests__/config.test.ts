import { afterEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../config.js';
import { DEFAULT_COUNCIL_CONFIG } from '../council/council-types.js';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('DEFAULT_COUNCIL_CONFIG', () => {
  it('has maxTokenBudgetPerMember set to a reasonable value', () => {
    expect(DEFAULT_COUNCIL_CONFIG.maxTokenBudgetPerMember).toBeDefined();
    expect(DEFAULT_COUNCIL_CONFIG.maxTokenBudgetPerMember).toBeGreaterThanOrEqual(10_000);
    expect(DEFAULT_COUNCIL_CONFIG.maxTokenBudgetPerMember).toBe(80_000);
  });
});

describe('loadConfig', () => {
  it('falls back to JWT_SECRET when GATEWAY_SECRET is empty', () => {
    process.env.DATABASE_URL = 'postgresql://riskready:riskready@db:5432/riskready?schema=public';
    process.env.GATEWAY_SECRET = '';
    process.env.JWT_SECRET = 'jwt-fallback-secret';

    const config = loadConfig();

    expect(config.gatewaySecret).toBe('jwt-fallback-secret');
  });
});
