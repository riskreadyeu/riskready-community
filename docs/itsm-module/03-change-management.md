# Change Management

## Overview

The Change Management module provides a structured process for controlling changes to the IT environment. It ensures changes are assessed, approved, and implemented in a controlled manner to minimize risk and disruption.

## Why Change Management for ISMS?

| Security Concern | How Change Management Helps |
|------------------|----------------------------|
| Unauthorized changes | All changes go through approval workflow |
| Untested changes | Requires test plan before implementation |
| Irreversible failures | Mandatory backout plan |
| Unknown impact | Impact assessment and asset linking |
| Audit trail | Complete history of all changes |
| Compliance | Documented evidence for auditors |

## Change Types

### Standard Changes
Pre-approved, low-risk changes that follow a documented procedure.

- **Characteristics:**
  - Well-understood, documented
  - Low risk
  - Frequently performed
  - Pre-approved (no individual approval needed)
  
- **Examples:**
  - Password resets
  - Standard software updates
  - User account creation
  - Routine maintenance

### Normal Changes
Regular changes that require approval through the standard process.

- **Characteristics:**
  - Moderate to high risk
  - Requires assessment
  - Needs appropriate approvals
  - Planned implementation
  
- **Examples:**
  - New server deployment
  - Application upgrades
  - Configuration changes
  - Network modifications

### Emergency Changes
Urgent changes needed to resolve critical issues.

- **Characteristics:**
  - Time-critical
  - High business impact if not done
  - Expedited approval process
  - Still documented (possibly after the fact)
  
- **Examples:**
  - Security patches for active threats
  - Fixes for production outages
  - Critical vulnerability remediation

## Change Categories

| Category | Description |
|----------|-------------|
| ACCESS_CONTROL | Access rights, permissions, identity |
| CONFIGURATION | System configuration changes |
| INFRASTRUCTURE | Hardware, network, facilities |
| APPLICATION | Software deployments, updates |
| DATABASE | Database changes, migrations |
| SECURITY | Security controls, policies |
| NETWORK | Network topology, firewall rules |
| BACKUP_DR | Backup and disaster recovery |
| MONITORING | Monitoring, alerting, logging |
| VENDOR | Third-party/vendor changes |
| DOCUMENTATION | Documentation updates |
| OTHER | Other changes |

## Change Workflow

```
                                    ┌─────────────┐
                                    │   DRAFTED   │
                                    └──────┬──────┘
                                           │ Submit
                                           ▼
                                    ┌─────────────┐
                                    │  SUBMITTED  │
                                    └──────┬──────┘
                                           │
                              ┌────────────┼────────────┐
                              │            │            │
                              ▼            ▼            ▼
                        ┌──────────┐ ┌──────────┐ ┌──────────┐
                        │ REJECTED │ │ PENDING  │ │CANCELLED │
                        └──────────┘ │ APPROVAL │ └──────────┘
                                     └────┬─────┘
                                          │ Approve
                                          ▼
                                    ┌──────────┐
                                    │ APPROVED │
                                    └────┬─────┘
                                         │ Schedule
                                         ▼
                                    ┌──────────┐
                                    │SCHEDULED │
                                    └────┬─────┘
                                         │ Start
                                         ▼
                                    ┌──────────────┐
                                    │ IMPLEMENTING │
                                    └──────┬───────┘
                                           │
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                        ┌──────────┐ ┌──────────┐ ┌──────────┐
                        │ COMPLETED│ │  FAILED  │ │ROLLED_BACK│
                        └──────────┘ └──────────┘ └──────────┘
```

### Status Definitions

| Status | Description |
|--------|-------------|
| DRAFTED | Initial creation, can be edited freely |
| SUBMITTED | Sent for review, awaiting approval |
| PENDING_APPROVAL | Under review by approvers |
| APPROVED | Approved, ready to schedule |
| REJECTED | Denied, needs rework |
| SCHEDULED | Implementation time confirmed |
| IMPLEMENTING | Currently being executed |
| COMPLETED | Successfully finished |
| FAILED | Implementation failed |
| ROLLED_BACK | Reverted to previous state |
| CANCELLED | Cancelled before implementation |

## Change Request Components

### Basic Information
- **Title** - Brief summary of the change
- **Description** - Detailed explanation of what will change
- **Change Type** - Standard, Normal, or Emergency
- **Category** - Type of change
- **Priority** - Urgency level
- **Security Impact** - Effect on security posture
- **Business Justification** - Why this change is needed

### Impact Assessment
- **Impacted Assets** - Which configuration items are affected
  - Direct impact (will be modified)
  - Indirect impact (may be affected)
  - Dependencies (rely on changed components)
  - Testing (used for validation)
- **Impacted Business Processes** - Which processes are affected
- **User Impact** - How end users will be affected
- **Impact Assessment** - Overall impact analysis

### Risk Assessment
- **Risk Level** - High, Medium, Low
- **Risk Assessment** - Detailed risk analysis
- **Mitigation Steps** - How risks will be addressed

