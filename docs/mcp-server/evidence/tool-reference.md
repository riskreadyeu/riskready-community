# Evidence MCP Server - Tool Reference

Complete reference for all 22 tools provided by the Evidence MCP server.

## Table of Contents

- [Evidence Repository Tools](#evidence-repository-tools)
- [Evidence Request Tools](#evidence-request-tools)
- [Cross-Entity Link Tools](#cross-entity-link-tools)
- [Analysis Tools](#analysis-tools)
- [Mutation Proposal Tools](#mutation-proposal-tools)

---

## Evidence Repository Tools

Core evidence CRUD and search operations for the evidence repository.

### list_evidence

List evidence with optional filters for type, status, classification, category, and source type.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| evidenceType | string | No | - | Filter by evidence type (e.g., DOCUMENT, CERTIFICATE, LOG) |
| status | string | No | - | Filter by status (PENDING, UNDER_REVIEW, APPROVED, REJECTED, EXPIRED, ARCHIVED) |
| classification | string | No | - | Filter by classification (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED) |
| category | string | No | - | Filter by category |
| sourceType | string | No | - | Filter by source type (MANUAL_UPLOAD, AUTOMATED, EXTERNAL_SYSTEM) |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of records to return (max 100) |

**Returns:**

JSON object containing:
- `count`: Total matching records
- `page`: Pagination metadata (skip, take)
- `results`: Array of evidence records with:
  - Core fields: id, evidenceRef, title, evidenceType, status, classification, category
  - File fields: fileName, collectedAt, validUntil, version
  - Link counts: controlLinks, riskLinks, policyLinks, requestFulfillments

**Example:**

```json
{
  "count": 142,
  "page": { "skip": 0, "take": 50 },
  "results": [
    {
      "id": "uuid-here",
      "evidenceRef": "EVD-2024-001",
      "title": "ISO 27001 Certification",
      "evidenceType": "CERTIFICATE",
      "status": "APPROVED",
      "classification": "PUBLIC",
      "category": "Certifications",
      "fileName": "iso27001-cert.pdf",
      "collectedAt": "2024-01-15T10:30:00Z",
      "validUntil": "2027-01-15T00:00:00Z",
      "version": "1.0",
      "_count": {
        "controlLinks": 23,
        "riskLinks": 5,
        "policyLinks": 2,
        "requestFulfillments": 1
      }
    }
  ]
}
```

---

### get_evidence

Get detailed evidence record by ID, including related entities and version history.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Evidence UUID |

**Returns:**

Complete evidence record with:
- All evidence fields
- Relationships: collectedBy, reviewedBy, approvedBy (user details)
- Version links: previousVersion, newerVersions (with id, evidenceRef, title, version)
- Entity links: controlLinks, policyLinks, riskLinks (with full related entity details)

Returns error object if evidence not found.

**Example:**

```json
{
  "id": "uuid-here",
  "evidenceRef": "EVD-2024-001",
  "title": "ISO 27001 Certification",
  "description": "ISO 27001:2022 certification for information security management system",
  "evidenceType": "CERTIFICATE",
  "status": "APPROVED",
  "classification": "PUBLIC",
  "collectedAt": "2024-01-15T10:30:00Z",
  "validUntil": "2027-01-15T00:00:00Z",
  "collectedBy": {
    "id": "user-uuid",
    "email": "admin@example.com",
    "firstName": "Jane",
    "lastName": "Doe"
  },
  "approvedBy": {
    "id": "approver-uuid",
    "email": "approver@example.com",
    "firstName": "John",
    "lastName": "Smith"
  },
  "controlLinks": [
    {
      "id": "link-uuid",
      "evidenceId": "uuid-here",
      "controlId": "control-uuid",
      "control": {
        "id": "control-uuid",
        "controlId": "A.5.1",
        "name": "Policies for information security"
      }
    }
  ],
  "previousVersion": null,
  "newerVersions": []
}
```

---

### search_evidence

Search evidence by text in title, description, reference, or file name.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search query text (case-insensitive) |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of records to return (max 100) |

**Returns:**

JSON object containing:
- `count`: Total matching records
- `page`: Pagination metadata
- `query`: Original search query
- `results`: Array of evidence records (same structure as list_evidence)

Search performs case-insensitive partial matching across:
- title
- description
- evidenceRef
- originalFileName

---

### get_expiring_evidence

Get evidence that will expire within the specified number of days.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| daysAhead | number | No | 30 | Number of days to look ahead |

**Returns:**

JSON object containing:
- `daysAhead`: Days ahead parameter used
- `count`: Number of expiring evidence records
- `results`: Array of evidence records with:
  - Core fields: id, evidenceRef, title, evidenceType, status
  - Expiration fields: validUntil, renewalRequired
  - Collector details: collectedBy (user information)

Only returns evidence with:
- status = APPROVED
- validUntil between now and (now + daysAhead)

Results sorted by validUntil ascending (soonest expiration first).

---

### get_evidence_versions

Get version history for a specific evidence record.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| evidenceId | string | Yes | - | Evidence UUID |

**Returns:**

JSON object containing:
- `current`: Current version details (id, evidenceRef, title, version, createdAt, updatedAt)
- `previousVersion`: Previous version object (same fields) or null
- `newerVersions`: Array of newer version objects or empty array

Returns error object if evidence not found.

Version chains link via `previousVersionId`:
- Current version points to previous version
- Previous version includes current in its newerVersions array
- Chain supports multiple versions: v1 ← v2 ← v3 (current)

---

## Evidence Request Tools

Evidence collection request workflows and tracking.

### list_evidence_requests

List evidence requests with optional filters for status, priority, assignee, and context type.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | - | Filter by request status (OPEN, IN_PROGRESS, SUBMITTED, ACCEPTED, REJECTED, CANCELLED) |
| priority | string | No | - | Filter by priority (LOW, MEDIUM, HIGH, CRITICAL) |
| assignedToId | string | No | - | Filter by assigned user ID |
| contextType | string | No | - | Filter by context type (CONTROL, RISK, AUDIT, POLICY, etc.) |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of records to return (max 100) |

**Returns:**

JSON object containing:
- `count`: Total matching requests
- `page`: Pagination metadata
- `results`: Array of request records with:
  - Request fields: id, requestRef, title, description, evidenceType, priority, status, dueDate
  - Context fields: contextType, contextRef
  - User relationships: requestedBy, assignedTo (with user details)
  - Fulfillment count: _count.fulfillments

Results sorted by dueDate ascending (earliest due date first).

---

### get_evidence_request

Get detailed evidence request by ID, including requestor, assignee, and fulfillments.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Evidence request UUID |

**Returns:**

Complete request record with:
- All request fields
- Relationships: requestedBy, assignedTo, assignedDepartment (with details)
- Fulfillments array with:
  - Fulfillment details
  - Evidence summary (id, evidenceRef, title, status, evidenceType, collectedAt)
  - Submitter details (submittedBy user)

Returns error object if request not found.

**Example:**

```json
{
  "id": "request-uuid",
  "requestRef": "EVR-2024-042",
  "title": "Access review evidence for Q1 2024",
  "description": "Quarterly access review report showing manager approvals",
  "evidenceType": "REPORT",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "dueDate": "2024-04-15T00:00:00Z",
  "contextType": "CONTROL",
  "contextRef": "A.5.18",
  "requestedBy": {
    "id": "user-uuid",
    "email": "auditor@example.com",
    "firstName": "Alice",
    "lastName": "Johnson"
  },
  "assignedTo": {
    "id": "assignee-uuid",
    "email": "iam-admin@example.com",
    "firstName": "Bob",
    "lastName": "Williams"
  },
  "fulfillments": []
}
```

---

### get_overdue_requests

Get evidence requests that are overdue (past due date and still open or in progress).

**Parameters:**

None

**Returns:**

JSON object containing:
- `count`: Number of overdue requests
- `asOf`: Timestamp of query (ISO 8601)
- `results`: Array of overdue requests with:
  - All request fields
  - assignedTo and requestedBy user details

Filters for:
- status in ['OPEN', 'IN_PROGRESS']
- dueDate < current timestamp

Results sorted by dueDate ascending (most overdue first).
Limited to 100 records.

---

### get_request_stats

Get statistics about evidence requests grouped by status and priority, including overdue count.

**Parameters:**

None

**Returns:**

JSON object containing:
- `total`: Total request count
- `overdue`: Count of overdue requests (status = OPEN or IN_PROGRESS, dueDate < now)
- `byStatus`: Array of status groups with count (e.g., `{ status: "OPEN", _count: 15 }`)
- `byPriority`: Array of priority groups with count (e.g., `{ priority: "HIGH", _count: 23 }`)

**Example:**

```json
{
  "total": 87,
  "overdue": 5,
  "byStatus": [
    { "status": "OPEN", "_count": 23 },
    { "status": "IN_PROGRESS", "_count": 15 },
    { "status": "SUBMITTED", "_count": 12 },
    { "status": "ACCEPTED", "_count": 32 },
    { "status": "REJECTED", "_count": 3 },
    { "status": "CANCELLED", "_count": 2 }
  ],
  "byPriority": [
    { "priority": "CRITICAL", "_count": 4 },
    { "priority": "HIGH", "_count": 18 },
    { "priority": "MEDIUM", "_count": 42 },
    { "priority": "LOW", "_count": 23 }
  ]
}
```

---

## Cross-Entity Link Tools

Junction table queries linking evidence to controls, risks, policies, and other entities.

### get_evidence_links

Get all entities linked to a specific evidence record across all junction tables.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| evidenceId | string | Yes | - | Evidence UUID |

**Returns:**

JSON object containing:
- `evidence`: Basic evidence summary (id, evidenceRef, title)
- `links`: Object with arrays for each entity type:
  - `controls`: EvidenceControl links with control details
  - `risks`: EvidenceRisk links with risk details
  - `policies`: EvidencePolicy links with policy details
  - `incidents`: EvidenceIncident links with incident details
  - `assets`: EvidenceAsset links with asset details
  - `changes`: EvidenceChange links with change request details
  - `vendors`: EvidenceVendor links with vendor details
  - `treatments`: EvidenceTreatment links with treatment plan details
  - `nonconformities`: EvidenceNonconformity links with NC details
  - `assessments`: EvidenceAssessment links with assessment details
  - `contracts`: EvidenceContract links with contract details
  - `applications`: EvidenceApplication links with application details
  - `isras`: EvidenceISRA links with ISRA details
  - `bcmTests`: EvidenceBCMTest links with BCM test details

Returns error object if evidence not found.

Each link includes:
- Junction table fields (link ID, evidenceId, entityId, notes, etc.)
- Related entity summary (id, reference, name/title, key fields)

**Example:**

```json
{
  "evidence": {
    "id": "evidence-uuid",
    "evidenceRef": "EVD-2024-001",
    "title": "ISO 27001 Certification"
  },
  "links": {
    "controls": [
      {
        "id": "link-uuid",
        "evidenceId": "evidence-uuid",
        "controlId": "control-uuid",
        "control": {
          "id": "control-uuid",
          "controlId": "A.5.1",
          "name": "Policies for information security",
          "theme": "ORGANIZATIONAL"
        }
      }
    ],
    "risks": [],
    "policies": [],
    "incidents": [],
    "assets": [],
    "changes": [],
    "vendors": [],
    "treatments": [],
    "nonconformities": [],
    "assessments": [],
    "contracts": [],
    "applications": [],
    "isras": [],
    "bcmTests": []
  }
}
```

---

### get_control_evidence

Get all evidence linked to a specific control.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| controlId | string | Yes | - | Control UUID |

**Returns:**

JSON object containing:
- `controlId`: Control UUID queried
- `count`: Number of evidence records linked
- `results`: Array of EvidenceControl links with evidence details:
  - Link fields: id, evidenceId, controlId, notes, linkType, etc.
  - Evidence summary: id, evidenceRef, title, status, validUntil, evidenceType, classification, collectedAt

Evidence sorted by collection date (most recent first).

---

### get_risk_evidence

Get all evidence linked to a specific risk.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| riskId | string | Yes | - | Risk UUID |

**Returns:**

JSON object containing:
- `riskId`: Risk UUID queried
- `count`: Number of evidence records linked
- `results`: Array of EvidenceRisk links with evidence details (same structure as get_control_evidence)

---

### get_policy_evidence

Get all evidence linked to a specific policy.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| policyId | string | Yes | - | Policy UUID |

**Returns:**

JSON object containing:
- `policyId`: Policy UUID queried
- `count`: Number of evidence records linked
- `results`: Array of EvidencePolicy links with evidence details (same structure as get_control_evidence)

---

### get_asset_evidence

Get all evidence linked to a specific asset.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assetId | string | Yes | - | Asset UUID |

**Returns:**

JSON object containing:
- `assetId`: Asset UUID queried
- `count`: Number of evidence records linked
- `results`: Array of EvidenceAsset links with evidence details (same structure as get_control_evidence)

---

### get_incident_evidence

Get all evidence linked to a specific incident.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| incidentId | string | Yes | - | Incident UUID |

**Returns:**

JSON object containing:
- `incidentId`: Incident UUID queried
- `count`: Number of evidence records linked
- `results`: Array of EvidenceIncident links with evidence details (same structure as get_control_evidence)

---

### get_change_evidence

Get all evidence linked to a specific change request.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| changeId | string | Yes | - | Change request UUID |

**Returns:**

JSON object containing:
- `changeId`: Change request UUID queried
- `count`: Number of evidence records linked
- `results`: Array of EvidenceChange links with evidence details (same structure as get_control_evidence)

---

## Analysis Tools

Dashboard metrics, statistics, gap analysis, and coverage reporting.

### get_evidence_stats

Get overall statistics about evidence records, including counts by type, status, classification, and expiration.

**Parameters:**

None

**Returns:**

JSON object containing:
- `total`: Total evidence count
- `byType`: Array of evidence type groups with counts (e.g., `{ evidenceType: "CERTIFICATE", _count: 23 }`)
- `byStatus`: Array of status groups with counts
- `byClassification`: Array of classification groups with counts
- `expiringSoon`: Count of approved evidence expiring in next 30 days
- `expired`: Count of evidence past validUntil but not yet marked EXPIRED or ARCHIVED

**Example:**

```json
{
  "total": 542,
  "byType": [
    { "evidenceType": "DOCUMENT", "_count": 142 },
    { "evidenceType": "CERTIFICATE", "_count": 23 },
    { "evidenceType": "REPORT", "_count": 87 },
    { "evidenceType": "LOG", "_count": 156 },
    { "evidenceType": "SCAN_RESULT", "_count": 98 },
    { "evidenceType": "TEST_RESULT", "_count": 36 }
  ],
  "byStatus": [
    { "status": "APPROVED", "_count": 432 },
    { "status": "PENDING", "_count": 15 },
    { "status": "UNDER_REVIEW", "_count": 8 },
    { "status": "EXPIRED", "_count": 67 },
    { "status": "ARCHIVED", "_count": 20 }
  ],
  "byClassification": [
    { "classification": "PUBLIC", "_count": 45 },
    { "classification": "INTERNAL", "_count": 356 },
    { "classification": "CONFIDENTIAL", "_count": 128 },
    { "classification": "RESTRICTED", "_count": 13 }
  ],
  "expiringSoon": 12,
  "expired": 5
}
```

---

### get_evidence_dashboard

Get comprehensive dashboard metrics for evidence management, including requests and fulfillment rates.

**Parameters:**

None

**Returns:**

JSON object containing:
- `evidence`: Evidence metrics object
  - `total`: Total evidence count
  - `approved`: Approved evidence count
  - `pendingReview`: Evidence in PENDING or UNDER_REVIEW status
  - `expiringSoon`: Approved evidence expiring in next 30 days
- `requests`: Request metrics object
  - `open`: Requests in OPEN or IN_PROGRESS status
  - `overdue`: Open/in-progress requests past due date
  - `total`: Total request count
  - `fulfilled`: Requests with fulfillments (ACCEPTED or SUBMITTED)
  - `fulfillmentRate`: Percentage of requests fulfilled (0-100)
- `generatedAt`: Dashboard generation timestamp (ISO 8601)

**Example:**

```json
{
  "evidence": {
    "total": 542,
    "approved": 432,
    "pendingReview": 23,
    "expiringSoon": 12
  },
  "requests": {
    "open": 38,
    "overdue": 5,
    "total": 87,
    "fulfilled": 44,
    "fulfillmentRate": 50.57
  },
  "generatedAt": "2024-03-15T14:23:45Z"
}
```

---

### get_evidence_coverage

Analyze evidence coverage across controls, showing which controls have evidence and which have gaps.

**Parameters:**

None

**Returns:**

JSON object containing:
- `summary`: Coverage summary object
  - `totalControls`: Total control count
  - `covered`: Controls with evidence count
  - `gaps`: Controls without evidence count
  - `coveragePercentage`: Percentage of controls with evidence (0-100)
- `covered`: Array of covered control objects with:
  - `control`: Control details (id, controlId, name, theme)
  - `evidenceCount`: Number of evidence records linked
  - `latestCollectedAt`: Most recent evidence collection date
- `gaps`: Array of control objects without evidence (id, controlId, name, theme)

**Example:**

```json
{
  "summary": {
    "totalControls": 93,
    "covered": 78,
    "gaps": 15,
    "coveragePercentage": 83.87
  },
  "covered": [
    {
      "control": {
        "id": "control-uuid",
        "controlId": "A.5.1",
        "name": "Policies for information security",
        "theme": "ORGANIZATIONAL"
      },
      "evidenceCount": 5,
      "latestCollectedAt": "2024-02-15T10:30:00Z"
    }
  ],
  "gaps": [
    {
      "id": "control-uuid-2",
      "controlId": "A.8.15",
      "name": "Logging",
      "theme": "TECHNOLOGICAL"
    }
  ]
}
```

---

## Mutation Proposal Tools

Safe mutation operations via approval queue (all create McpPendingAction records).

### propose_evidence

Propose creating new evidence. The proposal goes into an approval queue for human review.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| title | string | Yes | - | Evidence title |
| description | string | No | - | Evidence description |
| evidenceType | string | Yes | - | Evidence type (e.g., DOCUMENT, CERTIFICATE, REPORT) |
| classification | string | Yes | - | Classification level (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED) |
| category | string | No | - | Evidence category |
| subcategory | string | No | - | Evidence subcategory |
| tags | array[string] | No | - | Tags for organization |
| reason | string | No | - | Explain WHY - shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:**

JSON object containing:
- `message`: Confirmation message
- `actionId`: McpPendingAction UUID
- `status`: "PENDING"
- `title`: Evidence title

Returns error object if organisation not found.

**Example:**

```json
{
  "message": "Proposed evidence creation — awaiting approval",
  "actionId": "action-uuid",
  "status": "PENDING",
  "title": "Q1 2024 Access Review Report"
}
```

**Notes:**
- Creates McpPendingAction with actionType = "CREATE_EVIDENCE"
- Payload contains all evidence creation parameters
- Human approver reviews via web UI and can approve or reject
- Approved actions executed by backend service with full audit logging

---

### propose_evidence_request

Propose creating an evidence request. The proposal goes into an approval queue for human review.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| title | string | Yes | - | Request title |
| description | string | Yes | - | Request description |
| evidenceType | string | No | - | Required evidence type |
| requiredFormat | string | No | - | Required format/specifications |
| acceptanceCriteria | string | No | - | Acceptance criteria |
| priority | string | No | - | Priority level (LOW, MEDIUM, HIGH, CRITICAL) |
| assignedToId | string | No | - | Assigned user ID |
| dueDate | string | Yes | - | Due date (ISO 8601 format) |
| contextType | string | No | - | Context type (e.g., CONTROL, RISK, AUDIT) |
| contextId | string | No | - | Context entity UUID |
| reason | string | No | - | Explain WHY - shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:**

JSON object containing:
- `message`: Confirmation message
- `actionId`: McpPendingAction UUID
- `status`: "PENDING"
- `title`: Request title

Returns error object if organisation not found.

**Notes:**
- Creates McpPendingAction with actionType = "CREATE_EVIDENCE_REQUEST"
- Payload contains all request creation parameters
- Human approver reviews and can approve or reject
- Approved actions create EvidenceRequest records

---

### propose_evidence_status_update

Propose updating evidence status. The proposal goes into an approval queue for human review.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| evidenceId | string | Yes | - | Evidence UUID |
| newStatus | enum | Yes | - | New status value (PENDING, UNDER_REVIEW, APPROVED, REJECTED, EXPIRED, ARCHIVED) |
| reason | string | No | - | Explain WHY - shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:**

JSON object containing:
- `message`: Confirmation message
- `actionId`: McpPendingAction UUID
- `status`: "PENDING"
- `evidenceRef`: Evidence reference
- `currentStatus`: Current evidence status
- `newStatus`: Proposed new status

Returns error object if organisation or evidence not found.

**Notes:**
- Creates McpPendingAction with actionType = "UPDATE_EVIDENCE_STATUS"
- Payload includes evidenceId, currentStatus, newStatus
- Status transitions validated on approval
- Audit log entry created when executed

---

### propose_link_evidence_control

Propose linking evidence to a control. The proposal goes into an approval queue for human review.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| evidenceId | string | Yes | - | Evidence UUID |
| controlId | string | Yes | - | Control UUID |
| notes | string | No | - | Notes about the link |
| reason | string | No | - | Explain WHY - shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:**

JSON object containing:
- `message`: Confirmation message
- `actionId`: McpPendingAction UUID
- `status`: "PENDING"
- `evidenceRef`: Evidence reference
- `controlRef`: Control reference (controlId)

Returns error object if organisation, evidence, or control not found.

**Notes:**
- Creates McpPendingAction with actionType = "LINK_EVIDENCE_CONTROL"
- Payload includes evidenceId, controlId, evidenceRef, controlRef, notes
- Human approver verifies link relevance
- Approved actions create EvidenceControl junction record

---

### propose_link_evidence_risk

Propose linking evidence to a risk. The proposal goes into an approval queue for human review.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| evidenceId | string | Yes | - | Evidence UUID |
| riskId | string | Yes | - | Risk UUID |
| notes | string | No | - | Notes about the link |
| reason | string | No | - | Explain WHY - shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:**

JSON object containing:
- `message`: Confirmation message
- `actionId`: McpPendingAction UUID
- `status`: "PENDING"
- `evidenceRef`: Evidence reference
- `riskRef`: Risk reference (riskId)

Returns error object if organisation, evidence, or risk not found.

**Notes:**
- Creates McpPendingAction with actionType = "LINK_EVIDENCE_RISK"
- Payload includes evidenceId, riskId, evidenceRef, riskRef, notes
- Human approver verifies link relevance
- Approved actions create EvidenceRisk junction record

---

## Error Handling

All tools return structured error responses when operations fail:

```json
{
  "error": "Error description",
  "id": "entity-id-if-applicable"
}
```

Common error scenarios:
- Entity not found (evidence, organisation, control, risk)
- Invalid UUID format
- Database connection errors
- Permission errors (handled by backend)

## Pagination Pattern

Query tools returning lists support pagination:

```javascript
// First page
list_evidence({ take: 50, skip: 0 })

// Second page
list_evidence({ take: 50, skip: 50 })

// Third page
list_evidence({ take: 50, skip: 100 })
```

Page size maximum: 100 records
Default page size: 50 records

## Performance Considerations

- All queries use optimized Prisma select projections
- Junction table queries use includes for efficient relationship loading
- Pagination prevents large result sets
- Indexes on foreign keys and reference fields
- Aggregate queries use groupBy for efficiency

## Security Model

- All database access via Prisma ORM with parameterized queries
- No direct SQL injection risk
- Authentication/authorization handled at transport layer
- Audit logging for all mutations (via AuditLog table)
- Sensitive evidence filtered by classification in application layer
