# Key Risk Indicator (KRI) System Architecture

## Overview

The KRI system provides continuous risk monitoring through measurable indicators linked to risks. KRIs track operational metrics, trigger alerts on threshold breaches, and provide trend analysis for proactive risk management.

---

## 1. Data Model

### KeyRiskIndicator Entity

**Location:** `prisma/schema/controls.prisma`

#### Core Fields
| Field | Type | Purpose |
|-------|------|---------|
| `id` | String (CUID) | Primary key |
| `kriId` | String (unique) | Human-readable ID (e.g., "KRI-001") |
| `name` | String | Indicator name |
| `description` | String? | Detailed description |
| `tier` | RiskTier | CORE, EXTENDED, ADVANCED |
| `framework` | ControlFramework | ISO, SOC2, NIS2, DORA |
| `riskId` | String | Parent risk (FK) |

#### Measurement Fields
| Field | Type | Purpose |
|-------|------|---------|
| `unit` | String | Measurement unit (%, count, $) |
| `formula` | String? | Calculation formula |
| `dataSource` | String? | Where data comes from |
| `automated` | Boolean | Auto-collected vs manual |
| `frequency` | CollectionFrequency | DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUALLY |

#### Threshold Fields
| Field | Type | Purpose |
|-------|------|---------|
| `thresholdGreen` | String? | Green threshold (e.g., "≥95%") |
| `thresholdAmber` | String? | Amber/Warning threshold (e.g., "80-94%") |
| `thresholdRed` | String? | Red/Critical threshold (e.g., "<80%") |

#### Current State
| Field | Type | Purpose |
|-------|------|---------|
| `currentValue` | String? | Latest measured value |
| `status` | RAGStatus | GREEN, AMBER, RED, NOT_MEASURED |
| `trend` | TrendDirection | IMPROVING, STABLE, DECLINING, NEW |
| `lastMeasured` | DateTime? | Last measurement timestamp |

#### Relationships
```
KeyRiskIndicator
  ├── risk: Risk (parent)
  ├── history: KRIHistory[] (measurement history)
  ├── createdBy: User
  └── updatedBy: User
```

### KRIHistory Entity

Records historical measurements for trend analysis.

| Field | Type | Purpose |
|-------|------|---------|
| `id` | String (CUID) | Primary key |
| `kriId` | String | Parent KRI (FK) |
| `value` | String | Measured value |
| `status` | RAGStatus | Status at measurement time |
| `measuredAt` | DateTime | Measurement timestamp |
| `measuredBy` | String? | User who recorded measurement |
| `notes` | String? | Measurement notes |

---

## 2. Status Determination Logic

### RAG Status Calculation

```typescript
determineStatus(value: string, green: string, amber: string, red: string): RAGStatus {
  const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
  if (isNaN(numValue)) return 'NOT_MEASURED';

  // Parse thresholds (e.g., "≥95%" → 95, "<80%" → 80)
  const greenThreshold = parseThreshold(green);  // e.g., 95
  const redThreshold = parseThreshold(red);      // e.g., 80

  // Higher is better logic (default)
  if (greenThreshold && numValue >= greenThreshold) return 'GREEN';
  if (redThreshold && numValue < redThreshold) return 'RED';
  return 'AMBER';
}
```

### Trend Calculation

```typescript
determineTrend(newValue: string, oldValue: string): TrendDirection {
  if (!oldValue) return 'NEW';

  const newNum = parseFloat(newValue);
  const oldNum = parseFloat(oldValue);
  const threshold = Math.abs(oldNum) * 0.05; // 5% change threshold

  if (diff > threshold) return 'IMPROVING';
  if (diff < -threshold) return 'DECLINING';
  return 'STABLE';
}
```

---

## 3. Alert System

### Alert Types

| Type | Trigger | Severity |
|------|---------|----------|
| `BREACH` | Status changed to RED | HIGH |
| `APPROACHING` | Status changed GREEN → AMBER | MEDIUM |
| `RECOVERED` | Status changed RED/AMBER → GREEN | LOW |

### KRIAlert Interface

```typescript
interface KRIAlert {
  kriId: string;
  kriName: string;
  riskId: string;
  riskTitle: string;
  currentValue: string;
  previousValue: string | null;
  status: RAGStatus;
  previousStatus: RAGStatus | null;
  threshold: string;
  alertType: 'BREACH' | 'APPROACHING' | 'RECOVERED';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  triggeredAt: Date;
}
```

### Alert Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  KRI Value Update                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Parse new value                                          │
│ 2. Determine status from thresholds                         │
│ 3. Compare to previous status                               │
│ 4. Calculate trend (±5% threshold)                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Create KRIHistory entry                                  │
│ 6. Update current value, status, trend                      │
│ 7. Generate alert if status changed                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Alert Types Generated:                                      │
│ • RED new → BREACH alert (HIGH)                             │
│ • GREEN→AMBER → APPROACHING alert (MEDIUM)                  │
│ • RED/AMBER→GREEN → RECOVERED alert (LOW)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Overdue Measurement Detection

```typescript
async getOverdueMeasurements(): Promise<any[]> {
  const frequencyDays: Record<CollectionFrequency, number> = {
    DAILY: 1,
    WEEKLY: 7,
    MONTHLY: 30,
    QUARTERLY: 90,
    ANNUALLY: 365,
  };

  for (const kri of kris) {
    if (!kri.lastMeasured) {
      // Never measured - always overdue
      overdue.push({ ...kri, daysOverdue: null, reason: 'Never measured' });
      continue;
    }

    const daysSinceMeasured = Math.floor(
      (now - kri.lastMeasured) / (1000 * 60 * 60 * 24)
    );
    const expectedDays = frequencyDays[kri.frequency] || 30;

    if (daysSinceMeasured > expectedDays) {
      overdue.push({
        ...kri,
        daysOverdue: daysSinceMeasured - expectedDays,
        reason: `Last measured ${daysSinceMeasured} days ago (expected: every ${expectedDays} days)`,
      });
    }
  }
}
```

