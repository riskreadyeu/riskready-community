# Risk Scenario System - Full Audit Report

**Date:** 2026-01-25
**Auditor:** Claude Code
**Scope:** End-to-end risk scenario flow from creation to completion
**Overall Assessment:** GOOD (7/10) - Functionally complete but needs security hardening and naming fixes

---

## Remediation Status (Updated 2026-01-25)

| Issue | Status | Notes |
|-------|--------|-------|
| **CRIT-1:** No role-based authorization | ⏸️ DEFERRED | Not needed for demo |
| **CRIT-2:** Field naming mismatch | ✅ MITIGATED | Comments added to clarify semantic meaning; DB rename deferred |
| **CRIT-3:** Non-transactional creation | ✅ FIXED | Create/update wrapped in transactions |
| **HIGH-1:** Dual calculation paths | ✅ FIXED | Removed duplicate code from risk-scenario.service.ts |
| **HIGH-2:** Incomplete override audit trail | ✅ FIXED | Added residualOverriddenById, residualOverriddenAt, residualPreviousScore fields |
| **HIGH-3:** Ambiguous tolerance sourcing | ⏸️ DEFERRED | Documented in code; needs spec clarification |

### Files Modified
- `prisma/schema/controls.prisma` - Added override audit fields, clarified F2/F3 comments
- `prisma/schema/auth.prisma` - Added ScenarioResidualOverriddenBy relation
- `apps/server/src/risks/services/risk-scenario.service.ts` - Removed duplicate code, added transactions, audit trail
- `apps/server/src/risks/services/risk-calculation.service.ts` - Added JSDoc for FactorScores
- `apps/web/src/lib/risks-api.ts` - Added JSDoc for FactorScores

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope and Methodology](#2-scope-and-methodology)
3. [Architecture Overview](#3-architecture-overview)
4. [Detailed Findings](#4-detailed-findings)
5. [Remediation Plan](#5-remediation-plan)
6. [Implementation Priority](#6-implementation-priority)
7. [Appendices](#7-appendices)

---

## 1. Executive Summary

### 1.1 Overall Status

| Area | Status | Score |
|------|--------|-------|
| Data Model | ✅ Complete | 9/10 |
| Business Logic | ✅ Complete | 8/10 |
| API Layer | ⚠️ Needs Work | 6/10 |
| Security | ❌ Critical Gap | 4/10 |
| Code Quality | ⚠️ Needs Work | 6/10 |
| Documentation | ✅ Good | 8/10 |

### 1.2 Critical Issues Requiring Immediate Attention

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| **CRIT-1** | No role-based authorization on API endpoints | 🔴 CRITICAL | Any authenticated user can modify any scenario |
| **CRIT-2** | Field naming mismatch (`f2ControlEffectiveness` stores Vulnerability) | 🟡 HIGH | Developer confusion, maintenance burden |
| **CRIT-3** | Non-transactional scenario creation | 🟡 HIGH | Partial records on calculation failure |

### 1.3 Key Metrics

- **Total Files Affected:** 45+
- **Lines of Code Analyzed:** ~8,000
- **Endpoints Audited:** 32
- **Critical Issues:** 3
- **High Priority Issues:** 5
- **Medium Priority Issues:** 8

---

## 2. Scope and Methodology

### 2.1 Components Audited

| Layer | Files | Coverage |
|-------|-------|----------|
| **Database Schema** | `prisma/schema/controls.prisma` (lines 755-980) | 100% |
| **Services** | `risk-scenario.service.ts`, `risk-calculation.service.ts`, `scenario-entity-resolver.service.ts` | 100% |
| **Controllers** | `risk-scenario.controller.ts` | 100% |
| **Frontend API** | `risks-api.ts`, `risk-lifecycle-api.ts` | 80% |
| **Frontend Components** | 12 components | 60% |

### 2.2 Flow Paths Traced

1. Scenario Creation → Factor Calculation → Score Update
2. Factor Score Update → Recalculation → Parent Risk Update
3. Impact Assessment Update → BIRT Calculation → Score Update
4. Tolerance Evaluation → Status Update → Escalation Trigger
5. State Transitions → Validation → Audit Trail
6. Control Linking → Effectiveness Fetch → Residual Calculation
7. Entity Linking (Asset/Vendor/Application) → Factor Derivation

---

## 3. Architecture Overview

### 3.1 Data Model Summary

```
RiskScenario (80+ fields)
├── Core: id, scenarioId, title, cause, event, consequence
├── State: status (10 states), toleranceStatus, toleranceThreshold
├── Factors (F1-F6): f1ThreatFrequency, f2ControlEffectiveness*, f3GapVulnerability*, etc.
├── Impacts (I1-I5): i1FinancialImpact through i5StrategicImpact
├── Scores: inherentScore, residualScore, calculatedResidualScore
├── Overrides: residualOverridden, f1Override, f2Override, etc.
└── Audit: createdById, updatedById, statusChangedById

* Note: f2 and f3 field names don't match actual semantic usage
```

### 3.2 Calculation Formula

```
INHERENT LIKELIHOOD:
  = (F1 × 34%) + (F2 × 33%) + (F3 × 33%)
  Where:
    F1 = Threat Frequency (1-5)
    F2 = Vulnerability/Ease of Exploit (1-5) [STORED AS f2ControlEffectiveness]
    F3 = Attack Surface (1-5) [STORED AS f3GapVulnerability]

INHERENT IMPACT:
  = MAX(I1, I2, I3, I4, I5) OR BIRT Weighted Average
  Where I1-I5 are 5 impact categories (1-5 each)

INHERENT SCORE:
  = Likelihood × Impact (1-25)

CONTROL EFFECTIVENESS REDUCTION:
  90-100% → VERY_STRONG: L-3, I-2
  80-89%  → STRONG:      L-2, I-1
  70-79%  → MODERATE:    L-1, I-1
  50-69%  → WEAK:        L-1, I-0
  0-49%   → NONE:        L-0, I-0

RESIDUAL SCORE:
  = (Likelihood - LReduction) × (Impact - IReduction)
  Where reductions come from linked control effectiveness
```

### 3.3 Service Responsibilities

| Service | Responsibility | LOC |
|---------|---------------|-----|
| `RiskScenarioService` | CRUD, factor scores, entity linking, state queries | 1,810 |
| `RiskCalculationService` | Factor derivation, score calculation, tolerance evaluation | 1,437 |
| `ScenarioEntityResolverService` | Resolve linked entities for factor calculation | 363 |
| `RiskStateMachineService` | State transitions, validation | 680 |
| `ToleranceEngineService` | Tolerance evaluation, escalation triggers | 450 |

---

## 4. Detailed Findings

### 4.1 CRIT-1: No Role-Based Authorization

**Severity:** 🔴 CRITICAL
**Location:** `apps/server/src/risks/controllers/risk-scenario.controller.ts`

**Current State:**
```typescript
// Line 24-26
@Controller('risk-scenarios')
@UseGuards(JwtAuthGuard)  // ← Only checks if user is authenticated
export class RiskScenarioController {
```

**Problem:**
All 32 endpoints only verify the user has a valid JWT token. Any authenticated user can:
- View any organization's risk scenarios
- Modify or delete any scenario
- Change risk scores and tolerance status
- Approve escalations

**Evidence:**
```typescript
// Line 47-74 - No org check, no role check
@Post()
async create(
  @Request() req: any,
  @Body() data: { ... },
) {
  return this.service.create({
    ...data,
    createdById: req.user.id,  // ← Only captures who, doesn't check permissions
  });
}
```

**Impact:**
- Data leakage between organizations
- Unauthorized risk modifications
- Compliance violations (SOC2, ISO 27001)

---

### 4.2 CRIT-2: Field Naming Mismatch

**Severity:** 🟡 HIGH
**Location:** Multiple files (45+ references)

**Current State:**
```prisma
// prisma/schema/controls.prisma:823-827
// F2: Control Effectiveness (from linked Controls/Capabilities)
f2ControlEffectiveness  Int?
f2Source                String?
f2Override              Boolean @default(false)
f2OverrideJustification String? @db.Text
```

**Actual Usage:**
```typescript
// risk-calculation.service.ts:494-499
// F2: Vulnerability / Ease of Exploit - How easy is it to exploit technically?
// (Technical difficulty, not control effectiveness)
const f2 = scenario.f2Override
  ? (scenario.f2ControlEffectiveness ?? 3)  // ← Name says "ControlEffectiveness"
  : this.calculateF2VulnerabilityExposure(scenario, ...); // ← Actually calculates vulnerability
```

**Problem:**
| Field Name | Schema Comment | Actual Semantic Meaning |
|------------|----------------|------------------------|
| `f2ControlEffectiveness` | "Control Effectiveness" | Vulnerability/Ease of Exploit |
| `f3GapVulnerability` | "Gap/Vulnerability" | Attack Surface |

**Files Requiring Update:** (45+ references found)
- `prisma/schema/controls.prisma`
- `prisma/schema/risks.prisma`
- `apps/server/src/risks/services/risk-calculation.service.ts`
- `apps/server/src/risks/services/risk-scenario.service.ts`
- `apps/web/src/lib/risks-api.ts`
- `apps/web/src/lib/risk-lifecycle-api.ts`
- `apps/web/src/components/risks/*.tsx` (12 files)
- Import templates and seed files

**Impact:**
- Developer confusion when reading code
- Maintenance burden
- Potential bugs from misunderstanding
- Documentation mismatch

---

### 4.3 CRIT-3: Non-Transactional Scenario Creation

**Severity:** 🟡 HIGH
**Location:** `apps/server/src/risks/services/risk-scenario.service.ts:208-277`

**Current State:**
```typescript
// Lines 236-277
async create(data: { ... }) {
  // Step 1: Create scenario (SUCCESS)
  const scenario = await this.prisma.riskScenario.create({ ... });

  // Step 2: Calculate scores (MAY FAIL)
  try {
    await this.riskCalculationService.calculateScenario(scenario.id, ...);
  } catch (error) {
    // Log but don't fail - scenario is created, scoring can be retried
    this.logger.warn(`Initial calculation failed: ${error.message}`);
  }

  // Step 3: Update parent risk (MAY FAIL)
  await this.riskService.recalculateScores(data.riskId);

  return scenario;  // ← Returns even if steps 2-3 failed
}
```

**Problem:**
If calculation fails after scenario creation:
1. Scenario exists with NULL scores
2. Parent risk scores may be stale
3. User sees incomplete data
4. No notification that calculation failed

**Impact:**
- Inconsistent data state
- User confusion
- Silent failures

---

### 4.4 HIGH-1: Dual Calculation Paths

**Severity:** 🟡 HIGH
**Location:** `risk-scenario.service.ts` and `risk-calculation.service.ts`

**Problem:**
Score calculation exists in two services:

```typescript
// risk-scenario.service.ts:19-35 - Has its own CONTROL_STRENGTH_REDUCTIONS
const CONTROL_STRENGTH_REDUCTIONS = {
  NONE: { likelihood: 0, impact: 0 },
  WEAK: { likelihood: 1, impact: 0 },
  // ...
};

// risk-calculation.service.ts:1150-1200 - Has canonical calculation
async calculateInherentFactors(...) { ... }
```

**Risk:**
Calculation logic could diverge between services, leading to inconsistent scores.

---

### 4.5 HIGH-2: Incomplete Override Audit Trail

**Severity:** 🟡 HIGH
**Location:** `prisma/schema/controls.prisma:800-803`

**Current State:**
```prisma
// Override tracking
residualOverridden            Boolean @default(false)
residualOverrideJustification String? @db.Text
// ← Missing: who overrode, when, what was the previous value
```

**Missing Fields:**
- `residualOverriddenById` - Who made the override
- `residualOverriddenAt` - When was it overridden
- `residualPreviousScore` - What was the calculated score before override

---

### 4.6 HIGH-3: Ambiguous Tolerance Sourcing

**Severity:** 🟡 HIGH
**Location:** `risk-calculation.service.ts`

**Problem:**
Unclear whether tolerance threshold comes from:
1. Parent risk's tolerance
2. Organisation's risk appetite
3. Scenario-specific override

**Code shows multiple sources used inconsistently.**

---

### 4.7 MEDIUM-1 to MEDIUM-8: Additional Issues

| ID | Issue | Location |
|----|-------|----------|
| MEDIUM-1 | Entity mapping inconsistency | `scenario-entity-resolver.service.ts` - Controls handled differently than Assets |
| MEDIUM-2 | Missing IncidentScenario usage | Junction table exists but no integration |
| MEDIUM-3 | Missing RiskScenarioKRI usage | Junction table exists but no integration |
| MEDIUM-4 | No validation on factor score range | API accepts any integer |
| MEDIUM-5 | Hardcoded factor weights | Should be configurable per org |
| MEDIUM-6 | No bulk update capability | Must update scenarios one by one |
| MEDIUM-7 | Missing scenario comparison API | No diff between versions |
| MEDIUM-8 | No webhook/event emission | External systems can't subscribe to changes |

---

## 5. Remediation Plan

### 5.1 CRIT-1 Fix: Add Role-Based Authorization

**Effort:** 2-3 days
**Risk:** Medium (requires testing all endpoints)

#### Step 1: Create Authorization Guard

**File:** `apps/server/src/auth/guards/risk-authorization.guard.ts` (NEW)

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export enum RiskPermission {
  VIEW_SCENARIOS = 'risk:scenarios:view',
  CREATE_SCENARIOS = 'risk:scenarios:create',
  UPDATE_SCENARIOS = 'risk:scenarios:update',
  DELETE_SCENARIOS = 'risk:scenarios:delete',
  APPROVE_ESCALATIONS = 'risk:escalations:approve',
  OVERRIDE_SCORES = 'risk:scores:override',
}

export const RequirePermissions = (...permissions: RiskPermission[]) =>
  SetMetadata('permissions', permissions);

@Injectable()
export class RiskAuthorizationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<RiskPermission[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Get user's role and org
    const userWithRole = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { organisationProfile: true, governanceRoles: true },
    });

    // Check if resource belongs to user's org
    const resourceId = request.params.id;
    if (resourceId) {
      const scenario = await this.prisma.riskScenario.findUnique({
        where: { id: resourceId },
        include: { risk: { select: { organisationId: true } } },
      });

      if (scenario?.risk.organisationId !== userWithRole?.organisationId) {
        throw new ForbiddenException('Cannot access resources from another organization');
      }
    }

    // Check permissions based on governance role
    const hasPermission = this.checkPermissions(userWithRole, requiredPermissions);
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private checkPermissions(user: any, required: RiskPermission[]): boolean {
    // Implementation based on UserGovernanceRole
    // Map roles to permissions
    const rolePermissions = {
      RISK_OWNER: [RiskPermission.VIEW_SCENARIOS, RiskPermission.CREATE_SCENARIOS,
                   RiskPermission.UPDATE_SCENARIOS, RiskPermission.APPROVE_ESCALATIONS],
      RISK_MANAGER: [RiskPermission.VIEW_SCENARIOS, RiskPermission.CREATE_SCENARIOS,
                     RiskPermission.UPDATE_SCENARIOS, RiskPermission.DELETE_SCENARIOS,
                     RiskPermission.OVERRIDE_SCORES],
      RISK_ANALYST: [RiskPermission.VIEW_SCENARIOS, RiskPermission.CREATE_SCENARIOS,
                     RiskPermission.UPDATE_SCENARIOS],
      RISK_VIEWER: [RiskPermission.VIEW_SCENARIOS],
    };

    // Check if user's roles grant all required permissions
    const userPermissions = new Set<RiskPermission>();
    for (const role of user.governanceRoles || []) {
      const perms = rolePermissions[role.roleCode] || [];
      perms.forEach(p => userPermissions.add(p));
    }

    return required.every(p => userPermissions.has(p));
  }
}
```

#### Step 2: Apply Guard to Controller

**File:** `apps/server/src/risks/controllers/risk-scenario.controller.ts`

```typescript
// Add imports
import { RiskAuthorizationGuard, RequirePermissions, RiskPermission }
  from '../../auth/guards/risk-authorization.guard';

@Controller('risk-scenarios')
@UseGuards(JwtAuthGuard, RiskAuthorizationGuard)  // ← Add RiskAuthorizationGuard
export class RiskScenarioController {

  @Get()
  @RequirePermissions(RiskPermission.VIEW_SCENARIOS)  // ← Add decorator
  async findAll(...) { ... }

  @Post()
  @RequirePermissions(RiskPermission.CREATE_SCENARIOS)  // ← Add decorator
  async create(...) { ... }

  @Put(':id')
  @RequirePermissions(RiskPermission.UPDATE_SCENARIOS)  // ← Add decorator
  async update(...) { ... }

  @Delete(':id')
  @RequirePermissions(RiskPermission.DELETE_SCENARIOS)  // ← Add decorator
  async delete(...) { ... }

  @Put(':id/override-scores')
  @RequirePermissions(RiskPermission.OVERRIDE_SCORES)  // ← Add decorator
  async overrideScores(...) { ... }
}
```

#### Step 3: Add Org Filtering to Service

**File:** `apps/server/src/risks/services/risk-scenario.service.ts`

```typescript
// Update findAll to filter by org
async findAll(params: {
  skip?: number;
  take?: number;
  organisationId: string;  // ← Add required org filter
}) {
  const [results, count] = await this.prisma.$transaction([
    this.prisma.riskScenario.findMany({
      skip: params.skip,
      take: params.take ?? 50,
      where: {
        risk: { organisationId: params.organisationId },  // ← Filter by org
      },
      // ... rest
    }),
    this.prisma.riskScenario.count({
      where: {
        risk: { organisationId: params.organisationId },
      },
    }),
  ]);
  return { results, count };
}
```

---

### 5.2 CRIT-2 Fix: Rename Factor Fields

**Effort:** 3-4 days
**Risk:** High (database migration, many file changes)

#### Approach: Database Column Alias + Code Migration

**Phase 1: Add New Columns (Non-Breaking)**

**File:** `prisma/migrations/YYYYMMDD_rename_factor_fields/migration.sql`

```sql
-- Add new columns with correct names (copy existing data)
ALTER TABLE "RiskScenario" ADD COLUMN "f2VulnerabilityExposure" INTEGER;
ALTER TABLE "RiskScenario" ADD COLUMN "f3AttackSurface" INTEGER;

-- Copy data
UPDATE "RiskScenario" SET "f2VulnerabilityExposure" = "f2ControlEffectiveness";
UPDATE "RiskScenario" SET "f3AttackSurface" = "f3GapVulnerability";

-- Add comment to old columns
COMMENT ON COLUMN "RiskScenario"."f2ControlEffectiveness" IS 'DEPRECATED: Use f2VulnerabilityExposure';
COMMENT ON COLUMN "RiskScenario"."f3GapVulnerability" IS 'DEPRECATED: Use f3AttackSurface';
```

**Phase 2: Update Code to Use New Fields**

Files to update (in order):

1. **Schema:** `prisma/schema/controls.prisma`
```prisma
// OLD (line 823-827)
// F2: Control Effectiveness (from linked Controls/Capabilities)
f2ControlEffectiveness  Int?

// NEW
// F2: Vulnerability/Ease of Exploit - Technical difficulty to exploit
f2VulnerabilityExposure Int?
f2ControlEffectiveness  Int? @map("f2ControlEffectiveness") // DEPRECATED - alias for migration
```

2. **Service:** `apps/server/src/risks/services/risk-calculation.service.ts`
```typescript
// Line 62 - Update interface
interface FactorScores {
  f1ThreatFrequency: number;
  f2VulnerabilityExposure: number;  // ← Renamed
  f3AttackSurface: number;          // ← Renamed
  f4IncidentHistory: number;
  f5ExternalExposure: number;
  f6Environmental: number;
}

// Line 529 - Update return
return {
  f1ThreatFrequency: this.clampFactor(f1),
  f2VulnerabilityExposure: this.clampFactor(f2),  // ← Renamed
  f3AttackSurface: this.clampFactor(f3),          // ← Renamed
  // ...
};
```

3. **Frontend Types:** `apps/web/src/lib/risks-api.ts`
```typescript
// Line 192 - Update interface
export interface ScenarioFactorScores {
  f1ThreatFrequency?: number;
  f2VulnerabilityExposure?: number;  // ← Renamed (add alias for backwards compat)
  /** @deprecated Use f2VulnerabilityExposure */
  f2ControlEffectiveness?: number;
  f3AttackSurface?: number;          // ← Renamed
  /** @deprecated Use f3AttackSurface */
  f3GapVulnerability?: number;
  // ...
}
```

4. **Frontend Components:** (12 files)
   - `RiskAssessmentCalculator.tsx`
   - `ResidualRiskPanel.tsx`
   - `FactorScoreVisualization.tsx`
   - `EvidenceBackedFactorEditor.tsx`
   - `LikelihoodSummaryCard.tsx`
   - `LikelihoodFactorScoreEditor.tsx`
   - `ResidualLikelihoodCard.tsx`
   - `CollapsibleResidualRiskCard.tsx`
   - `ResidualLikelihoodSheet.tsx`
   - `RiskScenarioDetailPage.tsx`

**Phase 3: Remove Old Columns (After 30 days)**

```sql
-- Migration to remove deprecated columns
ALTER TABLE "RiskScenario" DROP COLUMN "f2ControlEffectiveness";
ALTER TABLE "RiskScenario" DROP COLUMN "f3GapVulnerability";
```

---

### 5.3 CRIT-3 Fix: Make Creation Transactional

**Effort:** 0.5 days
**Risk:** Low

**File:** `apps/server/src/risks/services/risk-scenario.service.ts`

```typescript
// Replace lines 208-277 with:
async create(data: {
  scenarioId: string;
  title: string;
  // ... other fields
}) {
  // Check for duplicate scenarioId
  const existing = await this.prisma.riskScenario.findFirst({
    where: { scenarioId: data.scenarioId },
  });
  if (existing) {
    throw new ConflictException(`Scenario with ID ${data.scenarioId} already exists`);
  }

  // Use transaction to ensure atomic creation + calculation
  const result = await this.prisma.$transaction(async (tx) => {
    // Step 1: Create scenario
    const scenario = await tx.riskScenario.create({
      data: {
        scenarioId: data.scenarioId,
        title: data.title,
        cause: data.cause,
        event: data.event,
        consequence: data.consequence,
        framework: data.framework || 'ISO',
        likelihood: data.likelihood,
        impact: data.impact,
        residualLikelihood: data.residualLikelihood,
        residualImpact: data.residualImpact,
        sleLow: data.sleLow,
        sleLikely: data.sleLikely,
        sleHigh: data.sleHigh,
        aro: data.aro,
        ale: data.ale,
        controlIds: data.controlIds,
        riskId: data.riskId,
        createdById: data.createdById,
      },
      include: {
        risk: { select: { id: true, riskId: true, title: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    // Step 2: Calculate scores within same transaction
    // Note: RiskCalculationService needs to accept tx parameter
    await this.riskCalculationService.calculateScenarioWithTx(
      tx,
      scenario.id,
      'MANUAL',
      undefined,
      data.createdById
    );

    return scenario;
  });

  // Step 3: Update parent risk scores (outside transaction is OK)
  await this.riskService.recalculateScores(data.riskId);

  return result;
}
```

**Also update:** `apps/server/src/risks/services/risk-calculation.service.ts`

```typescript
// Add transaction-aware method
async calculateScenarioWithTx(
  tx: Prisma.TransactionClient,
  scenarioId: string,
  trigger: string,
  triggerSource?: string,
  userId?: string,
) {
  // Same logic as calculateScenario but use tx instead of this.prisma
  // ...
}
```

---

### 5.4 HIGH-1 Fix: Consolidate Calculation Logic

**Effort:** 1 day
**Risk:** Medium

**File:** `apps/server/src/risks/services/risk-scenario.service.ts`

```typescript
// REMOVE lines 19-51 (duplicate constants)
// DELETE:
// const CONTROL_STRENGTH_REDUCTIONS = { ... };
// function scoreToStrength(...) { ... }
// function valueToLikelihoodLevel(...) { ... }
// function valueToImpactLevel(...) { ... }

// INSTEAD import from risk-calculation.service.ts or shared utils:
import {
  CONTROL_STRENGTH_REDUCTIONS,
  scoreToStrength,
  valueToLikelihoodLevel,
  valueToImpactLevel,
} from './risk-calculation.service';
```

---

### 5.5 HIGH-2 Fix: Add Override Audit Trail

**Effort:** 0.5 days
**Risk:** Low

**File:** `prisma/schema/controls.prisma` (add at line 803)

```prisma
// Override tracking - ENHANCED
residualOverridden            Boolean   @default(false)
residualOverrideJustification String?   @db.Text
residualOverriddenById        String?   // ← NEW
residualOverriddenBy          User?     @relation("ScenarioOverriddenBy", fields: [residualOverriddenById], references: [id], onDelete: SetNull)
residualOverriddenAt          DateTime? // ← NEW
residualPreviousScore         Int?      // ← NEW: What was the calculated score
```

**Update service to populate these fields when override happens.**

---

### 5.6 HIGH-3 Fix: Clarify Tolerance Sourcing

**Effort:** 0.5 days
**Risk:** Low

**File:** `apps/server/src/risks/services/risk-calculation.service.ts`

Add clear documentation and single source of truth:

```typescript
/**
 * Get tolerance threshold for a scenario.
 *
 * Priority order:
 * 1. Scenario-level override (if set)
 * 2. Parent risk's tolerance threshold
 * 3. Organisation's default risk appetite threshold
 *
 * @param scenarioId - The scenario to get tolerance for
 * @returns The applicable tolerance threshold (1-25)
 */
async getToleranceThreshold(scenarioId: string): Promise<number> {
  const scenario = await this.prisma.riskScenario.findUnique({
    where: { id: scenarioId },
    include: {
      risk: {
        include: {
          organisation: {
            include: { riskAppetite: true },
          },
        },
      },
    },
  });

  // 1. Scenario override
  if (scenario.toleranceThreshold !== null) {
    return scenario.toleranceThreshold;
  }

  // 2. Parent risk threshold
  if (scenario.risk.toleranceThreshold !== null) {
    return scenario.risk.toleranceThreshold;
  }

  // 3. Organisation default
  const appetite = scenario.risk.organisation.riskAppetite;
  return appetite?.defaultThreshold ?? 12; // Default to 12 if nothing set
}
```

---

## 6. Implementation Priority

### 6.1 Sprint 1 (Week 1) - Critical Security

| Task | Effort | Owner |
|------|--------|-------|
| CRIT-1: Implement RiskAuthorizationGuard | 2 days | Backend |
| CRIT-1: Apply to all controller endpoints | 0.5 days | Backend |
| CRIT-1: Add org filtering to service methods | 0.5 days | Backend |
| **Total** | **3 days** | |

### 6.2 Sprint 2 (Week 2) - Data Integrity

| Task | Effort | Owner |
|------|--------|-------|
| CRIT-3: Make creation transactional | 0.5 days | Backend |
| CRIT-3: Add tx parameter to calculation service | 0.5 days | Backend |
| HIGH-1: Consolidate calculation logic | 1 day | Backend |
| HIGH-2: Add override audit fields | 0.5 days | Backend |
| HIGH-3: Clarify tolerance sourcing | 0.5 days | Backend |
| **Total** | **3 days** | |

### 6.3 Sprint 3-4 (Weeks 3-4) - Field Naming

| Task | Effort | Owner |
|------|--------|-------|
| CRIT-2 Phase 1: Add new columns, copy data | 0.5 days | Backend |
| CRIT-2 Phase 2: Update backend services | 1 day | Backend |
| CRIT-2 Phase 2: Update frontend types | 0.5 days | Frontend |
| CRIT-2 Phase 2: Update frontend components | 2 days | Frontend |
| CRIT-2: Update tests | 1 day | QA |
| **Total** | **5 days** | |

### 6.4 Future Sprints - Medium Priority

| Task | Effort | Sprint |
|------|--------|--------|
| MEDIUM-1: Standardize entity mapping | 1 day | 5 |
| MEDIUM-2: Implement IncidentScenario integration | 2 days | 5 |
| MEDIUM-3: Implement RiskScenarioKRI integration | 2 days | 6 |
| MEDIUM-4: Add factor score validation | 0.5 days | 6 |
| MEDIUM-5: Make factor weights configurable | 1 day | 7 |
| MEDIUM-6: Add bulk update API | 1 day | 7 |
| MEDIUM-7: Add scenario comparison API | 2 days | 8 |
| MEDIUM-8: Add event emission | 2 days | 8 |

---

## 7. Appendices

### 7.1 All Files Requiring Changes

#### CRIT-1 (Authorization)
- `apps/server/src/auth/guards/risk-authorization.guard.ts` (NEW)
- `apps/server/src/risks/controllers/risk-scenario.controller.ts`
- `apps/server/src/risks/services/risk-scenario.service.ts`

#### CRIT-2 (Field Naming)
```
Backend (15 files):
- prisma/schema/controls.prisma
- prisma/schema/risks.prisma
- apps/server/src/risks/services/risk-calculation.service.ts
- apps/server/src/risks/services/risk-scenario.service.ts
- apps/server/src/risks/services/assessment-versioning.service.ts
- apps/server/src/risks/services/risk-state-machine.service.ts
- apps/server/src/risks/controllers/risk-scenario.controller.ts
- apps/server/prisma/seed/risks/seed-risks.ts
- apps/server/prisma/seed/risks/import-risk-register.ts
- apps/server/prisma/seed/grc-import/import-grc-data.ts
- apps/server/src/risks/services/risk-scenario.service.spec.ts
- apps/server/src/risks/services/risk-calculation.service.spec.ts
- apps/server/src/risks/services/risk-state-machine.service.spec.ts
- apps/server/src/risks/integration/risk-scenario-flow.integration.spec.ts
- apps/server/prisma/debug-check.ts

Frontend (14 files):
- apps/web/src/lib/risks-api.ts
- apps/web/src/lib/risk-lifecycle-api.ts
- apps/web/src/components/risks/RiskAssessmentCalculator.tsx
- apps/web/src/components/risks/ResidualRiskPanel.tsx
- apps/web/src/components/risks/FactorScoreVisualization.tsx
- apps/web/src/components/risks/EvidenceBackedFactorEditor.tsx
- apps/web/src/components/risks/LikelihoodSummaryCard.tsx
- apps/web/src/components/risks/LikelihoodFactorScoreEditor.tsx
- apps/web/src/components/risks/ResidualLikelihoodCard.tsx
- apps/web/src/components/risks/CollapsibleResidualRiskCard.tsx
- apps/web/src/components/risks/ResidualLikelihoodSheet.tsx
- apps/web/src/pages/risks/RiskScenarioDetailPage.tsx

Documentation (5 files):
- docs/import-templates/04-likelihood-factors.csv
- docs/import-templates/README.md
- docs/architecture/risk-management/05-risk-scenario-system.md
- docs/architecture/risk-management/04-risk-scenarios.md
- docs/RISK_SCENARIO_SCORE_CALCULATION.md
```

#### CRIT-3 (Transactional)
- `apps/server/src/risks/services/risk-scenario.service.ts`
- `apps/server/src/risks/services/risk-calculation.service.ts`

### 7.2 Testing Requirements

| Fix | Test Type | Coverage |
|-----|-----------|----------|
| CRIT-1 | Integration | All 32 endpoints with different roles |
| CRIT-1 | Unit | Guard logic, permission mapping |
| CRIT-2 | E2E | Factor scoring flow |
| CRIT-2 | Unit | All services using factor fields |
| CRIT-3 | Integration | Create with calculation failure |
| CRIT-3 | Unit | Transaction rollback behavior |

### 7.3 Rollback Plan

**CRIT-1:** Remove guard from controller, redeploy
**CRIT-2:** Phase 1 is non-breaking; Phase 3 requires data restore from backup
**CRIT-3:** Revert service file to previous version

---

**Report Generated:** 2026-01-25
**Next Review Date:** 2026-02-25
**Document Version:** 1.0
