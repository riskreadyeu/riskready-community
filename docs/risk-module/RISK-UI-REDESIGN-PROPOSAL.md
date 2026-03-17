# Risk Module UI Redesign Proposal

> **Status**: PROPOSAL
> **Created**: 2026-01-02
> **Purpose**: Transform Risk Module from "database viewer" to "decision workbench"

---

## Executive Summary

The current Risk UI displays data correctly but fails to surface relationships, guide decisions, or enable efficient workflows. This proposal reorganizes the existing data into a GRC professional's workbench.

**Core Principle**: Every screen should answer "What should I do next?"

---

## 1. RISK REGISTER PAGE (List View)

### Current Problems
- Flat table with no visual priority
- No indication of which risks need attention
- No quick actions
- Must navigate away for any operation

### Proposed Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ RISK REGISTER                                                    [+ New Risk]│
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🚨 ATTENTION REQUIRED (3)                              [View All →]     │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                        │ │
│ │ │ R-05        │ │ R-12        │ │ R-08        │                        │ │
│ │ │ KRI Breach  │ │ Overdue     │ │ No Controls │                        │ │
│ │ │ 🔴 RED      │ │ Treatment   │ │ Linked      │                        │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ FILTERS ─────────────────────────────────────────────────────────────┐  │
│ │ Status: [All ▼]  Tier: [All ▼]  Owner: [All ▼]  Score: [All ▼]       │  │
│ │ 🔍 Search risks...                                    [Clear Filters] │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌─ VIEW MODE ───────────────────────────────────────────────────────────┐  │
│ │ [📋 Table] [📊 Matrix] [📈 Heatmap] [🎯 By Owner]                     │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ RISK TABLE                                                              │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ │⚠│ ID    │ Title                    │ I │ R │ Δ  │ KRI │ Ctrl │ Trt  │ │
│ │ ├─┼───────┼──────────────────────────┼───┼───┼────┼─────┼──────┼──────┤ │
│ │ │🔴│ R-05  │ Data Classification...   │20 │12 │-40%│ 1🔴 │ 5    │ 100% │ │
│ │ │  │       │ ├─ 2 scenarios uncovered │   │   │    │ 1🟡 │      │      │ │
│ │ │  │       │ └─ KRI-011 breached      │   │   │    │ 1🟢 │      │      │ │
│ │ ├─┼───────┼──────────────────────────┼───┼───┼────┼─────┼──────┼──────┤ │
│ │ │🟡│ R-03  │ Access Control Failure   │16 │10 │-38%│ 2🟢 │ 8    │ 65%  │ │
│ │ │  │       │ └─ Treatment on track    │   │   │    │     │      │      │ │
│ │ ├─┼───────┼──────────────────────────┼───┼───┼────┼─────┼──────┼──────┤ │
│ │ │🟢│ R-01  │ Phishing Attack          │12 │ 6 │-50%│ 3🟢 │ 12   │ 100% │ │
│ │ │  │       │ └─ Within tolerance      │   │   │    │     │      │      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ Legend: I=Inherent R=Residual Δ=Reduction KRI=Indicators Ctrl=Controls     │
│ 🔴 Needs Action  🟡 Monitor  🟢 Acceptable                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Attention Required Banner**
   - Auto-surfaces risks needing action
   - Reasons: KRI breach, overdue treatment, no controls, exceeds tolerance
   - Click to jump directly to issue

2. **Smart Row Expansion**
   - Inline sub-rows show WHY risk needs attention
   - No navigation required to understand status

3. **Column Definitions**
   | Column | Content | Interaction |
   |--------|---------|-------------|
   | ⚠ | Priority indicator | Color-coded (🔴🟡🟢) |
   | ID | Risk ID | Link to detail |
   | Title | Risk name + inline alerts | Expandable |
   | I | Inherent score | Color by threshold |
   | R | Residual score | Color by threshold |
   | Δ | Reduction % | Green if positive |
   | KRI | KRI status counts | Mini badges |
   | Ctrl | Control count | Number |
   | Trt | Treatment progress | Progress % |

4. **View Modes**
   - **Table**: Default sortable list
   - **Matrix**: 5×5 L×I heatmap with risk dots
   - **Heatmap**: Treemap by score/category
   - **By Owner**: Grouped by risk owner

---

## 2. RISK MATRIX VIEW

### Current Problems
- Exists but disconnected from register
- Can't drill down into cells
- No toggle between inherent/residual

