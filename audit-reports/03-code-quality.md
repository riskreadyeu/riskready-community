# Code Quality Audit Report

**Auditor:** Trail of Bits Standards (automated deep scan)
**Date:** 2026-02-22
**Scope:** `apps/server/src`, `apps/web/src`, `apps/mcp-server-*/src`, `gateway/src`
**Overall Grade: C+**

---

## Executive Summary

| Category | Count | Severity |
|---|---|---|
| Oversized functions (>100 lines) | 18 | High |
| `any` type usage (explicit) | 151+ | High |
| `as any` type assertions | 170+ | High |
| `const where: any = {}` pattern | 35 | Medium |
| `console.log` in production code | 46 (non-seed) | Medium |
| Lines >120 characters | 536+ | Low |
| Commented-out code | 3 | Low |
| Empty catch blocks | 0 | -- |
| Swallowed exceptions (log-only catch) | 204 (web) | Medium |
| TODO/FIXME/HACK markers | 46 | Low |
| Unused imports | 1 confirmed | Low |
| Code duplication (identified) | 2 patterns | Medium |

**Key Strengths:**
- Zero empty catch blocks across the entire codebase.
- Only 1 `eslint-disable` comment in the entire project.
- Zero `@ts-ignore` directives.
- Well-structured service layer with clear separation of concerns.
- Good use of Prisma transactions for atomic operations.
- Thorough JSDoc documentation on risk-scoring utilities.

**Key Weaknesses:**
- Multiple React components exceed 500 lines (some exceed 1400 lines).
- Pervasive `any` type usage in server controllers defeats TypeScript's safety guarantees.
- Systematic pattern of swallowed exceptions in frontend catch blocks.
- Debug `console.log` statements scattered across production UI code.

---

## 1. Function/Component Length (>100 Lines)

**Severity: High**

The following functions and components significantly exceed the 100-line limit. React components are the worst offenders, with several monolithic page components containing all state management, data fetching, rendering, and event handling in a single function.

### Critical (>500 lines)

| File | Function | Lines | Span |
|---|---|---|---|
| `apps/web/src/pages/itsm/AssetFormPage.tsx` | `AssetFormPage()` | **1431** | 687-2118 |
| `apps/web/src/pages/policies/PolicyDocumentDetailPage.tsx` | `PolicyDocumentDetailPage()` | **1376** | 119-1495 |
| `apps/web/src/pages/evidence/EvidenceDetailPage.tsx` | `EvidenceDetailPage()` | **1019** | 82-1101 |
| `apps/web/src/pages/itsm/ChangeFormPage.tsx` | `ChangeFormPage()` | **832** | 72-904 |
| `apps/web/src/pages/organisation/organisation-profiles/OrganisationProfileDetailPage.tsx` | `OrganisationProfileDetailPage()` | **762** | 106-868 |
| `apps/web/src/components/risks/ScenarioWorkflowPanel.tsx` | `ScenarioWorkflowPanel()` | **749** | 502-1251 |
| `apps/web/src/pages/audits/NonconformityDetailPage.tsx` | `NonconformityDetailPage()` | **654** | 79-733 |
| `apps/web/src/pages/organisation/departments/DepartmentDetailPage.tsx` | `DepartmentDetailPage()` | **674** | 57-731 |
| `apps/web/src/pages/incidents/IncidentDetailPage.tsx` | `IncidentDetailPage()` | **591** | 90-681 |

### High (100-500 lines)

| File | Function | Lines | Span |
|---|---|---|---|
| `apps/mcp-server-controls/src/tools/mutation-tools.ts` | `registerAssessmentMutations()` | **430** | 50-480 |
| `apps/mcp-server-controls/src/tools/mutation-tools.ts` | `registerSoaMutations()` | **254** | 481-735 |
| `apps/mcp-server-controls/src/tools/mutation-tools.ts` | `registerTestMutations()` | **212** | 831-1043 |
| `apps/mcp-server-controls/src/tools/mutation-tools.ts` | `registerControlMutations()` | **193** | 1044-1237 |
| `apps/server/src/risks/services/risk-calculation.service.ts` | `calculateScenario()` | **177** | 126-303 |
| `apps/server/src/itsm/services/asset.service.ts` | `calculateRiskScore()` | **161** | 669-830 |
| `apps/server/src/itsm/services/asset.service.ts` | `getDataQuality()` | **155** | 479-634 |
| `apps/server/src/risks/services/risk-scenario.service.ts` | `updateLikelihoodFactorScores()` | **150** | 970-1120 |
| `apps/server/src/risks/services/risk-scenario.service.ts` | `getResidualFactorScores()` | **126** | 1126-1252 |
| `apps/web/src/lib/policy-markdown-parser.ts` | `parsePolicyMarkdown()` | **102** | 479-581 |
| `apps/server/src/policies/services/approval-workflow.service.ts` | `processStep()` | **140** | 171-311 |

