# Tool Reference

34 tools organised into 8 domains: Risk Register, Scenarios, KRIs, Treatment Plans, Threat Catalog, Governance, Analysis, and Mutation Proposals.

All tools return JSON. List tools support pagination via `skip`/`take` parameters (max 200 per request). Entity lookups return `"<Entity> not found"` when the ID does not match.

---

## Risk Register (3 tools)

### `list_risks`

List risks from the register with optional filters. Ordered by residual score descending.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tier` | enum | No | - | `TIER_1`, `TIER_2`, `TIER_3` |
| `status` | string | No | - | e.g. `IDENTIFIED`, `ASSESSED`, `TREATING` |
| `framework` | string | No | - | e.g. `ISO`, `SOC2`, `NIST` |
| `skip` | int | No | `0` | Pagination offset |
| `take` | int | No | `50` | Page size (1-200) |

**Returns:** `{ count, page: { skip, take }, results: Risk[] }` where each risk includes `_count` of scenarios and KRIs.

---

### `get_risk`

Get a single risk with full details.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Risk UUID |

**Returns:** Risk with nested scenarios (id, title, status, scores, tolerance), KRIs (id, name, value, RAG thresholds), treatment plans (id, title, status, type, progress), and audit metadata (createdBy, updatedBy).

---

### `get_risk_stats`

Aggregate statistics for the entire risk register. No parameters.

**Returns:** `{ total, scenarioCount, kriCount, byTier, byStatus, byFramework }` with counts per group.

---

## Scenarios (7 tools)

### `list_scenarios`

List risk scenarios for a given risk. Ordered by residual score descending.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `riskId` | string | Yes | Parent risk UUID |

**Returns:** Array of scenarios with id, scenarioId, title, status, cause, event, consequence, likelihood, impact, inherentScore, residualScore, toleranceStatus, toleranceGap, framework, lastCalculatedAt.

---

### `get_scenario`

Get a risk scenario with full details.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Scenario UUID |

**Returns:** Scenario with parent risk, control links (with control details), threat links (with threat details), treatment plans, impact assessments, and audit metadata.

---

### `get_scenario_factors`

Get likelihood factor scores (F1-F6) for a scenario.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scenarioId` | string | Yes | Scenario UUID |

**Returns:** Structured factor breakdown:
- **Inherent factors** (weighted): F1 Threat Frequency (34%), F2 Vulnerability/Ease of Exploit (33%), F3 Attack Surface (33%) - each with score, override flag, justification, source
- **Supplementary factors** (0% weight, informational): F4 Incident History, F5 External Exposure (legacy), F6 Environmental
- `calculatedLikelihood`, `lastCalculatedAt`, `allScored` boolean

---

### `get_scenario_impacts`

Get BIRT impact assessments (I1-I5) for a scenario.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scenarioId` | string | Yes | Scenario UUID |

**Returns:**
- Factor scores: I1 Financial, I2 Operational, I3 Regulatory, I4 Reputational, I5 Strategic
- `weightedImpact`, `calculatedImpact`
- `birtAssessments` array with detailed category-level assessments

---

### `get_linked_controls`

Get controls linked to a scenario with effectiveness weights.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scenarioId` | string | Yes | Scenario UUID |

**Returns:** Array of `RiskScenarioControl` with nested control details (controlId, name, description, implementationStatus, framework).

---

### `get_linked_threats`

Get threat catalog entries linked to a scenario.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scenarioId` | string | Yes | Scenario UUID |

**Returns:** Array of `RiskScenarioThreat` with full threat details.

---

### `get_calculation_history`

Get risk score calculation history for a scenario. Shows how scores changed over time.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `scenarioId` | string | Yes | - | Scenario UUID |
| `limit` | int | No | `10` | Number of records (1-50) |

**Returns:** Array of `RiskCalculationHistory` ordered by `calculatedAt` descending, with calculation traces and the user who triggered each calculation.

---

## Key Risk Indicators (3 tools)

### `list_kris`

List KRIs with RAG status, thresholds, and current values.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `riskId` | string | No | - | Filter by parent risk UUID |
| `status` | enum | No | - | `GREEN`, `AMBER`, `RED` |
| `skip` | int | No | `0` | Pagination offset |
| `take` | int | No | `50` | Page size (1-200) |

**Returns:** `{ count, results: KRI[] }` with each KRI including parent risk reference.

---

### `get_kri`

Get a KRI with full details and measurement history.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | KRI UUID |

**Returns:** KRI with parent risk, plus last 20 entries from `history` ordered by `measuredAt` descending.

---

### `get_kri_dashboard`

KRI dashboard summary. No parameters.

**Returns:** `{ total, statusCounts: { GREEN, AMBER, RED }, tierCounts, breachedCount }` where `breachedCount = RED + AMBER`.

---

## Treatment Plans (3 tools)

### `list_treatments`

List treatment plans with optional filters.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `riskId` | string | No | - | Filter by risk UUID |
| `status` | string | No | - | `DRAFT`, `APPROVED`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE` |
| `skip` | int | No | `0` | Pagination offset |
| `take` | int | No | `50` | Page size (1-200) |

