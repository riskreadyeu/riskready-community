# API Reference

RiskReady Community Edition REST API.

- **Base URL:** `/api`
- **Authentication:** JWT via HTTP-only cookies. Call `POST /api/auth/login` to authenticate; the session cookie is sent automatically on subsequent requests.
- **Rate limit:** 100 requests per minute per IP address.
- **Public endpoints (no auth required):** `GET /api/health`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- **Pagination:** Most list endpoints accept `skip` (offset) and `take` (page size) query parameters.
- **Common response format:** `{ results: [...], count: N }` for paginated lists.

All other endpoints require a valid JWT session.

---

## Authentication

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Authenticate with `{ email, password }`. Sets HTTP-only cookies and returns `{ user }`. |
| POST | `/api/auth/refresh` | Refresh the access token using the refresh cookie. Returns `{ user }`. |
| POST | `/api/auth/logout` | Clear cookies and invalidate the session. Returns `{ ok: true }`. |
| GET | `/api/auth/me` | Return the currently authenticated user. |
| GET | `/api/auth/users` | List all active users (for selector dropdowns). Returns `{ results, count }`. |

---

## Health

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check (public). Returns `{ ok: true }`. |

---

## Dashboard

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard/metrics` | Aggregate dashboard metrics. Query: `organisationId`. |
| GET | `/api/dashboard/recent-activity` | Recent activity feed. Query: `limit` (default 10). |
| GET | `/api/dashboard/upcoming-tasks` | Upcoming tasks. Query: `limit` (default 10). |
| GET | `/api/dashboard/risk-trends` | Risk trend data. Query: `months` (default 6). |
| GET | `/api/dashboard/compliance` | Compliance summary data. |

---

## Controls

### Controls Library

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/controls` | List controls. Query: `skip`, `take`, `theme`, `framework`, `implementationStatus`, `applicable`, `enabled`, `activeOnly`, `organisationId`, `search`. |
| GET | `/api/controls/stats` | Aggregate control statistics. Query: `organisationId`. |
| GET | `/api/controls/effectiveness` | Control effectiveness report. Query: `organisationId`. |
| GET | `/api/controls/gap-analysis` | Gap analysis report. Query: `organisationId`. |
| GET | `/api/controls/:id` | Get a single control by ID. |
| POST | `/api/controls` | Create a new control. |
| POST | `/api/controls/by-ids` | Bulk fetch controls by IDs. Body: `{ ids: string[] }`. |
| PUT | `/api/controls/:id` | Update a control. |
| POST | `/api/controls/:id/disable` | Soft-disable a control. Body: `{ reason }`. |
| POST | `/api/controls/:id/enable` | Re-enable a disabled control. |

### Assessments

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/assessments` | List assessments. Query: `organisationId`, `status`. |
| POST | `/api/assessments` | Create an assessment. |
| GET | `/api/assessments/:id` | Get a single assessment. |
| PATCH | `/api/assessments/:id` | Update assessment details. |
| DELETE | `/api/assessments/:id` | Delete a DRAFT assessment. |
| POST | `/api/assessments/:id/start` | Transition DRAFT to IN_PROGRESS. |
| POST | `/api/assessments/:id/submit-review` | Transition IN_PROGRESS to UNDER_REVIEW. |
| POST | `/api/assessments/:id/complete` | Transition UNDER_REVIEW to COMPLETED. Body: `{ reviewNotes }`. |
| POST | `/api/assessments/:id/cancel` | Cancel an assessment. Body: `{ reason }`. |
| POST | `/api/assessments/:id/controls` | Add controls to scope. Body: `{ controlIds }`. |
| DELETE | `/api/assessments/:id/controls/:controlId` | Remove a control from scope. |
| POST | `/api/assessments/:id/scope-items` | Add scope items. Body: `{ scopeItemIds }`. |
| DELETE | `/api/assessments/:id/scope-items/:scopeItemId` | Remove a scope item. |
| POST | `/api/assessments/:id/populate` | Auto-generate tests from controls in scope. |
| GET | `/api/assessments/:id/tests` | List tests within an assessment. Query: `status`. |

### Assessment Tests

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/assessment-tests/:testId` | Get a single test. |
| POST | `/api/assessment-tests/:testId/execute` | Record a test result. Body: `{ result, findings, recommendations, ... }`. |
| PATCH | `/api/assessment-tests/:testId` | Update test details (method, owner, etc.). |
| PATCH | `/api/assessment-tests/:testId/assign` | Assign a tester. Body: `{ testerId }`. |
| PATCH | `/api/assessment-tests/:testId/root-cause` | Record root cause analysis for a failed/partial test. |
| POST | `/api/assessment-tests/:testId/skip` | Skip a test with justification. Body: `{ justification }`. |
| GET | `/api/assessment-tests/:testId/executions` | Get execution history for a test. |
| PATCH | `/api/assessment-tests/bulk-assign` | Bulk assign tests. Body: `{ testIds, assignedTesterId, ownerId, assessorId, testMethod }`. |
| GET | `/api/my-tests` | Tests assigned to the current user. Query: `status`, `testMethod`, `role`. |
| GET | `/api/my-tests/count` | Test count summary for the current user. |

### Statement of Applicability (SOA)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/soa` | List SOAs. Query: `skip`, `take`, `organisationId`, `status`. |
| GET | `/api/soa/stats` | SOA statistics. Query: `organisationId`. |
| GET | `/api/soa/latest` | Get the latest SOA. Query: `organisationId`. |
| GET | `/api/soa/:id` | Get an SOA with all entries. |
| POST | `/api/soa` | Create an empty SOA. |
| POST | `/api/soa/from-controls` | Create an SOA pre-populated from applicable controls. |
| POST | `/api/soa/:id/new-version` | Clone a new version from an existing SOA. |
| PUT | `/api/soa/:id` | Update SOA metadata (DRAFT only). |
| PUT | `/api/soa/:id/submit` | Submit SOA for review (DRAFT to PENDING_REVIEW). |
| PUT | `/api/soa/:id/approve` | Approve SOA (PENDING_REVIEW to APPROVED). |
| PUT | `/api/soa/:id/sync-to-controls` | Sync SOA entries back to control records. |
| DELETE | `/api/soa/:id` | Delete a DRAFT SOA. |
| PUT | `/api/soa/entries/:entryId` | Update a single SOA entry. |
| PUT | `/api/soa/:id/entries/bulk` | Bulk update SOA entries. Body: `{ updates: [...] }`. |

