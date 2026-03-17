# Supply Chain / Third-Party Risk Assessment (TPRA) Module

## Documentation Index

This module provides comprehensive third-party risk management capabilities supporting ISO 27001, NIS2, and DORA compliance requirements.

### Quick Start

| Document | Description |
|----------|-------------|
| [01-overview.md](./01-overview.md) | Module introduction, architecture, and key concepts |
| [04-user-guide.md](./04-user-guide.md) | Step-by-step workflows for common tasks |

### Reference Documentation

| Document | Description |
|----------|-------------|
| [02-data-model.md](./02-data-model.md) | Complete Prisma schema and entity documentation |
| [03-api-reference.md](./03-api-reference.md) | API endpoints with request/response examples |
| [05-questionnaire-reference.md](./05-questionnaire-reference.md) | Assessment questionnaire structure and scoring |
| [06-dora-compliance.md](./06-dora-compliance.md) | DORA-specific features and compliance tracking |

---

## Module Summary

### Capabilities

| Feature | Description |
|---------|-------------|
| **Vendor Lifecycle Management** | Track vendors from prospect through termination |
| **Layered Risk Assessment** | 223-question questionnaire (ISO/NIS2/DORA) |
| **Contract Compliance** | DORA Article 30 clause tracking |
| **Ongoing Monitoring** | Reviews, SLA tracking, incident management |
| **Exit Planning** | DORA-compliant exit strategies |
| **Concentration Risk** | Identify single points of failure |
| **Regulatory Reporting** | DORA ICT Register export |

### Key Statistics

| Metric | Value |
|--------|-------|
| Total Questions | 223 |
| ISO 27001 Questions | 102 |
| NIS2 Questions | 55 |
| DORA Questions | 66 |
| Assessment Domains | 16 |
| Vendor Tiers | 4 (Critical, High, Medium, Low) |

### Regulatory Coverage

| Framework | Support Level |
|-----------|---------------|
| **ISO 27001:2022** | Full Annex A controls (A.5.19-A.5.23) |
| **NIS2 Directive** | Art. 21, 23, 26 requirements |
| **DORA Regulation** | Art. 28-31 (third-party ICT risk) |

---

## Architecture Overview

### Backend

```
apps/server/src/supply-chain/
├── supply-chain.module.ts
├── controllers/
│   ├── vendor.controller.ts
│   ├── vendor-assessment.controller.ts
│   ├── vendor-contract.controller.ts
│   ├── vendor-review.controller.ts
│   ├── assessment-question.controller.ts
│   └── supply-chain-dashboard.controller.ts
└── services/
    ├── vendor.service.ts
    ├── vendor-assessment.service.ts
    ├── vendor-contract.service.ts
    ├── vendor-review.service.ts
    └── assessment-question.service.ts
```

### Frontend

```
apps/web/src/pages/supply-chain/
├── SupplyChainDashboardPage.tsx   # Dashboard
├── VendorRegisterPage.tsx         # Vendor list
├── VendorDetailPage.tsx           # Vendor details
├── VendorFormPage.tsx             # Create/edit vendor
├── AssessmentRegisterPage.tsx     # Assessment list
├── AssessmentDetailPage.tsx       # Assessment with questions
├── NewAssessmentPage.tsx          # Create assessment
├── ContractRegisterPage.tsx       # Contract list
├── ContractDetailPage.tsx         # Contract with DORA checklist
├── ContractFormPage.tsx           # Create/edit contract
├── ReviewSchedulePage.tsx         # Periodic reviews
├── SLATrackingPage.tsx            # SLA monitoring
├── IncidentsPage.tsx              # Vendor incidents
├── ExitPlansPage.tsx              # DORA exit plans
├── FindingsPage.tsx               # Open findings
├── ConcentrationRiskPage.tsx      # Concentration analysis
├── DORAReportPage.tsx             # DORA register
└── QuestionBankPage.tsx           # Question browser
```

### Database Schema

```
apps/server/prisma/schema/supply-chain.prisma
```

---

## Quick Reference

### Vendor Tiers

| Tier | Questions | Review Cycle |
|------|-----------|--------------|
| CRITICAL | 223 | Quarterly |
| HIGH | 211 | Semi-annually |
| MEDIUM | 176 | Annually |
| LOW | 176 | Biennially |

### Assessment Scoring

| Score | Meaning |
|-------|---------|
| 0 | N/A |
| 1 | None |
| 2 | Informal |
| 3 | Developing |
| 4 | Defined |
| 5 | Optimized |

### DORA Article 30 Checklist

| Clause | Requirement |
|--------|-------------|
| 30(2)(a) | Service description |
| 30(2)(b) | Data locations |
| 30(2)(c) | Location change notice |
| 30(2)(d) | Availability targets |
| 30(2)(e) | Incident assistance |
| 30(3)(e) | Audit rights |
| 30(3)(e) | Regulator access |
| 30(2)(f) | Termination rights |
| 30(2)(i) | Exit provisions |
| 30(2)(g) | Subcontracting rules |
| 30(2)(h) | Data protection |

---

## API Quick Reference

### Base URL

```
/api/supply-chain
```

### Main Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /dashboard` | Dashboard metrics |
| `GET /vendors` | List vendors |
| `GET /vendors/:id` | Vendor details |
| `POST /vendors` | Create vendor |
| `GET /assessments` | List assessments |
| `POST /assessments` | Create assessment |
| `GET /contracts` | List contracts |
| `GET /contracts/:id/dora-compliance` | DORA checklist |
| `GET /reviews` | List reviews |
| `GET /questions` | Question bank |
| `GET /vendors/concentration-risk` | Concentration analysis |
| `GET /vendors/dora-report` | DORA register |

See [03-api-reference.md](./03-api-reference.md) for complete documentation.

---

## Frontend Routes

| Route | Page |
|-------|------|
| `/supply-chain` | Dashboard |
| `/supply-chain/vendors` | Vendor Register |
| `/supply-chain/vendors/new` | Create Vendor |
| `/supply-chain/vendors/:id` | Vendor Detail |
| `/supply-chain/assessments` | Assessment Register |
| `/supply-chain/assessments/new` | Create Assessment |
| `/supply-chain/assessments/:id` | Assessment Detail |
| `/supply-chain/contracts` | Contract Register |
| `/supply-chain/contracts/new` | Create Contract |
| `/supply-chain/contracts/:id` | Contract Detail |
| `/supply-chain/reviews` | Review Schedule |
| `/supply-chain/sla` | SLA Tracking |
| `/supply-chain/incidents` | Vendor Incidents |
| `/supply-chain/exit-plans` | Exit Plans |
| `/supply-chain/findings` | Open Findings |
| `/supply-chain/concentration` | Concentration Risk |
| `/supply-chain/dora-report` | DORA Report |
| `/supply-chain/questions` | Question Bank |

---

## Seeding Data

To populate the question bank:

```bash
cd apps/server
npx prisma db seed
```

This seeds all 223 assessment questions from the Excel template.

---

## Related Documentation

- [Architecture Overview](../architecture/README.md)
- [API Design](../architecture/06-api-design.md)
- [Database Schema](../architecture/04-database-schema.md)

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12 | Initial implementation with full DORA support |
