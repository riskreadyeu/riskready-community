# Organisation MCP Server - Tool Reference

Complete reference for all 40 tools exposed by the Organisation MCP server.

## Organisation Profile Tools

### get_org_profile

Get complete organisation profile with related counts.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | No | First org | Organisation ID (optional, will use first if not provided) |

**Returns:** Organisation profile with selected risk appetite, counts of risks, controls, and policy documents.

---

### get_org_calibration

Get organisation calibration profile including risk calculation baseline factors.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | No | First org | Organisation ID (optional, will use first if not provided) |

**Returns:** Risk calibration configuration including stack type, security maturity, baseline F2/F3 factors, impact thresholds, and calibration timestamps.

---

### get_org_regulatory_profile

Get organisation regulatory profile including DORA and NIS2 applicability.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | No | First org | Organisation ID (optional, will use first if not provided) |

**Returns:** Regulatory compliance configuration including DORA entity type, NIS2 classification, supervisory authority details, and assessment references.

---

### get_org_isms_scope

Get organisation ISMS scope definition per ISO 27001 Clause 4.3.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | No | First org | Organisation ID (optional, will use first if not provided) |

**Returns:** ISMS scope statement, policy, objectives, in-scope entities, exclusions with justifications, boundaries, and ISO certification details.

---

## Department & Organisational Unit Tools

### list_departments

List departments with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| departmentCategory | string | No | None | Filter by department category |
| isActive | boolean | No | None | Filter by active status |
| parentId | string | No | None | Filter by parent department ID |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of departments with department code, category, active status, parent ID, department head, and counts of members, business processes, and security champions.

---

### get_department

Get detailed department information with relations.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Department ID |

**Returns:** Complete department details including head, deputy head, members with users, business processes, security champions, children, and parent department.

---

### list_org_units

List organisational units with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| unitType | string | No | None | Filter by unit type |
| isActive | boolean | No | None | Filter by active status |
| parentId | string | No | None | Filter by parent unit ID |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of organisational units with code, unit type, active status, parent ID, head, and child count.

---

### get_org_unit

Get detailed organisational unit information with relations.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Organisational unit ID |

**Returns:** Complete unit details including head, parent, children, created by, and updated by users.

---

## Location Tools

### list_locations

List locations with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| locationType | string | No | None | Filter by location type |
| country | string | No | None | Filter by country |
| inIsmsScope | boolean | No | None | Filter by ISMS scope inclusion |
| isActive | boolean | No | None | Filter by active status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of locations with location code, name, type, city, country, region, ISMS scope status, employee count, and physical security level.

---

### get_location

Get detailed location information.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Location ID |

**Returns:** Complete location details including address, coordinates, facility information, and scope justification.

---

## Business Process Tools

### list_business_processes

List business processes with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| processType | string | No | None | Filter by process type |
| criticalityLevel | string | No | None | Filter by criticality level |
| biaStatus | string | No | None | Filter by BIA status (pending, in_progress, completed) |
| bcpEnabled | boolean | No | None | Filter by BCP enabled status |
| departmentId | string | No | None | Filter by department ID |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of business processes with process code, type, criticality, BIA status, BCP enablement, department, process owner, and counts of sub-processes and BIA assessments.

---

### get_business_process

Get detailed business process information with relations.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Business process ID |

**Returns:** Complete process details including process owner, process manager, department, sub-processes, parent process, backup owner, and recent BIA assessment history (last 5).

---

### get_bia_history

Get BIA assessment history for a business process.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| processId | string | Yes | None | Business process ID |

**Returns:** Complete BIA assessment history including assessment type, snapshot data, assessed by user, and creation timestamps.

---

## Personnel Tools

### list_executives

List executive positions with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| executiveLevel | string | No | None | Filter by executive level |
| isActive | boolean | No | None | Filter by active status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of executive positions with title, executive level, active status, CEO flag, security committee membership, person details, reports to, and subordinate count.

---

### get_executive

Get detailed executive position information with relations.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Executive position ID |

**Returns:** Complete executive details including person, reports to with person details, and subordinates with person details.

---

### list_key_personnel

List key personnel with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ismsRole | string | No | None | Filter by ISMS role |
| isActive | boolean | No | None | Filter by active status |
| departmentId | string | No | None | Filter by department ID |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of key personnel with person code, name, job title, ISMS role, active status, email, and linked user account.

---

### get_key_personnel

Get detailed key personnel information with relations.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Key personnel ID |

**Returns:** Complete personnel details including user account and backup person.

---

### list_security_champions

List security champions with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| departmentId | string | No | None | Filter by department ID |
| trainingCompleted | boolean | No | None | Filter by training completion status |
| isActive | boolean | No | None | Filter by active status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of security champions with champion level, training completion status, last training date, active status, user details, and department.

---

### get_security_champion

