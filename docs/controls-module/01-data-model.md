# Controls Module - Data Model

**Version:** 1.0  
**Created:** December 2024  

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Definitions](#entity-definitions)
3. [Enumerations](#enumerations)
4. [Relationships](#relationships)
5. [Prisma Schema](#prisma-schema)
6. [Data Import Mapping](#data-import-mapping)

---

## Overview

The Controls Module data model supports ISO 27001:2022 control management with three assurance layers:

| Layer | Entity | Purpose | Record Count |
|-------|--------|---------|--------------|
| Control Catalog | `Control` | ISO 27001:2022 controls + SoA | 93 |
| Capabilities | `Capability` | Testable capabilities per control | 244 |
| Metrics | `CapabilityMetric` | Continuous monitoring metrics | 244 |
| Assessments | `CapabilityAssessment` | Point-in-time test results + maturity | Per assessment |

---

## Entity Definitions

### Control

Represents an ISO 27001:2022 control from Annex A.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Primary key |
| `controlId` | String | Yes | ISO control ID (e.g., "5.1", "8.12") |
| `theme` | Enum | Yes | Control theme/category |
| `name` | String | Yes | Control name |
| `description` | String | No | Control description |
| `applicable` | Boolean | Yes | Is control applicable (SoA) |
| `justificationIfNa` | String | No | Justification if not applicable |
| `implementationStatus` | Enum | Yes | Implementation status |
| `implementationDesc` | String | No | Implementation description |
| `organisationId` | String | Yes | FK to Organisation |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |
| `createdById` | String | Yes | FK to User who created |
| `updatedById` | String | Yes | FK to User who last updated |

**Indexes:**
- Unique: `controlId` + `organisationId`
- Index: `theme`
- Index: `implementationStatus`
- Index: `organisationId`

---

### Capability

Represents a testable capability within a control.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Primary key |
| `capabilityId` | String | Yes | Capability ID (e.g., "5.1-C01") |
| `name` | String | Yes | Capability name |
| `type` | Enum | Yes | Capability type |
| `description` | String | No | Capability description |
| `testCriteria` | String | Yes | Auditor-ready test criteria |
| `evidenceRequired` | String | Yes | Required evidence for testing |
| `maxMaturityLevel` | Int | Yes | Maximum maturity level (1-5) |
| `dependsOn` | String | No | Comma-separated dependent capability IDs |
| `l1Criteria` | String | No | Level 1 maturity criteria |
| `l1Evidence` | String | No | Level 1 evidence requirements |
| `l2Criteria` | String | No | Level 2 maturity criteria |
| `l2Evidence` | String | No | Level 2 evidence requirements |
| `l3Criteria` | String | No | Level 3 maturity criteria |
| `l3Evidence` | String | No | Level 3 evidence requirements |
| `l4Criteria` | String | No | Level 4 maturity criteria |
| `l4Evidence` | String | No | Level 4 evidence requirements |
| `l5Criteria` | String | No | Level 5 maturity criteria |
| `l5Evidence` | String | No | Level 5 evidence requirements |
| `controlId` | String | Yes | FK to Control |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |
| `createdById` | String | Yes | FK to User who created |
| `updatedById` | String | Yes | FK to User who last updated |

**Indexes:**
- Unique: `capabilityId` + `controlId`
- Index: `type`
- Index: `controlId`

---

### CapabilityMetric

Represents a continuous monitoring metric for a capability.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Primary key |
| `metricId` | String | Yes | Metric ID (e.g., "CM-5.1-C01") |
| `name` | String | Yes | Metric name |
| `formula` | String | Yes | Calculation formula |
| `unit` | String | Yes | Unit of measurement (%, Count, Days, etc.) |
| `greenThreshold` | String | Yes | Green (good) threshold |
| `amberThreshold` | String | Yes | Amber (warning) threshold |
| `redThreshold` | String | Yes | Red (critical) threshold |
| `collectionFrequency` | Enum | Yes | How often to collect |
| `dataSource` | String | Yes | Where data comes from |
| `currentValue` | String | No | Current measured value |
| `status` | Enum | No | Current RAG status |
| `trend` | Enum | No | Trend direction |
| `lastCollection` | DateTime | No | Last collection timestamp |
| `owner` | String | No | Metric owner |
| `notes` | String | No | Additional notes |
| `capabilityId` | String | Yes | FK to Capability |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |
| `createdById` | String | Yes | FK to User who created |
| `updatedById` | String | Yes | FK to User who last updated |

**Indexes:**
- Unique: `metricId` + `capabilityId`
- Index: `status`
- Index: `collectionFrequency`
- Index: `capabilityId`

---

### CapabilityAssessment

Represents a point-in-time assessment of a capability (test result + maturity).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Primary key |
| `testResult` | Enum | No | Test result (Pass/Partial/Fail/etc.) |
| `testDate` | DateTime | No | Date of test |
| `tester` | String | No | Person who performed test |
| `evidenceLocation` | String | No | Location of evidence |
| `testNotes` | String | No | Test notes |
| `currentMaturity` | Int | No | Current maturity level (0-5) |
| `targetMaturity` | Int | No | Target maturity level (0-5) |
| `gap` | Int | No | Gap (target - current) |
| `l1Met` | Boolean | No | Level 1 criteria met |
| `l2Met` | Boolean | No | Level 2 criteria met |
| `l3Met` | Boolean | No | Level 3 criteria met |
| `l4Met` | Boolean | No | Level 4 criteria met |
| `l5Met` | Boolean | No | Level 5 criteria met |
| `assessor` | String | No | Person who assessed maturity |
| `assessmentDate` | DateTime | No | Date of maturity assessment |
| `nextReview` | DateTime | No | Next scheduled review |
| `notes` | String | No | General notes |
| `capabilityId` | String | Yes | FK to Capability |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |
| `createdById` | String | Yes | FK to User who created |
| `updatedById` | String | Yes | FK to User who last updated |

**Indexes:**
- Index: `testResult`
- Index: `currentMaturity`
- Index: `capabilityId`
- Index: `assessmentDate`

---

### MetricHistory

Stores historical values for metrics (for trend analysis).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Primary key |
| `value` | String | Yes | Measured value |
| `status` | Enum | Yes | RAG status at time of measurement |
| `collectedAt` | DateTime | Yes | Collection timestamp |
| `collectedBy` | String | No | Person who collected |
| `notes` | String | No | Collection notes |
| `metricId` | String | Yes | FK to CapabilityMetric |
| `createdAt` | DateTime | Yes | Creation timestamp |

**Indexes:**
- Index: `metricId`
- Index: `collectedAt`

---

## Enumerations

### ControlTheme

Maps to ISO 27001:2022 Annex A themes.

| Value | Description | Control ID Range |
|-------|-------------|------------------|
| `ORGANISATIONAL` | Organisational controls | 5.x |
| `PEOPLE` | People controls | 6.x |
| `PHYSICAL` | Physical controls | 7.x |
| `TECHNOLOGICAL` | Technological controls | 8.x |

### CapabilityType

| Value | Description |
|-------|-------------|
| `PROCESS` | Process-based capability |
| `TECHNOLOGY` | Technology-based capability |
| `PEOPLE` | People-based capability |
| `PHYSICAL` | Physical capability |

### ImplementationStatus

| Value | Description |
|-------|-------------|
| `NOT_STARTED` | Implementation not started |
| `PARTIAL` | Partially implemented |
| `IMPLEMENTED` | Fully implemented |

### TestResult

| Value | Score | Description |
|-------|-------|-------------|
| `PASS` | 3 | Capability fully meets test criteria |
| `PARTIAL` | 2 | Capability partially meets criteria |
| `FAIL` | 1 | Capability does not meet criteria |
| `NOT_TESTED` | 0 | Not yet assessed |
| `NOT_APPLICABLE` | N/A | Not relevant to organization |

### RAGStatus

| Value | Description |
|-------|-------------|
| `GREEN` | Metric within target range |
| `AMBER` | Metric approaching threshold |
| `RED` | Metric outside acceptable range |
| `NOT_MEASURED` | No data collected yet |

### TrendDirection

| Value | Description |
|-------|-------------|
| `IMPROVING` | Metric moving toward Green |
| `STABLE` | Metric unchanged |
| `DECLINING` | Metric moving toward Red |
| `NEW` | First measurement |

### CollectionFrequency

| Value | Description |
|-------|-------------|
| `DAILY` | Collected daily |
| `WEEKLY` | Collected weekly |
| `MONTHLY` | Collected monthly |
| `QUARTERLY` | Collected quarterly |
| `ANNUAL` | Collected annually |
| `PER_EVENT` | Collected per event |
| `PER_INCIDENT` | Collected per incident |

---

## Relationships

```
Organisation (1) ──────────────────────────────────────┐
     │                                                  │
     │ 1:N                                              │
     ▼                                                  │
┌─────────────────┐                                     │
│    Control      │                                     │
│─────────────────│                                     │
│ organisationId  │─────────────────────────────────────┘
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│   Capability    │
│─────────────────│
│ controlId (FK)  │
└────────┬────────┘
         │
    ┌────┴────────────────┐
    │ 1:N                 │ 1:N
    ▼                     ▼
┌─────────────────┐  ┌─────────────────────┐
│CapabilityMetric │  │CapabilityAssessment │
│─────────────────│  │─────────────────────│
│ capabilityId(FK)│  │ capabilityId (FK)   │
└────────┬────────┘  └─────────────────────┘
         │ 1:N
         ▼
┌─────────────────┐
│  MetricHistory  │
│─────────────────│
│ metricId (FK)   │
└─────────────────┘
```

### Relationship Summary

| From | To | Type | Description |
|------|----|------|-------------|
| Organisation | Control | 1:N | Organisation has many controls |
| Control | Capability | 1:N | Control has many capabilities |
| Capability | CapabilityMetric | 1:N | Capability has many metrics |
| Capability | CapabilityAssessment | 1:N | Capability has many assessments (history) |
| CapabilityMetric | MetricHistory | 1:N | Metric has many historical values |

---

## Prisma Schema

```prisma
// === CONTROLS MODULE ===
// File: apps/server/prisma/schema/controls.prisma

// === ENUMS ===

enum ControlTheme {
  ORGANISATIONAL
  PEOPLE
  PHYSICAL
  TECHNOLOGICAL
}

enum CapabilityType {
  PROCESS
  TECHNOLOGY
  PEOPLE
  PHYSICAL
}

enum ImplementationStatus {
  NOT_STARTED
  PARTIAL
  IMPLEMENTED
}

enum TestResult {
  PASS
  PARTIAL
  FAIL
  NOT_TESTED
  NOT_APPLICABLE
}

enum RAGStatus {
  GREEN
  AMBER
  RED
  NOT_MEASURED
}

enum TrendDirection {
  IMPROVING
  STABLE
  DECLINING
  NEW
}

enum CollectionFrequency {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
  ANNUAL
  PER_EVENT
  PER_INCIDENT
}

// === MODELS ===

model Control {
  id                   String               @id @default(cuid())
  controlId            String               // "5.1", "8.12", etc.
  theme                ControlTheme
  name                 String
  description          String?
  
  // Statement of Applicability
  applicable           Boolean              @default(true)
  justificationIfNa    String?
  implementationStatus ImplementationStatus @default(NOT_STARTED)
  implementationDesc   String?
  
  // Relationships
  organisationId       String
  organisation         Organisation         @relation(fields: [organisationId], references: [id], onDelete: Cascade)
  capabilities         Capability[]
  
  // Audit
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  createdById          String
  createdBy            User                 @relation("ControlCreatedBy", fields: [createdById], references: [id])
  updatedById          String
  updatedBy            User                 @relation("ControlUpdatedBy", fields: [updatedById], references: [id])
  
  @@unique([controlId, organisationId])
  @@index([theme])
  @@index([implementationStatus])
  @@index([organisationId])
}

model Capability {
  id               String         @id @default(cuid())
  capabilityId     String         // "5.1-C01", "5.1-C02", etc.
  name             String
  type             CapabilityType
  description      String?
  testCriteria     String         @db.Text
  evidenceRequired String         @db.Text
  maxMaturityLevel Int            @default(5)
  dependsOn        String?        // Comma-separated capability IDs
  
  // Maturity criteria (L1-L5)
  l1Criteria       String?        @db.Text
  l1Evidence       String?        @db.Text
  l2Criteria       String?        @db.Text
  l2Evidence       String?        @db.Text
  l3Criteria       String?        @db.Text
  l3Evidence       String?        @db.Text
  l4Criteria       String?        @db.Text
  l4Evidence       String?        @db.Text
  l5Criteria       String?        @db.Text
  l5Evidence       String?        @db.Text
  
  // Relationships
  controlId        String
  control          Control        @relation(fields: [controlId], references: [id], onDelete: Cascade)
  metrics          CapabilityMetric[]
  assessments      CapabilityAssessment[]
  
  // Audit
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  createdById      String
  createdBy        User           @relation("CapabilityCreatedBy", fields: [createdById], references: [id])
  updatedById      String
  updatedBy        User           @relation("CapabilityUpdatedBy", fields: [updatedById], references: [id])
  
  @@unique([capabilityId, controlId])
  @@index([type])
  @@index([controlId])
}

model CapabilityMetric {
  id                  String              @id @default(cuid())
  metricId            String              // "CM-5.1-C01"
  name                String
  formula             String
  unit                String
  greenThreshold      String
  amberThreshold      String
  redThreshold        String
  collectionFrequency CollectionFrequency
  dataSource          String
  
  // Current state
  currentValue        String?
  status              RAGStatus?
  trend               TrendDirection?
  lastCollection      DateTime?
  owner               String?
  notes               String?
  
  // Relationships
  capabilityId        String
  capability          Capability          @relation(fields: [capabilityId], references: [id], onDelete: Cascade)
  history             MetricHistory[]
  
  // Audit
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  createdById         String
  createdBy           User                @relation("MetricCreatedBy", fields: [createdById], references: [id])
  updatedById         String
  updatedBy           User                @relation("MetricUpdatedBy", fields: [updatedById], references: [id])
  
  @@unique([metricId, capabilityId])
  @@index([status])
  @@index([collectionFrequency])
  @@index([capabilityId])
}

model CapabilityAssessment {
  id               String      @id @default(cuid())
  
  // Capability Test
  testResult       TestResult?
  testDate         DateTime?
  tester           String?
  evidenceLocation String?
  testNotes        String?     @db.Text
  
  // Maturity Assessment
  currentMaturity  Int?        // 0-5
  targetMaturity   Int?        // 0-5
  gap              Int?        // Calculated: target - current
  
  // Level criteria met
  l1Met            Boolean?
  l2Met            Boolean?
  l3Met            Boolean?
  l4Met            Boolean?
  l5Met            Boolean?
  
  // Assessment metadata
  assessor         String?
  assessmentDate   DateTime?
  nextReview       DateTime?
  notes            String?     @db.Text
  
  // Relationships
  capabilityId     String
  capability       Capability  @relation(fields: [capabilityId], references: [id], onDelete: Cascade)
  
  // Audit
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  createdById      String
  createdBy        User        @relation("AssessmentCreatedBy", fields: [createdById], references: [id])
  updatedById      String
  updatedBy        User        @relation("AssessmentUpdatedBy", fields: [updatedById], references: [id])
  
  @@index([testResult])
  @@index([currentMaturity])
  @@index([capabilityId])
  @@index([assessmentDate])
}

model MetricHistory {
  id          String    @id @default(cuid())
  value       String
  status      RAGStatus
  collectedAt DateTime
  collectedBy String?
  notes       String?
  
  // Relationships
  metricId    String
  metric      CapabilityMetric @relation(fields: [metricId], references: [id], onDelete: Cascade)
  
  // Audit
  createdAt   DateTime  @default(now())
  
  @@index([metricId])
  @@index([collectedAt])
}
```

---

## Data Import Mapping

### Control Import (from Excel)

**Source:** `ISO27001_Control_Assurance_Enhanced.xlsx` → `Control_Summary` sheet  
**Source:** `ISO27001_Risk_Methodology_Template.xlsx` → `Statement_of_Applicability` sheet

| Excel Column | Prisma Field | Transformation |
|--------------|--------------|----------------|
| Control_ID | `controlId` | Direct |
| Control_Name | `name` | Direct |
| - | `theme` | Derived from controlId prefix |
| Capability_Types | `description` | Optional |
| applicable | `applicable` | "Y"/"Yes" → true |
| justification_if_na | `justificationIfNa` | Direct |
| implementation_status | `implementationStatus` | Map to enum |
| implementation_description | `implementationDesc` | Direct |

**Theme Derivation:**
- `5.x` → `ORGANISATIONAL`
- `6.x` → `PEOPLE`
- `7.x` → `PHYSICAL`
- `8.x` → `TECHNOLOGICAL`

### Capability Import (from Excel)

**Source:** `ISO27001_Control_Assurance_Enhanced.xlsx` → `Control_Capabilities` sheet  
**Source:** `ISO27001_Maturity_Assessment.xlsx` → `Maturity_Assessment` sheet

| Excel Column | Prisma Field | Transformation |
|--------------|--------------|----------------|
| Capability_ID | `capabilityId` | Direct |
| Capability_Name | `name` | Direct |
| Capability_Type | `type` | Map to enum |
| Description | `description` | Direct |
| Test_Criteria | `testCriteria` | Direct |
| Evidence_Required | `evidenceRequired` | Direct |
| Max_Level | `maxMaturityLevel` | Parse int |
| Depends_On | `dependsOn` | Direct |
| L1_Criteria | `l1Criteria` | From Maturity sheet |
| L1_Evidence | `l1Evidence` | From Maturity sheet |
| L2_Criteria | `l2Criteria` | From Maturity sheet |
| L2_Evidence | `l2Evidence` | From Maturity sheet |
| L3_Criteria | `l3Criteria` | From Maturity sheet |
| L3_Evidence | `l3Evidence` | From Maturity sheet |
| L4_Criteria | `l4Criteria` | From Maturity sheet |
| L4_Evidence | `l4Evidence` | From Maturity sheet |
| L5_Criteria | `l5Criteria` | From Maturity sheet |
| L5_Evidence | `l5Evidence` | From Maturity sheet |

**Type Mapping:**
- "Process" → `PROCESS`
- "Technology" → `TECHNOLOGY`
- "People" → `PEOPLE`
- "Physical" → `PHYSICAL`

### Metric Import (from Excel)

**Source:** `ISO27001_Capability_Metrics.xlsx` → `Capability_Metrics` sheet

| Excel Column | Prisma Field | Transformation |
|--------------|--------------|----------------|
| Metric_ID | `metricId` | Direct |
| Metric_Name | `name` | Direct |
| Metric_Formula | `formula` | Direct |
| Unit | `unit` | Direct |
| Green | `greenThreshold` | Direct |
| Amber | `amberThreshold` | Direct |
| Red | `redThreshold` | Direct |
| Collection_Frequency | `collectionFrequency` | Map to enum |
| Data_Source | `dataSource` | Direct |

**Frequency Mapping:**
- "Daily" → `DAILY`
- "Weekly" → `WEEKLY`
- "Monthly" → `MONTHLY`
- "Quarterly" → `QUARTERLY`
- "Annual" / "Annually" → `ANNUAL`
- "Per event" / "Per Event" → `PER_EVENT`
- "Per incident" / "Per Incident" → `PER_INCIDENT`
