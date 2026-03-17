# Tool Reference

**Total Tools:** 38 (31 query tools + 7 mutation tools)

**Tool Domains:**
- Control Tools (5 tools)
- Layer Tools (4 tools)
- Assessment Tools (5 tools)
- Test Tools (3 tools)
- Metric Tools (3 tools)
- SOA Tools (3 tools)
- Cross-Reference Tools (3 tools)
- Analysis Tools (5 tools)
- Mutation Tools (7 tools)

## General Notes

**Return Format:** All tools return JSON-formatted text content. No binary responses.

**Pagination:** Tools that return lists support `skip` and `take` parameters. Default `take` is typically 50, maximum varies by tool (50-200).

**Not Found Behavior:** If a requested record is not found, tools return a simple text response like `"Control not found"` or a JSON object with an error field.

**Filtering:** Many tools support optional filters (status, framework, theme, etc.). When omitted, no filter is applied.

**UUIDs vs IDs:** The database uses UUIDs for record primary keys (`id`). Some entities also have human-readable identifiers like `controlId` (e.g., "A.5.1"), `assessmentRef` (e.g., "ASM-2026-001"), etc. Tool parameters specify which type is expected.

---

## Control Tools

Tools for browsing, searching, and analyzing the control library.

### list_controls

List controls from the library with optional filters.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| framework | enum | No | - | Filter by control framework: ISO, SOC2, NIS2, DORA |
| theme | enum | No | - | Filter by ISO 27001 theme: ORGANISATIONAL, PEOPLE, PHYSICAL, TECHNOLOGICAL |
| implementationStatus | enum | No | - | Filter by implementation status: NOT_STARTED, PARTIAL, IMPLEMENTED |
| applicable | boolean | No | - | Filter by applicability (true/false) |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 200) |

**Returns:** JSON object with `count`, `page`, and `results` array. Each result includes control ID, name, theme, framework, implementation status, applicability, enabled status, and counts of layers, evidence links, and scenario links.

---

### get_control

Get a single control with full details.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Control UUID |

**Returns:** Full control record including all layers (with tests and activities), evidence links, risk scenario links, and audit metadata (created/updated by).

---

### get_control_stats

Get aggregate statistics for the control library.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| _(none)_ | - | - | - | No parameters required |

**Returns:** JSON object with total control count, counts by theme, counts by framework, counts by implementation status, total layer count, and total test count.

---

### search_controls

Search controls by name or controlId pattern.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search term (matches against name, controlId, and description) |
| framework | enum | No | - | Limit search to a specific framework: ISO, SOC2, NIS2, DORA |

**Returns:** JSON object with `count` and `results` array (max 50 results). Each result includes control UUID, controlId, name, theme, framework, implementation status, and applicability.

---

### get_control_effectiveness

Get effectiveness rating for a control based on test results across all layers.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| controlId | string | Yes | - | Control UUID |

**Returns:** JSON object with control ID, name, implementation status, test counts (total, pass, partial, fail, not tested), weighted effectiveness score (0-100), and per-layer protection scores.

---

## Layer Tools

Tools for managing the four-layer assurance framework (Governance, Platform, Consumption, Oversight).

### list_layers

List the four assurance layers for a control with protection scores and test counts.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| controlId | string | Yes | - | Control UUID |

**Returns:** JSON object with `controlId`, `count`, and `layers` array. Each layer includes layer type, description, default owner role, test frequency, protection score, tests passed/total, last tested date, next test due date, and counts of tests and activities.

---

### get_layer

Get a single control layer with full details.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | ControlLayer UUID |

**Returns:** Full layer record including control reference, owner information (default and alternate), all tests with latest assessment results, and all activities with metrics.

---

### get_layer_tests

Get all tests for a layer with their latest assessment results.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| layerId | string | Yes | - | ControlLayer UUID |

**Returns:** JSON object with `layerId`, `count`, and `tests` array. Each test includes test code, name, description, preconditions, test steps, expected result, evidence requirements, estimated duration, activity reference, and latest assessment test result.

---

### get_layer_activities

Get activities grouped within a layer, with their tests and metrics counts.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| layerId | string | Yes | - | ControlLayer UUID |

**Returns:** JSON object with `layerId`, `count`, and `activities` array. Each activity includes activity ID, name, type, description, test criteria, evidence required, protection score, tests passed/total, scope type, list of tests, and list of metrics.

---

## Assessment Tools

Tools for creating and tracking control assessments with test assignments.