### Proposed Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ RISK MATRIX                                    [Inherent ▼] [Export Matrix] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│           │ NEGLIGIBLE │  MINOR   │ MODERATE │  MAJOR   │  SEVERE  │       │
│           │     1      │    2     │    3     │    4     │    5     │       │
│ ──────────┼────────────┼──────────┼──────────┼──────────┼──────────┤       │
│ ALMOST    │            │          │          │    ●●    │    ●     │       │
│ CERTAIN 5 │     5      │    10    │    15    │    20    │    25    │       │
│ ──────────┼────────────┼──────────┼──────────┼──────────┼──────────┤       │
│ LIKELY    │            │          │    ●     │    ●●●   │          │       │
│        4  │     4      │    8     │    12    │    16    │    20    │       │
│ ──────────┼────────────┼──────────┼──────────┼──────────┼──────────┤       │
│ POSSIBLE  │            │    ●     │    ●●    │          │          │       │
│        3  │     3      │    6     │    9     │    12    │    15    │       │
│ ──────────┼────────────┼──────────┼──────────┼──────────┼──────────┤       │
│ UNLIKELY  │     ●      │          │          │          │          │       │
│        2  │     2      │    4     │    6     │    8     │    10    │       │
│ ──────────┼────────────┼──────────┼──────────┼──────────┼──────────┤       │
│ RARE      │            │          │          │          │          │       │
│        1  │     1      │    2     │    3     │    4     │    5     │       │
│ ──────────┴────────────┴──────────┴──────────┴──────────┴──────────┘       │
│                                                                             │
│ Cell colors: 🟢 LOW (1-7)  🟡 MEDIUM (8-14)  🟠 HIGH (15-19)  🔴 CRITICAL   │
│                                                                             │
│ ┌─ CELL DETAIL (Click cell to populate) ──────────────────────────────────┐ │
│ │ Selected: LIKELY × MAJOR (Score: 16)                                    │ │
│ │                                                                         │ │
│ │ R-05-S02  Data loss from unencrypted devices     [View →]              │ │
│ │           Controls: 3 | Residual: 10 (POSSIBLE × MODERATE)             │ │
│ │                                                                         │ │
│ │ R-03-S01  Privileged access abuse                [View →]              │ │
│ │           Controls: 2 | Residual: 8 (UNLIKELY × MAJOR)                 │ │
│ │                                                                         │ │
│ │ R-12-S03  Third-party data breach                [View →]              │ │
│ │           Controls: 0 ⚠️ | Residual: 16 (unchanged)                    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Toggle Inherent/Residual**
   - See risk movement from inherent to residual position
   - Animation shows control effectiveness visually

2. **Click-to-Drill**
   - Click any cell to see scenarios in that position
   - Shows scenario details inline, not in modal

3. **Scenario-Level Positioning**
   - Each dot is a SCENARIO, not a risk
   - Hover shows scenario ID and title

4. **Movement Arrows** (optional view)
   - Draw arrows from inherent to residual position
   - Visualizes control impact per scenario

---

## 3. RISK DETAIL PAGE - UNIFIED DASHBOARD

### Current Problems
- 4 separate tabs hide relationships
- No cross-entity insights
- Too much navigation
- No recommended actions

