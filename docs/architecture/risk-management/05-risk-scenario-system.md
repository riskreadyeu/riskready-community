# Risk Scenario System Architecture

## Overview

The Risk Scenario system is a comprehensive risk quantification framework that combines:
- **6-Factor Likelihood Model** (F1-F6) for threat probability assessment
- **5-Category Impact Model** (I1-I5) with BIRT-weighted averaging
- **Control-Based Residual Calculation** for post-control risk reduction
- **Monte Carlo FAIR Simulation** for probabilistic loss analysis
- **Risk Appetite Alignment** with domain thresholds and breach alerting
- **Tolerance Evaluation** against Risk Tolerance Statements

---

## 1. Data Model

### RiskScenario Entity

**Location:** `prisma/schema/controls.prisma` (lines 755-980)

#### Core Identity Fields
| Field | Type | Purpose |
|-------|------|---------|
| `id` | String (CUID) | Primary key |
| `scenarioId` | String | Human-readable ID (e.g., "R-01-S01") |
| `title` | String | Scenario name |
| `cause` | String? | What causes the event |
| `event` | String? | What happens |
| `consequence` | String? | What is the outcome |
| `riskId` | String | Parent risk (FK) |

#### State Machine
| Field | Type | Values |
|-------|------|--------|
| `status` | ScenarioStatus | DRAFT, ASSESSED, ACCEPTED, TREATING, MONITORED, MITIGATED, ESCALATED, ARCHIVED, CLOSED, WITHDRAWN |
| `statusChangedAt` | DateTime? | Timestamp of last change |
| `statusChangedBy` | User? | User who changed status |

#### Factor Fields (F1-F6)

Each factor has 4 fields: value, source, override flag, override justification.

| Factor | Field | Type | Purpose |
|--------|-------|------|---------|
| F1 | `f1ThreatFrequency` | Int? | Threat frequency score (1-5) |
| F1 | `f1Source` | String? | Data source (e.g., threatId) |
| F1 | `f1Override` | Boolean | Manual override flag |
| F1 | `f1OverrideJustification` | String? | Override reasoning |
| F2 | `f2ControlEffectiveness` | Int? | Vulnerability/ease of exploit (1-5) |
| F3 | `f3GapVulnerability` | Int? | Attack surface score (1-5) |
| F4 | `f4IncidentHistory` | Int? | Historical incidents (1-5) |
| F5 | `f5AttackSurface` | Int? | External exposure (1-5, legacy) |
| F6 | `f6Environmental` | Int? | Environmental factors (1-5) |

#### Impact Fields (I1-I5)

| Field | Type | Purpose |
|-------|------|---------|
| `i1Financial` | Int? | Financial impact (1-5) |
| `i1Breakdown` | JSON? | `{ assetCosts, vendorValue, piiCost }` |
| `i2Operational` | Int? | Operational impact (1-5) |
| `i2Breakdown` | JSON? | `{ rto, userImpact, criticality }` |
| `i3Regulatory` | Int? | Regulatory impact (1-5) |
| `i3Breakdown` | JSON? | `{ gdpr, dora, nis2, pci }` |
| `i4Reputational` | Int? | Reputational impact (1-5) |
| `i4Breakdown` | JSON? | `{ externalFacing, customerData }` |
| `i5Strategic` | Int? | Strategic impact (1-5) |
| `i5Breakdown` | JSON? | `{ criticalFunction, competitiveAdvantage }` |

#### Score Fields

