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
      evidence: m(),
      evidenceRequest: m(),
    },
  };
});

import { registerMutationTools } from './mutation-tools.js';

describe('evidence — registerMutationTools', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test-evidence', version: '0.1.0' });
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

    // Evidence mutations
    expect(registeredNames).toContain('propose_create_evidence');
    expect(registeredNames).toContain('propose_update_evidence');
    expect(registeredNames).toContain('propose_link_evidence');

    // Request mutations
    expect(registeredNames).toContain('propose_create_request');
    expect(registeredNames).toContain('propose_fulfill_request');
    expect(registeredNames).toContain('propose_close_request');
  });

  it('registers the correct total number of tools', () => {
    const toolSpy = vi.spyOn(server, 'tool');
    registerMutationTools(server);
    // 3 evidence + 3 request = 6
    expect(toolSpy).toHaveBeenCalledTimes(6);
  });
});
