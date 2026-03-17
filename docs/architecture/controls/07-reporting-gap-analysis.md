# Reporting & Gap Analysis System

This document describes the control reporting and gap analysis capabilities that provide visibility into control effectiveness, maturity levels, and improvement priorities.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Effectiveness Report](#2-effectiveness-report)
3. [Maturity Heatmap](#3-maturity-heatmap)
4. [Gap Analysis](#4-gap-analysis)
5. [Dashboard Integration](#5-dashboard-integration)
6. [Service API](#6-service-api)
7. [Report Formats](#7-report-formats)

---

## 1. Overview

The Reporting & Gap Analysis System provides:

- Control effectiveness reports aggregated by theme
- Maturity heatmaps for visual assessment
- Gap analysis with priority classification
- Dashboard-ready data aggregations

### Key Reports

| Report | Purpose | Data Source |
|--------|---------|-------------|
| Effectiveness Report | Control performance by theme | Capability assessments |
| Maturity Heatmap | Visual maturity levels | Latest assessments |
| Gap Analysis | Improvement priorities | Assessment gaps |

---

## 2. Effectiveness Report

### Report Structure

```typescript
interface EffectivenessReport {
  controls: Array<{
    id: string;
    controlId: string;
    name: string;
    theme: ControlTheme;
    score: number;           // 0-100
    rating: string;          // EFFECTIVE | PARTIALLY_EFFECTIVE | NOT_EFFECTIVE
    passCount: number;
    partialCount: number;
    failCount: number;
    notTestedCount: number;
    totalCapabilities: number;
  }>;
  byTheme: Record<ControlTheme, {
    controls: ControlEffectiveness[];
    avgScore: number;
  }>;
}
```

### Generation Logic

```typescript
async getEffectivenessReport(organisationId: string) {
  // Get all applicable controls with capabilities
  const controls = await prisma.control.findMany({
    where: { organisationId, applicable: true },
    include: {
      capabilities: {
        include: {
          assessments: {
            orderBy: { assessmentDate: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { controlId: 'asc' },
  });

  // Calculate effectiveness for each control
  const report = await Promise.all(
    controls.map(async (control) => {
      const effectiveness = await controlService.calculateControlEffectiveness(control.id);
      return {
        id: control.id,
        controlId: control.controlId,
        name: control.name,
        theme: control.theme,
        ...effectiveness,
      };
    })
  );

  // Aggregate by theme
  const byTheme = report.reduce((acc, item) => {
    if (!acc[item.theme]) {
      acc[item.theme] = { controls: [], avgScore: 0 };
    }
    acc[item.theme].controls.push(item);
    return acc;
  }, {});

  // Calculate theme averages
  for (const theme of Object.keys(byTheme)) {
    const scores = byTheme[theme].controls.map(c => c.score);
    byTheme[theme].avgScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );
  }

  return { controls: report, byTheme };
}
```

### Report Visualization

```
┌──────────────────────────────────────────────────────────────────┐
│                    EFFECTIVENESS REPORT                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  By Theme Summary:                                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ORGANISATIONAL   ████████████████████░░░░  82%             │  │
│  │ PEOPLE           ████████████████░░░░░░░░  68%             │  │
│  │ PHYSICAL         ████████████████████████  95%             │  │
│  │ TECHNOLOGICAL    ██████████████████░░░░░░  76%             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Control Details:                                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Control    │ Theme    │ Score │ Rating          │ Caps    │  │
│  ├────────────┼──────────┼───────┼─────────────────┼─────────┤  │
│  │ A.5.1      │ ORG      │  92%  │ EFFECTIVE       │ 5/5     │  │
│  │ A.5.2      │ ORG      │  75%  │ PARTIAL_EFF     │ 3/4     │  │
│  │ A.8.1      │ TECH     │  88%  │ EFFECTIVE       │ 6/7     │  │
│  │ A.8.12     │ TECH     │  45%  │ NOT_EFFECTIVE   │ 2/6     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Maturity Heatmap

### Heatmap Structure

```typescript
interface MaturityHeatmapItem {
  capabilityId: string;
  capabilityName: string;
  controlId: string;
  controlName: string;
  theme: ControlTheme;
  type: CapabilityType;
  currentMaturity: number | null;  // 0-5
  targetMaturity: number | null;   // 0-5
  gap: number | null;              // target - current
}
```

### Generation Logic

```typescript
async getMaturityHeatmap(organisationId: string) {
  const capabilities = await prisma.capability.findMany({
    where: { control: { organisationId } },
    include: {
      control: { select: { controlId: true, name: true, theme: true } },
      assessments: {
        orderBy: { assessmentDate: 'desc' },
        take: 1,
      },
    },
    orderBy: { capabilityId: 'asc' },
  });

  return capabilities.map(cap => ({
    capabilityId: cap.capabilityId,
    capabilityName: cap.name,
    controlId: cap.control.controlId,
    controlName: cap.control.name,
    theme: cap.control.theme,
    type: cap.type,
    currentMaturity: cap.assessments[0]?.currentMaturity ?? null,
    targetMaturity: cap.assessments[0]?.targetMaturity ?? null,
    gap: cap.assessments[0]?.gap ?? null,
  }));
}
```

### Heatmap Visualization

```
┌────────────────────────────────────────────────────────────────────┐
│                      MATURITY HEATMAP                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Legend: L0=█ L1=░ L2=▒ L3=▓ L4=▓ L5=█ (bright)                    │
│                                                                     │
│  Control    │ Capability        │ Type    │ Curr │ Tgt │ Gap      │
│  ───────────┼───────────────────┼─────────┼──────┼─────┼──────────│
│  A.5.1      │ 5.1-C01 Policy    │ PROCESS │ ▓ 3  │ 4   │ ▲ 1      │
│             │ 5.1-C02 Comms     │ PROCESS │ ▒ 2  │ 3   │ ▲ 1      │
│  ───────────┼───────────────────┼─────────┼──────┼─────┼──────────│
│  A.8.1      │ 8.1-C01 Inventory │ TECH    │ ▓ 4  │ 4   │ ● 0      │
│             │ 8.1-C02 Register  │ TECH    │ ░ 1  │ 3   │ ▲▲ 2     │
│             │ 8.1-C03 Labels    │ PHYSICAL│ █ 0  │ 2   │ ▲▲ 2     │
│  ───────────┼───────────────────┼─────────┼──────┼─────┼──────────│
│  A.8.12     │ 8.12-C01 DLP      │ TECH    │ ▓ 3  │ 5   │ ▲▲ 2     │
│             │ 8.12-C02 USB      │ TECH    │ ▓ 4  │ 5   │ ▲ 1      │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Color Coding

| Maturity | Visual | Color | Meaning |
|----------|--------|-------|---------|
| 0 | █ | Red | Non-existent |
| 1 | ░ | Orange | Initial |
| 2 | ▒ | Yellow | Repeatable |
| 3 | ▓ | Light Green | Defined |
| 4 | ▓ | Green | Managed |
| 5 | █ | Dark Green | Optimizing |

---

## 4. Gap Analysis

### Gap Analysis Structure

```typescript
interface GapAnalysis {
  gaps: Array<{
    capabilityId: string;
    capabilityName: string;
    controlId: string;
    controlName: string;
    theme: ControlTheme;
    type: CapabilityType;
    currentMaturity: number;
    targetMaturity: number;
    gap: number;
    priority: 'Critical' | 'High' | 'Medium';
  }>;
  summary: {
    totalGaps: number;
    criticalGaps: number;
    highGaps: number;
    mediumGaps: number;
  };
}
```

### Priority Classification

```typescript
CONTROLS_CONFIG.gaps.priorities = {
  CRITICAL: 3,  // gap >= 3
  HIGH: 2,      // gap >= 2
  MEDIUM: 0,    // gap < 2 (but > 0)
}

function classifyPriority(gap: number): string {
  if (gap >= 3) return 'Critical';
  if (gap >= 2) return 'High';
  return 'Medium';
}
```

### Generation Logic

```typescript
async getGapAnalysis(organisationId: string) {
  const capabilities = await prisma.capability.findMany({
    where: { control: { organisationId } },
    include: {
      control: { select: { controlId: true, name: true, theme: true } },
      assessments: {
        orderBy: { assessmentDate: 'desc' },
        take: 1,
      },
    },
  });

  // Filter to only capabilities with gaps
  const gaps = capabilities
    .filter(cap => cap.assessments[0]?.gap && cap.assessments[0].gap > 0)
    .map(cap => ({
      capabilityId: cap.capabilityId,
      capabilityName: cap.name,
      controlId: cap.control.controlId,
      controlName: cap.control.name,
      theme: cap.control.theme,
      type: cap.type,
      currentMaturity: cap.assessments[0]?.currentMaturity,
      targetMaturity: cap.assessments[0]?.targetMaturity,
      gap: cap.assessments[0]?.gap,
      priority: classifyPriority(cap.assessments[0]?.gap),
    }))
    .sort((a, b) => b.gap - a.gap);  // Sort by gap descending

  const summary = {
    totalGaps: gaps.length,
    criticalGaps: gaps.filter(g => g.priority === 'Critical').length,
    highGaps: gaps.filter(g => g.priority === 'High').length,
    mediumGaps: gaps.filter(g => g.priority === 'Medium').length,
  };

  return { gaps, summary };
}
```

### Gap Analysis Visualization

```
┌──────────────────────────────────────────────────────────────────┐
│                        GAP ANALYSIS                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Summary:                                                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Total Gaps: 28                                             │  │
│  │  ● CRITICAL (gap ≥3): 4                                     │  │
│  │  ● HIGH (gap ≥2):     12                                    │  │
│  │  ● MEDIUM (gap <2):   12                                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Critical Gaps (Immediate Action Required):                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Capability       │ Control │ Current │ Target │ Gap │ Pri  │  │
│  ├──────────────────┼─────────┼─────────┼────────┼─────┼──────┤  │
│  │ 8.1-C03 Labels   │ A.8.1   │    0    │   3    │  3  │ CRIT │  │
│  │ 8.16-C01 Monitor │ A.8.16  │    1    │   4    │  3  │ CRIT │  │
│  │ 5.24-C02 Report  │ A.5.24  │    0    │   3    │  3  │ CRIT │  │
│  │ 8.28-C01 Secure  │ A.8.28  │    1    │   4    │  3  │ CRIT │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  High Priority Gaps:                                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Capability       │ Control │ Current │ Target │ Gap │ Pri  │  │
│  ├──────────────────┼─────────┼─────────┼────────┼─────┼──────┤  │
│  │ 8.12-C01 DLP     │ A.8.12  │    3    │   5    │  2  │ HIGH │  │
│  │ 5.1-C03 Review   │ A.5.1   │    2    │   4    │  2  │ HIGH │  │
│  │ ...              │ ...     │   ...   │  ...   │ ... │ ...  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Dashboard Integration

### Dashboard Data Points

```typescript
interface ControlDashboard {
  // Overall statistics
  totalControls: number;
  applicableControls: number;
  implementedControls: number;

  // Effectiveness summary
  effectiveCount: number;
  partiallyEffectiveCount: number;
  notEffectiveCount: number;

  // By theme
  byTheme: Record<ControlTheme, {
    total: number;
    implemented: number;
    avgEffectiveness: number;
  }>;

  // By framework
  byFramework: Record<ControlFramework, {
    total: number;
    implemented: number;
  }>;

  // Gap summary
  gapSummary: {
    criticalGaps: number;
    highGaps: number;
    mediumGaps: number;
  };

  // Recent activity
  recentAssessments: Assessment[];
  upcomingReviews: Capability[];
}
```

### Dashboard Widgets

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CONTROLS DASHBOARD                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │  93 Controls │ │ 87 Applicable│ │ 72 Implemented│ │ 4 Critical  │ │
│  │    Total     │ │    (94%)     │ │    (83%)     │ │    Gaps     │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘ │
│                                                                      │
│  Effectiveness by Theme:                                             │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ ORG   ████████████████████████░░░░░░  82% │ 28/34 effective    ││
│  │ PEOPLE████████████████░░░░░░░░░░░░░░  68% │ 8/12 effective     ││
│  │ PHYS  ████████████████████████████░░  95% │ 14/15 effective    ││
│  │ TECH  ██████████████████████░░░░░░░░  76% │ 24/32 effective    ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  Implementation Status:          │  Gap Priority Distribution:      │
│  ┌─────────────────────────────┐ │ ┌─────────────────────────────┐  │
│  │  ██████████████ IMPL (72)   │ │ │ ●●●● CRITICAL (4)           │  │
│  │  ████████░░░░░░ PARTIAL (15)│ │ │ ●●●●●●●●●●●● HIGH (12)      │  │
│  │  ██░░░░░░░░░░░░ NOT_ST (6)  │ │ │ ●●●●●●●●●●●● MEDIUM (12)    │  │
│  └─────────────────────────────┘ │ └─────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Service API

### ControlReportingService Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getEffectivenessReport` | `organisationId` | `EffectivenessReport` | Full effectiveness report |
| `getMaturityHeatmap` | `organisationId` | `HeatmapItem[]` | Maturity heatmap data |

### GapAnalysisService Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getGapAnalysis` | `organisationId` | `GapAnalysis` | Gap analysis with priorities |

### Usage Examples

```typescript
// Get effectiveness report
const effectivenessReport = await reportingService.getEffectivenessReport(orgId);
console.log(`Average effectiveness: ${effectivenessReport.byTheme.TECHNOLOGICAL.avgScore}%`);

// Get maturity heatmap
const heatmap = await reportingService.getMaturityHeatmap(orgId);
const lowMaturity = heatmap.filter(item => item.currentMaturity < 3);

// Get gap analysis
const gaps = await gapAnalysisService.getGapAnalysis(orgId);
console.log(`Critical gaps requiring immediate attention: ${gaps.summary.criticalGaps}`);
```

---

## 7. Report Formats

### Export Formats

| Format | Use Case | Content |
|--------|----------|---------|
| JSON | API/Integration | Full data structure |
| CSV | Spreadsheet analysis | Tabular data |
| PDF | Management reporting | Formatted report |

### CSV Export Structure

```csv
control_id,control_name,theme,capability_id,capability_name,type,current_maturity,target_maturity,gap,priority
A.5.1,Information Security Policies,ORGANISATIONAL,5.1-C01,Policy Document,PROCESS,3,4,1,Medium
A.5.1,Information Security Policies,ORGANISATIONAL,5.1-C02,Communication,PROCESS,2,4,2,High
A.8.1,User Endpoint Devices,TECHNOLOGICAL,8.1-C01,Asset Inventory,TECHNOLOGY,4,4,0,
A.8.1,User Endpoint Devices,TECHNOLOGICAL,8.1-C02,Asset Register,TECHNOLOGY,1,4,3,Critical
```

### Report Scheduling

Reports can be scheduled for periodic generation:

| Report | Typical Frequency | Recipients |
|--------|-------------------|------------|
| Effectiveness Summary | Weekly | Control Owners |
| Full Gap Analysis | Monthly | CISO, Risk Committee |
| Maturity Heatmap | Quarterly | Executive Team |
| Compliance Status | On-demand | Auditors |

---

## Key Files

| File | Description |
|------|-------------|
| `src/controls/services/control-reporting.service.ts` | Reporting service |
| `src/controls/services/gap-analysis.service.ts` | Gap analysis service |
| `src/config/controls.config.ts` | Gap priority configuration |

---

## Related Documentation

- [01-control-system.md](01-control-system.md) - Control effectiveness calculation
- [02-capability-maturity-system.md](02-capability-maturity-system.md) - Maturity model
- [04-metrics-monitoring-system.md](04-metrics-monitoring-system.md) - Metric dashboards
