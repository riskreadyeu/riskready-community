import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerResources(server: McpServer) {
  server.resource(
    'iso27001-framework',
    'controls://frameworks/iso27001',
    {
      description: 'ISO 27001:2022 control themes and structure',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'controls://frameworks/iso27001',
        text: `# ISO 27001:2022 Annex A Control Structure

## Control Themes

### Organisational Controls (A.5)
37 controls covering governance, policies, roles, and responsibilities.
- A.5.1 – A.5.37

### People Controls (A.6)
8 controls covering screening, terms of employment, awareness, and training.
- A.6.1 – A.6.8

### Physical Controls (A.7)
14 controls covering physical security, equipment, and environmental controls.
- A.7.1 – A.7.14

### Technological Controls (A.8)
34 controls covering access control, cryptography, operations, and communications security.
- A.8.1 – A.8.34

## Total: 93 controls across 4 themes

## Implementation Statuses
- **NOT_STARTED**: Control has not been implemented
- **PARTIAL**: Control is partially implemented
- **IMPLEMENTED**: Control is fully implemented

## Applicability
Each control must be assessed for applicability based on the organisation's risk assessment and Statement of Applicability (SOA). Controls marked as not applicable must include a justification.`,
      }],
    }),
  );

  server.resource(
    'scoring-methodology',
    'controls://scoring/methodology',
    {
      description: 'Assessment scoring and effectiveness methodology',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'controls://scoring/methodology',
        text: `# Assessment Scoring Methodology

## Test Results
Each assessment test produces one of these results:
- **PASS** (100%): Control requirement fully met
- **PARTIAL** (50%): Control requirement partially met, gaps identified
- **FAIL** (0%): Control requirement not met
- **NOT_TESTED**: Test not yet executed
- **NOT_APPLICABLE**: Test excluded from scoring

## Assessment Statistics
Assessments track cached statistics:
- **totalTests**: Total number of tests in the assessment
- **completedTests**: Tests with COMPLETED or SKIPPED status
- **passedTests**: Tests with PASS result
- **failedTests**: Tests with FAIL result
- **completionRate**: completedTests / totalTests * 100

## Root Cause Categories
When a test fails, the root cause is classified as:
- PEOPLE, PROCESS, TECHNOLOGY, BUDGET, THIRD_PARTY, DESIGN, UNKNOWN

## Remediation Effort Levels
- TRIVIAL: < 1 day, minimal resources
- MINOR: 1-5 days
- MODERATE: 1-4 weeks
- MAJOR: 1-3 months
- STRATEGIC: > 3 months, significant investment`,
      }],
    }),
  );

  server.resource(
    'soa-guidance',
    'controls://soa/guidance',
    {
      description: 'Statement of Applicability (SOA) completion guidance',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'controls://soa/guidance',
        text: `# Statement of Applicability (SOA) Guidance

## Purpose
The SOA is a mandatory ISO 27001 document that lists all Annex A controls and states whether each is applicable, with justification for exclusions.

## SOA Lifecycle
1. **DRAFT** → Initial creation, entries being populated
2. **PENDING_REVIEW** → Submitted for management review
3. **APPROVED** → Formally approved (previous versions auto-superseded)
4. **SUPERSEDED** → Replaced by a newer approved version

## Entry Requirements
For each control entry:
- **Applicable**: Yes/No decision based on risk assessment
- **Justification if N/A**: Required when marking a control as not applicable
- **Implementation Status**: NOT_STARTED, PARTIAL, or IMPLEMENTED
- **Implementation Description**: How the control is implemented

## Creating an SOA
SOAs can be created:
1. From scratch (empty entries)
2. From existing controls (auto-populated from Control records)
3. As a new version of an existing SOA (copies all entries)

## Best Practices
- Review SOA at least annually
- Update when significant changes occur to scope or risk assessment
- Ensure justifications for non-applicable controls are specific and defensible
- Sync SOA entries back to Control records when approved`,
      }],
    }),
  );

  server.resource(
    'data-integrity',
    'controls://data-integrity',
    {
      description: 'Data integrity and anti-hallucination guidance for AI consumers of this MCP server',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'controls://data-integrity',
        text: `# Data Integrity Guidelines

## Source of Truth
All data returned by this MCP server comes exclusively from a PostgreSQL database accessed via Prisma ORM. There is no other data source. Tool responses are the single source of truth.

## Empty Results
When a tool returns an empty array or a count of zero, it means the data genuinely does not exist in the database yet. It does NOT mean:
- The data is hidden or restricted
- The tool failed silently
- You should look elsewhere or infer values

Empty results are a valid, meaningful state. Report them as-is.

## Identifiers
- All UUIDs are system-generated (v4 format). Never construct, guess, or interpolate UUIDs.
- Control IDs (e.g. "A.5.1") follow ISO 27001 Annex A numbering. They must come from tool responses.
- Assessment refs (e.g. "ASM-2026-001") are user-assigned. They must come from tool responses.
- Metric IDs (e.g. "MET-001") are user-assigned. They must come from tool responses.

## Counts and Statistics
- A count of 0 is a valid answer — it means no records match, not that the query was wrong.
- Implementation rates of 0% mean no controls have been implemented yet.
- Completion rates of 0% mean no tests have been executed yet.
- These are normal states for a newly deployed or in-progress system.

## Error vs. Absence
- **Tool error** (isError: true): The operation failed — e.g. invalid UUID, database error. Report the error.
- **Empty result** (isError: false, count: 0): The operation succeeded but found no matching records. Report the absence.
- Never confuse these two cases. They require different responses.

## Prohibited Actions
- Do not fabricate control names, descriptions, or statuses
- Do not invent assessment results, test findings, or metric values
- Do not guess at relationships between entities (control-to-risk, control-to-evidence)
- Do not assume data exists because it "should" — verify with a tool call`,
      }],
    }),
  );

  server.resource(
    'assessment-workflow',
    'controls://assessment/workflow',
    {
      description: 'Assessment lifecycle and workflow guidance',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'controls://assessment/workflow',
        text: `# Assessment Lifecycle Workflow

## Status Transitions
\`\`\`
DRAFT → IN_PROGRESS → UNDER_REVIEW → COMPLETED
  ↓          ↓              ↓
  └──────────┴──────────────┴──→ CANCELLED
\`\`\`

## Workflow Steps

### 1. DRAFT
- Create assessment with title, description, and team
- Add controls to scope (AssessmentControl)
- Add scope items (AssessmentScope) — applications, locations, etc.
- Populate tests from templates

### 2. IN_PROGRESS
- Assign testers to individual tests
- Execute tests: record results, findings, evidence
- Track root causes for failures
- Propose remediations for failed tests

### 3. UNDER_REVIEW
- Lead tester submits for review
- Reviewer examines findings and evidence
- May return to IN_PROGRESS if issues found

### 4. COMPLETED
- Reviewer approves the assessment
- Final statistics are locked
- Results feed into gap analysis

## Test Execution
Each AssessmentTest can have multiple AssessmentExecutions (re-tests).
The latest execution result becomes the test's current result.

## Scope-Based Testing
Tests can be scoped to specific ScopeItems (e.g., test access controls on "Production CRM" application).
- ScopeItem types: APPLICATION, ASSET_CLASS, LOCATION, PERSONNEL_TYPE, BUSINESS_UNIT, PLATFORM, PROVIDER, NETWORK_ZONE, PROCESS`,
      }],
    }),
  );
}
