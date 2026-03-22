# OWASP AI Audit Remediation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Fix all 4 HIGH, 13 MEDIUM, and 11 LOW findings from the full OWASP AI audit.

**Approach:** Group fixes by type (shared Zod types, enum tightening, bounds, architectural) to minimize file touches.

**Spec:** Full audit results in conversation context + `documentation/AGENT_SECURITY_AUDIT.md`

---

## Task 1: Create Shared Zod Types (HIGH H-02, H-03)

**Fixes:** H-02, H-03, L-05, L-06

**Files:**
- Create: `packages/mcp-shared/src/security/zod-types.ts`
- Modify: All 9 `apps/mcp-server-*/src/tools/mutation-tools.ts`

Create shared Zod types:
```typescript
import { z } from 'zod';

// Matches both UUID v4 and Prisma cuid
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^c[a-z0-9]{24,}$/i;

export const zId = z.string().max(100).regex(ID_PATTERN, 'Must be a valid UUID or CUID');
export const zSessionId = z.string().max(200).optional();
export const zOrgId = z.string().max(100).regex(ID_PATTERN).optional();
export const zReason = z.string().max(1000).optional();
```

Then replace across all mutation tools:
- All UUID params (`riskId`, `controlId`, `documentId`, etc.) → `zId`
- All `mcpSessionId` → `zSessionId`
- All `organisationId` → `zOrgId`
- All `reason` → `zReason`

---

## Task 2: Add Bounds to Numeric Fields (MEDIUM M-01)

**Fixes:** M-01

**Files:**
- `apps/mcp-server-risks/src/tools/mutation-tools.ts`
- `apps/mcp-server-controls/src/tools/mutation-tools.ts`
- `apps/mcp-server-itsm/src/tools/mutation-tools.ts`
- `apps/mcp-server-organisation/src/tools/mutation-tools.ts`

Add `.max()` to all unbounded numeric fields:
- `estimatedCost`, `purchaseCost`, `annualCost` → `.max(1_000_000_000)`
- `estimatedHours` → `.max(100_000)`
- `cpuCapacity`, `memoryCapacityGB`, `storageCapacityGB` → `.max(1_000_000)`
- `networkBandwidthMbps` → `.max(1_000_000)`
- `targetAvailability` → `.max(100)`

---

## Task 3: Add Bounds to Array Fields (MEDIUM M-02, M-03, M-09, M-10, LOW L-01, L-02)

**Fixes:** M-02, M-03, M-09, M-10, L-01, L-02

**Files:**
- All MCP server mutation-tools.ts files with array params

Add `.max()` to all unbounded arrays:
- `tags` → `z.array(z.string().max(100)).max(50)`
- `ipAddresses` → `z.array(z.string().max(200)).max(100)`
- `macAddresses` → `z.array(z.string().max(200)).max(100)`
- `ismsObjectives` → `z.array(z.string().max(500)).max(50)`
- `affectedDocuments`, `affectedProcesses` → add `.max(100)` to arrays
- `controlIds`, `scopeItemIds` → `z.array(zId).max(500)`
- `testIds` → `z.array(zId).max(500)`

---

## Task 4: Constrain JSON Record Fields (MEDIUM M-04, M-05)

**Fixes:** M-04, M-05

**Files:**
- `apps/mcp-server-itsm/src/tools/mutation-tools.ts`
- `apps/mcp-server-organisation/src/tools/mutation-tools.ts`

Replace `z.record(z.string(), z.unknown())` with a bounded version:
```typescript
const zJsonRecord = z.record(z.string().max(100), z.unknown()).refine(
  (val) => JSON.stringify(val).length < 10_000,
  'JSON object too large (max 10KB)'
);
```

Apply to `typeAttributes` and `riskTolerance`.

---

## Task 5: Replace String Status Fields with Enums (MEDIUM M-06, M-07)

**Fixes:** M-06, M-07

**Files:**
- `apps/mcp-server-risks/src/tools/mutation-tools.ts` — scenario targetStatus, treatment plan status, treatment action status
- `apps/mcp-server-evidence/src/tools/mutation-tools.ts` — request status
- `apps/mcp-server-audits/src/tools/mutation-tools.ts` — lesson status
- `apps/mcp-server-organisation/src/tools/mutation-tools.ts` — meeting status

