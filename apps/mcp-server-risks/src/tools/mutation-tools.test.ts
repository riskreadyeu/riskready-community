import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

vi.mock('#src/prisma.js', () => {
  const m = () => ({
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  });
  return {
    prisma: {
      mcpPendingAction: m(),
      organisationProfile: m(),
      risk: m(),
      riskScenario: m(),
      keyRiskIndicator: m(),
      riskToleranceStatement: m(),
      treatmentPlan: m(),
    },
  };
});

import { registerMutationTools } from './mutation-tools.js';

describe('risks — registerMutationTools', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test-risks', version: '0.1.0' });
  });

  it('is a function', () => {
    expect(typeof registerMutationTools).toBe('function');
  });

  it('registers without throwing', () => {
    expect(() => registerMutationTools(server)).not.toThrow();
  });

  it('registers all expected mutation tools', () => {
    const toolSpy = vi.spyOn(server, 'tool');
    registerMutationTools(server);

    const registeredNames = toolSpy.mock.calls.map((call) => call[0]);

    // Risk mutations
    expect(registeredNames).toContain('propose_create_risk');
    expect(registeredNames).toContain('propose_update_risk');
    expect(registeredNames).toContain('propose_create_kri');
    expect(registeredNames).toContain('propose_record_kri_value');
    expect(registeredNames).toContain('propose_create_rts');
    expect(registeredNames).toContain('propose_approve_rts');

    // Scenario mutations
    expect(registeredNames).toContain('propose_create_scenario');
    expect(registeredNames).toContain('propose_transition_scenario');
    expect(registeredNames).toContain('propose_assess_scenario');

    // Treatment mutations
    expect(registeredNames).toContain('propose_create_treatment_plan');
    expect(registeredNames).toContain('propose_create_treatment_action');
  });

  it('registers the correct total number of tools', () => {
    const toolSpy = vi.spyOn(server, 'tool');
    registerMutationTools(server);
    // 6 risk + 3 scenario + 2 treatment = 11
    expect(toolSpy).toHaveBeenCalledTimes(11);
  });
});
