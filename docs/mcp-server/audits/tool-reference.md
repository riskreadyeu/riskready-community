# Tool Reference - Audits MCP Server

Complete reference for all tools provided by the Audits MCP server.

## Nonconformity Query Tools

### list_nonconformities

List nonconformities with optional filters.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | enum | No | - | Filter by NC status: DRAFT, OPEN, IN_PROGRESS, AWAITING_VERIFICATION, VERIFIED_EFFECTIVE, VERIFIED_INEFFECTIVE, CLOSED, REJECTED |
| capStatus | enum | No | - | Filter by CAP status: NOT_REQUIRED, NOT_DEFINED, DRAFT, PENDING_APPROVAL, APPROVED, REJECTED |
| severity | enum | No | - | Filter by severity: MAJOR, MINOR, OBSERVATION |
| source | enum | No | - | Filter by source: TEST, INTERNAL_AUDIT, EXTERNAL_AUDIT, CERTIFICATION_AUDIT, INCIDENT, SELF_ASSESSMENT, MANAGEMENT_REVIEW, SURVEILLANCE_AUDIT, ISRA_GAP |
| category | enum | No | - | Filter by category: CONTROL_FAILURE, DOCUMENTATION, PROCESS, TECHNICAL, ORGANIZATIONAL, TRAINING, RESOURCE |
| controlId | string | No | - | Filter by control ID |
| applicationId | string | No | - | Filter by application ID |
| responsibleUserId | string | No | - | Filter by responsible user ID |
| dateFrom | string | No | - | Filter by dateRaised >= this date (ISO 8601) |
| dateTo | string | No | - | Filter by dateRaised <= this date (ISO 8601) |

**Returns:** Array of nonconformity records with summary details, ordered by dateRaised descending.

---

### get_nonconformity

Get a single nonconformity by ID with full details including related entities.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Nonconformity ID |

**Returns:** Complete nonconformity record including:
- Control, application, and user relationships
- All CAP-related users (drafted by, approved by, rejected by)
- Linked incidents and evidence
- SRL entries and risk relationships

---

### search_nonconformities

Search nonconformities by text in title, ncId, description, or findings.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search query (case-insensitive) |

**Returns:** Array of matching nonconformity records with summary details, ordered by dateRaised descending.

---

### get_pending_cap_approvals

Get nonconformities with CAP status PENDING_APPROVAL.

**No parameters required.**

**Returns:** Array of nonconformities awaiting CAP approval, including responsible user and raised by user details, ordered by dateRaised ascending (oldest first).

---

### get_overdue_nonconformities

Get nonconformities that are overdue (open or in progress past target closure date).

**No parameters required.**

**Returns:** Array of overdue nonconformities with responsible user and control details, ordered by targetClosureDate ascending (most overdue first).

---

## Analysis Tools

### get_nc_stats

Get comprehensive statistics about nonconformities.

**No parameters required.**

**Returns:** Statistics object containing:
- `bySeverity` - Count of NCs grouped by severity (MAJOR, MINOR, OBSERVATION)
- `byStatus` - Count of NCs grouped by status
- `byCapStatus` - Count of NCs grouped by CAP status
- `bySource` - Count of NCs grouped by source type
- `byCategory` - Count of NCs grouped by category
- `overdueCount` - Total count of overdue NCs

---

### get_nc_dashboard

Get key metrics for NC dashboard.

**No parameters required.**

**Returns:** Dashboard metrics object containing:
- `openCount` - Count of NCs with status OPEN
- `inProgressCount` - Count of NCs with status IN_PROGRESS
- `awaitingVerificationCount` - Count of NCs awaiting verification
- `pendingCapApprovals` - Count of CAPs pending approval
- `overdueCount` - Count of overdue NCs
- `thisMonthCount` - Count of NCs raised this month
- `averageDaysToClose` - Average days to close NCs (last 90 days)
- `closedNCsLast90Days` - Count of NCs closed in last 90 days

---

### get_nc_by_control

Get nonconformities grouped by control with severity breakdown.

**No parameters required.**

**Returns:** Array of control summaries, each containing:
- `control` - Control details (id, controlId, name)
- `totalCount` - Total number of NCs for this control
- `openCount` - Number of open or in-progress NCs
- `severityBreakdown` - Count by severity (MAJOR, MINOR, OBSERVATION)

Results are sorted by totalCount descending (controls with most NCs first).

---

## Mutation Tools

All mutation tools create pending actions that require approval before execution.

### propose_nonconformity