**Recommendation:** Extract sub-components from monolithic page components. The `AssetFormPage` (1431 lines) should be decomposed into at least 5-6 focused components (form sections, validation logic, type selection, etc.). Server-side functions like `calculateRiskScore` should be decomposed into category-specific calculation helpers.

---

## 2. Cyclomatic Complexity / Deep Nesting

**Severity: Medium**

Deep nesting (3+ levels) was found primarily in React components within inline JSX event handlers and in the `asset-security-tab.tsx` component which contains complex inline calculations.

### Findings

**`apps/web/src/components/itsm/tabs/asset/asset-security-tab.tsx:108-118`** -- 4 levels of nesting in inline JSX calculation:
```typescript
if (total > 0 && priv > 0) {
  const ratio = priv / total;
  if (ratio > 0.5) score += 40;
  else if (ratio > 0.3) score += 30;
  else if (ratio > 0.2) score += 20;
  else if (ratio > 0.1) score += 10;
}
if (priv > 10) score += 20;
else if (priv > 5) score += 10;
if (auth > 0) score += Math.min(40, Math.log10(auth + 1) * 20);
```
This logic is duplicated at lines 210-230 in the same file.

**`apps/server/src/policies/services/approval-workflow.service.ts:203-308`** -- Deeply nested transaction with if/else if/else branching inside a `$transaction` callback:
```typescript
await this.prisma.$transaction(async (tx) => {
  // ...
  if (isRejection) {
    // 40 lines of rejection handling
  } else if (isApproval) {
    if (nextStep) {
      // advance logic
    } else {
      // completion logic (20 lines)
    }
  } else if (decision === 'REQUEST_CHANGES') {
    // ...
  }
});
```

**`apps/server/src/policies/services/policy-scheduler.service.ts:232-243`** -- Triple nesting: for-loop > try > if:
```
for (...) {
  try {
    if (!existingReminder) { ... }
  }
}
```

**`apps/server/src/itsm/services/asset.service.ts:669-830`** -- `calculateRiskScore()` has 4 calculation categories, each with nested conditionals. Well-commented but should be extracted.

**`apps/web/src/lib/policy-markdown-parser.ts:497-577`** -- Large switch statement with 8 cases, several containing nested finds and conditionals.

**Recommendation:** Extract inline calculations to named utility functions. Break down the approval-workflow transaction into separate handler methods per decision type.

---

## 3. Parameter Counts

**Severity: Medium**

### Functions with 6+ positional parameters

**`apps/server/src/evidence/services/evidence-link.service.ts:28-35`** -- 6 parameters:
```typescript
async linkEvidence(
  evidenceId: string,
  entityType: LinkEntityType,
  entityId: string,
  linkType?: string,
  notes?: string,
  createdById?: string,
)
```

**`apps/mcp-server-controls/src/tools/mutation-tools.ts:11-19`** -- `createPendingAction` takes an object with 7 fields but uses `any` for the payload:
```typescript
async function createPendingAction(params: {
  actionType: string;
  summary: string;
  reason?: string;
  payload: any;          // <-- should be typed
  mcpSessionId?: string;
  mcpToolName: string;
  organisationId?: string;
})
```

**Note:** The codebase generally uses object parameters (destructured options) rather than positional parameters, which is good practice. The `linkEvidence` function is the primary offender, and it is called with `undefined` placeholders at line 363:
```typescript
this.linkEvidence(evidenceId, entityType, entityId, linkType, undefined, createdById)
```
The `undefined` placeholder is a classic code smell indicating the function should accept an options object.

**Recommendation:** Refactor `linkEvidence` to accept an options object. The `undefined` placeholder at the call site confirms this.

---

## 4. Error Handling

**Severity: High (type safety) / Medium (exception handling)**

### 4a. Swallowed Exceptions in Frontend (204 occurrences across 117 files)

The dominant pattern in the web frontend is `console.error` + `toast.error` without rethrowing. This is *acceptable* for UI error boundaries but means errors are invisible to monitoring systems.

**Representative examples:**

`apps/web/src/pages/itsm/AssetDetailPage.tsx:98-102`:
```typescript
} catch (err) {
  console.error('Failed to load asset:', err);
  toast.error('Failed to load asset details');
} finally {
  setLoading(false);
}
```

