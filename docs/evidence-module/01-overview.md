# Evidence Module Overview

## Introduction

The Evidence Module serves as the **single source of truth** for all evidence across the RiskReady ISMS platform. Rather than having evidence scattered across multiple modules (incidents, policies, vendors, etc.), this module provides a centralized repository that other modules can link to, ensuring consistency, traceability, and efficient evidence management.

## Purpose & Objectives

### Business Objectives

1. **Centralized Management**: Single repository for all evidence types across the organization
2. **Audit Readiness**: Quickly locate and present evidence for internal and external audits
3. **Compliance Demonstration**: Prove control effectiveness and policy adherence
4. **Chain of Custody**: Maintain forensic integrity for incident investigations
5. **Efficiency**: Reduce duplicate evidence collection across modules

### Key Capabilities

| Capability | Description |
|------------|-------------|
| Evidence Repository | Store, classify, and version all evidence types |
| Evidence Requests | Request evidence from stakeholders with workflow |
| Cross-Module Linking | Link evidence to controls, incidents, risks, etc. |
| Integrity Verification | Hash verification for forensic soundness |
| Validity Tracking | Monitor expiry dates for certificates and reports |
| Retention Management | Ensure evidence is retained per requirements |

## Design Decisions

### Why a Central Evidence Module?

Before implementing this module, evidence was stored in multiple places:
- `IncidentEvidence` - Evidence for incident investigations
- `DocumentAttachment` - Attachments to policy documents
- `VendorDocument` - Vendor certifications and reports

**Problems with Distributed Evidence:**
1. **Duplication**: Same certificate uploaded to multiple places
2. **Inconsistency**: Different metadata fields across tables
3. **No Cross-Referencing**: Can't link one piece of evidence to multiple entities
4. **Fragmented Search**: No unified way to find all evidence

**Solution - Central Repository with Junction Tables:**
- One `Evidence` table with comprehensive fields
- Junction tables (`EvidenceControl`, `EvidenceIncident`, etc.) for linking
- Evidence can be linked to multiple entities
- Consistent metadata and integrity tracking

### Junction Tables vs. Polymorphic Associations

We chose **junction tables** over polymorphic associations for type safety:

```
❌ Polymorphic (rejected):
Evidence → linkedEntityType: "Control" | "Incident" | ...
        → linkedEntityId: String

✅ Junction Tables (chosen):
Evidence → EvidenceControl → Control
        → EvidenceIncident → Incident
        → EvidenceRisk → Risk
```

**Benefits of Junction Tables:**
- Type-safe foreign keys with referential integrity
- Each link can have context-specific fields (e.g., `linkType`)
- Easy to query all evidence for a specific entity
- Prisma generates proper types for each relationship

## Module Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├──────────────────────────────────────────────────────────────────┤
│  Dashboard │ Repository │ Detail View │ Requests │ Upload Modal  │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API Client (evidence-api.ts)                 │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS)                              │
├──────────────────────────────────────────────────────────────────┤
│  Controllers: Evidence │ EvidenceRequest │ EvidenceLink          │
├──────────────────────────────────────────────────────────────────┤
│  Services: CRUD, Workflow, Linking, Migration                    │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL via Prisma)              │
├──────────────────────────────────────────────────────────────────┤
│  Evidence │ EvidenceRequest │ Junction Tables (15+)              │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### Backend Components

| Component | Purpose |
|-----------|---------|
| `EvidenceController` | CRUD operations, approval workflow |
| `EvidenceRequestController` | Request lifecycle management |
| `EvidenceLinkController` | Cross-module linking operations |
| `EvidenceMigrationController` | Legacy data migration endpoints |
| `EvidenceService` | Core business logic for evidence |
| `EvidenceRequestService` | Request workflow logic |
| `EvidenceLinkService` | Linking and unlinking logic |
| `EvidenceMigrationService` | Migration from legacy tables |

#### Frontend Components

| Component | Purpose |
|-----------|---------|
| `EvidenceDashboardPage` | Overview, stats, quick actions |
| `EvidenceRepositoryPage` | Browse, filter, search evidence |
| `EvidenceDetailPage` | View details, links, history |
| `EvidenceRequestsPage` | Manage evidence requests |
| `EvidenceUploadDialog` | Upload new evidence |
| `EvidenceRequestDialog` | Create evidence requests |
| `evidence-sidebar` | Navigation sidebar |

