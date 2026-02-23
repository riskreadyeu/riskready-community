# Architecture Audit Report: Dead Code, Premature Abstractions, and Phantom Features

**Auditor**: Claude Opus 4.6 (automated, Trail of Bits methodology)
**Date**: 2026-02-22
**Scope**: `/home/daniel/projects/riskready-community` -- all `apps/` source (770 TypeScript files), `gateway/`, config files, documentation
**Standard**: Trail of Bits building-secure-software guidelines -- "No commented-out code -- delete it", "No dead exports", "No phantom features"

---

## Executive Summary

| Category | Count | Severity |
|---|---|---|
| Commented-out code | 4 instances | Low |
| Dead exports / dead files | 8 items | Medium |
| Deprecated / backward-compat shims | 7 functions + 1 deprecated type hierarchy | High |
| Phantom features (documented but absent) | 5 features | Medium |
| TODO/FIXME/stub implementations | 32 markers | High |
| Unused dependencies | 3 packages | Low |
| Code duplication across MCP servers | 8x identical files (prisma.ts, vitest.config.ts, mutation pattern) | Medium |
| Mock data shipped in production components | 1 component with hardcoded mock data | High |

**Overall Grade: B-**

The codebase is generally well-structured with clear module boundaries, but carries significant technical debt from rapid iteration: deprecated API shims that are still actively called, TODO stubs masquerading as implemented features, a fully dead library file, and substantial copy-paste duplication across the 8 MCP servers. The deprecated risk-level control linking code path is the most concerning finding -- it remains wired into active controllers and services while returning empty results.

---

## 1. Commented-Out Code

Trail of Bits standard: *"No commented-out code -- delete it. That's what version control is for."*

### Findings

| File | Line | Code |
|---|---|---|
| `apps/server/prisma/seed/organisation/seed-demo-organisation.ts` | 15 | `// const prisma = new PrismaClient(); // Removed to allow injection` |
| `apps/server/src/config/index.ts` | 35-36 | `// export { AUDITS_CONFIG } from './audits.config';` and `// export { INCIDENTS_CONFIG } from './incidents.config';` |
| `apps/web/src/pages/organisation/organisation-profiles/OrganisationProfileDetailPage.tsx` | 140 | `// await deleteOrganisationProfile(id);` |

**Impact**: Low. Only 4 instances found. The config/index.ts comments are the most structurally concerning because they signal planned-but-never-built config modules (no `audits.config.ts` or `incidents.config.ts` files exist), which is a premature placeholder pattern.

**Recommendation**: Delete all 4 instances. The config placeholders should be removed and re-added via a proper feature branch when those configs are actually needed.

---

## 2. Dead Exports and Dead Files

### 2a. Entirely Dead File: `policy-markdown-parser.ts`

**File**: `apps/web/src/lib/policy-markdown-parser.ts`

This file exports `PolicyFrontmatter`, `ParsedPolicyDocument`, `parseFrontmatter()`, and `parsePolicyMarkdown()`. None of these are imported anywhere in the codebase. The file is 479+ lines of dead code. A similar but separate file, `parse-policy-content.ts`, IS actively used (imported by `PolicyDocumentDetailPage.tsx`). The two files appear to be duplicate implementations of the same concept, with one being the abandoned version.

### 2b. Dead Function: `getNestedValue()`

**File**: `apps/web/src/lib/export-utils.ts:241`

Private function `getNestedValue()` is defined but never called anywhere, including within its own file. The `toCSV()` function above it implements its own inline version of nested value access.

### 2c. Dead Function: `getRiskLevelSimple()`

**File**: `apps/server/src/risks/utils/risk-scoring.ts:129`

Exported function marked `@deprecated`, delegates directly to `getRiskLevel()`. Zero call sites found anywhere in the codebase.

### 2d. Dead Exports: `PermissionGate` and `withPermission`

**File**: `apps/web/src/components/archer/permission-gate.tsx`

Both `PermissionGate` and `withPermission` are exported from the archer component library barrel export (`apps/web/src/components/archer/index.ts:19`), but `<PermissionGate>` is never rendered anywhere in the application and `withPermission()` is never called. The entire permission system in `apps/web/src/lib/archer/permissions.ts` (200 lines) defines roles, permissions, and helper functions (`hasPermission`, `hasAnyPermission`, `hasAllPermissions`, `getPermissionsForRole`, `getPermissionsForRoles`) that are only consumed by the dead `PermissionGate` component.

