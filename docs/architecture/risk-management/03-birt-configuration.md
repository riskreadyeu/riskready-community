# BIRT (Business Impact Reference Table) Architecture

## Overview

BIRT defines how business impacts are categorized, weighted, and measured across 5 impact domains. It provides both system-wide defaults and organization-specific customizations, with dynamic threshold calculation based on organizational context.

---

## 1. Data Models

### System-Level Configuration

```
┌─────────────────────────────────────┐
│        BirtSystemConfig             │
├─────────────────────────────────────┤
│ id                                  │
│ category    ImpactCategory (unique) │
│ weight      Int (default 25%)       │
│ description String?                 │
└──────────────────┬──────────────────┘
                   │ 1:N
                   ▼
┌─────────────────────────────────────┐
│       BirtSystemThreshold           │
├─────────────────────────────────────┤
│ category    ImpactCategory          │
│ level       ImpactLevel (1-5)       │
│ value       Int                     │
│ description String                  │
│ minAmount   Decimal?                │
│ maxAmount   Decimal?                │
│ duration    String?                 │
│ isRegulatoryMinimum Boolean         │
│ regulatorySource    String?         │
└─────────────────────────────────────┘
```

### Organization-Level Configuration

```
┌─────────────────────────────────────┐
│         BirtOrgConfig               │
├─────────────────────────────────────┤
│ organisationId  String              │
│ category        ImpactCategory      │
│ weight          Int? (override)     │
│ rtsId           String? ──────────────► RiskToleranceStatement
└──────────────────┬──────────────────┘
                   │ 1:N
                   ▼
┌─────────────────────────────────────┐
│        BirtOrgThreshold             │
├─────────────────────────────────────┤
│ level       ImpactLevel             │
│ description String?                 │
│ minAmount   Decimal? (≥ regulatory) │
│ maxAmount   Decimal?                │
│ duration    String?                 │
│ rationale   String?                 │
└─────────────────────────────────────┘
```

---

## 2. The 5 Impact Categories

| Category | Code | Weight | Description |
|----------|------|--------|-------------|
| **Financial** | I1 | 25% | Direct monetary loss, fines, remediation costs |
| **Operational** | I2 | 25% | Business disruption, availability, productivity |
| **Legal/Regulatory** | I3 | 20% | Compliance violations, legal action, sanctions |
| **Reputational** | I4 | 15% | Brand damage, customer trust, market perception |
| **Strategic** | I5 | 15% | Long-term objectives, competitive position |

**Total: 100%**

---

## 3. Impact Levels (1-5 Scale)

| Level | Value | Financial Example | Operational Example |
|-------|-------|-------------------|---------------------|
| NEGLIGIBLE | 1 | < $10K | < 1 hour downtime |
| MINOR | 2 | $10K - $50K | 1-4 hours downtime |
| MODERATE | 3 | $50K - $200K | 4-24 hours downtime |
| MAJOR | 4 | $200K - $1M | 1-7 days downtime |
| SEVERE | 5 | > $1M | > 7 days downtime |

---

## 4. BIRT ↔ RTS Integration

```
┌─────────────────┐         ┌─────────────────────┐
│  BirtOrgConfig  │────────►│ RiskToleranceStatement│
│  (category)     │  rtsId  │  (toleranceThreshold) │
└─────────────────┘         └─────────────────────┘
         │                            │
         │                            │
         ▼                            ▼
┌─────────────────────────────────────────────────┐
│         Scenario Tolerance Evaluation           │
│  residualScore vs toleranceThreshold            │
└─────────────────────────────────────────────────┘
```

**Purpose of RTS Link:**
- Associates BIRT category with risk appetite context
- RTS provides `toleranceThreshold` for evaluation
- Enables appetite-aware impact assessment

---

## 5. Dynamic Financial Threshold Calculation

### Input Data

| Source | Field | Purpose |
|--------|-------|---------|
| OrganisationProfile | size | Determines loss magnitude tier |
| OrganisationProfile | industrySector | Industry multiplier lookup |
| OrganisationSelectedAppetite | selectedLevel | Appetite multiplier |
| LossMagnitudeCatalog | min/mode/max | Base loss values |
| IndustryMultiplier | multiplier | Industry-specific scaling |
| AppetiteMultiplier | multiplier | Appetite-based scaling |

### Calculation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Determine Size Tier                                          │
│    org.size → SMB | MID_MARKET | ENTERPRISE                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Get Base Loss Magnitude (from LossMagnitudeCatalog)          │
│    SMB: min=$10K, mode=$100K, max=$500K                         │
│    MID_MARKET: min=$50K, mode=$500K, max=$2M                    │
│    ENTERPRISE: min=$200K, mode=$2M, max=$10M                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Get Appetite Multiplier                                      │
│    MINIMAL (Averse): 0.5x                                       │
│    LOW (Cautious): 0.75x                                        │
│    MODERATE (Balanced): 1.0x                                    │
│    HIGH (Aggressive): 1.5x                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Get Industry Multiplier (from IndustryMultiplier table)      │
│    Healthcare: 1.85x (high breach costs)                        │
│    Financial: 1.50x                                             │
│    Technology: 1.20x                                            │
│    Default: 1.0x                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Calculate Scaled Thresholds                                  │
│    scaledMin = baseLoss.min × appetiteMultiplier × industryMult │
│    scaledMode = baseLoss.mode × appetiteMultiplier × industryMult│
│    scaledMax = baseLoss.max × appetiteMultiplier × industryMult │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Generate Threshold Ranges                                    │
│    NEGLIGIBLE: < scaledMin                                      │
│    MINOR: scaledMin → (scaledMode × 0.5)                        │
│    MODERATE: (scaledMode × 0.5) → scaledMode                    │
│    MAJOR: scaledMode → (scaledMax × 0.5)                        │
│    SEVERE: > (scaledMax × 0.5)                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Example Calculation