### Proposed Design: Single Scrollable Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Register                                                          │
│                                                                             │
│ ┌─ HERO ──────────────────────────────────────────────────────────────────┐ │
│ │ 🎯 R-05: Data Classification & Handling                                 │ │
│ │ Tier: CORE | Status: IDENTIFIED | Framework: ISO27001                   │ │
│ │                                                                         │ │
│ │ "Failure to properly classify and handle sensitive data according      │ │
│ │  to regulatory requirements and organizational policies."              │ │
│ │                                                                         │ │
│ │ Owner: John Smith          Created: 15 Nov 2025          [Edit Risk]   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ ALERTS ────────────────────────────────────────────────────────────────┐ │
│ │ 🔴 KRI-011 "Classification Violations" has breached RED threshold      │ │
│ │    Current: 23 violations | Threshold: 15 | Action: Review DLP rules   │ │
│ │                                                           [Acknowledge] │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │ ⚠️ Scenarios S03 and S04 have no linked controls                       │ │
│ │    These scenarios have no mitigation - residual = inherent            │ │
│ │                                                        [Link Controls] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ SCORE SUMMARY ─────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │   INHERENT          CONTROLS           RESIDUAL         TOLERANCE      │ │
│ │   ┌───────┐        ┌────────┐         ┌───────┐        ┌───────────┐   │ │
│ │   │  20   │  ───▶  │ STRONG │  ───▶   │  12   │   vs   │  MEDIUM   │   │ │
│ │   │ HIGH  │        │  78%   │         │ MEDIUM│        │ (max: 14) │   │ │
│ │   └───────┘        │ -2L -1I│         └───────┘        │    ✓      │   │ │
│ │                    └────────┘                          └───────────┘   │ │
│ │                                                                         │ │
│ │   Risk Reduction: ████████████████░░░░ 40%                             │ │
│ │   Status: ✓ Within tolerance (12 ≤ 14)                                 │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ ┌─ SCENARIO COVERAGE MATRIX ──────────────────────────────────────────────┐ │
│ │                                                      [+ Add Scenario]   │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │         │ A.5.12 │ A.5.13 │ A.5.14 │ A.8.1  │ A.8.11 │ Coverage   │ │ │
│ │ │ ────────┼────────┼────────┼────────┼────────┼────────┼──────────  │ │ │
│ │ │ S01     │   ●    │   ●    │        │        │        │ ██░░░ 40% │ │ │
│ │ │ Email   │        │        │        │        │        │           │ │ │
│ │ │ leakage │        │        │        │        │        │           │ │ │
│ │ │ ────────┼────────┼────────┼────────┼────────┼────────┼──────────  │ │ │
│ │ │ S02     │   ●    │   ●    │   ●    │        │        │ ███░░ 60% │ │ │
│ │ │ Device  │        │        │        │        │        │           │ │ │
│ │ │ loss    │        │        │        │        │        │           │ │ │
│ │ │ ────────┼────────┼────────┼────────┼────────┼────────┼──────────  │ │ │
│ │ │ S03     │        │        │        │        │        │ ░░░░░  0% │ │ │
│ │ │ Unauth  │   ⚠️ NO CONTROLS - ADD COVERAGE                        │ │ │
│ │ │ access  │        │        │        │        │        │ [+ Link]  │ │ │
│ │ │ ────────┼────────┼────────┼────────┼────────┼────────┼──────────  │ │ │
│ │ │ S04     │        │        │        │        │        │ ░░░░░  0% │ │ │
│ │ │ Improper│   ⚠️ NO CONTROLS - ADD COVERAGE                        │ │ │
│ │ │ disposal│        │        │        │        │        │ [+ Link]  │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ Legend: ● Control linked  ⚠️ Gap identified                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ SCENARIOS DETAIL ──────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ ┌─ R-05-S01: Data leakage via email ──────────────────────────────────┐ │ │
│ │ │                                                                     │ │ │
│ │ │  INHERENT              RESIDUAL             FINANCIAL               │ │ │
│ │ │  L: LIKELY (4)         L: POSSIBLE (3)      ALE: $125,000          │ │ │
│ │ │  I: MAJOR (4)          I: MODERATE (3)      SLE: $50,000           │ │ │
│ │ │  Score: 16 HIGH        Score: 9 MEDIUM      ARO: 2.5/year          │ │ │
│ │ │                                                                     │ │ │
│ │ │  Controls (2): A.5.12 Classification, A.5.13 Labelling             │ │ │
│ │ │  Control Strength: MODERATE (-1L, -1I)                              │ │ │
│ │ │                                                         [Edit] [▼] │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ ┌─ R-05-S02: Data loss from unencrypted devices ──────────────────────┐ │ │
│ │ │  ... (collapsed, click to expand)                          [Edit]  │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ ┌─ R-05-S03: Unauthorized access to classified data ──────────────────┐ │ │
│ │ │  ⚠️ NO ASSESSMENT - Click to assess likelihood and impact           │ │ │
│ │ │                                                    [Assess Now →]   │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ ┌─ R-05-S04: Improper data disposal ──────────────────────────────────┐ │ │
│ │ │  ⚠️ NO ASSESSMENT - Click to assess likelihood and impact           │ │ │
│ │ │                                                    [Assess Now →]   │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ KEY RISK INDICATORS ───────────────────────────────────────────────────┐ │
│ │                                                        [+ Add KRI]      │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ KRI-011: Classification Violations                           🔴 RED │ │ │
│ │ │ ───────────────────────────────────────────────────────────────────  │ │ │
│ │ │                                                                      │ │ │
│ │ │  Current: 23 violations    ████████████████████████░░░░░░ 153%      │ │ │
│ │ │  Target:  15 violations    ────────────────────────┼────── threshold │ │ │
│ │ │                                                                      │ │ │
│ │ │  Trend: ↗ INCREASING (+8 from last month)                           │ │ │
│ │ │                                                                      │ │ │
│ │ │  History: ▁▂▃▄▅▆▇█ (sparkline)                                      │ │ │
│ │ │                                                                      │ │ │
│ │ │  Thresholds: 🟢 <10 | 🟡 10-15 | 🔴 >15                              │ │ │
│ │ │                                                                      │ │ │
│ │ │  [Record New Value]                              Last: 2 days ago   │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ KRI-012: Data Assets Classified                            🟡 AMBER │ │ │
│ │ │ ───────────────────────────────────────────────────────────────────  │ │ │
│ │ │  Current: 68%              ████████████████░░░░░░░░░░░░░ 68%        │ │ │
│ │ │  Target:  90%              ──────────────────────────────┼── target  │ │ │
│ │ │                                                                      │ │ │
│ │ │  Trend: → STABLE (no change)                                        │ │ │
│ │ │                                                                      │ │ │
│ │ │  [Record New Value]                              Last: 5 days ago   │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ KRI-013: DLP Policy Exceptions                             🟢 GREEN │ │ │
│ │ │ ───────────────────────────────────────────────────────────────────  │ │ │
│ │ │  Current: 3 exceptions     ███░░░░░░░░░░░░░░░░░░░░░░░░░░ 15%        │ │ │
│ │ │  Target:  <20 exceptions                                            │ │ │
│ │ │                                                                      │ │ │
│ │ │  Trend: ↘ IMPROVING (-2 from last month)                            │ │ │
│ │ │                                                                      │ │ │
│ │ │  [Record New Value]                              Last: 1 week ago   │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ CONTROL EFFECTIVENESS ─────────────────────────────────────────────────┐ │
│ │                                                       [Link Controls]   │ │
│ │                                                                         │ │
│ │  Overall Strength: STRONG (78%)                                        │ │
│ │  Reduction Applied: -2 Likelihood, -1 Impact                           │ │
│ │                                                                         │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Control      │ Name                    │ Design │ Impl │ Oper │ Avg │ │ │
│ │ │ ─────────────┼─────────────────────────┼────────┼──────┼──────┼─────│ │ │
│ │ │ A.5.12       │ Classification of Info  │  85%   │ 80%  │ 75%  │ 80% │ │ │
│ │ │ A.5.13       │ Labelling of Info       │  90%   │ 85%  │ 80%  │ 85% │ │ │
│ │ │ A.5.14       │ Information Transfer    │  80%   │ 70%  │ 65%  │ 72% │ │ │
│ │ │ A.8.1        │ User Endpoint Devices   │  75%   │ 70%  │ 70%  │ 72% │ │ │
│ │ │ A.8.11       │ Data Masking            │  85%   │ 80%  │ 75%  │ 80% │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │  Effectiveness Calculation:                                            │ │
│ │  Average: (80+85+72+72+80)/5 = 78% → STRONG                           │ │
│ │                                                                         │ │
│ │  [Recalculate Residuals]                          Last calc: 1 day ago │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ TREATMENT PLANS ───────────────────────────────────────────────────────┐ │
│ │                                                    [+ New Treatment]    │ │
│ │                                                                         │ │
│ │ ┌─ TP-2025-007: Data Classification Implementation ───────────────────┐ │ │
│ │ │                                                                     │ │ │
│ │ │  Type: MITIGATE          Status: ✅ COMPLETED                       │ │ │
│ │ │  Owner: Jane Doe         Completed: 15 Dec 2025                     │ │ │
│ │ │                                                                     │ │ │
│ │ │  Progress: ████████████████████████████████████████ 100%            │ │ │
│ │ │                                                                     │ │ │
│ │ │  ┌─ ACTIONS ──────────────────────────────────────────────────────┐ │ │ │
│ │ │  │ ✅ ACT-001: Define classification taxonomy          Completed  │ │ │ │
│ │ │  │ ✅ ACT-002: Deploy DLP solution                     Completed  │ │ │ │
│ │ │  │ ✅ ACT-003: Train staff on classification           Completed  │ │ │ │
│ │ │  │ ✅ ACT-004: Classify existing data assets           Completed  │ │ │ │
│ │ │  └────────────────────────────────────────────────────────────────┘ │ │ │
│ │ │                                                                     │ │ │
│ │ │  Results: Reduced residual from 16 to 12 (-25%)                    │ │ │
│ │ │  Cost: $45,000 (estimated: $50,000) | ROI: Positive                │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ No active treatment plans. [+ Create Treatment Plan]                   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ RISK TOLERANCE STATEMENT ──────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  ┌─ RTS-003: Data Protection Tolerance ───────────────────────────────┐ │ │
│ │  │                                                                    │ │ │
│ │  │  Level: MEDIUM (max residual: 14)                                 │ │ │
│ │  │  Status: ✅ APPROVED (by CFO, 01 Nov 2025)                        │ │ │
│ │  │                                                                    │ │ │
│ │  │  Statement:                                                        │ │ │
│ │  │  "The organization accepts MEDIUM risk for data classification    │ │ │
│ │  │   failures, provided controls are in place and monitored."        │ │ │
│ │  │                                                                    │ │ │
│ │  │  Conditions:                                                       │ │ │
│ │  │  • DLP solution must be operational                               │ │ │
│ │  │  • Quarterly classification audits required                       │ │ │
│ │  │  • Incident response plan must be tested annually                 │ │ │
│ │  │                                                                    │ │ │
│ │  │  Compliance Check:                                                 │ │ │
│ │  │  Current Residual (12) ≤ Tolerance Max (14) → ✅ WITHIN TOLERANCE │ │ │
│ │  │                                                         [View RTS] │ │ │
│ │  └────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │  [Link Different RTS]                                                   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ AUDIT TRAIL ───────────────────────────────────────────────────────────┐ │
│ │  15 Dec 2025  Treatment TP-2025-007 marked COMPLETED by Jane Doe       │ │
│ │  10 Dec 2025  KRI-011 recorded: 23 violations (RED)                    │ │
│ │  05 Dec 2025  Control A.5.14 test updated: Operating 65%               │ │
│ │  01 Dec 2025  Scenario S01 residual recalculated: 16 → 9               │ │
│ │  ... [View Full History]                                                │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Alerts Section**
   - Surfaces issues requiring action at top
   - Each alert has context and action button
   - Dismissible/acknowledgeable

