# Risk Aggregation System Architecture

## Overview

The Risk Aggregation system calculates portfolio-level risk metrics by aggregating scenario scores to parent risks and organisation-level dashboards. It provides hierarchical rollup, status derivation, and summary statistics for executive reporting.

---

## 1. Aggregation Hierarchy

```
Organisation
  │
  ├── Risk Portfolio
  │     ├── Risk 1
  │     │     ├── Scenario 1.1 (residualScore: 12)
  │     │     ├── Scenario 1.2 (residualScore: 8)
  │     │     └── Scenario 1.3 (residualScore: 15)
  │     │           ↓
  │     │     Risk.maxScenarioScore = 15
  │     │     Risk.avgScenarioScore = 11.67
  │     │
  │     ├── Risk 2
  │     │     ├── Scenario 2.1 (residualScore: 6)
  │     │     └── Scenario 2.2 (residualScore: 10)
  │     │           ↓
  │     │     Risk.maxScenarioScore = 10
  │     │     Risk.avgScenarioScore = 8
  │     │
  │     └── Risk N...
  │
  └── Organisation Dashboard
        ├── Total Risks: N
        ├── Critical Risks: X (score > 20)
        ├── High Risks: Y (score 15-20)
        ├── Avg Portfolio Score: Z
        └── Tolerance Breaches: W
```

---

## 2. Risk Model Aggregated Fields

### Fields Derived from Scenarios

| Field | Calculation | Purpose |
|-------|-------------|---------|
| `maxScenarioScore` | MAX(scenarios.residualScore) | Worst-case exposure |
| `avgScenarioScore` | AVG(scenarios.residualScore) | Average risk level |
| `scenarioCount` | COUNT(scenarios) | Total scenarios |
| `scenariosExceedingTolerance` | COUNT(WHERE toleranceStatus ≠ WITHIN) | Tolerance breaches |
| `derivedStatus` | Worst scenario status | Overall risk status |

### Derivation Logic

```typescript
async aggregateRiskFromScenarios(riskId: string): Promise<void> {
  const scenarios = await prisma.riskScenario.findMany({
    where: {
      riskId,
      status: { notIn: ['CLOSED', 'ARCHIVED'] }, // Active scenarios only
    },
    select: {
      residualScore: true,
      inherentScore: true,
      toleranceStatus: true,
      status: true,
    },
  });

  if (scenarios.length === 0) {
    await prisma.risk.update({
      where: { id: riskId },
      data: {
        maxScenarioScore: null,
        avgScenarioScore: null,
        scenarioCount: 0,
        scenariosExceedingTolerance: 0,
      },
    });
    return;
  }

  // Calculate aggregations
  const scores = scenarios.map(s => s.residualScore ?? s.inherentScore ?? 0);
  const maxScore = Math.max(...scores);
  const avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
  const exceedingCount = scenarios.filter(s =>
    s.toleranceStatus === 'EXCEEDS' || s.toleranceStatus === 'CRITICAL'
  ).length;

  // Derive worst status
  const statusPriority: Record<string, number> = {
    ESCALATED: 10,
    TREATING: 9,
    EVALUATED: 8,
    ASSESSED: 7,
    REVIEW: 6,
    TREATED: 5,
    ACCEPTED: 4,
    MONITORING: 3,
    DRAFT: 2,
    CLOSED: 1,
    ARCHIVED: 0,
  };
  const worstStatus = scenarios.reduce((worst, s) =>
    (statusPriority[s.status] > statusPriority[worst]) ? s.status : worst,
    'ARCHIVED'
  );

  await prisma.risk.update({
    where: { id: riskId },
    data: {
      maxScenarioScore: maxScore,
      avgScenarioScore: avgScore,
      scenarioCount: scenarios.length,
      scenariosExceedingTolerance: exceedingCount,
      derivedStatus: worstStatus,
    },
  });
}
```

---

## 3. Organisation Dashboard Aggregation

### Dashboard Statistics

```typescript
interface OrganisationRiskDashboard {
  // Counts
  totalRisks: number;
  totalScenarios: number;
  activeScenarios: number;

  // By Risk Level
  criticalRisks: number;  // score > 20
  highRisks: number;      // score 15-20
  mediumRisks: number;    // score 8-14
  lowRisks: number;       // score 1-7

  // By Status
  byStatus: Record<string, number>;

  // By Tier
  byTier: Record<string, number>;

  // By Framework
  byFramework: Record<string, number>;

  // Tolerance
  toleranceBreaches: number;
  criticalBreaches: number;

  // Portfolio Metrics
  avgPortfolioScore: number;
  maxPortfolioScore: number;

  // Trends
  risksAddedThisMonth: number;
  risksClosedThisMonth: number;
  scoreChangeThisMonth: number;
}
```

### Dashboard Calculation

