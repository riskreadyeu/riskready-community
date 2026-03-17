# Resources & Prompts

## Resources

Resources are static reference documents served to the LLM to provide domain context. They are available at `risk://` URIs and can be read by the client at any time.

### Methodology Resources

#### `scoring-rubric` (`risk://methodology/scoring-rubric`)

The 3-factor inherent likelihood model used for scoring risk scenarios.

**Contents:**
- Factor weights: F1 Threat Frequency (34%), F2 Vulnerability/Ease of Exploit (33%), F3 Attack Surface (33%)
- Formula: `Inherent Likelihood = (F1 x 0.34 + F2 x 0.33 + F3 x 0.33)` on a 1.0-5.0 scale
- Detailed 1-5 scoring rubric for each factor with labels and meanings
- Supplementary factors F4-F6 (0% weight, informational)
- Fallback priority for data-driven scoring
- Risk score formula: `Inherent Score = Likelihood x Impact` (1-25 scale)

**Important notes documented:**
- F2 database field is `f2ControlEffectiveness` but the meaning is Vulnerability/Ease of Exploit
- F3 database field is `f3GapVulnerability` but the meaning is Attack Surface
- Controls do NOT affect inherent scores, only residual

#### `impact-categories` (`risk://methodology/impact-categories`)

The BIRT (Business Impact Reference Table) 5-category impact model.

**Contents:**
- Categories: I1 Financial, I2 Operational, I3 Legal/Regulatory, I4 Reputational, I5 Strategic
- 1-5 scale: NEGLIGIBLE, MINOR, MODERATE, MAJOR, SEVERE
- Weighted impact calculation formula
- Overall impact = max(I1..I5) for inherent calculation

#### `fair-model` (`risk://methodology/fair-model`)

FAIR (Factor Analysis of Information Risk) quantitative methodology reference.

**Contents:**
- Key terms: TEF, SLE, ALE, VaR, ROSI
- PERT distribution formula: `Expected = (min + 4 x mode + max) / 6`
- SLE derivation from BIRT Financial assessments
- ARO-to-likelihood mapping table (RARE=0.05 to ALMOST_CERTAIN=2.0)
- ROSI calculation: `(Baseline ALE - Post-Control ALE) - Annual Control Cost`

### Policy Resources

#### `risk-zones` (`risk://policy/risk-zones`)

Risk zone classification and treatment deadlines.

**Contents:**
- 4 zones by residual score: TERMINATE (>= 20), TREAT (12-19), TOLERATE (6-11), TRANSFER (< 6)
- Treatment deadlines: CRITICAL = immediate, HIGH = 30 days, MEDIUM = 90 days, LOW = monitoring only

#### `approval-levels` (`risk://policy/approval-levels`)

Approval authority levels by risk score.

**Contents:**
- 4 authority levels: RISK_OWNER (0-14), CISO (15-19), RISK_COMMITTEE (20-24), BOARD (25)
- Exception acceptance rules (180-day validity, min 20-char justification)
- Escalation flow: RISK_OWNER -> CISO -> RISK_COMMITTEE -> BOARD
- 7-day escalation deadline

#### `state-machine` (`risk://policy/state-machine`)

The risk scenario lifecycle state machine.

**Contents:**
- 10 states: DRAFT, ASSESSED, EVALUATED, TREATING, ACCEPTED, ESCALATED, TREATED, MONITORING, REVIEW, CLOSED, ARCHIVED
- 25 transitions with codes (T01-T19+), triggers (User/System/Both), and descriptions
- Guard conditions: allFactorsScored, scoreCalculated, exceedsTolerance, withinTolerance, hasApprovalAuthority, treatmentPlanCreated, allActionsCompleted, acceptanceApproved, monitoringKRIsConfigured

---

## Prompts

Prompts are guided system messages that structure Claude's analytical work. Each prompt instructs Claude to gather specific data via tools before producing structured output.

### `assess-scenario`

**Purpose:** Score F1-F3 likelihood factors for a risk scenario with evidence-based reasoning.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `scenarioId` | string | Scenario UUID to assess |

**Instructs Claude to:**
1. Read the `scoring-rubric` resource
2. Call `get_scenario` for scenario details
3. Call `get_scenario_factors` for current scores
4. Call `get_linked_threats` for threat context
5. Call `get_linked_controls` for control context
6. Call `get_control_effectiveness` for control posture

**Output format:** For each factor: suggested score (1-5), confidence level (LOW/MEDIUM/HIGH), reasoning with evidence, key data points.

**Key rules enforced:**
- F2 measures technical exploitability, not control effectiveness
- F3 measures attack surface breadth, not vulnerability count
- Controls do not reduce inherent scores
- Conservative scoring when uncertain (default toward 3)

---

### `generate-narrative`

**Purpose:** Draft a cause-event-consequence narrative for a risk scenario.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `riskTitle` | string | Yes | Title of the parent risk |
| `threatType` | string | No | e.g. `RANSOMWARE`, `DATA_BREACH` |
| `assetContext` | string | No | Key assets or systems involved |

**Output format:** Three sections (2-4 sentences each):
1. CAUSE - Threat actor or condition
2. EVENT - Attack vector or failure mode
3. CONSEQUENCE - Business impact across financial, operational, regulatory, reputational dimensions

---

### `recommend-treatments`

**Purpose:** Suggest treatment actions based on control gaps and risk scores.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `scenarioId` | string | Scenario UUID to recommend treatments for |

**Instructs Claude to:**
1. Call `get_scenario`, `get_scenario_factors`, `get_linked_controls`
2. Call `get_control_effectiveness`, `get_risk_appetite_status`
3. Read the `risk-zones` resource

**Output format:**
1. Current risk profile summary
2. Control gap analysis
3. 3-5 recommended treatments (title, type, addressed factors, expected score reduction, priority, estimated effort)
4. Expected residual score after implementation

---

### `gap-analysis`

**Purpose:** Identify unregistered risk categories by comparing the register against a framework.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `framework` | string | `ISO` | Framework to compare against |

**Instructs Claude to:**
1. Call `list_risks` filtered by framework
2. Call `get_threat_dashboard` and `get_emerging_threats`
3. Read `risk-zones` and `state-machine` resources

**Output format:**
1. Coverage summary
2. Framework gap analysis (missing categories with justification, suggested titles, tiers)
3. Top 3 priority gaps
4. Recommendations

---

### `executive-summary`

**Purpose:** Generate a board-ready executive risk summary.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `organisationId` | string | Organisation UUID |

**Instructs Claude to:**
1. Call `get_risk_stats`, `list_risks(take: 200)`
2. Call `get_kri_dashboard`, `get_treatment_stats`
3. Call `get_appetite_stats`, `get_threat_dashboard`

**Output format:**
1. Risk posture summary (one paragraph)
2. Key metrics (totals, by tier/status, KRI RAG, treatment progress)
3. Top 5 risks table (ID, title, score, zone, status, treatment status)
4. Emerging threats (2-3)
5. Risk appetite compliance
6. Recommendations (3-5 actions)

Target length: under 500 words, quantified, non-technical.
