# Evidence Module - RiskReady Platform

## Overview

The Evidence Module provides a **centralized evidence repository** serving as the single source of truth for all evidence across the RiskReady ISMS platform. It enables organizations to collect, store, link, and manage evidence that supports compliance activities, control effectiveness, incident investigations, risk assessments, and audit readiness.

## Module Capabilities

### 1. Evidence Repository
- **Centralized Storage** - Single repository for all evidence types
- **File Management** - Upload, store, and version files
- **Classification** - Public, Internal, Confidential, Restricted
- **Integrity Tracking** - SHA-256/MD5 hashes, forensic soundness
- **Chain of Custody** - Full audit trail for evidence handling

### 2. Evidence Requests
- **Request Workflow** - Request evidence from stakeholders
- **Assignment** - Assign to users or departments
- **Tracking** - Due dates, priorities, status monitoring
- **Fulfillment** - Link submitted evidence to requests

### 3. Cross-Module Linking
- **Control Evidence** - Link to controls for design/operating effectiveness
- **Incident Evidence** - Forensic evidence for investigations
- **Risk Evidence** - Support risk assessments and treatment plans
- **Audit Evidence** - Nonconformity findings and CAP verification
- **Vendor Evidence** - Third-party certifications and assessments
- **Asset Evidence** - Configuration and vulnerability scans

### 4. Dashboards & Reporting
- **Evidence Dashboard** - Overview of evidence status
- **Expiry Tracking** - Certificates and time-sensitive evidence
- **Request Queue** - Open and overdue requests
- **Coverage Analysis** - Evidence gaps by module

## Evidence Types

| Category | Types | Use Cases |
|----------|-------|-----------|
| **Documents** | Document, Certificate, Report, Policy, Procedure, Screenshot | General compliance evidence |
| **Technical** | Log, Configuration, Network Capture, Memory Dump, Disk Image, Malware Sample | Incident forensics, technical assessments |
| **Communications** | Email, Meeting Notes, Approval Record | Decision documentation, audit trail |
| **Assessments** | Audit Report, Assessment Result, Test Result, Scan Result | Control testing, vulnerability scans |
| **Media** | Video, Audio, Other | Training records, interviews |

## Documentation Structure

```
docs/evidence-module/
├── README.md                    # This file - Module overview
├── 01-overview.md              # Architecture, concepts, design decisions
├── 02-data-model.md            # Detailed Prisma schema documentation
├── 03-api-reference.md         # REST API endpoints
├── 04-user-guide.md            # End-user workflows
└── 05-migration-guide.md       # Legacy data migration
```

## Quick Start

### For Users
1. Navigate to **Evidence** in the sidebar
2. View the **Dashboard** for an overview
3. Go to **Repository** to browse all evidence
4. Use **Upload Evidence** to add new evidence
5. Go to **Requests** to manage evidence requests

### For Developers
1. See [02-data-model.md](./02-data-model.md) for the Prisma schema
2. Backend code: `apps/server/src/evidence/`
3. Frontend code: `apps/web/src/pages/evidence/`
4. API types: `apps/web/src/lib/evidence-api.ts`

## UI Pages

| Page | Route | Description |
|------|-------|-------------|
| Evidence Dashboard | `/evidence` | Overview with stats and quick actions |
| Evidence Repository | `/evidence/repository` | List of all evidence with filtering |
| Evidence Detail | `/evidence/:id` | View evidence details and links |
| Evidence Requests | `/evidence/requests` | Manage evidence requests |

## Compliance Mapping

| Framework | Requirement | Evidence Module Coverage |
|-----------|-------------|--------------------------|
| **ISO 27001** | 7.5 Documented Information | Full evidence management |
| ISO 27001 | 9.2 Internal Audit | Audit evidence collection |
| ISO 27001 | 10.2 Nonconformity | CAP evidence tracking |
| **SOC 2** | CC1.4 - Control Documentation | Control evidence linking |
| SOC 2 | CC4.1 - Monitoring Activities | Test result evidence |
| **DORA** | Article 6 - ICT Risk Management | Risk evidence |
| DORA | Article 17 - Incident Classification | Forensic evidence |
| **NIS2** | Article 21(2)(g) - Security policies | Policy evidence |
| NIS2 | Article 23 - Incident reporting | Incident evidence |