### Scope Items

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/scope-items` | List scope items. Query: `orgId`, `scopeType`. |
| GET | `/api/scope-items/:id` | Get a single scope item. |
| POST | `/api/scope-items` | Create a scope item. |
| PATCH | `/api/scope-items/:id` | Update a scope item. |
| DELETE | `/api/scope-items/:id` | Delete a scope item. |

---

## Risks

### Risk Register

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/risks` | List risks. Query: `skip`, `take`, `tier`, `status`, `framework`, `organisationId`, `search`. |
| GET | `/api/risks/stats` | Risk statistics. Query: `organisationId`. |
| GET | `/api/risks/:id` | Get a single risk with details. |
| POST | `/api/risks` | Create a new risk. |
| PUT | `/api/risks/:id` | Update a risk. |
| POST | `/api/risks/:id/disable` | Disable a risk. Body: `{ reason }`. |
| POST | `/api/risks/:id/enable` | Re-enable a risk. |
| GET | `/api/risks/:id/audit` | Audit trail for a risk. Query: `limit`, `offset`. |
| GET | `/api/risks/:id/audit/summary` | Audit summary. Query: `days` (default 30). |

#### Risk Exports

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/risks/export/register` | Export risk register. Query: `organisationId`, `format` (json/csv). |
| GET | `/api/risks/export/heatmap` | Export heat map data. Query: `organisationId`. |
| GET | `/api/risks/export/treatments` | Export treatment summary. Query: `organisationId`. |
| GET | `/api/risks/export/kris` | Export KRI dashboard. Query: `organisationId`. |

#### Risk Scoring

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/risks/scoring/calculate` | Calculate a risk score. Body: `{ likelihood, impact }`. |
| POST | `/api/risks/scoring/calculate-weighted-impact` | Calculate weighted impact. Body: `{ assessments, weights }`. |

#### Control-Risk Effectiveness

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/risks/control-effectiveness/risk/:riskId` | Control effectiveness summary for a risk. |
| GET | `/api/risks/control-effectiveness/risk/:riskId/aggregate` | Aggregated effectiveness data. |
| GET | `/api/risks/control-effectiveness/scenario/:scenarioId` | Control effectiveness for a scenario. |
| POST | `/api/risks/control-effectiveness/scenario/:scenarioId/calculate-residual` | Calculate residual scores from controls. |
| POST | `/api/risks/control-effectiveness/risk/:riskId/recalculate-all` | Recalculate all scenario residuals for a risk. |

### Risk Scenarios

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/risk-scenarios` | List all scenarios. Query: `skip`, `take`. |
| POST | `/api/risk-scenarios` | Create a scenario. |
| GET | `/api/risk-scenarios/risk/:riskId` | List scenarios for a risk. |
| GET | `/api/risk-scenarios/:id` | Get a single scenario. |
| PUT | `/api/risk-scenarios/:id` | Update a scenario. |
| DELETE | `/api/risk-scenarios/:id` | Delete a scenario. |

#### Factor Scores

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/risk-scenarios/:id/factor-scores` | Get F1-F6 likelihood factor scores. |
| PUT | `/api/risk-scenarios/:id/factor-scores` | Update F1-F6 factor scores. |
| GET | `/api/risk-scenarios/:id/factor-evidence` | Get evidence data for F1-F6 factors. |
| GET | `/api/risk-scenarios/:id/residual-factor-scores` | Get residual factor scores. |
| PUT | `/api/risk-scenarios/:id/residual-factor-scores` | Update residual factor scores. |

#### Calculation and Tolerance

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/risk-scenarios/:id/calculation-history` | Calculation history. Query: `limit` (default 20). |
| GET | `/api/risk-scenarios/:id/tolerance-evaluation` | Evaluate tolerance for this scenario's risk. |
| POST | `/api/risk-scenarios/:id/recalculate` | Trigger manual recalculation. |

#### BIRT Impact Assessments

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/risk-scenarios/:id/impact-assessments` | Get impact assessments. Query: `isResidual`. |
| POST | `/api/risk-scenarios/:id/impact-assessments` | Save impact assessments. |
| DELETE | `/api/risk-scenarios/:id/impact-assessments/:category` | Delete a specific category assessment. Query: `isResidual`. |
| DELETE | `/api/risk-scenarios/:id/impact-assessments` | Clear all impact assessments. Query: `isResidual`. |

#### Scenario Control Links

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/risk-scenarios/:id/controls` | List linked controls. |
| POST | `/api/risk-scenarios/:id/controls` | Link a control. Body: `{ controlId, ... }`. |
| PUT | `/api/risk-scenarios/:id/controls/:controlId` | Update a control link. |
| DELETE | `/api/risk-scenarios/:id/controls/:controlId` | Unlink a control. |

### Treatment Plans

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/risks/treatment-plans` | List treatment plans. Query: `skip`, `take`, `status`, `type`, `priority`, `riskId`, `organisationId`. |
| GET | `/api/risks/treatment-plans/stats` | Treatment plan statistics. Query: `organisationId`. |
| GET | `/api/risks/treatment-plans/by-risk/:riskId` | List treatment plans for a specific risk. |
| GET | `/api/risks/treatment-plans/:id` | Get a single treatment plan. |
| POST | `/api/risks/treatment-plans` | Create a treatment plan. |
| PUT | `/api/risks/treatment-plans/:id` | Update a treatment plan. |
| PUT | `/api/risks/treatment-plans/:id/approve` | Approve a treatment plan. |
| PUT | `/api/risks/treatment-plans/:id/progress` | Update progress. Body: `{ progressPercentage, progressNotes }`. |
| DELETE | `/api/risks/treatment-plans/:id` | Delete a treatment plan. |

#### Treatment Actions

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/risks/treatment-plans/:id/actions` | Create a treatment action. |
| PUT | `/api/risks/treatment-plans/actions/:actionId` | Update a treatment action. |
| DELETE | `/api/risks/treatment-plans/actions/:actionId` | Delete a treatment action. |

