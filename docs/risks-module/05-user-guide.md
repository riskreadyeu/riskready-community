# Risk Management Module - User Guide

**Version:** 1.0  
**Created:** December 2024  

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Risk Dashboard](#risk-dashboard)
3. [Managing Risks](#managing-risks)
4. [Risk Scenarios](#risk-scenarios)
5. [Key Risk Indicators](#key-risk-indicators)
6. [Treatment Plans](#treatment-plans)
7. [Risk Tolerance Statements](#risk-tolerance-statements)
8. [Best Practices](#best-practices)

---

## Getting Started

### Accessing the Module

Navigate to **Risk Management** from the main navigation menu to access:

- **Dashboard**: Overview of risk posture
- **Risk Register**: Full list of identified risks
- **Risk Matrix**: Visual risk assessment tool
- **KRIs**: Key Risk Indicator monitoring
- **Treatment Plans**: Risk treatment management
- **Tolerance Statements**: Risk appetite definitions

### User Roles

| Role | Capabilities |
|------|-------------|
| **Viewer** | View risks, scenarios, KRIs |
| **Analyst** | Create/edit risks, scenarios, KRIs |
| **Risk Manager** | Approve treatment plans, manage RTS |
| **Administrator** | Manage all system settings and configurations |

---

## Risk Dashboard

The dashboard provides an at-a-glance view of your organization's risk posture.

### Key Metrics

| Metric | Description |
|--------|-------------|
| **Total Risks** | Count of all identified risks |
| **Risk Scenarios** | Number of specific scenarios |
| **Key Risk Indicators** | Total KRIs being monitored |
| **KRI Health** | Count of KRIs in green status |

### Risk Heatmap

The 3x3 heatmap visualizes risk distribution by likelihood and impact:

```
        Low Impact  Medium Impact  High Impact
High    ┌─────────┬─────────────┬───────────┐
Likely  │  Yellow │    Orange   │    Red    │
        ├─────────┼─────────────┼───────────┤
Medium  │  Green  │    Yellow   │   Orange  │
Likely  ├─────────┼─────────────┼───────────┤
Low     │  Green  │    Green    │   Yellow  │
Likely  └─────────┴─────────────┴───────────┘
```

Click any cell to filter the Risk Register.

### Top Risks

Displays the 5 highest-scored risks requiring attention.

### KRI Status Distribution

Shows the breakdown of KRI statuses:
- 🟢 **Green**: Within acceptable limits
- 🟡 **Amber**: Warning threshold reached
- 🔴 **Red**: Critical threshold breached
- ⚪ **Not Measured**: Awaiting data

---

## Managing Risks

### Creating a New Risk

1. Navigate to **Risk Register**
2. Click **Add Risk**
3. Complete the form:

| Field | Required | Description |
|-------|----------|-------------|
| Risk ID | Yes | Unique identifier (e.g., R-43) |
| Title | Yes | Concise risk name |
| Description | No | Detailed explanation |
| Tier | Yes | Core, Extended, or Advanced |
| Framework | Yes | ISO, SOC2, NIS2, or DORA |
| Risk Owner | No | Person accountable |

4. Click **Create Risk**

### Risk Lifecycle

```
IDENTIFIED → ASSESSED → TREATING → ACCEPTED/CLOSED
```

| Status | When to Use |
|--------|-------------|
| **Identified** | Risk just recorded, not yet analyzed |
| **Assessed** | Likelihood and impact evaluated |
| **Treating** | Treatment plan in progress |
| **Accepted** | Risk within tolerance, accepted |
| **Closed** | Risk no longer applicable |

### Editing Risk Details

1. Click on a risk to open the detail page
2. Click **Edit** to modify:
   - Status
   - Risk Owner
   - Treatment Plan description
   - Acceptance Criteria
   - Inherent/Residual Scores
3. Click **Save** to apply changes

### Linking Controls

Risks can be linked to mitigating controls:

1. On the risk detail page, scroll to **Linked Controls**
2. Click **Link Control**
3. Search and select controls
4. Controls affect residual risk calculation

---

## Risk Scenarios

Scenarios provide detailed cause-event-consequence analysis for each risk.

### Creating a Scenario

1. Open a risk's detail page
2. Go to the **Scenarios** tab
3. Click **Add Scenario**
4. Complete the scenario form:

| Field | Description |
|-------|-------------|
| Scenario ID | Auto-generated or manual (R-01-S01) |
| Title | Scenario name |
| Cause | What triggers the risk |
| Event | What happens when triggered |
| Consequence | Business impact |
| Likelihood | Rare to Almost Certain |
| Impact | Negligible to Severe |

### Impact Assessment

The system uses a simple 5×5 risk matrix (likelihood × impact = score):

1. Open scenario detail page
2. Select the **Impact** level (1-5):
   - **1 (Negligible)**: Minimal or no organizational impact
   - **2 (Minor)**: Small impact, easily manageable
   - **3 (Moderate)**: Significant impact on operations or objectives
   - **4 (Major)**: Substantial impact on multiple areas
   - **5 (Severe)**: Critical impact to organization's viability
3. System calculates overall risk score based on likelihood (1-5) × impact (1-5)

### Quantitative Risk Analysis

For scenarios requiring financial analysis:

| Field | Description | Example |
|-------|-------------|---------|
| SLE Low | Best case loss | $10,000 |
| SLE Likely | Most probable loss | $50,000 |
| SLE High | Worst case loss | $200,000 |
| ARO | Annual occurrence rate | 0.5 (once every 2 years) |
| ALE | Calculated: SLE × ARO | $25,000 |

### Residual Assessment

After controls are in place:

1. Set **Residual Likelihood** (1-5)
2. Set **Residual Impact** (1-5)
3. System calculates residual score using the 5×5 matrix
4. Parent risk scores auto-update

---

## Key Risk Indicators

KRIs provide early warning signals about risk levels.

### Creating a KRI

1. Navigate to **KRIs** or open a risk's KRI tab
2. Click **Add KRI**
3. Configure the indicator:

| Field | Description |
|-------|-------------|
| KRI ID | Unique identifier (KRI-001) |
| Name | Descriptive name |
| Formula | How the metric is calculated |
| Unit | Measurement unit (%, Count, Days) |
| Frequency | Collection frequency |
| Data Source | Where data comes from |
| Automated | Is collection automated |

### Setting Thresholds

Define RAG thresholds for automatic status calculation:

| Threshold | Example | Description |
|-----------|---------|-------------|
| Green | ≥95% | Acceptable range |
| Amber | 80-94% | Warning range |
| Red | <80% | Critical range |

### Recording Measurements

1. Open KRI detail page
2. Click **Record Measurement**
3. Enter the value (e.g., "92%")
4. Add notes if needed
5. System automatically:
   - Calculates RAG status
   - Determines trend direction
   - Adds to history

### Understanding Trends

| Trend | Meaning | Action |
|-------|---------|--------|
| ↑ Improving | Moving toward green | Continue monitoring |
| → Stable | No significant change | Review thresholds |
| ↓ Declining | Moving toward red | Investigate root cause |
| ○ New | First measurement | Establish baseline |

---

## Treatment Plans

Treatment plans document how risks will be addressed.

### Creating a Treatment Plan

1. From risk detail page, click **Add Treatment**
2. Or navigate to **Treatment Plans** > **New Plan**
3. Complete the form:

| Field | Description |
|-------|-------------|
| Treatment ID | Unique identifier (TP-015) |
| Title | Plan name |
| Description | Detailed plan description |
| Type | Mitigate, Transfer, Accept, Avoid, Share |
| Priority | Critical, High, Medium, Low |
| Target Score | Expected residual score after treatment |

### Treatment Types

| Type | When to Use | Example |
|------|-------------|---------|
| **Mitigate** | Implement controls to reduce risk | Deploy MFA |
| **Transfer** | Shift risk to third party | Purchase insurance |
| **Accept** | Risk within tolerance | Document acceptance |
| **Avoid** | Eliminate the risk source | Discontinue service |
| **Share** | Distribute risk with partners | Joint venture |

### Treatment Workflow

```
DRAFT → PROPOSED → APPROVED → IN_PROGRESS → COMPLETED
```

1. **Draft**: Initial plan creation
2. **Proposed**: Submit for approval
3. **Approved**: Plan approved, ready to execute
4. **In Progress**: Treatment underway
5. **Completed**: All actions finished

### Managing Actions

Break treatment plans into actionable tasks:

1. Open treatment plan detail
2. Click **Add Action**
3. Define:
   - Action title and description
   - Assigned team member
   - Due date
   - Estimated hours
4. Track action status:
   - Not Started
   - In Progress
   - Completed
   - Blocked

### Tracking Progress

- Progress auto-calculates from completed actions
- Update progress notes regularly
- When progress reaches 100%, status changes to Completed

---

## Risk Tolerance Statements

RTS define organizational risk appetite per domain.

### Creating an RTS

1. Navigate to **Tolerance Statements**
2. Click **New RTS**
3. Complete the form:

| Field | Description |
|-------|-------------|
| RTS ID | Unique identifier (RTS-008) |
| Title | Statement title |
| Objective | What the RTS achieves |
| Domain | Risk domain (Vulnerability Management, etc.) |
| Tolerance Level | HIGH, MEDIUM, or LOW |
| Proposed RTS | Full statement text |

### Tolerance Levels

| Level | Description | Risk Appetite |
|-------|-------------|---------------|
| **HIGH** | Willing to accept significant risk for opportunity | Risk-seeking |
| **MEDIUM** | Balanced approach to risk-taking | Risk-neutral |
| **LOW** | Minimal risk acceptance | Risk-averse |

### Linking to Risks

1. Open RTS detail page
2. Click **Link Risks**
3. Select applicable risks
4. Linked risks will show tolerance status

### RTS Approval Workflow

```
DRAFT → PENDING_APPROVAL → APPROVED
```

1. Create RTS in draft status
2. Submit for approval
3. Risk Manager approves
4. Set effective and review dates

---

## Best Practices

### Risk Identification

✅ **Do:**
- Use clear, specific risk titles
- Document cause-event-consequence chain
- Assign appropriate tier based on org size
- Link to relevant framework controls

❌ **Avoid:**
- Vague risk descriptions
- Mixing multiple risks in one entry
- Skipping scenario analysis

### Risk Assessment

✅ **Do:**
- Use the 5×5 risk matrix consistently
- Document assessment rationale with evidence
- Evaluate impact levels (1-5) carefully
- Review and update scores regularly as conditions change

❌ **Avoid:**
- Guessing at scores without data
- Ignoring residual risk after treatment
- Setting all risks to the same impact level

### KRI Management

✅ **Do:**
- Define clear, measurable indicators
- Set realistic thresholds
- Automate collection where possible
- Review trends, not just status

❌ **Avoid:**
- Too many KRIs per risk
- Thresholds that are always green
- Ignoring amber/red indicators

### Treatment Planning

✅ **Do:**
- Break plans into actionable tasks
- Assign clear ownership
- Set realistic timelines
- Track progress regularly

❌ **Avoid:**
- Plans without actions
- Unclear responsibilities
- Ignoring overdue treatments

### Risk Acceptance

✅ **Do:**
- Document clear rationale
- Define acceptance conditions
- Set expiry dates for review
- Link to Risk Tolerance Statement

❌ **Avoid:**
- Accepting without justification
- Indefinite acceptance periods
- Accepting above tolerance level

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New risk (on register page) |
| `Ctrl/Cmd + S` | Save changes |
| `Ctrl/Cmd + /` | Search |
| `Escape` | Cancel/Close dialog |

---

## Getting Help

- **In-app Help**: Click the `?` icon for contextual help
- **Documentation**: Full documentation in `/docs/risks-module/`
- **Support**: Contact your system administrator