## Key Features

### Evidence Management
- ✅ Auto-generated evidence references (e.g., `EVD-2025-0001`)
- ✅ Multiple evidence types (20+ categories)
- ✅ Classification levels (Public → Restricted)
- ✅ File integrity verification (SHA-256, MD5)
- ✅ Chain of custody tracking
- ✅ Version control for updated evidence
- ✅ Validity and expiry tracking
- ✅ Retention management

### Evidence Requests
- ✅ Request workflow (Open → In Progress → Submitted → Accepted)
- ✅ Priority levels (Low, Medium, High, Critical)
- ✅ Due date tracking with overdue alerts
- ✅ Context linking (what the evidence is for)
- ✅ Multiple evidence fulfillment per request
- ✅ Department-level assignment

### Cross-Module Integration
- ✅ Link to Controls (design, implementation, operating evidence)
- ✅ Link to Capabilities (maturity assessments)
- ✅ Link to Effectiveness Tests (test results)
- ✅ Link to Incidents (forensic evidence)
- ✅ Link to Risks (assessment evidence)
- ✅ Link to Policies (supporting documents)
- ✅ Link to Vendors (certifications, SOC reports)
- ✅ Link to Assets (configurations, scans)
- ✅ Link to Changes (approvals, PIR)
- ✅ Link to Applications (ISRA evidence)

## Integration with Other Modules

| Module | Integration |
|--------|-------------|
| **Controls** | Evidence for control design, implementation, and operating effectiveness |
| **Risks** | Evidence supporting risk assessments and treatment plan implementation |
| **Incidents** | Forensic evidence, communication records, lessons learned |
| **Audits** | Nonconformity findings, CAP implementation evidence |
| **Policies** | Supporting documents, acknowledgments, appendices |
| **Supply Chain** | Vendor certifications, SOC reports, assessment responses |
| **ITSM** | Asset configurations, change approvals, test results |
| **Applications** | ISRA evidence, security assessments, penetration tests |

## Architecture

### Backend Structure

```
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
```

### Frontend Structure

```
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
```

### Database Schema

```
apps/server/prisma/schema/evidence.prisma
```

## API Quick Reference

### Base URL

```
/api/evidence
```

### Main Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /evidence` | List all evidence |
| `GET /evidence/:id` | Get evidence details |
| `POST /evidence` | Create new evidence |
| `PUT /evidence/:id` | Update evidence |
| `DELETE /evidence/:id` | Delete evidence |
| `POST /evidence/:id/approve` | Approve evidence |
| `POST /evidence/:id/reject` | Reject evidence |
| `GET /evidence-requests` | List evidence requests |
| `POST /evidence-requests` | Create evidence request |
| `POST /evidence-links` | Link evidence to entity |
| `GET /evidence-links/:evidenceId` | Get all links for evidence |

See [03-api-reference.md](./03-api-reference.md) for complete documentation.

## Frontend Routes

| Route | Page |
|-------|------|
| `/evidence` | Dashboard |
| `/evidence/repository` | Evidence Repository |
| `/evidence/:id` | Evidence Detail |
| `/evidence/requests` | Evidence Requests |

## Legacy Data Migration

The module includes migration tools for consolidating evidence from legacy tables:

| Legacy Table | Migration Target |
|--------------|------------------|
| `IncidentEvidence` | `Evidence` + `EvidenceIncident` |
| `DocumentAttachment` | `Evidence` + `EvidencePolicy` |
| `VendorDocument` | `Evidence` + `EvidenceVendor` |

See [05-migration-guide.md](./05-migration-guide.md) for migration procedures.

---

## Related Documentation

- [Architecture Overview](../architecture/README.md)
- [API Design](../architecture/06-api-design.md)
- [Database Schema](../architecture/04-database-schema.md)
- [Data Dictionary](../data-dictionary.md)

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12 | Initial implementation with full cross-module linking |







