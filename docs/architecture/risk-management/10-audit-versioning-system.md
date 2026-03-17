# Audit & Versioning System Architecture

## Overview

The Audit & Versioning system provides comprehensive tracking of risk assessment changes, immutable snapshots for compliance, version comparison, and complete audit trails. It supports regulatory requirements for change history, approval tracking, and point-in-time reporting.

---

## 1. Assessment Versioning

### Purpose

Assessment versioning creates immutable snapshots of risk state at specific points in time:
- Periodic reviews (QUARTERLY, ANNUAL)
- Before significant modifications
- Regulatory audit checkpoints
- Board reporting dates

### AssessmentSnapshot Entity

**Location:** `prisma/schema/controls.prisma`

#### Core Fields
| Field | Type | Purpose |
|-------|------|---------|
| `id` | String (CUID) | Primary key |
| `riskId` | String (FK) | Parent risk |
| `version` | Int | Sequential version number |
| `snapshotDate` | DateTime | When snapshot created |
| `reason` | SnapshotReason | Why created |
| `notes` | String? | Additional notes |

#### Score Fields
| Field | Type | Purpose |
|-------|------|---------|
| `inherentScore` | Int? | Inherent risk score at snapshot |
| `residualScore` | Int? | Residual risk score at snapshot |
| `likelihood` | LikelihoodLevel? | Likelihood at snapshot |
| `impact` | ImpactLevel? | Impact at snapshot |

#### Serialized Data
| Field | Type | Purpose |
|-------|------|---------|
| `scenarioData` | Json | All scenarios with factors/impacts |
| `treatmentData` | Json | Treatment plans and actions |
| `controlData` | Json | Linked controls |
| `kriData` | Json | KRIs and recent values |

#### Approval Fields
| Field | Type | Purpose |
|-------|------|---------|
| `createdById` | String (FK) | User who created snapshot |
| `approvedById` | String? (FK) | User who approved (if required) |
| `approvedAt` | DateTime? | Approval timestamp |

### SnapshotReason Enum

| Reason | Description |
|--------|-------------|
| `PERIODIC_REVIEW` | Scheduled review (quarterly, annual) |
| `BEFORE_MODIFICATION` | Auto-created before major changes |
| `REGULATORY_CHECKPOINT` | Regulatory audit point |
| `BOARD_REPORTING` | Board meeting reporting |
| `MANUAL` | User-initiated snapshot |
| `TREATMENT_COMPLETED` | After treatment completion |
| `ESCALATION` | During escalation process |

### Creating Snapshots

```typescript
async createSnapshot(data: SnapshotData): Promise<{ id: string; version: number }> {
  // 1. Fetch complete risk state with all relationships
  const risk = await prisma.risk.findUnique({
    where: { id: data.riskId },
    include: {
      scenarios: {
        include: {
          assetLinks: { include: { asset: true } },
          vendorLinks: { include: { vendor: true } },
          applicationLinks: { include: { application: true } },
          controlLinks: { include: { control: true } },
        },
      },
      treatmentPlans: { include: { actions: true } },
      controls: { select: { id: true, controlId: true, name: true } },
      kris: { include: { history: { orderBy: { measuredAt: 'desc' }, take: 5 } } },
    },
  });

  // 2. Get next version number
  const lastSnapshot = await prisma.assessmentSnapshot.findFirst({
    where: { riskId: data.riskId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const nextVersion = (lastSnapshot?.version ?? 0) + 1;

  // 3. Serialize current state
  const scenarioData = serializeScenarios(risk.scenarios);
  const treatmentData = serializeTreatments(risk.treatmentPlans);
  const controlData = serializeControls(risk.controls);
  const kriData = serializeKRIs(risk.kris);

  // 4. Calculate aggregate scores from active scenarios
  const activeScenarios = risk.scenarios.filter(s => s.status !== 'CLOSED' && s.status !== 'ARCHIVED');
  const inherentScore = Math.max(...activeScenarios.map(s => s.inherentScore ?? 0));
  const residualScore = Math.max(...activeScenarios.map(s => s.residualScore ?? 0));

  // 5. Create snapshot
  const snapshot = await prisma.assessmentSnapshot.create({
    data: {
      riskId: data.riskId,
      version: nextVersion,
      inherentScore,
      residualScore,
      likelihood: risk.likelihood,
      impact: risk.impact,
      scenarioData,
      treatmentData,
      controlData,
      kriData,
      reason: data.reason,
      notes: data.notes,
      createdById: data.createdById,
      approvedById: data.approvedById,
      approvedAt: data.approvedById ? new Date() : null,
    },
  });

  return { id: snapshot.id, version: nextVersion };
}
```