| Field | Type | Purpose |
|-------|------|---------|
| `likelihood` | LikelihoodLevel? | Inherent likelihood enum |
| `impact` | ImpactLevel? | Inherent impact enum |
| `inherentScore` | Int? | Likelihood × Impact (1-25) |
| `weightedImpact` | Int? | BIRT-weighted impact (1-5) |
| `residualLikelihood` | LikelihoodLevel? | Post-control likelihood |
| `residualImpact` | ImpactLevel? | Post-control impact |
| `residualScore` | Int? | Residual L × I (1-25) |
| `residualWeightedImpact` | Int? | Post-control weighted impact |
| `calculatedLikelihood` | Int? | System-calculated value |
| `calculatedResidualScore` | Int? | System-calculated residual |
| `residualOverridden` | Boolean | Manual override flag |
| `residualOverrideJustification` | String? | Override reasoning |

#### Tolerance Fields

| Field | Type | Purpose |
|-------|------|---------|
| `toleranceStatus` | ToleranceStatus? | WITHIN, EXCEEDS, or null |
| `toleranceThreshold` | Int? | Threshold from RTS (1-25) |
| `toleranceGap` | Int? | Score - Threshold |

#### FAIR Quantitative Fields

**Threat Event Frequency (TEF)**
| Field | Type | Purpose |
|-------|------|---------|
| `tefMin` | Float? | PERT minimum |
| `tefMode` | Float? | PERT most likely |
| `tefMax` | Float? | PERT maximum |

**Primary Loss**
| Field | Type | Purpose |
|-------|------|---------|
| `primaryLossMin` | Float? | Min loss per event ($) |
| `primaryLossMode` | Float? | Most likely loss ($) |
| `primaryLossMax` | Float? | Max loss per event ($) |

**Secondary Loss**
| Field | Type | Purpose |
|-------|------|---------|
| `secondaryLossMin` | Float? | Min secondary loss ($) |
| `secondaryLossMode` | Float? | Most likely secondary ($) |
| `secondaryLossMax` | Float? | Max secondary loss ($) |
| `secondaryLossProbability` | Float? | P(secondary \| event) |

**Simple FAIR (SLE/ARO/ALE)**
| Field | Type | Purpose |
|-------|------|---------|
| `sleLow` | Decimal? | Low SLE estimate |
| `sleLikely` | Decimal? | Most likely SLE |
| `sleHigh` | Decimal? | High SLE estimate |
| `aro` | Decimal? | Annual Rate of Occurrence |
| `ale` | Decimal? | Annual Loss Expectancy |

**Simulation Results**
| Field | Type | Purpose |
|-------|------|---------|
| `lastSimulationAt` | DateTime? | Last simulation timestamp |
| `simulationIterations` | Int? | Number of iterations |
| `aleMean` | Float? | Mean ALE |
| `aleMedian` | Float? | Median ALE |
| `aleP90` | Float? | 90th percentile |
| `aleP95` | Float? | 95th percentile |
| `aleP99` | Float? | 99th percentile |
| `lefMean` | Float? | Mean Loss Event Frequency |
| `probabilityOfLoss` | Float? | P(at least one loss) |
| `simulationResult` | JSON? | Full result for charts |

#### Relationships

```
RiskScenario
  ├── risk: Risk (parent)
  ├── toleranceStatements: RiskToleranceStatement[] (N:M)
  ├── impactAssessments: ScenarioImpactAssessment[] (1:N)
  ├── controlLinks: RiskScenarioControl[] (N:M)
  ├── threatLinks: RiskScenarioThreat[] (N:M)
  ├── assetLinks: RiskScenarioAsset[] (N:M)
  ├── vendorLinks: RiskScenarioVendor[] (N:M)
  ├── applicationLinks: RiskScenarioApplication[] (N:M)
  ├── kriLinks: RiskScenarioKRI[] (N:M)
  ├── calculationHistory: RiskCalculationHistory[] (1:N)
  ├── stateHistory: ScenarioStateHistory[] (1:N)
  ├── treatmentPlans: TreatmentPlan[] (1:N)
  ├── acceptances: RiskAcceptance[] (1:N)
  ├── escalations: RiskEscalation[] (1:N)
  └── reviews: ScenarioReview[] (1:N)
```

---

## 2. Calculation Formulas

