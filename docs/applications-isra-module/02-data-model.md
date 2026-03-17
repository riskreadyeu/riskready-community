# Data Model

## Entity Relationship Diagram

```
┌─────────────────┐
│   Application   │
├─────────────────┤
│ id (PK)         │
│ appId           │
│ name            │
│ description     │
│ businessOwner   │
│ technicalOwner  │
│ criticality     │
│ cRating         │
│ iRating         │
│ aRating         │
│ ... (43 fields) │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│ ApplicationISRA │
├─────────────────┤
│ id (PK)         │
│ applicationId   │◄──────────────────────────────────┐
│ assessmentVer   │                                   │
│ status          │                                   │
│ startDate       │                                   │
└────────┬────────┘                                   │
         │ 1:1        1:1        1:1                  │
    ┌────┴────┬───────┴──────┬────┴────┐             │
    ▼         ▼              ▼         ▼             │
┌───────┐ ┌───────┐    ┌─────────┐ ┌───────┐        │
│  BIA  │ │  TVA  │    │   SRL   │ │   NC  │        │
└───┬───┘ └───┬───┘    └────┬────┘ └───────┘        │
    │         │             │                        │
    │ 1:N     │ 1:N         │ 1:N                   │
    ▼         ▼             ▼                        │
┌──────────┐ ┌──────────┐ ┌──────────┐              │
│BIAResponse│ │ThreatEntry│ │SRLEntry  │──────────────┘
└──────────┘ └──────────┘ └──────────┘
    │              │            │
    │ N:1          │ N:1        │ N:1
    ▼              ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│BIAQuestionCat│ │ThreatCatalog │ │SRLMasterRequirement│
└──────────────┘ └──────────────┘ └──────────────────┘
```

## Core Models

### Application

The central entity representing an application asset.

```prisma
model Application {
  id                    String   @id @default(cuid())
  
  // Identification
  appId                 String   @unique
  name                  String
  description           String?
  
  // Ownership
  businessOwnerDept     String?
  businessOwnerName     String?
  businessOwnerEmail    String?
  technicalOwnerDept    String?
  technicalOwnerName    String?
  technicalOwnerEmail   String?
  executiveSponsor      String?
  
  // Vendor & Hosting
  vendorName            String?
  vendorContact         String?
  contractEndDate       DateTime?
  hostingModel          HostingModel @default(ON_PREMISE)
  cloudProvider         String?
  deploymentRegion      String?
  
  // Technical Details
  applicationVersion    String?
  applicationUrl        String?
  applicationEnvironment AppEnvironment @default(PRODUCTION)
  integrationPoints     Json?     @default("[]")
  technologyStack       Json?     @default("[]")
  
  // Classification
  criticality           CriticalityLevel @default(MEDIUM)
  cRating               Int       @default(2)  // 1-4
  iRating               Int       @default(2)  // 1-4
  aRating               Int       @default(2)  // 1-4
  dataClassification    DataClassification @default(INTERNAL)
  
  // Critical Function (DORA)
  isCriticalFunction    Boolean   @default(false)
  criticalFunctionId    String?
  
  // Data & Privacy
  personalDataProcessed Boolean   @default(false)
  specialCategoryData   Boolean   @default(false)
  dataSubjectCategories Json?     @default("[]")
  
  // Resilience
  rto                   String?
  rpo                   String?
  bcpPlanRef            String?
  drPlanRef             String?
  
  // Security Assessment
  lastPentestDate       DateTime?
  lastVulnScanDate      DateTime?
  lastRiskAssessmentDate DateTime?
  
  // Lifecycle
  lifecycleStatus       AppLifecycleStatus @default(ACTIVE)
  goLiveDate            DateTime?
  plannedDecommissionDate DateTime?
  
  // Relationships
  isras                 ApplicationISRA[]
}
```

### ApplicationISRA

Represents a point-in-time Information Security Risk Assessment.

