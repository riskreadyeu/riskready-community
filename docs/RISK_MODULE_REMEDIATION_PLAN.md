# Risk Module Remediation Plan

**Goal:** Bring the Risk module to 100% completion per `MODULE_COMPLETION_CHECKLIST.md`.

**Current Score:** 7/12 sections PASS, 1 PARTIAL, 4 FAIL

---

## Phase 1: Schema & Backend Foundations

_Fix structural gaps before building UI or MCP on top._

### 1A. Prisma Schema Fixes

**Missing audit fields** (add `updatedAt`, `updatedById` where absent):

| Model | Missing Fields |
|-------|---------------|
| `KRIHistory` | `updatedAt`, `updatedById`, `createdById` |
| `TreatmentAction` | `updatedById` |

**Missing `organisationId`** (denormalize for efficient multi-tenant filtering):

| Model | Current Path to Org |
|-------|-------------------|
| `RiskCalculationHistory` | scenarioId -> scenario.riskId -> risk.organisationId |
| `ScenarioStateHistory` | scenarioId -> scenario.riskId -> risk.organisationId |
| `RiskEventLog` | riskId -> risk.organisationId |
| `ToleranceEvaluation` | riskId -> risk.organisationId |
| `TreatmentDependency` | sourceTreatmentId -> treatmentPlan.organisationId |
| `KRIHistory` | kriId -> kri.riskId -> risk.organisationId |

**Missing indexes** (add composite indexes for common queries):

```prisma
// RiskEventLog
@@index([riskId, createdAt])
@@index([actorId])

// ToleranceEvaluation
@@index([rtsId])
@@index([riskId, evaluatedAt])

// ScenarioStateHistory
@@index([scenarioId, createdAt])

// KRIHistory
@@index([kriId, measuredAt])
```

**Files:** `apps/server/prisma/schema/controls.prisma`, `apps/server/prisma/schema/risks.prisma`

---

### 1B. Missing Service: KeyRiskIndicator

Create `apps/server/src/risks/services/kri.service.ts`:

- `findAll(params)` -- paginated list with risk filter
- `findOne(id)` -- single KRI with history and risk relation
- `create(data, userId)` -- create with audit fields
- `update(id, data, userId)` -- update metadata
- `delete(id)` -- delete KRI and history
- `recordMeasurement(kriId, data, userId)` -- append to KRIHistory
- `getHistory(kriId, limit?)` -- measurement history
- `getStats(organisationId?)` -- RAG distribution, trend breakdown

---

### 1C. Missing Service Method: Risk.delete()

Add `delete(id)` to `apps/server/src/risks/services/risk.service.ts`.

---

## Phase 2: DTOs (Section 2 Fix)

_Wire existing DTOs and create missing ones. Every POST/PATCH/PUT endpoint gets a formal DTO._

### 2A. Wire Existing DTOs (6 endpoints)

These DTOs exist in `apps/server/src/risks/dto/risk.dto.ts` but controllers use inline types instead:

| Endpoint | Existing DTO | Controller File |
|----------|-------------|-----------------|
| `POST /risks` | `CreateRiskDto` | `risk.controller.ts` |
| `PUT /risks/:id` | `UpdateRiskDto` | `risk.controller.ts` |
| `POST /risks/treatment-plans` | `CreateTreatmentPlanDto` | `treatment-plan.controller.ts` |
| `PUT /risks/treatment-plans/:id` | `UpdateTreatmentPlanDto` | `treatment-plan.controller.ts` |
| `POST /risk-scenarios` | `CreateScenarioDto` | `risk-scenario.controller.ts` |
| `PUT /risk-scenarios/:id` | `UpdateScenarioDto` | `risk-scenario.controller.ts` |

**Action:** Replace inline `@Body()` types with the DTO classes. Update DTOs if any fields are missing (e.g., `acceptanceConditions` in `CreateTreatmentPlanDto`).

### 2B. Create Missing DTOs (13 endpoints)

Create new DTO classes in `apps/server/src/risks/dto/`:

**File: `rts.dto.ts`** (new)
- `CreateRTSDto` -- 21 fields from `POST /risks/rts`
- `UpdateRTSDto` -- 18 fields from `PUT /risks/rts/:id`
- `LinkRisksDto` -- `{ riskIds: string[] }` for `PUT /risks/rts/:id/link-risks`
- `UnlinkRisksDto` -- `{ riskIds: string[] }` for `PUT /risks/rts/:id/unlink-risks`