2. **Score Flow Visualization**
   - Shows Inherent → Controls → Residual → Tolerance flow
   - Visual indication of tolerance compliance
   - Clear pass/fail against tolerance

3. **Scenario-Control Coverage Matrix**
   - NEW: Shows which controls cover which scenarios
   - Highlights coverage gaps
   - Inline action to add control coverage

4. **Expanded KRI Cards**
   - Inline sparkline trends
   - Visual threshold indicators
   - "Record New Value" button directly on card
   - No navigation to record values

5. **Treatment Plans with Actions**
   - Expandable action lists
   - Checkbox completion inline
   - Progress auto-updates
   - Cost/ROI visible

6. **Tolerance Compliance Check**
   - Automatic comparison: residual vs tolerance
   - Clear PASS/FAIL indication
   - Conditions listed for awareness

7. **Audit Trail**
   - Recent activity visible
   - Expandable for full history

---

## 4. SCENARIO DETAIL PAGE

### Proposed Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to R-05                                                              │
│                                                                             │
│ ┌─ HERO ──────────────────────────────────────────────────────────────────┐ │
│ │ 🎯 R-05-S01: Data leakage via email                                     │ │
│ │ Parent Risk: R-05 Data Classification & Handling                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ ASSESSMENT ────────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  ┌─ INHERENT ───────────────────┐   ┌─ RESIDUAL ───────────────────┐   │ │
│ │  │                              │   │                              │   │ │
│ │  │  Likelihood: LIKELY (4)      │   │  Likelihood: POSSIBLE (3)    │   │ │
│ │  │  Impact: MAJOR (4)           │   │  Impact: MODERATE (3)        │   │ │
│ │  │  ─────────────────────────   │   │  ─────────────────────────   │   │ │
│ │  │  Score: 16 (HIGH)            │   │  Score: 9 (MEDIUM)           │   │ │
│ │  │                              │   │                              │   │ │
│ │  │  [Edit Assessment]           │   │  [Recalculate from Controls] │   │ │
│ │  └──────────────────────────────┘   └──────────────────────────────┘   │ │
│ │                                                                         │ │
│ │  Risk Reduction: 44% (16 → 9)                                          │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ FINANCIAL IMPACT (BIRT) ───────────────────────────────────────────────┐ │
│ │                                                        [Edit BIRT →]    │ │
│ │  ┌────────────────┬────────────────┬────────────────┬────────────────┐  │ │
│ │  │   FINANCIAL    │ LEGAL/REG      │  REPUTATION    │  OPERATIONAL   │  │ │
│ │  ├────────────────┼────────────────┼────────────────┼────────────────┤  │ │
│ │  │   MAJOR (4)    │  MODERATE (3)  │   MAJOR (4)    │  MODERATE (3)  │  │ │
│ │  │   $100K-$500K  │  Regulatory    │   Media        │   2-5 days     │  │ │
│ │  │                │  inquiry       │   attention    │   disruption   │  │ │
│ │  └────────────────┴────────────────┴────────────────┴────────────────┘  │ │
│ │                                                                         │ │
│ │  Highest Impact Dimension: FINANCIAL / REPUTATION (4)                   │ │
│ │  This determines the Impact score in L×I calculation                    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ QUANTITATIVE ANALYSIS ─────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  SLE (Single Loss Expectancy):     $50,000                             │ │
│ │  ARO (Annual Rate of Occurrence):  2.5 per year                        │ │
│ │  ─────────────────────────────────────────────                         │ │
│ │  ALE (Annualized Loss Expectancy): $125,000                            │ │
│ │                                                                         │ │
│ │  Formula: ALE = SLE × ARO = $50,000 × 2.5 = $125,000                   │ │
│ │                                                                         │ │
│ │  [Edit Values]                                                          │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ LINKED CONTROLS ───────────────────────────────────────────────────────┐ │
│ │                                                      [+ Link Control]   │ │
│ │                                                                         │ │
│ │  A.5.12 - Classification of Information                                │ │
│ │  Effectiveness: 80% (STRONG)                                           │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │ Design: ████████░░ 85%                                          │   │ │
│ │  │ Implementation: ████████░░ 80%                                  │   │ │
│ │  │ Operating: ███████░░░ 75%                                       │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                           [Unlink] [→] │ │
│ │                                                                         │ │
│ │  A.5.13 - Labelling of Information                                     │ │
│ │  Effectiveness: 85% (STRONG)                                           │ │
│ │  ...                                                                    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. KRI MANAGEMENT PAGE

