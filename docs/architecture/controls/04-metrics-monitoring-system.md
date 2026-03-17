# Metrics & Monitoring System

This document describes the capability metrics system that provides continuous monitoring of control effectiveness through measurable indicators.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Model](#2-data-model)
3. [RAG Status System](#3-rag-status-system)
4. [Threshold Configuration](#4-threshold-configuration)
5. [Trend Analysis](#5-trend-analysis)
6. [Collection Frequencies](#6-collection-frequencies)
7. [Service API](#7-service-api)
8. [Dashboard Integration](#8-dashboard-integration)

---

## 1. Overview

The Metrics & Monitoring System provides continuous visibility into control effectiveness through measurable Key Control Indicators (KCIs). Each capability can have one or more metrics that track specific aspects of control performance.

### Key Features

- Configurable metrics per capability
- RAG (Red/Amber/Green) status indication
- Automatic trend detection
- Collection frequency scheduling
- Historical value tracking
- Dashboard aggregations

---

## 2. Data Model

### CapabilityMetric Entity

```prisma
model CapabilityMetric {
  id                  String              @id @default(cuid())
  metricId            String              // "CM-5.1-C01"
  name                String
  formula             String              @db.Text
  unit                String              // "%", "Count", "Days"
  greenThreshold      String
  amberThreshold      String
  redThreshold        String
  collectionFrequency CollectionFrequency
  dataSource          String

  // Current state
  currentValue   String?
  status         RAGStatus?
  trend          TrendDirection?
  lastCollection DateTime?
  owner          String?
  notes          String?         @db.Text

  // Relationships
  capabilityId String
  capability   Capability
  history      MetricHistory[]
}
```

### MetricHistory Entity

```prisma
model MetricHistory {
  id          String    @id @default(cuid())
  value       String
  status      RAGStatus
  collectedAt DateTime
  collectedBy String?
  notes       String?   @db.Text

  metricId String
  metric   CapabilityMetric
}
```

### Database Indexes

```prisma
// CapabilityMetric
@@unique([metricId, capabilityId])
@@index([status])
@@index([collectionFrequency])
@@index([capabilityId])

// MetricHistory
@@index([metricId])
@@index([collectedAt])
```

---

## 3. RAG Status System

### RAGStatus Enum

```typescript
enum RAGStatus {
  GREEN        // Within acceptable limits
  AMBER        // Warning - attention needed
  RED          // Critical - action required
  NOT_MEASURED // No current measurement
}
```

### Visual Representation

```
┌─────────────────────────────────────────────────────────────┐
│                      RAG STATUS                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ●  GREEN        ── Target met, control effective            │
│                                                              │
│  ●  AMBER        ── Warning zone, monitor closely            │
│                                                              │
│  ●  RED          ── Below threshold, action required         │
│                                                              │
│  ○  NOT_MEASURED ── No data collected yet                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Threshold Configuration

### Threshold Syntax

Thresholds support comparison operators:

| Operator | Example | Meaning |
|----------|---------|---------|
| `>=` | `>=90` | Greater than or equal to 90 |
| `>` | `>90` | Greater than 90 |
| `<=` | `<=10` | Less than or equal to 10 |
| `<` | `<10` | Less than 10 |
| `=` | `=100` | Equal to 100 |

### Default Thresholds

```typescript
CONTROLS_CONFIG.metrics.defaultThresholds = {
  green: '>=90',  // GREEN if value >= 90
  amber: '>=70',  // AMBER if value >= 70 (but < green)
  red: '<70',     // RED if value < 70
}
```

### Threshold Parsing

```typescript
function parseThreshold(threshold: string) {
  const match = threshold.match(/^(>=|<=|>|<|=)?(\d+\.?\d*)$/);
  if (!match) return null;

  return {
    operator: match[1] || '=',
    threshold: parseFloat(match[2]),
  };
}
```

### Status Calculation

```typescript
function calculateStatus(value, greenThreshold, amberThreshold, redThreshold) {
  const numValue = parseNumericValue(value);
  if (isNaN(numValue)) return 'NOT_MEASURED';

  const greenParsed = parseThreshold(greenThreshold);
  const redParsed = parseThreshold(redThreshold);

  if (!greenParsed || !redParsed) return 'NOT_MEASURED';

  // Check in order: green first, then red, else amber
  if (compareWithThreshold(numValue, greenParsed)) return 'GREEN';
  if (compareWithThreshold(numValue, redParsed)) return 'RED';
  return 'AMBER';
}
```

### Example Metric Configuration

```typescript
{
  metricId: "CM-5.1-C01",
  name: "Policy Review Compliance",
  formula: "(Policies reviewed on time / Total policies) × 100",
  unit: "%",
  greenThreshold: ">=95",
  amberThreshold: ">=80",
  redThreshold: "<80",
  collectionFrequency: "MONTHLY",
  dataSource: "Policy Management System"
}
```

---

## 5. Trend Analysis

### TrendDirection Enum

```typescript
enum TrendDirection {
  IMPROVING  // Value getting better
  STABLE     // Value within threshold of previous
  DECLINING  // Value getting worse
  NEW        // No previous value to compare
}
```

### Trend Calculation

```typescript
function calculateTrend(newValue, previousValue): TrendDirection {
  if (!previousValue) return 'NEW';

  const newNum = parseNumericValue(newValue);
  const prevNum = parseNumericValue(previousValue);

  if (isNaN(newNum) || isNaN(prevNum)) return 'STABLE';

  const diff = newNum - prevNum;
  const threshold = Math.abs(prevNum) * TREND_THRESHOLD; // 5%

  if (diff > threshold) return 'IMPROVING';
  if (diff < -threshold) return 'DECLINING';
  return 'STABLE';
}
```

### Configuration

```typescript
CONTROLS_CONFIG.metrics.trendThreshold = 0.05; // 5%
```

### Trend Logic

```
Current - Previous > 5% of Previous → IMPROVING
Current - Previous < -5% of Previous → DECLINING
Otherwise → STABLE
```

---

## 6. Collection Frequencies

### CollectionFrequency Enum

```typescript
enum CollectionFrequency {
  DAILY       // Every day
  WEEKLY      // Once per week
  MONTHLY     // Once per month
  QUARTERLY   // Every 3 months
  ANNUAL      // Once per year
  PER_EVENT   // After specific events
  PER_INCIDENT // After incidents
}
```

### Frequency Intervals (Days)

```typescript
CONTROLS_CONFIG.metrics.frequencies = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
  QUARTERLY: 90,
  ANNUAL: 365,
}
```

### Due Metrics Detection

```typescript
async getMetricsDueForCollection(organisationId: string) {
  const now = new Date();
  const metrics = await findAllMetrics(organisationId);

  return metrics.filter(metric => {
    if (!metric.lastCollection) return true;

    const lastCollection = new Date(metric.lastCollection);
    const daysSince = Math.floor(
      (now.getTime() - lastCollection.getTime()) / (1000 * 60 * 60 * 24)
    );

    const interval = CONTROLS_CONFIG.metrics.frequencies[metric.collectionFrequency];
    return daysSince >= interval;
  });
}
```

---

## 7. Service API

### MetricService Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `findAll` | `skip?, take?, where?, orderBy?` | `{ results, count }` | List metrics |
| `findOne` | `id: string` | `Metric \| null` | Get metric with history |
| `findByCapabilityId` | `capabilityId` | `Metric[]` | Get capability's metrics |
| `updateValue` | `id, value, userId?, notes?` | `Metric` | Record new value |
| `getDashboard` | `organisationId` | `Dashboard` | Get dashboard data |
| `getMetricsDueForCollection` | `organisationId` | `Metric[]` | Get overdue metrics |

### Update Value Flow

```typescript
async updateValue(id: string, value: string, userId?: string, notes?: string) {
  const metric = await findOne(id);
  if (!metric) throw new NotFoundException();

  // Calculate new status based on thresholds
  const status = calculateStatus(
    value,
    metric.greenThreshold,
    metric.amberThreshold,
    metric.redThreshold
  );

  // Calculate trend based on previous value
  const trend = calculateTrend(value, metric.currentValue);

  // Update metric and create history in transaction
  const [updatedMetric] = await prisma.$transaction([
    // Update current value
    prisma.capabilityMetric.update({
      where: { id },
      data: {
        currentValue: value,
        status,
        trend,
        lastCollection: new Date(),
        updatedById: userId,
      },
    }),
    // Create history record
    prisma.metricHistory.create({
      data: {
        metricId: id,
        value,
        status,
        collectedAt: new Date(),
        collectedBy: userId,
        notes,
      },
    }),
  ]);

  return updatedMetric;
}
```

---

## 8. Dashboard Integration

### Dashboard Response

```typescript
interface MetricDashboard {
  total: number;
  statusCounts: {
    GREEN: number;
    AMBER: number;
    RED: number;
    NOT_MEASURED: number;
  };
  byFrequency: Record<CollectionFrequency, number>;
  byType: Record<CapabilityType, {
    total: number;
    green: number;
    amber: number;
    red: number;
  }>;
}
```

### Dashboard Calculation

```typescript
async getDashboard(organisationId: string) {
  const metrics = await findAllByOrg(organisationId);

  const statusCounts = {
    GREEN: 0,
    AMBER: 0,
    RED: 0,
    NOT_MEASURED: 0,
  };

  const byFrequency = {};
  const byType = {};

  for (const metric of metrics) {
    // Count by status
    const status = metric.status || 'NOT_MEASURED';
    statusCounts[status]++;

    // Count by frequency
    const freq = metric.collectionFrequency;
    byFrequency[freq] = (byFrequency[freq] || 0) + 1;

    // Count by capability type
    const type = metric.capability.type;
    if (!byType[type]) {
      byType[type] = { total: 0, green: 0, amber: 0, red: 0 };
    }
    byType[type].total++;
    if (status === 'GREEN') byType[type].green++;
    else if (status === 'AMBER') byType[type].amber++;
    else if (status === 'RED') byType[type].red++;
  }

  return { total: metrics.length, statusCounts, byFrequency, byType };
}
```

### Dashboard Visualizations

```
┌──────────────────────────────────────────────────────────────┐
│                    METRICS DASHBOARD                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Overall Status          │  By Collection Frequency          │
│  ┌─────────────────┐     │  ┌─────────────────────────────┐  │
│  │  ● 45 GREEN     │     │  │  Daily:     12 metrics      │  │
│  │  ● 23 AMBER     │     │  │  Weekly:    28 metrics      │  │
│  │  ●  8 RED       │     │  │  Monthly:   45 metrics      │  │
│  │  ○ 12 N/A       │     │  │  Quarterly: 15 metrics      │  │
│  └─────────────────┘     │  └─────────────────────────────┘  │
│                          │                                    │
│  By Capability Type      │  Due for Collection               │
│  ┌─────────────────┐     │  ┌─────────────────────────────┐  │
│  │  PROCESS:   40% │     │  │  8 metrics overdue          │  │
│  │  TECHNOLOGY: 35% │    │  │  5 metrics due today        │  │
│  │  PEOPLE:    15% │     │  │  12 metrics due this week   │  │
│  │  PHYSICAL:  10% │     │  └─────────────────────────────┘  │
│  └─────────────────┘     │                                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Metric History Configuration

```typescript
CONTROLS_CONFIG.pagination = {
  metricHistory: 30,      // Full history: 30 records
  metricHistoryShort: 5,  // Quick view: 5 records
  latestRecord: 1,        // Most recent only
}
```

---

## Example Metrics by Control Type

### Policy-Related Metrics

| Metric | Formula | Thresholds |
|--------|---------|------------|
| Policy Review Rate | Reviewed on time / Total | Green: ≥95%, Red: <80% |
| Policy Acknowledgment | Acknowledged / Total employees | Green: ≥100%, Red: <90% |

### Technical Control Metrics

| Metric | Formula | Thresholds |
|--------|---------|------------|
| Firewall Rule Compliance | Compliant rules / Total rules | Green: ≥99%, Red: <95% |
| Patch Coverage | Patched systems / Total systems | Green: ≥95%, Red: <85% |
| MFA Adoption | Users with MFA / Total users | Green: ≥100%, Red: <90% |

### Operational Metrics

| Metric | Formula | Thresholds |
|--------|---------|------------|
| Mean Time to Detect | Average detection time | Green: <1hr, Red: >4hr |
| Access Review Completion | Reviews completed / Required | Green: ≥100%, Red: <85% |

---

## Key Files

| File | Description |
|------|-------------|
| `prisma/schema/controls.prisma` | CapabilityMetric, MetricHistory models |
| `src/controls/services/metric.service.ts` | Metric management service |
| `src/config/controls.config.ts` | Threshold and frequency configuration |

---

## Related Documentation

- [02-capability-maturity-system.md](02-capability-maturity-system.md) - Parent capability system
- [03-effectiveness-testing-system.md](03-effectiveness-testing-system.md) - Effectiveness testing
- [07-reporting-gap-analysis.md](07-reporting-gap-analysis.md) - Reporting integration