```prisma
model ApplicationISRA {
  id                String      @id @default(cuid())
  applicationId     String
  application       Application @relation(...)
  
  assessmentVersion Int         @default(1)
  status            ISRAStatus  @default(DRAFT)
  startDate         DateTime    @default(now())
  completedDate     DateTime?
  
  leadAssessorId    String?
  notes             String?
  
  // Components
  bia               ApplicationBIA?
  tva               ApplicationTVA?
  srl               ApplicationSRL?
  nonconformities   Nonconformity[]
}

enum ISRAStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
  ARCHIVED
}
```

### ApplicationBIA

Business Impact Analysis with questionnaire responses.

```prisma
model ApplicationBIA {
  id                    String   @id @default(cuid())
  israId                String   @unique
  
  // Section Completion
  dataPrivacyCompleted     Boolean @default(false)
  confidentialityCompleted Boolean @default(false)
  integrityCompleted       Boolean @default(false)
  availabilityCompleted    Boolean @default(false)
  aiMlCompleted            Boolean @default(false)
  
  // Calculated CIA Ratings (1-4)
  confidentialityImpact Int @default(1)
  integrityImpact       Int @default(1)
  availabilityImpact    Int @default(1)
  
  // Financial Impact
  estimatedFinancialImpact String?
  
  // Criticality Levels
  businessCriticality CriticalityLevel @default(LOW)
  riskLevel           CriticalityLevel @default(LOW)
  
  // Recovery Objectives
  motHours    Int?  // Maximum Outage Time
  rtoMinutes  Int?  // Recovery Time Objective
  rpoMinutes  Int?  // Recovery Point Objective
  mtpdMinutes Int?  // Maximum Tolerable Period
  
  // DORA/NIS2 Flags
  isCriticalFunction  Boolean @default(false)
  isEssentialService  Boolean @default(false)
  
  // AI/ML Classification
  hasAiMlComponents    Boolean @default(false)
  aiRiskClassification String?
  
  // Dependencies
  upstreamDependencies   Json? @default("[]")
  downstreamDependencies Json? @default("[]")
  
  // Responses
  responses BIAResponse[]
}
```

### BIAQuestionCatalog

Master catalog of BIA questions.

```prisma
model BIAQuestionCatalog {
  id           String   @id @default(cuid())
  questionId   String   @unique  // e.g., "1.0", "22.0"
  section      BIASection
  sortOrder    Int
  
  question     String
  description  String?
  
  responseType BIAResponseType @default(YES_NO_NA)
  options      Json?   // [{value, label, weight}]
  
  // CIA Impact Mapping
  affectsConfidentiality Boolean @default(false)
  affectsIntegrity       Boolean @default(false)
  affectsAvailability    Boolean @default(false)
  impactWeight           Int     @default(1)
  
  // Standards Mapping
  isoControlId   String?
  capabilityId   String?
  metricImpact   String?
  
  // Regulatory Flags
  isGdprRelated    Boolean @default(false)
  isDoraRelated    Boolean @default(false)
  isNis2Related    Boolean @default(false)
  isEuAiActRelated Boolean @default(false)
}

enum BIASection {
  DATA_PRIVACY
  CONFIDENTIALITY
  INTEGRITY
  AVAILABILITY
  AI_ML
}

enum BIAResponseType {
  YES_NO
  YES_NO_NA
  SELECT_ONE
  SELECT_MULTIPLE
  TEXT
  NUMERIC
}
```

### BIAResponse

Individual responses to BIA questions.

```prisma
model BIAResponse {
  id            String   @id @default(cuid())
  biaId         String
  questionId    String
  
  responseValue  String?   // "YES", "NO", "NA", or option value
  responseValues Json?     // For multi-select
  numericValue   Float?    // For numeric responses
  notes          String?
  
  @@unique([biaId, questionId])
}
```

### ThreatCatalog & ThreatEntry

