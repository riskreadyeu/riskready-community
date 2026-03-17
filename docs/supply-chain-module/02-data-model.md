# Supply Chain Module - Data Model

This document provides comprehensive documentation of the Supply Chain module's data model, including all entities, relationships, and enums.

## Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────────┐
│     Vendor       │──1:N──│   VendorAssessment   │
│                  │       │                      │
│  - vendorCode    │       │  - assessmentRef     │
│  - name          │       │  - assessmentType    │
│  - tier          │       │  - status            │
│  - status        │       │  - overallScore      │
│  - inDoraScope   │       └──────────────────────┘
│  - inNis2Scope   │                  │
└──────────────────┘                  │
        │                             1:N
        │                             │
        1:N                  ┌────────┴───────┐
        │                    │                │
        ▼                    ▼                ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│  VendorContract  │  │ Assessment   │  │ Assessment   │
│                  │  │ Response     │  │ Finding      │
│  - contractRef   │  │              │  │              │
│  - status        │  │ - score      │  │ - severity   │
│  - expiryDate    │  │ - response   │  │ - status     │
└──────────────────┘  └──────────────┘  └──────────────┘
        │                    │
        │                    N:1
        │                    │
        │           ┌────────┴────────┐
        │           │                 │
        │           ▼                 │
        │  ┌──────────────────┐       │
        │  │ AssessmentQuestion│◄──────┘
        │  │                  │
        │  │  - questionNumber│
        │  │  - domain        │
        │  │  - frameworkLayer│
        │  └──────────────────┘
        │
        1:N
        │
        ├────────────┬────────────┬────────────┐
        │            │            │            │
        ▼            ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Vendor   │  │ Vendor   │  │ Vendor   │  │ Vendor   │
│ Service  │  │ Contact  │  │ Review   │  │ Incident │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
        │
        │
        ▼
