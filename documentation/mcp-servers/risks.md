# Risks MCP Server

**Server name**: `riskready-risks`
**Package**: `apps/mcp-server-risks`
**Version**: 0.1.0

Manages the risk register, risk scenarios, Key Risk Indicators (KRIs), Risk Tolerance Statements (RTS), and treatment plans.

## Query Tools (22)

### Risks (4)

| Tool | Description |
|------|-------------|
| `list_risks` | List risks with filters: status, tier, framework, organisationId. Paginated. |
| `get_risk` | Single risk with scenarios, KRIs, treatment plans, tolerance statements, audit metadata. |
| `search_risks` | Search by title or riskId pattern. |
| `get_risk_stats` | Aggregate stats: total, by status, by tier, by framework, scenario and KRI counts. |

### Scenarios (3)

| Tool | Description |
|------|-------------|
| `list_scenarios` | List scenarios with filters: riskId, status, toleranceStatus. Paginated. |
| `get_scenario` | Single scenario with likelihood, impact, inherent/residual scores, controls, state history. |
| `get_scenario_scores` | 5x5 matrix scores: likelihood, impact, inherentScore, residualScore, residualLikelihood, residualImpact. |

### Key Risk Indicators (3)

| Tool | Description |
|------|-------------|
| `list_kris` | List KRIs with filters: riskId, RAG status, tier. Paginated. |
| `get_kri` | Single KRI with full details and measurement history. |
| `get_kri_dashboard` | Organisation-wide KRI summary: RAG distribution, trends, collection status. |

### Risk Tolerance Statements (3)

| Tool | Description |
|------|-------------|
| `list_rts` | List RTS with status filter. Paginated. |
| `get_rts` | Single RTS with linked risks, evaluations, approval info. |
| `get_rts_stats` | Aggregate RTS stats: total, by status, by tolerance level. |

### Treatment Plans (3)

| Tool | Description |
|------|-------------|
| `list_treatment_plans` | List treatments with filters: status, type, priority, riskId. Paginated. |
| `get_treatment_plan` | Single treatment with actions, dependencies, history, financial info. |
| `get_treatment_stats` | Aggregate stats: total, by status, by type, progress distribution. |

### Analysis (6)

| Tool | Description |
|------|-------------|
| `get_risk_heatmap` | Likelihood x impact matrix for all scenarios. |
| `get_tolerance_breaches` | Scenarios exceeding RTS thresholds. |
| `get_treatment_progress` | Overall treatment completion rates and overdue treatments. |
| `get_kri_alerts` | KRIs in RED status or DECLINING trend. |
| `get_risk_dashboard` | Aggregate risk posture: counts, distribution, tolerance, treatment progress. |
| `get_overdue_treatments` | Treatment plans past target end date. |

## Mutation Tools (11)

### Risk Mutations (2)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_risk` | riskId, title, description, tier, framework, status, source, priority, parentRiskId, notes |
| `propose_update_risk` | riskId (UUID), title, description, status, tier, source, priority, framework, parentRiskId, notes |

### Scenario Mutations (3)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_scenario` | scenarioId, title, cause, event, consequence, riskId, status, notes |
| `propose_transition_scenario` | scenarioId, targetStatus, justification |
| `propose_assess_scenario` | scenarioId, assessmentType (inherent/residual), likelihood, impact, notes |

### KRI Mutations (2)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_kri` | kriId, name, description, unit, riskId, frequency, greenThreshold, amberThreshold, redThreshold, breachThreshold, notes |
| `propose_record_kri_value` | kriId, value, status (GREEN/AMBER/RED), notes |

### RTS Mutations (2)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_rts` | rtsId, title, objective, proposedRTS, domain, proposedToleranceLevel, notes |
| `propose_approve_rts` | rtsId, approvalComments |

### Treatment Mutations (2)

| Tool | Key Parameters |
|------|----------------|
| `propose_create_treatment_plan` | treatmentId, title, description, treatmentType, priority, riskId, status, targetDate, budget, estimatedCost, notes |
| `propose_create_treatment_action` | actionId, title, description, treatmentPlanId, status, priority, targetDate, estimatedHours, notes |

## Resources (5)

| URI | Description |
|-----|-------------|
| `risks://frameworks/iso31000` | ISO 31000 risk management framework structure |
| `risks://scoring/methodology` | 5x5 risk matrix methodology: likelihood (RARE–ALMOST_CERTAIN) x impact (NEGLIGIBLE–SEVERE), scored 1–25 |
| `risks://tolerance/guidance` | Risk tolerance and appetite framework guidance |
| `risks://treatment/workflow` | Treatment plan lifecycle and action tracking |
| `risks://data-integrity` | Anti-hallucination guidance for AI consumers |

## Prompts (4)

| Prompt | Description |
|--------|-------------|
| `risk-assessment-workflow` | Guide through complete risk assessment: identify, analyze, evaluate, treat |
| `tolerance-review` | Review tolerance breaches and recommend remediation |
| `treatment-effectiveness` | Analyze treatment progress and identify gaps |
| `kri-trend-analysis` | Analyze KRI trends and predict potential risk increases |
