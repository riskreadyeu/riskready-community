# ISO 27001:2022 Documentation Generator — Design Spec

## Problem

RiskReady Community Edition ships with 12 seeded policy documents for the ClearStream Payments demo, but ISO 27001:2022 certification requires ~28 documents covering all mandatory clauses and Annex A control themes. There is no feature for users to generate a complete documentation set for their own organisation.

## Solution

Two deliverables:

1. **Seed data** — 18 additional fully-written policy documents completing the ClearStream demo's ISO 27001 documentation set.
2. **Generation feature** — MCP tool + NestJS endpoint + frontend button that generates all ~28 ISO 27001 documents tailored to the user's organisation, using Claude API with the actual ISO 27001/27002 standard text as grounding.

## Requirements

### Mandatory Document Elements (per DORA/ISO 27001)

Every generated document must include these 9 elements as explicit sections:

1. **Owner** — named role or function accountable for the policy
2. **Scope** — which entities, functions, assets, and third parties it applies to
3. **Management body approval** — policies approved at board/senior management level
4. **Review cadence** — at minimum annually, plus triggered review after major ICT incidents or significant operational/regulatory changes
5. **Version and change history** — traceability of amendments
6. **Risk appetite alignment** — explicit linkage to the entity's documented ICT risk tolerance (content-only, not a structured Prisma field; pulled from Risk module's tolerance statements)
7. **Roles and responsibilities** — who owns execution vs. oversight
8. **Exceptions process** — how deviations are requested, approved, and tracked
9. **Awareness** — evidence that relevant staff have received and understood the policy

### Generation Behaviour

- Organisation context read automatically from `OrganisationProfile`, `Department[]`, `Process[]` — no user input form needed
- Risk tolerance values pulled from the Risk module to populate risk appetite alignment sections
- Documents generated in 3 waves (mandatory clauses first, then Annex A policies, then operational procedures)
- Each generated document creates a `McpPendingAction` (PENDING) — human approves before it enters the system
- Duplicate protection: skips documents that already exist in `PolicyDocument` table OR have a `PENDING` `McpPendingAction` with matching `documentId` in payload
- Control and risk mappings created automatically per document
- Concurrency: a `generationInProgress` flag per wave (stored in-memory or as a short-lived DB record) prevents duplicate concurrent generation runs

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `packages/mcp-shared/src/iso27001/types.ts` | Shared types for registry (used by seed and generation) |
| `packages/mcp-shared/src/iso27001/document-registry.ts` | 28 document definitions: metadata, sections, control mappings, wave assignments |
| `packages/mcp-shared/src/iso27001/iso-references/` | Bundled ISO 27001/27002 reference excerpts per document (extracted from skill references) |
| `apps/mcp-server-policies/src/iso27001/generation-engine.ts` | Generation logic: read org context, read ISO refs, call Claude, create pending actions |
| `apps/server/prisma/seed/demo/seed-policies-iso27001.ts` | 18 new ClearStream policy documents with control/risk mappings |
| `apps/web/src/components/policies/Iso27001CoverageCard.tsx` | Dashboard card: 28-doc checklist with status badges + generate button |

### Modified Files

| File | Change |
|------|--------|
| `apps/mcp-server-policies/src/tools/` | Add `propose_generate_iso27001_documents` and `get_iso27001_generation_status` tools |
| `apps/server/src/policies/policies.controller.ts` | Add `POST /api/policies/generate-iso27001` and `GET /api/policies/iso27001-status` endpoints |
| `apps/server/src/policies/policies.service.ts` | Add generation orchestration and status methods |
| `apps/server/src/mcp-approval/executors/policy.executors.ts` | Extend `CREATE_POLICY` executor to handle `controlMappings`, `riskMappings`, `DocumentVersion` in payload |
| `apps/server/prisma/seed/demo/index.ts` | Import and call new seed file after existing `seed-policies.ts` |
| `apps/web/src/pages/policies/PoliciesDashboardPage.tsx` | Add ISO 27001 Coverage Card component |
| `apps/web/src/hooks/queries/use-policies-queries.ts` | Add `useIso27001Status` and `useGenerateIso27001` hooks |

## Component Design

### 1. ISO 27001 Document Registry

Located at `packages/mcp-shared/src/iso27001/document-registry.ts`.

Single source of truth for both seed data and generation. Each entry:

```typescript
interface Iso27001DocumentDef {
  documentId: string;              // "POL-009", "STD-005"
  title: string;
  documentType: DocumentType;      // POLICY | STANDARD | PROCEDURE
  classification: Classification;  // INTERNAL | CONFIDENTIAL
  approvalLevel: ApprovalLevel;    // BOARD | EXECUTIVE | SENIOR_MANAGEMENT
  reviewFrequency: ReviewFrequency;
  wave: 1 | 2 | 3;
  isoClause?: string;             // "6.1.2" for mandatory clause docs
  sections: SectionDef[];
  controlMappings: ControlMappingDef[];
  riskMappings?: RiskMappingDef[];
  tags: string[];
  requiresAcknowledgment: boolean;
  parentDocumentId?: string;
  documentOwner: string;          // role name, e.g. "CISO", "IT Security Manager"
  seeded?: boolean;               // true for existing 12 docs — generator skips these
}

interface SectionDef {
  sectionType: SectionType;
  title: string;
  promptHint: string;             // Guidance for Claude including ISO ref section to read
  isoReference?: string;          // e.g. "is27002.md#5.7" for Threat Intelligence
}

interface ControlMappingDef {
  controlRef: string;             // "A.6.1" matched to seeded controls by referenceId
  mappingType: 'IMPLEMENTS' | 'SUPPORTS' | 'REFERENCES';
  coverage: 'FULL' | 'PARTIAL';
}
```

#### Complete Document List

**Already seeded (12 docs, `seeded: true`):**

| ID | Title | Type |
|----|-------|------|
| POL-001 | Information Security Policy | POLICY |
| POL-002 | Acceptable Use Policy | POLICY |
| POL-003 | Access Control Policy | POLICY |
| POL-004 | Data Classification Policy | POLICY |
| POL-005 | Third-Party Risk Management Policy | POLICY |
| POL-006 | AI & ML Governance Policy | POLICY |
| POL-007 | DORA ICT Risk Management Policy | POLICY |
| POL-008 | NIS2 Compliance Procedure | POLICY |
| STD-001 | Incident Response Procedure | PROCEDURE |
| STD-002 | Business Continuity Plan | PROCEDURE |
| STD-003 | Cryptographic Controls Standard | STANDARD |
| STD-004 | Change Management Procedure | PROCEDURE |

**Wave 1 — Mandatory ISMS clauses (5 docs):**

| ID | Title | Type | ISO Clause |
|----|-------|------|------------|
| POL-009 | Risk Management Methodology | PROCEDURE | 6.1.2, 8.2 |
| POL-010 | Document & Record Control Procedure | PROCEDURE | 7.5 |
| POL-011 | Internal Audit Programme | PROCEDURE | 9.2 |
| POL-012 | Management Review Procedure | PROCEDURE | 9.3 |
| POL-013 | Competence & Awareness Programme | PROCEDURE | 7.2, 7.3 |

**Wave 2 — Annex A supporting policies (8 docs):**

| ID | Title | Type | Controls |
|----|-------|------|----------|
| POL-014 | Personnel Security Policy | POLICY | A.6.1-A.6.6 |
| POL-015 | Physical & Environmental Security Policy | POLICY | A.7.1-A.7.14 |
| POL-016 | Asset Management Policy | POLICY | A.5.9-A.5.14 |
| POL-017 | Communications Security Policy | POLICY | A.5.14, A.8.20-A.8.22 |
| POL-018 | Secure Development Lifecycle Policy | POLICY | A.8.25-A.8.34 |
| POL-019 | Information Transfer Policy | POLICY | A.5.14 |
| POL-020 | Logging, Monitoring & Alerting Policy | POLICY | A.8.15-A.8.17 |
| POL-021 | Compliance Management Procedure | PROCEDURE | A.5.31-A.5.36 |

**Wave 3 — Operational procedures (5 docs):**

| ID | Title | Type | Controls |
|----|-------|------|----------|
| STD-005 | Backup & Recovery Procedure | PROCEDURE | A.8.13-A.8.14 |
| STD-006 | Vulnerability & Patch Management Procedure | PROCEDURE | A.8.8-A.8.10 |
| STD-007 | Media Handling & Disposal Procedure | PROCEDURE | A.7.10, A.7.14 |
| STD-008 | Capacity Management Procedure | PROCEDURE | A.8.6 |
| STD-009 | Supplier Security Assessment Procedure | PROCEDURE | A.5.19-A.5.23 |

### 2. Generation Engine

Located at `apps/mcp-server-policies/src/iso27001/generation-engine.ts`. Lives in the policies MCP server (not mcp-shared) because it depends on the Claude API SDK — keeping it here avoids adding that dependency to all 9 MCP servers.

