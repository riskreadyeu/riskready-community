# Gateway Optimization: Tool Search, Executor Coverage & Reliability

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve gateway performance, accuracy, cost control, and security by implementing client-side tool search, completing executor coverage for all 9 domains, and fixing reliability issues in action ID extraction and type safety.

**Architecture:** Client-side tool catalog replaces keyword router — the agent searches a pre-built catalog of all MCP tools and only the relevant MCP servers are spawned. Executor coverage is extended to all 8 missing domains using the existing Map<McpActionType, Executor> pattern. Action IDs are extracted from structured tool results instead of regex on assistant text.

**Tech Stack:** TypeScript, Vitest (gateway), Jest (server), Prisma, Claude Agent SDK 0.2.42, Anthropic Messages API (tool_reference blocks)

---

## Task 1: Type Safety for `createPendingAction`

**Why:** The most critical mutation gate in the system uses `as never` to bypass TypeScript's enum checking. A typo in an action type string passes compilation but fails at runtime.

**Files:**
- Modify: `packages/mcp-shared/src/pending-action.ts`
- Modify: All MCP server mutation tool files that call `createPendingAction()`

**Step 1: Read the current implementation**

Read `packages/mcp-shared/src/pending-action.ts` and note the `as never` casts on lines ~21 and ~24.

**Step 2: Import McpActionType from Prisma and update the function signature**

```typescript
// packages/mcp-shared/src/pending-action.ts
import { McpActionType } from '@prisma/client';

export async function createPendingAction(params: {
  actionType: McpActionType;  // Was: string, cast with `as never`
  summary: string;
  reason?: string;
  payload: Record<string, unknown>;
  organisationId: string;
  createdById?: string;
}) {
  const action = await prisma.mcpPendingAction.create({
    data: {
      actionType: params.actionType,  // No cast needed
      summary: params.summary,
      reason: params.reason,
      payload: params.payload as any,
      organisationId: params.organisationId,
      createdById: params.createdById,
    },
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          message: 'Action proposed successfully. Awaiting human approval.',
          actionId: action.id,
          status: action.status,
          summary: action.summary,
        }),
      },
    ],
  };
}
```

**Step 3: Update all MCP server mutation tools to use the enum**

In every mutation tool file across all 9 MCP servers, replace string literals with enum values:

```typescript
// Before (in each MCP server's mutation tools)
import { createPendingAction } from '#mcp-shared';

// After
import { createPendingAction } from '#mcp-shared';
import { McpActionType } from '@prisma/client';

// In tool handlers, change:
//   actionType: 'CREATE_RISK'
// To:
//   actionType: McpActionType.CREATE_RISK
```

Files to update (search for `createPendingAction` calls in each):
- `apps/mcp-server-risks/src/tools/mutation-tools.ts`
- `apps/mcp-server-controls/src/tools/` (all files with mutations)
- `apps/mcp-server-incidents/src/tools/mutation-tools.ts`
- `apps/mcp-server-policies/src/tools/mutation-tools.ts`
- `apps/mcp-server-evidence/src/tools/mutation-tools.ts`
- `apps/mcp-server-audits/src/tools/mutation-tools.ts`
- `apps/mcp-server-itsm/src/tools/mutation-tools.ts`
- `apps/mcp-server-organisation/src/tools/mutation-tools.ts`

**Step 4: Verify compilation**

Run: `cd packages/mcp-shared && npx tsc --noEmit`
Run: `cd apps/mcp-server-risks && npx tsc --noEmit`
(Repeat for each MCP server)

Expected: No TypeScript errors. Any typos in action type strings are now caught at compile time.

**Step 5: Commit**

```bash
git add packages/mcp-shared/src/pending-action.ts apps/mcp-server-*/src/tools/
git commit -m "fix: add compile-time type safety to createPendingAction

Replace string action types with McpActionType enum values across all
MCP servers. Removes unsafe 'as never' cast from the critical mutation gate."
```

---

## Task 2: Refactor Executor Service into Per-Domain Files

**Why:** The executor service currently registers all executors in one monolithic file. To enable parallel development across 8 domains and keep each domain's executor logic isolated and testable, we split into per-domain executor files that the main service imports.

**Files:**
- Create: `apps/server/src/mcp-approval/executors/risk.executors.ts`
- Create: `apps/server/src/mcp-approval/executors/incident.executors.ts`
- Create: `apps/server/src/mcp-approval/executors/policy.executors.ts`
- Create: `apps/server/src/mcp-approval/executors/evidence.executors.ts`
- Create: `apps/server/src/mcp-approval/executors/audit.executors.ts`
- Create: `apps/server/src/mcp-approval/executors/itsm.executors.ts`
- Create: `apps/server/src/mcp-approval/executors/organisation.executors.ts`
- Create: `apps/server/src/mcp-approval/executors/index.ts` (barrel export)
- Modify: `apps/server/src/mcp-approval/mcp-approval-executor.service.ts` — extract existing control executors, import per-domain registrars

**Step 1: Define the executor registrar interface**

```typescript
// apps/server/src/mcp-approval/executors/types.ts
import { McpActionType } from '@prisma/client';

export type ExecutorPayload = Record<string, any>;
export type Executor = (payload: ExecutorPayload, reviewedById: string) => Promise<unknown>;
export type ExecutorMap = Map<McpActionType, Executor>;

// Each domain exports a function that registers its executors into the shared map
export type ExecutorRegistrar = (executors: ExecutorMap, services: Record<string, any>) => void;
```

**Step 2: Extract existing control executors into `control.executors.ts`**

Move the existing `registerControlExecutors()`, `registerAssessmentExecutors()`, `registerSoaExecutors()`, `registerScopeExecutors()` logic into:

```typescript
// apps/server/src/mcp-approval/executors/control.executors.ts
import { McpActionType } from '@prisma/client';
import { ExecutorMap } from './types';

export function registerControlExecutors(
  executors: ExecutorMap,
  services: { controlService: any; assessmentService: any; soaService: any; scopeService: any },
): void {
  const { controlService, assessmentService, soaService, scopeService } = services;

  executors.set(McpActionType.CREATE_CONTROL, async (p, userId) => {
    return controlService.create({ ...p, createdById: userId });
  });

  // ... move ALL existing control executor registrations here
}
```

**Step 3: Update the main executor service to import registrars**

```typescript
// mcp-approval-executor.service.ts — simplified
import { registerControlExecutors } from './executors/control.executors';
import { registerRiskExecutors } from './executors/risk.executors';
// ... import all domain registrars

@Injectable()
export class McpApprovalExecutorService {
  private executors: ExecutorMap = new Map();

  constructor(
    private controlService: ControlService,
    private riskService: RiskService,
    // ... all domain services
  ) {
    registerControlExecutors(this.executors, { controlService, assessmentService, soaService, scopeService });
    registerRiskExecutors(this.executors, { riskService, scenarioService, kriService, treatmentService });
    // ... register all domains
  }

  canExecute(actionType: McpActionType): boolean {
    return this.executors.has(actionType);
  }

  async execute(actionType: McpActionType, payload: ExecutorPayload, userId: string): Promise<unknown> {
    const executor = this.executors.get(actionType);
    if (!executor) throw new Error(`No executor for ${actionType}`);
    return executor(payload, userId);
  }
}
```

**Step 4: Verify existing tests still pass**

Run: `cd apps/server && npx jest --testPathPattern="mcp-approval" --verbose`
Expected: PASS — refactor is behavior-preserving.

**Step 5: Commit**

```bash
git add apps/server/src/mcp-approval/
git commit -m "refactor: split executor service into per-domain files

Extract control executors into executors/control.executors.ts.
Create registrar pattern so each domain can be developed and tested independently."
```

---

## Task 3: Complete Executor Coverage (Risks Domain)

**Why:** 81 of 122 action types have no executor. Approved actions never execute — data never lands in domain tables. With the per-domain file structure from Task 2, each domain can be implemented independently.

**Files:**
- Create: `apps/server/src/mcp-approval/executors/risk.executors.ts`
- Create: `apps/server/src/mcp-approval/__tests__/risk-executors.spec.ts`
- Modify: `apps/server/src/mcp-approval/mcp-approval-executor.service.ts` — inject RiskService, call registrar

**Step 1: Write the failing test for risk executors**

```typescript
// apps/server/src/mcp-approval/__tests__/risk-executors.spec.ts
import { McpActionType } from '@prisma/client';
import { registerRiskExecutors } from '../executors/risk.executors';
import { ExecutorMap } from '../executors/types';

describe('Risk Executors', () => {
  let executors: ExecutorMap;
  let mockRiskService: any;
  let mockScenarioService: any;

  beforeEach(() => {
    executors = new Map();
    mockRiskService = {
      create: jest.fn().mockResolvedValue({ id: 'risk-1', title: 'Test Risk' }),
      update: jest.fn().mockResolvedValue({ id: 'risk-1', title: 'Updated' }),
    };
    mockScenarioService = {
      create: jest.fn().mockResolvedValue({ id: 'scenario-1' }),
      transition: jest.fn().mockResolvedValue({ id: 'scenario-1' }),
    };

    registerRiskExecutors(executors, {
      riskService: mockRiskService,
      scenarioService: mockScenarioService,
    });
  });

  it('should register CREATE_RISK executor', () => {
    expect(executors.has(McpActionType.CREATE_RISK)).toBe(true);
  });

  it('should execute CREATE_RISK', async () => {
    const executor = executors.get(McpActionType.CREATE_RISK)!;
    await executor({ title: 'Test Risk', organisationId: 'org-1' }, 'user-1');
    expect(mockRiskService.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Test Risk', createdById: 'user-1' }),
    );
  });

  it('should execute UPDATE_RISK', async () => {
    const executor = executors.get(McpActionType.UPDATE_RISK)!;
    await executor({ riskId: 'risk-1', title: 'Updated Risk' }, 'user-1');
    expect(mockRiskService.update).toHaveBeenCalledWith(
      'risk-1',
      expect.objectContaining({ title: 'Updated Risk' }),
    );
  });

  it('should register all 11 risk action types', () => {
    const riskActions = [
      McpActionType.CREATE_RISK, McpActionType.UPDATE_RISK,
      McpActionType.CREATE_SCENARIO, McpActionType.TRANSITION_SCENARIO,
      McpActionType.ASSESS_SCENARIO, McpActionType.CREATE_KRI,
      McpActionType.RECORD_KRI_VALUE, McpActionType.CREATE_RTS,
      McpActionType.APPROVE_RTS, McpActionType.CREATE_TREATMENT_PLAN,
      McpActionType.CREATE_TREATMENT_ACTION,
    ];
    for (const action of riskActions) {
      expect(executors.has(action)).toBe(true);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/server && npx jest --testPathPattern="risk-executors" --verbose`
Expected: FAIL — module `risk.executors.ts` does not exist yet.

**Step 3: Implement risk executors**

