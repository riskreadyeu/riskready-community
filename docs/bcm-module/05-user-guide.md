# BCM User Guide

## Getting Started

The Business Continuity Management module helps organizations prepare for, respond to, and recover from disruptions. This guide walks through the key workflows.

## 1. Business Impact Analysis (BIA)

### Understanding BIA Status

Every business process has a BIA status:

| Status | Badge | Meaning |
|--------|-------|---------|
| Pending | 🔴 Red | Process needs BIA assessment |
| In Progress | 🟡 Yellow | BIA assessment started but not complete |
| Completed | 🟢 Green | BIA assessment complete, eligible for BCP |

### Completing a BIA Assessment

1. Navigate to **Organisation → Business Processes**
2. Filter by "Pending BIA" to see processes needing assessment
3. Click on a process to open its detail page
4. Click **Start BIA Assessment**
5. Complete the assessment form:

   **Impact Assessment**
   - Criticality Level (Critical, High, Medium, Low)
   - Enable for BCP

   **Recovery Objectives**
   - RTO (Recovery Time Objective) - How quickly must this process be restored?
   - RPO (Recovery Point Objective) - How much data loss is acceptable?
   - MTPD (Maximum Tolerable Period of Disruption)

   **Dependencies**
   - System dependencies (ERP, CRM, etc.)
   - Supplier dependencies
   - Critical roles and skills required

   **Recovery Strategies**
   - Alternate processes
   - Workaround procedures
   - Manual fallback procedures

6. Click **Complete Assessment**
7. The process is now eligible for inclusion in continuity plans

### BIA Review Cycle

BIAs should be reviewed annually. The system tracks:
- When the BIA was last completed
- When the next review is due
- Upcoming reviews are shown on the BCM dashboard

## 2. BCM Programs

A BCM Program is the top-level governance structure for business continuity.

### Creating a BCM Program

1. Navigate to **BCM → Programs**
2. Click **New Program**
3. Enter:
   - Program name and description
   - Scope (what's covered)
   - Program owner
   - Link to policy document (optional)
   - Regulatory flags (DORA, NIS2)
4. Save the program

### Program Lifecycle

| Status | Meaning |
|--------|---------|
| Draft | Program is being developed |
| Active | Program is operational |
| Under Review | Program is being reviewed/updated |
| Retired | Program is no longer active |

## 3. Continuity Plans

Continuity plans are specific response plans linked to a BCM program.

### Plan Types

| Type | Code Prefix | Purpose |
|------|-------------|---------|
| Business Continuity | BCP | General business continuity |
| Disaster Recovery | DRP | IT disaster recovery |
| Crisis Management | CMP | Crisis response |
| IT Recovery | IRP | IT-specific recovery |

### Creating a Continuity Plan

1. Navigate to **BCM → Plans**
2. Click **New Plan**
3. Select the parent BCM program
4. Enter:
   - Plan name and type
   - Activation criteria (when to activate)
   - Activation authority (who can activate)
   - Escalation matrix
   - Recovery procedures
   - Communication plan
   - Test frequency
5. Save the plan

### Adding Processes to a Plan

1. Open the plan detail page
2. Click **Add Processes**
3. Select processes from the list
   - Only processes with completed BIA are shown
4. Confirm selection

### Approving a Plan

1. Review plan contents
2. Click **Approve Plan**
3. Plan status changes to "Approved"
4. Plan is now eligible for activation

## 4. Test Exercises

Regular testing validates that plans work as expected.

### Test Types

| Type | Description | Effort |
|------|-------------|--------|
| Tabletop | Discussion-based walkthrough | Low |
| Walkthrough | Step-by-step review with teams | Medium |
| Simulation | Simulated scenario execution | High |
| Full Interruption | Actual failover test | Very High |
| Notification Test | Test communication channels | Low |

### Scheduling a Test

1. Navigate to **BCM → Tests**
2. Click **Schedule Test**
3. Enter:
   - Test name and type
   - Linked program and plan (optional)
   - Scheduled date
   - Facilitator
   - Participants
   - Scenario description
   - Objectives
4. Save the test

### Executing a Test

1. On test day, click **Start Test**
2. Status changes to "In Progress"
3. Execute the test according to the scenario
4. Document observations during the test

### Completing a Test

1. Click **Complete Test**
2. Enter results:
   - Were objectives met?
   - Lessons learned
   - Success areas
   - Improvement areas
   - Actual RTO achieved (if applicable)
3. Add findings for any issues identified

### Recording Findings

For each issue identified:

1. Click **Add Finding**
2. Enter:
   - Finding type (Gap, Improvement, Observation, Strength)
   - Severity (Critical, High, Medium, Low)
   - Title and description
   - Recommendation
   - Priority
   - Assignee
   - Due date
3. Save the finding

### Resolving Findings

1. Open the finding
2. Implement the recommended action
3. Click **Resolve**
4. Enter resolution notes
5. Finding status changes to "Resolved"

### Linking to Nonconformities

For significant gaps:

1. Open the finding
2. Click **Create Nonconformity**
3. A new NC is created in the Audits module
4. Finding is linked to the NC

## 5. Plan Activations

When an actual disruption occurs, plans can be activated.

### Activating a Plan

**From the BCM module:**
1. Navigate to **BCM → Plans**
2. Select the appropriate plan
3. Click **Activate Plan**
4. Enter activation reason
5. Confirm activation

**From an Incident:**
1. Open the incident detail page
2. Click **Activate BCP**
3. Select the appropriate plan
4. Confirm activation

### During an Activation

1. **Track Progress**: Add timeline events as recovery progresses
2. **Monitor RTO**: System tracks time since activation
3. **Update Status**: Keep stakeholders informed

### Completing an Activation

1. When recovery is complete, click **Deactivate**
2. Enter:
   - Actual RTO achieved
   - Whether RPO was met
   - Recovery notes
3. System calculates RTO achievement

### Aborting an Activation

If the activation was a false alarm:
1. Click **Abort**
2. Enter reason
3. Activation is marked as aborted

## 6. Dashboard

The BCM Dashboard provides an overview of:

### BIA Coverage
- Total processes and coverage percentage
- Breakdown by status (Pending, In Progress, Completed)
- Criticality distribution

### Program Stats
- Active programs and plans
- Test completion status

### Test Metrics
- Pass rate
- Upcoming tests
- Finding status

### Active Activations
- Currently active plan activations
- RTO tracking

### Upcoming Reviews
- BIAs due for review
- Tests scheduled

## Best Practices

### BIA
- Complete BIA for all critical processes first
- Review BIAs annually or after significant changes
- Document dependencies thoroughly

### Plans
- Keep plans concise and actionable
- Test plans regularly
- Update plans based on test results

### Testing
- Start with tabletop exercises
- Gradually increase test complexity
- Document and address all findings

### Activations
- Activate early rather than late
- Keep timeline events updated
- Conduct post-activation review