```typescript
async function generateIso27001Documents(
  wave: 1 | 2 | 3,
  organisationId: string,
  mcpSessionId?: string   // optional — absent when called from NestJS HTTP endpoint
): Promise<GenerationResult>
```

**Step-by-step flow:**

1. **Read org context** — query via Prisma:
   - `OrganisationProfile` (name, industry, size, description, regulatory frameworks)
   - `Department[]` (names, functions)
   - `Process[]` (business processes in scope)
   - `RiskToleranceStatement[]` (risk appetite values for alignment sections)

2. **Filter registry** — get documents for the requested wave where:
   - `seeded !== true`
   - No existing `PolicyDocument` with matching `documentId` in the database
   - No existing `McpPendingAction` with status `PENDING` containing matching `documentId` in payload

3. **Read ISO reference sections** — for each document, read the bundled reference excerpts from `packages/mcp-shared/src/iso27001/iso-references/`. These are pre-extracted from the ISO 27001/27002 skill reference files at build time, containing only the clauses and control guidance relevant to each document. This avoids runtime dependency on developer-local skill files and works in Docker/CI.

4. **Generate content via Claude API** — for each document sequentially:
   - System prompt: "You are an ISO 27001:2022 Lead Implementer writing ISMS documentation."
   - Context: org profile, risk tolerances, existing policy titles (for cross-references)
   - ISO grounding: relevant clause text and control guidance from step 3
   - Section structure: from registry, each section with its `promptHint`
   - Constraint: must include all 9 mandatory elements
   - Output: structured JSON with each section's content

5. **Create pending actions** — for each generated document:
   ```typescript
   createPendingAction({
     actionType: McpActionType.CREATE_POLICY,  // existing enum value
     summary: `Create ${title} (${documentId}) — Wave ${wave} of ISO 27001 documentation set`,
     reason: `ISO 27001:2022 ${isoClause || controlRefs} compliance`,
     payload: {
       documentId, title, documentType, classification,
       approvalLevel, reviewFrequency, version: '1.0',
       purpose, scope, content,  // generated sections joined
       sections,                  // structured section data
       controlMappings,           // from registry
       riskMappings,              // from registry
       tags, requiresAcknowledgment,
       parentDocumentId,
       documentOwner,             // from registry
       author: 'RiskReady ISO 27001 Generator',
       status: 'DRAFT'
     },
     mcpToolName: 'propose_generate_iso27001_documents',
     mcpSessionId,
     organisationId
   })
   ```

6. **Return result:**
   ```typescript
   interface GenerationResult {
     wave: number;
     generated: { documentId: string; title: string; pendingActionId: string }[];
     skipped: { documentId: string; title: string; reason: string }[];
     summary: string;  // "Generated 5 documents for Wave 1. 0 skipped."
   }
   ```

**Token budget:** ~5-10K input + ~3-5K output per document (org context + ISO reference excerpts + system prompt + section hints). Wave 1 (5 docs) ~ 50-75K tokens, Wave 2 (8 docs) ~ 80-120K tokens, Wave 3 (5 docs) ~ 50-75K tokens. Total ~ 180-270K tokens for a full set. Estimated generation time: ~1-2 minutes per wave.

**Error handling:** If Claude API fails mid-wave, the engine returns a partial result with successfully created pending actions and an error for the failed document. NestJS endpoint returns HTTP 200 with the partial `GenerationResult` (the `summary` field indicates partial completion). The user can re-run the wave and duplicate protection (including pending action check) skips already-created docs.

**Concurrency control:** The engine sets an in-memory flag per wave before starting. If a second request arrives for the same wave, it returns immediately with an error: "Generation already in progress for wave X." The flag is cleared on completion or failure. Note: this is a best-effort guard — if the process crashes mid-generation, the flag is lost but the pending-action duplicate check (step 2) is the true safety net preventing duplicate documents on re-run.

**Wave ordering:** Waves can be generated in any order, but wave 1 is recommended first since later documents may cross-reference mandatory ISMS procedures. The generation prompt includes all existing policy titles (not just those from earlier waves) for cross-references, so generating out of order produces valid but potentially less cross-referenced documents.

### 3. Seed Data

Located at `apps/server/prisma/seed/demo/seed-policies-iso27001.ts`.

Each of the 18 documents is written manually (not AI-generated) with:
- Full realistic content for ClearStream Payments Ltd
- Same style, tone, and detail level as existing 12 docs
- References to Dublin/Berlin/Lisbon offices, payment infrastructure, PCI DSS/DORA/NIS2
- All 9 mandatory elements as sections
- Status: PUBLISHED (wave 1 & 2) or PENDING_REVIEW (wave 3)
- Version 1.0 with initial `DocumentVersion` record
- `DocumentControlMapping` records linking to existing 40 seeded controls
- `DocumentRiskMapping` records where relevant
- Parent-child hierarchy: STD-* docs linked as children of their parent POL-* docs

