# Controls MCP Server

**Server name**: `riskready-controls`
**Package**: `apps/mcp-server-controls`
**Version**: 0.1.0

Manages ISO 27001 controls, control assessments, Statement of Applicability (SOA), scope items, metrics, and test execution.

## Query Tools (30)

### Controls (8)

| Tool | Description |
|------|-------------|
| `list_controls` | List controls with filters: framework, theme, implementationStatus, applicable. Paginated. |
| `get_control` | Single control with metrics, evidence links, risk scenario links, audit metadata. |
| `get_control_stats` | Aggregate stats: total, by theme, by framework, by implementation status. |
| `search_controls` | Search by name or controlId pattern. Optional framework filter. |
| `find_controls_by_ids` | Bulk lookup by UUID array. |
| `list_scope_items` | List scope items (applications, asset classes, locations, etc.) with filters. |
| `get_scope_item` | Single scope item with usage counts across assessments and tests. |
| `get_effectiveness_report` | Implementation effectiveness rates across applicable, enabled controls. |

### Assessments (6)

| Tool | Description |
|------|-------------|
| `list_assessments` | List assessments with status filter. Returns ref, title, status, dates, test stats. |
| `get_assessment` | Single assessment with controls in scope, scope items, test stats, team, dates. |
| `get_assessment_tests` | Tests within an assessment with status/result filters. |
| `get_assessment_stats` | Aggregate stats: total, by status, completion rates, test result distribution. |
| `get_my_tests` | Tests assigned to a specific tester. |
| `get_my_tests_count` | Per-status test counts for a tester (lightweight). |

### Tests (3)

| Tool | Description |
|------|-------------|
| `get_test` | Full test definition with procedure, evidence requirements, execution history. |
| `get_test_executions` | Execution history for an assessment test instance. |
| `list_test_templates` | Browse test templates grouped by test code pattern. Layer filter (GOV/PLAT/CON/OVS). |

### Metrics (3)

| Tool | Description |
|------|-------------|
| `list_metrics` | Metrics for a control with RAG status, trend, current value. |
| `get_metric` | Single metric with full details and measurement history. |
| `get_metric_dashboard` | Organisation-wide metric summary: RAG distribution, trends, collection status. |

### SOA (5)

| Tool | Description |
|------|-------------|
| `list_soas` | SOA versions with status, approval info, entry counts. |
| `get_soa` | Full SOA with all entries showing applicability decisions and implementation status. |
| `get_soa_entry` | Single SOA entry with applicability decision and linked control details. |
| `get_soa_stats` | Aggregate SOA stats: total, by status, latest SOA entry summary. |
| `get_latest_soa` | Most recent SOA with full entries and summary statistics. |

### Analysis (5)

| Tool | Description |
|------|-------------|
| `get_gap_analysis` | Controls with FAIL or PARTIAL test results. Scoped to assessment or latest completed. |
| `get_overdue_tests` | Tests past their due date. |
| `get_assessment_completion_summary` | Test counts by status/result, completion %, overdue count for an assessment. |
| `get_control_coverage_matrix` | Each applicable control with latest test result and metric RAG status. |
| `get_tester_workload` | Per-tester breakdown of assigned, pending, completed tests. |

## Mutation Tools (38)

All mutations create pending actions requiring human approval.

### Control Mutations (5)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_control` | controlId, name, theme, framework, description, implementationStatus |
| `propose_update_control` | controlId (UUID), name, description, theme, framework, implementationStatus |
| `propose_control_status` | controlId, implementationStatus, applicable, justificationIfNa |
| `propose_disable_control` | controlId, disableReason |
| `propose_enable_control` | controlId |

### Assessment Mutations (13)

