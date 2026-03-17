# Resources and Prompts

This document describes the resources and prompt templates exposed by the Controls MCP server.

---

## Resources

Resources provide static reference content that LLM agents can read to understand control methodologies, frameworks, and assessment lifecycles.

### four-layer-framework

**URI:** `controls://methodology/four-layer-framework`

**Description:** Complete reference for the Four-Layer Assurance Framework used by RiskReady to assess control effectiveness across different dimensions.

**Content Sections:**
- **Layer 1: GOVERNANCE** — Policies, standards, procedures, RACI matrices, control design documentation. Owner: GRC Team / Policy Owners. Testing approach focuses on policy existence, approval status, measurable requirements, documented procedures, and control design reviews.
- **Layer 2: PLATFORM** — Technical controls, configuration, automation, logging, monitoring. Owner: IT Security / Engineering / Platform Teams. Testing approach covers deployment verification, configuration compliance, automation rules, audit logging, and SIEM/SOAR integration.
- **Layer 3: CONSUMPTION** — User compliance, training, operational execution. Owner: Business Operations / Department Leads. Testing approach examines user compliance rates, training completion, process adherence, exception management, and awareness levels.
- **Layer 4: OVERSIGHT** — Monitoring, metrics, reviews, exception management, continuous improvement. Owner: Internal Audit / Risk Management / Compliance. Testing approach validates monitoring dashboard reviews, metric collection, management reviews, exception reporting, and third-party assurance.

**Use Cases:**
- Understanding the four-layer model before analyzing control posture
- Designing tests for each layer type
- Interpreting protection scores in context of layer responsibilities
- Identifying which teams own which layers for a control

---

### protection-scoring

**URI:** `controls://methodology/protection-scoring`

**Description:** Detailed explanation of the protection score calculation methodology used across controls, layers, and activities.

**Content Sections:**
- **Score Values** — PASS = 100, PARTIAL = 50, FAIL = 0, NOT_TESTED/NOT_APPLICABLE = excluded
- **Layer Score** — Average of test scores within a layer, rounded to nearest integer (0-100 scale)
- **Activity Score** — Same formula as layer score, scoped to tests within the activity
- **Control Overall Score** — Average of all layer scores (only layers with at least one scored test)
- **Status Thresholds** — COMPLETE (>= 90), GOOD (70-89), PARTIAL (50-69), ATTENTION (< 50), NOT_TESTED (null)
- **Criticality Weighting** — For scope items: CRITICAL = weight 4, HIGH = 3, MEDIUM = 2, LOW = 1. Weighted score calculation formula provided.
- **Organisation Score** — Average of all control scores (only applicable, enabled controls with scores)
- **Trend Calculation** — IMPROVING (>= 5 points increase), STABLE (< 5 points change), DECLINING (>= 5 points decrease), NEW (no previous score)

**Use Cases:**
- Understanding how protection scores are calculated
- Interpreting score thresholds and status values
- Calculating weighted scores for scope items with different criticality levels
- Analyzing score trends over time

---

### iso27001-annex-a

**URI:** `controls://reference/iso27001-annex-a`

**Description:** Reference guide to the ISO 27001:2022 Annex A control structure, including all 93 controls organized by theme.

**Content Sections:**
- **Organisational Controls (37 controls: A.5.1 - A.5.37)** — Policy, roles, responsibilities, asset management, access control, identity, supplier relations. Key controls highlighted.
- **People Controls (8 controls: A.6.1 - A.6.8)** — Screening, employment terms, awareness, training, disciplinary, termination. Key controls highlighted.
- **Physical Controls (14 controls: A.7.1 - A.7.14)** — Physical perimeter, entry, offices, monitoring, equipment, utilities, cabling, disposal. Key controls highlighted.
- **Technological Controls (34 controls: A.8.1 - A.8.34)** — Endpoints, access, authentication, code, config, data, networks, security monitoring. Key controls highlighted.
- **SOA Requirements** — The five requirements for a compliant Statement of Applicability: list all 93 controls, state applicability, justify exclusions, confirm implementation status, reference risk assessment.
- **Control Numbering Convention** — ISO format ("A.{theme}.{number}") and comparison with SOC2 ("CC{category}.{number}"), NIS2 ("Art.{article}.{section}"), and DORA ("Art.{article}") numbering.

**Use Cases:**
- Understanding the ISO 27001:2022 Annex A structure
- Checking SOA completeness against the 93 required controls
- Identifying key controls within each theme
- Understanding SOA compliance requirements

---

### assessment-lifecycle

**URI:** `controls://reference/assessment-lifecycle`

**Description:** Reference guide to assessment states, test methods, result types, root cause categories, and remediation effort levels.