### list_assessments

List control assessments with optional status filter.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | enum | No | - | Filter by assessment status: DRAFT, IN_PROGRESS, UNDER_REVIEW, COMPLETED, CANCELLED |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 200) |

**Returns:** JSON object with `count`, `page`, and `results` array. Each result includes assessment UUID, reference, title, status, dates (planned start/end, due date), test statistics (total/completed/passed/failed), lead tester, and counts of controls and scope items.

---

### get_assessment

Get a single assessment with full details.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | Assessment UUID |

**Returns:** Full assessment record including lead tester, reviewer, controls in scope, scope items, and audit metadata.

---

### get_assessment_tests

Get tests within an assessment with optional status/result filters.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assessmentId | string | Yes | - | Assessment UUID |
| status | enum | No | - | Filter by test status: PENDING, IN_PROGRESS, COMPLETED, SKIPPED |
| result | enum | No | - | Filter by test result: PASS, PARTIAL, FAIL, NOT_TESTED, NOT_APPLICABLE |

**Returns:** JSON object with `assessmentId`, `count`, and `tests` array. Each test includes status, result, findings, recommendations, root cause, remediation effort, test method, layer test reference (with control info), scope item, assigned tester, and execution count.

---

### get_assessment_stats

Get aggregate assessment statistics.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| _(none)_ | - | - | - | No parameters required |

**Returns:** JSON object with total assessment count, counts by status, test result distribution, and average completion percentage for in-progress assessments.

---

### get_my_tests

Get tests assigned to a specific tester.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| testerId | string | Yes | - | User UUID of the tester |
| status | enum | No | - | Filter by test status: PENDING, IN_PROGRESS, COMPLETED, SKIPPED |

**Returns:** JSON object with `testerId`, `count`, and `tests` array. Each test includes status, result, test method, assessment reference, layer test details (with control info), scope item, and estimated duration.

---

## Test Tools

Tools for managing test procedures, executions, and templates.

### get_test

Get a full test definition (LayerTest) with procedure, evidence requirements, and preconditions.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | LayerTest UUID |

**Returns:** Full test record including layer reference (with control info), activity reference, preconditions, test steps, expected result, evidence requirements, estimated duration, and audit metadata.

---

### get_test_executions

Get execution history for an assessment test instance.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assessmentTestId | string | Yes | - | AssessmentTest UUID |

**Returns:** JSON object with assessment test summary and `executions` array. Each execution includes execution date, result, findings, recommendations, evidence location, evidence notes, duration, samples reviewed, period covered, and tester.

---

### list_test_templates

Browse layer test templates.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| layer | enum | No | - | Filter by layer type: GOVERNANCE, PLATFORM, CONSUMPTION, OVERSIGHT |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 200) |

**Returns:** JSON object with `count`, `page`, and `results` array. Each template includes layer, template code, name, description, preconditions, test steps, expected result, evidence requirements, evidence types, estimated duration, standard flag, and usage count.

---

## Metric Tools

Tools for tracking operational metrics with RAG status and trends.

### list_metrics

List metrics for a control activity with RAG status, trend, and current value.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| activityId | string | Yes | - | ControlActivity UUID |

**Returns:** JSON object with `activityId`, `count`, and `metrics` array. Each metric includes metric ID, name, description, formula, unit, thresholds (green/amber/red), current value, RAG status, trend, last measured date, collection frequency, automation status, and owner.

---

### get_metric

Get a single control metric with full details and measurement history.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | ControlMetric UUID |

**Returns:** Full metric record including activity reference (with layer and control info), all thresholds, current status, and measurement history (last 20 entries with values, status, dates, and notes).

---

### get_metric_dashboard

Get an organisation-wide metric summary.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| _(none)_ | - | - | - | No parameters required |

**Returns:** JSON object with total metric count, RAG status distribution, trend breakdown, automation status distribution, overdue count, and list of overdue metrics (up to 20).

---

## SOA Tools

Tools for managing Statement of Applicability for compliance frameworks.

### list_soas

List Statement of Applicability (SOA) versions with status, approval info, and entry counts.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | enum | No | - | Filter by SOA status: DRAFT, PENDING_REVIEW, APPROVED, SUPERSEDED |
| skip | number | No | 0 | Pagination offset |
| take | number | No | 20 | Page size (max 50) |

**Returns:** JSON object with `count`, `page`, and `results` array. Each result includes SOA UUID, version, status, name, notes, approval date, approver, entry count, and timestamps.

---

