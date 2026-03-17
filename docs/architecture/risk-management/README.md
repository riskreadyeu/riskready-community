# Risk Management Module Architecture

This folder contains comprehensive documentation for the RiskReady GRC risk management module.

## Document Index

### Core Risk Models

| # | Document | Description |
|---|----------|-------------|
| 01 | [Organisation Risk Profile](01-organisation-risk-profile.md) | Organisation profiles, size tiers, industry sectors, appetite levels |
| 02 | [Risk Tolerance Statements](02-risk-tolerance-statements.md) | RTS configuration, tolerance evaluation, threshold mapping |
| 03 | [BIRT Configuration](03-birt-configuration.md) | Business Impact Reference Table, impact categories, weights |
| 04 | [Risk Scenarios](04-risk-scenarios.md) | Basic scenario model, lifecycle, relationships |
| 05 | [Risk Scenario System](05-risk-scenario-system.md) | **Complete** scenario system with factors (F1-F6), impacts (I1-I5), FAIR, deep-dive analysis |

### Supporting Systems

| # | Document | Description |
|---|----------|-------------|
| 06 | [KRI System](06-kri-system.md) | Key Risk Indicators, RAG status, alerting, trend analysis |
| 07 | [Threat Catalog System](07-threat-catalog-system.md) | Threat library, MITRE ATT&CK mapping, TEF data |
| 08 | [Risk Governance System](08-risk-governance-system.md) | RBAC, governance roles, score-based approvals, escalation |
| 09 | [Risk Lifecycle Automation](09-risk-lifecycle-automation.md) | Event bus, notifications, review scheduler, acceptance expiry |
| 10 | [Audit & Versioning System](10-audit-versioning-system.md) | Assessment snapshots, version comparison, audit trails |

### Reporting & Integration

| # | Document | Description |
|---|----------|-------------|
| 11 | [Export & Reporting System](11-export-reporting-system.md) | Risk register export, heat maps, CSV/JSON generation |
| 12 | [Risk Aggregation System](12-risk-aggregation-system.md) | Portfolio rollup, tier/framework summaries, dashboards |
| 13 | [Entity Resolver System](13-entity-resolver-system.md) | Entity resolution for factor/impact calculations |
| 14 | [Risk Treatment System](14-risk-treatment-system.md) | Treatment plans, actions, ROSI calculation |

---

## Quick Reference

### Risk Calculation Formula

```
Inherent Likelihood = (F1 × 34%) + (F2 × 33%) + (F3 × 33%)  → 1-5
Inherent Impact = MAX(I1, I2, I3, I4, I5)                   → 1-5
Inherent Score = Likelihood × Impact                         → 1-25

Residual Score = Inherent Score - Control Reduction          → 1-25
```

### Factor Definitions

| Factor | Name | Weight | Source |
|--------|------|--------|--------|
| F1 | Threat Frequency | 34% | ThreatCatalog |
| F2 | Control Effectiveness | 33% | Control test results |
| F3 | Gap/Vulnerability | 33% | Asset/vendor exposure |
| F4 | Incident History | 0% | Historical (informational) |
| F5 | Attack Surface | 0% | Merged into F3 |
| F6 | Environmental | 0% | Threat intel (informational) |

### Impact Categories

| Impact | Name | Measures |
|--------|------|----------|
| I1 | Financial | Direct monetary loss |
| I2 | Operational | Downtime, productivity |
| I3 | Legal/Regulatory | Compliance violations |
| I4 | Reputational | Brand damage |
| I5 | Strategic | Long-term objectives |

### Governance Roles

| Role | Approval Authority |
|------|-------------------|
| RISK_ANALYST | Create/assess only |
| RISK_OWNER | Accept within tolerance |
| TREATMENT_OWNER | Treatment execution |
| CISO | Accept score ≤ 15 |
| RISK_COMMITTEE | Accept score ≤ 20 |
| BOARD | Accept any score |

### Risk Levels

| Score | Level | Color | Action |
|-------|-------|-------|--------|
| 1-7 | LOW | Green | Accept with monitoring |
| 8-14 | MEDIUM | Yellow | Treatment within 90 days |
| 15-19 | HIGH | Orange | Treatment within 30 days |
| 20-25 | CRITICAL | Red | Immediate treatment |

---

## Key Services Map

```
prisma/schema/controls.prisma     ← Data models
src/risks/services/
  ├── risk.service.ts             ← Risk CRUD
  ├── risk-scenario.service.ts    ← Scenario management
  ├── risk-calculation.service.ts ← Score calculation
  ├── monte-carlo.service.ts      ← FAIR simulation
  ├── loss-magnitude.service.ts   ← Loss profiles
  ├── rts.service.ts              ← Tolerance statements
  ├── birt.service.ts             ← Impact configuration
  ├── kri.service.ts              ← KRI management
  ├── kri-alert.service.ts        ← KRI alerting
  ├── threat-catalog.service.ts   ← Threat library
  ├── risk-authorization.service.ts ← RBAC
  ├── governance.service.ts       ← Governance workflows
  ├── risk-notification.service.ts ← Notifications
  ├── risk-event-bus.service.ts   ← Event sourcing
  ├── review-scheduler.service.ts ← Scheduled reviews
  ├── acceptance-expiry.service.ts ← Acceptance lifecycle
  ├── assessment-versioning.service.ts ← Snapshots
  ├── risk-audit.service.ts       ← Audit trails
  ├── risk-export.service.ts      ← Export/reporting
  ├── risk-aggregation.service.ts ← Portfolio rollup
  ├── scenario-entity-resolver.service.ts ← Entity resolution
  ├── treatment-plan.service.ts   ← Treatment management
  └── control-risk-integration.service.ts ← Control effectiveness
```

---

## Implementation Status Summary

| Component | Status |
|-----------|--------|
| Core scenario calculation | ✅ Fully implemented |
| FAIR Monte Carlo simulation | ✅ Fully implemented |
| Tolerance evaluation | ✅ Fully implemented |
| KRI management & alerting | ✅ Fully implemented |
| Governance & authorization | ✅ Fully implemented |
| Notifications (in-app) | ✅ Fully implemented |
| Audit & versioning | ✅ Fully implemented |
| Export (JSON/CSV) | ✅ Fully implemented |
| Automatic entity linking | ⚠️ 20% - Manual only |
| Factor suggestions (F2/F3) | ⚠️ 50% - F1 only |
| Two residual calculation paths | ⚠️ 80% - Potential divergence |
| Real-time threat intelligence | ❌ Not implemented |
| Multi-scenario correlation | ❌ Not implemented |
| Sensitivity analysis tools | ❌ Not implemented |
| Data freshness indicators | ❌ Not implemented |
| FAIR visualization/export | ❌ Not implemented |
