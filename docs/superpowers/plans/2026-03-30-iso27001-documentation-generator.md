# ISO 27001:2022 Documentation Generator — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete ISO 27001:2022 documentation to RiskReady — 18 new seed documents for the ClearStream demo plus a generation feature (MCP tool + NestJS endpoint + frontend button) that creates tailored docs for any organisation.

**Architecture:** Document registry in mcp-shared defines all 28 ISO docs (metadata, sections, control mappings). Generation engine in mcp-server-policies calls Claude API per document using org context + bundled ISO reference excerpts. Each generated doc becomes a pending action for human approval. Frontend shows coverage card with generate buttons.

**Tech Stack:** TypeScript, Prisma, NestJS, Fastify MCP server, React, TanStack Query, Anthropic SDK, Zod, Vitest

**Spec:** `docs/superpowers/specs/2026-03-30-iso27001-documentation-generator-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `packages/mcp-shared/src/iso27001/types.ts` | Shared TypeScript types for document registry entries |
| `packages/mcp-shared/src/iso27001/document-registry.ts` | 28 document definitions with metadata, sections, control mappings, wave assignments |
| `packages/mcp-shared/src/iso27001/iso-references/wave1.ts` | Bundled ISO clause text for wave 1 documents (6.1.2, 7.5, 9.2, 9.3, 7.2/7.3) |
| `packages/mcp-shared/src/iso27001/iso-references/wave2.ts` | Bundled ISO control guidance for wave 2 documents (A.6, A.7, A.5, A.8) |
| `packages/mcp-shared/src/iso27001/iso-references/wave3.ts` | Bundled ISO control guidance for wave 3 documents (A.8, A.7, A.5) |
| `packages/mcp-shared/src/iso27001/iso-references/index.ts` | Exports lookup function: `getIsoReference(documentId) → string` |
| `packages/mcp-shared/src/iso27001/index.ts` | Barrel export for registry, types, references |
| `apps/mcp-server-policies/src/iso27001/generation-engine.ts` | Core: read org context → read refs → call Claude → create pending actions |
| `apps/mcp-server-policies/src/iso27001/generation-engine.test.ts` | Tests for generation engine |
| `apps/mcp-server-policies/src/tools/iso27001-tools.ts` | MCP tools: `propose_generate_iso27001_documents`, `get_iso27001_generation_status` |
| `apps/mcp-server-policies/src/tools/iso27001-tools.test.ts` | Tests for ISO 27001 MCP tools |
| `apps/server/prisma/seed/demo/seed-policies-iso27001.ts` | 18 new ClearStream policy documents |
| `apps/server/src/policies/services/iso27001-generation.service.ts` | NestJS thin service for HTTP-driven generation |
| `apps/web/src/components/policies/Iso27001CoverageCard.tsx` | Dashboard coverage card component |
| `apps/web/src/hooks/queries/use-iso27001-queries.ts` | React Query hooks for status and generation |

### Modified Files

| File | Change |
|------|--------|
| `packages/mcp-shared/src/index.ts` | Add `export * from './iso27001/index.js'` |
| `apps/mcp-server-policies/src/index.ts` | Register ISO 27001 tools |
| `apps/server/src/mcp-approval/executors/policy.executors.ts` | Extend CREATE_POLICY executor for control/risk mappings |
| `apps/server/src/policies/controllers/policy-document.controller.ts` | Add generate and status endpoints |
| `apps/server/src/policies/policies.module.ts` | Register Iso27001GenerationService |
| `apps/server/prisma/seed/demo/index.ts` | Call new seed file |
| `apps/web/src/pages/policies/PoliciesDashboardPage.tsx` | Add Iso27001CoverageCard |

---

## Chunk 1: Shared Types and Document Registry

### Task 1: Create shared ISO 27001 types

**Files:**
- Create: `packages/mcp-shared/src/iso27001/types.ts`

- [ ] **Step 1: Create types file**

```typescript
// packages/mcp-shared/src/iso27001/types.ts

export interface Iso27001DocumentDef {
  documentId: string;
  title: string;
  documentType: 'POLICY' | 'STANDARD' | 'PROCEDURE';
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  approvalLevel: 'BOARD' | 'EXECUTIVE' | 'SENIOR_MANAGEMENT' | 'MANAGEMENT' | 'TEAM_LEAD' | 'PROCESS_OWNER';
  reviewFrequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'BIENNIAL' | 'TRIENNIAL' | 'ON_CHANGE' | 'AS_NEEDED';
  wave: 1 | 2 | 3;
  isoClause?: string;
  sections: SectionDef[];
  controlMappings: ControlMappingDef[];
  riskMappings?: RiskMappingDef[];
  tags: string[];
  requiresAcknowledgment: boolean;
  parentDocumentId?: string;
  documentOwner: string;
  seeded?: boolean;
}

export interface SectionDef {
  sectionType: string;
  title: string;
  promptHint: string;
  isoReference?: string;
}

export interface ControlMappingDef {
  controlRef: string;
  mappingType: 'IMPLEMENTS' | 'SUPPORTS' | 'REFERENCES';
  coverage: 'FULL' | 'PARTIAL';
}

export interface RiskMappingDef {
  riskRef: string;
  mappingType: 'MITIGATES' | 'ADDRESSES' | 'MONITORS';
}

