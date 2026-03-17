# Controls Module Architecture

This folder contains comprehensive documentation for the RiskReady GRC controls management module.

## Document Index

### Core Control Models

| # | Document | Description |
|---|----------|-------------|
| 01 | [Control System](01-control-system.md) | Core control model, themes, frameworks, effectiveness calculation |
| 02 | [Capability & Maturity System](02-capability-maturity-system.md) | Capabilities, assessments, L1-L5 maturity model |
| 03 | [Effectiveness Testing System](03-effectiveness-testing-system.md) | 3-layer testing (Design, Implementation, Operating) |
| 04 | [Metrics & Monitoring System](04-metrics-monitoring-system.md) | RAG status, trends, collection frequencies |

### Compliance & Governance

| # | Document | Description |
|---|----------|-------------|
| 05 | [SOA System](05-soa-system.md) | Statement of Applicability, versioning, approval workflow |
| 06 | [Cross-Reference System](06-cross-reference-system.md) | Multi-framework mapping (ISO, SOC2, NIS2, DORA) |

### Reporting

| # | Document | Description |
|---|----------|-------------|
| 07 | [Reporting & Gap Analysis](07-reporting-gap-analysis.md) | Effectiveness reports, maturity heatmaps, gap analysis |

---

## Quick Reference

### Control Themes (ISO 27001:2022)

| Theme | Code | Controls |
|-------|------|----------|
| ORGANISATIONAL | A.5.x | Policies, governance, asset management |
| PEOPLE | A.6.x | HR security, awareness, termination |
| PHYSICAL | A.7.x | Secure areas, equipment protection |
| TECHNOLOGICAL | A.8.x | Access control, cryptography, network |

### Supported Frameworks

| Framework | Standard | Focus |
|-----------|----------|-------|
| ISO | ISO 27001:2022 | Information Security Management |
| SOC2 | SOC 2 Type II | Trust Services Criteria |
| NIS2 | NIS2 Directive (EU) | Network and Information Security |
| DORA | Digital Operational Resilience Act | Financial Sector ICT |

### Maturity Levels (CMM-Style)

| Level | Name | Description |
|-------|------|-------------|
| 0 | Non-existent | No capability exists |
| 1 | Initial | Ad-hoc, person-dependent |
| 2 | Repeatable | Basic processes documented |
| 3 | Defined | Standardized organization-wide |
| 4 | Managed | Measured with KPIs |
| 5 | Optimizing | Continuous improvement |

### Effectiveness Test Types

| Type | Question | Evidence |
|------|----------|----------|
| DESIGN | Is control designed correctly? | Design docs, procedures |
| IMPLEMENTATION | Is control deployed as designed? | Config exports, screenshots |
| OPERATING | Does control work consistently? | Logs, sample testing |

### Test Results

| Result | Meaning |
|--------|---------|
| PASS | All criteria satisfied |
| PARTIAL | Some criteria met |
| FAIL | Significant deficiencies |
| NOT_TESTED | Test not performed |
| NOT_APPLICABLE | Test doesn't apply |

### Effectiveness Rating Thresholds

| Score | Rating |
|-------|--------|
| >= 90% | EFFECTIVE |
| >= 70% | PARTIALLY_EFFECTIVE |
| < 70% | NOT_EFFECTIVE |

### Gap Priority Classification

| Gap | Priority |
|-----|----------|
| >= 3 | CRITICAL |
| >= 2 | HIGH |
| < 2 | MEDIUM |

### RAG Status

| Status | Meaning |
|--------|---------|
| GREEN | Within acceptable limits |
| AMBER | Warning - attention needed |
| RED | Critical - action required |
| NOT_MEASURED | No current measurement |

### SOA Workflow

```
DRAFT → PENDING_REVIEW → APPROVED → SUPERSEDED (on new version)
```

---

## Key Services Map

```
prisma/schema/controls.prisma     ← Data models
src/controls/services/
  ├── control.service.ts          ← Control CRUD, effectiveness
  ├── capability.service.ts       ← Capability management
  ├── assessment.service.ts       ← Maturity assessments
  ├── effectiveness-test.service.ts ← 3-layer testing
  ├── metric.service.ts           ← Capability metrics
  ├── soa.service.ts              ← Statement of Applicability
  ├── soa-entry.service.ts        ← SOA entry management
  ├── control-reporting.service.ts ← Reports
  ├── gap-analysis.service.ts     ← Gap analysis
  └── cross-reference.service.ts  ← Framework mapping
```

---