```typescript
// apps/server/src/mcp-approval/executors/risk.executors.ts
import { McpActionType } from '@prisma/client';
import { ExecutorMap } from './types';

export function registerRiskExecutors(
  executors: ExecutorMap,
  services: { riskService: any; scenarioService: any; kriService?: any; treatmentService?: any },
): void {
  const { riskService, scenarioService, kriService, treatmentService } = services;

  executors.set(McpActionType.CREATE_RISK, async (p, userId) => {
    return riskService.create({ ...p, createdById: userId });
  });

  executors.set(McpActionType.UPDATE_RISK, async (p, userId) => {
    const { riskId, ...data } = p;
    return riskService.update(riskId, { ...data, updatedById: userId });
  });

  executors.set(McpActionType.CREATE_SCENARIO, async (p, userId) => {
    return scenarioService.create({ ...p, createdById: userId });
  });

  executors.set(McpActionType.TRANSITION_SCENARIO, async (p, userId) => {
    return scenarioService.transition(p.scenarioId, p.status, userId);
  });

  executors.set(McpActionType.ASSESS_SCENARIO, async (p, userId) => {
    return scenarioService.assess(p.scenarioId, p, userId);
  });

  // CREATE_KRI, RECORD_KRI_VALUE → kriService
  // CREATE_RTS, APPROVE_RTS → treatmentService
  // CREATE_TREATMENT_PLAN, CREATE_TREATMENT_ACTION → treatmentService
  // Match each to the corresponding service method — read the actual service
  // files to confirm method signatures before implementing.
}
```

**Step 4: Wire into main executor service**

In `mcp-approval-executor.service.ts`:
- Add `RiskService`, `ScenarioService` to constructor injection
- Call `registerRiskExecutors(this.executors, { riskService, scenarioService })` in constructor

**Step 5: Run test to verify it passes**

Run: `cd apps/server && npx jest --testPathPattern="risk-executors" --verbose`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/server/src/mcp-approval/
git commit -m "feat: add executor coverage for risks domain

Register executors for CREATE_RISK, UPDATE_RISK, CREATE_SCENARIO,
TRANSITION_SCENARIO, ASSESS_SCENARIO, CREATE_KRI, RECORD_KRI_VALUE,
CREATE_RTS, APPROVE_RTS, CREATE_TREATMENT_PLAN, CREATE_TREATMENT_ACTION."
```

---

## Task 4: Complete Executor Coverage (Incidents Domain)

**Files:**
- Create: `apps/server/src/mcp-approval/executors/incident.executors.ts`
- Create: `apps/server/src/mcp-approval/__tests__/incident-executors.spec.ts`
- Modify: `apps/server/src/mcp-approval/mcp-approval-executor.service.ts` — inject IncidentService, call registrar

**Step 1: Write the failing test**

Test all 8 incident action types using the registrar pattern from Task 3:
CREATE_INCIDENT, UPDATE_INCIDENT, TRANSITION_INCIDENT, ADD_TIMELINE_ENTRY, ADD_INCIDENT_ASSET, LINK_INCIDENT_CONTROL, CREATE_LESSON_LEARNED, CLOSE_INCIDENT.

```typescript
// apps/server/src/mcp-approval/__tests__/incident-executors.spec.ts
import { McpActionType } from '@prisma/client';
import { registerIncidentExecutors } from '../executors/incident.executors';
import { ExecutorMap } from '../executors/types';

describe('Incident Executors', () => {
  let executors: ExecutorMap;
  let mockIncidentService: any;

  beforeEach(() => {
    executors = new Map();
    mockIncidentService = {
      create: jest.fn().mockResolvedValue({ id: 'inc-1' }),
      update: jest.fn().mockResolvedValue({ id: 'inc-1' }),
      updateStatus: jest.fn().mockResolvedValue({ id: 'inc-1' }),
      addAffectedAsset: jest.fn().mockResolvedValue({}),
      linkControl: jest.fn().mockResolvedValue({}),
    };
    registerIncidentExecutors(executors, { incidentService: mockIncidentService });
  });

  it('should register all 8 incident action types', () => {
    const actions = [
      McpActionType.CREATE_INCIDENT, McpActionType.UPDATE_INCIDENT,
      McpActionType.TRANSITION_INCIDENT, McpActionType.ADD_TIMELINE_ENTRY,
      McpActionType.ADD_INCIDENT_ASSET, McpActionType.LINK_INCIDENT_CONTROL,
      McpActionType.CREATE_LESSON_LEARNED, McpActionType.CLOSE_INCIDENT,
    ];
    for (const action of actions) {
      expect(executors.has(action)).toBe(true);
    }
  });

  it('should execute CREATE_INCIDENT', async () => {
    const executor = executors.get(McpActionType.CREATE_INCIDENT)!;
    await executor({ title: 'Breach detected', severity: 'HIGH' }, 'user-1');
    expect(mockIncidentService.create).toHaveBeenCalled();
  });
});
```

**Step 2: Run test — verify FAIL**

**Step 3: Implement incident executors**

```typescript
// apps/server/src/mcp-approval/executors/incident.executors.ts
import { McpActionType } from '@prisma/client';
import { ExecutorMap } from './types';

