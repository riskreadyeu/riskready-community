# Supply Chain Module Overview

## Introduction

The Supply Chain / Third-Party Risk Assessment (TPRA) module provides comprehensive vendor and third-party risk management capabilities. It enables organizations to assess, monitor, and manage risks associated with their supply chain and third-party relationships in compliance with ISO 27001, NIS2, and DORA regulations.

## Purpose & Objectives

### Business Objectives

1. **Risk Visibility**: Gain complete visibility into third-party risk exposure across all vendors
2. **Regulatory Compliance**: Meet DORA, NIS2, and ISO 27001 requirements for third-party oversight
3. **Operational Resilience**: Ensure business continuity through proper vendor management
4. **Concentration Risk Management**: Identify and mitigate vendor concentration risks
5. **Audit Readiness**: Maintain documentation for regulatory audits and examinations

### Key Capabilities

| Capability | Description |
|------------|-------------|
| Vendor Lifecycle Management | Track vendors from prospect through termination |
| Risk Assessment | Conduct layered assessments (ISO/NIS2/DORA) |
| Contract Management | DORA Article 30 compliance tracking |
| Ongoing Monitoring | SLA tracking, periodic reviews, incident management |
| Exit Planning | DORA-compliant exit strategies for critical vendors |
| Regulatory Reporting | DORA ICT Register and NIS2 reports |

## Regulatory Framework Support

### ISO 27001:2022

The module supports the following ISO 27001 Annex A controls:

| Control | Description | Module Feature |
|---------|-------------|----------------|
| A.5.19 | Information security in supplier relationships | Vendor assessments |
| A.5.20 | Addressing security in supplier agreements | Contract management |
| A.5.21 | Managing ICT supply chain | Concentration risk analysis |
| A.5.22 | Monitoring and review of supplier services | SLA tracking, reviews |
| A.5.23 | Information security for cloud services | Cloud vendor assessments |

### NIS2 Directive

| Article | Requirement | Module Feature |
|---------|-------------|----------------|
| Art. 21(2)(d) | Supply chain security | Vendor risk assessments |
| Art. 21(2)(e) | Security in network and information systems acquisition | Assessment questionnaire |
| Art. 23 | Reporting obligations | Incident management with 24h/72h timelines |
| Art. 26 | Cybersecurity risk-management measures | Ongoing monitoring |

### DORA (Digital Operational Resilience Act)

| Article | Requirement | Module Feature |
|---------|-------------|----------------|
| Art. 28 | Third-party ICT risk management | Vendor lifecycle management |
| Art. 28(8) | Exit strategies | Exit plans for critical vendors |
| Art. 29 | Concentration risk | Concentration risk analysis |
| Art. 30 | Key contractual provisions | Contract compliance checklist |
| Art. 31 | Register of information | DORA ICT Register report |

## Module Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├──────────────────────────────────────────────────────────────────┤
│  Dashboard │ Vendor Mgmt │ Assessments │ Contracts │ Monitoring  │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API Client (supply-chain-api.ts)             │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS)                              │
├──────────────────────────────────────────────────────────────────┤
│  Controllers: Vendor │ Assessment │ Contract │ Review │ Dashboard│
├──────────────────────────────────────────────────────────────────┤
│  Services: Business logic, validation, scoring                   │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL via Prisma)              │
├──────────────────────────────────────────────────────────────────┤
│  Vendor │ VendorAssessment │ VendorContract │ VendorReview │ etc │
└──────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
Backend:
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

Frontend:
apps/web/src/
├── components/supply-chain/
│   └── supply-chain-sidebar.tsx
├── lib/
│   └── supply-chain-api.ts
└── pages/supply-chain/
    ├── SupplyChainDashboardPage.tsx
    ├── VendorRegisterPage.tsx
    ├── VendorDetailPage.tsx
    ├── VendorFormPage.tsx
    ├── AssessmentRegisterPage.tsx
    ├── AssessmentDetailPage.tsx
    ├── NewAssessmentPage.tsx
    ├── ContractRegisterPage.tsx
    ├── ContractDetailPage.tsx
    ├── ContractFormPage.tsx
    ├── ReviewSchedulePage.tsx
    ├── SLATrackingPage.tsx
    ├── IncidentsPage.tsx
    ├── ExitPlansPage.tsx
    ├── FindingsPage.tsx
    ├── ConcentrationRiskPage.tsx
    ├── DORAReportPage.tsx
    └── QuestionBankPage.tsx

Database Schema:
apps/server/prisma/schema/supply-chain.prisma
```

## Vendor Lifecycle

The module manages vendors through a complete lifecycle:

```
┌─────────────┐    ┌────────────┐    ┌───────────────┐    ┌─────────────┐
│  PROSPECT   │ -> │ ASSESSMENT │ -> │ DUE_DILIGENCE │ -> │ CONTRACTING │
└─────────────┘    └────────────┘    └───────────────┘    └─────────────┘
                                                                  │
                                                                  ▼
┌─────────────┐    ┌────────────┐    ┌───────────────┐    ┌─────────────┐
│ TERMINATED  │ <- │ OFFBOARDING│ <- │     REVIEW    │ <- │   ACTIVE    │
└─────────────┘    └────────────┘    └───────────────┘    └─────────────┘
                                             │
                                             ▼
                                     ┌───────────────┐
                                     │  MONITORING   │ (Enhanced oversight)
                                     └───────────────┘
