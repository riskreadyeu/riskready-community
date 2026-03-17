# Risk Tolerance Statements (RTS) Architecture

## Overview

Risk Tolerance Statements define the organization's acceptable risk levels across 18 control domains. Each RTS specifies a **toleranceThreshold** that scenarios are evaluated against to determine if risks are within appetite.

---

## 1. Data Model

### RiskToleranceStatement

**Location:** `prisma/schema/controls.prisma`

| Field | Type | Purpose |
|-------|------|---------|
| `rtsId` | String | Unique ID (e.g., "RTS-001") |
| `title` | String | Descriptive title |
| `objective` | String | What this RTS aims to achieve |
| `domain` | String? | Control domain name (18 domains) |
| `category` | ImpactCategory? | Maps to 5 impact categories |
| `appetiteLevel` | AppetiteLevel? | MINIMAL \| LOW \| MODERATE \| HIGH |
| `toleranceThreshold` | Int? | **Critical: 1-5 scale for evaluation** |
| `proposedRTS` | String | Full tolerance statement text |
| `status` | RTSStatus | Workflow state |

### RTS Count Structure

```
Total RTS: 72
  = 18 domains × 4 appetite levels

Per Appetite Level: 18 RTS each
  - MINIMAL (Risk Averse): 18 RTS
  - LOW (Cautious): 18 RTS
  - MODERATE (Balanced): 18 RTS
  - HIGH (Aggressive): 18 RTS

Active RTS: Filtered by org's selected appetite level
  - If org selects MINIMAL → 18 active RTS
```

---

## 2. The 18 Control Domains

### Domain to Impact Category Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│ FINANCIAL (I1) - 2 domains                                      │
├─────────────────────────────────────────────────────────────────┤
│  • Third-Party Risk                                             │
│  • Business Continuity                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ OPERATIONAL (I2) - 11 domains                                   │
├─────────────────────────────────────────────────────────────────┤
│  • Asset Management        • Infrastructure                     │
│  • Network Security        • Endpoint Protection                │
│  • Identity & Access       • Application Security               │
│  • Cloud Security          • Security Operations                │
│  • Physical Security       • Processing Integrity               │
│  • Availability                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LEGAL_REGULATORY (I3) - 3 domains                               │
├─────────────────────────────────────────────────────────────────┤
│  • Data Protection                                              │
│  • Legal & Compliance                                           │
│  • Privacy                                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ REPUTATIONAL (I4) - 1 domain                                    │
├─────────────────────────────────────────────────────────────────┤
│  • People Security                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STRATEGIC (I5) - 1 domain                                       │
├─────────────────────────────────────────────────────────────────┤
│  • Governance & Strategy                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Code Location

```typescript
// apps/server/src/risks/services/risk-appetite.service.ts
private readonly RTS_DOMAIN_TO_IMPACT: Record<string, RiskDomain> = {
  'Third-Party Risk': 'FINANCIAL',
  'Business Continuity': 'FINANCIAL',
  'Asset Management': 'OPERATIONAL',
  'Network Security': 'OPERATIONAL',
  // ... etc
};
```

---

## 3. Appetite Level Thresholds

| Appetite Level | Threshold | Description |
|----------------|-----------|-------------|
| MINIMAL | 3-4 | Risk Averse - Strict controls |
| LOW | 5-6 | Cautious - Conservative approach |
| MODERATE | 7-8 | Balanced - Standard acceptance |
| HIGH | 9-10 | Aggressive - Growth-oriented |

### Sample RTS Thresholds (from database)

| Domain | MINIMAL | LOW | MODERATE | HIGH |
|--------|---------|-----|----------|------|
| Governance & Strategy | 3 | 5 | 7 | 9 |
| Asset Management | 4 | 6 | 8 | 10 |
| Identity & Access | 3 | 5 | 7 | 9 |
| Data Protection | 3 | 5 | 7 | 9 |
| Third-Party Risk | 3 | 5 | 7 | 9 |

---

## 4. RTS Relationships

```
┌─────────────────────────────────────┐
│     RiskToleranceStatement          │
└───────────────┬─────────────────────┘
                │
    ┌───────────┼───────────┬───────────────┐
    │           │           │               │
    ▼           ▼           ▼               ▼
┌───────┐  ┌─────────┐  ┌───────┐    ┌─────────────┐
│ Risk  │  │Scenario │  │  KRI  │    │BirtOrgConfig│
│ (N:M) │  │  (N:M)  │  │ (N:M) │    │   (1:N)     │
└───────┘  └─────────┘  └───────┘    └─────────────┘
    │           │           │
    └───────────┴───────────┘
                │
                ▼
    ┌─────────────────────────┐
    │  ToleranceEvaluation    │
    │  (evaluation results)   │
    └─────────────────────────┘
```