### Risk Tolerance Statements

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/risks/rts` | List tolerance statements. Query: `skip`, `take`, `status`, `level`, `domain`, `organisationId`. |
| GET | `/api/risks/rts/stats` | RTS statistics. Query: `organisationId`. |
| GET | `/api/risks/rts/by-risk/:riskId` | Tolerance statements linked to a risk. |
| GET | `/api/risks/rts/:id` | Get a single tolerance statement. |
| POST | `/api/risks/rts` | Create a tolerance statement. |
| PUT | `/api/risks/rts/:id` | Update a tolerance statement. |
| PUT | `/api/risks/rts/:id/approve` | Approve a tolerance statement. |
| DELETE | `/api/risks/rts/:id` | Delete a tolerance statement. |
| PUT | `/api/risks/rts/:id/link-risks` | Link risks to a statement. Body: `{ riskIds }`. |
| PUT | `/api/risks/rts/:id/unlink-risks` | Unlink risks from a statement. Body: `{ riskIds }`. |

---

## Audits

### Nonconformities

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/nonconformities` | List nonconformities. Query: `skip`, `take`, `source`, `severity`, `status`, `responsibleUserId`, `controlId`. |
| GET | `/api/nonconformities/stats` | Nonconformity statistics. |
| GET | `/api/nonconformities/users` | Active users (for assignment dropdowns). |
| GET | `/api/nonconformities/:id` | Get a single nonconformity. |
| POST | `/api/nonconformities` | Create a nonconformity. |
| PUT | `/api/nonconformities/:id` | Update a nonconformity. |
| PUT | `/api/nonconformities/:id/close` | Close a nonconformity. Body: `{ closedById }`. |
| PUT | `/api/nonconformities/:id/link-risks` | Link risks. Body: `{ riskIds }`. |
| DELETE | `/api/nonconformities/:id` | Delete a nonconformity. |

#### Corrective Action Plan (CAP) Workflow

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/nonconformities/:id/cap/draft` | Save or update a CAP draft. |
| POST | `/api/nonconformities/:id/cap/submit` | Submit CAP for approval. Body: `{ submittedById }`. |
| POST | `/api/nonconformities/:id/cap/approve` | Approve a CAP. Body: `{ approvedById, approvalComments? }`. |
| POST | `/api/nonconformities/:id/cap/reject` | Reject a CAP. Body: `{ rejectedById, rejectionReason }`. |
| POST | `/api/nonconformities/:id/cap/skip` | Mark CAP as not required (Observations). Body: `{ userId }`. |

---

## Policies

### Policy Documents

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/policies` | List policies. Query: `skip`, `take`, `organisationId`, `documentType`, `status`, `search`, `parentDocumentId`. |
| GET | `/api/policies/stats` | Policy statistics. Query: `organisationId`. |
| GET | `/api/policies/hierarchy` | Document hierarchy tree. Query: `organisationId`. |
| GET | `/api/policies/upcoming-reviews` | Documents due for review. Query: `organisationId`, `days`. |
| GET | `/api/policies/overdue-reviews` | Overdue review documents. Query: `organisationId`. |
| GET | `/api/policies/search` | Advanced search. Query: `organisationId`, `query`, `documentType`, `status`, `tags`, `controlId`, `riskId`, `skip`, `take`. |
| GET | `/api/policies/generate-id` | Generate a document ID. Query: `organisationId`, `documentType`, `parentDocumentId?`. |
| GET | `/api/policies/:id` | Get a single policy document. |
| POST | `/api/policies` | Create a policy document. |
| PUT | `/api/policies/:id` | Update a policy document. |
| PUT | `/api/policies/:id/status` | Update document status. Body: `{ status, userId? }`. |
| DELETE | `/api/policies/:id` | Delete a document. Query: `hard` (default soft-delete). |

### Versions

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/policies/:documentId/versions` | List all versions. |
| GET | `/api/policies/:documentId/versions/history` | Version history. Query: `skip`, `take`. |
| GET | `/api/policies/:documentId/versions/compare` | Compare two versions. Query: `v1`, `v2`. |
| GET | `/api/policies/:documentId/versions/:version` | Get a specific version. |
| POST | `/api/policies/:documentId/versions` | Create a new version. |
| POST | `/api/policies/:documentId/versions/rollback` | Rollback to a previous version. Body: `{ targetVersion }`. |

### Reviews

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/policies/:documentId/reviews` | List reviews for a document. |
| GET | `/api/policies/reviews/upcoming` | Upcoming reviews. Query: `organisationId`, `days`. |
| GET | `/api/policies/reviews/overdue` | Overdue reviews. Query: `organisationId`. |
| GET | `/api/policies/reviews/stats` | Review statistics. Query: `organisationId`. |
| POST | `/api/policies/:documentId/reviews` | Create a review record. |
| PUT | `/api/policies/:documentId/reschedule-review` | Reschedule next review. Body: `{ nextReviewDate }`. |

### Approval Workflows

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/policies/approvals/pending` | Pending approvals for a user. Query: `userId`. |
| GET | `/api/policies/workflows/default-steps` | Default workflow steps. Query: `approvalLevel`. |
| GET | `/api/policies/workflows/approval-matrix` | Approval matrix by document type. |
| GET | `/api/policies/workflows/default-by-type` | Default workflow for a document type. Query: `documentType`, `controlOwnerId?`. |
| GET | `/api/policies/workflows/:id` | Get a workflow. |
| GET | `/api/policies/:documentId/workflows` | List workflows for a document. |
| GET | `/api/policies/:documentId/workflow/current` | Get the current active workflow. |
| GET | `/api/policies/:documentId/workflow/validate` | Validate approvers for a document. |
| POST | `/api/policies/:documentId/workflows` | Create a new approval workflow. |
| POST | `/api/policies/workflows/steps/:stepId/process` | Process a workflow step. Body: `{ decision, comments?, signature?, userId }`. |
| POST | `/api/policies/workflows/steps/:stepId/delegate` | Delegate a step. Body: `{ delegatedToId, userId }`. |
| POST | `/api/policies/workflows/:id/cancel` | Cancel a workflow. Body: `{ userId }`. |

### Change Requests

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/change-requests` | List change requests. Query: `skip`, `take`, `organisationId`, `documentId`, `status`. |
| GET | `/api/change-requests/stats` | Change request statistics. Query: `organisationId`. |
| GET | `/api/change-requests/:id` | Get a single change request. |
| POST | `/api/change-requests` | Create a change request. |
| PUT | `/api/change-requests/:id` | Update a change request. |
| POST | `/api/change-requests/:id/approve` | Approve a change request. |
| POST | `/api/change-requests/:id/reject` | Reject a change request. |
| POST | `/api/change-requests/:id/start-implementation` | Start implementation. Body: `{ implementedById }`. |
| POST | `/api/change-requests/:id/complete` | Complete implementation. Body: `{ newVersionId? }`. |
| POST | `/api/change-requests/:id/verify` | Verify implementation. Body: `{ userId }`. |

