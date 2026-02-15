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
      incident: m(),
      asset: m(),
      control: m(),
    },
  };
});

import { registerMutationTools } from './mutation-tools.js';

describe('incidents — registerMutationTools', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test-incidents', version: '0.1.0' });
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

    // Incident mutations
    expect(registeredNames).toContain('propose_create_incident');
    expect(registeredNames).toContain('propose_update_incident');
    expect(registeredNames).toContain('propose_transition_incident');
    expect(registeredNames).toContain('propose_add_incident_asset');
    expect(registeredNames).toContain('propose_link_incident_control');
    expect(registeredNames).toContain('propose_close_incident');

    // Timeline mutations
    expect(registeredNames).toContain('propose_add_timeline_entry');

    // Lesson mutations
    expect(registeredNames).toContain('propose_create_lesson');
  });

  it('registers the correct total number of tools', () => {
    const toolSpy = vi.spyOn(server, 'tool');
    registerMutationTools(server);
    // 6 incident + 1 timeline + 1 lesson = 8
    expect(toolSpy).toHaveBeenCalledTimes(8);
  });
});