```typescript
async getOrganisationDashboard(organisationId: string): Promise<OrganisationRiskDashboard> {
  const risks = await prisma.risk.findMany({
    where: { organisationId },
    include: {
      scenarios: {
        where: { status: { notIn: ['CLOSED', 'ARCHIVED'] } },
        select: {
          residualScore: true,
          toleranceStatus: true,
          status: true,
        },
      },
    },
  });

  // Initialize counters
  let criticalRisks = 0, highRisks = 0, mediumRisks = 0, lowRisks = 0;
  let toleranceBreaches = 0, criticalBreaches = 0;
  let totalScore = 0;
  let maxScore = 0;
  const byStatus: Record<string, number> = {};
  const byTier: Record<string, number> = {};
  const byFramework: Record<string, number> = {};

  for (const risk of risks) {
    const riskScore = risk.maxScenarioScore ?? risk.residualScore ?? 0;

    // Risk level classification
    if (riskScore > 20) criticalRisks++;
    else if (riskScore >= 15) highRisks++;
    else if (riskScore >= 8) mediumRisks++;
    else lowRisks++;

    // Tolerance tracking
    for (const scenario of risk.scenarios) {
      if (scenario.toleranceStatus === 'EXCEEDS') toleranceBreaches++;
      if (scenario.toleranceStatus === 'CRITICAL') {
        toleranceBreaches++;
        criticalBreaches++;
      }
    }

    // By status
    byStatus[risk.status] = (byStatus[risk.status] || 0) + 1;

    // By tier
    byTier[risk.tier] = (byTier[risk.tier] || 0) + 1;

    // By framework
    byFramework[risk.framework] = (byFramework[risk.framework] || 0) + 1;

    // Portfolio metrics
    totalScore += riskScore;
    maxScore = Math.max(maxScore, riskScore);
  }

  const totalScenarios = risks.reduce((sum, r) => sum + r.scenarios.length, 0);

  return {
    totalRisks: risks.length,
    totalScenarios,
    activeScenarios: totalScenarios,
    criticalRisks,
    highRisks,
    mediumRisks,
    lowRisks,
    byStatus,
    byTier,
    byFramework,
    toleranceBreaches,
    criticalBreaches,
    avgPortfolioScore: risks.length > 0 ? Math.round((totalScore / risks.length) * 100) / 100 : 0,
    maxPortfolioScore: maxScore,
    risksAddedThisMonth: /* query count */,
    risksClosedThisMonth: /* query count */,
    scoreChangeThisMonth: /* calculate delta */,
  };
}
```

---

## 4. Tier-Based Aggregation

### Risk Tiers

| Tier | Description | Typical Count |
|------|-------------|---------------|
| `CORE` | Critical business risks | ~15-20 |
| `EXTENDED` | Important operational risks | ~20-30 |
| `ADVANCED` | Additional/emerging risks | ~10-20 |

### Tier Summary

```typescript
interface TierSummary {
  tier: RiskTier;
  riskCount: number;
  scenarioCount: number;
  avgScore: number;
  maxScore: number;
  criticalCount: number;
  toleranceBreaches: number;
}

async getTierSummary(organisationId: string): Promise<TierSummary[]> {
  const tiers = ['CORE', 'EXTENDED', 'ADVANCED'];

  return Promise.all(tiers.map(async tier => {
    const risks = await prisma.risk.findMany({
      where: { organisationId, tier },
      include: { scenarios: { where: { status: { notIn: ['CLOSED', 'ARCHIVED'] } } } },
    });

    const scores = risks.flatMap(r => r.scenarios.map(s => s.residualScore ?? 0));

    return {
      tier,
      riskCount: risks.length,
      scenarioCount: scores.length,
      avgScore: scores.length > 0 ? Math.round(avg(scores) * 100) / 100 : 0,
      maxScore: scores.length > 0 ? Math.max(...scores) : 0,
      criticalCount: scores.filter(s => s > 20).length,
      toleranceBreaches: risks.flatMap(r => r.scenarios)
        .filter(s => s.toleranceStatus !== 'WITHIN').length,
    };
  }));
}
```

---

## 5. Framework-Based Aggregation

### Compliance Frameworks

| Framework | Description |
|-----------|-------------|
| `ISO` | ISO 27001 Information Security |
| `SOC2` | SOC 2 Trust Principles |
| `NIS2` | EU Network and Information Security |
| `DORA` | Digital Operational Resilience Act |

### Framework Summary

