# Field Consistency Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 20 field name/type mismatches between MCP tool Zod schemas, executors, and Prisma models that cause runtime failures or silent data corruption when approved actions are executed.

**Architecture:** All fixes are in MCP tool Zod schemas (change param types/names to match Prisma) and executors (add missing fields, handle action variants). No Prisma schema changes. No API changes.

**Tech Stack:** Zod (MCP tool schemas), TypeScript, Prisma, NestJS

**Spec:** `docs/superpowers/specs/2026-03-18-field-consistency-fixes-design.md`

---

## File Structure

### Files to modify

| File | Changes |
|------|---------|
| `apps/mcp-server-risks/src/tools/mutation-tools.ts` | Rename KRI threshold params (#3), treatment targetDate→targetEndDate (#17), remove budget (#18), action targetDate→dueDate (#19) |
| `apps/mcp-server-itsm/src/tools/mutation-tools.ts` | Fix 6 type mismatches to z.number()/z.boolean()/z.array() (#4-#9), auto-generate changeRef (#1) |
| `apps/mcp-server-organisation/src/tools/mutation-tools.ts` | Fix 2 type mismatches to z.number() (#10-#11) |
| `apps/mcp-server-evidence/src/tools/mutation-tools.ts` | Fix version to z.number() (#12), add contextId param (#16) |
| `apps/mcp-server-policies/src/tools/mutation-tools.ts` | Fix affectedDocuments/affectedProcesses to z.array(z.string()) (#13, #20) |
| `apps/server/src/mcp-approval/executors/incident.executors.ts` | Pass sourceSystem (#14), completedDate and status (#15) through to Prisma |
| `apps/server/src/mcp-approval/executors/evidence.executors.ts` | Handle reject/cancel actions in CLOSE_EVIDENCE_REQUEST (#2) |

---

## Chunk 1: Critical Fixes

### Task 1: ITSM — Auto-generate changeRef for propose_change

**Files:**
- Modify: `apps/mcp-server-itsm/src/tools/mutation-tools.ts`

The Change model requires `changeRef` (unique, non-nullable like "CHG-2026-001") but the MCP tool doesn't accept or generate it. Change creation fails at the DB level.

- [ ] **Step 1: Read the propose_change tool to find the payload construction**

Read `apps/mcp-server-itsm/src/tools/mutation-tools.ts` around line 465 to find where the payload is built.

- [ ] **Step 2: Add changeRef generation in the tool handler**

In the `propose_change` tool handler, before `createPendingAction`, generate a changeRef:

```typescript
// Generate changeRef: CHG-YYYY-NNN
const year = new Date().getFullYear();
const count = await prisma.change.count({ where: { organisationId: params.organisationId } });
const changeRef = `CHG-${year}-${String(count + 1).padStart(3, '0')}`;
```

Add `changeRef` to the payload object.

- [ ] **Step 3: Type check**

Run: `cd apps/mcp-server-itsm && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add apps/mcp-server-itsm/src/tools/mutation-tools.ts
git commit -m "fix(mcp-itsm): auto-generate changeRef for propose_change"
```

---

### Task 2: Evidence — Handle reject/cancel in CLOSE_EVIDENCE_REQUEST

**Files:**
- Modify: `apps/server/src/mcp-approval/executors/evidence.executors.ts`

The MCP tool sends `action` as `accept`/`reject`/`cancel` but executor always calls `acceptSubmission()`.

- [ ] **Step 1: Read the evidence request service to find reject/cancel methods**

Read `apps/server/src/evidence/services/evidence-request.service.ts` to find methods for rejecting or cancelling requests.

- [ ] **Step 2: Update the CLOSE_EVIDENCE_REQUEST executor**

```typescript
executors.set('CLOSE_EVIDENCE_REQUEST', (p, userId) => {
  const action = p['action'] || 'accept';
  if (action === 'reject') {
    return evidenceRequestService.rejectSubmission(p['requestId'], userId, p['notes']);
  }
  if (action === 'cancel') {
    return evidenceRequestService.cancelRequest(p['requestId'], userId, p['notes']);
  }
  return evidenceRequestService.acceptSubmission(p['requestId']);
});
```

If `rejectSubmission` or `cancelRequest` methods don't exist, use a generic status update or document what's missing.

- [ ] **Step 3: Type check**

Run: `cd apps/server && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/mcp-approval/executors/evidence.executors.ts
git commit -m "fix(server): handle reject/cancel actions in CLOSE_EVIDENCE_REQUEST executor"
```

---

## Chunk 2: Type Mismatches — ITSM

### Task 3: Fix 6 ITSM type mismatches

**Files:**
- Modify: `apps/mcp-server-itsm/src/tools/mutation-tools.ts`

Change these Zod params from `z.string()` to match Prisma types:

| Line | Field | Current | Correct | Prisma Type |
|------|-------|---------|---------|-------------|
| 64 | `rackPosition` (create) | `z.string().max(200)` | `z.number().int()` | `Int?` |
| 184 | `rackPosition` (update) | `z.string().max(200)` | `z.number().int()` | `Int?` |
| 103 | `cpuCapacity` (create) | `z.string().max(200)` | `z.number().int()` | `Int?` |
| 223 | `cpuCapacity` (update) | `z.string().max(200)` | `z.number().int()` | `Int?` |
| 443 | `affectedServices` | `z.string().max(5000)` | `z.array(z.string())` | `Json?` |
| 447 | `rollbackTime` | `z.string().max(200)` | `z.number().int()` | `Int?` |
| 449 | `maintenanceWindow` | `z.string().max(200)` | `z.boolean()` | `Boolean` |
| 451 | `estimatedDowntime` | `z.string().max(200)` | `z.number().int()` | `Int?` |

- [ ] **Step 1: Make all changes**

For each line, replace the Zod type. Keep `.optional()` and update `.describe()` to include units where relevant (e.g. "Estimated downtime in minutes").

- [ ] **Step 2: Type check**

Run: `cd apps/mcp-server-itsm && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add apps/mcp-server-itsm/src/tools/mutation-tools.ts
git commit -m "fix(mcp-itsm): correct Zod types to match Prisma schema (Int, Boolean, Json)"
```

---

## Chunk 3: Type Mismatches — Risks, Organisation, Evidence, Policies

### Task 4: Fix KRI threshold field names and treatment date/budget mismatches

**Files:**
- Modify: `apps/mcp-server-risks/src/tools/mutation-tools.ts`

| Line | Current | Correct | Reason |
|------|---------|---------|--------|
| 89 | `greenThreshold` | `thresholdGreen` | Prisma field is `thresholdGreen` |
| 90 | `amberThreshold` | `thresholdAmber` | Prisma field is `thresholdAmber` |
| 91 | `redThreshold` | `thresholdRed` | Prisma field is `thresholdRed` |
| 381 | `targetDate` (TreatmentPlan) | `targetEndDate` | Prisma field is `targetEndDate` |
| 382 | `budget` | Remove or rename to `estimatedCost` | Prisma field is `estimatedCost` |
| 421 | `targetDate` (TreatmentAction) | `dueDate` | Prisma field is `dueDate` |

Also update the payload construction lines that reference these params to use the new names.

- [ ] **Step 1: Rename all fields and update payloads**

- [ ] **Step 2: Type check**

Run: `cd apps/mcp-server-risks && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add apps/mcp-server-risks/src/tools/mutation-tools.ts
git commit -m "fix(mcp-risks): rename KRI thresholds and treatment dates to match Prisma"
```

---

### Task 5: Fix Organisation type mismatches

**Files:**
- Modify: `apps/mcp-server-organisation/src/tools/mutation-tools.ts`

| Line | Field | Current | Correct |
|------|-------|---------|---------|
| 60 | `riskAcceptanceThreshold` | `z.string().max(200)` | `z.number().int()` |
| 61 | `maxTolerableDowntime` | `z.string().max(200)` | `z.number().int()` |

- [ ] **Step 1: Change types, update descriptions**

Update descriptions to include units: "Risk acceptance threshold score (e.g. 6, 12, 16)" and "Maximum tolerable downtime in hours".

- [ ] **Step 2: Type check**

Run: `cd apps/mcp-server-organisation && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add apps/mcp-server-organisation/src/tools/mutation-tools.ts
git commit -m "fix(mcp-org): correct riskAcceptanceThreshold and maxTolerableDowntime to z.number()"
```

---

### Task 6: Fix Evidence version type and add contextId

**Files:**
- Modify: `apps/mcp-server-evidence/src/tools/mutation-tools.ts`

| Line | Field | Current | Correct |
|------|-------|---------|---------|
| 29 | `version` | `z.string().max(200)` | `z.number().int()` |

Also add `contextId` param to `propose_create_request` (around line 130):
```typescript
contextId: z.string().max(200).optional().describe('Context entity ID (UUID of linked control, test, etc.)'),
```

And add it to the payload.

- [ ] **Step 1: Make changes**

- [ ] **Step 2: Type check**

Run: `cd apps/mcp-server-evidence && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add apps/mcp-server-evidence/src/tools/mutation-tools.ts
git commit -m "fix(mcp-evidence): correct version type and add contextId to evidence requests"
```

---

### Task 7: Fix Policies array types

**Files:**
- Modify: `apps/mcp-server-policies/src/tools/mutation-tools.ts`

| Line | Field | Current | Correct |
|------|-------|---------|---------|
| 390 | `affectedDocuments` | `z.string().max(5000)` | `z.array(z.string().max(200))` |
| 391 | `affectedProcesses` | `z.string().max(5000)` | `z.array(z.string().max(200))` |

- [ ] **Step 1: Change types**

- [ ] **Step 2: Type check**

Run: `cd apps/mcp-server-policies && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add apps/mcp-server-policies/src/tools/mutation-tools.ts
git commit -m "fix(mcp-policies): change affectedDocuments/affectedProcesses to arrays"
```

---

## Chunk 4: Missing Executor Fields

### Task 8: Pass missing fields in incident executors

**Files:**
- Modify: `apps/server/src/mcp-approval/executors/incident.executors.ts`

**ADD_TIMELINE_ENTRY** — add `sourceSystem`:
```typescript
sourceSystem: p['sourceSystem'],
```

**CREATE_LESSON_LEARNED** — add `completedDate` and `status`:
```typescript
completedDate: p['completedDate'] ? new Date(p['completedDate']) : undefined,
status: p['status'] || 'OPEN',
```

- [ ] **Step 1: Add missing fields to both executors**

- [ ] **Step 2: Type check**

Run: `cd apps/server && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/mcp-approval/executors/incident.executors.ts
git commit -m "fix(server): pass sourceSystem, completedDate, status in incident executors"
```

---

## Chunk 5: Docker Validation

### Task 9: Push, rebuild Docker, test

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Pull in test clone and rebuild**

```bash
cd /tmp/riskready-community-install-fresh-20260317
git pull origin main
docker compose build --no-cache server gateway
docker compose up -d
```

- [ ] **Step 3: Test chat with mutation**

Log in, ask the assistant to propose a change, approve it, verify execution succeeds without Prisma errors.

- [ ] **Step 4: Check server logs for errors**

```bash
docker compose logs server --tail 50 | grep -i "error\|fail"
```

Expected: No executor-related errors.
