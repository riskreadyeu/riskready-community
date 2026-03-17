# Evidence Module - Data Model

This document provides comprehensive documentation of the Evidence module's data model, including all entities, relationships, and enums.

## Entity Relationship Diagram

```
┌──────────────────────┐
│      Evidence        │
│                      │
│  - evidenceRef       │
│  - title             │
│  - evidenceType      │
│  - status            │
│  - classification    │
│  - hashSha256        │
│  - validUntil        │
└──────────────────────┘
          │
          │ 1:N (via junction tables)
          │
          ├─────────────────┬─────────────────┬─────────────────┐
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ EvidenceControl │ │ EvidenceIncident│ │  EvidenceRisk   │ │ EvidenceVendor  │
│                 │ │                 │ │                 │ │                 │
│ - linkType      │ │ - linkType      │ │ - linkType      │ │ - linkType      │
│ - notes         │ │ - notes         │ │ - notes         │ │ - notes         │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼
    ┌─────────┐        ┌──────────┐        ┌─────────┐        ┌─────────┐
    │ Control │        │ Incident │        │  Risk   │        │ Vendor  │
    └─────────┘        └──────────┘        └─────────┘        └─────────┘


┌──────────────────────┐       ┌────────────────────────────────┐
│   EvidenceRequest    │──1:N──│ EvidenceRequestFulfillment     │
│                      │       │                                │
│  - requestRef        │       │  - requestId                   │
│  - title             │       │  - evidenceId                  │
│  - priority          │       │  - notes                       │
│  - status            │       └────────────────────────────────┘
│  - dueDate           │                      │
└──────────────────────┘                      │
                                              N:1
                                              │
                                              ▼
                                    ┌──────────────────────┐
                                    │      Evidence        │
                                    └──────────────────────┘
```

## Enums

### EvidenceType

Categorizes the type of evidence being stored.

| Value | Description | Use Case |
|-------|-------------|----------|
| `DOCUMENT` | General documents | Policies, procedures, manuals |
| `CERTIFICATE` | Certifications | ISO 27001, SOC 2 certificates |
| `REPORT` | Reports | Audit reports, assessment reports |
| `POLICY` | Policy documents | Security policies |
| `PROCEDURE` | Procedure documents | Operational procedures |
| `SCREENSHOT` | Screen captures | Configuration evidence |
| `LOG` | System logs | Audit logs, access logs |
| `CONFIGURATION` | Config files | System configurations |
| `NETWORK_CAPTURE` | Network data | PCAP files, traffic analysis |
| `MEMORY_DUMP` | Memory forensics | RAM captures |
| `DISK_IMAGE` | Disk forensics | Drive images |
| `MALWARE_SAMPLE` | Malware | Captured malware (isolated) |
| `EMAIL` | Email communications | Correspondence evidence |
| `MEETING_NOTES` | Meeting records | Decision documentation |
| `APPROVAL_RECORD` | Approvals | Sign-offs, authorizations |
| `AUDIT_REPORT` | Audit findings | Internal/external audit reports |
| `ASSESSMENT_RESULT` | Assessment outcomes | Risk assessments, control tests |
| `TEST_RESULT` | Test outcomes | Penetration tests, scans |
| `SCAN_RESULT` | Scan outputs | Vulnerability scans |
| `VIDEO` | Video recordings | Training, interviews |
| `AUDIO` | Audio recordings | Interviews, meetings |
| `OTHER` | Miscellaneous | Anything else |

### EvidenceStatus

Tracks the evidence through its lifecycle.

| Value | Description | Next States |
|-------|-------------|-------------|
| `PENDING` | Uploaded, awaiting review | UNDER_REVIEW, ARCHIVED |
| `UNDER_REVIEW` | Being reviewed | APPROVED, REJECTED |
| `APPROVED` | Reviewed and accepted | EXPIRED, ARCHIVED |
| `REJECTED` | Reviewed and not accepted | PENDING (re-upload) |
| `EXPIRED` | Past validity date | ARCHIVED |
| `ARCHIVED` | Retained but not active | (terminal) |

