# Policies MCP Server

**Server name**: `riskready-policies`
**Package**: `apps/mcp-server-policies`
**Version**: 0.1.0

Manages policy documents, version history, reviews, exceptions, acknowledgments, and control/risk mappings.

## Query Tools (14)

### Policy Documents (5)

| Tool | Description |
|------|-------------|
| `list_policy_documents` | List policies with filters: status, documentType, classification. Paginated. |
| `get_policy_document` | Single document with owner, author, approver, parent, version/review/mapping counts. |
| `search_policy_documents` | Search by document ID, title, or purpose. |
| `get_policy_stats` | Aggregate stats: by status, by type, overdue review count, active exception count. |
| `get_policy_hierarchy` | Document hierarchy showing parent-child relationships up to 3 levels. |

### Lifecycle (4)

| Tool | Description |
|------|-------------|
| `list_document_versions` | Version history for a document. |
| `list_document_reviews` | Review history with outcomes, findings, recommendations. |
| `list_document_exceptions` | Exceptions with status filter, approval level, dates, residual risk. |
| `get_acknowledgment_status` | Who has and hasn't acknowledged a document. Completion rate. |

### Mappings (2)

| Tool | Description |
|------|-------------|
| `get_policy_control_mappings` | Control mappings: which ISO 27001 controls the policy implements or supports. |
| `get_policy_risk_mappings` | Risk mappings: which risks the policy mitigates or addresses. |

### Analysis (3)

| Tool | Description |
|------|-------------|
| `get_review_calendar` | Documents due for review in next 90 days plus overdue reviews. |
| `get_policy_compliance_matrix` | Policy coverage across controls. Identifies gaps where controls lack coverage. |
| `get_exception_report` | Active, expiring, and expired exceptions. |

## Mutation Tools (11)

### Document Mutations (6)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_policy` | documentId, title, documentType, purpose, scope, content, classification, approvalLevel, author, documentOwner, reviewFrequency, shortTitle, summary, parentDocumentId, version, effectiveDate, expiryDate, nextReviewDate, requiresAcknowledgment, acknowledgmentDeadline, tags (JSON) |
| `propose_update_policy` | documentId (UUID), title, purpose, scope, content, classification, documentOwner, reviewFrequency, shortTitle, summary, effectiveDate, expiryDate, nextReviewDate, requiresAcknowledgment, tags (JSON), parentDocumentId |
| `propose_submit_review` | documentId, reviewType (SCHEDULED/TRIGGERED/AUDIT_FINDING/etc.), findings, recommendations, nextReviewDate |
| `propose_approve_policy` | documentId, approvalComments |
| `propose_publish_policy` | documentId, effectiveDate |
| `propose_retire_policy` | documentId, retirementReason, supersededById |

### Exception Mutations (2)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_exception` | documentId, exceptionId, title, description, justification, scope, riskAssessment, residualRisk, approvalLevel, startDate, expiryDate, compensatingControls, reviewFrequency, organisationId |
| `propose_approve_exception` | exceptionId, approvalComments |

### Change Request Mutations (1)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_change_request` | documentId, changeRequestId, title, description, justification, changeType, priority, targetDate, impactAssessment, affectedDocuments, affectedProcesses, organisationId |

## Resources (4)

| URI | Description |
|-----|-------------|
| `policies://document-types` | Document type hierarchy and classification levels |
| `policies://document-lifecycle` | Document lifecycle status transitions |
| `policies://approval-hierarchy` | Approval workflow and hierarchy |
| `policies://data-integrity` | Anti-hallucination guidance for AI consumers |

## Prompts (3)

| Prompt | Description |
|--------|-------------|
| `policy-review` | Review policies due for review, flag overdue, provide action plan |
| `compliance-mapping` | Analyze policy-to-control mapping coverage, identify gaps |
| `policy-health-check` | Comprehensive health check: lifecycle, exceptions, acknowledgments |
