# Controls Module Documentation

**Version:** 1.0  
**Created:** December 2024  

---

## Overview

The Controls Module implements ISO 27001:2022 control management for the RiskReady ISMS platform. It provides a comprehensive three-layer assurance model:

1. **Control Assurance** - Point-in-time capability testing
2. **Capability Metrics** - Continuous monitoring with RAG thresholds
3. **Maturity Assessment** - 5-level capability maturity model

## Documentation Index

| Document | Description |
|----------|-------------|
| [00-implementation-plan.md](./00-implementation-plan.md) | Detailed implementation plan with phases and deliverables |
| [01-data-model.md](./01-data-model.md) | Entity definitions, relationships, and Prisma schema |
| [02-checklist-tracker.md](./02-checklist-tracker.md) | Task checklists for tracking implementation progress |

## Quick Stats

| Metric | Count |
|--------|-------|
| ISO 27001:2022 Controls | 93 |
| Capabilities | 244 |
| Capability Metrics | 244 |
| Unique Metric Types | 41 |

## Data Sources

All data is imported from the following Excel files in `_temp/ISO27001/`:

| File | Purpose |
|------|---------|
| `ISO27001_Control_Assurance_Enhanced.xlsx` | Control catalog, capabilities, test criteria |
| `ISO27001_Capability_Metrics.xlsx` | Continuous monitoring metric definitions |
| `ISO27001_Maturity_Assessment.xlsx` | L1-L5 maturity criteria and evidence |
| `ISO27001_Risk_Methodology_Template.xlsx` | Statement of Applicability fields |

## Architecture

```
┌─────────────────┐
│    Control      │  93 ISO 27001:2022 controls
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│   Capability    │  244 testable capabilities
└────────┬────────┘
         │
    ┌────┴────┐
    │ 1:N     │ 1:N
    ▼         ▼
┌────────────┐  ┌─────────────────────┐
│   Metric   │  │    Assessment       │
│────────────│  │─────────────────────│
│ RAG status │  │ Test result         │
│ Thresholds │  │ Maturity level      │
│ Trends     │  │ Gap analysis        │
└────────────┘  └─────────────────────┘
```

## Implementation Phases

| Phase | Description | Duration |
|-------|-------------|----------|
| 1 | Database Schema | 2-3 days |
| 2 | Data Import & Seeding | 3-4 days |
| 3 | Backend API | 5-7 days |
| 4 | Frontend UI | 7-10 days |
| 5 | Integration & Testing | 3-4 days |
| 6 | Risk Module Preparation | 2-3 days |

**Total Estimated Duration:** 22-31 days

## Key Features

### Control Catalog
- Full ISO 27001:2022 Annex A coverage
- Statement of Applicability (SoA) management
- Implementation status tracking
- Filtering by theme, status, applicability

### Capability Testing
- Auditor-ready test criteria
- Pass/Partial/Fail results
- Evidence location tracking
- Control effectiveness calculation

### Maturity Assessment
- 5-level maturity model (Initial → Optimized)
- Level-specific criteria and evidence requirements
- Gap analysis (current vs target)
- Dependency tracking between capabilities

### Continuous Monitoring
- 244 pre-defined metrics
- RAG status thresholds
- Collection frequency tracking
- Trend analysis
- Dashboard visualization

### Reporting
- Control effectiveness by theme
- Maturity heatmap
- Gap analysis prioritization
- Export to Excel/PDF

## Integration with Risk Module

The Controls module is designed to integrate with the upcoming Risk module:

| Integration Point | Description |
|-------------------|-------------|
| Control → Risk | Controls linked to parent risks |
| Control → Scenario | Controls linked to risk scenarios |
| Capability Fail → Treatment Plan | Auto-create treatment plan on test failure |
| Metric Red → Treatment Plan | Auto-create treatment plan on threshold breach |
| N/A Control → Exception | Exception register for non-applicable controls |

## Getting Started

1. Review the [Implementation Plan](./00-implementation-plan.md)
2. Understand the [Data Model](./01-data-model.md)
3. Track progress using the [Checklist Tracker](./02-checklist-tracker.md)

## Related Documentation

- [Architecture Overview](../architecture/01-system-overview.md)
- [Database Schema](../architecture/04-database-schema.md)
- [API Design](../architecture/06-api-design.md)