### EvidenceClassification

Security classification for the evidence.

| Value | Description | Access Level |
|-------|-------------|--------------|
| `PUBLIC` | Can be shared externally | All users |
| `INTERNAL` | Internal use only | All authenticated |
| `CONFIDENTIAL` | Sensitive business data | Role-based |
| `RESTRICTED` | Highly sensitive | Explicit permission |

### EvidenceSourceType

How the evidence was collected.

| Value | Description | Example |
|-------|-------------|---------|
| `MANUAL_UPLOAD` | User uploaded | Policy document upload |
| `AUTOMATED` | System generated | Automated scan results |
| `EXTERNAL_SYSTEM` | From integration | SIEM export |
| `VENDOR_PROVIDED` | From third party | Vendor SOC report |

### EvidenceRequestStatus

Tracks evidence request workflow.

| Value | Description |
|-------|-------------|
| `OPEN` | Request created, not yet started |
| `IN_PROGRESS` | Assignee working on it |
| `SUBMITTED` | Evidence submitted, awaiting review |
| `ACCEPTED` | Request fulfilled and accepted |
| `REJECTED` | Submitted evidence rejected |
| `CANCELLED` | Request cancelled |
| `OVERDUE` | Past due date, not fulfilled |

### EvidenceRequestPriority

Priority levels for evidence requests.

| Value | Description | SLA |
|-------|-------------|-----|
| `LOW` | Nice to have | 30 days |
| `MEDIUM` | Standard request | 14 days |
| `HIGH` | Important | 7 days |
| `CRITICAL` | Urgent | 2 days |

---

## Core Entities

### Evidence

The central entity for storing all evidence in the system.

```prisma
model Evidence {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  updatedById String?

  // IDENTIFICATION
  evidenceRef   String @unique           // EVD-YYYY-NNNN format
  title         String
  description   String? @db.Text
  evidenceType  EvidenceType
  status        EvidenceStatus @default(PENDING)

  // CLASSIFICATION
  classification    EvidenceClassification @default(INTERNAL)
  tags              Json?   @default("[]")  // Array of tags
  category          String?                  // Optional grouping
  subcategory       String?

  // FILE INFORMATION
  fileName          String?
  originalFileName  String?
  fileUrl           String?
  fileSizeBytes     Int?
  mimeType          String?
  storagePath       String?
  storageProvider   String  @default("local")
  isEncrypted       Boolean @default(false)

  // INTEGRITY & CHAIN OF CUSTODY
  hashSha256          String?
  hashMd5             String?
  isForensicallySound Boolean @default(false)
  chainOfCustodyNotes String? @db.Text

  // SOURCE & COLLECTION
  sourceType        EvidenceSourceType @default(MANUAL_UPLOAD)
  sourceSystem      String?
  sourceReference   String?
  collectedAt       DateTime @default(now())
  collectedById     String?
  collectionMethod  String?

  // VALIDITY & RETENTION
  validFrom         DateTime?
  validUntil        DateTime?
  retainUntil       DateTime?
  renewalRequired   Boolean   @default(false)
  renewalReminderDays Int?    @default(30)

  // REVIEW & APPROVAL
  reviewedAt        DateTime?
  reviewedById      String?
  reviewNotes       String?  @db.Text
  approvedAt        DateTime?
  approvedById      String?
  approvalNotes     String?  @db.Text
  rejectedAt        DateTime?
  rejectedById      String?
  rejectionReason   String?  @db.Text

  // METADATA
  metadata          Json?    @default("{}")
  notes             String?  @db.Text
  version           Int      @default(1)
  previousVersionId String?

  // RELATIONSHIPS
  controlLinks      EvidenceControl[]
  capabilityLinks   EvidenceCapability[]
  testLinks         EvidenceTest[]
  nonconformityLinks EvidenceNonconformity[]
  incidentLinks     EvidenceIncident[]
  riskLinks         EvidenceRisk[]
  treatmentLinks    EvidenceTreatment[]
  policyLinks       EvidencePolicy[]
  vendorLinks       EvidenceVendor[]
  assessmentLinks   EvidenceAssessment[]
  contractLinks     EvidenceContract[]
  assetLinks        EvidenceAsset[]
  changeLinks       EvidenceChange[]
  applicationLinks  EvidenceApplication[]
  israLinks         EvidenceISRA[]
  requestFulfillments EvidenceRequestFulfillment[]

  @@index([evidenceRef])
  @@index([evidenceType])
  @@index([status])
  @@index([classification])
  @@index([validUntil])
  @@index([collectedById])
  @@index([createdAt])
  @@index([category])
}
```