export interface GenerationResult {
  wave: number;
  generated: { documentId: string; title: string; pendingActionId: string }[];
  skipped: { documentId: string; title: string; reason: string }[];
  summary: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/daniel/projects/riskready-community && npx tsc --noEmit -p packages/mcp-shared/tsconfig.json 2>&1 | head -20`
Expected: No errors related to types.ts

- [ ] **Step 3: Commit**

```bash
git add packages/mcp-shared/src/iso27001/types.ts
git commit -m "feat(iso27001): add shared types for document registry"
```

### Task 2: Create document registry with all 28 documents

**Files:**
- Create: `packages/mcp-shared/src/iso27001/document-registry.ts`

This is the core data structure. Each document has metadata, section structure with prompt hints, and control mappings.

- [ ] **Step 1: Create the registry file with all 28 document definitions**

The file exports `ISO27001_REGISTRY: Iso27001DocumentDef[]` containing all 28 entries. Structure each document with:

1. The 12 existing seeded docs marked `seeded: true` (POL-001 through POL-008, STD-001 through STD-004)
2. Wave 1 (5 docs): POL-009 through POL-013
3. Wave 2 (8 docs): POL-014 through POL-021
4. Wave 3 (5 docs): STD-005 through STD-009

Every non-seeded document must have these 9 mandatory sections in its `sections[]`:
- `DOCUMENT_OWNER` — "Specify the named role accountable for this policy"
- `SCOPE` — "Define entities, functions, assets, third parties this applies to"
- `MANAGEMENT_APPROVAL` — "State the management body that approves this policy"
- `REVIEW_CADENCE` — "Annual minimum, plus triggered review after major ICT incidents or regulatory changes"
- `VERSION_HISTORY` — "Version tracking and amendment traceability"
- `RISK_APPETITE_ALIGNMENT` — "Link to the organisation's documented ICT risk tolerance"
- `ROLES_AND_RESPONSIBILITIES` — "Who owns execution vs. oversight"
- `EXCEPTIONS_PROCESS` — "How deviations are requested, approved, and tracked"
- `AWARENESS` — "How staff receive and acknowledge the policy"

Plus domain-specific sections with `promptHint` referencing the relevant ISO clause/control.

Example entry for POL-009:
```typescript
{
  documentId: 'POL-009',
  title: 'Risk Management Methodology',
  documentType: 'PROCEDURE',
  classification: 'CONFIDENTIAL',
  approvalLevel: 'BOARD',
  reviewFrequency: 'ANNUAL',
  wave: 1,
  isoClause: '6.1.2, 8.2',
  documentOwner: 'CISO',
  requiresAcknowledgment: true,
  tags: ['ISO 27001', 'risk management', 'risk assessment', 'ISMS'],
  sections: [
    { sectionType: 'DOCUMENT_OWNER', title: 'Document Owner', promptHint: 'Specify the CISO as accountable owner' },
    { sectionType: 'PURPOSE', title: 'Purpose', promptHint: 'Establish the risk assessment and treatment methodology per ISO 27001 Clause 6.1.2' },
    { sectionType: 'SCOPE', title: 'Scope', promptHint: 'All information assets, processes, and third parties within the ISMS scope' },
    { sectionType: 'RISK_CRITERIA', title: 'Risk Criteria', promptHint: 'Define likelihood and impact scales (5x5 matrix), risk acceptance threshold. Reference ISO 27001 Clause 6.1.2 a)' },
    { sectionType: 'RISK_ASSESSMENT_PROCESS', title: 'Risk Assessment Process', promptHint: 'Steps: identify risks (CIA threats), analyse (likelihood x impact), evaluate against acceptance criteria. Per Clause 6.1.2 b-d' },
    { sectionType: 'RISK_TREATMENT', title: 'Risk Treatment Process', promptHint: 'Treatment options: modify, accept, avoid, share. Control selection from Annex A. Per Clause 6.1.3' },
    { sectionType: 'RISK_APPETITE_ALIGNMENT', title: 'Risk Appetite Alignment', promptHint: 'Reference the organisations documented risk tolerance statements' },
    { sectionType: 'ROLES_AND_RESPONSIBILITIES', title: 'Roles and Responsibilities', promptHint: 'Risk owners, CISO oversight, management review, board reporting' },
    { sectionType: 'REVIEW_CADENCE', title: 'Review Schedule', promptHint: 'Annual review plus triggered review after major incidents or regulatory changes' },
    { sectionType: 'EXCEPTIONS_PROCESS', title: 'Exceptions', promptHint: 'Process for accepting risks above threshold with risk owner sign-off' },
    { sectionType: 'AWARENESS', title: 'Awareness', promptHint: 'Training on risk assessment methodology for all risk owners' },
    { sectionType: 'MANAGEMENT_APPROVAL', title: 'Approval', promptHint: 'Board-level approval required' },
    { sectionType: 'VERSION_HISTORY', title: 'Version History', promptHint: 'Amendment tracking table' },
  ],
  controlMappings: [],  // Clause-level doc, not Annex A control-specific
  riskMappings: [],
}
```

Follow this pattern for all 18 new documents. Use the document list from the spec for IDs, titles, types, controls.

Also export helper functions:
```typescript
export function getDocumentsByWave(wave: 1 | 2 | 3): Iso27001DocumentDef[] {
  return ISO27001_REGISTRY.filter(d => d.wave === wave && !d.seeded);
}

export function getDocumentById(documentId: string): Iso27001DocumentDef | undefined {
  return ISO27001_REGISTRY.find(d => d.documentId === documentId);
}

export function getAllDocumentIds(): string[] {
  return ISO27001_REGISTRY.map(d => d.documentId);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/daniel/projects/riskready-community && npx tsc --noEmit -p packages/mcp-shared/tsconfig.json 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add packages/mcp-shared/src/iso27001/document-registry.ts
git commit -m "feat(iso27001): add complete 28-document registry with sections and control mappings"
```

### Task 3: Bundle ISO reference excerpts

**Files:**
- Create: `packages/mcp-shared/src/iso27001/iso-references/wave1.ts`
- Create: `packages/mcp-shared/src/iso27001/iso-references/wave2.ts`
- Create: `packages/mcp-shared/src/iso27001/iso-references/wave3.ts`
- Create: `packages/mcp-shared/src/iso27001/iso-references/index.ts`

Read the ISO reference files from the skills directory to extract relevant sections:
- `~/.claude/skills/iso27001-lead-implementer/references/iso27001.md` — clause requirements
- `~/.claude/skills/iso27001-lead-implementer/references/is27002.md` — control implementation guidance

- [ ] **Step 1: Read skill reference files and extract relevant sections**

Read the ISO 27001 and 27002 reference files. For each document in the registry, extract only the clause/control text that's relevant.

- [ ] **Step 2: Create wave1.ts with clause excerpts**

```typescript
// packages/mcp-shared/src/iso27001/iso-references/wave1.ts
// Bundled ISO 27001 clause text for Wave 1 mandatory documents

export const WAVE1_REFERENCES: Record<string, string> = {
  'POL-009': `
## ISO 27001:2022 Clause 6.1.2 — Information Security Risk Assessment
[Extracted clause text about risk assessment methodology requirements]

## ISO 27001:2022 Clause 8.2 — Information Security Risk Assessment (operational)
[Extracted clause text about performing risk assessments at planned intervals]
`,
  'POL-010': `
## ISO 27001:2022 Clause 7.5 — Documented Information
[Extracted clause text about creating, updating, controlling documented information]
`,
  // ... POL-011, POL-012, POL-013
};
```

- [ ] **Step 3: Create wave2.ts with Annex A control guidance**

Same pattern — for each wave 2 document, extract the relevant control statements and guidance from ISO 27002.

- [ ] **Step 4: Create wave3.ts with Annex A control guidance**

Same pattern for wave 3 documents.

- [ ] **Step 5: Create index.ts barrel export**

```typescript
// packages/mcp-shared/src/iso27001/iso-references/index.ts
import { WAVE1_REFERENCES } from './wave1.js';
import { WAVE2_REFERENCES } from './wave2.js';
import { WAVE3_REFERENCES } from './wave3.js';

const ALL_REFERENCES: Record<string, string> = {
  ...WAVE1_REFERENCES,
  ...WAVE2_REFERENCES,
  ...WAVE3_REFERENCES,
};

export function getIsoReference(documentId: string): string {
  return ALL_REFERENCES[documentId] ?? '';
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd /home/daniel/projects/riskready-community && npx tsc --noEmit -p packages/mcp-shared/tsconfig.json 2>&1 | head -20`

- [ ] **Step 7: Commit**

```bash
git add packages/mcp-shared/src/iso27001/iso-references/
git commit -m "feat(iso27001): bundle ISO 27001/27002 reference excerpts per document"
```

### Task 4: Create barrel export and wire into mcp-shared

**Files:**
- Create: `packages/mcp-shared/src/iso27001/index.ts`
- Modify: `packages/mcp-shared/src/index.ts`

- [ ] **Step 1: Create barrel export**

```typescript
// packages/mcp-shared/src/iso27001/index.ts
export * from './types.js';
export * from './document-registry.js';
export { getIsoReference } from './iso-references/index.js';
```

- [ ] **Step 2: Add to mcp-shared main exports**

In `packages/mcp-shared/src/index.ts`, add:
```typescript
export * from './iso27001/index.js';
```

- [ ] **Step 3: Verify build**

Run: `cd /home/daniel/projects/riskready-community/packages/mcp-shared && npm run build 2>&1 | tail -10`

- [ ] **Step 4: Commit**

```bash
git add packages/mcp-shared/src/iso27001/index.ts packages/mcp-shared/src/index.ts
git commit -m "feat(iso27001): export registry and references from mcp-shared"
```

---

## Chunk 2: Generation Engine and MCP Tools

### Task 5: Create generation engine

**Files:**
- Create: `apps/mcp-server-policies/src/iso27001/generation-engine.ts`

The engine reads org context from DB, builds prompts per document, calls Claude API, creates pending actions.

- [ ] **Step 1: Create generation engine file**

```typescript
// apps/mcp-server-policies/src/iso27001/generation-engine.ts
import Anthropic from '@anthropic-ai/sdk';
import {
  ISO27001_REGISTRY,
  getDocumentsByWave,
  getIsoReference,
  type GenerationResult,
  type Iso27001DocumentDef,
} from '#mcp-shared';
import { createPendingAction, prisma } from '#mcp-shared';
import { McpActionType } from '@prisma/client';

// In-memory concurrency flags per wave
const generationInProgress = new Map<number, boolean>();

export async function generateIso27001Documents(
  wave: 1 | 2 | 3,
  organisationId: string,
  mcpSessionId?: string,
): Promise<GenerationResult> {
  // Concurrency check
  if (generationInProgress.get(wave)) {
    return {
      wave,
      generated: [],
      skipped: [],
      summary: `Generation already in progress for wave ${wave}.`,
    };
  }

  generationInProgress.set(wave, true);

  try {
    // 1. Read org context
    const orgContext = await readOrgContext(organisationId);

    // 2. Filter registry — skip seeded, existing docs, and pending actions
    const candidates = getDocumentsByWave(wave);
    const { toGenerate, skipped } = await filterExisting(candidates, organisationId);

    if (toGenerate.length === 0) {
      return {
        wave,
        generated: [],
        skipped,
        summary: `All wave ${wave} documents already exist or are pending approval.`,
      };
    }

    // 3. Generate each document
    const anthropic = new Anthropic();
    const generated: GenerationResult['generated'] = [];

    for (const doc of toGenerate) {
      try {
        const content = await generateDocumentContent(anthropic, doc, orgContext);
        // createPendingAction returns MCP response format: { content: [{ type, text }] }
        // Parse the actionId from the JSON string inside content[0].text
        const mcpResult = await createPendingAction({
          actionType: McpActionType.CREATE_POLICY,
          summary: `Create ${doc.title} (${doc.documentId}) — Wave ${wave} of ISO 27001 documentation set`,
          reason: `ISO 27001:2022 ${doc.isoClause || doc.controlMappings.map(c => c.controlRef).join(', ')} compliance`,
          payload: {
            documentId: doc.documentId,
            title: doc.title,
            documentType: doc.documentType,
            classification: doc.classification,
            approvalLevel: doc.approvalLevel,
            reviewFrequency: doc.reviewFrequency,
            version: '1.0',
            majorVersion: 1,
            minorVersion: 0,
            purpose: content.purpose,
            scope: content.scope,
            content: content.body,
            documentOwner: doc.documentOwner,
            author: 'RiskReady ISO 27001 Generator',
            status: 'DRAFT',
            tags: doc.tags,
            requiresAcknowledgment: doc.requiresAcknowledgment,
            acknowledgmentDeadline: doc.requiresAcknowledgment ? 30 : undefined,
            parentDocumentId: doc.parentDocumentId,
            controlMappings: doc.controlMappings,
            riskMappings: doc.riskMappings ?? [],
            organisationId,
          },
          mcpToolName: 'propose_generate_iso27001_documents',
          mcpSessionId,
          organisationId,
        });

        const parsed = JSON.parse(mcpResult.content[0].text);
        generated.push({
          documentId: doc.documentId,
          title: doc.title,
          pendingActionId: parsed.actionId,
        });
      } catch (err) {
        skipped.push({
          documentId: doc.documentId,
          title: doc.title,
          reason: `Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
      }
    }

    return {
      wave,
      generated,
      skipped,
      summary: `Generated ${generated.length} documents for Wave ${wave}. ${skipped.length} skipped.`,
    };
  } finally {
    generationInProgress.set(wave, false);
  }
}

async function readOrgContext(organisationId: string) {
  const [org, departments, processes, tolerances] = await Promise.all([
    prisma.organisationProfile.findFirst({ where: { organisationId } }),
    prisma.department.findMany({ where: { organisationId } }),
    prisma.process.findMany({ where: { organisationId } }),
    prisma.riskToleranceStatement.findMany({ where: { organisationId } }),
  ]);

  // Also get existing policy titles for cross-references
  const existingPolicies = await prisma.policyDocument.findMany({
    where: { organisationId, deletedAt: null },
    select: { documentId: true, title: true },
  });

  return { org, departments, processes, tolerances, existingPolicies };
}

async function filterExisting(
  candidates: Iso27001DocumentDef[],
  organisationId: string,
): Promise<{
  toGenerate: Iso27001DocumentDef[];
  skipped: GenerationResult['skipped'];
}> {
  const existingDocs = await prisma.policyDocument.findMany({
    where: { organisationId, deletedAt: null },
    select: { documentId: true },
  });
  const existingIds = new Set(existingDocs.map(d => d.documentId));

  // Check pending actions too
  const pendingActions = await prisma.mcpPendingAction.findMany({
    where: { organisationId, status: 'PENDING', actionType: 'CREATE_POLICY' },
    select: { payload: true },
  });
  const pendingIds = new Set(
    pendingActions
      .map(a => (a.payload as Record<string, unknown>)?.documentId as string)
      .filter(Boolean),
  );

  const toGenerate: Iso27001DocumentDef[] = [];
  const skipped: GenerationResult['skipped'] = [];

  for (const doc of candidates) {
    if (existingIds.has(doc.documentId)) {
      skipped.push({ documentId: doc.documentId, title: doc.title, reason: 'Already exists' });
    } else if (pendingIds.has(doc.documentId)) {
      skipped.push({ documentId: doc.documentId, title: doc.title, reason: 'Pending approval' });
    } else {
      toGenerate.push(doc);
    }
  }

  return { toGenerate, skipped };
}

interface GeneratedContent {
  purpose: string;
  scope: string;
  body: string;
}

async function generateDocumentContent(
  anthropic: Anthropic,
  doc: Iso27001DocumentDef,
  orgContext: Awaited<ReturnType<typeof readOrgContext>>,
): Promise<GeneratedContent> {
  const isoRef = getIsoReference(doc.documentId);
  const { org, departments, tolerances, existingPolicies } = orgContext;

  const sectionInstructions = doc.sections
    .map(s => `### ${s.title}\n${s.promptHint}`)
    .join('\n\n');

  // Note: OrganisationProfile fields are: name, industrySector, employeeCount, description
  // RiskToleranceStatement fields are: domain, appetiteLevel, proposedToleranceLevel
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `You are an ISO 27001:2022 Lead Implementer writing ISMS documentation for ${org?.name ?? 'the organisation'}. Write professional, specific, actionable policy content. Do not use placeholder text — write complete, realistic content based on the organisation context provided. Output valid JSON.`,
    messages: [
      {
        role: 'user',
        content: `Generate the "${doc.title}" (${doc.documentId}) document.

## Organisation Context
- Name: ${org?.name ?? 'Unknown'}
- Industry: ${org?.industrySector ?? 'Unknown'}
- Size: ${org?.employeeCount ?? 'Unknown'} employees
- Description: ${org?.description ?? ''}
- Departments: ${departments.map(d => d.name).join(', ')}
- Risk Tolerances: ${tolerances.map(t => `${t.domain}: appetite=${t.appetiteLevel}, tolerance=${t.proposedToleranceLevel}`).join(', ')}
- Existing Policies: ${existingPolicies.map(p => `${p.documentId} ${p.title}`).join(', ')}

## ISO Standard Requirements
${isoRef || 'No specific clause reference — use general ISO 27001:2022 best practices.'}

## Document Sections
Write content for each of these sections:

${sectionInstructions}

## Output Format
Return JSON with this structure:
{
  "purpose": "The purpose section text (2-3 sentences)",
  "scope": "The scope section text (2-3 sentences)",
  "body": "The full document body in markdown format, including ALL sections listed above with ## headings"
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  // Extract JSON from response (may be wrapped in code fences)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse generation response for ${doc.documentId}`);
  }
  return JSON.parse(jsonMatch[0]) as GeneratedContent;
}
```

- [ ] **Step 2: Add @anthropic-ai/sdk dependency to mcp-server-policies**

Run: `cd /home/daniel/projects/riskready-community/apps/mcp-server-policies && npm install @anthropic-ai/sdk`

Check if it's already a dependency first — the gateway uses it, but each app has its own package.json.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /home/daniel/projects/riskready-community && npx tsc --noEmit -p apps/mcp-server-policies/tsconfig.json 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add apps/mcp-server-policies/src/iso27001/ apps/mcp-server-policies/package.json
git commit -m "feat(iso27001): add generation engine with Claude API integration"
```

### Task 6: Create generation engine tests

**Files:**
- Create: `apps/mcp-server-policies/src/iso27001/generation-engine.test.ts`

- [ ] **Step 1: Write tests**

Test the engine with mocked Prisma and mocked Anthropic SDK. Follow the existing test pattern in `apps/mcp-server-policies/src/tools/mutation-tools.test.ts` which mocks `#src/prisma.js`.

Key test cases:
1. `generateIso27001Documents` skips documents that already exist in DB
2. `generateIso27001Documents` skips documents with pending actions
3. `generateIso27001Documents` returns concurrency error when already running
4. `filterExisting` correctly partitions candidates into toGenerate and skipped
5. `readOrgContext` queries all required tables

```typescript
// apps/mcp-server-policies/src/iso27001/generation-engine.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before imports
vi.mock('#mcp-shared', async () => {
  const actual = await vi.importActual('#mcp-shared');
  return {
    ...actual,
    prisma: {
      organisationProfile: { findFirst: vi.fn().mockResolvedValue({ organisationName: 'Test Org', industry: 'Finance' }) },
      department: { findMany: vi.fn().mockResolvedValue([]) },
      process: { findMany: vi.fn().mockResolvedValue([]) },
      riskToleranceStatement: { findMany: vi.fn().mockResolvedValue([]) },
      policyDocument: { findMany: vi.fn().mockResolvedValue([]) },
      mcpPendingAction: { findMany: vi.fn().mockResolvedValue([]) },
    },
    createPendingAction: vi.fn().mockResolvedValue({ actionId: 'test-action-id', status: 'PENDING' }),
  };
});

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"purpose":"Test purpose","scope":"Test scope","body":"# Test body"}' }],
      }),
    },
  })),
}));

describe('generateIso27001Documents', () => {
  // Import after mocks are set up
  let generateIso27001Documents: typeof import('./generation-engine.js').generateIso27001Documents;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./generation-engine.js');
    generateIso27001Documents = mod.generateIso27001Documents;
  });

  it('skips documents that already exist in DB', async () => {
    const { prisma } = await import('#mcp-shared');
    (prisma.policyDocument.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { documentId: 'POL-009' },
    ]);

    const result = await generateIso27001Documents(1, 'org-1');
    const skippedIds = result.skipped.map(s => s.documentId);
    expect(skippedIds).toContain('POL-009');
  });

  it('skips documents with pending actions', async () => {
    const { prisma } = await import('#mcp-shared');
    (prisma.mcpPendingAction.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { payload: { documentId: 'POL-009' } },
    ]);

    const result = await generateIso27001Documents(1, 'org-1');
    const skippedIds = result.skipped.map(s => s.documentId);
    expect(skippedIds).toContain('POL-009');
  });

  it('returns all wave documents when none exist', async () => {
    const result = await generateIso27001Documents(1, 'org-1');
    expect(result.generated.length).toBeGreaterThan(0);
    expect(result.wave).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd /home/daniel/projects/riskready-community/apps/mcp-server-policies && npx vitest run src/iso27001/generation-engine.test.ts 2>&1`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/mcp-server-policies/src/iso27001/generation-engine.test.ts
git commit -m "test(iso27001): add generation engine tests"
```

### Task 7: Create MCP tools for ISO 27001 generation

**Files:**
- Create: `apps/mcp-server-policies/src/tools/iso27001-tools.ts`
- Modify: `apps/mcp-server-policies/src/index.ts`

- [ ] **Step 1: Create ISO 27001 MCP tools file**

Follow the exact pattern from `apps/mcp-server-policies/src/tools/mutation-tools.ts`:

```typescript
// apps/mcp-server-policies/src/tools/iso27001-tools.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { withErrorHandling, prisma } from '#mcp-shared';
import { ISO27001_REGISTRY, getAllDocumentIds } from '#mcp-shared';
import { generateIso27001Documents } from '../iso27001/generation-engine.js';

export function registerIso27001Tools(server: McpServer) {
  server.tool(
    'propose_generate_iso27001_documents',
    'Generate a wave of ISO 27001:2022 documents tailored to the organisation. Documents are created as pending actions requiring human approval. Wave 1 = mandatory ISMS clauses, Wave 2 = Annex A policies, Wave 3 = operational procedures.',
    {
      wave: z.enum(['1', '2', '3']).describe('Generation wave: 1 (mandatory clauses), 2 (Annex A policies), 3 (operational procedures)'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
      organisationId: z.string().optional().describe('Organisation ID (uses default if omitted)'),
    },
    withErrorHandling('propose_generate_iso27001_documents', async (params) => {
      const organisationId = params.organisationId || (await import('#mcp-shared').then(m => m.getDefaultOrganisationId()));
      const wave = parseInt(params.wave, 10) as 1 | 2 | 3;

      const result = await generateIso27001Documents(wave, organisationId, params.mcpSessionId);

      let text = `## ISO 27001 Documentation Generation — Wave ${wave}\n\n`;
      text += `${result.summary}\n\n`;

      if (result.generated.length > 0) {
        text += `### Generated (pending approval):\n`;
        for (const doc of result.generated) {
          text += `- **${doc.documentId}** — ${doc.title} (Action: ${doc.pendingActionId})\n`;
        }
        text += '\n';
      }

      if (result.skipped.length > 0) {
        text += `### Skipped:\n`;
        for (const doc of result.skipped) {
          text += `- **${doc.documentId}** — ${doc.title}: ${doc.reason}\n`;
        }
        text += '\n';
      }

      if (wave < 3) {
        text += `**Next:** Run wave ${wave + 1} when ready.`;
      } else {
        text += `**All waves complete.** Review pending actions at /settings/mcp-approvals.`;
      }

      return { content: [{ type: 'text' as const, text }] };
    }),
  );

  server.tool(
    'get_iso27001_generation_status',
    'Check which ISO 27001:2022 documents exist, are pending approval, or are missing. Returns a coverage matrix with completion percentage.',
    {
      organisationId: z.string().optional().describe('Organisation ID (uses default if omitted)'),
    },
    withErrorHandling('get_iso27001_generation_status', async (params) => {
      const organisationId = params.organisationId || (await import('#mcp-shared').then(m => m.getDefaultOrganisationId()));

      const existingDocs = await prisma.policyDocument.findMany({
        where: { organisationId, deletedAt: null },
        select: { documentId: true, status: true },
      });
      const existingMap = new Map(existingDocs.map(d => [d.documentId, d.status]));

      const pendingActions = await prisma.mcpPendingAction.findMany({
        where: { organisationId, status: 'PENDING', actionType: 'CREATE_POLICY' },
        select: { payload: true },
      });
      const pendingIds = new Set(
        pendingActions
          .map(a => (a.payload as Record<string, unknown>)?.documentId as string)
          .filter(Boolean),
      );

      const statuses = ISO27001_REGISTRY.map(doc => {
        const existing = existingMap.get(doc.documentId);
        let status: string;
        if (existing) {
          status = existing;
        } else if (pendingIds.has(doc.documentId)) {
          status = 'PENDING_APPROVAL';
        } else {
          status = 'MISSING';
        }
        return { documentId: doc.documentId, title: doc.title, wave: doc.wave, status };
      });

      const total = statuses.length;
      const completed = statuses.filter(s => s.status === 'PUBLISHED' || s.status === 'APPROVED').length;
      const pending = statuses.filter(s => s.status === 'PENDING_APPROVAL').length;
      const missing = statuses.filter(s => s.status === 'MISSING').length;

      let text = `## ISO 27001 Documentation Coverage\n\n`;
      text += `**Completion:** ${completed}/${total} (${Math.round(completed / total * 100)}%)\n`;
      text += `**Pending approval:** ${pending} | **Missing:** ${missing}\n\n`;

      for (const wave of [1, 2, 3] as const) {
        const waveDocs = statuses.filter(s => s.wave === wave);
        text += `### Wave ${wave}\n`;
        for (const doc of waveDocs) {
          const icon = doc.status === 'MISSING' ? '[ ]' : doc.status === 'PENDING_APPROVAL' ? '[~]' : '[x]';
          text += `- ${icon} **${doc.documentId}** — ${doc.title} (${doc.status})\n`;
        }
        text += '\n';
      }

      return { content: [{ type: 'text' as const, text }] };
    }),
  );
}
```

- [ ] **Step 2: Register tools in MCP server index**

In `apps/mcp-server-policies/src/index.ts`, add import and call:
```typescript
import { registerIso27001Tools } from './tools/iso27001-tools.js';
// ... in the setup function:
registerIso27001Tools(server);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /home/daniel/projects/riskready-community && npx tsc --noEmit -p apps/mcp-server-policies/tsconfig.json 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add apps/mcp-server-policies/src/tools/iso27001-tools.ts apps/mcp-server-policies/src/index.ts
git commit -m "feat(iso27001): add MCP tools for generation and status"
```

### Task 8: Create MCP tools tests

**Files:**
- Create: `apps/mcp-server-policies/src/tools/iso27001-tools.test.ts`

- [ ] **Step 1: Write tests**

Follow the pattern from `apps/mcp-server-policies/src/tools/mutation-tools.test.ts`:

```typescript
// apps/mcp-server-policies/src/tools/iso27001-tools.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

vi.mock('#mcp-shared', async () => {
  const actual = await vi.importActual('#mcp-shared');
  return {
    ...actual,
    prisma: {
      policyDocument: { findMany: vi.fn().mockResolvedValue([]) },
      mcpPendingAction: { findMany: vi.fn().mockResolvedValue([]) },
      organisationProfile: { findFirst: vi.fn().mockResolvedValue(null) },
      department: { findMany: vi.fn().mockResolvedValue([]) },
      process: { findMany: vi.fn().mockResolvedValue([]) },
      riskToleranceStatement: { findMany: vi.fn().mockResolvedValue([]) },
    },
    createPendingAction: vi.fn().mockResolvedValue({ actionId: 'test-id', status: 'PENDING' }),
    getDefaultOrganisationId: vi.fn().mockResolvedValue('org-1'),
    withErrorHandling: (_name: string, fn: Function) => fn,
  };
});

vi.mock('../iso27001/generation-engine.js', () => ({
  generateIso27001Documents: vi.fn().mockResolvedValue({
    wave: 1,
    generated: [{ documentId: 'POL-009', title: 'Risk Management Methodology', pendingActionId: 'action-1' }],
    skipped: [],
    summary: 'Generated 1 documents for Wave 1. 0 skipped.',
  }),
}));

describe('ISO 27001 MCP tools', () => {
  it('registers both tools', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    const toolSpy = vi.spyOn(server, 'tool');

    const { registerIso27001Tools } = await import('./iso27001-tools.js');
    registerIso27001Tools(server);

    const toolNames = toolSpy.mock.calls.map(call => call[0]);
    expect(toolNames).toContain('propose_generate_iso27001_documents');
    expect(toolNames).toContain('get_iso27001_generation_status');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd /home/daniel/projects/riskready-community/apps/mcp-server-policies && npx vitest run src/tools/iso27001-tools.test.ts 2>&1`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/mcp-server-policies/src/tools/iso27001-tools.test.ts
git commit -m "test(iso27001): add MCP tools registration tests"
```

---

## Chunk 3: Executor Extension and NestJS Endpoint

### Task 9: Extend CREATE_POLICY executor for control/risk mappings

**Files:**
- Modify: `apps/server/src/mcp-approval/executors/policy.executors.ts`

The existing executor calls `policyDocumentService.create()` with the payload. We need to also create `DocumentControlMapping`, `DocumentRiskMapping`, and `DocumentVersion` records when present in the payload.

- [ ] **Step 1: Read the current executor file**

Read: `apps/server/src/mcp-approval/executors/policy.executors.ts`

- [ ] **Step 2: Extend the CREATE_POLICY executor**

Modify the executor to handle optional `controlMappings`, `riskMappings`, and version fields. Use a Prisma transaction to ensure atomicity:

```typescript
executors.set('CREATE_POLICY', async (p, userId) => {
  const validated = validatePayload(CreatePolicyPayload, p, 'CREATE_POLICY');

  // Extract mapping data before prepare strips it
  const controlMappings = validated.controlMappings as ControlMappingDef[] | undefined;
  const riskMappings = validated.riskMappings as RiskMappingDef[] | undefined;
  const version = validated.version as string | undefined;

  // Remove mapping fields from the create payload (not part of PolicyDocument model)
  delete validated.controlMappings;
  delete validated.riskMappings;

  const createPayload = prepareCreatePayload(validated, { relationalOrg: true }) as any;
  const doc = await policyDocumentService.create(createPayload, userId);

  // Create mappings if provided (from ISO 27001 generator)
  // Note: Prisma field names — verify against schema before implementing:
  //   DocumentControlMapping: documentId (not policyDocumentId), coverage (not coverageLevel)
  //   DocumentRiskMapping: documentId (not policyDocumentId), relationshipType (not mappingType)
  //   DocumentVersion: content is required (String @db.Text)
  //   Neither mapping model has organisationId

  if (controlMappings?.length) {
    await prisma.documentControlMapping.createMany({
      data: controlMappings.map(m => ({
        documentId: doc.id,
        controlId: m.controlId, // resolved from controlRef during generation
        mappingType: m.mappingType,
        coverage: m.coverage,
      })),
      skipDuplicates: true,
    });
  }

  if (riskMappings?.length) {
    await prisma.documentRiskMapping.createMany({
      data: riskMappings.map(m => ({
        documentId: doc.id,
        riskId: m.riskId, // resolved from riskRef during generation
        relationshipType: m.mappingType,
      })),
      skipDuplicates: true,
    });
  }

  if (version) {
    await prisma.documentVersion.create({
      data: {
        policyDocumentId: doc.id,
        version,
        majorVersion: parseInt(version.split('.')[0], 10),
        minorVersion: parseInt(version.split('.')[1] ?? '0', 10),
        changeType: 'INITIAL',
        changeDescription: 'Initial version generated by ISO 27001 Documentation Generator',
        content: doc.content ?? '',  // DocumentVersion requires content field
        authorId: userId,
      },
    });
  }

  return doc;
});
```

Note: Read the actual executor file first to understand the exact pattern and adjust accordingly. The key change is extracting `controlMappings` and `riskMappings` from the payload before passing to `prepareCreatePayload`, then creating the related records after the document is created.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /home/daniel/projects/riskready-community && npx tsc --noEmit -p apps/server/tsconfig.json 2>&1 | head -20`

- [ ] **Step 4: Run existing executor tests to ensure no regressions**

Run: `cd /home/daniel/projects/riskready-community/apps/server && npx jest --testPathPattern=executors 2>&1 | tail -20`

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/mcp-approval/executors/policy.executors.ts
git commit -m "feat(iso27001): extend CREATE_POLICY executor for control/risk mappings and version"
```

### Task 10: Add NestJS generation service and endpoints

**Files:**
- Create: `apps/server/src/policies/services/iso27001-generation.service.ts`
- Modify: `apps/server/src/policies/controllers/policy-document.controller.ts`
- Modify: `apps/server/src/policies/policies.module.ts`

- [ ] **Step 1: Read current controller and module files**

Read: `apps/server/src/policies/controllers/policy-document.controller.ts`
Read: `apps/server/src/policies/policies.module.ts`

- [ ] **Step 2: Create the generation service**

This is a thin NestJS wrapper. Since we can't import directly from the MCP server package, this service implements the same logic using shared types from mcp-shared and its own Claude API calls.

```typescript
// apps/server/src/policies/services/iso27001-generation.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
// IMPORTANT: Verify the NestJS server's tsconfig.json for the correct import path.
// MCP servers use '#mcp-shared' (Node subpath import). NestJS may use a different alias
// or a relative path like '../../../../packages/mcp-shared/src'. Check tsconfig paths.
import {
  ISO27001_REGISTRY,
  getDocumentsByWave,
  getIsoReference,
  type GenerationResult,
  type Iso27001DocumentDef,
} from '#mcp-shared';
import Anthropic from '@anthropic-ai/sdk';
import { McpActionType } from '@prisma/client';

@Injectable()
export class Iso27001GenerationService {
  private generationInProgress = new Map<number, boolean>();

  constructor(private readonly prisma: PrismaService) {}

  async getStatus(organisationId: string) {
    const existingDocs = await this.prisma.policyDocument.findMany({
      where: { organisationId, deletedAt: null },
      select: { documentId: true, status: true },
    });
    const existingMap = new Map(existingDocs.map(d => [d.documentId, d.status]));

    const pendingActions = await this.prisma.mcpPendingAction.findMany({
      where: { organisationId, status: 'PENDING', actionType: 'CREATE_POLICY' },
      select: { payload: true },
    });
    const pendingIds = new Set(
      pendingActions
        .map(a => (a.payload as Record<string, unknown>)?.documentId as string)
        .filter(Boolean),
    );

    const documents = ISO27001_REGISTRY.map(doc => {
      const existing = existingMap.get(doc.documentId);
      let status: string;
      if (existing) status = existing;
      else if (pendingIds.has(doc.documentId)) status = 'PENDING_APPROVAL';
      else status = 'MISSING';
      return { documentId: doc.documentId, title: doc.title, wave: doc.wave, status };
    });

    const total = documents.length;
    const completed = documents.filter(s => ['PUBLISHED', 'APPROVED', 'DRAFT'].includes(s.status)).length;

    return {
      documents,
      total,
      completed,
      completionPercentage: Math.round((completed / total) * 100),
    };
  }

  async generate(wave: 1 | 2 | 3, organisationId: string): Promise<GenerationResult> {
    if (this.generationInProgress.get(wave)) {
      throw new ConflictException(`Generation already in progress for wave ${wave}`);
    }

    this.generationInProgress.set(wave, true);
    try {
      // Read org context
      const org = await this.prisma.organisationProfile.findFirst({ where: { organisationId } });
      const departments = await this.prisma.department.findMany({ where: { organisationId } });
      const tolerances = await this.prisma.riskToleranceStatement.findMany({ where: { organisationId } });
      const existingPolicies = await this.prisma.policyDocument.findMany({
        where: { organisationId, deletedAt: null },
        select: { documentId: true, title: true },
      });

      // Filter — same logic as MCP generation engine
      const candidates = getDocumentsByWave(wave);
      const existingIds = new Set(existingPolicies.map(d => d.documentId));
      const pendingActions = await this.prisma.mcpPendingAction.findMany({
        where: { organisationId, status: 'PENDING', actionType: 'CREATE_POLICY' },
        select: { payload: true },
      });
      const pendingIds = new Set(
        pendingActions.map(a => (a.payload as any)?.documentId).filter(Boolean),
      );

      const toGenerate = candidates.filter(
        d => !existingIds.has(d.documentId) && !pendingIds.has(d.documentId),
      );
      const skipped = candidates
        .filter(d => existingIds.has(d.documentId) || pendingIds.has(d.documentId))
        .map(d => ({
          documentId: d.documentId,
          title: d.title,
          reason: existingIds.has(d.documentId) ? 'Already exists' : 'Pending approval',
        }));

      // Generate each document via Claude API — same prompt structure as MCP engine
      const anthropic = new Anthropic();
      const generated: GenerationResult['generated'] = [];

      for (const doc of toGenerate) {
        try {
          const isoRef = getIsoReference(doc.documentId);
          // Build prompt and call Claude — identical to generation-engine.ts generateDocumentContent()
          // ... (use same system prompt, org context formatting, section instructions, JSON output parsing)
          // Then create pending action via direct Prisma insert:
          const action = await this.prisma.mcpPendingAction.create({
            data: {
              actionType: 'CREATE_POLICY',
              status: 'PENDING',
              summary: `Create ${doc.title} (${doc.documentId}) — Wave ${wave} of ISO 27001 documentation set`,
              reason: `ISO 27001:2022 compliance`,
              payload: { /* full document payload — same structure as MCP engine */ },
              mcpToolName: 'generate-iso27001',
              organisationId,
            },
          });
          generated.push({ documentId: doc.documentId, title: doc.title, pendingActionId: action.id });
        } catch (err) {
          skipped.push({
            documentId: doc.documentId,
            title: doc.title,
            reason: `Generation failed: ${err instanceof Error ? err.message : 'Unknown'}`,
          });
        }
      }

      return { wave, generated, skipped, summary: `Generated ${generated.length} documents for Wave ${wave}. ${skipped.length} skipped.` };
    } finally {
      this.generationInProgress.set(wave, false);
    }
  }
}

// Note: The full Claude prompt construction and JSON parsing logic should be extracted into a shared
// helper function in packages/mcp-shared/src/iso27001/ if code duplication becomes unwieldy.
// For initial implementation, duplicating the prompt template is acceptable.
```

Note: The full implementation duplicates the core generation logic from the MCP engine using NestJS's PrismaService instead of the mcp-shared singleton. Read the generation engine from Task 5 and adapt it. The shared registry, types, and ISO references come from mcp-shared.

- [ ] **Step 3: Add controller endpoints**

In `apps/server/src/policies/controllers/policy-document.controller.ts`, add:

```typescript
// IMPORTANT: Place these BEFORE the @Get(':id') method to avoid route conflict.
// JwtAuthGuard is global — no need to add it explicitly.

@Post('generate-iso27001')
@UseGuards(AdminOnlyGuard)
@AdminOnly()
async generateIso27001(
  @Body() body: { wave: number },
  @Request() req: AuthenticatedRequest,
) {
  const wave = body.wave as 1 | 2 | 3;
  return this.iso27001GenerationService.generate(wave, req.user.organisationId);
}

@Get('iso27001-status')
async getIso27001Status(@Request() req: AuthenticatedRequest) {
  return this.iso27001GenerationService.getStatus(req.user.organisationId);
}
```

Inject `Iso27001GenerationService` in the controller constructor. Place these endpoints BEFORE `@Get(':id')` in the file to prevent NestJS from treating `iso27001-status` as an `:id` parameter.

- [ ] **Step 4: Register service in module**

In `apps/server/src/policies/policies.module.ts`, add `Iso27001GenerationService` to `providers` array.

- [ ] **Step 5: Add @anthropic-ai/sdk to server dependencies**

Run: `cd /home/daniel/projects/riskready-community/apps/server && npm install @anthropic-ai/sdk`

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd /home/daniel/projects/riskready-community && npx tsc --noEmit -p apps/server/tsconfig.json 2>&1 | head -20`

- [ ] **Step 7: Commit**

```bash
git add apps/server/src/policies/services/iso27001-generation.service.ts \
  apps/server/src/policies/controllers/policy-document.controller.ts \
  apps/server/src/policies/policies.module.ts \
  apps/server/package.json
git commit -m "feat(iso27001): add NestJS generation service and endpoints"
```

---

## Chunk 4: Seed Data

### Task 11: Write 18 ClearStream ISO 27001 seed documents

**Files:**
- Create: `apps/server/prisma/seed/demo/seed-policies-iso27001.ts`
- Modify: `apps/server/prisma/seed/demo/index.ts`

This is the largest task — 18 full policy documents with realistic content for ClearStream Payments Ltd.

- [ ] **Step 1: Read existing seed patterns**

Read: `apps/server/prisma/seed/demo/seed-policies.ts` (first 200 lines for pattern)
Read: `apps/server/prisma/seed/demo/index.ts` (to see how seeds are chained)

- [ ] **Step 2: Create the seed file with all 18 documents**

Follow the exact pattern from `seed-policies.ts`. Each document needs:
- All Prisma `PolicyDocument` fields (documentId, title, documentType, status, version, classification, etc.)
- Full markdown `content` with all 9 mandatory elements as sections
- `documentOwner`, `documentOwnerId` (linked to seeded users — CISO is `ctx.userIds['ciso']`)
- `author`, `authorId`
- `approvalDate`, `effectiveDate`, `nextReviewDate`
- `tags`, `keywords`
- `organisationId: ctx.organisationId`
- `createdById: ctx.userIds['admin']`
- Store IDs in `ctx.policyIds[documentId]`

Content must reference ClearStream Payments, Dublin/Berlin/Lisbon, payment infrastructure, PCI DSS, DORA, NIS2 — matching the existing 12 docs' style and detail level.

Documents to create:
1. POL-009 Risk Management Methodology — PUBLISHED, Wave 1
2. POL-010 Document & Record Control Procedure — PUBLISHED, Wave 1
3. POL-011 Internal Audit Programme — PUBLISHED, Wave 1
4. POL-012 Management Review Procedure — PUBLISHED, Wave 1
5. POL-013 Competence & Awareness Programme — PUBLISHED, Wave 1
6. POL-014 Personnel Security Policy — PUBLISHED, Wave 2
7. POL-015 Physical & Environmental Security Policy — PUBLISHED, Wave 2
8. POL-016 Asset Management Policy — PUBLISHED, Wave 2
9. POL-017 Communications Security Policy — PUBLISHED, Wave 2
10. POL-018 Secure Development Lifecycle Policy — PUBLISHED, Wave 2
11. POL-019 Information Transfer Policy — PUBLISHED, Wave 2
12. POL-020 Logging, Monitoring & Alerting Policy — PUBLISHED, Wave 2
13. POL-021 Compliance Management Procedure — PUBLISHED, Wave 2
14. STD-005 Backup & Recovery Procedure — PENDING_REVIEW, Wave 3
15. STD-006 Vulnerability & Patch Management Procedure — PENDING_REVIEW, Wave 3
16. STD-007 Media Handling & Disposal Procedure — PENDING_REVIEW, Wave 3
17. STD-008 Capacity Management Procedure — PENDING_REVIEW, Wave 3
18. STD-009 Supplier Security Assessment Procedure — PENDING_REVIEW, Wave 3

Also create:
- `DocumentVersion` records (v1.0 for each)
- `DocumentControlMapping` records (linking to existing controls via `ctx.controlIds`)
- `DocumentRiskMapping` records where relevant

**Use the ISO 27001 Lead Implementer skill** (`@iso27001-lead-implementer`) and **ISO 27001 Lead Auditor skill** (`@iso27001-lead-auditor`) as references when writing content. Read the skill reference files for exact clause requirements and control guidance:
- `~/.claude/skills/iso27001-lead-implementer/references/iso27001.md`
- `~/.claude/skills/iso27001-lead-implementer/references/is27002.md`

- [ ] **Step 3: Wire into seed runner**

In `apps/server/prisma/seed/demo/index.ts`, add after the existing `seedPolicies` call:
```typescript
const { seedPoliciesIso27001 } = await import('./seed-policies-iso27001.js');
await seedPoliciesIso27001(prisma, ctx);
```

- [ ] **Step 4: Verify seed compiles**

Run: `cd /home/daniel/projects/riskready-community && npx tsc --noEmit -p apps/server/tsconfig.json 2>&1 | head -20`

- [ ] **Step 5: Test seed runs successfully**

Run: `cd /home/daniel/projects/riskready-community && npx prisma db seed 2>&1 | tail -20`

If running against a fresh DB, ensure the full seed chain works. If the DB has existing data, this step may need `npx prisma migrate reset` first (destructive — confirm with user).

- [ ] **Step 6: Commit**

```bash
git add apps/server/prisma/seed/demo/seed-policies-iso27001.ts apps/server/prisma/seed/demo/index.ts
git commit -m "feat(iso27001): seed 18 ClearStream ISO 27001 policy documents with control mappings"
```

---

## Chunk 5: Frontend

### Task 12: Create React Query hooks for ISO 27001

**Files:**
- Create: `apps/web/src/hooks/queries/use-iso27001-queries.ts`

- [ ] **Step 1: Read existing query hook pattern**

Read: `apps/web/src/hooks/queries/use-policies-queries.ts` (first 50 lines)
Read: `apps/web/src/lib/api.ts` (to see the api client pattern)

- [ ] **Step 2: Create hooks file**

```typescript
// apps/web/src/hooks/queries/use-iso27001-queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface Iso27001DocumentStatus {
  documentId: string;
  title: string;
  wave: number;
  status: string;
}

interface Iso27001Status {
  documents: Iso27001DocumentStatus[];
  total: number;
  completed: number;
  completionPercentage: number;
}

interface GenerationResult {
  wave: number;
  generated: { documentId: string; title: string; pendingActionId: string }[];
  skipped: { documentId: string; title: string; reason: string }[];
  summary: string;
}

export const iso27001Keys = {
  status: ['iso27001', 'status'] as const,
};

export function useIso27001Status() {
  return useQuery({
    queryKey: iso27001Keys.status,
    queryFn: () => api.get<Iso27001Status>('/policies/iso27001-status'),
  });
}

export function useGenerateIso27001() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wave: number) =>
      api.post<GenerationResult>('/policies/generate-iso27001', { wave }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iso27001Keys.status });
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/queries/use-iso27001-queries.ts
git commit -m "feat(iso27001): add React Query hooks for status and generation"
```

### Task 13: Create ISO 27001 Coverage Card component

**Files:**
- Create: `apps/web/src/components/policies/Iso27001CoverageCard.tsx`

- [ ] **Step 1: Read existing dashboard page for component patterns**

Read: `apps/web/src/pages/policies/PoliciesDashboardPage.tsx`

- [ ] **Step 2: Create the coverage card**

```tsx
// apps/web/src/components/policies/Iso27001CoverageCard.tsx
import { useState } from 'react';
import { useIso27001Status, useGenerateIso27001 } from '../../hooks/queries/use-iso27001-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { CheckCircle2, Clock, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof CheckCircle2 }> = {
  PUBLISHED: { label: 'Published', variant: 'default', icon: CheckCircle2 },
  APPROVED: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
  DRAFT: { label: 'Draft', variant: 'secondary', icon: FileText },
  PENDING_REVIEW: { label: 'Pending Review', variant: 'secondary', icon: Clock },
  PENDING_APPROVAL: { label: 'Pending Approval', variant: 'outline', icon: Clock },
  MISSING: { label: 'Missing', variant: 'destructive', icon: AlertCircle },
};

const WAVE_LABELS: Record<number, string> = {
  1: 'Mandatory ISMS Clauses',
  2: 'Annex A Policies',
  3: 'Operational Procedures',
};

export function Iso27001CoverageCard() {
  const { data: status, isLoading } = useIso27001Status();
  const generateMutation = useGenerateIso27001();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [confirmWave, setConfirmWave] = useState<number | null>(null);

  if (isLoading || !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ISO 27001:2022 Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleGenerate = async () => {
    if (confirmWave === null) return;
    await generateMutation.mutateAsync(confirmWave);
    setConfirmWave(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>ISO 27001:2022 Documentation</CardTitle>
          <CardDescription>
            {status.completed} of {status.total} documents — {status.completionPercentage}% complete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={status.completionPercentage} className="h-2" />

          {([1, 2, 3] as const).map(wave => {
            const waveDocs = status.documents.filter(d => d.wave === wave);
            const missingCount = waveDocs.filter(d => d.status === 'MISSING').length;

            return (
              <div key={wave} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    Wave {wave}: {WAVE_LABELS[wave]}
                  </h4>
                  {isAdmin && missingCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmWave(wave)}
                      disabled={generateMutation.isPending}
                    >
                      {generateMutation.isPending && generateMutation.variables === wave ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        `Generate ${missingCount} docs`
                      )}
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {waveDocs.map(doc => {
                    const config = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.MISSING;
                    const Icon = config.icon;
                    return (
                      <div key={doc.documentId} className="flex items-center gap-2 text-sm">
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="font-mono text-xs text-muted-foreground">{doc.documentId}</span>
                        <span className="flex-1 truncate">{doc.title}</span>
                        <Badge variant={config.variant} className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {generateMutation.isSuccess && (
            <div className="rounded-md bg-muted p-3 text-sm">
              {generateMutation.data.summary}{' '}
              <a href="/settings/mcp-approvals" className="underline">
                Review in approval queue
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmWave !== null} onOpenChange={() => setConfirmWave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate ISO 27001 Documents</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate{' '}
              {confirmWave !== null
                ? status.documents.filter(d => d.wave === confirmWave && d.status === 'MISSING').length
                : 0}{' '}
              documents using AI and send them to the approval queue for review.
              Estimated time: ~1-2 minutes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerate}>Generate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/policies/Iso27001CoverageCard.tsx
git commit -m "feat(iso27001): add coverage card component with generate buttons"
```

### Task 14: Add coverage card to policies dashboard

**Files:**
- Modify: `apps/web/src/pages/policies/PoliciesDashboardPage.tsx`

- [ ] **Step 1: Read the current dashboard page**

Read: `apps/web/src/pages/policies/PoliciesDashboardPage.tsx`

- [ ] **Step 2: Add the coverage card import and render**

Add import at top:
```typescript
import { Iso27001CoverageCard } from '../../components/policies/Iso27001CoverageCard';
```

Add the card in the dashboard grid, ideally after the existing stats cards and before the recent activity section. Place it in a prominent position since it's a key feature.

- [ ] **Step 3: Verify the frontend builds**

Run: `cd /home/daniel/projects/riskready-community/apps/web && npm run build 2>&1 | tail -10`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/policies/PoliciesDashboardPage.tsx
git commit -m "feat(iso27001): add coverage card to policies dashboard"
```

---

## Chunk 6: Integration Verification

### Task 15: End-to-end verification

- [ ] **Step 1: Verify all TypeScript compiles across the monorepo**

Run these in parallel:
```bash
npx tsc --noEmit -p packages/mcp-shared/tsconfig.json
npx tsc --noEmit -p apps/mcp-server-policies/tsconfig.json
npx tsc --noEmit -p apps/server/tsconfig.json
npx tsc --noEmit -p apps/web/tsconfig.json
```

- [ ] **Step 2: Run all tests**

```bash
cd /home/daniel/projects/riskready-community/apps/mcp-server-policies && npx vitest run 2>&1
cd /home/daniel/projects/riskready-community/apps/server && npx jest 2>&1 | tail -20
```

- [ ] **Step 3: Verify seed runs**

```bash
cd /home/daniel/projects/riskready-community && npx prisma db seed
```

- [ ] **Step 4: Verify frontend builds**

```bash
cd /home/daniel/projects/riskready-community/apps/web && npm run build
```

- [ ] **Step 5: Manual smoke test (if dev environment running)**

1. Open http://localhost:5174/policies — verify the ISO 27001 Coverage Card appears
2. Check it shows 28 documents with correct status badges
3. If seeded, 30 docs should show as Published/Pending Review, remaining as Missing
4. Click "Generate Wave X" button — verify confirmation dialog appears
5. Open the AI chat — ask "What's our ISO 27001 documentation status?" — verify `get_iso27001_generation_status` tool is called

- [ ] **Step 6: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix(iso27001): integration fixes from end-to-end verification"
```
