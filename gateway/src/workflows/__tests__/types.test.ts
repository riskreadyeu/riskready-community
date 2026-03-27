import { describe, it, expect } from 'vitest';
import { getWorkflowById, BUILT_IN_WORKFLOWS } from '../types.js';

describe('getWorkflowById', () => {
  it('returns a workflow definition by ID', () => {
    const result = getWorkflowById('weekly-risk-review');
    expect(result).toBeDefined();
    expect(result!.id).toBe('weekly-risk-review');
    expect(result!.name).toBe('Weekly Risk Review');
  });

  it('returns undefined for unknown workflow ID', () => {
    const result = getWorkflowById('nonexistent-workflow');
    expect(result).toBeUndefined();
  });

  it('returns all four built-in workflows by their IDs', () => {
    const ids = ['incident-response-flow', 'weekly-risk-review', 'control-assurance-cycle', 'policy-compliance-check'];
    for (const id of ids) {
      expect(getWorkflowById(id)).toBeDefined();
    }
  });
});
