import { describe, it, expect, vi } from 'vitest';

vi.mock('../../prisma.js', () => ({ prisma: {} }));
vi.mock('../../logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));
vi.mock('@anthropic-ai/sdk', () => ({ default: vi.fn() }));
vi.mock('../council-classifier.js', () => ({ CouncilClassifier: vi.fn() }));
vi.mock('../../agent/message-loop.js', () => ({ runMessageLoop: vi.fn() }));
vi.mock('../../agent/mcp-tool-executor.js', () => ({ McpToolExecutor: vi.fn() }));
vi.mock('../../agent/tool-builder.js', () => ({ buildToolDefinitions: vi.fn() }));

import { calculateWeightedConfidence } from '../council-orchestrator.js';
import type { CouncilOpinionData, CouncilMemberRole } from '../council-types.js';

function makeOpinion(role: CouncilMemberRole, confidence: 'high' | 'medium' | 'low', findingsCount: number): CouncilOpinionData {
  return {
    agentRole: role,
    findings: Array.from({ length: findingsCount }, (_, i) => ({
      title: `Finding ${i}`, severity: 'medium' as const, description: 'test', evidence: [],
    })),
    recommendations: [],
    dissents: [],
    dataSources: Array.from({ length: findingsCount }, (_, i) => `tool_${i}`),
    confidence,
  };
}

describe('calculateWeightedConfidence', () => {
  it('weights members with more findings/data higher', () => {
    const opinions = [
      makeOpinion('risk-analyst', 'high', 5),
      makeOpinion('controls-auditor', 'low', 0),
      makeOpinion('compliance-officer', 'high', 3),
    ];
    expect(calculateWeightedConfidence(opinions)).toBe('high');
  });

  it('returns low when most data-rich members report low', () => {
    const opinions = [
      makeOpinion('risk-analyst', 'low', 5),
      makeOpinion('controls-auditor', 'low', 3),
      makeOpinion('compliance-officer', 'high', 1),
    ];
    expect(calculateWeightedConfidence(opinions)).toBe('low');
  });

  it('returns medium for mixed results', () => {
    const opinions = [
      makeOpinion('risk-analyst', 'high', 2),
      makeOpinion('controls-auditor', 'low', 2),
    ];
    expect(calculateWeightedConfidence(opinions)).toBe('medium');
  });

  it('handles empty opinions array', () => {
    expect(calculateWeightedConfidence([])).toBe('medium');
  });
});