### 2.1 Inherent Likelihood (3-Factor Model)

Only F1, F2, F3 contribute to inherent likelihood to prevent "double-dipping":

```
INHERENT_LIKELIHOOD = (F1 × 0.34) + (F2 × 0.33) + (F3 × 0.33)
```

| Factor | Weight | Source |
|--------|--------|--------|
| F1: Threat Frequency | 34% | ThreatCatalog, industry data |
| F2: Vulnerability/Ease | 33% | Control gaps, asset vulnerabilities |
| F3: Attack Surface | 33% | Internet exposure, vendor connections |

F4, F5, F6 are tracked but have **0% weight** (informational only).

### 2.2 Impact Assessment

#### Option A: Maximum Impact
```
IMPACT = MAX(I1, I2, I3, I4, I5)
```

#### Option B: BIRT Weighted Impact
```
WEIGHTED_IMPACT = (I1 × W1) + (I2 × W2) + (I3 × W3) + (I4 × W4) + (I5 × W5)
```

Default weights:
| Category | Weight |
|----------|--------|
| I1: Financial | 25% |
| I2: Operational | 25% |
| I3: Regulatory | 25% |
| I4: Reputational | 12.5% |
| I5: Strategic | 12.5% |

### 2.3 Inherent Score
```
INHERENT_SCORE = LIKELIHOOD × IMPACT
Result: 1-25 scale
```

### 2.4 Control Effectiveness

Control effectiveness is calculated from capability test results:

| Test Result | Score |
|-------------|-------|
| PASS | 100% |
| PARTIAL | 50% |
| FAIL | 0% |

Average score maps to strength:

| Score Range | Strength | L Reduction | I Reduction |
|-------------|----------|-------------|-------------|
| 90-100% | VERY_STRONG | -3 | -2 |
| 80-89% | STRONG | -2 | -1 |
| 70-79% | MODERATE | -1 | -1 |
| 50-69% | WEAK | -1 | 0 |
| 0-49% | NONE | 0 | 0 |

### 2.5 Residual Score
```
RESIDUAL_LIKELIHOOD = MAX(1, INHERENT_LIKELIHOOD - L_REDUCTION)
RESIDUAL_IMPACT = MAX(1, INHERENT_IMPACT - I_REDUCTION)
RESIDUAL_SCORE = RESIDUAL_LIKELIHOOD × RESIDUAL_IMPACT
```

### 2.6 Risk Level Mapping

| Score Range | Level | Color | Action |
|-------------|-------|-------|--------|
| 1-7 | LOW | Green | Accept with monitoring |
| 8-14 | MEDIUM | Yellow | Treatment within 90 days |
| 15-19 | HIGH | Orange | Treatment within 30 days |
| 20-25 | CRITICAL | Red | Immediate treatment |

---

## 3. FAIR Monte Carlo Simulation

### 3.1 FAIR Framework

```
TEF = Threat Event Frequency (events/year)
VULN = Vulnerability (0-1 probability)
LEF = Loss Event Frequency = TEF × VULN
SLE = Single Loss Expectancy ($/event)
ALE = Annual Loss Expectancy = LEF × SLE
```

### 3.2 Simulation Process

```python
def runSimulation(input, iterations=10000):
    for i in range(iterations):
        # 1. Sample TEF from PERT distribution
        tef = samplePert(input.tefMin, input.tefMode, input.tefMax)

        # 2. Calculate LEF
        lef = tef * input.vulnerability

        # 3. Sample actual events from Poisson(LEF)
        actualEvents = samplePoisson(lef)

        # 4. Calculate total loss for this iteration
        totalLoss = 0
        for event in range(actualEvents):
            # Primary loss
            primaryLoss = samplePert(primaryLossMin, primaryLossMode, primaryLossMax)
            totalLoss += primaryLoss

            # Secondary loss (with probability)
            if random() < secondaryLossProbability:
                secondaryLoss = samplePert(secondaryLossMin, secondaryLossMode, secondaryLossMax)
                totalLoss += secondaryLoss

        aleSamples.append(totalLoss)

    # 5. Calculate statistics
    return {
        mean: avg(aleSamples),
        median: percentile(aleSamples, 50),
        p90: percentile(aleSamples, 90),
        p95: percentile(aleSamples, 95),
        p99: percentile(aleSamples, 99),
        exceedanceCurve: buildExceedanceCurve(aleSamples)
    }
```