**File: `risk-scenario.dto.ts`** (new)
- `UpdateFactorScoresDto` -- 6 fields (F1-F6) for `PUT /risk-scenarios/:id/factor-scores`
- `UpdateResidualFactorScoresDto` -- nested scores + overrides for `PUT /risk-scenarios/:id/residual-factor-scores`
- `SaveImpactAssessmentsDto` -- array of assessments for `POST /risk-scenarios/:id/impact-assessments`
- `LinkControlDto` -- 4 fields for `POST /risk-scenarios/:id/controls`
- `UpdateControlLinkDto` -- 3 fields for `PUT /risk-scenarios/:id/controls/:controlId`

**File: `treatment-plan.dto.ts`** (new or extend existing)
- `UpdateProgressDto` -- `{ progressPercentage, progressNotes }` for `PUT /risks/treatment-plans/:id/progress`
- `UpdateTreatmentActionDto` -- 8 fields for `PUT /risks/treatment-plans/actions/:actionId`

**File: `risk.dto.ts`** (extend existing)
- `DisableRiskDto` -- `{ reason: string }` for `POST /risks/:id/disable`

### 2C. Move Inline DTOs from Controllers

Move from `risk-scoring.controller.ts` to `apps/server/src/risks/dto/risk-scoring.dto.ts`:
- `CalculateScoreDto`
- `CategoryAssessmentDto`
- `CategoryWeightDto`
- `CalculateWeightedImpactDto`

---

## Phase 3: No Modals (Section 11 Fix)

_Replace 13 CRUD dialogs with full pages. Keep only ConfirmationDialog._

### Dialogs to Replace

| Dialog | Operation | Replacement Page |
|--------|-----------|-----------------|
| `RiskCreateDialog.tsx` | Create Risk | `RiskCreatePage.tsx` at `/risks/register/new` |
| `RiskEditDialog.tsx` | Edit Risk | Inline editing on `RiskDetailPage` |
| `dialogs/RiskEditDialog.tsx` | Edit Risk (v2) | Same as above (delete duplicate) |
| `RiskScenarioDialog.tsx` | Create/Edit Scenario | `ScenarioCreatePage.tsx` at `/risks/:riskId/scenarios/new` |
| `dialogs/ScenarioEditDialog.tsx` | Edit Scenario | Inline editing on `ScenarioDetailPage` |
| `dialogs/AssessmentDialog.tsx` | Assess Risk | Inline assessment on `ScenarioDetailPage` |
| `dialogs/TransitionDialog.tsx` | Status Transition | Inline workflow actions on `ScenarioDetailPage` |
| `KRIDialog.tsx` | Create/Edit KRI | `KRICreatePage.tsx` at `/risks/:riskId/kris/new` + inline edit on KRI detail |
| `KRIValueDialog.tsx` | Record KRI Value | Inline form on KRI detail page |
| `RTSDialog.tsx` | Create/Edit RTS | `RTSCreatePage.tsx` at `/risks/tolerance/new` + inline edit on detail |
| `TreatmentPlanDialog.tsx` | Create/Edit Plan | `TreatmentPlanCreatePage.tsx` at `/risks/treatments/new` + inline edit |
| `TreatmentActionDialog.tsx` | Create/Edit Action | `TreatmentActionCreatePage.tsx` at `/risks/treatments/:planId/actions/new` + inline edit |
| `ImpactAssessmentDialog.tsx` | Multi-category Impact | Inline form on `ScenarioDetailPage` assessment tab |

### New Pages to Create

| Page File | Route | Purpose |
|-----------|-------|---------|
| `RiskCreatePage.tsx` | `/risks/register/new` | Full-page risk creation form |
| `ScenarioCreatePage.tsx` | `/risks/:riskId/scenarios/new` | Full-page scenario creation form |
| `KRIListPage.tsx` | `/risks/:riskId/kris` | KRI list for a risk |
| `KRIDetailPage.tsx` | `/risks/kris/:id` | KRI detail with measurement history |
| `KRICreatePage.tsx` | `/risks/:riskId/kris/new` | Full-page KRI creation form |
| `RTSCreatePage.tsx` | `/risks/tolerance/new` | Full-page RTS creation form |
| `TreatmentPlanCreatePage.tsx` | `/risks/treatments/new` | Full-page treatment plan creation form |
| `TreatmentActionCreatePage.tsx` | `/risks/treatments/:planId/actions/new` | Full-page action creation form |

**Location:** `apps/web/src/pages/risks/`

### Dialogs to Keep

| Dialog | Reason |
|--------|--------|
| `ConfirmationDialog.tsx` | Acceptable -- generic confirmation, not CRUD |

### Dialogs to Delete After Replacement

All 13 CRUD dialog files listed above. Delete only after the replacement pages are fully functional.

---

## Phase 4: Field Coverage (Section 9 Fix)

_Expose all Prisma fields in the frontend UI._

### 4A. Models Completely Missing from Frontend