#### Key Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `evidenceRef` | Unique human-readable ID | EVD-2025-0001 |
| `evidenceType` | Type classification | CERTIFICATE |
| `status` | Workflow state | APPROVED |
| `classification` | Security level | CONFIDENTIAL |
| `hashSha256` | Integrity verification | 64-char hex |
| `validUntil` | Expiry date | 2025-12-31 |
| `isForensicallySound` | Legal admissibility | true/false |

#### Evidence Reference Format

`EVD-{Year}-{Sequence}`

Example: `EVD-2025-0001`

---

### EvidenceRequest

Requests for evidence from stakeholders.

```prisma
model EvidenceRequest {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?

  // IDENTIFICATION
  requestRef    String @unique           // REQ-YYYY-NNNN format
  title         String
  description   String  @db.Text

  // REQUEST DETAILS
  evidenceType      EvidenceType?
  requiredFormat    String?              // PDF, screenshot, etc.
  acceptanceCriteria String? @db.Text
  priority          EvidenceRequestPriority @default(MEDIUM)
  status            EvidenceRequestStatus   @default(OPEN)

  // ASSIGNMENT
  requestedById     String?
  assignedToId      String?
  assignedDepartmentId String?

  // DATES
  dueDate           DateTime
  submittedAt       DateTime?
  acceptedAt        DateTime?
  rejectedAt        DateTime?
  cancelledAt       DateTime?

  // CONTEXT
  contextType       String?              // "Control", "Audit", etc.
  contextId         String?              // ID of related entity
  contextRef        String?              // Human-readable ref

  // RESPONSE
  rejectionReason   String?  @db.Text
  notes             String?  @db.Text

  // FULFILLMENT
  fulfillments      EvidenceRequestFulfillment[]

  @@index([requestRef])
  @@index([status])
  @@index([priority])
  @@index([dueDate])
  @@index([assignedToId])
  @@index([contextType, contextId])
}
```

#### Request Reference Format

`REQ-{Year}-{Sequence}`

Example: `REQ-2025-0001`

#### Key Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `requestRef` | Unique ID | REQ-2025-0001 |
| `priority` | Urgency level | HIGH |
| `status` | Workflow state | IN_PROGRESS |
| `dueDate` | Deadline | 2025-01-31 |
| `contextType` | What it's for | "Control" |
| `contextRef` | Related reference | "A.5.1" |

---

### EvidenceRequestFulfillment

Links evidence to requests (many-to-many).

```prisma
model EvidenceRequestFulfillment {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())

  requestId   String
  request     EvidenceRequest @relation(...)

  evidenceId  String
  evidence    Evidence @relation(...)

  notes       String?  @db.Text
  submittedById String?

  @@unique([requestId, evidenceId])
  @@index([requestId])
  @@index([evidenceId])
}
```

---

## Junction Tables

All junction tables follow a consistent pattern:
- Unique constraint on (evidenceId, targetId)
- `linkType` field for categorizing the relationship
- `notes` field for additional context
- `createdById` for audit trail

### EvidenceControl

Links evidence to controls.

