# Policies MCP Server - Tool Reference

Complete reference for all tools exposed by the Policies MCP server.

## Documents

### list_policy_documents

List policy documents with filtering and pagination.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentType | string | No | - | Filter by document type (POLICY, STANDARD, PROCEDURE, WORK_INSTRUCTION, FORM, TEMPLATE, CHECKLIST, GUIDELINE, RECORD) |
| status | string | No | - | Filter by status (DRAFT, PENDING_REVIEW, PENDING_APPROVAL, APPROVED, PUBLISHED, UNDER_REVISION, SUPERSEDED, RETIRED, ARCHIVED) |
| classification | string | No | - | Filter by classification level (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED) |
| organisationId | string | No | - | Filter by organisation ID |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** JSON with count, pagination info, and array of policy documents with basic fields and relation counts.

### get_policy_document

Get detailed policy document information with relations.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Policy document ID |

**Returns:** Complete policy document with parent/child documents, version history (last 5), sections, control mappings, owner, and author user details.

### search_policy_documents

Search policy documents by text query.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search query text |
| organisationId | string | No | - | Filter by organisation ID |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** JSON with count and matching documents. Searches across title, content, summary, and purpose fields (case-insensitive).

### get_document_hierarchy

Get document hierarchy showing parent-child relationships.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation ID |

**Returns:** Tree structure of policy documents starting from top-level (no parent), with up to 3 levels of nesting.

## Sections

### get_document_sections

Get all sections for a document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | Yes | - | Document ID |

**Returns:** Array of document sections ordered by order field, with template information.

### get_section_templates

Get document section templates.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| sectionType | string | No | - | Filter by section type |
| organisationId | string | No | - | Filter by organisation ID |

**Returns:** Array of section templates ordered by default order.

### get_document_definitions

Get all definitions for a document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | Yes | - | Document ID |

**Returns:** Array of document definitions ordered by order field.

### get_document_process_steps

Get all process steps for a document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | Yes | - | Document ID |

**Returns:** Array of process steps ordered by order field.

### get_document_roles

Get all roles and responsibilities for a document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | Yes | - | Document ID |

**Returns:** Array of document roles ordered by order field.

## Versions

### list_document_versions

List all versions for a policy document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | Yes | - | Policy document ID |

**Returns:** Array of document versions ordered by creation date (descending), with creator user details.

### get_document_version

Get detailed information about a specific document version.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Document version ID |

**Returns:** Document version details with creator user information, or not found message.

## Approvals

### list_approval_workflows

List document approval workflows with filtering and pagination.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | No | - | Filter by document ID |
| workflowType | string | No | - | Filter by workflow type |
| status | string | No | - | Filter by status (PENDING, IN_PROGRESS, APPROVED, REJECTED, CANCELLED, ESCALATED) |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** JSON with count and array of approval workflows with document, initiator, and step counts.

### get_approval_workflow

Get detailed information about a specific approval workflow.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Approval workflow ID |

**Returns:** Complete workflow with document, ordered steps (with approver and delegated user details), and initiator information.

### get_pending_approvals

Get pending approval steps across all workflows.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | No | - | Filter by organisation ID |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** JSON with count and array of pending approval steps, ordered by due date (ascending), with workflow, document, and approver details.

## Acknowledgments

### list_acknowledgments

List document acknowledgments with filtering and pagination.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | No | - | Filter by document ID |
| isAcknowledged | boolean | No | - | Filter by acknowledgment status |
| isOverdue | boolean | No | - | Filter by overdue status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** JSON with count and array of acknowledgments with user and document details.

### get_acknowledgment_stats

Get acknowledgment statistics for a document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | Yes | - | Document ID |

**Returns:** Statistics including total count, acknowledged count, overdue count, and completion rate percentage.

## Change Requests

### list_change_requests

List document change requests with filtering and pagination.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | No | - | Filter by document ID |
| status | string | No | - | Filter by status (SUBMITTED, UNDER_REVIEW, APPROVED, IN_PROGRESS, IMPLEMENTED, VERIFIED, REJECTED, CANCELLED) |
| priority | string | No | - | Filter by priority (CRITICAL, HIGH, MEDIUM, LOW) |
| organisationId | string | No | - | Filter by organisation ID |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** JSON with count and array of change requests with document and requester details.

### get_change_request

Get detailed information about a specific change request.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Change request ID |

**Returns:** Complete change request with document, requester, approver, and implementer user details.

## Reviews

### list_document_reviews

