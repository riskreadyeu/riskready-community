# Controls Module - Implementation Plan

**Version:** 1.0  
**Created:** December 2024  
**Status:** Planning  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Data Import Summary](#data-import-summary)
3. [Phase 1: Database Schema](#phase-1-database-schema)
4. [Phase 2: Data Import & Seeding](#phase-2-data-import--seeding)
5. [Phase 3: Backend API](#phase-3-backend-api)
6. [Phase 4: Frontend UI](#phase-4-frontend-ui)
7. [Phase 5: Integration & Testing](#phase-5-integration--testing)
8. [Phase 6: Risk Module Preparation](#phase-6-risk-module-preparation)
9. [Progress Tracking](#progress-tracking)

---

## Executive Summary

The Controls Module implements ISO 27001:2022 control management with a three-layer assurance model:

1. **Control Assurance** - Point-in-time capability testing (Pass/Partial/Fail)
2. **Capability Metrics** - Continuous monitoring with RAG thresholds
3. **Maturity Assessment** - 5-level capability maturity model (CMM)

### Key Metrics

| Metric | Count |
|--------|-------|
| ISO 27001:2022 Controls | 93 |
| Capabilities | 244 |
| Capability Metrics | 244 |
| Unique Metric Types | 41 |

---

## Data Import Summary

### Source Files

| File | Sheets | Records | Purpose |
|------|--------|---------|---------|
| `ISO27001_Control_Assurance_Enhanced.xlsx` | Control_Summary, Control_Capabilities, Testing_Guide | 93 controls, 244 capabilities | Control catalog + test criteria |
| `ISO27001_Capability_Metrics.xlsx` | Capability_Metrics, Control_Summary, Dashboard, Methodology | 244 metrics | Continuous monitoring definitions |
| `ISO27001_Maturity_Assessment.xlsx` | Maturity_Assessment, Control_Summary, Dashboard, Assessment_Guidance | 244 maturity criteria | L1-L5 maturity criteria |
| `ISO27001_Risk_Methodology_Template.xlsx` | Statement_of_Applicability | 93 controls | SoA fields (applicable, justification) |

### Data Mapping

#### Controls (from Control_Assurance_Enhanced + Risk_Methodology)

| Excel Column | Database Field | Type |
|--------------|----------------|------|
| Control_ID | `controlId` | String (unique) |
| Control_Name | `name` | String |
| - | `theme` | Enum (derived from control ID prefix) |
| Capability_Types | `capabilityTypes` | String (aggregated) |
| applicable | `applicable` | Boolean |
| justification_if_na | `justificationIfNa` | String |
| implementation_status | `implementationStatus` | Enum |
| implementation_description | `implementationDesc` | String |

#### Capabilities (from Control_Assurance_Enhanced)

| Excel Column | Database Field | Type |
|--------------|----------------|------|
| Capability_ID | `capabilityId` | String (unique) |
| Capability_Name | `name` | String |
| Capability_Type | `type` | Enum |
| Description | `description` | String |
| Test_Criteria | `testCriteria` | String |
| Evidence_Required | `evidenceRequired` | String |
| Max_Level (from Maturity) | `maxMaturityLevel` | Int |
| Depends_On (from Maturity) | `dependsOn` | String |

#### Capability Metrics (from Capability_Metrics)

| Excel Column | Database Field | Type |
|--------------|----------------|------|
| Metric_ID | `metricId` | String (unique) |
| Metric_Name | `name` | String |
| Metric_Formula | `formula` | String |
| Unit | `unit` | String |
| Green | `greenThreshold` | String |
| Amber | `amberThreshold` | String |
| Red | `redThreshold` | String |
| Collection_Frequency | `collectionFreq` | Enum |
| Data_Source | `dataSource` | String |

#### Maturity Criteria (from Maturity_Assessment)

| Excel Column | Database Field | Type |
|--------------|----------------|------|
| L1_Criteria | `l1Criteria` | String |
| L1_Evidence | `l1Evidence` | String |
| L2_Criteria | `l2Criteria` | String |
| L2_Evidence | `l2Evidence` | String |
| L3_Criteria | `l3Criteria` | String |
| L3_Evidence | `l3Evidence` | String |
| L4_Criteria | `l4Criteria` | String |
| L4_Evidence | `l4Evidence` | String |
| L5_Criteria | `l5Criteria` | String |
| L5_Evidence | `l5Evidence` | String |

---

## Phase 1: Database Schema

**Duration:** 2-3 days  
**Dependencies:** None  

### Checklist

#### 1.1 Schema Design
- [ ] Create `controls.prisma` schema file
- [ ] Define `Control` model with all fields
- [ ] Define `Capability` model with all fields
- [ ] Define `CapabilityMetric` model with all fields
- [ ] Define `CapabilityAssessment` model with all fields
- [ ] Define `CapabilityMaturityCriteria` model (static L1-L5 criteria)
- [ ] Define all required enums
- [ ] Add proper indexes for query performance
- [ ] Add foreign key relationships
- [ ] Add audit fields (createdAt, updatedAt, createdById, updatedById)

#### 1.2 Schema Validation
- [ ] Review schema against Excel data structure
- [ ] Verify all Excel columns are mapped
- [ ] Check enum values match Excel data
- [ ] Validate relationship cardinality

#### 1.3 Migration
- [ ] Generate Prisma migration
- [ ] Test migration on development database
- [ ] Verify all tables created correctly
- [ ] Test rollback capability

### Deliverables
- `apps/server/prisma/schema/controls.prisma`
- Migration files in `apps/server/prisma/migrations/`

---

## Phase 2: Data Import & Seeding

**Duration:** 3-4 days  
**Dependencies:** Phase 1 complete  

### Checklist

#### 2.1 Import Script Setup
- [ ] Install `xlsx` or `exceljs` package for Excel parsing
- [ ] Create `apps/server/prisma/seed/controls/` directory
- [ ] Create base import utilities (Excel reader, data transformer)

#### 2.2 Control Import
- [ ] Create `import-controls.ts` script
- [ ] Parse `Control_Summary` sheet from Control_Assurance_Enhanced
- [ ] Parse `Statement_of_Applicability` from Risk_Methodology
- [ ] Merge data by Control_ID
- [ ] Derive `theme` from control ID prefix (5.x=Org, 6.x=People, 7.x=Physical, 8.x=Tech)
- [ ] Validate 93 controls imported
- [ ] Handle duplicates and conflicts

#### 2.3 Capability Import
- [ ] Create `import-capabilities.ts` script
- [ ] Parse `Control_Capabilities` sheet
- [ ] Link to parent Control by Control_ID
- [ ] Import maturity criteria from `Maturity_Assessment` sheet
- [ ] Merge L1-L5 criteria and evidence fields
- [ ] Validate 244 capabilities imported
- [ ] Verify all capabilities linked to controls

#### 2.4 Metric Import
- [ ] Create `import-metrics.ts` script
- [ ] Parse `Capability_Metrics` sheet
- [ ] Link to parent Capability by Capability_ID
- [ ] Parse threshold values (handle % and numeric)
- [ ] Map collection frequency to enum
- [ ] Validate 244 metrics imported

#### 2.5 Master Seed Script
- [ ] Create `seed-controls.ts` master script
- [ ] Run imports in correct order (Controls → Capabilities → Metrics)
- [ ] Add transaction support for atomicity
- [ ] Add progress logging
- [ ] Add error handling and rollback
- [ ] Test full seed on clean database

#### 2.6 Data Validation
- [ ] Verify control count: 93
- [ ] Verify capability count: 244
- [ ] Verify metric count: 244
- [ ] Verify all relationships intact
- [ ] Spot-check 10 random records against Excel
- [ ] Verify enum values correctly mapped

### Deliverables
- `apps/server/prisma/seed/controls/import-controls.ts`
- `apps/server/prisma/seed/controls/import-capabilities.ts`
- `apps/server/prisma/seed/controls/import-metrics.ts`
- `apps/server/prisma/seed/controls/seed-controls.ts`
- Updated `apps/server/prisma/seed.ts` to include controls seeding

---

## Phase 3: Backend API

**Duration:** 5-7 days  
**Dependencies:** Phase 2 complete  

### Checklist

#### 3.1 Module Setup
- [ ] Create `apps/server/src/controls/` directory
- [ ] Create `controls.module.ts`
- [ ] Register module in `app.module.ts`
- [ ] Create `controls.service.ts`
- [ ] Create `controls.controller.ts`

#### 3.2 DTOs & Validation
- [ ] Create `dto/` directory
- [ ] Create `control.dto.ts` (response DTO)
- [ ] Create `capability.dto.ts` (response DTO)
- [ ] Create `capability-metric.dto.ts` (response DTO)
- [ ] Create `capability-assessment.dto.ts` (response + create/update DTOs)
- [ ] Create `update-metric-value.dto.ts` (for metric collection)
- [ ] Add Zod validation schemas

#### 3.3 Control Endpoints
- [ ] `GET /api/controls` - List all controls with pagination/filtering
- [ ] `GET /api/controls/:id` - Get control by ID with capabilities
- [ ] `GET /api/controls/stats` - Get control statistics (counts, effectiveness)
- [ ] `PATCH /api/controls/:id` - Update control (SoA fields)

#### 3.4 Capability Endpoints
- [ ] `GET /api/capabilities` - List all capabilities with pagination/filtering
- [ ] `GET /api/capabilities/:id` - Get capability with metrics and assessments
- [ ] `GET /api/capabilities/by-control/:controlId` - Get capabilities for a control
- [ ] `GET /api/capabilities/stats` - Get capability statistics

#### 3.5 Assessment Endpoints
- [ ] `GET /api/assessments` - List assessments with filtering
- [ ] `GET /api/assessments/:id` - Get assessment details
- [ ] `POST /api/assessments` - Create new assessment
- [ ] `PATCH /api/assessments/:id` - Update assessment
- [ ] `GET /api/assessments/by-capability/:capabilityId` - Get assessment history

#### 3.6 Metric Endpoints
- [ ] `GET /api/metrics` - List all metrics with filtering
- [ ] `GET /api/metrics/:id` - Get metric details with history
- [ ] `PATCH /api/metrics/:id/value` - Update current metric value
- [ ] `GET /api/metrics/dashboard` - Get metrics dashboard data (RAG summary)

#### 3.7 Reporting Endpoints
- [ ] `GET /api/controls/effectiveness` - Control effectiveness report
- [ ] `GET /api/controls/maturity-heatmap` - Maturity levels by control/theme
- [ ] `GET /api/controls/gap-analysis` - Gap analysis (current vs target maturity)
- [ ] `GET /api/controls/export` - Export to Excel/PDF

#### 3.8 Testing
- [ ] Unit tests for service methods
- [ ] Integration tests for endpoints
- [ ] Test authentication/authorization
- [ ] Test pagination and filtering
- [ ] Test error handling

### Deliverables
- `apps/server/src/controls/controls.module.ts`
- `apps/server/src/controls/controls.controller.ts`
- `apps/server/src/controls/controls.service.ts`
- `apps/server/src/controls/dto/*.ts`
- `apps/server/src/controls/controls.controller.spec.ts`
- `apps/server/src/controls/controls.service.spec.ts`

---

## Phase 4: Frontend UI

**Duration:** 7-10 days  
**Dependencies:** Phase 3 complete  

### Checklist

#### 4.1 API Client
- [ ] Create `apps/web/src/lib/controls-api.ts`
- [ ] Add types for all DTOs
- [ ] Implement all API methods
- [ ] Add error handling

#### 4.2 Navigation & Routing
- [ ] Add "Controls" to sidebar navigation
- [ ] Create route `/controls` - Control catalog
- [ ] Create route `/controls/:id` - Control detail
- [ ] Create route `/controls/assessments` - Assessment management
- [ ] Create route `/controls/metrics` - Metrics dashboard
- [ ] Create route `/controls/reports` - Reports

#### 4.3 Control Catalog Page
- [ ] Create `apps/web/src/pages/controls/ControlsPage.tsx`
- [ ] Implement control list with DataTable
- [ ] Add filtering by theme, implementation status, applicability
- [ ] Add search by control ID/name
- [ ] Show capability count per control
- [ ] Show effectiveness % per control
- [ ] Add export functionality

#### 4.4 Control Detail Page
- [ ] Create `apps/web/src/pages/controls/ControlDetailPage.tsx`
- [ ] Show control metadata (ID, name, theme, SoA fields)
- [ ] List capabilities with test results
- [ ] Show control effectiveness calculation
- [ ] Show maturity summary
- [ ] Add edit SoA fields (applicable, justification, implementation)

#### 4.5 Capability Components
- [ ] Create `apps/web/src/components/controls/CapabilityCard.tsx`
- [ ] Create `apps/web/src/components/controls/CapabilityList.tsx`
- [ ] Show capability type badge (Process/Tech/People/Physical)
- [ ] Show test result badge (Pass/Partial/Fail)
- [ ] Show maturity level indicator
- [ ] Show linked metrics with RAG status

#### 4.6 Assessment Workflow
- [ ] Create `apps/web/src/pages/controls/AssessmentsPage.tsx`
- [ ] Create `apps/web/src/components/controls/AssessmentForm.tsx`
- [ ] Implement capability test form (result, evidence, notes)
- [ ] Implement maturity assessment form (L1-L5 checkboxes)
- [ ] Show criteria and evidence requirements for each level
- [ ] Auto-calculate current maturity level
- [ ] Auto-calculate gap from target

#### 4.7 Metrics Dashboard
- [ ] Create `apps/web/src/pages/controls/MetricsDashboardPage.tsx`
- [ ] Create `apps/web/src/components/controls/MetricCard.tsx`
- [ ] Show RAG summary (Green/Amber/Red/Not Measured counts)
- [ ] Show metrics by collection frequency
- [ ] Show metrics by capability type
- [ ] Implement metric value update form
- [ ] Show trend indicators

#### 4.8 Reports & Visualizations
- [ ] Create `apps/web/src/pages/controls/ReportsPage.tsx`
- [ ] Control effectiveness chart (bar chart by theme)
- [ ] Maturity heatmap (controls × maturity level)
- [ ] Gap analysis table (current vs target)
- [ ] Trend charts for metrics
- [ ] Export to PDF/Excel

#### 4.9 Common Components
- [ ] Create `apps/web/src/components/controls/EffectivenessGauge.tsx`
- [ ] Create `apps/web/src/components/controls/MaturityBadge.tsx`
- [ ] Create `apps/web/src/components/controls/RAGStatusBadge.tsx`
- [ ] Create `apps/web/src/components/controls/TrendIndicator.tsx`
- [ ] Create `apps/web/src/components/controls/TestResultBadge.tsx`

#### 4.10 Testing
- [ ] Component tests for key components
- [ ] Page tests for main pages
- [ ] Test form validation
- [ ] Test API error handling
- [ ] Test responsive design

### Deliverables
- `apps/web/src/lib/controls-api.ts`
- `apps/web/src/pages/controls/*.tsx`
- `apps/web/src/components/controls/*.tsx`
- Updated `apps/web/src/App.tsx` with routes
- Updated sidebar navigation

---

## Phase 5: Integration & Testing

**Duration:** 3-4 days  
**Dependencies:** Phase 4 complete  

### Checklist

#### 5.1 End-to-End Testing
- [ ] Test full workflow: View controls → Assess capability → Update metric
- [ ] Test data integrity after operations
- [ ] Test concurrent user scenarios
- [ ] Test with seeded data

#### 5.2 Performance Testing
- [ ] Test control list with 93 controls
- [ ] Test capability list with 244 capabilities
- [ ] Test metrics dashboard with 244 metrics
- [ ] Optimize slow queries
- [ ] Add database indexes if needed

#### 5.3 Security Testing
- [ ] Verify all endpoints require authentication
- [ ] Test authorization (user can only access own org data)
- [ ] Test input validation
- [ ] Test SQL injection prevention (Prisma handles)

#### 5.4 Documentation
- [ ] Update API documentation
- [ ] Create user guide for Controls module
- [ ] Document data model
- [ ] Document calculation formulas (effectiveness, maturity)

### Deliverables
- Test reports
- Performance benchmarks
- Updated documentation

---

## Phase 6: Risk Module Preparation

**Duration:** 2-3 days  
**Dependencies:** Phase 5 complete  

### Checklist

#### 6.1 Integration Points
- [ ] Add `parentRiskIds` field to Control model (for Risk linking)
- [ ] Add `scenarioIds` field to Control model (for Scenario linking)
- [ ] Create Treatment Plan trigger logic (on Fail/Red)
- [ ] Create Exception handling for N/A controls

#### 6.2 Risk Module Schema Prep
- [ ] Design Risk_Catalog model
- [ ] Design Risk_Scenario model
- [ ] Design KRI model
- [ ] Design Risk_Tolerance_Statement model
- [ ] Design Treatment_Plan model
- [ ] Design Treatment_Action model
- [ ] Design Exception_Register model

#### 6.3 Linking Tables
- [ ] Create Control ↔ Risk many-to-many relationship
- [ ] Create Control ↔ RTS many-to-many relationship
- [ ] Create Capability → TreatmentPlan trigger relationship

### Deliverables
- Updated schema with Risk integration fields
- Risk module schema design document

---

## Progress Tracking

### Overall Progress

| Phase | Status | Progress | Start Date | End Date |
|-------|--------|----------|------------|----------|
| Phase 1: Database Schema | Not Started | 0% | - | - |
| Phase 2: Data Import | Not Started | 0% | - | - |
| Phase 3: Backend API | Not Started | 0% | - | - |
| Phase 4: Frontend UI | Not Started | 0% | - | - |
| Phase 5: Integration & Testing | Not Started | 0% | - | - |
| Phase 6: Risk Module Prep | Not Started | 0% | - | - |

### Milestone Summary

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Schema complete & migrated | - | ⬜ |
| All data imported (93 controls, 244 capabilities, 244 metrics) | - | ⬜ |
| All API endpoints functional | - | ⬜ |
| Control catalog UI complete | - | ⬜ |
| Assessment workflow complete | - | ⬜ |
| Metrics dashboard complete | - | ⬜ |
| Reports complete | - | ⬜ |
| All tests passing | - | ⬜ |
| Ready for Risk module integration | - | ⬜ |

### Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Excel data inconsistencies | Medium | Medium | Validate during import, log warnings |
| Complex maturity calculations | Low | Medium | Pre-calculate and cache |
| Performance with large datasets | Low | Low | Add indexes, pagination |
| Scope creep | Medium | Medium | Stick to checklist, defer nice-to-haves |

---

## Appendix A: Entity Relationship Diagram

```
┌─────────────────┐
│    Control      │
│─────────────────│
│ id (PK)         │
│ controlId       │ "5.1", "8.1"
│ theme           │ ORGANISATIONAL/PEOPLE/PHYSICAL/TECHNOLOGICAL
│ name            │
│ applicable      │
│ justificationIfNa│
│ implementationStatus│
│ implementationDesc│
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│   Capability    │
│─────────────────│
│ id (PK)         │
│ capabilityId    │ "5.1-C01"
│ controlId (FK)  │
│ name            │
│ type            │ PROCESS/TECHNOLOGY/PEOPLE/PHYSICAL
│ description     │
│ testCriteria    │
│ evidenceRequired│
│ maxMaturityLevel│
│ dependsOn       │
│ l1-l5 Criteria  │ (embedded or separate table)
│ l1-l5 Evidence  │
└────────┬────────┘
         │
    ┌────┴────┐
    │ 1:N     │ 1:N
    ▼         ▼
┌─────────────────┐  ┌─────────────────────┐
│CapabilityMetric │  │CapabilityAssessment │
│─────────────────│  │─────────────────────│
│ id (PK)         │  │ id (PK)             │
│ metricId        │  │ capabilityId (FK)   │
│ capabilityId(FK)│  │ testResult          │
│ name            │  │ testDate            │
│ formula         │  │ tester              │
│ unit            │  │ evidenceLocation    │
│ greenThreshold  │  │ currentMaturity     │
│ amberThreshold  │  │ targetMaturity      │
│ redThreshold    │  │ gap                 │
│ collectionFreq  │  │ l1-l5 Met flags     │
│ dataSource      │  │ assessor            │
│ currentValue    │  │ assessmentDate      │
│ status (RAG)    │  │ nextReview          │
│ trend           │  └─────────────────────┘
│ lastCollection  │
└─────────────────┘
```

---

## Appendix B: API Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/controls` | List controls |
| GET | `/api/controls/:id` | Get control detail |
| GET | `/api/controls/stats` | Control statistics |
| PATCH | `/api/controls/:id` | Update control |
| GET | `/api/capabilities` | List capabilities |
| GET | `/api/capabilities/:id` | Get capability detail |
| GET | `/api/capabilities/by-control/:controlId` | Capabilities by control |
| GET | `/api/assessments` | List assessments |
| GET | `/api/assessments/:id` | Get assessment |
| POST | `/api/assessments` | Create assessment |
| PATCH | `/api/assessments/:id` | Update assessment |
| GET | `/api/metrics` | List metrics |
| GET | `/api/metrics/:id` | Get metric |
| PATCH | `/api/metrics/:id/value` | Update metric value |
| GET | `/api/metrics/dashboard` | Metrics dashboard |
| GET | `/api/controls/effectiveness` | Effectiveness report |
| GET | `/api/controls/maturity-heatmap` | Maturity heatmap |
| GET | `/api/controls/gap-analysis` | Gap analysis |

---

## Appendix C: Calculation Formulas

### Control Effectiveness

```
Effectiveness % = (Sum of capability scores / Max possible score) × 100

Where:
- Pass = 3 points
- Partial = 2 points
- Fail = 1 point
- Not Tested = 0 points
- N/A = excluded from calculation

Example: Control with 3 capabilities
- Capability 1: Pass (3)
- Capability 2: Partial (2)
- Capability 3: Pass (3)
- Effectiveness = (3+2+3) / (3×3) × 100 = 89%
```

### Effectiveness Rating

| Score | Rating | Board Color |
|-------|--------|-------------|
| ≥90% | Effective | Green |
| 70-89% | Partially Effective | Amber |
| <70% | Not Effective | Red |

### Maturity Level Calculation

```
Current Level = Highest level where ALL criteria are met

If L1_Met = No → Level 0
If L1_Met = Yes, L2_Met = No → Level 1
If L2_Met = Yes, L3_Met = No → Level 2
If L3_Met = Yes, L4_Met = No → Level 3
If L4_Met = Yes, L5_Met = No → Level 4
If L5_Met = Yes → Level 5

Note: If a level is N/A (max level exceeded), auto-pass to previous level
```

### Gap Calculation

```
Gap = Target_Level - Current_Level

Gap Rating:
- 0 = On Target (maintain)
- 1 = Minor Gap (address within 12 months)
- 2 = Significant Gap (address within 6 months)
- 3+ = Critical Gap (immediate action)
```
