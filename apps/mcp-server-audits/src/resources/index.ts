import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerResources(server: McpServer) {
  server.resource(
    'nc-lifecycle',
    'audits://nc/lifecycle',
    {
      description: 'Nonconformity status lifecycle and transitions',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'audits://nc/lifecycle',
        text: `# Nonconformity (NC) Lifecycle

## Status Transitions
\`\`\`
DRAFT --> OPEN --> IN_PROGRESS --> AWAITING_VERIFICATION --> VERIFIED_EFFECTIVE --> CLOSED
  |         |                                |
  |         +---> REJECTED                   +--> VERIFIED_INEFFECTIVE (reopens to IN_PROGRESS)
  |
  +---> REJECTED
\`\`\`

## Status Definitions

### DRAFT
Auto-created nonconformity, pending manual review. The NC has been identified but not yet confirmed.

### OPEN
Reviewed and confirmed as a valid nonconformity. Ready for corrective action planning.

### IN_PROGRESS
Corrective action is underway. A CAP has been defined and approved.

### AWAITING_VERIFICATION
Corrective action has been completed. The NC is waiting for verification that the fix is effective.

### VERIFIED_EFFECTIVE
Verification confirms the corrective action resolved the issue. Ready to be closed.

### VERIFIED_INEFFECTIVE
Verification shows the corrective action did not resolve the issue. The NC should be reopened and a new CAP defined.

### CLOSED
The nonconformity has been verified as resolved and formally closed.

### REJECTED
The NC was reviewed but determined not to be a valid nonconformity.

## Severity Levels
- **MAJOR**: Absence or total breakdown of a control. Requires urgent corrective action.
- **MINOR**: Isolated or occasional control failure. Requires corrective action within a defined timeframe.
- **OBSERVATION**: Opportunity for improvement, not a control failure. No formal CAP required.

## Source Types
- TEST: From effectiveness test failure
- INTERNAL_AUDIT: Internal audit finding
- EXTERNAL_AUDIT: External audit finding
- CERTIFICATION_AUDIT: Certification body audit
- INCIDENT: From security incident
- SELF_ASSESSMENT: Self-identified issue
- MANAGEMENT_REVIEW: From management review
- SURVEILLANCE_AUDIT: Ongoing certification surveillance
- ISRA_GAP: From ISRA SRL gap analysis`,
      }],
    }),
  );

  server.resource(
    'cap-workflow',
    'audits://cap/workflow',
    {
      description: 'Corrective Action Plan (CAP) workflow and statuses',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'audits://cap/workflow',
        text: `# Corrective Action Plan (CAP) Workflow

## CAP Statuses
\`\`\`
NOT_REQUIRED (for Observations)
NOT_DEFINED --> DRAFT --> PENDING_APPROVAL --> APPROVED
                                  |
                                  +--> REJECTED (returns to DRAFT for revision)
\`\`\`

## Status Definitions

### NOT_REQUIRED
For OBSERVATION-severity NCs that do not require a formal corrective action plan.

### NOT_DEFINED
The nonconformity has been opened but no corrective action plan has been defined yet.

### DRAFT
The CAP is being written and can be edited freely. Includes:
- Corrective action description
- Target closure date
- Responsible person assignment

### PENDING_APPROVAL
The CAP has been submitted for management review. Awaiting approval before work can begin.

### APPROVED
The CAP has been approved by management. Implementation work can now proceed.

### REJECTED
The CAP was rejected during review and needs revision. Returns to DRAFT status for updates.

## CAP Requirements
A complete CAP should include:
1. Root cause analysis (why the NC occurred)
2. Corrective action (what will be done to fix it)
3. Impact assessment (business/security impact)
4. Target closure date
5. Responsible person
6. Verification method (how effectiveness will be confirmed)

## Verification Methods
After CAP implementation, the fix must be verified using one of:
- RE_TEST: Re-run the original effectiveness test
- RE_AUDIT: Conduct a focused re-audit
- DOCUMENT_REVIEW: Review updated documentation
- WALKTHROUGH: Physical or logical walkthrough of the corrected process`,
      }],
    }),
  );

  server.resource(
    'data-integrity',
    'audits://data-integrity',
    {
      description: 'Data integrity and anti-hallucination guidance for AI consumers of this MCP server',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'audits://data-integrity',
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
- All UUIDs are system-generated (v4/cuid format). Never construct, guess, or interpolate UUIDs.
- NC IDs (e.g. "NC-2025-001") are user-assigned identifiers. They must come from tool responses.
- Control IDs (e.g. "A.5.1") follow ISO 27001 Annex A numbering. They must come from tool responses.

## Counts and Statistics
- A count of 0 is a valid answer — it means no records match, not that the query was wrong.
- An empty aging report means no open nonconformities exist — this is a positive outcome.
- Zero overdue NCs means all targets are being met.
- These are normal states for a well-managed or newly deployed system.

## Error vs. Absence
- **Tool error** (isError: true): The operation failed — e.g. invalid UUID, database error. Report the error.
- **Empty result** (isError: false, count: 0): The operation succeeded but found no matching records. Report the absence.
- Never confuse these two cases. They require different responses.

## Prohibited Actions
- Do not fabricate nonconformity IDs, titles, descriptions, or statuses
- Do not invent CAP details, verification results, or root cause analyses
- Do not guess at relationships between NCs and controls
- Do not assume data exists because it "should" — verify with a tool call`,
      }],
    }),
  );
}