**Content Sections:**
- **Assessment States** — DRAFT (scope being defined), IN_PROGRESS (testing underway), UNDER_REVIEW (tests complete, reviewer checking), COMPLETED (finalised and signed off), CANCELLED (cancelled before completion). Allowed state transitions documented.
- **Test Methods** — MANUAL (tester manually performs test steps), SELF_ASSESSMENT (control owner self-assesses), AUTOMATED (automated tooling executes test). Typical use cases for each method.
- **Test Result Types** — PASS (score 100, meets all requirements), PARTIAL (score 50, partially meets, gaps identified), FAIL (score 0, does not meet requirements), NOT_TESTED (excluded from scoring), NOT_APPLICABLE (excluded from scoring).
- **Root Cause Categories** — PEOPLE (staff awareness/training gap), PROCESS (missing/inadequate procedure), TECHNOLOGY (tool/system limitation), BUDGET (insufficient funding), THIRD_PARTY (vendor dependency), DESIGN (control design inadequate), UNKNOWN (not yet determined).
- **Remediation Effort Levels** — TRIVIAL (hours), MINOR (days), MODERATE (weeks), MAJOR (months), STRATEGIC (quarters). Descriptions and typical timelines provided.
- **Assessment Test Statuses** — PENDING (assigned but not started), IN_PROGRESS (actively executing), COMPLETED (execution finished), SKIPPED (deliberately skipped with justification).

**Use Cases:**
- Understanding assessment workflow and state transitions
- Choosing appropriate test methods for different control types
- Interpreting test results and root cause categories
- Estimating remediation timelines based on effort levels

---

## Prompts

Prompts are pre-configured LLM prompt templates that guide specific control-related analysis tasks. They include step-by-step instructions and output format specifications.

### assess-control-posture

**Name:** `assess-control-posture`

**Description:** Evaluate overall control posture and identify weak areas. Uses protection scores, gap analysis, and statistics to build a comprehensive picture.

**Parameters:** None

**Task:** Assess the organisation's overall control effectiveness and identify areas requiring attention.

**Workflow Steps:**
1. Call `get_control_stats()` to understand the control landscape (totals, by theme/framework/status)
2. Call `get_protection_scores()` to see per-control and per-layer protection scores
3. Call `get_gap_analysis()` to identify controls with FAIL/PARTIAL test results
4. Call `get_metric_dashboard()` to understand operational metric health
5. Call `get_overdue_tests()` to identify testing gaps
6. Read the `four-layer-framework` resource for layer definitions
7. Read the `protection-scoring` resource for score thresholds

**Output Format:**
- **Control Posture Summary** — One paragraph overview
- **Key Metrics** — Total controls, organisation-wide protection score, controls in ATTENTION status, overdue test count
- **Weakest Controls (Top 5)** — Table with control ID, name, score, status, weakest layer
- **Layer Analysis** — For each of the 4 layers: average score, controls with no tests, key gaps
- **Gap Summary** — Total gaps, most common root causes, highest priority remediations
- **Recommendations** — 3-5 actionable recommendations prioritised by impact

**Guidelines:**
- Use ISO 27001 terminology
- Quantify findings with scores and counts
- Distinguish between quick wins (TRIVIAL/MINOR effort) and strategic improvements
- Consider the four-layer model — a control may be strong in PLATFORM but weak in GOVERNANCE

---

### review-assessment

**Name:** `review-assessment`

**Description:** Analyse assessment results and summarise findings. Provides detailed review of a specific assessment with test results, gaps, and recommendations.

**Parameters:**
- `assessmentId` (string, required) — Assessment UUID to review

**Task:** Analyse the specified assessment and produce a comprehensive review.

**Workflow Steps:**
1. Call `get_assessment({assessmentId})` to get assessment details (scope, team, dates)
2. Call `get_assessment_tests({assessmentId})` to get all test results
3. Call `get_assessment_tests({assessmentId}, result: "FAIL")` to focus on failures
4. Call `get_assessment_tests({assessmentId}, result: "PARTIAL")` to examine partial passes
5. Call `get_gap_analysis({assessmentId})` to get structured gap view
6. Read the `assessment-lifecycle` resource for result type definitions

**Output Format:**
- **Assessment Overview** — Reference, title, status, period, controls in scope, team, completion statistics
- **Results Summary** — Table with PASS/PARTIAL/FAIL/SKIPPED counts and percentages
- **Critical Findings (FAIL results)** — For each failed test: identification, findings summary, root cause analysis, recommended remediation
- **Partial Findings** — For each partial test: what's working vs. what's missing, effort to achieve full PASS
- **Strengths** — Controls and layers that performed well
- **Recommendations** — Immediate actions (FAIL remediation), short-term improvements (PARTIAL → PASS), process improvements for next assessment

