# Organisation MCP Server

**Server name**: `riskready-organisation`
**Package**: `apps/mcp-server-organisation`
**Version**: 0.1.0

Manages organisation profile, departments, locations, business processes, external dependencies, governance committees, and regulatory context.

## Query Tools (19)

### Organisation Profile (2)

| Tool | Description |
|------|-------------|
| `get_organisation_profile` | Full organisation profile with ISMS scope and regulatory profile. |
| `get_regulatory_profile` | DORA and NIS2 applicability, entity type, regime, supervisory authority. |

### Structure (5)

| Tool | Description |
|------|-------------|
| `list_departments` | Departments with active status filter. Paginated. |
| `get_department` | Single department with head, deputy head, parent/children hierarchy, member counts. |
| `list_locations` | Locations with active status and country filters. Paginated. |
| `get_location` | Single location with type, city, country, data center status, ISMS scope flag. |
| `list_key_personnel` | Key ISMS personnel with roles, authority levels, training status, backup info. |

### Processes (4)

| Tool | Description |
|------|-------------|
| `list_business_processes` | Processes with filters: criticality, BIA status, BCP enablement. Paginated. |
| `get_business_process` | Single process with BIA, BCP, dependencies, owner, manager, department. |
| `list_external_dependencies` | External dependencies (vendors/suppliers) with type and criticality filters. |
| `get_external_dependency` | Single dependency with departments/processes using it. |

### Governance (5)

| Tool | Description |
|------|-------------|
| `list_committees` | Security committees with active status and type filters. |
| `get_committee` | Single committee with chair, members, roles, voting rights, meeting count. |
| `list_committee_meetings` | Meetings for a committee with status filter. |
| `get_committee_meeting` | Single meeting with attendees, decisions, votes, action items. |
| `list_meeting_action_items` | Action items across all meetings with status and assignee filters. |

### Reference (4)

| Tool | Description |
|------|-------------|
| `list_regulators` | Regulators with type, jurisdiction, active status filters. |
| `list_applicable_frameworks` | Regulatory and compliance frameworks with applicability and compliance status. |
| `list_context_issues` | Context issues (ISO 27001 Clause 4.1): internal and external issues affecting the ISMS. |
| `list_interested_parties` | Interested parties (ISO 27001 Clause 4.2): stakeholders and their requirements. |

### Analysis (3)

| Tool | Description |
|------|-------------|
| `get_org_dashboard` | Dashboard summary: departments, locations, processes, committees, personnel counts. |
| `get_bia_summary` | BIA completion rates, criticality distribution, recovery objectives. |
| `get_governance_activity_report` | Recent meetings, open action items, upcoming meetings. |

## Mutation Tools (13)

All mutations create pending actions requiring human approval.

### Profile (1)