export function registerIncidentExecutors(
  executors: ExecutorMap,
  services: { incidentService: any; lessonLearnedService?: any },
): void {
  const { incidentService, lessonLearnedService } = services;

  executors.set(McpActionType.CREATE_INCIDENT, async (p, userId) => {
    return incidentService.create(p, userId);
  });

  executors.set(McpActionType.UPDATE_INCIDENT, async (p, userId) => {
    const { incidentId, ...data } = p;
    return incidentService.update(incidentId, data, userId);
  });

  executors.set(McpActionType.TRANSITION_INCIDENT, async (p, userId) => {
    return incidentService.updateStatus(p.incidentId, p.status, userId, p.notes);
  });

  executors.set(McpActionType.ADD_TIMELINE_ENTRY, async (p, userId) => {
    return incidentService.addTimelineEntry(p.incidentId, p);
  });

  executors.set(McpActionType.ADD_INCIDENT_ASSET, async (p, userId) => {
    return incidentService.addAffectedAsset(p.incidentId, p.assetId, p.impactType, p.notes);
  });

  executors.set(McpActionType.LINK_INCIDENT_CONTROL, async (p, userId) => {
    return incidentService.linkControl(p.incidentId, p.controlId, p.linkType, p.notes);
  });

  executors.set(McpActionType.CREATE_LESSON_LEARNED, async (p, userId) => {
    return lessonLearnedService?.create({ ...p, createdById: userId })
      ?? incidentService.createLessonLearned?.({ ...p, createdById: userId });
  });

  executors.set(McpActionType.CLOSE_INCIDENT, async (p, userId) => {
    return incidentService.updateStatus(p.incidentId, 'CLOSED', userId, p.notes);
  });
}
```

**Step 4: Wire into main executor service — inject IncidentService**

**Step 5: Run test — verify PASS**

**Step 6: Commit**

```bash
git commit -m "feat: add executor coverage for incidents domain"
```

---

## Task 5: Complete Executor Coverage (Policies Domain)

**Files:**
- Create: `apps/server/src/mcp-approval/executors/policy.executors.ts`
- Create: `apps/server/src/mcp-approval/__tests__/policy-executors.spec.ts`

9 action types: CREATE_POLICY, UPDATE_POLICY, SUBMIT_POLICY_REVIEW, APPROVE_POLICY, PUBLISH_POLICY, RETIRE_POLICY, CREATE_POLICY_EXCEPTION, APPROVE_POLICY_EXCEPTION, CREATE_POLICY_CHANGE_REQUEST.

Map to `PolicyDocumentService` methods:
- CREATE_POLICY → `create()`
- UPDATE_POLICY → `update()`
- SUBMIT_POLICY_REVIEW → `updateStatus(id, 'IN_REVIEW')`
- APPROVE_POLICY → `updateStatus(id, 'APPROVED')`
- PUBLISH_POLICY → `updateStatus(id, 'PUBLISHED')`
- RETIRE_POLICY → `updateStatus(id, 'RETIRED')`
- CREATE_POLICY_EXCEPTION → exception service `create()`
- APPROVE_POLICY_EXCEPTION → exception service `approve()`
- CREATE_POLICY_CHANGE_REQUEST → change request service `create()`

Follow the registrar pattern. Test, implement, commit.

---

## Task 6: Complete Executor Coverage (Evidence Domain)

**Files:**
- Create: `apps/server/src/mcp-approval/executors/evidence.executors.ts`
- Create: `apps/server/src/mcp-approval/__tests__/evidence-executors.spec.ts`

6 action types: CREATE_EVIDENCE, UPDATE_EVIDENCE, LINK_EVIDENCE, CREATE_EVIDENCE_REQUEST, FULFILL_EVIDENCE_REQUEST, CLOSE_EVIDENCE_REQUEST.

Map to `EvidenceService` methods:
- CREATE_EVIDENCE → `create()`
- UPDATE_EVIDENCE → `update()`
- LINK_EVIDENCE → `linkToControl()` or similar
- CREATE_EVIDENCE_REQUEST → request service `create()`
- FULFILL_EVIDENCE_REQUEST → request service `fulfill()`
- CLOSE_EVIDENCE_REQUEST → request service `close()`

Follow the registrar pattern. Test, implement, commit.

---

## Task 7: Complete Executor Coverage (Audits Domain)

**Files:**
- Create: `apps/server/src/mcp-approval/executors/audit.executors.ts`
- Create: `apps/server/src/mcp-approval/__tests__/audit-executors.spec.ts`

7 action types: CREATE_NONCONFORMITY, UPDATE_NONCONFORMITY, TRANSITION_NONCONFORMITY, SUBMIT_CAP, APPROVE_CAP, REJECT_CAP, CLOSE_NONCONFORMITY.

Map to `NonconformityService` methods:
- CREATE_NONCONFORMITY → `create()`
- UPDATE_NONCONFORMITY → `update()`
- TRANSITION_NONCONFORMITY → `update()` with status change
- SUBMIT_CAP → CAP service method
- APPROVE_CAP → CAP service method
- REJECT_CAP → CAP service method
- CLOSE_NONCONFORMITY → `close()`

Follow the registrar pattern. Test, implement, commit.

---

## Task 8: Complete Executor Coverage (ITSM Domain)

**Files:**
- Create: `apps/server/src/mcp-approval/executors/itsm.executors.ts`
- Create: `apps/server/src/mcp-approval/__tests__/itsm-executors.spec.ts`

15 action types for assets and change management.

Map to `AssetService` and `ChangeService`:
- CREATE_ASSET → `assetService.create()`
- UPDATE_ASSET → `assetService.update()`
- DELETE_ASSET → `assetService.delete()`
- CREATE_ASSET_RELATIONSHIP → relationship service
- LINK_ASSET_CONTROL, LINK_ASSET_RISK → link services
- CREATE_CHANGE through CANCEL_CHANGE → `changeService` methods
- CREATE_CAPACITY_PLAN, UPDATE_CAPACITY_PLAN → capacity service

Follow the registrar pattern. Test, implement, commit.

---

## Task 9: Complete Executor Coverage (Organisation Domain)

**Files:**
- Create: `apps/server/src/mcp-approval/executors/organisation.executors.ts`
- Create: `apps/server/src/mcp-approval/__tests__/organisation-executors.spec.ts`

14 action types for org profile, departments, locations, business processes, committees, external dependencies.

Map to `OrganisationProfileService`, `DepartmentService`, `LocationService`, etc.

Follow the registrar pattern. Test, implement, commit.

---

## Task 10: Complete Executor Coverage (Remaining Controls)

**Files:**
- Modify: `apps/server/src/mcp-approval/executors/control.executors.ts`
- Modify: `apps/server/src/mcp-approval/__tests__/control-executors.spec.ts` (or existing tests)

6 missing action types in the controls domain: CREATE_REMEDIATION, CREATE_CONTROL_LAYER, CREATE_LAYER_TEST, CREATE_CONTROL_ACTIVITY, CREATE_CONTROL_METRIC, UPDATE_METRIC_VALUE.

Add to the existing `control.executors.ts` registrar. Test, implement, commit.

---

## Task 11: Build Tool Catalog with BM25 Scoring

**Why:** Replace the fragile keyword router with a tool catalog that uses BM25 (Best Match 25) scoring for relevance-ranked search. BM25 handles term frequency and inverse document frequency — a term like "risk" that appears in every tool description gets lower weight, while a rare term like "nonconformity" gets higher weight. This is the same algorithm Anthropic's own Tool Search API offers as a variant, and it's a significant accuracy improvement over both substring matching and keyword regex.

**Design:** Since the gateway uses stdio MCP servers via the Agent SDK, we cannot use Anthropic's server-side tool search directly. Instead, we implement a **client-side tool catalog with BM25**:

1. At startup, enumerate all tools from all MCP servers (from metadata in `skills.yaml`, not by spawning them)
2. Build a BM25 index over tool name, description, and argument names
3. The gateway searches the catalog before spawning MCP servers
4. Only the MCP servers whose tools match are spawned

**BM25 primer:** BM25 scores each document (tool) against a query using:
- **TF (term frequency):** How often a query term appears in the document, with diminishing returns (saturates)
- **IDF (inverse document frequency):** Rare terms across the corpus score higher than common ones
- **Document length normalization:** Shorter descriptions aren't penalized vs. longer ones
- Formula: `score = Σ IDF(term) * (TF * (k1 + 1)) / (TF + k1 * (1 - b + b * docLen/avgDocLen))`
- Typical parameters: `k1 = 1.5` (TF saturation), `b = 0.75` (length normalization)

No external dependencies needed — BM25 is ~40 lines of code.

**Files:**
- Create: `gateway/src/catalog/tool-catalog.ts`
- Create: `gateway/src/catalog/__tests__/tool-catalog.test.ts`

**Step 1: Write the failing test for ToolCatalog**

```typescript
// gateway/src/catalog/__tests__/tool-catalog.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ToolCatalog } from '../tool-catalog';

