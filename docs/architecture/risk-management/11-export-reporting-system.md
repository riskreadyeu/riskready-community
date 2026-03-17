# Export & Reporting System Architecture

## Overview

The Export & Reporting system provides data extraction capabilities for risk registers, heat maps, treatment summaries, and KRI dashboards. It supports JSON and CSV formats for integration with external reporting tools and regulatory submissions.

---

## 1. Risk Register Export

### Export Options

```typescript
interface RiskExportOptions {
  organisationId?: string;  // Filter by organisation
  format: 'json' | 'csv';   // Output format
  includeScenarios?: boolean;
  includeKRIs?: boolean;
  includeTreatments?: boolean;
  includeControls?: boolean;
}
```

### Risk Register Row Structure

```typescript
interface RiskRegisterRow {
  riskId: string;              // e.g., "R-01"
  title: string;
  description: string;
  tier: string;                // CORE, EXTENDED, ADVANCED
  status: string;              // IDENTIFIED, ASSESSED, etc.
  framework: string;           // ISO, SOC2, NIS2, DORA
  riskOwner: string;           // Owner name/email
  inherentLikelihood: string;  // RARE, UNLIKELY, etc.
  inherentImpact: string;      // NEGLIGIBLE, MINOR, etc.
  inherentScore: number | null;
  residualLikelihood: string;
  residualImpact: string;
  residualScore: number | null;
  toleranceStatus: string;     // WITHIN, EXCEEDS, CRITICAL
  treatmentStatus: string;     // DRAFT, IN_PROGRESS, COMPLETED
  linkedControls: number;      // Count of linked controls
  kriCount: number;            // Count of KRIs
  lastAssessed: string;        // ISO date
  createdAt: string;           // ISO date
}
```

### Export Process

```typescript
async exportRiskRegister(options: RiskExportOptions): Promise<{
  data: RiskRegisterRow[] | string;
  filename: string;
  contentType: string;
}> {
  const risks = await prisma.risk.findMany({
    where: options.organisationId ? { organisationId: options.organisationId } : undefined,
    orderBy: { riskId: 'asc' },
  });

  const rows: RiskRegisterRow[] = [];

  for (const risk of risks) {
    // Get primary scenario for assessment data
    const scenarios = await prisma.riskScenario.findMany({
      where: { riskId: risk.id },
      take: 1,
    });
    const primaryScenario = scenarios[0];

    // Get treatment status
    const treatmentPlans = await prisma.treatmentPlan.findMany({
      where: { riskId: risk.id },
      select: { status: true },
    });
    const activeTreatment = treatmentPlans.find(t =>
      ['DRAFT', 'PROPOSED', 'APPROVED', 'IN_PROGRESS'].includes(t.status)
    );

    // Get counts
    const controlCount = await prisma.control.count({
      where: { risks: { some: { id: risk.id } } },
    });
    const kriCount = await prisma.keyRiskIndicator.count({
      where: { riskId: risk.id },
    });

    // Get risk owner name
    let riskOwnerName = '';
    if (risk.riskOwner) {
      const owner = await prisma.user.findUnique({
        where: { id: risk.riskOwner },
        select: { firstName: true, lastName: true, email: true },
      });
      riskOwnerName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email;
    }

    rows.push({
      riskId: risk.riskId,
      title: risk.title,
      description: risk.description || '',
      tier: risk.tier,
      status: risk.status,
      framework: risk.framework,
      riskOwner: riskOwnerName,
      inherentLikelihood: primaryScenario?.likelihood || '',
      inherentImpact: primaryScenario?.impact || '',
      inherentScore: primaryScenario?.inherentScore ?? risk.inherentScore,
      residualLikelihood: primaryScenario?.residualLikelihood || '',
      residualImpact: primaryScenario?.residualImpact || '',
      residualScore: primaryScenario?.residualScore ?? risk.residualScore,
      toleranceStatus: primaryScenario?.toleranceStatus || '',
      treatmentStatus: activeTreatment?.status || 'NONE',
      linkedControls: controlCount,
      kriCount: kriCount,
      lastAssessed: risk.updatedAt.toISOString().split('T')[0],
      createdAt: risk.createdAt.toISOString().split('T')[0],
    });
  }

  if (options.format === 'csv') {
    const csv = convertToCSV(rows);
    return {
      data: csv,
      filename: `risk-register-${new Date().toISOString().split('T')[0]}.csv`,
      contentType: 'text/csv',
    };
  }

  return {
    data: rows,
    filename: `risk-register-${new Date().toISOString().split('T')[0]}.json`,
    contentType: 'application/json',
  };
}
```

---

## 2. Heat Map Export

### Heat Map Data Structure

