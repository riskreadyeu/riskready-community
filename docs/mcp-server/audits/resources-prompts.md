# Resources & Prompts - Audits MCP Server

## Resources

Static knowledge resources that provide guidance on NC lifecycle, CAP process, and ISO 27001 compliance.

### nc-lifecycle

**URI:** `audits://nc-lifecycle`

**Description:** Comprehensive guide to the nonconformity lifecycle, including status workflow, severity definitions, CAP workflow, source types, and category types.

**Content Includes:**
- NC Status Workflow: DRAFT → OPEN → IN_PROGRESS → AWAITING_VERIFICATION → VERIFIED_EFFECTIVE/VERIFIED_INEFFECTIVE → CLOSED
- Alternative paths: REJECTED (not a real NC), VERIFIED_INEFFECTIVE (returns to IN_PROGRESS)
- Severity Definitions:
  - MAJOR: Absence or total breakdown of control, systemic issues
  - MINOR: Isolated or occasional failure, localized issues
  - OBSERVATION: Opportunity for improvement (not a failure)
- CAP Status Progression: NOT_REQUIRED → NOT_DEFINED → DRAFT → PENDING_APPROVAL → APPROVED/REJECTED
- Source Types: TEST, INTERNAL_AUDIT, EXTERNAL_AUDIT, CERTIFICATION_AUDIT, INCIDENT, SELF_ASSESSMENT, MANAGEMENT_REVIEW, SURVEILLANCE_AUDIT, ISRA_GAP
- Category Types: CONTROL_FAILURE, DOCUMENTATION, PROCESS, TECHNICAL, ORGANIZATIONAL, TRAINING, RESOURCE

---

### cap-process

**URI:** `audits://cap-process`

**Description:** Detailed guide to the Corrective Action Plan (CAP) process, including components, workflow steps, and best practices.

**Content Includes:**
- CAP Components:
  1. Root Cause Analysis (5 Whys, Fishbone diagram)
  2. Corrective Action (immediate and long-term fixes)
  3. Responsibility Assignment (owners, verifiers, target dates)
  4. Verification Method (RE_TEST, RE_AUDIT, DOCUMENT_REVIEW, WALKTHROUGH)
- CAP Workflow:
  - Step 1: Draft CAP
  - Step 2: Submit for Approval (status → PENDING_APPROVAL)
  - Step 3: Approval Decision (APPROVED or REJECTED)
  - Step 4: Execute CAP (NC → AWAITING_VERIFICATION)
  - Step 5: Verification (VERIFIED_EFFECTIVE or VERIFIED_INEFFECTIVE)
  - Step 6: Closure or revision
- Best Practices:
  - Address root cause, not just symptoms
  - Make actions specific, measurable, and time-bound
  - Assign clear ownership
  - Verify effectiveness, not just completion
  - Update procedures/documentation
  - Communicate changes to staff
  - Document lessons learned

---

### iso-audit-guide

**URI:** `audits://iso-audit-guide`

**Description:** ISO 27001 Clause 10.1 compliance guide for nonconformity and corrective action management.

**Content Includes:**
- ISO 27001 Clause 10.1 Requirements:
  - React to the nonconformity (control, correct, deal with consequences)
  - Evaluate need for action (review, determine causes, check for similar issues)
  - Implement any action needed
  - Review effectiveness of corrective action
  - Make changes to ISMS if necessary
  - Retain documented information
- Evidence Requirements:
  1. Identification (what, when, how, ISO clause)
  2. Classification (severity, category, impact)
  3. Analysis (root cause, contributing factors, systemic implications)
  4. Corrective Action (immediate, long-term, responsibility, timeline)
  5. Verification (method, evidence, date, person, results)
  6. Closure (disposition, lessons learned, ISMS updates)
- Root Cause Analysis Methods:
  - 5 Whys
  - Fishbone/Ishikawa Diagram (People, Process, Technology, Environment)
  - Fault Tree Analysis
- Audit Trail Requirements:
  - Complete record of who/when for all status changes
  - Date, time, user, reason, supporting evidence
- Common Audit Findings:
  - Inadequate root cause analysis
  - CAP not verified
  - Recurrence not prevented
  - Missing evidence
  - Overdue NCs

