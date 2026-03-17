# Policy Module - Data Model

**Version**: 2.0  
**Last Updated**: December 2024

---

## 1. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          POLICY MODULE - DATA MODEL                          │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐         ┌─────────────────────┐
    │   Organisation      │◄────────│    PolicyDocument   │
    └─────────────────────┘    1:N  └─────────────────────┘
                                              │
          ┌───────────────┬───────────────────┼───────────────┬───────────────┐
          │               │                   │               │               │
          ▼               ▼                   ▼               ▼               ▼
    ┌───────────┐  ┌────────────┐    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ Document  │  │  Document  │    │  Approval  │  │   Control  │  │    Risk    │
    │  Version  │  │   Review   │    │  Workflow  │  │   Mapping  │  │   Mapping  │
    └───────────┘  └────────────┘    └────────────┘  └────────────┘  └────────────┘
          │                                │
          │                                ▼
          │                         ┌────────────┐
          │                         │  Approval  │
          │                         │    Step    │
          │                         └────────────┘
          │
          ▼
    ┌───────────────────┐     ┌────────────────────┐     ┌────────────────────┐
    │   Acknowledgment  │     │  Document Exception│     │  Document Change   │
    │                   │     │                    │     │      Request       │
    └───────────────────┘     └────────────────────┘     └────────────────────┘
                                                                    │
                                                                    ▼
                                                          ┌────────────────────┐
                                                          │  Change Request    │
                                                          │      Comment       │
                                                          └────────────────────┘
