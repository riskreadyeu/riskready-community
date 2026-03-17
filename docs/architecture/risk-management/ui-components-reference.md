# Risk Management UI Components Reference

This document describes all UI elements from the Risk Detail Page and Risk Scenario Detail Page.

---

## Risk Detail Page (`RiskDetailPage.tsx`)

The Risk Detail Page provides a comprehensive view of a risk with its scenarios, KRIs, and treatment plans.

### 1. Hero Header (DetailHero Component)

**Location:** Top of page

| Element | Description |
|---------|-------------|
| Back Link | Navigates to Risk Register (`/risks/register`) |
| Risk Icon | `AlertTriangle` icon with destructive/red background |
| Badges | Tier badge (Core/Extended/Advanced), Status badge (with icon), Framework badge |
| Title | Risk title (e.g., "Absence of Ratified Security Framework") |
| Subtitle | Risk ID (e.g., "R-01") |
| Description | Risk description text |
| Metadata Row | Scenario count, KRI count, Treatment Plans count, Owner (if set) |
| Actions | Edit button, Enable/Disable toggle, Add Treatment button |

**Status Badge Colors:**
- IDENTIFIED: Muted gray
- ASSESSED: Blue
- TREATING: Warning/amber
- ACCEPTED: Success/green
- CLOSED: Muted gray

---

### 2. Risk Alert Banner (RiskAlertBanner Component)

**Location:** Below hero

Surfaces issues requiring attention:
- Unassessed scenarios alert
- Scenarios without controls warning
- KRI breaches
- Missing tolerance statements

---

### 3. Score Flow Visualization (ScoreFlowVisualization Component)

**Location:** Below alert banner

Visual pipeline showing: **Inherent Score → Control Effectiveness → Residual Score → Tolerance Level**

---

### 4. Quick Stats Row

**Layout:** 4-column grid (2 columns on mobile)

| Card | Icon | Value | Description |
|------|------|-------|-------------|
| Inherent Risk | `AlertTriangle` | Score (1-25) | Color-coded by risk level |
| Residual Risk | `Shield` | Score (1-25) | Color-coded by risk level |
| Risk Reduction | `TrendingDown` | Percentage | Green if > 0 |
| KRI Status | `Gauge` | 3 badges | Green/Amber/Red counts |

**Risk Score Colors (POL-002):**
- 1-7 (LOW): Success/green
- 8-14 (MEDIUM): Warning/amber
- 15-19 (HIGH): Orange
- 20-25 (CRITICAL): Destructive/red

---

### 5. Tolerance Statement Alert Card

**Location:** Below quick stats (only if tolerance statement linked)

| Element | Description |
|---------|-------------|
| Tolerance Icon | Based on tolerance level (ShieldCheck/Shield/ShieldAlert) |
| Title | "Risk Tolerance Statement" |
| Tolerance Badge | HIGH (red), MEDIUM (amber), LOW (green) |
| Statement Title | Truncated to 1 line |
| View Button | Links to tolerance statement detail |

**Tolerance Color Logic:**
- HIGH tolerance = More dangerous = Destructive/red
- LOW tolerance = More protective = Success/green

---

### 6. Main Tab Navigation

**Layout:** 4-tab horizontal tabs

| Tab | Icon | Badge | Content |
|-----|------|-------|---------|
| Overview | `FileText` | — | Summary cards |
| Scenarios | `Target` | Count | Scenario list |
| KRIs | `Gauge` | Count | KRI management |
| Treatments | `ClipboardList` | Count | Treatment plans |

---

### 7. Overview Tab Content

#### 7.1 Scenario Snapshot Card

**Layout:** 2-column grid with KRI Health card

| Element | Description |
|---------|-------------|
| Icon | `Target` with primary color |
| Stats Grid (3 cols) | Total scenarios, Assessed count, Pending count |
| Highest Scores Row | Highest inherent and residual scores with badges |
| Control Coverage | X/Y scenarios with Z controls linked |
| Empty State | "No scenarios defined" with Add Scenario button |

#### 7.2 KRI Health Card

| Element | Description |
|---------|-------------|
| Icon | `Gauge` with primary color |
| Status Grid (4 cols) | GREEN/AMBER/RED/N/A counts |
| Breached Alert | Red alert box if any KRIs in RED status |
| View All Link | Links to KRIs tab |
| Empty State | "No KRIs defined" with Add KRI button |

#### 7.3 Financial Summary Card

**Condition:** Only shows if any scenario has FAIR data (ALE or SLE)

