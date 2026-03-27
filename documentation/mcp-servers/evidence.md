# Evidence MCP Server

**Server name**: `riskready-evidence`
**Package**: `apps/mcp-server-evidence`
**Version**: 0.1.0

Manages evidence records, evidence requests, and evidence coverage analysis for audit and compliance purposes.

## Query Tools (10)

### Evidence (4)

| Tool | Description |
|------|-------------|
| `list_evidence` | List evidence with filters: status, evidenceType, classification, category. Paginated. |
| `get_evidence` | Single evidence record with link counts and review/approval info. |
| `search_evidence` | Search by reference, title, or description. |
| `get_evidence_stats` | Aggregate stats: by status, type, classification. Expiring soon count. |

### Evidence Requests (3)

| Tool | Description |
|------|-------------|
| `list_evidence_requests` | List requests with filters: status, priority. Paginated. |
| `get_evidence_request` | Single request with fulfillment records. |
| `get_my_requests` | Requests assigned to a specific user. Optional status filter. |

### Analysis (3)

| Tool | Description |
|------|-------------|
| `get_expiring_evidence` | Evidence expiring within N days (default 30). |
| `get_evidence_coverage` | Coverage analysis: which controls have linked evidence and which do not. |
| `get_request_aging` | Aging report for open requests: overdue and approaching-due. |

## Mutation Tools (6)

### Evidence Mutations (3)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_evidence` | evidenceRef, title, evidenceType, classification, category, validFrom, validUntil, status, tags (JSON), subcategory, sourceType, sourceSystem, sourceReference, collectionMethod, renewalRequired, renewalReminderDays, version |
| `propose_update_evidence` | evidenceId, title, description, status, classification, validFrom, validUntil, tags (JSON), category, subcategory, renewalRequired |
| `propose_link_evidence` | evidenceId, targetType (control/risk/incident/asset/policy/change/nonconformity/treatment), targetId, linkType, notes |

### Request Mutations (3)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_request` | requestRef, title, description, evidenceType, priority, dueDate, assignedToId, contextType, contextRef, status, requiredFormat, acceptanceCriteria, notes |
| `propose_fulfill_request` | requestId, evidenceId, notes |
| `propose_close_request` | requestId, action (accept/reject/cancel), notes |

## Resources (4)

| URI | Description |
|-----|-------------|
| `evidence://types` | Evidence type classifications and descriptions |
| `evidence://retention` | Evidence retention and validity guidance |
| `evidence://request-workflow` | Evidence request workflow and statuses |
| `evidence://data-integrity` | Anti-hallucination guidance for AI consumers |

## Prompts (3)

| Prompt | Description |
|--------|-------------|
| `evidence-collection` | Plan evidence collection for a control or audit, identify gaps, create requests |
| `expiry-review` | Review expiring evidence and plan renewals |
| `evidence-gap-analysis` | Analyze evidence coverage gaps across the control framework |
