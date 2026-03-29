import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock prisma before importing the module under test
vi.mock('#src/prisma.js', () => {
  const m = () => ({
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    groupBy: vi.fn(),
  });
  return {
    prisma: {
      risk: m(),
      riskScenario: m(),
      keyRiskIndicator: m(),
      treatmentPlan: m(),
    },
  };
});

import { prisma } from '#src/prisma.js';
import { registerRiskTools } from '../risk-tools.js';

// Helper to extract a registered tool handler from the server spy
function getToolHandler(toolSpy: ReturnType<typeof vi.spyOn>, toolName: string) {
  const call = toolSpy.mock.calls.find((c) => c[0] === toolName);
  if (!call) throw new Error(`Tool "${toolName}" not registered`);
  // Handler is the last argument (index 3: name, description, schema, handler)
  return call[3] as (...args: unknown[]) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>;
}

function parseToolResult(result: { content: Array<{ type: string; text: string }> }) {
  return JSON.parse(result.content[0].text);
}

describe('risk-tools — tool behavior', () => {
  let server: McpServer;
  let toolSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'test-risks', version: '0.1.0' });
    toolSpy = vi.spyOn(server, 'tool');
    registerRiskTools(server);
  });

  it('registers list_risks, get_risk, search_risks, and get_risk_stats', () => {
    const registeredNames = toolSpy.mock.calls.map((call) => call[0]);
    expect(registeredNames).toContain('list_risks');
    expect(registeredNames).toContain('get_risk');
    expect(registeredNames).toContain('search_risks');
    expect(registeredNames).toContain('get_risk_stats');
  });

  describe('list_risks', () => {
    it('calls prisma.risk.findMany and count with correct default params', async () => {
      const mockRisks = [
        { id: 'r1', riskId: 'R-01', title: 'Risk 1', status: 'IDENTIFIED' },
      ];
      (prisma.risk.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockRisks);
      (prisma.risk.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const handler = getToolHandler(toolSpy, 'list_risks');
      const result = await handler({ skip: 0, take: 50 });
      const data = parseToolResult(result);

      expect(prisma.risk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 50,
          orderBy: { riskId: 'asc' },
        }),
      );
      expect(prisma.risk.count).toHaveBeenCalledWith({ where: {} });
      expect(data.results).toEqual(mockRisks);
      expect(data.total).toBe(1);
    });

    it('applies status filter to the where clause', async () => {
      (prisma.risk.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.risk.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const handler = getToolHandler(toolSpy, 'list_risks');
      await handler({ status: 'TREATING', skip: 0, take: 50 });

      expect(prisma.risk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'TREATING' },
        }),
      );
    });

    it('applies organisationId filter when provided', async () => {
      (prisma.risk.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.risk.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const handler = getToolHandler(toolSpy, 'list_risks');
      await handler({ organisationId: 'org-123', skip: 0, take: 10 });

      expect(prisma.risk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organisationId: 'org-123' },
        }),
      );
    });

    it('returns a note when no risks match', async () => {
      (prisma.risk.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.risk.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const handler = getToolHandler(toolSpy, 'list_risks');
      const result = await handler({ skip: 0, take: 50 });
      const data = parseToolResult(result);

      expect(data.total).toBe(0);
      expect(data.note).toContain('No risks found');
    });

    it('combines multiple filters', async () => {
      (prisma.risk.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.risk.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const handler = getToolHandler(toolSpy, 'list_risks');
      await handler({
        status: 'ASSESSED',
        tier: 'CORE',
        framework: 'ISO',
        organisationId: 'org-1',
        skip: 10,
        take: 25,
      });

      expect(prisma.risk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'ASSESSED',
            tier: 'CORE',
            framework: 'ISO',
            organisationId: 'org-1',
          },
          skip: 10,
          take: 25,
        }),
      );
    });
  });

  describe('get_risk', () => {
    it('returns risk details when found', async () => {
      const mockRisk = {
        id: 'r1',
        riskId: 'R-01',
        title: 'Cyber Attack',
        scenarios: [],
        kris: [],
        treatmentPlans: [],
        toleranceStatements: [],
      };
      (prisma.risk.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockRisk);

      const handler = getToolHandler(toolSpy, 'get_risk');
      const result = await handler({ id: 'r1' });
      const data = parseToolResult(result);

      expect(data.id).toBe('r1');
      expect(data.title).toBe('Cyber Attack');
      expect(prisma.risk.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'r1' },
        }),
      );
    });

    it('returns isError when risk not found', async () => {
      (prisma.risk.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const handler = getToolHandler(toolSpy, 'get_risk');
      const result = await handler({ id: 'nonexistent' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found');
    });

    it('filters by organisationId when provided', async () => {
      (prisma.risk.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const handler = getToolHandler(toolSpy, 'get_risk');
      await handler({ id: 'r1', organisationId: 'org-123' });

      expect(prisma.risk.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'r1', organisationId: 'org-123' },
        }),
      );
    });
  });

  describe('search_risks', () => {
    it('searches by query across riskId, title, and description', async () => {
      const mockResults = [{ id: 'r1', riskId: 'R-01', title: 'Cyber Risk' }];
      (prisma.risk.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockResults);

      const handler = getToolHandler(toolSpy, 'search_risks');
      const result = await handler({ query: 'cyber' });
      const data = parseToolResult(result);

      expect(prisma.risk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ riskId: { contains: 'cyber', mode: 'insensitive' } }),
              expect.objectContaining({ title: { contains: 'cyber', mode: 'insensitive' } }),
              expect.objectContaining({ description: { contains: 'cyber', mode: 'insensitive' } }),
            ]),
          }),
          take: 50,
        }),
      );
      expect(data.results).toEqual(mockResults);
      expect(data.count).toBe(1);
    });

    it('filters by organisationId when provided', async () => {
      (prisma.risk.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const handler = getToolHandler(toolSpy, 'search_risks');
      await handler({ query: 'test', organisationId: 'org-1' });

      expect(prisma.risk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organisationId: 'org-1',
          }),
        }),
      );
    });

    it('returns note when no results match', async () => {
      (prisma.risk.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const handler = getToolHandler(toolSpy, 'search_risks');
      const result = await handler({ query: 'nonexistent' });
      const data = parseToolResult(result);

      expect(data.count).toBe(0);
      expect(data.note).toContain("No risks matched");
    });
  });

  describe('get_risk_stats', () => {
    it('returns aggregate statistics', async () => {
      (prisma.risk.count as ReturnType<typeof vi.fn>).mockResolvedValue(15);
      (prisma.risk.groupBy as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ status: 'IDENTIFIED', _count: 5 }]) // byStatus
        .mockResolvedValueOnce([{ tier: 'CORE', _count: 10 }])        // byTier
        .mockResolvedValueOnce([{ framework: 'ISO', _count: 15 }]);   // byFramework
      (prisma.riskScenario.count as ReturnType<typeof vi.fn>).mockResolvedValue(30);
      (prisma.keyRiskIndicator.count as ReturnType<typeof vi.fn>).mockResolvedValue(10);
      (prisma.treatmentPlan.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);

      const handler = getToolHandler(toolSpy, 'get_risk_stats');
      const result = await handler({});
      const data = parseToolResult(result);

      expect(data.total).toBe(15);
      expect(data.scenarioCount).toBe(30);
      expect(data.kriCount).toBe(10);
      expect(data.treatmentCount).toBe(5);
      expect(data.byStatus).toEqual({ IDENTIFIED: 5 });
      expect(data.byTier).toEqual({ CORE: 10 });
      expect(data.byFramework).toEqual({ ISO: 15 });
    });

    it('applies organisationId filter when provided', async () => {
      (prisma.risk.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (prisma.risk.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.riskScenario.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (prisma.keyRiskIndicator.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (prisma.treatmentPlan.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const handler = getToolHandler(toolSpy, 'get_risk_stats');
      await handler({ organisationId: 'org-1' });

      expect(prisma.risk.count).toHaveBeenCalledWith({
        where: { organisationId: 'org-1' },
      });
    });
  });

  describe('error handling', () => {
    it('returns error response instead of throwing when prisma fails', async () => {
      (prisma.risk.findMany as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Connection refused'),
      );
      (prisma.risk.count as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Connection refused'),
      );

      const handler = getToolHandler(toolSpy, 'list_risks');
      const result = await handler({ skip: 0, take: 50 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error in list_risks');
    });
  });
});
