# Risk Management Module - Data Model

**Version:** 1.0  
**Created:** December 2024  

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Definitions](#entity-definitions)
3. [Enumerations](#enumerations)
4. [Relationships](#relationships)
5. [Database Indexes](#database-indexes)

---

## Overview

The Risk Management data model consists of the following primary entities:

| Entity | Purpose | Key Relations |
|--------|---------|---------------|
| `Risk` | Top-level risk definitions | Organisation, Scenarios, KRIs |
| `RiskScenario` | Specific risk scenarios | Risk |
| `KeyRiskIndicator` | Risk monitoring metrics | Risk, KRI History |
| `KRIHistory` | Historical KRI values | KeyRiskIndicator |
| `TreatmentPlan` | Risk treatment strategies | Risk, Treatment Actions |
| `TreatmentAction` | Individual treatment tasks | TreatmentPlan |
| `RiskToleranceStatement` | Risk appetite definitions | Organisation, Risks |

---

## Entity Definitions

### Risk

The primary risk entity representing identified information security risks.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Primary key |
| `riskId` | String | Yes | Display ID (e.g., "R-01") |
| `title` | String | Yes | Risk title |
| `description` | Text | No | Detailed description |
| `tier` | RiskTier | Yes | Core, Extended, or Advanced |
| `orgSize` | String | No | Applicable org sizes ("S,M,L") |
| `status` | RiskStatus | Yes | Current lifecycle status |
| `framework` | ControlFramework | Yes | Primary framework |
| `soc2Criteria` | String | No | SOC 2 criteria mapping |
| `tscCategory` | String | No | TSC category |
| `likelihood` | LikelihoodLevel | No | Current likelihood |
| `impact` | ImpactLevel | No | Current impact |
| `inherentScore` | Int | No | Inherent risk score (1-25) |
| `residualScore` | Int | No | Residual risk score (1-25) |
| `riskOwner` | String | No | Risk owner name |
| `treatmentPlan` | Text | No | Treatment description |
| `acceptanceCriteria` | Text | No | Acceptance criteria |
| `organisationId` | String | Yes | FK to Organisation |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Update timestamp |
| `createdById` | String | No | FK to User |
| `updatedById` | String | No | FK to User |

---

### RiskScenario

Specific scenarios under a parent risk with cause-event-consequence analysis.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Primary key |
| `scenarioId` | String | Yes | Display ID (e.g., "R-01-S01") |
| `title` | String | Yes | Scenario title |
| `cause` | Text | No | What triggers the risk |
| `event` | Text | No | What happens |
| `consequence` | Text | No | Business impact |
| `likelihood` | LikelihoodLevel | No | Inherent likelihood |
| `impact` | ImpactLevel | No | Inherent impact |
| `inherentScore` | Int | No | Inherent score (1-25) |
| `residualLikelihood` | LikelihoodLevel | No | Residual likelihood |
| `residualImpact` | ImpactLevel | No | Residual impact |
| `residualScore` | Int | No | Residual score (1-25) |
| `framework` | ControlFramework | Yes | Framework alignment |
| `controlIds` | String | No | Comma-separated control IDs |
| `riskId` | String | Yes | FK to Risk |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Update timestamp |
| `createdById` | String | No | FK to User |
| `updatedById` | String | No | FK to User |

---

### KeyRiskIndicator

Metrics that monitor risk levels with threshold-based RAG status.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Primary key |
| `kriId` | String | Yes | Display ID (e.g., "KRI-001") |
| `name` | String | Yes | KRI name |
| `description` | Text | No | KRI description |
| `formula` | Text | No | Calculation formula |
| `unit` | String | Yes | Unit of measurement |
| `thresholdGreen` | String | No | Green threshold (e.g., "≥95%") |
| `thresholdAmber` | String | No | Amber threshold (e.g., "80-94%") |
| `thresholdRed` | String | No | Red threshold (e.g., "<80%") |
| `frequency` | CollectionFrequency | Yes | Collection frequency |
| `dataSource` | String | No | Data source |
| `automated` | Boolean | Yes | Is automated collection |
| `tier` | RiskTier | Yes | Applicable tier |
| `currentValue` | String | No | Current measured value |
| `status` | RAGStatus | No | Current RAG status |
| `trend` | TrendDirection | No | Current trend |
| `lastMeasured` | DateTime | No | Last measurement time |
| `framework` | ControlFramework | Yes | Framework alignment |
| `soc2Criteria` | String | No | SOC 2 criteria mapping |
| `riskId` | String | Yes | FK to Risk |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Update timestamp |
| `createdById` | String | No | FK to User |
| `updatedById` | String | No | FK to User |

---

### KRIHistory

Historical KRI measurements for trend analysis.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Primary key |
| `value` | String | Yes | Measured value |
| `status` | RAGStatus | Yes | RAG status at measurement |
| `measuredAt` | DateTime | Yes | Measurement timestamp |
| `measuredBy` | String | No | User who measured |
| `notes` | Text | No | Measurement notes |
| `kriId` | String | Yes | FK to KeyRiskIndicator |
| `createdAt` | DateTime | Yes | Creation timestamp |

---

### TreatmentPlan

Risk treatment strategies with workflow management.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Primary key |
| `treatmentId` | String | Yes | Display ID (e.g., "TP-001") |
| `title` | String | Yes | Plan title |
| `description` | Text | Yes | Plan description |
| `treatmentType` | TreatmentType | Yes | Treatment approach |
| `priority` | TreatmentPriority | Yes | Priority level |
| `status` | TreatmentStatus | Yes | Workflow status |
| `targetResidualScore` | Int | No | Target score after treatment |
| `currentResidualScore` | Int | No | Current residual score |
| `expectedReduction` | Int | No | Expected % reduction |
| `estimatedCost` | Decimal | No | Estimated cost |
| `actualCost` | Decimal | No | Actual cost |
| `costBenefit` | Text | No | Cost-benefit analysis |
| `roi` | Decimal | No | Return on investment |
| `proposedDate` | DateTime | No | Date proposed |
| `approvedDate` | DateTime | No | Date approved |
| `targetStartDate` | DateTime | No | Target start |
| `targetEndDate` | DateTime | No | Target completion |
| `actualStartDate` | DateTime | No | Actual start |
| `actualEndDate` | DateTime | No | Actual completion |
| `riskOwnerId` | String | No | FK to User (owner) |
| `implementerId` | String | No | FK to User (implementer) |
| `approvedById` | String | No | FK to User (approver) |
| `acceptanceRationale` | Text | No | ACCEPT type rationale |
| `acceptanceCriteria` | Text | No | ACCEPT type criteria |
| `acceptanceConditions` | JSON | No | ACCEPT type conditions |
| `acceptanceExpiryDate` | DateTime | No | ACCEPT expiry date |
| `progressPercentage` | Int | Yes | Progress 0-100 |
| `progressNotes` | Text | No | Progress notes |
| `controlIds` | String | No | Related control IDs |
| `riskId` | String | Yes | FK to Risk |
| `organisationId` | String | Yes | FK to Organisation |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Update timestamp |
| `createdById` | String | No | FK to User |
| `updatedById` | String | No | FK to User |

---

### TreatmentAction

Individual tasks within a treatment plan.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Primary key |
| `actionId` | String | Yes | Display ID (e.g., "TP-001-A01") |
| `title` | String | Yes | Action title |
| `description` | Text | No | Action description |
| `status` | ActionStatus | Yes | Action status |
| `priority` | TreatmentPriority | Yes | Priority level |
| `dueDate` | DateTime | No | Due date |
| `completedDate` | DateTime | No | Completion date |
| `assignedToId` | String | No | FK to User |
| `estimatedHours` | Int | No | Estimated hours |
| `actualHours` | Int | No | Actual hours |
| `completionNotes` | Text | No | Completion notes |
| `blockerNotes` | Text | No | Blocker notes |
| `treatmentPlanId` | String | Yes | FK to TreatmentPlan |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Update timestamp |
| `createdById` | String | No | FK to User |

---

### RiskToleranceStatement

Organizational risk appetite definitions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Primary key |
| `rtsId` | String | Yes | Display ID (e.g., "RTS-001") |
| `title` | String | Yes | Statement title |
| `objective` | Text | Yes | What RTS aims to achieve |
| `domain` | String | No | Risk domain |
| `proposedToleranceLevel` | ToleranceLevel | Yes | HIGH/MEDIUM/LOW |
| `proposedRTS` | Text | Yes | Full statement text |
| `conditions` | JSON | Yes | Threshold conditions |
| `anticipatedOperationalImpact` | Text | No | Operational impact |
| `rationale` | Text | No | Rationale for level |
| `status` | RTSStatus | Yes | Approval status |
| `approvedDate` | DateTime | No | Approval date |
| `approvedById` | String | No | FK to User (approver) |
| `effectiveDate` | DateTime | No | When RTS takes effect |
| `reviewDate` | DateTime | No | Next review date |
| `framework` | ControlFramework | Yes | Framework alignment |
| `controlIds` | String | No | Related control IDs |
| `organisationId` | String | Yes | FK to Organisation |
| `createdAt` | DateTime | Yes | Creation timestamp |
| `updatedAt` | DateTime | Yes | Update timestamp |
| `createdById` | String | No | FK to User |
| `updatedById` | String | No | FK to User |

---

## Enumerations

### RiskTier

| Value | Description |
|-------|-------------|
| `CORE` | Applicable to all organizations |
| `EXTENDED` | For medium and large organizations |
| `ADVANCED` | For large enterprises only |

### RiskStatus

| Value | Description |
|-------|-------------|
| `IDENTIFIED` | Risk identified, not yet assessed |
| `ASSESSED` | Risk fully assessed with scores |
| `TREATING` | Treatment plan in progress |
| `ACCEPTED` | Risk accepted within tolerance |
| `CLOSED` | Risk no longer applicable |

### LikelihoodLevel

| Value | Numeric | Description |
|-------|---------|-------------|
| `RARE` | 1 | Very unlikely to occur |
| `UNLIKELY` | 2 | Could occur but not expected |
| `POSSIBLE` | 3 | Might occur at some time |
| `LIKELY` | 4 | Will probably occur |
| `ALMOST_CERTAIN` | 5 | Expected to occur |

### ImpactLevel

| Value | Numeric | Description |
|-------|---------|-------------|
| `NEGLIGIBLE` | 1 | Minimal impact |
| `MINOR` | 2 | Limited impact |
| `MODERATE` | 3 | Noticeable impact |
| `MAJOR` | 4 | Significant impact |
| `SEVERE` | 5 | Critical impact |

### ImpactCategory

> **Note:** Used by Risk Tolerance Statements (RTS) for domain categorization.

| Value | Description |
|-------|-------------|
| `FINANCIAL` | Financial loss impact |
| `LEGAL_REGULATORY` | Legal/compliance impact |
| `REPUTATION` | Brand/reputation impact |
| `OPERATIONAL` | Business operations impact |

### RAGStatus

| Value | Description |
|-------|-------------|
| `GREEN` | Within acceptable threshold |
| `AMBER` | Warning threshold reached |
| `RED` | Critical threshold breached |
| `NOT_MEASURED` | No measurement recorded |

### TrendDirection

| Value | Description |
|-------|-------------|
| `IMPROVING` | Trend toward green |
| `STABLE` | No significant change |
| `DECLINING` | Trend toward red |
| `NEW` | New KRI, no trend data |

### CollectionFrequency

| Value | Description |
|-------|-------------|
| `DAILY` | Collected daily |
| `WEEKLY` | Collected weekly |
| `MONTHLY` | Collected monthly |
| `QUARTERLY` | Collected quarterly |
| `ANNUALLY` | Collected annually |
| `ON_DEMAND` | Collected as needed |

### TreatmentType

| Value | Description |
|-------|-------------|
| `MITIGATE` | Reduce risk through controls |
| `TRANSFER` | Transfer risk (e.g., insurance) |
| `ACCEPT` | Accept risk with justification |
| `AVOID` | Eliminate risk source |
| `SHARE` | Share risk with third party |

### TreatmentStatus

| Value | Description |
|-------|-------------|
| `DRAFT` | Plan being drafted |
| `PROPOSED` | Plan proposed for approval |
| `APPROVED` | Plan approved, ready to start |
| `IN_PROGRESS` | Treatment underway |
| `COMPLETED` | Treatment completed |
| `ON_HOLD` | Treatment temporarily paused |
| `CANCELLED` | Treatment cancelled |

### TreatmentPriority

| Value | Description |
|-------|-------------|
| `CRITICAL` | Highest priority |
| `HIGH` | High priority |
| `MEDIUM` | Normal priority |
| `LOW` | Low priority |

### ActionStatus

| Value | Description |
|-------|-------------|
| `NOT_STARTED` | Action not yet started |
| `IN_PROGRESS` | Action underway |
| `COMPLETED` | Action completed |
| `BLOCKED` | Action blocked |

### ToleranceLevel

| Value | Description |
|-------|-------------|
| `HIGH` | High risk tolerance |
| `MEDIUM` | Medium risk tolerance |
| `LOW` | Low risk tolerance |

### RTSStatus

| Value | Description |
|-------|-------------|
| `DRAFT` | RTS being drafted |
| `PENDING_APPROVAL` | Awaiting approval |
| `APPROVED` | RTS approved and active |
| `SUPERSEDED` | Replaced by newer RTS |
| `RETIRED` | No longer active |

---

## Relationships

### Entity Relationship Diagram

```
┌──────────────────────┐
│   Organisation       │
└──────────┬───────────┘
           │ 1:N
           ▼
┌──────────────────────┐       ┌──────────────────────┐
│        Risk          │◀──────│      Control         │
│                      │ N:M   │                      │
├──────────────────────┤       └──────────────────────┘
│ scenarios[]          │
│ kris[]               │
│ treatmentPlans[]     │
│ toleranceStatements[]│
└──────────┬───────────┘
           │ 1:N
           ▼
┌──────────────────────┐
│    RiskScenario      │
├──────────────────────┤
│ toleranceStatements[]│
└──────────────────────┘
           
┌──────────────────────┐       ┌──────────────────────┐
│   KeyRiskIndicator   │──────▶│     KRIHistory       │
│                      │ 1:N   │                      │
├──────────────────────┤       └──────────────────────┘
│ history[]            │
│ toleranceStatements[]│
└──────────────────────┘

┌──────────────────────┐       ┌──────────────────────┐
│    TreatmentPlan     │──────▶│   TreatmentAction    │
│                      │ 1:N   │                      │
├──────────────────────┤       └──────────────────────┘
│ actions[]            │
└──────────────────────┘

┌──────────────────────┐
│ RiskToleranceStatement│
├──────────────────────┤
│ risks[]           N:M│
│ scenarios[]       N:M│
│ kris[]            N:M│
└──────────────────────┘
```

---

## Database Indexes

### Risk

| Index | Columns |
|-------|---------|
| Unique | `riskId`, `organisationId` |
| Index | `tier` |
| Index | `status` |
| Index | `framework` |
| Index | `organisationId` |

### RiskScenario

| Index | Columns |
|-------|---------|
| Unique | `scenarioId`, `riskId` |
| Index | `riskId` |

### KeyRiskIndicator

| Index | Columns |
|-------|---------|
| Unique | `kriId`, `riskId` |
| Index | `riskId` |
| Index | `status` |
| Index | `tier` |

### KRIHistory

| Index | Columns |
|-------|---------|
| Index | `kriId` |
| Index | `measuredAt` |

### TreatmentPlan

| Index | Columns |
|-------|---------|
| Unique | `treatmentId`, `organisationId` |
| Index | `status` |
| Index | `riskId` |
| Index | `organisationId` |

### RiskToleranceStatement

| Index | Columns |
|-------|---------|
| Unique | `rtsId`, `organisationId` |
| Index | `status` |
| Index | `proposedToleranceLevel` |
| Index | `domain` |
| Index | `organisationId` |
