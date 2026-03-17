# User Guide

This guide provides step-by-step instructions for common tasks in the Organisation Module.

---

## Table of Contents

1. [Managing Organisation Profile](#managing-organisation-profile)
2. [Working with Departments](#working-with-departments)
3. [Managing Locations](#managing-locations)
4. [Assigning Key Personnel](#assigning-key-personnel)
5. [Documenting Business Processes](#documenting-business-processes)
6. [Managing External Dependencies](#managing-external-dependencies)
7. [Tracking Interested Parties](#tracking-interested-parties)
8. [Monitoring Context Issues](#monitoring-context-issues)
9. [Running Security Committees](#running-security-committees)
10. [Tracking Applicable Frameworks](#tracking-applicable-frameworks)

---

## Managing Organisation Profile

### Viewing the Organisation Profile

1. Navigate to **Organisation → Organisation Profiles**
2. Click on your organisation name to view details
3. Review tabs: Overview, ISMS Scope, Certification, Settings

### Updating ISMS Scope

1. Open Organisation Profile
2. Click **Edit** button
3. Navigate to ISMS section
4. Update scope fields:
   - **ISMS Scope** - Main scope statement
   - **Products/Services in Scope** - Add/remove items
   - **Departments in Scope** - Select departments
   - **Locations in Scope** - Select locations
   - **Processes in Scope** - Select processes
   - **Systems in Scope** - Select systems
5. Document any exclusions with justification
6. Click **Save**

### Updating Certification Status

1. Open Organisation Profile
2. Click **Edit**
3. Update certification fields:
   - **Certification Status** - Select current status
   - **Certification Body** - Enter certifier name
   - **Certificate Number** - Enter certificate reference
   - **Certification Date** - Date achieved
   - **Expiry Date** - When renewal needed
   - **Next Audit Date** - Surveillance/recertification date
4. Click **Save**

> **Tip:** Set up calendar reminders for certification expiry and audit dates.

---

## Working with Departments

### Creating a New Department

1. Navigate to **Organisation → Departments**
2. Click **Add Department**
3. Fill in required fields:
   - **Department Code** - Unique identifier (e.g., IT-SEC)
   - **Name** - Full department name
4. Fill in recommended fields:
   - **Parent Department** - For hierarchy
   - **Department Head** - Select user
   - **Criticality Level** - Business criticality
   - **Headcount** - Number of staff
5. Set data handling flags:
   - **Handles Personal Data** - For GDPR compliance
   - **Handles Financial Data** - For financial controls
6. Click **Save**

### Creating Department Hierarchy

Build hierarchy from top to bottom:

```
1. Create parent department (e.g., "Information Technology")
2. Create child department (e.g., "Security Operations")
3. Set parent reference in child department
4. Repeat for all sub-departments
```

### Assigning Department Members

1. Open department detail page
2. Click **Members** tab
3. Click **Add Member**
4. Select user from dropdown
5. Click **Add**

### Assigning Security Champions

1. Navigate to **Organisation → Security Champions**
2. Click **Add Champion**
3. Select:
   - **User** - The champion
   - **Department** - Department they represent
   - **Champion Level** - senior, standard, junior
4. Document responsibilities
5. Track training completion
6. Click **Save**

---

## Managing Locations

### Adding a New Location

1. Navigate to **Organisation → Locations**
2. Click **Add Location**
3. Fill in basic information:
   - **Location Code** - Unique identifier
   - **Name** - Location name
   - **Location Type** - headquarters, branch, datacenter, cloud
4. Enter address details
5. Set physical security attributes:
   - **Physical Security Level** - Classification
   - **Access Control Type** - Card, biometric, etc.
   - **Security Features** - List of controls
6. Set IT infrastructure flags:
   - **Is Data Center** - Check if applicable
   - **Has Server Room** - Check if applicable
   - **Backup Power** - Check if available
7. Set ISMS scope:
   - **In ISMS Scope** - Include in scope
   - **Scope Justification** - Reason for inclusion/exclusion
8. Click **Save**

### Reviewing Location Security

1. Open location detail page
2. Review **Security** tab
3. Verify:
   - Physical security controls documented
   - Access control type appropriate
   - IT infrastructure flags accurate
4. Update as needed

---

## Assigning Key Personnel

### Adding ISMS Personnel

1. Navigate to **Organisation → Key Personnel**
2. Click **Add Personnel**
3. Fill in:
   - **Person Code** - Unique identifier
   - **Name** - Full name
   - **Job Title** - Current title
   - **ISMS Role** - Select role type
   - **User Account** - Link to system user (optional)
4. Document responsibilities:
   - **Security Responsibilities** - Specific duties
   - **Authority Level** - Decision-making scope
5. Assign backup:
   - **Backup Person** - Select deputy
6. Track competence:
   - **Training Completed** - Check when done
   - **Last Training Date** - Record date
   - **Certifications** - Add professional certs
7. Click **Save**

### Common ISMS Roles to Assign

| Role | Typical Title | Key Responsibilities |
|------|---------------|---------------------|
| ISMS Manager | Security Manager | Overall ISMS management |
| CISO | CISO | Strategic security leadership |
| Risk Owner | Risk Manager | Risk assessment oversight |
| DPO | Data Protection Officer | Privacy compliance |
| Internal Auditor | IT Auditor | ISMS audit function |
| BCM Manager | BC Manager | Business continuity |
| Incident Manager | SOC Manager | Incident response |

---

## Documenting Business Processes

### Adding a Business Process

1. Navigate to **Organisation → Business Processes**
2. Click **Add Process**
3. Fill in basic information:
   - **Process Code** - Unique identifier
   - **Name** - Process name
   - **Process Type** - core, support, management
   - **Criticality Level** - Business criticality
4. Assign ownership:
   - **Process Owner** - Accountable person
   - **Process Manager** - Day-to-day manager
   - **Department** - Owning department
   - **Backup Owner** - Deputy
5. Document process details:
   - **Inputs** - What goes in
   - **Outputs** - What comes out
   - **Key Activities** - Main steps
   - **KPIs** - Performance measures
6. Click **Save**

### Adding Business Continuity Information

1. Open process detail page
2. Click **Edit**
3. Enable BCP:
   - **BCP Enabled** - Check to enable
   - **BCP Criticality** - Priority level
4. Set recovery objectives:
   - **RTO (minutes)** - Recovery time objective
   - **RPO (minutes)** - Recovery point objective
   - **MTD (minutes)** - Maximum tolerable downtime
5. Document recovery:
   - **Minimum Staff** - Staff needed
   - **Alternate Processes** - Workarounds
   - **Manual Procedures** - Fallback steps
6. Click **Save**

### Creating Process Hierarchy

1. Create parent process first
2. Create sub-process
3. Set **Parent Process** reference
4. Document upstream/downstream dependencies

---

## Managing External Dependencies

### Adding a Supplier/Vendor

1. Navigate to **Organisation → External Dependencies**
2. Click **Add Dependency**
3. Fill in basic information:
   - **Name** - Supplier name
   - **Dependency Type** - supplier, vendor, partner, cloud_provider
   - **Description** - What they provide
4. Assess risk:
   - **Criticality Level** - How critical
   - **Business Impact** - Impact if unavailable
   - **Single Point of Failure** - No alternatives?
5. Document contract:
   - **Contract Reference** - Contract number
   - **Contract Start/End** - Dates
   - **Annual Cost** - Cost
   - **SLA Details** - Service levels
6. Document data handling:
   - **Data Processed** - Types of data
   - **Data Location** - Where stored
   - **Compliance Certifications** - Vendor certs
7. Plan contingency:
   - **Alternative Providers** - Backup options
   - **Exit Strategy** - How to exit
   - **Data Recovery Procedure** - Get data back
8. Click **Save**

### Conducting Supplier Assessment

1. Open dependency detail page
2. Click **Assessment** tab
3. Review current status
4. Click **New Assessment**
5. Complete assessment questionnaire
6. Update:
   - **Risk Rating** - Current risk level
   - **Last Assessment Date** - Today
7. Schedule next assessment
8. Click **Save**

---

## Tracking Interested Parties

### Adding an Interested Party

1. Navigate to **Organisation → Interested Parties**
2. Click **Add Party**
3. Fill in basic information:
   - **Party Code** - Unique identifier
   - **Name** - Party name
   - **Party Type** - customer, employee, regulator, etc.
4. Document requirements:
   - **Expectations** - What they expect
   - **Requirements** - Formal requirements
   - **Security Expectations** - Security needs
5. Analyse stakeholder:
   - **Power Level** - high, medium, low
   - **Interest Level** - high, medium, low
   - **Influence Level** - Influence rating
6. Plan engagement:
   - **Engagement Strategy** - How to engage
   - **Communication Method** - Channel
   - **Communication Frequency** - How often
7. Document ISMS relevance:
   - **ISMS Relevance** - How affects ISMS
8. Click **Save**

### Using the Power/Interest Matrix

Categorise parties based on power and interest:

| Quadrant | Power | Interest | Strategy |
|----------|-------|----------|----------|
| **Manage Closely** | High | High | Regular engagement, involve in decisions |
| **Keep Satisfied** | High | Low | Keep informed, address concerns |
| **Keep Informed** | Low | High | Regular updates, consult on changes |
| **Monitor** | Low | Low | Minimal effort, periodic check |

---

## Monitoring Context Issues

### Adding a Context Issue

1. Navigate to **Organisation → Context Issues**
2. Click **Add Issue**
3. Fill in basic information:
   - **Issue Code** - Unique identifier
   - **Issue Type** - internal or external
   - **Category** - technological, regulatory, etc.
   - **Title** - Short title
   - **Description** - Full description
4. Assess impact:
   - **Impact Type** - Type of impact
   - **Impact Level** - high, medium, low
   - **Likelihood** - Probability
5. Document ISMS relevance:
   - **ISMS Relevance** - How affects ISMS
   - **Affected Areas** - Areas impacted
   - **Control Implications** - Control considerations
6. Plan response:
   - **Response Strategy** - How addressing
   - **Mitigation Actions** - Specific actions
7. Set monitoring:
   - **Monitoring Frequency** - How often reviewed
   - **Next Review Date** - When to review
8. Click **Save**

### Reviewing Context Issues

1. Navigate to **Organisation → Context Issues**
2. Filter by **Next Review Date** to find due reviews
3. Open issue
4. Click **Review**
5. Update:
   - **Trend Direction** - improving, stable, worsening
   - **Status** - active, resolved, monitoring
   - **Last Review Date** - Today
   - **Next Review Date** - Schedule next
6. Update mitigation actions if needed
7. Click **Save**

### Escalating to Risk Register

1. Open context issue
2. Click **Escalate to Risk**
3. Confirm escalation
4. System creates linked risk
5. Issue marked as escalated

---

## Running Security Committees

### Setting Up a Committee

1. Navigate to **Organisation → Security Committees**
2. Click **Add Committee**
3. Fill in:
   - **Name** - Committee name
   - **Committee Type** - steering, operational, risk
   - **Description** - Purpose
   - **Chair** - Select chair person
   - **Meeting Frequency** - How often meets
4. Click **Save**

### Adding Committee Members

1. Open committee detail page
2. Click **Members** tab
3. Click **Add Member**
4. Fill in:
   - **User** - Select member
   - **Role** - Their role on committee
   - **Voting Rights** - Can they vote?
   - **Responsibilities** - Specific duties
5. Click **Save**

### Scheduling a Meeting

1. Open committee detail page
2. Click **Meetings** tab
3. Click **Schedule Meeting**
4. Fill in:
   - **Title** - Meeting title
   - **Meeting Type** - regular, extraordinary, emergency
   - **Date** - Meeting date
   - **Start/End Time** - Duration
   - **Location Type** - virtual, physical, hybrid
   - **Virtual Link** or **Physical Location**
5. Add agenda items
6. Click **Save**

### Conducting a Meeting

1. Open meeting detail page
2. Click **Start Meeting**
3. Record attendance:
   - Mark each member present/absent/excused
   - Record arrival/departure times
4. Verify quorum achieved
5. Follow agenda
6. Record minutes in **Minutes** field
7. Click **Save** periodically

### Recording Decisions

1. During or after meeting
2. Click **Add Decision**
3. Fill in:
   - **Decision Number** - Reference
   - **Title** - Decision title
   - **Description** - Full details
   - **Decision Type** - policy, procedure, resource, risk
   - **Rationale** - Why decided
4. Record voting:
   - **Vote Type** - majority, unanimous, consensus
   - **Votes For/Against/Abstain** - Counts
5. Assign implementation:
   - **Responsible Party** - Who implements
   - **Implementation Deadline** - Due date
6. Click **Save**

### Creating Action Items

1. During or after meeting
2. Click **Add Action Item**
3. Fill in:
   - **Action Number** - Reference
   - **Title** - Action title
   - **Description** - Full details
   - **Assigned To** - Who does it
   - **Priority** - high, medium, low
   - **Due Date** - When due
4. Click **Save**

### Tracking Action Items

1. Navigate to **Organisation → Action Items**
2. View all open actions
3. Filter by:
   - **Assigned To** - Your actions
   - **Due Date** - Overdue items
   - **Status** - Open, in progress
4. Open action item
5. Update:
   - **Status** - Update progress
   - **Progress Percentage** - Completion %
   - **Last Update Notes** - What's done
6. When complete:
   - Set **Status** to Completed
   - Add **Completion Notes**
   - Set **Completion Date**
7. Click **Save**

### Completing a Meeting

1. Open meeting detail page
2. Ensure all recorded:
   - Attendance
   - Minutes
   - Decisions
   - Action items
3. Click **Complete Meeting**
4. Meeting status changes to Completed
5. Schedule next meeting if needed

---

## Tracking Applicable Frameworks

### Adding a Framework

1. Navigate to **Organisation → Applicable Frameworks**
2. Click **Add Framework**
3. Fill in:
   - **Framework Code** - Unique code (e.g., ISO27001)
   - **Name** - Full name
   - **Framework Type** - standard, regulation, framework
   - **Version** - Current version
4. Assess applicability:
   - **Is Applicable** - Does it apply?
   - **Applicability Reason** - Why it applies
   - **Applicability Date** - When became applicable
5. Track compliance:
   - **Compliance Status** - Current state
   - **Compliance Percentage** - Progress
   - **Last Assessment Date** - When assessed
   - **Next Assessment Date** - When to reassess
6. If certifiable:
   - **Is Certifiable** - Can be certified
   - **Certification Status** - Current state
   - **Certification Body** - Certifier
   - **Certificate Number** - Reference
   - **Certification Date** - When achieved
   - **Certification Expiry** - When expires
7. Document requirements:
   - **Key Requirements** - Main requirements
8. Click **Save**

### Conducting Regulatory Eligibility Survey

1. Navigate to **Organisation → Regulatory Eligibility**
2. Select framework to assess
3. Click **Start Survey**
4. Answer eligibility questions
5. System determines applicability
6. Review result
7. Click **Complete Survey**
8. Framework applicability updated

---

## Common Workflows

### Annual ISMS Review Workflow

```
1. Review Organisation Profile
   └── Update scope if changed
   └── Verify certification dates
   
2. Review Context Issues
   └── Update all issues
   └── Add new issues
   └── Close resolved issues
   
3. Review Interested Parties
   └── Update requirements
   └── Add new parties
   └── Remove obsolete parties
   
4. Review Applicable Frameworks
   └── Update compliance status
   └── Check for new regulations
   
5. Conduct Management Review
   └── Schedule committee meeting
   └── Present review findings
   └── Record decisions
   └── Create action items
```

### New Supplier Onboarding Workflow

```
1. Create External Dependency record
2. Conduct initial risk assessment
3. Document contract details
4. Verify compliance certifications
5. Define SLA requirements
6. Document exit strategy
7. Schedule periodic reviews
```

### Incident Response Workflow (Organisation Context)

```
1. Identify affected department(s)
2. Notify department head
3. Engage security champion
4. Escalate to committee if major
5. Record decisions made
6. Create action items for remediation
7. Update context issues if systemic
```
