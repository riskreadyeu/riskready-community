import { describe, it, expect, vi } from 'vitest';

vi.mock('../../prisma.js', () => ({ prisma: {} }));
vi.mock('../../logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));
vi.mock('@anthropic-ai/sdk', () => ({ default: vi.fn() }));
vi.mock('../council-classifier.js', () => ({ CouncilClassifier: vi.fn() }));
vi.mock('../../agent/message-loop.js', () => ({ runMessageLoop: vi.fn() }));
vi.mock('../../agent/mcp-tool-executor.js', () => ({ McpToolExecutor: vi.fn() }));

import { filterReadOnlySchemas } from '../council-orchestrator.js';

describe('filterReadOnlySchemas', () => {
  it('removes propose_* tool schemas', () => {
    const schemas = [
      { name: 'mcp__riskready-risks__list_risks', serverName: 'riskready-risks' },
      { name: 'mcp__riskready-risks__propose_create_risk', serverName: 'riskready-risks' },
      { name: 'mcp__riskready-risks__get_risk', serverName: 'riskready-risks' },
      { name: 'mcp__riskready-risks__propose_update_risk', serverName: 'riskready-risks' },
    ];
    const result = filterReadOnlySchemas(schemas as any);
    expect(result).toHaveLength(2);
    expect(result.every((s: any) => !s.name.includes('propose_'))).toBe(true);
  });

  it('keeps non-mutation tools unchanged', () => {
    const schemas = [
      { name: 'mcp__riskready-risks__list_risks', serverName: 'riskready-risks' },
      { name: 'mcp__riskready-risks__search_risks', serverName: 'riskready-risks' },
    ];
    const result = filterReadOnlySchemas(schemas as any);
    expect(result).toHaveLength(2);
  });

  it('keeps agent-ops read tools but removes mutation tools', () => {
    const schemas = [
      { name: 'mcp__riskready-agent-ops__check_action_status', serverName: 'riskready-agent-ops' },
      { name: 'mcp__riskready-agent-ops__create_agent_task', serverName: 'riskready-agent-ops' },
    ];
    const result = filterReadOnlySchemas(schemas as any);
    expect(result).toHaveLength(1);
    expect(result[0].name).toContain('check_action_status');
  });
});