| Metric | Color | Description |
|--------|-------|-------------|
| Total ALE | Blue | Sum of all scenario ALE values |
| Avg SLE | Neutral | Average Single Loss Expectancy |
| Max SLE | Amber | Worst case single event |
| Quantified | Green | X/Y scenarios with FAIR analysis |

#### 7.4 Acceptance Criteria Card

| Element | Description |
|---------|-------------|
| Icon | `CheckCircle2` |
| Content | Read-only text or editable textarea (when editing) |
| Empty State | "No acceptance criteria defined." |

---

### 8. Scenarios Tab Content

#### 8.1 Scenario Coverage Matrix (Optional)

**Condition:** Shows if scenarios AND controls exist

Matrix visualization of which controls cover which scenarios.

#### 8.2 Scenario List Card

| Element | Description |
|---------|-------------|
| Header | "Risk Scenarios" with count badge |
| Scenario Items | Clickable cards linking to scenario detail |

**Scenario Item Elements:**
- `Target` icon (red if no controls, blue if has controls)
- Scenario ID (monospace)
- Score badges (inherent, residual)
- Control badge (green with count, or red "No Controls")
- Title
- ALE value (if available)
- External link icon

**Highlight:** Scenarios without controls have red-tinted background.

---

### 9. KRIs Tab Content

#### 9.1 KRI Status Summary

| Element | Description |
|---------|-------------|
| Header | "Key Risk Indicators" with total count |
| Status Badges | Green/Amber/Red counts |

#### 9.2 Bulk Entry Section (Collapsible)

| Element | Description |
|---------|-------------|
| Icon | `Activity` |
| Title | "Quick Value Recording" |
| Description | "Record multiple KRI values at once" |
| Expand Button | `ChevronDown` icon |
| Content | BulkKRIEntry component |

#### 9.3 Individual KRI Cards

`KRIInlineCard` components for each KRI with:
- KRI status indicator
- Value display
- Trend visualization
- Record button

---

### 10. Treatments Tab Content

#### 10.1 Treatment Plans Card

| Element | Description |
|---------|-------------|
| Header | "Treatment Plans" with New Plan button |
| Treatment Items | Clickable cards linking to treatment detail |

**Treatment Item Elements:**
- `ClipboardList` icon
- Treatment ID (monospace)
- Status badge (colored by status)
- Type badge
- Title
- Progress bar with percentage
- Due date (if set)

**Status Colors:**
- DRAFT: Muted gray
- PROPOSED: Blue
- APPROVED: Purple
- IN_PROGRESS: Warning/amber
- COMPLETED: Success/green
- ON_HOLD: Orange
- CANCELLED: Muted gray

---

## Risk Scenario Detail Page (`RiskScenarioDetailPage.tsx`)

The Risk Scenario Detail Page provides comprehensive assessment and workflow management for individual risk scenarios.

### 1. Hero Header (DetailHero Component)

| Element | Description |
|---------|-------------|
| Back Link | Links to parent risk or Risk Register |
| Scenario Icon | `Target` icon with primary background |
| Badges | Framework badge, Status badge (ScenarioStatusBadge) |
| Title | Scenario title |
| Subtitle | Scenario ID (e.g., "R-01-S01") |
| Description | Scenario description |
| Metadata | Parent Risk title, Owner, Control count |
| Actions | Edit/Save/Cancel buttons |

---

### 2. Risk Score Flow Pipeline

**Layout:** 4-column horizontal pipeline (compact)

| Column | Icon | Value | Description |
|--------|------|-------|-------------|
| Inherent | `AlertTriangle` | Score | With risk level badge |
| Reduction | `Shield` | Percentage | With progress bar |
| Residual | `ShieldCheck` | Score | With risk level badge |
| ALE | `DollarSign` | Currency | Annual Loss with tooltip |

---

### 3. Lifecycle Workflow Card

**Main Container:** `ScenarioLifecycleStepper` component

#### 3.1 Lifecycle Stepper

5-stage stepper: **Identify → Assess → Decide → Treat → Monitor**

| Stage | Description |
|-------|-------------|
| Identify | Scenario narrative documented |
| Assess | Likelihood and impact scored |
| Decide | Treatment decision made |
| Treat | Controls being implemented |
| Monitor | Ongoing KRI monitoring |

#### 3.2 Assessment Progress Checklist

| Element | Description |
|---------|-------------|
| Header | "Assessment Progress" with percentage badge |
| Progress Bar | Visual completion indicator |
| Checklist Grid (4 cols) | Clickable cards for each check |