```typescript
interface HeatMapData {
  matrix: number[][];  // 5x5 grid: [likelihood][impact] = count
  risks: {
    riskId: string;
    title: string;
    likelihood: number;  // 1-5
    impact: number;      // 1-5
    score: number;
  }[];
}
```

### Likelihood/Impact Mapping

```typescript
const likelihoodMap: Record<string, number> = {
  RARE: 0,
  UNLIKELY: 1,
  POSSIBLE: 2,
  LIKELY: 3,
  ALMOST_CERTAIN: 4,
};

const impactMap: Record<string, number> = {
  NEGLIGIBLE: 0,
  MINOR: 1,
  MODERATE: 2,
  MAJOR: 3,
  SEVERE: 4,
};
```

### Export Heat Map

```typescript
async exportHeatMapData(organisationId?: string): Promise<HeatMapData> {
  const scenarios = await prisma.riskScenario.findMany({
    where: organisationId ? { risk: { organisationId } } : undefined,
    include: {
      risk: { select: { riskId: true, title: true } },
    },
  });

  // Initialize 5x5 matrix
  const matrix: number[][] = Array(5).fill(null).map(() => Array(5).fill(0));
  const risks: HeatMapData['risks'] = [];

  for (const scenario of scenarios) {
    const likelihoodIdx = likelihoodMap[scenario.likelihood || ''] ?? -1;
    const impactIdx = impactMap[scenario.impact || ''] ?? -1;

    if (likelihoodIdx >= 0 && impactIdx >= 0) {
      matrix[likelihoodIdx][impactIdx]++;
      risks.push({
        riskId: scenario.risk.riskId,
        title: scenario.risk.title,
        likelihood: likelihoodIdx + 1,
        impact: impactIdx + 1,
        score: scenario.residualScore || scenario.inherentScore || 0,
      });
    }
  }

  return { matrix, risks };
}
```

### Heat Map Visualization

```
           IMPACT
        1   2   3   4   5
      ┌───┬───┬───┬───┬───┐
    5 │ M │ H │ H │ C │ C │  ALMOST_CERTAIN
      ├───┼───┼───┼───┼───┤
L   4 │ M │ M │ H │ H │ C │  LIKELY
I     ├───┼───┼───┼───┼───┤
K   3 │ L │ M │ M │ H │ H │  POSSIBLE
E     ├───┼───┼───┼───┼───┤
L   2 │ L │ L │ M │ M │ H │  UNLIKELY
I     ├───┼───┼───┼───┼───┤
H   1 │ L │ L │ L │ M │ M │  RARE
O     └───┴───┴───┴───┴───┘
O       NEG MIN MOD MAJ SEV
D

L = LOW (1-7)   M = MEDIUM (8-14)   H = HIGH (15-19)   C = CRITICAL (20-25)
```

---

## 3. Treatment Summary Export

### Summary Structure

```typescript
interface TreatmentSummary {
  data: TreatmentRow[];
  summary: {
    total: number;
    byStatus: Record<string, number>;
    overdue: number;
    completedThisMonth: number;
  };
}

interface TreatmentRow {
  treatmentId: string;
  title: string;
  riskId: string;
  riskTitle: string;
  type: string;        // MITIGATE, TRANSFER, ACCEPT, AVOID
  status: string;
  priority: string;
  progress: number;    // 0-100
  actionsTotal: number;
  actionsCompleted: number;
  targetEndDate: string;
  riskOwner: string;
  implementer: string;
}
```

### Export Treatment Summary

```typescript
async exportTreatmentSummary(organisationId?: string): Promise<TreatmentSummary> {
  const plans = await prisma.treatmentPlan.findMany({
    where: organisationId ? { organisationId } : undefined,
    include: {
      risk: { select: { riskId: true, title: true } },
      riskOwner: { select: { firstName: true, lastName: true, email: true } },
      implementer: { select: { firstName: true, lastName: true, email: true } },
      actions: { select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const byStatus: Record<string, number> = {};
  let overdue = 0;
  let completedThisMonth = 0;

  const data = plans.map(plan => {
    byStatus[plan.status] = (byStatus[plan.status] || 0) + 1;

    // Check if overdue
    if (plan.targetEndDate && plan.targetEndDate < now &&
        ['APPROVED', 'IN_PROGRESS'].includes(plan.status)) {
      overdue++;
    }

    // Check if completed this month
    if (plan.status === 'COMPLETED' && plan.actualEndDate && plan.actualEndDate >= startOfMonth) {
      completedThisMonth++;
    }

    const completedActions = plan.actions.filter(a => a.status === 'COMPLETED').length;

    return {
      treatmentId: plan.treatmentId,
      title: plan.title,
      riskId: plan.risk.riskId,
      riskTitle: plan.risk.title,
      type: plan.treatmentType,
      status: plan.status,
      priority: plan.priority,
      progress: plan.progressPercentage || 0,
      actionsTotal: plan.actions.length,
      actionsCompleted: completedActions,
      targetEndDate: plan.targetEndDate?.toISOString().split('T')[0] || '',
      riskOwner: formatUserName(plan.riskOwner),
      implementer: formatUserName(plan.implementer),
    };
  });

  return {
    data,
    summary: {
      total: plans.length,
      byStatus,
      overdue,
      completedThisMonth,
    },
  };
}
```