### Exceptions

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/exceptions` | List policy exceptions. Query: `skip`, `take`, `organisationId`, `documentId`, `status`. |
| GET | `/api/exceptions/stats` | Exception statistics. Query: `organisationId`. |
| GET | `/api/exceptions/expiring` | Expiring exceptions. Query: `organisationId`, `days`. |
| GET | `/api/exceptions/expired` | Expired exceptions. Query: `organisationId`. |
| GET | `/api/exceptions/:id` | Get a single exception. |
| POST | `/api/exceptions` | Create an exception. |
| POST | `/api/exceptions/:id/approve` | Approve an exception. |
| POST | `/api/exceptions/:id/activate` | Activate an approved exception. |
| POST | `/api/exceptions/:id/revoke` | Revoke an exception. Body: `{ reason, userId }`. |
| POST | `/api/exceptions/:id/close` | Close an exception. Body: `{ reason, userId }`. |
| POST | `/api/exceptions/:id/review` | Record an exception review. Body: `{ userId, notes? }`. |

### Acknowledgments

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/acknowledgments` | List acknowledgments. Query: `skip`, `take`, `documentId`, `userId`, `isAcknowledged`. |
| GET | `/api/acknowledgments/stats` | Acknowledgment statistics. Query: `organisationId`. |
| GET | `/api/acknowledgments/pending` | Pending acknowledgments for a user. Query: `userId`. |
| GET | `/api/acknowledgments/overdue` | Overdue acknowledgments. Query: `organisationId`. |
| GET | `/api/acknowledgments/document/:documentId` | Acknowledgments for a document. |
| GET | `/api/acknowledgments/:id` | Get a single acknowledgment. |
| POST | `/api/acknowledgments/request` | Create acknowledgment requests. Body: `{ documentId, userIds, dueDate? }`. |
| POST | `/api/acknowledgments/:id/acknowledge` | Record an acknowledgment. Body: `{ method, ipAddress?, userAgent? }`. |
| POST | `/api/acknowledgments/:id/reminder` | Send a reminder for a specific acknowledgment. |
| POST | `/api/acknowledgments/bulk-remind` | Bulk send reminders. Body: `{ organisationId, overdueOnly? }`. |

### Attachments

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/policies/:documentId/attachments` | List attachments for a document. |
| GET | `/api/policies/attachments/:id` | Get a single attachment. |
| GET | `/api/policies/:documentId/attachments/by-type/:type` | Attachments by type. |
| GET | `/api/policies/:documentId/attachments/stats` | Attachment statistics. |
| GET | `/api/policies/:documentId/attachments/storage-size` | Document storage usage. |
| POST | `/api/policies/:documentId/attachments` | Upload a file attachment (multipart). |
| POST | `/api/policies/:documentId/attachments/metadata` | Create attachment metadata only. |
| POST | `/api/policies/:documentId/attachments/check-duplicate` | Check for duplicate by checksum. |
| PUT | `/api/policies/attachments/:id` | Update attachment metadata. |
| DELETE | `/api/policies/attachments/:id` | Delete an attachment. |
| GET | `/api/policies/attachments/:id/download` | Download an attachment file. |
| GET | `/api/policies/attachments/:id/verify` | Verify file integrity. |

### Mappings (Controls, Risks, Relations)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/policies/:documentId/controls` | List control mappings for a document. |
| POST | `/api/policies/:documentId/controls` | Map a control to a document. |
| PUT | `/api/policies/control-mappings/:id` | Update a control mapping. |
| DELETE | `/api/policies/control-mappings/:id` | Remove a control mapping. |
| GET | `/api/policies/by-control/:controlId` | Documents linked to a control. |
| GET | `/api/policies/:documentId/risks` | List risk mappings for a document. |
| POST | `/api/policies/:documentId/risks` | Map a risk to a document. |
| PUT | `/api/policies/risk-mappings/:id` | Update a risk mapping. |
| DELETE | `/api/policies/risk-mappings/:id` | Remove a risk mapping. |
| GET | `/api/policies/by-risk/:riskId` | Documents linked to a risk. |
| GET | `/api/policies/:documentId/relations` | List document-to-document relations. |
| POST | `/api/policies/:documentId/relations` | Create a document relation. |
| DELETE | `/api/policies/relations/:id` | Remove a document relation. |
| GET | `/api/policies/reports/control-coverage` | Control coverage report. Query: `organisationId`. |
| GET | `/api/policies/reports/gap-analysis` | Policy gap analysis. Query: `organisationId`. |

### Sections and Document Structure

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/policies/:documentId/sections` | List sections of a document. |
| GET | `/api/policies/sections/:id` | Get a single section. |
| POST | `/api/policies/:documentId/sections` | Create a section. |
| PUT | `/api/policies/sections/:id` | Update a section. |
| DELETE | `/api/policies/sections/:id` | Delete a section. |
| PUT | `/api/policies/:documentId/sections/reorder` | Reorder sections. Body: `{ sectionOrders }`. |
| POST | `/api/policies/:documentId/sections/from-template` | Clone sections from a template. |
| GET | `/api/policies/:documentId/definitions` | List definitions. |
| POST | `/api/policies/:documentId/definitions` | Create a definition. |
| POST | `/api/policies/:documentId/definitions/bulk` | Bulk create definitions. |
| PUT | `/api/policies/definitions/:id` | Update a definition. |
| DELETE | `/api/policies/definitions/:id` | Delete a definition. |
| GET | `/api/policies/:documentId/process-steps` | List process steps. |
| POST | `/api/policies/:documentId/process-steps` | Create a process step. |
| POST | `/api/policies/:documentId/process-steps/bulk` | Bulk create process steps. |
| PUT | `/api/policies/process-steps/:id` | Update a process step. |
| DELETE | `/api/policies/process-steps/:id` | Delete a process step. |
| GET | `/api/policies/:documentId/prerequisites` | List prerequisites. |
| POST | `/api/policies/:documentId/prerequisites` | Create a prerequisite. |
| POST | `/api/policies/:documentId/prerequisites/bulk` | Bulk create prerequisites. |
| PUT | `/api/policies/prerequisites/:id` | Update a prerequisite. |
| DELETE | `/api/policies/prerequisites/:id` | Delete a prerequisite. |
| GET | `/api/policies/:documentId/roles` | List document roles. |
| POST | `/api/policies/:documentId/roles` | Create a role. |
| POST | `/api/policies/:documentId/roles/bulk` | Bulk create roles. |
| PUT | `/api/policies/roles/:id` | Update a role. |
| DELETE | `/api/policies/roles/:id` | Delete a role. |
| GET | `/api/policies/:documentId/revisions` | List revision history. |
| POST | `/api/policies/:documentId/revisions` | Create a revision record. |
| POST | `/api/policies/:documentId/revisions/bulk` | Bulk create revision records. |
| PUT | `/api/policies/revisions/:id` | Update a revision record. |
| DELETE | `/api/policies/revisions/:id` | Delete a revision record. |
| GET | `/api/policies/:documentId/structure` | Get full document structure. |
| POST | `/api/policies/:documentId/structure/clone` | Clone structure from another document. |
| DELETE | `/api/policies/:documentId/structure` | Delete all document structure. |

### Section Templates

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/policies/section-templates` | List section templates. Query: `organisationId`. |
| GET | `/api/policies/section-templates/:id` | Get a template. |
| POST | `/api/policies/section-templates` | Create a template. |
| PUT | `/api/policies/section-templates/:id` | Update a template. |
| DELETE | `/api/policies/section-templates/:id` | Delete a template. |