### Proposed Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ KEY RISK INDICATORS                                          [+ New KRI]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─ STATUS OVERVIEW ───────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  🔴 RED: 3        🟡 AMBER: 7        🟢 GREEN: 15       ⚪ N/A: 2        │ │
│ │                                                                         │ │
│ │  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │  11%              26%                    56%                   7%       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ REQUIRING ATTENTION ───────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ 🔴 KRI-011: Classification Violations                                   │ │
│ │    Risk: R-05 Data Classification | Current: 23 | Threshold: 15        │ │
│ │    ↗ Trending UP (+8 from last month)                                  │ │
│ │    [Record Value] [View Details]                                        │ │
│ │                                                                         │ │
│ │ 🔴 KRI-024: Failed Login Attempts                                       │ │
│ │    Risk: R-03 Access Control | Current: 450 | Threshold: 200           │ │
│ │    ↗ Trending UP (+150 from last week)                                 │ │
│ │    [Record Value] [View Details]                                        │ │
│ │                                                                         │ │
│ │ 🔴 KRI-031: Patch Compliance Rate                                       │ │
│ │    Risk: R-08 Vulnerability Mgmt | Current: 72% | Threshold: 90%       │ │
│ │    ↘ Trending DOWN (-8% from last month)                               │ │
│ │    [Record Value] [View Details]                                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ BULK VALUE ENTRY ──────────────────────────────────────────────────────┐ │
│ │                                              Recording for: [Today ▼]   │ │
│ │                                                                         │ │
│ │  KRI-011  Classification Violations    [  23  ] violations   🔴        │ │
│ │  KRI-012  Data Assets Classified       [  68  ] %            🟡        │ │
│ │  KRI-013  DLP Policy Exceptions        [   3  ] exceptions   🟢        │ │
│ │  KRI-024  Failed Login Attempts        [ 450  ] attempts     🔴        │ │
│ │  KRI-025  MFA Adoption Rate            [  92  ] %            🟢        │ │
│ │  ...                                                                    │ │
│ │                                                                         │ │
│ │  [Save All Values]                                                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ ALL KRIs ──────────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  Filter: [All Status ▼] [All Risks ▼] [All Owners ▼]                   │ │
│ │                                                                         │ │
│ │  │ Status │ KRI ID   │ Name                    │ Current │ Target │ Δ  │ │
│ │  ├────────┼──────────┼─────────────────────────┼─────────┼────────┼────│ │
│ │  │   🔴   │ KRI-011  │ Classification Violat...│   23    │  <15   │ +8 │ │
│ │  │   🔴   │ KRI-024  │ Failed Login Attempts   │  450    │ <200   │+150│ │
│ │  │   🔴   │ KRI-031  │ Patch Compliance Rate   │   72%   │  >90%  │ -8%│ │
│ │  │   🟡   │ KRI-012  │ Data Assets Classified  │   68%   │  >90%  │  0 │ │
│ │  │   🟢   │ KRI-013  │ DLP Policy Exceptions   │    3    │  <20   │ -2 │ │
│ │  │   🟢   │ KRI-025  │ MFA Adoption Rate       │   92%   │  >85%  │ +3%│ │
│ │  └────────┴──────────┴─────────────────────────┴─────────┴────────┴────┘ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Status Overview Bar**
   - Visual distribution of RAG statuses
   - Quick understanding of overall health

