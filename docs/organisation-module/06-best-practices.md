# Best Practices

This document provides implementation best practices for the Organisation Module, helping you maximise compliance effectiveness and operational efficiency.

---

## Table of Contents

1. [Initial Setup Best Practices](#initial-setup-best-practices)
2. [Data Quality Guidelines](#data-quality-guidelines)
3. [Governance Best Practices](#governance-best-practices)
4. [Review and Monitoring](#review-and-monitoring)
5. [Integration Patterns](#integration-patterns)
6. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)
7. [Audit Preparation](#audit-preparation)

---

## Initial Setup Best Practices

### Start with Scope Definition

**Do This:**
1. Define ISMS scope before adding detailed data
2. Start with a focused, manageable scope
3. Document exclusions with clear justification
4. Get management approval on scope before proceeding

**Avoid:**
- Starting with an overly broad scope
- Adding entities without considering scope relevance
- Leaving exclusions undocumented

### Build Structure Top-Down

**Recommended Sequence:**
```
1. Organisation Profile (foundation)
   ↓
2. Locations (physical boundaries)
   ↓
3. Departments (organisational structure)
   ↓
4. Key Personnel (ISMS roles)
   ↓
5. Business Processes (operational context)
   ↓
6. External Dependencies (third parties)
   ↓
7. Interested Parties (stakeholders)
   ↓
8. Context Issues (internal/external factors)
   ↓
9. Security Committee (governance)
   ↓
10. Applicable Frameworks (compliance)
```

### Use Consistent Naming Conventions

| Entity | Code Format | Example |
|--------|-------------|---------|
| Department | DEPT-XXX | DEPT-IT, DEPT-FIN |
| Location | LOC-XXX | LOC-HQ, LOC-DC1 |
| Business Process | PROC-XXX | PROC-DEV, PROC-HR |
| External Dependency | SUPP-XXX | SUPP-AWS, SUPP-MSFT |
| Interested Party | STKH-XXX | STKH-CUST, STKH-REG |
| Context Issue | CTX-XXX | CTX-INT-001, CTX-EXT-001 |
| Key Personnel | PERS-XXX | PERS-CISO, PERS-DPO |

---

## Data Quality Guidelines

### Completeness Standards

**Minimum Required Fields:**

| Entity | Must Have |
|--------|-----------|
| OrganisationProfile | name, legalName, employeeCount, ismsScope |
| Department | name, departmentCode, departmentHead |
| Location | name, locationCode, inIsmsScope |
| KeyPersonnel | name, ismsRole, securityResponsibilities |
| BusinessProcess | name, processCode, processOwner, criticalityLevel |
| ExternalDependency | name, dependencyType, criticalityLevel |
| InterestedParty | name, partyType, requirements |
| ContextIssue | title, issueType, impactLevel, ismsRelevance |

### Data Accuracy

**Regular Validation:**
- Review department headcount quarterly
- Verify key personnel assignments monthly
- Update external dependency contracts before expiry
- Refresh context issues at scheduled review dates

**Ownership Assignment:**
- Every entity should have a clear owner
- Owners are responsible for data accuracy
- Set up review reminders for owners

### Relationship Integrity

**Maintain Valid References:**
- Department heads should be active users
- Parent departments should exist before children
- Process owners should be assigned before process creation
- Committee members should be active before meetings

---

## Governance Best Practices

### Committee Structure

**Recommended Committee Types:**

| Committee | Purpose | Frequency | Typical Members |
|-----------|---------|-----------|-----------------|
| **ISSC** (Information Security Steering Committee) | Strategic oversight | Monthly | C-suite, CISO, Risk |
| **Security Operations** | Tactical decisions | Weekly | Security team, IT ops |
| **Risk Committee** | Risk oversight | Quarterly | Risk owners, executives |
| **Change Advisory Board** | Change control | Weekly | IT, Security, Business |

### Meeting Cadence

**Recommended Schedule:**

```
Weekly:
├── Security Operations (tactical)
└── Change Advisory Board

Monthly:
├── ISSC (strategic)
└── Department security reviews

Quarterly:
├── Risk Committee
├── Supplier reviews
└── Context issue reviews

Annually:
├── Management Review (formal 9.3)
├── ISMS scope review
└── Policy review
```

### Decision Documentation

**Every Decision Should Include:**
1. Clear title and description
2. Rationale for the decision
3. Voting record (if applicable)
4. Responsible party for implementation
5. Implementation deadline
6. Success criteria

**Decision Types to Track:**
- Policy approvals
- Resource allocations
- Risk acceptances
- Control implementations
- Scope changes
- Supplier approvals

### Action Item Management

**Effective Action Items:**
- Specific and measurable
- Single owner assigned
- Realistic due date
- Clear completion criteria
- Priority assigned

**Action Item Lifecycle:**
```
Created → Assigned → In Progress → Completed → Reviewed
                ↓
            Blocked → Escalated
```

**Review Overdue Actions:**
- Weekly review of overdue items
- Escalate items overdue > 2 weeks
- Report to committee monthly

---

## Review and Monitoring

### Review Schedules

| Entity Type | Review Frequency | Trigger Events |
|-------------|------------------|----------------|
| Organisation Profile | Annually | Major changes, M&A |
| Context Issues | Per monitoring frequency | Trend changes, incidents |
| Interested Parties | Annually | Contract renewals, complaints |
| External Dependencies | Annually + contract renewal | Incidents, SLA breaches |
| Business Processes | Annually | Process changes, incidents |
| Key Personnel | Quarterly | Role changes, departures |
| Applicable Frameworks | Annually | New regulations, version updates |

### Monitoring Dashboards

**Key Metrics to Track:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Open action items | < 20 | > 30 |
| Overdue actions | 0 | > 5 |
| Context issues trending worse | < 10% | > 20% |
| Supplier assessments overdue | 0 | > 3 |
| Training completion | 100% | < 90% |
| Committee meeting attendance | > 80% | < 70% |

### Trend Analysis

**Track Trends For:**
- Context issues (improving/stable/worsening)
- Compliance percentages (by framework)
- Action item completion rates
- Meeting attendance rates
- Supplier risk ratings

**Trend Review Cadence:**
- Monthly: Action items, attendance
- Quarterly: Context issues, compliance
- Annually: Overall ISMS effectiveness

---

## Integration Patterns

### Risk Management Integration

**Context Issues → Risk Register:**
```
1. Identify context issue with high impact
2. Assess if risk treatment needed
3. Set escalatedToRisk = true
4. Create linked risk in Risk module
5. Store linkedRiskId reference
6. Track treatment through Risk module
```

**Risk Appetite Flow:**
```
OrganisationProfile.riskAppetite
        ↓
    Risk Module
        ↓
    Risk Assessments
        ↓
    Treatment Decisions
```

### Asset Management Integration

**Department → Asset Ownership:**
```
Department
    ↓
DepartmentHead (User)
    ↓
Asset Owner assignments
```

**Location → Asset Location:**
```
Location
    ↓
Assets at location
    ↓
Physical security controls
```

### Policy Management Integration

**Committee Decisions → Policies:**
```
MeetingDecision (policy approval)
        ↓
    Policy Document
        ↓
    Policy Distribution
        ↓
    Acknowledgment Tracking
```

### Incident Management Integration

**Organisation Context → Incident Response:**
```
Incident occurs
    ↓
Identify affected Department
    ↓
Notify DepartmentHead
    ↓
Engage SecurityChampion
    ↓
Escalate to SecurityCommittee (if major)
    ↓
Create MeetingActionItem for remediation
```

---

## Common Pitfalls to Avoid

### Scope Definition Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| **Scope creep** | Uncontrolled expansion | Formal change control for scope |
| **Vague boundaries** | Audit findings | Document specific boundaries |
| **Missing exclusions** | Non-compliance | Document all exclusions with justification |
| **Outdated scope** | Misalignment | Annual scope review |

### Data Management Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| **Stale data** | Inaccurate records | Scheduled reviews with owners |
| **Orphaned records** | Broken references | Regular data integrity checks |
| **Duplicate entries** | Confusion | Unique codes, validation rules |
| **Missing owners** | No accountability | Mandatory owner assignment |

### Governance Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| **Infrequent meetings** | Poor oversight | Fixed meeting schedule |
| **No quorum** | Invalid decisions | Quorum tracking, proxies |
| **Untracked actions** | No follow-through | Action item system |
| **Missing minutes** | No evidence | Mandatory minute taking |

### Compliance Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| **Missing evidence** | Audit findings | Document everything |
| **Outdated frameworks** | Non-compliance | Track framework versions |
| **Ignored reviews** | Stale assessments | Automated reminders |
| **Siloed data** | Incomplete picture | Integration with other modules |

---

## Audit Preparation

### Pre-Audit Checklist

**30 Days Before Audit:**
- [ ] Review all context issues - update stale records
- [ ] Verify interested party requirements current
- [ ] Confirm ISMS scope documentation accurate
- [ ] Check all key personnel assignments
- [ ] Verify training records complete
- [ ] Review open action items - close or explain
- [ ] Ensure recent committee meeting minutes available
- [ ] Verify supplier assessments current

**7 Days Before Audit:**
- [ ] Generate all required reports
- [ ] Prepare evidence packages by clause
- [ ] Brief key personnel on their areas
- [ ] Verify system access for auditors
- [ ] Prepare meeting room/virtual setup

### Evidence Preparation by Clause

| Clause | Evidence to Prepare |
|--------|---------------------|
| **4.1** | Context issue register, review records |
| **4.2** | Interested party register, requirements matrix |
| **4.3** | Scope statement, scope inventory, exclusion justifications |
| **5.1** | Executive responsibilities, committee membership |
| **5.2** | Policy document, approval records |
| **5.3** | RACI matrix, role descriptions, org chart |
| **7.1** | Budget allocations, headcount records |
| **7.2** | Training records, certifications |
| **7.4** | Communication plans, meeting records |
| **7.5** | Document list, version history |
| **8.1** | Process documentation, supplier register |
| **9.1** | KPI reports, compliance dashboards |
| **9.3** | Meeting minutes, decisions, action items |
| **10.1** | Improvement records, completed actions |

### Common Audit Questions and Answers

| Question | Where to Find Answer |
|----------|---------------------|
| "Show me your ISMS scope" | OrganisationProfile.ismsScope |
| "How do you identify context issues?" | ContextIssue creation process, review records |
| "Who are your interested parties?" | InterestedParty register |
| "How are security responsibilities assigned?" | KeyPersonnel, ExecutivePosition records |
| "Show me management review evidence" | CommitteeMeeting minutes, decisions, actions |
| "How do you manage suppliers?" | ExternalDependency records, assessments |
| "How do you track improvements?" | MeetingActionItem completion records |

### Audit Response Best Practices

**During the Audit:**
1. Have system access ready for demonstrations
2. Know where to find evidence quickly
3. Be honest about gaps - show improvement plans
4. Document any findings immediately
5. Assign action items for findings in real-time

**After the Audit:**
1. Create action items for all findings
2. Assign owners and due dates
3. Track through committee meetings
4. Verify effectiveness of corrections
5. Update documentation as needed

---

## Continuous Improvement

### Monthly Activities
- Review and close completed action items
- Update context issues with new information
- Verify key personnel assignments current
- Check for expiring supplier contracts

### Quarterly Activities
- Conduct context issue trend analysis
- Review interested party requirements
- Assess supplier performance
- Update compliance percentages

### Annual Activities
- Full ISMS scope review
- Management review meeting
- Policy review and update
- Framework applicability reassessment
- Training needs analysis
- Certification renewal planning