This represents ~250 lines of dead RBAC infrastructure.

### 2e. Stub Export Functions: `exportToExcel()` and `exportToPDF()`

**File**: `apps/web/src/lib/export-utils.ts:190-215`

Both functions are exported and referenced from `apps/web/src/components/common/export-dropdown.tsx:48`, but they contain no actual Excel/PDF logic -- they both just log a console message and fall back to CSV export. These are phantom features presented to the user as real functionality.

### 2f. Legacy Type Hierarchy: ControlLayer types

**File**: `apps/web/src/components/controls/control-browser/types.ts:13-51`

The file contains `ControlLayerBasic`, `ControlWithLayers`, and `LayerWithStatus` interfaces explicitly commented as "Legacy layer shape kept locally" with a note that "The four-layer framework types have been removed from controls-api." These types ARE still used by the control-browser components (control-row.tsx, layer-row.tsx, control-browser.tsx), but the underlying four-layer data model has been removed from the community edition. The server side confirms: `ControlLayer removed in community edition` appears in `control.service.ts:23`, `assessment.service.ts:225`, and `control-risk-integration.service.ts:40`.

**Impact**: The control browser UI references layer structures that the backend no longer provides, meaning these types describe a ghost data model.

---

## 3. Deprecated / Backward-Compatibility Shims

### 3a. Risk-Level Control Linking (CRITICAL)

This is the most significant deprecated code path because it is still **actively wired into controllers and services**.

| Component | File | Line |
|---|---|---|
| Frontend API stubs | `apps/web/src/lib/risks-api.ts` | 820-854 |
| Backend service (deprecated) | `apps/server/src/risks/services/control-risk-integration.service.ts` | 55-81 |
| Backend service (deprecated summary) | `apps/server/src/risks/services/control-risk-integration.service.ts` | 313-370 |
| Backend controller (still wired) | `apps/server/src/risks/controllers/control-risk-integration.controller.ts` | 29-42 |

**Details**: Three deprecated frontend functions (`getLinkedControls`, `linkControlToRisk`, `unlinkControlFromRisk`) return empty arrays or throw errors. The backend `getControlEffectivenessForRisk()` method logs a deprecation warning and returns empty results, yet it is **still called by two internal methods** within the same service (lines 250 and 331). The controller endpoint `getControlEffectivenessForRisk` at line 29 is still bound and routable. Additionally, `getControlEffectivenessSummary()` at line 317 is deprecated but still called by its controller.

**Impact**: High. Active HTTP endpoints serving deprecated empty responses. Internal service methods calling deprecated code paths, creating confusing log noise.

### 3b. `getRiskLevelSimple()` Shim

**File**: `apps/server/src/risks/utils/risk-scoring.ts:127-131`

Marked `@deprecated`, delegates to `getRiskLevel()`. Zero callers. Pure dead code.

---

## 4. Phantom Features (Documented but Not Implemented)

### 4a. Redis

**CHANGELOG.md line 22** states: "Redis for caching and background jobs"

**Reality**: Zero Redis references exist anywhere in `apps/server/src/`. No Redis service in `docker-compose.yml`. No `ioredis`, `redis`, or `bull` dependency in any `package.json`. This feature is entirely phantom.

### 4b. MinIO / S3-Compatible Object Storage

**CHANGELOG.md line 23** states: "MinIO for S3-compatible object storage"

**Reality**: Zero MinIO/S3 references in server source code. No MinIO service in `docker-compose.yml`. No `@aws-sdk/client-s3` or `minio` dependency. Evidence file storage uses local filesystem (`evidence_data` Docker volume). The README says "Evidence collection, file storage" but there is no S3-compatible storage implementation.

### 4c. Compliance Surveys

**README.md line 93** lists "compliance surveys" as an Organisation Management capability.

**Reality**: Zero references to "compliance surveys" exist in any TypeScript source file.

### 4d. Audit Logging for All Significant Actions

**CHANGELOG.md line 25** states: "Audit logging for all significant actions"

**Reality**: Audit logging infrastructure EXISTS (`apps/server/src/prisma/prisma-audit.middleware.ts`, policy audit service), but it is limited to the policy module. There is no evidence of system-wide audit logging for controls, risks, incidents, ITSM, or evidence operations.