---

## 5. Dashboard Aggregations

### Status Summary

```typescript
interface KRIDashboard {
  total: number;
  statusCounts: {
    GREEN: number;
    AMBER: number;
    RED: number;
    NOT_MEASURED: number;
  };
  byTier: Record<RiskTier, {
    total: number;
    green: number;
    amber: number;
    red: number;
  }>;
}
```

### Alert Summary

```typescript
interface AlertSummary {
  breached: number;      // RED status
  approaching: number;   // AMBER status
  healthy: number;       // GREEN status
  notMeasured: number;   // NOT_MEASURED status
  recentAlerts: KRIAlert[]; // Last 10 alerts
}
```

---

## 6. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/kris` | List all KRIs (paginated, filterable) |
| POST | `/kris` | Create new KRI |
| GET | `/kris/dashboard` | Get dashboard aggregations |
| GET | `/kris/alerts` | Get all current alerts |
| GET | `/kris/alerts/summary` | Get alert summary |
| GET | `/kris/alerts/breached` | Get breached KRIs |
| GET | `/kris/alerts/approaching` | Get approaching threshold KRIs |
| GET | `/kris/alerts/overdue` | Get overdue measurements |
| GET | `/kris/risk/:riskId` | Get KRIs for a specific risk |
| GET | `/kris/:id` | Get single KRI with history |
| PUT | `/kris/:id` | Update KRI configuration |
| PUT | `/kris/:id/value` | Record new measurement |

---

## 7. Services

### KRIService
**Location:** `src/risks/services/kri.service.ts`

| Method | Purpose |
|--------|---------|
| `findAll()` | List KRIs with pagination and filters |
| `findByRisk()` | Get KRIs for a risk with recent history |
| `findOne()` | Get single KRI with full history |
| `create()` | Create new KRI |
| `update()` | Update KRI configuration |
| `updateValue()` | Record measurement, update status/trend |
| `getDashboard()` | Get aggregated dashboard data |

### KRIAlertService
**Location:** `src/risks/services/kri-alert.service.ts`

| Method | Purpose |
|--------|---------|
| `checkAllKRIs()` | Check all KRIs for threshold breaches |
| `getBreachedKRIs()` | Get RED status KRIs |
| `getApproachingKRIs()` | Get AMBER status KRIs |
| `getAlertSummary()` | Get summary with recent alerts |
| `getOverdueMeasurements()` | Find KRIs past collection deadline |

---

## 8. Integration with Risk Calculation

### KRI → F4 Factor (Incident History)

KRI status can influence F4 factor score:

```
KRI Status Distribution → F4 Score
├── All GREEN → 1 (Low incident correlation)
├── Mostly GREEN, some AMBER → 2
├── Mixed → 3
├── Mostly AMBER/RED → 4
└── Critical breaches → 5 (High incident correlation)
```

### Event Bus Integration

KRI updates emit events:
```typescript
// Emitted when KRI value recorded
await eventBus.emitKRIRecorded(riskId, kriId, value, status, actorId);

// Additional event if threshold breached
if (status === 'RED' || status === 'AMBER') {
  await eventBus.publish({
    type: 'kri.threshold_breached',
    riskId,
    sourceEntityType: 'kri',
    sourceEntityId: kriId,
    data: { value, status },
    isSystemEvent: true,
  });
}
```

---

## 9. Example KRI Configurations

### Security KRIs

| KRI ID | Name | Unit | Green | Amber | Red | Frequency |
|--------|------|------|-------|-------|-----|-----------|
| KRI-001 | Patching Compliance | % | ≥95% | 80-94% | <80% | MONTHLY |
| KRI-002 | Security Training Completion | % | ≥90% | 70-89% | <70% | QUARTERLY |
| KRI-003 | Overdue Vulnerabilities | Count | 0 | 1-5 | >5 | WEEKLY |
| KRI-004 | Failed Login Attempts | Count | <100 | 100-500 | >500 | DAILY |
| KRI-005 | Mean Time to Patch Critical | Days | <7 | 7-14 | >14 | MONTHLY |

### Operational KRIs

| KRI ID | Name | Unit | Green | Amber | Red | Frequency |
|--------|------|------|-------|-------|-----|-----------|
| KRI-010 | System Uptime | % | ≥99.9% | 99-99.8% | <99% | MONTHLY |
| KRI-011 | Incident Response Time | Hours | <4 | 4-24 | >24 | MONTHLY |
| KRI-012 | Backup Success Rate | % | 100% | 95-99% | <95% | WEEKLY |

---

## 10. Implementation Status

### Fully Implemented ✅
- KRI CRUD operations
- Value recording with status/trend calculation
- Threshold-based RAG status
- Alert generation (BREACH, APPROACHING, RECOVERED)
- Overdue measurement detection
- Dashboard aggregations
- History tracking

### Not Implemented ❌
- Automated data collection integrations
- Threshold comparison operators (currently assumes higher=better)
- KRI correlation analysis
- Predictive trend forecasting
- Custom alert routing rules
- KRI templates/library

---

## 11. Key Files

| Component | File |
|-----------|------|
| Service | `src/risks/services/kri.service.ts` |
| Alert Service | `src/risks/services/kri-alert.service.ts` |
| Controller | `src/risks/controllers/kri.controller.ts` |
| Schema | `prisma/schema/controls.prisma` (KeyRiskIndicator, KRIHistory) |