| Tool | Key Parameters |
|------|----------------|
| `propose_assessment` | assessmentRef, title, controlIds[], scopeItemIds[], dates (planned, due, period, actual), team (leadTesterId, reviewerId), status |
| `propose_update_assessment` | assessmentId, title, dates (planned, due, period, actual), team, status |
| `propose_delete_assessment` | assessmentId (DRAFT only) |
| `propose_start_assessment` | assessmentId (DRAFT -> IN_PROGRESS) |
| `propose_submit_assessment_review` | assessmentId (IN_PROGRESS -> UNDER_REVIEW) |
| `propose_complete_assessment` | assessmentId, reviewNotes (UNDER_REVIEW -> COMPLETED) |
| `propose_cancel_assessment` | assessmentId, cancelReason |
| `propose_add_assessment_controls` | assessmentId, controlIds[] |
| `propose_remove_assessment_control` | assessmentId, controlId |
| `propose_add_assessment_scope_items` | assessmentId, scopeItemIds[] |
| `propose_remove_assessment_scope_item` | assessmentId, scopeItemId |
| `propose_populate_tests` | assessmentId (auto-generate tests from controls) |
| `propose_bulk_assign_tests` | testIds[], assignedTesterId, ownerId, assessorId |

### Test Mutations (6)

| Tool | Key Parameters |
|------|----------------|
| `propose_test_result` | assessmentTestId, result (PASS/PARTIAL/FAIL/NOT_APPLICABLE), findings, recommendations, testMethod, rootCause, rootCauseNotes, remediationEffort, estimatedHours, estimatedCost, assignedTesterId |
| `propose_remediation` | assessmentTestId, title, description, priority, estimatedHours |
| `propose_update_test` | assessmentTestId, testMethod, ownerId, assessorId, assignedTesterId, status (PENDING/IN_PROGRESS/COMPLETED/SKIPPED), result (PASS/PARTIAL/FAIL/NOT_TESTED/NOT_APPLICABLE) |
| `propose_assign_tester` | assessmentTestId, testerId |
| `propose_update_root_cause` | assessmentTestId, rootCause, remediationEffort, estimatedHours, estimatedCost |
| `propose_skip_test` | assessmentTestId, justification |

### SOA Mutations (8)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_soa` | version, name, notes |
| `propose_create_soa_from_controls` | version, name (pre-populated from applicable controls) |
| `propose_create_soa_version` | sourceSoaId, newVersion, name |
| `propose_update_soa` | soaId, name, notes (DRAFT only) |
| `propose_submit_soa_review` | soaId (DRAFT -> PENDING_REVIEW) |
| `propose_approve_soa` | soaId (PENDING_REVIEW -> APPROVED) |
| `propose_delete_soa` | soaId (DRAFT only) |
| `propose_soa_entry_update` | soaEntryId, applicable, implementationStatus, justificationIfNa |

### Scope Mutations (3)

| Tool | Key Parameters |
|------|----------------|
| `propose_scope_item` | scopeType, code, name, criticality, isActive |
| `propose_update_scope_item` | scopeItemId, name, criticality, isActive |
| `propose_delete_scope_item` | scopeItemId |

### Metric Mutations (1)

| Tool | Key Parameters |
|------|----------------|
| `propose_metric_value` | metricId, value, status (GREEN/AMBER/RED), notes |

## Resources (5)

| URI | Description |
|-----|-------------|
| `controls://frameworks/iso27001` | ISO 27001:2022 control themes and structure |
| `controls://scoring/methodology` | Assessment scoring and effectiveness methodology |
| `controls://soa/guidance` | SOA completion guidance and lifecycle |
| `controls://data-integrity` | Anti-hallucination guidance for AI consumers |
| `controls://assessment/workflow` | Assessment lifecycle and workflow guidance |

## Prompts (4)

| Prompt | Description |
|--------|-------------|
| `gap-analysis` | Analyze control gaps from assessment results and recommend prioritized remediations |
| `soa-review` | Review SOA for completeness and compliance |
| `assessment-plan` | Plan a new control assessment with scope, team, and timeline |
| `control-posture` | Summarize overall control posture and security status |
