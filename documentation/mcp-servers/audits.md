# Audits MCP Server

**Server name**: `riskready-audits`
**Package**: `apps/mcp-server-audits`
**Version**: 0.1.0

Manages nonconformities (NCs) and corrective action plans (CAPs) from internal/external audits.

## Query Tools (8)

### Nonconformities (4)

| Tool | Description |
|------|-------------|
| `list_nonconformities` | List NCs with filters: status, severity, source, capStatus. Paginated. |
| `get_nonconformity` | Single NC with CAP fields, verification, related control, responsible user. |
| `search_nonconformities` | Search by ncId, title, or description. |
| `get_nc_stats` | Aggregate stats: by status, severity, CAP status, source. Open and overdue counts. |

### Analysis (3)

| Tool | Description |
|------|-------------|
| `get_nc_aging_report` | Aging report for open NCs: grouped by severity into 0-30, 31-60, 61-90, 90+ day buckets. |
| `get_cap_status_report` | CAP pipeline breakdown: counts by CAP status for NCs requiring corrective action. |
| `get_nc_by_control` | NCs grouped by control with count per control. |

## Mutation Tools (7)

### NC Mutations (4)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_nc` | ncId, title, description, source, severity, category, controlId, isoClause, findings, rootCause, impact, targetClosureDate |
| `propose_update_nc` | ncId (UUID), title, description, severity, category, findings, source, isoClause, rootCause, impact, correctiveAction, targetClosureDate |
| `propose_transition_nc` | ncId, targetStatus, justification |
| `propose_close_nc` | ncId, verificationMethod, verificationResult, verificationNotes, verificationDate |

### CAP Mutations (3)

| Tool | Key Parameters |
|------|----------------|
| `propose_submit_cap` | ncId, correctiveAction, targetClosureDate, responsibleUserId |
| `propose_approve_cap` | ncId, approvalComments |
| `propose_reject_cap` | ncId, rejectionReason |

## Resources (3)

| URI | Description |
|-----|-------------|
| `audits://nc/lifecycle` | NC status lifecycle and transitions |
| `audits://cap/workflow` | CAP workflow and statuses |
| `audits://data-integrity` | Anti-hallucination guidance for AI consumers |

## Prompts (3)

| Prompt | Description |
|--------|-------------|
| `nc-review` | Review open NCs and prioritize by severity, aging, and CAP status |
| `cap-planning` | Plan corrective actions for a specific nonconformity |
| `audit-readiness` | Assess audit readiness: open NCs, overdue CAPs, verification status |
