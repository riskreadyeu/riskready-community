# Organisation Risk Profile Architecture

## Overview

The Organisation Profile is the **foundation** of the RiskReady GRC system. It contains organizational context that drives risk calculations, appetite thresholds, and regulatory applicability throughout the platform.

---

## 1. Data Model

### OrganisationProfile

**Location:** `prisma/schema/organisation.prisma`

| Field Group | Key Fields | Purpose |
|-------------|-----------|---------|
| **Identity** | name, legalName, logoUrl | Basic org identification |
| **Industry** | industrySector, industryCode, naceCode | Industry context for multipliers |
| **Financial** | annualRevenue, revenueCurrency, marginHealth | Financial impact thresholds |
| **Size** | employeeCount, size | Size tier determination |
| **Regulatory** | isDoraApplicable, isNis2Applicable, nis2Sector | Regulatory requirements |
| **GRC Calibration** | stackType, securityMaturity, riskPhilosophy | Risk calculation baselines |
| **Calculated** | baselineF2, baselineF3, impactThresholds | Derived from calibration |

### OrganisationSelectedAppetite

**Location:** `prisma/schema/organisation.prisma`

The **single source of truth** for the organization's risk appetite level.

```
┌─────────────────────────────────────┐
│  OrganisationSelectedAppetite       │
├─────────────────────────────────────┤
│  organisationId  (unique)           │
│  selectedLevel   AppetiteLevel      │  ← MINIMAL | LOW | MODERATE | HIGH
│  previousLevel   AppetiteLevel?     │
│  selectedById    String?            │
│  selectedAt      DateTime           │
│  approvedById    String?            │
│  approvedAt      DateTime?          │
│  rationale       String?            │
└─────────────────────────────────────┘
```

---

## 2. Appetite Level Mapping

### Frontend → Database Mapping

| User Selects | Stored As | Threshold | Description |
|--------------|-----------|-----------|-------------|
| AVERSE | MINIMAL | ≤ 6 | Risk Averse - Green zone only |
| CAUTIOUS | LOW | ≤ 10 | Conservative approach |
| BALANCED | MODERATE | ≤ 15 | Standard risk acceptance |
| AGGRESSIVE | HIGH | ≤ 20 | Growth-oriented, higher tolerance |

### Code Location

```typescript
// apps/server/src/organisation/services/organisation-profile.service.ts
function mapAppetiteToPrisma(level: string): PrismaAppetiteLevel {
  const map = {
    'AVERSE': 'MINIMAL',
    'CAUTIOUS': 'LOW',
    'BALANCED': 'MODERATE',
    'AGGRESSIVE': 'HIGH',
  };
  return map[level] || 'MODERATE';
}
```

---

## 3. Relationships to Other Components

```
                          ┌──────────────────────┐
                          │ OrganisationProfile  │
                          └──────────┬───────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────────┐     ┌─────────────────┐
│SelectedAppetite │      │ RiskTolerance       │     │ BirtOrgConfig   │
│ (1:1)           │      │ Statements (1:N)    │     │ (1:5 categories)│
└────────┬────────┘      └──────────┬──────────┘     └────────┬────────┘
         │                          │                          │
         │ filters                  │ links to                 │ thresholds
         ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────────┐     ┌─────────────────┐
│ Active RTS      │◄────►│ Risks (N:M)         │     │ Impact Levels   │
│ (by appetite)   │      │ Scenarios (N:M)     │     │ (1-5 scale)     │
└─────────────────┘      │ KRIs (N:M)          │     └─────────────────┘
                         └─────────────────────┘
```

### 3.1 Organisation → Selected Appetite (1:1)

- Each org has exactly ONE selected appetite level
- Stored in `OrganisationSelectedAppetite` table
- Tracks: current level, previous level, who selected, when approved

### 3.2 Organisation → Risk Tolerance Statements (1:N)

- 72 RTS records (18 domains × 4 appetite levels)
- Filtered by `appetiteLevel = selectedAppetite.selectedLevel`
- Active RTS: 18 (for the current appetite level)

### 3.3 RTS → Risks/Scenarios/KRIs (N:M)

- Many-to-many relationships via join tables
- `_RiskToleranceRisks` - links RTS to Risks
- `_RTSScenarios` - links RTS to Scenarios
- `_RTSKRIs` - links RTS to KRIs

### 3.4 Organisation → BIRT Config (1:5)

