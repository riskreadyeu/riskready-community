import { describe, it, expect, beforeEach } from 'vitest';
import { getParseMetrics, resetParseMetrics, parseCouncilOpinion } from '../council-opinion-parser.js';

describe('Council parse metrics', () => {
  beforeEach(() => {
    resetParseMetrics();
  });

  it('tracks successful JSON parse', () => {
    parseCouncilOpinion('risk-analyst', '```json\n{"findings":[],"recommendations":[],"dissents":[],"dataSources":[],"confidence":"high"}\n```');
    const metrics = getParseMetrics();
    expect(metrics.totalAttempts).toBe(1);
    expect(metrics.jsonSuccess).toBe(1);
    expect(metrics.legacyFallback).toBe(0);
    expect(metrics.failures).toBe(0);
  });

  it('tracks legacy fallback', () => {
    parseCouncilOpinion('risk-analyst', '## Findings\n- [HIGH] **Test finding**: Some description\n## Recommendations\n- [immediate] **Fix it**: Do something');
    const metrics = getParseMetrics();
    expect(metrics.totalAttempts).toBe(1);
    expect(metrics.legacyFallback).toBe(1);
    expect(metrics.jsonSuccess).toBe(0);
  });

  it('tracks legacy fallback for plain text without JSON block', () => {
    parseCouncilOpinion('risk-analyst', 'This is just plain text analysis without any structured format that is long enough to trigger the fallback path for parsing.');
    const metrics = getParseMetrics();
    expect(metrics.totalAttempts).toBe(1);
    expect(metrics.legacyFallback).toBe(1);
  });

  it('accumulates across multiple calls', () => {
    parseCouncilOpinion('risk-analyst', '```json\n{"findings":[],"recommendations":[],"dissents":[],"dataSources":[],"confidence":"high"}\n```');
    parseCouncilOpinion('controls-auditor', '```json\n{"findings":[],"recommendations":[],"dissents":[],"dataSources":[],"confidence":"medium"}\n```');
    const metrics = getParseMetrics();
    expect(metrics.totalAttempts).toBe(2);
    expect(metrics.jsonSuccess).toBe(2);
  });

  it('resets metrics correctly', () => {
    parseCouncilOpinion('risk-analyst', '```json\n{"findings":[],"recommendations":[],"dissents":[],"dataSources":[],"confidence":"high"}\n```');
    expect(getParseMetrics().totalAttempts).toBe(1);
    resetParseMetrics();
    const metrics = getParseMetrics();
    expect(metrics.totalAttempts).toBe(0);
    expect(metrics.jsonSuccess).toBe(0);
    expect(metrics.legacyFallback).toBe(0);
    expect(metrics.failures).toBe(0);
  });

  it('returns a copy of metrics, not the original object', () => {
    const metrics1 = getParseMetrics();
    parseCouncilOpinion('risk-analyst', '```json\n{"findings":[],"recommendations":[],"dissents":[],"dataSources":[],"confidence":"high"}\n```');
    const metrics2 = getParseMetrics();
    expect(metrics1.totalAttempts).toBe(0);
    expect(metrics2.totalAttempts).toBe(1);
  });

  it('tracks mixed parse methods', () => {
    parseCouncilOpinion('risk-analyst', '```json\n{"findings":[],"recommendations":[],"dissents":[],"dataSources":[],"confidence":"high"}\n```');
    parseCouncilOpinion('compliance-officer', '## Findings\n- [HIGH] **Compliance gap**: Missing documentation\n## Recommendations\n- [immediate] **Document**: Create docs');
    parseCouncilOpinion('controls-auditor', '```json\n{"findings":[],"recommendations":[],"dissents":[],"dataSources":[],"confidence":"low"}\n```');
    const metrics = getParseMetrics();
    expect(metrics.totalAttempts).toBe(3);
    expect(metrics.jsonSuccess).toBe(2);
    expect(metrics.legacyFallback).toBe(1);
    expect(metrics.failures).toBe(0);
  });
});