### 3.3 Distribution Implementations

**PERT Distribution** (Modified Beta)
- Parameters: min, mode, max, lambda=4
- Used for: TEF, primary loss, secondary loss

**Poisson Distribution**
- Parameter: lambda = LEF
- Used for: Actual event count per year

**Lognormal Distribution**
- Parameters: mean, stdDev
- Alternative for: Heavy-tailed loss distributions

---

## 4. Integration Points

### 4.1 Control → Scenario

```
Control.capabilities
    → CapabilityEffectivenessTest (PASS/PARTIAL/FAIL)
    → RiskScenarioControl (junction table)
    → Control effectiveness score (0-100%)
    → Control strength (NONE → VERY_STRONG)
    → Residual reduction applied
    → RiskScenario.residualScore updated
```

### 4.2 RTS → Tolerance Evaluation

```
RiskToleranceStatement
    → domain + appetiteLevel + toleranceThreshold
    → Link to scenario via _RTSScenarios
    → ToleranceEngineService.evaluateRisk()
    → Compare residualScore vs threshold
    → Set toleranceStatus (WITHIN/EXCEEDS)
    → Create RiskAlert if exceeds
```

### 4.3 BIRT → Impact Assessment

```
BirtSystemConfig + BirtOrgConfig
    → Category weights (FINANCIAL, OPERATIONAL, etc.)
    → ScenarioImpactAssessment per category
    → Calculate weighted impact
    → Update scenario.weightedImpact
```

### 4.4 ThreatCatalog → TEF

```
ThreatCatalog
    → threatId, tefMin, tefMode, tefMax
    → RiskScenarioThreat (junction table)
    → LossMagnitudeService.getFairParameters()
    → Populate scenario TEF fields
```

### 4.5 LossMagnitudeCatalog → FAIR

```
LossMagnitudeCatalog
    → threatId + sizeTier → loss profile
    → Apply IndustryMultiplier
    → Apply survivability cap (revenue %)
    → Populate scenario loss fields
    → Ready for Monte Carlo simulation
```

---

## 5. Services Reference

### 5.1 RiskScenarioService
**Location:** `src/risks/services/risk-scenario.service.ts`

| Method | Purpose |
|--------|---------|
| `create()` | Create new scenario |
| `findAll()` | List scenarios with filters |
| `findOne()` | Get scenario by ID with relations |
| `update()` | Update scenario fields |
| `updateLikelihoodFactorScores()` | Update F1-F6 scores |
| `saveImpactAssessments()` | Save I1-I5 category assessments |
| `calculateAndSaveWeightedImpact()` | Calculate BIRT weighted impact |
| `getSuggestedFactors()` | Get threat-based factor suggestions |
| `applySuggestedFactors()` | Apply suggested factor values |

### 5.2 RiskCalculationService
**Location:** `src/risks/services/risk-calculation.service.ts`

| Method | Purpose |
|--------|---------|
| `calculateScenario()` | Full scenario calculation |
| `calculateF1ThreatFrequency()` | Calculate F1 from threats |
| `calculateF2VulnerabilityExposure()` | Calculate F2 from controls |
| `calculateF3AttackSurface()` | Calculate F3 from assets |
| `calculateF4IncidentHistory()` | Calculate F4 from incidents |
| `calculateControlEffectiveness()` | Get control strength |

### 5.3 MonteCarloService
**Location:** `src/risks/services/monte-carlo.service.ts`

