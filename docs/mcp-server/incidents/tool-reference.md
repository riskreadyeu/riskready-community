# Incidents MCP Server - Tool Reference

Complete reference for all 21 tools provided by the Incidents MCP server.

## Incidents

### list_incidents

List incidents with filtering by severity, status, category, source, handler, organisation, and date range. Returns paginated results with affected assets and timeline counts.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| severity | string | No | - | Filter by severity: CRITICAL, HIGH, MEDIUM, LOW |
| status | string | No | - | Filter by status: DETECTED, TRIAGED, INVESTIGATING, CONTAINING, ERADICATING, RECOVERING, POST_INCIDENT, CLOSED |
| category | string | No | - | Filter by category: MALWARE, PHISHING, DENIAL_OF_SERVICE, DATA_BREACH, UNAUTHORIZED_ACCESS, INSIDER_THREAT, PHYSICAL, SUPPLY_CHAIN, SYSTEM_FAILURE, CONFIGURATION_ERROR, OTHER |
| source | string | No | - | Filter by source: SIEM, USER_REPORT, THREAT_INTEL, AUTOMATED, THIRD_PARTY, REGULATOR, VULNERABILITY_SCAN, PENETRATION_TEST, OTHER |
| handlerId | string | No | - | Filter by handler user UUID |
| organisationId | string | No | - | Filter by organisation UUID |
| dateFrom | string | No | - | Filter by detectedAt >= ISO date |
| dateTo | string | No | - | Filter by detectedAt <= ISO date |
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated list with total count, page metadata, and results containing incident summary with counts of affected assets, timeline entries, and notifications.

### get_incident

Get detailed incident information by ID including reporter, handler, incident manager, incident type, attack vector, NIS2/DORA assessments, affected assets, timeline, communications, lessons learned, and control/scenario links.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Incident UUID |

**Returns**: Complete incident record with all related entities including:
- Reporter, handler, incident manager user details
- Incident type and attack vector
- NIS2 and DORA regulatory assessments
- Affected assets with asset details
- Timeline entries (last 30)
- Communications (last 20)
- Lessons learned
- Notifications (next 10 upcoming)
- Control links with control details
- Risk scenario links with scenario details

### search_incidents

Search incidents by text in title, description, or reference number. Case-insensitive search.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search query text |
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated search results with total count, page metadata, query, and incident summaries matching the search text.

## Timeline

### get_incident_timeline

Get timeline entries for an incident showing status changes, actions taken, communications, evidence collection, escalations, and findings.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| incidentId | string | Yes | - | Incident UUID |
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated timeline entries with total count, including entry type, timestamp, description, details, and createdBy user information.

### get_incident_communications

Get communications for an incident showing internal and external communications with customers, vendors, regulators, law enforcement, and other parties.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| incidentId | string | Yes | - | Incident UUID |
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated communications with total count, including communication type, direction, target audience, message content, occurred timestamp, and createdBy user information.

### get_incident_evidence_items

Get evidence items collected for an incident including logs, screenshots, memory dumps, disk images, network captures, malware samples, emails, and documents.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| incidentId | string | Yes | - | Incident UUID |
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated evidence items with total count, including evidence type, description, file path, hash values (SHA256, MD5), collection timestamp, chain of custody, and collectedBy user information.

### get_incident_lessons_learned

Get lessons learned from an incident with observations, recommendations, corrective actions, and implementation status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| incidentId | string | Yes | - | Incident UUID |
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated lessons learned ordered by priority, including category (DETECTION, RESPONSE, COMMUNICATION, TECHNICAL, PROCESS), observation, recommendation, priority, status, assignedTo and createdBy user information.

### get_incident_relations

Get related incidents showing duplicate, related, caused-by, and child-of relationships.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| incidentId | string | Yes | - | Incident UUID |
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated incident relations with total count, including relation type and details of both source and related incidents (reference number, title, severity, status).

## Assessments

### get_nis2_assessment

Get NIS2 assessment for an incident including significance determination, criteria evaluation, and reporting deadlines.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| incidentId | string | Yes | - | Incident UUID |

**Returns**: NIS2 assessment record including:
- isSignificantIncident flag
- Criteria evaluation: severeOperationalDisruption, financialLoss (amount/currency), affectedPersons (count), materialDamage
- crossBorderImpact flag and affected member states
- CSIRT details and reporting status
- Reporting deadlines: earlyWarningDue, notificationDue, finalReportDue
- Incident summary

### get_dora_assessment