```prisma
model EvidenceControl {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId  String
  evidence    Evidence @relation(...)

  controlId   String
  control     Control  @relation(...)

  linkType    String?  // "design", "implementation", "operating", "general"
  notes       String?  @db.Text

  @@unique([evidenceId, controlId])
}
```

**Link Types:**
| Type | Description |
|------|-------------|
| `design` | Evidence of control design |
| `implementation` | Evidence of control implementation |
| `operating` | Evidence of control operation |
| `general` | General supporting evidence |

---

### EvidenceCapability

Links evidence to capabilities.

```prisma
model EvidenceCapability {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId   String
  evidence     Evidence   @relation(...)

  capabilityId String
  capability   Capability @relation(...)

  linkType     String?    // "maturity", "assessment", "general"
  maturityLevel Int?      // 1-5 if linked to specific level
  notes        String?  @db.Text

  @@unique([evidenceId, capabilityId])
}
```

---

### EvidenceTest

Links evidence to capability effectiveness tests.

```prisma
model EvidenceTest {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId  String
  evidence    Evidence @relation(...)

  testId      String
  test        CapabilityEffectivenessTest @relation(...)

  notes       String?  @db.Text

  @@unique([evidenceId, testId])
}
```

---

### EvidenceNonconformity

Links evidence to nonconformities/audit findings.

```prisma
model EvidenceNonconformity {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId       String
  evidence         Evidence      @relation(...)

  nonconformityId  String
  nonconformity    Nonconformity @relation(...)

  linkType    String?  // "finding", "root_cause", "cap_implementation", "verification"
  notes       String?  @db.Text

  @@unique([evidenceId, nonconformityId])
}
```

**Link Types:**
| Type | Description |
|------|-------------|
| `finding` | Evidence of the finding itself |
| `root_cause` | Root cause analysis evidence |
| `cap_implementation` | CAP implementation evidence |
| `verification` | Verification of closure |

---

### EvidenceIncident

Links evidence to security incidents.

```prisma
model EvidenceIncident {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId  String
  evidence    Evidence @relation(...)

  incidentId  String
  incident    Incident @relation(...)

  linkType    String?  // "forensic", "communication", "notification", "lessons_learned"
  notes       String?  @db.Text

  @@unique([evidenceId, incidentId])
}
```

**Link Types:**
| Type | Description |
|------|-------------|
| `forensic` | Forensic investigation evidence |
| `communication` | Internal communications |
| `notification` | External notifications |
| `lessons_learned` | Post-incident review |

---

### EvidenceRisk

Links evidence to risks.

```prisma
model EvidenceRisk {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId  String
  evidence    Evidence @relation(...)

  riskId      String
  risk        Risk     @relation(...)

  linkType    String?  // "assessment", "acceptance", "monitoring"
  notes       String?  @db.Text

  @@unique([evidenceId, riskId])
}
```

---

### EvidenceTreatment

Links evidence to treatment plans.

```prisma
model EvidenceTreatment {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId     String
  evidence       Evidence      @relation(...)

  treatmentId    String
  treatment      TreatmentPlan @relation(...)

  linkType    String?  // "implementation", "approval", "progress"
  notes       String?  @db.Text

  @@unique([evidenceId, treatmentId])
}
```

---

### EvidencePolicy

Links evidence to policy documents.

```prisma
model EvidencePolicy {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId  String
  evidence    Evidence       @relation(...)

  policyId    String
  policy      PolicyDocument @relation(...)

  linkType    String?  // "supporting", "appendix", "acknowledgment"
  notes       String?  @db.Text

  @@unique([evidenceId, policyId])
}
```

---

### EvidenceVendor

Links evidence to vendors.

```prisma
model EvidenceVendor {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId  String
  evidence    Evidence @relation(...)

  vendorId    String
  vendor      Vendor   @relation(...)

  linkType    String?  // "certification", "soc_report", "assessment", "contract"
  notes       String?  @db.Text

  @@unique([evidenceId, vendorId])
}
```

