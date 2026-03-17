# BIA Workflow

## Overview

The Business Impact Analysis (BIA) is implemented as a workflow that populates fields directly on the BusinessProcess model. This approach ensures:

1. Every process has a clear BIA status
2. BIA data is always associated with the process
3. Processes must complete BIA before being included in continuity plans
4. Full audit trail of assessments

## Process Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Created   │────▶│ Pending BIA │────▶│ In Progress │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Completed  │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ BCP Eligible│
                                        └─────────────┘
```

## Status Definitions

| Status | BIA Fields | Can Link to BCP? |
|--------|-----------|------------------|
| `pending` | Empty | No |
| `in_progress` | Partial | No |
| `completed` | Populated | Yes |

## BIA Assessment Data

When completing a BIA, the following fields are populated on the BusinessProcess:

### Criticality
- `bcpCriticality`: critical, high, medium, low
- `bcpEnabled`: true/false

### Recovery Objectives
- `recoveryTimeObjectiveMinutes` (RTO)
- `recoveryPointObjectiveMinutes` (RPO)
- `maximumTolerableDowntimeMinutes` (MTPD)

### Staffing
- `minimumStaff`: Minimum staff required

### Dependencies
- `systemDependencies`: Array of system dependencies
- `supplierDependencies`: Array of supplier dependencies
- `criticalRoles`: Array of critical roles
- `requiredSkills`: Array of required skills

### Recovery Strategies
- `alternateProcesses`: Alternative process descriptions
- `workaroundProcedures`: Workaround procedures
- `manualProcedures`: Manual fallback procedures
- `recoveryStrategies`: Array of recovery strategies

### Performance
- `workRecoveryTimeMinutes` (WRT)
- `minimumBusinessContinuityObjective` (MBCO)

## API Endpoints

### Start BIA Assessment
```
POST /api/bcm/bia/:processId/start
```
Sets process status to `in_progress`.

### Save BIA Data (Partial)
```
PUT /api/bcm/bia/:processId
Body: Partial<BIAAssessmentData>
```
Saves progress without completing.

### Complete BIA Assessment
```
POST /api/bcm/bia/:processId/complete
Body: {
  data: BIAAssessmentData,
  notes?: string
}
```
Marks status as `completed`, populates all fields, creates audit trail entry.

### Get Pending Processes
```
GET /api/bcm/bia/pending
Query: skip, take, departmentId
```
Returns processes with pending or in_progress BIA.

### Get Coverage Stats
```
GET /api/bcm/bia/coverage
```
Returns BIA coverage statistics.

### Get Assessment History
```
GET /api/bcm/bia/history/:processId
```
Returns audit trail for a process.

### Get Upcoming Reviews
```
GET /api/bcm/bia/upcoming-reviews
Query: daysAhead (default 30)
```
Returns processes due for BIA review.

### Reset Assessment
```
POST /api/bcm/bia/:processId/reset
```
Resets BIA status to `pending` for re-assessment.

## Audit Trail

Every completed BIA creates a `BIAAssessmentHistory` record containing:

- Process reference
- Assessor
- Assessment type (initial, review, update)
- Snapshot of all BIA fields at assessment time
- Notes

This provides a complete audit trail for compliance purposes.

## Review Cycle

When a BIA is completed:
1. `biaCompletedAt` is set to current timestamp
2. `biaLastReviewedAt` is set to current timestamp
3. `biaNextReviewDue` is set to 1 year from now (default)

The dashboard shows upcoming reviews and can be filtered by due date.

## Integration with Continuity Plans

When adding processes to a ContinuityPlan:
1. System validates all process IDs
2. Any process with `biaStatus !== 'completed'` is rejected
3. Error message lists which processes need BIA completion

This ensures all processes in a continuity plan have been properly assessed.

