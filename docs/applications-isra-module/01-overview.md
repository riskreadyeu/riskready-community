# Module Overview

## Architecture

The Applications & ISRA module is built as a comprehensive solution for application-level information security risk assessment.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Applications & ISRA Module                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Application  │    │    ISRA      │    │     SRL      │      │
│  │  Inventory   │───▶│  Assessment  │───▶│   Controls   │      │
│  │  (43 fields) │    │              │    │              │      │
│  └──────────────┘    └──────┬───────┘    └──────┬───────┘      │
│                             │                    │               │
│                    ┌────────┴────────┐          │               │
│                    │                 │          │               │
│               ┌────▼────┐      ┌────▼────┐     │               │
│               │   BIA   │      │   TVA   │     │               │
│               │ (45 Q's)│      │ Threats │     │               │
│               └────┬────┘      └────┬────┘     │               │
│                    │                │          │               │
│                    └───────┬────────┘          │               │
│                            │                   │               │
│                    ┌───────▼───────┐    ┌─────▼─────┐         │
│                    │  Risk Level   │    │   Gap     │         │
│                    │  Calculation  │    │ Analysis  │         │
│                    └───────────────┘    └─────┬─────┘         │
│                                               │               │
│                                        ┌──────▼──────┐        │
│                                        │ Nonconformity│        │
│                                        │  Generation  │        │
│                                        └─────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Application Inventory

The application register captures 43 fields organized into categories:

| Category | Fields | Purpose |
|----------|--------|---------|
| Identification | App ID, Name, Description | Unique identification |
| Ownership | Business Owner, Technical Owner, Sponsor | Accountability |
| Classification | Criticality, Data Classification | Risk categorization |
| Technical | Hosting Model, Cloud Provider, Environment | Technical context |
| Compliance | DORA Critical, PCI Scope, SOX Relevant | Regulatory flags |
| Resilience | RTO, RPO, Disaster Recovery | Business continuity |

### 2. Information Security Risk Assessment (ISRA)

An ISRA is a point-in-time assessment containing:

- **BIA (Business Impact Analysis)**: Questionnaire-based CIA impact assessment
- **TVA (Threat Vulnerability Assessment)**: Threat and vulnerability scoring
- **SRL (Security Requirements List)**: Applicable controls based on risk level

### 3. BIA (Business Impact Analysis)

The BIA uses a **questionnaire-based methodology** with 45 questions across 5 sections:

| Section | Questions | Standards | Output |
|---------|-----------|-----------|--------|
| Data Privacy | 17 | ISO 5.37, GDPR | Privacy flags, DPIA triggers |
| Confidentiality | 7 | ISO 5.12, 5.14 | C1-C4 rating |
| Integrity | 7 | ISO 8.25, 8.28 | I1-I4 rating |
| Availability | 6 | ISO 5.29, 5.30 | A1-A4 rating, RTO/RPO |
| AI/ML | 8 | EU AI Act | AI risk classification |

### 4. TVA (Threat Vulnerability Assessment)

The TVA assesses application-specific threats and vulnerabilities:

- **Threat Catalog**: Pre-defined threats with base likelihood and CIA impacts
- **Vulnerability Tracking**: Known vulnerabilities with severity ratings
- **Risk Scoring**: `Threat Risk = Likelihood × Max(CIA impacts)`

### 5. SRL (Security Requirements List)

The SRL dynamically generates applicable security controls based on BIA risk level:

| Risk Level | Applicable Controls |
|------------|-------------------|
| CRITICAL | ALL + MED+ + HIGH+ + CRIT_ONLY |
| HIGH | ALL + MED+ + HIGH+ |
| MEDIUM | ALL + MED+ |
| LOW | ALL only |

## Process Flow

```
1. Register Application
   └── Capture 43 inventory fields

2. Create ISRA
   └── Initialize assessment

3. Complete BIA Questionnaire
   ├── Section 1: Data Privacy (17 questions)
   ├── Section 2: Confidentiality (7 questions)
   ├── Section 3: Integrity (7 questions)
   ├── Section 4: Availability (6 questions)
   └── Section 5: AI/ML (8 questions)
   
4. System Calculates
   ├── CIA Impact Ratings (1-4)
   ├── Business Criticality (LOW-CRITICAL)
   └── Risk Level (LOW-CRITICAL)

5. Perform TVA
   ├── Assess applicable threats
   └── Track known vulnerabilities

6. Generate SRL
   ├── Filter requirements by risk level
   └── Map to organizational capabilities

7. Assess Coverage
   ├── COVERED: Control fully implemented
   ├── PARTIAL: Control partially implemented
   ├── GAP: Control not implemented
   └── NOT_APPLICABLE: Control not relevant

8. Process Gaps
   └── Generate Nonconformities with severity based on:
       NC Severity = Asset Criticality × Threat Impact
```

## Module Structure

### Backend

```
apps/server/src/applications/
├── applications.module.ts
├── controllers/
│   ├── application.controller.ts
│   ├── application-bia.controller.ts
│   ├── application-isra.controller.ts
│   ├── application-srl.controller.ts
│   └── application-tva.controller.ts
└── services/
    ├── application.service.ts
    ├── application-bia.service.ts
    ├── application-isra.service.ts
    ├── application-srl.service.ts
    ├── application-tva.service.ts
    └── srl-gap-nc.service.ts
```

### Frontend

```
apps/web/src/
├── components/applications/
│   └── BIAWizard.tsx
├── lib/
│   └── applications-api.ts
└── pages/applications/
    ├── ApplicationDetailPage.tsx
    ├── ApplicationRegisterPage.tsx
    └── ISRADetailPage.tsx
```

### Database

```
apps/server/prisma/
├── schema/
│   └── applications.prisma
└── seed/applications/
    ├── seed-bia-questions.ts
    ├── seed-srl-requirements.ts
    └── seed-threats.ts
```