## Data Model Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CONTROLS MODULE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Control (A.5.1, A.8.12, etc.)                                      │
│  ├── theme: ORGANISATIONAL | PEOPLE | PHYSICAL | TECHNOLOGICAL      │
│  ├── framework: ISO | SOC2 | NIS2 | DORA                            │
│  ├── implementationStatus: NOT_STARTED | PARTIAL | IMPLEMENTED      │
│  │                                                                   │
│  └── Capability[] (5.1-C01, 5.1-C02, etc.)                          │
│      ├── type: PROCESS | TECHNOLOGY | PEOPLE | PHYSICAL             │
│      ├── l1Criteria...l5Criteria (maturity levels)                  │
│      │                                                               │
│      ├── CapabilityAssessment[]                                      │
│      │   ├── currentMaturity: 0-5                                   │
│      │   ├── targetMaturity: 0-5                                    │
│      │   └── gap: calculated                                        │
│      │                                                               │
│      ├── CapabilityEffectivenessTest[]                              │
│      │   ├── testType: DESIGN | IMPLEMENTATION | OPERATING          │
│      │   └── testResult: PASS | PARTIAL | FAIL | NOT_TESTED         │
│      │                                                               │
│      └── CapabilityMetric[]                                          │
│          ├── greenThreshold, amberThreshold, redThreshold           │
│          ├── status: GREEN | AMBER | RED | NOT_MEASURED             │
│          ├── trend: IMPROVING | STABLE | DECLINING | NEW            │
│          └── MetricHistory[]                                         │
│                                                                      │
│  StatementOfApplicability                                            │
│  ├── version: "1.0", "2.0"                                          │
│  ├── status: DRAFT | PENDING_REVIEW | APPROVED | SUPERSEDED         │
│  └── SOAEntry[]                                                      │
│      ├── applicable: true/false                                      │
│      └── implementationStatus                                        │
│                                                                      │
│  FrameworkCrossReference                                             │
│  ├── sourceFramework/sourceControlId                                 │
│  ├── targetFramework/targetControlId                                 │
│  └── mappingType: EQUIVALENT | RELATED | PARTIAL                    │
│                                                                      │
│  ControlDomain                                                       │
│  ├── name: "Governance & Policy", "Access Control"                  │
│  └── isoControls, soc2Criteria, nis2Articles, doraArticles          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Status - Full Stack Verification

### Database Layer (Prisma Schema)

| Model | Status | Notes |
|-------|--------|-------|
| Control | ✅ Fully implemented | Multi-framework support |
| Capability | ✅ Fully implemented | L1-L5 criteria, 3-layer test criteria |
| CapabilityAssessment | ✅ Fully implemented | Auto-gap calculation |
| CapabilityMetric | ✅ Fully implemented | RAG thresholds, history |
| MetricHistory | ✅ Fully implemented | Trend tracking |
| CapabilityEffectivenessTest | ✅ Fully implemented | Design/Implementation/Operating |
| StatementOfApplicability | ✅ Fully implemented | Versioning, approval workflow |
| SOAEntry | ✅ Fully implemented | Control linkage |
| FrameworkCrossReference | ✅ Fully implemented | ISO↔SOC2↔NIS2↔DORA |
| ControlDomain | ✅ Fully implemented | Domain groupings |

### Backend API Layer (Controllers)

| Controller | Endpoints | Status |
|------------|-----------|--------|
| ControlController | GET, PUT, stats, effectiveness, heatmap, gap-analysis | ✅ Implemented |
| CapabilityController | GET, stats, by-control | ✅ Implemented |
| AssessmentController | GET, POST, PUT, DELETE, by-capability | ✅ Implemented |
| MetricController | GET, PUT value, dashboard, due | ✅ Implemented |
| EffectivenessTestController | GET, POST, PUT, DELETE, summary | ✅ Implemented |
| SOAController | GET, POST, PUT, DELETE, approve, submit, sync | ✅ Implemented |
| CrossReferenceController | matrix, stats, domains, search, framework pivot | ✅ Implemented |

### Frontend API Client (`controls-api.ts`)

| API Area | Functions | Status |
|----------|-----------|--------|
| Controls | getControls, getControl, updateControl, getStats | ✅ Implemented |
| Capabilities | getCapabilities, getCapability, getStats | ✅ Implemented |
| Assessments | CRUD, by-capability | ✅ Implemented |
| Metrics | CRUD, updateValue, dashboard, due | ✅ Implemented |
| Effectiveness Tests | CRUD, summary | ✅ Implemented |
| SOA | CRUD, approve, submit, sync, entries | ✅ Implemented |
| Cross-Reference | matrix, stats, domains, search, pivot | ✅ Implemented |
| Reports | effectiveness, heatmap, gap-analysis | ✅ Implemented |

### Frontend UI (Pages)