List document reviews with filtering and pagination.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | No | - | Filter by document ID |
| reviewType | string | No | - | Filter by review type (SCHEDULED, TRIGGERED, AUDIT_FINDING, INCIDENT_RESPONSE, REGULATORY_CHANGE, REQUEST) |
| outcome | string | No | - | Filter by outcome (NO_CHANGES, MINOR_CHANGES, MAJOR_CHANGES, SUPERSEDE, RETIRE) |
| dateFrom | string | No | - | Filter reviews from this date (ISO 8601) |
| dateTo | string | No | - | Filter reviews to this date (ISO 8601) |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** JSON with count and array of reviews with document and reviewer details.

### get_document_review

Get detailed information about a specific document review.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Document review ID |

**Returns:** Complete review with document and reviewer details.

### get_overdue_reviews

Get policy documents with overdue reviews.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | No | - | Filter by organisation ID |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** JSON with count and array of documents with nextReviewDate in the past, limited to APPROVED and PUBLISHED status, ordered by review date (ascending).

## Exceptions

### list_document_exceptions

List document exceptions with filtering and pagination.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | No | - | Filter by document ID |
| status | string | No | - | Filter by status (REQUESTED, UNDER_REVIEW, APPROVED, ACTIVE, EXPIRED, REVOKED, CLOSED) |
| organisationId | string | No | - | Filter by organisation ID |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** JSON with count and array of exceptions with document and requester details.

### get_document_exception

Get detailed information about a specific document exception.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Exception ID |

**Returns:** Complete exception with document, requester, and approver details.

### get_expiring_exceptions

Get document exceptions expiring within specified days.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| daysAhead | number | No | 30 | Number of days ahead to check |
| organisationId | string | No | - | Filter by organisation ID |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Number of results (max 200) |

**Returns:** JSON with count and array of ACTIVE exceptions expiring between now and future date, ordered by expiry date (ascending).

## Mappings

### get_document_control_mappings

Get control mappings for a specific document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | Yes | - | Document ID |

**Returns:** Array of control mappings with control details (ID, controlId, name, framework, theme).

### get_document_risk_mappings

Get risk mappings for a specific document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | Yes | - | Document ID |

**Returns:** Array of risk mappings with risk details (ID, riskId, title, tier, status).

### get_document_relations

Get related documents for a specific document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | Yes | - | Document ID |

**Returns:** Array of document relations where the specified document is either source or target, with full document details.

### get_control_policy_coverage

Get policy document coverage for a specific control.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| controlId | string | Yes | - | Control ID |

**Returns:** Array of document mappings for this control, with document details (ID, documentId, title, type, status, classification).

## External Requirements

### list_external_sources

List external requirement sources (regulations, certifications, contracts, insurance, industry standards).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| type | enum | No | - | Filter by source type (REGULATORY, CERTIFICATION, INSURANCE, CONTRACT, INDUSTRY_STANDARD) |
| isActive | boolean | No | - | Filter by active status |
| isApplicable | boolean | No | - | Filter by applicability |
| organisationId | string | No | - | Filter by organisation UUID |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 200) |

**Returns:** JSON with count and array of external sources with section counts.

### get_external_source

Get full detail of an external requirement source.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | ExternalSource UUID |

**Returns:** Complete external source with top-level sections (parentSectionId null), requirement counts, and creator details.

### list_requirement_sections

List sections within an external source, optionally filtered to a parent section.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| sourceId | string | Yes | - | ExternalSource UUID |
| parentSectionId | string | No | - | Filter to children of this section (null for top-level) |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 200) |

**Returns:** JSON with count and array of requirement sections with requirement and child section counts.

### get_requirement_section

Get a requirement section with its child sections and requirements.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | RequirementSection UUID |

**Returns:** Section with source, parent section, ordered child sections, and ordered requirements with mapping counts.

### get_requirement

Get a single requirement with full description, control mappings, and activity mappings.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Requirement UUID |

**Returns:** Complete requirement with section, source, control mappings (with control details), and activity mappings (with activity details).

### search_requirements

Search requirements by text across title and description.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search text |
| sourceId | string | No | - | Limit to a specific source |
| mandatory | boolean | No | - | Filter by mandatory status |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 200) |

**Returns:** JSON with count and matching requirements with section and source context, plus mapping counts.

### get_requirement_control_mappings

Get all control mappings for a requirement.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| requirementId | string | Yes | - | Requirement UUID |

**Returns:** JSON with requirementId, count, and array of mappings showing which controls address this requirement and their coverage level.

### get_requirement_activity_mappings

Get all activity mappings for a requirement.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| requirementId | string | Yes | - | Requirement UUID |

**Returns:** JSON with requirementId, count, and array of mappings showing which control activities address this requirement and their coverage level.

### get_requirement_coverage_stats