describe('ToolCatalog', () => {
  let catalog: ToolCatalog;

  beforeEach(() => {
    catalog = new ToolCatalog([
      {
        serverName: 'riskready-risks',
        tools: [
          { name: 'list_risks', description: 'List all risks in the risk register', args: ['organisationId', 'status', 'tier'] },
          { name: 'propose_create_risk', description: 'Propose creating a new risk entry', args: ['title', 'description', 'tier', 'likelihood', 'impact'] },
        ],
      },
      {
        serverName: 'riskready-controls',
        tools: [
          { name: 'list_controls', description: 'List security controls', args: ['framework', 'status'] },
          { name: 'propose_create_control', description: 'Propose creating a new control', args: ['title', 'description', 'framework'] },
        ],
      },
      {
        serverName: 'riskready-audits',
        tools: [
          { name: 'list_nonconformities', description: 'List audit nonconformities and findings', args: ['status', 'severity'] },
        ],
      },
    ]);
  });

  it('should search by keyword and return matching tools', () => {
    const results = catalog.search('risk');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.toolName === 'list_risks')).toBe(true);
  });

  it('should return the server names for matched tools', () => {
    const results = catalog.search('risk');
    const servers = catalog.getServersForTools(results);
    expect(servers).toContain('riskready-risks');
  });

  it('should match on description content', () => {
    const results = catalog.search('register');
    expect(results.some(r => r.toolName === 'list_risks')).toBe(true);
  });

  it('should match on argument names', () => {
    const results = catalog.search('framework');
    const servers = catalog.getServersForTools(results);
    expect(servers).toContain('riskready-controls');
    expect(servers).toContain('riskready-risks');
  });

  it('should return empty for no matches', () => {
    const results = catalog.search('xyznonexistent');
    expect(results).toHaveLength(0);
  });

  it('should always include agent-ops server', () => {
    const results = catalog.search('risk');
    const servers = catalog.getServersForTools(results);
    expect(servers).toContain('riskready-agent-ops');
  });

  it('should rank rare terms higher than common ones (IDF)', () => {
    // "nonconformity" only appears in the audits tool
    // "list" appears in every tool — it should contribute less
    const results = catalog.search('nonconformity');
    expect(results[0].serverName).toBe('riskready-audits');
  });

  it('should rank name matches higher than description-only matches', () => {
    const results = catalog.search('risk');
    // Tools with "risk" in the name should rank above those with "risk" only in description
    const nameMatchIdx = results.findIndex(r => r.toolName.includes('risk'));
    expect(nameMatchIdx).toBe(0);
  });
});
```

**Step 2: Run test — verify FAIL**

Run: `cd gateway && npx vitest run src/catalog/__tests__/tool-catalog.test.ts`

**Step 3: Implement ToolCatalog with BM25**

```typescript
// gateway/src/catalog/tool-catalog.ts

export interface ToolEntry {
  toolName: string;
  description: string;
  args: string[];
  serverName: string;
  tokens: string[];     // tokenized searchable text
  nameTokens: string[]; // tokenized name (for boosting)
}

export interface ServerToolSet {
  serverName: string;
  tools: Array<{ name: string; description: string; args: string[] }>;
}

export interface SearchResult {
  toolName: string;
  serverName: string;
  description: string;
  score: number;
}

const ALWAYS_INCLUDE = ['riskready-agent-ops'];

// BM25 parameters
const K1 = 1.5;  // TF saturation
const B = 0.75;  // length normalization
const NAME_BOOST = 2.0; // boost for matches in tool name

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[\s_\-./]+/).filter(t => t.length > 1);
}

export class ToolCatalog {
  private entries: ToolEntry[] = [];
  private avgDocLen: number = 0;
  private docFreq: Map<string, number> = new Map(); // term → how many docs contain it