### 4e. Four-Layer Assurance Model

**README.md line 87** lists "four-layer assurance model" as a Controls Framework capability.

**Reality**: The four-layer model (`ControlLayer`) has been explicitly removed from the community edition. Multiple server-side comments confirm: "ControlLayer removed in community edition -- return fixed 'not assessed'" (control.service.ts:23). The frontend still carries legacy types but the backend returns stub data.

---

## 5. TODO / FIXME / Stub Implementations

32 TODO markers found across the codebase. Categorized by severity:

### 5a. Stubs Presented as Working Features (HIGH -- 8 instances)

These are UI handlers that show success toasts but perform no actual backend operation:

| File | Line | Description |
|---|---|---|
| `apps/web/src/pages/organisation/meeting-action-items/MeetingActionItemsPage.tsx` | 111, 133 | Create/delete action items -- `console.log()` + success toast, no API call |
| `apps/web/src/pages/organisation/meeting-decisions/MeetingDecisionsPage.tsx` | 141, 163 | Create/delete decisions -- same pattern |
| `apps/web/src/pages/organisation/committee-meetings/CommitteeMeetingsPage.tsx` | 140, 162 | Create/delete meetings -- same pattern |
| `apps/web/src/pages/organisation/organisation-profiles/OrganisationProfileDetailPage.tsx` | 139-140 | Delete profile -- shows success toast, does nothing |
| `apps/web/src/pages/organisation/meeting-action-items/MeetingActionItemDetailPage.tsx` | 147-148 | Edit/delete buttons with empty `{/* TODO */}` handlers |

**Impact**: High. Users see success feedback for operations that silently fail. This violates UI honesty principles.

### 5b. Missing Backend Integration (MEDIUM -- 10 instances)

| File | Line | Description |
|---|---|---|
| `apps/web/src/components/evidence/EvidenceLinkDialog.tsx` | 83 | `searchEntities()` uses hardcoded mock data instead of API calls |
| `apps/web/src/pages/policies/ChangeRequestsPage.tsx` | 93, 105, 203 | Hardcoded `"current-user-id"` instead of auth context |
| `apps/web/src/pages/policies/ExceptionsPage.tsx` | 84, 197, 212 | Same hardcoded user ID, missing navigation, missing revoke |
| `apps/web/src/pages/controls/scope/ScopeRegistryPage.tsx` | 87 | Uses first org instead of auth context |
| `apps/web/src/pages/controls/soa/SOACreatePage.tsx` | 36 | Missing auth context for org ID |
| `apps/web/src/pages/policies/AcknowledgmentsPage.tsx` | 218 | Send reminder -- TODO stub |

### 5c. Planned Backend Features (LOW -- 14 instances)

All in `apps/server/src/evidence/services/evidence-link.service.ts`:

Lines 102, 106, 110, 132, 136, 184, 188, 192, 206, 210, 301, 305, 309, 337, 341 -- Five entity types (`vendor`, `assessment`, `contract`, `application`, `isra`) are defined in the switch statement but throw `BadRequestException("not yet supported")`. The pattern is repeated three times (link, unlink, getLinked) for 15 total stubs.

### 5d. Other TODOs

| File | Line | Description |
|---|---|---|
| `apps/web/src/pages/policies/PolicyDocumentListPage.tsx` | 243, 254 | Submit for approval and delete -- not implemented |
| `apps/web/src/pages/controls/soa/SOAListPage.tsx` | 95, 101 | Bulk approve/archive -- not implemented |
| `apps/web/src/pages/controls/controls-library/ControlsLibraryPage.tsx` | 196, 202 | Bulk enable/disable -- not implemented |
| `apps/web/src/components/controls/control-browser/control-browser.tsx` | 250 | Bulk actions -- not implemented |
| `apps/server/src/risks/services/risk-scenario.service.ts` | 771 | Control assessment data linking -- not implemented |
| `apps/web/src/pages/policies/DocumentEditorPage.tsx` | 162 | Save API -- not implemented |

---

## 6. Unused Dependencies

### Server (`apps/server/package.json`)

