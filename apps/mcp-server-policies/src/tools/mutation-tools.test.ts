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
      policyDocument: m(),
      documentException: m(),
      policyException: m(),
    },
  };
});

vi.mock('#mcp-shared', () => {
  const { z } = require('zod');
  const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^c[a-z0-9]{24,}$/i;
  return {
    withErrorHandling: (_name: string, handler: Function) => handler,
    createPendingAction: vi.fn(),
    getDefaultOrganisationId: vi.fn().mockResolvedValue('org-test-001'),
    zId: z.string().max(100).regex(ID_PATTERN),
    zSessionId: z.string().max(200).optional(),
    zOrgId: z.string().max(100).regex(ID_PATTERN).optional(),
    zReason: z.string().max(1000).optional(),
  };
});

import { registerMutationTools } from './mutation-tools.js';

describe('policies — registerMutationTools', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test-policies', version: '0.1.0' });
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

    // Document mutations
    expect(registeredNames).toContain('propose_create_policy');
    expect(registeredNames).toContain('propose_update_policy');
    expect(registeredNames).toContain('propose_submit_review');
    expect(registeredNames).toContain('propose_approve_policy');
    expect(registeredNames).toContain('propose_publish_policy');
    expect(registeredNames).toContain('propose_retire_policy');

    // Exception mutations
    expect(registeredNames).toContain('propose_create_exception');
    expect(registeredNames).toContain('propose_approve_exception');

    // Change request mutations
    expect(registeredNames).toContain('propose_create_change_request');
  });

  it('registers the correct total number of tools', () => {
    const toolSpy = vi.spyOn(server, 'tool');
    registerMutationTools(server);
    // 6 document + 2 exception + 1 change request = 9
    expect(toolSpy).toHaveBeenCalledTimes(9);
  });
});