Get coverage statistics for an external source.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| sourceId | string | Yes | - | ExternalSource UUID |

**Returns:** Statistics showing total requirements, mandatory count, and coverage breakdown (FULL, PARTIAL, SUPPORTS, NOT_ASSESSED, unmapped) with overall coverage percentage.

### get_unmapped_requirements

Find requirements from an external source that have no control or activity mappings.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| sourceId | string | Yes | - | ExternalSource UUID |
| mandatoryOnly | boolean | No | true | Only show mandatory requirements |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 200) |

**Returns:** JSON with count and array of unmapped requirements (compliance gaps) with section context.

## Analysis

### get_policy_stats

Get policy document statistics.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | No | - | Filter by organisation ID |

**Returns:** Statistics including total count, grouped counts by document type, status, classification, and count of overdue reviews.

### get_policy_dashboard

Get policy management dashboard overview.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation ID |

**Returns:** Dashboard metrics including total documents, published count, draft count, overdue reviews, acknowledgment completion rate, active exceptions, and pending change requests.

### get_policy_compliance_matrix

Get policy compliance matrix showing control coverage.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation ID |

**Returns:** Compliance matrix with total mappings, grouped by mapping type, and grouped by coverage level.

## Mutations

All mutation tools create pending actions requiring human approval. They do NOT directly modify data.

### propose_policy_document

Propose creating a new policy document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| documentId | string | Yes | - | Document reference ID (e.g. "POL-001") |
| title | string | Yes | - | Document title |
| documentType | string | Yes | - | Document type (POLICY, STANDARD, PROCEDURE, WORK_INSTRUCTION, GUIDELINE) |
| purpose | string | Yes | - | Document purpose statement |
| scope | string | Yes | - | Document scope |
| content | string | Yes | - | Document content |
| classification | string | No | INTERNAL | Classification level (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED) |
| approvalLevel | string | No | MANAGEMENT | Required approval level |
| reason | string | No | - | Explain WHY this document is proposed |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** JSON with message, actionId, and PENDING status. Proposal enters approval queue for human review.

### propose_change_request

Propose a change request for an existing policy document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | Yes | - | PolicyDocument UUID |
| title | string | Yes | - | Change request title |
| description | string | Yes | - | Detailed description of the change |
| justification | string | Yes | - | Justification for the change |
| changeType | string | Yes | - | Type of change (MINOR_UPDATE, CLARIFICATION, ENHANCEMENT, CORRECTION, REGULATORY_UPDATE, MAJOR_REVISION) |
| priority | string | No | MEDIUM | Priority (CRITICAL, HIGH, MEDIUM, LOW) |
| reason | string | No | - | Explain WHY this change is proposed |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** JSON with message, actionId, and PENDING status.

### propose_exception

Propose an exception to a policy document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | Yes | - | PolicyDocument UUID |
| exceptionId | string | Yes | - | Exception reference ID (e.g. "EXC-001") |
| title | string | Yes | - | Exception title |
| description | string | Yes | - | Exception description |
| justification | string | Yes | - | Justification for the exception |
| scope | string | Yes | - | Scope of the exception |
| riskAssessment | string | Yes | - | Risk assessment of granting this exception |
| residualRisk | string | Yes | - | Residual risk level |
| compensatingControls | string | No | - | Compensating controls in place |
| reason | string | No | - | Explain WHY this exception is proposed |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** JSON with message, actionId, and PENDING status.

### propose_review

Propose triggering a review for a policy document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | Yes | - | PolicyDocument UUID |
| reviewType | string | Yes | - | Review type (SCHEDULED, TRIGGERED, AUDIT_FINDING, INCIDENT_RESPONSE, REGULATORY_CHANGE, REQUEST) |
| reason | string | No | - | Explain WHY this review is proposed |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** JSON with message, actionId, and PENDING status.

### propose_policy_status_update

Propose updating the status of a policy document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| policyId | string | Yes | - | PolicyDocument UUID |
| newStatus | string | Yes | - | New status (DRAFT, UNDER_REVIEW, APPROVED, PUBLISHED, RETIRED, SUPERSEDED) |
| reason | string | No | - | Explain WHY this status update is proposed |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** JSON with message showing status transition, actionId, and PENDING status.

### propose_policy_update

Propose updating fields of a policy document.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| policyId | string | Yes | - | PolicyDocument UUID |
| title | string | No | - | New title |
| description | string | No | - | New description |
| scope | string | No | - | New scope |
| version | string | No | - | New version |
| reason | string | No | - | Explain WHY this update is proposed |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** JSON with message showing fields to update, actionId, and PENDING status.