| Page | Path | Status |
|------|------|--------|
| Controls Command Center | `/controls` | ✅ Implemented |
| Controls Dashboard | `/controls/dashboard` | ✅ Implemented |
| Controls Library | `/controls/library` | ✅ Implemented |
| Control Detail | `/controls/library/:id` | ✅ Implemented |
| Controls Browser | `/controls/browser` | ✅ Implemented |
| Framework Cross-Reference | `/controls/cross-reference` | ✅ Implemented |
| SOA List | `/controls/soa` | ✅ Implemented |
| SOA Detail | `/controls/soa/:id` | ✅ Implemented |
| SOA Create | `/controls/soa/create` | ✅ Implemented |
| Capabilities Page | `/controls/operations/capabilities` | ✅ Implemented |
| Effectiveness Tests Page | `/controls/operations/tests` | ✅ Implemented |
| Maturity Assessments Page | `/controls/operations/assessments` | ✅ Implemented |
| Capability Detail | `/controls/capabilities/:id` | ✅ Implemented |
| Capability Metric | `/controls/capabilities/:id/metrics/:metricId` | ✅ Implemented |
| Capability Test | `/controls/capabilities/:id/tests/:testId` | ✅ Implemented |
| Effectiveness Report | `/controls/analysis/effectiveness` | ✅ Implemented |
| Gap Analysis | `/controls/analysis/gaps` | ✅ Implemented |
| Maturity Heatmap | `/controls/analysis/maturity` | ✅ Implemented |
| ISO 27001 Coverage | `/controls/analysis/coverage` | ✅ Implemented |
| Trend Analysis | `/controls/analysis/trends` | ✅ Implemented |

### Frontend Components (44 total)

| Category | Components | Status |
|----------|------------|--------|
| Control Browser | control-browser, control-row, control-slide-over, filter-bar | ✅ Implemented |
| Capability | capability-row, capability-slide-over, capability-details | ✅ Implemented |
| Command Center | quick-stats, effectiveness-summary, framework-health, activity-feed | ✅ Implemented |
| Control Details | control-details-content, detail-hero, detail-stat-card | ✅ Implemented |
| Metric Details | metric-overview, metric-history, metric-measurements, metric-trends | ✅ Implemented |
| Test Details | test-overview, test-execution, test-results, test-evidence | ✅ Implemented |
| Cross-Reference | matrix-view, pivot-view, search-view, domain-matrix-view | ✅ Implemented |
| Visualizations | effectiveness-gauge, maturity-radar, maturity-indicator, effectiveness-indicator | ✅ Implemented |
| Reports | control-metrics, control-insights, framework-coverage, implementation-matrix | ✅ Implemented |

### Feature Implementation Summary

| Feature | DB | API | UI | Overall |
|---------|----|----|----|----|
| Core control CRUD | ✅ | ✅ | ✅ | **100%** |
| Multi-framework support | ✅ | ✅ | ✅ | **100%** |
| Capability management | ✅ | ✅ | ✅ | **100%** |
| Maturity assessments (L1-L5) | ✅ | ✅ | ✅ | **100%** |
| 3-layer effectiveness testing | ✅ | ✅ | ✅ | **100%** |
| Metric monitoring & RAG | ✅ | ✅ | ✅ | **100%** |
| SOA versioning & approval | ✅ | ✅ | ✅ | **100%** |
| Framework cross-reference | ✅ | ✅ | ✅ | **100%** |
| Gap analysis | ✅ | ✅ | ✅ | **100%** |
| Effectiveness reports | ✅ | ✅ | ✅ | **100%** |
| Maturity heatmaps | ✅ | ✅ | ✅ | **100%** |
| Auto nonconformity on test fail | ✅ | ✅ | - | **80%** (event-driven) |
| Dashboard & command center | ✅ | ✅ | ✅ | **100%** |

### Not Implemented / Gaps

| Feature | Status | Notes |
|---------|--------|-------|
| Automated metric collection | ❌ Not implemented | Manual collection only |
| Metric alerting (overdue) | ⚠️ Partial | API exists, no notifications |
| Control versioning | ❌ Not implemented | Only SOA has versioning |
| Bulk control import | ❌ Not implemented | Manual creation only |
| Control templates | ❌ Not implemented | Each org creates from scratch |
| Audit trail for control changes | ⚠️ Partial | Basic createdBy/updatedBy only |

---

## Integration Points

| Module | Integration |
|--------|-------------|
| Risk Module | Controls feed F2 (Control Effectiveness) factor |
| Audit Module | Nonconformities linked to controls/capabilities |
| Evidence Module | Evidence linked to controls, capabilities, tests |
| Policy Module | Documents mapped to controls |
| ITSM Module | Assets linked to controls |
| Incident Module | Incidents linked to controls |