Propose a new nonconformity (creates pending action for approval).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation ID |
| title | string | Yes | - | NC title |
| description | string | Yes | - | Detailed description of the nonconformity |
| severity | enum | Yes | - | Severity level: MAJOR, MINOR, OBSERVATION |
| category | enum | Yes | - | Category: CONTROL_FAILURE, DOCUMENTATION, PROCESS, TECHNICAL, ORGANIZATIONAL, TRAINING, RESOURCE |
| source | enum | Yes | - | Source: TEST, INTERNAL_AUDIT, EXTERNAL_AUDIT, CERTIFICATION_AUDIT, INCIDENT, SELF_ASSESSMENT, MANAGEMENT_REVIEW, SURVEILLANCE_AUDIT, ISRA_GAP |
| isoClause | string | No | - | ISO clause reference (e.g., A.5.2) |
| controlId | string | No | - | Related control ID |
| reason | string | Yes | - | Reason for creating this NC |
| mcpSessionId | string | No | - | MCP session ID for tracking |

**Returns:** Pending action confirmation with pendingActionId and status PENDING.

---

### propose_nc_status_update

Propose updating NC status or CAP status (creates pending action for approval).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation ID |
| nonconformityId | string | Yes | - | Nonconformity ID |
| newStatus | enum | No | - | New NC status: DRAFT, OPEN, IN_PROGRESS, AWAITING_VERIFICATION, VERIFIED_EFFECTIVE, VERIFIED_INEFFECTIVE, CLOSED, REJECTED |
| newCapStatus | enum | No | - | New CAP status: NOT_REQUIRED, NOT_DEFINED, DRAFT, PENDING_APPROVAL, APPROVED, REJECTED |
| reason | string | Yes | - | Reason for status update |
| mcpSessionId | string | No | - | MCP session ID for tracking |

**Returns:** Pending action confirmation with current and proposed status values.

---

### propose_cap_update

Propose updating CAP details (creates pending action for approval).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation ID |
| nonconformityId | string | Yes | - | Nonconformity ID |
| rootCause | string | No | - | Root cause analysis |
| correctiveAction | string | No | - | Corrective action plan |
| preventiveAction | string | No | - | Preventive action plan |
| targetClosureDate | string | No | - | Target closure date (ISO format) |
| verificationMethod | enum | No | - | Verification method: RE_TEST, RE_AUDIT, DOCUMENT_REVIEW, WALKTHROUGH |
| reason | string | Yes | - | Reason for updating CAP |
| mcpSessionId | string | No | - | MCP session ID for tracking |

**Returns:** Pending action confirmation with pendingActionId.

---

### propose_cap_submission

Propose submitting CAP for approval (creates pending action).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation ID |
| nonconformityId | string | Yes | - | Nonconformity ID |
| reason | string | Yes | - | Reason for submitting CAP for approval |
| mcpSessionId | string | No | - | MCP session ID for tracking |

**Returns:** Pending action confirmation. Tool validates that CAP is in DRAFT status before allowing submission.

---

### propose_nc_verification

Propose verifying NC effectiveness (creates pending action for approval).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation ID |
| nonconformityId | string | Yes | - | Nonconformity ID |
| verificationResult | enum | Yes | - | Verification result: VERIFIED_EFFECTIVE, VERIFIED_INEFFECTIVE |
| verificationNotes | string | Yes | - | Verification notes |
| evidenceDescription | string | No | - | Evidence description |
| reason | string | Yes | - | Reason for verification |
| mcpSessionId | string | No | - | MCP session ID for tracking |

**Returns:** Pending action confirmation with verification result. Tool validates that NC is in AWAITING_VERIFICATION status before allowing verification.

---

## Usage Examples

### Finding Overdue Major NCs
```json
{
  "tool": "list_nonconformities",
  "params": {
    "severity": "MAJOR",
    "status": "OPEN"
  }
}
```

Then check results against current date to identify overdue items, or use `get_overdue_nonconformities` for automatic filtering.

### Getting Dashboard Summary
```json
{
  "tool": "get_nc_dashboard"
}
```

### Proposing a New NC from Test Failure
```json
{
  "tool": "propose_nonconformity",
  "params": {
    "organisationId": "org-123",
    "title": "Access control test failed on production database",
    "description": "User privileges were not restricted according to policy",
    "severity": "MAJOR",
    "category": "CONTROL_FAILURE",
    "source": "TEST",
    "isoClause": "A.9.2.3",
    "controlId": "ctrl-456",
    "reason": "Automated test detected privilege escalation vulnerability"
  }
}
```

### Updating CAP with Root Cause Analysis
```json
{
  "tool": "propose_cap_update",
  "params": {
    "organisationId": "org-123",
    "nonconformityId": "nc-789",
    "rootCause": "User provisioning script did not apply principle of least privilege",
    "correctiveAction": "Update provisioning script to restrict default privileges",
    "preventiveAction": "Add automated test to CI/CD pipeline to verify privilege restrictions",
    "verificationMethod": "RE_TEST",
    "reason": "Completed 5 Whys analysis and identified systemic issue in provisioning"
  }
}
```

### Searching for NCs Related to Backups
```json
{
  "tool": "search_nonconformities",
  "params": {
    "query": "backup"
  }
}
```
