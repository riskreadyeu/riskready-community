# Risk and Scenario Architecture

## Overview

Risks are parent containers that aggregate multiple specific scenarios. Each scenario is independently assessed using factor-based likelihood calculation (F1-F6) and multi-dimensional impact assessment (I1-I5), then evaluated against tolerance thresholds.

---

## 1. Risk Model

### Core Fields

| Field | Type | Purpose |
|-------|------|---------|
| `riskId` | String | Human-readable ID (e.g., "R-01") |
| `title` | String | Risk name |
| `description` | Text | Detailed description |
| `tier` | RiskTier | CORE, EXTENDED, ADVANCED |
| `status` | RiskStatus | IDENTIFIED → ASSESSED → TREATING → ACCEPTED → CLOSED |
| `framework` | ControlFramework | ISO, SOC2, NIS2, DORA |

### Aggregated Fields (from Scenarios)

| Field | Calculation |
|-------|-------------|
| `maxScenarioScore` | MAX(all scenarios' residualScore) |
| `avgScenarioScore` | AVG(all scenarios' residualScore) |
| `scenarioCount` | COUNT(scenarios) |
| `scenariosExceedingTolerance` | COUNT(WHERE toleranceStatus = EXCEEDS) |
| `derivedStatus` | Worst scenario status |

### Relationships

```
Risk (1)
  │
  ├── RiskScenario[] (N) ─── Child scenarios
  ├── Control[] (N:M) ────── Mitigating controls
  ├── KeyRiskIndicator[] (N) ─ Monitoring KRIs
  ├── TreatmentPlan[] (N) ── Treatment strategies
  ├── RiskToleranceStatement[] (N:M) ── Tolerance thresholds
  └── ToleranceEvaluation[] (N) ── Evaluation history
```

---

## 2. RiskScenario Model

### Identity Fields

| Field | Type | Example |
|-------|------|---------|
| `scenarioId` | String | "R-01-S01", "R-01-S02" |
| `title` | String | "Absence of Ratified Security Framework" |
| `cause` | Text | What leads to this scenario |
| `event` | Text | What happens |
| `consequence` | Text | What is the impact |

### Assessment Fields

```
┌─────────────────────────────────────────────────────────────────┐
│                    INHERENT ASSESSMENT                          │
├─────────────────────────────────────────────────────────────────┤
│ likelihood        LikelihoodLevel (1-5)                         │
│ impact            ImpactLevel (1-5)                             │
│ inherentScore     Int (1-25) = likelihood × impact              │
│ weightedImpact    Int (1-5) = weighted avg of I1-I5             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    RESIDUAL ASSESSMENT                          │
├─────────────────────────────────────────────────────────────────┤
│ residualLikelihood    LikelihoodLevel (reduced by controls)     │
│ residualImpact        ImpactLevel (reduced by controls)         │
│ residualScore         Int (1-25) = residualL × residualI        │
│ residualWeightedImpact Int (1-5)                                │
│ residualOverridden    Boolean (manual override flag)            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TOLERANCE FIELDS                             │
├─────────────────────────────────────────────────────────────────┤
│ toleranceStatus      WITHIN | EXCEEDS | CRITICAL                │
│ toleranceThreshold   Int (from linked RTS)                      │
│ toleranceGap         Int (residualScore - threshold)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Factor Fields (F1-F6) - Likelihood Calculation

### Factor Definitions

| Factor | Name | Weight | Source |
|--------|------|--------|--------|
| **F1** | Threat Frequency | 34% | ThreatCatalog |
| **F2** | Vulnerability/Ease | 33% | Control effectiveness |
| **F3** | Gap/Exposure | 33% | Assets, Vendors, Apps |
| F4 | Incident History | 0% | Historical incidents (info only) |
| F5 | Attack Surface | 0% | Merged into F3 |
| F6 | Environmental | 0% | Threat intel (info only) |

### Factor Database Fields

```
f1ThreatFrequency       Int?    (1-5 scale)
f1Source                String? (source reference)
f1Override              Boolean (manual override flag)
f1OverrideJustification String? (why overridden)

f2ControlEffectiveness  Int?    (1-5 scale)
f2Source                String?
f2Override              Boolean
f2OverrideJustification String?

f3GapVulnerability      Int?    (1-5 scale)
f3Source                String?
f3Override              Boolean
f3OverrideJustification String?

f4IncidentHistory       Int?    (informational)
f5AttackSurface         Int?    (informational)
f6Environmental         Int?    (informational)
```

### Likelihood Calculation

```
Calculated Likelihood = (F1 × 0.34) + (F2 × 0.33) + (F3 × 0.33)
                      = Weighted average → rounded to 1-5

Example:
  F1 = 4 (LIKELY threat)
  F2 = 3 (MODERATE vulnerability)
  F3 = 4 (HIGH exposure)

  Likelihood = (4 × 0.34) + (3 × 0.33) + (4 × 0.33)
             = 1.36 + 0.99 + 1.32
             = 3.67 → rounds to 4 (LIKELY)
```

---

## 4. Impact Fields (I1-I5)

### Impact Categories

| Field | Category | Measures |
|-------|----------|----------|
| `i1Financial` | FINANCIAL | Direct monetary loss |
| `i2Operational` | OPERATIONAL | Downtime, productivity |
| `i3Regulatory` | LEGAL_REGULATORY | Compliance violations |
| `i4Reputational` | REPUTATIONAL | Brand damage |
| `i5Strategic` | STRATEGIC | Long-term objectives |

### Impact Breakdown Fields

Each impact category has a breakdown JSON for detailed tracking:

```
i1Breakdown: { assetCosts, vendorValue, piiCost }
i2Breakdown: { rto, userImpact, criticality }
i3Breakdown: { gdpr, dora, nis2, pci }
i4Breakdown: { externalFacing, customerData }
i5Breakdown: { criticalFunction, competitiveAdvantage }
```

### Weighted Impact Calculation

```
weightedImpact = (I1 + I2 + I3 + I4 + I5) / 5
               = Simple average → rounded to 1-5

With BIRT weights (if configured):
weightedImpact = (I1×25% + I2×25% + I3×20% + I4×15% + I5×15%) / 100
```

---

## 5. Score Calculation

### Inherent Score

```
┌─────────────────────────────────────────────────────────────────┐
│ INHERENT SCORE = LIKELIHOOD × IMPACT                            │
├─────────────────────────────────────────────────────────────────┤
│ Where:                                                          │
│   LIKELIHOOD = weighted(F1, F2, F3) → 1-5                       │
│   IMPACT = MAX(I1, I2, I3, I4, I5) → 1-5                        │
│                                                                 │
│ Result: 1-25 scale                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Residual Score (after controls)

```
┌─────────────────────────────────────────────────────────────────┐
│ CONTROL EFFECTIVENESS MAPPING                                   │
├─────────────────────────────────────────────────────────────────┤
│ Effectiveness    Strength        L Reduction   I Reduction      │
│ 90-100%          VERY_STRONG     -3            -2               │
│ 80-89%           STRONG          -2            -1               │
│ 70-79%           MODERATE        -1            -1               │
│ 50-69%           WEAK            -1            0                │
│ 0-49%            NONE            0             0                │
└─────────────────────────────────────────────────────────────────┘

RESIDUAL LIKELIHOOD = MAX(1, INHERENT_L - REDUCTION)
RESIDUAL IMPACT = MAX(1, INHERENT_I - REDUCTION)
RESIDUAL SCORE = RESIDUAL_L × RESIDUAL_I → 1-25
```

### Risk Level Mapping

| Score | Level | Color | Action Required |
|-------|-------|-------|-----------------|
| 1-7 | LOW | Green | Accept with monitoring |
| 8-14 | MEDIUM | Yellow | Treatment within 90 days |
| 15-19 | HIGH | Orange | Treatment within 30 days, CISO approval |
| 20-25 | CRITICAL | Red | Immediate treatment, executive escalation |

---

## 6. Scenario Status Lifecycle

```
                    ┌─────────┐
                    │  DRAFT  │ ← Initial state
                    └────┬────┘
                         │ Factors scored
                         ▼
                    ┌──────────┐
                    │ ASSESSED │ ← Ready for evaluation
                    └────┬─────┘
                         │ Compare to tolerance
                         ▼
                    ┌───────────┐
                    │ EVALUATED │ ← Decision pending
                    └─────┬─────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐    ┌───────────┐
    │ ACCEPTED │   │ TREATING │    │ ESCALATED │
    └────┬─────┘   └────┬─────┘    └─────┬─────┘
         │              │                │
         ▼              ▼                │
    ┌────────────┐ ┌─────────┐          │
    │ MONITORING │ │ TREATED │          │
    └─────┬──────┘ └────┬────┘          │
          │             │               │
          │     ┌───────┴───────┐       │
          │     │               │       │
          ▼     ▼               ▼       ▼
       ┌────────┐           ┌────────┐
       │ REVIEW │           │ CLOSED │
       └────────┘           └───┬────┘
                                │
                                ▼
                           ┌──────────┐
                           │ ARCHIVED │
                           └──────────┘
```

---

## 7. Scenario Links

### Control Links (RiskScenarioControl)

```
Purpose: F2 calculation (control effectiveness)

Fields:
  - effectivenessWeight: Int (0-100)
  - isPrimaryControl: Boolean
  - notes: String

Flow: Control test results → effectiveness → F2 factor
```

### Threat Links (RiskScenarioThreat)

```
Purpose: F1 calculation (threat frequency)

Fields:
  - isPrimaryThreat: Boolean
  - frequencyOverride: Int
  - applicabilityNotes: String

Flow: ThreatCatalog.frequency → F1 factor
```

### Asset Links (RiskScenarioAsset)

```
Purpose: F3, I1, I2 calculations

Fields:
  - isPrimaryTarget: Boolean
  - feedsF3: Boolean (Gap/Vulnerability)
  - feedsI1: Boolean (Financial impact)
  - feedsI2: Boolean (Operational impact)

Flow: Asset security posture → vulnerability gaps
```

### Vendor Links (RiskScenarioVendor)

```
Purpose: Supply chain risk (F3, I1, I4)

Fields:
  - feedsF3, feedsI1, feedsI4: Boolean

Flow: Vendor assessment → third-party risk
```

### Application Links (RiskScenarioApplication)

```
Purpose: Application risk (F3, I1, I3)

Fields:
  - isPrimaryTarget: Boolean
  - feedsF3, feedsI1, feedsI3: Boolean

Flow: App security posture → technical risk
```

---

## 8. Tolerance Evaluation

### Evaluation Logic

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Get scenario's residualScore                                 │
│ 2. Get linked RTS toleranceThreshold                            │
│ 3. Calculate gap = residualScore - threshold                    │
│ 4. Determine status:                                            │
│    - gap ≤ 0      → WITHIN                                      │
│    - 0 < gap ≤ 4  → EXCEEDS                                     │
│    - gap > 4      → CRITICAL                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Appetite-Based Thresholds

| Appetite | Threshold | Description |
|----------|-----------|-------------|
| MINIMAL | ≤ 6 | Risk Averse - Green zone only |
| LOW | ≤ 10 | Cautious approach |
| MODERATE | ≤ 15 | Balanced (default) |
| HIGH | ≤ 20 | Aggressive/Growth-oriented |

---

## 9. Calculation Triggers

| Trigger | Description |
|---------|-------------|
| `MANUAL` | User-initiated recalculation |
| `SCHEDULED` | Periodic review cycle |
| `ASSET_UPDATED` | Asset security change → F3 |
| `CONTROL_TESTED` | Control test result → F2 |
| `VENDOR_ASSESSED` | Vendor assessment → F3, I1, I4 |
| `INCIDENT_CREATED` | New incident → F4, impacts |
| `TREATMENT_COMPLETED` | Treatment done → residual |
| `KRI_BREACH` | KRI threshold exceeded |
| `STATE_TRANSITION` | Status change |

---

## 10. Current State (Verified)

```
Total Risks: 50
Total Scenarios: 152

Scenarios per Risk: ~3 average

Sample Risk Structure:
  R-01: Information Security Governance (3 scenarios)
  R-02: External Parties & Threat Intel (3 scenarios)
  R-06: Identity & Access Management (5 scenarios)
  ...

All scenarios linked to 18 active RTS (MINIMAL appetite)
```

---

## 11. Key Files

| Component | File Path |
|-----------|-----------|
| Risk Schema | `prisma/schema/controls.prisma` (Risk model) |
| Scenario Schema | `prisma/schema/controls.prisma` (RiskScenario model) |
| Risk Service | `src/risks/services/risk.service.ts` |
| Scenario Service | `src/risks/services/risk-scenario.service.ts` |
| Scoring Utils | `src/risks/utils/risk-scoring.ts` |
| State Machine | `src/risks/utils/scenario-state-machine.ts` |

---

## 12. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/risks` | List risks |
| GET | `/risks/:id` | Get risk with scenarios |
| GET | `/risks/:id/scenarios` | List scenarios for risk |
| POST | `/risks/:id/scenarios` | Create scenario |
| PUT | `/risks/scenarios/:id` | Update scenario |
| POST | `/risks/scenarios/:id/calculate` | Recalculate scores |
| PUT | `/risks/scenarios/:id/status` | Transition status |

---

## Summary Diagram

```
                        ┌─────────────────┐
                        │      Risk       │
                        │    (Parent)     │
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
     │ Scenario 1  │    │ Scenario 2  │    │ Scenario 3  │
     └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
            │                  │                  │
     ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐
     │ F1-F6 + I1-I5│    │ F1-F6 + I1-I5│    │ F1-F6 + I1-I5│
     │ = Score     │    │ = Score     │    │ = Score     │
     └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
            │                  │                  │
            └──────────────────┼──────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Risk Aggregation    │
                    │ MAX/AVG of scores   │
                    │ Worst status        │
                    └─────────────────────┘
```
