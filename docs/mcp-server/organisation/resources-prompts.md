# Organisation MCP Server - Resources & Prompts

Documentation for guidance resources and workflow prompts.

## Resources

Resources provide read-only guidance documents for ISO 27001 implementation and security governance best practices.

### isms-scope-guide

**URI:** `org://guidance/isms-scope-guide`

**Description:** ISO 27001 Clause 4.3 ISMS Scope Definition Guide

**Content:** Comprehensive guidance on defining the scope of the Information Security Management System including:

- Purpose and requirements of scope definition
- What to include in scope (locations, products, services, processes, platforms, departments, information assets)
- Handling exclusions with proper justification
- Boundary considerations (geographic, organizational, technical, process)
- Documentation requirements
- Review and update processes

**Usage:** Reference when conducting scope definition exercises, reviewing scope statements, or preparing for ISO 27001 audits.

---

### context-analysis

**URI:** `org://guidance/context-analysis`

**Description:** ISO 27001 Clause 4.1 Context Analysis Guide

**Content:** Step-by-step guide for understanding the organization and its context including:

- Internal issues (structure, culture, policies, resources, technology, performance)
- External issues using PESTLE framework (Political, Economic, Social, Technological, Legal, Environmental)
- Analysis process (identify, assess, document, monitor)
- Documentation requirements (issue register, impact assessment, review dates)

**Usage:** Reference when conducting context analysis workshops, updating the issue register, or preparing risk assessments that depend on organizational context.

---

### interested-parties-guide

**URI:** `org://guidance/interested-parties-guide`

**Description:** ISO 27001 Clause 4.2 Interested Parties Guide

**Content:** Best practices for identifying and managing stakeholders including:

- Key interested parties (internal and external)
- Requirements identification process
- Power/Interest matrix for stakeholder classification
- Engagement strategy development
- Requirements analysis (security, regulatory, SLA, certification, standards)
- Documentation requirements (stakeholder register, requirements matrix, communication plan)

**Usage:** Reference when building stakeholder registers, planning stakeholder engagement, or analyzing stakeholder requirements.

---

### governance-structure

**URI:** `org://guidance/governance-structure`

**Description:** Security Governance Structure Best Practices

**Content:** Framework for establishing effective security governance including:

- Committee types (Executive Security Committee, Operational Security Committee, Technical Working Groups)
- Committee composition and membership recommendations
- Roles and responsibilities (Chair, Secretary, Members)
- Meeting frequency guidance
- Meeting structure and agenda templates
- Documentation requirements (charter, schedules, minutes, action tracking, annual reports)
- Effectiveness measures (attendance rate, action item completion, decision implementation)

**Usage:** Reference when establishing new security committees, reviewing governance effectiveness, or improving committee operations.

---

## Prompts

Prompts provide guided workflows for common organizational analysis tasks.

### org-context-analysis

**Name:** Organisation Context Analysis

**Description:** Analyse organisation context per ISO 27001 Clause 4.1 and identify gaps

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organisationId | string | Yes | Organisation ID to analyse |

**Workflow Steps:**

1. Get the organisation profile using `get_org_profile`
2. List all context issues using `list_context_issues`
3. List all interested parties using `list_interested_parties`
4. Review the `context-analysis` resource for ISO 27001 requirements

**Analysis Objectives:**

- Are both internal and external issues adequately covered?
- Are all key stakeholder groups identified?
- Are there obvious gaps (e.g., missing PESTLE categories)?
- Are context issues linked to interested party requirements?
- Is the analysis current and comprehensive?

**Recommendations Provided:**

- Additional context issues to capture
- Missing stakeholder groups
- Areas requiring deeper analysis
- Review frequency and monitoring approach

**Usage:** Run this prompt when preparing for ISO 27001 audits, conducting annual context reviews, or investigating compliance gaps.

---

### scope-review

**Name:** ISMS Scope Review

**Description:** Review ISMS scope definition per ISO 27001 Clause 4.3 for completeness

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organisationId | string | Yes | Organisation ID to review |

**Workflow Steps:**

1. Get the ISMS scope using `get_org_isms_scope`
2. List all locations using `list_locations`
3. List all products/services using `list_products_services`
4. List all technology platforms using `list_technology_platforms`
5. Get the ISMS scope summary using `get_isms_scope_summary`
6. Review the `isms-scope-guide` resource for ISO 27001 requirements

**Analysis Objectives:**

- Is the scope statement clear and comprehensive?
- Are scope boundaries well-defined?
- Are in-scope locations, products, and platforms documented?
- Are exclusions properly justified?
- Does the scope align with organizational objectives?
- Are interfaces with external parties identified?

**Recommendations Provided:**

- Scope statement improvements
- Items that should be added to scope
- Better justification for exclusions
- Scope documentation enhancements
- Boundary clarifications

**Usage:** Run this prompt during scope definition exercises, before certification audits, after organizational changes (mergers, new locations), or when introducing new products/services.

---

### governance-health-check

**Name:** Governance Health Check

**Description:** Analyse security governance committee effectiveness

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organisationId | string | Yes | Organisation ID to analyse |

**Workflow Steps:**

1. List all security committees using `list_security_committees`
2. For each committee, get detailed information using `get_security_committee`
3. List committee meetings from the last 90 days using `list_committee_meetings` with date filters
4. List all meeting action items using `list_meeting_action_items`
5. Check for overdue action items using `list_meeting_action_items` with overdue filter
6. Review the `governance-structure` resource for best practices

**Analysis Objectives:**

- Are committees meeting at appropriate frequencies?
- Is attendance adequate (quorum achieved)?
- Are action items being completed on time?
- Is there appropriate representation across business units?
- Are decisions being documented and implemented?
- Are committees effective (track completion rates)?

**Recommendations Provided:**

- Meeting frequency adjustments
- Membership improvements
- Action item management
- Decision tracking processes
- Committee effectiveness measures
- Governance structure optimization

**Usage:** Run this prompt quarterly for governance reviews, before board presentations on security governance, when committees show signs of ineffectiveness, or during organizational restructuring.

---

## Integration Patterns

### Context Analysis + Risk Assessment

1. Run `org-context-analysis` prompt to identify context issues
2. Use identified issues as inputs to risk identification workshops
3. Link context issues to risk scenarios in the Risk MCP server
4. Track how context changes affect risk landscape

### Scope Definition + Control Selection

1. Run `scope-review` prompt to validate ISMS scope
2. Use in-scope entities list to drive control applicability decisions
3. Ensure controls cover all in-scope locations, products, and platforms
4. Document control exclusions with scope justification

### Governance + Compliance Monitoring

1. Run `governance-health-check` prompt quarterly
2. Track action item completion trends over time
3. Correlate committee effectiveness with compliance metrics
4. Report governance health to executive committees

### Stakeholder Management + Change Communications

1. Use `list_interested_parties` to identify communication targets
2. Filter by power/interest levels for targeted messaging
3. Track stakeholder satisfaction through engagement records
4. Align change communications with stakeholder requirements