---

## Prompts

AI-assisted prompts for root cause analysis and audit readiness reviews.

### nc-root-cause-analysis

**Description:** Analyze the root cause of a nonconformity and recommend corrective actions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| nonconformityId | string | Yes | Nonconformity ID to analyze |

**Generated Prompt Includes:**
- NC Details: ID, title, severity, category, source, description, findings, related entities (control, application, ISO clause)
- Analysis Requirements:
  1. Root Cause Identification (5 Whys methodology, fundamental cause)
  2. Contributing Factors (People, Process, Technology, Environment)
  3. Corrective Actions (immediate, long-term, process updates, training)
  4. Verification Approach (method, evidence, timeline)
  5. Related Risks (other areas with similar issues, systemic weaknesses)
- Output Format: Structured analysis suitable for CAP inclusion

**Use Case:** When drafting or updating a CAP, use this prompt to get AI-assisted root cause analysis that follows ISO 27001 best practices.

---

### audit-readiness

**Description:** Review the NC register for audit readiness and identify potential issues.

**No parameters required.**

**Generated Prompt Includes:**
- Current Status Summary:
  - Total NCs, closed NCs, open NCs
  - Overdue NCs, pending verifications, pending CAP approvals
  - Recent major NCs (last 30 days)
- Detailed Lists:
  - All open nonconformities
  - Overdue nonconformities (audit risk!)
  - Pending verifications
  - Pending CAP approvals
  - Recent major NCs
- Review Requested:
  1. Risk Assessment (highest audit risks, open NCs that could result in findings, systemic patterns)
  2. Overdue Items (review, urgency, prioritization)
  3. CAP Quality (adequacy, root cause coverage, realistic timelines)
  4. Verification Status (progress, adequacy of methods, delays)
  5. Recommendations (pre-audit actions, process improvements, documentation gaps)
  6. Audit Story (narrative for auditors, ISO 10.1 compliance demonstration, continual improvement evidence)
- Focus Areas:
  - Major NCs (highest audit impact)
  - Overdue items (demonstrate lack of control)
  - Recurring issues (systemic weakness)
  - Incomplete root cause analysis
  - Unverified corrective actions

**Use Case:** Before an ISO 27001 audit, use this prompt to get a comprehensive readiness review with AI-assisted recommendations for addressing risks and gaps.

---

## Usage Examples

### Getting NC Lifecycle Guidance
```json
{
  "resource": "nc-lifecycle",
  "uri": "audits://nc-lifecycle"
}
```

Returns the complete NC lifecycle guide as text content.

### Requesting Root Cause Analysis
```json
{
  "prompt": "nc-root-cause-analysis",
  "params": {
    "nonconformityId": "nc-123-456"
  }
}
```

Generates a detailed prompt for AI analysis of the specified NC, including all relevant context and structured analysis requirements.

### Checking Audit Readiness
```json
{
  "prompt": "audit-readiness"
}
```

Generates a comprehensive audit readiness review prompt with current NC register statistics and specific review questions for the AI to address.

---

## Integration Patterns

### CAP Development Workflow
1. Use `get_nonconformity` to retrieve NC details
2. Use `nc-lifecycle` resource to understand CAP requirements
3. Use `nc-root-cause-analysis` prompt to get AI-assisted analysis
4. Use `cap-process` resource to structure the CAP
5. Use `propose_cap_update` to submit the drafted CAP

### Pre-Audit Preparation
1. Use `audit-readiness` prompt to get comprehensive review
2. Use `get_overdue_nonconformities` to identify urgent items
3. Use `get_pending_cap_approvals` to expedite approvals
4. Use `get_nc_stats` to understand overall NC trends
5. Use `iso-audit-guide` resource to verify compliance with ISO 27001 Clause 10.1

### Continual Improvement Analysis
1. Use `get_nc_by_control` to identify controls with recurring issues
2. Use `get_nc_stats` to analyze trends by category and source
3. Use `nc-root-cause-analysis` prompt for systemic issues
4. Use `search_nonconformities` to find related or recurring problems
5. Update control documentation and procedures based on findings