┌──────────────────┐
│  VendorExitPlan  │
│                  │
│  - status        │
│  - triggers      │
└──────────────────┘
```

## Enums

### VendorStatus

Tracks the vendor's position in the lifecycle.

| Value | Description |
|-------|-------------|
| `PROSPECT` | Initial intake, not yet assessed |
| `ASSESSMENT` | Risk assessment in progress |
| `DUE_DILIGENCE` | Deep-dive verification underway |
| `CONTRACTING` | Contract negotiation phase |
| `ONBOARDING` | Being integrated into operations |
| `ACTIVE` | Normal operational relationship |
| `MONITORING` | Under enhanced monitoring |
| `REVIEW` | Undergoing periodic review |
| `OFFBOARDING` | Exit process initiated |
| `TERMINATED` | Relationship ended |
| `SUSPENDED` | Temporarily suspended |

### VendorTier

Risk classification determining assessment scope and review frequency.

| Value | Description | Question Count | Review Cycle |
|-------|-------------|----------------|--------------|
| `CRITICAL` | Highest risk, DORA critical ICT | 223 | Quarterly |
| `HIGH` | High risk vendors | 211 | Semi-annually |
| `MEDIUM` | Standard risk | 176 | Annually |
| `LOW` | Minimal risk | 176 | Biennially |

### AssessmentType

Types of vendor assessments.

| Value | Description |
|-------|-------------|
| `INITIAL` | Pre-onboarding assessment |
| `PERIODIC` | Scheduled recurring assessment |
| `AD_HOC` | Triggered by event or incident |
| `REASSESSMENT` | Follow-up after remediation |
| `EXIT` | Assessment during offboarding |

### AssessmentStatus

Assessment workflow status.

| Value | Description |
|-------|-------------|
| `DRAFT` | Created but not started |
| `IN_PROGRESS` | Questions being answered |
| `PENDING_REVIEW` | Submitted, awaiting review |
| `UNDER_REVIEW` | Being reviewed by reviewer |
| `FINDINGS_OPEN` | Has unresolved findings |
| `COMPLETED` | Finished successfully |
| `EXPIRED` | Past validity period |
| `CANCELLED` | Assessment cancelled |

### FrameworkLayer

Compliance framework layers for questions.

| Value | Description |
|-------|-------------|
| `ISO` | ISO 27001 baseline requirements |
| `NIS2` | Additional NIS2 Directive requirements |
| `DORA` | Additional DORA regulation requirements |

### RiskWeight

Question risk weighting for scoring.

| Value | Weight | Description |
|-------|--------|-------------|
| `CRITICAL` | 4.0 | Critical security controls |
| `HIGH` | 3.0 | Important controls |
| `MEDIUM` | 2.0 | Standard controls |
| `LOW` | 1.0 | Nice-to-have controls |

### FindingSeverity

Assessment finding severity levels.

| Value | Description |
|-------|-------------|
| `CRITICAL` | Immediate action required |
| `HIGH` | Address within 30 days |
| `MEDIUM` | Address within 90 days |
| `LOW` | Address in next review cycle |
| `INFORMATIONAL` | For awareness only |

### FindingStatus

Finding remediation status.

| Value | Description |
|-------|-------------|
| `OPEN` | Newly identified |
| `IN_PROGRESS` | Remediation underway |
| `REMEDIATED` | Fixed, pending verification |
| `ACCEPTED` | Risk accepted |
| `CLOSED` | Verified and closed |
| `OVERDUE` | Past remediation deadline |

### ContractStatus

Contract lifecycle status.

| Value | Description |
|-------|-------------|
| `DRAFT` | Being drafted |
| `UNDER_REVIEW` | Under internal review |
| `PENDING_APPROVAL` | Awaiting approval |
| `APPROVED` | Approved, not yet signed |
| `ACTIVE` | Signed and in effect |
| `EXPIRING_SOON` | Within 90 days of expiry |
| `EXPIRED` | Past expiry date |
| `TERMINATED` | Terminated early |
| `RENEWED` | Renewed with new contract |

### SLAStatus

SLA metric compliance status.

| Value | Description |
|-------|-------------|
| `MET` | Target achieved |
| `AT_RISK` | Within tolerance but concerning |
| `BREACHED` | Target missed |
| `NOT_MEASURED` | No data available |

### VendorReviewType

Types of periodic reviews.

| Value | Description |
|-------|-------------|
| `PERIODIC` | Scheduled regular review |
| `INCIDENT` | Triggered by incident |
| `CONTRACT` | Contract renewal review |
| `PERFORMANCE` | Performance-focused review |
| `COMPLIANCE` | Compliance audit |

### ExitPlanStatus

Exit plan lifecycle.

| Value | Description |
|-------|-------------|
| `DRAFT` | Being developed |
| `APPROVED` | Approved, not yet tested |
| `TESTING` | Test in progress |
| `TESTED` | Successfully tested |
| `ACTIVATED` | Exit triggered |
| `COMPLETED` | Exit completed |

---

## Core Entities

### Vendor

The central entity representing a third-party vendor or supplier.

```prisma
model Vendor {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Identification
  vendorCode    String  @unique    // VND-001, auto-generated
  name          String
  legalName     String?
  tradingName   String?
  description   String? @db.Text
  leiCode       String?            // DORA Legal Entity Identifier
  
  // Classification
  tier          VendorTier    @default(MEDIUM)
  tierRationale String?       @db.Text
  tierCalculatedAt DateTime?
  tierOverridden   Boolean    @default(false)
  tierOverrideReason String?
  status        VendorStatus  @default(PROSPECT)
  vendorType    String?       // SERVICE_PROVIDER, SOFTWARE_VENDOR, etc.
  
  // Regulatory Scope
  inDoraScope           Boolean @default(false)
  inNis2Scope           Boolean @default(false)
  inGdprScope           Boolean @default(false)
  inPciScope            Boolean @default(false)
  inSoc2Scope           Boolean @default(false)
  isIctServiceProvider  Boolean @default(false)
  isCriticalIctProvider Boolean @default(false)
  supportsEssentialFunction Boolean @default(false)
  isEssentialSupplier   Boolean @default(false)
  isImportantSupplier   Boolean @default(false)
  
  // Contact Information
  website              String?
  headquartersCountry  String?
  primaryContactName   String?
  primaryContactEmail  String?
  securityContactEmail String?
  
  // Company Information
  registrationNumber   String?
  taxId                String?
  dunsNumber           String?
  foundedYear          Int?
  employeeCount        Int?
  annualRevenue        Decimal? @db.Decimal(20, 2)
  publicCompany        Boolean  @default(false)
  
  // Geographic (DORA Art. 28)
  operatingCountries       Json? @default("[]")
  dataProcessingLocations  Json? @default("[]")
  dataStorageLocations     Json? @default("[]")
  thirdCountryExposure     Boolean @default(false)
  geopoliticalRiskLevel    String?
  
  // Certifications
  iso27001Certified   Boolean @default(false)
  iso27001CertExpiry  DateTime?
  soc2Type2Certified  Boolean @default(false)
  iso22301Certified   Boolean @default(false)
  pciDssCompliant     Boolean @default(false)
  
  // Financial Health
  financialRating       String?
  financialRatingSource String?
  financialStability    String?
  
  // Risk Scores
  inherentRiskScore      Int?
  residualRiskScore      Int?
  lastRiskAssessmentDate DateTime?
  nextAssessmentDue      DateTime?
  concentrationRiskLevel String?
  
  // Lifecycle Dates
  prospectDate     DateTime?
  onboardedDate    DateTime?
  lastReviewDate   DateTime?
  nextReviewDate   DateTime?
  terminatedDate   DateTime?
  
  // Ownership
  relationshipOwnerId String?
  securityOwnerId     String?
  businessOwnerId     String?
  
  // Relationships
  assessments  VendorAssessment[]
  contracts    VendorContract[]
  services     VendorService[]
  contacts     VendorContact[]
  documents    VendorDocument[]
  reviews      VendorReview[]
  incidents    VendorIncident[]
  exitPlans    VendorExitPlan[]
  slaRecords   VendorSLARecord[]
  history      VendorHistory[]
}
```

#### Key Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `vendorCode` | Unique identifier | VND-001 |
| `tier` | Risk classification | CRITICAL |
| `inDoraScope` | Subject to DORA | true |
| `isCriticalIctProvider` | DORA critical designation | true |
| `nextAssessmentDue` | When next assessment needed | 2024-06-30 |

---

### VendorAssessment

Risk assessments conducted on vendors.

```prisma
model VendorAssessment {
  id          String   @id @default(cuid())
  
  vendorId          String
  vendor            Vendor @relation(...)
  
  assessmentRef     String @unique       // ASM-VND001-2024-001
  assessmentType    AssessmentType
  status            AssessmentStatus @default(DRAFT)
  
  // Scope
  targetTier         VendorTier?
  frameworksIncluded Json? @default("[]")  // ["ISO", "NIS2", "DORA"]
  
  // Dates
  initiatedDate   DateTime @default(now())
  dueDate         DateTime?
  submittedDate   DateTime?
  completedDate   DateTime?
  expiryDate      DateTime?
  
  // Assignment
  assessorId  String?
  reviewerId  String?
  
  // Scoring
  totalQuestions    Int @default(0)
  answeredQuestions Int @default(0)
  overallScore      Decimal? @db.Decimal(5, 2)
  domainScores      Json? @default("{}")
  calculatedTier    VendorTier?
  riskRating        String?
  
  // Summary
  executiveSummary  String? @db.Text
  keyFindings       String? @db.Text
  recommendations   String? @db.Text
  
  // Relationships
  responses  AssessmentResponse[]
  findings   AssessmentFinding[]
}
```

#### Assessment Reference Format

`ASM-{VendorCode}-{Year}-{Sequence}`

Example: `ASM-VND001-2024-001`

---

### AssessmentQuestion

The question bank seeded from the Excel questionnaire.

```prisma
model AssessmentQuestion {
  id          String   @id @default(cuid())
  
  questionNumber    Int @unique
  domain            String              // "1. Governance & Organization"
  subArea           String              // "Structure", "Policies"
  questionText      String @db.Text
  
  frameworkLayer    FrameworkLayer      // ISO, NIS2, DORA
  regulatoryRef     String?             // A.5.1, Art. 20, etc.
  
  tierApplicability String @default("All")  // "All", "Critical/High", "Critical"
  riskWeight        RiskWeight @default(MEDIUM)
  
  evidenceExpected  String? @db.Text
  guidanceNotes     String? @db.Text
  
  isActive          Boolean @default(true)
  sortOrder         Int @default(0)
  
  responses         AssessmentResponse[]
}
```

#### Question Statistics

| Framework | Count | Percentage |
|-----------|-------|------------|
| ISO 27001 | 102 | 45.7% |
| NIS2 | 55 | 24.7% |
| DORA | 66 | 29.6% |
| **Total** | **223** | **100%** |

---

### AssessmentResponse

Individual question responses within an assessment.

```prisma
model AssessmentResponse {
  id          String   @id @default(cuid())
  
  assessmentId String
  assessment   VendorAssessment @relation(...)
  
  questionId   String
  question     AssessmentQuestion @relation(...)
  
  // Response
  response          String? @db.Text
  score             Int?              // 0-5 scale
  
  // Evidence
  evidenceProvided  String? @db.Text
  evidenceUrls      Json? @default("[]")
  
  // Review
  reviewerNotes     String? @db.Text
  remediationNeeded Boolean @default(false)
  
  answeredAt        DateTime?
  reviewedAt        DateTime?
  
  @@unique([assessmentId, questionId])
}
```

#### Scoring Scale

| Score | Meaning | Description |
|-------|---------|-------------|
| 0 | N/A | Not applicable |
| 1 | None | No control in place |
| 2 | Informal | Ad-hoc, undocumented |
| 3 | Developing | Partially implemented |
| 4 | Defined | Documented, mostly implemented |
| 5 | Optimized | Fully implemented, monitored |

---

### AssessmentFinding

Issues identified during assessments.

```prisma
model AssessmentFinding {
  id          String   @id @default(cuid())
  
  assessmentId String
  assessment   VendorAssessment @relation(...)
  
  findingRef     String @unique       // FND-001
  title          String
  description    String @db.Text
  
  severity       FindingSeverity
  status         FindingStatus @default(OPEN)
  
  domain          String?
  questionNumbers Json? @default("[]")
  
  // Remediation
  remediationPlan     String? @db.Text
  remediationDueDate  DateTime?
  remediatedDate      DateTime?
  
  // Acceptance
  riskAccepted        Boolean @default(false)
  acceptedById        String?
  acceptanceRationale String? @db.Text
}
```

---

### VendorContract

Contracts with vendors, including DORA Article 30 compliance.

```prisma
model VendorContract {
  id          String   @id @default(cuid())
  
  vendorId       String
  vendor         Vendor @relation(...)
  
  contractRef    String @unique       // CNT-VND001-001
  title          String
  description    String? @db.Text
  contractType   String              // MSA, SOW, NDA, DPA, SLA
  status         ContractStatus @default(DRAFT)
  
  // Dates
  effectiveDate  DateTime?
  expiryDate     DateTime?
  signedDate     DateTime?
  
  // Renewal
  autoRenewal       Boolean @default(false)
  renewalNoticeDays Int?
  renewalTermMonths Int?
  
  // Value
  contractValue    Decimal? @db.Decimal(15, 2)
  contractCurrency String @default("USD")
  paymentTerms     String?
  
  // DORA Article 30 Compliance
  hasServiceDescription    Boolean @default(false)
  hasDataLocations         Boolean @default(false)
  hasLocationChangeNotice  Boolean @default(false)
  hasAvailabilityTargets   Boolean @default(false)
  hasAssistanceInIncidents Boolean @default(false)
  hasAuditRights           Boolean @default(false)
  hasRegulatoryAccess      Boolean @default(false)
  hasTerminationRights     Boolean @default(false)
  hasExitClause            Boolean @default(false)
  hasSubcontractingRules   Boolean @default(false)
  hasDataProtection        Boolean @default(false)
  
  // Standard Clauses
  hasConfidentiality       Boolean @default(false)
  hasIpProtection          Boolean @default(false)
  hasLiabilityLimits       Boolean @default(false)
  hasInsuranceRequirements Boolean @default(false)
  hasBcpRequirements       Boolean @default(false)
  hasSecurityRequirements  Boolean @default(false)
  
  // Ownership
  legalOwnerId    String?
  businessOwnerId String?
}
```

#### Contract Reference Format

`CNT-{VendorCode}-{Sequence}`

Example: `CNT-VND001-001`

---

### VendorService

Services provided by vendors.

```prisma
model VendorService {
  id          String   @id @default(cuid())
  
  vendorId    String
  vendor      Vendor @relation(...)
  
  serviceName        String
  serviceDescription String? @db.Text
  serviceType        String    // CLOUD, SOFTWARE, CONSULTING
  serviceCategory    String?   // ICT, NON_ICT, INFRASTRUCTURE
  
  businessCriticality String @default("MEDIUM")
  dataClassification  String?
  
  supportedFunctions  Json? @default("[]")
  integrationLevel    String?   // DEEP, MODERATE, LIGHT
  apiAccess           Boolean @default(false)
  
  isActive   Boolean @default(true)
  startDate  DateTime?
  endDate    DateTime?
}
```

---

### VendorReview

Periodic vendor reviews.

```prisma
model VendorReview {
  id          String   @id @default(cuid())
  
  vendorId     String
  vendor       Vendor @relation(...)
  
  reviewRef    String @unique       // RVW-VND001-2024-Q1
  reviewType   VendorReviewType
  reviewPeriod String?              // "Q1 2024", "Annual 2024"
  
  status         String @default("SCHEDULED")
  scheduledDate  DateTime
  completedDate  DateTime?
  
  // Performance
  performanceScore Int?
  slaCompliance    Decimal? @db.Decimal(5, 2)
  
  // Risk Update
  riskRatingBefore String?
  riskRatingAfter  String?
  tierBefore       VendorTier?
  tierAfter        VendorTier?
  
  // Content
  summary         String? @db.Text
  findings        String? @db.Text
  recommendations String? @db.Text
  actionItems     Json? @default("[]")
  
  // Board Reporting (DORA)
  includedInBoardReport Boolean @default(false)
  boardReportDate       DateTime?
  
  reviewerId String?
}
```

---

### VendorIncident

Supply chain security incidents.

```prisma
model VendorIncident {
  id          String   @id @default(cuid())
  
  vendorId     String
  vendor       Vendor @relation(...)
  
  incidentRef  String @unique       // VINC-001
  title        String
  description  String @db.Text
  
  incidentType String              // SECURITY_BREACH, SERVICE_OUTAGE
  severity     String              // CRITICAL, HIGH, MEDIUM, LOW
  status       String @default("OPEN")
  
  // NIS2 Timeline
  detectedAt            DateTime
  reportedAt            DateTime?
  initialNotificationAt DateTime?   // 24hr notification
  fullReportAt          DateTime?   // 72hr report
  finalReportAt         DateTime?   // 1 month final
  resolvedAt            DateTime?
  
  // Impact
  businessImpact   String? @db.Text
  dataAffected     Boolean @default(false)
  regulatoryReport Boolean @default(false)
  
  // Response
  rootCause      String? @db.Text
  resolution     String? @db.Text
  lessonsLearned String? @db.Text
  
  linkedIncidentId String?
  assignedToId     String?
}
```

---

### VendorExitPlan

DORA Article 28(8) exit strategies.

```prisma
model VendorExitPlan {
  id          String   @id @default(cuid())
  
  vendorId    String
  vendor      Vendor @relation(...)
  
  exitPlanRef String @unique       // EXIT-VND001-001
  title       String
  description String? @db.Text
  status      ExitPlanStatus @default(DRAFT)
  
  // Trigger Scenarios
  coversInterruptions Boolean @default(true)
  coversFailures      Boolean @default(true)
  coversTermination   Boolean @default(true)
  coversInsolvency    Boolean @default(false)
  coversRegulatory    Boolean @default(false)
  
  // Transition
  transitionPeriodDays  Int?
  alternativeVendors    Json? @default("[]")
  dataExtractionPlan    String? @db.Text
  serviceTransitionPlan String? @db.Text
  
  // Testing
  lastTestedDate DateTime?
  nextTestDue    DateTime?
  testResults    String? @db.Text
  testSuccessful Boolean?
  
  // Approval
  approvedById String?
  approvedDate DateTime?
}
```

---

### VendorSLARecord

SLA performance tracking.

```prisma
model VendorSLARecord {
  id          String   @id @default(cuid())
  
  vendorId    String
  vendor      Vendor @relation(...)
  
  period      DateTime           // Month/period
  metricName  String             // "Uptime", "Response Time"
  metricUnit  String?            // "%", "hours"
  
  targetValue Decimal @db.Decimal(10, 4)
  actualValue Decimal @db.Decimal(10, 4)
  
  status      SLAStatus
  breachCount Int @default(0)
  notes       String?
}
```

---

### VendorHistory

Audit trail for vendor changes.

```prisma
model VendorHistory {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  
  vendorId    String
  vendor      Vendor @relation(...)
  
  action      String              // CREATED, UPDATED, STATUS_CHANGED
  field       String?
  oldValue    String? @db.Text
  newValue    String? @db.Text
  notes       String?
  
  changedById String?
}
```

---

## Database Indexes

Indexes are defined for optimal query performance:

| Entity | Index Fields | Purpose |
|--------|--------------|---------|
| Vendor | vendorCode, name | Quick lookups |
| Vendor | tier, status | Filtering |
| Vendor | inDoraScope, isCriticalIctProvider | Regulatory queries |
| Vendor | nextAssessmentDue | Scheduling |
| VendorAssessment | assessmentRef | Quick lookup |
| VendorAssessment | status, dueDate | Filtering |
| AssessmentQuestion | domain, frameworkLayer | Question filtering |
| VendorContract | expiryDate | Expiry alerts |
| VendorReview | scheduledDate | Scheduling |

---

## Schema Location

The complete Prisma schema is located at:

```
apps/server/prisma/schema/supply-chain.prisma
```

To regenerate the Prisma client after schema changes:

```bash
cd apps/server
npx prisma generate
npx prisma db push  # For development
```
