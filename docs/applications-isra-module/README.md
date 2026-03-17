# Applications & ISRA Module

## Overview

The Applications & ISRA (Information Security Risk Assessment) module provides comprehensive application asset management and security risk assessment capabilities aligned with ISO 27001, GDPR, DORA, NIS2, and EU AI Act requirements.

## Key Features

- **43-field Application Inventory** - Complete application asset management
- **Business Impact Analysis (BIA)** - Questionnaire-based CIA impact assessment
- **Threat Vulnerability Assessment (TVA)** - Threat and vulnerability risk scoring
- **Security Requirements List (SRL)** - Dynamic control requirements based on risk level
- **Nonconformity Generation** - Automated gap identification and NC creation

## Documentation Structure

| Document | Description |
|----------|-------------|
| [01-overview.md](./01-overview.md) | Module architecture and components |
| [02-data-model.md](./02-data-model.md) | Database schema and relationships |
| [03-bia-methodology.md](./03-bia-methodology.md) | BIA questionnaire and rating calculations |
| [04-tva-methodology.md](./04-tva-methodology.md) | Threat and vulnerability assessment |
| [05-srl-methodology.md](./05-srl-methodology.md) | Security requirements and gap analysis |
| [06-api-reference.md](./06-api-reference.md) | REST API endpoints |
| [07-user-guide.md](./07-user-guide.md) | Step-by-step usage guide |

## Quick Start

### 1. Create an Application

Navigate to **Applications & ISRA** → **+ New Application** and fill in the required fields:
- Application ID
- Application Name
- Business Owner
- Technical Owner

### 2. Start an ISRA

From the application detail page, click **Start New ISRA** to begin the assessment:
1. Complete the **BIA** (Business Impact Analysis)
2. Perform the **TVA** (Threat Vulnerability Assessment)
3. Generate and review the **SRL** (Security Requirements List)

### 3. Complete the BIA Questionnaire

The BIA consists of 5 sections with 45 questions:
- Section 1: Data Processing & Privacy (GDPR)
- Section 2: Confidentiality Impact
- Section 3: Integrity Impact
- Section 4: Availability Impact (DORA/NIS2)
- Section 5: AI/ML Assessment (EU AI Act)

### 4. Review Results

CIA ratings and risk levels are automatically calculated based on questionnaire responses, determining which security controls apply to the application.

## Regulatory Alignment

| Regulation | Coverage |
|------------|----------|
| **ISO 27001:2022** | Full alignment with controls 5.12, 5.14, 5.29, 5.30, 5.37, 8.25, 8.28 |
| **GDPR** | Personal data processing, DPIA triggers, legal basis |
| **DORA** | Critical/Important function classification, RTO/RPO |
| **NIS2** | Essential/Important service classification |
| **EU AI Act** | AI risk classification, human oversight requirements |

## Technical Stack

- **Backend**: NestJS with Prisma ORM
- **Database**: PostgreSQL
- **Frontend**: React with TypeScript
- **UI Components**: shadcn/ui