### Policy Dashboard

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/policies/dashboard/stats` | Dashboard statistics. Query: `organisationId`. |
| GET | `/api/policies/dashboard/compliance` | Compliance status. Query: `organisationId`. |
| GET | `/api/policies/dashboard/actions-needed` | Actions requiring attention. Query: `organisationId`. |
| GET | `/api/policies/dashboard/recent-activity` | Recent activity. Query: `organisationId`, `limit`. |
| GET | `/api/policies/dashboard/activity-stats` | Activity statistics. Query: `organisationId`, `days`. |
| GET | `/api/policies/dashboard/audit-log` | Audit log. Query: `organisationId`, `skip`, `take`, `action`, `startDate`, `endDate`, `userId`. |
| GET | `/api/policies/dashboard/document/:documentId/audit-log` | Audit log for a document. Query: `skip`, `take`, `action`. |

### Policy Evidence Collection

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/policies/evidence/collect/:organisationId` | Trigger evidence collection for Control 5.1. |
| GET | `/api/policies/evidence/summary/:organisationId` | Evidence collection summary. |

---

## Incidents

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/incidents` | List incidents. Query: `skip`, `take`, `status`, `severity`, `category`, `source`, `handlerId`, `incidentManagerId`, `organisationId`, `search`, `dateFrom`, `dateTo`, `isConfirmed`. |
| GET | `/api/incidents/stats` | Incident statistics. Query: `organisationId`. |
| GET | `/api/incidents/dashboard` | Incident dashboard data. Query: `organisationId`. |
| GET | `/api/incidents/:id` | Get a single incident. |
| POST | `/api/incidents` | Create an incident. |
| PUT | `/api/incidents/:id` | Update an incident. |
| DELETE | `/api/incidents/:id` | Delete an incident. |
| PUT | `/api/incidents/:id/status` | Update incident status. Body: `{ status, notes? }`. |
| POST | `/api/incidents/:id/classify` | Auto-classify an incident. |
| GET | `/api/incidents/:id/compliance-status` | Get compliance classification status. |

### Regulatory Assessments

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/incidents/:id/nis2-assessment` | Perform NIS2 significance assessment. |
| POST | `/api/incidents/:id/dora-assessment` | Perform DORA major incident assessment. |
| PUT | `/api/incidents/:id/nis2-override` | Override NIS2 classification. Body: `{ isSignificant, justification }`. |
| PUT | `/api/incidents/:id/dora-override` | Override DORA classification. Body: `{ isMajor, justification }`. |

### Incident Assets and Controls

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/incidents/:id/assets` | Add an affected asset. Body: `{ assetId, impactType, notes? }`. |
| DELETE | `/api/incidents/:id/assets/:assetId` | Remove an affected asset. |
| POST | `/api/incidents/:id/controls` | Link a control. Body: `{ controlId, linkType, notes? }`. |
| DELETE | `/api/incidents/:id/controls/:controlId` | Unlink a control. |
| POST | `/api/incidents/:id/create-notifications` | Create required regulatory notifications. |

### Incident Timeline

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/incidents/:incidentId/timeline` | List timeline entries. Query: `entryType`, `visibility`, `skip`, `take`. |
| GET | `/api/incidents/:incidentId/timeline/:id` | Get a single timeline entry. |
| POST | `/api/incidents/:incidentId/timeline` | Create a timeline entry. |
| PUT | `/api/incidents/:incidentId/timeline/:id` | Update a timeline entry (manual only). |
| DELETE | `/api/incidents/:incidentId/timeline/:id` | Delete a timeline entry (manual only). |

### Incident Evidence

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/incidents/:incidentId/evidence` | List evidence items. Query: `evidenceType`, `skip`, `take`. |
| GET | `/api/incidents/:incidentId/evidence/:id` | Get a single evidence item. |
| POST | `/api/incidents/:incidentId/evidence` | Create an evidence item. |
| PUT | `/api/incidents/:incidentId/evidence/:id` | Update an evidence item. |
| DELETE | `/api/incidents/:incidentId/evidence/:id` | Delete an evidence item. |
| PUT | `/api/incidents/:incidentId/evidence/:id/chain-of-custody` | Update chain of custody. Body: `{ notes, action }`. |

### Incident Lessons Learned

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/incidents/:incidentId/lessons-learned` | List lessons learned. Query: `category`, `status`, `skip`, `take`. |
| GET | `/api/incidents/:incidentId/lessons-learned/:id` | Get a single lesson. |
| POST | `/api/incidents/:incidentId/lessons-learned` | Create a lesson learned. |
| PUT | `/api/incidents/:incidentId/lessons-learned/:id` | Update a lesson learned. |
| DELETE | `/api/incidents/:incidentId/lessons-learned/:id` | Delete a lesson learned. |
| POST | `/api/incidents/:incidentId/lessons-learned/:id/link-nonconformity` | Link to a nonconformity. Body: `{ nonconformityId }`. |

---

## Evidence