```prisma
model ThreatCatalog {
  id                    String   @id @default(cuid())
  threatId              String   @unique
  category              ThreatCategory
  name                  String
  description           String?
  
  baseLikelihood        Int      @default(2)  // 1-4
  confidentialityImpact Int      @default(2)  // 1-4
  integrityImpact       Int      @default(2)  // 1-4
  availabilityImpact    Int      @default(2)  // 1-4
  
  mitigationGuidance    String?
  relatedIsoControls    Json?    @default("[]")
  relatedSRLRequirements Json?   @default("[]")
}

model ThreatEntry {
  id              String   @id @default(cuid())
  tvaId           String
  threatCatalogId String
  
  isApplicable    Boolean  @default(true)
  likelihood      Int?     // Override
  confidentialityImpact Int?
  integrityImpact Int?
  availabilityImpact Int?
  
  riskScore       Int      @default(0)
  rationale       String?
}
```

### SRLMasterRequirement & SRLEntry

```prisma
model SRLMasterRequirement {
  id                  String   @id @default(cuid())
  requirementId       String   @unique
  domain              String
  name                String
  description         String?
  
  applicability       SRLApplicability @default(ALL)
  
  isoControlId        String?
  capabilityId        String?
  evidenceRequired    String?
  testMethod          String?
  
  affectsConfidentiality Boolean @default(false)
  affectsIntegrity       Boolean @default(false)
  affectsAvailability    Boolean @default(false)
  
  isDoraRequired      Boolean @default(false)
  isNis2Required      Boolean @default(false)
  
  tvaThreats          Json?   @default("[]")
}

enum SRLApplicability {
  ALL         // Applies to all applications
  MED_PLUS    // Medium risk and above
  HIGH_PLUS   // High risk and above
  CRIT_ONLY   // Critical only
}

model SRLEntry {
  id              String   @id @default(cuid())
  srlId           String
  requirementId   String
  
  coverageStatus  SRLCoverageStatus @default(NOT_ASSESSED)
  evidenceNotes   String?
  
  linkedNCId      String?  // Nonconformity if GAP
}

enum SRLCoverageStatus {
  COVERED
  PARTIAL
  GAP
  NOT_APPLICABLE
  NOT_ASSESSED
}
```

### Nonconformity

```prisma
model Nonconformity {
  id                String   @id @default(cuid())
  
  source            NonconformitySource @default(SRL_GAP)
  sourceReference   String?
  
  title             String
  description       String?
  
  severity          NCSeverity @default(MEDIUM)
  category          NCCategory @default(TECHNICAL)
  status            NCStatus   @default(OPEN)
  
  applicationId     String?
  israId            String?
  
  assetCriticality  Int?  // 1-4
  threatImpact      Int?  // 1-4
  riskScore         Int?  // assetCriticality × threatImpact
}

enum NCSeverity {
  CRITICAL  // riskScore >= 12
  HIGH      // riskScore >= 8
  MEDIUM    // riskScore >= 4
  LOW       // riskScore < 4
}
```

## Enums Reference

### CriticalityLevel
```prisma
enum CriticalityLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

### HostingModel
```prisma
enum HostingModel {
  ON_PREMISE
  CLOUD_PUBLIC
  CLOUD_PRIVATE
  HYBRID
  SAAS
  MANAGED
}
```

### DataClassification
```prisma
enum DataClassification {
  PUBLIC
  INTERNAL
  CONFIDENTIAL
  RESTRICTED
}
```

### AppLifecycleStatus
```prisma
enum AppLifecycleStatus {
  PLANNED
  DEVELOPMENT
  ACTIVE
  MAINTENANCE
  DEPRECATED
  DECOMMISSIONED
}
```

### ThreatCategory
```prisma
enum ThreatCategory {
  MALWARE
  SOCIAL_ENGINEERING
  UNAUTHORIZED_ACCESS
  DATA_BREACH
  DENIAL_OF_SERVICE
  INSIDER_THREAT
  PHYSICAL
  SUPPLY_CHAIN
  TECHNICAL_FAILURE
  NATURAL_DISASTER
  COMPLIANCE
  THIRD_PARTY
}
```