Replace `z.string().max(200)` with proper enums from Prisma:
- Scenario status: `z.enum(['IDENTIFIED', 'ASSESSED', 'EVALUATED', 'TREATING', 'TREATED', 'ACCEPTED', 'MONITORING', 'ESCALATED', 'REVIEW', 'CLOSED', 'ARCHIVED'])`
- Treatment plan status: `z.enum(['DRAFT', 'PROPOSED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'])`
- Treatment action status: `z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'])`
- Evidence request status: check Prisma schema for valid values
- Lesson status: `z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])`
- Meeting status: check Prisma schema for valid values

---

## Task 6: Audit riskOwner PII Exposure (HIGH H-04)

**Fixes:** H-04

**Files:**
- `apps/mcp-server-risks/src/tools/risk-tools.ts`

Check what `riskOwner` contains:
1. Query the database: `SELECT DISTINCT "riskOwner" FROM "Risk" LIMIT 20`
2. If it contains email addresses or full names → exclude from `list_risks` select, or redact
3. If it's just a role/title string → document as acceptable

---

## Task 7: Sanitize Error Messages (LOW L-04)

**Fixes:** L-04

**Files:**
- `packages/mcp-shared/src/error-handler.ts`

Replace raw error message forwarding with sanitized output:
```typescript
const safeMessage = message.includes('prisma') || message.includes('connect') || message.includes('ECONNREFUSED')
  ? `Internal error in ${toolName}`
  : `Error in ${toolName}: ${message.slice(0, 200)}`;
```

---

## Task 8: Improve PII Redaction Patterns (LOW L-03 from gateway audit)

**Fixes:** Gateway LOW 02-03

**Files:**
- `gateway/src/agent/pii-redactor.ts`

Add patterns for:
- Credit card numbers (Luhn-checkable): `\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b`
- IBAN: `\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?\d{0,16})\b`

Tighten phone regex to reduce false positives on GRC data.

---

## Task 9: Add Council Rate Limit (MEDIUM 10-06 from gateway audit)

**Fixes:** Gateway MEDIUM 10-06

**Files:**
- `gateway/src/agent/agent-runner.ts`

Add a simple counter before council invocation:
```typescript
const COUNCIL_LIMIT_PER_USER_PER_HOUR = 5;
// Track in-memory: userId → { count, windowStart }
// If exceeded, skip council and use single-agent path
```

---

## Task 10: Scan Memory Content for Injection Patterns (MEDIUM 01-06/04-01 from gateway audit)

**Fixes:** Gateway MEDIUM 01-06, 04-01

**Files:**
- `gateway/src/memory/distiller.ts`
- `gateway/src/agent/injection-detector.ts`

Before storing distilled memories, scan for injection patterns:
```typescript
const { suspicious } = detectInjectionPatterns(distilledContent);
if (suspicious) {
  logger.warn({ patterns }, 'Injection patterns detected in distilled memory — discarding');
  return; // Don't store this memory
}
```

---

## Task 11: Migrate Legacy Encryption Salt (LOW S-05 from gateway audit)

**Fixes:** Gateway LOW S-05

**Files:**
- `gateway/src/db-config.ts`

Add a one-time migration: when decrypting with legacy format, re-encrypt with new format and save:
```typescript
if (isLegacyFormat) {
  const reEncrypted = encryptCredential(decrypted); // new format with random salt
  await prisma.gatewayConfig.update({ where: { id }, data: { anthropicApiKey: reEncrypted } });
}
```

---

## Task 12: Verify and Commit

- Run all gateway tests: `cd gateway && npx vitest run`
- Type check server: `cd apps/server && npx tsc --noEmit`
- Type check all MCP servers
- Push to GitHub

---

## Priority Order

| Priority | Tasks | Severity Fixed |
|----------|-------|---------------|
| 1 (do first) | Task 1 (shared Zod types) | HIGH H-02, H-03 |
| 2 | Task 5 (enum status fields) | MEDIUM M-06, M-07 |
| 3 | Task 6 (riskOwner audit) | HIGH H-04 |
| 4 | Task 2, 3, 4 (numeric + array + JSON bounds) | MEDIUM M-01 to M-05, M-09, M-10, LOW L-01 to L-06 |
| 5 | Task 9 (council rate limit) | MEDIUM 10-06 |
| 6 | Task 10 (memory injection scanning) | MEDIUM 01-06, 04-01 |
| 7 | Task 7, 8, 11 (error sanitization, PII patterns, legacy salt) | LOW |