### Join Tables

- `_RiskToleranceRisks` - Links RTS ↔ Risk
- `_RTSScenarios` - Links RTS ↔ RiskScenario
- `_RTSKRIs` - Links RTS ↔ KeyRiskIndicator

---

## 5. Tolerance Evaluation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Get Scenario with Impact Scores (I1-I5)                      │
│    i1Financial=3, i2Operational=4, i3Regulatory=2, etc.         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Find Dominant Impact Domain (highest score)                  │
│    OPERATIONAL (score=4) is dominant                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Get RTS Threshold for Domain + Appetite Level                │
│    Domain: OPERATIONAL, Appetite: MINIMAL → Threshold: 4        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Compare residualScore vs toleranceThreshold                  │
│    residualScore (6) > threshold (4) → EXCEEDS                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Create Breach Alert if exceeds                               │
│    gap = 6 - 4 = 2 points over threshold                        │
└─────────────────────────────────────────────────────────────────┘
```

### Evaluation Results

| Condition | Status | Action |
|-----------|--------|--------|
| residualScore ≤ threshold | WITHIN | No alert |
| residualScore > threshold | EXCEEDS | Create breach alert |
| gap > 4 | CRITICAL | Escalate immediately |

---

## 6. Status Lifecycle

```
┌─────────┐
│  DRAFT  │ ← Initial state, editable
└────┬────┘
     │ submitForApproval()
     ▼
┌──────────────────┐
│ PENDING_APPROVAL │ ← Awaiting review
└────┬─────────────┘
     │ approve()
     ▼
┌──────────┐
│ APPROVED │ ← Ready to activate
└────┬─────┘
     │ activate()
     ▼
┌────────┐
│ ACTIVE │ ← In use for evaluation
└────┬───┘
     │ (new version activated)
     ▼
┌────────────┐
│ SUPERSEDED │ ← Replaced by newer version
└────────────┘
     │
     ▼
┌─────────┐
│ RETIRED │ ← End of life
└─────────┘
```

---

## 7. Derived Domain Thresholds

The system aggregates RTS thresholds by impact domain:

```typescript
// GET /api/risks/appetite/derived-domains?organisationId=xxx

async getDerivedDomainThresholds(organisationId: string) {
  // 1. Get org's selected appetite level (e.g., MINIMAL)
  const { selectedLevel } = await this.getSelectedAppetiteLevel(organisationId);

  // 2. Query RTS matching appetite + ACTIVE status
  const rtsRecords = await prisma.riskToleranceStatement.findMany({
    where: {
      organisationId,
      appetiteLevel: selectedLevel,  // Filter by org's appetite
      status: 'ACTIVE'
    }
  });

  // 3. Map to impact domains, find lowest threshold per domain
  for (const rts of rtsRecords) {
    const impactDomain = RTS_DOMAIN_TO_IMPACT[rts.domain];
    domainResults[impactDomain].thresholds.push(rts.toleranceThreshold);
  }

  // 4. Return min threshold per domain
  return {
    FINANCIAL: Math.min(...thresholds),      // e.g., 3
    OPERATIONAL: Math.min(...thresholds),    // e.g., 3
    LEGAL_REGULATORY: Math.min(...thresholds),
    REPUTATIONAL: Math.min(...thresholds),
    STRATEGIC: Math.min(...thresholds)
  };
}
```

---

## 8. Current State (Verified)

```
Total RTS: 72
  - MINIMAL: 18
  - LOW: 18
  - MODERATE: 18
  - HIGH: 18

Active (for MINIMAL appetite): 18

Linked Items (per RTS):
  - Risks: 50 (all risks linked to all active RTS)
  - Scenarios: 152 (all scenarios linked to all active RTS)
  - KRIs: 0 (none created yet)
```

---

## 9. Key Files

| Component | File Path |
|-----------|-----------|
| Schema | `prisma/schema/controls.prisma` (lines 1062-1151) |
| RTS Service | `src/risks/services/rts.service.ts` |
| Appetite Service | `src/risks/services/risk-appetite.service.ts` |
| RTS Controller | `src/risks/controllers/rts.controller.ts` |

---

## 10. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/risks/rts` | List RTS with filters |
| GET | `/risks/rts/stats` | Get RTS statistics |
| GET | `/risks/rts/:id` | Get single RTS with links |
| POST | `/risks/rts` | Create new RTS |
| PUT | `/risks/rts/:id` | Update RTS |
| PUT | `/risks/rts/:id/approve` | Approve RTS |
| GET | `/risks/appetite/derived-domains` | Get derived thresholds |

---

## Next Documents

- `03-birt-configuration.md` - Impact thresholds and weights
- `04-risk-scenarios.md` - Scenario calculations