  constructor(serverToolSets: ServerToolSet[]) {
    // Build entries
    for (const server of serverToolSets) {
      for (const tool of server.tools) {
        const tokens = tokenize([tool.name, tool.description, ...tool.args].join(' '));
        const nameTokens = tokenize(tool.name);
        this.entries.push({
          toolName: tool.name,
          description: tool.description,
          args: tool.args,
          serverName: server.serverName,
          tokens,
          nameTokens,
        });
      }
    }

    // Compute corpus statistics
    const totalTokens = this.entries.reduce((sum, e) => sum + e.tokens.length, 0);
    this.avgDocLen = this.entries.length > 0 ? totalTokens / this.entries.length : 1;

    // Compute document frequency for each unique term
    for (const entry of this.entries) {
      const uniqueTerms = new Set(entry.tokens);
      for (const term of uniqueTerms) {
        this.docFreq.set(term, (this.docFreq.get(term) ?? 0) + 1);
      }
    }
  }

  search(query: string, maxResults = 10): SearchResult[] {
    const queryTerms = tokenize(query);
    if (queryTerms.length === 0) return [];

    const N = this.entries.length;
    const scored: SearchResult[] = [];

    for (const entry of this.entries) {
      let score = 0;

      for (const term of queryTerms) {
        // Term frequency in this document
        const tf = entry.tokens.filter(t => t === term || t.includes(term)).length;
        if (tf === 0) continue;

        // Inverse document frequency
        const df = this.docFreq.get(term) ?? 0;
        // Use partial match df: count docs containing the term as substring
        let partialDf = 0;
        for (const [docTerm, freq] of this.docFreq) {
          if (docTerm.includes(term)) partialDf += freq;
        }
        const effectiveDf = Math.max(partialDf, df);
        const idf = Math.log((N - effectiveDf + 0.5) / (effectiveDf + 0.5) + 1);

        // BM25 TF component with length normalization
        const docLen = entry.tokens.length;
        const tfNorm = (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * docLen / this.avgDocLen));

        score += idf * tfNorm;

        // Boost if term appears in tool name
        const nameMatch = entry.nameTokens.some(t => t === term || t.includes(term));
        if (nameMatch) score += idf * NAME_BOOST;
      }

      if (score > 0) {
        scored.push({
          toolName: entry.toolName,
          serverName: entry.serverName,
          description: entry.description,
          score,
        });
      }
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, maxResults);
  }

  getServersForTools(results: SearchResult[]): string[] {
    const servers = new Set(results.map(r => r.serverName));
    for (const name of ALWAYS_INCLUDE) servers.add(name);
    return Array.from(servers);
  }

  getAllEntries(): ToolEntry[] {
    return this.entries;
  }
}
```

**Step 4: Run test — verify PASS**

Run: `cd gateway && npx vitest run src/catalog/__tests__/tool-catalog.test.ts`

**Step 5: Commit**

```bash
git add gateway/src/catalog/
git commit -m "feat: add ToolCatalog with BM25 scoring for client-side tool discovery

BM25 provides relevance-ranked search with IDF weighting (rare terms
score higher) and TF saturation. Tool name matches get a 2x boost.
No external dependencies — pure TypeScript implementation."
```

> **Future upgrade path:** If BM25 proves insufficient for semantic queries (e.g., "what's our security posture?" not matching any tool), consider adding a lightweight embedding-based search using a small model. The `ToolCatalog.search()` interface is designed to be swappable — replace the BM25 internals with cosine similarity over embeddings without changing the caller.

---

## Task 12: Add Tool Metadata to skills.yaml

**Why:** The catalog needs to know which tools each MCP server exposes without spawning them. We add tool metadata to `skills.yaml`.

**Files:**
- Modify: `gateway/skills.yaml`
- Modify: `gateway/src/agent/skill-registry.ts` — parse new `tools` field

**Step 1: Enumerate all tools from each MCP server**

Read each MCP server's tool registration files and collect name, description, and argument names. Add them to `skills.yaml`:

```yaml
- name: riskready-risks
  description: "Risk register, scenarios, KRIs, tolerance, treatment plans"
  tags: [risks]
  capabilities: [query, mutation]
  command: npx
  args: ["tsx", "../mcp-server-risks/src/index.ts"]
  requiresDb: true
  tools:
    - name: list_risks
      description: "List all risks with optional filters"
      args: [organisationId, status, tier, framework]
    - name: get_risk
      description: "Get a single risk by ID with full details"
      args: [riskId]
    - name: search_risks
      description: "Search risks by keyword"
      args: [query, organisationId]
    - name: get_risk_stats
      description: "Get risk statistics and dashboard metrics"
      args: [organisationId]
    - name: propose_create_risk
      description: "Propose creating a new risk"
      args: [title, description, tier, likelihood, impact, organisationId]
    - name: propose_update_risk
      description: "Propose updating an existing risk"
      args: [riskId, title, description, tier, likelihood, impact]
    # ... enumerate all tools for this server
```

Repeat for all 9 servers.

**Step 2: Update SkillRegistry to parse tools metadata**

```typescript
// In skill-registry.ts, update the SkillDefinition interface:
interface SkillDefinition {
  name: string;
  description: string;
  tags: string[];
  capabilities: string[];
  command: string;
  args: string[];
  requiresDb: boolean;
  tools?: Array<{
    name: string;
    description: string;
    args: string[];
  }>;
}