| Tool | Description |
|------|-------------|
| `propose_update_org_profile` | Update organisation profile. See [parameter details](#propose_update_org_profile-parameters) below. |

#### `propose_update_org_profile` parameters

All fields are optional.

| Category | Parameters |
|----------|------------|
| General | name, description, employeeCount, ismsScope, riskAppetite, stackType, securityMaturity, riskPhilosophy |
| Identity | legalName, industrySector, industrySubsector, size, foundedYear, website, contactEmail, contactPhone |
| Registration | registrationNumber, taxIdentification, naceCode |
| ISMS | ismsPolicy, ismsObjectives (JSON), scopeExclusions, exclusionJustification |
| Certification | isoCertificationStatus, certificationBody, certificationDate, certificationExpiry, certificateNumber, nextAuditDate |
| Regulatory | isDoraApplicable, doraEntityType, doraRegime, isNis2Applicable, nis2EntityClassification, nis2Sector, nis2AnnexType |
| Risk | riskTolerance (JSON), riskAcceptanceThreshold, maxTolerableDowntime |

### Structure (4)

| Tool | Description |
|------|-------------|
| `propose_create_department` | Create a department. See [parameter details](#propose_create_department-parameters) below. |
| `propose_update_department` | Update a department. Accepts departmentId + all create fields (all optional). |
| `propose_create_location` | Create a location. See [parameter details](#propose_create_location-parameters) below. |
| `propose_update_location` | Update a location. Accepts locationId + all create fields (all optional). |

#### `propose_create_department` parameters

**Required**: `name`, `departmentCode`

| Category | Parameters |
|----------|------------|
| General | description, departmentCategory, criticalityLevel, parentId |
| Management | functionType, departmentHeadId, deputyHeadId |
| Operations | headcount, costCenter, contactEmail, contactPhone, establishedDate |
| Data handling | handlesPersonalData, handlesFinancialData |

#### `propose_create_location` parameters

**Required**: `name`

| Category | Parameters |
|----------|------------|
| General | locationCode, locationType, address, city, country, state, postalCode, region, timezone |
| ISMS scope | inIsmsScope, isDataCenter, scopeJustification |
| Operations | employeeCount, isActive |
| Physical security | physicalSecurityLevel, accessControlType, hasServerRoom |
| Infrastructure | backupPower, networkType |

### Processes (4)

| Tool | Description |
|------|-------------|
| `propose_create_business_process` | Create a process. See [parameter details](#propose_create_business_process-parameters) below. |
| `propose_update_business_process` | Update a process. Accepts processId + all create fields (all optional). |
| `propose_create_external_dependency` | Create a vendor/supplier dependency. See [parameter details](#propose_create_external_dependency-parameters) below. |
| `propose_update_external_dependency` | Update a dependency: dependencyId, name, description, criticalityLevel, dependencyType, contractEnd, contractReference, annualCost, dataLocation, primaryContact, riskRating |

#### `propose_create_business_process` parameters

**Required**: `name`, `processCode`, `processType`

| Category | Parameters |
|----------|------------|
| General | description, criticalityLevel, departmentId, isActive |
| Ownership | processOwnerId, processManagerId |
| Operations | frequency, automationLevel, parentProcessId |
| BIA/BCP | biaStatus, bcpEnabled, bcpCriticality |
| Recovery | recoveryTimeObjectiveMinutes, recoveryPointObjectiveMinutes, maximumTolerableDowntimeMinutes |

#### `propose_create_external_dependency` parameters

**Required**: `name`, `dependencyType`, `description`, `criticalityLevel`, `contractStart`, `contractEnd`, `contactEmail`

| Category | Parameters |
|----------|------------|
| General | singlePointOfFailure, riskRating |
| Vendor | vendorWebsite, primaryContact, contactPhone |
| Contract | contractReference, annualCost, exitStrategy |
| Data | dataLocation |

### Governance (3)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_committee` | name, committeeType, description, meetingFrequency, establishedDate, chairId, authorityLevel, isActive |
| `propose_update_committee` | committeeId, name, description, meetingFrequency, isActive, chairId, authorityLevel, committeeType |
| `propose_create_meeting` | committeeId, title, meetingDate, startTime, endTime, locationType, agenda, meetingType, physicalLocation, virtualMeetingLink, objectives, status, quorumRequirement |

## Resources (4)

| URI | Description |
|-----|-------------|
| `organisation://iso27001-context` | ISO 27001 context requirements (Clauses 4.1-4.4) |
| `organisation://isms-scope` | ISMS scope definition guidance |
| `organisation://governance-structure` | Governance structure: committees, personnel, reporting lines |
| `organisation://data-integrity` | Anti-hallucination guidance for AI consumers |

## Prompts (3)

| Prompt | Description |
|--------|-------------|
| `isms-scope-review` | Review ISMS scope: departments, locations, processes, exclusions |
| `context-analysis` | Analyze organisation context per ISO 27001 Clauses 4.1 and 4.2 |
| `governance-assessment` | Assess governance effectiveness: committee activity, action completion, meeting cadence |