| Method | Purpose |
|--------|---------|
| `runSimulation()` | Run FAIR Monte Carlo simulation |
| `calculateROSI()` | Calculate Return on Security Investment |
| `recommendInsurance()` | Get insurance coverage recommendation |

### 5.4 LossMagnitudeService
**Location:** `src/risks/services/loss-magnitude.service.ts`

| Method | Purpose |
|--------|---------|
| `findAll()` | List loss profiles |
| `getForScenario()` | Get loss profile for scenario |
| `getFairParameters()` | Get complete FAIR parameters |
| `autoPopulateFairValues()` | Auto-populate scenario FAIR fields |

### 5.5 ToleranceEngineService
**Location:** `src/risks/services/tolerance-engine.service.ts`

| Method | Purpose |
|--------|---------|
| `evaluateRisk()` | Evaluate risk against RTS |
| `evaluateAllRisks()` | Bulk tolerance evaluation |

---

## 6. API Endpoints

### Scenario CRUD
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/risk-scenarios` | List scenarios |
| POST | `/risk-scenarios` | Create scenario |
| GET | `/risk-scenarios/:id` | Get scenario |
| PUT | `/risk-scenarios/:id` | Update scenario |
| DELETE | `/risk-scenarios/:id` | Delete scenario |

### Factor Scores
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/risk-scenarios/:id/factor-scores` | Get F1-F6 scores |
| PUT | `/risk-scenarios/:id/factor-scores` | Update F1-F6 scores |
| GET | `/risk-scenarios/:id/residual-factor-scores` | Get residual factors |
| GET | `/risk-scenarios/:id/suggested-factors` | Get suggestions |
| PUT | `/risk-scenarios/:id/apply-suggested-factors` | Apply suggestions |

### Impact Assessments
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/risk-scenarios/:id/impact-assessments` | Get I1-I5 assessments |
| POST | `/risk-scenarios/:id/impact-assessments` | Save assessments |
| DELETE | `/risk-scenarios/:id/impact-assessments/:category` | Delete assessment |

### FAIR Simulation
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/risk-scenarios/:id/simulation` | Run Monte Carlo |
| POST | `/risk-scenarios/:id/rosi` | Calculate ROSI |
| GET | `/risk-scenarios/:id/insurance-recommendation` | Get coverage recommendation |
| GET | `/loss-magnitude/fair-parameters/:scenarioId` | Get FAIR parameters |
| POST | `/loss-magnitude/:scenarioId/auto-populate` | Auto-populate FAIR |

---

## 7. Implementation Status

### Fully Implemented ✅
- Scenario CRUD and state machine
- 6-factor likelihood model (F1-F6)
- 5-category impact model (I1-I5)
- BIRT weighted impact calculation
- Control effectiveness → residual calculation
- RTS tolerance evaluation
- Monte Carlo FAIR simulation
- Loss magnitude catalog integration
- ROSI and insurance recommendations
- Calculation audit trail

### Partially Implemented ⚠️
- Automatic entity linking (manual only)
- Factor suggestions (basic threat matching)
- Two residual calculation paths (potential divergence)

### Not Implemented ❌
- Real-time threat intelligence feeds
- Multi-scenario correlation analysis
- Sensitivity analysis tools
- Data freshness indicators
- FAIR result visualization/export

---

## 8. Feature Deep-Dive Analysis

### 8.1 Automatic Entity Linking (20% Implemented)

**Current State:**
- Manual linking via junction tables (RiskScenarioControl, RiskScenarioAsset, etc.)
- Basic UI for selecting entities to link
- No automatic suggestions or discovery

**Gaps:**
1. No asset-to-control relationship inference
2. No threat-to-scenario matching algorithm
3. No similarity scoring between entities
4. No bulk linking operations
5. No link recommendation engine
6. No orphan detection (scenarios without proper links)

