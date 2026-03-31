import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock prisma
// ---------------------------------------------------------------------------
const mockPrisma = {
  organisationProfile: {
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
  },
  department: {
    findMany: vi.fn(),
  },
  businessProcess: {
    findMany: vi.fn(),
  },
  riskToleranceStatement: {
    findMany: vi.fn(),
  },
  policyDocument: {
    findMany: vi.fn(),
  },
  mcpPendingAction: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock('#src/prisma.js', () => ({ prisma: mockPrisma }));

// ---------------------------------------------------------------------------
// Fake wave-1 documents (non-seeded) for testing
// ---------------------------------------------------------------------------
const FAKE_WAVE1_DOCS = [
  {
    documentId: 'POL-007',
    title: 'Cryptographic Controls Policy',
    documentType: 'POLICY' as const,
    classification: 'INTERNAL' as const,
    approvalLevel: 'EXECUTIVE' as const,
    reviewFrequency: 'ANNUAL' as const,
    wave: 1 as const,
    isoClause: 'A.8.24',
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'Cryptographic controls' },
    ],
    controlMappings: [{ controlRef: 'A.8.24', mappingType: 'IMPLEMENTS' as const, coverage: 'FULL' as const }],
    tags: ['crypto'],
    requiresAcknowledgment: false,
    documentOwner: 'CISO',
  },
  {
    documentId: 'POL-008',
    title: 'Physical Security Policy',
    documentType: 'POLICY' as const,
    classification: 'INTERNAL' as const,
    approvalLevel: 'EXECUTIVE' as const,
    reviewFrequency: 'ANNUAL' as const,
    wave: 1 as const,
    isoClause: 'A.7.1',
    sections: [
      { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'Physical security' },
    ],
    controlMappings: [{ controlRef: 'A.7.1', mappingType: 'IMPLEMENTS' as const, coverage: 'FULL' as const }],
    tags: ['physical'],
    requiresAcknowledgment: false,
    documentOwner: 'CISO',
  },
];

// ---------------------------------------------------------------------------
// Mock #mcp-shared
// ---------------------------------------------------------------------------
const mockCreatePendingAction = vi.fn();

vi.mock('#mcp-shared', () => ({
  prisma: mockPrisma,
  createPendingAction: mockCreatePendingAction,
  getDocumentsByWave: (wave: number) => {
    if (wave === 1) return FAKE_WAVE1_DOCS;
    return [];
  },
  getIsoReference: () => 'Fake ISO reference text.',
  getDefaultOrganisationId: vi.fn(),
  ISO27001_REGISTRY: FAKE_WAVE1_DOCS,
}));

// ---------------------------------------------------------------------------
// Mock @anthropic-ai/sdk
// ---------------------------------------------------------------------------
const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class Anthropic {
      messages = { create: mockCreate };
    },
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ORG_ID = 'org-test-001';

function stubOrgContext() {
  mockPrisma.organisationProfile.findUniqueOrThrow.mockResolvedValue({
    name: 'Test Corp',
    industrySector: 'Technology',
    employeeCount: 100,
    description: 'A test company',
  });
  mockPrisma.department.findMany.mockResolvedValue([{ name: 'IT' }]);
  mockPrisma.businessProcess.findMany.mockResolvedValue([{ name: 'DevOps' }]);
  mockPrisma.riskToleranceStatement.findMany.mockResolvedValue([
    { domain: 'Cyber', appetiteLevel: 'LOW', proposedToleranceLevel: 'MEDIUM' },
  ]);
}

function stubClaudeResponse() {
  mockCreate.mockResolvedValue({
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          purpose: 'Test purpose',
          scope: 'Test scope',
          body: '# Test body',
        }),
      },
    ],
  });
}

function stubPendingActionResult(actionId = 'action-001') {
  mockCreatePendingAction.mockResolvedValue({
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          message: 'Action proposed successfully. Awaiting human approval.',
          actionId,
          actionType: 'CREATE_POLICY',
          status: 'PENDING',
          summary: 'test',
        }),
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('generateIso27001Documents', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Default stubs — no existing docs, no pending actions
    mockPrisma.policyDocument.findMany.mockResolvedValue([]);
    mockPrisma.mcpPendingAction.findMany.mockResolvedValue([]);
    stubOrgContext();
    stubClaudeResponse();
    stubPendingActionResult();
  });

  async function loadEngine() {
    const mod = await import('./generation-engine.js');
    return mod.generateIso27001Documents;
  }

  it('skips documents that already exist in the database', async () => {
    const generateIso27001Documents = await loadEngine();

    // Simulate POL-007 already existing
    mockPrisma.policyDocument.findMany.mockResolvedValue([
      { documentId: 'POL-007' },
    ]);

    const result = await generateIso27001Documents(1, ORG_ID);

    const skippedIds = result.skipped.map((s) => s.documentId);
    expect(skippedIds).toContain('POL-007');

    // POL-007 should NOT appear in generated
    const generatedIds = result.generated.map((g) => g.documentId);
    expect(generatedIds).not.toContain('POL-007');
  });

  it('skips documents with pending actions', async () => {
    const generateIso27001Documents = await loadEngine();

    mockPrisma.mcpPendingAction.findMany.mockResolvedValue([
      { payload: { documentId: 'POL-007' } },
    ]);

    const result = await generateIso27001Documents(1, ORG_ID);

    const skippedIds = result.skipped.map((s) => s.documentId);
    expect(skippedIds).toContain('POL-007');
  });

  it('generates all wave documents when none exist', async () => {
    const generateIso27001Documents = await loadEngine();

    const result = await generateIso27001Documents(1, ORG_ID);

    // Our fake wave 1 has 2 documents
    expect(result.generated.length).toBe(2);
    expect(result.skipped.length).toBe(0);

    // Each generated doc should have a pendingActionId
    for (const g of result.generated) {
      expect(g.pendingActionId).toBe('action-001');
    }

    // createPendingAction should be called once per generated doc
    expect(mockCreatePendingAction).toHaveBeenCalledTimes(2);
  });

  it('returns concurrency error when wave is already running', async () => {
    const { generateIso27001Documents } = await import(
      './generation-engine.js'
    );

    // Make Claude response slow so first call doesn't finish
    mockCreate.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      purpose: 'p',
                      scope: 's',
                      body: 'b',
                    }),
                  },
                ],
              }),
            500,
          ),
        ),
    );

    // Start first generation (don't await)
    const first = generateIso27001Documents(1, ORG_ID);

    // Wait a tick so the first call sets the in-flight flag
    await new Promise((r) => setTimeout(r, 10));

    // Second call should throw
    await expect(generateIso27001Documents(1, ORG_ID)).rejects.toThrow(
      /already in progress/,
    );

    // Clean up — let the first call finish
    await first;
  });
});