**Link Types:**
| Type | Description |
|------|-------------|
| `certification` | ISO 27001, SOC 2 certificates |
| `soc_report` | SOC 2 Type II reports |
| `assessment` | Assessment questionnaire responses |
| `contract` | Contract documents |

---

### EvidenceAssessment

Links evidence to vendor assessments.

```prisma
model EvidenceAssessment {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId    String
  evidence      Evidence         @relation(...)

  assessmentId  String
  assessment    VendorAssessment @relation(...)

  linkType    String?  // "response", "finding", "remediation"
  notes       String?  @db.Text

  @@unique([evidenceId, assessmentId])
}
```

---

### EvidenceContract

Links evidence to vendor contracts.

```prisma
model EvidenceContract {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId  String
  evidence    Evidence       @relation(...)

  contractId  String
  contract    VendorContract @relation(...)

  linkType    String?  // "signed_contract", "amendment", "sla"
  notes       String?  @db.Text

  @@unique([evidenceId, contractId])
}
```

---

### EvidenceAsset

Links evidence to IT assets.

```prisma
model EvidenceAsset {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId  String
  evidence    Evidence @relation(...)

  assetId     String
  asset       Asset    @relation(...)

  linkType    String?  // "configuration", "vulnerability_scan", "backup_verification"
  notes       String?  @db.Text

  @@unique([evidenceId, assetId])
}
```

---

### EvidenceChange

Links evidence to change requests.

```prisma
model EvidenceChange {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId  String
  evidence    Evidence @relation(...)

  changeId    String
  change      Change   @relation(...)

  linkType    String?  // "approval", "test_result", "pir"
  notes       String?  @db.Text

  @@unique([evidenceId, changeId])
}
```

**Link Types:**
| Type | Description |
|------|-------------|
| `approval` | Change approval evidence |
| `test_result` | Test results before/after |
| `pir` | Post-Implementation Review |

---

### EvidenceApplication

Links evidence to applications.

```prisma
model EvidenceApplication {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId     String
  evidence       Evidence    @relation(...)

  applicationId  String
  application    Application @relation(...)

  linkType    String?  // "security_assessment", "pentest", "configuration"
  notes       String?  @db.Text

  @@unique([evidenceId, applicationId])
}
```

---

### EvidenceISRA

Links evidence to application ISRA assessments.

```prisma
model EvidenceISRA {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  evidenceId  String
  evidence    Evidence        @relation(...)

  israId      String
  isra        ApplicationISRA @relation(...)

  linkType    String?  // "bia", "tva", "srl"
  notes       String?  @db.Text

  @@unique([evidenceId, israId])
}
```

**Link Types:**
| Type | Description |
|------|-------------|
| `bia` | Business Impact Analysis evidence |
| `tva` | Threat & Vulnerability Assessment |
| `srl` | Security Requirements List |

---

## Database Indexes

Indexes are defined for optimal query performance:

| Entity | Index Fields | Purpose |
|--------|--------------|---------|
| Evidence | evidenceRef | Quick lookup by reference |
| Evidence | evidenceType | Filter by type |
| Evidence | status | Filter by status |
| Evidence | classification | Security filtering |
| Evidence | validUntil | Expiry alerts |
| Evidence | category | Category filtering |
| Evidence | createdAt | Chronological queries |
| EvidenceRequest | requestRef | Quick lookup |
| EvidenceRequest | status | Workflow filtering |
| EvidenceRequest | priority | Priority filtering |
| EvidenceRequest | dueDate | Due date queries |
| EvidenceRequest | contextType, contextId | Context queries |
| All Junction Tables | evidenceId | Find links for evidence |
| All Junction Tables | targetId | Find evidence for entity |

---

## Schema Location

The complete Prisma schema is located at:

```
apps/server/prisma/schema/evidence.prisma
```

To regenerate the Prisma client after schema changes:

```bash
cd apps/server
npx prisma generate
npx prisma db push  # For development
npx prisma migrate dev --name evidence_changes  # For production
```







