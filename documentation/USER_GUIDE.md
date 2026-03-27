# RiskReady Community Edition -- User Guide

This guide covers the day-to-day use of RiskReady Community Edition, an open-source Governance, Risk, and Compliance (GRC) platform. It is written for GRC practitioners, CISOs, compliance officers, and anyone who works within the web interface on a regular basis.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Navigation](#navigation)
3. [Executive Dashboard](#executive-dashboard)
4. [Risk Management](#risk-management)
5. [Control Management](#control-management)
6. [Policy Management](#policy-management)
7. [Incident Management](#incident-management)
8. [Audit Management](#audit-management)
9. [Evidence Management](#evidence-management)
10. [ITSM / Asset Management](#itsm--asset-management)
11. [Organisation Management](#organisation-management)
12. [Settings](#settings)
13. [AI Action Queue (MCP Approvals)](#ai-action-queue-mcp-approvals)
14. [Common UI Patterns](#common-ui-patterns)

---

## Getting Started

### Logging In

Open your browser and navigate to your configured deployment URL. The default for local installations is `http://localhost:9380`.

On first login, use the administrator credentials that were set during deployment via the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables in the `.env` file. Enter your email and password on the sign-in screen, then select **Sign in**.

If your credentials are correct you will be redirected to the Executive Dashboard. If you were trying to reach a specific page before being redirected to login, the application will return you to that page automatically.

### Session Management

Your session persists across browser tabs. To sign out, open the user menu in the top-right corner of the header bar and select **Log out**. You will be returned to the sign-in screen.

---

## Navigation

RiskReady uses a two-tier navigation system designed to keep you oriented as you move between modules and within them.

### Primary Sidebar (Left)

The primary sidebar is always visible on desktop. It is organized into four groups:

| Group | Modules |
|---|---|
| **Overview** | Dashboard |
| **Risk & Compliance** | Risk Management, Control Management, Policies & Compliance, Audit Management |
| **Operations** | ITSM / CMDB, Incidents |
| **Governance** | Organisation, Evidence Center |

At the bottom of the primary sidebar you will find links to the **AI Action Queue** and **Settings**, along with the current version indicator.

The primary sidebar can be collapsed by clicking the chevron icon in its header. When you navigate into any module, the primary sidebar auto-collapses to make room for the module sidebar.

### Module Sidebar (Secondary)

Each module provides its own secondary sidebar with module-specific navigation. This appears to the right of the primary sidebar when you are within a module. The module sidebar groups pages by function (for example, "Overview," "Management," "Compliance") so you can move between a module's dashboard, registers, and configuration pages without returning to the top level.

### Top Header Bar

The header bar spans the top of every page and provides:

- **Global Search** -- Click the search bar or press `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) to open the command palette. Search for controls, capabilities, and other records across the platform.
- **Notifications** -- The bell icon shows a dropdown with recent alerts such as critical risk events, upcoming audit deadlines, and resolved incidents.
- **User Menu** -- Your avatar and role appear on the right. The dropdown provides access to profile settings, organization management, and sign-out.

### Mobile Navigation

On smaller screens the primary sidebar is hidden and accessible via the hamburger menu icon in the top-left corner, which opens the sidebar in a slide-over panel.

---

## Executive Dashboard

**Route:** `/dashboard`

The Executive Dashboard provides a consolidated view of your organization's security posture. It is the first screen you see after login.

### What You Will Find

- **Risk Score Gauge** -- A single composite score representing overall organizational risk, displayed as a visual gauge.
- **Metrics Overview** -- Key performance indicators across all modules: open risks, control effectiveness, pending incidents, compliance status, and more.
- **Executive Insights** -- AI-generated or curated observations about your current risk posture and areas requiring attention.
- **Risk Trend Chart** -- Historical view of risk levels over time, helping you identify whether risk is trending up or down.
- **Compliance Chart** -- Framework compliance percentages across your applicable standards.
- **Module Cards** -- Quick-access cards for each module showing summary statistics and direct links.
- **Recent Activity** -- A feed of the latest actions taken across the platform.
- **Upcoming Tasks** -- Deadlines, reviews, and action items that need your attention.

Use the **Last 30 days** date filter to adjust the reporting period, and the **Export** button to download a summary report.

---

## Risk Management

**Route:** `/risks`

The Risk Management module handles the full risk lifecycle: identification, assessment, treatment, and monitoring.

### Module Sidebar Navigation

| Section | Pages |
|---|---|
| **Overview** | Dashboard, Risk Register |
| **Management** | Treatment Plans, Tolerance Statements |

### Risk Dashboard

**Route:** `/risks`

The dashboard provides an at-a-glance view of your risk landscape:

- **Summary Statistics** -- Total risks, risks by status (Identified, Assessed, Treating, Accepted, Closed), and distribution by tier (Core, Extended, Advanced).
- **Risk Heatmap** -- A 5x5 matrix plotting risks by likelihood (Rare through Almost Certain) and impact (Negligible through Severe). Color-coded cells indicate severity: green (low), amber (medium), orange (high), red (critical).
- **KRI Dashboard** -- Key Risk Indicators with RAG status (Red/Amber/Green), trend direction (Improving, Stable, Declining, New), and current values.
- **Treatment Plan Statistics** -- Progress of active treatment plans across all strategies.
- **Top Risks** -- A ranked table of risks requiring the most attention.

### Risk Register

**Route:** `/risks/register`

The Risk Register is a filterable table of all risks in the system. From here you can:

- **Search and filter** risks by status, tier, risk level, owner, or category.
- **Create a new risk** by clicking the "New Risk" button (navigates to `/risks/register/new`).
- **Open a risk** by clicking its row to view its detail page.
- **Export** the register to Excel, CSV, or PDF using the export menu.

### Risk Detail Page

**Route:** `/risks/:id`

Each risk has a comprehensive detail page with multiple tabs:

- **Overview** -- Risk title, description, category, tier, owner, current status, inherent and residual risk scores, and tolerance status (Within, Exceeds, or Critical).
- **Scenarios** -- Each risk can have multiple scenarios. Scenarios are scored using a 5x5 risk matrix (likelihood x impact) and follow an 11-state lifecycle: Draft, Assessed, Evaluated, Treating, Treated, Accepted, Monitoring, Escalated, Review, Closed, Archived. You can create new scenarios, edit existing ones, and transition them through workflow states.
- **Controls** -- Controls linked to the risk's scenarios, showing their effectiveness in mitigating the risk.
- **History** -- A full audit trail of changes to the risk record.

You can edit risk properties, enable/disable a risk, and manage its lifecycle from action buttons on the detail page.

### Risk Scenarios

**Route:** `/risks/scenarios/:id`

Scenarios represent specific ways a risk could materialize. Each scenario detail page shows:

- **Assessment** -- Likelihood and impact ratings using a 5x5 risk matrix. Likelihood is set manually as one of five levels (Rare, Unlikely, Possible, Likely, Almost Certain) mapped to scores 1--5. Impact is set manually as one of five levels (Negligible, Minor, Moderate, Major, Severe) mapped to scores 1--5. The inherent risk score is the product of likelihood and impact (range 1--25). The residual risk score is calculated automatically from the effectiveness of linked controls.
- **Linked Controls** -- Controls that mitigate this scenario, with their current effectiveness.
- **Treatment Plans** -- Active treatment plans addressing this scenario.
- **Workflow Sidebar** -- Current state in the scenario lifecycle with available transitions (for example, moving a scenario from "Assessed" to "Treating").

### Treatment Plans

**Route:** `/risks/treatments`

Treatment Plans define how risks will be addressed. The list page shows all plans with their status, strategy, priority, and linked risk.

Each treatment plan has:

- **Strategy** -- One of five approaches: Mitigate, Transfer, Accept, Avoid, or Share.
- **Status Lifecycle** -- Draft, Proposed, Approved, In Progress, Completed, On Hold, or Cancelled.
- **Priority** -- Critical, High, Medium, or Low.
- **Action Items** -- Individual tasks within the plan, each with their own status (Not Started, In Progress, Completed, Blocked, Cancelled), assignee, and due date.
- **Progress Tracking** -- Overall completion percentage based on action item status.

Create new treatment plans from the list page or directly from a risk's detail page.

### Risk Tolerance Statements

**Route:** `/risks/tolerance`

Risk Tolerance Statements (RTS) define the acceptable level of risk for specific domains or categories within your organization. They establish the thresholds against which risk scores are compared to determine tolerance status.

Each statement follows an approval workflow: Draft, Pending Approval, Approved, Active, Superseded, or Retired.

Tolerance levels range from Very Low to Very High, and each level maps to numeric thresholds used in the scoring model.

---

## Control Management

**Route:** `/controls`

The Control Management module manages your security and compliance controls, assessments, and Statement of Applicability.

### Module Sidebar Navigation

| Section | Pages |
|---|---|
| **Command Center** | Dashboard, Controls Library |
| **Compliance** | Statement of Applicability, Assessments, Scope Registry |

### Command Center Dashboard

**Route:** `/controls`

The Command Center is a live operational dashboard for control management:

- **Quick Stats** -- Total controls, implementation rates, and assessment coverage at a glance.
- **Framework Health** -- Compliance status broken down by framework (ISO 27001, SOC 2, NIS2, DORA) and by theme (Organisational, People, Physical, Technological).
- **Effectiveness Summary** -- Aggregated results from the latest effectiveness assessments, showing the percentage of controls that pass, partially pass, or fail testing.
- **Gap Analysis** -- Controls with FAIL or PARTIAL test results that need remediation attention.
- **Needs Attention** -- A prioritized list of controls requiring action, such as those with failed tests, missing evidence, or overdue assessments.
- **Activity Feed** -- Recent changes to controls, assessments, and SOA entries.

The page header includes an **Export** menu supporting Excel, CSV, and PDF output, as well as an **Import** option.

### Controls Library

**Route:** `/controls/library`

The Controls Library is the central register of all security controls. You can:

- **Filter** by theme (Organisational, People, Physical, Technological), framework (ISO, SOC2, NIS2, DORA), implementation status (Not Started, Partial, Implemented), and applicability.
- **Search** by control ID or name.
- **Create a new control** by clicking the "New Control" button.
- **Open a control** to view its detail page.

### Control Detail Page

**Route:** `/controls/:controlId`

Each control record includes:

- **General Information** -- Control ID (for example, "A.5.1"), name, description, theme, framework, source standard, and implementation status.
- **Implementation Status** -- Current state (Not Started, Partial, Implemented) with a description of how the control is implemented.
- **Assessment Results** -- Results from the most recent assessment tests, including pass/fail outcomes and findings.
- **Evidence** -- Linked evidence items that demonstrate the control's operation.
- **Compliance Mappings** -- Cross-references to applicable frameworks and regulatory requirements.
- **Metrics** -- Key metrics associated with the control, including RAG status, trend, and measurement history.
- **History** -- Audit trail of all changes.

### Assessments

**Route:** `/controls/assessments`

Assessments are structured testing campaigns that evaluate control effectiveness.

**Assessment List** shows all assessments with their reference ID, title, status, planned dates, and test statistics.

**Creating an Assessment** (`/controls/assessments/new`):

1. Provide a title, reference ID, and description.
2. Define the assessment period (start and end dates).
3. Select controls to include in scope.
4. Add scope items (applications, locations, platforms, etc.) that define what is being tested.
5. Assign a lead tester and reviewer.

**Assessment Detail** (`/controls/assessments/:id`) shows:

- **Scope** -- Controls and scope items included in the assessment.
- **Tests** -- Individual test cases generated for each in-scope control. Each test has a status (Pending, In Progress, Completed, Skipped) and a result (Pass, Partial, Fail, Not Tested, Not Applicable).
- **Statistics** -- Completion percentage, pass/fail distribution, and overdue test count.
- **Team** -- Lead tester, reviewer, and individual test assignments.

**Assessment Workflow:**

| Transition | Description |
|---|---|
| Draft | Initial setup and scoping |
| In Progress | Testing underway |
| Under Review | All tests complete, reviewer evaluating results |
| Completed | Review finished, results finalized |
| Cancelled | Assessment abandoned |

For each test, testers record a result, findings, recommendations, root cause analysis (for failures), and remediation effort estimates. Results can be: Pass, Partial, Fail, or Not Applicable.

### Statement of Applicability (SOA)

**Route:** `/controls/soa`

The Statement of Applicability documents which controls are applicable to your organization and their implementation status. This is a key artifact for ISO 27001 certification.

- **SOA List** -- View all SOA versions with their status, approval information, and entry counts.
- **Create SOA** (`/controls/soa/new`) -- Create a new SOA version, optionally pre-populated from your control library.
- **SOA Detail** (`/controls/soa/:id`) -- View all entries showing each control's applicability decision, justification (if not applicable), and implementation status.

**SOA Approval Workflow:**

| Status | Description |
|---|---|
| Draft | Being prepared, entries can be edited |
| Pending Review | Submitted for review |
| Approved | Formally approved, becomes the active SOA |
| Superseded | Replaced by a newer version |

When a new SOA version is approved, any previously approved version is automatically superseded.

### Scope Registry

**Route:** `/controls/scope`

The Scope Registry defines the items that can be included in assessment scope. These represent the concrete things being tested:

- **Applications** -- Software systems and platforms.
- **Asset Classes** -- Categories of IT assets.
- **Locations** -- Physical sites and offices.
- **Personnel Types** -- Roles and user categories.
- **Business Units** -- Organizational divisions.
- **Platforms** -- Infrastructure platforms.
- **Providers** -- Third-party service providers.
- **Network Zones** -- Network segments and security zones.
- **Processes** -- Business and IT processes.

Each scope item has a code, name, description, criticality level (Critical, High, Medium, Low), and active/inactive status.

---

## Policy Management

**Route:** `/policies`

The Policy Management module provides full document lifecycle management for your governance documentation.

### Module Sidebar Navigation

| Section | Pages |
|---|---|
| **Overview** | Dashboard |
| **Document Management** | All Documents, Document Hierarchy, Version History, Reviews |
| **Governance** | Pending Approvals, Change Requests, Exceptions |
| **Compliance** | Acknowledgments, Control Mappings |

### Policies Dashboard

**Route:** `/policies`

The dashboard shows summary statistics for your document portfolio: counts by status (Published, Pending, Overdue, Draft), upcoming review deadlines, and pending approval actions.

### All Documents

**Route:** `/policies/documents`

The document list displays all policy documents with their title, type, status, owner, classification, and review dates.

**Document Types** (9 types organized in a hierarchy):

| Level | Type | Purpose |
|---|---|---|
| Level 1 | Policy | Strategic direction and intent |
| Level 2 | Standard | Specific requirements |
| Level 3 | Procedure | Operational steps |
| Level 4 | Work Instruction | Detailed task guidance |
| Supporting | Form | Data collection templates |
| Supporting | Template | Reusable document templates |
| Supporting | Checklist | Step-by-step verification lists |
| Advisory | Guideline | Recommended practices |
| Evidence | Record | Documented evidence of activities |

**Document Status Lifecycle:**

Draft --> Pending Review --> Pending Approval --> Approved --> Published --> Under Revision --> Superseded/Retired/Archived

**Creating and Editing Documents** (`/policies/documents/new` or `/policies/documents/:id/edit`):

The document editor allows you to compose structured documents with sections, definitions, and process steps. Each document has:

- Title, document ID, type, and classification level (Public, Internal, Confidential, Restricted).
- Owner and approver assignments.
- Review frequency (Monthly, Quarterly, Semi-Annual, Annual, Biennial, Triennial, On Change, As Needed).
- Structured content sections.
- Parent document reference (to establish the hierarchy).

### Document Hierarchy

**Route:** `/policies/hierarchy`

A visual tree showing the parent-child relationships between documents. Policies sit at the top, with Standards, Procedures, and Work Instructions branching below them. This view helps you verify that your documentation structure is complete and properly linked.

### Version History

**Route:** `/policies/versions`

A chronological list of all document versions across the portfolio, showing what changed, who changed it, and the type of change (Initial, Minor Update, Clarification, Enhancement, Correction, Regulatory Update, Major Revision, Restructure).

### Reviews

**Route:** `/policies/reviews`

Scheduled and triggered reviews for documents. Each review record shows:

- Review type (Scheduled, Triggered, Audit Finding, Incident Response, Regulatory Change, Request).
- Due date and completion status.
- Overdue tracking with visual indicators.

Reviews ensure documents remain current and aligned with organizational needs.

### Pending Approvals

**Route:** `/policies/approvals`

A queue of documents awaiting approval at various levels: Board, Executive, Senior Management, Management, Team Lead, or Process Owner. Approvers can review, approve, or reject documents from this page.

Approval workflows support multi-step sequential approval with delegation capabilities.

### Change Requests

**Route:** `/policies/changes`

Formal change requests for existing documents. Change requests capture the rationale for change, the proposed modifications, and follow their own review and approval process. This provides a documented audit trail for all document modifications.

### Exceptions

**Route:** `/policies/exceptions`

Policy exceptions grant time-limited deviations from established policies. Each exception records:

- The policy and specific requirement being excepted.
- Justification for the exception.
- Compensating controls put in place.
- Start and end dates for the exception period.
- Approval status.

Exceptions ensure that when policies cannot be followed, the deviation is formally documented and managed.

### Acknowledgments

**Route:** `/policies/acknowledgments`

Track which personnel have acknowledged and confirmed their understanding of specific documents. From this page you can:

- View acknowledgment status by document and person.
- Send reminders to individuals who have not yet acknowledged a document.
- Monitor overall acknowledgment completion rates.

### Control Mappings

**Route:** `/policies/mappings`

Link policy documents to controls with relationship types that define how the document relates to the control:

- **Implements** -- The document directly implements the control.
- **Supports** -- The document supports the control's operation.
- **References** -- The document references the control.
- **Evidences** -- The document serves as evidence for the control.

These mappings provide traceability between your documentation and your control framework.

---

## Incident Management

**Route:** `/incidents`

The Incident Management module handles security incident response, tracking, and lessons learned.

### Module Sidebar Navigation

| Section | Pages |
|---|---|
| **Overview** | Dashboard, Incident Register, Report Incident |
| **Learning** | Lessons Learned |

### Incidents Dashboard

**Route:** `/incidents`

An overview of current incident activity: open incident count by severity, recent incidents, response time metrics, and trend information.

### Incident Register

**Route:** `/incidents/register`

A filterable table of all incidents. Filter by status, severity, category, or source. Each row shows the incident reference, title, severity, status, category, and key dates.

### Reporting an Incident

**Route:** `/incidents/new`

Create a new incident record by providing:

- **Title and Description** -- What happened.
- **Severity** -- Critical, High, Medium, or Low.
- **Category** (11 types) -- Malware, Phishing, Denial of Service, Data Breach, Unauthorized Access, Insider Threat, Physical, Supply Chain, System Failure, Configuration Error, or Other.
- **Source** -- How the incident was detected: SIEM, User Report, Threat Intel, Automated, Third Party, Regulator, Vulnerability Scan, Penetration Test, or Other.
- **CIA Impact Flags** -- Whether Confidentiality, Integrity, and/or Availability were impacted, and the nature of that impact (Compromised, Affected, At Risk).
- **Regulatory Flags** -- NIS2 significant incident flag and DORA major incident flag for incidents that trigger regulatory reporting obligations.
- **Visibility** -- Internal, Management, Regulator, or Public.

### Incident Detail Page

**Route:** `/incidents/:id`

The incident detail page presents comprehensive incident information across multiple tabs:

- **Overview** -- Severity, status, category, source, CIA impact flags, regulatory flags, dates, assigned personnel, and resolution information.
- **Timeline** -- A chronological record of incident progression including status changes, actions taken, communications, evidence collected, escalations, findings, classification changes, and notifications sent. Each entry is timestamped and attributed to the person who recorded it.
- **Evidence** -- Forensic evidence collected during the investigation with chain of custody tracking. Evidence types include logs, screenshots, memory dumps, disk images, network captures, malware samples, emails, documents, and other artifacts.
- **Communications** -- Outbound communications related to the incident.
- **Lessons Learned** -- Structured observations and recommendations captured during or after the post-incident review.
- **Notifications** -- Regulatory notification tracking, particularly important for NIS2 (24-hour early warning, 72-hour initial notification, 1-month final report) and DORA major incident reporting.

**Incident Status Lifecycle:**

Detected --> Triaged --> Investigating --> Containing --> Eradicating --> Recovering --> Post-Incident --> Closed

**Resolution Types:** Resolved, False Positive, Accepted Risk, Duplicate, or Transferred.

### Lessons Learned

**Route:** `/incidents/lessons`

A dedicated view of all lessons learned across incidents. Categories include Detection, Response, Communication, Technical, Process, Training, and Third Party. Use this page to identify systemic issues and drive improvement across your incident response capability.

---

## Audit Management

**Route:** `/audits`

The Audit Management module tracks nonconformities discovered through audits, tests, and self-assessments, along with their corrective action plans.

### Module Sidebar Navigation

| Section | Pages |
|---|---|
| **Overview** | Dashboard |
| **Nonconformities** | NC Register |

### Audits Dashboard

**Route:** `/audits`

Summary statistics on open nonconformities, severity distribution, corrective action plan status, and verification outcomes.

### Nonconformity Register

**Route:** `/audits/nonconformities`

The Nonconformity (NC) Register lists all findings. Each NC has:

- **NC ID** -- A sequential reference (for example, NC-2025-001).
- **Source** -- Where the finding originated:
  - Test (from control effectiveness test failure)
  - Internal Audit
  - External Audit
  - Certification Audit
  - Incident
  - Self-Assessment
  - Management Review
  - Surveillance Audit
  - ISRA Gap Analysis
- **Severity** -- Major (absence or total breakdown of a control), Minor (isolated or occasional failure), or Observation (opportunity for improvement).
- **Category** -- Control Failure, Documentation, Process, Technical, Organizational, Training, or Resource.
- **ISO Clause Reference** -- The relevant ISO 27001 clause (for example, "A.5.2" or "Clause 6.1").
- **Status** -- The NC follows a managed lifecycle:

| Status | Description |
|---|---|
| Draft | Auto-created, pending manual review |
| Open | Reviewed and confirmed |
| In Progress | Corrective action underway |
| Awaiting Verification | CAP complete, awaiting effectiveness check |
| Verified Effective | Verification confirms the fix works |
| Verified Ineffective | Verification shows the issue persists (NC is reopened) |
| Closed | Verified and formally closed |
| Rejected | Determined not to be a real nonconformity |

### Nonconformity Detail Page

**Route:** `/audits/nonconformities/:id`

The detail page shows the full NC record including:

- Identification details (date raised, source, source reference, ISO clause).
- Classification (severity, category, status).
- **Corrective Action Plan (CAP)** -- The plan to address the nonconformity. CAPs have their own workflow:

| CAP Status | Description |
|---|---|
| Not Required | Observation-level findings that do not need a formal plan |
| Not Defined | NC opened but CAP not yet created |
| Draft | CAP being written, can be edited freely |
| Pending Approval | Submitted for management review |
| Approved | Plan approved, work can begin |
| Rejected | Plan needs revision |

- **Verification** -- After CAP completion, the effectiveness of the corrective action is verified. If found ineffective, the NC is reopened for further action.

---

## Evidence Management

**Route:** `/evidence`

The Evidence Center is the central repository for all compliance evidence across RiskReady modules.

### Module Sidebar Navigation

| Section | Pages |
|---|---|
| **Overview** | Dashboard, Repository |
| **Workflow** | Requests, Pending Review, Approved |
| **Discovery** | Search, Linked Entities |
| **Analytics** | Coverage Report, Expiring Soon, Archive |

### Evidence Dashboard

**Route:** `/evidence`

Summary metrics on evidence volume, status distribution, upcoming expirations, and coverage gaps.

### Evidence Repository

**Route:** `/evidence/repository`

The main evidence register. Browse, search, and filter all evidence items. Each evidence record includes:

- **Evidence Type** (22 types):
  - Documents: Document, Certificate, Report, Policy, Procedure, Screenshot
  - Technical: Log, Configuration, Network Capture, Memory Dump, Disk Image, Malware Sample
  - Communications: Email, Meeting Notes, Approval Record
  - Assessments: Audit Report, Assessment Result, Test Result, Scan Result
  - Other: Video, Audio, Other

- **Status Workflow:**

| Status | Description |
|---|---|
| Pending | Uploaded, awaiting review |
| Under Review | Currently being reviewed |
| Approved | Reviewed and accepted |
| Rejected | Reviewed and not accepted |
| Expired | Past its validity date |
| Archived | Retained but no longer active |

- **Classification** -- Public, Internal, Confidential, or Restricted.
- **Source** -- Manual Upload, Automated (system-generated), External System, or Vendor Provided.
- **Validity Period** -- Start and end dates for evidence validity, with expiry tracking.

### Evidence Detail Page

**Route:** `/evidence/:id`

Full details for a single evidence item, including metadata, linked entities (controls, risks, incidents, assets, policies), review history, and download access.

### Evidence Requests

**Route:** `/evidence/requests`

Formally request evidence from stakeholders. Each request includes:

- The evidence being requested and its purpose.
- The assigned stakeholder who should provide it.
- A due date and priority level (Low, Medium, High, Critical).
- Status tracking: Open, In Progress, Submitted, Accepted, Rejected, Cancelled, or Overdue.

### Filtered Views

The module sidebar provides quick-access filtered views:

- **Pending Review** (`/evidence/pending`) -- Evidence awaiting review.
- **Approved** (`/evidence/approved`) -- Approved evidence only.
- **Expiring Soon** (`/evidence/expiring`) -- Evidence approaching its expiration date.
- **Search** (`/evidence/search`) -- Full-text search across all evidence.
- **Linked Entities** (`/evidence/links`) -- Browse evidence by the entities it is linked to.
- **Coverage Report** (`/evidence/coverage`) -- Identify gaps where controls or processes lack supporting evidence.
- **Archive** (`/evidence/archive`) -- Archived evidence items.

---

## ITSM / Asset Management

**Route:** `/itsm`

The ITSM module combines a Configuration Management Database (CMDB) with change management, capacity planning, and data quality monitoring.

### Module Sidebar Navigation

| Section | Pages |
|---|---|
| **Overview** | Dashboard, Data Quality |
| **Asset Management** | Asset Register, New Asset, Critical Assets, Capacity Alerts |
| **Change Management** | Change Register, New Change, Change Calendar, CAB Dashboard, Change Templates, Pending Approval |
| **Capacity Management** | Capacity Plans |

### ITSM Dashboard

**Route:** `/itsm`

High-level operational metrics: total assets, asset distribution by type and criticality, active change requests, upcoming maintenance windows, and capacity status.

### Asset Register

**Route:** `/itsm/assets`

A comprehensive register of all IT assets. Filter by asset type, status, business criticality, data classification, or capacity status.

**Asset Types** (28 types across 6 categories):

| Category | Types |
|---|---|
| **Hardware** | Server, Workstation, Laptop, Mobile Device, Network Device, Storage Device, Security Appliance, IoT Device, Printer, Other Hardware |
| **Software** | Operating System, Application, Database, Middleware |
| **Cloud** | Cloud VM, Cloud Container, Cloud Database, Cloud Storage, Cloud Network, Cloud Serverless, Cloud Kubernetes |
| **Services** | Internal Service, External Service, SaaS Application, API Endpoint |
| **Data** | Data Store, Data Flow |
| **Other** | Other |

**Asset Status Lifecycle:** Planned --> Procurement --> Development --> Staging --> Active --> Maintenance --> Retiring --> Disposed

**Business Criticality:** Critical, High, Medium, or Low.

### Asset Detail Page

**Route:** `/itsm/assets/:id`

Each asset record provides extensive detail across multiple dimensions:

- **Identity** -- Name, asset tag, type, status, owner, description.
- **Technical Details** -- Operating system, IP addresses, hardware specifications.
- **Security Posture** -- Data classification (Public, Internal, Confidential, Restricted), encryption status, vulnerability status, last security assessment.
- **Lifecycle** -- Purchase date, warranty expiry, end-of-life date, disposal information.
- **Financial** -- Purchase cost, monthly cost, depreciation.
- **Capacity** -- CPU, memory, and storage utilization with capacity status (Normal, Warning, Critical, Exhausted).
- **Software** -- Installed software inventory.
- **Relationships** -- Dependencies and connections to other assets (Depends On, Runs On, Hosted On, Connects To, Stores Data On, Protected By, Fails Over To, and more).

### Data Quality Dashboard

**Route:** `/itsm/data-quality`

Monitors the completeness of your asset data. Shows completeness scores per asset field, identifies records with missing critical information, and helps prioritize data cleanup efforts.

### Change Management

**Route:** `/itsm/changes`

The Change Register lists all change requests with their status, type, priority, and scheduled dates.

**Change Types:**

| Type | Description |
|---|---|
| Standard | Pre-approved, low-risk changes that follow a defined template |
| Normal | Requires formal approval through the CAB process |
| Emergency | Urgent changes with expedited approval |

**Change Categories:** Access Control, Configuration, Infrastructure, Application, Database, Security, Network, Backup/DR, Monitoring, Vendor, Documentation, or Other.

**Change Status Lifecycle:**

Drafted --> Submitted --> Pending Approval --> Approved/Rejected --> Scheduled --> Implementing --> In Progress --> Completed/Failed/Rolled Back --> Reviewed

Each change record tracks security impact (Critical, High, Medium, Low, None), affected assets, rollback plans, and approval history.

### Change Calendar

**Route:** `/itsm/changes/calendar`

A monthly calendar view showing all scheduled changes plotted by their implementation window. Use this to identify conflicts, coordinate maintenance windows, and plan around blackout periods.

### CAB Dashboard

**Route:** `/itsm/changes/cab`

The Change Advisory Board (CAB) dashboard shows changes pending approval, recent decisions, and upcoming CAB review items. Approval statuses are Pending, Approved, Rejected, Abstained, or Expired.

### Change Templates

**Route:** `/itsm/change-templates`

Reusable templates for standard, repeatable changes. Templates pre-populate change request fields to ensure consistency and speed up the submission process. Create, view, and manage templates from this page.

### Capacity Plans

**Route:** `/itsm/capacity-plans`

Create and manage capacity plans for infrastructure and services. Each plan tracks current utilization, projected growth, and planned capacity actions. Plan statuses include Draft, Pending Approval, Approved, Active, Completed, and Cancelled.

---

## Organisation Management

**Route:** `/organisation`

The Organisation module captures the organizational context required for ISMS implementation, including structure, governance, people, and regulatory compliance.

### Module Sidebar Navigation

| Section | Pages |
|---|---|
| **Overview** | Dashboard |
| **Structure** | Departments, Locations, Business Processes, External Dependencies, Products & Services, Technology Platforms |
| **Governance** | Security Committees, Committee Meetings, Meeting Decisions, Action Items |
| **People** | Key Personnel, Executive Positions, Security Champions |
| **ISMS Context** | Interested Parties, Context Issues |
| **Organisation** | Organisation Profile |
| **Compliance** | Applicable Frameworks, Regulators, DORA Assessment, NIS2 Assessment |

### Organisation Dashboard

**Route:** `/organisation`

A summary of your organizational setup: department count, location count, active committees, personnel coverage, and compliance framework status.

### Structure

Define the building blocks of your organization:

- **Departments** (`/organisation/departments`) -- Organizational departments with their management structure, headcount, and linked processes.
- **Organisational Units** (`/organisation/organisational-units`) -- Logical organizational groupings.
- **Locations** (`/organisation/locations`) -- Physical sites, offices, and data centers.
- **Business Processes** (`/organisation/processes`) -- Key business processes with their owners, criticality, and dependencies. Each process links to supporting assets and controls.
- **External Dependencies** (`/organisation/dependencies`) -- Third-party services and vendors that your organization depends on.
- **Products & Services** (`/organisation/products-services`) -- What your organization delivers.
- **Technology Platforms** (`/organisation/technology-platforms`) -- The technology platforms underpinning your operations.

Each of these has a list page and a detail page accessible by clicking a specific record.

### Governance

Manage security governance structures and their activities:

- **Security Committees** (`/organisation/security-committees`) -- Define committees with their purpose, charter, membership, and meeting frequency. Each committee has a detail page showing its configuration and linked meetings.
- **Committee Meetings** (`/organisation/committee-meetings`) -- Record meetings with dates, attendees, agendas, and minutes. Track attendance records via the Meeting Attendances page.
- **Meeting Decisions** (`/organisation/meeting-decisions`) -- Formal decisions made during committee meetings, with their rationale and status.
- **Action Items** (`/organisation/meeting-action-items`) -- Tasks assigned during meetings, with owners, due dates, and completion tracking. Each action item has its own detail page for managing progress.

### People

Track key individuals in your security program:

- **Key Personnel** (`/organisation/key-personnel`) -- Individuals with specific security responsibilities.
- **Executive Positions** (`/organisation/executive-positions`) -- Senior management roles relevant to information security (CISO, DPO, CTO, etc.).
- **Security Champions** (`/organisation/security-champions`) -- Designated security advocates within business units.

### ISMS Context (ISO 27001)

Capture the context analysis required by ISO 27001:

- **Interested Parties** (`/organisation/interested-parties`) -- ISO 27001 Clause 4.2. Identify stakeholders, their needs, expectations, and requirements that are relevant to your ISMS.
- **Context Issues** (`/organisation/context-issues`) -- ISO 27001 Clause 4.1. Document internal and external issues that affect your ability to achieve the intended outcomes of your ISMS.

### Organisation Profile

**Route:** `/organisation/profiles`

Record your company information, ISMS scope definition, and current certifications. This serves as the master record for auditors and assessors.

### Compliance

Manage your regulatory landscape:

- **Applicable Frameworks** (`/organisation/applicable-frameworks`) -- Register which compliance frameworks apply to your organization (ISO 27001, SOC 2, NIS2, DORA, etc.) and track their adoption status.
- **Regulators** (`/organisation/regulators`) -- Identify and track the regulatory bodies that oversee your organization.
- **DORA Assessment** (`/organisation/regulatory-eligibility?type=dora`) -- A structured assessment survey to determine your DORA (Digital Operational Resilience Act) eligibility and compliance requirements.
- **NIS2 Assessment** (`/organisation/regulatory-eligibility?type=nis2`) -- A structured assessment survey to determine your NIS2 (Network and Information Security Directive) eligibility and applicable requirements.

---

## Settings

**Route:** `/settings`

The Settings page provides configuration for your workspace.

### Profile

View your current role, MFA status, and active sessions. Access profile management to update personal details.

### Preferences

Configure notification settings, weekly digest delivery, and display mode (dark mode auto-detection).

### Audit Log

View a record of administrative actions taken in the platform.

---

## AI Action Queue (MCP Approvals)

**Route:** `/settings/mcp-approvals`

When the AI assistant proposes changes to your data (creating assessments, updating control statuses, recording test results, etc.), those proposals are placed in the AI Action Queue for human review before execution.

### How It Works

1. The AI assistant analyzes your data and proposes an action (for example, "Mark control A.8.1 as Implemented").
2. The proposal appears in the queue with a **Pending** status.
3. A human reviewer examines the proposal, including the AI's reasoning.
4. The reviewer either **Approves** or **Rejects** the action, optionally adding review notes.
5. Approved actions are executed automatically. Rejected actions are archived with the rejection reason.

### Queue Features

- **Statistics** -- Pending, Approved, Rejected, Executed, and Failed action counts.
- **Filtering** -- Filter by status and module (Controls, Assessments, SOA, Risks, Incidents, Evidence, Policies, Audits, ITSM, Organisation, Metrics, Remediation).
- **Detail Expansion** -- Expand any action to see the full proposed payload, the AI's reasoning, and execution results.
- **Retry** -- Failed actions can be retried after investigating the cause of failure.

### Action Statuses

| Status | Description |
|---|---|
| Pending | Awaiting human review |
| Approved | Approved, pending execution |
| Rejected | Rejected by reviewer |
| Executed | Successfully applied |
| Failed | Execution failed (can be retried) |

---

## Common UI Patterns

RiskReady uses consistent interface patterns throughout the application. Understanding these patterns will help you work efficiently across all modules.

### Data Tables

All register and list pages use the same table component with:

- **Column Sorting** -- Click column headers to sort ascending or descending.
- **Filtering** -- Use the filter controls above the table to narrow results by status, type, severity, or other attributes.
- **Search** -- A text search field for finding records by name, ID, or description.
- **Pagination** -- Navigate between pages of results for large datasets.
- **Export** -- Download table data as Excel, CSV, or PDF via the export menu in the page header.

### Status Badges

Color-coded badges indicate record status throughout the interface:

| Color | Meaning | Examples |
|---|---|---|
| **Green** | Positive / Complete | Approved, Published, Implemented, Pass, Active, Closed |
| **Amber / Yellow** | Intermediate / In Progress | Pending, In Progress, Under Review, Partial |
| **Red** | Negative / Attention Required | Critical, Failed, Rejected, Overdue, Escalated |
| **Blue** | Informational / New | Draft, Assessed, Identified, New |
| **Gray** | Inactive / Archived | Cancelled, Retired, Archived, Not Started |

### Workflow Transitions

Records that follow a lifecycle (risks, incidents, documents, assessments, SOAs, etc.) provide workflow action buttons on their detail pages. Transitions require confirmation via a dialog before they take effect. Available transitions depend on the record's current state -- only valid next states are offered.

### Detail Pages

Detail pages follow a consistent layout:

- **Page Header** -- Record title, status badge, and action buttons (Edit, Delete, workflow transitions).
- **Summary Section** -- Key metadata displayed in a structured grid or card layout.
- **Tabs** -- Multiple tabs for different aspects of the record (Overview, History, Related Items, etc.).
- **Sidebar** -- Some detail pages show a workflow sidebar with the current state, risk scores, or key metrics.

### Audit Trails

Most detail pages include a **History** tab that shows a chronological record of all changes made to that record: who changed what, when, and the old and new values. This provides a complete audit trail for compliance purposes.

### Command Palette

Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) from anywhere in the application to open the global command palette. Search for controls, navigate to pages, and access common actions without using the mouse.

### URL State Synchronization

Filters, active tabs, and search queries are synchronized to the browser URL. This means you can:

- **Bookmark** a filtered view and return to it later.
- **Share** a URL with a colleague and they will see the same filtered state.
- **Use browser back/forward** to navigate between filter states.

### Toast Notifications

Action confirmations and error messages appear as toast notifications in the top-right corner. Success messages appear in green; errors appear in red. These dismiss automatically after a few seconds or can be closed manually.