### Evidence Library

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/evidence` | List evidence items. Query: `skip`, `take`, `evidenceType`, `status`, `classification`, `sourceType`, `category`, `search`, `collectedById`, `validUntilBefore`, `validUntilAfter`. |
| GET | `/api/evidence/stats` | Evidence statistics. |
| GET | `/api/evidence/expiring` | Expiring evidence items. Query: `days` (default 30). |
| GET | `/api/evidence/:id` | Get a single evidence item. |
| POST | `/api/evidence` | Create an evidence item. |
| PUT | `/api/evidence/:id` | Update an evidence item. |
| DELETE | `/api/evidence/:id` | Delete an evidence item. |

#### Evidence Workflow

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/evidence/:id/submit-for-review` | Submit evidence for review. Body: `{ userId }`. |
| POST | `/api/evidence/:id/approve` | Approve evidence. Body: `{ userId, notes? }`. |
| POST | `/api/evidence/:id/reject` | Reject evidence. Body: `{ userId, reason }`. |
| POST | `/api/evidence/:id/archive` | Archive evidence. Body: `{ userId }`. |
| POST | `/api/evidence/:id/new-version` | Create a new version of evidence. |

### Evidence Links

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/evidence-links` | Link evidence to an entity. Body: `{ evidenceId, entityType, entityId, linkType?, notes? }`. |
| DELETE | `/api/evidence-links` | Unlink evidence. Query: `evidenceId`, `entityType`, `entityId`. |
| GET | `/api/evidence-links/entity/:entityType/:entityId` | Get evidence linked to an entity. |
| POST | `/api/evidence-links/bulk` | Bulk link evidence. Body: `{ evidenceIds, entityType, entityId }`. |

Supported entity types: `control`, `layer`, `nonconformity`, `incident`, `risk`, `treatment`, `policy`, `vendor`, `assessment`, `contract`, `asset`, `change`, `application`, `isra`.

### Evidence Requests

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/evidence-requests` | List requests. Query: `skip`, `take`, `status`, `priority`, `assignedToId`, `assignedDepartmentId`, `requestedById`, `contextType`, `contextId`, `overdue`. |
| GET | `/api/evidence-requests/stats` | Request statistics. |
| GET | `/api/evidence-requests/my-requests/:userId` | Requests assigned to a user. |
| GET | `/api/evidence-requests/:id` | Get a single request. |
| POST | `/api/evidence-requests` | Create a request. |
| PUT | `/api/evidence-requests/:id` | Update a request. |
| DELETE | `/api/evidence-requests/:id` | Delete a request. |
| POST | `/api/evidence-requests/:id/start-progress` | Mark request as in progress. |
| POST | `/api/evidence-requests/:id/submit` | Submit evidence for a request. Body: `{ evidenceId, userId, notes? }`. |
| POST | `/api/evidence-requests/:id/accept` | Accept submitted evidence. |
| POST | `/api/evidence-requests/:id/reject` | Reject submitted evidence. Body: `{ reason }`. |
| POST | `/api/evidence-requests/:id/cancel` | Cancel a request. |

### Evidence Migration (Admin)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/evidence-migration/run` | Run full migration of legacy evidence. Query: `dryRun`. |
| POST | `/api/evidence-migration/incident-evidence` | Migrate incident evidence. Query: `dryRun`. |
| POST | `/api/evidence-migration/document-attachments` | Migrate document attachments. Query: `dryRun`. |
| POST | `/api/evidence-migration/vendor-documents` | Migrate vendor documents. Query: `dryRun`. |

---

## ITSM

### ITSM Dashboard

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/itsm/dashboard` | Aggregated ITSM dashboard (assets, changes, capacity). |

### Assets

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/itsm/assets` | List assets. Query: `skip`, `take`, `assetType`, `status`, `businessCriticality`, `dataClassification`, `departmentId`, `locationId`, `ownerId`, `cloudProvider`, `inIsmsScope`, `capacityStatus`, `search`. |
| GET | `/api/itsm/assets/summary` | Asset summary statistics. |
| GET | `/api/itsm/assets/data-quality` | Data quality report. |
| GET | `/api/itsm/assets/export/template` | CSV import template. |
| GET | `/api/itsm/assets/generate-tag/:assetType` | Generate an asset tag. |
| GET | `/api/itsm/assets/by-tag/:assetTag` | Find asset by tag. |
| GET | `/api/itsm/assets/:id` | Get a single asset. |
| GET | `/api/itsm/assets/:id/vulnerabilities` | Asset vulnerabilities. |
| GET | `/api/itsm/assets/:id/impact` | Impact analysis. |
| POST | `/api/itsm/assets` | Create an asset. |
| POST | `/api/itsm/assets/import` | Bulk import assets. |
| POST | `/api/itsm/assets/:id/calculate-risk` | Calculate risk score for an asset. |
| POST | `/api/itsm/assets/calculate-all-risk-scores` | Recalculate all asset risk scores. |
| PUT | `/api/itsm/assets/:id` | Update an asset. |
| DELETE | `/api/itsm/assets/:id` | Delete an asset. |

### Asset Relationships

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/itsm/asset-relationships` | List relationships. Query: `skip`, `take`, `relationshipType`, `isCritical`. |
| GET | `/api/itsm/asset-relationships/by-asset/:assetId` | Relationships for an asset. Query: `direction` (outgoing/incoming/all). |
| GET | `/api/itsm/asset-relationships/dependency-chain/:assetId` | Dependency chain. Query: `depth` (default 3). |
| POST | `/api/itsm/asset-relationships` | Create a relationship. |
| PUT | `/api/itsm/asset-relationships/:id` | Update a relationship. |
| DELETE | `/api/itsm/asset-relationships/:id` | Delete a relationship. |

### Asset-Risk Links

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/itsm/asset-risks/by-asset/:assetId` | Risks linked to an asset. |
| GET | `/api/itsm/asset-risks/by-risk/:riskId` | Assets linked to a risk. |
| GET | `/api/itsm/asset-risks/summary` | Asset-risk link summary. |
| POST | `/api/itsm/asset-risks` | Link an asset to a risk. |
| POST | `/api/itsm/asset-risks/bulk/:riskId` | Bulk link assets to a risk. |
| DELETE | `/api/itsm/asset-risks/:assetId/:riskId` | Unlink an asset from a risk. |