These need TypeScript interfaces in `risks-api.ts` and UI components:

| Model | Fields | Priority |
|-------|--------|----------|
| `TreatmentPlanHistory` | action, fieldName, oldValue, newValue, description, userId | High -- audit trail |
| `TreatmentDependency` | sourceTreatmentId, targetTreatmentId, dependencyType, description, isMandatory | High -- dependency graph |
| `ScenarioStateHistory` | fromStatus, toStatus, transitionCode, triggeredBy, reason, actorId | High -- workflow audit |
| `ToleranceEvaluation` | rtsId, status, riskScore, toleranceThreshold, gap, recommendedActions | Medium -- compliance dashboard |

### 4B. Missing Fields on Existing Models

**Risk model** -- add to frontend interface and detail page:
- `derivedStatus`, `derivedStatusUpdatedAt`
- `maxScenarioScore`, `avgScenarioScore`
- `scenarioCount`, `scenariosExceedingTolerance`

**RiskScenario model** -- add to frontend:
- Residual calculation: `calculatedResidualLikelihood`, `calculatedResidualImpact`, `calculatedResidualScore`
- Override audit: `residualOverriddenById`, `residualOverriddenAt`, `residualPreviousScore`
- Weighted impact: `weightedImpact`, `residualWeightedImpact`
- Calculation metadata: `calculationTrigger`, `calculationTrace`
- FAIR simulation stats: `aleMedian`, `aleP90`, `aleP95`, `aleP99`, `lefMean`, `probabilityOfLoss`, `lastSimulationAt`, `simulationIterations`

**RTS model** -- add to frontend:
- Approval fields: `approvedDate`, `approvedById`, `effectiveDate`, `reviewDate`

**TreatmentPlan model** -- add to frontend:
- `proposedDate`
- `history` relation (TreatmentPlanHistory[])
- `sourceDependencies`, `targetDependencies` relations

**RiskScenarioAsset model** -- add missing factor flags:
- `impactLevel`, `feedsF3`, `feedsF5`, `feedsI1`, `feedsI2`, `notes`

### 4C. Frontend UI Locations

| Missing Data | Where to Display |
|-------------|-----------------|
| Derived risk status | Risk detail page header badge |
| Scenario score aggregates | Risk detail page overview tab |
| Residual calculation audit | Scenario detail assessment tab |
| FAIR simulation percentiles | Scenario detail FAIR tab (new section) |
| Treatment dependencies | Treatment plan detail (new "Dependencies" tab) |
| Treatment history | Treatment plan detail (new "History" tab) |
| State history | Scenario detail (new "History" tab) |
| Tolerance evaluations | RTS detail page + Risk dashboard |
| RTS approval workflow | RTS detail page header + sidebar |
| Asset factor contributions | Scenario detail controls/assets tab |

---

## Phase 5: MCP Server (Section 10 Fix)

_Build `apps/mcp-server-risks/` from scratch, following the controls MCP pattern._

### 5A. Project Structure

```
apps/mcp-server-risks/
  src/
    index.ts              -- Server setup with instructions
    prisma.ts             -- Prisma client instance
    tools/
      risk-tools.ts       -- Risk CRUD read tools
      scenario-tools.ts   -- RiskScenario read tools
      kri-tools.ts        -- KRI read tools
      rts-tools.ts        -- RTS read tools
      treatment-tools.ts  -- TreatmentPlan/Action read tools
      analysis-tools.ts   -- Gap analysis, tolerance breaches, dashboards
      mutation-tools.ts   -- All proposal-based write tools
    resources/
      index.ts            -- Reference docs + data-integrity resource
    prompts/
      index.ts            -- Guided workflow prompts
  package.json
  tsconfig.json
```

### 5B. Read-Only Tools (per entity)

**risk-tools.ts:**
- `list_risks` -- paginated with status, category, riskLevel filters
- `get_risk` -- single risk with scenarios, KRIs, treatment plans
- `search_risks` -- text search by name/riskId
- `get_risk_stats` -- counts by status, category, risk level, treatment status

**scenario-tools.ts:**
- `list_scenarios` -- paginated with risk filter, status filter
- `get_scenario` -- single scenario with assessments, controls, state history
- `get_scenario_scores` -- factor scores, inherent/residual with calculation trace

**kri-tools.ts:**
- `list_kris` -- paginated with risk filter, status filter
- `get_kri` -- single KRI with measurement history
- `get_kri_dashboard` -- RAG distribution, trend breakdown

**rts-tools.ts:**
- `list_rts` -- paginated with status filter
- `get_rts` -- single RTS with linked risks, evaluations
- `get_rts_stats` -- counts by status, approval rates