`apps/web/src/pages/audits/NonconformityDetailPage.tsx` -- 6 occurrences of catch-log-toast.

`apps/web/src/components/risks/RiskTreatmentPanel.tsx` -- 6 occurrences of catch-log-toast.

**Assessment:** While not rethrowing is intentional in React UI code (errors should not crash the app), there is no centralized error reporting service. All errors go only to `console.error` which is lost in production.

### 4b. `console.error` Without Context in Server Code

`apps/server/src/auth/auth.service.ts:30`:
```typescript
console.error('Error ensuring bootstrap admin (non-blocking):', error);
```
Uses `console.error` instead of the NestJS `Logger` service. The server has a Logger available but this particular path bypasses it.

### 4c. Catch-Log-Swallow in Seed Scripts

`apps/server/prisma/seeds/seed-policies.ts:349-351`:
```typescript
} catch (error) {
  console.error(`  Error creating ${doc.documentId}:`, error);
}
```
Error is logged but not re-thrown, meaning seed failures are silently swallowed and the seed continues with incomplete data.

### 4d. No Global Error Boundary

No `ErrorBoundary` component was found in the React app. Unhandled rendering errors will crash the entire UI.

**Recommendation:**
1. Add a centralized error reporting service (e.g., Sentry) in both frontend and backend.
2. Add a React `ErrorBoundary` component at the app root and around route boundaries.
3. Replace `console.error` in server code with the NestJS `Logger`.

---

## 5. Type Safety (`any` Usage)

**Severity: High**

### 5a. `const where: any = {}` Pattern (35 occurrences across 34 files)

Nearly every controller in `apps/server/src` uses this anti-pattern for building Prisma query filters:

```typescript
// Found in 34 separate controller files
const where: any = {};
if (query.status) where.status = query.status;
if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
```

**Files affected (sample):**
- `apps/server/src/itsm/controllers/asset.controller.ts:36`
- `apps/server/src/itsm/controllers/change.controller.ts:33`
- `apps/server/src/controls/controllers/control.controller.ts:28`
- `apps/server/src/risks/controllers/risk.controller.ts:39`
- `apps/server/src/organisation/controllers/department.controller.ts:16`
- `apps/server/src/evidence/services/evidence.service.ts:31`
- (29 more files)

This defeats Prisma's type-safe query builder entirely.

### 5b. `as any` Type Assertions (170+ occurrences across 74 files)

**Worst offender -- `apps/web/src/pages/evidence/EvidenceDetailPage.tsx` (16 occurrences):**
```typescript
{((evidence as any).chainOfCustodyNotes ||
  (evidence as any).isForensicallySound != null ||
  (evidence as any).hashSha256 ||
  (evidence as any).hashMd5 ||
  (evidence as any).collectionMethod ||
  (evidence as any).sourceSystem ||
  (evidence as any).sourceReference) && (
```
This indicates the `Evidence` type interface is missing fields that exist in the API response.

**Other notable `as any` hotspots:**
- `apps/web/src/components/itsm/tabs/change/change-overview-tab.tsx` -- 10 occurrences
- `apps/web/src/components/ui/chart.tsx` -- 8 occurrences
- `apps/web/src/pages/incidents/IncidentFormPage.tsx` -- 7 occurrences
- `apps/server/src/incidents/services/incident.service.ts` -- 4 occurrences

### 5c. `updateData: any` in Services

`apps/server/src/incidents/services/incident.service.ts:346`:
```typescript
const updateData: any = { ... };
```

`apps/server/src/risks/services/risk-scenario.service.ts:1007`:
```typescript
const updateData: any = { updatedById };
```

### 5d. `assets: any[]` Parameter

`apps/server/src/itsm/services/asset.service.ts:336`:
```typescript
async importAssets(assets: any[]): Promise<{...}>
```
This accepts completely untyped data. Should use a validated DTO.

**Recommendation:**
1. Replace `const where: any = {}` with `Prisma.XxxWhereInput` types across all 34 controllers. This is a systematic refactor that could be done in one pass.
2. Update the `Evidence` type interface to include chain-of-custody fields.
3. Create a proper `AssetImportDto` for the import function.

---

## 6. Line Length (>120 Characters)

**Severity: Low**

**Total:** 536+ lines exceed 120 characters across 130+ files.

### Worst offenders by file:

