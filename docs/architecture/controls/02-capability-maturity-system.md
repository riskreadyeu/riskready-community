# Capability & Maturity System

This document describes the capability management and maturity assessment system that enables granular control effectiveness measurement.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Capability Data Model](#2-capability-data-model)
3. [Capability Types](#3-capability-types)
4. [Maturity Model](#4-maturity-model)
5. [Assessment System](#5-assessment-system)
6. [Maturity Criteria](#6-maturity-criteria)
7. [Service API](#7-service-api)
8. [Gap Analysis Integration](#8-gap-analysis-integration)

---

## 1. Overview

The Capability & Maturity System provides a structured approach to:
- Break controls into testable capabilities
- Assess maturity levels (L1-L5) for each capability
- Track progress toward target maturity
- Identify capability gaps requiring improvement

### Hierarchy

```
Control (e.g., A.5.1)
├── Capability 1 (5.1-C01)
│   ├── Maturity Criteria (L1-L5)
│   ├── Effectiveness Tests
│   └── Metrics
├── Capability 2 (5.1-C02)
│   └── ...
└── Capability N (5.1-C0N)
```

---

## 2. Capability Data Model

### Capability Entity

```prisma
model Capability {
  id               String         @id @default(cuid())
  capabilityId     String         // "5.1-C01", "5.1-C02"
  name             String
  type             CapabilityType
  description      String?        @db.Text
  testCriteria     String         @db.Text
  evidenceRequired String         @db.Text
  maxMaturityLevel Int            @default(5)
  dependsOn        String?        // Comma-separated capability IDs

  // Maturity criteria (L1-L5)
  l1Criteria String? @db.Text
  l1Evidence String? @db.Text
  l2Criteria String? @db.Text
  l2Evidence String? @db.Text
  l3Criteria String? @db.Text
  l3Evidence String? @db.Text
  l4Criteria String? @db.Text
  l4Evidence String? @db.Text
  l5Criteria String? @db.Text
  l5Evidence String? @db.Text

  // Effectiveness test criteria (3 layers)
  designTestCriteria             String? @db.Text
  designEvidenceRequired         String? @db.Text
  implementationTestCriteria     String? @db.Text
  implementationEvidenceRequired String? @db.Text
  operatingTestCriteria          String? @db.Text
  operatingEvidenceRequired      String? @db.Text

  // Relationships
  controlId          String
  control            Control
  metrics            CapabilityMetric[]
  assessments        CapabilityAssessment[]
  effectivenessTests CapabilityEffectivenessTest[]
  evidenceLinks      EvidenceCapability[]
  nonconformities    Nonconformity[]
}
```

### Database Indexes

```prisma
@@unique([capabilityId, controlId])
@@index([type])
@@index([controlId])
```

---

## 3. Capability Types

Capabilities are classified by their nature:

| Type | Description | Examples |
|------|-------------|----------|
| **PROCESS** | Documented procedures and workflows | Policy review process, Incident response procedure |
| **TECHNOLOGY** | Technical implementations | Firewall rules, MFA configuration, SIEM alerts |
| **PEOPLE** | Human-centric capabilities | Security awareness, Role-based access training |
| **PHYSICAL** | Physical security measures | Badge access, CCTV monitoring, Secure storage |

```typescript
enum CapabilityType {
  PROCESS
  TECHNOLOGY
  PEOPLE
  PHYSICAL
}
```

### Capability ID Convention

```
{ControlId}-C{NN}

Examples:
- 5.1-C01  → Control A.5.1, Capability 01
- 8.12-C03 → Control A.8.12, Capability 03
```

---

## 4. Maturity Model

### CMM-Style 5-Level Model

The maturity model follows Capability Maturity Model (CMM) principles:

| Level | Name | Description | Characteristics |
|-------|------|-------------|-----------------|
| 0 | Non-existent | No capability exists | No documentation, no process |
| 1 | Initial | Ad-hoc, reactive | Undocumented, person-dependent |
| 2 | Repeatable | Basic processes established | Documented but inconsistent |
| 3 | Defined | Standardized processes | Organization-wide standards |
| 4 | Managed | Measured and controlled | KPIs tracked, data-driven |
| 5 | Optimizing | Continuous improvement | Automated, proactive optimization |

### Configuration

```typescript
CONTROLS_CONFIG.maturity = {
  levels: {
    MIN: 0,
    MAX: 5,
  },
  labels: {
    0: 'Non-existent',
    1: 'Initial',
    2: 'Repeatable',
    3: 'Defined',
    4: 'Managed',
    5: 'Optimizing',
  },
}
```

### Maturity Progression

```
L0 (Non-existent)
    │
    ▼
L1 (Initial) ─────────── Ad-hoc processes
    │
    ▼
L2 (Repeatable) ──────── Documented processes
    │
    ▼
L3 (Defined) ─────────── Standardized organization-wide
    │
    ▼
L4 (Managed) ─────────── Measured with KPIs
    │
    ▼
L5 (Optimizing) ──────── Continuous improvement
```

---

## 5. Assessment System

### Assessment Entity

```prisma
model CapabilityAssessment {
  id String @id @default(cuid())

  // Maturity Assessment
  currentMaturity Int?    // 0-5
  targetMaturity  Int?    // 0-5
  gap             Int?    // Calculated: target - current

  // Level criteria met (L1-L5)
  l1Met Boolean?
  l2Met Boolean?
  l3Met Boolean?
  l4Met Boolean?
  l5Met Boolean?

  // Assessment metadata
  assessor       String?
  assessmentDate DateTime?
  nextReview     DateTime?
  notes          String?   @db.Text

  // Relationships
  capabilityId String
  capability   Capability
}
```

### Auto-Calculation Features

#### 1. Gap Calculation

```typescript
// Auto-calculated when current/target maturity provided
gap = targetMaturity - currentMaturity

// Example: target=4, current=2 → gap=2
```

#### 2. Maturity from Flags

```typescript
calculateMaturityFromFlags(l1, l2, l3, l4, l5): number {
  if (!l1) return 0;
  if (!l2) return 1;
  if (!l3) return 2;
  if (!l4) return 3;
  if (!l5) return 4;
  return 5;
}
```

### Assessment Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Create/Update  │────►│  Auto-Calculate  │────►│  Store Result   │
│   Assessment    │     │   Gap & Maturity │     │   + History     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
  L1-L5 flags set        currentMaturity = calculated
         │                       │
         └───────────────────────┴───────► gap = target - current
```

---

## 6. Maturity Criteria

Each capability can define specific criteria for each maturity level:

### Criteria Fields

| Field | Purpose |
|-------|---------|
| `l1Criteria` | Requirements to achieve Level 1 |
| `l1Evidence` | Evidence needed to prove Level 1 |
| `l2Criteria` | Requirements to achieve Level 2 |
| `l2Evidence` | Evidence needed to prove Level 2 |
| ... | ... |
| `l5Criteria` | Requirements to achieve Level 5 |
| `l5Evidence` | Evidence needed to prove Level 5 |

### Example Capability with Criteria

```typescript
{
  capabilityId: "5.1-C01",
  name: "Information Security Policy Document",
  type: "PROCESS",

  l1Criteria: "Basic security policy exists",
  l1Evidence: "Policy document (any format)",

  l2Criteria: "Policy is formally documented and approved",
  l2Evidence: "Signed policy with approval date",

  l3Criteria: "Policy is communicated to all employees",
  l3Evidence: "Communication records, acknowledgment logs",

  l4Criteria: "Policy compliance is measured and reported",
  l4Evidence: "Compliance metrics, audit reports",

  l5Criteria: "Policy undergoes continuous improvement",
  l5Evidence: "Improvement records, trend analysis"
}
```

---

## 7. Service API

### CapabilityService Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `findAll` | `skip?, take?, where?, orderBy?` | `{ results, count }` | List capabilities |
| `findOne` | `id: string` | `Capability \| null` | Get capability by ID |
| `findByControlId` | `controlId: string` | `Capability[]` | Get control's capabilities |
| `getStats` | `organisationId: string` | `CapabilityStats` | Get statistics |

### AssessmentService Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `findAll` | `skip?, take?, where?, orderBy?` | `{ results, count }` | List assessments |
| `findOne` | `id: string` | `Assessment \| null` | Get assessment |
| `findByCapabilityId` | `capabilityId` | `Assessment[]` | Get capability's assessments |
| `create` | `data` | `Assessment` | Create assessment |
| `update` | `id, data` | `Assessment` | Update assessment |
| `delete` | `id: string` | `Assessment` | Delete assessment |

### Create Assessment with Auto-Calculation

```typescript
// Input with L1-L5 flags
const assessment = await assessmentService.create({
  capabilityId: "cap-123",
  targetMaturity: 4,
  l1Met: true,
  l2Met: true,
  l3Met: false,  // Stops here
  l4Met: false,
  l5Met: false,
});

// Result: currentMaturity = 2, gap = 2
```

---

## 8. Gap Analysis Integration

### Gap Priority Classification

Gaps are prioritized based on magnitude:

| Gap | Priority | Action Required |
|-----|----------|-----------------|
| ≥ 3 | **CRITICAL** | Immediate attention |
| ≥ 2 | **HIGH** | High priority improvement |
| ≥ 1 | **MEDIUM** | Planned improvement |
| 0 | - | Target achieved |

### Configuration

```typescript
CONTROLS_CONFIG.gaps = {
  priorities: {
    CRITICAL: 3,  // gap >= 3
    HIGH: 2,      // gap >= 2
    MEDIUM: 0,    // gap < 2
  },
}
```

### Gap Analysis Output

```typescript
interface GapAnalysisItem {
  capabilityId: string;
  capabilityName: string;
  controlId: string;
  controlName: string;
  theme: ControlTheme;
  type: CapabilityType;
  currentMaturity: number;
  targetMaturity: number;
  gap: number;
  priority: 'Critical' | 'High' | 'Medium';
}
```

---

## Key Files

| File | Description |
|------|-------------|
| `prisma/schema/controls.prisma` | Capability and Assessment models |
| `src/controls/services/capability.service.ts` | Capability management |
| `src/controls/services/assessment.service.ts` | Assessment CRUD and calculations |
| `src/controls/services/gap-analysis.service.ts` | Gap analysis |
| `src/config/controls.config.ts` | Maturity and gap configuration |

---

## Related Documentation

- [01-control-system.md](01-control-system.md) - Parent control system
- [03-effectiveness-testing-system.md](03-effectiveness-testing-system.md) - Capability testing
- [04-metrics-monitoring-system.md](04-metrics-monitoring-system.md) - Capability metrics
- [07-reporting-gap-analysis.md](07-reporting-gap-analysis.md) - Gap reports