**Checklist Items:**
1. Scenario narrative (cause/event/consequence)
2. BIRT impact assessment (X/4 categories)
3. Likelihood factors scored (F1-F3)
4. Controls linked

#### 3.3 Stage Navigation

| Element | Description |
|---------|-------------|
| Previous Button | Navigate to previous stage |
| Stage Counter | "Stage X of 5" |
| Next Button | Navigate to next stage |

---

### 4. Stage-Specific Tab Navigation

Tabs change based on active lifecycle stage:

#### Identify Stage:
| Tab | Icon | Content |
|-----|------|---------|
| Scenario Narrative | `FileText` | Cause/Event/Consequence |
| Status History | `GitBranch` | Workflow journey |

#### Assess Stage:
| Tab | Icon | Content |
|-----|------|---------|
| Score Factors | `Calculator` | RiskAssessmentCalculator |
| Controls | `Shield` | Control effectiveness |
| FAIR Analysis | `BarChart3` | Monte Carlo simulation |

#### Decide Stage:
| Tab | Icon | Content |
|-----|------|---------|
| Decision Options | `GitBranch` | Workflow panel |
| Tolerance Check | `Scale` | Score journey |

#### Treat Stage:
| Tab | Icon | Content |
|-----|------|---------|
| Treatment Plans | `ClipboardList` | Linked treatments |
| Control Progress | `Shield` | Implementation status |

#### Monitor Stage:
| Tab | Icon | Content |
|-----|------|---------|
| Dashboard | `Activity` | Overview |
| Review Schedule | `Clock` | Workflow |
| Trend Analysis | `BarChart3` | FAIR trends |

---

### 5. Overview Tab Content (Stage-Aware)

#### 5.1 Scenario Narrative Card (Identify Stage)

| Element | Description |
|---------|-------------|
| Icon | `FileText` |
| Title | "What Could Happen" |
| Cause Badge | Blue badge with cause text |
| Event Badge | Amber badge with event text |
| Impact Badge | Red badge with consequence text |
| Parent Risk | Primary badge with link |

#### 5.2 Risk Score Journey Card (Decide/Monitor Stages)

**Left Panel: Score Journey**
- Inherent score box (color-coded)
- Arrow with Shield icon and reduction badge
- Residual score box (color-coded)
- Tolerance status alert (Within/Exceeds/Critical)

**Right Panel: Score Trend**
- Area chart showing inherent/residual over time
- Reference line at tolerance threshold
- Chart legend
- Linked RTS list with compliance status

---

### 6. Workflow Tab Content

#### 6.1 Identify Stage: Status History

| Element | Description |
|---------|-------------|
| Lifecycle Progress | 5-stage visual with checkmarks |
| Status Banner | Current status with description |
| ScenarioStateHistory | Audit trail component |

#### 6.2 Other Stages: Decision Panel

##### Why This Workflow Info Card

3-column grid explaining:
- **Compliance**: ISO 27001 audit requirements
- **Accountability**: Escalation rules
- **Visibility**: Leadership reporting

##### ScenarioWorkflowPanel Component

| Element | Description |
|---------|-------------|
| Status Display | Current workflow state |
| Tolerance Status | Within/Exceeds/Critical |
| Decision Options | Accept/Treat/Escalate buttons |
| Approval Level | Required authorization |

##### ScenarioStateHistory Component

Audit trail of state transitions with:
- Timestamp
- User
- Transition description
- Justification (if provided)

##### Linked Treatment Plans Card

| Element | Description |
|---------|-------------|
| Header | With count badge |
| Treatment Items | Clickable cards with details |

**Treatment Item Elements:**
- Treatment ID (monospace)
- Status badge
- Priority badge
- Title and description
- Target residual score
- Due date
- Progress percentage with visual bar

---

### 7. Assessment Tab Content

`RiskAssessmentCalculator` component providing:

#### 7.1 Likelihood Section
- F1-F6 factor score sliders
- Evidence links
- Calculated likelihood level

#### 7.2 Impact Section (BIRT)
- 4 category assessments (Financial, Operational, Reputational, Regulatory)
- Category-specific thresholds
- Weighted impact calculation

#### 7.3 Score Calculation
- Inherent score = Likelihood × Weighted Impact
- Residual calculation from controls
- Auto-calculate button

---

### 8. Controls Tab Content

#### 8.1 ScenarioControlLinker Button

Opens dialog to link/unlink controls.

#### 8.2 ScenarioControlEffectiveness Component