Get DORA assessment for an incident including major incident classification, 7-criteria evaluation, and reporting status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| incidentId | string | Yes | - | Incident UUID |

**Returns**: DORA assessment record including:
- isMajorIncident flag
- 7 criteria evaluation:
  - criterion1ClientsAffected (count/percentage)
  - criterion2ReputationalImpact (media coverage type, complaints count)
  - criterion3Duration (downtime hours, recovery hours)
  - criterion4GeographicSpread (affected member states)
  - criterion5DataLoss (type, records affected, personal data flag)
  - criterion6EconomicImpact (costs, CET1 percentage)
  - criterion7TransactionsAffected (count/value/percentage)
- criteriaBreachedCount
- Third-party provider involvement (if applicable)
- Reporting status
- Incident summary

### list_significant_incidents

List NIS2 significant incidents with their assessment details and reporting status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated list of NIS2 assessments where isSignificantIncident is true, ordered by creation date descending, with incident summaries.

### list_major_dora_incidents

List DORA major incidents with their assessment details and reporting status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated list of DORA assessments where isMajorIncident is true, ordered by creation date descending, with incident summaries.

## Notifications

### list_notifications

List incident notifications with filtering by incident, status, and framework. Includes authority details.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| incidentId | string | No | - | Filter by incident UUID |
| status | string | No | - | Filter by status: PENDING, PENDING_APPROVAL, SUBMITTED, ACKNOWLEDGED, ADDITIONAL_INFO_REQUESTED, CLOSED, OVERDUE |
| framework | string | No | - | Filter by framework: ISO27001, NIS2, DORA, GDPR, LOCAL_REGULATION |
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated notifications ordered by due date ascending, including notification type, framework, due date, submission date, status, incident summary, and regulatory authority details.

### get_overdue_notifications

Get incident notifications that are overdue (status PENDING or PENDING_APPROVAL with dueAt in the past).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated overdue notifications ordered by due date ascending, including incident severity, notification details, and authority information.

### list_regulatory_authorities

List regulatory authorities with filtering by country, authority type, and active status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| countryCode | string | No | - | Filter by ISO 2-letter country code |
| authorityType | string | No | - | Filter by type: CSIRT, COMPETENT_AUTHORITY, FINANCIAL_SUPERVISOR, DATA_PROTECTION_AUTHORITY |
| isActive | boolean | No | - | Filter by active status |
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated regulatory authorities ordered by name ascending, including name, short name, country, type, contact details (email, phone, portal URL), and submission methods.

### list_incident_types

List incident types with filtering by category and active status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| category | string | No | - | Filter by category: MALWARE, PHISHING, DENIAL_OF_SERVICE, DATA_BREACH, UNAUTHORIZED_ACCESS, INSIDER_THREAT, PHYSICAL, SUPPLY_CHAIN, SYSTEM_FAILURE, CONFIGURATION_ERROR, OTHER |
| isActive | boolean | No | - | Filter by active status |
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated incident types ordered by sort order, including type code, name, description, category, and active status.

### list_attack_vectors

List attack vectors (MITRE ATT&CK aligned) with filtering by active status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| isActive | boolean | No | - | Filter by active status |
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated attack vectors ordered by name, including name, description, MITRE ATT&CK technique ID, tactic, and active status.

## Analysis

### get_incident_stats

Get comprehensive incident statistics including total counts, breakdowns by severity/status/category, and regulatory incident counts.

**Parameters**: None

**Returns**: Statistics object including:
- total: Total incident count
- confirmed: Confirmed incidents count
- bySeverity: Array of {severity, _count} grouped by severity
- byStatus: Array of {status, _count} grouped by status
- byCategory: Array of {category, _count} grouped by category
- regulatory.nis2Significant: Count of NIS2 significant incidents
- regulatory.doraMajor: Count of DORA major incidents

### get_incident_dashboard

Get incident dashboard summary including open incidents, critical/high open count, overdue notifications, pending lessons learned, and incidents this month.

**Parameters**: None

**Returns**: Dashboard summary including:
- openIncidents: Count of incidents not in CLOSED status
- criticalHighOpen: Count of CRITICAL/HIGH severity incidents not closed
- overdueNotifications: Count of overdue notifications
- pendingLessonsLearned: Count of lessons learned in IDENTIFIED/IN_PROGRESS status
- incidentsThisMonth: Count of incidents detected this month
- openBySeverity: Array of {severity, _count} for open incidents grouped by severity

### get_incident_affected_controls

