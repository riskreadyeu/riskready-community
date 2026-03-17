# Control System

This document describes the core control management system in RiskReady GRC, supporting multi-framework compliance (ISO 27001, SOC2, NIS2, DORA).

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Model](#2-data-model)
3. [Control Themes](#3-control-themes)
4. [Multi-Framework Support](#4-multi-framework-support)
5. [Implementation Status](#5-implementation-status)
6. [Control Effectiveness](#6-control-effectiveness)
7. [Service API](#7-service-api)
8. [Integration Points](#8-integration-points)

---

## 1. Overview

The Control System manages security controls aligned with multiple compliance frameworks. Each control represents a specific security measure that organizations implement to protect their information assets and meet regulatory requirements.

### Key Features

- Multi-framework control definitions (ISO 27001, SOC2, NIS2, DORA)
- Four control themes (Organisational, People, Physical, Technological)
- Implementation status tracking
- Effectiveness scoring via capability assessments
- Statement of Applicability (SOA) integration
- Risk-control linkage for F2 factor calculation

---

## 2. Data Model

### Control Entity

```prisma
model Control {
  id          String       @id @default(cuid())
  controlId   String       // "5.1", "8.12", "SOC2-PI.1", "DORA-INC.1"
  theme       ControlTheme
  name        String
  description String?      @db.Text

  // Multi-framework support
  framework      ControlFramework @default(ISO)
  sourceStandard String?          // "ISO 27001:2022 Annex A", "DORA Article 19"
  soc2Criteria   String?          // "CC1.1, CC2.1" for SOC2 mapping
  tscCategory    String?          // "Security", "Availability", etc.

  // Statement of Applicability fields
  applicable           Boolean              @default(true)
  justificationIfNa    String?              @db.Text
  implementationStatus ImplementationStatus @default(NOT_STARTED)
  implementationDesc   String?              @db.Text

  // Relationships
  organisationId String
  capabilities   Capability[]
  soaEntries     SOAEntry[]
  risks          Risk[]           @relation("ControlRisks")
  scenarioLinks  RiskScenarioControl[]

  // Cross-module relationships
  documentMappings   DocumentControlMapping[]  // Policy Module
  assetLinks         AssetControl[]            // ITSM Module
  incidentLinks      IncidentControl[]         // Incident Module
  evidenceLinks      EvidenceControl[]         // Evidence Module
  vulnerabilityLinks VulnerabilityControl[]    // Vulnerability Management
  nonconformities    Nonconformity[]           // Audit Module
}
```

### Database Indexes

```prisma
@@unique([controlId, organisationId])
@@index([theme])
@@index([framework])
@@index([implementationStatus])
@@index([organisationId])
@@index([applicable])
```

---

## 3. Control Themes

Controls are categorized into four themes following ISO 27001:2022 Annex A structure:

| Theme | Code | Description | Example Controls |
|-------|------|-------------|------------------|
| **ORGANISATIONAL** | A.5.x | Governance, policies, procedures | Information security policies, Asset management |
| **PEOPLE** | A.6.x | Human resources security | Screening, Awareness training, Termination |
| **PHYSICAL** | A.7.x | Physical and environmental security | Secure areas, Equipment protection |
| **TECHNOLOGICAL** | A.8.x | Technical controls | Access control, Cryptography, Network security |

### Theme Enum

```typescript
enum ControlTheme {
  ORGANISATIONAL
  PEOPLE
  PHYSICAL
  TECHNOLOGICAL
}
```

---

## 4. Multi-Framework Support

### Supported Frameworks

```typescript
enum ControlFramework {
  ISO   // ISO 27001:2022
  SOC2  // SOC 2 Trust Services Criteria
  NIS2  // NIS2 Directive (EU)
  DORA  // Digital Operational Resilience Act (EU)
}
```

### Framework-Specific Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `framework` | Primary framework alignment | `ISO` |
| `sourceStandard` | Specific standard reference | "ISO 27001:2022 Annex A" |
| `soc2Criteria` | SOC2 criteria mapping | "CC1.1, CC2.1" |
| `tscCategory` | Trust Services Category | "Security", "Availability" |

### Control ID Patterns

| Framework | Pattern | Example |
|-----------|---------|---------|
| ISO 27001 | `A.{theme}.{number}` | `A.5.1`, `A.8.12` |
| SOC2 | `{Category}-{SubCat}.{Number}` | `SOC2-CC1.1`, `SOC2-PI.3` |
| NIS2 | `NIS2-Art.{Article}.{Para}` | `NIS2-Art.21.2(a)` |
| DORA | `DORA-{Category}-{Number}` | `DORA-INC.1`, `DORA-ICT.5` |

---

## 5. Implementation Status

### Status Enum

```typescript
enum ImplementationStatus {
  NOT_STARTED  // Control not yet implemented
  PARTIAL      // Control partially implemented
  IMPLEMENTED  // Control fully implemented
}
```

### Status Tracking Fields

| Field | Purpose |
|-------|---------|
| `applicable` | Whether control applies to organization |
| `justificationIfNa` | Justification if marked not applicable |
| `implementationStatus` | Current implementation status |
| `implementationDesc` | Description of implementation |

### Implementation Flow

```
NOT_STARTED ──► PARTIAL ──► IMPLEMENTED
                  │
                  └──► NOT_STARTED (regression)
```

---

## 6. Control Effectiveness

### Effectiveness Calculation

Control effectiveness is calculated from the effectiveness test results of all linked capabilities:

```typescript
async calculateControlEffectiveness(controlId: string): Promise<{
  score: number;       // 0-100 percentage
  rating: string;      // EFFECTIVE | PARTIALLY_EFFECTIVE | NOT_EFFECTIVE
  passCount: number;
  partialCount: number;
  failCount: number;
  notTestedCount: number;
  totalCapabilities: number;
}>
```

### Scoring Formula

```
score = (passCount × 3 + partialCount × 2 + failCount × 1) / (totalCapabilities × 3) × 100
```

### Effectiveness Rating Thresholds

| Score | Rating | Description |
|-------|--------|-------------|
| ≥ 90% | EFFECTIVE | Control operating as designed |
| ≥ 70% | PARTIALLY_EFFECTIVE | Control needs improvement |
| < 70% | NOT_EFFECTIVE | Control not meeting objectives |

### Configuration

```typescript
CONTROLS_CONFIG.effectiveness = {
  thresholds: {
    EFFECTIVE: 90,           // >= 90%
    PARTIALLY_EFFECTIVE: 70, // >= 70%
    NOT_EFFECTIVE: 0,        // < 70%
  },
  scoring: {
    PASS: 3,
    PARTIAL: 2,
    FAIL: 1,
    MAX_PER_CAPABILITY: 3,
  },
}
```

---

## 7. Service API

### ControlService Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `findAll` | `skip?, take?, where?, orderBy?` | `{ results, count }` | List controls with pagination |
| `findOne` | `id: string` | `Control \| null` | Get control by ID |
| `findByOrganisation` | `organisationId, params?` | `{ results, count }` | Get organization's controls |
| `getStats` | `organisationId: string` | `ControlStats` | Get control statistics |
| `create` | `data: CreateControlInput` | `Control` | Create new control |
| `update` | `id, data` | `Control` | Update control |
| `delete` | `id: string` | `Control` | Delete control |
| `calculateControlEffectiveness` | `controlId: string` | `EffectivenessResult` | Calculate effectiveness score |

### Statistics Response

```typescript
interface ControlStats {
  total: number;
  byTheme: Record<ControlTheme, number>;
  byStatus: Record<ImplementationStatus, number>;
  byFramework: Record<ControlFramework, number>;
  applicableCount: number;
  notApplicableCount: number;
}
```

### Query Filters

```typescript
interface ControlWhereInput {
  theme?: ControlTheme;
  framework?: ControlFramework;
  implementationStatus?: ImplementationStatus;
  applicable?: boolean;
  organisationId?: string;
  controlId?: { contains: string };
  name?: { contains: string };
}
```

---

## 8. Integration Points

### Risk Module Integration

Controls link to risk scenarios for F2 (Control Effectiveness) factor calculation:

```typescript
// RiskScenarioControl junction table
model RiskScenarioControl {
  id         String @id
  scenarioId String
  controlId  String
  scenario   RiskScenario
  control    Control
}
```

**F2 Calculation Flow:**
1. Get all controls linked to scenario
2. Calculate each control's effectiveness score
3. Average scores to get F2 factor (1-5 scale)

### Policy Module Integration

Controls link to policy documents:

```typescript
model DocumentControlMapping {
  documentId String
  controlId  String
  document   Document
  control    Control
}
```

### ITSM Module Integration

Controls link to IT assets:

```typescript
model AssetControl {
  assetId   String
  controlId String
  asset     Asset
  control   Control
}
```

### Evidence Module Integration

Controls link to evidence for audit:

```typescript
model EvidenceControl {
  evidenceId String
  controlId  String
  evidence   Evidence
  control    Control
}
```

### Audit Module Integration

Controls link to nonconformities:

```typescript
model Nonconformity {
  controlId String?
  control   Control?
}
```

---

## Key Files

| File | Description |
|------|-------------|
| `prisma/schema/controls.prisma` | Control data model |
| `src/controls/services/control.service.ts` | Core control service |
| `src/controls/controllers/controls.controller.ts` | REST API endpoints |
| `src/config/controls.config.ts` | Configuration values |

---

## Related Documentation

- [02-capability-maturity-system.md](02-capability-maturity-system.md) - Capabilities under controls
- [03-effectiveness-testing-system.md](03-effectiveness-testing-system.md) - Testing methodology
- [05-soa-system.md](05-soa-system.md) - Statement of Applicability
- [06-cross-reference-system.md](06-cross-reference-system.md) - Framework mappings