**Dependencies:**
- ThreatCatalog must be populated with mapping metadata
- Assets need security classification tags
- Controls need scope/applicability fields

**Effort:** HIGH (8-12 weeks)

**Recommendations:**
- Phase 1: Add threat-to-scenario auto-matching based on threat.applicableTiers
- Phase 2: Build control suggestion engine using control.domains vs scenario.domain
- Phase 3: Asset linking based on asset.securityClassification and scenario.impactCategories

---

### 8.2 Factor Suggestions (50% Implemented)

**Current State:**
- `getSuggestedFactors()` returns threat-based suggestions for F1
- F1 suggestion uses ThreatCatalog.inherentFrequency
- Basic source tracking in f1Source field

**Gaps:**
1. No F2 suggestions (control effectiveness → vulnerability score mapping missing)
2. No F3 suggestions (asset exposure calculation missing)
3. No confidence scoring for suggestions
4. No historical calibration (comparing suggestions to actual outcomes)
5. No explanation of suggestion reasoning
6. No multi-source aggregation for better accuracy

**Current Implementation:**
```typescript
// risk-scenario.service.ts - getSuggestedFactors()
async getSuggestedFactors(scenarioId: string) {
  const scenario = await this.findOne(scenarioId);
  const threats = await this.prisma.riskScenarioThreat.findMany({
    where: { scenarioId },
    include: { threat: true }
  });

  // F1 suggestion from primary threat
  const primaryThreat = threats.find(t => t.isPrimaryThreat);
  const suggestedF1 = primaryThreat?.threat.inherentFrequency;

  return { f1: suggestedF1, f2: null, f3: null }; // F2, F3 not implemented
}
```

**Effort:** MEDIUM (4-6 weeks)

**Recommendations:**
- Week 1-2: Add F2 suggestions from linked control effectiveness
- Week 3-4: Add F3 suggestions from asset exposure and vendor risk
- Week 5-6: Add confidence scoring and suggestion explanations

---

### 8.3 Two Residual Calculation Paths (80% Implemented) - HIGH RISK

**Current State:**
Two independent calculation paths exist:

**Path 1: RiskCalculationService.calculateScenario()**
- Uses weighted factor model
- Control effectiveness from RiskScenarioControl.effectivenessWeight
- Updates scenario.residualScore directly

**Path 2: ControlRiskIntegrationService.calculateResidualFromControls()**
- Uses capability test results
- Maps PASS/PARTIAL/FAIL → 100/50/0%
- Calculates average across all linked controls

**Divergence Risk:**
```
Scenario has 3 linked controls:
- Control A: effectivenessWeight = 80% (from Path 1)
- Control A: capability tests = [PASS, PARTIAL] → 75% (from Path 2)

Path 1 Result: residualScore = 8
Path 2 Result: residualScore = 10

WHICH IS CORRECT?
```

**Gaps:**
1. No authoritative source defined
2. No reconciliation logic when values differ
3. No warning when paths diverge
4. No audit trail showing which path was used
5. effectivenessWeight often stale vs test results
6. No scheduled recalculation to keep in sync

**Effort:** MEDIUM-HIGH (5-8 weeks)

**Recommendations:**
- **IMMEDIATE:** Define authoritative source (recommend: capability tests)
- Week 1-2: Add divergence detection with warning to users
- Week 3-4: Implement reconciliation logic
- Week 5-6: Add scheduled recalculation job
- Week 7-8: Migrate effectivenessWeight to derived field

---

### 8.4 Real-time Threat Intelligence Feeds (0% Implemented)

**Current State:**
- ThreatCatalog is static (seeded data only)
- No external feed integration
- No threat freshness tracking

**Required Components:**
1. Feed ingestion service (MITRE ATT&CK, CISA KEV, vendor feeds)
2. Threat mapping engine (external → internal taxonomy)
3. Frequency update mechanism (adjust TEF from real events)
4. Alert generation for new threats
5. Scenario impact assessment (which scenarios affected)
6. Dashboard for threat landscape changes

