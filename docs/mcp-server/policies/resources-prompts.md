# Policies MCP Server - Resources & Prompts

## Resources

Resources provide static guidance documents for understanding policy management concepts and compliance requirements.

### document-hierarchy

**URI:** `policy://guidance/document-hierarchy`

**Description:** Comprehensive guide to the policy document hierarchy including POLICY, STANDARD, PROCEDURE, and WORK_INSTRUCTION levels. Covers purpose, audience, approval authority, review frequency, examples, key elements, naming conventions, and hierarchy relationships.

**Content:**
- Document Levels: Detailed breakdown of each level with approval requirements
- Naming Conventions: POL-{number}, STD-{number}, PROC-{number}, WI-{number}, FRM-{number}, TPL-{number}
- Hierarchy Relationships: Policy → Standard → Procedure → Work Instruction flow with examples

### document-lifecycle

**URI:** `policy://guidance/document-lifecycle`

**Description:** Complete documentation of the policy document lifecycle status definitions and state transitions. Essential for understanding document workflow from creation through archival.

**Content:**
- Status Definitions: DRAFT, PENDING_REVIEW, PENDING_APPROVAL, APPROVED, PUBLISHED, UNDER_REVISION, SUPERSEDED, RETIRED, ARCHIVED
- Each status includes: description, edit permissions, allowed transitions, visibility rules, special triggers
- Transition Rules: 10 key state transitions with conditions

### approval-matrix

**URI:** `policy://guidance/approval-matrix`

**Description:** Document approval authority matrix defining who can approve different document types, turnaround times, and escalation paths.

**Content:**
- Approval Authority by Document Type: POLICY (Board/Executive), STANDARD (Senior Management), PROCEDURE (Management), WORK_INSTRUCTION (Team Lead), FORM/TEMPLATE (Process Owner)
- Approval Workflow Steps: 7-step process from initiation to publication
- Delegation Rules: Temporary, standing, authority, and documentation requirements

### compliance-requirements

**URI:** `policy://guidance/compliance-requirements`

**Description:** Comprehensive reference for ISO 27001 Clause 7.5 documented information requirements, retention periods, review frequencies, and regulatory compliance considerations.

**Content:**
- ISO 27001 Clause 7.5: Mandatory documented information requirements
- Controls Requiring Documentation: Annex A controls with documentation obligations
- Document Retention Requirements: Regulatory retention periods by document type
- GDPR Considerations: Privacy policy and data breach documentation requirements
- Document Review Requirements: Review frequencies and triggers

## Prompts

Prompts provide AI-assisted workflows for common policy management tasks.

### policy-gap-analysis

**Name:** Policy Gap Analysis

**Description:** Analyze policy documentation gaps against a compliance framework.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation ID |
| framework | string | No | ISO 27001 | Compliance framework to analyze against |

**Workflow Steps:**
1. Get current policy inventory using list_policy_documents
2. Get control mappings using get_policy_compliance_matrix
3. Compare against framework requirements
4. Identify gaps (no coverage, partial coverage, draft status, overdue reviews)
5. Generate gap report with executive summary, critical gaps, partial gaps, policies requiring attention, and prioritized recommendations

**Output Format:**
- Executive Summary with totals and percentages
- Critical Gaps (No Coverage)
- Partial Gaps (Inadequate Coverage)
- Policies Requiring Attention
- Recommendations by Priority (P1: Immediate, P2: Short-term, P3: Medium-term)

### document-review

**Name:** Document Review

**Description:** Conduct an AI-assisted review of a policy document for completeness and quality.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| documentId | string | Yes | - | Policy document ID to review |

**Workflow Steps:**
1. Retrieve document using get_policy_document
2. Review version history using list_document_versions
3. Analyze control mappings using get_document_control_mappings
4. Review document structure using get_document_sections
5. Check related documentation using get_document_relations
6. Generate review report with completeness assessment, findings, and recommendations

**Output Format:**
- Document Information: ID, type, status, version, classification, last review
- Completeness Assessment: Structure checklist (purpose, scope, roles, sections, references)
- Content Quality: Language, requirements, compliance, processes, exceptions
- Control Coverage: Mappings, coverage level, evidence requirements
- Findings: Critical issues, major observations, minor observations
- Recommendations: Specific actionable improvements
- Review Outcome: NO_CHANGES, MINOR_CHANGES, or MAJOR_CHANGES

### policy-compliance-report

**Name:** Policy Compliance Report

**Description:** Generate a comprehensive policy compliance status report.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organisationId | string | Yes | - | Organisation ID |

**Workflow Steps:**
1. Get overall policy statistics using get_policy_stats
2. Get policy dashboard metrics using get_policy_dashboard
3. Get compliance matrix using get_policy_compliance_matrix
4. Identify overdue reviews using get_overdue_reviews
5. Check expiring exceptions using get_expiring_exceptions (90 days ahead)
6. Generate comprehensive compliance report

**Output Format:**
- Executive Summary: Total documents, published/active count, compliance status, critical issues
- Policy Inventory Status: By document type (table), by status
- Compliance Indicators: Acknowledgment completion rate (target 95%), review currency, control coverage
- Issues Requiring Attention: Critical (immediate), High (this month), Medium (this quarter)
- Active Exceptions: Total active, expiring in 90 days, risk level
- Recommendations: Immediate actions, short-term improvements, strategic initiatives
- Conclusion: Overall compliance assessment and next steps