### Changes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/itsm/changes` | List changes. Query: `skip`, `take`, `status`, `changeType`, `category`, `priority`, `securityImpact`, `requesterId`, `departmentId`, `search`. |
| GET | `/api/itsm/changes/summary` | Change summary statistics. |
| GET | `/api/itsm/changes/calendar` | Change calendar. Query: `startDate`, `endDate`. |
| GET | `/api/itsm/changes/cab-dashboard` | CAB (Change Advisory Board) dashboard. |
| GET | `/api/itsm/changes/:id` | Get a single change. |
| GET | `/api/itsm/changes/:id/history` | Change history. |
| POST | `/api/itsm/changes` | Create a change request. |
| PUT | `/api/itsm/changes/:id` | Update a change. |
| POST | `/api/itsm/changes/:id/submit` | Submit a change for approval. |
| POST | `/api/itsm/changes/:id/assets` | Link assets to a change. Body: `{ assets: [{ assetId, impactType, notes? }] }`. |
| DELETE | `/api/itsm/changes/:id` | Delete a change. |

### Change Approvals

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/itsm/change-approvals/pending` | Pending approvals for the current user. |
| GET | `/api/itsm/change-approvals/by-change/:changeId` | Approvals for a change. |
| POST | `/api/itsm/change-approvals/request/:changeId` | Request approvals. Body: `{ approvers: [{ userId, role, isRequired? }] }`. |
| POST | `/api/itsm/change-approvals/:id/approve` | Approve. Body: `{ comments?, conditions? }`. |
| POST | `/api/itsm/change-approvals/:id/reject` | Reject. Body: `{ comments }`. |

### Change Templates

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/itsm/change-templates` | List templates. Query: `skip`, `take`, `isActive`, `category`, `search`. |
| GET | `/api/itsm/change-templates/generate-code/:category` | Generate a template code. |
| GET | `/api/itsm/change-templates/by-code/:code` | Find template by code. |
| GET | `/api/itsm/change-templates/:id` | Get a single template. |
| POST | `/api/itsm/change-templates` | Create a template. |
| POST | `/api/itsm/change-templates/:id/create-change` | Create a change from a template. |
| PUT | `/api/itsm/change-templates/:id` | Update a template. |
| PUT | `/api/itsm/change-templates/:id/toggle-active` | Toggle template active status. Body: `{ isActive }`. |
| DELETE | `/api/itsm/change-templates/:id` | Delete a template. |

### Capacity Management

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/itsm/capacity/summary` | Capacity summary across assets. |
| GET | `/api/itsm/capacity/at-risk` | Assets at capacity risk. |
| GET | `/api/itsm/capacity/history/:assetId` | Capacity history. Query: `days` (default 30). |
| GET | `/api/itsm/capacity/trend/:assetId` | Capacity trend analysis. |
| POST | `/api/itsm/capacity/record/:assetId` | Record a capacity measurement. |
| GET | `/api/itsm/capacity/plans` | List capacity plans. Query: `skip`, `take`, `status`, `assetId`. |
| GET | `/api/itsm/capacity/plans/:id` | Get a capacity plan. |
| POST | `/api/itsm/capacity/plans` | Create a capacity plan. |
| PUT | `/api/itsm/capacity/plans/:id` | Update a capacity plan. |

---

## Organisation

### Organisation Dashboard

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/dashboard/overview` | Organisation overview. |
| GET | `/api/organisation/dashboard/insights` | Organisation insights. |
| GET | `/api/organisation/dashboard/department-summary` | Department summary. |

### Organisation Profiles

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/profiles` | List organisations. Query: `skip`, `take`. |
| GET | `/api/organisation/profiles/dashboard-summary` | Dashboard summary. |
| GET | `/api/organisation/profiles/:id` | Get a single organisation. |
| POST | `/api/organisation/profiles` | Create an organisation. |
| PUT | `/api/organisation/profiles/:id` | Update an organisation. |
| PATCH | `/api/organisation/profiles/:id` | Partial update an organisation. |
| DELETE | `/api/organisation/profiles/:id` | Delete an organisation. |

### Departments

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/departments` | List departments. Query: `skip`, `take`, `isActive`, `criticalityLevel`. |
| GET | `/api/organisation/departments/summary` | Department summary. |
| GET | `/api/organisation/departments/hierarchy` | Department hierarchy. |
| GET | `/api/organisation/departments/:id` | Get a single department. |
| POST | `/api/organisation/departments` | Create a department. |
| PUT | `/api/organisation/departments/:id` | Update a department. |
| DELETE | `/api/organisation/departments/:id` | Delete a department. |

### Locations

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/locations` | List locations. Query: `skip`, `take`, `country`. |
| GET | `/api/organisation/locations/:id` | Get a single location. |
| POST | `/api/organisation/locations` | Create a location. |
| PUT | `/api/organisation/locations/:id` | Update a location. |
| DELETE | `/api/organisation/locations/:id` | Delete a location. |

### Organisational Units

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/units` | List units. Query: `skip`, `take`. |
| GET | `/api/organisation/units/:id` | Get a single unit. |
| POST | `/api/organisation/units` | Create a unit. |
| PUT | `/api/organisation/units/:id` | Update a unit. |
| DELETE | `/api/organisation/units/:id` | Delete a unit. |

### Security Committees

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/security-committees` | List committees. Query: `skip`, `take`, `committeeType`, `isActive`. |
| GET | `/api/organisation/security-committees/:id` | Get a single committee. |
| POST | `/api/organisation/security-committees` | Create a committee. |
| PUT | `/api/organisation/security-committees/:id` | Update a committee. |
| DELETE | `/api/organisation/security-committees/:id` | Delete a committee. |

### Committee Meetings

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/committee-meetings` | List meetings. Query: `skip`, `take`, `committeeId`, `status`. |
| GET | `/api/organisation/committee-meetings/upcoming` | Upcoming meetings. Query: `days` (default 30). |
| GET | `/api/organisation/committee-meetings/:id` | Get a single meeting. |
| POST | `/api/organisation/committee-meetings` | Create a meeting. |
| PUT | `/api/organisation/committee-meetings/:id` | Update a meeting. |
| DELETE | `/api/organisation/committee-meetings/:id` | Delete a meeting. |