2. **Requiring Attention Section**
   - Auto-surfaces RED KRIs
   - Shows trend direction
   - Direct action buttons

3. **Bulk Value Entry**
   - Record multiple KRIs at once
   - Date selector for backdating
   - Status auto-calculates on entry

---

## 6. TREATMENT PLAN MANAGEMENT

### Proposed Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TREATMENT PLANS                                         [+ New Treatment]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─ STATUS OVERVIEW ───────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  Total: 24    Active: 8    Overdue: 3    Completed (YTD): 12           │ │
│ │                                                                         │ │
│ │  By Type:  MITIGATE: 15  ACCEPT: 5  TRANSFER: 3  AVOID: 1             │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ OVERDUE / ATTENTION REQUIRED ──────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ 🔴 TP-2025-012: Network Segmentation                                   │ │
│ │    Risk: R-07 | Due: 15 Dec 2025 (18 DAYS OVERDUE)                     │ │
│ │    Progress: ████████████░░░░░░░░ 60%                                   │ │
│ │    Blocker: Waiting for firewall procurement                           │ │
│ │    Owner: Mike Johnson                     [Update Progress] [View]     │ │
│ │                                                                         │ │
│ │ 🟡 TP-2025-015: Vendor Risk Assessment                                 │ │
│ │    Risk: R-11 | Due: 05 Jan 2026 (3 days remaining)                    │ │
│ │    Progress: ████████████████░░░░ 80%                                   │ │
│ │    Owner: Sarah Chen                       [Update Progress] [View]     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ TIMELINE VIEW ─────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  Dec 2025                    Jan 2026                    Feb 2026      │ │
│ │  ─────────────────────────────────────────────────────────────────────  │ │
│ │  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ TP-2025-012 (60%)   │ │
│ │       ████████████████████████░░░░░░░░░░░░░░░░░░ TP-2025-014 (75%)    │ │
│ │            █████████████████████████████░░░░░░░░ TP-2025-015 (80%)    │ │
│ │                 ██████░░░░░░░░░░░░░░░░░░░░░░░░░░ TP-2025-018 (25%)    │ │
│ │                                                                         │ │
│ │  Legend: ████ Completed  ░░░░ Remaining  │ Today                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ ALL TREATMENT PLANS ───────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  Filter: [All Status ▼] [All Types ▼] [All Owners ▼]                   │ │
│ │                                                                         │ │
│ │  ... (table view similar to previous)                                   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. RISK DASHBOARD (Executive View)

