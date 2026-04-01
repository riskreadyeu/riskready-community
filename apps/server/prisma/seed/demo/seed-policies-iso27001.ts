import { PrismaClient } from '@prisma/client';
import { DemoContext } from './index';

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

function monthsFromNow(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d;
}

function weeksAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return d;
}

// ============================================
// SEED ISO 27001 POLICIES (18 documents)
// Wave 1: POL-009 to POL-013 (PUBLISHED)
// Wave 2: POL-014 to POL-021 (PUBLISHED)
// Wave 3: STD-005 to STD-009 (PENDING_REVIEW)
// ============================================

export async function seedPoliciesIso27001(prisma: PrismaClient, ctx: DemoContext): Promise<void> {

  // ──────────────────────────────────────────
  // WAVE 1 — Mandatory ISMS Clauses (PUBLISHED)
  // ──────────────────────────────────────────

  const pol009 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-009',
      title: 'Risk Management Methodology',
      documentType: 'PROCEDURE',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'BOARD',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CISO',
      documentOwnerId: ctx.users.ciso,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CEO',
      approverId: ctx.users.admin,
      approvalDate: monthsAgo(3),
      effectiveDate: monthsAgo(3),
      nextReviewDate: monthsFromNow(9),
      purpose: 'Define the methodology for identifying, analysing, evaluating, and treating information security risks across ClearStream Payments in accordance with ISO 27001:2022 Clauses 6.1.2 and 8.2.',
      scope: 'This procedure applies to all information assets, business processes, and supporting infrastructure across ClearStream Payments offices in Dublin, Berlin, and Lisbon. It covers strategic, operational, and project-level risk assessments.',
      content: `## 1. Document Owner

The CISO (Siobhan O'Brien) is the owner of this procedure. The ISMS Manager (Roisin Kelly) is responsible for day-to-day maintenance and facilitation of risk assessments.

## 2. Scope

This methodology governs all information security risk assessment and treatment activities across ClearStream Payments Ltd. It applies to:
- All departments and business units across Dublin (HQ), Berlin, and Lisbon offices
- All information assets including payment processing systems, customer data, intellectual property, and supporting infrastructure
- Third-party services and supply chain risks (in conjunction with POL-005 Third-Party Risk Management Policy)
- New projects, system changes, and business initiatives requiring risk evaluation

## 3. Management Approval

This procedure has been approved by the Board of Directors as part of the ClearStream ISMS. The CEO (Fiona Murphy) has executive authority over risk acceptance decisions for risks rated Critical (score 20-25). The CISO has delegated authority for risks rated High and below.

## 4. Review Cadence

This procedure is reviewed annually or when triggered by:
- A significant information security incident
- Major changes to ClearStream's business operations, technology stack, or threat landscape
- Changes to applicable regulations (PCI DSS, DORA, NIS2, GDPR)
- Results of internal or external audits identifying methodology gaps

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Current | Roisin Kelly | Initial release aligned with ISO 27001:2022 |

## 6. Risk Assessment Methodology

### 6.1 Risk Identification

Risks are identified through:
- Annual comprehensive risk assessment workshops (all department heads)
- Quarterly risk review meetings (Risk Committee)
- Threat intelligence feeds (CERT-EU, PCI SSC, financial sector ISACs)
- Vulnerability assessment results and penetration test findings
- Incident post-mortems and near-miss analyses
- Change impact assessments for new projects and system modifications

### 6.2 Risk Analysis — 5x5 Matrix

ClearStream uses a semi-quantitative 5x5 risk matrix combining likelihood and impact:

**Likelihood Scale:**
| Score | Rating | Frequency |
|-------|--------|-----------|
| 1 | Rare | Less than once in 5 years |
| 2 | Unlikely | Once in 2-5 years |
| 3 | Possible | Once per year |
| 4 | Likely | Multiple times per year |
| 5 | Almost Certain | Monthly or more frequently |

**Impact Scale:**
| Score | Rating | Financial | Regulatory | Operational |
|-------|--------|-----------|------------|-------------|
| 1 | Negligible | <EUR 10K | No regulatory interest | <1 hour downtime |
| 2 | Minor | EUR 10-100K | Regulatory enquiry | 1-4 hours downtime |
| 3 | Moderate | EUR 100K-1M | Formal investigation | 4-24 hours downtime |
| 4 | Major | EUR 1-10M | Enforcement action/fine | 1-7 days downtime |
| 5 | Catastrophic | >EUR 10M | Licence revocation | >7 days downtime |

**Risk Score** = Likelihood x Impact (range 1-25)

### 6.3 Risk Evaluation and Acceptance Criteria

| Risk Score | Rating | Treatment Required | Approval Authority |
|------------|--------|--------------------|--------------------|
| 1-4 | Low | Accept — monitor during quarterly reviews | Risk Owner |
| 5-8 | Medium | Treat — implement controls within 6 months | Department Head |
| 9-15 | High | Treat — implement controls within 3 months | CISO |
| 16-19 | Very High | Treat — implement controls within 1 month | CEO |
| 20-25 | Critical | Treat immediately — escalate to Board | Board of Directors |

**Acceptance threshold: any risk scoring 9 or above requires formal treatment.** Risks below 9 may be accepted with documented justification by the risk owner.

### 6.4 Risk Treatment Options

For each risk requiring treatment, one or more of the following options must be selected:

1. **Modify** — Implement or enhance controls to reduce likelihood and/or impact (most common)
2. **Accept** — Formally accept the residual risk with documented justification (CISO/CEO approval required for scores >= 9)
3. **Avoid** — Eliminate the risk by removing the activity or asset
4. **Share** — Transfer the risk via insurance, outsourcing, or contractual arrangements

### 6.5 Risk Owner Responsibilities

Each identified risk must have a designated risk owner who:
- Accepts accountability for the risk and its treatment
- Ensures treatment actions are implemented within agreed timeframes
- Monitors the effectiveness of implemented controls
- Reports risk status changes to the ISMS Manager for the risk register
- Participates in quarterly risk review meetings

## 7. Risk Appetite Alignment

ClearStream's risk appetite is defined by the Board and reviewed annually:
- **Payment processing availability**: Zero tolerance for unplanned outages exceeding RTO of 4 hours
- **Customer data protection**: Zero tolerance for unauthorised disclosure of payment card data or PII
- **Regulatory compliance**: Low appetite — all identified non-conformities must be remediated within regulatory timeframes
- **Operational risk**: Moderate appetite — accept calculated risks for business innovation provided compensating controls exist
- **Third-party risk**: Low appetite — critical suppliers must maintain ISO 27001 or SOC 2 Type II certification

## 8. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| Board of Directors | Approve risk appetite, accept Critical risks |
| CEO (Fiona Murphy) | Executive risk owner, approve Very High risk acceptance |
| CISO (Siobhan O'Brien) | Risk methodology owner, chair Risk Committee, approve High risk acceptance |
| ISMS Manager (Roisin Kelly) | Facilitate risk assessments, maintain risk register, report to management |
| Risk Analyst (Cian Doyle) | Conduct risk analysis, model scenarios, prepare treatment plans |
| Department Heads | Act as risk owners for departmental risks |
| All Staff | Report potential risks and incidents |

## 9. Exceptions Process

Exceptions to the risk treatment requirements defined in this procedure must be:
1. Submitted via the policy exception process (see POL-001 Section 5)
2. Include a risk assessment of the exception itself
3. Define compensating controls
4. Be approved by the CISO (for High risks) or CEO (for Very High/Critical risks)
5. Be time-limited (maximum 12 months) with mandatory reassessment before renewal

## 10. Awareness Requirements

- All staff must complete annual risk awareness training covering risk identification and reporting
- Risk owners must attend the quarterly risk management workshop
- The ISMS Manager provides monthly risk dashboard updates to the Executive Leadership Team
- Board-level risk reporting is provided quarterly by the CISO`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'risk management', 'risk assessment'],
      keywords: ['risk assessment', 'risk treatment', 'risk methodology', '5x5 matrix'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['POL-009'] = pol009.id;

  const pol010 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-010',
      title: 'Document & Record Control Procedure',
      documentType: 'PROCEDURE',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'INTERNAL',
      approvalLevel: 'SENIOR_MANAGEMENT',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'ISMS Manager',
      documentOwnerId: ctx.users.ismsManager,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: monthsAgo(5),
      effectiveDate: monthsAgo(5),
      nextReviewDate: monthsFromNow(7),
      purpose: 'Establish the procedures for creating, reviewing, approving, distributing, and managing documented information within the ClearStream Payments ISMS, in accordance with ISO 27001:2022 Clause 7.5.',
      scope: 'This procedure applies to all documented information required by the ISMS, including policies, standards, procedures, work instructions, forms, templates, and records across all ClearStream offices.',
      content: `## 1. Document Owner

The ISMS Manager (Roisin Kelly) owns this procedure and is responsible for maintaining the document management system and ensuring all ISMS documentation meets the requirements defined herein.

## 2. Scope

This procedure governs the entire lifecycle of documented information within the ClearStream Payments ISMS, including:
- Policy documents (strategic direction and management intent)
- Standards (mandatory requirements)
- Procedures (operational processes)
- Work instructions (step-by-step task guidance)
- Forms and templates (supporting documentation)
- Records (evidence of activities performed)

It applies to documentation in all formats — electronic and physical — across Dublin, Berlin, and Lisbon offices.

## 3. Management Approval

This procedure is approved by the CISO (Siobhan O'Brien) as part of the ClearStream ISMS documentation framework. Changes to the document hierarchy or naming conventions require CISO approval.

## 4. Review Cadence

This procedure is reviewed annually or when triggered by:
- Changes to ISO 27001 documentation requirements
- Internal or external audit findings related to document control
- Feedback from document authors or reviewers indicating process improvements
- Introduction of new document management tools or systems

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Current | Roisin Kelly | Initial release |

## 6. Document Hierarchy

ClearStream maintains a four-tier document hierarchy:

| Level | Type | Prefix | Approval Authority | Example |
|-------|------|--------|--------------------|---------|
| 1 | Policy | POL-xxx | Board/Executive | POL-001 Information Security Policy |
| 2 | Standard | STD-xxx | Executive/Senior Management | STD-003 Cryptographic Controls Standard |
| 3 | Procedure | PRC-xxx | Senior Management/Management | PRC-001 User Access Review Procedure |
| 4 | Work Instruction | WI-xxx | Management/Team Lead | WI-001 Firewall Rule Change Instructions |

Supporting documents use prefixes: FRM-xxx (Forms), TPL-xxx (Templates), CKL-xxx (Checklists), REC-xxx (Records).

## 7. Document Naming and Numbering

- Document IDs are sequential within their prefix group and never reused
- Titles must be concise, descriptive, and unique within the ISMS
- File names follow the pattern: {ID}_{Title}_{Version}_{Status}.pdf
- Example: POL-001_Information_Security_Policy_v3.0_PUBLISHED.pdf

## 8. Version Control

- **Major versions** (1.0, 2.0): Significant content changes requiring full re-approval
- **Minor versions** (1.1, 1.2): Formatting, clarification, or minor updates — approved by document owner
- Draft versions use the suffix "d" (e.g., v2.0d) and must not be distributed outside the review group
- All version changes are recorded in the document's version history table
- Previous versions are archived and marked SUPERSEDED — never deleted

## 9. Review and Approval Workflow

1. **Drafting**: Author creates or updates the document using the approved template
2. **Peer Review**: At least one subject-matter expert reviews for technical accuracy
3. **Quality Review**: ISMS Manager checks compliance with this procedure (formatting, structure, cross-references)
4. **Approval**: Approving authority signs off based on the document's approval level
5. **Publication**: ISMS Manager publishes to the document management system and notifies affected personnel
6. **Acknowledgment**: Documents flagged as requiring acknowledgment must be acknowledged within the specified deadline

## 10. Distribution and Access Control

- Published documents are available via the RiskReady GRC platform
- Access is controlled based on document classification (as defined in POL-004 Data Classification Policy):
  - PUBLIC: Available to all, including external parties
  - INTERNAL: All ClearStream employees and authorised contractors
  - CONFIDENTIAL: Restricted to named roles and departments
  - RESTRICTED: Named individuals only, with access logging
- Physical copies are minimised; when required, they are stamped "CONTROLLED COPY" with a copy number

## 11. Record Retention

| Record Type | Minimum Retention | Rationale |
|-------------|-------------------|-----------|
| ISMS policies and standards | Life of ISMS + 3 years | ISO 27001 requirement |
| Risk assessments | 7 years | Regulatory (DORA, CBI) |
| Audit reports and findings | 7 years | Regulatory (PCI DSS, CBI) |
| Management review minutes | 7 years | ISO 27001 Clause 9.3 |
| Training records | Duration of employment + 3 years | HR and compliance |
| Incident records | 7 years | Regulatory and legal |
| Change records | 5 years | Operational and audit trail |

All records beyond retention period are securely destroyed in accordance with STD-007 Media Handling & Disposal Procedure.

## 12. Risk Appetite Alignment

ClearStream has low risk appetite for documentation failures that could lead to regulatory non-compliance. All mandatory ISMS documentation must be current, approved, and accessible. Gaps in documentation are treated as audit non-conformities requiring corrective action within 30 days.

## 13. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| ISMS Manager (Roisin Kelly) | Document control process owner, quality reviewer, publication |
| Document Authors | Create and update documents per this procedure |
| Document Owners | Ensure documents remain current, initiate reviews |
| Approving Authorities | Review and approve documents per approval level matrix |
| All Staff | Use only current, published versions; report outdated documents |

## 14. Exceptions Process

Exceptions to document control requirements (e.g., extended review timelines, alternative formats) must be:
1. Requested in writing to the ISMS Manager
2. Include justification and proposed compensating measures
3. Approved by the CISO for policy-level documents or by the document owner for lower-tier documents
4. Recorded in the exceptions register with an expiry date (maximum 6 months)

## 15. Awareness Requirements

- All new employees receive document management orientation during onboarding (within first week)
- Document authors and reviewers complete the "ISMS Documentation Standards" training module annually
- The ISMS Manager circulates a quarterly documentation health report (completion rates, overdue reviews, pending approvals)
- Changes to this procedure are communicated via email and the company intranet`,
      requiresAcknowledgment: false,
      tags: ['ISO 27001', 'document control', 'records management'],
      keywords: ['document control', 'version control', 'records retention', 'document hierarchy'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['POL-010'] = pol010.id;

  const pol011 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-011',
      title: 'Internal Audit Programme',
      documentType: 'PROCEDURE',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'BOARD',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'ISMS Manager',
      documentOwnerId: ctx.users.ismsManager,
      author: 'Compliance Officer',
      authorId: ctx.users.complianceOfficer,
      approvedBy: 'CEO',
      approverId: ctx.users.admin,
      approvalDate: monthsAgo(4),
      effectiveDate: monthsAgo(4),
      nextReviewDate: monthsFromNow(8),
      purpose: 'Establish the internal audit programme for the ClearStream Payments ISMS to provide assurance that the management system conforms to ISO 27001:2022 requirements and is effectively implemented, in accordance with Clause 9.2.',
      scope: 'This procedure covers all internal audits of the ISMS, including audits of ISO 27001 clauses, Annex A controls, and compliance with regulatory requirements (PCI DSS, DORA, NIS2, GDPR) across all ClearStream offices.',
      content: `## 1. Document Owner

The ISMS Manager (Roisin Kelly) is the owner of the Internal Audit Programme. The Compliance Officer (Sofia Ferreira) is the lead internal auditor responsible for audit execution.

## 2. Scope

This programme covers:
- All ISO 27001:2022 clauses (4-10) and Annex A controls
- Regulatory compliance requirements (PCI DSS v4.0, DORA, NIS2 Directive, GDPR)
- Operational processes supporting the ISMS
- All three ClearStream offices: Dublin (HQ), Berlin, and Lisbon
- Third-party managed services within the ISMS scope

The full set of clauses and controls is audited over a rolling 3-year cycle, with high-risk areas and previously non-conforming areas audited annually.

## 3. Management Approval

The Internal Audit Programme is approved by the Board of Directors annually as part of the management review process (see POL-012 Management Review Procedure). The annual audit plan is presented to the Board in January each year.

## 4. Review Cadence

This procedure is reviewed annually or when triggered by:
- Changes to the ISMS scope or applicable regulatory requirements
- Significant audit findings or trends identified across audit cycles
- Changes to ISO 27001 or related standards
- Feedback from management reviews

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Current | Sofia Ferreira | Initial release |

## 6. Audit Programme Structure

### 6.1 Three-Year Cycle

| Year | Focus Areas |
|------|-------------|
| Year 1 (Current) | Clauses 4-6, A.5 (Organisational), A.6 (People), A.7 (Physical), PCI DSS |
| Year 2 | Clauses 7-8, A.8 (Technological), DORA ICT risk management |
| Year 3 | Clauses 9-10, Full Annex A review, NIS2 compliance |

### 6.2 Annual Mandatory Audits

Regardless of the cycle position, the following are audited every year:
- Risk assessment and treatment process (Clause 6.1.2, 8.2)
- Incident management (A.5.24-A.5.28)
- Access control (A.5.15-A.5.18, A.8.1-A.8.5)
- Business continuity (A.5.29-A.5.30)
- Any areas with open non-conformities from previous audits

## 7. Auditor Requirements

### 7.1 Independence

- Internal auditors must not audit their own work or areas of direct responsibility
- The Compliance Officer audits operational areas; external auditors are engaged for compliance-related audits
- A minimum of two qualified auditors are maintained within ClearStream at all times

### 7.2 Competence

- Lead auditors: ISO 27001 Lead Auditor certification (required)
- Audit team members: ISO 27001 Internal Auditor training (minimum)
- Auditors must complete at least 8 hours of CPD per year in audit and information security
- New auditors must shadow a minimum of two audits before leading independently

## 8. Audit Execution Process

### 8.1 Planning

1. Lead auditor develops audit plan including scope, criteria, schedule, and resource requirements
2. Audit plan communicated to auditees at least 2 weeks before the audit
3. Document review completed before on-site activities

### 8.2 Execution

1. Opening meeting with auditees to confirm scope and logistics
2. Evidence gathering through interviews, document review, observation, and sampling
3. Sampling approach: minimum 10% of records or 30 items (whichever is greater) for each control
4. Daily debrief between audit team members to align findings

### 8.3 Finding Classification

| Classification | Definition | Response Timeframe |
|---------------|------------|-------------------|
| Major NC | Absence or total failure of a required element; systemic failure | Corrective action plan within 5 business days; implementation within 30 days |
| Minor NC | Isolated lapse or partial failure of a required element | Corrective action plan within 10 business days; implementation within 60 days |
| Observation | Area of concern that could become a non-conformity if not addressed | Action plan within 30 days; tracked in next audit |
| OFI | Opportunity for improvement — not a failure but could enhance effectiveness | Logged for consideration; no mandatory action |

### 8.4 Reporting

- Draft audit report issued within 5 business days of audit completion
- Auditee has 5 business days to respond to factual accuracy
- Final report issued to ISMS Manager, CISO, and relevant department heads
- Executive summary presented at the next management review (POL-012)

## 9. Corrective Action Tracking

- All non-conformities are logged in the RiskReady GRC platform with assigned owners and due dates
- The ISMS Manager tracks corrective action progress weekly
- Overdue corrective actions are escalated: first to the department head, then to the CISO
- Verification audits are conducted to confirm corrective action effectiveness before closure

## 10. Risk Appetite Alignment

ClearStream has zero tolerance for major non-conformities remaining open beyond 30 days. The Board expects all ISO 27001 clauses to be audited at least once per 3-year cycle. Regulatory audit findings (PCI DSS, DORA) are escalated immediately to the CISO and CFO.

## 11. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| Board of Directors | Approve annual audit programme, review audit results |
| CISO (Siobhan O'Brien) | Audit programme sponsor, escalation point |
| ISMS Manager (Roisin Kelly) | Audit programme owner, corrective action oversight |
| Compliance Officer (Sofia Ferreira) | Lead internal auditor, audit execution |
| Department Heads | Facilitate audits, own corrective actions |
| External Auditors | Independent assurance for certification and regulatory audits |

## 12. Exceptions Process

Exceptions to the audit programme (e.g., deferral of a planned audit) require:
1. Written justification from the ISMS Manager
2. Risk assessment of the deferral impact
3. CISO approval for deferrals up to 3 months; Board approval for longer deferrals
4. Compensating activities (e.g., increased monitoring of the deferred area)

## 13. Awareness Requirements

- All staff are informed of the audit programme and their obligation to cooperate with auditors
- Auditees receive pre-audit briefing on the audit process and their rights
- Audit results (anonymised) are shared at the quarterly all-hands meeting to promote continuous improvement
- Internal auditor training is included in the annual training plan (see POL-013 Competence & Awareness Programme)`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'internal audit', 'compliance'],
      keywords: ['internal audit', 'audit programme', 'non-conformity', 'corrective action'],
      organisationId: ctx.orgId,
      createdById: ctx.users.complianceOfficer,
    },
  });
  ctx.policyIds['POL-011'] = pol011.id;

  const pol012 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-012',
      title: 'Management Review Procedure',
      documentType: 'PROCEDURE',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'BOARD',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CISO',
      documentOwnerId: ctx.users.ciso,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CEO',
      approverId: ctx.users.admin,
      approvalDate: monthsAgo(3),
      effectiveDate: monthsAgo(3),
      nextReviewDate: monthsFromNow(9),
      purpose: 'Define the procedure for conducting management reviews of the ClearStream Payments ISMS to ensure its continuing suitability, adequacy, and effectiveness, in accordance with ISO 27001:2022 Clause 9.3.',
      scope: 'This procedure covers bi-annual management reviews of the ISMS, including review inputs, required attendees, decision-making processes, and action tracking.',
      content: `## 1. Document Owner

The CISO (Siobhan O'Brien) is the owner of this procedure. The ISMS Manager (Roisin Kelly) is responsible for coordinating and facilitating management review meetings.

## 2. Scope

This procedure governs the formal management review of the ClearStream Payments ISMS. It ensures that top management evaluates the performance and effectiveness of the ISMS at planned intervals and makes informed decisions about improvements, resource allocation, and strategic direction.

## 3. Management Approval

This procedure is approved by the Board of Directors. The management review process itself is the primary mechanism through which the Board exercises its oversight of the ISMS.

## 4. Review Cadence

Management reviews are held bi-annually:
- **H1 Review**: June (covering January-June performance)
- **H2 Review**: December (covering July-December performance, plus annual summary)

Additional reviews may be triggered by:
- Major information security incidents affecting ClearStream operations
- Significant changes to the regulatory environment (e.g., new DORA requirements)
- Results of external audits requiring immediate management attention
- Material changes to ClearStream's business model or risk profile

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Current | Roisin Kelly | Initial release |

## 6. Required Attendees

| Role | Name | Attendance |
|------|------|------------|
| CEO | Fiona Murphy | Mandatory — Chair |
| CISO | Siobhan O'Brien | Mandatory — ISMS Presenter |
| CTO | Lars Becker | Mandatory — Technology input |
| CFO | Dieter Schneider | Mandatory — Resource/budget input |
| ISMS Manager | Roisin Kelly | Mandatory — Secretary/Facilitator |
| DPO | Ana Costa | Mandatory — Privacy/GDPR input |
| Compliance Officer | Sofia Ferreira | Advisory — Regulatory input |
| External Auditor | By invitation | Advisory — When audit results are on the agenda |

Quorum requires the CEO, CISO, and at least two other mandatory attendees. If quorum is not met, the review is rescheduled within 2 weeks.

## 7. Review Inputs (ISO 27001 Clause 9.3.2)

The ISMS Manager prepares a management review pack at least 10 business days before the meeting, containing:

1. **Status of actions from previous management reviews** — progress update on all open actions
2. **Changes in external and internal issues** — regulatory changes, threat landscape evolution, business changes
3. **Information security performance** — KPIs including:
   - Incident count and severity trends
   - Risk register summary (new risks, treated risks, accepted risks)
   - Control effectiveness scores
   - Vulnerability management metrics (patch compliance, scan results)
   - Access review completion rates
4. **Stakeholder feedback** — customer security questionnaire results, regulatory communications, supplier assessments
5. **Risk assessment results** — summary of risk assessments conducted, treatment plan status, residual risk profile
6. **Audit results** — internal audit findings, external audit results, certification status (see POL-011)
7. **Fulfilment of information security objectives** — progress against the annual security objectives
8. **Nonconformities and corrective actions** — open NCs, overdue CAs, trend analysis
9. **Monitoring and measurement results** — SIEM metrics, security awareness scores, business continuity test results
10. **Continual improvement opportunities** — proposed improvements, lessons learned, benchmarking insights
11. **Resource adequacy** — headcount, budget utilisation, tool effectiveness, training needs

## 8. Review Outputs (ISO 27001 Clause 9.3.3)

The management review must produce documented decisions on:

1. **Continual improvement opportunities** — approved improvement initiatives with owners and timelines
2. **Need for changes to the ISMS** — scope changes, policy updates, process improvements
3. **Resource needs** — budget approvals, headcount requests, tool procurement
4. **Risk acceptance decisions** — formal acceptance of residual risks above the CISO's delegated authority
5. **Changes to information security objectives** — revised targets where appropriate

## 9. Minutes and Action Tracking

- The ISMS Manager records formal minutes within 3 business days of the meeting
- Minutes include all decisions, actions (with owners and due dates), and key discussion points
- Actions are tracked in the RiskReady GRC platform and reviewed at the next management meeting
- Minutes are classified as CONFIDENTIAL and distributed to attendees and the Board Secretary
- A summary (excluding sensitive details) is shared with department heads within 5 business days

## 10. Risk Appetite Alignment

The management review is the primary forum for the Board to assess whether ClearStream's risk profile remains within the approved risk appetite. The review explicitly evaluates:
- Whether any risks exceed the Board-approved risk appetite thresholds
- Whether the risk treatment plan is adequately resourced
- Whether risk acceptance decisions remain valid given changes in the threat landscape or business context

## 11. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| CEO (Fiona Murphy) | Chair the management review, final decision authority |
| CISO (Siobhan O'Brien) | Present ISMS performance, recommend decisions |
| ISMS Manager (Roisin Kelly) | Prepare review pack, facilitate meeting, record minutes, track actions |
| CTO (Lars Becker) | Provide technology and infrastructure input |
| CFO (Dieter Schneider) | Advise on resource allocation and budget |
| DPO (Ana Costa) | Report on privacy and GDPR-related ISMS aspects |

## 12. Exceptions Process

Postponement of a scheduled management review requires:
1. CEO approval
2. Documented justification
3. Rescheduling within 4 weeks of the original date
4. Notification to the external auditor if the postponement affects the certification timeline

## 13. Awareness Requirements

- All mandatory attendees are briefed on their responsibilities under this procedure during onboarding
- The ISMS Manager sends a preparation checklist to all attendees 3 weeks before each review
- Management review outcomes relevant to the wider organisation are communicated via the quarterly CISO briefing`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'management review', 'governance'],
      keywords: ['management review', 'ISMS review', 'continual improvement', 'board oversight'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['POL-012'] = pol012.id;

  const pol013 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-013',
      title: 'Competence & Awareness Programme',
      documentType: 'PROCEDURE',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'INTERNAL',
      approvalLevel: 'SENIOR_MANAGEMENT',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CISO',
      documentOwnerId: ctx.users.ciso,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: monthsAgo(2),
      effectiveDate: monthsAgo(2),
      nextReviewDate: monthsFromNow(10),
      purpose: 'Ensure that all ClearStream Payments personnel possess the competence required for their roles and are aware of their information security responsibilities, in accordance with ISO 27001:2022 Clauses 7.2 and 7.3.',
      scope: 'This programme applies to all ClearStream employees, contractors, and temporary staff across Dublin, Berlin, and Lisbon offices. It covers competence assessment, training delivery, awareness activities, and effectiveness measurement.',
      content: `## 1. Document Owner

The CISO (Siobhan O'Brien) is the owner of this programme, with support from the HR function. The ISMS Manager (Roisin Kelly) coordinates training delivery and record-keeping.

## 2. Scope

This programme covers:
- Competence requirements for all roles with information security responsibilities
- Mandatory security awareness training for all personnel
- Specialist technical training for the Information Security and Engineering teams
- Phishing simulation and social engineering awareness
- Board-level cyber security briefings
- Training records management and compliance reporting

## 3. Management Approval

This programme is approved by the CISO and presented to the Board annually as part of the management review (see POL-012). The training budget is approved by the CFO as part of the annual information security budget.

## 4. Review Cadence

This programme is reviewed annually or when triggered by:
- Significant changes to ClearStream's technology stack or business processes
- New regulatory requirements affecting competence (e.g., DORA ICT skills requirements)
- Analysis of incident root causes indicating competence gaps
- Results of phishing simulations indicating awareness deficiencies

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Current | Roisin Kelly | Initial release |

## 6. Role-Based Competence Matrix

| Role Category | Required Competencies | Certification/Training |
|--------------|----------------------|----------------------|
| Executive Leadership | Cyber risk governance, regulatory awareness | Board cyber briefing (quarterly) |
| CISO / Security Management | ISMS management, risk assessment, audit | CISSP or CISM, ISO 27001 Lead Implementer |
| Information Security Team | Threat analysis, incident response, control implementation | ISO 27001 Lead Auditor, OSCP/CEH, vendor-specific |
| Software Engineers | Secure coding, threat modelling, OWASP Top 10 | OWASP training, secure code review workshop |
| Infrastructure / DevOps | Secure configuration, network security, cloud security | AWS/Azure security certification, CIS benchmarks |
| Compliance / Legal | Regulatory interpretation, audit facilitation | PCI DSS ISA, GDPR practitioner, DORA awareness |
| All Staff | Security awareness, phishing recognition, incident reporting | Annual awareness training, phishing simulation |

## 7. Mandatory Security Awareness Training

### 7.1 Annual Training

All personnel must complete the ClearStream Security Awareness Training annually. The training covers:
- Information security policy overview (POL-001)
- Data classification and handling (POL-004)
- Acceptable use (POL-002)
- Phishing and social engineering recognition
- Incident reporting procedures (STD-001)
- Physical security responsibilities
- Remote working security
- Password and authentication best practices

**Completion deadline**: Within 30 calendar days of the training becoming available (typically January each year).

### 7.2 New Starter Training

New employees and contractors must complete security awareness training within 30 calendar days of their start date. This includes:
- All modules from the annual training
- ClearStream-specific onboarding: systems access, clean desk policy, visitor procedures
- Role-specific security briefing from their line manager

### 7.3 Phishing Simulation Programme

ClearStream conducts quarterly phishing simulations:
- **Frequency**: Once per quarter, randomised timing
- **Scope**: All personnel with email access
- **Scenarios**: Realistic, evolving scenarios including credential harvesting, malware delivery, and business email compromise
- **Reporting threshold**: Click rate target below 5% (current baseline: 8%)
- **Remediation**: Personnel who click undergo mandatory refresher training within 5 business days
- **Repeat offenders**: Three or more clicks in a rolling 12-month period triggers a meeting with the ISMS Manager and line manager

## 8. Specialist Training

### 8.1 Information Security Team

| Training | Frequency | Target |
|----------|-----------|--------|
| ISO 27001 Lead Implementer/Auditor | Upon hire + refresher every 3 years | ISMS Manager, Compliance Officer |
| CISSP/CISM | Maintained continuously | CISO, Security Lead |
| OSCP/CEH | Upon hire for penetration testers | Security Engineers |
| Incident response tabletop exercises | Bi-annually | Full InfoSec team |
| Threat intelligence briefings | Monthly | Security Lead, SOC analysts |

### 8.2 Engineering Team

| Training | Frequency | Target |
|----------|-----------|--------|
| OWASP Top 10 workshop | Annually | All developers |
| Secure code review training | Annually | Senior developers, code reviewers |
| Threat modelling workshop | Annually | Technical leads, architects |
| Cloud security fundamentals | Upon onboarding + annually | DevOps engineers |

### 8.3 Board-Level Cyber Briefings

The CISO delivers quarterly cyber security briefings to the Board covering:
- Current threat landscape relevant to financial services
- ClearStream security posture and key metrics
- Significant incidents and lessons learned
- Regulatory developments (DORA, NIS2, PCI DSS)
- Strategic security initiatives and investment needs

## 9. Training Records and Metrics

### 9.1 Record Keeping

- All training completions are recorded in the HR system with date, module, and score
- Records are retained for the duration of employment plus 3 years
- Training records are available for audit review at any time

### 9.2 Key Metrics

| Metric | Target | Reporting Frequency |
|--------|--------|-------------------|
| Annual awareness training completion | 100% within 30 days | Monthly until complete |
| New starter training completion | 100% within 30 days | Monthly |
| Phishing simulation click rate | <5% | Quarterly |
| Specialist certification coverage | 100% of required roles | Semi-annually |
| Training satisfaction score | >4.0/5.0 | After each training |

## 10. Risk Appetite Alignment

ClearStream has zero tolerance for personnel in security-critical roles operating without the required competencies. The organisation accepts moderate risk in general staff awareness, targeting continuous improvement in phishing click rates and training completion. Failure to complete mandatory training within the deadline triggers access restriction for the individual.

## 11. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| CISO (Siobhan O'Brien) | Programme owner, Board briefings, specialist training oversight |
| ISMS Manager (Roisin Kelly) | Training coordination, record keeping, metrics reporting |
| Line Managers | Ensure team members complete training, identify competence gaps |
| HR | Onboarding training scheduling, record system maintenance |
| All Personnel | Complete assigned training within deadlines, apply security practices |

## 12. Exceptions Process

Exceptions to training requirements (e.g., deadline extensions for personnel on leave) must be:
1. Requested by the individual's line manager
2. Approved by the ISMS Manager for awareness training; CISO for specialist certifications
3. Limited to a maximum of 60 additional days
4. Documented with a revised completion date

## 13. Awareness Requirements

This programme is itself the primary awareness mechanism. Additionally:
- Security tips are published on the company intranet weekly
- A monthly security newsletter is distributed to all staff
- Security champions are appointed in each department to promote awareness locally
- An annual Security Awareness Week is held with workshops, quizzes, and guest speakers`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'competence', 'awareness', 'training'],
      keywords: ['security awareness', 'training', 'competence', 'phishing simulation'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['POL-013'] = pol013.id;

  // ──────────────────────────────────────────
  // WAVE 2 — Annex A Policies (PUBLISHED)
  // ──────────────────────────────────────────

  const pol014 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-014',
      title: 'Personnel Security Policy',
      documentType: 'POLICY',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'EXECUTIVE',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CISO',
      documentOwnerId: ctx.users.ciso,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CEO',
      approverId: ctx.users.admin,
      approvalDate: monthsAgo(2),
      effectiveDate: monthsAgo(2),
      nextReviewDate: monthsFromNow(10),
      purpose: 'Ensure that ClearStream Payments personnel are suitable, aware of their responsibilities, and that information security is maintained during changes in employment, in accordance with ISO 27001:2022 Annex A controls A.6.1 through A.6.6.',
      scope: 'This policy applies to all ClearStream employees, contractors, consultants, and temporary staff from pre-employment through to termination or role change, across Dublin, Berlin, and Lisbon offices.',
      content: `## 1. Document Owner

The CISO (Siobhan O'Brien) is the owner of this policy. HR is responsible for operational execution of screening, onboarding, and offboarding processes.

## 2. Scope

This policy governs personnel security throughout the employment lifecycle:
- Pre-employment screening and vetting
- Terms and conditions of employment related to information security
- Security awareness and training during employment (cross-reference POL-013)
- Disciplinary process for security violations
- Employment termination and role change procedures
- Responsibilities that remain valid after termination

Applicable to all ClearStream offices: Dublin (HQ), Berlin, and Lisbon, and compliant with local employment laws in Ireland, Germany, and Portugal.

## 3. Management Approval

This policy is approved by the CEO (Fiona Murphy) and reviewed by the Executive Leadership Team. Changes to screening requirements affecting regulatory compliance require additional approval from the Compliance Officer.

## 4. Review Cadence

This policy is reviewed annually or when triggered by:
- Changes to employment legislation in Ireland, Germany, or Portugal
- Regulatory guidance from CBI, BaFin, or Banco de Portugal
- Significant personnel-related security incidents
- Changes to ClearStream's risk profile or business activities

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Current | Roisin Kelly | Initial release |

## 6. Pre-Employment Screening

### 6.1 Standard Screening (All Roles)

All candidates must undergo the following before commencing employment:
- Identity verification (government-issued photo ID)
- Right to work verification
- Educational qualification verification (highest relevant qualification)
- Employment history verification (minimum 5 years or since leaving education)
- Two professional references
- Criminal background check (jurisdiction-appropriate: Garda vetting in Ireland, Fuhrungszeugnis in Germany, Certificado de Registo Criminal in Portugal)

### 6.2 Enhanced Screening (Finance, Security, and Payment-Processing Roles)

Roles with access to payment systems, financial data, or security infrastructure additionally require:
- Credit history check (with candidate consent, in accordance with local law)
- Extended criminal background check (5-year history)
- Directorship and conflict of interest check
- PCI DSS role-based screening as required by the payment card industry

### 6.3 Contractor and Third-Party Screening

Third-party personnel with access to ClearStream systems must:
- Be screened to the same standard as equivalent employee roles
- Provide evidence of screening via their employer (or ClearStream screens directly)
- Be subject to the screening requirements in their service agreement (see POL-005)

## 7. Employment Terms and Security Obligations

### 7.1 Non-Disclosure Agreement (NDA)

All personnel must sign an NDA before being granted access to ClearStream information assets. The NDA covers:
- Confidentiality obligations during and after employment
- Intellectual property assignment
- Data protection responsibilities
- Penalties for breach

### 7.2 Security Responsibilities in Employment Contracts

Employment contracts and contractor agreements must include:
- Obligation to comply with ClearStream information security policies
- Acceptable use of information assets (cross-reference POL-002)
- Data classification and handling responsibilities (cross-reference POL-004)
- Incident reporting obligations
- Consequences of non-compliance

## 8. Disciplinary Process for Security Violations

Security policy violations are handled through the ClearStream disciplinary process:

| Severity | Examples | Consequence |
|----------|----------|-------------|
| Minor | Leaving workstation unlocked, tailgating | Verbal warning + refresher training |
| Moderate | Sharing credentials, bypassing access controls | Written warning + mandatory training |
| Major | Unauthorised data access, deliberate policy circumvention | Final written warning + access review |
| Critical | Data theft, malicious activity, deliberate sabotage | Summary dismissal + legal/regulatory action |

Repeated minor violations (3 within 12 months) escalate to moderate level.

## 9. Termination and Role Change Procedures

### 9.1 Termination (Voluntary or Involuntary)

Upon notice of termination:
1. **Within 1 hour**: Line manager notifies IT Security of the departure
2. **Within 4 hours**: All system access is revoked (email, VPN, application access, badge)
3. **On last working day**: Asset return completed (laptop, phone, tokens, badges, documents)
4. **Exit interview**: Security-focused exit interview covering NDA reminder, data return/deletion confirmation, ongoing confidentiality obligations
5. **Within 24 hours of departure**: Shared credentials rotated, group membership removed

For involuntary terminations or suspected misconduct: access is revoked immediately upon notification, before the individual is informed of the termination.

### 9.2 Role Changes (Internal Transfers, Promotions)

When an employee changes role:
1. Access rights are reviewed and adjusted to the new role (principle of least privilege)
2. Access from the previous role is revoked within 5 business days unless formally justified
3. Additional screening is performed if the new role has enhanced requirements
4. The new line manager confirms required access and training needs

## 10. Risk Appetite Alignment

ClearStream has zero tolerance for unscreened personnel accessing payment systems or customer data. Screening must be completed before access is granted. The organisation accepts moderate risk in screening timelines for non-sensitive roles, but all screening must be completed within 60 days of start date.

## 11. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| CISO (Siobhan O'Brien) | Policy owner, escalation for critical violations |
| HR Department | Execute screening, manage employment documentation, conduct exit interviews |
| Line Managers | Notify HR/IT of departures and role changes, monitor compliance |
| IT Security (Markus Weber) | Execute access provisioning and revocation |
| Compliance Officer (Sofia Ferreira) | Advise on regulatory screening requirements |
| All Personnel | Comply with security obligations, report concerns |

## 12. Exceptions Process

Exceptions to screening requirements (e.g., start date before screening completion) must be:
1. Requested by the hiring manager with business justification
2. Approved by the CISO
3. Subject to compensating controls (restricted access, supervision, accelerated screening)
4. Time-limited (maximum 30 days) with tracking to completion

## 13. Awareness Requirements

- All new starters receive a security onboarding briefing covering this policy within their first week
- Line managers receive annual training on their personnel security responsibilities
- HR staff complete specialist training on screening requirements and data protection in hiring
- Termination procedures are included in the manager's checklist and rehearsed annually`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'personnel security', 'HR security'],
      keywords: ['personnel security', 'screening', 'termination', 'disciplinary', 'NDA'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['POL-014'] = pol014.id;

  const pol015 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-015',
      title: 'Physical & Environmental Security Policy',
      documentType: 'POLICY',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'EXECUTIVE',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CTO',
      documentOwnerId: ctx.users.cto,
      author: 'Security Lead',
      authorId: ctx.users.securityLead,
      approvedBy: 'CEO',
      approverId: ctx.users.admin,
      approvalDate: monthsAgo(3),
      effectiveDate: monthsAgo(3),
      nextReviewDate: monthsFromNow(9),
      purpose: 'Protect ClearStream Payments information assets from physical and environmental threats by defining security controls for offices, data centres, and equipment, in accordance with ISO 27001:2022 Annex A controls A.7.1 through A.7.14.',
      scope: 'This policy applies to all ClearStream premises — Dublin HQ (including the on-site data centre), Berlin office, and Lisbon office — as well as any third-party facilities hosting ClearStream equipment or data.',
      content: `## 1. Document Owner

The CTO (Lars Becker) is the owner of this policy. The Facilities team and Security Lead (Markus Weber) are responsible for operational implementation.

## 2. Scope

This policy covers:
- Physical perimeter security and access controls at all ClearStream locations
- Data centre physical security (Dublin HQ on-site DC)
- Visitor management across all offices
- Equipment protection and environmental controls
- Clean desk and clear screen requirements
- Secure areas and working rules
- Delivery and loading area security
- Off-site equipment and remote working physical security

## 3. Management Approval

This policy is approved by the CEO (Fiona Murphy) and reviewed by the Executive Leadership Team annually. Capital expenditure for physical security upgrades is approved by the CFO (Dieter Schneider).

## 4. Review Cadence

This policy is reviewed annually or when triggered by:
- Physical security incidents (break-in, tailgating, unauthorised access)
- Opening of new office locations or data centre changes
- Changes to the ClearStream threat assessment for physical threats
- Results of physical security audits or penetration tests

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Current | Markus Weber | Initial release |

## 6. Dublin HQ — Secure Perimeter

### 6.1 Building Access

- Main entrance controlled by electronic access card (RFID) for all personnel
- Reception staffed during business hours (08:00-18:00); after-hours access requires pre-authorisation
- CCTV coverage at all entry/exit points, car park, and external perimeter (30-day retention)

### 6.2 Data Centre Access

The Dublin HQ on-site data centre is classified as a Restricted Zone:
- Dual-factor access: access card + biometric (fingerprint)
- Access limited to authorised personnel (maintained by Security Lead, reviewed quarterly)
- Man-trap entry (anti-tailgating vestibule)
- All access logged with timestamp and identity
- No mobile phones, cameras, or recording devices permitted inside the DC
- Visitors must be escorted at all times by an authorised ClearStream employee

### 6.3 Office Zones

| Zone | Access Level | Controls |
|------|-------------|----------|
| Public (reception, meeting rooms) | Visitor badge | Reception check-in, escort to meeting rooms |
| General Office | Employee badge | Access card, business hours |
| Secure Office (InfoSec, Finance) | Restricted badge | Access card + PIN, additional CCTV |
| Data Centre | Restricted + biometric | Dual-factor, man-trap, escort-only for visitors |
| Server/Comms Rooms | Restricted badge | Access card, environmental monitoring |

## 7. Berlin and Lisbon Offices

- Access controlled by electronic access cards
- CCTV at entry points (retention per local law: 72 hours Germany, 30 days Portugal)
- No on-site data centre — all sensitive processing in Dublin DC or cloud
- Secure storage cabinets for CONFIDENTIAL documents
- Visitor sign-in and escort policy applies

## 8. Visitor Management

1. All visitors must be pre-registered by their ClearStream host
2. Visitors sign in at reception, present photo ID, and receive a dated visitor badge
3. Visitor badges must be visibly worn at all times
4. Visitors are escorted at all times outside of public areas
5. Visitor log records: name, organisation, host, time in, time out, areas accessed
6. Visitor logs are retained for 12 months
7. Visiting contractors working independently must be pre-approved by the Security Lead and issued a temporary restricted badge

## 9. Equipment Protection

### 9.1 Data Centre Environmental Controls

- Uninterruptible Power Supply (UPS) with minimum 30-minute runtime
- Diesel generator backup with automatic failover (tested monthly)
- Precision air conditioning maintaining 18-24 degrees C and 40-60% relative humidity
- FM-200 fire suppression system (clean agent, safe for electronics)
- Water leak detection sensors under raised floor
- Environmental monitoring with 24/7 alerting to the Security Operations team

### 9.2 Equipment Placement

- Servers and network equipment positioned to minimise risk from water damage, heat, and electromagnetic interference
- Critical equipment on raised flooring with cable management below floor
- No food or beverages permitted in server rooms or data centre

## 10. Clean Desk and Clear Screen

All ClearStream personnel must adhere to the clean desk and clear screen policy:
- Workstations must be locked (Win+L / Cmd+L) when leaving the desk
- Automatic screen lock after 5 minutes of inactivity
- CONFIDENTIAL and RESTRICTED documents must be stored in locked drawers/cabinets when not in use
- Whiteboards in meeting rooms must be erased after use
- Printers: collect printouts immediately; uncollected printouts are shredded after 1 hour

## 11. Risk Appetite Alignment

ClearStream has zero tolerance for unauthorised physical access to the data centre and Restricted zones. The organisation accepts low risk for general office areas, relying on access card controls and CCTV as deterrents. Physical security investments are prioritised based on the asset classification of equipment and data in each zone.

## 12. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| CTO (Lars Becker) | Policy owner, approve capital expenditure for physical security |
| Security Lead (Markus Weber) | Operational management of physical security controls, access reviews |
| Facilities Team | Day-to-day maintenance, visitor management, environmental monitoring |
| Reception Staff | Visitor check-in, badge issuance, escort coordination |
| All Personnel | Comply with access controls, clean desk, report suspicious activity |

## 13. Exceptions Process

Exceptions to physical security requirements (e.g., temporary bypass of access controls during maintenance) must be:
1. Pre-approved by the Security Lead (for general areas) or CISO (for Restricted zones)
2. Time-limited with specific start and end dates
3. Subject to compensating controls (e.g., security guard presence during door maintenance)
4. Logged in the physical security exception register

## 14. Awareness Requirements

- All new starters receive a physical security briefing during induction, including a tour of security zones
- Annual refresher on clean desk/clear screen included in the security awareness training (POL-013)
- Physical security posters displayed at entry points and secure areas
- Tailgating awareness campaigns conducted quarterly`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'physical security', 'environmental security'],
      keywords: ['physical security', 'data centre', 'access control', 'clean desk', 'visitor management'],
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });
  ctx.policyIds['POL-015'] = pol015.id;

  const pol016 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-016',
      title: 'Asset Management Policy',
      documentType: 'POLICY',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'INTERNAL',
      approvalLevel: 'EXECUTIVE',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CISO',
      documentOwnerId: ctx.users.ciso,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: monthsAgo(4),
      effectiveDate: monthsAgo(4),
      nextReviewDate: monthsFromNow(8),
      purpose: 'Ensure that ClearStream Payments information assets are identified, classified, protected, and managed throughout their lifecycle, in accordance with ISO 27001:2022 Annex A controls A.5.9 through A.5.14.',
      scope: 'This policy applies to all ClearStream information assets including hardware, software, data, network components, cloud services, and supporting documentation across all offices and environments.',
      content: `## 1. Document Owner

The CISO (Siobhan O'Brien) is the owner of this policy. The ISMS Manager (Roisin Kelly) coordinates asset inventory activities and classification reviews.

## 2. Scope

This policy covers the management of all ClearStream information assets:
- Hardware assets (servers, workstations, mobile devices, network equipment, peripherals)
- Software assets (applications, operating systems, development tools, licences)
- Data assets (customer data, payment data, employee data, business records)
- Cloud assets (IaaS, PaaS, SaaS subscriptions)
- Network assets (routers, switches, firewalls, load balancers)
- Supporting assets (documentation, procedures, configurations)

## 3. Management Approval

This policy is approved by the CISO and reviewed by the Executive Leadership Team. Major changes to the asset management framework require CTO concurrence.

## 4. Review Cadence

This policy is reviewed annually or when triggered by:
- Significant changes to the IT infrastructure or cloud services
- Acquisition or decommissioning of major systems
- Asset-related security incidents
- Internal or external audit findings related to asset management

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Current | Roisin Kelly | Initial release |

## 6. Asset Inventory

### 6.1 Configuration Management Database (CMDB)

All information assets are recorded in the ClearStream CMDB with the following mandatory attributes:
- Unique asset identifier
- Asset name and description
- Asset type and category
- Owner (individual responsible for the asset)
- Custodian (individual or team responsible for day-to-day management)
- Location (Dublin/Berlin/Lisbon/Cloud/Third-party)
- Data classification (per POL-004)
- Business criticality (Critical/High/Medium/Low)
- Lifecycle status (Planned/Active/End-of-Life/Decommissioned)

### 6.2 Inventory Reconciliation

- **Automated discovery**: Network scanning tools run weekly to identify connected assets
- **Manual reconciliation**: Quarterly comparison of CMDB against automated discovery results
- **Full audit**: Annual comprehensive asset audit across all locations
- **Discrepancies**: Unregistered assets are flagged, investigated, and either registered or removed within 5 business days

## 7. Asset Classification

All assets are classified in accordance with POL-004 Data Classification Policy:

| Classification | Description | Handling Requirements |
|---------------|-------------|----------------------|
| PUBLIC | Information approved for public release | No special handling |
| INTERNAL | General business information | Access restricted to ClearStream personnel |
| CONFIDENTIAL | Sensitive business or customer information | Encrypted at rest and in transit, access logged |
| RESTRICTED | Payment card data, credentials, cryptographic keys | Full PCI DSS controls, need-to-know access only |

Asset classification determines the security controls applied throughout the asset lifecycle.

## 8. Acceptable Use

All ClearStream information assets must be used in accordance with POL-002 Acceptable Use Policy. Key provisions:
- Assets are for authorised business use only
- Personal use is limited and must not compromise security
- Users must not install unauthorised software or modify security configurations
- Assets must not be used for illegal, unethical, or policy-violating activities

## 9. Asset Lifecycle Management

### 9.1 Procurement

- All hardware and software procurement follows the approved vendor list
- Security requirements are included in procurement specifications
- New assets are registered in the CMDB before deployment
- Security baseline configuration is applied before production use

### 9.2 Deployment

- Assets are hardened according to CIS benchmarks before deployment
- Security agents (EDR, vulnerability scanner, log collector) installed on all endpoints
- Network placement aligned with zone architecture (see POL-017)

### 9.3 Maintenance

- Patch management per STD-006 Vulnerability & Patch Management Procedure
- Configuration changes via change management process (STD-004)
- Regular vulnerability scanning and remediation

### 9.4 Disposal

- Assets are decommissioned following STD-007 Media Handling & Disposal Procedure
- Data is securely wiped or destroyed per NIST SP 800-88 guidelines
- CMDB updated to reflect decommissioned status
- Certificates of destruction retained for audit purposes

## 10. Return of Assets

Upon termination of employment or contract:
- All ClearStream assets must be returned on or before the last working day
- IT issues a return checklist: laptop, phone, tokens, badges, USB devices, documents
- Line manager confirms return of all assets
- Unreturned assets are escalated to HR and, if necessary, legal

## 11. BYOD Restrictions

ClearStream operates a controlled BYOD policy:
- Personal devices may access corporate email and non-sensitive applications via MDM
- **No payment card data (PCI scope) may be accessed, stored, or processed on personal devices**
- Personal devices must have MDM agent installed, device encryption enabled, and current OS version
- ClearStream reserves the right to remotely wipe corporate data from BYOD devices

## 12. Risk Appetite Alignment

ClearStream has zero tolerance for unregistered assets within the PCI cardholder data environment. The organisation accepts low risk for inventory accuracy in general office equipment, targeting 95% CMDB accuracy verified through quarterly reconciliation. Unauthorised assets on the network trigger an immediate investigation.

## 13. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| CISO (Siobhan O'Brien) | Policy owner, asset classification framework oversight |
| ISMS Manager (Roisin Kelly) | Asset inventory coordination, classification reviews |
| CTO (Lars Becker) | Technical asset strategy, procurement approval |
| IT Operations | CMDB maintenance, automated discovery, asset deployment |
| Asset Owners | Classification, access decisions, lifecycle management |
| All Personnel | Safeguard assigned assets, report loss or theft immediately |

## 14. Exceptions Process

Exceptions to asset management requirements must be:
1. Submitted to the ISMS Manager with justification
2. Approved by the CISO
3. Documented with compensating controls and expiry date
4. Reviewed at each quarterly reconciliation

## 15. Awareness Requirements

- All staff receive asset management training during onboarding (asset handling, classification, return obligations)
- Annual refresher included in the security awareness programme (POL-013)
- Asset owners receive specific training on their classification and lifecycle responsibilities
- Quarterly reminders to update asset information in the CMDB`,
      requiresAcknowledgment: false,
      tags: ['ISO 27001', 'asset management', 'CMDB'],
      keywords: ['asset management', 'inventory', 'classification', 'BYOD', 'lifecycle'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['POL-016'] = pol016.id;

  const pol017 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-017',
      title: 'Communications Security Policy',
      documentType: 'POLICY',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'EXECUTIVE',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'Security Lead',
      documentOwnerId: ctx.users.securityLead,
      author: 'Security Lead',
      authorId: ctx.users.securityLead,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: monthsAgo(2),
      effectiveDate: monthsAgo(2),
      nextReviewDate: monthsFromNow(10),
      purpose: 'Define the requirements for securing ClearStream Payments network infrastructure and communications, in accordance with ISO 27001:2022 Annex A controls A.5.14, A.8.20 through A.8.22.',
      scope: 'This policy applies to all ClearStream network infrastructure, communication channels, and data transmission mechanisms across Dublin, Berlin, and Lisbon offices, cloud environments, and remote access connections.',
      content: `## 1. Document Owner

The Security Lead (Markus Weber) is the owner of this policy and is responsible for the design, implementation, and monitoring of network security controls.

## 2. Scope

This policy governs:
- Network architecture and segmentation
- Network security controls (firewalls, IDS/IPS, WAF)
- Remote access and VPN
- Wireless network security
- Network monitoring and logging
- Web content filtering
- Inter-office communications

## 3. Management Approval

This policy is approved by the CISO (Siobhan O'Brien) and reviewed by the CTO (Lars Becker) for technical feasibility. Changes to network architecture require change management approval per STD-004.

## 4. Review Cadence

This policy is reviewed annually or when triggered by:
- Network security incidents or breaches
- Significant changes to network architecture
- New threat intelligence affecting network security
- Results of penetration tests or vulnerability assessments

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Current | Markus Weber | Initial release |

## 6. Network Segmentation

ClearStream operates a segmented network architecture aligned with security zones:

| Zone | Purpose | Connectivity |
|------|---------|-------------|
| PCI CDE | Payment card processing | Isolated, micro-segmented, no direct internet access |
| DMZ | Public-facing services (API gateway, web portal) | Internet-facing, firewalled from internal |
| Corporate | General business applications, email, productivity | Internal only, NAC-controlled |
| Development | Development and testing environments | Isolated from production, no live data |
| Management | Infrastructure management (SIEM, monitoring, backup) | Restricted to authorised administrators |
| Guest | Visitor internet access | Internet-only, fully isolated from corporate |

### 6.1 Segmentation Rules

- The PCI Cardholder Data Environment (CDE) is micro-segmented with dedicated firewalls
- No direct connectivity between the CDE and the internet; all traffic routes through the DMZ
- Development environments are logically isolated from production and never contain real customer data
- Inter-zone traffic is denied by default; explicit allow rules are documented and reviewed quarterly

## 7. Network Security Controls

### 7.1 Firewalls

- Next-generation firewalls (NGFW) at all network boundaries
- Default-deny rule set with explicit allow rules for approved traffic
- Firewall rules reviewed quarterly by the Security Lead and documented
- Changes to firewall rules follow STD-004 Change Management Procedure

### 7.2 Intrusion Detection and Prevention (IDS/IPS)

- Network-based IDS/IPS deployed at all boundary points and between critical zones
- Signature updates applied within 24 hours of release
- Alerts forwarded to SIEM (Splunk) for 24/7 monitoring
- False positive tuning reviewed monthly

### 7.3 Web Application Firewall (WAF)

- WAF deployed in front of all public-facing web applications and APIs
- OWASP Core Rule Set enabled with tuning for ClearStream applications
- Virtual patching capability for zero-day vulnerabilities pending application patches

## 8. Remote Access and VPN

- All remote access to ClearStream systems requires VPN (WireGuard)
- **Split-tunnel VPN is prohibited** — all traffic routes through the ClearStream VPN when connected
- Multi-factor authentication (MFA) is mandatory for VPN access
- VPN sessions time out after 12 hours of inactivity
- Remote access is logged and monitored in real-time
- VPN access is revoked within 4 hours of employment termination (see POL-014)

## 9. Wireless Network Security

| Network | Authentication | Encryption | Access |
|---------|---------------|-----------|--------|
| ClearStream-Corp | WPA3-Enterprise (802.1X, RADIUS) | AES-256 | Employees with managed devices |
| ClearStream-Guest | Captive portal, daily password | WPA3-Personal | Visitors, personal devices |

- Corporate wireless network uses certificate-based authentication
- Guest network is fully isolated from the corporate network (internet access only)
- Rogue AP detection is enabled and scanned weekly
- Wireless access points are centrally managed and firmware updated monthly

## 10. Network Monitoring and Logging

- All network devices forward logs to the SIEM (Splunk) — see POL-020 for detailed logging requirements
- NetFlow/IPFIX data collected from all boundary routers and core switches
- Anomaly detection baselines established for each network zone
- DNS query logging enabled for threat intelligence correlation
- Network traffic is inspected for data loss indicators (DLP integration)

## 11. Web Content Filtering

- Web filtering applied to all outbound internet access from corporate and development zones
- Blocked categories: malware distribution, phishing, command-and-control, gambling, adult content
- HTTPS inspection enabled for non-exempt categories (banking and healthcare sites exempt)
- Filtering bypass requests require ISMS Manager approval and are logged

## 12. Risk Appetite Alignment

ClearStream has zero tolerance for direct internet connectivity to the PCI CDE. The organisation accepts low risk for corporate network security, targeting defence-in-depth with multiple layers. Network architecture decisions balance security with business agility, but security requirements always take precedence for payment-processing systems.

## 13. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| Security Lead (Markus Weber) | Policy owner, network security architecture, firewall management |
| CTO (Lars Becker) | Network strategy, infrastructure investment decisions |
| Network Operations | Day-to-day network management, monitoring, incident response |
| CISO (Siobhan O'Brien) | Strategic oversight, risk acceptance for network exceptions |
| All Personnel | Report network anomalies, comply with remote access requirements |

## 14. Exceptions Process

Exceptions to network security requirements (e.g., temporary firewall rule for a project) must be:
1. Submitted via the change management process (STD-004)
2. Include a risk assessment and compensating controls
3. Approved by the Security Lead (standard exceptions) or CISO (CDE-related exceptions)
4. Time-limited (maximum 90 days) with automatic expiry

## 15. Awareness Requirements

- Network security fundamentals included in the annual security awareness training (POL-013)
- VPN usage and remote access security included in the remote working guide
- IT staff receive annual training on network security best practices and emerging threats
- Quarterly threat briefings include network-relevant threat intelligence`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'network security', 'communications security'],
      keywords: ['network segmentation', 'VPN', 'firewall', 'wireless security', 'IDS/IPS'],
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });
  ctx.policyIds['POL-017'] = pol017.id;

  const pol018 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-018',
      title: 'Secure Development Lifecycle Policy',
      documentType: 'POLICY',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'EXECUTIVE',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CTO',
      documentOwnerId: ctx.users.cto,
      author: 'Security Lead',
      authorId: ctx.users.securityLead,
      approvedBy: 'CTO',
      approverId: ctx.users.cto,
      approvalDate: monthsAgo(3),
      effectiveDate: monthsAgo(3),
      nextReviewDate: monthsFromNow(9),
      purpose: 'Define the secure development lifecycle requirements for ClearStream Payments software and systems, in accordance with ISO 27001:2022 Annex A controls A.8.25 through A.8.34.',
      scope: 'This policy applies to all software development activities at ClearStream, including in-house applications, APIs, microservices, infrastructure-as-code, and configuration management across all environments.',
      content: `## 1. Document Owner

The CTO (Lars Becker) is the owner of this policy. The Security Lead (Markus Weber) is responsible for defining security requirements and reviewing security controls within the SDLC.

## 2. Scope

This policy covers:
- All software development at ClearStream, including the payment gateway, merchant portal, back-office systems, and internal tools
- All phases of the SDLC: requirements, design, development, testing, deployment, and maintenance
- Third-party and open-source components integrated into ClearStream applications
- Infrastructure-as-code and configuration management

## 3. Management Approval

This policy is approved by the CTO and reviewed by the CISO. Significant changes to the SDLC process require change management approval per STD-004.

## 4. Review Cadence

This policy is reviewed annually or when triggered by:
- Major changes to the technology stack or development practices
- Security incidents resulting from development vulnerabilities
- Changes to PCI DSS or DORA requirements affecting development
- Industry developments in secure development practices

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Current | Markus Weber | Initial release |

## 6. SDLC Phases and Security Requirements

### 6.1 Requirements

- Security requirements are captured alongside functional requirements in user stories
- Each feature impacting authentication, authorisation, data handling, or payment processing must include explicit security acceptance criteria
- Privacy-by-design requirements are included for features processing personal data (GDPR compliance)
- Compliance requirements (PCI DSS, DORA) are mapped to relevant user stories

### 6.2 Design

- **Threat modelling** is mandatory for:
  - All new features touching the payment processing pipeline
  - Changes to authentication or authorisation mechanisms
  - New API endpoints or integrations with third parties
  - Changes to data storage or transmission patterns
- Threat models use the STRIDE methodology and are documented in the project wiki
- Architecture reviews include the Security Lead for PCI-scope changes

### 6.3 Development

- **Secure coding standards** based on OWASP Top 10 and OWASP ASVS are mandatory
- Key practices enforced:
  - Input validation and output encoding for all user-supplied data
  - Parameterised queries for all database operations (no string concatenation in SQL)
  - Secrets management via HashiCorp Vault — no hardcoded credentials
  - Principle of least privilege for service accounts and API permissions
  - Secure error handling — no stack traces or internal details in user-facing errors

### 6.4 Code Review

- **Mandatory peer review**: All code changes require at least one peer review before merge
- **Security review**: Changes to PCI-scope components require additional review by the Security Lead or a designated security champion
- Code review checklist includes: input validation, authentication/authorisation, error handling, logging, cryptographic usage, dependency updates

### 6.5 Testing

- **Static Application Security Testing (SAST)**: Runs on every pull request via CI/CD pipeline
- **Dynamic Application Security Testing (DAST)**: Runs nightly against staging environment
- **Software Composition Analysis (SCA)**: Snyk scans dependencies weekly; critical vulnerabilities block deployment
- **Unit and integration tests**: Minimum 80% code coverage for security-critical modules
- **Penetration testing**: Annual external pen test, plus after major releases affecting the payment gateway

### 6.6 Deployment

- All deployments follow the CI/CD pipeline — no manual deployments to production
- Deployment pipeline includes automated security gates (SAST pass, SCA pass, no critical vulnerabilities)
- Production deployments require explicit approval from the CTO or designated release manager
- Blue-green deployments with automated rollback capability
- Change management process (STD-004) applies to all production deployments

### 6.7 Maintenance

- Ongoing vulnerability monitoring via SCA and runtime protection
- Patch management for application dependencies per STD-006
- Security logging integrated from development (see POL-020)

## 7. Dependency Management

- All third-party libraries must come from approved package registries
- Snyk scans run weekly; alerts triaged within 24 hours for critical, 7 days for high
- Dependency updates reviewed monthly; critical security updates applied within 48 hours
- License compliance checked for all dependencies (GPL-incompatible licences flagged)

## 8. Environment Separation

| Environment | Purpose | Data | Access |
|-------------|---------|------|--------|
| Development | Feature development | Synthetic data only | All developers |
| Staging | Integration and security testing | Anonymised production data | Engineering + QA |
| Pre-production | Final validation | Anonymised production data | Release managers |
| Production | Live operations | Real customer/payment data | Authorised operators only |

- **No real customer data in non-production environments** (PCI DSS requirement)
- Environment promotion follows the pipeline: Dev → Staging → Pre-prod → Production

## 9. Risk Appetite Alignment

ClearStream has zero tolerance for deploying code with known critical or high SAST/SCA findings to production. The organisation accepts low risk for medium-severity findings with a 30-day remediation window. Development velocity is balanced against security through automated gates rather than manual checkpoints where possible.

## 10. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| CTO (Lars Becker) | Policy owner, SDLC process governance, production release approval |
| Security Lead (Markus Weber) | Security requirements, threat modelling, security reviews |
| Engineering Leads | Enforce secure coding practices, review security findings |
| Developers | Follow secure coding standards, address security findings promptly |
| QA Engineers | Execute security test cases, validate security fixes |
| Security Champions | Embedded in product teams, first point of contact for security questions |

## 11. Exceptions Process

Exceptions to SDLC security requirements (e.g., deploying with a known medium vulnerability) must be:
1. Documented with risk assessment and compensating controls
2. Approved by the CTO for non-PCI scope; CISO for PCI-scope changes
3. Time-limited with a remediation plan and deadline
4. Tracked in the security exceptions register and reviewed weekly

## 12. Awareness Requirements

- All developers complete the annual OWASP Top 10 workshop (see POL-013)
- New developers complete the ClearStream Secure Coding Onboarding within their first 30 days
- Security champions receive advanced training (threat modelling, code review for security)
- Quarterly "security bugs of the quarter" sessions share lessons learned across engineering`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'secure development', 'SDLC'],
      keywords: ['SDLC', 'secure coding', 'code review', 'SAST', 'DAST', 'penetration testing'],
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });
  ctx.policyIds['POL-018'] = pol018.id;

  const pol019 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-019',
      title: 'Information Transfer Policy',
      documentType: 'POLICY',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'EXECUTIVE',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CISO',
      documentOwnerId: ctx.users.ciso,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: monthsAgo(2),
      effectiveDate: monthsAgo(2),
      nextReviewDate: monthsFromNow(10),
      purpose: 'Define the requirements for secure transfer of information within and outside ClearStream Payments, in accordance with ISO 27001:2022 Annex A control A.5.14.',
      scope: 'This policy applies to all transfers of ClearStream information by any means — electronic, physical, or verbal — between ClearStream systems, offices, personnel, and external parties.',
      content: `## 1. Document Owner

The CISO (Siobhan O'Brien) is the owner of this policy. The ISMS Manager (Roisin Kelly) maintains the approved transfer methods register and coordinates data transfer agreements.

## 2. Scope

This policy governs:
- Electronic information transfers (email, file sharing, API, SFTP, cloud storage)
- Physical information transfers (removable media, printed documents, courier)
- Verbal information transfers (phone, video conference, in-person)
- Internal transfers (between departments, offices, systems)
- External transfers (to/from customers, suppliers, regulators, partners)

## 3. Management Approval

This policy is approved by the CISO and aligns with POL-004 Data Classification Policy for handling requirements. Changes to approved transfer methods require CISO approval.

## 4. Review Cadence

This policy is reviewed annually or when triggered by:
- Data breach or information leakage incidents
- Introduction of new collaboration or file-sharing tools
- Changes to regulatory requirements (GDPR cross-border transfers, PCI DSS)
- Third-party transfer agreement renewals

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Current | Roisin Kelly | Initial release |

## 6. Transfer Methods by Classification Level

| Classification | Approved Transfer Methods | Encryption Required | Additional Controls |
|---------------|--------------------------|--------------------|--------------------|
| PUBLIC | Any method | No | None |
| INTERNAL | Corporate email, Microsoft Teams, SharePoint, approved cloud storage | TLS in transit | Sender verifies recipient |
| CONFIDENTIAL | Encrypted email (S/MIME or TLS), SFTP, approved encrypted file share | AES-256 at rest, TLS 1.2+ in transit | DLP scanning, access logging |
| RESTRICTED | Encrypted email (S/MIME mandatory), SFTP with mutual authentication, dedicated secure transfer portal | AES-256 at rest, TLS 1.3 in transit | CISO approval, DLP, full audit trail, recipient acknowledgment |

## 7. Email Security

- All outbound email uses mandatory TLS (opportunistic TLS with enforcement for known domains)
- S/MIME encryption is mandatory for RESTRICTED information and available for CONFIDENTIAL
- Email DLP rules scan for payment card numbers (PAN), personal data patterns, and classification labels
- Auto-forwarding to external addresses is disabled
- Large attachments (>25MB) must use the approved secure file sharing platform

## 8. External Transfer Agreements

Before transferring CONFIDENTIAL or RESTRICTED information to any external party:
1. A Data Transfer Agreement (DTA) or equivalent contractual clause must be in place
2. The DTA specifies: data types, transfer methods, encryption requirements, retention limits, destruction obligations
3. For EU-to-non-EU transfers: GDPR Chapter V compliance verified (SCCs, adequacy decision, or BCRs)
4. The receiving party's security posture assessed per STD-009 Supplier Security Assessment Procedure
5. DTA register maintained by the ISMS Manager and reviewed annually

## 9. Removable Media

- Use of removable media (USB drives, external hard drives) is restricted:
  - Only ClearStream-issued encrypted USB drives (hardware-encrypted, FIPS 140-2) are permitted
  - All removable media must be pre-approved by the Security Lead
  - Removable media use is logged by endpoint DLP
  - USB ports on workstations are disabled by default; exceptions require ISMS Manager approval
- Personal removable media is prohibited on ClearStream systems

## 10. Cloud Storage

Approved cloud storage platforms:
- Microsoft SharePoint Online (primary — INTERNAL and CONFIDENTIAL)
- Azure Blob Storage (system-to-system transfers — all classifications)

Prohibited:
- Personal cloud storage (Dropbox, Google Drive personal, iCloud)
- Unapproved SaaS file-sharing tools

## 11. Risk Appetite Alignment

ClearStream has zero tolerance for unencrypted transfer of CONFIDENTIAL or RESTRICTED information. The organisation accepts moderate risk for INTERNAL information transfers using approved corporate tools with TLS in transit. Payment card data transfers are subject to PCI DSS controls regardless of classification.

## 12. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| CISO (Siobhan O'Brien) | Policy owner, approve transfer methods and RESTRICTED transfers |
| ISMS Manager (Roisin Kelly) | DTA register, approved methods register, compliance monitoring |
| Security Lead (Markus Weber) | Technical implementation of transfer controls, DLP configuration |
| DPO (Ana Costa) | GDPR transfer compliance, cross-border transfer assessments |
| All Personnel | Use only approved methods, classify before transferring, verify recipients |

## 13. Exceptions Process

Exceptions to approved transfer methods (e.g., use of an unapproved tool for a specific project) must be:
1. Requested with business justification and risk assessment
2. Approved by the CISO
3. Subject to compensating controls (e.g., additional encryption, monitoring)
4. Time-limited (maximum 90 days) and reviewed before renewal
5. Logged in the exceptions register

## 14. Awareness Requirements

- All staff receive training on information transfer requirements during onboarding
- Annual refresher covers classification-based transfer rules and common mistakes
- DLP violation reports are reviewed monthly and repeat offenders receive targeted training
- Quarterly tips on secure information sharing published on the company intranet`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'information transfer', 'data protection'],
      keywords: ['information transfer', 'email security', 'removable media', 'DLP', 'encryption'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['POL-019'] = pol019.id;

  const pol020 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-020',
      title: 'Logging, Monitoring & Alerting Policy',
      documentType: 'POLICY',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'EXECUTIVE',
      reviewFrequency: 'SEMI_ANNUAL',
      documentOwner: 'Security Lead',
      documentOwnerId: ctx.users.securityLead,
      author: 'Security Lead',
      authorId: ctx.users.securityLead,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: monthsAgo(1),
      effectiveDate: monthsAgo(1),
      nextReviewDate: monthsFromNow(5),
      purpose: 'Define the requirements for logging, monitoring, and alerting across ClearStream Payments information systems to enable security event detection, incident investigation, and regulatory compliance, in accordance with ISO 27001:2022 Annex A controls A.8.15 through A.8.17.',
      scope: 'This policy applies to all ClearStream information systems, applications, infrastructure components, and security controls that generate log data, across all environments and locations.',
      content: `## 1. Document Owner

The Security Lead (Markus Weber) is the owner of this policy and is responsible for the logging architecture, SIEM management, and alert tuning.

## 2. Scope

This policy covers:
- Log generation requirements for all systems
- Log format and content standards
- SIEM integration and centralised log management
- Log retention and protection
- Monitoring and alerting requirements
- Clock synchronisation
- Log access controls

## 3. Management Approval

This policy is approved by the CISO (Siobhan O'Brien). Changes to log retention periods require CFO approval due to storage cost implications. Changes to monitoring scope require CTO concurrence.

## 4. Review Cadence

This policy is reviewed semi-annually due to the rapidly evolving threat landscape and regulatory requirements. Additional reviews are triggered by:
- Security incidents where logging gaps were identified
- New regulatory logging requirements (DORA, PCI DSS v4.0)
- Changes to the SIEM platform or logging infrastructure
- Results of log review audits

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Current | Markus Weber | Initial release |

## 6. What to Log

### 6.1 Mandatory Log Events

All systems must log the following event categories:

| Category | Events | Examples |
|----------|--------|---------|
| Authentication | Successful and failed login attempts, MFA challenges, session creation/termination | User login, VPN connection, API authentication |
| Privilege Changes | Role assignments, permission changes, privilege escalation | Admin role granted, sudo usage, service account modification |
| Data Access | Access to CONFIDENTIAL/RESTRICTED data, database queries, file access | Payment record viewed, customer data exported, report generated |
| System Changes | Configuration changes, software installation, service start/stop | Firewall rule change, server restart, patch installation |
| Security Events | Malware detection, IDS/IPS alerts, DLP violations, policy violations | Blocked attack, suspicious file, data exfiltration attempt |
| Administrative Actions | User creation/deletion, system administration, backup operations | New user created, backup completed, certificate renewed |

### 6.2 Payment-Specific Logging (PCI DSS)

For PCI CDE systems, additional logging:
- All access to cardholder data
- All actions by administrators and privileged users
- Access to audit trails
- Invalid logical access attempts
- Identification and authentication mechanism events
- Initialisation, stopping, or pausing of audit logs

## 7. Log Format

All logs must include the following fields:
- **Timestamp**: ISO 8601 format with millisecond precision and timezone (UTC preferred)
- **Source**: System/application name and IP address
- **User**: Identity of the actor (username, service account, API key identifier)
- **Action**: Description of the event (verb + object)
- **Outcome**: Success/failure/error
- **Source IP**: IP address of the requestor (where applicable)
- **Session ID**: Correlation identifier for the session
- **Severity**: CEF severity level (0-10)

Preferred formats: CEF (Common Event Format) or structured JSON. Unstructured text logs must be parsed into structured format before SIEM ingestion.

## 8. SIEM Integration

- **Platform**: Splunk Enterprise (on-premises, Dublin DC)
- **Scope**: All security-relevant logs from all environments must be forwarded to Splunk
- **Ingestion**: Log forwarders (Splunk Universal Forwarder) on all servers and endpoints
- **Cloud logs**: AWS CloudTrail and Azure Activity Logs forwarded via API integration
- **Correlation**: Pre-built and custom correlation rules for threat detection
- **Dashboards**: Real-time security dashboards for SOC operators

## 9. Log Retention

| Tier | Retention | Storage | Cost Tier |
|------|-----------|---------|-----------|
| Hot | 90 days | Splunk indexed (SSD) | High — real-time search |
| Warm | 1 year | Splunk SmartStore (S3) | Medium — slower search |
| Cold | 7 years | S3 Glacier Deep Archive | Low — archive/legal hold |

- PCI DSS requires 1 year immediately available, 7 years total retention
- DORA requires logs to be available for regulatory examination
- Log data is immutable once written to archive storage

## 10. Monitoring Requirements

### 10.1 24/7 Monitoring

- Critical security alerts monitored 24/7 by the Security Operations team
- On-call rotation for out-of-hours alerts (Security Lead and two SOC analysts)
- Mean time to acknowledge critical alerts: 15 minutes
- Mean time to investigate: 1 hour

### 10.2 Alerting Thresholds

| Alert Category | Threshold | Priority |
|---------------|-----------|----------|
| Failed login attempts (single user) | 5 in 10 minutes | High |
| Failed login attempts (multiple users) | 10 in 5 minutes | Critical — potential credential stuffing |
| Privilege escalation | Any unscheduled | Critical |
| Data exfiltration indicators | >100MB transfer to external IP from CDE | Critical |
| Malware detection | Any | High |
| Configuration change on CDE | Any | High |
| Log forwarding failure | 5 minutes gap | Critical |

## 11. Clock Synchronisation

- All ClearStream systems synchronise to designated NTP servers
- Primary NTP source: pool.ntp.org via redundant NTP servers in Dublin DC
- Maximum acceptable drift: +/- 1 second
- NTP synchronisation monitored and alerting on drift > 500ms
- Time synchronisation verified quarterly during infrastructure audits

## 12. Log Protection

- Log data is protected against tampering:
  - Write-once storage for archived logs (S3 Object Lock)
  - Log forwarding integrity verified via TLS and checksums
  - Access to raw logs restricted to the Security Operations team (role-based access in Splunk)
  - Log deletion requires dual approval (Security Lead + CISO)
- Audit logs of log access are maintained (who accessed what logs, when)

## 13. Risk Appetite Alignment

ClearStream has zero tolerance for gaps in security logging for the PCI CDE. The organisation accepts low risk for logging completeness in development environments. Any log forwarding failure exceeding 5 minutes triggers an automatic incident. Log retention periods exceed regulatory minimums to provide adequate investigation capability.

## 14. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| Security Lead (Markus Weber) | Policy owner, SIEM architecture, alert tuning, SOC oversight |
| SOC Analysts | 24/7 monitoring, alert triage, initial investigation |
| CISO (Siobhan O'Brien) | Strategic oversight, log access approval for investigations |
| CTO (Lars Becker) | Infrastructure capacity for logging, NTP architecture |
| Application Developers | Implement application-level logging per this policy |
| All System Administrators | Ensure log forwarding is configured and operational |

## 15. Exceptions Process

Exceptions to logging requirements (e.g., systems that cannot generate required logs) must be:
1. Documented with a risk assessment of the logging gap
2. Approved by the CISO
3. Subject to compensating controls (e.g., enhanced monitoring of adjacent systems)
4. Reviewed semi-annually and resolved as soon as technically feasible

## 16. Awareness Requirements

- Developers receive training on application logging requirements during onboarding
- SOC analysts receive quarterly training on new detection rules and investigation techniques
- System administrators are trained on log forwarding configuration during platform onboarding
- Annual SIEM effectiveness review results shared with the security team`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'logging', 'monitoring', 'SIEM'],
      keywords: ['logging', 'monitoring', 'SIEM', 'Splunk', 'alerting', 'log retention'],
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });
  ctx.policyIds['POL-020'] = pol020.id;

  const pol021 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-021',
      title: 'Compliance Management Procedure',
      documentType: 'PROCEDURE',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'INTERNAL',
      approvalLevel: 'SENIOR_MANAGEMENT',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'Compliance Officer',
      documentOwnerId: ctx.users.complianceOfficer,
      author: 'Compliance Officer',
      authorId: ctx.users.complianceOfficer,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: monthsAgo(2),
      effectiveDate: monthsAgo(2),
      nextReviewDate: monthsFromNow(10),
      purpose: 'Define the procedure for identifying, monitoring, and maintaining compliance with applicable legal, regulatory, and contractual requirements affecting ClearStream Payments information security, in accordance with ISO 27001:2022 Annex A controls A.5.31 through A.5.36.',
      scope: 'This procedure covers compliance management for all regulatory, legal, and contractual obligations relevant to ClearStream Payments information security across all jurisdictions of operation (Ireland, Germany, Portugal, and EU-wide).',
      content: `## 1. Document Owner

The Compliance Officer (Sofia Ferreira) is the owner of this procedure and is responsible for maintaining the regulatory register and coordinating compliance activities.

## 2. Scope

This procedure governs:
- Identification and tracking of applicable legal, regulatory, and contractual requirements
- Compliance monitoring and assessment
- Regulatory change management
- Intellectual property protection
- Privacy and personal data protection (in coordination with the DPO)
- Cryptographic controls compliance
- Independent review of information security

## 3. Management Approval

This procedure is approved by the CISO (Siobhan O'Brien) and reviewed by the Executive Leadership Team. The CFO (Dieter Schneider) is consulted on compliance cost implications. The DPO (Ana Costa) is consulted on all privacy-related compliance matters.

## 4. Review Cadence

This procedure is reviewed annually or when triggered by:
- Enactment of new regulations affecting ClearStream
- Significant changes to existing regulatory requirements
- Regulatory enforcement actions or industry guidance
- Changes to ClearStream's business activities or jurisdictions

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Current | Sofia Ferreira | Initial release |

## 6. Regulatory Register

ClearStream maintains a comprehensive regulatory register covering all applicable requirements:

| Regulation/Standard | Scope | Authority | Compliance Owner | Review Frequency |
|---------------------|-------|-----------|-----------------|-----------------|
| ISO 27001:2022 | ISMS | Certification body | ISMS Manager | Annual (certification audit) |
| PCI DSS v4.0 | Payment card data | PCI SSC / QSA | Security Lead | Annual (QSA audit) |
| DORA (EU 2022/2554) | ICT risk management | CBI / ESAs | Compliance Officer | Semi-annual |
| NIS2 Directive | Network and information security | CBI (national transposition) | CISO | Annual |
| GDPR (EU 2016/679) | Personal data protection | DPC (Ireland), BfDI (Germany), CNPD (Portugal) | DPO | Continuous |
| CBI Regulations | Payment institution requirements | Central Bank of Ireland | Compliance Officer | Quarterly |
| eIDAS 2.0 | Electronic identification and trust services | National authorities | Compliance Officer | Annual |

The regulatory register is maintained in the RiskReady GRC platform, reviewed quarterly, and updated within 30 days of any regulatory change.

## 7. Compliance Monitoring Schedule

| Requirement | Monitoring Method | Frequency | Responsible |
|-------------|------------------|-----------|-------------|
| ISO 27001 | Internal audit (POL-011) + external surveillance | Annual | ISMS Manager |
| PCI DSS | Self-assessment + QSA on-site audit | Annual | Security Lead |
| DORA | ICT risk assessment + incident reporting readiness | Semi-annual | Compliance Officer |
| NIS2 | Essential services compliance assessment | Annual | CISO |
| GDPR | DPIA reviews + DPA audit readiness | Continuous + annual review | DPO |
| CBI | Regulatory reporting + compliance attestations | Quarterly | Compliance Officer |

## 8. Regulatory Change Tracking

### 8.1 Sources

The Compliance Officer monitors the following sources for regulatory changes:
- Official Journal of the EU
- Irish Statute Book and CBI publications
- German Federal Gazette (Bundesgesetzblatt) and BaFin guidance
- Portuguese Diario da Republica and Banco de Portugal
- PCI SSC document library and FAQs
- Industry associations (Payments Europe, EPIF)
- Legal advisors (quarterly regulatory update briefings)

### 8.2 Change Impact Assessment

When a relevant regulatory change is identified:
1. Compliance Officer conducts an initial impact assessment within 10 business days
2. Affected policies, procedures, and controls are identified
3. Gap analysis performed against current ClearStream compliance posture
4. Remediation plan developed with owners and deadlines
5. Progress tracked in the RiskReady GRC platform and reported at management review (POL-012)

## 9. Intellectual Property Protection

- ClearStream respects third-party intellectual property rights in all software and content
- Software licence compliance is monitored quarterly (licence audit via the CMDB — see POL-016)
- Open-source licence compliance is checked via SCA tools in the CI/CD pipeline (see POL-018)
- Employee IP assignment clauses are included in employment contracts (see POL-014)
- Trade secrets and proprietary algorithms are classified as RESTRICTED

## 10. Privacy and PII Handling

In coordination with the DPO (Ana Costa):
- Data Protection Impact Assessments (DPIAs) are conducted for new processing activities
- Records of Processing Activities (ROPA) maintained per GDPR Article 30
- Data subject rights processes (access, erasure, portability) tested annually
- Cross-border data transfers comply with GDPR Chapter V (see POL-019)
- Personal data breach notification process aligned with GDPR 72-hour requirement and DORA timelines

## 11. Cryptographic Controls Compliance

- Cryptographic controls comply with STD-003 Cryptographic Controls Standard
- Export restrictions on cryptographic products are assessed for cross-border transfers
- Cryptographic algorithms and key lengths meet or exceed industry standards (NIST, ENISA recommendations)
- Annual review of cryptographic controls for algorithm deprecation (e.g., SHA-1, RSA-2048 for long-term use)

## 12. Independent Review

- Annual independent review of information security by an external party (ISO 27001 certification audit)
- Annual PCI DSS assessment by a Qualified Security Assessor (QSA)
- Periodic DORA compliance review by an external ICT risk specialist
- Results reported to the Board via management review (POL-012)

## 13. Risk Appetite Alignment

ClearStream has zero tolerance for non-compliance with regulatory requirements that could result in enforcement action, fines, or licence revocation. The organisation accepts low risk for emerging regulations where guidance is still evolving, provided a proactive monitoring and preparation approach is maintained. Compliance investments are prioritised based on regulatory impact severity.

## 14. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| Compliance Officer (Sofia Ferreira) | Procedure owner, regulatory register, compliance monitoring, change tracking |
| CISO (Siobhan O'Brien) | Strategic compliance oversight, NIS2 compliance owner |
| DPO (Ana Costa) | GDPR compliance, privacy assessments, data subject rights |
| ISMS Manager (Roisin Kelly) | ISO 27001 compliance, audit coordination |
| Security Lead (Markus Weber) | PCI DSS compliance, technical control implementation |
| CFO (Dieter Schneider) | Regulatory reporting to CBI, compliance budget |
| CEO (Fiona Murphy) | Regulatory accountability, board-level compliance oversight |

## 15. Exceptions Process

Exceptions to compliance requirements are generally not permitted. Where temporary non-compliance is unavoidable:
1. A formal compliance exception request is submitted to the Compliance Officer
2. Legal counsel reviews the regulatory risk
3. CISO and CEO approve the exception with a time-bound remediation plan
4. The exception is reported to the Board and, where required, to the relevant regulator
5. Compensating controls are implemented for the duration of the exception

## 16. Awareness Requirements

- All staff receive annual training on their regulatory obligations (GDPR, acceptable use, incident reporting)
- Compliance Officer provides quarterly regulatory update briefings to the Executive Leadership Team
- Department heads are briefed on regulation-specific requirements affecting their areas
- New regulatory requirements are communicated via email and the company intranet within 5 business days of identification`,
      requiresAcknowledgment: false,
      tags: ['ISO 27001', 'compliance', 'regulatory'],
      keywords: ['compliance', 'regulatory', 'PCI DSS', 'DORA', 'NIS2', 'GDPR'],
      organisationId: ctx.orgId,
      createdById: ctx.users.complianceOfficer,
    },
  });
  ctx.policyIds['POL-021'] = pol021.id;

  // ──────────────────────────────────────────
  // WAVE 3 — Operational Procedures (PENDING_REVIEW)
  // ──────────────────────────────────────────

  const std005 = await prisma.policyDocument.create({
    data: {
      documentId: 'STD-005',
      title: 'Backup & Recovery Procedure',
      documentType: 'PROCEDURE',
      status: 'PENDING_REVIEW',
      version: '0.9',
      majorVersion: 0,
      minorVersion: 9,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'SENIOR_MANAGEMENT',
      reviewFrequency: 'SEMI_ANNUAL',
      documentOwner: 'Security Lead',
      documentOwnerId: ctx.users.securityLead,
      author: 'Security Lead',
      authorId: ctx.users.securityLead,
      approvedBy: 'CTO',
      approverId: ctx.users.cto,
      approvalDate: monthsAgo(1),
      effectiveDate: monthsAgo(1),
      nextReviewDate: monthsFromNow(5),
      purpose: 'Define the backup and recovery procedures for ClearStream Payments information systems to ensure data availability, integrity, and recoverability in accordance with ISO 27001:2022 Annex A controls A.8.13 and A.8.14.',
      scope: 'This procedure applies to all ClearStream production and pre-production systems, databases, configurations, and critical business data across Dublin DC, cloud environments, and all office locations.',
      content: `## 1. Document Owner

The Security Lead (Markus Weber) is the owner of this procedure and is responsible for backup infrastructure, testing, and compliance with retention requirements.

## 2. Scope

This procedure covers:
- Backup strategy and architecture
- Backup schedules by system tier
- Retention periods for operational and regulatory purposes
- Restoration testing requirements
- RTO/RPO targets and compliance
- Backup encryption and security
- Monitoring and alerting for backup operations

## 3. Management Approval

This procedure is pending final approval by the CTO (Lars Becker). It has been reviewed by the CISO and ISMS Manager. Once approved, it will be effective immediately.

## 4. Review Cadence

This procedure is reviewed semi-annually due to the critical nature of backup operations. Additional reviews are triggered by:
- Backup or recovery failures
- Changes to the infrastructure or cloud architecture
- Changes to regulatory retention requirements
- Results of restoration tests revealing gaps

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.9 | Current | Markus Weber | Initial draft — pending review |

## 6. Backup Strategy — 3-2-1 Rule

ClearStream follows the industry-standard 3-2-1 backup strategy:
- **3 copies** of all critical data (1 production + 2 backups)
- **2 different media types** (local SSD/NVMe + cloud object storage)
- **1 offsite copy** (AWS S3 in a different region from production)

All backups are encrypted with AES-256 before transfer and at rest. Encryption keys are managed via HashiCorp Vault with automated key rotation (as defined in STD-003 Cryptographic Controls Standard).

## 7. Backup Schedules by System Tier

### 7.1 System Tier Classification

| Tier | Description | Examples | RTO | RPO |
|------|-------------|---------|-----|-----|
| Tier 1 | Payment processing — mission critical | Payment gateway, card processing, settlement engine | 4 hours | 15 minutes |
| Tier 2 | Core business applications | Merchant portal, back-office, CRM, email | 8 hours | 1 hour |
| Tier 3 | Supporting systems | Internal wiki, development tools, intranet | 24 hours | 24 hours |

### 7.2 Backup Schedule

| Tier | Backup Type | Frequency | Retention (Operational) | Retention (Regulatory) |
|------|-------------|-----------|------------------------|----------------------|
| Tier 1 | Continuous replication | Real-time to standby DC | Active standby | N/A |
| Tier 1 | Snapshot | Hourly | 72 hours (last 72 snapshots) | N/A |
| Tier 1 | Full backup | Daily (02:00 UTC) | 30 days | 1 year |
| Tier 2 | Incremental backup | Daily (03:00 UTC) | 14 days | N/A |
| Tier 2 | Full backup | Weekly (Sunday 01:00 UTC) | 30 days | 1 year |
| Tier 3 | Full backup | Weekly (Sunday 04:00 UTC) | 30 days | 6 months |

### 7.3 Database-Specific Backups

- PostgreSQL: continuous WAL archiving + daily pg_dump for Tier 1 databases
- Redis: RDB snapshots every 15 minutes for session and cache data
- Configuration backups: Git-based version control for all infrastructure-as-code

## 8. Restoration Testing

| Tier | Test Type | Frequency | Success Criteria |
|------|-----------|-----------|-----------------|
| Tier 1 | Full restore to isolated environment | Quarterly | Data integrity verified, application functional, within RPO |
| Tier 1 | Failover to standby DC | Semi-annually | Automatic failover within RTO, zero data loss |
| Tier 2 | Full restore from weekly backup | Semi-annually | Data integrity verified, within RTO |
| Tier 3 | Sample restore (10% of systems) | Annually | Data integrity verified |

Restoration test results are documented and reported to the CTO. Failed tests trigger immediate corrective action and re-testing within 2 weeks.

## 9. Backup Monitoring and Alerting

- All backup jobs are monitored via the centralised monitoring platform
- Alerts are generated for:
  - Backup job failure (any tier) — Priority: High
  - Backup job completion time exceeding 150% of normal — Priority: Medium
  - Backup storage capacity exceeding 80% — Priority: Medium
  - Replication lag exceeding 5 minutes for Tier 1 systems — Priority: Critical
- Backup status dashboard reviewed daily by the Infrastructure team
- Weekly backup summary report sent to the Security Lead and CTO

## 10. Risk Appetite Alignment

ClearStream has zero tolerance for data loss on Tier 1 payment systems — continuous replication and hourly snapshots ensure RPO of 15 minutes or better. The organisation accepts moderate risk for Tier 3 systems with 24-hour RPO. Backup restoration testing is a regulatory requirement under DORA and PCI DSS, and ClearStream targets 100% success rate on all restoration tests.

## 11. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| Security Lead (Markus Weber) | Procedure owner, backup architecture, testing oversight |
| Infrastructure Team | Daily backup operations, monitoring, restoration execution |
| CTO (Lars Becker) | Strategic oversight, approve backup infrastructure investments |
| ISMS Manager (Roisin Kelly) | Compliance monitoring, audit evidence collection |
| Application Owners | Define RPO/RTO requirements, validate restoration test results |

## 12. Exceptions Process

Exceptions to backup requirements (e.g., systems that cannot be backed up on schedule) must be:
1. Documented with risk assessment and business justification
2. Approved by the CTO
3. Subject to compensating controls (e.g., increased replication, alternative recovery method)
4. Reviewed at each semi-annual procedure review

## 13. Awareness Requirements

- Infrastructure team receives hands-on backup and recovery training during onboarding
- Annual disaster recovery tabletop exercise includes backup restoration scenarios (see STD-002)
- Quarterly backup report shared with the security team and referenced in management review (POL-012)
- Application owners briefed on their RPO/RTO targets annually`,
      requiresAcknowledgment: false,
      tags: ['ISO 27001', 'backup', 'recovery', 'business continuity'],
      keywords: ['backup', 'recovery', 'restoration', 'RPO', 'RTO', '3-2-1'],
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });
  ctx.policyIds['STD-005'] = std005.id;

  const std006 = await prisma.policyDocument.create({
    data: {
      documentId: 'STD-006',
      title: 'Vulnerability & Patch Management Procedure',
      documentType: 'PROCEDURE',
      status: 'PENDING_REVIEW',
      version: '0.9',
      majorVersion: 0,
      minorVersion: 9,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'SENIOR_MANAGEMENT',
      reviewFrequency: 'QUARTERLY',
      documentOwner: 'Security Lead',
      documentOwnerId: ctx.users.securityLead,
      author: 'Security Lead',
      authorId: ctx.users.securityLead,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: weeksAgo(2),
      effectiveDate: weeksAgo(2),
      nextReviewDate: monthsFromNow(3),
      purpose: 'Define the procedures for identifying, classifying, and remediating vulnerabilities across ClearStream Payments information systems, in accordance with ISO 27001:2022 Annex A controls A.8.8 through A.8.10.',
      scope: 'This procedure applies to all ClearStream systems, applications, network devices, endpoints, and cloud services across all environments, with particular focus on the PCI Cardholder Data Environment.',
      content: `## 1. Document Owner

The Security Lead (Markus Weber) is the owner of this procedure and is responsible for vulnerability scanning, patch management, and remediation tracking.

## 2. Scope

This procedure covers:
- Vulnerability scanning (internal and external)
- Severity classification using CVSS
- Patching SLAs by severity
- Emergency patching process
- Patch testing and deployment
- Exception process for delayed patching
- Vulnerability disclosure handling

## 3. Management Approval

This procedure is pending final review by the CISO (Siobhan O'Brien). The Security Lead has operational authority for patch deployment within the defined SLAs.

## 4. Review Cadence

This procedure is reviewed quarterly due to the fast-evolving vulnerability landscape. Additional reviews are triggered by:
- Zero-day vulnerabilities affecting ClearStream systems
- Failed patching cycles or missed SLAs
- Changes to the PCI DSS vulnerability management requirements
- Significant changes to the technology stack

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.9 | Current | Markus Weber | Initial draft — pending review |

## 6. Vulnerability Scanning Schedule

| Scan Type | Scope | Frequency | Tool |
|-----------|-------|-----------|------|
| Internal network scan | All internal IP ranges | Weekly | Nessus |
| External network scan | All public-facing IP addresses | Monthly | Qualys |
| PCI ASV scan | PCI CDE external perimeter | Quarterly | Approved Scanning Vendor (ASV) |
| Web application scan | All web applications and APIs | Monthly (DAST) | OWASP ZAP |
| Container image scan | All container images | Every build (CI/CD) | Trivy |
| Dependency scan (SCA) | All application dependencies | Continuous (Snyk) | Snyk |
| Cloud configuration scan | AWS and Azure environments | Weekly | Prowler / ScoutSuite |

### 6.1 Continuous Monitoring

For PCI-scope systems, continuous vulnerability monitoring is maintained via:
- Real-time alerts from Snyk for new vulnerabilities in deployed dependencies
- Daily automated scans of the CDE perimeter
- Runtime application security monitoring

## 7. Severity Classification

Vulnerabilities are classified using the Common Vulnerability Scoring System (CVSS v3.1):

| CVSS Score | ClearStream Severity | Patching SLA | Escalation |
|------------|---------------------|--------------|------------|
| 9.0-10.0 | Critical | 48 hours | CISO notified immediately |
| 7.0-8.9 | High | 7 calendar days | Security Lead |
| 4.0-6.9 | Medium | 30 calendar days | Vulnerability analyst |
| 0.1-3.9 | Low | 90 calendar days | Tracked in backlog |

### 7.1 Contextual Adjustment

CVSS scores are adjusted based on ClearStream context:
- **PCI CDE systems**: severity increased by one level (e.g., Medium becomes High)
- **Internet-facing systems**: severity increased by one level
- **No known exploit available**: may reduce urgency (but not the SLA)
- **Compensating controls in place**: documented but does not extend SLA

## 8. Patching Process

### 8.1 Standard Patching

1. **Identification**: Vulnerability scanner or vendor advisory identifies a patch
2. **Classification**: Security team classifies severity and affected systems
3. **Testing**: Patch applied to staging environment; automated tests run; minimum 24-hour soak
4. **Approval**: Standard change for routine patches; normal change for non-routine (STD-004)
5. **Deployment**: Automated deployment via CI/CD pipeline or configuration management tool
6. **Verification**: Post-patch scan to confirm vulnerability remediation
7. **Documentation**: Patch record updated in the CMDB (POL-016)

### 8.2 Emergency Patching

For Critical vulnerabilities with active exploitation or imminent threat:
1. CISO approves emergency patching — bypasses standard CAB process
2. Patch tested in staging (minimum 2-hour soak or CISO-approved waiver)
3. Deployed to production immediately with rollback plan
4. Retrospective change record created within 48 hours (STD-004)
5. Post-implementation review within 5 business days

## 9. Patch Testing Requirements

- All patches must be tested in a staging environment before production deployment
- Automated regression tests must pass
- PCI-scope patches require additional security testing (SAST/DAST re-scan)
- Operating system patches: tested on a representative sample before full rollout
- Database patches: additional backup taken before deployment

## 10. Vulnerability Metrics and Reporting

| Metric | Target | Reporting |
|--------|--------|-----------|
| Critical patch compliance (within SLA) | 100% | Weekly |
| High patch compliance (within SLA) | 95% | Weekly |
| Medium patch compliance (within SLA) | 90% | Monthly |
| Mean time to remediate (Critical) | <48 hours | Monthly |
| Open vulnerability count by severity | Trending downward | Monthly |
| PCI ASV scan pass rate | 100% | Quarterly |

## 11. Risk Appetite Alignment

ClearStream has zero tolerance for unpatched Critical vulnerabilities on PCI-scope or internet-facing systems beyond the 48-hour SLA. The organisation accepts low risk for Medium and Low vulnerabilities with extended remediation timelines, provided compensating controls are documented. Emergency patching decisions balance security urgency with operational stability.

## 12. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| Security Lead (Markus Weber) | Procedure owner, vulnerability triage, emergency patch approval |
| CISO (Siobhan O'Brien) | Strategic oversight, emergency patching authority, exception approval |
| Vulnerability Analysts | Scan execution, classification, tracking |
| Infrastructure Team | OS and infrastructure patching, staging environment maintenance |
| Application Developers | Application dependency patching, code-level remediation |
| CTO (Lars Becker) | Patch deployment scheduling, production stability oversight |

## 13. Exception Process for Delayed Patching

When a patch cannot be applied within the SLA:
1. Asset owner submits a patch exception request with justification
2. Security Lead assesses the risk and identifies compensating controls (e.g., WAF rule, network isolation, enhanced monitoring)
3. CISO approves exceptions for Critical/High; Security Lead for Medium/Low
4. Exception is time-limited (maximum 30 days for Critical, 90 days for others)
5. Compensating controls are verified as effective before the exception is granted
6. Exception is reviewed at each quarterly procedure review

## 14. Vulnerability Disclosure Handling

ClearStream operates a coordinated vulnerability disclosure programme:
- Security contact published at security.txt (/.well-known/security.txt)
- External researchers can report vulnerabilities via security@clearstream.ie
- Acknowledgment within 2 business days
- Assessment and remediation within standard SLAs
- Responsible disclosure coordinated with the reporter (90-day disclosure timeline)

## 15. Awareness Requirements

- All IT staff receive annual training on vulnerability management and patching procedures
- Developers receive specific training on dependency management and SCA tooling (Snyk)
- Monthly vulnerability summary shared with the security team
- Quarterly vulnerability trends presented at the management review (POL-012)`,
      requiresAcknowledgment: false,
      tags: ['ISO 27001', 'vulnerability management', 'patch management'],
      keywords: ['vulnerability', 'patching', 'CVSS', 'scanning', 'remediation'],
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });
  ctx.policyIds['STD-006'] = std006.id;

  const std007 = await prisma.policyDocument.create({
    data: {
      documentId: 'STD-007',
      title: 'Media Handling & Disposal Procedure',
      documentType: 'PROCEDURE',
      status: 'PENDING_REVIEW',
      version: '0.9',
      majorVersion: 0,
      minorVersion: 9,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'MANAGEMENT',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CTO',
      documentOwnerId: ctx.users.cto,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CTO',
      approverId: ctx.users.cto,
      approvalDate: weeksAgo(1),
      effectiveDate: weeksAgo(1),
      nextReviewDate: monthsFromNow(11),
      purpose: 'Define the procedures for handling, transporting, storing, and disposing of media containing ClearStream Payments information, in accordance with ISO 27001:2022 Annex A controls A.7.10 and A.7.14.',
      scope: 'This procedure applies to all physical and electronic media that store, process, or carry ClearStream information, including hard drives, SSDs, USB devices, backup tapes, optical media, paper documents, and mobile devices.',
      content: `## 1. Document Owner

The CTO (Lars Becker) is the owner of this procedure. The ISMS Manager (Roisin Kelly) coordinates media handling activities and disposal vendor management.

## 2. Scope

This procedure covers:
- Media classification and labelling
- Handling requirements by classification level
- Storage requirements for physical and electronic media
- Transport requirements for media containing sensitive information
- Disposal methods aligned with NIST SP 800-88
- Certificates of destruction and audit trail
- Disposal vendor requirements
- Media reuse and repurposing procedures

## 3. Management Approval

This procedure is pending final approval by the CTO. It has been reviewed by the Security Lead and ISMS Manager.

## 4. Review Cadence

This procedure is reviewed annually or when triggered by:
- Media-related security incidents (lost or improperly disposed media)
- Changes to media sanitisation standards or guidelines
- Introduction of new media types or storage technologies
- Audit findings related to media handling

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.9 | Current | Roisin Kelly | Initial draft — pending review |

## 6. Media Classification Labels

All media must be labelled in accordance with POL-004 Data Classification Policy:

| Classification | Label Colour | Physical Label | Electronic Marking |
|---------------|-------------|----------------|-------------------|
| PUBLIC | Green | Green sticker "PUBLIC" | File/folder name suffix "_PUBLIC" |
| INTERNAL | Blue | Blue sticker "INTERNAL" | File/folder name suffix "_INTERNAL" |
| CONFIDENTIAL | Orange | Orange sticker "CONFIDENTIAL" | File/folder name suffix "_CONFIDENTIAL" + access controls |
| RESTRICTED | Red | Red sticker "RESTRICTED" + asset tag | File/folder name suffix "_RESTRICTED" + encryption + access logging |

Unlabelled media is treated as CONFIDENTIAL until classified.

## 7. Handling Requirements

| Classification | Handling Rules |
|---------------|---------------|
| PUBLIC | No special handling required |
| INTERNAL | Keep within ClearStream premises or approved cloud storage; lock away when not in use |
| CONFIDENTIAL | Encrypt at rest; lock in secure storage when not in use; log access; authorised personnel only |
| RESTRICTED | Full-disk encryption; locked safe or secure room; dual-person access for physical media; complete access audit trail |

## 8. Storage Requirements

- **Paper documents**: CONFIDENTIAL and RESTRICTED documents stored in locked filing cabinets; keys held by authorised personnel only
- **Electronic media (USB, external drives)**: Stored in locked cabinets in the IT store room; hardware-encrypted devices only
- **Backup media**: Stored in fire-rated safe in Dublin DC; offsite copies in vendor-managed secure storage
- **Server hard drives**: Remain in locked server cabinets within the data centre (POL-015)

## 9. Transport Requirements

| Classification | Transport Method |
|---------------|-----------------|
| PUBLIC / INTERNAL | Standard courier or internal mail |
| CONFIDENTIAL | Encrypted media, tracked courier service, tamper-evident packaging |
| RESTRICTED | Encrypted media, bonded courier with chain-of-custody documentation, tamper-evident packaging, sender and recipient sign-off |

Cross-border transport of RESTRICTED media requires CISO approval and compliance with export regulations.

## 10. Disposal Methods (NIST SP 800-88)

| Media Type | Classification | Method | NIST SP 800-88 Level |
|-----------|---------------|--------|---------------------|
| Hard Drives (HDD) | PUBLIC/INTERNAL | Overwrite (3-pass) | Clear |
| Hard Drives (HDD) | CONFIDENTIAL | Degauss + overwrite | Purge |
| Hard Drives (HDD) | RESTRICTED | Physical destruction (shred) | Destroy |
| Solid State Drives (SSD) | Any classification | Cryptographic erase + physical destruction | Purge/Destroy |
| USB Devices | PUBLIC/INTERNAL | Overwrite + reformat | Clear |
| USB Devices | CONFIDENTIAL/RESTRICTED | Physical destruction | Destroy |
| Optical Media (CD/DVD) | Any classification | Physical destruction (shred) | Destroy |
| Paper Documents | CONFIDENTIAL/RESTRICTED | Cross-cut shredding (DIN 66399 P-4 minimum) | Destroy |
| Paper Documents | INTERNAL | Cross-cut shredding (DIN 66399 P-3) | Destroy |
| Backup Tapes | Any classification | Degauss + physical destruction | Destroy |

## 11. Certificates of Destruction

- All disposal of CONFIDENTIAL and RESTRICTED media requires a Certificate of Destruction
- Certificate includes: media description, serial number (if applicable), disposal method, date, personnel involved, witness signature
- Certificates are retained for 7 years and available for audit
- For vendor-performed destruction: vendor provides certificate within 5 business days

## 12. Disposal Vendor Requirements

ClearStream's approved media disposal vendor must:
- Hold ISO 27001 certification (or equivalent)
- Provide on-site destruction services or secure transport with chain-of-custody
- Issue certificates of destruction for every batch
- Allow ClearStream audit rights (annual vendor audit)
- Carry professional indemnity insurance of at least EUR 5 million
- Current approved vendor: reviewed and re-assessed annually per STD-009

## 13. Media Reuse

Media may be reused within ClearStream provided:
- All previous data is sanitised to the appropriate NIST SP 800-88 level
- Sanitisation is verified (write verification for overwrite, attestation for crypto-erase)
- The media is relabelled with the new classification
- A reuse record is created in the asset management system (POL-016)

## 14. Risk Appetite Alignment

ClearStream has zero tolerance for improper disposal of media containing payment card data or customer PII. The organisation requires physical destruction for all RESTRICTED media and SSDs regardless of classification. Media handling failures are treated as security incidents and investigated accordingly.

## 15. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| CTO (Lars Becker) | Procedure owner, disposal vendor approval |
| ISMS Manager (Roisin Kelly) | Disposal coordination, certificate management, vendor oversight |
| Security Lead (Markus Weber) | Sanitisation standards, technical verification |
| IT Operations | Day-to-day media handling, labelling, storage |
| All Personnel | Handle media per classification, return media for proper disposal |

## 16. Exceptions Process

Exceptions to media handling or disposal requirements must be:
1. Submitted to the ISMS Manager with justification
2. Approved by the CTO (for disposal methods) or CISO (for handling/transport)
3. Documented with compensating controls
4. Time-limited and reviewed at the next annual review

## 17. Awareness Requirements

- All staff receive media handling training during onboarding (handling, labelling, disposal bins)
- Annual refresher included in security awareness training (POL-013)
- Secure disposal bins located on every floor of each office — emptied weekly by authorised personnel
- IT staff receive specific training on NIST SP 800-88 sanitisation methods`,
      requiresAcknowledgment: false,
      tags: ['ISO 27001', 'media handling', 'disposal', 'sanitisation'],
      keywords: ['media handling', 'disposal', 'sanitisation', 'NIST SP 800-88', 'destruction'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['STD-007'] = std007.id;

  const std008 = await prisma.policyDocument.create({
    data: {
      documentId: 'STD-008',
      title: 'Capacity Management Procedure',
      documentType: 'PROCEDURE',
      status: 'PENDING_REVIEW',
      version: '0.9',
      majorVersion: 0,
      minorVersion: 9,
      classification: 'INTERNAL',
      approvalLevel: 'MANAGEMENT',
      reviewFrequency: 'QUARTERLY',
      documentOwner: 'CTO',
      documentOwnerId: ctx.users.cto,
      author: 'CTO',
      authorId: ctx.users.cto,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: weeksAgo(1),
      effectiveDate: weeksAgo(1),
      nextReviewDate: monthsFromNow(3),
      purpose: 'Define the procedures for monitoring, managing, and planning capacity across ClearStream Payments information systems to ensure adequate performance and availability, in accordance with ISO 27001:2022 Annex A control A.8.6.',
      scope: 'This procedure applies to all ClearStream production systems, infrastructure components, cloud services, and network resources across all environments.',
      content: `## 1. Document Owner

The CTO (Lars Becker) is the owner of this procedure and is responsible for capacity planning, infrastructure investment decisions, and performance management.

## 2. Scope

This procedure covers:
- Capacity monitoring for all production systems
- Thresholds and alerting
- Capacity planning and forecasting
- Demand management
- Scalability requirements for critical systems
- Capacity reporting
- Cost optimisation

## 3. Management Approval

This procedure is pending final review by the CISO. The CTO has operational authority for capacity management decisions within the approved infrastructure budget.

## 4. Review Cadence

This procedure is reviewed quarterly to align with the capacity planning cycle. Additional reviews are triggered by:
- Performance incidents caused by capacity constraints
- Significant changes in transaction volumes or user base
- Infrastructure migration or cloud adoption milestones
- Budget cycle changes

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.9 | Current | Lars Becker | Initial draft — pending review |

## 6. Capacity Monitoring

### 6.1 Monitored Resources

All production systems are monitored for the following capacity metrics:

| Resource | Metrics | Collection Interval |
|----------|---------|-------------------|
| CPU | Utilisation %, load average, core count | 30 seconds |
| Memory | Used/available, swap usage, cache hit rate | 30 seconds |
| Storage | Used/available, IOPS, latency, growth rate | 1 minute |
| Network | Bandwidth utilisation, packet loss, latency | 30 seconds |
| Database | Connection pool usage, query queue depth, replication lag | 30 seconds |
| Application | Request rate, response time, error rate, queue depth | 10 seconds |

### 6.2 Monitoring Tools

- Infrastructure: Prometheus + Grafana (self-hosted in Dublin DC)
- Cloud resources: AWS CloudWatch, Azure Monitor
- Application performance: Datadog APM
- Network: SNMP-based monitoring + NetFlow analysis

## 7. Thresholds and Alerting

| Resource | Warning Threshold | Critical Threshold | Action |
|----------|------------------|-------------------|--------|
| CPU utilisation | 70% sustained (5 min) | 85% sustained (5 min) | Warning: investigate; Critical: scale up or optimise |
| Memory utilisation | 70% | 85% | Warning: investigate; Critical: add memory or optimise |
| Storage utilisation | 70% | 85% | Warning: plan expansion; Critical: emergency expansion |
| Storage growth rate | Projected to reach 85% within 30 days | Projected to reach 95% within 7 days | Proactive expansion |
| Network bandwidth | 60% | 80% | Warning: review traffic; Critical: upgrade or optimise |
| Database connections | 70% of pool | 85% of pool | Warning: optimise queries; Critical: increase pool |
| Response time (P95) | 500ms | 2000ms | Warning: investigate; Critical: scale or optimise |

Alerts are routed to the Infrastructure team during business hours and to the on-call engineer out of hours. Critical alerts for Tier 1 systems (payment gateway) are also routed to the Security Lead.

## 8. Capacity Planning Process

### 8.1 Quarterly Review

Each quarter, the Infrastructure team conducts a capacity review:
1. Analyse capacity trends for the past quarter
2. Identify systems approaching warning thresholds
3. Forecast capacity needs for the next quarter based on business growth
4. Recommend infrastructure changes (scale up, scale out, optimise, decommission)
5. Present recommendations to the CTO for approval

### 8.2 Annual Forecasting

The annual capacity forecast is produced in Q4 and includes:
- 12-month transaction volume projection (based on business plan)
- Infrastructure growth plan aligned with projected demand
- Budget requirements for capacity expansion
- Technology refresh schedule (end-of-life hardware replacement)
- Cloud vs on-premises cost analysis for new workloads

## 9. Demand Management

- Payment gateway: auto-scaling configured for transaction spikes (Black Friday, month-end processing)
- Rate limiting applied to APIs to prevent resource exhaustion (see POL-017)
- Batch processing scheduled during off-peak hours (02:00-06:00 UTC)
- Performance testing conducted before major releases to validate capacity requirements

## 10. Scalability Requirements

### 10.1 Payment Gateway

- Horizontal auto-scaling: minimum 3 instances, maximum 12 instances
- Scale-up trigger: CPU > 60% or response time P95 > 200ms
- Scale-down trigger: CPU < 30% for 15 minutes
- Load testing: quarterly, simulating 3x peak transaction volume

### 10.2 Other Critical Systems

- Merchant portal: auto-scaling (2-6 instances)
- API gateway: auto-scaling (2-8 instances)
- Database: vertical scaling with read replicas for query-heavy workloads

## 11. Capacity Reporting

| Report | Audience | Frequency | Content |
|--------|----------|-----------|---------|
| Capacity dashboard | Infrastructure team | Real-time | Current utilisation, alerts |
| Monthly capacity summary | CTO | Monthly | Trends, forecasts, recommendations |
| Quarterly capacity review | Executive team | Quarterly | Strategic capacity assessment |
| Annual capacity plan | Board (via CTO) | Annual | Investment plan, growth forecast |

## 12. Cost Optimisation

- Right-sizing reviews conducted monthly for cloud resources (identify over-provisioned instances)
- Reserved instances purchased for stable workloads (1-year or 3-year commitments where appropriate)
- Spot instances used for non-critical batch processing and testing
- Storage tiering: hot/warm/cold based on access patterns
- Idle resource cleanup: unused resources flagged and decommissioned within 30 days

## 13. Risk Appetite Alignment

ClearStream has zero tolerance for capacity-related outages on Tier 1 payment systems. The payment gateway must maintain headroom to handle 3x peak transaction volume at all times. The organisation accepts moderate risk for Tier 3 systems, where cost optimisation may result in occasional performance degradation during peak periods. Infrastructure investment decisions balance cost efficiency with availability requirements.

## 14. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| CTO (Lars Becker) | Procedure owner, capacity strategy, investment approval |
| Infrastructure Team | Day-to-day monitoring, alerting, scaling operations |
| Security Lead (Markus Weber) | Capacity for security infrastructure (SIEM, logging) |
| Application Owners | Define performance requirements, validate capacity changes |
| CFO (Dieter Schneider) | Approve capacity-related capital expenditure |

## 15. Exceptions Process

Exceptions to capacity management requirements (e.g., running above critical threshold temporarily) must be:
1. Documented with risk assessment and timeline
2. Approved by the CTO
3. Subject to enhanced monitoring during the exception period
4. Resolved within the agreed timeline (maximum 30 days)

## 16. Awareness Requirements

- Infrastructure team receives training on monitoring tools and capacity planning during onboarding
- Quarterly capacity review results shared with the engineering team
- Application developers trained on performance best practices and capacity impact of code changes
- Monthly CTO report on infrastructure health shared with the Executive Leadership Team`,
      requiresAcknowledgment: false,
      tags: ['ISO 27001', 'capacity management', 'performance'],
      keywords: ['capacity management', 'monitoring', 'scalability', 'performance', 'cost optimisation'],
      organisationId: ctx.orgId,
      createdById: ctx.users.cto,
    },
  });
  ctx.policyIds['STD-008'] = std008.id;

  const std009 = await prisma.policyDocument.create({
    data: {
      documentId: 'STD-009',
      title: 'Supplier Security Assessment Procedure',
      documentType: 'PROCEDURE',
      status: 'PENDING_REVIEW',
      version: '0.9',
      majorVersion: 0,
      minorVersion: 9,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'EXECUTIVE',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CISO',
      documentOwnerId: ctx.users.ciso,
      author: 'Compliance Officer',
      authorId: ctx.users.complianceOfficer,
      approvedBy: 'CEO',
      approverId: ctx.users.admin,
      approvalDate: weeksAgo(1),
      effectiveDate: weeksAgo(1),
      nextReviewDate: monthsFromNow(11),
      purpose: 'Define the procedure for assessing and managing the information security posture of ClearStream Payments suppliers and third-party service providers, in accordance with ISO 27001:2022 Annex A controls A.5.19 through A.5.23.',
      scope: 'This procedure applies to all third-party suppliers, service providers, and partners that access, process, store, or transmit ClearStream information, or provide ICT services that support ClearStream operations.',
      content: `## 1. Document Owner

The CISO (Siobhan O'Brien) is the owner of this procedure. The Compliance Officer (Sofia Ferreira) is responsible for conducting assessments and maintaining the supplier register.

## 2. Scope

This procedure covers:
- Supplier classification by risk level
- Security assessment methodology
- Required certifications and evidence
- DORA ICT concentration risk assessment
- Ongoing monitoring and reassessment
- Supply chain security requirements
- Contract security clauses
- Exit strategy requirements

## 3. Management Approval

This procedure is pending final approval by the CEO (Fiona Murphy). It has been reviewed by the CISO, Compliance Officer, and Procurement team. Critical supplier engagements require Board notification.

## 4. Review Cadence

This procedure is reviewed annually or when triggered by:
- Supplier security incidents affecting ClearStream
- Changes to DORA ICT third-party risk requirements
- Significant changes to the supplier portfolio
- Results of supplier audits revealing systemic issues

## 5. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.9 | Current | Sofia Ferreira | Initial draft — pending review |

## 6. Supplier Classification

All suppliers are classified based on their access to ClearStream data and their business impact:

| Classification | Criteria | Examples |
|---------------|----------|---------|
| Critical | Direct access to PCI CDE or customer PII; single point of failure; DORA-defined critical ICT provider | Payment processor, cloud hosting provider, HSM vendor |
| Important | Access to CONFIDENTIAL data or significant business process dependency | SIEM provider, email service, HR system vendor |
| Standard | Limited data access (INTERNAL/PUBLIC only); easily replaceable | Office supplies, catering, general IT support |

### 6.1 Classification Factors

- Volume and sensitivity of ClearStream data accessed
- Criticality to payment processing operations
- Substitutability (availability of alternative suppliers)
- Regulatory requirements (DORA ICT provider classification)
- Geographic and jurisdictional considerations

## 7. Assessment Methodology

### 7.1 Assessment by Classification

| Classification | Assessment Method | Depth |
|---------------|-------------------|-------|
| Critical | Full security questionnaire + evidence review + on-site audit | Comprehensive — all control domains |
| Important | Security questionnaire + evidence review (remote) | Focused — key control domains |
| Standard | Self-declaration + certification check | Basic — essential controls only |

### 7.2 Assessment Domains

The ClearStream Supplier Security Questionnaire covers:
1. **Governance**: Information security policy, ISMS, management commitment
2. **Risk Management**: Risk assessment process, risk treatment
3. **Human Resources**: Screening, training, termination procedures
4. **Access Control**: Authentication, authorisation, privileged access
5. **Cryptography**: Encryption standards, key management
6. **Physical Security**: Data centre security, environmental controls
7. **Operations Security**: Change management, vulnerability management, logging
8. **Incident Management**: Incident response, notification procedures
9. **Business Continuity**: BCP/DR, testing, RTO/RPO
10. **Compliance**: Regulatory compliance, audit rights, certifications

### 7.3 Scoring

Each domain is scored on a 1-5 maturity scale:
- 1: Ad hoc — no formal processes
- 2: Developing — some processes defined
- 3: Defined — documented and consistently applied
- 4: Managed — measured and monitored
- 5: Optimising — continuously improving

Critical suppliers must achieve a minimum average score of 3.5 with no domain below 3.0.
Important suppliers must achieve a minimum average score of 3.0 with no domain below 2.0.

## 8. Required Certifications

| Classification | Mandatory Certifications |
|---------------|------------------------|
| Critical | SOC 2 Type II **or** ISO 27001 certification (current, from accredited body) |
| Important | SOC 2 Type I **or** ISO 27001 **or** equivalent (e.g., CSA STAR Level 2) |
| Standard | No certification required; self-declaration of security practices |

For PCI-scope suppliers: current PCI DSS AOC (Attestation of Compliance) is mandatory.

## 9. DORA ICT Concentration Risk Assessment

In accordance with DORA (EU 2022/2554) Article 28-29:
- ClearStream maintains a register of all ICT third-party service providers
- Concentration risk is assessed for Critical ICT providers:
  - Single-provider dependency analysis
  - Geographic concentration (providers in the same jurisdiction or data centre)
  - Sub-contractor dependency chains
  - Substitutability assessment (time and cost to switch providers)
- Concentration risk findings are reported to the Board and included in the ICT risk management framework
- Exit plans are mandatory for all Critical ICT providers (see Section 13)

## 10. Ongoing Monitoring

| Classification | Reassessment Frequency | Monitoring Activities |
|---------------|----------------------|---------------------|
| Critical | Annual (full reassessment) | Continuous: incident notifications, certification status, news monitoring |
| Important | Biennial (questionnaire + evidence) | Semi-annual: certification status check, incident review |
| Standard | Triennial (self-declaration refresh) | Annual: basic compliance check |

### 10.1 Triggers for Ad Hoc Reassessment

- Security incident reported by or affecting the supplier
- Significant change in supplier ownership, management, or business model
- Regulatory enforcement action against the supplier
- Material change in the services provided to ClearStream
- Adverse findings in public security assessments or media reports

## 11. Supply Chain Security

ClearStream requires suppliers to manage security risks in their own supply chain:
- Critical suppliers must demonstrate that their key sub-contractors meet equivalent security standards
- Right to audit extends to the supplier's material sub-contractors (where permitted by law)
- Suppliers must notify ClearStream within 48 hours of any change to sub-contractors processing ClearStream data
- Sub-contractor security is assessed as part of the supplier reassessment cycle

## 12. Contract Security Clauses

All supplier contracts must include (at minimum):

| Clause | Description |
|--------|-------------|
| Right to audit | ClearStream's right to audit supplier security controls (annually for Critical, on-demand for cause) |
| Incident notification | Supplier must notify ClearStream within 24 hours of a security incident affecting ClearStream data |
| Data handling | Data classification, encryption requirements, processing locations, sub-processing |
| Confidentiality | NDA covering ClearStream information assets |
| Compliance | Supplier's obligation to maintain relevant certifications and comply with applicable regulations |
| Termination assistance | Supplier's obligation to support data migration and secure deletion upon contract termination |
| Liability | Indemnification for security breaches caused by supplier negligence |

## 13. Exit Strategy Requirements

For all Critical and Important suppliers, ClearStream maintains documented exit strategies:
- **Transition plan**: Steps to migrate services to an alternative provider or in-house
- **Data extraction**: Defined data formats and migration procedures
- **Timeline**: Maximum 6 months for Critical supplier transition (12 months for complex ICT services)
- **Data destruction**: Supplier commits to secure destruction of all ClearStream data within 30 days of contract termination, with certificate of destruction
- **Knowledge transfer**: Supplier provides documentation and support during transition
- Exit plans are tested conceptually (desktop exercise) every 2 years for Critical suppliers

## 14. Risk Appetite Alignment

ClearStream has zero tolerance for Critical suppliers operating without current ISO 27001 or SOC 2 Type II certification. The organisation accepts low risk for Important suppliers with equivalent controls demonstrated through the assessment process. Concentration risk is actively managed — no single supplier may represent more than 40% of ClearStream's ICT service expenditure without Board approval and a documented exit plan.

## 15. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| CISO (Siobhan O'Brien) | Procedure owner, strategic supplier risk oversight |
| Compliance Officer (Sofia Ferreira) | Assessment execution, supplier register maintenance, contract review |
| Procurement | Commercial supplier management, contract negotiation |
| DPO (Ana Costa) | Data processing agreement review, GDPR compliance for suppliers |
| CTO (Lars Becker) | Technical assessment for ICT suppliers, exit plan feasibility |
| Risk Analyst (Cian Doyle) | Concentration risk analysis, supplier risk scoring |
| CEO (Fiona Murphy) | Approve Critical supplier engagements, Board reporting |

## 16. Exceptions Process

Exceptions to supplier security requirements (e.g., engaging a Critical supplier without ISO 27001) must be:
1. Submitted by the business owner with a detailed risk assessment
2. Include compensating controls and a remediation timeline
3. Approved by the CISO and CEO
4. Time-limited (maximum 12 months) with mandatory progress reviews
5. Reported to the Board as part of the ICT risk management report

## 17. Awareness Requirements

- Procurement staff receive annual training on supplier security requirements and this procedure
- Business owners sponsoring new suppliers are briefed on classification criteria and assessment requirements
- Quarterly supplier risk summary presented at the management review (POL-012)
- Supplier security incidents are shared (anonymised) in the monthly security briefing`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'supplier security', 'third-party risk', 'DORA'],
      keywords: ['supplier assessment', 'third-party risk', 'DORA', 'concentration risk', 'supply chain'],
      organisationId: ctx.orgId,
      createdById: ctx.users.complianceOfficer,
    },
  });
  ctx.policyIds['STD-009'] = std009.id;

  console.log(`  ✅ 18 ISO 27001 policy documents seeded (5 Wave 1 + 8 Wave 2 + 5 Wave 3)`);
}
