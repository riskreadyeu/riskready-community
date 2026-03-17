# Data Dictionary

Complete reference documentation for all data models, fields, relationships, and enumerations in the RiskReady application.

**Last Updated:** 2025-01-16  
**Database:** PostgreSQL  
**ORM:** Prisma

---

## Table of Contents

1. [Introduction](#introduction)
2. [Common Patterns](#common-patterns)
3. [Authentication Module](#authentication-module)
4. [Organisation Module](#organisation-module)
5. [Controls Module](#controls-module)
6. [Risk Module](#risk-module)
7. [Policy Module](#policy-module)
8. [ITSM Module](#itsm-module)
9. [Supply Chain Module](#supply-chain-module)
10. [Applications Module](#applications-module)
11. [Audits Module](#audits-module)
12. [Incidents Module](#incidents-module)
13. [BCM Module](#bcm-module)
14. [Evidence Module](#evidence-module)
15. [Enumerations Reference](#enumerations-reference)

---

## Introduction

This data dictionary provides comprehensive documentation for all database entities in the RiskReady application. The application uses Prisma ORM with PostgreSQL and follows a modular schema organization.

### Schema Organization

The Prisma schema is organized into multiple files by module:

- `base.prisma` - Database connection and generator configuration
- `auth.prisma` - Authentication and core user models
- `organisation.prisma` - Organization management models
- `controls.prisma` - ISO 27001 control management
- `policies.prisma` - Policy and document management
- `itsm.prisma` - IT Service Management (CMDB & Change Management)
- `supply-chain.prisma` - Third-party risk assessment and vendor management
- `applications.prisma` - Application asset management and ISRA
- `audits.prisma` - Audit and nonconformity management
- `incidents.prisma` - Incident management with NIS2/DORA compliance
- `bcm.prisma` - Business Continuity Management (BCM) and BIA
- `evidence.prisma` - Central evidence repository and management

---

## Common Patterns

### Base Entity Fields

Most entities include standard audit and tracking fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp (auto-updated) |
| `createdById` | String? | ID of user who created the record |
| `updatedById` | String? | ID of user who last updated the record |
| `createdBy` | User? | Relation to creating user |
| `updatedBy` | User? | Relation to updating user |

### Soft Delete Pattern

Many entities use `isActive` boolean field for soft deletion:

```prisma
isActive Boolean @default(true)
```

### Status Fields

Entities with workflow states typically include:

```prisma
status EnumType @default(INITIAL_STATE)
```

### Code/Identifier Pattern

Entities often have human-readable codes:

```prisma
entityCode String @unique
```

### Hierarchical Pattern

Self-referencing relations for tree structures:

```prisma
parentId String?
parent   Entity?  @relation("EntityHierarchy", fields: [parentId], references: [id])
children Entity[] @relation("EntityHierarchy")
```

### JSON Fields

For flexible/array data:

```prisma
metadata Json? @default("[]")  // Array
config   Json? @default("{}")  // Object
```

### Decimal Fields

For financial/precise values:

```prisma
amount Decimal? @db.Decimal(15, 2)
currency String @default("USD")
```

---

## Authentication Module

### User

Core user account model for authentication and authorization.

**Table:** `User`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique identifier |
| `email` | String | Unique | User email address (login) |
| `passwordHash` | String | Required | Bcrypt hashed password |
| `firstName` | String? | Optional | User's first name |
| `lastName` | String? | Optional | User's last name |
| `isActive` | Boolean | Default: true | Account active status |
| `createdAt` | DateTime | Auto | Account creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

**Relationships:**
- `refreshSessions` → RefreshSession[] (one-to-many)
- `auditEvents` → AuditEvent[] (one-to-many)
- Extensive relations to all modules (see schema for full list)

**Indexes:**
- `email` (unique)
- `isActive`

### RefreshSession

User session management for refresh token authentication.

**Table:** `RefreshSession`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK | Session identifier |
| `userId` | String | FK → User | User owning the session |
| `createdAt` | DateTime | Auto | Session creation time |
| `expiresAt` | DateTime | Required | Session expiration time |
| `revokedAt` | DateTime? | Optional | When session was revoked |
| `userAgent` | String? | Optional | Browser user agent |
| `ip` | String? | Optional | IP address |

**Relationships:**
- `user` → User (many-to-one)

**Indexes:**
- `userId`
- `expiresAt`

### AuditEvent

System-wide audit trail for user actions.

**Table:** `AuditEvent`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique identifier |
| `actorUserId` | String? | FK → User | User who performed action |
| `action` | String | Required | Action performed |
| `entityType` | String | Required | Type of entity affected |
| `entityId` | String? | Optional | ID of affected entity |
| `data` | Json? | Optional | Additional action data |
| `createdAt` | DateTime | Auto | Event timestamp |

**Relationships:**
- `actor` → User? (many-to-one)

**Indexes:**
- `actorUserId`
- `createdAt`

---

## Organisation Module

### OrganisationProfile

Primary organization entity containing ISMS scope and profile information.

**Table:** `OrganisationProfile`

**Basic Information:**
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Organization name |
| `legalName` | String | Legal entity name |
| `description` | String? | Organization description |
| `logoUrl` | String? | Logo image URL |

**Industry Information:**
| Field | Type | Description |
|-------|------|-------------|
| `industrySector` | String? | Primary industry sector |
| `industrySubsector` | String? | Industry subsector |
| `industryCode` | String? | Industry classification code |
| `marketPosition` | String? | Market position |
| `primaryCompetitors` | Json? | Array of competitor names |

**Financial Information:**
| Field | Type | Description |
|-------|------|-------------|
| `annualRevenue` | Decimal? | Annual revenue (20,2) |
| `revenueCurrency` | String | Default: "USD" |
| `revenueStreams` | Json? | Array of revenue streams |
| `revenueTrend` | String? | Revenue trend direction |
| `fiscalYearStart` | String? | Fiscal year start month |
| `fiscalYearEnd` | DateTime? | Fiscal year end date |
| `reportingCurrency` | String | Default: "USD" |

**Employee Information:**
| Field | Type | Description |
|-------|------|-------------|
| `employeeCount` | Int | Total employees |
| `employeeCategories` | Json? | Employee category breakdown |
| `employeeLocations` | Json? | Employee location distribution |
| `employeeGrowthRate` | Decimal? | Growth rate percentage (5,2) |
| `remoteWorkPercentage` | Int? | Percentage remote workers |
| `size` | String? | Organization size category |

**ISMS Information (ISO 27001 Clause 4.3):**
| Field | Type | Description |
|-------|------|-------------|
| `ismsScope` | String? | ISMS scope description |
| `ismsPolicy` | String? | ISMS policy reference |
| `ismsObjectives` | Json? | ISMS objectives array |
| `productsServicesInScope` | Json? | Products/services in scope |
| `departmentsInScope` | Json? | Departments in scope |
| `locationsInScope` | Json? | Locations in scope |
| `processesInScope` | Json? | Processes in scope |
| `systemsInScope` | Json? | Systems in scope |
| `scopeExclusions` | String? | Scope exclusions |
| `exclusionJustification` | String? | Justification for exclusions |
| `scopeBoundaries` | String? | Scope boundaries |

**ISO Certification:**
| Field | Type | Description |
|-------|------|-------------|
| `isoCertificationStatus` | String | Default: "not_certified" |
| `certificationBody` | String? | Certification body name |
| `certificationDate` | DateTime? | Certification date |
| `certificationExpiry` | DateTime? | Certification expiry |
| `certificateNumber` | String? | Certificate number |
| `nextAuditDate` | DateTime? | Next audit date |

**Risk Management:**
| Field | Type | Description |
|-------|------|-------------|
| `riskAppetite` | String? | Risk appetite statement |
| `riskTolerance` | Json? | Risk tolerance configuration |

**Relationships:**
- `controls` → Control[]
- `soas` → StatementOfApplicability[]
- `risks` → Risk[]
- `riskToleranceStatements` → RiskToleranceStatement[]
- `treatmentPlans` → TreatmentPlan[]
- `policyDocuments` → PolicyDocument[]
- `birtOrgConfigs` → BirtOrgConfig[]

**Indexes:**
- `name`
- `industrySector`

### Department

Organizational department with hierarchy and leadership.

**Table:** `Department`

**Basic Information:**
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Department name |
| `departmentCode` | String | Unique code |
| `description` | String? | Department description |

**Hierarchy:**
| Field | Type | Description |
|-------|------|-------------|
| `parentId` | String? | FK → Department (parent) |
| `parent` | Department? | Parent department |
| `children` | Department[] | Child departments |

**Classification:**
| Field | Type | Description |
|-------|------|-------------|
| `departmentCategory` | String? | Category classification |
| `functionType` | String? | Function type |
| `criticalityLevel` | String? | Criticality level |

**Leadership:**
| Field | Type | Description |
|-------|------|-------------|
| `departmentHeadId` | String? | FK → User (head) |
| `departmentHead` | User? | Department head |
| `deputyHeadId` | String? | FK → User (deputy) |
| `deputyHead` | User? | Deputy head |

**Resources:**
| Field | Type | Description |
|-------|------|-------------|
| `headcount` | Int? | Employee count |
| `contractorCount` | Int? | Contractor count |
| `costCenter` | String? | Cost center code |
| `budget` | Decimal? | Budget amount (15,2) |
| `budgetCurrency` | String | Default: "USD" |

**Data Handling:**
| Field | Type | Description |
|-------|------|-------------|
| `handlesPersonalData` | Boolean | Default: false |
| `handlesFinancialData` | Boolean | Default: false |

**Status:**
| Field | Type | Description |
|-------|------|-------------|
| `isActive` | Boolean | Default: true |
| `establishedDate` | DateTime? | When established |
| `closureDate` | DateTime? | When closed |

**Relationships:**
- `members` → DepartmentMember[]
- `businessProcesses` → BusinessProcess[]
- `securityChampions` → SecurityChampion[]
- `externalDependencies` → ExternalDependency[]
- `applications` → Application[]
- `assets` → Asset[]
- `changes` → Change[]

**Indexes:**
- `departmentCode` (unique)
- `parentId`
- `departmentHeadId`
- `isActive`

### BIAAssessmentHistory

Audit trail for Business Impact Analysis assessments on business processes.

**Table:** `BIAAssessmentHistory`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `createdAt` | DateTime | Assessment timestamp |
| `processId` | String | FK → BusinessProcess |
| `process` | BusinessProcess | Assessed process |
| `assessedById` | String | FK → User (assessor) |
| `assessedBy` | User | Assessor |
| `snapshotData` | Json | Snapshot of BIA fields at assessment time (bcpCriticality, rto, rpo, mtpd, minimumStaff, dependencies, etc.) |
| `assessmentType` | String | Default: "initial" (initial, review, update) |
| `notes` | String? | Assessment notes |

**Relationships:**
- `process` → BusinessProcess (many-to-one)
- `assessedBy` → User (many-to-one)

**Indexes:**
- `processId`
- `assessedById`
- `createdAt`

### Location

Physical or virtual location entity.

**Table:** `Location`

**Basic Information:**
| Field | Type | Description |
|-------|------|-------------|
| `locationCode` | String? | Unique location code |
| `name` | String | Location name |
| `locationType` | String? | Type of location |

**Address:**
| Field | Type | Description |
|-------|------|-------------|
| `address` | String? | Street address |
| `city` | String? | City |
| `state` | String? | State/province |
| `country` | String? | Country |
| `postalCode` | String? | Postal code |
| `region` | String? | Region |

**Contact:**
| Field | Type | Description |
|-------|------|-------------|
| `contactEmail` | String? | Contact email |
| `contactPhone` | String? | Contact phone |
| `timezone` | String? | Timezone |

**Capacity:**
| Field | Type | Description |
|-------|------|-------------|
| `employeeCount` | Int? | Current employees |
| `maxCapacity` | Int? | Maximum capacity |
| `floorSpace` | Decimal? | Floor space (10,2) |
| `floorSpaceUnit` | String | Default: "sqm" |

**Physical Security:**
| Field | Type | Description |
|-------|------|-------------|
| `physicalSecurityLevel` | String? | Security level |
| `accessControlType` | String? | Access control type |
| `securityFeatures` | Json? | Array of security features |

**IT Infrastructure:**
| Field | Type | Description |
|-------|------|-------------|
| `isDataCenter` | Boolean | Default: false |
| `hasServerRoom` | Boolean | Default: false |
| `networkType` | String? | Network type |
| `internetProvider` | String? | ISP name |
| `backupPower` | Boolean | Default: false |

**ISMS Scope:**
| Field | Type | Description |
|-------|------|-------------|
| `inIsmsScope` | Boolean | Default: true |
| `scopeJustification` | String? | Justification |

**Status:**
| Field | Type | Description |
|-------|------|-------------|
| `isActive` | Boolean | Default: true |
| `operationalSince` | DateTime? | Operational start date |
| `closureDate` | DateTime? | Closure date |

**Relationships:**
- `assets` → Asset[]

**Indexes:**
- `locationCode` (unique)
- `name`
- `country`
- `locationType`
- `isActive`

### BusinessProcess

Business process with BCP capabilities.

**Table:** `BusinessProcess`

**Basic Information:**
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Process name |
| `processCode` | String | Unique code |
| `description` | String? | Description |
| `processType` | String | Process type |
| `criticalityLevel` | String | Default: "medium" |

**Ownership:**
| Field | Type | Description |
|-------|------|-------------|
| `processOwnerId` | String? | FK → User (owner) |
| `processOwner` | User? | Process owner |
| `processManagerId` | String? | FK → User (manager) |
| `processManager` | User? | Process manager |
| `departmentId` | String? | FK → Department |
| `department` | Department? | Owning department |
| `backupOwnerId` | String? | FK → User (backup) |
| `backupOwner` | User? | Backup owner |

**Process Details:**
| Field | Type | Description |
|-------|------|-------------|
| `inputs` | Json? | Process inputs |
| `outputs` | Json? | Process outputs |
| `keyActivities` | Json? | Key activities |
| `stakeholders` | Json? | Stakeholders |
| `kpis` | Json? | Key performance indicators |

**BIA Status (Business Impact Analysis):**
| Field | Type | Description |
|-------|------|-------------|
| `biaStatus` | String | Default: "pending" (pending, in_progress, completed) |
| `biaCompletedAt` | DateTime? | BIA completion timestamp |
| `biaCompletedById` | String? | FK → User (assessor) |
| `biaCompletedBy` | User? | User who completed BIA |
| `biaLastReviewedAt` | DateTime? | Last review date |
| `biaNextReviewDue` | DateTime? | Next review due date |

**BCP Fields (populated by BIA assessment):**
| Field | Type | Description |
|-------|------|-------------|
| `bcpEnabled` | Boolean | Default: false |
| `bcpCriticality` | String? | BCP criticality (critical, high, medium, low) |
| `recoveryTimeObjectiveMinutes` | Int? | RTO in minutes |
| `recoveryPointObjectiveMinutes` | Int? | RPO in minutes |
| `maximumTolerableDowntimeMinutes` | Int? | MTD in minutes |
| `minimumStaff` | Int? | Minimum staff required |
| `alternateProcesses` | String? | Alternate processes |
| `workaroundProcedures` | String? | Workaround procedures |
| `manualProcedures` | String? | Manual procedures |
| `recoveryStrategies` | Json? | Recovery strategies |

**Status:**
| Field | Type | Description |
|-------|------|-------------|
| `isActive` | Boolean | Default: true |

**Relationships:**
- `externalDependencies` → ExternalDependency[]
- `assetLinks` → AssetBusinessProcess[]

**Indexes:**
- `processCode` (unique)
- `processOwnerId`
- `departmentId`
- `bcpEnabled, bcpCriticality`

### SecurityCommittee

Security governance committee.

**Table:** `SecurityCommittee`

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Committee name |
| `committeeType` | String | Type of committee |
| `description` | String? | Description |
| `chairId` | String? | FK → User (chair) |
| `chair` | User? | Committee chair |
| `authorityLevel` | String? | Authority level |
| `meetingFrequency` | String | Meeting frequency |
| `nextMeetingDate` | DateTime? | Next scheduled meeting |
| `isActive` | Boolean | Default: true |
| `establishedDate` | DateTime | Establishment date |
| `dissolvedDate` | DateTime? | Dissolution date |

**Relationships:**
- `memberships` → CommitteeMembership[]
- `meetings` → CommitteeMeeting[]

**Indexes:**
- `committeeType`
- `chairId`
- `isActive`

### CommitteeMeeting

Security committee meeting instance.

**Table:** `CommitteeMeeting`

| Field | Type | Description |
|-------|------|-------------|
| `committeeId` | String | FK → SecurityCommittee |
| `committee` | SecurityCommittee | Parent committee |
| `meetingNumber` | String? | Meeting number |
| `title` | String | Meeting title |
| `meetingType` | String | Default: "regular" |
| `meetingDate` | DateTime | Meeting date |
| `startTime` | String | Start time |
| `endTime` | String? | End time |
| `durationMinutes` | Int? | Duration |
| `locationType` | String | Default: "virtual" |
| `physicalLocation` | String? | Physical location |
| `virtualMeetingLink` | String? | Virtual meeting URL |
| `virtualMeetingId` | String? | Virtual meeting ID |
| `agenda` | String? | Meeting agenda |
| `objectives` | String? | Meeting objectives |
| `minutes` | String? | Meeting minutes |
| `chairId` | String? | FK → User (chair) |
| `chair` | User? | Meeting chair |
| `secretaryId` | String? | FK → User (secretary) |
| `secretary` | User? | Meeting secretary |
| `expectedAttendeesCount` | Int | Default: 0 |
| `actualAttendeesCount` | Int | Default: 0 |
| `status` | String | Default: "scheduled" |
| `quorumAchieved` | Boolean | Default: false |
| `quorumRequirement` | Int? | Quorum requirement |

**Relationships:**
- `attendances` → MeetingAttendance[]
- `decisions` → MeetingDecision[]
- `actionItems` → MeetingActionItem[]

**Indexes:**
- `committeeId, meetingDate, startTime` (unique)
- `committeeId`
- `meetingDate`
- `status`

### MeetingActionItem

Action items from committee meetings.

**Table:** `MeetingActionItem`

| Field | Type | Description |
|-------|------|-------------|
| `meetingId` | String | FK → CommitteeMeeting |
| `meeting` | CommitteeMeeting | Parent meeting |
| `actionNumber` | String? | Action number |
| `title` | String | Action title |
| `description` | String | Action description |
| `assignedToId` | String? | FK → User (assignee) |
| `assignedTo` | User? | Assigned user |
| `assignedById` | String? | FK → User (assigner) |
| `assignedBy` | User? | User who assigned |
| `priority` | String | Default: "medium" |
| `dueDate` | DateTime | Due date |
| `estimatedHours` | Decimal? | Estimated hours (5,1) |
| `status` | String | Default: "open" |
| `completionDate` | DateTime? | Completion date |
| `completionNotes` | String? | Completion notes |
| `progressPercentage` | Int | Default: 0 |
| `lastUpdateNotes` | String? | Last update notes |
| `dependsOnId` | String? | FK → MeetingActionItem (dependency) |
| `dependsOn` | MeetingActionItem? | Dependent action |
| `dependentItems` | MeetingActionItem[] | Items depending on this |
| `blockingReason` | String? | Blocking reason |
| `requiresCommitteeReview` | Boolean | Default: false |
| `reviewed` | Boolean | Default: false |
| `reviewDate` | DateTime? | Review date |

**Indexes:**
- `meetingId`
- `assignedToId`
- `status`
- `priority, dueDate`

### DepartmentMember

Department membership tracking for users.

**Table:** `DepartmentMember`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `createdAt` | DateTime | Membership start timestamp |
| `departmentId` | String | FK → Department |
| `department` | Department | Department |
| `userId` | String | FK → User |
| `user` | User | Member user |
| `role` | String? | Role in department |
| `isActive` | Boolean | Default: true |
| `startDate` | DateTime? | Start date |
| `endDate` | DateTime? | End date |

**Relationships:**
- `department` → Department (many-to-one)
- `user` → User (many-to-one)

**Indexes:**
- `departmentId, userId` (unique)
- `userId`
- `departmentId`

### OrganisationalUnit

Organizational unit with hierarchy (separate from Department structure).

**Table:** `OrganisationalUnit`

**Basic Information:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `name` | String | Unit name |
| `unitType` | String | Type of unit |
| `description` | String? | Description |
| `code` | String | Unique code |

**Hierarchy:**
| Field | Type | Description |
|-------|------|-------------|
| `parentId` | String? | FK → OrganisationalUnit (parent) |
| `parent` | OrganisationalUnit? | Parent unit |
| `children` | OrganisationalUnit[] | Child units |

**Leadership:**
| Field | Type | Description |
|-------|------|-------------|
| `headId` | String? | FK → User (head) |
| `head` | User? | Unit head |

**Financial:**
| Field | Type | Description |
|-------|------|-------------|
| `budget` | Decimal? | Budget amount (15,2) |
| `budgetCurrency` | String | Default: "USD" |
| `costCenter` | String? | Cost center |

**Status:**
| Field | Type | Description |
|-------|------|-------------|
| `isActive` | Boolean | Default: true |
| `establishedDate` | DateTime? | When established |

**Relationships:**
- `parent` → OrganisationalUnit? (many-to-one)
- `children` → OrganisationalUnit[] (one-to-many)
- `head` → User? (many-to-one)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `code` (unique)
- `parentId`
- `headId`

### ExecutivePosition

Executive positions and hierarchy.

**Table:** `ExecutivePosition`

**Basic Information:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `title` | String | Position title |
| `executiveLevel` | String | Executive level |
| `personId` | String? | FK → User (person) |
| `person` | User? | Person in position |

**Hierarchy:**
| Field | Type | Description |
|-------|------|-------------|
| `reportsToId` | String? | FK → ExecutivePosition (reports to) |
| `reportsTo` | ExecutivePosition? | Reports to position |
| `subordinates` | ExecutivePosition[] | Subordinate positions |

**Authority:**
| Field | Type | Description |
|-------|------|-------------|
| `authorityLevel` | String? | Authority level |
| `securityResponsibilities` | String? | Security responsibilities |
| `riskAuthorityLevel` | String? | Risk authority level |
| `budgetAuthority` | Boolean | Default: false |

**Status:**
| Field | Type | Description |
|-------|------|-------------|
| `isActive` | Boolean | Default: true |
| `isCeo` | Boolean | Default: false |
| `isSecurityCommitteeMember` | Boolean | Default: false |

**Dates:**
| Field | Type | Description |
|-------|------|-------------|
| `startDate` | DateTime | Start date |
| `endDate` | DateTime? | End date |

**Relationships:**
- `person` → User? (many-to-one)
- `reportsTo` → ExecutivePosition? (many-to-one)
- `subordinates` → ExecutivePosition[] (one-to-many)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `executiveLevel`
- `personId`
- `isActive`

### SecurityChampion

Security champion role assignment to departments.

**Table:** `SecurityChampion`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `userId` | String | FK → User |
| `user` | User | Champion user |
| `departmentId` | String | FK → Department |
| `department` | Department | Department |
| `championLevel` | String | Champion level |
| `responsibilities` | String? | Responsibilities |
| `trainingCompleted` | Boolean | Default: false |
| `lastTrainingDate` | DateTime? | Last training date |
| `isActive` | Boolean | Default: true |
| `startDate` | DateTime | Start date |
| `endDate` | DateTime? | End date |

**Relationships:**
- `user` → User (many-to-one)
- `department` → Department (many-to-one)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `userId, departmentId` (unique)
- `departmentId`
- `isActive`

### ExternalDependency

External dependencies (vendors, suppliers, third parties).

**Table:** `ExternalDependency`

**Basic Information:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `name` | String | Dependency name |
| `dependencyType` | String | Type of dependency |
| `description` | String | Description |
| `vendorWebsite` | String? | Vendor website |

**Risk Assessment:**
| Field | Type | Description |
|-------|------|-------------|
| `criticalityLevel` | String | Criticality level |
| `businessImpact` | String? | Business impact |
| `singlePointOfFailure` | Boolean | Default: false |

**Contract Information:**
| Field | Type | Description |
|-------|------|-------------|
| `contractReference` | String? | Contract reference |
| `contractStart` | DateTime | Contract start date |
| `contractEnd` | DateTime | Contract end date |
| `annualCost` | Decimal? | Annual cost (15,2) |
| `paymentTerms` | String? | Payment terms |

**SLA:**
| Field | Type | Description |
|-------|------|-------------|
| `slaDetails` | Json? | SLA details object |

**Data Processing:**
| Field | Type | Description |
|-------|------|-------------|
| `dataProcessed` | Json? | Data types processed array |
| `dataLocation` | String? | Data location |
| `complianceCertifications` | Json? | Compliance certifications array |

**Assessment:**
| Field | Type | Description |
|-------|------|-------------|
| `lastAssessmentDate` | DateTime? | Last assessment date |
| `riskRating` | String? | Risk rating |

**Contact:**
| Field | Type | Description |
|-------|------|-------------|
| `primaryContact` | String? | Primary contact name |
| `contactEmail` | String | Contact email |
| `contactPhone` | String? | Contact phone |

**Contingency:**
| Field | Type | Description |
|-------|------|-------------|
| `alternativeProviders` | Json? | Alternative providers array |
| `exitStrategy` | String? | Exit strategy |
| `dataRecoveryProcedure` | String? | Data recovery procedure |

**Relationships:**
- `departments` → Department[] (many-to-many)
- `businessProcesses` → BusinessProcess[] (many-to-many)
- `providedAssets` → Asset[] (one-to-many)
- `vendorChanges` → Change[] (one-to-many)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `name`
- `dependencyType`
- `criticalityLevel`

### Regulator

Regulatory bodies and authorities.

**Table:** `Regulator`

**Basic Information:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `name` | String | Regulator name |
| `acronym` | String? | Acronym |
| `regulatorType` | String | Regulator type |
| `jurisdiction` | String | Jurisdiction |
| `jurisdictionLevel` | String | Jurisdiction level |
| `description` | String? | Description |

**Contact:**
| Field | Type | Description |
|-------|------|-------------|
| `website` | String? | Website URL |
| `contactEmail` | String? | Contact email |
| `contactPhone` | String? | Contact phone |
| `contactAddress` | String? | Contact address |

**Regulatory Framework:**
| Field | Type | Description |
|-------|------|-------------|
| `keyRegulations` | Json? | Key regulations array |
| `applicableStandards` | Json? | Applicable standards array |

**Registration:**
| Field | Type | Description |
|-------|------|-------------|
| `registrationStatus` | String | Default: "not_required" |
| `registrationNumber` | String? | Registration number |
| `registrationDate` | DateTime? | Registration date |
| `renewalDate` | DateTime? | Renewal date |

**Inspections:**
| Field | Type | Description |
|-------|------|-------------|
| `lastInspectionDate` | DateTime? | Last inspection date |
| `nextInspectionDate` | DateTime? | Next inspection date |

**Reporting:**
| Field | Type | Description |
|-------|------|-------------|
| `reportingFrequency` | String? | Reporting frequency |
| `lastReportDate` | DateTime? | Last report date |
| `nextReportDate` | DateTime? | Next report date |

**Compliance History:**
| Field | Type | Description |
|-------|------|-------------|
| `penaltiesFines` | Json? | Penalties and fines array |
| `complianceNotes` | String? | Compliance notes |

**Status:**
| Field | Type | Description |
|-------|------|-------------|
| `isActive` | Boolean | Default: true |

**Relationships:**
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `name`
- `regulatorType`
- `jurisdiction`

### CommitteeMembership

Security committee membership.

**Table:** `CommitteeMembership`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `userId` | String | FK → User |
| `user` | User | Committee member |
| `committeeId` | String | FK → SecurityCommittee |
| `committee` | SecurityCommittee | Committee |
| `role` | String | Member role |
| `responsibilities` | String? | Responsibilities |
| `votingRights` | Boolean | Default: true |
| `isActive` | Boolean | Default: true |
| `startDate` | DateTime | Start date |
| `endDate` | DateTime? | End date |

**Relationships:**
- `user` → User (many-to-one)
- `committee` → SecurityCommittee (many-to-one)
- `meetingAttendances` → MeetingAttendance[] (one-to-many)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `userId, committeeId` (unique)
- `committeeId`
- `isActive`

### MeetingAttendance

Attendance tracking for committee meetings.

**Table:** `MeetingAttendance`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `meetingId` | String | FK → CommitteeMeeting |
| `meeting` | CommitteeMeeting | Meeting |
| `memberId` | String | FK → User (member) |
| `member` | User | Attending member |
| `membershipId` | String? | FK → CommitteeMembership |
| `membership` | CommitteeMembership? | Related membership |
| `attendanceStatus` | String | Default: "present" |
| `arrivalTime` | String? | Arrival time |
| `departureTime` | String? | Departure time |
| `participatedInVoting` | Boolean | Default: false |
| `contributedToDiscussion` | Boolean | Default: false |
| `absenceReason` | String? | Absence reason |
| `notes` | String? | Notes |
| `proxyAttendeeId` | String? | FK → User (proxy) |
| `proxyAttendee` | User? | Proxy attendee |

**Relationships:**
- `meeting` → CommitteeMeeting (many-to-one)
- `member` → User (many-to-one)
- `membership` → CommitteeMembership? (many-to-one)
- `proxyAttendee` → User? (many-to-one)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `meetingId, memberId` (unique)
- `meetingId`
- `attendanceStatus`

### MeetingDecision

Decisions made during committee meetings.

**Table:** `MeetingDecision`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `meetingId` | String | FK → CommitteeMeeting |
| `meeting` | CommitteeMeeting | Parent meeting |
| `decisionNumber` | String? | Decision number |
| `title` | String | Decision title |
| `description` | String | Decision description |
| `decisionType` | String | Decision type |
| `rationale` | String? | Rationale |
| `voteType` | String | Default: "majority" |
| `votesFor` | Int | Default: 0 |
| `votesAgainst` | Int | Default: 0 |
| `votesAbstain` | Int | Default: 0 |
| `responsiblePartyId` | String? | FK → User (responsible) |
| `responsibleParty` | User? | Responsible party |
| `effectiveDate` | DateTime? | Effective date |
| `reviewDate` | DateTime? | Review date |
| `implementationDeadline` | DateTime? | Implementation deadline |
| `implemented` | Boolean | Default: false |
| `implementationDate` | DateTime? | Implementation date |
| `implementationNotes` | String? | Implementation notes |
| `relatedDocuments` | Json? | Related documents array |

**Relationships:**
- `meeting` → CommitteeMeeting (many-to-one)
- `responsibleParty` → User? (many-to-one)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `meetingId`
- `decisionType`
- `implemented`

### ProductService

Products and services offered by the organization.

**Table:** `ProductService`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `productCode` | String | Unique product code |
| `name` | String | Product/service name |
| `productType` | String | Product type |
| `description` | String? | Description |
| `category` | String? | Category |
| `customerFacing` | Boolean | Default: true |
| `internalOnly` | Boolean | Default: false |
| `revenueContribution` | String? | Revenue contribution |
| `pricingModel` | String? | Pricing model |
| `targetMarket` | String? | Target market |
| `lifecycleStage` | String? | Lifecycle stage |
| `launchDate` | DateTime? | Launch date |
| `sunsetDate` | DateTime? | Sunset date |
| `productOwnerId` | String? | FK → User (owner) |
| `departmentId` | String? | FK → Department |
| `dataClassification` | String? | Data classification |
| `containsPersonalData` | Boolean | Default: false |
| `containsSensitiveData` | Boolean | Default: false |
| `complianceRequirements` | Json? | Compliance requirements array |
| `inIsmsScope` | Boolean | Default: true |
| `scopeJustification` | String? | Scope justification |
| `isActive` | Boolean | Default: true |

**Indexes:**
- `productCode` (unique)
- `productType`
- `isActive`

### TechnologyPlatform

Technology platforms used by the organization.

**Table:** `TechnologyPlatform`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `platformCode` | String | Unique platform code |
| `name` | String | Platform name |
| `platformType` | String | Platform type |
| `description` | String? | Description |
| `vendor` | String? | Vendor name |
| `vendorWebsite` | String? | Vendor website |
| `supportContact` | String? | Support contact |
| `licenseType` | String? | License type |
| `hostingLocation` | String? | Hosting location |
| `cloudProvider` | String? | Cloud provider |
| `deploymentModel` | String? | Deployment model |
| `version` | String? | Version |
| `architecture` | String? | Architecture |
| `integrations` | Json? | Integrations array |
| `dataStorageLocation` | String? | Data storage location |
| `criticalityLevel` | String? | Criticality level |
| `businessImpact` | String? | Business impact |
| `riskRating` | String? | Risk rating |
| `implementationDate` | DateTime? | Implementation date |
| `endOfLifeDate` | DateTime? | End of life date |
| `lastUpgradeDate` | DateTime? | Last upgrade date |
| `nextUpgradeDate` | DateTime? | Next upgrade date |
| `technicalOwnerId` | String? | FK → User (technical owner) |
| `businessOwnerId` | String? | FK → User (business owner) |
| `departmentId` | String? | FK → Department |
| `complianceCertifications` | Json? | Compliance certifications array |
| `dataClassification` | String? | Data classification |
| `inIsmsScope` | Boolean | Default: true |
| `scopeJustification` | String? | Scope justification |
| `isActive` | Boolean | Default: true |
| `environments` | Json? | Environments array |

**Indexes:**
- `platformCode` (unique)
- `platformType`
- `criticalityLevel`
- `isActive`

### InterestedParty

Interested parties (ISO 27001 Clause 4.2).

**Table:** `InterestedParty`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `partyCode` | String | Unique party code |
| `name` | String | Party name |
| `partyType` | String | Party type |
| `description` | String? | Description |
| `expectations` | String? | Expectations |
| `requirements` | String? | Requirements |
| `informationNeeds` | Json? | Information needs array |
| `powerLevel` | String? | Power level |
| `interestLevel` | String? | Interest level |
| `influenceLevel` | String? | Influence level |
| `engagementStrategy` | String? | Engagement strategy |
| `communicationMethod` | String? | Communication method |
| `communicationFrequency` | String? | Communication frequency |
| `primaryContact` | String? | Primary contact name |
| `contactEmail` | String? | Contact email |
| `contactPhone` | String? | Contact phone |
| `ismsRelevance` | String? | ISMS relevance |
| `securityExpectations` | String? | Security expectations |
| `isActive` | Boolean | Default: true |

**Indexes:**
- `partyCode` (unique)
- `partyType`
- `isActive`

### ContextIssue

Context issues (ISO 27001 Clause 4.1).

**Table:** `ContextIssue`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `issueCode` | String | Unique issue code |
| `issueType` | String | Issue type |
| `category` | String | Category |
| `title` | String | Issue title |
| `description` | String? | Description |
| `impactType` | String? | Impact type |
| `impactLevel` | String? | Impact level |
| `likelihood` | String? | Likelihood |
| `ismsRelevance` | String? | ISMS relevance |
| `affectedAreas` | Json? | Affected areas array |
| `controlImplications` | String? | Control implications |
| `responseStrategy` | String? | Response strategy |
| `mitigationActions` | Json? | Mitigation actions array |
| `responsiblePartyId` | String? | FK → User (responsible) |
| `monitoringFrequency` | String? | Monitoring frequency |
| `lastReviewDate` | DateTime? | Last review date |
| `nextReviewDate` | DateTime? | Next review date |
| `trendDirection` | String? | Trend direction |
| `status` | String | Default: "active" |
| `isActive` | Boolean | Default: true |
| `escalatedToRisk` | Boolean | Default: false |
| `linkedRiskId` | String? | Linked risk ID |

**Indexes:**
- `issueCode` (unique)
- `issueType`
- `category`
- `status`

### KeyPersonnel

Key personnel with ISMS roles.

**Table:** `KeyPersonnel`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `personCode` | String | Unique person code |
| `userId` | String? | FK → User |
| `user` | User? | User account (if exists) |
| `name` | String | Person name |
| `jobTitle` | String | Job title |
| `email` | String? | Email |
| `phone` | String? | Phone |
| `departmentId` | String? | FK → Department |
| `ismsRole` | String | ISMS role |
| `securityResponsibilities` | String? | Security responsibilities |
| `authorityLevel` | String? | Authority level |
| `backupPersonId` | String? | FK → KeyPersonnel (backup) |
| `backupPerson` | KeyPersonnel? | Backup person |
| `backupFor` | KeyPersonnel[] | People this person backs up |
| `trainingCompleted` | Boolean | Default: false |
| `lastTrainingDate` | DateTime? | Last training date |
| `certifications` | Json? | Certifications array |
| `isActive` | Boolean | Default: true |
| `startDate` | DateTime? | Start date |
| `endDate` | DateTime? | End date |

**Relationships:**
- `user` → User? (many-to-one)
- `backupPerson` → KeyPersonnel? (many-to-one)
- `backupFor` → KeyPersonnel[] (one-to-many)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `personCode` (unique)
- `ismsRole`
- `userId`
- `isActive`

### ApplicableFramework

Applicable frameworks for regulatory compliance.

**Table:** `ApplicableFramework`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `frameworkCode` | String | Unique framework code |
| `name` | String | Framework name |
| `frameworkType` | String | Framework type |
| `description` | String? | Description |
| `version` | String? | Version |
| `isApplicable` | Boolean | Default: false |
| `applicabilityReason` | String? | Applicability reason |
| `applicabilityDate` | DateTime? | Applicability date |
| `assessedById` | String? | FK → User (assessor) |
| `complianceStatus` | String | Default: "not_assessed" |
| `compliancePercentage` | Int? | Compliance percentage |
| `lastAssessmentDate` | DateTime? | Last assessment date |
| `nextAssessmentDate` | DateTime? | Next assessment date |
| `supervisoryAuthority` | String? | Supervisory authority |
| `authorityContact` | String? | Authority contact |
| `registrationNumber` | String? | Registration number |
| `registrationDate` | DateTime? | Registration date |
| `isCertifiable` | Boolean | Default: false |
| `certificationStatus` | String? | Certification status |
| `certificationBody` | String? | Certification body |
| `certificateNumber` | String? | Certificate number |
| `certificationDate` | DateTime? | Certification date |
| `certificationExpiry` | DateTime? | Certification expiry |
| `keyRequirements` | Json? | Key requirements array |
| `applicableControls` | Json? | Applicable controls array |
| `notes` | String? | Notes |

**Relationships:**
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `frameworkCode` (unique)
- `frameworkType`
- `isApplicable`
- `complianceStatus`

### RegulatoryEligibilitySurvey

Regulatory eligibility survey (DORA/NIS2).

**Table:** `RegulatoryEligibilitySurvey`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `surveyType` | String | Survey type (DORA, NIS2) |
| `surveyVersion` | String | Default: "1.0" |
| `status` | String | Default: "in_progress" |
| `completedAt` | DateTime? | Completion timestamp |
| `isApplicable` | Boolean? | Whether framework applies |
| `applicabilityReason` | String? | Applicability reason |
| `entityClassification` | String? | Entity classification |
| `regulatoryRegime` | String? | Regulatory regime |
| `notes` | String? | Notes |

**Relationships:**
- `responses` → SurveyResponse[] (one-to-many)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `surveyType`
- `status`

### SurveyQuestion

Survey questions for regulatory eligibility.

**Table:** `SurveyQuestion`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `surveyType` | String | Survey type |
| `stepNumber` | String | Step number |
| `stepCategory` | String | Step category |
| `questionText` | String | Question text |
| `ifYes` | String? | Next step if yes |
| `ifNo` | String? | Next step if no |
| `legalReference` | String? | Legal reference |
| `notes` | String? | Notes |
| `sortOrder` | Int | Sort order |

**Relationships:**
- `responses` → SurveyResponse[] (one-to-many)

**Indexes:**
- `surveyType, stepNumber` (unique)
- `surveyType, sortOrder`

### SurveyResponse

Responses to survey questions.

**Table:** `SurveyResponse`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `surveyId` | String | FK → RegulatoryEligibilitySurvey |
| `survey` | RegulatoryEligibilitySurvey | Parent survey |
| `questionId` | String | FK → SurveyQuestion |
| `question` | SurveyQuestion | Question |
| `answer` | String? | Answer |
| `notes` | String? | Notes |

**Relationships:**
- `survey` → RegulatoryEligibilitySurvey (many-to-one)
- `question` → SurveyQuestion (many-to-one)

**Indexes:**
- `surveyId, questionId` (unique)
- `surveyId`

---

## Controls Module

### Control

ISO 27001:2022 control implementation.

**Table:** `Control`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `controlId` | String | Control identifier (e.g., "5.1", "8.12") |
| `theme` | ControlTheme | Control theme enum |
| `name` | String | Control name |
| `description` | String? | Control description |
| `framework` | ControlFramework | Default: ISO |
| `sourceStandard` | String? | Source standard reference |
| `soc2Criteria` | String? | SOC2 criteria mapping |
| `tscCategory` | String? | TSC category |
| `applicable` | Boolean | Default: true |
| `justificationIfNa` | String? | N/A justification |
| `implementationStatus` | ImplementationStatus | Default: NOT_STARTED |
| `implementationDesc` | String? | Implementation description |
| `organisationId` | String | FK → OrganisationProfile |
| `organisation` | OrganisationProfile | Parent organization |

**Relationships:**
- `capabilities` → Capability[]
- `soaEntries` → SOAEntry[]
- `risks` → Risk[]
- `nonconformities` → Nonconformity[]
- `documentMappings` → DocumentControlMapping[]
- `assetLinks` → AssetControl[]

**Indexes:**
- `controlId, organisationId` (unique)
- `theme`
- `framework`
- `implementationStatus`
- `organisationId`
- `applicable`

### Capability

Testable capability within a control.

**Table:** `Capability`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `capabilityId` | String | Capability identifier (e.g., "5.1-C01") |
| `name` | String | Capability name |
| `type` | CapabilityType | Capability type enum |
| `description` | String? | Description |
| `testCriteria` | String | Test criteria text |
| `evidenceRequired` | String | Evidence requirements |
| `maxMaturityLevel` | Int | Default: 5 |
| `dependsOn` | String? | Comma-separated dependency IDs |
| `l1Criteria` through `l5Criteria` | String? | Maturity level criteria |
| `l1Evidence` through `l5Evidence` | String? | Maturity level evidence |
| `designTestCriteria` | String? | Design effectiveness test criteria |
| `designEvidenceRequired` | String? | Design evidence required |
| `implementationTestCriteria` | String? | Implementation test criteria |
| `implementationEvidenceRequired` | String? | Implementation evidence |
| `operatingTestCriteria` | String? | Operating test criteria |
| `operatingEvidenceRequired` | String? | Operating evidence |
| `controlId` | String | FK → Control |
| `control` | Control | Parent control |

**Relationships:**
- `metrics` → CapabilityMetric[]
- `assessments` → CapabilityAssessment[]
- `effectivenessTests` → CapabilityEffectivenessTest[]
- `nonconformities` → Nonconformity[]

**Indexes:**
- `capabilityId, controlId` (unique)
- `type`
- `controlId`

### CapabilityEffectivenessTest

Three-layer effectiveness testing (Design, Implementation, Operating).

**Table:** `CapabilityEffectivenessTest`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `testType` | EffectivenessTestType | Test type enum |
| `testResult` | TestResult | Default: NOT_TESTED |
| `testDate` | DateTime? | Test execution date |
| `tester` | String? | Tester name |
| `objective` | String? | Test objective |
| `testSteps` | String? | Detailed test steps |
| `testCriteria` | String? | Legacy combined field |
| `evidenceRequired` | String? | Evidence requirements |
| `evidenceLocation` | String? | Evidence location |
| `evidenceNotes` | String? | Evidence notes |
| `soaCriteria` | String? | SOA criteria |
| `passCriteria` | String? | Pass criteria |
| `findings` | String? | Test findings |
| `recommendations` | String? | Recommendations |
| `capabilityId` | String | FK → Capability |
| `capability` | Capability | Parent capability |

**Relationships:**
- `nonconformities` → Nonconformity[]

**Indexes:**
- `testType`
- `testResult`
- `capabilityId`
- `testDate`

### StatementOfApplicability

Versioned SOA document for ISO 27001 compliance.

**Table:** `StatementOfApplicability`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `version` | String | Version string (e.g., "1.0", "2.0") |
| `status` | SOAStatus | Default: DRAFT |
| `name` | String? | SOA name/description |
| `notes` | String? | Notes |
| `approvedAt` | DateTime? | Approval timestamp |
| `approvedById` | String? | FK → User (approver) |
| `approvedBy` | User? | Approving user |
| `organisationId` | String | FK → OrganisationProfile |
| `organisation` | OrganisationProfile | Parent organization |

**Relationships:**
- `entries` → SOAEntry[]

**Indexes:**
- `version, organisationId` (unique)
- `status`
- `organisationId`

### SOAEntry

Individual control applicability decision in SOA.

**Table:** `SOAEntry`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `controlId` | String | Control ID (e.g., "A.5.1") |
| `controlName` | String | Control name |
| `theme` | ControlTheme | Control theme |
| `applicable` | Boolean | Default: true |
| `justificationIfNa` | String? | N/A justification |
| `implementationStatus` | ImplementationStatus | Default: NOT_STARTED |
| `implementationDesc` | String? | Implementation description |
| `parentRiskId` | String? | Related risk ID |
| `scenarioIds` | String? | Comma-separated scenario IDs |
| `soaId` | String | FK → StatementOfApplicability |
| `soa` | StatementOfApplicability | Parent SOA |
| `controlRecordId` | String? | FK → Control (optional) |
| `controlRecord` | Control? | Linked control record |

**Indexes:**
- `controlId, soaId` (unique)
- `soaId`
- `applicable`
- `implementationStatus`
- `controlRecordId`

---

## Risk Module

### Risk

Parent risk entity linked to controls.

**Table:** `Risk`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `riskId` | String | Risk identifier (e.g., "R-01") |
| `title` | String | Risk title |
| `description` | String? | Risk description |
| `tier` | RiskTier | Default: CORE |
| `orgSize` | String? | Applicable org sizes (e.g., "S,M,L") |
| `status` | RiskStatus | Default: IDENTIFIED |
| `framework` | ControlFramework | Default: ISO |
| `soc2Criteria` | String? | SOC2 criteria mapping |
| `tscCategory` | String? | TSC category |
| `likelihood` | LikelihoodLevel? | Current likelihood |
| `impact` | ImpactLevel? | Current impact |
| `inherentScore` | Int? | Likelihood × Impact (1-25) |
| `residualScore` | Int? | Residual risk score |
| `riskOwner` | String? | Risk owner name |
| `treatmentPlan` | String? | Treatment plan text |
| `acceptanceCriteria` | String? | Acceptance criteria |
| `organisationId` | String | FK → OrganisationProfile |
| `organisation` | OrganisationProfile | Parent organization |

**Relationships:**
- `controls` → Control[]
- `scenarios` → RiskScenario[]
- `kris` → KeyRiskIndicator[]
- `nonconformities` → Nonconformity[]
- `treatmentPlans` → TreatmentPlan[]
- `toleranceStatements` → RiskToleranceStatement[]
- `assetLinks` → AssetRisk[]
- `documentMappings` → DocumentRiskMapping[]

**Indexes:**
- `riskId, organisationId` (unique)
- `tier`
- `status`
- `framework`
- `organisationId`

### RiskScenario

Specific scenarios under a parent risk.

**Table:** `RiskScenario`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `scenarioId` | String | Scenario identifier (e.g., "R-01-S01") |
| `title` | String | Scenario title |
| `cause` | String? | Cause description |
| `event` | String? | Event description |
| `consequence` | String? | Consequence description |
| `sleLow` | Decimal? | Single Loss Expectancy low (15,2) |
| `sleLikely` | Decimal? | SLE likely estimate |
| `sleHigh` | Decimal? | SLE high estimate |
| `aro` | Decimal? | Annual Rate of Occurrence (5,2) |
| `ale` | Decimal? | Annual Loss Expectancy (15,2) |
| `likelihood` | LikelihoodLevel? | Inherent likelihood |
| `impact` | ImpactLevel? | Inherent impact |
| `inherentScore` | Int? | Inherent risk score |
| `residualLikelihood` | LikelihoodLevel? | Residual likelihood |
| `residualImpact` | ImpactLevel? | Residual impact |
| `residualScore` | Int? | Residual risk score |
| `weightedImpact` | Int? | BIRT weighted impact (1-5) |
| `residualWeightedImpact` | Int? | Residual weighted impact |
| `framework` | ControlFramework | Default: ISO |
| `controlIds` | String? | Comma-separated control IDs |
| `riskId` | String | FK → Risk |
| `risk` | Risk | Parent risk |

**Relationships:**
- `toleranceStatements` → RiskToleranceStatement[]
- `impactAssessments` → ScenarioImpactAssessment[]

**Indexes:**
- `scenarioId, riskId` (unique)
- `riskId`

### RiskToleranceStatement

Defines acceptable risk levels per domain.

**Table:** `RiskToleranceStatement`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `rtsId` | String | RTS identifier (e.g., "RTS-001") |
| `title` | String | RTS title |
| `objective` | String | RTS objective text |
| `domain` | String? | Risk domain |
| `proposedToleranceLevel` | ToleranceLevel | Default: MEDIUM |
| `proposedRTS` | String | Full RTS text |
| `conditions` | Json | Array of threshold conditions |
| `anticipatedOperationalImpact` | String? | Operational impact |
| `rationale` | String? | Rationale |
| `status` | RTSStatus | Default: DRAFT |
| `approvedDate` | DateTime? | Approval date |
| `approvedById` | String? | FK → User (approver) |
| `approvedBy` | User? | Approving user |
| `effectiveDate` | DateTime? | Effective date |
| `reviewDate` | DateTime? | Review date |
| `framework` | ControlFramework | Default: ISO |
| `controlIds` | String? | Comma-separated control IDs |
| `organisationId` | String | FK → OrganisationProfile |
| `organisation` | OrganisationProfile | Parent organization |

**Relationships:**
- `risks` → Risk[]
- `scenarios` → RiskScenario[]
- `kris` → KeyRiskIndicator[]
- `birtConfigs` → BirtOrgConfig[]

**Indexes:**
- `rtsId, organisationId` (unique)
- `status`
- `proposedToleranceLevel`
- `domain`
- `organisationId`

### TreatmentPlan

Risk treatment strategies and actions.

**Table:** `TreatmentPlan`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `treatmentId` | String | Treatment identifier (e.g., "TP-001") |
| `title` | String | Treatment title |
| `description` | String | Treatment description |
| `treatmentType` | TreatmentType | Default: MITIGATE |
| `priority` | TreatmentPriority | Default: MEDIUM |
| `status` | TreatmentStatus | Default: DRAFT |
| `targetResidualScore` | Int? | Target residual score |
| `currentResidualScore` | Int? | Current residual score |
| `expectedReduction` | Int? | Expected % reduction |
| `estimatedCost` | Decimal? | Estimated cost (15,2) |
| `actualCost` | Decimal? | Actual cost (15,2) |
| `costBenefit` | String? | Cost-benefit analysis |
| `roi` | Decimal? | Return on investment (10,2) |
| `proposedDate` | DateTime? | Proposed date |
| `approvedDate` | DateTime? | Approval date |
| `targetStartDate` | DateTime? | Target start date |
| `targetEndDate` | DateTime? | Target end date |
| `actualStartDate` | DateTime? | Actual start date |
| `actualEndDate` | DateTime? | Actual end date |
| `riskOwnerId` | String? | FK → User (risk owner) |
| `riskOwner` | User? | Risk owner |
| `implementerId` | String? | FK → User (implementer) |
| `implementer` | User? | Implementer |
| `approvedById` | String? | FK → User (approver) |
| `approvedBy` | User? | Approving user |
| `acceptanceRationale` | String? | Acceptance rationale (for ACCEPT type) |
| `acceptanceCriteria` | String? | Acceptance criteria |
| `acceptanceConditions` | Json? | Acceptance conditions array |
| `acceptanceExpiryDate` | DateTime? | Acceptance expiry |
| `progressPercentage` | Int | Default: 0 |
| `progressNotes` | String? | Progress notes |
| `riskId` | String | FK → Risk |
| `risk` | Risk | Parent risk |
| `organisationId` | String | FK → OrganisationProfile |
| `organisation` | OrganisationProfile | Parent organization |
| `controlIds` | String? | Comma-separated control IDs |

**Relationships:**
- `actions` → TreatmentAction[]

**Indexes:**
- `treatmentId, organisationId` (unique)
- `riskId`
- `status`
- `priority`
- `treatmentType`
- `organisationId`

### CapabilityMetric

Metrics for measuring capability maturity and effectiveness.

**Table:** `CapabilityMetric`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `metricId` | String | Unique metric ID |
| `name` | String | Metric name |
| `description` | String? | Description |
| `metricType` | String | Metric type |
| `unit` | String | Unit of measurement |
| `collectionFrequency` | CollectionFrequency | Default: MONTHLY |
| `dataSource` | String | Data source |
| `currentValue` | String? | Current value |
| `status` | RAGStatus? | Status (Red/Amber/Green) |
| `trend` | TrendDirection? | Trend direction |
| `lastCollection` | DateTime? | Last collection date |
| `owner` | String? | Metric owner |
| `notes` | String? | Notes |
| `capabilityId` | String | FK → Capability |
| `capability` | Capability | Parent capability |

**Relationships:**
- `capability` → Capability (many-to-one)
- `history` → MetricHistory[] (one-to-many)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `metricId, capabilityId` (unique)
- `status`
- `collectionFrequency`
- `capabilityId`

### CapabilityAssessment

Point-in-time maturity evaluation (L0-L5).

**Table:** `CapabilityAssessment`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `currentMaturity` | Int? | Current maturity (0-5) |
| `targetMaturity` | Int? | Target maturity (0-5) |
| `gap` | Int? | Calculated gap (target - current) |
| `l1Met` | Boolean? | Level 1 criteria met |
| `l2Met` | Boolean? | Level 2 criteria met |
| `l3Met` | Boolean? | Level 3 criteria met |
| `l4Met` | Boolean? | Level 4 criteria met |
| `l5Met` | Boolean? | Level 5 criteria met |
| `assessor` | String? | Assessor name |
| `assessmentDate` | DateTime? | Assessment date |
| `nextReview` | DateTime? | Next review date |
| `notes` | String? | Notes |
| `capabilityId` | String | FK → Capability |
| `capability` | Capability | Parent capability |

**Relationships:**
- `capability` → Capability (many-to-one)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `currentMaturity`
- `capabilityId`
- `assessmentDate`

### MetricHistory

Historical values for trend analysis.

**Table:** `MetricHistory`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `value` | String | Metric value |
| `status` | RAGStatus | Status |
| `collectedAt` | DateTime | Collection timestamp |
| `collectedBy` | String? | Collector |
| `notes` | String? | Notes |
| `metricId` | String | FK → CapabilityMetric |
| `metric` | CapabilityMetric | Parent metric |
| `createdAt` | DateTime | Default: now() |

**Relationships:**
- `metric` → CapabilityMetric (many-to-one)

**Indexes:**
- `metricId`
- `collectedAt`

### ExternalFactor

Regulatory requirements, industry standards, etc. for BIRT.

**Table:** `ExternalFactor`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `type` | ExternalFactorType | Type enum (REGULATORY, INDUSTRY, CONTRACTUAL, INSURANCE) |
| `name` | String | Factor name (e.g., "GDPR Maximum Fine") |
| `source` | String | Source (e.g., "EU GDPR Article 83") |
| `description` | String? | Description |
| `category` | ImpactCategory | Impact category (FINANCIAL, LEGAL_REGULATORY, REPUTATION, OPERATIONAL) |
| `minLevel` | ImpactLevel | Minimum impact level required |
| `amount` | Decimal? | Financial amount if applicable (15,2) |
| `frameworks` | String? | Applicable frameworks (comma-separated) |
| `sectors` | String? | Industry sectors (comma-separated) |
| `effectiveFrom` | DateTime? | Effective from date |
| `effectiveTo` | DateTime? | Effective to date |

**Indexes:**
- `type`
- `category`

### BirtSystemConfig

System-wide default thresholds for BIRT.

**Table:** `BirtSystemConfig`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `category` | ImpactCategory | Impact category (unique) |
| `weight` | Int | Default: 25 (percentage weight, sum = 100) |
| `description` | String? | Description |

**Relationships:**
- `thresholds` → BirtSystemThreshold[] (one-to-many)

**Indexes:**
- `category` (unique)

### BirtSystemThreshold

Default threshold definitions per category/level.

**Table:** `BirtSystemThreshold`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `category` | ImpactCategory | Impact category |
| `level` | ImpactLevel | Impact level (NEGLIGIBLE, MINOR, MODERATE, MAJOR, SEVERE) |
| `value` | Int | Numeric value (1-5) |
| `description` | String | Human-readable threshold description |
| `minAmount` | Decimal? | Lower bound (15,2) |
| `maxAmount` | Decimal? | Upper bound (15,2) |
| `duration` | String? | Duration (for operational: "< 1 hour", "1-8 hours") |
| `isRegulatoryMinimum` | Boolean | Default: false |
| `regulatorySource` | String? | Regulatory source reference |
| `configId` | String | FK → BirtSystemConfig |
| `config` | BirtSystemConfig | Parent config |

**Relationships:**
- `config` → BirtSystemConfig (many-to-one)

**Indexes:**
- `category, level` (unique)
- `category`

### BirtOrgConfig

Per-organization customization of BIRT.

**Table:** `BirtOrgConfig`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `organisationId` | String | FK → OrganisationProfile |
| `organisation` | OrganisationProfile | Parent organization |
| `category` | ImpactCategory | Impact category |
| `weight` | Int? | Override weight (null = use system default) |
| `rtsId` | String? | FK → RiskToleranceStatement |
| `rts` | RiskToleranceStatement? | Linked RTS for risk appetite context |

**Relationships:**
- `organisation` → OrganisationProfile (many-to-one)
- `rts` → RiskToleranceStatement? (many-to-one)
- `thresholds` → BirtOrgThreshold[] (one-to-many)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `organisationId, category` (unique)
- `organisationId`

### BirtOrgThreshold

Per-organization threshold overrides.

**Table:** `BirtOrgThreshold`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `level` | ImpactLevel | Impact level |
| `description` | String? | Override description |
| `minAmount` | Decimal? | Override min amount (must be >= regulatory minimum) |
| `maxAmount` | Decimal? | Override max amount |
| `duration` | String? | Override duration |
| `rationale` | String? | Justification for override |
| `configId` | String | FK → BirtOrgConfig |
| `config` | BirtOrgConfig | Parent config |

**Relationships:**
- `config` → BirtOrgConfig (many-to-one)

**Indexes:**
- `configId, level` (unique)

### ScenarioImpactAssessment

Per-category impact assessment for scenarios.

**Table:** `ScenarioImpactAssessment`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `scenarioId` | String | FK → RiskScenario |
| `scenario` | RiskScenario | Parent scenario |
| `category` | ImpactCategory | Impact category |
| `level` | ImpactLevel | Selected level for this category |
| `value` | Int | Numeric value (1-5) |
| `rationale` | String? | Rationale |
| `isResidual` | Boolean | Default: false (for residual assessment after controls) |

**Relationships:**
- `scenario` → RiskScenario (many-to-one)

**Indexes:**
- `scenarioId, category, isResidual` (unique)
- `scenarioId`

### KeyRiskIndicator

Metrics that indicate risk levels.

**Table:** `KeyRiskIndicator`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `kriId` | String | Unique KRI ID (e.g., "KRI-001") |
| `name` | String | KRI name |
| `description` | String? | Description |
| `formula` | String? | Calculation formula |
| `unit` | String | Unit of measurement ("%", "Count", "Days", etc.) |
| `thresholdGreen` | String? | Green threshold (e.g., "≥95%") |
| `thresholdAmber` | String? | Amber threshold (e.g., "80-94%") |
| `thresholdRed` | String? | Red threshold (e.g., "<80%") |
| `frequency` | CollectionFrequency | Default: MONTHLY |
| `dataSource` | String? | Data source |
| `automated` | Boolean | Default: false |
| `tier` | RiskTier | Default: CORE |
| `currentValue` | String? | Current value |
| `status` | RAGStatus? | Current status |
| `trend` | TrendDirection? | Trend direction |
| `lastMeasured` | DateTime? | Last measurement date |
| `framework` | ControlFramework | Default: ISO |
| `soc2Criteria` | String? | SOC2 criteria mapping |
| `riskId` | String | FK → Risk |
| `risk` | Risk | Parent risk |

**Relationships:**
- `risk` → Risk (many-to-one)
- `history` → KRIHistory[] (one-to-many)
- `toleranceStatements` → RiskToleranceStatement[] (many-to-many)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `kriId, riskId` (unique)
- `riskId`
- `status`
- `tier`

### KRIHistory

Historical KRI values for trend analysis.

**Table:** `KRIHistory`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `value` | String | KRI value |
| `status` | RAGStatus | Status |
| `measuredAt` | DateTime | Measurement timestamp |
| `measuredBy` | String? | Measured by |
| `notes` | String? | Notes |
| `kriId` | String | FK → KeyRiskIndicator |
| `kri` | KeyRiskIndicator | Parent KRI |
| `createdAt` | DateTime | Default: now() |

**Relationships:**
- `kri` → KeyRiskIndicator (many-to-one)

**Indexes:**
- `kriId`
- `measuredAt`

### TreatmentAction

Individual actions within a treatment plan.

**Table:** `TreatmentAction`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `actionId` | String | Unique action ID (e.g., "TP-001-A01") |
| `title` | String | Action title |
| `description` | String? | Description |
| `status` | ActionStatus | Default: NOT_STARTED |
| `priority` | TreatmentPriority | Default: MEDIUM |
| `dueDate` | DateTime? | Due date |
| `completedDate` | DateTime? | Completion date |
| `assignedToId` | String? | FK → User (assignee) |
| `assignedTo` | User? | Assigned user |
| `estimatedHours` | Int? | Estimated hours |
| `actualHours` | Int? | Actual hours |
| `completionNotes` | String? | Completion notes |
| `blockerNotes` | String? | Blocker notes |
| `treatmentPlanId` | String | FK → TreatmentPlan |
| `treatmentPlan` | TreatmentPlan | Parent treatment plan |

**Relationships:**
- `treatmentPlan` → TreatmentPlan (many-to-one)
- `assignedTo` → User? (many-to-one)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `treatmentPlanId`
- `status`
- `assignedToId`

### FrameworkCrossReference

Cross-reference between frameworks (ISO, SOC2, NIS2, DORA).

**Table:** `FrameworkCrossReference`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `sourceFramework` | ControlFramework | Source framework |
| `sourceControlId` | String | Source control ID |
| `targetFramework` | ControlFramework | Target framework |
| `targetControlId` | String | Target control ID |
| `mappingType` | String? | Mapping type |
| `confidence` | String? | Confidence level |
| `notes` | String? | Notes |

**Indexes:**
- `sourceFramework, sourceControlId`
- `targetFramework, targetControlId`

### ControlDomain

Control domain classification.

**Table:** `ControlDomain`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `domainCode` | String | Unique domain code |
| `name` | String | Domain name |
| `description` | String? | Description |
| `parentDomainId` | String? | FK → ControlDomain (parent) |
| `parentDomain` | ControlDomain? | Parent domain |
| `childDomains` | ControlDomain[] | Child domains |
| `sortOrder` | Int? | Sort order |

**Relationships:**
- `parentDomain` → ControlDomain? (many-to-one)
- `childDomains` → ControlDomain[] (one-to-many)

**Indexes:**
- `domainCode` (unique)
- `parentDomainId`

---

## Policy Module

### PolicyDocument

Policy, standard, procedure, or other document entity.

**Table:** `PolicyDocument`

**Identification:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | Document identifier (e.g., "POL-001") |
| `title` | String | Document title |
| `shortTitle` | String? | Short title |
| `documentType` | DocumentType | Document type enum |

**Classification & Access:**
| Field | Type | Description |
|-------|------|-------------|
| `classification` | ClassificationLevel | Default: INTERNAL |
| `distribution` | String[] | Distribution list |
| `restrictedTo` | String[] | Restricted access list |

**Content:**
| Field | Type | Description |
|-------|------|-------------|
| `purpose` | String | Purpose text |
| `scope` | String | Scope text |
| `content` | String | Full content text |
| `summary` | String? | Summary |
| `definitions` | Json? | Definitions object |

**Hierarchy:**
| Field | Type | Description |
|-------|------|-------------|
| `parentDocumentId` | String? | FK → PolicyDocument (parent) |
| `parentDocument` | PolicyDocument? | Parent document |
| `childDocuments` | PolicyDocument[] | Child documents |

**Version Control:**
| Field | Type | Description |
|-------|------|-------------|
| `version` | String | Default: "1.0" |
| `majorVersion` | Int | Default: 1 |
| `minorVersion` | Int | Default: 0 |
| `versionHistory` | DocumentVersion[] | Version history |

**Status & Lifecycle:**
| Field | Type | Description |
|-------|------|-------------|
| `status` | DocumentStatus | Default: DRAFT |
| `effectiveDate` | DateTime? | Effective date |
| `expiryDate` | DateTime? | Expiry date |
| `retirementDate` | DateTime? | Retirement date |
| `supersededById` | String? | FK → PolicyDocument (superseder) |
| `supersededBy` | PolicyDocument? | Superseding document |
| `supersedes` | PolicyDocument[] | Superseded documents |

**Ownership:**
| Field | Type | Description |
|-------|------|-------------|
| `documentOwner` | String | Owner name |
| `documentOwnerId` | String? | FK → User (owner) |
| `owner` | User? | Owner user |
| `author` | String | Author name |
| `authorId` | String? | FK → User (author) |
| `authorUser` | User? | Author user |

**Approval:**
| Field | Type | Description |
|-------|------|-------------|
| `approvalLevel` | ApprovalLevel | Approval level enum |
| `approvedBy` | String? | Approver name |
| `approverId` | String? | FK → User (approver) |
| `approver` | User? | Approving user |
| `approvalDate` | DateTime? | Approval date |
| `digitalSignature` | String? | Digital signature |
| `approvalComments` | String? | Approval comments |

**Review Schedule:**
| Field | Type | Description |
|-------|------|-------------|
| `reviewFrequency` | ReviewFrequency | Default: ANNUAL |
| `lastReviewDate` | DateTime? | Last review date |
| `nextReviewDate` | DateTime? | Next review date |
| `reviewReminder` | Int? | Reminder days (default: 30) |
| `reviewHistory` | DocumentReview[] | Review history |

**Relationships:**
- `approvalWorkflows` → DocumentApprovalWorkflow[]
- `controlMappings` → DocumentControlMapping[]
- `riskMappings` → DocumentRiskMapping[]
- `relatedDocuments` → DocumentRelation[] (as source)
- `referencedBy` → DocumentRelation[] (as target)
- `attachments` → DocumentAttachment[]
- `changeRequests` → DocumentChangeRequest[]
- `exceptions` → DocumentException[]
- `acknowledgments` → DocumentAcknowledgment[]
- `auditLog` → PolicyDocumentAuditLog[]
- `sections` → DocumentSection[]
- `documentDefinitions` → DocumentDefinition[]
- `processSteps` → DocumentProcessStep[]
- `prerequisites` → DocumentPrerequisite[]
| `roles` → DocumentRole[]
- `revisions` → DocumentRevision[]
- `organisation` → OrganisationProfile

**Indexes:**
- `documentId, organisationId` (unique)
- `documentType`
- `status`
- `classification`
- `nextReviewDate`
- `organisationId`
- `parentDocumentId`

### DocumentVersion

Version history for policy documents.

**Table:** `DocumentVersion`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Parent document |
| `version` | String | Version string |
| `majorVersion` | Int | Major version number |
| `minorVersion` | Int | Minor version number |
| `content` | String | Version content |
| `changeDescription` | String | Change description |
| `changeSummary` | String? | Change summary |
| `changeType` | ChangeType | Change type enum |
| `approvedBy` | String? | Approver name |
| `approvalDate` | DateTime? | Approval date |
| `diffFromPrevious` | String? | Diff text |
| `createdById` | String? | FK → User (creator) |
| `createdBy` | User? | Creating user |

**Indexes:**
- `documentId`
- `version`

### DocumentReview

Review history for policy documents.

**Table:** `DocumentReview`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Parent document |
| `reviewType` | ReviewType | Review type enum |
| `reviewDate` | DateTime | Review date |
| `reviewedById` | String? | FK → User (reviewer) |
| `reviewedBy` | User? | Reviewer |
| `outcome` | ReviewOutcome | Review outcome enum |
| `findings` | String? | Findings |
| `recommendations` | String? | Recommendations |
| `actionItems` | String? | Action items |
| `changesRequired` | Boolean | Default: false |
| `changeDescription` | String? | Change description |
| `nextReviewDate` | DateTime? | Next review date |

**Relationships:**
- `document` → PolicyDocument (many-to-one)
- `reviewedBy` → User? (many-to-one)

**Indexes:**
- `documentId`
- `reviewDate`

### DocumentApprovalWorkflow

Approval workflow for policy documents.

**Table:** `DocumentApprovalWorkflow`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Parent document |
| `workflowType` | ApprovalWorkflowType | Workflow type enum |
| `status` | WorkflowStatus | Default: PENDING |
| `steps` | ApprovalStep[] | Approval steps |
| `currentStepOrder` | Int | Default: 1 |
| `initiatedById` | String? | FK → User (initiator) |
| `initiatedBy` | User? | Initiator |
| `initiatedAt` | DateTime | Default: now() |
| `completedAt` | DateTime? | Completion timestamp |
| `finalOutcome` | ApprovalOutcome? | Final outcome |
| `comments` | String? | Comments |

**Relationships:**
- `document` → PolicyDocument (many-to-one)
- `steps` → ApprovalStep[] (one-to-many)
- `initiatedBy` → User? (many-to-one)

**Indexes:**
- `documentId`
- `status`

### ApprovalStep

Individual step in approval workflow.

**Table:** `ApprovalStep`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `workflowId` | String | FK → DocumentApprovalWorkflow |
| `workflow` | DocumentApprovalWorkflow | Parent workflow |
| `stepOrder` | Int | Step order |
| `stepName` | String | Step name |
| `approverId` | String? | FK → User (approver) |
| `approver` | User? | Approver |
| `approverRole` | String? | Approver role |
| `status` | ApprovalStepStatus | Default: PENDING |
| `decision` | ApprovalDecision? | Decision |
| `comments` | String? | Comments |
| `signature` | String? | Digital signature |
| `signedAt` | DateTime? | Signature timestamp |
| `dueDate` | DateTime? | Due date |
| `reminderSent` | Boolean | Default: false |
| `escalated` | Boolean | Default: false |
| `delegatedToId` | String? | FK → User (delegate) |
| `delegatedTo` | User? | Delegate |

**Relationships:**
- `workflow` → DocumentApprovalWorkflow (many-to-one)
- `approver` → User? (many-to-one)
- `delegatedTo` → User? (many-to-one)

**Indexes:**
- `workflowId`
- `status`

### DocumentChangeRequest

Change requests for policy documents.

**Table:** `DocumentChangeRequest`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `changeRequestId` | String | Unique change request ID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Target document |
| `title` | String | Change request title |
| `description` | String | Description |
| `justification` | String | Justification |
| `changeType` | ChangeType | Change type enum |
| `priority` | ChangePriority | Priority enum |
| `impactAssessment` | String? | Impact assessment |
| `affectedDocuments` | String[] | Affected document IDs array |
| `affectedProcesses` | String[] | Affected process IDs array |
| `affectedSystems` | String[] | Affected system IDs array |
| `status` | ChangeRequestStatus | Default: SUBMITTED |
| `requestedById` | String? | FK → User (requester) |
| `requestedBy` | User? | Requester |
| `requestedAt` | DateTime | Default: now() |
| `approvedById` | String? | FK → User (approver) |
| `approvedBy` | User? | Approver |
| `approvalDate` | DateTime? | Approval date |
| `approvalComments` | String? | Approval comments |
| `implementedById` | String? | FK → User (implementer) |
| `implementedBy` | User? | Implementer |
| `implementedAt` | DateTime? | Implementation timestamp |
| `newVersionId` | String? | New version ID |
| `targetDate` | DateTime? | Target date |
| `actualCompletionDate` | DateTime? | Actual completion date |
| `organisationId` | String | FK → OrganisationProfile |
| `organisation` | OrganisationProfile | Parent organization |

**Relationships:**
- `document` → PolicyDocument (many-to-one)
- `requestedBy` → User? (many-to-one)
- `approvedBy` → User? (many-to-one)
- `implementedBy` → User? (many-to-one)
- `organisation` → OrganisationProfile (many-to-one)

**Indexes:**
- `changeRequestId, organisationId` (unique)
- `documentId`
- `status`
- `organisationId`

### DocumentException

Exceptions to policy documents.

**Table:** `DocumentException`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `exceptionId` | String | Unique exception ID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Target document |
| `title` | String | Exception title |
| `description` | String | Description |
| `justification` | String | Justification |
| `scope` | String | Scope |
| `affectedEntities` | String[] | Affected entity IDs array |
| `riskAssessment` | String | Risk assessment |
| `residualRisk` | String | Residual risk |
| `compensatingControls` | String? | Compensating controls |
| `status` | ExceptionStatus | Default: REQUESTED |
| `requestedById` | String? | FK → User (requester) |
| `requestedBy` | User? | Requester |
| `requestedAt` | DateTime | Default: now() |
| `startDate` | DateTime? | Start date |
| `expiryDate` | DateTime? | Expiry date |
| `approvalLevel` | ApprovalLevel | Approval level enum |
| `approvedById` | String? | FK → User (approver) |
| `approvedBy` | User? | Approver |
| `approvalDate` | DateTime? | Approval date |
| `approvalComments` | String? | Approval comments |
| `reviewFrequency` | ReviewFrequency | Default: QUARTERLY |
| `lastReviewDate` | DateTime? | Last review date |
| `nextReviewDate` | DateTime? | Next review date |
| `closedAt` | DateTime? | Closure timestamp |
| `closureReason` | String? | Closure reason |
| `organisationId` | String | FK → OrganisationProfile |
| `organisation` | OrganisationProfile | Parent organization |

**Relationships:**
- `document` → PolicyDocument (many-to-one)
- `requestedBy` → User? (many-to-one)
- `approvedBy` → User? (many-to-one)
- `organisation` → OrganisationProfile (many-to-one)

**Indexes:**
- `exceptionId, organisationId` (unique)
- `documentId`
- `status`
- `expiryDate`
- `organisationId`

### DocumentAcknowledgment

Acknowledgment tracking for policy documents.

**Table:** `DocumentAcknowledgment`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Document |
| `documentVersion` | String | Document version |
| `userId` | String | FK → User |
| `user` | User | User |
| `acknowledgedAt` | DateTime? | Acknowledgment timestamp |
| `isAcknowledged` | Boolean | Default: false |
| `method` | AcknowledgmentMethod? | Acknowledgment method enum |
| `ipAddress` | String? | IP address |
| `userAgent` | String? | User agent |
| `dueDate` | DateTime? | Due date |
| `remindersSent` | Int | Default: 0 |
| `lastReminderAt` | DateTime? | Last reminder timestamp |
| `isOverdue` | Boolean | Default: false |

**Relationships:**
- `document` → PolicyDocument (many-to-one)
- `user` → User (many-to-one)

**Indexes:**
- `documentId, userId, documentVersion` (unique)
- `documentId`
- `userId`
- `isAcknowledged`

### DocumentControlMapping

Mapping between policy documents and controls.

**Table:** `DocumentControlMapping`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Document |
| `controlId` | String | FK → Control |
| `control` | Control | Control |
| `mappingType` | ControlMappingType | Default: IMPLEMENTS |
| `coverage` | CoverageLevel | Default: FULL |
| `notes` | String? | Notes |
| `evidenceRequired` | Boolean | Default: false |
| `evidenceDescription` | String? | Evidence description |

**Relationships:**
- `document` → PolicyDocument (many-to-one)
- `control` → Control (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `documentId, controlId` (unique)
- `documentId`
- `controlId`

### DocumentRiskMapping

Mapping between policy documents and risks.

**Table:** `DocumentRiskMapping`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Document |
| `riskId` | String | FK → Risk |
| `risk` | Risk | Risk |
| `relationshipType` | RiskRelationshipType | Default: MITIGATES |
| `notes` | String? | Notes |

**Relationships:**
- `document` → PolicyDocument (many-to-one)
- `risk` → Risk (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `documentId, riskId` (unique)
- `documentId`
- `riskId`

### DocumentRelation

Relations between policy documents.

**Table:** `DocumentRelation`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `sourceDocumentId` | String | FK → PolicyDocument (source) |
| `sourceDocument` | PolicyDocument | Source document |
| `targetDocumentId` | String | FK → PolicyDocument (target) |
| `targetDocument` | PolicyDocument | Target document |
| `relationType` | DocumentRelationType | Relation type enum |
| `description` | String? | Description |

**Relationships:**
- `sourceDocument` → PolicyDocument (many-to-one)
- `targetDocument` → PolicyDocument (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `sourceDocumentId, targetDocumentId, relationType` (unique)
- `sourceDocumentId`
- `targetDocumentId`

### DocumentAttachment

Attachments to policy documents.

**Table:** `DocumentAttachment`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Parent document |
| `filename` | String | Stored filename |
| `originalFilename` | String | Original filename |
| `mimeType` | String | MIME type |
| `size` | Int | File size in bytes |
| `attachmentType` | AttachmentType | Attachment type enum |
| `description` | String? | Description |
| `storagePath` | String | Storage path |
| `uploadedById` | String? | FK → User (uploader) |
| `uploadedAt` | DateTime | Default: now() |

**Relationships:**
- `document` → PolicyDocument (many-to-one)
- `uploadedBy` → User? (many-to-one)

**Indexes:**
- `documentId`
- `attachmentType`

### PolicyDocumentAuditLog

Audit trail for policy document actions.

**Table:** `PolicyDocumentAuditLog`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Document |
| `action` | PolicyAuditAction | Action enum |
| `userId` | String? | FK → User (actor) |
| `user` | User? | Actor |
| `timestamp` | DateTime | Default: now() |
| `details` | Json? | Action details |
| `ipAddress` | String? | IP address |
| `userAgent` | String? | User agent |

**Relationships:**
- `document` → PolicyDocument (many-to-one)
- `user` → User? (many-to-one)

**Indexes:**
- `documentId`
- `action`
- `timestamp`

### DocumentSectionTemplate

Templates for document sections.

**Table:** `DocumentSectionTemplate`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `templateCode` | String | Unique template code |
| `name` | String | Template name |
| `sectionType` | String | Section type |
| `content` | String | Template content |
| `organisationId` | String? | FK → OrganisationProfile (null = system default) |
| `organisation` | OrganisationProfile? | Organization |

**Relationships:**
- `organisation` → OrganisationProfile? (many-to-one)

**Indexes:**
- `templateCode` (unique)
- `organisationId`

### DocumentSection

Structured sections within policy documents.

**Table:** `DocumentSection`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Parent document |
| `sectionNumber` | String | Section number |
| `title` | String | Section title |
| `content` | String | Section content |
| `order` | Int | Display order |

**Relationships:**
- `document` → PolicyDocument (many-to-one)

**Indexes:**
- `documentId`
- `order`

### DocumentDefinition

Definitions within policy documents.

**Table:** `DocumentDefinition`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Parent document |
| `term` | String | Term |
| `definition` | String | Definition text |
| `order` | Int? | Display order |

**Relationships:**
- `document` → PolicyDocument (many-to-one)

**Indexes:**
- `documentId`
- `term`

### DocumentProcessStep

Process steps within policy documents.

**Table:** `DocumentProcessStep`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Parent document |
| `stepNumber` | String | Step number |
| `title` | String | Step title |
| `description` | String | Step description |
| `responsibleRole` | String? | Responsible role |
| `order` | Int | Display order |

**Relationships:**
- `document` → PolicyDocument (many-to-one)

**Indexes:**
- `documentId`
- `order`

### DocumentPrerequisite

Prerequisites for policy documents.

**Table:** `DocumentPrerequisite`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Parent document |
| `prerequisiteType` | String | Prerequisite type |
| `description` | String | Description |
| `isRequired` | Boolean | Default: true |

**Relationships:**
- `document` → PolicyDocument (many-to-one)

**Indexes:**
- `documentId`

### DocumentRole

Roles defined in policy documents.

**Table:** `DocumentRole`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Parent document |
| `roleName` | String | Role name |
| `responsibilities` | String | Responsibilities |
| `authorities` | String? | Authorities |

**Relationships:**
- `document` → PolicyDocument (many-to-one)

**Indexes:**
- `documentId`

### DocumentRevision

Revision tracking for policy documents.

**Table:** `DocumentRevision`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `documentId` | String | FK → PolicyDocument |
| `document` | PolicyDocument | Parent document |
| `revisionNumber` | String | Revision number |
| `revisionDate` | DateTime | Revision date |
| `changes` | String | Changes description |
| `approvedById` | String? | FK → User (approver) |
| `approvedBy` | User? | Approver |

**Relationships:**
- `document` → PolicyDocument (many-to-one)
- `approvedBy` → User? (many-to-one)

**Indexes:**
- `documentId`
- `revisionNumber`

---

## ITSM Module

### Asset

Core CMDB asset entity.

**Table:** `Asset`

**Identification:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `assetTag` | String | Unique asset tag (e.g., "AST-SRV-001") |
| `name` | String | Asset name |
| `displayName` | String? | Display name |
| `description` | String? | Description |
| `assetType` | AssetType | Asset type enum |
| `assetSubtype` | String? | Asset subtype |

**Classification:**
| Field | Type | Description |
|-------|------|-------------|
| `businessCriticality` | BusinessCriticality | Default: MEDIUM |
| `dataClassification` | DataClassification | Default: INTERNAL |
| `handlesPersonalData` | Boolean | Default: false |
| `handlesFinancialData` | Boolean | Default: false |
| `handlesHealthData` | Boolean | Default: false |
| `handlesConfidentialData` | Boolean | Default: false |

**Compliance Scope:**
| Field | Type | Description |
|-------|------|-------------|
| `inIsmsScope` | Boolean | Default: true |
| `inPciScope` | Boolean | Default: false |
| `inDoraScope` | Boolean | Default: false |
| `inGdprScope` | Boolean | Default: false |
| `inNis2Scope` | Boolean | Default: false |
| `inSoc2Scope` | Boolean | Default: false |
| `scopeNotes` | String? | Scope notes |

**Ownership:**
| Field | Type | Description |
|-------|------|-------------|
| `ownerId` | String? | FK → User (owner) |
| `owner` | User? | Asset owner |
| `custodianId` | String? | FK → User (custodian) |
| `custodian` | User? | Asset custodian |
| `departmentId` | String? | FK → Department |
| `department` | Department? | Owning department |

**Location:**
| Field | Type | Description |
|-------|------|-------------|
| `locationId` | String? | FK → Location |
| `location` | Location? | Physical location |
| `cloudProvider` | CloudProvider? | Cloud provider enum |
| `cloudRegion` | String? | Cloud region |
| `cloudAccountId` | String? | Cloud account ID |
| `cloudResourceId` | String? | Cloud resource ID |
| `datacenter` | String? | Datacenter name |
| `rack` | String? | Rack identifier |
| `rackPosition` | Int? | Rack position |

**Lifecycle:**
| Field | Type | Description |
|-------|------|-------------|
| `status` | AssetStatus | Default: ACTIVE |
| `purchaseDate` | DateTime? | Purchase date |
| `deploymentDate` | DateTime? | Deployment date |
| `warrantyExpiry` | DateTime? | Warranty expiry |
| `endOfLife` | DateTime? | End of life date |
| `endOfSupport` | DateTime? | End of support date |
| `disposalDate` | DateTime? | Disposal date |
| `lifecycleNotes` | String? | Lifecycle notes |

**Technical Details:**
| Field | Type | Description |
|-------|------|-------------|
| `ipAddresses` | Json? | Array of IP addresses |
| `fqdn` | String? | Fully qualified domain name |
| `macAddresses` | Json? | Array of MAC addresses |
| `operatingSystem` | String? | OS name |
| `osVersion` | String? | OS version |
| `version` | String? | Software version |
| `patchLevel` | String? | Patch level |

**Vendor & Support:**
| Field | Type | Description |
|-------|------|-------------|
| `manufacturer` | String? | Manufacturer name |
| `model` | String? | Model number |
| `serialNumber` | String? | Serial number |
| `supportContract` | String? | Support contract reference |
| `supportExpiry` | DateTime? | Support expiry |
| `supportTier` | String? | Support tier |
| `vendorId` | String? | FK → ExternalDependency |
| `vendor` | ExternalDependency? | Vendor |

**Financial:**
| Field | Type | Description |
|-------|------|-------------|
| `purchaseCost` | Decimal? | Purchase cost (15,2) |
| `costCurrency` | String | Default: "USD" |
| `annualCost` | Decimal? | Annual cost (15,2) |
| `costCenter` | String? | Cost center |

**Security Posture:**
| Field | Type | Description |
|-------|------|-------------|
| `encryptionAtRest` | Boolean | Default: false |
| `encryptionInTransit` | Boolean | Default: false |
| `encryptionMethod` | String? | Encryption method |
| `backupEnabled` | Boolean | Default: false |
| `backupFrequency` | String? | Backup frequency |
| `backupRetention` | String? | Backup retention |
| `lastBackupDate` | DateTime? | Last backup date |
| `monitoringEnabled` | Boolean | Default: false |
| `loggingEnabled` | Boolean | Default: false |
| `lastVulnScan` | DateTime? | Last vulnerability scan |
| `vulnerabilityCount` | Int? | Vulnerability count |
| `criticalVulnCount` | Int? | Critical vulnerability count |

**Capacity Management (NIS2):**
| Field | Type | Description |
|-------|------|-------------|
| `cpuCapacity` | Int? | CPU capacity |
| `cpuUsagePercent` | Int? | CPU usage percentage |
| `memoryCapacityGB` | Decimal? | Memory capacity GB (10,2) |
| `memoryUsagePercent` | Int? | Memory usage percentage |
| `storageCapacityGB` | Decimal? | Storage capacity GB (15,2) |
| `storageUsagePercent` | Int? | Storage usage percentage |
| `networkBandwidthMbps` | Int? | Network bandwidth Mbps |
| `cpuThresholdPercent` | Int? | CPU threshold (default: 80) |
| `memoryThresholdPercent` | Int? | Memory threshold (default: 80) |
| `storageThresholdPercent` | Int? | Storage threshold (default: 80) |
| `capacityStatus` | CapacityStatus | Default: UNKNOWN |
| `capacityNotes` | String? | Capacity notes |
| `lastCapacityReview` | DateTime? | Last capacity review |
| `nextCapacityReview` | DateTime? | Next capacity review |
| `capacityTrend` | String? | Capacity trend |
| `growthRatePercent` | Decimal? | Growth rate (5,2) |
| `projectedExhaustionDate` | DateTime? | Projected exhaustion date |

**Resilience & Availability (NIS2):**
| Field | Type | Description |
|-------|------|-------------|
| `rtoMinutes` | Int? | Recovery Time Objective minutes |
| `rpoMinutes` | Int? | Recovery Point Objective minutes |
| `mtpdMinutes` | Int? | Maximum Tolerable Period of Disruption |
| `targetAvailability` | Decimal? | Target availability % (5,2) |
| `actualAvailability` | Decimal? | Actual availability % (5,2) |
| `hasRedundancy` | Boolean | Default: false |
| `redundancyType` | String? | Redundancy type |
| `failoverAssetId` | String? | Failover asset ID |
| `lastOutageDate` | DateTime? | Last outage date |
| `lastOutageDurationMin` | Int? | Last outage duration minutes |
| `outageCount12Months` | Int? | Outage count (default: 0) |

**Relationships:**
- `outgoingRelationships` → AssetRelationship[] (as source)
- `incomingRelationships` → AssetRelationship[] (as target)
- `businessProcessLinks` → AssetBusinessProcess[]
- `controlLinks` → AssetControl[]
- `riskLinks` → AssetRisk[]
- `changeLinks` → ChangeAsset[]
- `installedSoftware` → AssetSoftware[]
- `capacityRecords` → CapacityRecord[]
- `capacityPlans` → CapacityPlan[]

**Indexes:**
- `assetTag` (unique)
- `assetType`
- `status`
- `businessCriticality`
- `dataClassification`
- `departmentId`
- `ownerId`
- `locationId`
- `cloudProvider`
- `inIsmsScope`
- `capacityStatus`

### Change

IT change management entity.

**Table:** `Change`

**Identification:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `changeRef` | String | Unique change reference |
| `title` | String | Change title |
| `description` | String | Change description |

**Classification:**
| Field | Type | Description |
|-------|------|-------------|
| `changeType` | ITSMChangeType | Change type enum |
| `category` | ChangeCategory | Change category enum |
| `priority` | ChangePriority | Default: MEDIUM |
| `securityImpact` | SecurityImpact | Default: LOW |

**Lifecycle:**
| Field | Type | Description |
|-------|------|-------------|
| `status` | ChangeStatus | Default: DRAFTED |

**Ownership:**
| Field | Type | Description |
|-------|------|-------------|
| `requesterId` | String | FK → User (requester) |
| `requester` | User | Change requester |
| `implementerId` | String? | FK → User (implementer) |
| `implementer` | User? | Implementer |
| `departmentId` | String? | FK → Department |
| `department` | Department? | Department |

**Planning:**
| Field | Type | Description |
|-------|------|-------------|
| `businessJustification` | String? | Business justification |
| `impactAssessment` | String? | Impact assessment |
| `affectedServices` | Json? | Affected services array |
| `userImpact` | String? | User impact |
| `riskLevel` | String | Default: "medium" |
| `riskAssessment` | String? | Risk assessment |
| `backoutPlan` | String? | Backout plan |
| `rollbackTime` | Int? | Rollback time minutes |
| `testPlan` | String? | Test plan |
| `testResults` | String? | Test results |

**Scheduling:**
| Field | Type | Description |
|-------|------|-------------|
| `plannedStart` | DateTime? | Planned start time |
| `plannedEnd` | DateTime? | Planned end time |
| `actualStart` | DateTime? | Actual start time |
| `actualEnd` | DateTime? | Actual end time |
| `maintenanceWindow` | Boolean | Default: false |
| `outageRequired` | Boolean | Default: false |
| `estimatedDowntime` | Int? | Estimated downtime minutes |

**Approval:**
| Field | Type | Description |
|-------|------|-------------|
| `cabRequired` | Boolean | Default: false |
| `cabMeetingDate` | DateTime? | CAB meeting date |
| `cabDecision` | String? | CAB decision |
| `cabNotes` | String? | CAB notes |

**Implementation:**
| Field | Type | Description |
|-------|------|-------------|
| `implementationNotes` | String? | Implementation notes |
| `successCriteria` | String? | Success criteria |
| `successful` | Boolean? | Success status |
| `failureReason` | String? | Failure reason |

**Post-Implementation:**
| Field | Type | Description |
|-------|------|-------------|
| `pirRequired` | Boolean | Default: false |
| `pirCompleted` | Boolean | Default: false |
| `pirDate` | DateTime? | Post-implementation review date |
| `pirNotes` | String? | PIR notes |
| `lessonsLearned` | String? | Lessons learned |

**Relationships:**
- `parentChange` → Change? (parent)
- `childChanges` → Change[] (children)
- `vendor` → ExternalDependency?
- `approvals` → ChangeApproval[]
- `assetLinks` → ChangeAsset[]
- `history` → ChangeHistory[]

**Indexes:**
- `changeRef` (unique)
- `status`
- `changeType`
- `category`
- `securityImpact`
- `requesterId`
- `plannedStart`

### AssetRelationship

Relationships between assets.

**Table:** `AssetRelationship`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `fromAssetId` | String | FK → Asset (source) |
| `fromAsset` | Asset | Source asset |
| `toAssetId` | String | FK → Asset (target) |
| `toAsset` | Asset | Target asset |
| `relationshipType` | RelationshipType | Relationship type enum |
| `description` | String? | Description |
| `isCritical` | Boolean | Default: false |
| `notes` | String? | Notes |

**Relationships:**
- `fromAsset` → Asset (many-to-one)
- `toAsset` → Asset (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `fromAssetId, toAssetId, relationshipType` (unique)
- `fromAssetId`
- `toAssetId`
- `relationshipType`

### AssetBusinessProcess

Link between assets and business processes.

**Table:** `AssetBusinessProcess`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `assetId` | String | FK → Asset |
| `asset` | Asset | Asset |
| `businessProcessId` | String | FK → BusinessProcess |
| `businessProcess` | BusinessProcess | Business process |
| `criticality` | String | Default: "medium" |
| `role` | String? | Role in process |
| `notes` | String? | Notes |

**Relationships:**
- `asset` → Asset (many-to-one)
- `businessProcess` → BusinessProcess (many-to-one)

**Indexes:**
- `assetId, businessProcessId` (unique)
- `businessProcessId`

### AssetControl

Link between assets and controls.

**Table:** `AssetControl`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `assetId` | String | FK → Asset |
| `asset` | Asset | Asset |
| `controlId` | String | FK → Control |
| `control` | Control | Control |
| `status` | String | Default: "planned" |
| `implementationNotes` | String? | Implementation notes |
| `implementedDate` | DateTime? | Implementation date |
| `evidenceUrl` | String? | Evidence URL |
| `lastVerified` | DateTime? | Last verification date |

**Relationships:**
- `asset` → Asset (many-to-one)
- `control` → Control (many-to-one)

**Indexes:**
- `assetId, controlId` (unique)
- `controlId`
- `status`

### AssetRisk

Link between assets and risks.

**Table:** `AssetRisk`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `assetId` | String | FK → Asset |
| `asset` | Asset | Asset |
| `riskId` | String | FK → Risk |
| `risk` | Risk | Risk |
| `impactLevel` | String? | Impact level if asset compromised |
| `notes` | String? | Notes |

**Relationships:**
- `asset` → Asset (many-to-one)
- `risk` → Risk (many-to-one)

**Indexes:**
- `assetId, riskId` (unique)
- `riskId`
- `assetId`

### AssetSoftware

Software installed on hardware assets.

**Table:** `AssetSoftware`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `hardwareAssetId` | String | FK → Asset |
| `hardwareAsset` | Asset | Hardware asset |
| `softwareName` | String | Software name |
| `softwareVersion` | String? | Software version |
| `vendor` | String? | Vendor |
| `installDate` | DateTime? | Installation date |
| `installPath` | String? | Installation path |
| `licenseType` | String? | License type |
| `licenseKey` | String? | License key |
| `licenseExpiry` | DateTime? | License expiry date |
| `isApproved` | Boolean | Default: true |

**Relationships:**
- `hardwareAsset` → Asset (many-to-one)

**Indexes:**
- `hardwareAssetId`
- `softwareName`

### CapacityRecord

Capacity measurement records for assets.

**Table:** `CapacityRecord`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `assetId` | String | FK → Asset |
| `asset` | Asset | Asset |
| `recordedAt` | DateTime | Default: now() |
| `cpuUsagePercent` | Int? | CPU usage percentage |
| `memoryUsagePercent` | Int? | Memory usage percentage |
| `storageUsagePercent` | Int? | Storage usage percentage |
| `networkUsagePercent` | Int? | Network usage percentage |
| `customMetrics` | Json? | Custom metrics object |
| `source` | String? | Data source |

**Relationships:**
- `asset` → Asset (many-to-one)

**Indexes:**
- `assetId`
- `recordedAt`
- `assetId, recordedAt`

### CapacityPlan

Capacity planning for assets.

**Table:** `CapacityPlan`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `assetId` | String? | FK → Asset |
| `asset` | Asset? | Asset (null if group plan) |
| `assetGroup` | String? | Asset group |
| `title` | String | Plan title |
| `description` | String? | Description |
| `currentCapacity` | String | Current capacity |
| `currentUtilizationPercent` | Int? | Current utilization percentage |
| `projectedGrowthPercent` | Decimal? | Projected growth (5,2) |
| `projectionPeriodMonths` | Int? | Projection period in months |
| `projectedExhaustionDate` | DateTime? | Projected exhaustion date |
| `recommendedAction` | String? | Recommended action |
| `recommendedDate` | DateTime? | Recommended date |
| `estimatedCost` | Decimal? | Estimated cost (15,2) |
| `costCurrency` | String | Default: "USD" |
| `status` | CapacityPlanStatus | Default: DRAFT |
| `approvedById` | String? | FK → User (approver) |
| `approvedAt` | DateTime? | Approval timestamp |
| `implementedAt` | DateTime? | Implementation timestamp |
| `reviewDate` | DateTime? | Review date |
| `nextReviewDate` | DateTime? | Next review date |

**Relationships:**
- `asset` → Asset? (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `assetId`
- `status`

### ChangeApproval

Approval records for changes.

**Table:** `ChangeApproval`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `changeId` | String | FK → Change |
| `change` | Change | Parent change |
| `approverId` | String? | FK → User (approver) |
| `approver` | User? | Approver |
| `approvalStatus` | String | Approval status |
| `approvalDate` | DateTime? | Approval date |
| `comments` | String? | Comments |

**Relationships:**
- `change` → Change (many-to-one)
- `approver` → User? (many-to-one)

**Indexes:**
- `changeId`
- `approvalStatus`

### ChangeAsset

Assets affected by changes.

**Table:** `ChangeAsset`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `changeId` | String | FK → Change |
| `change` | Change | Parent change |
| `assetId` | String | FK → Asset |
| `asset` | Asset | Affected asset |
| `impactLevel` | String? | Impact level |

**Relationships:**
- `change` → Change (many-to-one)
- `asset` → Asset (many-to-one)

**Indexes:**
- `changeId, assetId` (unique)
- `changeId`
- `assetId`

### ChangeHistory

History records for changes.

**Table:** `ChangeHistory`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `changeId` | String | FK → Change |
| `change` | Change | Parent change |
| `action` | String | Action taken |
| `changedById` | String? | FK → User (changer) |
| `changedBy` | User? | User who made change |
| `changedAt` | DateTime | Default: now() |
| `oldValue` | String? | Old value |
| `newValue` | String? | New value |
| `notes` | String? | Notes |

**Relationships:**
- `change` → Change (many-to-one)
- `changedBy` → User? (many-to-one)

**Indexes:**
- `changeId`
- `changedAt`

### ChangeTemplate

Templates for change requests.

**Table:** `ChangeTemplate`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `templateCode` | String | Unique template code |
| `name` | String | Template name |
| `description` | String? | Description |
| `changeType` | ITSMChangeType | Change type enum |
| `category` | ChangeCategory | Category enum |
| `templateContent` | String? | Template content |
| `isActive` | Boolean | Default: true |

**Indexes:**
- `templateCode` (unique)
- `isActive`

---

## Supply Chain Module

### Vendor

Third-party vendor/supplier entity.

**Table:** `Vendor`

**Identification:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `vendorCode` | String | Unique vendor code (e.g., "VND-001") |
| `name` | String | Vendor name |
| `legalName` | String? | Legal entity name |
| `tradingName` | String? | Trading name |
| `description` | String? | Description |
| `leiCode` | String? | Legal Entity Identifier (DORA) |

**Classification:**
| Field | Type | Description |
|-------|------|-------------|
| `tier` | VendorTier | Default: MEDIUM |
| `tierRationale` | String? | Tier rationale |
| `tierCalculatedAt` | DateTime? | Tier calculation date |
| `tierOverridden` | Boolean | Default: false |
| `tierOverrideReason` | String? | Override reason |
| `status` | VendorStatus | Default: PROSPECT |
| `vendorType` | String? | Vendor type |
| `serviceCategories` | Json? | Service categories array |

**Regulatory Scope:**
| Field | Type | Description |
|-------|------|-------------|
| `inDoraScope` | Boolean | Default: false |
| `inNis2Scope` | Boolean | Default: false |
| `inGdprScope` | Boolean | Default: false |
| `inPciScope` | Boolean | Default: false |
| `inSoc2Scope` | Boolean | Default: false |
| `isIctServiceProvider` | Boolean | Default: false |
| `isCriticalIctProvider` | Boolean | Default: false |
| `supportsEssentialFunction` | Boolean | Default: false |
| `isEssentialSupplier` | Boolean | Default: false |
| `isImportantSupplier` | Boolean | Default: false |

**Contact Information:**
| Field | Type | Description |
|-------|------|-------------|
| `website` | String? | Website URL |
| `headquartersCountry` | String? | HQ country |
| `headquartersAddress` | String? | HQ address |
| `registeredAddress` | String? | Registered address |
| `primaryContactName` | String? | Primary contact name |
| `primaryContactEmail` | String? | Primary contact email |
| `primaryContactPhone` | String? | Primary contact phone |
| `primaryContactRole` | String? | Primary contact role |
| `securityContactName` | String? | Security contact name |
| `securityContactEmail` | String? | Security contact email |
| `securityContactPhone` | String? | Security contact phone |
| `legalContactName` | String? | Legal contact name |
| `legalContactEmail` | String? | Legal contact email |

**Company Information:**
| Field | Type | Description |
|-------|------|-------------|
| `registrationNumber` | String? | Registration number |
| `taxId` | String? | Tax ID |
| `dunsNumber` | String? | DUNS number |
| `foundedYear` | Int? | Founded year |
| `employeeCount` | Int? | Employee count |
| `employeeCountRange` | String? | Employee count range |
| `annualRevenue` | Decimal? | Annual revenue (20,2) |
| `revenueCurrency` | String | Default: "USD" |
| `publicCompany` | Boolean | Default: false |
| `stockSymbol` | String? | Stock symbol |
| `stockExchange` | String? | Stock exchange |
| `parentCompanyName` | String? | Parent company name |
| `parentCompanyCountry` | String? | Parent company country |

**Geographic & Data Location (DORA Art. 28):**
| Field | Type | Description |
|-------|------|-------------|
| `operatingCountries` | Json? | Operating countries array |
| `dataProcessingLocations` | Json? | Data processing locations |
| `dataStorageLocations` | Json? | Data storage locations |
| `thirdCountryExposure` | Boolean | Default: false |
| `geopoliticalRiskLevel` | String? | Geopolitical risk level |

**Certifications & Compliance:**
| Field | Type | Description |
|-------|------|-------------|
| `iso27001Certified` | Boolean | Default: false |
| `iso27001CertExpiry` | DateTime? | ISO 27001 cert expiry |
| `iso27001CertBody` | String? | Certification body |
| `soc2Type2Certified` | Boolean | Default: false |
| `soc2ReportDate` | DateTime? | SOC2 report date |
| `soc2ReportExpiry` | DateTime? | SOC2 report expiry |
| `iso22301Certified` | Boolean | Default: false |
| `pciDssCompliant` | Boolean | Default: false |
| `otherCertifications` | Json? | Other certifications array |

**Financial Health:**
| Field | Type | Description |
|-------|------|-------------|
| `financialRating` | String? | Financial rating |
| `financialRatingSource` | String? | Rating source |
| `financialRatingDate` | DateTime? | Rating date |
| `financialStability` | String? | Financial stability |
| `insuranceCoverage` | Json? | Insurance coverage object |

**Risk Scores:**
| Field | Type | Description |
|-------|------|-------------|
| `inherentRiskScore` | Int? | Inherent risk (1-100) |
| `residualRiskScore` | Int? | Residual risk (1-100) |
| `lastRiskAssessmentDate` | DateTime? | Last assessment date |
| `nextAssessmentDue` | DateTime? | Next assessment due |
| `concentrationRiskLevel` | String? | Concentration risk level |
| `concentrationNotes` | String? | Concentration notes |

**Lifecycle Dates:**
| Field | Type | Description |
|-------|------|-------------|
| `prospectDate` | DateTime? | Prospect date |
| `assessmentStartDate` | DateTime? | Assessment start |
| `onboardedDate` | DateTime? | Onboarded date |
| `lastReviewDate` | DateTime? | Last review date |
| `nextReviewDate` | DateTime? | Next review date |
| `exitPlannedDate` | DateTime? | Exit planned date |
| `terminatedDate` | DateTime? | Terminated date |

**Internal Ownership:**
| Field | Type | Description |
|-------|------|-------------|
| `relationshipOwnerId` | String? | FK → User (relationship owner) |
| `relationshipOwner` | User? | Relationship owner |
| `securityOwnerId` | String? | FK → User (security owner) |
| `securityOwner` | User? | Security owner |
| `businessOwnerId` | String? | FK → User (business owner) |
| `businessOwner` | User? | Business owner |

**Relationships:**
- `assessments` → VendorAssessment[]
- `contracts` → VendorContract[]
- `services` → VendorService[]
- `contacts` → VendorContact[]
- `documents` → VendorDocument[]
- `reviews` → VendorReview[]
- `incidents` → VendorIncident[]
- `exitPlans` → VendorExitPlan[]
- `slaRecords` → VendorSLARecord[]
- `history` → VendorHistory[]

**Indexes:**
- `vendorCode` (unique)
- `name`
- `tier`
- `status`
- `inDoraScope`
- `inNis2Scope`
- `isCriticalIctProvider`
- `nextAssessmentDue`
- `relationshipOwnerId`

### VendorAssessment

Third-party risk assessment instance.

**Table:** `VendorAssessment`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `vendorId` | String | FK → Vendor |
| `vendor` | Vendor | Parent vendor |
| `assessmentRef` | String | Unique assessment reference |
| `assessmentType` | AssessmentType | Assessment type enum |
| `status` | AssessmentStatus | Default: DRAFT |
| `targetTier` | VendorTier? | Target tier |
| `frameworksIncluded` | Json? | Frameworks array |
| `initiatedDate` | DateTime | Default: now() |
| `dueDate` | DateTime? | Due date |
| `submittedDate` | DateTime? | Submitted date |
| `reviewStartDate` | DateTime? | Review start date |
| `completedDate` | DateTime? | Completed date |
| `expiryDate` | DateTime? | Expiry date |
| `assessorId` | String? | FK → User (assessor) |
| `assessor` | User? | Assessor |
| `reviewerId` | String? | FK → User (reviewer) |
| `reviewer` | User? | Reviewer |
| `totalQuestions` | Int | Default: 0 |
| `answeredQuestions` | Int | Default: 0 |
| `overallScore` | Decimal? | Overall score % (5,2) |
| `domainScores` | Json? | Domain scores object |
| `calculatedTier` | VendorTier? | Calculated tier |
| `riskRating` | String? | Risk rating |
| `executiveSummary` | String? | Executive summary |
| `keyFindings` | String? | Key findings |
| `recommendations` | String? | Recommendations |
| `notes` | String? | Notes |

**Relationships:**
- `responses` → AssessmentResponse[]
- `findings` → AssessmentFinding[]

**Indexes:**
- `vendorId`
- `assessmentRef` (unique)
- `status`
- `assessmentType`
- `dueDate`

---

## Applications Module

### Application

Application asset entity with 43 fields from specification.

**Table:** `Application`

**Identifiers (6 fields):**
| Field | Type | Description |
|-------|------|-------------|
| `appId` | String | Unique app ID (e.g., "APP-XXXX") |
| `name` | String | Application name (max 100 chars) |
| `description` | String? | Full description |
| `category` | AppCategory | Default: APPLICATION |
| `subCategory` | AppSubCategory | Default: BUSINESS_APPLICATION |
| `lifecycleStatus` | AppLifecycleStatus | Default: DISCOVERY |

**Ownership (5 fields):**
| Field | Type | Description |
|-------|------|-------------|
| `applicationManagerId` | String? | FK → User (manager) |
| `applicationManager` | User? | Application manager |
| `vendorApplicationManager` | String? | Vendor manager (if externally owned) |
| `departmentId` | String? | FK → Department |
| `department` | Department? | Owning department |
| `assignmentGroup` | String? | ITSM group |
| `costCenter` | String? | Cost center |

**Vendor/Hosting (7 fields):**
| Field | Type | Description |
|-------|------|-------------|
| `externallyOwned` | Boolean | Default: false |
| `vendorSoftwareSupplier` | String? | Vendor name (if externally owned) |
| `technologySupplier` | String? | Technology supplier (if cloud) |
| `serviceOperationsSupplier` | String? | Service operations supplier |
| `hosting` | HostingModel | Default: ON_PREMISE |
| `licenseType` | LicenseType | Default: ENTERPRISE |
| `internallyDeveloped` | Boolean | Default: false |
| `cloudProvider` | String? | Cloud provider (AWS, Azure, GCP) |
| `cloudRegion` | String? | Cloud region |
| `vendorContractRef` | String? | Contract/PO number |
| `vendorSecurityAssessed` | Boolean? | Vendor security assessed |

**Technical (6 fields):**
| Field | Type | Description |
|-------|------|-------------|
| `fqdn` | String? | Fully qualified domain name |
| `authenticationMode` | String? | Authentication mode |
| `technologyStack` | Json? | Technology stack array |
| `externalFacing` | Boolean | Default: false |
| `estimatedUsers` | Int? | Estimated user count |
| `mfaEnabled` | String? | MFA enabled (YES/NO/PARTIAL) |

**Classification/BIA Inputs (4 fields):**
| Field | Type | Description |
|-------|------|-------------|
| `criticality` | CriticalityLevel | Default: MEDIUM |
| `cRating` | Int | Confidentiality rating (1-4, default: 2) |
| `iRating` | Int | Integrity rating (1-4, default: 2) |
| `aRating` | Int | Availability rating (1-4, default: 2) |

**Critical Function - DORA (1 field):**
| Field | Type | Description |
|-------|------|-------------|
| `supportsCriticalFunction` | Boolean | Default: false |

**Data & Privacy (7 fields):**
| Field | Type | Description |
|-------|------|-------------|
| `dataClassification` | DataClassification | Default: INTERNAL |
| `personalData` | Boolean | Default: false |
| `dataCategories` | String? | Data categories |
| `countryPiiStorage` | String? | PII storage countries |
| `specialCategoryData` | Boolean | Default: false |
| `dataSubjects` | String? | Data subjects |
| `crossBorderTransfer` | Boolean | Default: false |

**AI/ML Profile (5 fields):**
| Field | Type | Description |
|-------|------|-------------|
| `usesAiMl` | Boolean | Default: false |
| `aiSystemType` | String? | AI system type |
| `aiProvider` | String? | AI provider |
| `aiUseCase` | String? | AI use case |
| `euAiActApplicable` | Boolean | Default: false |

**Regulatory Scope (4 fields):**
| Field | Type | Description |
|-------|------|-------------|
| `gdprApplicable` | Boolean | Default: false |
| `doraApplicable` | Boolean | Default: false |
| `nis2Applicable` | Boolean | Default: false |
| `otherRegulations` | String? | Other regulations |

**Resilience/BIA Outputs (4 fields):**
| Field | Type | Description |
|-------|------|-------------|
| `rto` | String? | Recovery Time Objective |
| `rpo` | String? | Recovery Point Objective |
| `bcpReference` | String? | BCP reference |
| `drpReference` | String? | DRP reference |

**Security Assessment (4 fields):**
| Field | Type | Description |
|-------|------|-------------|
| `tscmFrequency` | TSCMFrequency? | Default: MONTHLY |
| `lastSecurityAssessment` | DateTime? | Last assessment date |
| `nextReviewDate` | DateTime? | Next review date |
| `pentestDate` | DateTime? | Penetration test date |

**Documentation (3 fields):**
| Field | Type | Description |
|-------|------|-------------|
| `osgDocumentRef` | String? | OSG document reference |
| `riskRegisterRef` | String? | Risk register reference |
| `authorizationMatrixRef` | String? | Authorization matrix reference |

**Relationships (2 fields):**
| Field | Type | Description |
|-------|------|-------------|
| `infrastructureCIs` | Json? | Infrastructure CI IDs array |
| `thirdPartyDependencies` | Json? | Third-party dependency IDs |

**Notes (1 field):**
| Field | Type | Description |
|-------|------|-------------|
| `notes` | String? | Additional notes |

**Relationships:**
- `isras` → ApplicationISRA[]
- `nonconformities` → Nonconformity[]

**Indexes:**
- `appId` (unique)
- `name`
- `category`
- `lifecycleStatus`
- `criticality`
- `dataClassification`
- `departmentId`
- `applicationManagerId`

### ApplicationISRA

Information Security Risk Assessment instance.

**Table:** `ApplicationISRA`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `applicationId` | String | FK → Application |
| `application` | Application | Parent application |
| `assessmentVersion` | Int | Default: 1 |
| `status` | ISRAStatus | Default: DRAFT |
| `startDate` | DateTime | Default: now() |
| `completedDate` | DateTime? | Completion date |
| `leadAssessorId` | String? | FK → User (lead assessor) |
| `leadAssessor` | User? | Lead assessor |
| `assessmentTeam` | Json? | Assessment team array |
| `notes` | String? | Notes |

**Relationships:**
- `bia` → ApplicationBIA? (one-to-one)
- `tva` → ApplicationTVA? (one-to-one)
- `srl` → ApplicationSRL? (one-to-one)

**Indexes:**
- `applicationId, assessmentVersion` (unique)
- `applicationId`
- `status`
- `leadAssessorId`
- `startDate`

### ApplicationBIA

Business Impact Analysis for ISRA.

**Table:** `ApplicationBIA`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `israId` | String | FK → ApplicationISRA (unique) |
| `isra` | ApplicationISRA | Parent ISRA |
| `dataPrivacyCompleted` | Boolean | Default: false |
| `confidentialityCompleted` | Boolean | Default: false |
| `integrityCompleted` | Boolean | Default: false |
| `availabilityCompleted` | Boolean | Default: false |
| `aiMlCompleted` | Boolean | Default: false |
| `confidentialityImpact` | Int | Default: 1 (1-4) |
| `integrityImpact` | Int | Default: 1 (1-4) |
| `availabilityImpact` | Int | Default: 1 (1-4) |
| `estimatedFinancialImpact` | String? | Financial impact estimate |
| `businessCriticality` | CriticalityLevel | Default: LOW |
| `riskLevel` | CriticalityLevel | Default: LOW |
| `motHours` | Int? | Maximum Outage Time hours |
| `rtoMinutes` | Int? | Recovery Time Objective minutes |
| `rpoMinutes` | Int? | Recovery Point Objective minutes |
| `mtpdMinutes` | Int? | Maximum Tolerable Period of Disruption |
| `isCriticalFunction` | Boolean | Default: false |
| `isEssentialService` | Boolean | Default: false |
| `hasAiMlComponents` | Boolean | Default: false |
| `aiRiskClassification` | String? | AI risk classification |
| `upstreamDependencies` | Json? | Upstream dependencies array |
| `downstreamDependencies` | Json? | Downstream dependencies array |
| `assessmentNotes` | String? | Assessment notes |
| `assessedById` | String? | FK → User (assessor) |
| `assessedBy` | User? | Assessor |
| `assessedAt` | DateTime? | Assessment date |

**Relationships:**
- `responses` → BIAResponse[]

**Indexes:**
- `israId` (unique)
- `riskLevel`
- `businessCriticality`

### BIAQuestionCatalog

Master catalog of BIA questions organized by section.

**Table:** `BIAQuestionCatalog`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `questionId` | String | Unique question ID (e.g., "1.0", "2.0") |
| `section` | BIASection | Section enum (DATA_PRIVACY, CONFIDENTIALITY, INTEGRITY, AVAILABILITY, AI_ML) |
| `sortOrder` | Int | Default: 0 |
| `question` | String | Question text |
| `description` | String? | Additional context/guidance |
| `responseType` | BIAResponseType | Default: YES_NO_NA |
| `options` | Json? | Options array for SELECT types |
| `affectsConfidentiality` | Boolean | Default: false |
| `affectsIntegrity` | Boolean | Default: false |
| `affectsAvailability` | Boolean | Default: false |
| `impactWeight` | Int | Default: 1 (0-10) |
| `isoControlId` | String? | ISO control ID (e.g., "5.37") |
| `capabilityId` | String? | Capability ID (e.g., "5.37-C01") |
| `metricImpact` | String? | Metric impact |
| `isGdprRelated` | Boolean | Default: false |
| `isDoraRelated` | Boolean | Default: false |
| `isNis2Related` | Boolean | Default: false |
| `isEuAiActRelated` | Boolean | Default: false |
| `isActive` | Boolean | Default: true |

**Relationships:**
- `responses` → BIAResponse[] (one-to-many)

**Indexes:**
- `questionId` (unique)
- `section`
- `isActive`

### BIAResponse

Individual question responses for a BIA assessment.

**Table:** `BIAResponse`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `biaId` | String | FK → ApplicationBIA |
| `bia` | ApplicationBIA | Parent BIA |
| `questionId` | String | FK → BIAQuestionCatalog |
| `question` | BIAQuestionCatalog | Question |
| `responseValue` | String? | Response value ("YES", "NO", "NA", option value, or text) |
| `responseValues` | Json? | Multi-select values array |
| `numericValue` | Float? | Numeric value for numeric responses |
| `notes` | String? | Notes/justification |

**Relationships:**
- `bia` → ApplicationBIA (many-to-one)
- `question` → BIAQuestionCatalog (many-to-one)

**Indexes:**
- `biaId, questionId` (unique)
- `biaId`
- `questionId`

### ThreatCatalog

Reference catalog of threats for TVA assessments.

**Table:** `ThreatCatalog`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `threatId` | String | Unique threat ID (e.g., "T-SHADOW", "T-CRED") |
| `name` | String | Threat name |
| `description` | String? | Threat description |
| `category` | ThreatCategory | Default: OTHER |
| `confidentialityImpact` | Int | Default: 3 (1-5) |
| `integrityImpact` | Int | Default: 3 (1-5) |
| `availabilityImpact` | Int | Default: 3 (1-5) |
| `baseLikelihood` | Int | Default: 3 (1-5) |
| `applicableHosting` | Json? | Applicable hosting models array |
| `applicableCategories` | Json? | Applicable app categories array |
| `relatedSrlControls` | Json? | Related SRL control IDs array |
| `isActive` | Boolean | Default: true |

**Relationships:**
- `tvaEntries` → ThreatEntry[] (one-to-many)

**Indexes:**
- `threatId` (unique)
- `category`
- `isActive`

### ApplicationTVA

Threat and Vulnerability Assessment for ISRA.

**Table:** `ApplicationTVA`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `israId` | String | FK → ApplicationISRA (unique) |
| `isra` | ApplicationISRA | Parent ISRA |
| `threatScore` | Int? | Aggregated threat score |
| `vulnerabilityScore` | Int? | Aggregated vulnerability score |
| `overallTVAScore` | Int? | Combined TVA score |
| `assessmentNotes` | String? | Assessment notes |
| `assessedById` | String? | FK → User (assessor) |
| `assessedBy` | User? | Assessor |
| `assessedAt` | DateTime? | Assessment date |

**Relationships:**
- `isra` → ApplicationISRA (one-to-one)
- `threats` → ThreatEntry[] (one-to-many)
- `vulnerabilities` → VulnerabilityEntry[] (one-to-many)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `israId` (unique)

### ThreatEntry

Individual threats identified for an application TVA.

**Table:** `ThreatEntry`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `tvaId` | String | FK → ApplicationTVA |
| `tva` | ApplicationTVA | Parent TVA |
| `threatCatalogId` | String | FK → ThreatCatalog |
| `threatCatalog` | ThreatCatalog | Threat from catalog |
| `likelihood` | Int? | Override likelihood for this app |
| `confidentialityImpact` | Int? | Override CIA impacts |
| `integrityImpact` | Int? | Override integrity impact |
| `availabilityImpact` | Int? | Override availability impact |
| `riskScore` | Int? | Calculated risk score (likelihood × max(CIA impacts)) |
| `rationale` | String? | Rationale |
| `isApplicable` | Boolean | Default: true |

**Relationships:**
- `tva` → ApplicationTVA (many-to-one)
- `threatCatalog` → ThreatCatalog (many-to-one)

**Indexes:**
- `tvaId, threatCatalogId` (unique)
- `tvaId`
- `threatCatalogId`
- `isApplicable`

### VulnerabilityEntry

Vulnerabilities identified for an application TVA.

**Table:** `VulnerabilityEntry`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `tvaId` | String | FK → ApplicationTVA |
| `tva` | ApplicationTVA | Parent TVA |
| `vulnerabilityId` | String | CVE ID or internal ID |
| `name` | String | Vulnerability name |
| `description` | String? | Description |
| `severity` | Int | Default: 3 (1-5 CVSS-like score) |
| `status` | String | Default: "OPEN" (OPEN, MITIGATED, ACCEPTED, CLOSED) |
| `mitigationNotes` | String? | Mitigation notes |

**Indexes:**
- `tvaId`
- `vulnerabilityId`
- `status`

### SRLMasterRequirement

Master reference data for Security Requirements List (seeded from Excel).

**Table:** `SRLMasterRequirement`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `srlId` | String | Unique SRL ID (e.g., "AM-01", "AC-01") |
| `requirement` | String | Full requirement text |
| `domain` | String? | Security domain |
| `riskLevelApplicability` | SRLApplicability | Default: ALL |
| `tvaThreats` | Json? | Related threat IDs array |
| `isoControlId` | String? | ISO control ID (e.g., "5.9") |
| `capabilityId` | String? | Capability ID (e.g., "5.9-C01") |
| `affectsConfidentiality` | Boolean | Default: true |
| `affectsIntegrity` | Boolean | Default: true |
| `affectsAvailability` | Boolean | Default: false |
| `testMethod` | String? | Test method (Review, Config, Interview, etc.) |
| `evidenceRequired` | String? | Evidence required |
| `isDoraRequired` | Boolean | Default: false |
| `isNis2Required` | Boolean | Default: false |
| `isActive` | Boolean | Default: true |

**Relationships:**
- `applicationEntries` → ApplicationSRLEntry[] (one-to-many)

**Indexes:**
- `srlId` (unique)
- `riskLevelApplicability`
- `isoControlId`
- `capabilityId`
- `isActive`

### ApplicationSRL

Security Requirements List instance per ISRA.

**Table:** `ApplicationSRL`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `israId` | String | FK → ApplicationISRA (unique) |
| `isra` | ApplicationISRA | Parent ISRA |
| `generatedFromRiskLevel` | CriticalityLevel | Risk level used to filter requirements |
| `generatedAt` | DateTime | Default: now() |
| `totalRequirements` | Int | Default: 0 |
| `coveredCount` | Int | Default: 0 |
| `gapCount` | Int | Default: 0 |
| `partialCount` | Int | Default: 0 |
| `coveragePercentage` | Decimal? | Coverage percentage (5,2) |
| `assessmentNotes` | String? | Assessment notes |
| `assessedById` | String? | FK → User (assessor) |
| `assessedBy` | User? | Assessor |
| `assessedAt` | DateTime? | Assessment date |

**Relationships:**
- `isra` → ApplicationISRA (one-to-one)
- `entries` → ApplicationSRLEntry[] (one-to-many)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `israId` (unique)
- `generatedFromRiskLevel`

### ApplicationSRLEntry

Individual requirement applied to an application.

**Table:** `ApplicationSRLEntry`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `srlId` | String | FK → ApplicationSRL |
| `srl` | ApplicationSRL | Parent SRL |
| `masterRequirementId` | String | FK → SRLMasterRequirement |
| `masterRequirement` | SRLMasterRequirement | Master requirement |
| `coverageStatus` | SRLCoverageStatus | Default: NOT_ASSESSED |
| `linkedCapabilityId` | String? | Linked organizational capability ID |
| `coverageEvidence` | String? | Coverage evidence |
| `coverageNotes` | String? | Coverage notes |
| `assessedById` | String? | FK → User (assessor) |
| `assessedAt` | DateTime? | Assessment date |
| `riskScore` | Int? | Risk score (BIA criticality × TVA threat impact) |
| `calculatedSeverity` | String? | Calculated severity (MAJOR, MINOR, OBSERVATION) |
| `nonconformityId` | String? | FK → Nonconformity (if gap becomes NC) |
| `nonconformity` | Nonconformity? | Related nonconformity |

**Relationships:**
- `srl` → ApplicationSRL (many-to-one)
- `masterRequirement` → SRLMasterRequirement (many-to-one)
- `nonconformity` → Nonconformity? (many-to-one)

**Indexes:**
- `srlId, masterRequirementId` (unique)
- `srlId`
- `masterRequirementId`
- `coverageStatus`
- `linkedCapabilityId`
- `nonconformityId`

---

## Audits Module

### Nonconformity

ISO 10.1 Nonconformity and Corrective Action entity.

**Table:** `Nonconformity`

**Identification:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `ncId` | String | Unique NC identifier (e.g., "NC-2025-001") |
| `dateRaised` | DateTime | Default: now() |
| `source` | NonconformitySource | Source enum |
| `sourceReferenceId` | String? | Link to source (test, audit, incident ID) |
| `isoClause` | String? | ISO clause reference (e.g., "A.5.2") |

**Classification:**
| Field | Type | Description |
|-------|------|-------------|
| `severity` | NCSeverity | Severity enum |
| `category` | NCCategory | Category enum |

**Description:**
| Field | Type | Description |
|-------|------|-------------|
| `title` | String | NC title |
| `description` | String | Detailed description |
| `findings` | String? | Evidence/findings |
| `rootCause` | String? | Root cause analysis |
| `impact` | String? | Business/security impact |

**Related Entities:**
| Field | Type | Description |
|-------|------|-------------|
| `controlId` | String? | FK → Control |
| `control` | Control? | Related control |
| `capabilityId` | String? | FK → Capability |
| `capability` | Capability? | Related capability |
| `testId` | String? | FK → CapabilityEffectivenessTest |
| `test` | CapabilityEffectivenessTest? | Related test |
| `applicationId` | String? | FK → Application |
| `application` | Application? | Related application |
| `risks` | Risk[] | Affected risks |
| `srlEntries` | ApplicationSRLEntry[] | Related SRL entries |

**Corrective Action Plan (CAP):**
| Field | Type | Description |
|-------|------|-------------|
| `correctiveAction` | String? | Corrective action text |
| `responsibleUserId` | String? | FK → User (responsible) |
| `responsibleUser` | User? | Responsible user |
| `targetClosureDate` | DateTime? | Target closure date |
| `status` | NCStatus | Default: OPEN |
| `capStatus` | CAPStatus | Default: NOT_DEFINED |
| `capDraftedAt` | DateTime? | CAP draft timestamp |
| `capDraftedById` | String? | FK → User (CAP drafter) |
| `capDraftedBy` | User? | CAP drafter |
| `capSubmittedAt` | DateTime? | CAP submission timestamp |
| `capApprovedAt` | DateTime? | CAP approval timestamp |
| `capApprovedById` | String? | FK → User (CAP approver) |
| `capApprovedBy` | User? | CAP approver |
| `capApprovalComments` | String? | Approval comments |
| `capRejectedAt` | DateTime? | CAP rejection timestamp |
| `capRejectedById` | String? | FK → User (CAP rejector) |
| `capRejectedBy` | User? | CAP rejector |
| `capRejectionReason` | String? | Rejection reason |

**Verification:**
| Field | Type | Description |
|-------|------|-------------|
| `verificationMethod` | String? | Verification method |
| `verificationDate` | DateTime? | Verification date |
| `verifiedById` | String? | FK → User (verifier) |
| `verifiedBy` | User? | Verifier |
| `verificationResult` | String? | Verification result |
| `verificationNotes` | String? | Verification notes |

**Audit Trail:**
| Field | Type | Description |
|-------|------|-------------|
| `raisedById` | String | FK → User (raised by) |
| `raisedBy` | User | User who raised NC |
| `createdAt` | DateTime | Default: now() |
| `updatedAt` | DateTime | Auto-updated |
| `closedAt` | DateTime? | Closure timestamp |
| `closedById` | String? | FK → User (closed by) |
| `closedBy` | User? | User who closed NC |

**Indexes:**
- `ncId` (unique)
- `status`
- `capStatus`
- `severity`
- `source`
- `dateRaised`
- `targetClosureDate`
- `responsibleUserId`
- `controlId`
- `capabilityId`
- `testId`
- `applicationId`

### VendorService

Services provided by vendors.

**Table:** `VendorService`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `vendorId` | String | FK → Vendor |
| `vendor` | Vendor | Parent vendor |
| `serviceName` | String | Service name |
| `serviceDescription` | String? | Service description |
| `serviceType` | String | Service type (CLOUD, SOFTWARE, CONSULTING, OUTSOURCING, etc.) |
| `serviceCategory` | String? | Service category (ICT, NON_ICT, INFRASTRUCTURE, etc.) |
| `businessCriticality` | String | Default: "MEDIUM" |
| `dataClassification` | String? | Data classification |
| `supportedFunctions` | Json? | Business functions supported array |
| `integrationLevel` | String? | Integration level (DEEP, MODERATE, LIGHT, NONE) |
| `apiAccess` | Boolean | Default: false |
| `dataExchanged` | Json? | Data types exchanged array |
| `isActive` | Boolean | Default: true |
| `startDate` | DateTime? | Start date |
| `endDate` | DateTime? | End date |

**Relationships:**
- `vendor` → Vendor (many-to-one)

**Indexes:**
- `vendorId`
- `serviceType`
- `businessCriticality`

### VendorContact

Contacts for vendors.

**Table:** `VendorContact`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `vendorId` | String | FK → Vendor |
| `vendor` | Vendor | Parent vendor |
| `name` | String | Contact name |
| `email` | String? | Email |
| `phone` | String? | Phone |
| `role` | String? | Role |
| `department` | String? | Department |
| `contactType` | String | Contact type (PRIMARY, SECURITY, LEGAL, ESCALATION, INCIDENT, COMMERCIAL) |
| `isPrimary` | Boolean | Default: false |
| `notes` | String? | Notes |
| `isActive` | Boolean | Default: true |

**Relationships:**
- `vendor` → Vendor (many-to-one)

**Indexes:**
- `vendorId`
- `contactType`

### AssessmentQuestion

Assessment questions (seed data).

**Table:** `AssessmentQuestion`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `questionNumber` | Int | Unique question number |
| `domain` | String | Domain (e.g., "1. Governance & Organization") |
| `subArea` | String | Sub-area (e.g., "Structure", "Policies") |
| `questionText` | String | Question text |
| `frameworkLayer` | FrameworkLayer | Framework layer (ISO, NIS2, DORA) |
| `regulatoryRef` | String? | Regulatory reference (A.5.1, Art. 20, etc.) |
| `tierApplicability` | String | Default: "All" |
| `riskWeight` | RiskWeight | Default: MEDIUM |
| `evidenceExpected` | String? | Expected evidence |
| `guidanceNotes` | String? | Assessor guidance |
| `isActive` | Boolean | Default: true |
| `sortOrder` | Int | Default: 0 |

**Relationships:**
- `responses` → AssessmentResponse[] (one-to-many)

**Indexes:**
- `questionNumber` (unique)
- `domain`
- `frameworkLayer`
- `tierApplicability`
- `riskWeight`
- `isActive, sortOrder`

### AssessmentResponse

Responses to assessment questions.

**Table:** `AssessmentResponse`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `assessmentId` | String | FK → VendorAssessment |
| `assessment` | VendorAssessment | Parent assessment |
| `questionId` | String | FK → AssessmentQuestion |
| `question` | AssessmentQuestion | Question |
| `response` | String? | Free text response |
| `score` | Int? | Score (0-5, 0=N/A) |
| `evidenceProvided` | String? | Evidence provided |
| `evidenceUrls` | Json? | Evidence URLs array |
| `reviewerNotes` | String? | Reviewer notes |
| `findingsNotes` | String? | Findings notes |
| `remediationNeeded` | Boolean | Default: false |
| `answeredAt` | DateTime? | Answer timestamp |
| `reviewedAt` | DateTime? | Review timestamp |
| `reviewedById` | String? | FK → User (reviewer) |

**Relationships:**
- `assessment` → VendorAssessment (many-to-one)
- `question` → AssessmentQuestion (many-to-one)

**Indexes:**
- `assessmentId, questionId` (unique)
- `assessmentId`
- `questionId`
- `score`

### AssessmentFinding

Findings from vendor assessments.

**Table:** `AssessmentFinding`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `assessmentId` | String | FK → VendorAssessment |
| `assessment` | VendorAssessment | Parent assessment |
| `findingRef` | String | Unique finding reference (e.g., "FND-001") |
| `title` | String | Finding title |
| `description` | String | Description |
| `severity` | FindingSeverity | Severity enum |
| `status` | FindingStatus | Default: OPEN |
| `domain` | String? | Related domain |
| `questionNumbers` | Json? | Related question numbers array |
| `remediationPlan` | String? | Remediation plan |
| `remediationDueDate` | DateTime? | Remediation due date |
| `remediatedDate` | DateTime? | Remediation date |
| `remediationNotes` | String? | Remediation notes |
| `riskAccepted` | Boolean | Default: false |
| `acceptedById` | String? | FK → User (accepter) |
| `acceptedDate` | DateTime? | Acceptance date |
| `acceptanceRationale` | String? | Acceptance rationale |

**Relationships:**
- `assessment` → VendorAssessment (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `findingRef` (unique)
- `assessmentId`
- `status`
- `severity`
- `remediationDueDate`

### VendorContract

Contracts with vendors.

**Table:** `VendorContract`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `vendorId` | String | FK → Vendor |
| `vendor` | Vendor | Parent vendor |
| `contractRef` | String | Unique contract reference (e.g., "CNT-VND001-001") |
| `title` | String | Contract title |
| `description` | String? | Description |
| `contractType` | String | Contract type (MSA, SOW, NDA, DPA, SLA, etc.) |
| `status` | ContractStatus | Default: DRAFT |
| `effectiveDate` | DateTime? | Effective date |
| `expiryDate` | DateTime? | Expiry date |
| `signedDate` | DateTime? | Signed date |
| `autoRenewal` | Boolean | Default: false |
| `renewalNoticeDays` | Int? | Renewal notice days |
| `renewalTermMonths` | Int? | Renewal term in months |
| `contractValue` | Decimal? | Contract value (15,2) |
| `contractCurrency` | String | Default: "USD" |
| `paymentTerms` | String? | Payment terms |
| `hasServiceDescription` | Boolean | Default: false (DORA Art. 30) |
| `hasDataLocations` | Boolean | Default: false |
| `hasLocationChangeNotice` | Boolean | Default: false |
| `hasAvailabilityTargets` | Boolean | Default: false |
| `hasAssistanceInIncidents` | Boolean | Default: false |
| `hasAuditRights` | Boolean | Default: false |
| `hasRegulatoryAccess` | Boolean | Default: false |
| `hasTerminationRights` | Boolean | Default: false |
| `hasExitClause` | Boolean | Default: false |
| `hasSubcontractingRules` | Boolean | Default: false |
| `hasDataProtection` | Boolean | Default: false |
| `hasConfidentiality` | Boolean | Default: false |
| `hasIpProtection` | Boolean | Default: false |
| `hasLiabilityLimits` | Boolean | Default: false |
| `hasInsuranceRequirements` | Boolean | Default: false |
| `hasBcpRequirements` | Boolean | Default: false |
| `hasSecurityRequirements` | Boolean | Default: false |
| `slaDocumentUrl` | String? | SLA document URL |
| `legalOwnerId` | String? | FK → User (legal owner) |
| `legalOwner` | User? | Legal owner |
| `businessOwnerId` | String? | FK → User (business owner) |
| `businessOwner` | User? | Business owner |
| `notes` | String? | Notes |

**Relationships:**
- `vendor` → Vendor (many-to-one)
- `legalOwner` → User? (many-to-one)
- `businessOwner` → User? (many-to-one)
- `evidenceLinks` → EvidenceContract[] (one-to-many)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `contractRef` (unique)
- `vendorId`
- `status`
- `expiryDate`

### VendorDocument

Documents related to vendors.

**Table:** `VendorDocument`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `vendorId` | String | FK → Vendor |
| `vendor` | Vendor | Parent vendor |
| `documentType` | String | Document type (CERTIFICATE, SOC_REPORT, POLICY, CONTRACT, EVIDENCE, etc.) |
| `title` | String | Document title |
| `description` | String? | Description |
| `fileName` | String? | File name |
| `fileUrl` | String? | File URL |
| `fileSize` | Int? | File size |
| `mimeType` | String? | MIME type |
| `issueDate` | DateTime? | Issue date |
| `expiryDate` | DateTime? | Expiry date |
| `isVerified` | Boolean | Default: false |
| `verifiedById` | String? | FK → User (verifier) |
| `verifiedDate` | DateTime? | Verification date |
| `notes` | String? | Notes |

**Relationships:**
- `vendor` → Vendor (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `vendorId`
- `documentType`
- `expiryDate`

### VendorReview

Periodic/ongoing monitoring reviews for vendors.

**Table:** `VendorReview`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `vendorId` | String | FK → Vendor |
| `vendor` | Vendor | Parent vendor |
| `reviewRef` | String | Unique review reference (e.g., "RVW-VND001-2024-Q1") |
| `reviewType` | VendorReviewType | Review type enum |
| `reviewPeriod` | String? | Review period (e.g., "Q1 2024", "Annual 2024") |
| `status` | String | Default: "SCHEDULED" |
| `scheduledDate` | DateTime | Scheduled date |
| `completedDate` | DateTime? | Completion date |
| `performanceScore` | Int? | Performance score (1-100) |
| `slaCompliance` | Decimal? | SLA compliance percentage (5,2) |
| `riskRatingBefore` | String? | Risk rating before review |
| `riskRatingAfter` | String? | Risk rating after review |
| `tierBefore` | VendorTier? | Tier before review |
| `tierAfter` | VendorTier? | Tier after review |
| `summary` | String? | Summary |
| `findings` | String? | Findings |
| `recommendations` | String? | Recommendations |
| `actionItems` | Json? | Action items array |
| `includedInBoardReport` | Boolean | Default: false (DORA) |
| `boardReportDate` | DateTime? | Board report date |
| `reviewerId` | String? | FK → User (reviewer) |
| `reviewer` | User? | Reviewer |

**Relationships:**
- `vendor` → Vendor (many-to-one)
- `reviewer` → User? (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `reviewRef` (unique)
- `vendorId`
- `reviewType`
- `status`
- `scheduledDate`

### VendorSLARecord

SLA performance records for vendors.

**Table:** `VendorSLARecord`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `vendorId` | String | FK → Vendor |
| `vendor` | Vendor | Parent vendor |
| `period` | DateTime | Period (month/period) |
| `metricName` | String | Metric name (e.g., "Uptime", "Response Time") |
| `metricUnit` | String? | Metric unit ("%", "hours", "minutes") |
| `targetValue` | Decimal | Target value (10,4) |
| `actualValue` | Decimal | Actual value (10,4) |
| `status` | SLAStatus | SLA status enum |
| `breachCount` | Int | Default: 0 |
| `notes` | String? | Notes |

**Relationships:**
- `vendor` → Vendor (many-to-one)

**Indexes:**
- `vendorId`
- `period`
- `status`
- `vendorId, period`

### VendorIncident

Supply chain incidents involving vendors.

**Table:** `VendorIncident`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `vendorId` | String | FK → Vendor |
| `vendor` | Vendor | Parent vendor |
| `incidentRef` | String | Unique incident reference (e.g., "VINC-001") |
| `title` | String | Incident title |
| `description` | String | Description |
| `incidentType` | String | Incident type (SECURITY_BREACH, SERVICE_OUTAGE, DATA_BREACH, etc.) |
| `severity` | String | Severity (CRITICAL, HIGH, MEDIUM, LOW) |
| `status` | String | Default: "OPEN" |
| `detectedAt` | DateTime | Detection timestamp |
| `reportedAt` | DateTime? | Report timestamp |
| `initialNotificationAt` | DateTime? | NIS2: 24hr notification |
| `fullReportAt` | DateTime? | NIS2: 72hr report |
| `finalReportAt` | DateTime? | NIS2: 1 month final |
| `resolvedAt` | DateTime? | Resolution timestamp |
| `businessImpact` | String? | Business impact |
| `dataAffected` | Boolean | Default: false |
| `regulatoryReport` | Boolean | Default: false |
| `rootCause` | String? | Root cause |
| `resolution` | String? | Resolution |
| `lessonsLearned` | String? | Lessons learned |
| `linkedIncidentId` | String? | Linked incident ID |
| `assignedToId` | String? | FK → User (assignee) |
| `assignedTo` | User? | Assignee |

**Relationships:**
- `vendor` → Vendor (many-to-one)
- `assignedTo` → User? (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `incidentRef` (unique)
- `vendorId`
- `status`
- `severity`
- `detectedAt`

### VendorExitPlan

Exit plans for vendors (DORA Art. 28(8)).

**Table:** `VendorExitPlan`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `vendorId` | String | FK → Vendor |
| `vendor` | Vendor | Parent vendor |
| `exitPlanRef` | String | Unique exit plan reference (e.g., "EXIT-VND001-001") |
| `title` | String | Exit plan title |
| `description` | String? | Description |
| `status` | ExitPlanStatus | Default: DRAFT |
| `coversInterruptions` | Boolean | Default: true |
| `coversFailures` | Boolean | Default: true |
| `coversTermination` | Boolean | Default: true |
| `coversInsolvency` | Boolean | Default: false |
| `coversRegulatory` | Boolean | Default: false |
| `transitionPeriodDays` | Int? | Transition period in days |
| `alternativeVendors` | Json? | Alternative vendors array |
| `dataExtractionPlan` | String? | Data extraction plan |
| `serviceTransitionPlan` | String? | Service transition plan |
| `lastTestedDate` | DateTime? | Last tested date |
| `nextTestDue` | DateTime? | Next test due date |
| `testResults` | String? | Test results |
| `testSuccessful` | Boolean? | Test successful |
| `approvedById` | String? | FK → User (approver) |
| `approvedDate` | DateTime? | Approval date |
| `notes` | String? | Notes |

**Relationships:**
- `vendor` → Vendor (many-to-one)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `exitPlanRef` (unique)
- `vendorId`
- `status`
- `nextTestDue`

### VendorHistory

Audit trail for vendor changes.

**Table:** `VendorHistory`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `vendorId` | String | FK → Vendor |
| `vendor` | Vendor | Parent vendor |
| `action` | String | Action (CREATED, UPDATED, STATUS_CHANGED, TIER_CHANGED, etc.) |
| `field` | String? | Changed field |
| `oldValue` | String? | Old value |
| `newValue` | String? | New value |
| `notes` | String? | Notes |
| `changedById` | String? | FK → User (changer) |
| `changedBy` | User? | User who made change |

**Relationships:**
- `vendor` → Vendor (many-to-one)
- `changedBy` → User? (many-to-one)

**Indexes:**
- `vendorId`
- `createdAt`
- `action`

---

## BCM Module

The BCM (Business Continuity Management) module provides comprehensive business continuity planning, testing, and activation capabilities with support for DORA and NIS2 regulatory requirements.

### BCMProgram

Top-level BCM program entity that coordinates continuity planning activities.

**Table:** `BCMProgram`

**Basic Information:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `programCode` | String | Unique program code (e.g., "BCM-PROG-001") |
| `name` | String | Program name |
| `description` | String? | Program description |
| `scope` | String? | Program scope |

**Governance:**
| Field | Type | Description |
|-------|------|-------------|
| `status` | String | Default: "draft" (draft, active, under_review, retired) |
| `effectiveDate` | DateTime? | Effective date |
| `nextReviewDate` | DateTime? | Next review date |

**Policy & Ownership:**
| Field | Type | Description |
|-------|------|-------------|
| `policyDocumentId` | String? | FK → PolicyDocument |
| `policyDocument` | PolicyDocument? | Linked policy document |
| `programOwnerId` | String? | FK → User (owner) |
| `programOwner` | User? | Program owner |

**Objectives:**
| Field | Type | Description |
|-------|------|-------------|
| `objectives` | Json? | Objectives array |
| `successCriteria` | Json? | Success criteria array |

**Regulatory Context:**
| Field | Type | Description |
|-------|------|-------------|
| `doraApplicable` | Boolean | Default: false |
| `nis2Applicable` | Boolean | Default: false |

**Relationships:**
- `continuityPlans` → ContinuityPlan[]
- `testExercises` → BCMTestExercise[]
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)
- `programOwner` → User? (many-to-one)

**Indexes:**
- `programCode` (unique)
- `status`
- `programOwnerId`

### ContinuityPlan

Business continuity, disaster recovery, crisis management, or IT recovery plan.

**Table:** `ContinuityPlan`

**Basic Information:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `planCode` | String | Unique plan code (e.g., "BCP-001") |
| `name` | String | Plan name |
| `planType` | String | Type: business_continuity, disaster_recovery, crisis_management, it_recovery |
| `description` | String? | Plan description |

**Status & Version:**
| Field | Type | Description |
|-------|------|-------------|
| `status` | String | Default: "draft" (draft, approved, active, under_review, retired) |
| `version` | String | Default: "1.0" |

**Program Linkage:**
| Field | Type | Description |
|-------|------|-------------|
| `programId` | String | FK → BCMProgram |
| `program` | BCMProgram | Parent program |

**Documentation:**
| Field | Type | Description |
|-------|------|-------------|
| `policyDocumentId` | String? | FK → PolicyDocument (full plan content) |
| `policyDocument` | PolicyDocument? | Linked plan document |

**Scope:**
| Field | Type | Description |
|-------|------|-------------|
| `coveredProcessIds` | Json? | Array of BusinessProcess IDs covered by this plan |

**Ownership:**
| Field | Type | Description |
|-------|------|-------------|
| `planOwnerId` | String? | FK → User (owner) |
| `planOwner` | User? | Plan owner |

**Activation:**
| Field | Type | Description |
|-------|------|-------------|
| `activationCriteria` | String? | Criteria for activation |
| `activationAuthority` | String? | Who can activate |
| `escalationMatrix` | Json? | Escalation matrix array |

**Recovery Procedures:**
| Field | Type | Description |
|-------|------|-------------|
| `recoveryProcedures` | Json? | Recovery procedures array |
| `communicationPlan` | Json? | Communication plan object |
| `resourceRequirements` | Json? | Resource requirements array |

**Testing:**
| Field | Type | Description |
|-------|------|-------------|
| `lastTestedAt` | DateTime? | Last test date |
| `nextTestDue` | DateTime? | Next test due date |
| `testFrequency` | String? | Test frequency (monthly, quarterly, semi_annual, annual) |

**Approval:**
| Field | Type | Description |
|-------|------|-------------|
| `approvedAt` | DateTime? | Approval timestamp |
| `approvedById` | String? | FK → User (approver) |
| `approvedBy` | User? | Approving user |

**Relationships:**
- `program` → BCMProgram (many-to-one)
- `policyDocument` → PolicyDocument? (many-to-one)
- `planOwner` → User? (many-to-one)
- `approvedBy` → User? (many-to-one)
- `activations` → PlanActivation[]
- `testExercises` → BCMTestExercise[]
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `planCode` (unique)
- `programId`
- `planType`
- `status`
- `planOwnerId`

### BCMTestExercise

BCM test exercise (tabletop, walkthrough, simulation, full interruption, notification test).

**Table:** `BCMTestExercise`

**Basic Information:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `testCode` | String | Unique test code (e.g., "TEST-2025-001") |
| `name` | String | Test name |
| `description` | String? | Test description |

**Test Type & Status:**
| Field | Type | Description |
|-------|------|-------------|
| `testType` | String | Type: tabletop, walkthrough, simulation, full_interruption, notification_test |
| `status` | String | Default: "planned" (planned, scheduled, in_progress, completed, cancelled) |

**Program & Plan Linkage:**
| Field | Type | Description |
|-------|------|-------------|
| `programId` | String | FK → BCMProgram |
| `program` | BCMProgram | Parent program |
| `planId` | String? | FK → ContinuityPlan |
| `plan` | ContinuityPlan? | Tested plan |

**Scheduling:**
| Field | Type | Description |
|-------|------|-------------|
| `scheduledDate` | DateTime | Scheduled date |
| `executedDate` | DateTime? | Actual execution date |
| `durationHours` | Int? | Duration in hours |

**Participants:**
| Field | Type | Description |
|-------|------|-------------|
| `facilitatorId` | String? | FK → User (facilitator) |
| `facilitator` | User? | Test facilitator |
| `participants` | Json? | Array of participant info |

**Scenario:**
| Field | Type | Description |
|-------|------|-------------|
| `scenarioDescription` | String? | Scenario description |
| `objectives` | Json? | Test objectives array |
| `scope` | String? | Test scope |

**Results:**
| Field | Type | Description |
|-------|------|-------------|
| `objectivesMet` | Boolean? | Whether objectives were met |
| `lessonsLearned` | String? | Lessons learned |
| `successAreas` | Json? | Success areas array |
| `improvementAreas` | Json? | Improvement areas array |

**Recovery Metrics:**
| Field | Type | Description |
|-------|------|-------------|
| `actualRtoMinutes` | Int? | Actual RTO achieved |
| `targetRtoMinutes` | Int? | Target RTO |
| `rtoMet` | Boolean? | Whether RTO was met |

**Relationships:**
- `program` → BCMProgram (many-to-one)
- `plan` → ContinuityPlan? (many-to-one)
- `facilitator` → User? (many-to-one)
- `findings` → BCMTestFinding[]
- `evidenceLinks` → EvidenceBCMTest[]
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `testCode` (unique)
- `programId`
- `planId`
- `status`
- `scheduledDate`

### BCMTestFinding

Findings from BCM test exercises (gaps, improvements, observations, strengths).

**Table:** `BCMTestFinding`

**Test Reference:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `testId` | String | FK → BCMTestExercise |
| `test` | BCMTestExercise | Parent test |

**Finding Details:**
| Field | Type | Description |
|-------|------|-------------|
| `findingCode` | String | Unique finding code (e.g., "FIND-001") |
| `findingType` | String | Type: gap, improvement, observation, strength |
| `severity` | String | Severity: critical, high, medium, low |
| `title` | String | Finding title |
| `description` | String | Finding description |

**Recommendation:**
| Field | Type | Description |
|-------|------|-------------|
| `recommendation` | String? | Recommendation |
| `priority` | String? | Priority: immediate, short_term, medium_term, long_term |

**Status & Resolution:**
| Field | Type | Description |
|-------|------|-------------|
| `status` | String | Default: "open" (open, in_progress, resolved, accepted, deferred) |
| `assignedToId` | String? | FK → User (assignee) |
| `assignedTo` | User? | Assigned user |
| `dueDate` | DateTime? | Due date |
| `resolvedAt` | DateTime? | Resolution timestamp |
| `resolutionNotes` | String? | Resolution notes |

**Nonconformity Linkage:**
| Field | Type | Description |
|-------|------|-------------|
| `nonconformityId` | String? | FK → Nonconformity (if finding becomes NC) |
| `nonconformity` | Nonconformity? | Related nonconformity |

**Relationships:**
- `test` → BCMTestExercise (many-to-one)
- `assignedTo` → User? (many-to-one)
- `nonconformity` → Nonconformity? (many-to-one)
- `createdBy` → User? (many-to-one)
- `updatedBy` → User? (many-to-one)

**Indexes:**
- `findingCode` (unique)
- `testId`
- `findingType`
- `severity`
- `status`
- `assignedToId`

### PlanActivation

Record of continuity plan activation (actual or simulated).

**Table:** `PlanActivation`

**Activation Code:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `activationCode` | String | Unique activation code (e.g., "ACT-2025-001") |

**Plan Reference:**
| Field | Type | Description |
|-------|------|-------------|
| `planId` | String | FK → ContinuityPlan |
| `plan` | ContinuityPlan | Activated plan |

**Incident Linkage:**
| Field | Type | Description |
|-------|------|-------------|
| `incidentId` | String? | FK → Incident (if triggered by incident) |
| `incident` | Incident? | Related incident |

**Activation Details:**
| Field | Type | Description |
|-------|------|-------------|
| `activatedAt` | DateTime | Activation timestamp (default: now()) |
| `activatedById` | String | FK → User (activator) |
| `activatedBy` | User | User who activated |
| `reason` | String? | Activation reason |

**Deactivation:**
| Field | Type | Description |
|-------|------|-------------|
| `deactivatedAt` | DateTime? | Deactivation timestamp |
| `deactivatedById` | String? | FK → User (deactivator) |
| `deactivatedBy` | User? | User who deactivated |

**Status:**
| Field | Type | Description |
|-------|------|-------------|
| `status` | String | Default: "active" (active, completed, aborted) |

**Recovery Tracking:**
| Field | Type | Description |
|-------|------|-------------|
| `targetRtoMinutes` | Int? | Target RTO |
| `actualRtoMinutes` | Int? | Actual RTO achieved |
| `rtoAchieved` | Boolean? | Whether RTO was achieved |
| `targetRpoMinutes` | Int? | Target RPO |
| `actualRpoAchieved` | Boolean? | Whether RPO was achieved |
| `recoveryNotes` | String? | Recovery notes |

**Affected Processes:**
| Field | Type | Description |
|-------|------|-------------|
| `affectedProcessIds` | Json? | Array of affected BusinessProcess IDs |

**Timeline:**
| Field | Type | Description |
|-------|------|-------------|
| `timelineEvents` | Json? | Array of {timestamp, event, notes} |

**Relationships:**
- `plan` → ContinuityPlan (many-to-one)
- `incident` → Incident? (many-to-one)
- `activatedBy` → User (many-to-one)
- `deactivatedBy` → User? (many-to-one)

**Indexes:**
- `activationCode` (unique)
- `planId`
- `incidentId`
- `activatedById`
- `status`
- `activatedAt`

### EvidenceBCMTest

Junction table linking evidence to BCM test exercises.

**Table:** `EvidenceBCMTest`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `createdAt` | DateTime | Link creation timestamp |
| `evidenceId` | String | FK → Evidence |
| `evidence` | Evidence | Linked evidence |
| `testId` | String | FK → BCMTestExercise |
| `test` | BCMTestExercise | Linked test |
| `notes` | String? | Link notes |
| `createdById` | String? | FK → User (creator) |
| `createdBy` | User? | Creating user |

**Relationships:**
- `evidence` → Evidence (many-to-one)
- `test` → BCMTestExercise (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `evidenceId, testId` (unique)
- `evidenceId`
- `testId`

### IncidentRelation

Relations between incidents.

**Table:** `IncidentRelation`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `sourceIncidentId` | String | FK → Incident (source) |
| `sourceIncident` | Incident | Source incident |
| `targetIncidentId` | String | FK → Incident (target) |
| `targetIncident` | Incident | Target incident |
| `relationType` | String | Relation type (DUPLICATE, RELATED, CAUSED_BY, ESCALATED_FROM, etc.) |
| `description` | String? | Description |

**Relationships:**
- `sourceIncident` → Incident (many-to-one)
- `targetIncident` → Incident (many-to-one)

**Indexes:**
- `sourceIncidentId, targetIncidentId, relationType` (unique)
- `sourceIncidentId`
- `targetIncidentId`

### EvidenceRisk

Junction table linking evidence to risks.

**Table:** `EvidenceRisk`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `evidenceId` | String | FK → Evidence |
| `evidence` | Evidence | Linked evidence |
| `riskId` | String | FK → Risk |
| `risk` | Risk | Linked risk |
| `linkType` | String? | Link type (assessment, acceptance, monitoring) |
| `notes` | String? | Notes |

**Relationships:**
- `evidence` → Evidence (many-to-one)
- `risk` → Risk (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `evidenceId, riskId` (unique)
- `evidenceId`
- `riskId`

### EvidenceTreatment

Junction table linking evidence to treatment plans.

**Table:** `EvidenceTreatment`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `evidenceId` | String | FK → Evidence |
| `evidence` | Evidence | Linked evidence |
| `treatmentId` | String | FK → TreatmentPlan |
| `treatment` | TreatmentPlan | Linked treatment plan |
| `linkType` | String? | Link type (implementation, approval, progress) |
| `notes` | String? | Notes |

**Relationships:**
- `evidence` → Evidence (many-to-one)
- `treatment` → TreatmentPlan (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `evidenceId, treatmentId` (unique)
- `evidenceId`
- `treatmentId`

### EvidencePolicy

Junction table linking evidence to policy documents.

**Table:** `EvidencePolicy`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `evidenceId` | String | FK → Evidence |
| `evidence` | Evidence | Linked evidence |
| `policyId` | String | FK → PolicyDocument |
| `policy` | PolicyDocument | Linked policy |
| `linkType` | String? | Link type (supporting, appendix, acknowledgment) |
| `notes` | String? | Notes |

**Relationships:**
- `evidence` → Evidence (many-to-one)
- `policy` → PolicyDocument (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `evidenceId, policyId` (unique)
- `evidenceId`
- `policyId`

### EvidenceVendor

Junction table linking evidence to vendors.

**Table:** `EvidenceVendor`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `evidenceId` | String | FK → Evidence |
| `evidence` | Evidence | Linked evidence |
| `vendorId` | String | FK → Vendor |
| `vendor` | Vendor | Linked vendor |
| `linkType` | String? | Link type (certification, soc_report, assessment, contract) |
| `notes` | String? | Notes |

**Relationships:**
- `evidence` → Evidence (many-to-one)
- `vendor` → Vendor (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `evidenceId, vendorId` (unique)
- `evidenceId`
- `vendorId`

### EvidenceAssessment

Junction table linking evidence to vendor assessments.

**Table:** `EvidenceAssessment`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `evidenceId` | String | FK → Evidence |
| `evidence` | Evidence | Linked evidence |
| `assessmentId` | String | FK → VendorAssessment |
| `assessment` | VendorAssessment | Linked assessment |
| `linkType` | String? | Link type (response, finding, remediation) |
| `notes` | String? | Notes |

**Relationships:**
- `evidence` → Evidence (many-to-one)
- `assessment` → VendorAssessment (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `evidenceId, assessmentId` (unique)
- `evidenceId`
- `assessmentId`

### EvidenceContract

Junction table linking evidence to vendor contracts.

**Table:** `EvidenceContract`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `evidenceId` | String | FK → Evidence |
| `evidence` | Evidence | Linked evidence |
| `contractId` | String | FK → VendorContract |
| `contract` | VendorContract | Linked contract |
| `linkType` | String? | Link type (signed_contract, amendment, sla) |
| `notes` | String? | Notes |

**Relationships:**
- `evidence` → Evidence (many-to-one)
- `contract` → VendorContract (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `evidenceId, contractId` (unique)
- `evidenceId`
- `contractId`

### EvidenceAsset

Junction table linking evidence to assets.

**Table:** `EvidenceAsset`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `evidenceId` | String | FK → Evidence |
| `evidence` | Evidence | Linked evidence |
| `assetId` | String | FK → Asset |
| `asset` | Asset | Linked asset |
| `linkType` | String? | Link type (configuration, vulnerability_scan, backup_verification) |
| `notes` | String? | Notes |

**Relationships:**
- `evidence` → Evidence (many-to-one)
- `asset` → Asset (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `evidenceId, assetId` (unique)
- `evidenceId`
- `assetId`

### EvidenceChange

Junction table linking evidence to changes.

**Table:** `EvidenceChange`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `evidenceId` | String | FK → Evidence |
| `evidence` | Evidence | Linked evidence |
| `changeId` | String | FK → Change |
| `change` | Change | Linked change |
| `linkType` | String? | Link type (approval, test_result, pir) |
| `notes` | String? | Notes |

**Relationships:**
- `evidence` → Evidence (many-to-one)
- `change` → Change (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `evidenceId, changeId` (unique)
- `evidenceId`
- `changeId`

### EvidenceApplication

Junction table linking evidence to applications.

**Table:** `EvidenceApplication`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `evidenceId` | String | FK → Evidence |
| `evidence` | Evidence | Linked evidence |
| `applicationId` | String | FK → Application |
| `application` | Application | Linked application |
| `linkType` | String? | Link type (security_assessment, pentest, configuration) |
| `notes` | String? | Notes |

**Relationships:**
- `evidence` → Evidence (many-to-one)
- `application` → Application (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `evidenceId, applicationId` (unique)
- `evidenceId`
- `applicationId`

### EvidenceISRA

Junction table linking evidence to application ISRAs.

**Table:** `EvidenceISRA`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | PK, CUID |
| `evidenceId` | String | FK → Evidence |
| `evidence` | Evidence | Linked evidence |
| `israId` | String | FK → ApplicationISRA |
| `isra` | ApplicationISRA | Linked ISRA |
| `linkType` | String? | Link type (bia, tva, srl) |
| `notes` | String? | Notes |

**Relationships:**
- `evidence` → Evidence (many-to-one)
- `isra` → ApplicationISRA (many-to-one)
- `createdBy` → User? (many-to-one)

**Indexes:**
- `evidenceId, israId` (unique)
- `evidenceId`
- `israId`

---

## Enumerations Reference

### ControlTheme
- `ORGANISATIONAL`
- `PEOPLE`
- `PHYSICAL`
- `TECHNOLOGICAL`

### ControlFramework
- `ISO`
- `SOC2`
- `NIS2`
- `DORA`

### ImplementationStatus
- `NOT_STARTED`
- `PARTIAL`
- `IMPLEMENTED`

### TestResult
- `PASS`
- `PARTIAL`
- `FAIL`
- `NOT_TESTED`
- `NOT_APPLICABLE`

### EffectivenessTestType
- `DESIGN` - Is the control designed to meet the objective?
- `IMPLEMENTATION` - Is the control deployed as designed?
- `OPERATING` - Does the control work consistently over time?

### SOAStatus
- `DRAFT`
- `PENDING_REVIEW`
- `APPROVED`
- `SUPERSEDED`

### RiskTier
- `CORE` - Essential risks for all organizations
- `EXTENDED` - Additional risks for medium/large organizations
- `ADVANCED` - Comprehensive risks for large organizations

### RiskStatus
- `IDENTIFIED`
- `ASSESSED`
- `TREATING`
- `ACCEPTED`
- `CLOSED`

### LikelihoodLevel
- `RARE` (1)
- `UNLIKELY` (2)
- `POSSIBLE` (3)
- `LIKELY` (4)
- `ALMOST_CERTAIN` (5)

### ImpactLevel
- `NEGLIGIBLE` (1)
- `MINOR` (2)
- `MODERATE` (3)
- `MAJOR` (4)
- `SEVERE` (5)

### TreatmentType
- `MITIGATE` - Reduce risk through controls
- `TRANSFER` - Transfer risk (e.g., insurance)
- `ACCEPT` - Accept the risk with justification
- `AVOID` - Eliminate the risk source
- `SHARE` - Share risk with third party

### TreatmentStatus
- `DRAFT`
- `PROPOSED`
- `APPROVED`
- `IN_PROGRESS`
- `COMPLETED`
- `ON_HOLD`
- `CANCELLED`

### DocumentType
- `POLICY` - Level 1 - Strategic
- `STANDARD` - Level 2 - Requirements
- `PROCEDURE` - Level 3 - Operations
- `WORK_INSTRUCTION` - Level 4 - Tasks
- `FORM` - Supporting
- `TEMPLATE` - Supporting
- `CHECKLIST` - Supporting
- `GUIDELINE` - Advisory
- `RECORD` - Evidence

### DocumentStatus
- `DRAFT`
- `PENDING_REVIEW`
- `PENDING_APPROVAL`
- `APPROVED`
- `PUBLISHED`
- `UNDER_REVISION`
- `SUPERSEDED`
- `RETIRED`
- `ARCHIVED`

### AssetType
- Hardware: `SERVER`, `WORKSTATION`, `LAPTOP`, `MOBILE_DEVICE`, `NETWORK_DEVICE`, `STORAGE_DEVICE`, `SECURITY_APPLIANCE`, `IOT_DEVICE`, `PRINTER`, `OTHER_HARDWARE`
- Software: `OPERATING_SYSTEM`, `APPLICATION`, `DATABASE`, `MIDDLEWARE`
- Cloud: `CLOUD_VM`, `CLOUD_CONTAINER`, `CLOUD_DATABASE`, `CLOUD_STORAGE`, `CLOUD_NETWORK`, `CLOUD_SERVERLESS`, `CLOUD_KUBERNETES`
- Services: `INTERNAL_SERVICE`, `EXTERNAL_SERVICE`, `SAAS_APPLICATION`, `API_ENDPOINT`
- Data: `DATA_STORE`, `DATA_FLOW`
- Other: `OTHER`

### AssetStatus
- `PLANNED`
- `PROCUREMENT`
- `DEVELOPMENT`
- `STAGING`
- `ACTIVE`
- `MAINTENANCE`
- `RETIRING`
- `DISPOSED`

### VendorStatus
- `PROSPECT`
- `ASSESSMENT`
- `DUE_DILIGENCE`
- `CONTRACTING`
- `ONBOARDING`
- `ACTIVE`
- `MONITORING`
- `REVIEW`
- `OFFBOARDING`
- `TERMINATED`
- `SUSPENDED`

### VendorTier
- `CRITICAL` - Highest risk, most scrutiny
- `HIGH` - High risk
- `MEDIUM` - Standard risk
- `LOW` - Low risk, minimal oversight

### AssessmentType
- `INITIAL` - Pre-onboarding assessment
- `PERIODIC` - Regular scheduled assessment
- `AD_HOC` - Triggered by event/incident
- `REASSESSMENT` - Follow-up after remediation
- `EXIT` - Exit assessment

### AssessmentStatus
- `DRAFT`
- `IN_PROGRESS`
- `PENDING_REVIEW`
- `UNDER_REVIEW`
- `FINDINGS_OPEN`
- `COMPLETED`
- `EXPIRED`
- `CANCELLED`

### NonconformitySource
- `TEST` - From effectiveness test failure
- `INTERNAL_AUDIT` - Internal audit finding
- `EXTERNAL_AUDIT` - External audit finding
- `CERTIFICATION_AUDIT` - Certification body audit
- `INCIDENT` - From security incident
- `SELF_ASSESSMENT` - Self-identified issue
- `MANAGEMENT_REVIEW` - From management review
- `SURVEILLANCE_AUDIT` - Ongoing certification surveillance
- `ISRA_GAP` - From ISRA SRL gap analysis

### NCSeverity
- `MAJOR` - Absence or total breakdown of control
- `MINOR` - Isolated or occasional failure
- `OBSERVATION` - Opportunity for improvement

### NCStatus
- `DRAFT` - Auto-created, pending manual review
- `OPEN` - Reviewed and confirmed
- `IN_PROGRESS` - Corrective action underway
- `AWAITING_VERIFICATION` - CAP complete, awaiting verification
- `VERIFIED_EFFECTIVE` - Verification shows it's fixed
- `VERIFIED_INEFFECTIVE` - Verification shows it's not fixed (reopen)
- `CLOSED` - Verified and closed
- `REJECTED` - Reviewed but determined not to be a real NC

### CAPStatus
- `NOT_REQUIRED` - Observation - no formal CAP needed
- `NOT_DEFINED` - NC opened but CAP not yet defined
- `DRAFT` - CAP being written, can be edited freely
- `PENDING_APPROVAL` - CAP submitted, awaiting manager review
- `APPROVED` - CAP approved, work can begin
- `REJECTED` - CAP rejected, needs revision

### IncidentSeverity
- `CRITICAL` - Business-critical impact, requires immediate executive attention
- `HIGH` - Significant impact, requires urgent response
- `MEDIUM` - Moderate impact, standard response procedures
- `LOW` - Minor impact, can be addressed during normal operations

### IncidentStatus
- `DETECTED` - Incident detected, awaiting triage
- `TRIAGED` - Initial assessment complete
- `INVESTIGATING` - Active investigation underway
- `CONTAINING` - Containment actions in progress
- `ERADICATING` - Threat removal in progress
- `RECOVERING` - Recovery and restoration underway
- `POST_INCIDENT` - Post-incident review phase
- `CLOSED` - Incident fully resolved and closed

### IncidentCategory
- `MALWARE` - Malicious software (ransomware, virus, trojan)
- `PHISHING` - Social engineering attacks
- `DENIAL_OF_SERVICE` - DDoS or DoS attacks
- `DATA_BREACH` - Unauthorized data access or exfiltration
- `UNAUTHORIZED_ACCESS` - Unauthorized system access
- `INSIDER_THREAT` - Malicious or negligent insider
- `PHYSICAL` - Physical security incidents
- `SUPPLY_CHAIN` - Third-party or supply chain incidents
- `SYSTEM_FAILURE` - Technical failures
- `CONFIGURATION_ERROR` - Misconfiguration issues
- `OTHER` - Other incident types

### IncidentSource
- `SIEM` - Security Information and Event Management
- `USER_REPORT` - User-reported incident
- `THREAT_INTEL` - Threat intelligence feed
- `AUTOMATED` - Automated detection system
- `THIRD_PARTY` - Third-party notification
- `REGULATOR` - Regulatory notification
- `VULNERABILITY_SCAN` - Vulnerability scanner
- `PENETRATION_TEST` - Penetration test finding
- `OTHER` - Other source

### NIS2EntityType
- `ESSENTIAL` - Essential entity under NIS2
- `IMPORTANT` - Important entity under NIS2

### NIS2Sector
- `ENERGY` - Energy sector
- `TRANSPORT` - Transport sector
- `BANKING` - Banking sector
- `FINANCIAL_MARKET_INFRASTRUCTURE` - Financial market infrastructure
- `HEALTH` - Health sector
- `DRINKING_WATER` - Drinking water
- `WASTE_WATER` - Waste water
- `DIGITAL_INFRASTRUCTURE` - Digital infrastructure
- `ICT_SERVICE_MANAGEMENT` - ICT service management
- `PUBLIC_ADMINISTRATION` - Public administration
- `SPACE` - Space sector
- `POSTAL_COURIER` - Postal and courier services
- `WASTE_MANAGEMENT` - Waste management
- `CHEMICALS` - Chemicals manufacturing
- `FOOD` - Food production and distribution
- `MANUFACTURING` - Manufacturing
- `DIGITAL_PROVIDERS` - Digital service providers
- `RESEARCH` - Research organizations

### DORAEntityType
- `CREDIT_INSTITUTION` - Credit institution
- `PAYMENT_INSTITUTION` - Payment institution
- `INVESTMENT_FIRM` - Investment firm
- `INSURANCE_UNDERTAKING` - Insurance undertaking
- `CRYPTO_ASSET_SERVICE_PROVIDER` - Crypto-asset service provider
- (and 17 additional financial entity types per DORA Article 2)

### NotificationType
- `EARLY_WARNING` - NIS2 24-hour early warning
- `INITIAL` - Initial notification (DORA 4h, NIS2 72h)
- `INTERMEDIATE` - Intermediate report
- `FINAL` - Final report (1 month)
- `VOLUNTARY` - Voluntary notification
- `UPDATE` - Update to previous notification

### NotificationStatus
- `PENDING` - Awaiting preparation
- `PENDING_APPROVAL` - Submitted for internal approval
- `SUBMITTED` - Submitted to authority
- `ACKNOWLEDGED` - Acknowledged by authority
- `ADDITIONAL_INFO_REQUESTED` - Authority requested more info
- `CLOSED` - Notification process complete
- `OVERDUE` - Past deadline, not submitted

### RegulatoryAuthorityType
- `CSIRT` - Computer Security Incident Response Team
- `COMPETENT_AUTHORITY` - NIS2 competent authority
- `FINANCIAL_SUPERVISOR` - DORA financial supervisor
- `DATA_PROTECTION_AUTHORITY` - GDPR supervisory authority

### LessonsLearnedCategory
- `DETECTION` - Detection capability improvements
- `RESPONSE` - Response process improvements
- `COMMUNICATION` - Communication improvements
- `TOOLING` - Tool and technology improvements
- `TRAINING` - Training and awareness improvements
- `PROCESS` - Process improvements
- `THIRD_PARTY` - Third-party management improvements
- `DOCUMENTATION` - Documentation improvements

---

## Incidents Module

The Incidents module provides comprehensive security incident management with regulatory compliance features for ISO 27001:2022, NIS2, and DORA frameworks.

### Incident

The core incident entity for tracking security events.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `referenceNumber` | String | Unique incident reference (e.g., INC-2025-0001) |
| `title` | String | Brief incident title |
| `description` | String | Detailed incident description |
| `detectedAt` | DateTime | When the incident was detected |
| `occurredAt` | DateTime? | When the incident actually occurred |
| `reportedAt` | DateTime? | When formally reported internally |
| `classifiedAt` | DateTime? | When classified (starts regulatory clocks) |
| `containedAt` | DateTime? | When containment was achieved |
| `eradicatedAt` | DateTime? | When threat was eradicated |
| `recoveredAt` | DateTime? | When recovery was completed |
| `closedAt` | DateTime? | When incident was closed |
| `severity` | IncidentSeverity | CRITICAL, HIGH, MEDIUM, LOW |
| `category` | IncidentCategory | Incident category classification |
| `status` | IncidentStatus | Current workflow status |
| `source` | IncidentSource | How incident was detected |
| `sourceRef` | String? | External reference (SIEM alert ID, etc.) |
| `isConfirmed` | Boolean | Whether incident is confirmed |
| `resolutionType` | IncidentResolutionType? | How incident was resolved |
| `confidentialityBreach` | Boolean | CIA impact - confidentiality |
| `integrityBreach` | Boolean | CIA impact - integrity |
| `availabilityBreach` | Boolean | CIA impact - availability |
| `evidencePreserved` | Boolean | ISO 27001 compliance flag |
| `chainOfCustodyMaintained` | Boolean | ISO 27001 compliance flag |
| `rootCauseIdentified` | Boolean | ISO 27001 compliance flag |
| `lessonsLearnedCompleted` | Boolean | ISO 27001 compliance flag |
| `correctiveActionsIdentified` | Boolean | ISO 27001 compliance flag |
| `reporterId` | String? | User who reported the incident |
| `handlerId` | String? | Assigned incident handler |
| `incidentManagerId` | String? | Incident manager |
| `incidentTypeId` | String? | Reference to incident type |
| `attackVectorId` | String? | MITRE ATT&CK vector |
| `organisationId` | String? | Organisation scope |

**Key Relationships:**
- `nis2Assessment` - NIS2 regulatory assessment
- `doraAssessment` - DORA regulatory assessment
- `affectedAssets` - Impacted assets
- `evidence` - Collected evidence
- `timeline` - Incident timeline entries
- `communications` - Stakeholder communications
- `lessonsLearned` - Post-incident findings
- `notifications` - Regulatory notifications
- `controlLinks` - Related controls
- `nonconformityLinks` - Related nonconformities

### IncidentNIS2Assessment

NIS2 Directive compliance assessment for significant incidents.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `incidentId` | String | Parent incident |
| `applies` | Boolean | Whether NIS2 applies |
| `entityType` | NIS2EntityType? | ESSENTIAL or IMPORTANT |
| `sector` | NIS2Sector? | NIS2 sector classification |
| `causedSevereOperationalDisruption` | Boolean | Article 23(3) criterion |
| `causedFinancialLoss` | Boolean | Article 23(3) criterion |
| `financialLossAmount` | Decimal? | Financial loss in EUR |
| `affectedOtherPersons` | Boolean | Article 23(3) criterion |
| `affectedPersonsCount` | Int? | Number of affected persons |
| `causedMaterialDamage` | Boolean | Article 23(3) criterion |
| `hasCrossBorderImpact` | Boolean | Cross-border impact flag |
| `affectedMemberStates` | Json | ISO country codes array |
| `serviceAvailabilityImpactPercent` | Decimal? | Service impact percentage |
| `serviceDegradationDurationHours` | Decimal? | Disruption duration |
| `isSignificantIncident` | Boolean | Classification result |
| `significanceDeterminationRationale` | String? | Classification reasoning |
| `manuallyOverridden` | Boolean | Override flag |
| `overrideJustification` | String? | Override reasoning |
| `earlyWarningRequiredBy` | DateTime? | 24h deadline |
| `earlyWarningSubmittedAt` | DateTime? | Submission timestamp |
| `notificationRequiredBy` | DateTime? | 72h deadline |
| `notificationSubmittedAt` | DateTime? | Submission timestamp |
| `finalReportRequiredBy` | DateTime? | 1 month deadline |
| `finalReportSubmittedAt` | DateTime? | Submission timestamp |
| `csirtReferenceNumber` | String? | CSIRT reference |

### IncidentDORAAssessment

DORA (Digital Operational Resilience Act) compliance assessment.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `incidentId` | String | Parent incident |
| `applies` | Boolean | Whether DORA applies |
| `financialEntityType` | DORAEntityType? | Financial entity classification |
| `affectsCriticalFunction` | Boolean | Critical function impact |
| `thirdPartyProviderInvolved` | Boolean | Third-party ICT involvement |
| `thirdPartyProviderId` | String? | Related vendor |
| **Criterion 1 - Clients Affected** | | |
| `clientsAffectedCount` | Int? | Number of clients affected |
| `clientsAffectedPercent` | Decimal? | Percentage of clients |
| `criterion1ThresholdBreached` | Boolean | Threshold breach flag |
| **Criterion 2 - Reputational** | | |
| `mediaCoverageType` | MediaCoverageType | NONE, LOCAL, NATIONAL, INTERNATIONAL |
| `clientComplaintsReceived` | Int? | Complaint count |
| `regulatoryInquiryTriggered` | Boolean | Regulatory inquiry flag |
| `criterion2ThresholdBreached` | Boolean | Threshold breach flag |
| **Criterion 3 - Duration** | | |
| `serviceDowntimeHours` | Decimal? | Downtime duration |
| `recoveryTimeHours` | Decimal? | Recovery time |
| `criterion3ThresholdBreached` | Boolean | Threshold breach flag |
| **Criterion 4 - Geographic** | | |
| `affectedMemberStates` | Json | EU member states array |
| `affectedThirdCountries` | Json | Non-EU countries array |
| `criterion4ThresholdBreached` | Boolean | Threshold breach flag |
| **Criterion 5 - Data Impact** | | |
| `dataIntegrityAffected` | Boolean | Integrity impact |
| `dataConfidentialityAffected` | Boolean | Confidentiality impact |
| `recordsAffectedCount` | Int? | Records affected |
| `involvesPersonalData` | Boolean | Personal data flag |
| `criterion5ThresholdBreached` | Boolean | Threshold breach flag |
| **Criterion 6 - Economic** | | |
| `directCosts` | Decimal? | Direct financial costs |
| `indirectCosts` | Decimal? | Indirect costs |
| `totalEconomicImpact` | Decimal? | Total impact |
| `economicImpactPercentOfCET1` | Decimal? | % of CET1 capital |
| `criterion6ThresholdBreached` | Boolean | Threshold breach flag |
| **Criterion 7 - Transactions** | | |
| `transactionsAffectedCount` | Int? | Transactions affected |
| `transactionsAffectedPercent` | Decimal? | % of daily transactions |
| `criterion7ThresholdBreached` | Boolean | Threshold breach flag |
| **Classification** | | |
| `isMajorIncident` | Boolean | Major incident classification |
| `majorClassificationScore` | Int | Criteria breached (0-7) |
| `classificationRationale` | String? | Classification reasoning |
| **Reporting** | | |
| `initialNotificationRequiredBy` | DateTime? | 4h deadline |
| `intermediateReportRequiredBy` | DateTime? | 72h deadline |
| `finalReportRequiredBy` | DateTime? | 1 month deadline |

### IncidentNotification

Regulatory notification tracking.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `incidentId` | String | Parent incident |
| `framework` | RegulatoryFramework | NIS2, DORA, GDPR, etc. |
| `notificationType` | NotificationType | EARLY_WARNING, INITIAL, INTERMEDIATE, FINAL |
| `authorityId` | String | Regulatory authority |
| `dueAt` | DateTime? | Deadline |
| `submittedAt` | DateTime? | Submission timestamp |
| `status` | NotificationStatus | Workflow status |
| `reportContent` | Json? | Report data |
| `submissionMethod` | SubmissionMethod? | PORTAL, EMAIL, API, etc. |
| `externalReference` | String? | Authority's reference |
| `authorityResponse` | String? | Response from authority |
| `followUpRequired` | Boolean | Follow-up flag |
| `approvedById` | String? | Approver |
| `approvedAt` | DateTime? | Approval timestamp |
| `submittedById` | String? | Submitter |

### RegulatoryAuthority

Reference data for regulatory bodies.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `name` | String | Full authority name |
| `shortName` | String? | Abbreviation (e.g., CERT-EU) |
| `countryCode` | String | ISO 2-letter country code |
| `authorityType` | RegulatoryAuthorityType | CSIRT, FINANCIAL_SUPERVISOR, DPA |
| `frameworks` | Json | Applicable frameworks array |
| `submissionPortalUrl` | String? | Submission portal URL |
| `submissionEmail` | String? | Notification email |
| `timezone` | String? | Authority timezone |
| `isActive` | Boolean | Active flag |

### IncidentType

Reference data for incident classification.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `name` | String | Type name |
| `description` | String? | Detailed description |
| `category` | IncidentCategory | Category classification |
| `defaultSeverity` | IncidentSeverity | Default severity |
| `typicalConfidentialityImpact` | Boolean | Typical C impact |
| `typicalIntegrityImpact` | Boolean | Typical I impact |
| `typicalAvailabilityImpact` | Boolean | Typical A impact |
| `requiresLawEnforcement` | Boolean | Law enforcement flag |
| `sortOrder` | Int | Display order |
| `organisationId` | String? | Null = system default |

### AttackVector

MITRE ATT&CK aligned attack vectors.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `name` | String | Vector name |
| `description` | String? | Description |
| `mitreAttackId` | String? | MITRE ID (e.g., T1566) |
| `mitreAttackName` | String? | MITRE technique name |
| `mitreTactics` | Json | Tactics array |
| `isActive` | Boolean | Active flag |

### IncidentAsset

Link between incidents and affected assets.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `incidentId` | String | Parent incident |
| `assetId` | String | Affected asset |
| `impactType` | IncidentImpactType | COMPROMISED, AFFECTED, AT_RISK |
| `confirmedAt` | DateTime? | Confirmation timestamp |
| `notes` | String? | Impact notes |

### IncidentEvidence

Evidence collection with chain of custody.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `incidentId` | String | Parent incident |
| `evidenceType` | IncidentEvidenceType | LOG, SCREENSHOT, MEMORY_DUMP, etc. |
| `title` | String | Evidence title |
| `description` | String? | Evidence description |
| `fileName` | String? | File name |
| `fileUrl` | String? | Storage URL |
| `fileSizeBytes` | Int? | File size |
| `hashSha256` | String? | SHA-256 hash |
| `hashMd5` | String? | MD5 hash |
| `collectedAt` | DateTime | Collection timestamp |
| `collectedById` | String | Collector |
| `collectionMethod` | String? | How collected |
| `chainOfCustodyNotes` | String? | Chain of custody log |
| `isForensicallySound` | Boolean | Forensic integrity flag |
| `storageLocation` | String? | Storage location |
| `retainUntil` | DateTime? | Retention date |

### IncidentTimelineEntry

Chronological incident timeline.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `incidentId` | String | Parent incident |
| `timestamp` | DateTime | Entry timestamp |
| `entryType` | IncidentTimelineEntryType | Entry classification |
| `title` | String | Entry title |
| `description` | String? | Entry details |
| `visibility` | IncidentVisibility | INTERNAL, MANAGEMENT, REGULATOR, PUBLIC |
| `isAutomated` | Boolean | System-generated flag |
| `sourceSystem` | String? | Source system |
| `createdById` | String | Creator |

### IncidentCommunication

Stakeholder communication tracking.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `incidentId` | String | Parent incident |
| `communicationType` | IncidentCommunicationType | INTERNAL, CUSTOMER, VENDOR, REGULATOR, etc. |
| `direction` | IncidentCommunicationDirection | INBOUND, OUTBOUND |
| `channel` | IncidentCommunicationChannel | EMAIL, PHONE, PORTAL, etc. |
| `subject` | String | Communication subject |
| `content` | String | Full content |
| `summary` | String? | Summary for long content |
| `senderName` | String? | Sender name |
| `senderEmail` | String? | Sender email |
| `recipientName` | String? | Recipient name |
| `recipientEmail` | String? | Recipient email |
| `occurredAt` | DateTime | Communication timestamp |
| `requiresFollowUp` | Boolean | Follow-up flag |
| `followUpDueAt` | DateTime? | Follow-up deadline |
| `followUpCompleted` | Boolean | Follow-up status |

### IncidentLessonsLearned

Post-incident review findings.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `incidentId` | String | Parent incident |
| `category` | LessonsLearnedCategory | DETECTION, RESPONSE, COMMUNICATION, etc. |
| `observation` | String | What was observed |
| `recommendation` | String | Improvement recommendation |
| `status` | LessonsLearnedStatus | IDENTIFIED, IN_PROGRESS, IMPLEMENTED, VALIDATED |
| `priority` | Int | 1=highest, 5=lowest |
| `targetDate` | DateTime? | Target completion |
| `completedDate` | DateTime? | Actual completion |
| `assignedToId` | String? | Assigned owner |
| `correctiveActionId` | String? | Link to nonconformity CAP |

### IncidentControl

Link between incidents and controls.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `incidentId` | String | Parent incident |
| `controlId` | String | Related control |
| `linkType` | String? | failed, bypassed, effective, not_applicable |
| `notes` | String? | Link notes |

### IncidentNonconformity

Link between incidents and nonconformities.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `incidentId` | String | Parent incident |
| `nonconformityId` | String | Related nonconformity |
| `linkType` | String? | caused_by, revealed_by |
| `notes` | String? | Link notes |

---

## Evidence Module

The Evidence Module is the **central repository** for all evidence across the platform. It provides unified storage, management, and linking of evidence to support compliance with ISO 27001, NIS2, DORA, and other frameworks.

### Evidence

Core evidence entity storing all evidence metadata and file information.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `evidenceRef` | String | Unique reference (EVD-2025-00001) |
| `title` | String | Evidence title |
| `description` | String? | Description |
| `evidenceType` | EvidenceType | Type of evidence |
| `status` | EvidenceStatus | Current status |
| `classification` | EvidenceClassification | Security classification |
| `tags` | String[] | Tags for categorization |
| `category` | String? | Category |
| `subcategory` | String? | Subcategory |
| `fileName` | String? | Stored file name |
| `originalFileName` | String? | Original file name |
| `fileUrl` | String? | URL to access file |
| `fileSizeBytes` | Int? | File size in bytes |
| `mimeType` | String? | MIME type |
| `storagePath` | String? | Storage path |
| `storageProvider` | String? | Storage provider (local, s3, etc.) |
| `isEncrypted` | Boolean | Whether file is encrypted |
| `hashSha256` | String? | SHA-256 hash for integrity |
| `hashMd5` | String? | MD5 hash for integrity |
| `isForensicallySound` | Boolean | Forensic integrity flag |
| `chainOfCustodyNotes` | String? | Chain of custody documentation |
| `sourceType` | EvidenceSourceType | How evidence was collected |
| `sourceSystem` | String? | Source system name |
| `sourceReference` | String? | External reference |
| `collectedAt` | DateTime | When evidence was collected |
| `collectedById` | String? | Who collected it |
| `collectionMethod` | String? | Collection method |
| `validFrom` | DateTime? | Validity start date |
| `validUntil` | DateTime? | Validity end date |
| `retainUntil` | DateTime? | Retention end date |
| `renewalRequired` | Boolean | Whether renewal is needed |
| `renewalReminderDays` | Int? | Days before expiry to remind |
| `reviewedAt` | DateTime? | When reviewed |
| `reviewedById` | String? | Who reviewed |
| `reviewNotes` | String? | Review notes |
| `approvedAt` | DateTime? | When approved |
| `approvedById` | String? | Who approved |
| `approvalNotes` | String? | Approval notes |
| `rejectedAt` | DateTime? | When rejected |
| `rejectedById` | String? | Who rejected |
| `rejectionReason` | String? | Rejection reason |
| `version` | Int | Version number |
| `previousVersionId` | String? | Previous version link |
| `metadata` | Json? | Additional metadata |
| `notes` | String? | Notes |

### EvidenceRequest

Request for evidence from stakeholders.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `requestRef` | String | Unique reference (REQ-2025-00001) |
| `title` | String | Request title |
| `description` | String | Request description |
| `evidenceType` | EvidenceType? | Expected evidence type |
| `requiredFormat` | String? | Required format |
| `acceptanceCriteria` | String? | Criteria for acceptance |
| `priority` | EvidenceRequestPriority | LOW, MEDIUM, HIGH, CRITICAL |
| `status` | EvidenceRequestStatus | Current status |
| `dueDate` | DateTime | Due date |
| `requestedById` | String? | Who requested |
| `assignedToId` | String? | Assigned to user |
| `assignedDepartmentId` | String? | Assigned to department |
| `contextType` | String? | Context entity type |
| `contextId` | String? | Context entity ID |
| `contextRef` | String? | Context reference |
| `submittedAt` | DateTime? | When evidence was submitted |
| `acceptedAt` | DateTime? | When accepted |
| `rejectedAt` | DateTime? | When rejected |
| `cancelledAt` | DateTime? | When cancelled |
| `rejectionReason` | String? | Rejection reason |
| `notes` | String? | Notes |

### EvidenceRequestFulfillment

Links evidence to requests that it fulfills.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `requestId` | String | Parent request |
| `evidenceId` | String | Fulfilling evidence |
| `submittedAt` | DateTime | When submitted |
| `submittedById` | String? | Who submitted |
| `notes` | String? | Submission notes |

### EvidenceLink

Generic linking table for flexible evidence associations.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `evidenceId` | String | Evidence reference |
| `entityType` | String | Target entity type |
| `entityId` | String | Target entity ID |
| `linkType` | String? | Type of link |
| `notes` | String? | Link notes |

### Junction Tables

The Evidence module uses type-safe junction tables for linking:

| Table | Links Evidence To |
|-------|-------------------|
| `EvidenceControl` | Controls |
| `EvidenceCapability` | Capabilities (with maturityLevel) |
| `EvidenceEffectivenessTest` | Effectiveness tests |
| `EvidenceNonconformity` | Nonconformities |
| `EvidenceIncident` | Incidents |
| `EvidenceRisk` | Risks |
| `EvidenceRiskScenario` | Risk scenarios |
| `EvidenceTreatmentPlan` | Treatment plans |
| `EvidencePolicy` | Policy documents |
| `EvidenceVendor` | Vendors |
| `EvidenceAssessment` | Vendor assessments |
| `EvidenceContract` | Vendor contracts |
| `EvidenceAsset` | Assets |
| `EvidenceChange` | Changes |
| `EvidenceApplication` | Applications |
| `EvidenceISRA` | ISRAs |
| `EvidenceOrganisationProfile` | Organisation profiles |
| `EvidenceDepartment` | Departments |
| `EvidenceLocation` | Locations |
| `EvidenceBusinessProcess` | Business processes |
| `EvidenceSecurityCommittee` | Security committees |
| `EvidenceCommitteeMeeting` | Committee meetings |
| `EvidenceMeetingActionItem` | Meeting action items |
| `EvidenceExternalDependency` | External dependencies |
| `EvidenceRegulatoryAuthority` | Regulatory authorities |
| `EvidenceKeyPersonnel` | Key personnel |
| `EvidenceApplicableFramework` | Applicable frameworks |
| `EvidenceBCMTest` | BCM test exercises |

### Evidence Enumerations

#### EvidenceType

| Value | Description |
|-------|-------------|
| `DOCUMENT` | General documents |
| `CERTIFICATE` | Certificates (ISO, SOC2, etc.) |
| `REPORT` | Reports |
| `POLICY` | Policy documents |
| `PROCEDURE` | Procedure documents |
| `SCREENSHOT` | Screenshots |
| `LOG` | Log files |
| `CONFIGURATION` | Configuration exports |
| `NETWORK_CAPTURE` | Network packet captures |
| `MEMORY_DUMP` | Memory dumps |
| `DISK_IMAGE` | Disk images |
| `MALWARE_SAMPLE` | Malware samples |
| `EMAIL` | Email evidence |
| `MEETING_NOTES` | Meeting notes |
| `APPROVAL_RECORD` | Approval records |
| `AUDIT_REPORT` | Audit reports |
| `ASSESSMENT_RESULT` | Assessment results |
| `TEST_RESULT` | Test results |
| `SCAN_RESULT` | Scan results |
| `VIDEO` | Video recordings |
| `AUDIO` | Audio recordings |
| `OTHER` | Other types |

#### EvidenceStatus

| Value | Description |
|-------|-------------|
| `PENDING` | Awaiting review |
| `UNDER_REVIEW` | Being reviewed |
| `APPROVED` | Approved and valid |
| `REJECTED` | Rejected |
| `EXPIRED` | Past validity date |
| `ARCHIVED` | Archived |

#### EvidenceClassification

| Value | Description |
|-------|-------------|
| `PUBLIC` | Can be shared externally |
| `INTERNAL` | Internal use only |
| `CONFIDENTIAL` | Restricted distribution |
| `RESTRICTED` | Need-to-know basis |

#### EvidenceSourceType

| Value | Description |
|-------|-------------|
| `MANUAL_UPLOAD` | Manually uploaded |
| `AUTOMATED` | Automated collection |
| `EXTERNAL_SYSTEM` | From external system |
| `VENDOR_PROVIDED` | Provided by vendor |

#### EvidenceRequestStatus

| Value | Description |
|-------|-------------|
| `OPEN` | Request is open |
| `IN_PROGRESS` | Being worked on |
| `SUBMITTED` | Evidence submitted |
| `ACCEPTED` | Evidence accepted |
| `REJECTED` | Evidence rejected |
| `CANCELLED` | Request cancelled |
| `OVERDUE` | Past due date |

#### EvidenceRequestPriority

| Value | Description |
|-------|-------------|
| `LOW` | Low priority |
| `MEDIUM` | Medium priority |
| `HIGH` | High priority |
| `CRITICAL` | Critical priority |

---

## Notes

- All timestamps use UTC timezone
- All monetary amounts use Decimal type with appropriate precision
- JSON fields are used for flexible data structures (arrays, objects)
- Foreign key relationships use `onDelete: Cascade` or `onDelete: SetNull` as appropriate
- Unique constraints are enforced at the database level
- Indexes are optimized for common query patterns

---

**End of Data Dictionary**