| Package | Status | Evidence |
|---|---|---|
| `jws` (v4.0.1) | **UNUSED** | Zero imports of `jws` anywhere in `apps/server/src/`. JWT handling uses `@nestjs/jwt` instead. |
| `axios` (v1.13.2) | **UNUSED** | Zero imports of `axios` in `apps/server/src/`. The gateway uses its own HTTP client. |
| `csv-parse` (v6.1.0) | Partially used | Only referenced in seed scripts (`prisma/seed/`), not in application source code. Could be moved to devDependencies. |

### Web (`apps/web/package.json`)

All web dependencies have at least one import. No unused packages found.

### MCP Servers

All 8 MCP servers share identical dependency sets (`@modelcontextprotocol/sdk`, `@prisma/client`, `zod`) which are all actively used.

---

## 7. Code Duplication Across MCP Servers

### 7a. Identical `prisma.ts` Files (8 copies)

All 8 MCP servers contain byte-for-byte identical `prisma.ts` files (17 lines each). Minor variation: 4 servers include a `// Ensure clean shutdown` comment, 4 do not. Total: 136 lines that could be a single shared module.

**Files**:
- `apps/mcp-server-{audits,controls,evidence,incidents,itsm,organisation,policies,risks}/src/prisma.ts`

### 7b. Identical `vitest.config.ts` Files (8 copies)

All 8 servers share the same 7-line vitest config. Total: 56 lines duplicated.

### 7c. Identical `package.json` Structure (8 copies)

All 8 servers have identical `scripts`, `imports`, `dependencies`, and `devDependencies` sections. Only `name` differs. The `postinstall` script (a complex one-liner that symlinks Prisma client) is copy-pasted 8 times.

### 7d. Identical `tsconfig.json` Files (8 copies)

All extend `../../tsconfig.mcp-base.json` with identical `compilerOptions`.

### 7e. Copy-Pasted `createPendingAction()` and `getDefaultOrganisationId()` Functions

Every `mutation-tools.ts` file (8 files, 4512 total lines) begins with identical copies of these two helper functions (lines 1-44). The functions are 44 lines each copy = 352 lines of pure duplication.

### 7f. Copy-Pasted Test Structure

All 8 `mutation-tools.test.ts` files (599 total lines) follow the exact same 4-test pattern:
1. `it('is a function')` -- checks typeof
2. `it('registers without throwing')` -- calls function
3. `it('registers all expected mutation tools')` -- spies on server.tool
4. `it('registers the correct total number')` -- checks call count

The mock setup pattern (`vi.mock('#src/prisma.js', ...)`) is copy-pasted with minor model name variations.

### 7g. Data Integrity Resource (Duplicated Content)

The `data-integrity` resource registered in each MCP server's `resources/index.ts` contains nearly identical markdown content (~30 lines) adapted only for domain-specific examples. This content should be a shared template.

**Total estimated duplication**: ~800+ lines across MCP servers.

---

## 8. Mock Data in Production Components

### `EvidenceLinkDialog.tsx` (CRITICAL)

**File**: `apps/web/src/components/evidence/EvidenceLinkDialog.tsx:78-134`

The `searchEntities()` function contains hardcoded mock data with a fake 300ms `setTimeout` delay. When a user searches for entities to link evidence to, they see fabricated data (`"ctrl-1"`, `"Access Control Policy"`, `"INC-2024-001"`) instead of real database results. This is shipped as a production component.

---

## Impact Assessment: What Can Be Safely Removed

### Immediate Removals (Zero Risk)

| Item | Lines Saved | Justification |
|---|---|---|
| `policy-markdown-parser.ts` | ~480 | Zero imports anywhere |
| `getRiskLevelSimple()` | 4 | Zero callers, deprecated shim |
| `getNestedValue()` in export-utils.ts | 6 | Zero callers, private dead function |
| 4 commented-out code blocks | 5 | Version control exists |
| Config placeholder comments (index.ts:34-36) | 3 | No corresponding files exist |

### Removals Requiring Migration (Low Risk)

| Item | Lines Saved | Justification |
|---|---|---|
| Deprecated risk-level control linking (frontend) | ~35 | Returns empty/throws; replacement API exists |
| `PermissionGate` + `withPermission` + permissions.ts | ~250 | Zero usage in application |
| `exportToExcel()` / `exportToPDF()` stubs | ~25 | Silently fall back to CSV; mislead users |

### Extractions (Reduce Duplication)

