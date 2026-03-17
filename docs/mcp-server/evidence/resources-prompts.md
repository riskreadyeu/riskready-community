# Evidence MCP Server - Resources & Prompts

Documentation for static resources and AI prompt templates provided by the Evidence MCP server.

## Table of Contents

- [Resources](#resources)
- [Prompts](#prompts)

---

## Resources

Resources provide static documentation and reference materials to AI agents via URI-based access.

### evidence-types

**Name:** evidence-types

**URI:** `evidence://reference/evidence-types`

**Description:**

Comprehensive reference documentation for all evidence types supported by RiskReady. Provides guidance on:

- Evidence type categories (Document, Technical, Forensic, Communication, Assessment, Media)
- Specific evidence types within each category
- Examples and use cases for each type
- Retention requirements and typical retention periods
- Collection methods (manual upload, automated integration)
- Classification level guidance
- Forensic soundness requirements

**Content Sections:**

1. **Document Evidence Types**: DOCUMENT, CERTIFICATE, REPORT, POLICY/PROCEDURE
2. **Technical Evidence Types**: SCREENSHOT, LOG, CONFIGURATION
3. **Forensic Evidence Types**: NETWORK_CAPTURE, MEMORY_DUMP, DISK_IMAGE, MALWARE_SAMPLE
4. **Communication Evidence Types**: EMAIL, MEETING_NOTES
5. **Assessment Evidence Types**: APPROVAL_RECORD, AUDIT_REPORT, ASSESSMENT_RESULT, TEST_RESULT, SCAN_RESULT
6. **Media Evidence Types**: VIDEO, AUDIO
7. **General Guidelines**: Classification levels, forensic soundness, automated collection

**Use Cases:**

- Determining appropriate evidence type when proposing evidence creation
- Understanding retention requirements for evidence planning
- Selecting classification levels based on evidence sensitivity
- Identifying collection methods for automation opportunities

**Content Length:** ~160 lines of markdown

---

### evidence-lifecycle

**Name:** evidence-lifecycle

**URI:** `evidence://process/evidence-lifecycle`

**Description:**

Complete documentation of the evidence lifecycle from creation through archival. Covers all six lifecycle states and transitions between them.

**Content Sections:**

1. **Lifecycle Stages**:
   - PENDING: Initial submission and metadata collection
   - UNDER_REVIEW: Reviewer validation and decision process
   - APPROVED: Approval criteria and usage in compliance
   - REJECTED: Rejection reasons and remediation paths
   - EXPIRED: Expiration detection and renewal workflows
   - ARCHIVED: Long-term retention and access controls

2. **Evidence Versioning**: Version chain management, linking, and best practices

3. **Validity Periods**: validFrom, validUntil, retainUntil field usage and examples

4. **Renewal Process**: Step-by-step renewal workflow with timeline

5. **Automation Opportunities**: Automated collection, review, expiration, and archival

**Use Cases:**

- Understanding evidence status meanings and transitions
- Planning evidence renewal schedules
- Identifying automation opportunities for evidence management
- Designing evidence approval workflows

**Content Length:** ~370 lines of markdown

---

### chain-of-custody

**Name:** chain-of-custody

**URI:** `evidence://process/chain-of-custody`

**Description:**

Detailed guidance on maintaining chain of custody for digital evidence, particularly forensic evidence requiring strict integrity controls.

**Content Sections:**

1. **What is Chain of Custody**: Definition, purpose, and importance

2. **Evidence Types Requiring Chain of Custody**:
   - Forensic Evidence (MANDATORY)
   - Incident Evidence (HIGHLY RECOMMENDED)
   - Audit Evidence (RECOMMENDED)

3. **RiskReady Chain of Custody Implementation**:
   - Collection Phase: Collector identification, integrity verification, metadata
   - Storage Phase: Secure storage requirements and configurations
   - Access Control Phase: Role-based access and audit logging
   - Review Phase: Reviewer actions and decision logging
   - Handoff Phase: Version control and system transfers

4. **Forensic Evidence Best Practices**:
   - Collection: Write-blocking, hash generation, documentation
   - Storage: Isolated storage, multiple copies, immutability
   - Transfer: Integrity verification, secure channels
   - Analysis: Working copies, action logging, findings documentation

5. **Chain of Custody Documentation**: Minimum required documentation and RiskReady audit trail

6. **Compliance Considerations**: Legal proceedings, regulatory investigations, ISO 27001/SOC 2

7. **Hash Verification Workflow**: Command-line examples for SHA-256 verification

**Use Cases:**

- Understanding forensic evidence handling requirements
- Implementing chain of custody procedures
- Preparing evidence for legal proceedings or investigations
- Training evidence collectors on proper handling

**Content Length:** ~663 lines of markdown

---

### evidence-collection-guide

**Name:** evidence-collection-guide

**URI:** `evidence://guide/evidence-collection`

**Description:**

Practical guide for collecting evidence to support ISO 27001 compliance and certification audits. Maps evidence types to specific Annex A controls.

**Content Sections:**

1. **ISO 27001 Evidence Requirements**: High-level overview of evidence needs

2. **Evidence by Annex A Control Category**:
   - A.5 - Organizational Controls
   - A.8 - Asset Management Controls
   - A.5.7 - Threat Intelligence
   - A.5.10 - Acceptable Use
   - A.5.15 - Access Control
   - A.5.18 - Access Rights Review
   - A.8.8 - Vulnerability Management
   - A.8.9 - Configuration Management
   - A.8.16 - Monitoring Activities
   - A.5.24 - Incident Management
   - A.5.28 - Evidence Collection
   - A.8.23 - Web Filtering
   - A.8.26 - Application Security
   - A.5.30 - Business Continuity
   - A.5.33 - Records Management
   - A.5.37 - Documented Operating Procedures

   For each control:
   - Evidence type(s) required
   - Required evidence items
   - Validity period
   - Collection method

3. **Evidence Collection Best Practices**:
   - Automated collection advantages and examples
   - Manual collection guidelines
   - Sampling for large datasets
   - Version control
   - Linking evidence to controls
   - Classification and handling
   - Validity periods and renewal

4. **Pre-Audit Evidence Package**: Checklist for audit preparation 30 days before audit

5. **Common Evidence Gaps and How to Address**: Gap identification and remediation strategies

6. **Key Takeaways**: 10 critical success factors for evidence management

**Use Cases:**

- Planning evidence collection for ISO 27001 certification
- Mapping evidence requirements to Annex A controls
- Preparing for certification audits
- Identifying evidence gaps before audits

**Content Length:** ~1075 lines of markdown

---

## Prompts

Prompts provide structured templates for AI-guided evidence management workflows with step-by-step instructions and expected output formats.

### evidence-gap-analysis

**Name:** evidence-gap-analysis

**Description:** Analyze evidence gaps across controls, risks, and policies to identify where evidence collection is needed.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organisationId | string | Yes | Organisation UUID to analyze |

**Generated Prompt:**

The prompt instructs the AI to perform a comprehensive evidence gap analysis by:

1. **Analysis Steps**:
   - Call `get_evidence_coverage` to identify controls with/without evidence
   - Call `get_evidence_stats` to understand evidence inventory
   - Call `list_evidence_requests` with status=OPEN,IN_PROGRESS
   - Call `get_overdue_requests` to identify delays

2. **Gap Analysis Report Sections**:
   - **Evidence Coverage Summary**: Total controls, coverage percentage, gaps
   - **Critical Gaps**: Prioritized by control criticality, regulatory requirements, audit timeline
   - **Evidence Aging**: Expired evidence, upcoming expirations, renewal status
   - **Open Evidence Requests**: Total, overdue, unassigned, high priority
   - **Recommendations**: For each gap, suggest evidence type, collection method, priority, assignee, target date

3. **Output Format**: Structured markdown with sections above, specific control IDs, evidence references, actionable recommendations

**Use Cases:**

- Pre-audit gap analysis
- Quarterly evidence coverage reviews
- Compliance readiness assessments
- Evidence collection planning

**Typical Invocation:**

```javascript
// AI agent receives prompt with organisationId
evidence-gap-analysis({ organisationId: "org-uuid" })

// AI then executes tool calls:
get_evidence_coverage()
get_evidence_stats()
list_evidence_requests({ status: "OPEN" })
get_overdue_requests()

// AI generates structured markdown report
```

---

### evidence-review

**Name:** evidence-review

**Description:** Review a specific evidence record for completeness, validity, and relevance to linked entities.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| evidenceId | string | Yes | Evidence UUID to review |

**Generated Prompt:**

The prompt instructs the AI to perform detailed evidence review by:

1. **Review Steps**:
   - Call `get_evidence` with evidence ID for full details
   - Call `get_evidence_links` to see all linked entities
   - Call `get_evidence_versions` to review version history

2. **Review Criteria**:
   - **Metadata Completeness**: Title, description, type, classification, category, tags
   - **Validity and Currency**: Collection date, validity period, expiration status, renewal
   - **File Integrity**: File name/type, size, hash, forensic soundness, encryption
   - **Collector and Approver**: Collector identity, source system, review status, approvals
   - **Entity Links**: Controls, risks, policies, incidents, other entities - assess relevance
   - **Version History**: Version chain clarity, link updates, archival status

3. **Review Report Sections**:
   - **Evidence Summary**: ID, reference, title, type, status, dates, people
   - **Completeness Assessment**: Missing fields, incomplete metadata, recommendations
   - **Validity Assessment**: Current status, expiration risk, renewal needs
   - **Relevance Assessment**: Controls/risks/entities supported, link quality, orphaned links
   - **Quality Issues**: Integrity concerns, classification mismatches, approval gaps
   - **Recommendations**: APPROVE, REJECT, REQUEST CHANGES, ARCHIVE with rationale

4. **Output Format**: Structured markdown review report with clear sections and actionable recommendations

**Use Cases:**

- Evidence approval workflow
- Periodic evidence quality reviews
- Pre-audit evidence validation
- Evidence renewal decisions

**Typical Invocation:**

```javascript
// AI agent receives prompt with evidenceId
evidence-review({ evidenceId: "evidence-uuid" })

// AI then executes tool calls:
get_evidence({ id: "evidence-uuid" })
get_evidence_links({ evidenceId: "evidence-uuid" })
get_evidence_versions({ evidenceId: "evidence-uuid" })

// AI generates structured review report with recommendation
```

---

### audit-preparation

**Name:** audit-preparation

**Description:** Prepare comprehensive evidence package for an upcoming audit, identifying gaps, expired evidence, and readiness status.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organisationId | string | Yes | Organisation UUID for audit preparation |
| auditDate | string | No | Planned audit date (ISO 8601 format), defaults to 30 days from now |

**Generated Prompt:**

The prompt instructs the AI to prepare audit evidence package by:

1. **Audit Preparation Steps**:
   - Call `get_evidence_dashboard` for overall readiness metrics
   - Call `get_evidence_coverage` for control coverage gaps
   - Call `get_expiring_evidence` to find pre-audit expirations
   - Call `get_overdue_requests` to identify delays
   - Call `get_evidence_stats` for inventory status

2. **Audit Readiness Report Sections**:

   **Executive Summary**:
   - Overall readiness status (RED/YELLOW/GREEN)
   - Critical gaps requiring immediate attention
   - Evidence expiring before audit
   - Open/overdue requests
   - Estimated effort to achieve readiness

   **Evidence Inventory Status**:
   - Total records, approved count, pending review, rejected
   - Distribution by type and classification

   **Control Coverage Analysis**:
   - Total controls, coverage percentage, gaps
   - Prioritized by criticality, regulatory requirements, audit scope

   **Evidence Expiration Issues**:
   - Evidence expiring before audit with control links
   - Renewal requirements and schedule

   **Evidence Request Status**:
   - Open requests, overdue with assignees, high priority
   - Escalation recommendations

   **Quality Issues**:
   - Missing metadata, missing approvals, integrity concerns, orphaned links

   **Audit Evidence Package Preparation**:
   - Documents to prepare (inventory, coverage matrix, evidence index)
   - Auditor access setup (accounts, permissions, walkthrough)

   **Action Plan**:
   - Priority 1 (1 week): Critical gaps, overdue requests, immediate approvals
   - Priority 2 (2 weeks): Expiring evidence, high-priority requests, quality fixes
   - Priority 3 (3 weeks): Non-critical gaps, organization, auditor prep
   - Week Before Audit: Final verification, setup, export, walkthrough

   **Readiness Metrics**:
   - Control coverage % (target: 100% critical, 95%+ overall)
   - Evidence currency % (target: <5% expired)
   - Request completion % (target: <10% open, 0% overdue)
   - Approval completion % (target: 100% approved/justified)

   **Risk Assessment**:
   - Audit risks (critical gaps, quality issues, timing risks)
   - Mitigation plans, compensating controls, gap explanations

3. **Output Format**: Structured markdown report with sections, actionable items with assignees/dates, readiness dashboard metrics

**Use Cases:**

- Pre-audit readiness assessment (30-90 days before audit)
- Audit preparation planning
- Executive audit readiness reporting
- Evidence collection sprint planning

**Typical Invocation:**

```javascript
// AI agent receives prompt with organisation and optional audit date
audit-preparation({
  organisationId: "org-uuid",
  auditDate: "2024-06-15T00:00:00Z"
})

// AI then executes tool calls:
get_evidence_dashboard()
get_evidence_coverage()
get_expiring_evidence({ daysAhead: 90 }) // days until audit
get_overdue_requests()
get_evidence_stats()

// AI generates comprehensive audit readiness report with action plan
```

---

## Resource Access Pattern

AI agents access resources via the MCP resource protocol:

```javascript
// List available resources
mcp.listResources()

// Read specific resource
mcp.readResource("evidence://reference/evidence-types")
mcp.readResource("evidence://process/evidence-lifecycle")
mcp.readResource("evidence://process/chain-of-custody")
mcp.readResource("evidence://guide/evidence-collection")
```

Resources return full markdown content which the AI can reference when:
- Proposing evidence creation (consult evidence-types)
- Understanding status transitions (consult evidence-lifecycle)
- Handling forensic evidence (consult chain-of-custody)
- Preparing for ISO 27001 audits (consult evidence-collection-guide)

## Prompt Invocation Pattern

AI agents invoke prompts via the MCP prompt protocol:

```javascript
// List available prompts
mcp.listPrompts()

// Get prompt with parameters
mcp.getPrompt("evidence-gap-analysis", {
  organisationId: "org-uuid"
})

mcp.getPrompt("evidence-review", {
  evidenceId: "evidence-uuid"
})

mcp.getPrompt("audit-preparation", {
  organisationId: "org-uuid",
  auditDate: "2024-06-15T00:00:00Z"
})
```

The MCP server returns prompt messages that guide the AI through:
1. Tool calls to gather data
2. Analysis criteria and frameworks
3. Expected output structure and sections
4. Actionable recommendations format

The AI then executes the prompt instructions, makes the suggested tool calls, and generates the requested report.

## Best Practices

### For Resource Usage:

1. **Load resources proactively**: Read relevant resources at conversation start
2. **Reference specific sections**: Cite resource sections in recommendations
3. **Keep resources updated**: Resources reflect current schema and best practices
4. **Combine resources**: Use multiple resources together (e.g., evidence-types + evidence-lifecycle)

### For Prompt Usage:

1. **Follow prompt structure**: Execute all suggested tool calls in order
2. **Generate complete reports**: Include all report sections specified
3. **Provide specific recommendations**: Don't just identify gaps, suggest solutions
4. **Use consistent formatting**: Follow markdown structure for readability
5. **Include actionable items**: Reports should drive concrete actions with assignees and dates

### For Combined Usage:

Effective evidence management workflows combine resources and prompts:

**Audit Preparation Workflow:**
1. Invoke `audit-preparation` prompt for comprehensive analysis
2. Reference `evidence-collection-guide` resource for ISO 27001 mapping
3. Reference `evidence-lifecycle` resource for renewal timelines
4. Generate action plan with specific evidence collection tasks
5. Use `propose_evidence_request` to create requests for identified gaps

**Evidence Review Workflow:**
1. Invoke `evidence-review` prompt for structured review
2. Reference `evidence-types` resource to validate type classification
3. Reference `chain-of-custody` resource for forensic evidence
4. Generate review report with approval recommendation
5. Use `propose_evidence_status_update` if status change needed

**Gap Analysis Workflow:**
1. Invoke `evidence-gap-analysis` prompt for coverage assessment
2. Reference `evidence-collection-guide` for control-to-evidence mapping
3. Reference `evidence-types` for appropriate evidence type selection
4. Generate gap analysis report with prioritized recommendations
5. Use `propose_evidence` or `propose_evidence_request` for remediation

## Extensibility

The resource and prompt system is designed for extensibility:

**Adding New Resources:**
- Define markdown content constant
- Register with `server.resource(name, uri, handler)`
- Document in this file
- URI convention: `evidence://{category}/{name}`

**Adding New Prompts:**
- Define prompt with Zod schema for parameters
- Create structured prompt message with instructions
- Register with `server.prompt(name, description, schema, handler)`
- Document in this file

**Versioning:**
- Resources can be versioned in URI: `evidence://reference/evidence-types/v2`
- Prompts can include version in parameter schema
- Maintain backward compatibility when updating content