### Planning
- **Test Plan** - How the change will be tested
- **Backout Plan** - How to revert if it fails
- **Rollback Time** - Estimated time to rollback
- **Success Criteria** - How success will be measured

### Schedule
- **Planned Start** - When implementation begins
- **Planned End** - When implementation completes
- **Estimated Downtime** - Expected service outage
- **Maintenance Window** - During scheduled maintenance?
- **Outage Required** - Will there be an outage?

### Approval
- **CAB Required** - Needs Change Advisory Board approval?
- **PIR Required** - Post-Implementation Review needed?

## Approval Process

### Approval Roles
| Role | Responsibility |
|------|----------------|
| Change Requester | Creates and owns the change |
| Technical Approver | Validates technical approach |
| Security Approver | Assesses security impact |
| Business Approver | Confirms business need |
| CAB Chair | Leads CAB meetings, final authority |

### Approval Matrix

| Change Type | Security Impact | Required Approvals |
|-------------|-----------------|-------------------|
| Standard | Any | Pre-approved (template) |
| Normal | None/Low | Technical only |
| Normal | Medium | Technical + Security |
| Normal | High/Critical | Technical + Security + CAB |
| Emergency | Any | Post-hoc approval allowed |

### CAB (Change Advisory Board)

The CAB reviews significant changes, typically meeting weekly.

**CAB Responsibilities:**
- Review high-risk changes
- Assess potential conflicts
- Coordinate implementation schedules
- Approve or reject changes
- Review failed changes

## Linking Changes to Assets

Every change should identify affected assets for:

1. **Impact Analysis** - Understand blast radius
2. **Communication** - Notify asset owners
3. **Rollback Planning** - Know what to restore
4. **Audit Trail** - Document what changed
5. **Risk Assessment** - Assess based on asset criticality

### Impact Types

| Type | Description |
|------|-------------|
| DIRECT | Asset will be directly modified |
| INDIRECT | Asset may be affected by the change |
| DEPENDENCY | Asset depends on changed components |
| TESTING | Asset will be used for validation |

## Security Impact Levels

| Level | Description | Examples |
|-------|-------------|----------|
| CRITICAL | Major security implications | Firewall rule changes, crypto changes |
| HIGH | Significant security relevance | Access control changes, new systems |
| MEDIUM | Moderate security relevance | Configuration changes |
| LOW | Minimal security impact | Documentation, cosmetic changes |
| NONE | No security impact | Non-production changes |

## Post-Implementation Review (PIR)

For significant changes, conduct a PIR to assess:

1. **Success** - Did the change achieve its objectives?
2. **Issues** - What problems occurred?
3. **Lessons Learned** - What could be improved?
4. **Documentation** - Is documentation updated?
5. **Metrics** - Performance before/after

## Integration with Other Processes

### Incident Management
- Emergency changes triggered by incidents
- Changes may cause incidents
- Link changes to related incidents

### Problem Management
- Changes to implement permanent fixes
- Root cause analysis drives changes

### Release Management
- Changes part of larger releases
- Coordinate multiple changes

### Vulnerability Management
- Patching requires change management
- Security updates prioritized appropriately

## Best Practices

### Planning
1. **Thorough Assessment** - Don't rush the planning
2. **Clear Backout Plan** - Always have an exit strategy
3. **Realistic Timelines** - Include buffer time
4. **Stakeholder Communication** - Keep everyone informed

### Implementation
1. **Follow the Plan** - Don't improvise
2. **Monitor Closely** - Watch for issues
3. **Document Everything** - Keep detailed notes
4. **Be Ready to Rollback** - Don't hesitate if needed

### Post-Implementation
1. **Verify Success** - Check success criteria
2. **Update Documentation** - Keep docs current
3. **Conduct PIR** - Learn from experience
4. **Close the Loop** - Update the change record

## Compliance Mapping

| Framework | Requirement | Change Management Feature |
|-----------|-------------|--------------------------|
| **ISO 27001** | A.8.32 Change management | Full workflow |
| ISO 27001 | A.8.9 Configuration management | Asset linking |
| **DORA** | Article 9 Change management | Full workflow |
| DORA | ICT change management policy | Process documentation |
| **NIS2** | Article 21(2)(e) Acquisition security | Approval process |
| **SOC 2** | CC8.1 Change management | Full workflow, audit trail |
| **PCI DSS** | Req 6.5 Change control | Full workflow |

## Metrics & KPIs

| Metric | Target | Description |
|--------|--------|-------------|
| Change Success Rate | > 95% | % of changes completed successfully |
| Emergency Change Rate | < 10% | % of changes that are emergency |
| Change Lead Time | < 5 days | Average time from submit to implement |
| Failed Change Rate | < 5% | % of changes that fail |
| Unauthorized Changes | 0 | Changes without proper approval |
| PIR Completion Rate | 100% | PIR completed for required changes |
