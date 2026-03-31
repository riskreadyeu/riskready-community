import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('#src/prisma.js', () => {
  const m = () => ({
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  });
  return {
    prisma: {
      mcpPendingAction: m(),
      organisationProfile: m(),
      policyDocument: m(),
      department: m(),
      businessProcess: m(),
      riskToleranceStatement: m(),
    },
  };
});

vi.mock('#mcp-shared', () => ({
  withErrorHandling: (_name: string, handler: Function) => handler,
  createPendingAction: vi.fn(),
  getDefaultOrganisationId: vi.fn().mockResolvedValue('org-test-001'),
  ISO27001_REGISTRY: [
    { documentId: 'POL-007', title: 'Test Doc', documentType: 'POLICY', wave: 1, seeded: false },
  ],
  getDocumentsByWave: vi.fn(),
  getIsoReference: vi.fn(),
}));

vi.mock('#src/iso27001/generation-engine.js', () => ({
  generateIso27001Documents: vi.fn(),
}));

import { registerIso27001Tools } from './iso27001-tools.js';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('policies — registerIso27001Tools', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test-policies', version: '0.1.0' });
  });

  it('is a function', () => {
    expect(typeof registerIso27001Tools).toBe('function');
  });

  it('registers without throwing', () => {
    expect(() => registerIso27001Tools(server)).not.toThrow();
  });

  it('registers both ISO 27001 tools', () => {
    const toolSpy = vi.spyOn(server, 'tool');
    registerIso27001Tools(server);

    const registeredNames = toolSpy.mock.calls.map((call) => call[0]);

    expect(registeredNames).toContain('propose_generate_iso27001_documents');
    expect(registeredNames).toContain('get_iso27001_generation_status');
  });

  it('registers exactly 2 tools', () => {
    const toolSpy = vi.spyOn(server, 'tool');
    registerIso27001Tools(server);
    expect(toolSpy).toHaveBeenCalledTimes(2);
  });
});
