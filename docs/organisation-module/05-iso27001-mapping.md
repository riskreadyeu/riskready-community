# ISO 27001:2022 Mapping

This document provides a comprehensive mapping between the Organisation Module entities and ISO 27001:2022 requirements, demonstrating how the module supports compliance with each mandatory clause.

---

## Table of Contents

1. [Mapping Overview](#mapping-overview)
2. [Clause 4: Context of the Organisation](#clause-4-context-of-the-organisation)
3. [Clause 5: Leadership](#clause-5-leadership)
4. [Clause 6: Planning](#clause-6-planning)
5. [Clause 7: Support](#clause-7-support)
6. [Clause 8: Operation](#clause-8-operation)
7. [Clause 9: Performance Evaluation](#clause-9-performance-evaluation)
8. [Clause 10: Improvement](#clause-10-improvement)
9. [Annex A Control Mapping](#annex-a-control-mapping)
10. [Audit Evidence Matrix](#audit-evidence-matrix)

---

## Mapping Overview

### Coverage Summary

| Clause | Coverage | Primary Entities |
|--------|----------|------------------|
| **4. Context** | ✅ Full | OrganisationProfile, ContextIssue, InterestedParty |
| **5. Leadership** | ✅ Full | ExecutivePosition, KeyPersonnel, SecurityCommittee |
| **6. Planning** | ⚠️ Partial | ContextIssue, OrganisationProfile (requires Risk module) |
| **7. Support** | ✅ Full | Department, KeyPersonnel, SecurityChampion, CommitteeMeeting |
| **8. Operation** | ⚠️ Partial | BusinessProcess, ExternalDependency (requires Risk module) |
| **9. Performance** | ✅ Full | ApplicableFramework, CommitteeMeeting, BusinessProcess |
| **10. Improvement** | ✅ Full | MeetingDecision, MeetingActionItem |

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully supported by Organisation Module |
| ⚠️ | Partially supported (requires additional modules) |
| 🔗 | Supported via integration with other modules |

---

## Clause 4: Context of the Organisation

### 4.1 Understanding the Organisation and its Context

**Requirement:** The organisation shall determine external and internal issues that are relevant to its purpose and that affect its ability to achieve the intended outcome(s) of its information security management system.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Identify internal issues | ContextIssue | `issueType: "internal"`, `category`, `title`, `description` | List of internal context issues |
| Identify external issues | ContextIssue | `issueType: "external"`, `category`, `title`, `description` | List of external context issues |
| Assess impact | ContextIssue | `impactType`, `impactLevel`, `likelihood` | Impact assessment records |
| Monitor issues | ContextIssue | `monitoringFrequency`, `lastReviewDate`, `nextReviewDate`, `trendDirection` | Review history |
| Link to ISMS | ContextIssue | `ismsRelevance`, `affectedAreas`, `controlImplications` | ISMS relevance documentation |

#### How to Demonstrate Compliance

1. **Document all context issues** in the ContextIssue entity
2. **Categorise issues** as internal or external
3. **Assess impact** using impact level and likelihood fields
4. **Schedule regular reviews** using monitoring frequency
5. **Track trends** using trend direction field
6. **Link to ISMS** by documenting ISMS relevance

#### Sample Audit Questions

| Question | Where to Find Answer |
|----------|---------------------|
| "How do you identify internal issues?" | ContextIssue list filtered by `issueType: internal` |
| "How do you monitor external changes?" | ContextIssue records with review dates and trend tracking |
| "How are issues linked to your ISMS?" | `ismsRelevance` and `controlImplications` fields |

---

### 4.2 Understanding the Needs and Expectations of Interested Parties

**Requirement:** The organisation shall determine interested parties that are relevant to the information security management system and the requirements of these interested parties relevant to information security.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Identify interested parties | InterestedParty | `name`, `partyType`, `description` | Stakeholder register |
| Determine requirements | InterestedParty | `expectations`, `requirements`, `securityExpectations` | Requirements documentation |
| Analyse stakeholders | InterestedParty | `powerLevel`, `interestLevel`, `influenceLevel` | Stakeholder analysis |
| Plan engagement | InterestedParty | `engagementStrategy`, `communicationMethod`, `communicationFrequency` | Engagement plans |
| Link to ISMS | InterestedParty | `ismsRelevance`, `informationNeeds` | ISMS relevance |
| Regulatory requirements | Regulator | `name`, `regulatoryType`, `reportingRequirements` | Regulatory register |
| Framework requirements | ApplicableFramework | `name`, `keyRequirements`, `isApplicable` | Framework register |

#### How to Demonstrate Compliance

1. **Create InterestedParty records** for all stakeholders
2. **Document requirements** in expectations and requirements fields
3. **Conduct stakeholder analysis** using power/interest matrix
4. **Define engagement strategies** for each party
5. **Track regulatory requirements** in Regulator entity
6. **Document applicable frameworks** in ApplicableFramework entity

#### Sample Audit Questions

| Question | Where to Find Answer |
|----------|---------------------|
| "Who are your interested parties?" | InterestedParty list |
| "What are customer security requirements?" | InterestedParty records with `partyType: customer` |
| "How do you identify regulatory requirements?" | Regulator and ApplicableFramework lists |

---

### 4.3 Determining the Scope of the Information Security Management System

**Requirement:** The organisation shall determine the boundaries and applicability of the information security management system to establish its scope.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Define scope statement | OrganisationProfile | `ismsScope`, `scopeBoundaries` | ISMS scope document |
| Products/services in scope | OrganisationProfile, ProductService | `productsServicesInScope`, `inIsmsScope` | Scope inventory |
| Departments in scope | OrganisationProfile, Department | `departmentsInScope` | Department list |
| Locations in scope | OrganisationProfile, Location | `locationsInScope`, `inIsmsScope` | Location list |
| Processes in scope | OrganisationProfile, BusinessProcess | `processesInScope` | Process list |
| Systems in scope | OrganisationProfile, TechnologyPlatform | `systemsInScope`, `inIsmsScope` | System list |
| Document exclusions | OrganisationProfile | `scopeExclusions`, `exclusionJustification` | Exclusion documentation |
| Consider context | ContextIssue, InterestedParty | All fields | Context documentation |

#### How to Demonstrate Compliance

1. **Write scope statement** in OrganisationProfile.ismsScope
2. **Define boundaries** in scopeBoundaries field
3. **Mark scope inclusion** on all relevant entities using `inIsmsScope` field
4. **Document exclusions** with justification
5. **Link to context** by referencing context issues and interested parties

#### Sample Audit Questions

| Question | Where to Find Answer |
|----------|---------------------|
| "What is your ISMS scope?" | OrganisationProfile.ismsScope |
| "Which locations are in scope?" | Location list filtered by `inIsmsScope: true` |
| "What is excluded and why?" | OrganisationProfile.scopeExclusions and exclusionJustification |

---

### 4.4 Information Security Management System

**Requirement:** The organisation shall establish, implement, maintain and continually improve an information security management system.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Establish ISMS | OrganisationProfile | `ismsScope`, `ismsPolicy`, `ismsObjectives` | ISMS documentation |
| Implement ISMS | BusinessProcess, SecurityCommittee | Process and governance records | Implementation evidence |
| Maintain ISMS | CommitteeMeeting, MeetingDecision | Meeting and decision records | Maintenance records |
| Continually improve | MeetingActionItem, ContextIssue | Action items, trend tracking | Improvement records |

---

## Clause 5: Leadership

### 5.1 Leadership and Commitment

**Requirement:** Top management shall demonstrate leadership and commitment with respect to the information security management system.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Top management identified | ExecutivePosition | `isCeo`, `executiveLevel`, `title` | Executive register |
| Security responsibilities | ExecutivePosition | `securityResponsibilities`, `isSecurityCommitteeMember` | Responsibility matrix |
| Policy establishment | OrganisationProfile | `ismsPolicy` | Policy document |
| Objectives establishment | OrganisationProfile | `ismsObjectives` | Objectives document |
| Resource provision | Department | `budget`, `headcount` | Resource allocation |
| Committee participation | SecurityCommittee, CommitteeMembership | Membership records | Committee records |
| Risk authority | ExecutivePosition | `riskAuthorityLevel`, `budgetAuthority` | Authority matrix |

#### How to Demonstrate Compliance

1. **Document executive positions** with security responsibilities
2. **Show committee membership** of senior management
3. **Evidence policy approval** through meeting decisions
4. **Track resource allocation** through department budgets
5. **Document authority levels** for risk decisions

#### Sample Audit Questions

| Question | Where to Find Answer |
|----------|---------------------|
| "How does top management demonstrate commitment?" | ExecutivePosition records, Committee membership |
| "Who approved the security policy?" | MeetingDecision records |
| "What resources are allocated to security?" | Department budgets, KeyPersonnel records |

---

### 5.2 Policy

**Requirement:** Top management shall establish an information security policy.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Policy statement | OrganisationProfile | `ismsPolicy` | Policy document |
| Policy objectives | OrganisationProfile | `ismsObjectives` | Objectives list |
| Policy approval | MeetingDecision | Decision records | Approval evidence |
| Policy communication | InterestedParty | `communicationMethod` | Communication records |

---

### 5.3 Organisational Roles, Responsibilities and Authorities

**Requirement:** Top management shall ensure that the responsibilities and authorities for roles relevant to information security are assigned and communicated.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| ISMS roles defined | KeyPersonnel | `ismsRole`, `securityResponsibilities`, `authorityLevel` | Role register |
| Executive responsibilities | ExecutivePosition | `securityResponsibilities`, `authorityLevel` | Executive matrix |
| Department responsibilities | Department | `keyResponsibilities` | Department records |
| Security champions | SecurityChampion | `responsibilities`, `departmentId` | Champion network |
| Backup assignments | KeyPersonnel | `backupPersonId` | Succession plan |
| Reporting lines | ExecutivePosition | `reportsToId` | Org chart |

#### How to Demonstrate Compliance

1. **Document all ISMS roles** in KeyPersonnel
2. **Assign security responsibilities** to executives
3. **Establish security champion network** across departments
4. **Define backup personnel** for key roles
5. **Document reporting lines** in executive positions

#### Sample Audit Questions

| Question | Where to Find Answer |
|----------|---------------------|
| "Who is responsible for ISMS?" | KeyPersonnel with `ismsRole: ISMS Manager` |
| "How are responsibilities communicated?" | Role documentation, training records |
| "Who is the backup for the CISO?" | KeyPersonnel.backupPersonId |

---

## Clause 6: Planning

### 6.1 Actions to Address Risks and Opportunities

**Requirement:** When planning for the information security management system, the organisation shall consider the issues and requirements and determine the risks and opportunities.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Consider context issues | ContextIssue | All fields | Context register |
| Consider requirements | InterestedParty | `requirements`, `securityExpectations` | Requirements register |
| Risk appetite | OrganisationProfile | `riskAppetite`, `riskTolerance` | Risk appetite statement |
| Escalate to risk | ContextIssue | `escalatedToRisk`, `linkedRiskId` | Risk escalation records |
| Response planning | ContextIssue | `responseStrategy`, `mitigationActions` | Response plans |

#### Integration Required

⚠️ **Note:** Full compliance with Clause 6.1 requires integration with a **Risk Management module** for:
- Risk register
- Risk assessment methodology
- Risk treatment plans
- Statement of Applicability (SoA)

---

### 6.2 Information Security Objectives and Planning to Achieve Them

**Requirement:** The organisation shall establish information security objectives at relevant functions and levels.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| ISMS objectives | OrganisationProfile | `ismsObjectives` | Objectives document |
| Objective tracking | MeetingActionItem | Action items for objectives | Progress records |
| Objective review | CommitteeMeeting | Meeting records | Review evidence |
| Process KPIs | BusinessProcess | `kpis`, `performanceIndicators` | KPI records |

---

## Clause 7: Support

### 7.1 Resources

**Requirement:** The organisation shall determine and provide the resources needed for the establishment, implementation, maintenance and continual improvement of the information security management system.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Budget allocation | Department | `budget`, `budgetCurrency` | Budget records |
| Headcount | Department | `headcount`, `contractorCount` | Staffing records |
| Security personnel | KeyPersonnel | All records | Personnel register |
| Security champions | SecurityChampion | All records | Champion network |
| Committee resources | SecurityCommittee | Membership, meetings | Governance records |

---

### 7.2 Competence

**Requirement:** The organisation shall determine the necessary competence of person(s) doing work under its control that affects its information security performance.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Competence requirements | KeyPersonnel | `ismsRole`, `securityResponsibilities` | Role requirements |
| Training records | KeyPersonnel | `trainingCompleted`, `lastTrainingDate` | Training log |
| Certifications | KeyPersonnel | `certifications` | Certification records |
| Champion training | SecurityChampion | `trainingCompleted`, `lastTrainingDate` | Training log |

#### Sample Audit Questions

| Question | Where to Find Answer |
|----------|---------------------|
| "How do you ensure competence?" | Training records in KeyPersonnel |
| "What certifications do security staff hold?" | KeyPersonnel.certifications |
| "When was the last security training?" | lastTrainingDate fields |

---

### 7.3 Awareness

**Requirement:** Persons doing work under the organisation's control shall be aware of the information security policy and their contribution to the effectiveness of the ISMS.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Security champions | SecurityChampion | Network across departments | Awareness network |
| Training tracking | KeyPersonnel, SecurityChampion | Training fields | Training records |
| Communication | InterestedParty | `communicationMethod`, `communicationFrequency` | Communication plan |

---

### 7.4 Communication

**Requirement:** The organisation shall determine the need for internal and external communications relevant to the information security management system.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Internal communication | CommitteeMeeting | Meeting records, minutes | Meeting records |
| External communication | InterestedParty | `communicationMethod`, `communicationFrequency` | Communication plan |
| Regulatory communication | Regulator | `reportingFrequency`, `reportingRequirements` | Regulatory calendar |
| Decision communication | MeetingDecision | Decision records | Decision log |

---

### 7.5 Documented Information

**Requirement:** The organisation's information security management system shall include documented information required by this document and determined by the organisation as being necessary for the effectiveness of the ISMS.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Document creation | All entities | `createdAt`, `createdById` | Creation records |
| Document updates | All entities | `updatedAt`, `updatedById` | Update history |
| Meeting minutes | CommitteeMeeting | `minutes`, `attachments` | Meeting records |
| Decision records | MeetingDecision | All fields | Decision log |
| Version control | All entities | Timestamps | Audit trail |

---

## Clause 8: Operation

### 8.1 Operational Planning and Control

**Requirement:** The organisation shall plan, implement and control the processes needed to meet information security requirements.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Process documentation | BusinessProcess | All fields | Process register |
| Process ownership | BusinessProcess | `processOwnerId`, `processManagerId` | Ownership matrix |
| Process controls | BusinessProcess | `complianceRequirements`, `riskRating` | Control documentation |
| Outsourced processes | ExternalDependency | All fields | Supplier register |
| Supplier controls | ExternalDependency | `complianceCertifications`, `slaDetails` | Supplier assessments |
| Supplier risk | ExternalDependency | `riskRating`, `criticalityLevel` | Risk assessments |

#### Sample Audit Questions

| Question | Where to Find Answer |
|----------|---------------------|
| "How do you control outsourced processes?" | ExternalDependency records |
| "What supplier assessments do you conduct?" | lastAssessmentDate, complianceCertifications |
| "How do you manage supplier risk?" | riskRating, criticalityLevel, exitStrategy |

---

### 8.2 Information Security Risk Assessment

**Requirement:** The organisation shall perform information security risk assessments at planned intervals.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Context input | ContextIssue | All fields | Context register |
| Risk escalation | ContextIssue | `escalatedToRisk`, `linkedRiskId` | Escalation records |
| Risk appetite | OrganisationProfile | `riskAppetite`, `riskTolerance` | Risk criteria |

⚠️ **Note:** Full compliance requires **Risk Management module**.

---

### 8.3 Information Security Risk Treatment

**Requirement:** The organisation shall implement the information security risk treatment plan.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Treatment actions | MeetingActionItem | Action items for risk treatment | Action log |
| Treatment decisions | MeetingDecision | Risk-related decisions | Decision log |
| Mitigation actions | ContextIssue | `mitigationActions`, `responseStrategy` | Mitigation records |

⚠️ **Note:** Full compliance requires **Risk Management module** for SoA.

---

## Clause 9: Performance Evaluation

### 9.1 Monitoring, Measurement, Analysis and Evaluation

**Requirement:** The organisation shall evaluate the information security performance and the effectiveness of the ISMS.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Process KPIs | BusinessProcess | `kpis`, `performanceIndicators` | KPI records |
| Compliance monitoring | ApplicableFramework | `complianceStatus`, `compliancePercentage` | Compliance dashboard |
| Review scheduling | ContextIssue, ApplicableFramework | `lastReviewDate`, `nextReviewDate` | Review calendar |
| Trend analysis | ContextIssue | `trendDirection` | Trend reports |

---

### 9.2 Internal Audit

**Requirement:** The organisation shall conduct internal audits at planned intervals.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Audit scheduling | OrganisationProfile | `nextAuditDate` | Audit calendar |
| Audit review | CommitteeMeeting | Meeting records | Review evidence |
| Audit actions | MeetingActionItem | Audit-related actions | Action log |

⚠️ **Note:** Full compliance benefits from dedicated **Internal Audit module**.

---

### 9.3 Management Review

**Requirement:** Top management shall review the organisation's information security management system at planned intervals.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Review meetings | SecurityCommittee, CommitteeMeeting | All fields | Meeting records |
| Review inputs | CommitteeMeeting | `agenda`, `objectives` | Agenda records |
| Review outputs | MeetingDecision, MeetingActionItem | All fields | Decision/action log |
| Attendance | MeetingAttendance | All fields | Attendance records |
| Quorum | CommitteeMeeting | `quorumAchieved`, `quorumRequirement` | Quorum records |
| Minutes | CommitteeMeeting | `minutes`, `attachments` | Meeting minutes |

#### How to Demonstrate Compliance

1. **Schedule regular committee meetings** (at least annually)
2. **Document agenda** covering all required inputs
3. **Record attendance** with quorum verification
4. **Capture minutes** of discussions
5. **Record decisions** with voting if applicable
6. **Create action items** for follow-up
7. **Track action completion**

#### Sample Audit Questions

| Question | Where to Find Answer |
|----------|---------------------|
| "When was the last management review?" | CommitteeMeeting records |
| "What was discussed?" | Meeting agenda and minutes |
| "What decisions were made?" | MeetingDecision records |
| "What actions resulted?" | MeetingActionItem records |
| "Were actions completed?" | Action item status and completion dates |

---

## Clause 10: Improvement

### 10.1 Continual Improvement

**Requirement:** The organisation shall continually improve the suitability, adequacy and effectiveness of the information security management system.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Improvement decisions | MeetingDecision | `decisionType`, `implemented` | Decision log |
| Improvement actions | MeetingActionItem | All fields | Action log |
| Action tracking | MeetingActionItem | `status`, `progressPercentage`, `completionDate` | Progress records |
| Process improvement | BusinessProcess | `improvementOpportunities` | Improvement register |
| Trend monitoring | ContextIssue | `trendDirection` | Trend analysis |

---

### 10.2 Nonconformity and Corrective Action

**Requirement:** When a nonconformity occurs, the organisation shall react to the nonconformity, evaluate the need for action, implement any action needed, and review the effectiveness.

#### Mapping

| Requirement Element | Entity | Fields | Evidence |
|---------------------|--------|--------|----------|
| Corrective actions | MeetingActionItem | Action items from issues | Action log |
| Action review | MeetingActionItem | `requiresCommitteeReview`, `reviewed` | Review records |
| Effectiveness review | CommitteeMeeting | Meeting records | Review evidence |

⚠️ **Note:** Consider adding nonconformity classification to action items for full compliance.

---

## Annex A Control Mapping

The Organisation Module supports the following Annex A controls:

### A.5 Organisational Controls

| Control | Entity | Fields |
|---------|--------|--------|
| A.5.1 Policies | OrganisationProfile | `ismsPolicy` |
| A.5.2 Roles & responsibilities | KeyPersonnel, ExecutivePosition | Role assignments |
| A.5.3 Segregation of duties | Department, KeyPersonnel | Role separation |
| A.5.4 Management responsibilities | ExecutivePosition | `securityResponsibilities` |
| A.5.19 Supplier security | ExternalDependency | All fields |
| A.5.20 Supplier agreements | ExternalDependency | Contract fields |
| A.5.21 Supplier service delivery | ExternalDependency | SLA fields |
| A.5.22 Supplier monitoring | ExternalDependency | Assessment fields |
| A.5.23 Supplier changes | ExternalDependency | `exitStrategy` |
| A.5.29 Business continuity | BusinessProcess | BCP fields |
| A.5.31 Legal requirements | ApplicableFramework, Regulator | All fields |
| A.5.34 Privacy | Department | `handlesPersonalData` |

### A.7 Physical Controls

| Control | Entity | Fields |
|---------|--------|--------|
| A.7.1 Physical perimeters | Location | `physicalSecurityLevel` |
| A.7.2 Physical entry | Location | `accessControlType` |
| A.7.5 Secure areas | Location | `isDataCenter`, `hasServerRoom` |
| A.7.11 Supporting utilities | Location | `backupPower` |

---

## Audit Evidence Matrix

Use this matrix to quickly locate evidence for audit questions:

| Audit Topic | Primary Entity | Key Fields | Report/Export |
|-------------|----------------|------------|---------------|
| ISMS Scope | OrganisationProfile | ismsScope, scopeBoundaries | Scope Statement |
| Context Issues | ContextIssue | All | Context Register |
| Interested Parties | InterestedParty | All | Stakeholder Register |
| Roles & Responsibilities | KeyPersonnel | ismsRole, responsibilities | RACI Matrix |
| Management Commitment | ExecutivePosition | securityResponsibilities | Executive Matrix |
| Competence | KeyPersonnel | training, certifications | Training Register |
| Supplier Management | ExternalDependency | All | Supplier Register |
| Management Review | CommitteeMeeting | All | Meeting Minutes |
| Decisions | MeetingDecision | All | Decision Log |
| Actions | MeetingActionItem | All | Action Tracker |
| Compliance Status | ApplicableFramework | complianceStatus | Compliance Dashboard |

---

## Certification Readiness Checklist

Use this checklist to verify readiness for ISO 27001 certification:

### Clause 4 - Context ✅
- [ ] Organisation Profile complete with ISMS scope
- [ ] All locations documented with scope status
- [ ] Context issues documented (internal and external)
- [ ] Interested parties identified with requirements
- [ ] Applicable frameworks documented

### Clause 5 - Leadership ✅
- [ ] Executive positions documented with security responsibilities
- [ ] Key ISMS personnel assigned
- [ ] Security committee established
- [ ] ISMS policy documented
- [ ] ISMS objectives defined

### Clause 6 - Planning ⚠️
- [ ] Risk appetite documented
- [ ] Context issues linked to risks
- [ ] ISMS objectives measurable
- [ ] ⚠️ Risk register (requires Risk module)
- [ ] ⚠️ Statement of Applicability (requires Risk module)

### Clause 7 - Support ✅
- [ ] Resources allocated (budgets, headcount)
- [ ] Training records maintained
- [ ] Security champion network established
- [ ] Communication plans documented
- [ ] Document control in place

### Clause 8 - Operation ⚠️
- [ ] Business processes documented
- [ ] External dependencies documented
- [ ] Supplier assessments conducted
- [ ] ⚠️ Risk treatment plan (requires Risk module)

### Clause 9 - Performance ✅
- [ ] KPIs defined for processes
- [ ] Compliance monitoring in place
- [ ] Management review meetings scheduled
- [ ] Meeting minutes maintained
- [ ] ⚠️ Internal audit programme (benefits from Audit module)

### Clause 10 - Improvement ✅
- [ ] Action items tracked to completion
- [ ] Decisions implemented and verified
- [ ] Improvement opportunities documented
- [ ] Trend analysis conducted