```typescript
interface FrameworkSummary {
  framework: ControlFramework;
  riskCount: number;
  avgScore: number;
  complianceScore: number;  // % of risks within tolerance
  criticalGaps: number;     // Risks exceeding tolerance significantly
}

async getFrameworkSummary(organisationId: string): Promise<FrameworkSummary[]> {
  const frameworks = ['ISO', 'SOC2', 'NIS2', 'DORA'];

  return Promise.all(frameworks.map(async framework => {
    const risks = await prisma.risk.findMany({
      where: { organisationId, framework },
      include: { scenarios: true },
    });

    const scores = risks.map(r => r.maxScenarioScore ?? 0);
    const withinTolerance = risks.filter(r =>
      !r.scenarios.some(s => s.toleranceStatus !== 'WITHIN')
    ).length;

    return {
      framework,
      riskCount: risks.length,
      avgScore: scores.length > 0 ? avg(scores) : 0,
      complianceScore: risks.length > 0 ? Math.round((withinTolerance / risks.length) * 100) : 100,
      criticalGaps: risks.filter(r => r.maxScenarioScore && r.maxScenarioScore > 20).length,
    };
  }));
}
```

---

## 6. Trend Analysis

### Historical Comparison

```typescript
interface TrendData {
  period: string;         // "2025-01", "2025-Q1"
  totalRisks: number;
  avgScore: number;
  criticalCount: number;
  toleranceBreaches: number;
}

async getRiskTrends(organisationId: string, periods: number = 12): Promise<TrendData[]> {
  // Uses AssessmentSnapshot to get historical data
  const trends: TrendData[] = [];

  for (let i = 0; i < periods; i++) {
    const periodStart = getMonthStart(i);
    const periodEnd = getMonthEnd(i);

    // Get snapshots from that period
    const snapshots = await prisma.assessmentSnapshot.findMany({
      where: {
        risk: { organisationId },
        snapshotDate: { gte: periodStart, lte: periodEnd },
      },
    });

    // Aggregate from snapshots
    // ...
  }

  return trends;
}
```

---

## 7. Top Risks Query

### Highest Risk Scenarios

```typescript
async getTopRisks(organisationId: string, limit: number = 10): Promise<{
  riskId: string;
  riskTitle: string;
  scenarioTitle: string;
  residualScore: number;
  toleranceStatus: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
}[]> {
  const scenarios = await prisma.riskScenario.findMany({
    where: {
      risk: { organisationId },
      status: { notIn: ['CLOSED', 'ARCHIVED'] },
      residualScore: { not: null },
    },
    orderBy: { residualScore: 'desc' },
    take: limit,
    include: {
      risk: { select: { riskId: true, title: true } },
    },
  });

  return scenarios.map(s => ({
    riskId: s.risk.riskId,
    riskTitle: s.risk.title,
    scenarioTitle: s.title,
    residualScore: s.residualScore!,
    toleranceStatus: s.toleranceStatus,
    trend: calculateTrend(s), // Compare to previous calculation
  }));
}
```

---

## 8. Aggregation Triggers

### When to Recalculate

| Trigger | Action |
|---------|--------|
| Scenario created | Aggregate parent risk |
| Scenario score calculated | Aggregate parent risk |
| Scenario status changed | Aggregate parent risk |
| Scenario deleted | Aggregate parent risk |
| Treatment completed | Aggregate parent risk |
| KRI threshold breached | Flag risk for review |

### Event-Driven Aggregation

```typescript
@OnEvent('risk.scenario.calculated')
async handleScenarioCalculated(event: RiskEvent): Promise<void> {
  await this.aggregateRiskFromScenarios(event.riskId);
  await this.updateOrganisationMetrics(event.organisationId);
}

@OnEvent('risk.scenario.updated')
async handleScenarioUpdated(event: RiskEvent): Promise<void> {
  if (event.data.changes?.includes('status') || event.data.changes?.includes('toleranceStatus')) {
    await this.aggregateRiskFromScenarios(event.riskId);
  }
}
```

---

## 9. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/risks/dashboard` | Organisation risk dashboard |
| GET | `/risks/summary/tiers` | Tier-based summary |
| GET | `/risks/summary/frameworks` | Framework-based summary |
| GET | `/risks/top` | Top N highest risks |
| GET | `/risks/trends` | Historical trend data |
| GET | `/risks/:id/aggregate` | Recalculate risk aggregations |

---

## 10. Implementation Status

### Fully Implemented ✅
- Risk-level aggregation from scenarios
- MAX/AVG score calculations
- Tolerance breach counting
- Derived status from scenarios
- Organisation dashboard statistics
- Tier-based grouping
- Framework-based grouping
- Top risks query

### Not Implemented ❌
- Historical trend analysis (needs snapshot data)
- Portfolio VaR calculation
- Correlation-adjusted aggregation
- Weighted portfolio scoring
- Benchmark comparison
- Industry comparison
- Predictive risk forecasting

---

## 11. Key Files

| Component | File |
|-----------|------|
| Aggregation Service | `src/risks/services/risk-aggregation.service.ts` |
| Risk Service | `src/risks/services/risk.service.ts` (aggregation methods) |
| Dashboard Controller | `src/risks/controllers/dashboard.controller.ts` |
| Schema | `prisma/schema/controls.prisma` (Risk aggregated fields) |