**Gaps:**
1. No feed connector infrastructure
2. No threat normalization layer
3. No frequency recalculation triggers
4. No user notification system for threat changes
5. No threat correlation to scenarios
6. No threat trending/forecasting

**Effort:** HIGH (8-12 weeks)

**Recommendations:**
- Phase 1 (Weeks 1-4): Build feed ingestion framework with MITRE ATT&CK
- Phase 2 (Weeks 5-8): Add threat-to-scenario correlation engine
- Phase 3 (Weeks 9-12): Implement auto-update of TEF and notifications

---

### 8.5 Multi-Scenario Correlation Analysis (0% Implemented)

**Current State:**
- Each scenario assessed independently
- No correlation tracking between scenarios
- Parent Risk aggregation is simple MAX/AVG

**Missing Capabilities:**
1. Correlation matrix between scenarios
2. Shared control identification
3. Cascading failure analysis
4. Common cause identification
5. Aggregated risk view with correlations
6. "What-if" scenarios (if A fails, what happens to B?)

**Gaps:**
1. No correlation data model
2. No shared dependency tracking
3. No cascade simulation engine
4. No visualization of correlations
5. No portfolio-level risk metrics
6. No diversification benefit calculation

**Effort:** HIGH (6-8 weeks)

**Recommendations:**
- Week 1-2: Add correlation fields to RiskScenario (correlatedScenarios relation)
- Week 3-4: Build shared control analysis ("if Control X fails, scenarios Y and Z fail")
- Week 5-6: Implement correlation matrix visualization
- Week 7-8: Add portfolio VaR-like aggregation

---

### 8.6 Sensitivity Analysis Tools (20% Implemented)

**Current State:**
- Monte Carlo provides percentile distributions (P50, P90, P95, P99)
- ROSI calculation exists for control investments
- No factor-level sensitivity analysis

**Missing Capabilities:**
1. Tornado diagrams (which inputs drive variance)
2. Spider charts for input sensitivity
3. Breakeven analysis (at what TEF does control pay for itself)
4. Confidence interval visualizations
5. Scenario comparison (before/after control)
6. Factor importance ranking

**Gaps:**
1. No tornado diagram calculation
2. No input perturbation engine
3. No visualization components
4. No "what-if" simulation mode
5. No factor contribution analysis
6. No export of sensitivity data

**Effort:** MEDIUM (5-8 weeks)

**Recommendations:**
- Week 1-2: Add tornado diagram calculation (vary each input ±10%, measure output change)
- Week 3-4: Build spider chart for FAIR inputs
- Week 5-6: Add control investment breakeven analysis
- Week 7-8: Implement visualization components

---

### 8.7 Data Freshness Indicators (10% Implemented)

**Current State:**
- `lastCalculatedAt` and `lastSimulationAt` timestamps exist
- CalculationHistory tracks when calculations occurred
- No freshness warnings or stale data indicators

**Missing Capabilities:**
1. Staleness thresholds (warning if >30 days old)
2. Visual indicators (green/yellow/red freshness badges)
3. Triggered recalculation on linked entity changes
4. Source data freshness (when was threat data updated?)
5. Control test freshness (when were controls last tested?)
6. Dashboard showing stale scenarios

**Gaps:**
1. No freshness configuration model
2. No change detection on linked entities
3. No recalculation queue
4. No staleness notifications
5. No bulk freshness reporting
6. No freshness-based filtering

**Effort:** LOW (2-4 weeks)

**Recommendations:**
- Week 1: Add freshness thresholds to system config
- Week 2: Implement staleness badges in UI
- Week 3: Add change listeners for linked entities
- Week 4: Build stale scenario dashboard and notifications

---

### 8.8 FAIR Result Visualization/Export (30% Implemented)