| Element | Description |
|---------|-------------|
| Control List | Linked controls with effectiveness scores |
| Aggregate Score | Overall control effectiveness percentage |
| Recalculate Button | Triggers residual recalculation |

---

### 9. FAIR Analysis Tab Content

`FAIRSimulationPanel` component providing:

#### 9.1 Simulation Form
- TEF (Threat Event Frequency) inputs
- Vulnerability slider
- Loss magnitude inputs (Primary/Secondary)
- BIRT auto-derive option (hidden when threat linked)
- Linked threat display with unlink option

#### 9.2 Results Display (when simulation run)
- Loss Distribution chart (histogram)
- Exceedance Curve chart
- Interpretation panel with percentile explanations
- Insurance Recommendation card

---

### 10. Audit Trail Card

**Location:** Bottom of page

| Element | Description |
|---------|-------------|
| Created | Date, user name |
| Updated | Date, user name (if different from created) |

---

## Component Dependencies

### Shared Components Used

| Component | Location | Purpose |
|-----------|----------|---------|
| DetailHero | `@/components/controls/detail-components` | Page header |
| Card, CardHeader, CardContent | `@/components/ui/card` | Content containers |
| Badge | `@/components/ui/badge` | Status/label indicators |
| Button | `@/components/ui/button` | Actions |
| Tabs, TabsList, TabsTrigger, TabsContent | `@/components/ui/tabs` | Navigation |
| Progress | `@/components/ui/progress` | Progress bars |
| Skeleton | `@/components/ui/skeleton` | Loading states |
| Tooltip | `@/components/ui/tooltip` | Hover info |
| Collapsible | `@/components/ui/collapsible` | Expandable sections |
| Select | `@/components/ui/select` | Dropdowns |
| Input, Textarea | `@/components/ui/input` | Form inputs |

### Risk-Specific Components

| Component | File | Purpose |
|-----------|------|---------|
| RiskAlertBanner | `@/components/risks/RiskAlertBanner` | Issue notifications |
| ScoreFlowVisualization | `@/components/risks/ScoreFlowVisualization` | Score pipeline |
| KRIInlineCard, BulkKRIEntry | `@/components/risks/KRIInlineCard` | KRI management |
| ScenarioCoverageMatrix | `@/components/risks/ScenarioCoverageMatrix` | Control coverage |
| RiskEnableDisable | `@/components/risks/RiskEnableDisable` | Enable/disable toggle |
| ScenarioWorkflowPanel | `@/components/risks/ScenarioWorkflowPanel` | Decision UI |
| ScenarioLifecycleStepper | `@/components/risks/ScenarioLifecycleStepper` | 5-stage stepper |
| ScenarioStateHistory | `@/components/risks/ScenarioStateHistory` | Audit trail |
| RiskAssessmentCalculator | `@/components/risks/RiskAssessmentCalculator` | Score calculation |
| FAIRSimulationPanel | `@/components/risks/FAIRSimulationPanel` | Monte Carlo |
| ScenarioControlEffectiveness | `@/components/risks/ScenarioControlEffectiveness` | Control display |
| ScenarioControlLinker | `@/components/risks/ScenarioControlLinker` | Link controls |
| LikelihoodSummaryCard | `@/components/risks/LikelihoodSummaryCard` | Likelihood display |
| ImpactSummaryCard | `@/components/risks/ImpactSummaryCard` | Impact display |
| RiskEvolutionCard | `@/components/risks/RiskEvolutionCard` | Score history |
| EvidenceBackedFactorEditor | `@/components/risks/EvidenceBackedFactorEditor` | F1-F6 factors |

---

## Design Tokens (from RiskScenarioDetailPage)

### Typography Scale
| Token | Size | Usage |
|-------|------|-------|
| text-page-title | 24px bold | Main page headers |
| text-section-title | 18px semibold | Major sections |
| text-card-title | 16px semibold | Card headers |
| text-body/text-sm | 14px | Primary content |
| text-caption | 12px | Secondary text |
| text-micro | 10px | Badges, tiny labels |

### Status Color Schemes
| Status | Background | Border | Text |
|--------|------------|--------|------|
| Success | green-50 | green-200 | green-700 |
| Warning | amber-50 | amber-200 | amber-700 |
| Danger | red-50 | red-200 | red-700 |
| Info | blue-50 | blue-200 | blue-700 |
| Purple | purple-50 | purple-200 | purple-700 |
| Neutral | secondary/30 | border | muted-foreground |

---

## Keyboard Shortcuts (Scenario Page)

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` / `Cmd+S` | Save changes (when editing) |
| `Escape` | Cancel editing |