```

### Lifecycle Stages

| Stage | Description | Key Activities |
|-------|-------------|----------------|
| **Prospect** | Initial vendor consideration | Collect basic information |
| **Assessment** | Risk assessment in progress | Complete questionnaire |
| **Due Diligence** | Deep-dive verification | Evidence collection, verification |
| **Contracting** | Contract negotiation | DORA Art. 30 compliance check |
| **Onboarding** | Service setup | Integration, access provisioning |
| **Active** | Normal operations | Ongoing monitoring |
| **Monitoring** | Enhanced oversight | Triggered by incidents/poor performance |
| **Review** | Periodic assessment | Scheduled reviews based on tier |
| **Offboarding** | Exit in progress | Execute exit plan |
| **Terminated** | Relationship ended | Archive, lessons learned |

## Vendor Tiering

### Tier Classification

| Tier | Description | Assessment Scope | Review Frequency |
|------|-------------|------------------|------------------|
| **CRITICAL** | Highest risk, DORA critical ICT | All 223 questions | Quarterly |
| **HIGH** | High risk vendors | 211 questions | Semi-annually |
| **MEDIUM** | Standard risk | 176 questions | Annually |
| **LOW** | Minimal risk | 176 questions | Biennially |

### Automatic Tier Calculation

The system calculates tier based on:

1. **Assessment Score** - Lower scores indicate higher risk
2. **Service Criticality** - Critical services elevate tier
3. **DORA Critical ICT Flag** - Automatically CRITICAL if set
4. **Essential Function Support** - Automatically CRITICAL if set

```
Algorithm:
1. If isCriticalIctProvider OR supportsEssentialFunction → CRITICAL
2. If hasHighCriticalityService AND score < 60 → CRITICAL
3. If hasHighCriticalityService OR score < 70 → HIGH
4. If score < 80 → MEDIUM
5. Otherwise → LOW
```

## Key Features

### 1. Layered Assessment Framework

Three compliance layers with cumulative questions:

- **ISO 27001 (Baseline)**: 102 questions covering core security controls
- **NIS2 (Adds)**: 55 additional questions for EU directive compliance
- **DORA (Adds)**: 66 additional questions for financial sector requirements

### 2. 16-Domain Question Structure

1. Governance & Organization
2. Information Security Management
3. Risk Management
4. HR Security
5. Asset Management
6. Access Control
7. Cryptography
8. Physical Security
9. Operations Security
10. Communications Security
11. System Development
12. Supplier Management
13. Incident Management
14. Business Continuity
15. Compliance
16. Data Protection

### 3. DORA Article 30 Contract Compliance

Interactive checklist covering all mandatory contract clauses:

- Service description
- Data processing locations
- Location change notification
- Availability & quality objectives
- Incident assistance
- Audit rights
- Regulatory access rights
- Termination rights
- Exit/transition provisions
- Subcontracting conditions
- Data protection clauses

### 4. Concentration Risk Analysis

Identifies single points of failure:

- By service type (one vendor for critical service)
- By geography (all vendors in one region)
- By criticality (over-reliance on one provider)

### 5. Exit Planning (DORA Art. 28(8))

Mandatory for critical ICT providers:

- Pre-identified alternative vendors
- Data extraction procedures
- Service transition timeline
- Regular testing of exit plans

## Integration Points

### Current Integrations

| Module | Integration Type | Description |
|--------|------------------|-------------|
| User Management | Direct | Owner assignments, reviewer assignments |
| Audit Trail | Built-in | VendorHistory tracks all changes |

### Planned Integrations

| Module | Integration Type | Description |
|--------|------------------|-------------|
| Incidents | Future | Link vendor incidents to main incident system |
| Risk Register | Future | Feed vendor risks to enterprise risk register |
| Assets | Future | Link vendors to assets they support |
| Controls | Future | Map assessments to control framework |

## Security Considerations

### Data Classification

| Data Type | Classification | Handling |
|-----------|---------------|----------|
| Vendor Details | Internal | Standard access controls |
| Financial Data | Confidential | Role-based access |
| Assessment Results | Confidential | Assessor/reviewer access |
| Contract Terms | Confidential | Legal/business owner access |

### Access Control

- All endpoints protected by JWT authentication
- Role-based access to sensitive operations
- Owner-based filtering for vendor data

## Performance Considerations

### Database Indexes

Key indexes are defined for:
- `vendorCode`, `name` (quick lookups)
- `tier`, `status` (filtering)
- `inDoraScope`, `isCriticalIctProvider` (regulatory queries)
- `nextAssessmentDue` (scheduling)

### Pagination

All list endpoints support pagination:
- Default page size: 10 items
- Maximum page size: 100 items
- Total count included in response

## Getting Started

1. **Review the Data Model**: See [02-data-model.md](./02-data-model.md)
2. **Explore the API**: See [03-api-reference.md](./03-api-reference.md)
3. **User Workflows**: See [04-user-guide.md](./04-user-guide.md)
4. **Questionnaire Details**: See [05-questionnaire-reference.md](./05-questionnaire-reference.md)
5. **DORA Specifics**: See [06-dora-compliance.md](./06-dora-compliance.md)