**Current State:**
- Monte Carlo results stored in `simulationResult` JSON field
- API returns aleMean, aleMedian, P90, P95, P99
- No built-in visualizations
- Basic export via CSV (manual)

**Missing Capabilities:**
1. Loss exceedance curves (visual)
2. Histogram of simulation results
3. Comparison charts (before/after controls)
4. PDF/Excel export with charts
5. Executive summary generation
6. Risk treatment ROI visualization

**Stored Data (available for visualization):**
```json
{
  "iterations": 10000,
  "aleSamples": [...],
  "exceedanceCurve": [
    { "threshold": 100000, "probability": 0.95 },
    { "threshold": 500000, "probability": 0.75 },
    { "threshold": 1000000, "probability": 0.50 }
  ],
  "statistics": {
    "mean": 450000,
    "median": 380000,
    "p90": 920000,
    "p95": 1250000,
    "p99": 1890000
  }
}
```

**Gaps:**
1. No chart components for exceedance curves
2. No PDF generation service
3. No Excel export with embedded charts
4. No comparison visualization
5. No executive summary templates
6. No scheduled report generation

**Effort:** MEDIUM (4-6 weeks)

**Recommendations:**
- Week 1-2: Build Chart.js/D3 components for exceedance curves and histograms
- Week 3-4: Add PDF export with embedded visualizations
- Week 5-6: Build executive summary template and comparison views

---

## 9. Implementation Priority Matrix

| Feature | Effort | Risk | Business Value | Priority |
|---------|--------|------|----------------|----------|
| Two Residual Paths | MEDIUM | **HIGH** | HIGH | **P0 - Critical** |
| Data Freshness | LOW | MEDIUM | HIGH | **P1 - High** |
| Factor Suggestions | MEDIUM | LOW | HIGH | **P1 - High** |
| FAIR Visualization | MEDIUM | LOW | HIGH | **P2 - Medium** |
| Sensitivity Analysis | MEDIUM | LOW | MEDIUM | **P2 - Medium** |
| Automatic Entity Linking | HIGH | LOW | MEDIUM | **P3 - Low** |
| Multi-Scenario Correlation | HIGH | MEDIUM | HIGH | **P3 - Low** |
| Threat Intelligence Feeds | HIGH | MEDIUM | MEDIUM | **P4 - Future** |

---

## 10. Recommended Implementation Roadmap

### Phase 1: Fix Critical Issues (Weeks 1-4)
1. Harmonize two residual calculation paths
2. Add data freshness monitoring
3. Enhance factor suggestions with F2/F3

### Phase 2: Core Enhancements (Weeks 5-12)
4. FAIR result visualizations
5. Sensitivity analysis tools
6. Improved automatic entity linking

### Phase 3: Advanced Capabilities (Weeks 13-24)
7. Multi-scenario correlation analysis
8. Real-time threat intelligence integration

---

## 11. Key Files

| Component | File |
|-----------|------|
| Schema | `prisma/schema/controls.prisma` (lines 755-980) |
| Scenario Service | `src/risks/services/risk-scenario.service.ts` |
| Calculation Service | `src/risks/services/risk-calculation.service.ts` |
| Monte Carlo Service | `src/risks/services/monte-carlo.service.ts` |
| Loss Magnitude Service | `src/risks/services/loss-magnitude.service.ts` |
| Tolerance Engine | `src/risks/services/tolerance-engine.service.ts` |
| BIRT Service | `src/risks/services/birt.service.ts` |
| Risk Appetite Service | `src/risks/services/risk-appetite.service.ts` |
| Scoring Utilities | `src/risks/utils/risk-scoring.ts` |
| FAIR Distributions | `src/risks/utils/fair-distributions.ts` |
| Scenario Controller | `src/risks/controllers/risk-scenario.controller.ts` |
| Loss Magnitude Controller | `src/risks/controllers/loss-magnitude.controller.ts` |