### Directory Structure

```
Backend:
apps/server/src/evidence/
├── evidence.module.ts
├── controllers/
│   ├── evidence.controller.ts
│   ├── evidence-request.controller.ts
│   ├── evidence-link.controller.ts
│   └── evidence-migration.controller.ts
└── services/
    ├── evidence.service.ts
    ├── evidence-request.service.ts
    ├── evidence-link.service.ts
    └── evidence-migration.service.ts

Frontend:
apps/web/src/
├── components/evidence/
│   ├── evidence-sidebar.tsx
│   ├── EvidenceUploadDialog.tsx
│   └── EvidenceRequestDialog.tsx
├── lib/
│   └── evidence-api.ts
└── pages/evidence/
    ├── EvidenceDashboardPage.tsx
    ├── EvidenceRepositoryPage.tsx
    ├── EvidenceDetailPage.tsx
    ├── EvidenceRequestsPage.tsx
    └── index.ts

Database Schema:
apps/server/prisma/schema/evidence.prisma
```

## Evidence Lifecycle

### Evidence States

```
┌─────────────┐    ┌────────────────┐    ┌──────────────┐
│   PENDING   │ -> │  UNDER_REVIEW  │ -> │   APPROVED   │
└─────────────┘    └────────────────┘    └──────────────┘
      │                    │                    │
      │                    │                    ▼
      │                    │            ┌──────────────┐
      │                    └─────────-> │   REJECTED   │
      │                                 └──────────────┘
      │
      ▼
┌─────────────┐
│  ARCHIVED   │  (Manual archival)
└─────────────┘

                    ┌──────────────┐
                    │   EXPIRED    │  (Automatic when past validUntil)
                    └──────────────┘
```

### State Descriptions

| State | Description | Transitions |
|-------|-------------|-------------|
| **PENDING** | Uploaded, awaiting review | → UNDER_REVIEW, ARCHIVED |
| **UNDER_REVIEW** | Being reviewed by approver | → APPROVED, REJECTED |
| **APPROVED** | Reviewed and accepted | → EXPIRED, ARCHIVED |
| **REJECTED** | Reviewed and not accepted | → PENDING (re-upload) |
| **EXPIRED** | Past validity date | → ARCHIVED |
| **ARCHIVED** | Retained but not active | (terminal) |

## Evidence Request Workflow

```
┌──────────┐    ┌─────────────┐    ┌───────────┐    ┌──────────┐
│   OPEN   │ -> │ IN_PROGRESS │ -> │ SUBMITTED │ -> │ ACCEPTED │
└──────────┘    └─────────────┘    └───────────┘    └──────────┘
      │                                  │
      │                                  ▼
      │                          ┌───────────┐
      │                          │ REJECTED  │ -> (back to OPEN)
      │                          └───────────┘
      │
      ├─────────────────────────────────────────> ┌───────────┐
      │         (if past due date)                │  OVERDUE  │
      │                                           └───────────┘
      │
      └─────────────────────────────────────────> ┌───────────┐
                (manual cancellation)             │ CANCELLED │
                                                  └───────────┘
```

### Request Workflow Steps

1. **Requester** creates request with due date and context
2. Request is **assigned** to user or department
3. **Assignee** works on gathering evidence (IN_PROGRESS)
4. Assignee **uploads evidence** and links to request (SUBMITTED)
5. **Requester** reviews and accepts or rejects
6. If accepted, evidence is linked to the context entity

## Cross-Module Linking

### Supported Link Types