Get detailed security champion information with relations.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Security champion ID |

**Returns:** Complete security champion details including user account and department.

---

## Stakeholder Tools

### list_interested_parties

List interested parties (stakeholders) with filtering and pagination per ISO 27001 Clause 4.2.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| partyType | string | No | None | Filter by party type |
| powerLevel | string | No | None | Filter by power level |
| interestLevel | string | No | None | Filter by interest level |
| isActive | boolean | No | None | Filter by active status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of interested parties with name, party type, power level, interest level, requirements, expectations, communication preferences, and active status.

---

### get_interested_party

Get detailed interested party information.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Interested party ID |

**Returns:** Complete interested party details including engagement strategy and satisfaction metrics.

---

### list_context_issues

List context issues per ISO 27001 Clause 4.1 with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| issueType | string | No | None | Filter by issue type (internal/external) |
| category | string | No | None | Filter by category |
| status | string | No | None | Filter by status |
| isActive | boolean | No | None | Filter by active status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of context issues with issue code, issue type, category, title, description, impact level, status, and review dates.

---

### get_context_issue

Get detailed context issue information.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Context issue ID |

**Returns:** Complete context issue details including PESTLE categorization, risk linkages, and mitigation actions.

---

### list_regulators

List regulators with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| regulatorType | string | No | None | Filter by regulator type |
| jurisdiction | string | No | None | Filter by jurisdiction |
| isActive | boolean | No | None | Filter by active status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of regulators with name, regulator type, jurisdiction, contact information, and active status.

---

### get_regulator

Get detailed regulator information.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Regulator ID |

**Returns:** Complete regulator details including reporting requirements and submission schedules.

---

## Framework Tools

### list_applicable_frameworks

List applicable frameworks with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| frameworkType | string | No | None | Filter by framework type |
| isApplicable | boolean | No | None | Filter by applicability |
| complianceStatus | string | No | None | Filter by compliance status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of applicable frameworks with framework code, name, type, applicability, compliance status, compliance percentage, and assessment dates.

---

### get_applicable_framework

Get detailed applicable framework information.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Applicable framework ID |

**Returns:** Complete framework details including control mappings, certification information, and gap analysis.

---

### list_regulatory_surveys

List regulatory eligibility surveys with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| surveyType | string | No | None | Filter by survey type (DORA, NIS2) |
| status | string | No | None | Filter by survey status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of regulatory surveys with survey type, version, status, completion date, applicability determination, entity classification, regulatory regime, and response count.

---

### get_regulatory_survey

Get detailed regulatory survey with responses.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Regulatory survey ID |

**Returns:** Complete survey details including all questions and responses ordered by sort order.

---

## Governance Tools

### list_security_committees

List security committees with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| committeeType | string | No | None | Filter by committee type |
| isActive | boolean | No | None | Filter by active status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of security committees with name, committee type, active status, meeting frequency, next meeting date, chair details, and counts of memberships and meetings.

---

### get_security_committee

Get detailed security committee information with relations.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Security committee ID |

**Returns:** Complete committee details including chair, all memberships with user details, and recent 10 meetings with basic info.

---

### list_committee_meetings

List committee meetings with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| committeeId | string | No | None | Filter by committee ID |
| status | string | No | None | Filter by meeting status |
| dateFrom | string | No | None | Filter by meeting date from (ISO 8601 format) |
| dateTo | string | No | None | Filter by meeting date to (ISO 8601 format) |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of committee meetings with title, meeting date, start/end time, status, meeting type, committee details, and chair.

---

### get_committee_meeting

Get detailed committee meeting information with relations.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Committee meeting ID |

**Returns:** Complete meeting details including committee, chair, secretary, all attendances with members, decisions, and action items with assignees.

---

### list_meeting_action_items

List meeting action items with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | None | Filter by action status |
| assignedToId | string | No | None | Filter by assigned user ID |
| overdue | boolean | No | None | Filter for overdue items |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of action items with title, status, priority, due date, progress percentage, meeting with committee details, and assigned to user.

---

### get_meeting_action_item

Get detailed meeting action item information with relations.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Meeting action item ID |

**Returns:** Complete action item details including meeting with committee, assigned to user, assigned by user, dependencies (depends on and dependent items).

---

## Catalog Tools

### list_products_services

List products and services with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| productType | string | No | None | Filter by product type |
| category | string | No | None | Filter by category |
| lifecycleStage | string | No | None | Filter by lifecycle stage |
| inIsmsScope | boolean | No | None | Filter by ISMS scope inclusion |
| isActive | boolean | No | None | Filter by active status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of products/services with product code, name, product type, category, lifecycle stage, ISMS scope status, and active status.

---

### get_product_service

Get detailed product or service information.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Product/service ID |

**Returns:** Complete product/service details including target customers, revenue data, and security classifications.

---

### list_technology_platforms

