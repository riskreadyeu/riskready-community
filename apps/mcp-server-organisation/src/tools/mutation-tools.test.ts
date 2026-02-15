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
      department: m(),
      location: m(),
      businessProcess: m(),
      externalDependency: m(),
      securityCommittee: m(),
    },
  };
});

import { registerMutationTools } from './mutation-tools.js';

describe('organisation — registerMutationTools', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test-organisation', version: '0.1.0' });
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

    // Profile mutations
    expect(registeredNames).toContain('propose_update_org_profile');

    // Structure mutations
    expect(registeredNames).toContain('propose_create_department');
    expect(registeredNames).toContain('propose_update_department');
    expect(registeredNames).toContain('propose_create_location');
    expect(registeredNames).toContain('propose_update_location');

    // Process mutations
    expect(registeredNames).toContain('propose_create_business_process');
    expect(registeredNames).toContain('propose_update_business_process');
    expect(registeredNames).toContain('propose_create_external_dependency');
    expect(registeredNames).toContain('propose_update_external_dependency');

    // Governance mutations
    expect(registeredNames).toContain('propose_create_committee');
    expect(registeredNames).toContain('propose_update_committee');
    expect(registeredNames).toContain('propose_create_meeting');
  });

  it('registers the correct total number of tools', () => {
    const toolSpy = vi.spyOn(server, 'tool');
    registerMutationTools(server);
    // 1 profile + 4 structure + 4 process + 3 governance = 12
    expect(toolSpy).toHaveBeenCalledTimes(12);
  });
});