### NEW PAGE: High-level overview for management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ RISK DASHBOARD                                    As of: 02 Jan 2026 09:30  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─ EXECUTIVE SUMMARY ─────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │ │
│ │  │ Total Risks  │ │ Above        │ │ KRIs in RED  │ │ Treatments   │   │ │
│ │  │     47       │ │ Tolerance    │ │      3       │ │ Overdue      │   │ │
│ │  │              │ │      5       │ │              │ │      3       │   │ │
│ │  │   +2 MTD     │ │   ⚠️ ACTION  │ │   ⚠️ ACTION  │ │   ⚠️ ACTION  │   │ │
│ │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ RISK HEATMAP ────────────────────┐ ┌─ RISK TREND ─────────────────────┐ │
│ │                                   │ │                                   │ │
│ │  5×5 matrix with risk counts      │ │  Line chart: Avg residual score  │ │
│ │  per cell, color-coded            │ │  over past 12 months             │ │
│ │                                   │ │                                   │ │
│ │  Click cell to filter register    │ │  Trend: ↘ Improving (-12% YTD)   │ │
│ └───────────────────────────────────┘ └───────────────────────────────────┘ │
│                                                                             │
│ ┌─ TOP 5 RISKS BY RESIDUAL SCORE ─────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  1. R-07 Network Intrusion          Residual: 20 (CRITICAL)   ⚠️       │ │
│ │  2. R-12 Third-Party Breach         Residual: 18 (HIGH)                │ │
│ │  3. R-05 Data Classification        Residual: 12 (MEDIUM)              │ │
│ │  4. R-03 Access Control Failure     Residual: 10 (MEDIUM)              │ │
│ │  5. R-09 Business Continuity        Residual: 9 (MEDIUM)               │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ TOLERANCE COMPLIANCE ──────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  Within Tolerance: 42/47 (89%)                                         │ │
│ │  Above Tolerance: 5/47 (11%) ⚠️ ESCALATION REQUIRED                    │ │
│ │                                                                         │ │
│ │  Risks above tolerance:                                                │ │
│ │  • R-07: Residual 20 > Tolerance 15 (HIGH) → Requires board approval   │ │
│ │  • R-12: Residual 18 > Tolerance 14 (MEDIUM) → Escalate to CISO        │ │
│ │  • ...                                                                 │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ CONTROL EFFECTIVENESS SUMMARY ─────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  Overall Control Posture: 76% (STRONG)                                 │ │
│ │                                                                         │ │
│ │  By Category:                                                          │ │
│ │  • Access Control: 82% ████████░░                                      │ │
│ │  • Data Protection: 78% ████████░░                                     │ │
│ │  • Network Security: 71% ███████░░░                                    │ │
│ │  • Incident Response: 68% ███████░░░                                   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ UPCOMING REVIEWS ──────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  Next 30 days:                                                         │ │
│ │  • 05 Jan: R-05 Quarterly Review (Owner: John Smith)                   │ │
│ │  • 10 Jan: RTS-003 Annual Review (Approver: CFO)                       │ │
│ │  • 15 Jan: R-07 Treatment Milestone (Owner: Mike Johnson)              │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. COMPONENT SPECIFICATIONS

### 8.1 Alert Banner Component

```tsx
interface AlertBannerProps {
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}
```

### 8.2 Score Flow Component

```tsx
interface ScoreFlowProps {
  inherentScore: number;
  residualScore: number;
  controlStrength: 'NONE' | 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
  controlEffectiveness: number;
  toleranceLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  toleranceMax?: number;
}
```

### 8.3 Scenario Coverage Matrix Component

```tsx
interface ScenarioCoverageMatrixProps {
  scenarios: Array<{
    id: string;
    scenarioId: string;
    title: string;
  }>;
  controls: Array<{
    id: string;
    controlId: string;
    name: string;
  }>;
  coverage: Array<{
    scenarioId: string;
    controlId: string;
  }>;
  onLinkControl: (scenarioId: string) => void;
}
```

### 8.4 KRI Card Component