Get controls linked to an incident showing control effectiveness assessment (failed, bypassed, effective, not applicable).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| incidentId | string | Yes | - | Incident UUID |
| skip | number | No | 0 | Pagination offset (default 0) |
| take | number | No | 50 | Page size (default 50, max 100) |

**Returns**: Paginated control links with total count, including linkType (FAILED, BYPASSED, EFFECTIVE, NOT_APPLICABLE), analysis notes, and control details (controlId, name, theme, implementation status).

## Mutations

All mutation tools follow the human-in-the-loop pattern, creating proposals in an approval queue rather than directly modifying data. Each returns an action ID and PENDING status.

### propose_incident

Propose creating a new incident. The proposal goes into an approval queue for human review before being created in the system.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| referenceNumber | string | Yes | - | Incident reference number (e.g., INC-2025-001) |
| title | string | Yes | - | Incident title |
| description | string | Yes | - | Detailed incident description |
| severity | string | Yes | - | Severity: CRITICAL, HIGH, MEDIUM, LOW |
| category | string | Yes | - | Category: MALWARE, PHISHING, DENIAL_OF_SERVICE, DATA_BREACH, UNAUTHORIZED_ACCESS, INSIDER_THREAT, PHYSICAL, SUPPLY_CHAIN, SYSTEM_FAILURE, CONFIGURATION_ERROR, OTHER |
| source | string | Yes | - | Source: SIEM, USER_REPORT, THREAT_INTEL, AUTOMATED, THIRD_PARTY, REGULATOR, VULNERABILITY_SCAN, PENETRATION_TEST, OTHER |
| detectedAt | string | Yes | - | Detection timestamp (ISO 8601) |
| reason | string | No | - | Explain WHY this incident is being reported — shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns**: Proposal confirmation with message, actionId, status (PENDING), referenceNumber, and title.

### propose_incident_status_update

Propose updating an incident status. The proposal goes into an approval queue for human review before being applied to the incident.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| incidentId | string | Yes | - | Incident UUID to update |
| newStatus | string | Yes | - | New status: DETECTED, TRIAGED, INVESTIGATING, CONTAINING, ERADICATING, RECOVERING, POST_INCIDENT, CLOSED |
| resolutionType | string | No | - | Resolution type if closing: RESOLVED, FALSE_POSITIVE, ACCEPTED_RISK, DUPLICATE, TRANSFERRED |
| reason | string | No | - | Explain WHY this status change is needed — shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns**: Proposal confirmation with message, actionId, status (PENDING), referenceNumber, currentStatus, and proposedStatus.

### propose_timeline_entry

Propose adding a timeline entry to an incident. The proposal goes into an approval queue for human review before being added to the incident.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| incidentId | string | Yes | - | Incident UUID |
| entryType | string | Yes | - | Entry type: STATUS_CHANGE, ACTION_TAKEN, EVIDENCE_COLLECTED, COMMUNICATION, ESCALATION, FINDING |
| description | string | Yes | - | Timeline entry description |
| details | string | No | - | Additional details or context |
| reason | string | No | - | Explain WHY this timeline entry is being added — shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns**: Proposal confirmation with message, actionId, status (PENDING), referenceNumber, entryType, and description.

### propose_link_incident_scenario

Propose linking an incident to a risk scenario. The proposal goes into an approval queue for human review before being applied.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| incidentId | string | Yes | - | Incident UUID |
| scenarioId | string | Yes | - | Risk scenario UUID |
| linkType | string | No | TRIGGERED_BY | Link type (default: TRIGGERED_BY) |
| reason | string | No | - | Explain WHY this link is being created — shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns**: Proposal confirmation with message, actionId, status (PENDING), incidentRef, scenarioRef, and linkType.

### propose_lessons_learned

Propose adding lessons learned to an incident. The proposal goes into an approval queue for human review before being added.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| incidentId | string | Yes | - | Incident UUID |
| category | string | Yes | - | Category: DETECTION, RESPONSE, COMMUNICATION, TECHNICAL, PROCESS |
| observation | string | Yes | - | What was observed or learned |
| recommendation | string | Yes | - | Recommended action or improvement |
| priority | string | No | MEDIUM | Priority level: CRITICAL, HIGH, MEDIUM, LOW (default: MEDIUM) |
| reason | string | No | - | Explain WHY this lesson learned is important — shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns**: Proposal confirmation with message, actionId, status (PENDING), referenceNumber, category, priority, and observation.