### get_soa

Get a full Statement of Applicability with all entries.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | StatementOfApplicability UUID |

**Returns:** Full SOA record including approver, creator, all entries (control ID, name, theme, applicability, justification if N/A, implementation status, implementation description), and summary statistics (total/applicable/N/A/implemented/partial/not started counts).

---

### get_soa_entry

Get a single SOA entry with applicability decision and implementation status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | Yes | - | SOAEntry UUID |

**Returns:** Full SOA entry record including SOA reference, control ID, name, theme, applicability flag, justification, implementation status, implementation description, and linked control record (if exists).

---

## Cross-Reference Tools

Tools for mapping controls across multiple frameworks.

### get_cross_references

Get framework cross-reference mappings for a control.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| controlId | string | Yes | - | Control ID string (e.g., "A.5.1", "CC1.1") — NOT the UUID |
| framework | enum | No | - | Filter to a specific target framework: ISO, SOC2, NIS2, DORA |

**Returns:** JSON object with `controlId`, mappings from control (as source), mappings to control (as target), and total mappings count. Each mapping includes source/target framework, source/target control ID, mapping strength, and notes.

---

### get_domain_matrix

Get the control domain matrix showing how functional domains map across all frameworks.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| _(none)_ | - | - | - | No parameters required |

**Returns:** JSON object with `count` and `domains` array. Each domain includes domain code, name, description, sort order, and framework-specific control references.

---

### search_framework_mappings

Find equivalent controls in a target framework given a source framework control.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| sourceFramework | enum | Yes | - | Source framework: ISO, SOC2, NIS2, DORA |
| sourceControlId | string | Yes | - | Source control ID (e.g., "A.5.1", "CC1.1") |
| targetFramework | enum | Yes | - | Target framework to find equivalents in: ISO, SOC2, NIS2, DORA |

**Returns:** JSON object with source/target framework and control ID, direct mappings, reverse mappings, and total found count. Each mapping includes mapping strength and notes.

---

## Analysis Tools

Tools for gap analysis, protection scores, and overdue test identification.

### get_gap_analysis

Get gap analysis from assessment results — identifies controls with FAIL or PARTIAL test results.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assessmentId | string | No | - | Assessment UUID (if omitted, uses latest completed or in-progress assessment) |

**Returns:** JSON object with assessment ID, total gaps, fail/partial counts, controls affected count, and gaps grouped by control. Each gap includes test code, test name, layer, result, findings, recommendations, root cause, remediation effort, and scope item.

---

### get_protection_scores

Get organisation-wide protection scores by control and layer.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| _(none)_ | - | - | - | No parameters required |

**Returns:** JSON object with total controls, scored controls count, organisation-wide average score, status distribution (COMPLETE/GOOD/PARTIAL/ATTENTION/NOT_TESTED), and full control list with per-control overall score, status, and per-layer scores.

---

### get_control_score

Get detailed protection score breakdown for a single control across all four assurance layers.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| controlId | string | Yes | - | Control UUID |

**Returns:** Full control record with overall protection score, status, and detailed layer breakdown including per-layer score, tests passed/total, last tested date, next test due, and activity-level scores.

---

### get_overdue_tests

Get control layer tests that are past their next due date.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| skip | number | No | 0 | Pagination offset |
| take | number | No | 50 | Page size (max 200) |

**Returns:** JSON object with `count`, `page`, and `results` array. Each result includes layer UUID, layer type, test frequency, last tested date, next test due date, protection score, default owner role, control reference, and default owner.

---

## Mutation Tools

All mutation tools propose changes via the approval queue pattern. They create `McpPendingAction` records that must be reviewed and approved by a human before execution. This ensures safe LLM interaction with critical control data.

### propose_assessment

Propose creating a new control assessment.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| assessmentRef | string | Yes | - | Assessment reference ID (e.g., "ASM-2026-001") |
| title | string | Yes | - | Assessment title |
| description | string | No | - | Assessment description |
| plannedStartDate | string | No | - | Planned start date (ISO 8601) |
| plannedEndDate | string | No | - | Planned end date (ISO 8601) |
| reason | string | No | - | Explain WHY this change is proposed — shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** JSON object with confirmation message, action ID, and status (PENDING). If the assessment reference already exists, returns an error.

---

### propose_soa_entry_update

