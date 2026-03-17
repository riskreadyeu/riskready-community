# Risk Management Module - Risk Scoring Methodology

**Version:** 1.1  
**Updated:** December 2024  
**Aligned With:** POL-002, STD-002-01, PRO-002-01, PRO-002-03

---

## Table of Contents

1. [Overview](#overview)
2. [Standard 5x5 Risk Matrix](#standard-5x5-risk-matrix)
3. [Score Aggregation](#score-aggregation)
4. [Control Effectiveness](#control-effectiveness)
5. [Risk Reduction Calculation](#risk-reduction-calculation)
6. [Risk Acceptance Validation](#risk-acceptance-validation)
7. [Implementation Reference](#implementation-reference)

---

## Overview

The Risk Management Module uses a simple 5x5 risk matrix scoring methodology:

| Method | Use Case | Output |
|--------|----------|--------|
| **Standard 5x5 Matrix** | Risk assessment | Likelihood (1-5) x Impact (1-5) = Score (1-25) |

Residual risk is calculated from linked control effectiveness.

---

## Standard 5x5 Risk Matrix

### Formula

```
Risk Score = Likelihood × Impact
```

Where:
- **Likelihood** ranges from 1 (Rare) to 5 (Almost Certain)
- **Impact** ranges from 1 (Negligible) to 5 (Severe)
- **Score** ranges from 1 to 25

### Likelihood Scale

| Level | Value | Probability | Description |
|-------|-------|-------------|-------------|
| **Rare** | 1 | <5% | Very unlikely to occur; may only happen in exceptional circumstances |
| **Unlikely** | 2 | 5-25% | Could occur but not expected; unlikely in normal circumstances |
| **Possible** | 3 | 25-50% | Might occur at some time; reasonable chance of happening |
| **Likely** | 4 | 50-80% | Will probably occur in most circumstances |
| **Almost Certain** | 5 | >80% | Expected to occur; will happen unless prevented |

### Impact Scale

| Level | Value | Description |
|-------|-------|-------------|
| **Negligible** | 1 | Minimal impact; easily absorbed with no significant effect |
| **Minor** | 2 | Limited impact; some disruption but manageable |
| **Moderate** | 3 | Noticeable impact; significant effort to manage |
| **Major** | 4 | Significant impact; serious consequences requiring major response |
| **Severe** | 5 | Critical impact; could threaten organizational viability |

### Risk Matrix Visualization

```
                         IMPACT
                1        2        3        4        5
              (Neg)   (Minor)  (Mod)   (Major) (Severe)
         ┌────────┬────────┬────────┬────────┬────────┐
    5    │   5    │   10   │   15   │   20   │   25   │  Almost
(A.Cert) │  LOW   │  MED   │  HIGH  │  CRIT  │  CRIT  │  Certain
         ├────────┼────────┼────────┼────────┼────────┤
    4    │   4    │   8    │   12   │   16   │   20   │
(Likely) │  LOW   │  MED   │  MED   │  HIGH  │  CRIT  │  Likely
L        ├────────┼────────┼────────┼────────┼────────┤
I   3    │   3    │   6    │   9    │   12   │   15   │
K (Poss) │  LOW   │  LOW   │  MED   │  MED   │  HIGH  │  Possible
E        ├────────┼────────┼────────┼────────┼────────┤
L   2    │   2    │   4    │   6    │   8    │   10   │
I (Unl)  │  LOW   │  LOW   │  LOW   │  MED   │  MED   │  Unlikely
H        ├────────┼────────┼────────┼────────┼────────┤
O   1    │   1    │   2    │   3    │   4    │   5    │
O (Rare) │  LOW   │  LOW   │  LOW   │  LOW   │  LOW   │  Rare
D        └────────┴────────┴────────┴────────┴────────┘
```

**Thresholds (per POL-002 §5.3.2):**
- LOW: 1-7 (green cells)
- MEDIUM: 8-14 (yellow cells)
- HIGH: 15-19 (orange cells)
- CRITICAL: 20-25 (red cells)

### Risk Level Categories

Aligned with **POL-002 Section 5.3.2**, **STD-002-01 Section 6.2**, and **STD-002-02 Section 10.3**:

| Category | Score Range | Color | Tolerance | Treatment Deadline |
|----------|-------------|-------|-----------|-------------------|
| **LOW** | 1-7 | 🟢 Green | Acceptable with monitoring | Optional |
| **MEDIUM** | 8-14 | 🟡 Yellow | Generally unacceptable | 90 days |
| **HIGH** | 15-19 | 🟠 Orange | Unacceptable | 30 days |
| **CRITICAL** | 20-25 | 🔴 Red | Unacceptable | Immediate |

### Treatment Requirements by Level

| Level | Treatment | Escalation | Approval Authority | Review |
|-------|-----------|------------|-------------------|--------|
| **CRITICAL** | Required | Executive Management | CEO + Board | Quarterly |
| **HIGH** | Required | CISO | CISO + Steering Committee | Quarterly |
| **MEDIUM** | Required | Risk Owner | CISO | Semi-annually |
| **LOW** | Optional | N/A | Risk Owner | Annually |

### Code Reference

```typescript
// From apps/server/src/risks/utils/risk-scoring.ts

export const LIKELIHOOD_VALUES: Record<LikelihoodLevel, number> = {
  RARE: 1,
  UNLIKELY: 2,
  POSSIBLE: 3,
  LIKELY: 4,
  ALMOST_CERTAIN: 5,
};

export const IMPACT_VALUES: Record<ImpactLevel, number> = {
  NEGLIGIBLE: 1,
  MINOR: 2,
  MODERATE: 3,
  MAJOR: 4,
  SEVERE: 5,
};

export const RISK_LEVEL_THRESHOLDS = {
  LOW: { min: 1, max: 7, color: 'green', label: 'Low', tolerance: 'Acceptable with monitoring' },
  MEDIUM: { min: 8, max: 14, color: 'yellow', label: 'Medium', tolerance: 'Generally unacceptable' },
  HIGH: { min: 15, max: 19, color: 'orange', label: 'High', tolerance: 'Unacceptable' },
  CRITICAL: { min: 20, max: 25, color: 'red', label: 'Critical', tolerance: 'Unacceptable' },
};

export function calculateScore(
  likelihood: LikelihoodLevel | string | null | undefined,
  impact: ImpactLevel | string | null | undefined
): number {
  if (!likelihood || !impact) return 0;
  
  const likelihoodValue = LIKELIHOOD_VALUES[likelihood as LikelihoodLevel] || 0;
  const impactValue = IMPACT_VALUES[impact as ImpactLevel] || 0;
  
  return likelihoodValue * impactValue;
}

// Per POL-002 Section 5.3.2
export function getRiskLevel(score: number): RiskLevel {
  if (score <= 0) return 'NONE';
  if (score <= 7) return 'LOW';
  if (score <= 14) return 'MEDIUM';
  if (score <= 19) return 'HIGH';
  return 'CRITICAL';
}
```

---

## Score Aggregation

### Scenario-to-Risk Aggregation

When a risk has multiple scenarios, the parent risk score is calculated using **MAX aggregation**:

```
Risk.inherentScore = MAX(Scenario[].inherentScore)
Risk.residualScore = MAX(Scenario[].residualScore)
```

**Rationale:** The overall risk level should reflect the worst-case scenario, ensuring critical scenarios are not diluted by lower-risk ones.

### Example

| Scenario | Inherent Score | Residual Score |
|----------|----------------|----------------|
| R-01-S01 | 12 (HIGH) | 6 (MEDIUM) |
| R-01-S02 | 20 (CRITICAL) | 9 (MEDIUM) |
| R-01-S03 | 8 (MEDIUM) | 4 (LOW) |

**Result:**
- Risk R-01 Inherent Score: **20** (CRITICAL)
- Risk R-01 Residual Score: **9** (MEDIUM)

### Code Reference

```typescript
// From apps/server/src/risks/utils/risk-scoring.ts

export function aggregateScores(scenarios: ScenarioScore[]): {
  inherentScore: number;
  residualScore: number;
} {
  if (!scenarios || scenarios.length === 0) {
    return { inherentScore: 0, residualScore: 0 };
  }

  const inherentScores = scenarios
    .map(s => s.inherentScore || 0)
    .filter(s => s > 0);
  
  const residualScores = scenarios
    .map(s => s.residualScore || 0)
    .filter(s => s > 0);

  return {
    inherentScore: inherentScores.length > 0 ? Math.max(...inherentScores) : 0,
    residualScore: residualScores.length > 0 ? Math.max(...residualScores) : 0,
  };
}
```

### Automatic Recalculation

Parent risk scores are automatically recalculated when:
1. A scenario is created
2. A scenario's likelihood or impact is updated
3. A scenario is deleted

---

## Control Effectiveness

### Overview

Control effectiveness determines how much controls reduce inherent risk. Aligned with **PRO-002-01 Section 5.4** and **STD-002-01 Section 8**.

### Control Strength Levels

| Level | Label | Description | Likelihood Reduction | Impact Reduction |
|-------|-------|-------------|---------------------|------------------|
| **NONE** | None | No control exists | 0 levels | 0 levels |
| **WEAK** | Weak | Control largely ineffective | 1 level | 0 levels |
| **MODERATE** | Moderate | Partial mitigation, inconsistent | 1 level | 1 level |
| **STRONG** | Strong | Effective and reliable | 2 levels | 1 level |
| **VERY_STRONG** | Very Strong | Highly effective and optimized | 3 levels | 2 levels |

### Residual Calculation Example

| Factor | Inherent | Control Effectiveness | Residual |
|--------|----------|----------------------|----------|
| Likelihood | LIKELY (4) | STRONG (-2) | UNLIKELY (2) |
| Impact | MAJOR (4) | STRONG (-1) | MODERATE (3) |
| **Score** | 16 | | **6** |
| **Level** | HIGH | | **LOW** |

### Code Reference

```typescript
// From apps/server/src/risks/utils/risk-scoring.ts

export const CONTROL_EFFECTIVENESS = {
  NONE: { likelihoodReduction: 0, impactReduction: 0, percentage: 0 },
  WEAK: { likelihoodReduction: 1, impactReduction: 0, percentage: 20 },
  MODERATE: { likelihoodReduction: 1, impactReduction: 1, percentage: 50 },
  STRONG: { likelihoodReduction: 2, impactReduction: 1, percentage: 75 },
  VERY_STRONG: { likelihoodReduction: 3, impactReduction: 2, percentage: 90 },
};

export function calculateResidualScore(
  inherentLikelihood: LikelihoodLevel,
  inherentImpact: ImpactLevel,
  preventiveControlStrength: ControlStrength,
  detectiveControlStrength: ControlStrength
): number {
  const residualLikelihood = calculateResidualLikelihood(
    inherentLikelihood, preventiveControlStrength
  );
  const residualImpact = calculateResidualImpact(
    inherentImpact, detectiveControlStrength
  );
  return residualLikelihood * residualImpact;
}
```

---

## Risk Reduction Calculation

### Formula

```
Risk Reduction % = ((Inherent Score - Residual Score) / Inherent Score) × 100
```

### Example

| Metric | Value |
|--------|-------|
| Inherent Score | 20 |
| Residual Score | 8 |
| Risk Reduction | (20 - 8) / 20 × 100 = **60%** |

### Interpretation

| Reduction % | Interpretation |
|-------------|----------------|
| 0% | No risk reduction; controls not effective |
| 1-25% | Minimal reduction; limited control effectiveness |
| 26-50% | Moderate reduction; reasonable control effectiveness |
| 51-75% | Significant reduction; good control effectiveness |
| 76-99% | Major reduction; excellent control effectiveness |
| 100% | Full mitigation; risk eliminated |

### Code Reference

```typescript
// From apps/server/src/risks/utils/risk-scoring.ts

export function calculateRiskReduction(
  inherentScore: number | null | undefined,
  residualScore: number | null | undefined
): number {
  if (!inherentScore || inherentScore === 0) return 0;
  if (!residualScore) return 100; // Fully mitigated
  
  const reduction = ((inherentScore - residualScore) / inherentScore) * 100;
  return Math.max(0, Math.round(reduction));
}
```

---

## Risk Acceptance Validation

### Overview

Risk acceptance must comply with policy-defined period limits and approval authorities. Aligned with **PRO-002-03 Section 10**.

### Maximum Acceptance Periods

| Risk Level | Max Initial | Max Renewal | Max Cumulative | Board Notification |
|------------|-------------|-------------|----------------|-------------------|
| **CRITICAL** | 6 months | 6 months | 18 months | Immediate |
| **HIGH** | 12 months | 12 months | 36 months | Within 5 days |
| **MEDIUM** | 24 months | 24 months | Unlimited | Quarterly |
| **LOW** | 36 months | 36 months | Unlimited | Annual |
| **VERY_LOW** | 36 months | 36 months | Unlimited | Annual |

### Approval Authority Matrix

| Risk Level | Primary Approver | Secondary Approver |
|------------|------------------|-------------------|
| **CRITICAL** | CEO | Board/Steering Committee |
| **HIGH** | CISO | Executive Steering Committee |
| **MEDIUM** | CISO | N/A |
| **LOW** | Risk Owner | InfoSec acknowledgment |
| **VERY_LOW** | Risk Owner | N/A |

### Code Reference

```typescript
// From apps/server/src/risks/utils/risk-scoring.ts

export const ACCEPTANCE_PERIOD_LIMITS = {
  CRITICAL: { maxInitial: 6, maxRenewal: 6, maxCumulative: 18 },
  HIGH: { maxInitial: 12, maxRenewal: 12, maxCumulative: 36 },
  MEDIUM: { maxInitial: 24, maxRenewal: 24, maxCumulative: null },
  LOW: { maxInitial: 36, maxRenewal: 36, maxCumulative: null },
  VERY_LOW: { maxInitial: 36, maxRenewal: 36, maxCumulative: null },
};

export function validateAcceptancePeriod(
  riskScore: number,
  requestedMonths: number,
  renewalCount: number = 0
): { valid: boolean; maxAllowed: number; message?: string };

export function getAcceptanceAuthority(riskScore: number): {
  primary: string;
  secondary: string | null;
  boardNotification: string;
};
```

---

## Implementation Reference

### Scenario Score Calculation Flow

```
1. User sets Scenario likelihood (e.g., POSSIBLE = 3)
2. User sets Scenario impact (e.g., MAJOR = 4)
3. System calculates inherentScore = 3 × 4 = 12

4. System derives residual from linked control effectiveness
   → Residual likelihood = inherent likelihood - control reduction
   → Residual impact = inherent impact - control reduction
5. System calculates residualScore (e.g., UNLIKELY × MINOR = 2 × 2 = 4)

6. System recalculates parent Risk scores (MAX aggregation)
```

### Service Methods

| Method | Service | Description |
|--------|---------|-------------|
| `calculateScore()` | risk-scoring.ts | Calculate L × I score |
| `getRiskLevel()` | risk-scoring.ts | Get risk category from score (5 levels) |
| `getRiskLevelDetails()` | risk-scoring.ts | Get level with thresholds and requirements |
| `exceedsRiskAppetite()` | risk-scoring.ts | Check if score exceeds appetite |
| `isWithinTolerance()` | risk-scoring.ts | Check if score is acceptable |
| `aggregateScores()` | risk-scoring.ts | MAX aggregate scenario scores |
| `calculateRiskReduction()` | risk-scoring.ts | Calculate reduction percentage |
| `calculateResidualLikelihood()` | risk-scoring.ts | Apply control effectiveness to likelihood |
| `calculateResidualImpact()` | risk-scoring.ts | Apply control effectiveness to impact |
| `calculateResidualScore()` | risk-scoring.ts | Calculate residual with controls |
| `validateAcceptancePeriod()` | risk-scoring.ts | Validate acceptance period limits |
| `getAcceptanceAuthority()` | risk-scoring.ts | Get required approval authority |
| `recalculateScores()` | RiskService | Update parent risk from scenarios |

### Automatic Triggers

Risk scores are automatically recalculated when:

| Event | Trigger |
|-------|---------|
| Scenario created | `RiskScenarioService.create()` |
| Scenario updated | `RiskScenarioService.update()` |
| Scenario deleted | `RiskScenarioService.delete()` |
