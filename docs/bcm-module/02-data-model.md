# BCM Data Model

## Entity Relationship Diagram

```
┌─────────────────────┐
│    BCMProgram       │
├─────────────────────┤
│ programCode         │
│ name                │
│ status              │
│ policyDocumentId    │
│ programOwnerId      │
│ doraApplicable      │
│ nis2Applicable      │
└─────────┬───────────┘
          │ 1:N
          ▼
┌─────────────────────┐      ┌─────────────────────┐
│   ContinuityPlan    │      │  BCMTestExercise    │
├─────────────────────┤      ├─────────────────────┤
│ planCode            │      │ testCode            │
│ name                │      │ name                │
│ planType            │      │ testType            │
│ status              │      │ status              │
│ version             │      │ scheduledDate       │
│ coveredProcessIds   │◄─────│ planId (optional)   │
│ activationCriteria  │      │ objectivesMet       │
│ escalationMatrix    │      │ lessonsLearned      │
└─────────┬───────────┘      └─────────┬───────────┘
          │ 1:N                        │ 1:N
          ▼                            ▼
┌─────────────────────┐      ┌─────────────────────┐
│   PlanActivation    │      │   BCMTestFinding    │
├─────────────────────┤      ├─────────────────────┤
│ activationCode      │      │ findingCode         │
│ incidentId          │      │ findingType         │
│ activatedAt         │      │ severity            │
│ status              │      │ status              │
│ actualRtoMinutes    │      │ nonconformityId     │
│ rtoAchieved         │      └─────────────────────┘
└─────────────────────┘

┌─────────────────────┐
│  BusinessProcess    │
├─────────────────────┤
│ biaStatus           │ ◄── pending | in_progress | completed
│ biaCompletedAt      │
│ biaCompletedById    │
│ biaNextReviewDue    │
│ bcpCriticality      │ ◄── Populated by BIA
│ recoveryTimeObjectiveMinutes │
│ recoveryPointObjectiveMinutes │
│ maximumTolerableDowntimeMinutes │
└─────────────────────┘

┌─────────────────────┐
│ BIAAssessmentHistory│
├─────────────────────┤
│ processId           │
│ assessedById        │
│ assessmentType      │
│ snapshotData (JSON) │
└─────────────────────┘
```

## Model Details

### BCMProgram

| Field | Type | Description |
|-------|------|-------------|
| programCode | String | Unique code (BCM-2025-001) |
| name | String | Program name |
| description | String? | Program description |
| scope | String? | Program scope |
| status | String | draft, active, under_review, retired |
| effectiveDate | DateTime? | When program became effective |
| nextReviewDate | DateTime? | Next review date |
| policyDocumentId | String? | Link to PolicyDocument |
| programOwnerId | String? | Program owner user |
| objectives | Json | Program objectives |
| successCriteria | Json | Success criteria |
| doraApplicable | Boolean | DORA regulatory flag |
| nis2Applicable | Boolean | NIS2 regulatory flag |

### ContinuityPlan

| Field | Type | Description |
|-------|------|-------------|
| planCode | String | Unique code (BCP-2025-001) |
| name | String | Plan name |
| planType | String | business_continuity, disaster_recovery, crisis_management, it_recovery |
| status | String | draft, approved, active, under_review, retired |
| version | String | Version number |
| programId | String | Parent BCM program |
| coveredProcessIds | Json | Array of process IDs (must have completed BIA) |
| activationCriteria | String? | When to activate |
| activationAuthority | String? | Who can activate |
| escalationMatrix | Json | Escalation contacts |
| recoveryProcedures | Json | Recovery steps |
| communicationPlan | Json | Communication plan |
| resourceRequirements | Json | Required resources |
| testFrequency | String? | monthly, quarterly, semi_annual, annual |
| lastTestedAt | DateTime? | Last test date |
| nextTestDue | DateTime? | Next test due |
| approvedAt | DateTime? | Approval date |
| approvedById | String? | Approver |

### BCMTestExercise

| Field | Type | Description |
|-------|------|-------------|
| testCode | String | Unique code (TTX-2025-001) |
| name | String | Test name |
| testType | String | tabletop, walkthrough, simulation, full_interruption, notification_test |
| status | String | planned, scheduled, in_progress, completed, cancelled |
| programId | String | Parent BCM program |
| planId | String? | Optional specific plan |
| scheduledDate | DateTime | Scheduled date |
| executedDate | DateTime? | Actual execution date |
| durationHours | Int? | Test duration |
| facilitatorId | String? | Test facilitator |
| participants | Json | Participant list |
| scenarioDescription | String? | Test scenario |
| objectives | Json | Test objectives |
| objectivesMet | Boolean? | Whether objectives were met |
| lessonsLearned | String? | Lessons learned |
| successAreas | Json | What went well |
| improvementAreas | Json | What needs improvement |
| actualRtoMinutes | Int? | Actual RTO achieved |
| targetRtoMinutes | Int? | Target RTO |
| rtoMet | Boolean? | Whether RTO was met |

### BCMTestFinding

| Field | Type | Description |
|-------|------|-------------|
| findingCode | String | Unique code (TTX-2025-001-F01) |
| testId | String | Parent test |
| findingType | String | gap, improvement, observation, strength |
| severity | String | critical, high, medium, low |
| title | String | Finding title |
| description | String | Finding description |
| recommendation | String? | Recommended action |
| priority | String? | immediate, short_term, medium_term, long_term |
| status | String | open, in_progress, resolved, accepted, deferred |
| assignedToId | String? | Assigned user |
| dueDate | DateTime? | Due date |
| resolvedAt | DateTime? | Resolution date |
| resolutionNotes | String? | Resolution notes |
| nonconformityId | String? | Link to Nonconformity |

### PlanActivation

| Field | Type | Description |
|-------|------|-------------|
| activationCode | String | Unique code (ACT-2025-0001) |
| planId | String | Activated plan |
| incidentId | String? | Triggering incident |
| activatedAt | DateTime | Activation time |
| activatedById | String | Who activated |
| reason | String? | Activation reason |
| deactivatedAt | DateTime? | Deactivation time |
| deactivatedById | String? | Who deactivated |
| status | String | active, completed, aborted |
| targetRtoMinutes | Int? | Target RTO |
| actualRtoMinutes | Int? | Actual RTO achieved |
| rtoAchieved | Boolean? | Whether RTO was met |
| actualRpoAchieved | Boolean? | Whether RPO was met |
| recoveryNotes | String? | Recovery notes |
| affectedProcessIds | Json | Affected process IDs |
| timelineEvents | Json | Timeline of events |

### BIAAssessmentHistory

| Field | Type | Description |
|-------|------|-------------|
| processId | String | Assessed process |
| assessedById | String | Assessor |
| assessmentType | String | initial, review, update |
| snapshotData | Json | Snapshot of BIA fields |
| notes | String? | Assessment notes |

## BusinessProcess BIA Fields

The following fields are added to the existing BusinessProcess model:

| Field | Type | Description |
|-------|------|-------------|
| biaStatus | String | pending, in_progress, completed |
| biaCompletedAt | DateTime? | When BIA was completed |
| biaCompletedById | String? | Who completed BIA |
| biaLastReviewedAt | DateTime? | Last review date |
| biaNextReviewDue | DateTime? | Next review due |

These fields gate the process's eligibility for inclusion in continuity plans.