**Returns:** `{ count, results: TreatmentPlan[] }` with parent risk and actions list.

---

### `get_treatment`

Get a treatment plan with full details.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Treatment plan UUID |

**Returns:** Treatment plan with parent risk, linked scenario, actions (with assignee details), and audit metadata (createdBy).

---

### `get_treatment_stats`

Aggregate treatment plan statistics. No parameters.

**Returns:** `{ total, overdueCount, byStatus, byType }` where `overdueCount` is plans past `targetEndDate` that are not completed or cancelled.

---

## Threat Catalog (4 tools)

### `list_threats`

Browse the threat catalog.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | No | - | e.g. `CYBER`, `PHYSICAL`, `INSIDER` |
| `trend` | enum | No | - | `INCREASING`, `STABLE`, `DECREASING` |
| `skip` | int | No | `0` | Pagination offset |
| `take` | int | No | `50` | Page size (1-200) |

**Returns:** `{ count, results: ThreatCatalog[] }` ordered by `baseLikelihood` descending.

---

### `get_threat`

Get a threat catalog entry with full details.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Threat catalog UUID |

**Returns:** Threat with MITRE mapping, base likelihood, trend, countermeasures, and linked scenarios (with scenario title and residual score).

---

### `get_threat_dashboard`

Threat landscape overview. No parameters.

**Returns:** `{ total, byCategory, byTrend, emergingThreats }` where `emergingThreats` is the top 10 threats with `INCREASING` trend.

---

### `get_emerging_threats`

Threats with increasing trend. No parameters.

**Returns:** Up to 20 threats with `INCREASING` trend, ordered by `baseLikelihood` descending.

---

## Governance (4 tools)

### `get_raci_matrix`

Get the RACI matrix for risk governance activities. No parameters.

**Returns:**
- `roles` array: roleCode, name, description
- `matrix` array: for each activity, the RACI assignment per role (R/A/C/I or null)

---

### `get_escalation_levels`

Get escalation level rules. No parameters.

**Returns:** Array of escalation levels with score thresholds, approver roles, and response time requirements, ordered by `sortOrder`.

---

### `get_reassessment_triggers`

Get triggers that cause risk re-evaluation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | e.g. `INCIDENT`, `CONTROL`, `ENVIRONMENTAL` |

**Returns:** Array of reassessment triggers ordered by category.

---

### `get_governance_dashboard`

Governance overview. No parameters.

**Returns:** `{ roleCount, activityCount, overdueReviewCount, upcomingReviews, overdueReviews }` where upcoming = next 30 days, overdue = past due date.

---

## Analysis (4 tools)

### `get_control_effectiveness`

Aggregated control effectiveness for a scenario. Derives effectiveness from layer test results.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scenarioId` | string | Yes | Scenario UUID |

**Returns:**
- `controlCount`, `averageScore` (0-100), `strength` rating (`STRONG` >= 80, `MODERATE` >= 60, `WEAK` >= 40, `MINIMAL` > 0, `NONE` = 0)
- Per-control breakdown: controlId, name, effectivenessScore, weight, isPrimary

Effectiveness is calculated from the latest layer test results: PASS = 100, PARTIAL = 50, FAIL = 0.

---

### `get_risk_appetite_status`

Evaluate a scenario against the organisation's risk appetite.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scenarioId` | string | Yes | Scenario UUID |

**Returns:** scenarioId, riskId, residualScore, toleranceThreshold, toleranceStatus, toleranceGap, plus last 5 breach alerts.

---

### `get_appetite_stats`

Overall risk appetite posture for an organisation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organisationId` | string | Yes | Organisation UUID |

**Returns:** Active config (version, name), domain configurations (domain, appetiteLevel, threshold), tolerance stats across all scenarios, count of active breach alerts.

---

### `run_fair_simulation`

FAIR Monte Carlo simulation. Provide threat event frequency and single loss expectancy ranges, get annual loss distribution.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tefMin` | number | Yes | - | TEF minimum (events/year) |
| `tefMode` | number | Yes | - | TEF most likely (events/year) |
| `tefMax` | number | Yes | - | TEF maximum (events/year) |
| `sleLow` | number | Yes | - | SLE minimum ($) |
| `sleMode` | number | Yes | - | SLE most likely ($) |
| `sleHigh` | number | Yes | - | SLE maximum ($) |
| `iterations` | int | No | `10000` | Simulation iterations (100-100,000) |

**Returns:**
- Inputs echo
- Results: aleMean, aleMedian, aleMin, aleMax, VaR_90, VaR_95, VaR_99
- Interpretation: expectedAnnualLoss, worstCase90, worstCase95 (human-readable)

Uses PERT distribution (triangular approximation) for both TEF and SLE sampling.

---

## Mutation Proposals (7 tools)

