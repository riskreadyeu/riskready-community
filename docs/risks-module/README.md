# Risk Management Module Documentation

**Version:** 1.0  
**Created:** December 2024  

---

## Documentation Index

This module provides comprehensive enterprise risk management capabilities aligned with ISO 27001, SOC 2, NIS2, and DORA frameworks.

| Document | Description |
|----------|-------------|
| [01 - Overview](./01-overview.md) | Module architecture, core components, and process flow |
| [02 - Data Model](./02-data-model.md) | Entity definitions, enumerations, and relationships |
| [03 - Risk Scoring](./03-risk-scoring.md) | Risk scoring methodology (5×5 matrix) |
| [04 - API Reference](./04-api-reference.md) | REST API endpoints documentation |
| [05 - User Guide](./05-user-guide.md) | End-user guide for risk management workflows |
| [06 - Policy Mapping](./06-policy-mapping.md) | Maps ISO 27001 policies to app implementation |
| [07 - Policy Gap Analysis](./07-policy-gap-analysis.md) | Gaps between policies and app |
| [08 - ISO 27001 Compliance Review](./08-iso27001-compliance-review.md) | **AUDIT** - Certification readiness review |

---

## Quick Start

### Key Concepts

1. **Risks**: Top-level risk definitions categorized by tier (Core, Extended, Advanced)
2. **Risk Scenarios**: Specific scenarios under each risk with cause-event-consequence analysis
3. **Key Risk Indicators (KRIs)**: Metrics that monitor risk levels with RAG status
4. **Treatment Plans**: Strategies to mitigate, transfer, accept, or avoid risks
5. **Risk Tolerance Statements (RTS)**: Organizational risk appetite definitions
6. **Risk Scoring**: Simple 5×5 risk matrix using likelihood (1-5) × impact (1-5) = score (1-25)

### Module Structure

```
apps/server/src/risks/
├── risks.module.ts
├── controllers/
│   ├── risk.controller.ts
│   ├── risk-scenario.controller.ts
│   ├── kri.controller.ts
│   ├── treatment-plan.controller.ts
│   └── rts.controller.ts
├── services/
│   ├── risk.service.ts
│   ├── risk-scenario.service.ts
│   ├── kri.service.ts
│   ├── treatment-plan.service.ts
│   └── rts.service.ts
└── utils/
    └── risk-scoring.ts
```

```
apps/web/src/pages/risks/
├── RisksDashboardPage.tsx
├── RiskRegisterPage.tsx
├── RiskDetailPage.tsx
├── RiskScenarioDetailPage.tsx
├── RiskAssessmentPage.tsx
├── RiskAnalyticsPage.tsx
├── KRIListPage.tsx
├── KRIDetailPage.tsx
├── RTSListPage.tsx
├── RTSDetailPage.tsx
├── TreatmentPlanListPage.tsx
└── TreatmentPlanDetailPage.tsx
```

---

## Framework Alignment

| Framework | Alignment |
|-----------|-----------|
| **ISO 27001:2022** | 6.1.2 Information security risk assessment |
| **SOC 2** | CC3.1-CC3.4 Risk Assessment criteria |
| **NIS2** | Article 21 - Risk management measures |
| **DORA** | Article 6 - ICT risk management framework |

---

## Related Modules

- **Controls Module**: Link risks to mitigating controls
- **Organisation Module**: Organisation context for risk scope
- **Applications Module**: Application-specific risk assessments (ISRA)
