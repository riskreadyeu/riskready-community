# Workflows

Common task patterns showing how MCP tools chain together, plus the approval flow for mutation proposals.

---

## Workflow 1: Assess a New Risk Scenario

**Goal:** Score a freshly created scenario's likelihood factors and generate a recommendation.

**Steps:**

1. **Get the scenario context**
   - `get_scenario(id)` — read cause, event, consequence, linked entities
   - `get_linked_threats(scenarioId)` — understand the threat landscape
   - `get_linked_controls(scenarioId)` — see existing mitigations

2. **Check current factor state**
   - `get_scenario_factors(scenarioId)` — see which factors are already scored, any overrides

3. **Score using the rubric**
   - Read the `scoring-rubric` resource for the 1-5 scale definitions
   - Or use the `assess-scenario` prompt to get a structured scoring recommendation

4. **Propose factor updates**
   - `propose_update_factors(scenarioId, f1=..., f2=..., f3=..., reason="...")` — submit scores for approval

5. **Verify appetite status**
   - `get_risk_appetite_status(scenarioId)` — check if the scored scenario exceeds tolerance

---

## Workflow 2: Investigate a High-Risk Scenario

**Goal:** Deep-dive into why a scenario has a high residual score and what can be done.

**Steps:**

1. **Get the full picture**
   - `get_scenario(id)` — scores, status, narrative
   - `get_scenario_factors(scenarioId)` — which factors are driving the score
   - `get_scenario_impacts(scenarioId)` — which impact categories are highest

2. **Assess control posture**
   - `get_linked_controls(scenarioId)` — what controls exist
   - `get_control_effectiveness(scenarioId)` — are they working? (STRONG/MODERATE/WEAK/NONE)

3. **Check tolerance**
   - `get_risk_appetite_status(scenarioId)` — is it within appetite? Any breach alerts?

4. **Review calculation history**
   - `get_calculation_history(scenarioId)` — has the score been trending up?

5. **Recommend treatments**
   - Use the `recommend-treatments` prompt for structured recommendations
   - Or manually propose: `propose_treatment(riskId, title, treatmentType, reason="...")`

---

## Workflow 3: Risk Register Health Check

**Goal:** Get a quick picture of the overall risk posture for reporting.

**Steps:**

1. **Aggregate metrics**
   - `get_risk_stats()` — total risks, by tier/status/framework
   - `get_kri_dashboard()` — KRI RAG distribution, breach count
   - `get_treatment_stats()` — treatment progress, overdue count

2. **Identify problem areas**
   - `list_risks(tier: "TIER_1")` — review critical risks
   - `get_appetite_stats(organisationId)` — tolerance posture, active breach alerts

3. **Threat awareness**
   - `get_threat_dashboard()` — landscape overview
   - `get_emerging_threats()` — new threats not yet in the register

4. **Generate report**
   - Use the `executive-summary` prompt for a board-ready summary

---

## Workflow 4: Gap Analysis

**Goal:** Identify missing risk categories compared to a framework.

**Steps:**

1. **Use the guided prompt**
   - The `gap-analysis` prompt (with `framework` parameter) orchestrates the full flow

2. **Or manually:**
   - `list_risks(framework: "ISO")` — what's registered
   - `get_threat_dashboard()` — what threats exist in the catalog
   - `get_emerging_threats()` — new threats without corresponding risks
   - Compare against framework control domains

3. **Act on gaps**
   - `propose_risk(organisationId, riskId, title, reason="...")` — propose new risks for identified gaps

---

## Workflow 5: FAIR Quantitative Analysis

**Goal:** Translate qualitative risk scores into financial estimates.

**Steps:**

1. **Gather scenario data**
   - `get_scenario(id)` — get the scenario context
   - `get_scenario_factors(scenarioId)` — likelihood factors
   - `get_scenario_impacts(scenarioId)` — impact assessments (especially I1 Financial)

2. **Derive simulation inputs**
   - Map likelihood to TEF using the `fair-model` resource ARO table
   - Derive SLE from BIRT Financial assessment thresholds

3. **Run simulation**
   - `run_fair_simulation(tefMin, tefMode, tefMax, sleLow, sleMode, sleHigh)`
   - Returns: expected ALE, VaR at 90th/95th/99th percentiles

4. **Interpret results**
   - Compare VaR_95 against treatment costs for ROSI calculation
   - Use results to justify treatment investment to the board

---

## Workflow 6: Propose a Complete New Risk with Scenarios

**Goal:** Register a new risk with one or more scenarios, including control linkage.

**Steps:**

1. **Propose the risk**
   - `propose_risk(organisationId, riskId: "R-XX", title, description, reason)`
   - Wait for approval in the web UI

2. **After risk is approved, propose scenarios**
   - `propose_scenario(riskId: "<approved-risk-uuid>", scenarioId: "R-XX-S01", title, cause, event, consequence, reason)`
   - Use the `generate-narrative` prompt to draft the cause/event/consequence

3. **After scenario is approved, link controls**
   - `get_linked_controls(scenarioId)` — check if any controls already linked
   - `propose_link_control(scenarioId, controlId, effectivenessWeight, reason)`

4. **Score the scenario**
   - Use the `assess-scenario` prompt to get scoring recommendations
   - `propose_update_factors(scenarioId, f1=..., f2=..., f3=..., reason)`

5. **Propose treatment if needed**
   - `get_risk_appetite_status(scenarioId)` — check tolerance
   - `propose_treatment(riskId, treatmentId, title, treatmentType, reason)` if exceeding appetite

---

## Approval Flow

All mutation proposals follow the same lifecycle:

```
  Claude proposes          Human reviews           System executes
  ┌──────────┐            ┌──────────┐            ┌──────────┐
  │ propose_* │──────────►│ PENDING  │──────────►│ APPROVED │
  │ tool call │           │          │  approve   │ (executes│
  └──────────┘            │          │            │ mutation)│
                          │          │            └──────────┘
                          │          │
                          │          │  reject    ┌──────────┐
                          │          │──────────►│ REJECTED │
                          └──────────┘            └──────────┘
```

### What Happens on Approval

Each action type executes a specific mutation in a database transaction:

| Action Type | What Gets Created/Updated |
|-------------|--------------------------|
| `CREATE_RISK` | New `Risk` record |
| `CREATE_SCENARIO` | New `RiskScenario` linked to parent risk |
| `LINK_CONTROL` | New `RiskScenarioControl` junction record |
| `UPDATE_FACTORS` | Updates F1-F6 fields on the scenario |
| `CREATE_TREATMENT` | New `TreatmentPlan` linked to risk (and optionally scenario) |
| `TRANSITION_STATE` | Updates scenario status + creates `ScenarioStateHistory` entry |
| `UPDATE_KRI_THRESHOLD` | Updates threshold fields on the KRI |

If execution fails, the error is captured in `executionError` and the action remains visible for diagnostics.

### Reviewing Proposals in the Web UI

Navigate to the MCP Approvals page in the web application:

- **Queue view**: Filterable list of all pending/approved/rejected actions with stats cards
- **Detail view**: Full context for each proposal:
  - AI's reasoning (`reason` field)
  - Proposed changes with before/after comparisons (for factor updates and threshold changes)
  - Raw JSON payload
  - Approve/Reject buttons with optional notes

### Audit Trail

Every proposal records:
- `mcpToolName` — which tool created it
- `mcpSessionId` — which conversation session
- `reason` — AI's justification
- `reviewedById` / `reviewedAt` / `reviewNotes` — who reviewed and when
- `resultEntityId` / `resultEntityType` — what was created on approval