```

---

## 2. Core Entities

### 2.1 PolicyDocument

The central entity representing any policy, standard, procedure, or supporting document.

```prisma
model PolicyDocument {
  id                    String              @id @default(cuid())
  documentId            String              // e.g., "POL-002", "STD-002-01"
  title                 String
  shortTitle            String?
  documentType          DocumentType
  classification        ClassificationLevel @default(INTERNAL)
  distribution          String[]            @default([])
  
  // Content
  purpose               String?             @db.Text
  scope                 String?             @db.Text
  content               String?             @db.Text
  summary               String?
  
  // Ownership
  documentOwner         String
  author                String
  approvedBy            String?
  
  // Version Control
  version               String              @default("1.0")
  majorVersion          Int                 @default(1)
  minorVersion          Int                 @default(0)
  status                DocumentStatus      @default(DRAFT)
  
  // Approval
  approvalLevel         ApprovalLevel       @default(MANAGEMENT)
  approvalDate          DateTime?
  digitalSignature      String?
  
  // Review
  reviewFrequency       ReviewFrequency     @default(ANNUAL)
  lastReviewDate        DateTime?
  nextReviewDate        DateTime?
  
  // Dates
  effectiveDate         DateTime?
  expiryDate            DateTime?
  retirementDate        DateTime?
  
  // Metadata
  tags                  String[]            @default([])
  keywords              String[]            @default([])
  language              String              @default("en")
  
  // Storage
  storageLocation       String?
  filePath              String?
  fileSize              Int?
  checksum              String?
  
  // Relations
  organisation          OrganisationProfile @relation(...)
  parentDocument        PolicyDocument?     @relation("DocumentHierarchy", ...)
  childDocuments        PolicyDocument[]    @relation("DocumentHierarchy")
  versions              DocumentVersion[]
  reviews               DocumentReview[]
  workflows             DocumentApprovalWorkflow[]
  acknowledgments       DocumentAcknowledgment[]
  exceptions            DocumentException[]
  changeRequests        DocumentChangeRequest[]
  controlMappings       DocumentControlMapping[]
  riskMappings          DocumentRiskMapping[]
  auditLogs             DocumentAuditLog[]
  
  // Timestamps
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  
  @@unique([documentId, organisationId])
  @@index([documentType])
  @@index([status])
  @@index([classification])
}
```

**Key Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `documentId` | String | Unique identifier (POL-002, STD-002-01) |
| `documentType` | Enum | POLICY, STANDARD, PROCEDURE, etc. |
| `classification` | Enum | PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED |
| `status` | Enum | DRAFT, PUBLISHED, RETIRED, etc. |
| `version` | String | Semantic version (1.0, 2.1) |
| `approvalLevel` | Enum | Required approval level |
| `reviewFrequency` | Enum | MONTHLY, QUARTERLY, ANNUAL, etc. |

---

### 2.2 DocumentVersion

Tracks all versions of a document with full content snapshots.

```prisma
model DocumentVersion {
  id                    String              @id @default(cuid())
  documentId            String
  document              PolicyDocument      @relation(...)
  
  // Version Info
  version               String              // "1.0", "2.1"
  majorVersion          Int
  minorVersion          Int
  
  // Content Snapshot
  content               String?             @db.Text
  contentSnapshot       Json?               // Full document state
  
  // Change Tracking
  changeDescription     String?             @db.Text
  changeSummary         String?
  changeType            ChangeType          @default(MINOR_UPDATE)
  changeReason          String?
  diffFromPrevious      String?             @db.Text
  
  // Approval
  approvedBy            String?
  approvedAt            DateTime?
  
  // Metadata
  createdAt             DateTime            @default(now())
  createdById           String?
  createdBy             User?               @relation(...)
  
  @@unique([documentId, version])
  @@index([documentId])
}
```

**Change Types:**

| Type | Description |
|------|-------------|
| `INITIAL` | First version |
| `MINOR_UPDATE` | Editorial changes |
| `MAJOR_UPDATE` | Significant content changes |
| `CORRECTION` | Error corrections |
| `ANNUAL_REVIEW` | Scheduled review update |
| `POLICY_CHANGE` | Policy-driven update |
| `REGULATORY_UPDATE` | Compliance-driven update |

---

### 2.3 DocumentApprovalWorkflow

Manages multi-step approval processes for documents.

```prisma
model DocumentApprovalWorkflow {
  id                    String              @id @default(cuid())
  documentId            String
  document              PolicyDocument      @relation(...)
  
  // Workflow Type
  workflowType          ApprovalWorkflowType // NEW_DOCUMENT, REVISION, REVIEW
  status                WorkflowStatus       @default(PENDING)
  
  // Progress
  currentStepOrder      Int                 @default(1)
  totalSteps            Int                 @default(1)
  
  // Tracking
  initiatedById         String
  initiatedBy           User                @relation(...)
  initiatedAt           DateTime            @default(now())
  completedAt           DateTime?
  
  // Outcome
  finalOutcome          ApprovalOutcome?
  finalComments         String?
  
  // Steps
  steps                 ApprovalStep[]
  
  @@index([documentId])
  @@index([status])
}
```

---

### 2.4 ApprovalStep

Individual step within an approval workflow.

```prisma
model ApprovalStep {
  id                    String              @id @default(cuid())
  workflowId            String
  workflow              DocumentApprovalWorkflow @relation(...)
  
  // Step Configuration
  stepOrder             Int
  stepName              String              // "Manager Review", "CISO Approval"
  
  // Approver
  approverId            String?
  approver              User?               @relation(...)
  approverRole          String?             // Alternative: role-based
  
  // Status
  status                ApprovalStepStatus  @default(PENDING)
  decision              ApprovalDecision?
  
  // Response
  comments              String?             @db.Text
  signature             String?
  completedAt           DateTime?
  
  // Delegation
  delegatedToId         String?
  delegatedTo           User?               @relation(...)
  delegatedAt           DateTime?
  
  // Due Date
  dueDate               DateTime?
  
  @@index([workflowId])
  @@index([approverId])
}
```

---

### 2.5 DocumentReview

Tracks periodic and triggered document reviews.

```prisma
model DocumentReview {
  id                    String              @id @default(cuid())
  documentId            String
  document              PolicyDocument      @relation(...)
  
  // Review Type
  reviewType            ReviewType          // SCHEDULED, TRIGGERED, REQUESTED
  triggerReason         String?             // Why review was triggered
  
  // Reviewer
  reviewedById          String?
  reviewedBy            User?               @relation(...)
  reviewedAt            DateTime?
  
  // Outcome
  outcome               ReviewOutcome?      // NO_CHANGES, MINOR_CHANGES, MAJOR_CHANGES
  findings              String?             @db.Text
  recommendations       String?             @db.Text
  changesRequired       Boolean             @default(false)
  
  // Next Review
  nextReviewDate        DateTime?
  
  // Status
  status                ReviewStatus        @default(PENDING)
  
  @@index([documentId])
  @@index([status])
}
```

---

### 2.6 DocumentAcknowledgment

Tracks user acknowledgments of documents.

```prisma
model DocumentAcknowledgment {
  id                    String              @id @default(cuid())
  documentId            String
  document              PolicyDocument      @relation(...)
  
  // User
  userId                String
  user                  User                @relation(...)
  
  // Acknowledgment
  acknowledgedAt        DateTime?
  status                AcknowledgmentStatus @default(PENDING)
  
  // Details
  version               String?             // Version acknowledged
  ipAddress             String?
  userAgent             String?
  
  // Notification
  sentAt                DateTime?
  remindersSent         Int                 @default(0)
  lastReminderAt        DateTime?
  dueDate               DateTime?
  
  @@unique([documentId, userId])
  @@index([userId])
  @@index([status])
}
```

---

### 2.7 DocumentException

Manages policy exceptions and deviations.

```prisma
model DocumentException {
  id                    String              @id @default(cuid())
  exceptionId           String              @unique  // EXC-YYYY-NNN
  documentId            String
  document              PolicyDocument      @relation(...)
  
  // Exception Details
  title                 String
  description           String              @db.Text
  justification         String              @db.Text
  riskAssessment        String?             @db.Text
  compensatingControls  String?             @db.Text
  
  // Validity
  startDate             DateTime
  endDate               DateTime?
  renewalDate           DateTime?
  
  // Status
  status                ExceptionStatus     @default(REQUESTED)
  
  // Approval
  requestedById         String
  requestedBy           User                @relation(...)
  approvedById          String?
  approvedBy            User?               @relation(...)
  approvalDate          DateTime?
  approvalComments      String?
  
  @@index([documentId])
  @@index([status])
}
```

---

### 2.8 DocumentChangeRequest

Formal change request process.

```prisma
model DocumentChangeRequest {
  id                    String              @id @default(cuid())
  changeRequestId       String              @unique  // CR-YYYY-NNN
  documentId            String
  document              PolicyDocument      @relation(...)
  
  // Request Details
  title                 String
  description           String              @db.Text
  justification         String              @db.Text
  changeType            ChangeRequestType   // CONTENT, STRUCTURE, POLICY, CORRECTION
  priority              ChangePriority      @default(MEDIUM)
  
  // Impact
  impactAssessment      String?             @db.Text
  affectedSections      String[]            @default([])
  affectedDocuments     String[]            @default([])
  
  // Status
  status                ChangeRequestStatus @default(DRAFT)
  
  // Workflow
  requestedById         String
  requestedBy           User                @relation(...)
  approvedById          String?
  approvedBy            User?               @relation(...)
  approvalDate          DateTime?
  approvalComments      String?
  
  // Implementation
  implementedAt         DateTime?
  implementedById       String?
  
  // Comments
  comments              ChangeRequestComment[]
  
  @@index([documentId])
  @@index([status])
}
```

---

### 2.9 DocumentControlMapping

Links documents to ISO 27001 controls.

```prisma
model DocumentControlMapping {
  id                    String              @id @default(cuid())
  documentId            String
  document              PolicyDocument      @relation(...)
  controlId             String
  control               Control             @relation(...)
  
  // Mapping Details
  mappingType           MappingType         // PRIMARY, SUPPORTING, REFERENCE
  coverage              CoverageLevel?      // FULL, PARTIAL, MINIMAL
  notes                 String?             @db.Text
  
  @@unique([documentId, controlId])
  @@index([controlId])
}
```

---

## 3. Enumerations

### 3.1 Document Types

```prisma
enum DocumentType {
  POLICY              // Strategic direction
  STANDARD            // Mandatory requirements
  PROCEDURE           // Step-by-step instructions
  WORK_INSTRUCTION    // Detailed task guidance
  GUIDELINE           // Best practice recommendations
  FORM                // Fillable forms
  TEMPLATE            // Document templates
  CHECKLIST           // Operational checklists
  RECORD              // Evidence records
}
```

### 3.2 Document Status

```prisma
enum DocumentStatus {
  DRAFT               // Being created/edited
  PENDING_REVIEW      // Awaiting review
  PENDING_APPROVAL    // In approval workflow
  APPROVED            // All approvals complete
  PUBLISHED           // Active and in effect
  UNDER_REVISION      // Being updated
  SUPERSEDED          // Replaced by new version
  RETIRED             // No longer in use
  ARCHIVED            // Long-term storage
}
```

### 3.3 Classification Levels

```prisma
enum ClassificationLevel {
  PUBLIC              // External distribution OK
  INTERNAL            // Internal use only
  CONFIDENTIAL        // Restricted distribution
  RESTRICTED          // Need-to-know basis
}
```

### 3.4 Review Frequency

```prisma
enum ReviewFrequency {
  MONTHLY
  QUARTERLY
  SEMI_ANNUAL
  ANNUAL
  BIENNIAL
  TRIENNIAL
  ON_CHANGE
  AS_NEEDED
}
```

### 3.5 Approval Levels

```prisma
enum ApprovalLevel {
  TEAM_LEAD
  MANAGEMENT
  SENIOR_MANAGEMENT
  EXECUTIVE
  BOARD
}
```

---

## 4. Indexes and Constraints

### 4.1 Unique Constraints

| Entity | Constraint | Fields |
|--------|-----------|--------|
| PolicyDocument | Document ID per org | `documentId`, `organisationId` |
| DocumentVersion | Version per document | `documentId`, `version` |
| DocumentAcknowledgment | One per user per doc | `documentId`, `userId` |
| DocumentControlMapping | One mapping per pair | `documentId`, `controlId` |

### 4.2 Performance Indexes

| Entity | Index | Purpose |
|--------|-------|---------|
| PolicyDocument | `documentType` | Filter by type |
| PolicyDocument | `status` | Filter by status |
| PolicyDocument | `classification` | Filter by classification |
| DocumentVersion | `documentId` | Version lookup |
| ApprovalStep | `workflowId` | Step lookup |
| ApprovalStep | `approverId` | User's approvals |

---

*Next: [03-api-reference.md](./03-api-reference.md) - Complete API documentation*