// Add method to export tool sets for catalog:
getToolSets(): ServerToolSet[] {
  return Array.from(this.definitions.values()).map(skill => ({
    serverName: skill.name,
    tools: skill.tools ?? [],
  }));
}
```

**Step 3: Verify skills.yaml loads correctly**

Run: `cd gateway && npx vitest run src/agent/__tests__/skill-registry.test.ts`

**Step 4: Commit**

```bash
git add gateway/skills.yaml gateway/src/agent/skill-registry.ts
git commit -m "feat: add tool metadata to skills.yaml for catalog-based discovery"
```

---

## Task 13: Integrate Tool Catalog into Agent Runner

**Why:** Replace the keyword router with catalog-driven MCP server selection. The agent gets a `search_tools` custom tool and uses it to find relevant tools before the main query.

**Files:**
- Modify: `gateway/src/agent/agent-runner.ts`
- Modify: `gateway/src/gateway.ts`
- Create: `gateway/src/catalog/__tests__/integration.test.ts`

**Step 1: Write the integration test**

Test that the `getMcpServers` callback uses the catalog when the router is replaced.

**Step 2: Initialize ToolCatalog in Gateway**

```typescript
// In gateway.ts constructor or init:
const toolSets = this.skillRegistry.getToolSets();
this.toolCatalog = new ToolCatalog(toolSets);
```

**Step 3: Replace router-based getMcpServers with catalog-based selection**

Two implementation strategies (choose based on Agent SDK constraints):

**Strategy A — Pre-query catalog search (simpler):**
```typescript
// In the getMcpServers callback:
getMcpServers: (messageText?: string) => {
  if (messageText) {
    const results = this.toolCatalog.search(messageText);
    const serverNames = this.toolCatalog.getServersForTools(results);
    return this.skillRegistry.getMcpServers(
      serverNames, config.databaseUrl, join(PROJECT_ROOT, 'apps')
    );
  }
  // Fallback: all servers
  return this.skillRegistry.getMcpServers(
    this.skillRegistry.listAll().map(s => s.name),
    config.databaseUrl, join(PROJECT_ROOT, 'apps')
  );
}
```

**Strategy B — Two-phase agent execution (more accurate, requires SDK support):**
Phase 1: Run a lightweight query with only the `search_tools` tool → get server list.
Phase 2: Re-run the full query with only the selected MCP servers.

Start with Strategy A. It's a direct improvement over keyword regex (semantic matching on tool descriptions and args instead of a hardcoded keyword map). Strategy B can be pursued later if accuracy needs further improvement.

**Step 4: Keep the Router as fallback (optional)**

Don't delete `router.ts` yet — keep it as a fallback behind a config flag:

```typescript
// config.ts
routing: {
  mode: 'catalog' | 'keyword';  // ROUTING_MODE env var, default 'catalog'
}
```

**Step 5: Run all gateway tests**

Run: `cd gateway && npx vitest run`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add gateway/src/
git commit -m "feat: replace keyword router with catalog-based tool search

The ToolCatalog searches tool names, descriptions, and argument names
to select which MCP servers to spawn. Falls back to all servers if no
matches. Keyword router preserved behind config flag."
```

---

## Task 14: Extract Action IDs from Tool Results

**Why:** Current implementation scans assistant text with regex `/"actionId":\s*"([^"]+)"/g` which silently fails if the model formats JSON differently.

**Files:**
- Modify: `gateway/src/agent/agent-runner.ts`
- Modify: `gateway/src/agent/__tests__/block-extractor.test.ts` (or create new test)

**Step 1: Write the failing test**

```typescript
// Test that action IDs are extracted from tool result blocks, not text
describe('extractActionIdsFromToolResults', () => {
  it('should extract actionId from tool result content', () => {
    const toolResults = [
      {
        type: 'tool_result',
        content: JSON.stringify({
          message: 'Action proposed successfully.',
          actionId: 'action-123',
          status: 'PENDING',
        }),
      },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toContain('action-123');
  });

  it('should handle multiple tool results', () => {
    const toolResults = [
      { type: 'tool_result', content: JSON.stringify({ actionId: 'a1' }) },
      { type: 'tool_result', content: JSON.stringify({ actionId: 'a2' }) },
      { type: 'tool_result', content: JSON.stringify({ noActionId: true }) },
    ];
    const ids = extractActionIdsFromToolResults(toolResults);
    expect(ids).toEqual(['a1', 'a2']);
  });
});
```

**Step 2: Run test — verify FAIL**

**Step 3: Implement extraction from tool results**

In the agent runner's event processing loop, extract action IDs from `tool_use_summary` or `tool_result` events instead of (or in addition to) scanning assistant text:

```typescript
// When processing tool results from the SDK event stream:
function extractActionIdsFromToolResults(toolResults: any[]): string[] {
  const actionIds: string[] = [];
  for (const result of toolResults) {
    try {
      const content = typeof result.content === 'string'
        ? JSON.parse(result.content)
        : result.content;
      if (content?.actionId) {
        actionIds.push(content.actionId);
      }
    } catch {
      // Not JSON, skip
    }
  }
  return actionIds;
}
```

Keep the existing regex as a fallback but prefer structured extraction.

**Step 4: Run test — verify PASS**

**Step 5: Run all gateway tests**

Run: `cd gateway && npx vitest run`

**Step 6: Commit**

```bash
git add gateway/src/agent/
git commit -m "fix: extract action IDs from tool results instead of regex on text

Structured extraction from tool result JSON is more reliable than
regex matching on assistant prose. Regex kept as fallback."
```

---

## Task 15: Clean Up Dead Code in SkillRegistry

**Why:** The `ActiveSkill` tracking, `active` map, and `reapIdle()` loop are wired up but never populated. Process lifecycle is managed by the Claude Agent SDK.

**Files:**
- Modify: `gateway/src/agent/skill-registry.ts`
- Modify: `gateway/src/agent/__tests__/skill-registry.test.ts`

**Step 1: Remove dead infrastructure**

Remove:
- `ActiveSkill` interface
- `active: Map<string, ActiveSkill>`
- `reapIdle()` method
- The `setInterval` that calls `reapIdle()`
- Any references to process management

Keep:
- `definitions` map
- `loadDefinitions()` with hot-reload
- `findByTags()`
- `getMcpServers()`
- `listAll()`
- `getToolSets()` (new from Task 12)

**Step 2: Update tests**