```
Organization: Mid-sized Healthcare Company
  - Size: MID_MARKET
  - Industry: Healthcare
  - Appetite: CAUTIOUS (LOW)

Base Loss (MID_MARKET):
  min=$50K, mode=$500K, max=$2M

Multipliers:
  - Appetite (LOW): 0.75
  - Industry (Healthcare): 1.85

Scaled Values:
  - scaledMin = $50K × 0.75 × 1.85 = $69K
  - scaledMode = $500K × 0.75 × 1.85 = $694K
  - scaledMax = $2M × 0.75 × 1.85 = $2.78M

Resulting Thresholds:
  - NEGLIGIBLE: < $69K
  - MINOR: $69K - $347K
  - MODERATE: $347K - $694K
  - MAJOR: $694K - $1.39M
  - SEVERE: > $1.39M
```

---

## 6. Scenario Impact Assessment

### ScenarioImpactAssessment Model

```
┌─────────────────────────────────────┐
│    ScenarioImpactAssessment         │
├─────────────────────────────────────┤
│ scenarioId   String                 │
│ category     ImpactCategory         │
│ level        ImpactLevel            │
│ value        Int (1-5)              │
│ rationale    String?                │
│ isResidual   Boolean                │
└─────────────────────────────────────┘
```

### Assessment Types

| Type | isResidual | Purpose |
|------|------------|---------|
| Inherent | false | Impact before controls applied |
| Residual | true | Impact after controls applied |

### Weighted Impact Calculation

```typescript
// For each scenario, calculate weighted impact:

weightedSum = 0
for each category:
  weightedSum += assessmentValue × categoryWeight

weightedImpact = round(weightedSum / 100)
// Clamped to 0-5 range
```

**Example:**

```
Scenario Assessments:
  - Financial: 4 (MAJOR)
  - Operational: 3 (MODERATE)
  - Legal/Regulatory: 3 (MODERATE)
  - Reputational: 2 (MINOR)
  - Strategic: 3 (MODERATE)

With default weights (25%, 25%, 20%, 15%, 15%):
  (4×25 + 3×25 + 3×20 + 2×15 + 3×15) / 100
  = (100 + 75 + 60 + 30 + 45) / 100
  = 310 / 100
  = 3.1 → rounds to 3 (MODERATE)
```

---

## 7. Regulatory Minimums

Some thresholds are marked as regulatory minimums and cannot be overridden below:

| Category | Level | Regulatory Source | Minimum |
|----------|-------|-------------------|---------|
| LEGAL_REGULATORY | SEVERE | GDPR Article 83 | €20M or 4% revenue |
| LEGAL_REGULATORY | MAJOR | NIS2 Directive | €10M or 2% revenue |
| OPERATIONAL | MAJOR | DORA Article 10 | 2 hours RTO |

---

## 8. Effective Threshold Resolution

```
┌─────────────────────────────────────────────────────────────────┐
│                    Threshold Resolution Order                    │
├─────────────────────────────────────────────────────────────────┤
│ 1. Check BirtOrgThreshold (org-specific override)               │
│    ↓ if not found                                               │
│ 2. Check BirtSystemThreshold (system default)                   │
│    ↓ apply                                                      │
│ 3. Apply regulatory minimum check                               │
│    → Cannot go below isRegulatoryMinimum=true thresholds        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/risks/birt/system-config` | Get system defaults |
| GET | `/risks/birt/system-config/:category` | Get category thresholds |
| GET | `/risks/birt/org/:orgId` | Get org configuration |
| GET | `/risks/birt/effective/:orgId` | Get merged effective config |
| PUT | `/risks/birt/org/:orgId/:category` | Update org category config |
| PUT | `/risks/birt/org/:orgId/weights` | Update all weights |
| GET | `/risks/birt/regulatory-minimums` | Get regulatory minimums |
| GET | `/risks/birt/external-factors` | Get external factors |

---

## 10. Key Files

| Component | File Path |
|-----------|-----------|
| Schema | `prisma/schema/controls.prisma` (lines 554-669) |
| Service | `src/risks/services/birt.service.ts` |
| Controller | `src/risks/controllers/birt.controller.ts` |
| Scoring Utils | `src/risks/utils/risk-scoring.ts` |
| Seed | `prisma/seed/risks/seed-birt.ts` |

---

## 11. Integration Points

```
OrganisationProfile
    │
    ├── size, industrySector, marginHealth
    │   └── → Dynamic threshold calculation
    │
    ├── selectedAppetite
    │   └── → Appetite multiplier lookup
    │
    └── BirtOrgConfig (1:5 categories)
        │
        ├── rtsId → RiskToleranceStatement
        │           └── toleranceThreshold for evaluation
        │
        └── BirtOrgThreshold (1:5 levels per category)
            └── Custom thresholds per impact level

RiskScenario
    │
    ├── i1Financial, i2Operational, i3Regulatory, i4Reputational, i5Strategic
    │   └── Impact scores per category (1-5)
    │
    ├── ScenarioImpactAssessment (N per scenario)
    │   └── Detailed assessment with rationale
    │
    └── weightedImpact / residualWeightedImpact
        └── Calculated from weighted average of all categories
```

---

## Next Document

- `04-risk-scenarios.md` - Scenario calculations and tolerance evaluation