| Target Module | Junction Table | Link Types |
|---------------|----------------|------------|
| Controls | `EvidenceControl` | design, implementation, operating, general |
| Capabilities | `EvidenceCapability` | maturity, assessment, general |
| Effectiveness Tests | `EvidenceTest` | test_result |
| Nonconformities | `EvidenceNonconformity` | finding, root_cause, cap_implementation, verification |
| Incidents | `EvidenceIncident` | forensic, communication, notification, lessons_learned |
| Risks | `EvidenceRisk` | assessment, acceptance, monitoring |
| Treatment Plans | `EvidenceTreatment` | implementation, approval, progress |
| Policies | `EvidencePolicy` | supporting, appendix, acknowledgment |
| Vendors | `EvidenceVendor` | certification, soc_report, assessment, contract |
| Vendor Assessments | `EvidenceAssessment` | response, finding, remediation |
| Vendor Contracts | `EvidenceContract` | signed_contract, amendment, sla |
| Assets | `EvidenceAsset` | configuration, vulnerability_scan, backup_verification |
| Changes | `EvidenceChange` | approval, test_result, pir |
| Applications | `EvidenceApplication` | security_assessment, pentest, configuration |
| ISRA | `EvidenceISRA` | bia, tva, srl |

### Linking Example

```typescript
// Link evidence to a control
await evidenceLinkService.linkToControl(evidenceId, controlId, {
  linkType: 'operating',
  notes: 'Monthly access review logs demonstrating control operation'
});

// Get all evidence for a control
const evidence = await evidenceLinkService.getEvidenceForControl(controlId);
```

## Regulatory Framework Support

### ISO 27001:2022

| Clause | Requirement | Module Feature |
|--------|-------------|----------------|
| 7.5 | Documented Information | Central evidence repository |
| 7.5.2 | Creating and updating | Version control, metadata |
| 7.5.3 | Control of documented information | Classification, access control |
| 9.2 | Internal Audit | Audit evidence collection |
| 10.2 | Nonconformity | CAP evidence linking |

### SOC 2

| Criteria | Requirement | Module Feature |
|----------|-------------|----------------|
| CC1.4 | Control documentation | Control evidence links |
| CC4.1 | Monitoring activities | Test result evidence |
| CC4.2 | Evaluation of controls | Effectiveness test evidence |

### DORA

| Article | Requirement | Module Feature |
|---------|-------------|----------------|
| Art. 6 | ICT risk management | Risk evidence |
| Art. 17 | ICT-related incident classification | Forensic evidence |
| Art. 28 | Third-party ICT risk | Vendor evidence |

### NIS2

| Article | Requirement | Module Feature |
|---------|-------------|----------------|
| Art. 21(2)(g) | Security policies | Policy evidence |
| Art. 23 | Incident reporting | Incident evidence |
| Art. 21(2)(d) | Supply chain | Vendor evidence |

## Security Considerations

### Data Classification

| Classification | Description | Access |
|----------------|-------------|--------|
| PUBLIC | Can be shared externally | All authenticated users |
| INTERNAL | Internal use only | All authenticated users |
| CONFIDENTIAL | Sensitive business data | Role-based access |
| RESTRICTED | Highly sensitive | Explicit permission required |

### Access Control

- All endpoints protected by JWT authentication
- Role-based access for sensitive operations
- Owner-based filtering for evidence data
- Approval workflow for evidence acceptance

### Integrity Protection

- SHA-256 and MD5 hash calculation on upload
- Hash verification on download
- Forensic soundness flag for legal evidence
- Chain of custody notes for audit trail

## Performance Considerations

### Database Indexes

Key indexes are defined for optimal query performance:

| Entity | Index Fields | Purpose |
|--------|--------------|---------|
| Evidence | evidenceRef | Quick lookup by reference |
| Evidence | evidenceType, status | Filtering |
| Evidence | classification | Security filtering |
| Evidence | validUntil | Expiry alerts |
| Evidence | category | Category filtering |
| EvidenceRequest | requestRef | Quick lookup |
| EvidenceRequest | status, dueDate | Workflow filtering |
| All Junction Tables | evidenceId, targetId | Fast linking queries |

### Pagination

All list endpoints support pagination:
- Default page size: 10 items
- Maximum page size: 100 items
- Total count included in response

## Getting Started

1. **Review the Data Model**: See [02-data-model.md](./02-data-model.md)
2. **Explore the API**: See [03-api-reference.md](./03-api-reference.md)
3. **User Workflows**: See [04-user-guide.md](./04-user-guide.md)
4. **Migration from Legacy**: See [05-migration-guide.md](./05-migration-guide.md)