---

## 4. KRI Dashboard Export

### KRI Dashboard Structure

```typescript
interface KRIDashboardExport {
  kris: KRIRow[];
  summary: {
    total: number;
    byStatus: Record<string, number>;
    breached: number;     // RED
    approaching: number;  // AMBER
  };
}

interface KRIRow {
  kriId: string;
  name: string;
  riskId: string;
  riskTitle: string;
  currentValue: string;
  status: string;
  trend: string;
  thresholdGreen: string;
  thresholdAmber: string;
  thresholdRed: string;
  lastMeasured: string;
  frequency: string;
  recentValues: { value: string; status: string; date: string }[];
}
```

### Export KRI Dashboard

```typescript
async exportKRIDashboard(organisationId?: string): Promise<KRIDashboardExport> {
  const kris = await prisma.keyRiskIndicator.findMany({
    where: organisationId ? { risk: { organisationId } } : undefined,
    include: {
      risk: { select: { riskId: true, title: true } },
      history: {
        take: 5,
        orderBy: { measuredAt: 'desc' },
      },
    },
    orderBy: { kriId: 'asc' },
  });

  const byStatus: Record<string, number> = {};
  let breached = 0;
  let approaching = 0;

  const data = kris.map(kri => {
    const status = kri.status || 'NOT_MEASURED';
    byStatus[status] = (byStatus[status] || 0) + 1;

    if (status === 'RED') breached++;
    if (status === 'AMBER') approaching++;

    return {
      kriId: kri.kriId,
      name: kri.name,
      riskId: kri.risk.riskId,
      riskTitle: kri.risk.title,
      currentValue: kri.currentValue,
      status: kri.status,
      trend: kri.trend,
      thresholdGreen: kri.thresholdGreen,
      thresholdAmber: kri.thresholdAmber,
      thresholdRed: kri.thresholdRed,
      lastMeasured: kri.lastMeasured?.toISOString().split('T')[0] || '',
      frequency: kri.frequency,
      recentValues: kri.history.map(h => ({
        value: h.value,
        status: h.status,
        date: h.measuredAt.toISOString().split('T')[0],
      })),
    };
  });

  return {
    kris: data,
    summary: {
      total: kris.length,
      byStatus,
      breached,
      approaching,
    },
  };
}
```

---

## 5. CSV Conversion

### CSV Generator

```typescript
private convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';

      const stringValue = String(value);

      // Escape quotes and wrap if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}
```

---

## 6. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/export/risk-register` | Export risk register (JSON/CSV) |
| GET | `/export/heat-map` | Export heat map data |
| GET | `/export/treatments` | Export treatment summary |
| GET | `/export/kris` | Export KRI dashboard |

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `organisationId` | string | Filter by organisation |
| `format` | 'json' \| 'csv' | Output format |
| `includeScenarios` | boolean | Include scenario details |
| `includeKRIs` | boolean | Include KRI data |
| `includeTreatments` | boolean | Include treatment data |
| `includeControls` | boolean | Include control data |

---

## 7. Export Response Headers

```typescript
// JSON response
Content-Type: application/json
Content-Disposition: attachment; filename="risk-register-2025-01-25.json"

// CSV response
Content-Type: text/csv
Content-Disposition: attachment; filename="risk-register-2025-01-25.csv"
```

---

## 8. Implementation Status

### Fully Implemented ✅
- Risk register export (JSON/CSV)
- Heat map data export
- Treatment summary export
- KRI dashboard export
- CSV conversion with proper escaping
- Organisation filtering

### Not Implemented ❌
- Excel (.xlsx) export with formatting
- PDF report generation
- Scheduled report generation
- Email report delivery
- Custom report templates
- Chart embedding in exports
- Compliance-specific report formats (ISO, SOC2)
- Historical trend reports
- Executive summary generation

---

## 9. Key Files

| Component | File |
|-----------|------|
| Export Service | `src/risks/services/risk-export.service.ts` |
| Controller | `src/risks/controllers/export.controller.ts` |