| File | Lines >120 chars |
|---|---|
| `apps/web/src/pages/itsm/AssetFormPage.tsx` | 65 |
| `apps/web/src/components/risks/ScenarioWorkflowPanel.tsx` | 29 |
| `apps/web/src/lib/organisation-api.ts` | 24 |
| `apps/web/src/components/itsm/tabs/asset/asset-security-tab.tsx` | 19 |
| `apps/web/src/pages/evidence/EvidenceDetailPage.tsx` | 16 |
| `apps/web/src/pages/organisation/dashboard/OrganisationDashboardPage.tsx` | 13 |
| `apps/web/src/pages/AuditsPage.tsx` | 13 |
| `apps/web/src/lib/incidents-api.ts` | 11 |
| `apps/web/src/pages/evidence/EvidenceDashboardPage.tsx` | 11 |

### Lines exceeding 200 characters (extreme):

**`apps/web/src/pages/evidence/EvidenceDetailPage.tsx:475`** (~280 chars):
```typescript
{((evidence as any).chainOfCustodyNotes || (evidence as any).isForensicallySound != null || ...
```

**`apps/web/src/components/itsm/tabs/asset/asset-security-tab.tsx:244`** (~220 chars):
```typescript
<div className={`p-4 border-2 rounded-lg text-center ${(asset.riskScore ?? 0) >= 70 ? ...
```

**Recommendation:** Configure Prettier with `printWidth: 100` and run auto-format. Most violations are in JSX template code and would be auto-fixed.

---

## 7. Commented-Out Code

**Severity: Low**

Only 3 instances of commented-out code were found, which is excellent.

| File | Line | Code |
|---|---|---|
| `apps/server/prisma/seed/organisation/seed-demo-organisation.ts` | 15 | `// const prisma = new PrismaClient(); // Removed to allow injection` |
| `apps/server/src/config/index.ts` | 35-36 | `// export { AUDITS_CONFIG } from './audits.config';` and `// export { INCIDENTS_CONFIG } from './incidents.config';` |

**Assessment:** The config index commented exports suggest incomplete module extraction. The seed file comment is benign.

---

## 8. `console.log` in Production Code

**Severity: Medium**

### Server Production Code (2 occurrences -- Critical)

**`apps/server/src/main.ts:68`:**
```typescript
console.log(`Server listening on http://localhost:${port}`);
```
Should use the NestJS `Logger` for consistency with the rest of the server.

**`apps/server/src/risks/services/risk-calculation.service.ts:215`:**
```typescript
console.log(`[RiskCalculation] Syncing Score ${likelihood} to Enum ${this.mapScoreToLikelihood(likelihood)}`);
```
Debug logging left in a hot calculation path. This fires on every risk calculation and should be removed or converted to `this.logger.debug()`.

### Web Frontend Production Code (44 occurrences across 26 files)

Many are placeholder implementations using `console.log` as the action handler:

**Placeholder action handlers (worst pattern):**
```typescript
// apps/web/src/pages/organisation/regulators/RegulatorsPage.tsx:166
onClick: (regulator) => console.log("Edit", regulator.id),
// apps/web/src/pages/organisation/regulators/RegulatorsPage.tsx:171
onClick: (regulator) => console.log("Delete", regulator.id),
```

This pattern appears in 14+ organisation pages where edit/delete actions are wired to `console.log` instead of actual functionality. These are effectively non-functional buttons in production.

**Files with placeholder `console.log` actions:**
- `apps/web/src/pages/organisation/regulators/RegulatorsPage.tsx` (2)
- `apps/web/src/pages/organisation/applicable-frameworks/ApplicableFrameworksPage.tsx` (2)
- `apps/web/src/pages/organisation/organisation-profiles/OrganisationProfilesPage.tsx` (2)
- `apps/web/src/pages/organisation/business-processes/BusinessProcessesPage.tsx` (2)
- `apps/web/src/pages/organisation/external-dependencies/ExternalDependenciesPage.tsx` (2)
- `apps/web/src/pages/organisation/key-personnel/KeyPersonnelPage.tsx` (2)
- `apps/web/src/pages/organisation/security-champions/SecurityChampionsPage.tsx` (2)
- `apps/web/src/pages/organisation/security-committees/SecurityCommitteesPage.tsx` (2)
- `apps/web/src/pages/organisation/executive-positions/ExecutivePositionsPage.tsx` (2)
- `apps/web/src/pages/organisation/meeting-decisions/MeetingDecisionsPage.tsx` (2)
- `apps/web/src/pages/organisation/committee-meetings/CommitteeMeetingsPage.tsx` (2)
- `apps/web/src/pages/organisation/meeting-action-items/MeetingActionItemsPage.tsx` (2)

**Debug logging left in:**
- `apps/web/src/components/risks/ScenarioWorkflowPanel.tsx:689` -- `console.log("Rolling back treatment plan creation...")`
- `apps/web/src/components/controls/control-browser/control-browser.tsx:246` -- `console.log('Bulk action:', ...)`
- `apps/web/src/pages/controls/controls-library/ControlsLibraryPage.tsx:191,195,201` -- Export/enable/disable logging
- `apps/web/src/pages/controls/soa/SOAListPage.tsx:90,94,100` -- Export/approve/archive logging
- `apps/web/src/components/controls/command-palette.tsx:113` -- `console.log("Export")`

**Recommendation:**
1. Remove `console.log` from `risk-calculation.service.ts:215` immediately (it fires on every calculation).
2. Replace server `console.log` with NestJS `Logger`.
3. Replace all placeholder `console.log` action handlers with either implemented functionality or `toast.info('Not yet implemented')`.
4. Remove debug `console.log` from component code.

---

## 9. Additional Findings

### 9a. Unused Import

**`apps/server/src/risks/services/risk-scenario.service.ts:2`:**
```typescript
import * as fs from 'fs';
```
The `fs` module is imported but never used anywhere in this file.

### 9b. Code Duplication

**`apps/server/src/risks/services/risk-scenario.service.ts`** -- `statusToEffectiveness` mapping is defined identically at lines 876 and 1172:
```typescript
const statusToEffectiveness: Record<string, number> = {
  IMPLEMENTED: 85,
  PARTIAL: 60,
  NOT_STARTED: 20,
};
```
Should be extracted to a class constant or imported from the shared `risk-scoring.ts` utility.

**`apps/web/src/components/itsm/tabs/asset/asset-security-tab.tsx`** -- The access control risk calculation (privileged user ratio scoring) is duplicated at lines 68-118 and 208-230 within the same component.

### 9c. TODO/FIXME Comments (46 across 21 files)

Notable TODOs that indicate incomplete functionality:

- `apps/server/src/evidence/services/evidence-link.service.ts` -- 15 TODO comments for unsupported entity types
- `apps/web/src/pages/organisation/committee-meetings/CommitteeMeetingDetailPage.tsx:285` -- `// TODO: Implement delete functionality`
- `apps/web/src/components/controls/control-browser/control-browser.tsx` -- 1 TODO
- `apps/web/src/pages/policies/ChangeRequestsPage.tsx` -- 3 TODOs
- `apps/web/src/pages/policies/ExceptionsPage.tsx` -- 3 TODOs

---

## Grading Rationale

| Category | Weight | Score | Notes |
|---|---|---|---|
| Function length | 20% | D | 9 components exceed 500 lines; 18 total exceed 100 lines |
| Type safety | 25% | D+ | 35 `where: any` patterns, 170+ `as any`, 151+ explicit `any` |
| Error handling | 20% | B- | Zero empty catches; but 204 swallowed exceptions, no error boundary |
| Code hygiene | 15% | B | Zero `@ts-ignore`, 1 `eslint-disable`, minimal commented code |
| Console pollution | 10% | C | 2 server console.logs, 44 frontend console.logs (many are placeholders) |
| Line length / formatting | 10% | B- | 536 violations, mostly JSX; fixable with Prettier |

**Overall: C+**

The codebase demonstrates good foundational practices (no `@ts-ignore`, no empty catches, clean imports, good documentation in utilities) but is undermined by pervasive `any` type usage that defeats TypeScript's safety guarantees, and by monolithic React components that far exceed reasonable size limits. The systematic `const where: any = {}` pattern across 34 controllers represents a significant technical debt item that should be prioritized for refactoring.

---

## Priority Remediation Plan

### P0 (This Sprint)
1. Remove `console.log` from `risk-calculation.service.ts:215` (debug log in hot path)
2. Remove unused `import * as fs` from `risk-scenario.service.ts:2`
3. Extract duplicated `statusToEffectiveness` to shared constant

### P1 (Next Sprint)
4. Add React `ErrorBoundary` at app root
5. Replace 34 `const where: any = {}` with typed Prisma `WhereInput`
6. Replace placeholder `console.log` handlers with proper implementations or disabled states

### P2 (Next Quarter)
7. Decompose the 9 components exceeding 500 lines
8. Update `Evidence` type interface to eliminate 16 `as any` casts
9. Add centralized error reporting (Sentry or similar)
10. Configure Prettier with `printWidth: 100` and auto-format
