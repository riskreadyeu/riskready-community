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
      asset: m(),
      change: m(),
      control: m(),
      risk: m(),
      capacityPlan: m(),
      softwareLicense: m(),
    },
  };
});

import { registerMutationTools } from './mutation-tools.js';

describe('itsm — registerMutationTools', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test-itsm', version: '0.1.0' });
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

    // Asset mutations
    expect(registeredNames).toContain('propose_asset');
    expect(registeredNames).toContain('propose_asset_update');
    expect(registeredNames).toContain('propose_asset_relationship');
    expect(registeredNames).toContain('propose_link_asset_control');
    expect(registeredNames).toContain('propose_link_asset_risk');
    expect(registeredNames).toContain('propose_delete_asset');

    // Change mutations
    expect(registeredNames).toContain('propose_change');
    expect(registeredNames).toContain('propose_update_change');
    expect(registeredNames).toContain('propose_approve_change');
    expect(registeredNames).toContain('propose_reject_change');
    expect(registeredNames).toContain('propose_implement_change');
    expect(registeredNames).toContain('propose_complete_change');
    expect(registeredNames).toContain('propose_cancel_change');

    // Capacity mutations
    expect(registeredNames).toContain('propose_capacity_plan');
    expect(registeredNames).toContain('propose_update_capacity_plan');
  });

  it('registers the correct total number of tools', () => {
    const toolSpy = vi.spyOn(server, 'tool');
    registerMutationTools(server);
    // 6 asset + 7 change + 0 incident-itsm (placeholder) + 2 capacity = 15
    expect(toolSpy).toHaveBeenCalledTimes(15);
  });
});