### Serialized Scenario Format

```json
{
  "id": "scenario-123",
  "title": "Data Breach Scenario",
  "description": "Unauthorized access to customer data",
  "status": "EVALUATED",
  "inherentScore": 16,
  "residualScore": 10,
  "factors": {
    "f1": 4,
    "f2": 3,
    "f3": 4,
    "f4": 2,
    "f5": 3,
    "f6": null
  },
  "impacts": {
    "i1": 4,
    "i2": 3,
    "i3": 4,
    "i4": 3,
    "i5": 2
  },
  "linkedAssets": [
    { "id": "asset-1", "name": "Customer Database" }
  ],
  "linkedVendors": [
    { "id": "vendor-1", "name": "Cloud Provider" }
  ],
  "linkedControls": [
    { "id": "ctrl-1", "name": "Access Control" }
  ]
}
```

---

## 2. Version Comparison

### Comparison Interface

```typescript
interface SnapshotComparison {
  field: string;
  category: 'score' | 'scenario' | 'treatment' | 'control' | 'kri';
  previousValue: unknown;
  currentValue: unknown;
  changeType: 'increased' | 'decreased' | 'added' | 'removed' | 'modified';
  significance: 'critical' | 'high' | 'medium' | 'low';
}
```

### Compare Versions

```typescript
async compareVersions(riskId: string, fromVersion: number, toVersion: number): Promise<SnapshotComparison[]> {
  const [fromSnapshot, toSnapshot] = await Promise.all([
    getSnapshot(riskId, fromVersion),
    getSnapshot(riskId, toVersion),
  ]);

  const comparisons: SnapshotComparison[] = [];

  // Compare scores
  compareScores(fromSnapshot, toSnapshot, comparisons);

  // Compare scenarios
  compareScenarios(fromSnapshot.scenarioData, toSnapshot.scenarioData, comparisons);

  // Compare treatments
  compareTreatments(fromSnapshot.treatmentData, toSnapshot.treatmentData, comparisons);

  // Compare controls
  compareControls(fromSnapshot.controlData, toSnapshot.controlData, comparisons);

  return comparisons;
}
```

### Score Comparison Logic

```typescript
if (from.inherentScore !== to.inherentScore) {
  const change = (to.inherentScore ?? 0) - (from.inherentScore ?? 0);
  comparisons.push({
    field: 'inherentScore',
    category: 'score',
    previousValue: from.inherentScore,
    currentValue: to.inherentScore,
    changeType: change > 0 ? 'increased' : 'decreased',
    significance: Math.abs(change) > 4 ? 'critical' : Math.abs(change) > 2 ? 'high' : 'medium',
  });
}
```

### Significance Levels

| Change Type | Significance |
|-------------|--------------|
| Score change > 4 | `critical` |
| Score change 3-4 | `high` |
| Score change 1-2 | `medium` |
| Scenario added/removed | `high` |
| Treatment status → COMPLETED | `high` |
| Treatment added/removed | `medium` |
| Control added/removed | `high` |
| Control effectiveness change | `medium` |

---

## 3. Version History

### Getting History

```typescript
async getVersionHistory(riskId: string): Promise<VersionHistory[]> {
  const snapshots = await prisma.assessmentSnapshot.findMany({
    where: { riskId },
    orderBy: { version: 'desc' },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  return snapshots.map(s => ({
    version: s.version,
    snapshotDate: s.snapshotDate,
    reason: s.reason,
    inherentScore: s.inherentScore,
    residualScore: s.residualScore,
    createdBy: s.createdBy,
    approvedBy: s.approvedBy,
    approvedAt: s.approvedAt,
  }));
}
```

### VersionHistory Interface

```typescript
interface VersionHistory {
  version: number;
  snapshotDate: Date;
  reason: SnapshotReason;
  inherentScore: number | null;
  residualScore: number | null;
  createdBy: { id: string; firstName: string | null; lastName: string | null; email: string };
  approvedBy: { ... } | null;
  approvedAt: Date | null;
}
```

---

## 4. Snapshot Approval

### Approving Snapshots

```typescript
async approveSnapshot(riskId: string, version: number, approvedById: string, notes?: string): Promise<void> {
  await prisma.assessmentSnapshot.update({
    where: { riskId_version: { riskId, version } },
    data: {
      approvedById,
      approvedAt: new Date(),
      notes: notes ? `${existingNotes}\n[Approval Note] ${notes}` : undefined,
    },
  });
}
```