Propose updating an SOA entry — change applicability or implementation status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| soaEntryId | string | Yes | - | SOAEntry UUID |
| applicable | boolean | No | - | Change applicability |
| justificationIfNa | string | No | - | Justification if marking not applicable |
| implementationStatus | enum | No | - | New implementation status: NOT_STARTED, PARTIAL, IMPLEMENTED |
| implementationDesc | string | No | - | Implementation description |
| reason | string | No | - | Explain WHY this change is proposed — shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** JSON object with confirmation message, action ID, and status (PENDING). At least one field must be provided to update.

---

### propose_test_result

Propose recording a test result for an assessment test.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assessmentTestId | string | Yes | - | AssessmentTest UUID |
| result | enum | Yes | - | Test result: PASS, PARTIAL, FAIL, NOT_APPLICABLE |
| findings | string | No | - | Test findings |
| recommendations | string | No | - | Recommendations |
| rootCause | enum | No | - | Root cause category (for FAIL/PARTIAL): PEOPLE, PROCESS, TECHNOLOGY, BUDGET, THIRD_PARTY, DESIGN, UNKNOWN |
| rootCauseNotes | string | No | - | Root cause notes |
| remediationEffort | enum | No | - | Remediation effort: TRIVIAL, MINOR, MODERATE, MAJOR, STRATEGIC |
| reason | string | No | - | Explain WHY this change is proposed — shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** JSON object with confirmation message including test code and assessment reference, action ID, and status (PENDING).

---

### propose_remediation

Propose a remediation action for a failed assessment test.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assessmentTestId | string | Yes | - | AssessmentTest UUID (the failed/partial test) |
| title | string | Yes | - | Remediation action title |
| description | string | No | - | Detailed description of the remediation |
| priority | enum | No | MEDIUM | Priority level: CRITICAL, HIGH, MEDIUM, LOW |
| estimatedHours | number | No | - | Estimated hours to complete |
| reason | string | No | - | Explain WHY this change is proposed — shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** JSON object with confirmation message including test code and remediation title, action ID, and status (PENDING).

---

### propose_metric_value

Propose recording a new metric measurement value.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| metricId | string | Yes | - | ControlMetric UUID |
| value | string | Yes | - | New measurement value (e.g., "95%", "3", "14 days") |
| status | enum | Yes | - | RAG status for this measurement: GREEN, AMBER, RED |
| notes | string | No | - | Measurement notes |
| reason | string | No | - | Explain WHY this change is proposed — shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** JSON object with confirmation message including metric ID, value, and status, action ID, and status (PENDING).

---

### propose_control_status

Propose changing a control's implementation status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| controlId | string | Yes | - | Control UUID |
| implementationStatus | enum | Yes | - | New implementation status: NOT_STARTED, PARTIAL, IMPLEMENTED |
| implementationDesc | string | No | - | Implementation description |
| reason | string | No | - | Explain WHY this change is proposed — shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** JSON object with confirmation message showing control ID and status transition, action ID, and status (PENDING). Returns error if control is already at the requested status.

---

### propose_scope_item

Propose adding a new scope item (application, asset class, location, etc.) for assessment testing.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation UUID |
| scopeType | enum | Yes | - | Scope type: APPLICATION, ASSET_CLASS, LOCATION, PERSONNEL_TYPE, BUSINESS_UNIT, PLATFORM, PROVIDER, NETWORK_ZONE, PROCESS |
| code | string | Yes | - | Unique scope item code (e.g., "APP-001", "LOC-HQ") |
| name | string | Yes | - | Scope item name |
| description | string | No | - | Description |
| criticality | enum | No | MEDIUM | Criticality level: CRITICAL, HIGH, MEDIUM, LOW |
| reason | string | No | - | Explain WHY this change is proposed — shown to human reviewers |
| mcpSessionId | string | No | - | MCP session identifier for tracking |

**Returns:** JSON object with confirmation message including scope item code, name, and type, action ID, and status (PENDING). Returns error if scope item code already exists.

---

## Approval Queue Pattern

All mutation tools follow the same pattern:

1. **Validation** — Check that referenced entities exist and operation is valid
2. **Proposal Creation** — Create `McpPendingAction` record with action type, summary, reason, and payload
3. **Return Confirmation** — Return action ID and PENDING status to the LLM
4. **Human Review** — A human reviews the proposal via the RiskReady UI or admin interface
5. **Execution or Rejection** — If approved, a background service executes the action and updates the action status to EXECUTED. If rejected, status becomes REJECTED with rejection reason.

This pattern allows LLM agents to confidently propose control operations while maintaining human oversight for all data modifications.