List technology platforms with filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| platformType | string | No | None | Filter by platform type |
| criticalityLevel | string | No | None | Filter by criticality level |
| inIsmsScope | boolean | No | None | Filter by ISMS scope inclusion |
| isActive | boolean | No | None | Filter by active status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** List of technology platforms with platform code, name, platform type, criticality level, ISMS scope status, and active status.

---

### get_technology_platform

Get detailed technology platform information.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | None | Technology platform ID |

**Returns:** Complete platform details including technical specifications, vendor information, and usage metrics.

---

## Analysis Tools

### get_org_stats

Get aggregate organisation statistics across all entities.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | No | First org | Organisation ID (optional, will use first if not provided) |

**Returns:** Aggregate counts for departments, locations, business processes, key personnel, executives, security champions, applicable frameworks, products/services, technology platforms, security committees, and context issues.

---

### get_org_dashboard

Get organisation dashboard with key metrics and activity.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | No | First org | Organisation ID (optional, will use first if not provided) |

**Returns:** Dashboard metrics including BIA completion rate, committee meetings last 90 days, action items (open/overdue/completed), and framework compliance rate.

---

### get_isms_scope_summary

Get ISMS scope summary comparing in-scope vs out-of-scope entities.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | No | First org | Organisation ID (optional, will use first if not provided) |

**Returns:** Scope summary with in-scope vs out-of-scope counts and percentages for locations, products/services, and technology platforms.

---

## Mutation Tools

All mutation tools create pending actions in the approval queue rather than executing changes directly.

### propose_update_org_profile

Propose an update to the organisation profile (goes to approval queue).

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | None | Organisation ID to update |
| fields | string | Yes | None | JSON object of fields to update (e.g. {"name": "New Name", "description": "Updated"}) |
| reason | string | Yes | None | Reason for the proposed update |
| mcpSessionId | string | No | None | MCP session ID for tracking |

**Returns:** Pending action status with action ID and message.

---

### propose_department

Propose creation of a new department (goes to approval queue).

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | None | Organisation ID |
| name | string | Yes | None | Department name |
| departmentCode | string | Yes | None | Unique department code |
| description | string | No | None | Department description |
| departmentCategory | string | No | None | Department category |
| parentId | string | No | None | Parent department ID |
| reason | string | Yes | None | Reason for creating this department |
| mcpSessionId | string | No | None | MCP session ID for tracking |

**Returns:** Pending action status with action ID and message.

---

### propose_context_issue

Propose creation of a context issue per ISO 27001 Clause 4.1.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | None | Organisation ID |
| issueCode | string | Yes | None | Unique issue code |
| issueType | string | Yes | None | Issue type (internal/external) |
| category | string | Yes | None | Issue category |
| title | string | Yes | None | Issue title |
| description | string | No | None | Issue description |
| impactLevel | string | No | None | Impact level |
| reason | string | Yes | None | Reason for creating this context issue |
| mcpSessionId | string | No | None | MCP session ID for tracking |

**Returns:** Pending action status with action ID and message.

---

### propose_framework_assessment

Propose an update to framework compliance assessment.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| frameworkId | string | Yes | None | Applicable framework ID |
| complianceStatus | string | Yes | None | Compliance status |
| compliancePercentage | number | No | None | Compliance percentage (0-100) |
| reason | string | Yes | None | Reason for the assessment update |
| mcpSessionId | string | No | None | MCP session ID for tracking |

**Returns:** Pending action status with action ID and message.

---

### propose_location

Propose creation of a new location (goes to approval queue).

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | None | Organisation ID |
| name | string | Yes | None | Location name |
| locationType | string | Yes | None | Location type (HEAD_OFFICE, BRANCH_OFFICE, DATA_CENTER, CLOUD_REGION, DISASTER_RECOVERY, REMOTE) |
| address | string | No | None | Physical address |
| city | string | No | None | City |
| country | string | No | None | Country |
| inScope | boolean | No | true | Whether location is in scope |
| reason | string | Yes | None | Reason for creating this location |
| mcpSessionId | string | No | None | MCP session ID for tracking |

**Returns:** Pending action status with action ID and message.

---

### propose_interested_party

Propose creation of a new interested party (goes to approval queue).

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | None | Organisation ID |
| name | string | Yes | None | Interested party name |
| type | string | Yes | None | Party type (CUSTOMER, SUPPLIER, REGULATOR, SHAREHOLDER, EMPLOYEE, PARTNER, GOVERNMENT, INDUSTRY_BODY) |
| influence | string | Yes | None | Influence level (HIGH, MEDIUM, LOW) |
| requirements | string | No | None | Party requirements |
| expectations | string | No | None | Party expectations |
| reason | string | Yes | None | Reason for creating this interested party |
| mcpSessionId | string | No | None | MCP session ID for tracking |

**Returns:** Pending action status with action ID and message.