All mutation tools create entries in the `McpPendingAction` approval queue. None execute changes directly. Every mutation tool accepts optional `reason` (shown to reviewers) and `mcpSessionId` (for session tracking).

All tools validate that referenced entities exist before creating the proposal. If validation fails, an error is returned without creating a pending action.

### `propose_risk`

Propose creating a new risk.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `organisationId` | string | Yes | - | Organisation UUID |
| `riskId` | string | Yes | - | Reference ID (e.g. "R-42") |
| `title` | string | Yes | - | Risk title |
| `description` | string | No | - | Risk description |
| `tier` | enum | No | `CORE` | `CORE`, `EXTENDED`, `ADVANCED` |
| `framework` | enum | No | `ISO` | `ISO`, `SOC2`, `NIS2`, `DORA` |
| `reason` | string | No | - | Why this change is proposed |
| `mcpSessionId` | string | No | - | MCP session identifier |

**Validates:** Organisation exists, riskId is unique within org.

---

### `propose_scenario`

Propose creating a new risk scenario under an existing risk.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `riskId` | string | Yes | Parent risk UUID |
| `scenarioId` | string | Yes | Reference ID (e.g. "R-01-S01") |
| `title` | string | Yes | Scenario title |
| `cause` | string | No | Threat cause |
| `event` | string | No | Risk event |
| `consequence` | string | No | Business consequence |
| `reason` | string | No | Why this change is proposed |
| `mcpSessionId` | string | No | MCP session identifier |

**Validates:** Parent risk exists.

---

### `propose_link_control`

Propose linking an existing control to a risk scenario.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `scenarioId` | string | Yes | - | RiskScenario UUID |
| `controlId` | string | Yes | - | Control UUID |
| `effectivenessWeight` | int | No | `100` | Weight 0-100 |
| `isPrimaryControl` | boolean | No | `false` | Primary mitigating control? |
| `reason` | string | No | - | Why this change is proposed |
| `mcpSessionId` | string | No | - | MCP session identifier |

**Validates:** Both scenario and control exist.

---

### `propose_update_factors`

Propose updating likelihood factors (F1-F6) on a scenario. Only provided factors are updated.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scenarioId` | string | Yes | RiskScenario UUID |
| `f1ThreatFrequency` | int (1-5) | No | F1: Threat frequency |
| `f2ControlEffectiveness` | int (1-5) | No | F2: Vulnerability/exposure |
| `f3GapVulnerability` | int (1-5) | No | F3: Attack surface |
| `f4IncidentHistory` | int (1-5) | No | F4: Incident history |
| `f5AttackSurface` | int (1-5) | No | F5: Attack surface breadth |
| `f6Environmental` | int (1-5) | No | F6: Environmental factors |
| `reason` | string | No | Why this change is proposed |
| `mcpSessionId` | string | No | MCP session identifier |

**Validates:** Scenario exists, at least one factor provided.

---

### `propose_treatment`

Propose creating a treatment plan for a risk.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `riskId` | string | Yes | - | Parent risk UUID |
| `scenarioId` | string | No | - | Specific scenario UUID to link |
| `treatmentId` | string | Yes | - | Reference ID (e.g. "TP-001") |
| `title` | string | Yes | - | Treatment plan title |
| `description` | string | No | - | Treatment description |
| `treatmentType` | enum | No | `MITIGATE` | `MITIGATE`, `TRANSFER`, `ACCEPT`, `AVOID`, `SHARE` |
| `priority` | enum | No | `MEDIUM` | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `reason` | string | No | - | Why this change is proposed |
| `mcpSessionId` | string | No | - | MCP session identifier |

**Validates:** Risk exists. If scenarioId provided, scenario exists.

---

### `propose_state_transition`

Propose transitioning a risk scenario to a new status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scenarioId` | string | Yes | RiskScenario UUID |
| `targetStatus` | enum | Yes | Target status (see below) |
| `transitionReason` | string | No | Reason for the transition |
| `reason` | string | No | Why this change is proposed |
| `mcpSessionId` | string | No | MCP session identifier |

**Valid statuses:** `DRAFT`, `ASSESSED`, `EVALUATED`, `TREATING`, `TREATED`, `ACCEPTED`, `MONITORING`, `ESCALATED`, `REVIEW`, `CLOSED`, `ARCHIVED`

**Validates:** Scenario exists, not already in target status.

---

### `propose_update_kri_threshold`

Propose updating KRI thresholds. Only provided thresholds are updated.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `kriId` | string | Yes | KeyRiskIndicator UUID |
| `thresholdGreen` | string | No | Green threshold (e.g. ">= 95%") |
| `thresholdAmber` | string | No | Amber threshold (e.g. "80-94%") |
| `thresholdRed` | string | No | Red threshold (e.g. "< 80%") |
| `reason` | string | No | Why this change is proposed |
| `mcpSessionId` | string | No | MCP session identifier |

**Validates:** KRI exists, at least one threshold provided.
