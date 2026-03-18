# Field Consistency Fixes — MCP Tools ↔ Prisma Schema

**Date:** 2026-03-18
**Status:** Draft
**Scope:** Fix 20 field name/type mismatches between MCP tool Zod schemas and Prisma models

## Problem

Full-stack audit revealed 20 issues where MCP tool parameters don't match Prisma schema field names or types. These cause runtime failures when approved actions are executed, or silent data corruption.

## Issues by Priority

### Critical (2) — Runtime failures

1. **ITSM `propose_change` missing `changeRef`** — required non-nullable field, change creation fails at DB level
2. **Evidence `CLOSE_EVIDENCE_REQUEST` ignores `action` param** — reject/cancel silently treated as accept

### High (11) — Type mismatches

| # | Domain | MCP Field | MCP Type | Prisma Field | Prisma Type |
|---|--------|-----------|----------|--------------|-------------|
| 3 | Risks | `greenThreshold` | string | `thresholdGreen` | Int? |
| 4 | ITSM | `rackPosition` | string | `rackPosition` | Int? |
| 5 | ITSM | `cpuCapacity` | string | `cpuCapacity` | Int? |
| 6 | ITSM | `rollbackTime` | string | `rollbackTime` | Int? |
| 7 | ITSM | `estimatedDowntime` | string | `estimatedDowntime` | Int? |
| 8 | ITSM | `maintenanceWindow` | string | `maintenanceWindow` | Boolean |
| 9 | ITSM | `affectedServices` | string | `affectedServices` | Json |
| 10 | Org | `riskAcceptanceThreshold` | string | `riskAcceptanceThreshold` | Int? |
| 11 | Org | `maxTolerableDowntime` | string | `maxTolerableDowntime` | Int? |
| 12 | Evidence | `version` | string | `version` | Int |
| 13 | Policies | `affectedDocuments` | string | `affectedDocuments` | String[] |

### Medium (7) — Missing/renamed fields

| # | Domain | Issue |
|---|--------|-------|
| 14 | Incidents | `sourceSystem` dropped by timeline executor |
| 15 | Incidents | `completedDate` and `status` dropped by lessons executor |
| 16 | Evidence | `contextId` has no MCP param |
| 17 | Risks | TreatmentPlan: `targetDate` → should be `targetEndDate` |
| 18 | Risks | TreatmentPlan: `budget` → no Prisma field (use `estimatedCost`) |
| 19 | Risks | TreatmentAction: `targetDate` → should be `dueDate` |
| 20 | Policies | `affectedProcesses` type: string → String[] |

## Fix Strategy

All fixes are in the **MCP tool Zod schemas** — change the tool parameter types/names to match Prisma. The executors and services stay the same since they pass data through to Prisma.

For field name mismatches (#3, #17, #18, #19): rename the MCP tool param to match the Prisma field name.
For type mismatches (#4-#13): change `z.string()` to `z.number()`, `z.boolean()`, or `z.array(z.string())`.
For missing fields (#14-#16): add the field to the executor's Prisma data object.
For critical #1: auto-generate `changeRef` in the tool handler if not provided.
For critical #2: handle all three action values in the executor.

## Files to Modify

| File | Changes |
|------|---------|
| `apps/mcp-server-risks/src/tools/mutation-tools.ts` | Fix KRI threshold names (#3), treatment targetDate→targetEndDate (#17), budget→estimatedCost (#18), action targetDate→dueDate (#19) |
| `apps/mcp-server-itsm/src/tools/mutation-tools.ts` | Fix 6 type mismatches (#4-#9), add changeRef generation (#1) |
| `apps/mcp-server-organisation/src/tools/mutation-tools.ts` | Fix 2 type mismatches (#10-#11) |
| `apps/mcp-server-evidence/src/tools/mutation-tools.ts` | Fix version type (#12), add contextId param (#16) |
| `apps/mcp-server-policies/src/tools/mutation-tools.ts` | Fix affectedDocuments/affectedProcesses to arrays (#13, #20) |
| `apps/server/src/mcp-approval/executors/incident.executors.ts` | Pass sourceSystem, completedDate, status (#14-#15) |
| `apps/server/src/mcp-approval/executors/evidence.executors.ts` | Handle reject/cancel in CLOSE_EVIDENCE_REQUEST (#2) |