- One config per impact category
- Categories: FINANCIAL, OPERATIONAL, LEGAL_REGULATORY, REPUTATIONAL, STRATEGIC
- Each can optionally link to an RTS via `rtsId`

---

## 4. Data Flow: Appetite Selection

```
┌─────────────────────────────────────────────────────────────────────┐
│ User selects "BALANCED" in GRC Calibration Form                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: GrcCalibrationForm.tsx                                    │
│   → Sends PATCH /organisation-profile/:id                           │
│   → Body: { appetiteLevel: "BALANCED", ...otherFields }             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Backend: OrganisationProfileService.updateWithAppetite()            │
│   1. Extract appetiteLevel from payload                             │
│   2. Map "BALANCED" → "MODERATE" (Prisma enum)                      │
│   3. Upsert OrganisationSelectedAppetite record                     │
│   4. Track previousLevel for history                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Database: OrganisationSelectedAppetite                              │
│   { selectedLevel: "MODERATE", previousLevel: "MINIMAL", ... }      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Effect: RTS Filtering                                               │
│   → RiskAppetiteService.getDerivedDomainThresholds()                │
│   → Queries RTS WHERE appetiteLevel = "MODERATE" AND status = ACTIVE│
│   → Returns 18 matching RTS with toleranceThreshold values          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Impact on Risk Calculations

### 5.1 Baseline Factors (F2/F3)

The organisation profile's GRC calibration fields affect scenario calculations:

| Profile Field | Affects | Impact |
|---------------|---------|--------|
| stackType | F3 (Attack Surface) | Cloud_Native=higher, On_Prem=lower |
| securityMaturity | F2 (Control Effectiveness) | Optimized=lower risk, Initial=higher |
| internetExposure | F3 (Attack Surface) | High=higher, Low=lower |
| usersHaveLocalAdmin | F2/F3 | true=higher risk |

### 5.2 Impact Thresholds

Financial thresholds are calculated from:

```typescript
// BirtService.calculateDynamicFinancialThresholds()
inputs:
  - annualRevenue
  - marginHealth (Low/Standard/High)
  - selectedAppetiteLevel
  - industrySector (for industry multiplier)

outputs:
  - NEGLIGIBLE: < 0.1% of revenue
  - MINOR: 0.1% - 0.5%
  - MODERATE: 0.5% - 2%
  - MAJOR: 2% - 5%
  - SEVERE: > 5%
```

### 5.3 Tolerance Evaluation

```
Scenario.residualScore vs RTS.toleranceThreshold

If residualScore ≤ threshold → WITHIN tolerance
If residualScore > threshold → EXCEEDS tolerance → Breach Alert
```

---

## 6. Database Queries

### Get Active Appetite Level

```sql
SELECT selectedLevel
FROM OrganisationSelectedAppetite
WHERE organisationId = ?;
```

### Get Matching RTS

```sql
SELECT * FROM RiskToleranceStatement
WHERE organisationId = ?
  AND appetiteLevel = ?  -- matches selectedLevel
  AND status = 'ACTIVE';
```

### Get Linked Risks/Scenarios

```sql
-- Via join tables
SELECT r.* FROM Risk r
JOIN _RiskToleranceRisks rtr ON r.id = rtr.A
WHERE rtr.B = ?;  -- RTS id
```

---

## 7. Key Files

| Component | File Path |
|-----------|-----------|
| Schema | `prisma/schema/organisation.prisma` |
| Service | `src/organisation/services/organisation-profile.service.ts` |
| Controller | `src/organisation/controllers/organisation-profile.controller.ts` |
| Frontend Form | `apps/web/src/components/organisation/GrcCalibrationForm.tsx` |
| Appetite Service | `src/risks/services/risk-appetite.service.ts` |
| BIRT Service | `src/risks/services/birt.service.ts` |

---

## 8. Current State (Verified)

```
Organisation: Acme Corporation (cmkrijggm000714kc4ger8tno)
Selected Appetite: MINIMAL
Active RTS: 18 (filtered by MINIMAL appetite)
Linked Risks: 50
Linked Scenarios: 152
```

---

## Next Steps

See related architecture documents:
- `02-risk-tolerance-statements.md` - RTS structure and linking
- `03-birt-configuration.md` - Impact thresholds and weights
- `04-risk-scenarios.md` - Scenario calculations and tolerance evaluation
