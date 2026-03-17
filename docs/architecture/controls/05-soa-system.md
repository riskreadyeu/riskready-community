# Statement of Applicability (SOA) System

This document describes the Statement of Applicability management system, which provides versioned documentation of control applicability decisions for compliance frameworks.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Model](#2-data-model)
3. [SOA Lifecycle](#3-soa-lifecycle)
4. [Entry Management](#4-entry-management)
5. [Versioning System](#5-versioning-system)
6. [Approval Workflow](#6-approval-workflow)
7. [Control Synchronization](#7-control-synchronization)
8. [Service API](#8-service-api)

---

## 1. Overview

The Statement of Applicability (SOA) is a key ISO 27001 compliance document that:

- Lists all controls from the framework
- Indicates whether each control is applicable
- Provides justification for non-applicable controls
- Documents implementation status and details

### Key Features

- Versioned SOA documents
- Per-control applicability decisions
- Implementation status tracking
- Approval workflow (DRAFT → PENDING_REVIEW → APPROVED)
- Bi-directional sync with Control records
- Risk linkage for justification

---

## 2. Data Model

### StatementOfApplicability Entity

```prisma
model StatementOfApplicability {
  id      String    @id @default(cuid())
  version String    // "1.0", "1.1", "2.0"
  status  SOAStatus @default(DRAFT)
  name    String?   // "Initial SOA", "2024 Review"
  notes   String?   @db.Text

  // Approval workflow
  approvedAt   DateTime?
  approvedById String?
  approvedBy   User?

  // Relationships
  organisationId String
  organisation   OrganisationProfile
  entries        SOAEntry[]

  @@unique([version, organisationId])
  @@index([status])
  @@index([organisationId])
}
```

### SOAEntry Entity

```prisma
model SOAEntry {
  id String @id @default(cuid())

  // Control reference (denormalized for historical integrity)
  controlId   String        // "A.5.1", "A.8.12"
  controlName String
  theme       ControlTheme

  // Applicability decision
  applicable        Boolean @default(true)
  justificationIfNa String? @db.Text

  // Implementation details
  implementationStatus ImplementationStatus @default(NOT_STARTED)
  implementationDesc   String?              @db.Text

  // Risk linkage
  parentRiskId String?
  scenarioIds  String?   // Comma-separated scenario IDs

  // Relationships
  soaId           String
  soa             StatementOfApplicability
  controlRecordId String?
  controlRecord   Control?

  @@unique([controlId, soaId])
  @@index([soaId])
  @@index([applicable])
  @@index([implementationStatus])
  @@index([controlRecordId])
}
```

### SOAStatus Enum

```typescript
enum SOAStatus {
  DRAFT           // Initial creation, editable
  PENDING_REVIEW  // Submitted for approval
  APPROVED        // Approved and active
  SUPERSEDED      // Replaced by newer version
}
```

---

## 3. SOA Lifecycle

### Status Flow

```
┌─────────┐     Submit      ┌─────────────────┐     Approve     ┌──────────┐
│  DRAFT  │ ───────────────►│ PENDING_REVIEW  │ ───────────────►│ APPROVED │
└─────────┘                 └─────────────────┘                 └──────────┘
     │                              │                                 │
     │                              │ Reject                          │
     │                              │                                 │
     ▼                              ▼                                 │
┌─────────────────────────────────────────────────────────────────────│
│                          Can edit while DRAFT                       │
└─────────────────────────────────────────────────────────────────────│
                                                                      │
                                                    New version created│
                                                                      ▼
                                                              ┌────────────┐
                                                              │ SUPERSEDED │
                                                              └────────────┘
```

### Lifecycle Events

| Event | From Status | To Status | Action |
|-------|-------------|-----------|--------|
| Create | - | DRAFT | New SOA created |
| Submit | DRAFT | PENDING_REVIEW | Submit for approval |
| Approve | PENDING_REVIEW | APPROVED | Approve SOA, supersede previous |
| Reject | PENDING_REVIEW | DRAFT | Return for edits |
| Create New Version | APPROVED | SUPERSEDED (previous) | New DRAFT created |

---

## 4. Entry Management

### Entry Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `controlId` | Framework control reference | "A.5.1", "A.8.12" |
| `controlName` | Control name (denormalized) | "Policies for information security" |
| `theme` | Control theme category | ORGANISATIONAL, TECHNOLOGICAL |
| `applicable` | Whether control applies | true/false |
| `justificationIfNa` | Why control doesn't apply | "No cloud infrastructure" |
| `implementationStatus` | Current implementation state | NOT_STARTED, PARTIAL, IMPLEMENTED |
| `implementationDesc` | How control is implemented | "Policy documented in wiki..." |
| `parentRiskId` | Linked risk ID | "R-01" |
| `scenarioIds` | Linked scenario IDs | "R-01-S01,R-01-S02" |

### Entry Update

```typescript
async updateEntry(entryId: string, data: {
  applicable?: boolean;
  justificationIfNa?: string;
  implementationStatus?: string;
  implementationDesc?: string;
  parentRiskId?: string;
  scenarioIds?: string;
})
```

### Bulk Entry Update

```typescript
async bulkUpdateEntries(soaId: string, updates: Array<{
  controlId: string;
  applicable?: boolean;
  justificationIfNa?: string;
  implementationStatus?: string;
  implementationDesc?: string;
}>)
```

---

## 5. Versioning System

### Version Numbering

SOAs use semantic versioning: `{major}.{minor}`

| Version | Meaning |
|---------|---------|
| 1.0 | Initial SOA |
| 1.1 | Minor updates (description changes) |
| 2.0 | Major changes (applicability changes) |

### Creating New Version

```typescript
async createNewVersion(sourceId: string, data: {
  version: string;
  name?: string;
  notes?: string;
  createdById?: string;
}) {
  // Get source SOA with entries
  const source = await findWithEntries(sourceId);

  // Create new version with copied entries
  return prisma.statementOfApplicability.create({
    data: {
      version: data.version,
      name: data.name,
      notes: data.notes,
      status: 'DRAFT',
      organisationId: source.organisationId,
      entries: {
        create: source.entries.map(entry => ({
          controlId: entry.controlId,
          controlName: entry.controlName,
          theme: entry.theme,
          applicable: entry.applicable,
          justificationIfNa: entry.justificationIfNa,
          implementationStatus: entry.implementationStatus,
          implementationDesc: entry.implementationDesc,
          parentRiskId: entry.parentRiskId,
          scenarioIds: entry.scenarioIds,
          controlRecordId: entry.controlRecordId,
        })),
      },
    },
  });
}
```

### Version History

```
Organization SOA History:
┌────────────────────────────────────────────────────────────────┐
│ Version │ Status     │ Approved   │ Name                       │
├─────────┼────────────┼────────────┼────────────────────────────┤
│ 1.0     │ SUPERSEDED │ 2023-01-15 │ Initial SOA                │
│ 1.1     │ SUPERSEDED │ 2023-06-20 │ Q2 Review                  │
│ 2.0     │ APPROVED   │ 2024-01-10 │ 2024 Annual Review         │
│ 2.1     │ DRAFT      │ -          │ Q1 2024 Updates            │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. Approval Workflow

### Submit for Review

```typescript
async submitForReview(id: string, updatedById?: string) {
  const soa = await findOne(id);
  if (!soa) throw new NotFoundException();

  return prisma.statementOfApplicability.update({
    where: { id },
    data: {
      status: 'PENDING_REVIEW',
      updatedById,
    },
  });
}
```

### Approve SOA

```typescript
async approve(id: string, approvedById: string) {
  const soa = await findOne(id);
  if (!soa) throw new NotFoundException();

  // Mark previous approved versions as superseded
  await prisma.statementOfApplicability.updateMany({
    where: {
      organisationId: soa.organisationId,
      status: 'APPROVED',
      id: { not: id },
    },
    data: { status: 'SUPERSEDED' },
  });

  // Approve current SOA
  return prisma.statementOfApplicability.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedById,
      updatedById: approvedById,
    },
  });
}
```

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOA APPROVAL WORKFLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐                                                    │
│  │ Preparer │                                                    │
│  └────┬─────┘                                                    │
│       │ Creates/Edits SOA                                        │
│       ▼                                                          │
│  ┌──────────┐     Submit for Review                             │
│  │  DRAFT   │ ────────────────────────────────────┐              │
│  └──────────┘                                     │              │
│                                                   ▼              │
│                                        ┌─────────────────┐       │
│                                        │ PENDING_REVIEW  │       │
│                                        └────────┬────────┘       │
│                                                 │                │
│                              ┌──────────────────┴───────┐        │
│                              │                          │        │
│                            Reject                    Approve     │
│                              │                          │        │
│                              ▼                          ▼        │
│                         ┌──────────┐           ┌───────────┐     │
│                         │  DRAFT   │           │  APPROVED │     │
│                         └──────────┘           └───────────┘     │
│                                                     │            │
│                                          Supersedes previous     │
│                                                     ▼            │
│                                           ┌────────────┐         │
│                                           │ SUPERSEDED │         │
│                                           └────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Control Synchronization

### Create SOA from Controls

```typescript
async createFromControls(data: {
  version: string;
  name?: string;
  notes?: string;
  organisationId: string;
  createdById?: string;
}) {
  // Get all organization controls
  const controls = await prisma.control.findMany({
    where: { organisationId: data.organisationId },
    orderBy: { controlId: 'asc' },
  });

  // Create SOA with entries from controls
  return prisma.statementOfApplicability.create({
    data: {
      version: data.version,
      name: data.name,
      status: 'DRAFT',
      organisationId: data.organisationId,
      entries: {
        create: controls.map(control => ({
          controlId: control.controlId,
          controlName: control.name,
          theme: control.theme,
          applicable: control.applicable,
          justificationIfNa: control.justificationIfNa,
          implementationStatus: control.implementationStatus,
          implementationDesc: control.implementationDesc,
          controlRecordId: control.id,
        })),
      },
    },
  });
}
```

### Sync SOA to Controls

```typescript
async syncToControls(soaId: string) {
  // Get SOA with entries
  const soa = await findWithEntries(soaId);

  // Update each linked Control record
  const updates = await Promise.all(
    soa.entries
      .filter(entry => entry.controlRecordId)
      .map(entry =>
        prisma.control.update({
          where: { id: entry.controlRecordId },
          data: {
            applicable: entry.applicable,
            justificationIfNa: entry.justificationIfNa,
            implementationStatus: entry.implementationStatus,
            implementationDesc: entry.implementationDesc,
          },
        })
      )
  );

  return { updatedCount: updates.length };
}
```

### Sync Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTROL ↔ SOA SYNC                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Controls ──────────────► SOA                                    │
│  (createFromControls)                                            │
│  • Populates SOA entries from current control data               │
│  • Used when creating new SOA version                            │
│                                                                  │
│  SOA ──────────────────► Controls                                │
│  (syncToControls)                                                │
│  • Updates control records from approved SOA                     │
│  • Used after SOA approval to apply changes                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Service API

### SOAService Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `findAll` | `skip?, take?, where?, orderBy?` | `{ data, total }` | List SOAs |
| `findOne` | `id: string` | `SOA \| null` | Get SOA with entries |
| `findLatestByOrganisation` | `organisationId` | `SOA \| null` | Get latest SOA |
| `getStats` | `organisationId?` | `SOAStats` | Get statistics |
| `create` | `data` | `SOA` | Create empty SOA |
| `createFromControls` | `data` | `SOA` | Create from controls |
| `createNewVersion` | `sourceId, data` | `SOA` | Create new version |
| `update` | `id, data` | `SOA` | Update SOA metadata |
| `submitForReview` | `id, updatedById?` | `SOA` | Submit for approval |
| `approve` | `id, approvedById` | `SOA` | Approve SOA |
| `delete` | `id: string` | `SOA` | Delete SOA |

### SOAEntryService Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `updateEntry` | `entryId, data` | `Entry` | Update single entry |
| `bulkUpdateEntries` | `soaId, updates[]` | `Result[]` | Bulk update entries |
| `syncToControls` | `soaId` | `{ updatedCount }` | Sync to controls |

### Statistics Response

```typescript
interface SOAStats {
  totalVersions: number;
  latestVersion: string | null;
  latestStatus: SOAStatus | null;
  applicableCount: number;
  notApplicableCount: number;
  implementedCount: number;
  partialCount: number;
  notStartedCount: number;
}
```

---

## Configuration

```typescript
CONTROLS_CONFIG.soa = {
  initialStatus: 'DRAFT',
  reviewStatus: 'PENDING_REVIEW',
  approvedStatus: 'APPROVED',
  supersededStatus: 'SUPERSEDED',
}
```

---

## Key Files

| File | Description |
|------|-------------|
| `prisma/schema/controls.prisma` | SOA and SOAEntry models |
| `src/controls/services/soa.service.ts` | SOA management service |
| `src/controls/services/soa-entry.service.ts` | Entry management service |
| `src/config/controls.config.ts` | SOA status configuration |

---

## Related Documentation

- [01-control-system.md](01-control-system.md) - Control records that SOA entries reference
- [06-cross-reference-system.md](06-cross-reference-system.md) - Multi-framework mapping
- [07-reporting-gap-analysis.md](07-reporting-gap-analysis.md) - SOA-based reports