### Key Personnel

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/key-personnel` | List key personnel. Query: `skip`, `take`, `isActive`, `ismsRole`. |
| GET | `/api/organisation/key-personnel/summary` | Personnel summary. |
| GET | `/api/organisation/key-personnel/by-role/:role` | Personnel by ISMS role. |
| GET | `/api/organisation/key-personnel/:id` | Get a single record. |
| POST | `/api/organisation/key-personnel` | Create a key personnel record. |
| PUT | `/api/organisation/key-personnel/:id` | Update a record. |
| DELETE | `/api/organisation/key-personnel/:id` | Delete a record. |

### Business Processes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/processes` | List processes. Query: `skip`, `take`, `departmentId`, `processType`, `criticalityLevel`, `bcpEnabled`. |
| GET | `/api/organisation/processes/metrics` | Process metrics. |
| GET | `/api/organisation/processes/:id` | Get a single process. |
| POST | `/api/organisation/processes` | Create a process. |
| PUT | `/api/organisation/processes/:id` | Update a process. |
| DELETE | `/api/organisation/processes/:id` | Delete a process. |

### External Dependencies

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/dependencies` | List dependencies. Query: `skip`, `take`, `dependencyType`, `criticalityLevel`. |
| GET | `/api/organisation/dependencies/risk-assessment` | Dependency risk assessment. |
| GET | `/api/organisation/dependencies/:id` | Get a single dependency. |
| POST | `/api/organisation/dependencies` | Create a dependency. |
| PUT | `/api/organisation/dependencies/:id` | Update a dependency. |
| DELETE | `/api/organisation/dependencies/:id` | Delete a dependency. |

### Regulators

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/regulators` | List regulators. Query: `skip`, `take`, `regulatorType`, `isActive`. |
| GET | `/api/organisation/regulators/compliance-dashboard` | Regulatory compliance dashboard. |
| GET | `/api/organisation/regulators/:id` | Get a single regulator. |
| POST | `/api/organisation/regulators` | Create a regulator. |
| PUT | `/api/organisation/regulators/:id` | Update a regulator. |
| DELETE | `/api/organisation/regulators/:id` | Delete a regulator. |

### Applicable Frameworks

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/applicable-frameworks` | List frameworks. Query: `skip`, `take`, `isApplicable`, `frameworkType`, `complianceStatus`. |
| GET | `/api/organisation/applicable-frameworks/summary` | Framework summary. |
| GET | `/api/organisation/applicable-frameworks/applicable` | List only applicable frameworks. |
| GET | `/api/organisation/applicable-frameworks/by-type/:type` | Frameworks by type. |
| GET | `/api/organisation/applicable-frameworks/:id` | Get a single framework. |
| POST | `/api/organisation/applicable-frameworks` | Create a framework. |
| PUT | `/api/organisation/applicable-frameworks/:id` | Update a framework. |
| DELETE | `/api/organisation/applicable-frameworks/:id` | Delete a framework. |

### Context Issues

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/context-issues` | List context issues. Query: `skip`, `take`, `isActive`, `issueType`, `category`, `status`. |
| GET | `/api/organisation/context-issues/summary` | Context issues summary. |
| GET | `/api/organisation/context-issues/:id` | Get a single context issue. |
| POST | `/api/organisation/context-issues` | Create a context issue. |
| PUT | `/api/organisation/context-issues/:id` | Update a context issue. |
| DELETE | `/api/organisation/context-issues/:id` | Delete a context issue. |

### Interested Parties

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/interested-parties` | List interested parties. Query: `skip`, `take`, `isActive`, `partyType`, `powerLevel`. |
| GET | `/api/organisation/interested-parties/summary` | Interested parties summary. |
| GET | `/api/organisation/interested-parties/:id` | Get a single interested party. |
| POST | `/api/organisation/interested-parties` | Create an interested party. |
| PUT | `/api/organisation/interested-parties/:id` | Update an interested party. |
| DELETE | `/api/organisation/interested-parties/:id` | Delete an interested party. |

### Regulatory Eligibility Surveys

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/organisation/regulatory-eligibility/surveys` | List surveys. Query: `skip`, `take`, `surveyType`, `status`. |
| GET | `/api/organisation/regulatory-eligibility/surveys/:id` | Get a single survey. |
| POST | `/api/organisation/regulatory-eligibility/surveys` | Create a survey. |
| PUT | `/api/organisation/regulatory-eligibility/surveys/:id` | Update a survey. |
| DELETE | `/api/organisation/regulatory-eligibility/surveys/:id` | Delete a survey. |
| POST | `/api/organisation/regulatory-eligibility/surveys/:surveyId/responses` | Save a survey response. Body: `{ questionId, answer, notes? }`. |
| POST | `/api/organisation/regulatory-eligibility/surveys/:id/complete` | Complete a survey and optionally propagate scope. |
| GET | `/api/organisation/regulatory-eligibility/questions` | List all questions. Query: `surveyType`. |
| GET | `/api/organisation/regulatory-eligibility/questions/:surveyType` | Questions by survey type (dora/nis2). |
| POST | `/api/organisation/regulatory-eligibility/questions` | Create a question. |
| PUT | `/api/organisation/regulatory-eligibility/questions/:id` | Update a question. |
| POST | `/api/organisation/regulatory-eligibility/questions/seed` | Seed default questions. |
| GET | `/api/organisation/regulatory-eligibility/propagation-preview` | Preview scope propagation. |
| POST | `/api/organisation/regulatory-eligibility/propagate-scope` | Trigger regulatory scope propagation. |

---

## Gateway Config

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/gateway-config` | Get AI gateway configuration. Query: `organisationId`. |
| PUT | `/api/gateway-config` | Update AI gateway configuration. Query: `organisationId`. Body: `{ anthropicApiKey?, agentModel?, gatewayUrl?, maxAgentTurns? }`. |

---

## MCP Approvals

Human-in-the-loop approval queue for actions proposed by MCP (Model Context Protocol) AI agents.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/mcp-approvals` | List pending actions. Query: `status`, `actionType`, `organisationId`, `skip`, `take`. |
| GET | `/api/mcp-approvals/stats` | Approval queue statistics. Query: `organisationId`. |
| GET | `/api/mcp-approvals/:id` | Get a single action with full payload. |
| POST | `/api/mcp-approvals/:id/approve` | Approve and execute an action. Body: `{ reviewNotes? }`. |
| POST | `/api/mcp-approvals/:id/reject` | Reject an action. Body: `{ reviewNotes }`. |
| POST | `/api/mcp-approvals/:id/retry` | Retry a failed action execution. |

---

## Error Responses

All endpoints return standard HTTP status codes:

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing or expired JWT) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate record) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

Error response body format:

```json
{
  "statusCode": 400,
  "message": "Description of the error",
  "error": "Bad Request"
}
```