### Getting Latest Approved

```typescript
async getLatestApprovedSnapshot(riskId: string) {
  return prisma.assessmentSnapshot.findFirst({
    where: {
      riskId,
      approvedAt: { not: null },
    },
    orderBy: { version: 'desc' },
  });
}
```

---

## 5. Audit Trail

### Audit Entry Structure

```typescript
interface AuditEntry {
  id: string;
  timestamp: Date;
  entityType: 'RISK' | 'SCENARIO' | 'TREATMENT' | 'KRI' | 'ACCEPTANCE';
  entityId: string;
  action: string;
  actorId: string | null;
  actorEmail: string | null;
  details: Record<string, unknown>;
}
```

### Audit Sources

The audit trail aggregates from multiple tables:

| Source Table | Entry Type | Actions Captured |
|--------------|------------|------------------|
| `ScenarioStateHistory` | SCENARIO | STATE_TRANSITION: DRAFT → ASSESSED |
| `RiskCalculationHistory` | SCENARIO | SCORE_CALCULATED: CONTROL_TESTED |
| `AssessmentSnapshot` | RISK | SNAPSHOT_CREATED: PERIODIC_REVIEW |
| `KRIHistory` | KRI | KRI_MEASURED: RED |

### Getting Audit Trail

```typescript
async getRiskAuditTrail(riskId: string, options?: {
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ entries: AuditEntry[]; total: number }> {
  const entries: AuditEntry[] = [];

  // 1. Get scenario state history
  const stateHistory = await prisma.scenarioStateHistory.findMany({
    where: { scenario: { riskId }, createdAt: { gte: startDate, lte: endDate } },
    include: { actor: { select: { id: true, email: true } } },
  });
  // ... map to AuditEntry

  // 2. Get calculation history
  const calculationHistory = await prisma.riskCalculationHistory.findMany({
    where: { scenario: { riskId } },
    include: { calculatedBy: { select: { id: true, email: true } } },
  });
  // ... map to AuditEntry

  // 3. Get assessment snapshots
  const snapshots = await prisma.assessmentSnapshot.findMany({
    where: { riskId },
    include: { createdBy: { select: { id: true, email: true } } },
  });
  // ... map to AuditEntry

  // 4. Get KRI history
  const kriHistory = await prisma.kRIHistory.findMany({
    where: { kri: { riskId } },
  });
  // ... map to AuditEntry

  // Sort all entries by timestamp descending
  entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    entries: entries.slice(offset, offset + limit),
    total: entries.length,
  };
}
```

### Audit Summary

```typescript
async getRiskAuditSummary(riskId: string, days: number = 30): Promise<AuditSummary> {
  const { entries, total } = await getRiskAuditTrail(riskId, { startDate: daysAgo(days) });

  const byEntityType: Record<string, number> = {};
  const byAction: Record<string, number> = {};

  for (const entry of entries) {
    byEntityType[entry.entityType] = (byEntityType[entry.entityType] || 0) + 1;
    const actionType = entry.action.split(':')[0];
    byAction[actionType] = (byAction[actionType] || 0) + 1;
  }

  return {
    totalChanges: total,
    byEntityType,
    byAction,
    recentChanges: entries.slice(0, 10),
  };
}
```

### Organization-Wide Audit Summary

```typescript
async getOrganizationAuditSummary(organisationId: string, days: number = 7): Promise<{
  totalChanges: number;
  stateTransitions: number;
  calculations: number;
  snapshots: number;
  kriMeasurements: number;
  topChangedRisks: { riskId: string; title: string; changeCount: number }[];
}> {
  const [stateTransitions, calculations, snapshots, kriMeasurements] = await Promise.all([
    prisma.scenarioStateHistory.count({
      where: { scenario: { risk: { organisationId } }, createdAt: { gte: startDate } },
    }),
    prisma.riskCalculationHistory.count({
      where: { scenario: { risk: { organisationId } }, calculatedAt: { gte: startDate } },
    }),
    prisma.assessmentSnapshot.count({
      where: { risk: { organisationId }, snapshotDate: { gte: startDate } },
    }),
    prisma.kRIHistory.count({
      where: { kri: { risk: { organisationId } }, measuredAt: { gte: startDate } },
    }),
  ]);

  // Get top changed risks by grouping scenario state changes
  const riskChanges = await prisma.scenarioStateHistory.groupBy({
    by: ['scenarioId'],
    where: { scenario: { risk: { organisationId } }, createdAt: { gte: startDate } },
    _count: true,
    orderBy: { _count: { scenarioId: 'desc' } },
    take: 5,
  });

  return {
    totalChanges: stateTransitions + calculations + snapshots + kriMeasurements,
    stateTransitions,
    calculations,
    snapshots,
    kriMeasurements,
    topChangedRisks: /* mapped from riskChanges */,
  };
}
```

