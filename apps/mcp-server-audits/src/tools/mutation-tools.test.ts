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
      nonconformity: m(),
      correctiveActionPlan: m(),
    },
  };
});

import { registerMutationTools } from './mutation-tools.js';

describe('audits — registerMutationTools', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test-audits', version: '0.1.0' });
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

    // Nonconformity mutations
    expect(registeredNames).toContain('propose_create_nc');
    expect(registeredNames).toContain('propose_update_nc');
    expect(registeredNames).toContain('propose_transition_nc');
    expect(registeredNames).toContain('propose_close_nc');

    // CAP mutations
    expect(registeredNames).toContain('propose_submit_cap');
    expect(registeredNames).toContain('propose_approve_cap');
    expect(registeredNames).toContain('propose_reject_cap');
  });

  it('registers the correct total number of tools', () => {
    const toolSpy = vi.spyOn(server, 'tool');
    registerMutationTools(server);
    // 4 nonconformity + 3 CAP = 7
    expect(toolSpy).toHaveBeenCalledTimes(7);
  });
});
