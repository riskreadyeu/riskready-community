# Entities Reference

This document provides a complete reference for all entities in the Organisation Module, including field descriptions, relationships, and usage guidance.

---

## Table of Contents

1. [OrganisationProfile](#organisationprofile)
2. [Department](#department)
3. [DepartmentMember](#departmentmember)
4. [OrganisationalUnit](#organisationalunit)
5. [Location](#location)
6. [ExecutivePosition](#executiveposition)
7. [SecurityChampion](#securitychampion)
8. [KeyPersonnel](#keypersonnel)
9. [BusinessProcess](#businessprocess)
10. [ExternalDependency](#externaldependency)
11. [Regulator](#regulator)
12. [SecurityCommittee](#securitycommittee)
13. [CommitteeMembership](#committeemembership)
14. [CommitteeMeeting](#committeemeeting)
15. [MeetingAttendance](#meetingattendance)
16. [MeetingDecision](#meetingdecision)
17. [MeetingActionItem](#meetingactionitem)
18. [ProductService](#productservice)
19. [TechnologyPlatform](#technologyplatform)
20. [InterestedParty](#interestedparty)
21. [ContextIssue](#contextissue)
22. [ApplicableFramework](#applicableframework)
23. [RegulatoryEligibilitySurvey](#regulatoryeligibilitysurvey)

---

## OrganisationProfile

The core entity representing your organisation and its ISMS configuration.

### Purpose
Captures fundamental organisation information, ISMS scope definition, and certification status. This is the central entity that defines the boundaries of your information security management system.

### Fields

#### Basic Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | Trading/brand name |
| legalName | String | Yes | Registered legal name |
| description | String | No | Organisation description |
| logoUrl | String | No | URL to organisation logo |

#### Industry Information
| Field | Type | Description |
|-------|------|-------------|
| industrySector | String | Primary industry (e.g., Technology, Finance) |
| industrySubsector | String | Specific subsector |
| industryCode | String | Standard industry code (NAICS, SIC) |
| marketPosition | String | Market positioning statement |
| primaryCompetitors | JSON Array | List of main competitors |

#### Financial Information
| Field | Type | Description |
|-------|------|-------------|
| annualRevenue | Decimal | Annual revenue figure |
| revenueCurrency | String | Currency code (default: USD) |
| revenueStreams | JSON Array | Revenue stream breakdown |
| fiscalYearStart | String | Fiscal year start (e.g., "01-01") |
| fiscalYearEnd | DateTime | Fiscal year end date |

#### Employee Information
| Field | Type | Description |
|-------|------|-------------|
| employeeCount | Int | Total employee count |
| employeeCategories | JSON Array | Employee type breakdown |
| employeeLocations | JSON Array | Geographic distribution |
| remoteWorkPercentage | Int | Percentage working remotely |
| size | String | Organisation size category |

#### ISMS Information (Clause 4.3)
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| ismsScope | String | ISMS scope statement | 4.3 |
| ismsPolicy | String | Information security policy | 5.2 |
| ismsObjectives | JSON Array | Security objectives | 6.2 |
| productsServicesInScope | JSON Array | Products/services covered | 4.3 |
| departmentsInScope | JSON Array | Departments covered | 4.3 |
| locationsInScope | JSON Array | Locations covered | 4.3 |
| processesInScope | JSON Array | Processes covered | 4.3 |
| systemsInScope | JSON Array | Systems covered | 4.3 |
| scopeExclusions | String | What is excluded | 4.3 |
| exclusionJustification | String | Why exclusions are valid | 4.3 |
| scopeBoundaries | String | Boundary definitions | 4.3 |

#### ISO Certification
| Field | Type | Description |
|-------|------|-------------|
| isoCertificationStatus | String | not_certified, in_progress, certified |
| certificationBody | String | Certification body name |
| certificationDate | DateTime | Date of certification |
| certificationExpiry | DateTime | Expiry date |
| certificateNumber | String | Certificate reference |
| nextAuditDate | DateTime | Next surveillance/recertification |

#### Risk Management
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| riskAppetite | String | Risk appetite statement | 6.1 |
| riskTolerance | JSON Object | Risk tolerance thresholds | 6.1 |

### Relationships
- Created by User
- Updated by User

### Usage Notes
- Only one active OrganisationProfile should exist per tenant
- ISMS scope fields should be reviewed annually
- Certification dates trigger reminder notifications

---

## Department

Represents organisational departments with hierarchical structure.

### Purpose
Documents the organisational structure, department responsibilities, and data handling characteristics for ISMS scope and control assignment.

### Fields

#### Basic Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | Department name |
| departmentCode | String | Yes | Unique code (e.g., IT, HR, FIN) |
| description | String | No | Department description |

#### Hierarchy
| Field | Type | Description |
|-------|------|-------------|
| parentId | String | Parent department ID |
| parent | Department | Parent department relation |
| children | Department[] | Child departments |

#### Classification
| Field | Type | Description |
|-------|------|-------------|
| departmentCategory | String | Category (management, operations, support) |
| functionType | String | Function type |
| criticalityLevel | String | critical, high, medium, low |

#### Leadership
| Field | Type | Description |
|-------|------|-------------|
| departmentHeadId | String | Department head user ID |
| departmentHead | User | Department head relation |
| deputyHeadId | String | Deputy head user ID |
| deputyHead | User | Deputy head relation |

#### Resources
| Field | Type | Description |
|-------|------|-------------|
| headcount | Int | Number of employees |
| contractorCount | Int | Number of contractors |
| budget | Decimal | Department budget |
| budgetCurrency | String | Currency code |
| costCenter | String | Cost center code |

#### Data Handling (ISMS)
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| handlesPersonalData | Boolean | Processes personal data | GDPR, A.5.34 |
| handlesFinancialData | Boolean | Processes financial data | SOX, A.5.33 |

### Relationships
- Parent/Child departments (hierarchy)
- Department Head (User)
- Members (DepartmentMember[])
- Business Processes
- Security Champions
- External Dependencies

---

## Location

Physical or virtual locations within ISMS scope.

### Purpose
Documents all locations where information is processed, stored, or transmitted, enabling physical security control assignment and scope definition.

### Fields

#### Basic Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | Location name |
| locationCode | String | Yes | Unique code |
| locationType | String | No | headquarters, branch, datacenter, cloud |

#### Address
| Field | Type | Description |
|-------|------|-------------|
| address | String | Street address |
| city | String | City |
| state | String | State/Province |
| country | String | Country |
| postalCode | String | Postal/ZIP code |
| region | String | Geographic region |

#### Physical Security
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| physicalSecurityLevel | String | Security classification | A.7.1 |
| accessControlType | String | Access control method | A.7.2 |
| securityFeatures | JSON Array | Security features list | A.7 |

#### IT Infrastructure
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| isDataCenter | Boolean | Is a data center | A.7.5 |
| hasServerRoom | Boolean | Has server room | A.7.5 |
| networkType | String | Network type | A.8.20 |
| backupPower | Boolean | Has backup power | A.7.11 |

#### ISMS Scope
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| inIsmsScope | Boolean | Included in ISMS scope | 4.3 |
| scopeJustification | String | Reason for inclusion/exclusion | 4.3 |

---

## ExecutivePosition

Executive and senior management positions with security responsibilities.

### Purpose
Documents executive leadership structure, security responsibilities, and authority levels for demonstrating top management commitment (Clause 5.1).

### Fields

| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| title | String | Position title | 5.3 |
| executiveLevel | String | C-level, VP, Director, etc. | 5.1 |
| personId | String | Person holding position | 5.3 |
| reportsToId | String | Reporting line | 5.3 |
| authorityLevel | String | Decision authority | 5.3 |
| securityResponsibilities | String | Security duties | 5.3 |
| riskAuthorityLevel | String | Risk decision authority | 6.1 |
| budgetAuthority | Boolean | Can approve security budget | 7.1 |
| isSecurityCommitteeMember | Boolean | On security committee | 5.1 |
| isCeo | Boolean | Is CEO/MD | 5.1 |

### Relationships
- Reports to (ExecutivePosition)
- Subordinates (ExecutivePosition[])
- Person (User)

---

## KeyPersonnel

Individuals with specific ISMS roles and responsibilities.

### Purpose
Documents personnel with defined ISMS responsibilities, ensuring clear accountability and competence tracking (Clause 5.3, 7.2).

### Fields

| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| personCode | String | Unique identifier | 5.3 |
| name | String | Person's name | 5.3 |
| jobTitle | String | Job title | 5.3 |
| ismsRole | String | ISMS role (CISO, DPO, etc.) | 5.3 |
| securityResponsibilities | String | Specific duties | 5.3 |
| authorityLevel | String | Decision authority | 5.3 |
| backupPersonId | String | Backup/deputy | 5.3 |
| trainingCompleted | Boolean | Training status | 7.2 |
| lastTrainingDate | DateTime | Last training date | 7.2 |
| certifications | JSON Array | Professional certifications | 7.2 |

### Common ISMS Roles
- **ISMS Manager** - Overall ISMS responsibility
- **CISO** - Chief Information Security Officer
- **DPO** - Data Protection Officer
- **Risk Owner** - Risk management oversight
- **Internal Auditor** - Audit function
- **BCM Manager** - Business continuity
- **Incident Manager** - Incident response

---

## SecurityChampion

Departmental security representatives.

### Purpose
Documents the security champion network - individuals who promote security awareness and practices within their departments (Clause 5.3, 7.3).

### Fields

| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| userId | String | Champion user | 5.3 |
| departmentId | String | Department represented | 5.3 |
| championLevel | String | senior, standard, junior | 5.3 |
| responsibilities | String | Specific duties | 5.3 |
| trainingCompleted | Boolean | Champion training status | 7.2 |
| lastTrainingDate | DateTime | Last training date | 7.2 |

### Relationships
- User (the champion)
- Department (represented department)

---

## BusinessProcess

Business processes within ISMS scope.

### Purpose
Documents business processes for understanding information flows, assigning controls, and business continuity planning (Clause 8.1).

### Fields

#### Basic Information
| Field | Type | Description |
|-------|------|-------------|
| name | String | Process name |
| processCode | String | Unique code |
| description | String | Process description |
| processType | String | core, support, management |
| criticalityLevel | String | critical, high, medium, low |

#### Ownership
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| processOwnerId | String | Process owner | 5.3 |
| processManagerId | String | Day-to-day manager | 5.3 |
| departmentId | String | Owning department | 5.3 |
| backupOwnerId | String | Backup owner | 5.3 |

#### Process Details
| Field | Type | Description |
|-------|------|-------------|
| inputs | JSON Array | Process inputs |
| outputs | JSON Array | Process outputs |
| keyActivities | JSON Array | Key activities |
| stakeholders | JSON Array | Stakeholders involved |
| kpis | JSON Array | Key performance indicators |

#### Business Continuity
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| bcpEnabled | Boolean | BCP applicable | A.5.29 |
| bcpCriticality | String | BCP priority | A.5.29 |
| recoveryTimeObjectiveMinutes | Int | RTO in minutes | A.5.29 |
| recoveryPointObjectiveMinutes | Int | RPO in minutes | A.5.29 |
| maximumTolerableDowntimeMinutes | Int | MTD in minutes | A.5.29 |
| minimumStaff | Int | Minimum staff needed | A.5.29 |
| alternateProcesses | String | Workaround options | A.5.29 |
| workaroundProcedures | String | Manual procedures | A.5.29 |

#### Compliance
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| complianceRequirements | JSON Array | Applicable requirements | 4.2 |
| riskRating | String | Risk level | 6.1 |

---

## ExternalDependency

Third-party suppliers, vendors, and service providers.

### Purpose
Documents external dependencies for supplier risk management, ensuring appropriate controls for outsourced processes (Clause 8.1, Annex A.5.19-A.5.23).

### Fields

#### Basic Information
| Field | Type | Description |
|-------|------|-------------|
| name | String | Supplier name |
| dependencyType | String | supplier, vendor, partner, cloud_provider |
| description | String | Service description |
| vendorWebsite | String | Vendor website |

#### Risk Assessment
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| criticalityLevel | String | Criticality rating | A.5.19 |
| businessImpact | String | Impact if unavailable | A.5.19 |
| singlePointOfFailure | Boolean | No alternatives exist | A.5.19 |
| riskRating | String | Overall risk rating | A.5.19 |
| lastAssessmentDate | DateTime | Last assessment | A.5.19 |

#### Contract Information
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| contractReference | String | Contract number | A.5.20 |
| contractStart | DateTime | Contract start date | A.5.20 |
| contractEnd | DateTime | Contract end date | A.5.20 |
| annualCost | Decimal | Annual cost | A.5.20 |
| slaDetails | JSON Object | SLA terms | A.5.20 |

#### Data Processing
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| dataProcessed | JSON Array | Types of data processed | A.5.21 |
| dataLocation | String | Where data is stored | A.5.21 |
| complianceCertifications | JSON Array | Vendor certifications | A.5.21 |

#### Contingency
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| alternativeProviders | JSON Array | Backup suppliers | A.5.22 |
| exitStrategy | String | Exit plan | A.5.23 |
| dataRecoveryProcedure | String | Data retrieval process | A.5.23 |

---

## SecurityCommittee

Governance committees for ISMS oversight.

### Purpose
Documents security governance committees for management review and decision-making (Clause 5.1, 9.3).

### Fields

| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| name | String | Committee name | 9.3 |
| committeeType | String | steering, operational, risk | 9.3 |
| description | String | Committee purpose | 9.3 |
| chairId | String | Committee chair | 9.3 |
| authorityLevel | String | Decision authority | 5.1 |
| meetingFrequency | String | How often meets | 9.3 |
| nextMeetingDate | DateTime | Next scheduled meeting | 9.3 |
| establishedDate | DateTime | When formed | 9.3 |

### Relationships
- Chair (User)
- Memberships (CommitteeMembership[])
- Meetings (CommitteeMeeting[])

---

## CommitteeMeeting

Records of committee meetings.

### Purpose
Documents management review meetings with agenda, minutes, and outcomes (Clause 9.3).

### Fields

#### Basic Information
| Field | Type | Description |
|-------|------|-------------|
| committeeId | String | Parent committee |
| meetingNumber | String | Meeting reference |
| title | String | Meeting title |
| meetingType | String | regular, extraordinary, emergency |

#### Scheduling
| Field | Type | Description |
|-------|------|-------------|
| meetingDate | DateTime | Date of meeting |
| startTime | String | Start time |
| endTime | String | End time |
| durationMinutes | Int | Duration |

#### Location
| Field | Type | Description |
|-------|------|-------------|
| locationType | String | virtual, physical, hybrid |
| physicalLocation | String | Physical venue |
| virtualMeetingLink | String | Video conference link |

#### Content
| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| agenda | String | Meeting agenda | 9.3 |
| objectives | String | Meeting objectives | 9.3 |
| minutes | String | Meeting minutes | 9.3 |
| attachments | JSON Array | Supporting documents | 7.5 |

#### Quorum
| Field | Type | Description |
|-------|------|-------------|
| expectedAttendeesCount | Int | Expected attendees |
| actualAttendeesCount | Int | Actual attendees |
| quorumAchieved | Boolean | Quorum met |
| quorumRequirement | Int | Required for quorum |

### Relationships
- Committee (SecurityCommittee)
- Chair (User)
- Secretary (User)
- Attendances (MeetingAttendance[])
- Decisions (MeetingDecision[])
- Action Items (MeetingActionItem[])

---

## MeetingDecision

Formal decisions made in committee meetings.

### Purpose
Documents decisions with voting records and implementation tracking (Clause 9.3, 10.1).

### Fields

| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| meetingId | String | Parent meeting | 9.3 |
| decisionNumber | String | Decision reference | 9.3 |
| title | String | Decision title | 9.3 |
| description | String | Decision details | 9.3 |
| decisionType | String | policy, procedure, resource, risk | 9.3 |
| rationale | String | Reasoning | 9.3 |
| voteType | String | majority, unanimous, consensus | 9.3 |
| votesFor | Int | Votes in favor | 9.3 |
| votesAgainst | Int | Votes against | 9.3 |
| votesAbstain | Int | Abstentions | 9.3 |
| responsiblePartyId | String | Implementation owner | 10.1 |
| implementationDeadline | DateTime | Due date | 10.1 |
| implemented | Boolean | Implementation status | 10.1 |
| implementationDate | DateTime | When implemented | 10.1 |
| implementationNotes | String | Implementation details | 10.1 |

---

## MeetingActionItem

Action items arising from meetings.

### Purpose
Tracks actions to completion, ensuring follow-through on committee decisions (Clause 10.1).

### Fields

| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| meetingId | String | Parent meeting | 10.1 |
| actionNumber | String | Action reference | 10.1 |
| title | String | Action title | 10.1 |
| description | String | Action details | 10.1 |
| assignedToId | String | Assigned person | 10.1 |
| assignedById | String | Who assigned | 10.1 |
| priority | String | high, medium, low | 10.1 |
| dueDate | DateTime | Due date | 10.1 |
| status | String | open, in_progress, completed, cancelled | 10.1 |
| progressPercentage | Int | Completion percentage | 10.1 |
| completionDate | DateTime | When completed | 10.1 |
| completionNotes | String | Completion details | 10.1 |
| requiresCommitteeReview | Boolean | Needs review | 10.1 |
| reviewed | Boolean | Review status | 10.1 |

---

## InterestedParty

Stakeholders with security requirements.

### Purpose
Documents interested parties and their requirements for ISMS scope and control determination (Clause 4.2).

### Fields

| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| partyCode | String | Unique identifier | 4.2 |
| name | String | Party name | 4.2 |
| partyType | String | customer, employee, regulator, etc. | 4.2 |
| description | String | Description | 4.2 |
| expectations | String | What they expect | 4.2 |
| requirements | String | Their requirements | 4.2 |
| informationNeeds | JSON Array | Information needs | 4.2 |
| powerLevel | String | high, medium, low | 4.2 |
| interestLevel | String | high, medium, low | 4.2 |
| influenceLevel | String | Influence rating | 4.2 |
| engagementStrategy | String | How to engage | 4.2 |
| communicationMethod | String | Communication channel | 7.4 |
| communicationFrequency | String | How often | 7.4 |
| ismsRelevance | String | Relevance to ISMS | 4.2 |
| securityExpectations | String | Security requirements | 4.2 |

---

## ContextIssue

Internal and external issues affecting the ISMS.

### Purpose
Documents context issues for risk identification and ISMS planning (Clause 4.1).

### Fields

| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| issueCode | String | Unique identifier | 4.1 |
| issueType | String | internal, external | 4.1 |
| category | String | technological, regulatory, etc. | 4.1 |
| title | String | Issue title | 4.1 |
| description | String | Issue description | 4.1 |
| impactType | String | Type of impact | 4.1 |
| impactLevel | String | high, medium, low | 4.1 |
| likelihood | String | Probability | 4.1 |
| ismsRelevance | String | How it affects ISMS | 4.1 |
| affectedAreas | JSON Array | Areas impacted | 4.1 |
| controlImplications | String | Control considerations | 4.1 |
| responseStrategy | String | How addressing | 4.1 |
| mitigationActions | JSON Array | Actions taken | 4.1 |
| monitoringFrequency | String | Review frequency | 4.1 |
| lastReviewDate | DateTime | Last reviewed | 4.1 |
| nextReviewDate | DateTime | Next review | 4.1 |
| trendDirection | String | improving, stable, worsening | 4.1 |
| status | String | active, resolved, monitoring | 4.1 |
| escalatedToRisk | Boolean | Escalated to risk register | 6.1 |
| linkedRiskId | String | Related risk ID | 6.1 |

---

## ApplicableFramework

Standards, regulations, and frameworks applicable to the organisation.

### Purpose
Documents applicable compliance frameworks and tracks certification/compliance status (Clause 4.2, 8.1).

### Fields

| Field | Type | Description | ISO Reference |
|-------|------|-------------|---------------|
| frameworkCode | String | Unique code | 4.2 |
| name | String | Framework name | 4.2 |
| frameworkType | String | standard, regulation, framework | 4.2 |
| description | String | Description | 4.2 |
| version | String | Version number | 4.2 |
| isApplicable | Boolean | Applies to organisation | 4.2 |
| applicabilityReason | String | Why applicable | 4.2 |
| applicabilityDate | DateTime | When became applicable | 4.2 |
| complianceStatus | String | compliant, partial, non_compliant | 8.1 |
| compliancePercentage | Int | Compliance level | 8.1 |
| lastAssessmentDate | DateTime | Last assessed | 9.1 |
| nextAssessmentDate | DateTime | Next assessment | 9.1 |
| supervisoryAuthority | String | Regulatory body | 4.2 |
| registrationNumber | String | Registration reference | 4.2 |
| isCertifiable | Boolean | Can be certified | 4.2 |
| certificationStatus | String | Certification state | 4.2 |
| certificationBody | String | Certifier | 4.2 |
| certificateNumber | String | Certificate reference | 4.2 |
| certificationDate | DateTime | When certified | 4.2 |
| certificationExpiry | DateTime | Expiry date | 4.2 |
| keyRequirements | JSON Array | Key requirements | 4.2 |

---

## Common Field Patterns

### Audit Trail Fields
All entities include:
```
id          String   @id @default(cuid())
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
createdById String?
updatedById String?
```

### Status Fields
Most entities include:
```
isActive    Boolean  @default(true)
startDate   DateTime?
endDate     DateTime?
```

### ISMS Scope Fields
Scope-relevant entities include:
```
inIsmsScope        Boolean  @default(true)
scopeJustification String?
```
