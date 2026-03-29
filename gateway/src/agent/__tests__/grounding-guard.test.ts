import { describe, it, expect, vi } from 'vitest';

// Mock the logger before importing the module under test
vi.mock('../../logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

import { checkGrounding, logGroundingMetrics } from '../grounding-guard.js';
import { logger } from '../../logger.js';

describe('checkGrounding', () => {
  it('returns empty array when all IDs are known', () => {
    const result = checkGrounding('Risk R-01 is critical', ['R-01']);
    expect(result.suspectedFabricatedIds).toEqual([]);
  });

  it('detects fabricated IDs not in tool results', () => {
    const result = checkGrounding('Risk R-01 and R-99 found', ['R-01']);
    expect(result.suspectedFabricatedIds).toEqual(['R-99']);
  });
});

describe('logGroundingMetrics', () => {
  it('does not throw on clean result', () => {
    expect(() => logGroundingMetrics({ suspectedFabricatedIds: [] }, 5)).not.toThrow();
  });

  it('does not throw on result with fabrications', () => {
    expect(() => logGroundingMetrics({ suspectedFabricatedIds: ['R-99'] }, 3)).not.toThrow();
  });

  it('logs info for every check', () => {
    logGroundingMetrics({ suspectedFabricatedIds: [] }, 5);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        groundingCheck: expect.objectContaining({
          totalIdsChecked: 5,
          fabricatedIdsFound: 0,
        }),
      }),
      'Grounding guard check completed',
    );
  });

  it('logs warn when fabricated IDs are detected', () => {
    logGroundingMetrics({ suspectedFabricatedIds: ['R-99'] }, 3);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ fabricatedIds: ['R-99'] }),
      'Grounding guard detected possible fabricated IDs',
    );
  });
});
