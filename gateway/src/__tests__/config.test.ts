import { afterEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../config.js';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
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
