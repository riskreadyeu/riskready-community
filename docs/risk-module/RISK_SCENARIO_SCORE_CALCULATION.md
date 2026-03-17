# Risk Scenario Score Calculation - Complete Reference

This document provides comprehensive documentation for understanding and implementing risk scenario score calculations in RiskReady.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites & Dependencies](#2-prerequisites--dependencies)
3. [Module Dependencies](#3-module-dependencies)
4. [Screens & User Flows](#4-screens--user-flows)
5. [Inherent Score Calculation](#5-inherent-score-calculation)
6. [Residual Score Calculation](#6-residual-score-calculation)
7. [BIRT Impact Assessment](#7-birt-impact-assessment)
8. [Likelihood Factors (F1-F6)](#8-likelihood-factors-f1-f6)
9. [Tolerance & Thresholds](#9-tolerance--thresholds)
10. [Financial Analysis (ALE)](#10-financial-analysis-ale)
11. [Calculation Triggers](#11-calculation-triggers)
12. [Database Schema Reference](#12-database-schema-reference)
13. [API Endpoints](#13-api-endpoints)
14. [Validation Rules](#14-validation-rules)

---

## 1. Overview

### Core Formula

```
Inherent Score = Likelihood × Weighted Impact    (Range: 1-25)
Residual Score = Residual Likelihood × Residual Impact    (Range: 1-25)
```

### Risk Level Classification

| Score Range | Level | Color | Treatment Deadline |
|-------------|-------|-------|-------------------|
| 1-7 | LOW | Green | Optional, monitor |
| 8-14 | MEDIUM | Amber | 90 days |
| 15-19 | HIGH | Orange | 30 days, CISO approval |
| 20-25 | CRITICAL | Red | Immediate, executive escalation |

---

## 2. Prerequisites & Dependencies

### Required Configuration (Before Scoring)

| Prerequisite | Location | Purpose |
|--------------|----------|---------|
| Organisation created | Organisation Module | Parent entity for all data |
| BIRT Thresholds configured | Settings → BIRT Config | Financial impact bands (€) |
| BIRT Category Weights | Settings → BIRT Config | Impact category weights (default: 25% each) |
| Risk Tolerance Statement (RTS) | Governance → RTS | Defines acceptable risk levels |
| Threat Catalog populated | Risks → Threat Catalog | Provides F1 threat frequency data |
| Likelihood Factor Weights | System Config | F1-F6 weights (default: 25/25/20/15/10/5) |

### Required Data (Before Scenario Assessment)

| Data Required | Source Module | Field Affected |
|---------------|---------------|----------------|
| Parent Risk exists | Risk Register | `riskId` |
| At least one threat linked | Threat Catalog | F1: Threat Frequency |
| Controls linked (optional) | Controls Module | F2: Control Effectiveness |
| Assets linked (optional) | Asset Inventory | F3: Gap/Vulnerability, I2: Operational |
| Vendors linked (optional) | Supply Chain | F3: Gap/Vulnerability, I4: Reputational |

---

## 3. Module Dependencies

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RISK SCENARIO CALCULATION                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   LIKELIHOOD  │         │     IMPACT      │         │   TOLERANCE     │
│    (1-5)      │         │     (1-5)       │         │   EVALUATION    │
└───────────────┘         └─────────────────┘         └─────────────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  F1-F6        │         │  BIRT           │         │  RTS            │
│  Factors      │         │  Assessment     │         │  Thresholds     │
└───────────────┘         └─────────────────┘         └─────────────────┘
        │                           │
        ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SOURCE MODULES                                   │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────┤
│   Threat    │  Controls   │   Assets    │   Vendors   │   Incidents     │
│   Catalog   │   Module    │  Inventory  │  (Supply    │   Module        │
│             │             │             │   Chain)    │                 │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────────┤
│ → F1        │ → F2        │ → F3, F5    │ → F3        │ → F4            │
│ Threat      │ Control     │ Gap/Vuln,   │ Gap/Vuln    │ Incident        │
│ Frequency   │ Effective-  │ Attack      │             │ History         │
│             │ ness        │ Surface     │             │                 │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────────┤
│             │             │ → I1, I2    │ → I1, I4    │                 │
│             │             │ Financial,  │ Financial,  │                 │
│             │             │ Operational │ Reputational│                 │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────────┘
```

### Module-by-Module Dependencies

#### Threat Catalog Module
- **Affects:** F1 (Threat Frequency)
- **Data Used:** Threat type, frequency rating, trend, FSISAC/DBIR references
- **Linkage:** `RiskScenario.threatId` → `Threat.id`

#### Controls Module
- **Affects:** F2 (Control Effectiveness), Residual Score reduction
- **Data Used:** Effectiveness score (0-100%), test results, implementation status
- **Linkage:** `ScenarioControlLink` junction table
- **Test Result Mapping:**
  - EFFECTIVE (90%+) → F2 = 1
  - PARTIALLY_EFFECTIVE (60-89%) → F2 = 2-3
  - INEFFECTIVE (20-59%) → F2 = 4
  - NOT_TESTED → F2 = 3 (default)

#### Asset Inventory Module
- **Affects:** F3 (Gap/Vulnerability), F5 (Attack Surface), I1 (Financial), I2 (Operational)
- **Data Used:** Asset value, criticality, internet-facing flag, vulnerabilities
- **Linkage:** `ScenarioAssetLink` junction table

#### Supply Chain (Vendors) Module
- **Affects:** F3 (Gap/Vulnerability), I1 (Financial), I4 (Reputational)
- **Data Used:** Vendor risk score, contract value, strategic importance
- **Linkage:** `ScenarioVendorLink` junction table

#### Incidents Module
- **Affects:** F4 (Incident History)
- **Data Used:** Incident count in past 12 months, severity
- **Calculation:**
  - 0 incidents → F4 = 1
  - 1 incident → F4 = 2
  - 2-3 incidents → F4 = 3
  - 4-5 incidents → F4 = 4
  - 6+ incidents → F4 = 5

#### Business Processes Module
- **Affects:** F6 (Environmental), I2 (Operational)
- **Data Used:** Process criticality, key personnel gaps, revenue impact

#### KRI Module
- **Affects:** Tolerance monitoring, alerts
- **Data Used:** KRI values, thresholds, breach status
- **Triggers:** Score recalculation on KRI breach

#### Governance Module
- **Affects:** Tolerance evaluation, escalation
- **Data Used:** RTS thresholds, approval levels, acceptance policies

---

## 4. Screens & User Flows

### Primary Screens

| Screen | Path | Purpose |
|--------|------|---------|
| Risk Scenario Detail | `/risks/scenarios/:id` | Main assessment interface |
| BIRT Config | `/risks/birt-config` | Configure thresholds & weights |
| Risk Register | `/risks/register` | View all risks and scenarios |
| Threat Catalog | `/risks/threats` | Manage threat library |

### Assessment Flow (User Journey)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: CREATE SCENARIO                                                  │
│ Screen: Risk Detail Page → "Add Scenario" button                        │
│ Data: Title, description, threat type selection                          │
│ Status: DRAFT                                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: SCORE LIKELIHOOD FACTORS (F1-F6)                                │
│ Screen: Scenario Detail → Assessment Tab → Evidence-Backed Factor Editor│
│ Data: Score each factor 1-5 with justification                          │
│ Auto-populated: F1 from threat, F2 from controls, F4 from incidents     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: ASSESS IMPACT (BIRT)                                            │
│ Screen: Scenario Detail → Assessment Tab → "Assess" button              │
│ Dialog: ImpactAssessmentDialog                                          │
│ Data: Score 4 categories (Financial, Operational, Regulatory, Reputation)│
│ Output: Weighted Impact (1-5)                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: INHERENT SCORE CALCULATED                                       │
│ Automatic: Likelihood × Weighted Impact = Inherent Score                │
│ Display: Score pipeline in header, Assessment tab cards                 │
│ Status: Still DRAFT (awaiting submission)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: LINK CONTROLS                                                   │
│ Screen: Scenario Detail → Controls Tab                                  │
│ Action: Link existing controls to scenario                              │
│ Effect: F2 auto-updates based on control effectiveness                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: CALCULATE RESIDUAL SCORE                                        │
│ Screen: Scenario Detail → Assessment Tab → "Calculate from Controls"    │
│ Automatic: Applies control effectiveness to reduce likelihood/impact    │
│ Output: Residual Score, Risk Reduction %                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 7: SUBMIT FOR EVALUATION                                           │
│ Screen: Scenario Detail → Workflow Tab                                  │
│ Action: Transition DRAFT → ASSESSED                                     │
│ System: Auto-evaluates against tolerance threshold                      │
│ Status: ASSESSED → EVALUATED                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 8: MAKE RISK DECISION                                              │
│ Screen: Scenario Detail → Workflow Tab                                  │
│ Options: ACCEPT (if within tolerance), TREAT, or ESCALATE               │
│ Status: ACCEPTED / TREATING / ESCALATED                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Screen Component Map

| Component | File | Purpose |
|-----------|------|---------|
| RiskScenarioDetailPage | `pages/risks/RiskScenarioDetailPage.tsx` | Main container |
| EvidenceBackedFactorEditor | `components/risks/EvidenceBackedFactorEditor.tsx` | F1-F6 scoring UI |
| ImpactAssessmentDialog | `components/risks/ImpactAssessmentDialog.tsx` | BIRT assessment |
| BirtAssessmentSummary | `components/risks/BirtAssessmentSummary.tsx` | Display BIRT results |
| LikelihoodFactorsPanel | `components/risks/LikelihoodFactorsPanel.tsx` | Factor insights |
| ScenarioControlEffectiveness | `components/risks/ScenarioControlEffectiveness.tsx` | Control linkage |
| ScenarioWorkflowPanel | `components/risks/ScenarioWorkflowPanel.tsx` | State transitions |

---

## 5. Inherent Score Calculation

### Formula

```
Inherent Score = Likelihood × Weighted Impact
Range: 1-25
```

### Likelihood Calculation

**6-Factor Weighted Model:**

```
Likelihood = (F1×W1 + F2×W2 + F3×W3 + F4×W4 + F5×W5 + F6×W6) / 100
```

**Default Weights:**

| Factor | Weight | Description |
|--------|--------|-------------|
| F1: Threat Frequency | 25% | How often this threat occurs in industry |
| F2: Control Effectiveness | 25% | Strength of preventive controls (inverted) |
| F3: Gap/Vulnerability | 20% | Known vulnerabilities and gaps |
| F4: Incident History | 15% | Past incidents at this organization |
| F5: Attack Surface | 10% | Exposure level (internet-facing, etc.) |
| F6: Environmental | 5% | External factors (regulatory, geopolitical) |

### Impact Calculation (BIRT Weighted)

```
Weighted Impact = (I1×W1 + I2×W2 + I3×W3 + I4×W4) / 100
```

**Default Category Weights:**

| Category | Weight | Description |
|----------|--------|-------------|
| I1: Financial | 25% | Direct monetary loss |
| I2: Operational | 25% | Business disruption |
| I3: Regulatory | 25% | Compliance/legal consequences |
| I4: Reputational | 25% | Brand/trust damage |

---

## 6. Residual Score Calculation

### Formula

```
Residual Score = Residual Likelihood × Residual Impact
```

### Control Effectiveness Reduction

| Control Strength | Effectiveness | Likelihood Reduction | Impact Reduction |
|------------------|---------------|----------------------|------------------|
| NONE | 0-49% | 0 levels | 0 levels |
| WEAK | 50-69% | 1 level | 0 levels |
| MODERATE | 70-79% | 1 level | 1 level |
| STRONG | 80-89% | 2 levels | 1 level |
| VERY_STRONG | 90-100% | 3 levels | 2 levels |

### Calculation Steps

```javascript
// 1. Calculate average control effectiveness
avgEffectiveness = sum(linkedControls.effectivenessScore) / linkedControls.length

// 2. Map to strength
strength = mapEffectivenessToStrength(avgEffectiveness)

// 3. Apply reductions (minimum result = 1)
residualLikelihood = max(1, inherentLikelihood - likelihoodReduction[strength])
residualImpact = max(1, inherentImpact - impactReduction[strength])

// 4. Calculate residual score
residualScore = residualLikelihood × residualImpact
```

---

## 7. BIRT Impact Assessment

### Impact Categories

| Category | Code | Assessment Criteria |
|----------|------|---------------------|
| Financial | I1 | Direct loss, recovery costs, penalties, lost revenue |
| Operational | I2 | Service disruption, productivity loss, resource impact |
| Regulatory | I3 | Compliance violations, legal exposure, reporting obligations |
| Reputational | I4 | Customer trust, brand damage, media exposure, partner relations |

### Impact Levels

| Level | Value | Financial Threshold Example |
|-------|-------|----------------------------|
| NEGLIGIBLE | 1 | < €10,000 |
| MINOR | 2 | €10,000 - €100,000 |
| MODERATE | 3 | €100,000 - €1,000,000 |
| MAJOR | 4 | €1,000,000 - €10,000,000 |
| SEVERE | 5 | > €10,000,000 |

### Inherent vs Residual Impact

- **Inherent Impact:** Assessment WITHOUT controls (worst case)
- **Residual Impact:** Assessment WITH controls applied
- **Inheritance:** Missing residual categories inherit from inherent assessment

---

## 8. Likelihood Factors (F1-F6)

### Factor Details

#### F1: Threat Frequency (25%)

| Source | Score Mapping |
|--------|---------------|
| Ransomware | 4 |
| Phishing | 4 |
| Data Breach | 3 |
| Insider Threat | 2 |
| DDoS | 3 |
| Supply Chain | 2 |
| Generic/Other | 3 |

**Data Sources:** Threat Catalog, FSISAC alerts, DBIR statistics

#### F2: Control Effectiveness (25%)

| Control Test Result | Score |
|---------------------|-------|
| EFFECTIVE (90%+) | 1 |
| PARTIALLY_EFFECTIVE (60-89%) | 2-3 |
| INEFFECTIVE (20-59%) | 4 |
| NOT_TESTED | 3 |
| NO_CONTROLS | 5 |

**Data Sources:** Control assessments, test results from Controls Module

#### F3: Gap/Vulnerability (20%)

| Condition | Score Adjustment |
|-----------|------------------|
| Open critical vulnerabilities | +2 |
| Vendor risk score > 70 | +1 |
| Asset without owner | +1 |
| Missing security controls | +1 |

**Data Sources:** Asset inventory, vendor assessments, vulnerability scans

#### F4: Incident History (15%)

| Incidents (12 months) | Score |
|-----------------------|-------|
| 0 | 1 |
| 1 | 2 |
| 2-3 | 3 |
| 4-5 | 4 |
| 6+ | 5 |

**Data Sources:** Incident Module records

#### F5: Attack Surface (10%)

| Exposure Type | Score |
|---------------|-------|
| Internet-facing application | 4 |
| External API | 4 |
| Internal only | 2 |
| Air-gapped | 1 |

**Data Sources:** Asset/Application inventory, network topology

#### F6: Environmental (5%)

| Factor | Score Adjustment |
|--------|------------------|
| Critical location (single point of failure) | +1 |
| Key person dependency | +1 |
| Regulatory pressure (audit findings) | +1 |
| Geopolitical exposure | +1 |

**Data Sources:** Business process mapping, location data, personnel records

---

## 9. Tolerance & Thresholds

### Risk Tolerance Statement (RTS)

| Tolerance Level | Max Acceptable Score |
|-----------------|---------------------|
| VERY_LOW | 5 |
| LOW | 8 |
| MEDIUM | 12 |
| HIGH | 16 |
| VERY_HIGH | 20 |

### Tolerance Evaluation

```javascript
gap = residualScore - toleranceThreshold
status = gap <= 0 ? 'WITHIN' : 'EXCEEDS'
```

### Alert Severity

| Gap | Severity | Action Required |
|-----|----------|-----------------|
| > 8 | CRITICAL | Immediate escalation |
| 5-8 | HIGH | Develop treatment plan |
| 2-4 | MEDIUM | Monitor and improve |
| < 2 | LOW | Monitor |

---

## 10. Financial Analysis (ALE)

### Annual Loss Expectancy Formula

```
ALE = SLE × ARO

where:
  SLE = Single Loss Expectancy (per incident)
  ARO = Annual Rate of Occurrence
```

### SLE Derivation from BIRT

```javascript
// From Financial Impact level, derive SLE range
switch(financialLevel) {
  case 'NEGLIGIBLE': return { low: 0, likely: 5000, high: 10000 }
  case 'MINOR': return { low: 10000, likely: 50000, high: 100000 }
  case 'MODERATE': return { low: 100000, likely: 500000, high: 1000000 }
  case 'MAJOR': return { low: 1000000, likely: 5000000, high: 10000000 }
  case 'SEVERE': return { low: 10000000, likely: 25000000, high: 50000000 }
}
```

### ARO Derivation from Likelihood

| Likelihood | ARO | Meaning |
|------------|-----|---------|
| RARE | 0.05 | Once every 20 years |
| UNLIKELY | 0.1 | Once every 10 years |
| POSSIBLE | 0.5 | Once every 2 years |
| LIKELY | 1.0 | Once per year |
| ALMOST_CERTAIN | 2.0 | Multiple times per year |

### PERT-Weighted ALE

```javascript
// PERT distribution for more accurate estimate
expectedSLE = (sleLow + 4 * sleLikely + sleHigh) / 6
expectedALE = expectedSLE * aro
```

---

## 11. Calculation Triggers

### Automatic Recalculation Events

| Event | Trigger Source | Fields Recalculated |
|-------|----------------|---------------------|
| Control test completed | Controls Module | F2, Residual Score |
| Asset criticality changed | Asset Inventory | F3, F5, Impact |
| Vendor risk score updated | Supply Chain | F3, Impact |
| Incident recorded | Incidents Module | F4 |
| KRI threshold breached | KRI Module | Alerts, Status |
| Treatment plan completed | Treatment Plans | Residual Score |
| Factor score manually updated | User action | Likelihood, Scores |
| BIRT assessment saved | User action | Impact, Scores |

### Trigger Codes (for audit)

```
MANUAL              - User-initiated calculation
CONTROL_TESTED      - Control test result changed
ASSET_UPDATED       - Asset data changed
VENDOR_ASSESSED     - Vendor assessment updated
INCIDENT_CREATED    - New incident recorded
KRI_RECORDED        - KRI value recorded
TREATMENT_COMPLETED - Treatment plan marked complete
STATE_TRANSITION    - Workflow state changed
KRI_BREACH          - KRI exceeded threshold
ACCEPTANCE_EXPIRY   - Risk acceptance expired
```

---

## 12. Database Schema Reference

### Key Tables

```prisma
model RiskScenario {
  // Identity
  id                String   @id @default(uuid())
  scenarioId        String   @unique  // Human-readable ID
  title             String

  // Inherent Assessment
  likelihood        LikelihoodLevel?
  weightedImpact    Decimal?
  inherentScore     Int?

  // Residual Assessment
  residualLikelihood    LikelihoodLevel?
  residualWeightedImpact Decimal?
  residualScore         Int?

  // Factor Scores (F1-F6)
  f1ThreatFrequency     Int?
  f1Override            Boolean @default(false)
  f1Source              String?
  f2ControlEffectiveness Int?
  f2Override            Boolean @default(false)
  f3GapVulnerability    Int?
  f4IncidentHistory     Int?
  f5AttackSurface       Int?
  f6Environmental       Int?

  // Calculated Values
  calculatedLikelihood  Decimal?
  calculatedImpact      Int?
  lastCalculatedAt      DateTime?
  calculationTrigger    CalculationTrigger?
  calculationTrace      Json?

  // Financial (ALE)
  sleLow      Decimal?
  sleLikely   Decimal?
  sleHigh     Decimal?
  aro         Decimal?
  ale         Decimal?

  // Status
  status      ScenarioStatus @default(DRAFT)

  // Relations
  risk              Risk @relation(fields: [riskId])
  controlLinks      ScenarioControlLink[]
  impactAssessments ScenarioImpactAssessment[]
  stateHistory      ScenarioStateHistory[]
}

model ScenarioImpactAssessment {
  id          String   @id @default(uuid())
  scenarioId  String
  category    ImpactCategory  // FINANCIAL, OPERATIONAL, REGULATORY, REPUTATION
  level       ImpactLevel     // NEGLIGIBLE, MINOR, MODERATE, MAJOR, SEVERE
  value       Int             // 1-5
  rationale   String?
  isResidual  Boolean @default(false)
}

model ScenarioControlLink {
  id                  String @id @default(uuid())
  scenarioId          String
  controlId           String
  effectivenessWeight Decimal?
  isPrimaryControl    Boolean @default(false)
}
```

### Enums

```prisma
enum LikelihoodLevel {
  RARE
  UNLIKELY
  POSSIBLE
  LIKELY
  ALMOST_CERTAIN
}

enum ImpactLevel {
  NEGLIGIBLE
  MINOR
  MODERATE
  MAJOR
  SEVERE
}

enum ImpactCategory {
  FINANCIAL
  OPERATIONAL
  LEGAL_REGULATORY
  REPUTATION
}

enum ScenarioStatus {
  DRAFT
  ASSESSED
  EVALUATED
  TREATING
  TREATED
  ACCEPTED
  MONITORING
  ESCALATED
  REVIEW
  CLOSED
  ARCHIVED
}
```

---

## 13. API Endpoints

### Scenario Assessment

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/risk-scenarios/:id` | Get scenario with all scores |
| PATCH | `/api/risk-scenarios/:id` | Update scenario (manual scores) |
| POST | `/api/risk-scenarios/:id/calculate` | Trigger score recalculation |
| GET | `/api/risk-scenarios/:id/factor-scores` | Get F1-F6 with evidence |
| PATCH | `/api/risk-scenarios/:id/factor-scores` | Update F1-F6 scores |

### BIRT Assessment

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/risk-scenarios/:id/impact-assessments` | Get BIRT assessments |
| POST | `/api/risk-scenarios/:id/impact-assessments` | Create/update assessment |
| DELETE | `/api/risk-scenarios/:id/impact-assessments/:category` | Remove assessment |

### Controls Integration

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/risk-scenarios/:id/controls` | Get linked controls |
| POST | `/api/risk-scenarios/:id/controls` | Link control to scenario |
| DELETE | `/api/risk-scenarios/:id/controls/:controlId` | Unlink control |
| POST | `/api/risk-scenarios/:id/calculate-residual` | Calculate from controls |

### Tolerance

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/risk-scenarios/:id/tolerance-evaluation` | Get tolerance status |
| GET | `/api/organisations/:id/birt-config` | Get BIRT thresholds |
| GET | `/api/risks/:id/rts` | Get Risk Tolerance Statement |

---

## 14. Validation Rules

### Score Validation

| Rule | Validation |
|------|------------|
| Factor scores | Must be 1-5 |
| Impact values | Must be 1-5 |
| Weights | Must sum to 100% |
| Likelihood result | Clamped to 1-5 |
| Final scores | Clamped to 1-25 |
| Residual | Cannot exceed inherent |

### BIRT Validation

| Rule | Validation |
|------|------------|
| All categories required | 4 categories must be assessed for accurate score |
| Partial assessment | Allowed but flags as incomplete |
| Weight sum | Must equal 100% |

### Control Validation

| Rule | Validation |
|------|------------|
| Effectiveness score | Must be 0-100% |
| Minimum residual | Cannot go below 1 |
| Multiple controls | Averaged effectiveness |

### Tolerance Validation

| Rule | Validation |
|------|------------|
| RTS required | Must have linked RTS for tolerance evaluation |
| Threshold | Either explicit `maxResidualScore` OR derived from level |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RISK SCORE QUICK REFERENCE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  INHERENT SCORE = Likelihood × Weighted Impact                          │
│                                                                          │
│  Likelihood (1-5) = Σ(Factor × Weight) / 100                            │
│    F1: Threat Frequency     (25%)                                       │
│    F2: Control Effectiveness (25%)                                      │
│    F3: Gap/Vulnerability    (20%)                                       │
│    F4: Incident History     (15%)                                       │
│    F5: Attack Surface       (10%)                                       │
│    F6: Environmental        (5%)                                        │
│                                                                          │
│  Weighted Impact (1-5) = Σ(BIRT Category × Weight) / 100                │
│    I1: Financial           (25%)                                        │
│    I2: Operational         (25%)                                        │
│    I3: Regulatory          (25%)                                        │
│    I4: Reputational        (25%)                                        │
│                                                                          │
│  RESIDUAL SCORE = Residual Likelihood × Residual Impact                 │
│    - Control Effectiveness reduces Likelihood & Impact                  │
│    - Minimum result = 1                                                 │
│                                                                          │
│  RISK LEVELS:                                                           │
│    1-7:   LOW       (Green)                                             │
│    8-14:  MEDIUM    (Amber)                                             │
│    15-19: HIGH      (Orange)                                            │
│    20-25: CRITICAL  (Red)                                               │
│                                                                          │
│  ALE = (SLE_Low + 4×SLE_Likely + SLE_High) / 6 × ARO                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*Last updated: January 2026*
*Reference implementation: `apps/server/src/risks/services/risk-calculation.service.ts`*