Remove any tests for `reapIdle` behavior.

**Step 3: Run tests**

Run: `cd gateway && npx vitest run src/agent/__tests__/skill-registry.test.ts`

**Step 4: Commit**

```bash
git add gateway/src/agent/skill-registry.ts gateway/src/agent/__tests__/skill-registry.test.ts
git commit -m "chore: remove dead ActiveSkill tracking from SkillRegistry

Process lifecycle is managed by the Claude Agent SDK.
The reapIdle loop and active map were never populated."
```

---

## Task 16: Route Scheduler Runs Through LaneQueue

**Why:** The scheduler currently calls `agentRunner.execute()` directly, bypassing the per-user LaneQueue. This means scheduled runs and user-initiated runs have no mutual exclusion — concurrent runs for the same organisation could produce interleaved DB writes. Since we're already touching `gateway.ts` and `agent-runner.ts` in Tasks 13-14, the marginal effort is low.

**Files:**
- Modify: `gateway/src/scheduler/scheduler.service.ts`
- Modify: `gateway/src/gateway.ts` — expose queue to scheduler
- Create: `gateway/src/scheduler/__tests__/scheduler-queue.test.ts`

**Step 1: Write the failing test**

```typescript
// gateway/src/scheduler/__tests__/scheduler-queue.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Scheduler queue integration', () => {
  it('should route scheduled runs through LaneQueue', async () => {
    const mockEnqueue = vi.fn();
    // Verify that processDueSchedules calls queue.enqueue()
    // instead of agentRunner.execute() directly
    // ...
  });

  it('should use a system-level lane for scheduled runs', async () => {
    // Scheduled runs should use userId = 'system-scheduler' or similar
    // to avoid contending with real user lanes
    // ...
  });
});
```

**Step 2: Run test — verify FAIL**

**Step 3: Modify scheduler to use queue**

```typescript
// In scheduler.service.ts, change processDueSchedules():
// Before:
//   await this.agentRunner.execute(msg, abortController.signal, emit, task.id);
// After:
//   const job: Job = {
//     id: task.id,
//     userId: `scheduler-${schedule.id}`,  // Unique lane per schedule
//     execute: async (signal) => {
//       await this.agentRunner.execute(msg, signal, emit, task.id);
//     },
//   };
//   this.queue.enqueue(job);
```

**Step 4: Pass queue reference to scheduler**

In `gateway.ts`, pass `this.queue` to the scheduler constructor or via a setter.

**Step 5: Run tests**

Run: `cd gateway && npx vitest run`

**Step 6: Commit**

```bash
git add gateway/src/scheduler/ gateway/src/gateway.ts
git commit -m "fix: route scheduler runs through LaneQueue

Scheduled runs now go through the same per-user queue as interactive
runs, preventing concurrent execution for the same schedule. Each
schedule gets its own lane keyed by schedule ID."
```

---

## Execution Order & Dependencies

```
Task 1  (type safety)              — independent, do first (quick win)
Task 2  (refactor executor files)  — independent, do before Tasks 3-10
Task 3  (risks executors)          — depends on Task 2 (uses per-domain file)
Task 4  (incidents executors)      — depends on Task 2
Task 5  (policies executors)       — depends on Task 2
Task 6  (evidence executors)       — depends on Task 2
Task 7  (audits executors)         — depends on Task 2
Task 8  (ITSM executors)           — depends on Task 2
Task 9  (organisation executors)   — depends on Task 2
Task 10 (controls remaining)       — depends on Task 2
Tasks 3-10 are fully parallel — each creates its own file

Task 11 (tool catalog + BM25)      — independent
Task 12 (skills.yaml metadata)     — depends on Task 11
Task 13 (integrate catalog)        — depends on Tasks 11, 12
Task 14 (action ID extraction)     — independent
Task 15 (dead code cleanup)        — independent, but do after Task 12
Task 16 (scheduler → queue)        — independent, pairs well with Task 13
```

**Suggested execution batches:**
1. **Batch 1** (parallel): Task 1, Task 2, Task 11, Task 14
2. **Batch 2** (parallel): Tasks 3-10 (all executor domains — now safe to parallelize since each is a separate file)
3. **Batch 3** (sequential): Task 12 → Task 13, and in parallel: Task 15, Task 16

---

## Verification Checklist

After all tasks are complete:

- [ ] `cd packages/mcp-shared && npx tsc --noEmit` — no errors
- [ ] `cd gateway && npx vitest run` — all tests pass
- [ ] `cd apps/server && npx jest` — all tests pass
- [ ] Every `McpActionType` enum value has a registered executor
- [ ] `createPendingAction` accepts `McpActionType` enum, not string
- [ ] Executor service uses per-domain files (no monolithic registration)
- [ ] Keyword router replaced by BM25 catalog (or behind config flag)
- [ ] Action IDs extracted from tool results, not regex on text
- [ ] No dead `ActiveSkill` / `reapIdle` code in SkillRegistry
- [ ] Scheduler runs route through LaneQueue

---

## Future Considerations (Phase 2)

1. **Programmatic Tool Calling:** MCP tools cannot currently be called programmatically. When Anthropic adds MCP support, or sooner via inline wrapper tools over the NestJS REST API for read-only queries, this would dramatically reduce token consumption and latency for multi-domain aggregation queries (e.g., board-level risk summaries, council deliberations).

2. **Fine-grained Tool Streaming:** Check if Agent SDK v0.2.42 supports `eager_input_streaming: true`. If yes, enable on all tool definitions for free latency improvement (~15s to ~3s to first chunk).

3. **Server-side Tool Search:** If the gateway migrates from stdio MCP servers to remote HTTP+SSE MCP servers (`type: "url"`), the client-side BM25 catalog can be replaced with Anthropic's server-side `tool_search_tool_bm25_20251119` for zero-maintenance tool discovery.