```tsx
interface KRICardProps {
  kri: {
    id: string;
    kriId: string;
    name: string;
    currentValue: number;
    unit: string;
    greenThreshold: number;
    amberThreshold: number;
    redThreshold: number;
    status: 'GREEN' | 'AMBER' | 'RED' | 'NOT_MEASURED';
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    history: Array<{ date: string; value: number }>;
  };
  onRecordValue: (value: number) => void;
  inline?: boolean; // compact mode for lists
}
```

### 8.5 Treatment Progress Component

```tsx
interface TreatmentProgressProps {
  plan: {
    id: string;
    treatmentId: string;
    title: string;
    status: TreatmentStatus;
    progressPercentage: number;
    targetEndDate: Date;
    actions: Array<{
      id: string;
      title: string;
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
    }>;
  };
  onToggleAction: (actionId: string, completed: boolean) => void;
  expandable?: boolean;
}
```

---

## 9. NAVIGATION STRUCTURE

```
Risk Module
├── Dashboard (/risks/dashboard)           ← NEW: Executive overview
├── Risk Register (/risks/register)        ← Enhanced with views
│   ├── Table View (default)
│   ├── Matrix View (/risks/register?view=matrix)
│   ├── Heatmap View (/risks/register?view=heatmap)
│   └── By Owner View (/risks/register?view=owner)
├── Risk Detail (/risks/:id)               ← Unified dashboard, no tabs
├── Risk Assessment (/risks/assessment)    ← Matrix with drill-down
├── Scenarios (/risks/scenarios)           ← List view
│   └── Scenario Detail (/risks/scenarios/:id)
├── KRIs (/risks/kris)                     ← Enhanced with bulk entry
│   └── KRI Detail (/risks/kris/:id)
├── Treatment Plans (/risks/treatments)    ← Enhanced with timeline
│   └── Treatment Detail (/risks/treatments/:id)
└── Tolerance Statements (/risks/tolerance)
    └── RTS Detail (/risks/tolerance/:id)
```

---

## 10. IMPLEMENTATION PRIORITY

### Phase 1: Quick Wins (1-2 weeks)
1. Add Alert Banner to Risk Detail (surfaces issues)
2. Add inline KRI value recording
3. Add tolerance compliance check display
4. Add "Attention Required" section to Register

### Phase 2: Core Enhancements (2-3 weeks)
1. Build Scenario-Control Coverage Matrix
2. Unify Risk Detail into single dashboard (remove tabs)
3. Add expandable treatment actions
4. Build Score Flow visualization

### Phase 3: Advanced Features (2-3 weeks)
1. Build Executive Dashboard
2. Add bulk KRI value entry
3. Add treatment timeline view
4. Add risk trend charts

### Phase 4: Polish (1 week)
1. Contextual help tooltips
2. Keyboard shortcuts
3. Export capabilities
4. Mobile responsiveness

---

## 11. DATA REQUIREMENTS

All proposed features use **existing data** from the Prisma schema. No schema changes required.

| Feature | Data Source |
|---------|-------------|
| Alert Banner | Computed from: KRI status, scenario coverage, tolerance comparison |
| Score Flow | Risk: inherentScore, residualScore + Control effectiveness calculation |
| Coverage Matrix | RiskScenario + ControlRisk many-to-many (needs scenario-control link) |
| KRI Sparklines | KRIValue history table |
| Treatment Actions | TreatmentAction table |
| Tolerance Check | Risk.residualScore vs RTS.proposedToleranceLevel thresholds |

**One schema addition recommended:**
```prisma
// Link controls to specific scenarios (not just risks)
model ScenarioControl {
  id          String       @id @default(cuid())
  scenarioId  String
  controlId   String
  scenario    RiskScenario @relation(fields: [scenarioId], references: [id])
  control     Control      @relation(fields: [controlId], references: [id])

  @@unique([scenarioId, controlId])
}
```

This enables the Scenario-Control Coverage Matrix feature.

---

## 12. SUCCESS METRICS

After implementation, measure:

| Metric | Current | Target |
|--------|---------|--------|
| Clicks to record KRI value | 3+ | 1 |
| Time to identify risk issues | Minutes | Seconds |
| Risks with identified coverage gaps | Unknown | 100% visibility |
| User questions about GRC terms | Many | Few (tooltips) |
| Page navigations per risk review | 5+ | 1-2 |

---

## Summary

This redesign transforms the Risk Module from a **database viewer** into a **decision workbench** by:

1. **Surfacing relationships** (scenario-control coverage, tolerance compliance)
2. **Enabling inline actions** (KRI recording, action completion)
3. **Guiding decisions** (alerts, recommendations, status indicators)
4. **Reducing navigation** (unified dashboard, expandable sections)
5. **Providing executive visibility** (dashboard, trends, compliance status)

The underlying data model already supports all these features. This is purely a **frontend reorganization** to unlock the value already present in your system.