---

## 6. Scenario Audit Trail

### Getting Scenario-Specific Audit

```typescript
async getScenarioAuditTrail(scenarioId: string, limit: number = 50): Promise<AuditEntry[]> {
  const entries: AuditEntry[] = [];

  // State history
  const stateHistory = await prisma.scenarioStateHistory.findMany({
    where: { scenarioId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  for (const history of stateHistory) {
    entries.push({
      id: history.id,
      timestamp: history.createdAt,
      entityType: 'SCENARIO',
      entityId: scenarioId,
      action: `STATE_TRANSITION: ${history.fromStatus || 'INITIAL'} → ${history.toStatus}`,
      actorId: history.actorId,
      actorEmail: history.actor?.email,
      details: {
        transitionCode: history.transitionCode,
        fromStatus: history.fromStatus,
        toStatus: history.toStatus,
        notes: history.notes,
      },
    });
  }

  // Calculation history
  const calcHistory = await prisma.riskCalculationHistory.findMany({
    where: { scenarioId },
    orderBy: { calculatedAt: 'desc' },
    take: limit,
  });

  for (const calc of calcHistory) {
    entries.push({
      id: calc.id,
      timestamp: calc.calculatedAt,
      entityType: 'SCENARIO',
      entityId: scenarioId,
      action: `SCORE_CALCULATED: ${calc.trigger}`,
      actorId: calc.calculatedById,
      details: {
        trigger: calc.trigger,
        inherentScore: calc.inherentScore,
        residualScore: calc.residualScore,
      },
    });
  }

  entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return entries.slice(0, limit);
}
```

---

## 7. Auto-Snapshot Triggers

### Pre-Modification Snapshots

```typescript
// Called before significant changes
async createPreModificationSnapshot(riskId: string, userId: string): Promise<void> {
  await createSnapshot({
    riskId,
    reason: 'BEFORE_MODIFICATION',
    notes: 'Auto-created before modification',
    createdById: userId,
  });
}
```

### Review Completion Snapshots

```typescript
// Called by ReviewSchedulerService.completeReview()
if (schedule.createSnapshotOnReview) {
  await assessmentVersioningService.createSnapshot({
    riskId: data.riskId,
    reason: 'PERIODIC_REVIEW',
    notes: data.notes ?? 'Periodic review completed',
    createdById: data.reviewerId,
  });
}
```

---

## 8. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/risks/:id/versions` | Get version history |
| GET | `/risks/:id/versions/:version` | Get specific snapshot |
| POST | `/risks/:id/versions` | Create snapshot |
| PUT | `/risks/:id/versions/:version/approve` | Approve snapshot |
| GET | `/risks/:id/versions/compare` | Compare two versions |
| GET | `/risks/:id/versions/latest-approved` | Get latest approved |
| GET | `/risks/:id/audit` | Get audit trail |
| GET | `/risks/:id/audit/summary` | Get audit summary |
| GET | `/scenarios/:id/audit` | Get scenario audit trail |
| GET | `/audit/organisation` | Get org-wide audit summary |

---

## 9. Implementation Status

### Fully Implemented ✅
- Snapshot creation with full state serialization
- Version numbering and history
- Snapshot approval workflow
- Version comparison with significance levels
- Multi-source audit trail aggregation
- Scenario-specific audit trails
- Organization-wide audit summary

### Not Implemented ❌
- Snapshot export to PDF/Excel
- Snapshot restoration (rollback)
- Diff visualization UI
- Automated comparison reports
- Retention policy (auto-delete old snapshots)
- Snapshot integrity verification (hashing)

---

## 10. Key Files

| Component | File |
|-----------|------|
| Versioning Service | `src/risks/services/assessment-versioning.service.ts` |
| Audit Service | `src/risks/services/risk-audit.service.ts` |
| Schema | `prisma/schema/controls.prisma` (AssessmentSnapshot, ScenarioStateHistory, RiskCalculationHistory) |