| Item | Lines Saved | Approach |
|---|---|---|
| Shared `prisma.ts` | ~120 | Create `packages/mcp-shared/prisma.ts` |
| Shared `createPendingAction()` + `getDefaultOrganisationId()` | ~310 | Move to shared package |
| Shared vitest/tsconfig | ~100 | Workspace-level config |

### Requires Design Decision

| Item | Notes |
|---|---|
| Deprecated `getControlEffectivenessForRisk()` service + controller | Still actively called by internal methods; needs refactoring |
| Legacy ControlLayer types in control-browser | UI components depend on them; need to decide: restore or fully remove |
| Mock `EvidenceLinkDialog` search | Needs real API endpoint before removal |
| 8 TODO-stub UI handlers | Need real backend endpoints or should be disabled/hidden |

---

## Recommendations

### Priority 1: Fix User-Facing Lies
1. **Disable or hide** UI buttons that show success toasts but do nothing (meeting action items, meeting decisions, committee meetings, org profile delete). Either implement the backend or remove the buttons.
2. **Replace mock data** in `EvidenceLinkDialog.tsx` with real API calls or hide the link functionality.
3. **Remove `exportToExcel()` and `exportToPDF()`** from the export dropdown, or label them as "CSV (Excel format not available)".

### Priority 2: Clean Deprecated Code
4. **Delete the 3 deprecated risk-level control linking functions** from the frontend API (`risks-api.ts:820-854`).
5. **Refactor `control-risk-integration.service.ts`** -- the internal methods at lines 250 and 331 that call `getControlEffectivenessForRisk()` should call `getControlEffectivenessForScenario()` directly.
6. **Delete `getRiskLevelSimple()`** and `getControlEffectivenessSummary()` after removing their last callers.

### Priority 3: Reduce MCP Server Duplication
7. **Create a `packages/mcp-shared`** workspace package containing:
   - `prisma.ts` (shared Prisma client setup)
   - `pending-action.ts` (shared `createPendingAction()` and `getDefaultOrganisationId()`)
   - Shared vitest config
   - Data integrity resource template
8. Update all 8 MCP servers to import from the shared package.

### Priority 4: Documentation Accuracy
9. **Remove** Redis and MinIO references from `CHANGELOG.md`.
10. **Remove** "compliance surveys" from README.md feature list.
11. **Update** "four-layer assurance model" language -- either restore the feature or describe the current assessment model accurately.
12. **Clarify** "audit logging for all significant actions" -- scope it to where it actually exists (policy module).

### Priority 5: Dependency Cleanup
13. **Remove `jws`** from server `package.json` dependencies.
14. **Remove `axios`** from server `package.json` dependencies.
15. **Move `csv-parse`** to devDependencies (only used in seed scripts).

### Priority 6: Dead Code Cleanup
16. **Delete** `apps/web/src/lib/policy-markdown-parser.ts` (480 dead lines).
17. **Delete** the dead `PermissionGate`, `withPermission`, and the entire `apps/web/src/lib/archer/permissions.ts` RBAC system (250 lines) unless RBAC is on the near-term roadmap.
18. **Delete** the legacy `ControlLayerBasic`, `ControlWithLayers`, `LayerWithStatus` types or document why they're retained.

---

## Overall Grade: B-

**Strengths**:
- Clean module boundaries between the 8 MCP servers and NestJS backend
- Consistent patterns across the codebase (API layer, component structure)
- Good use of Zod schemas for MCP tool validation
- Very few instances of commented-out code (only 4)
- No unused web dependencies
- The `tsconfig.mcp-base.json` shared config is good practice (should be extended further)

**Weaknesses**:
- 5 phantom features documented in README/CHANGELOG that do not exist
- Active deprecated code paths still wired into controllers and serving empty HTTP responses
- UI stubs that show success feedback for non-existent operations
- ~800+ lines of copy-paste duplication across 8 MCP servers
- Production component shipping hardcoded mock data
- Dead RBAC infrastructure (~250 lines) that was never integrated

The B- reflects a codebase with solid fundamentals that has accumulated debt from rapid feature development. The deprecated-but-still-wired code paths and phantom features are the primary concerns -- they create confusion for both developers and users. The MCP server duplication, while not a correctness issue, will compound maintenance cost as the number of tools grows.