**treatment-tools.ts:**
- `list_treatment_plans` -- paginated with status, type filters
- `get_treatment_plan` -- single plan with actions, dependencies, history
- `get_treatment_stats` -- counts by status, type, progress distribution

### 5C. Analysis Tools

- `get_risk_heatmap` -- likelihood x impact matrix
- `get_tolerance_breaches` -- scenarios exceeding their RTS thresholds
- `get_treatment_progress` -- overall treatment completion rates
- `get_kri_alerts` -- KRIs in RED or declining trend
- `get_risk_dashboard` -- aggregate risk posture summary
- `get_overdue_treatments` -- treatment plans past due date

### 5D. Mutation Tools (proposal pattern)

- `propose_create_risk`
- `propose_update_risk`
- `propose_create_scenario`
- `propose_update_scenario`
- `propose_transition_scenario` -- status transition
- `propose_create_kri`
- `propose_record_kri_value`
- `propose_create_rts`
- `propose_update_rts`
- `propose_approve_rts`
- `propose_create_treatment_plan`
- `propose_update_treatment_plan`
- `propose_create_treatment_action`
- `propose_assess_scenario` -- record inherent/residual assessment

### 5E. Resources

- `risks://frameworks/iso31000` -- ISO 31000 risk management structure
- `risks://scoring/methodology` -- Factor scoring, FAIR model, heatmap methodology
- `risks://tolerance/guidance` -- Risk appetite, tolerance statements, breach handling
- `risks://treatment/workflow` -- Treatment plan lifecycle, action tracking
- `risks://data-integrity` -- Anti-hallucination Layer 3 guard

### 5F. Prompts

- `risk-assessment-workflow` -- Guide through full risk assessment
- `tolerance-review` -- Review all tolerance breaches and recommend actions
- `treatment-effectiveness` -- Analyze treatment plan progress and gaps
- `kri-trend-analysis` -- Analyze KRI trends and predict breaches

### 5G. Anti-Hallucination Guards

**Layer 1:** `instructions` field in `ServerOptions` (same 6 rules as controls MCP)
**Layer 2:** Every list/search tool returns `note` field when count === 0
**Layer 3:** `risks://data-integrity` resource

---

## Phase 6: Routes & Navigation

_Register all new pages and update sidebar._

### New Routes in `App.tsx`

```
/risks/register/new              -> RiskCreatePage
/risks/:riskId/scenarios/new     -> ScenarioCreatePage
/risks/:riskId/kris              -> KRIListPage
/risks/:riskId/kris/new          -> KRICreatePage
/risks/kris/:id                  -> KRIDetailPage
/risks/tolerance/new             -> RTSCreatePage
/risks/treatments/new            -> TreatmentPlanCreatePage
/risks/treatments/:planId/actions/new -> TreatmentActionCreatePage
```

### Sidebar Updates

Add to risks-sidebar.tsx Management group:
- Key Risk Indicators (link to dashboard or KRI list on risk detail)

---

## Execution Order

| Step | Phase | Effort | Depends On |
|------|-------|--------|-----------|
| 1 | 1A: Schema fixes | Small | -- |
| 2 | 1B: KRI service | Medium | 1A |
| 3 | 1C: Risk.delete() | Small | -- |
| 4 | 2A: Wire existing DTOs | Small | -- |
| 5 | 2B: Create missing DTOs | Medium | -- |
| 6 | 2C: Move inline DTOs | Small | -- |
| 7 | 3: Create pages, delete dialogs | Large | 1B, 2B |
| 8 | 4A: Missing model interfaces | Medium | 1A |
| 9 | 4B: Missing field exposure | Large | 8 |
| 10 | 4C: UI display locations | Large | 7, 9 |
| 11 | 5: MCP server (full build) | Large | 1A, 1B |
| 12 | 6: Routes & navigation | Small | 7 |

---

## Verification Checklist

After all phases complete:

- [ ] `cd apps/server && npx tsc --noEmit` -- zero errors
- [ ] `cd apps/web && npx tsc --noEmit` -- zero errors
- [ ] `cd apps/mcp-server-risks && npx tsc --noEmit` -- zero errors
- [ ] Every Prisma model has a service with full CRUD
- [ ] Every service method is exposed via a controller endpoint
- [ ] Every endpoint uses a formal DTO class for request body validation
- [ ] Every endpoint has a typed API function in the frontend
- [ ] Every API function is used by a page or component
- [ ] Every user-facing database field is visible in the frontend
- [ ] Every entity has MCP read tools; every write has a proposal tool
- [ ] All three anti-hallucination layers are in place
- [ ] All CRUD uses full pages (zero CRUD dialogs remain)
- [ ] All pages are reachable via URL and sidebar navigation