Called from the main seed runner after `seed-policies.ts`.

### 4. MCP Tools

Added to `apps/mcp-server-policies/src/tools/`:

**`propose_generate_iso27001_documents`**
- Params: `{ wave: z.enum(['1','2','3']), mcpSessionId: zSessionId, organisationId?: zOrgId }`
- Calls generation engine
- Returns: summary of created pending actions, skipped docs, next steps

**`get_iso27001_generation_status`**
- Params: `{ organisationId?: zOrgId }`
- Read-only — queries PolicyDocument table against the full 28-doc registry
- Returns: per-document status (PUBLISHED | DRAFT | PENDING_APPROVAL | PENDING_GENERATION | MISSING), wave grouping, overall completion percentage

### 5. NestJS Endpoints

Added to `apps/server/src/policies/`:

**`POST /api/policies/generate-iso27001`**
- Auth: `@UseGuards(JwtAuthGuard, AdminOnlyGuard)` + `@AdminOnly()`
- Body: `{ wave: 1 | 2 | 3 }`
- Implements a thin `PolicyGenerationService` that reuses the shared types and registry from `packages/mcp-shared/src/iso27001/` but has its own Claude API call logic (avoids cross-package import from MCP server into NestJS)
- `mcpSessionId` is omitted (optional param) — pending actions created without session linkage
- Returns: `GenerationResult`

**`GET /api/policies/iso27001-status`**
- Auth: `@UseGuards(JwtAuthGuard)`
- Returns: coverage matrix — all 28 documents with status, wave, completion percentage

### 6. Frontend

**`Iso27001CoverageCard.tsx`** — added to the policies dashboard:

- Shows all 28 documents grouped by wave
- Status badges: Published (green), Draft (yellow), Pending Approval (orange), Missing (grey)
- Overall completion percentage bar
- "Generate Wave X" button — visible to admins when that wave has missing documents
- Confirmation dialog: "This will generate X documents using AI and send them to the approval queue for review. Estimated time: ~1-2 minutes."
- Loading state with progress indicator during generation
- After generation: "X documents sent to approval queue" with link to `/settings/mcp-approvals`

**Query hooks:**
- `useIso27001Status()` — calls `GET /api/policies/iso27001-status`
- `useGenerateIso27001(wave)` — mutation calling `POST /api/policies/generate-iso27001`

## Data Flow

### Chat-Driven Generation
```
User: "Generate all ISO 27001 documentation"
  → Agent calls propose_generate_iso27001_documents({ wave: '1' })
    → generation-engine reads org context from DB
    → generation-engine reads ISO 27001/27002 reference sections
    → generation-engine calls Claude API per document
    → generation-engine calls createPendingAction() per document
    → returns summary to agent
  → Agent reports: "Wave 1 complete. 5 documents in approval queue."
  → Agent offers: "Ready for Wave 2?"
```

### UI-Driven Generation
```
Admin clicks "Generate Wave 1" on dashboard
  → POST /api/policies/generate-iso27001 { wave: 1 }
    → PolicyService calls same generation-engine
    → same flow as above
  → Frontend shows: "5 documents sent to approval queue"
  → Admin navigates to /settings/mcp-approvals to review
```

### Approval Flow
```
Admin reviews pending action for POL-009 (Risk Management Methodology)
  → Reads generated content, edits if needed
  → Approves
  → Extended CREATE_POLICY executor runs:
    → Creates PolicyDocument record with all fields
    → Creates DocumentControlMapping records (if controlMappings in payload)
    → Creates DocumentRiskMapping records (if riskMappings in payload)
    → Creates initial DocumentVersion record (if version in payload)
    → All within a single Prisma transaction
  → Document appears in policy list as DRAFT (owner can then publish)
```

**Executor changes:** The existing `CREATE_POLICY` executor in `policy.executors.ts` is extended to check for optional `controlMappings[]`, `riskMappings[]`, and `version` fields in the payload. If present, it creates the related records in the same transaction. This is backwards-compatible — existing single-document `propose_create_policy` payloads without these fields continue to work.

## Out of Scope

- AI-powered editing/rewriting of individual documents after generation
- Support for standards other than ISO 27001:2022 (ISO 22301, SOC 2, etc.) — future work
- PDF export of generated documents
- Automatic policy review scheduling after generation
- Multi-language document generation