**Guidelines:**
- Be specific about findings — reference test codes and control IDs
- Assess whether root causes are correctly identified
- Flag any tests that should have been FAIL but were marked PARTIAL (or vice versa)
- Consider whether scope coverage was adequate

---

### recommend-remediations

**Name:** `recommend-remediations`

**Description:** Suggest remediation actions for failed tests. Analyses gap analysis results and recommends specific actions with effort estimates.

**Parameters:**
- `assessmentId` (string, optional) — Assessment UUID (if omitted, uses latest completed/in-progress assessment)

**Task:** Analyse control gaps and recommend specific remediation actions.

**Workflow Steps:**
1. Call `get_gap_analysis({assessmentId})` to get all FAIL/PARTIAL results
2. For each affected control, call `get_control(<controlId>)` to understand the full control context
3. For controls with cross-framework requirements, call `get_cross_references(<controlId>)` to check other framework obligations
4. Read the `four-layer-framework` resource for layer-specific guidance
5. Read the `protection-scoring` resource for score targets

**Output Format:**
- **Gap Overview** — Total gaps, by result type (FAIL/PARTIAL), controls affected, root cause distribution
- **Remediation Plan** — For each gap (prioritised by criticality):
  - Control ID, test code, finding title
  - Result (FAIL/PARTIAL)
  - Root cause (category and details)
  - Current state vs. target state
  - Remediation actions (specific steps with effort level and owner role)
  - Cross-framework impact
  - Expected score improvement
- **Quick Wins** — TRIVIAL/MINOR effort actions for immediate improvement
- **Strategic Improvements** — MODERATE/MAJOR effort actions requiring project planning
- **Implementation Roadmap** — Suggested 30/60/90 day plan

**Guidelines:**
- Be specific — "Configure SAML SSO with 15-minute session timeout" not "Improve authentication"
- Consider all four layers — a PLATFORM fix might also need a GOVERNANCE update
- Map remediation to relevant ISO 27001 controls
- Estimate realistic effort levels
- Identify dependencies between remediation actions

---

### soa-completeness-check

**Name:** `soa-completeness-check`

**Description:** Check SOA coverage against framework requirements. Identifies missing controls, unjustified exclusions, and implementation gaps.

**Parameters:**
- `soaId` (string, required) — StatementOfApplicability UUID to check

**Task:** Review the specified SOA for completeness and compliance.

**Workflow Steps:**
1. Call `get_soa({soaId})` to get the full SOA with all entries
2. Call `list_controls(framework: "ISO", take: 200)` to get the complete control library
3. Call `get_domain_matrix()` to understand cross-framework requirements
4. Read the `iso27001-annex-a` resource for the expected control structure

**Output Format:**
- **SOA Overview** — Version, status, total entries, applicable vs. N/A breakdown, implementation status distribution
- **Coverage Analysis:**
  - **Missing Controls** — Controls in the library that don't have SOA entries (with explanation why they should be included)
  - **Unjustified Exclusions** — Controls marked N/A without adequate justification (with current justification and why it's insufficient)
  - **Implementation Gaps** — Controls marked applicable but NOT_STARTED (with risk of non-implementation)
- **Theme Coverage** — For each theme (Organisational/People/Physical/Technological): total controls, applicable, N/A, implemented, coverage percentage
- **Cross-Framework Gaps** — SOC2 criteria not covered by ISO controls, NIS2/DORA requirements that need additional controls
- **Recommendations** — Controls to add to the SOA, justifications that need strengthening, implementation priorities for NOT_STARTED controls

**Guidelines:**
- ISO 27001 requires ALL 93 Annex A controls to be addressed in the SOA
- Each exclusion must have a risk-based justification
- Implementation status should reflect actual, not planned, state
- Consider the organisation's risk profile when assessing appropriateness of exclusions

---

## Usage Patterns

**Reading Resources:**
LLM agents can request resources at any time during a conversation to gain context-specific knowledge. Resources are static content that doesn't change during a session.

**Invoking Prompts:**
Prompts provide structured workflows for common control analysis tasks. When invoked, they return a full prompt message that the LLM can use to guide its analysis. Prompts reference specific tools and resources that should be used during the workflow.

**Combining Resources and Prompts:**
For best results, prompts often instruct the LLM to read specific resources (e.g., "Read the four-layer-framework resource for layer definitions"). This ensures the LLM has the necessary background knowledge before performing analysis.

**Example Workflow:**
1. User asks: "Review assessment ASM-2026-001"
2. LLM invokes `review-assessment` prompt with `assessmentId: "abc123..."`
3. Prompt instructions guide LLM to call `get_assessment()`, `get_assessment_tests()`, etc.
4. LLM reads `assessment-lifecycle` resource to understand result types
5. LLM generates structured review following the output format specified in the prompt
6. User receives comprehensive assessment review with findings and recommendations
