import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerResources(server: McpServer) {
  server.resource(
    'document-types',
    'policies://document-types',
    {
      description: 'Policy document type hierarchy and classification levels.',
      mimeType: 'text/plain',
    },
    async () => ({
      contents: [{
        uri: 'policies://document-types',
        mimeType: 'text/plain',
        text: `# Policy Document Types (ISO 27001:2022 Clause 7.5)

## Document Hierarchy
1. POLICY — Level 1 strategic direction (e.g. Information Security Policy)
2. STANDARD — Level 2 requirements (e.g. Access Control Standard)
3. PROCEDURE — Level 3 operational steps (e.g. Incident Response Procedure)
4. WORK_INSTRUCTION — Level 4 detailed tasks (e.g. Firewall Configuration Guide)
5. FORM / TEMPLATE / CHECKLIST — Supporting documents
6. GUIDELINE — Advisory, non-mandatory
7. RECORD — Evidence of compliance

## Classification Levels
- PUBLIC — External distribution permitted
- INTERNAL — Organisation-wide, not external
- CONFIDENTIAL — Restricted distribution list
- RESTRICTED — Need-to-know basis only

## Approval Levels (highest to lowest)
BOARD → EXECUTIVE → SENIOR_MANAGEMENT → MANAGEMENT → TEAM_LEAD → PROCESS_OWNER

## Review Frequencies
MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL, BIENNIAL, TRIENNIAL, ON_CHANGE, AS_NEEDED`,
      }],
    }),
  );

  server.resource(
    'document-lifecycle',
    'policies://document-lifecycle',
    {
      description: 'Policy document lifecycle status transitions.',
      mimeType: 'text/plain',
    },
    async () => ({
      contents: [{
        uri: 'policies://document-lifecycle',
        mimeType: 'text/plain',
        text: `# Policy Document Lifecycle

## Status Flow
DRAFT → PENDING_REVIEW → PENDING_APPROVAL → APPROVED → PUBLISHED

## Additional Transitions
- PUBLISHED → UNDER_REVISION (when changes needed)
- UNDER_REVISION → PENDING_REVIEW (updated draft submitted)
- PUBLISHED → SUPERSEDED (replaced by newer version)
- PUBLISHED → RETIRED (no longer needed)
- RETIRED → ARCHIVED (historical retention)

## Change Request Statuses
SUBMITTED → UNDER_REVIEW → APPROVED → IN_PROGRESS → IMPLEMENTED → VERIFIED
Alternative: SUBMITTED → REJECTED or CANCELLED

## Exception Statuses
REQUESTED → UNDER_REVIEW → APPROVED → ACTIVE → EXPIRED or REVOKED or CLOSED

## Version Control
- Major version: significant content changes (1.0 → 2.0)
- Minor version: editorial changes, clarifications (1.0 → 1.1)
- Change types: INITIAL, MINOR_UPDATE, CLARIFICATION, ENHANCEMENT, CORRECTION, REGULATORY_UPDATE, MAJOR_REVISION, RESTRUCTURE`,
      }],
    }),
  );

  server.resource(
    'approval-hierarchy',
    'policies://approval-hierarchy',
    {
      description: 'Policy approval workflow and hierarchy.',
      mimeType: 'text/plain',
    },
    async () => ({
      contents: [{
        uri: 'policies://approval-hierarchy',
        mimeType: 'text/plain',
        text: `# Policy Approval Hierarchy

## Workflow Types
- NEW_DOCUMENT — Approval for new policy documents
- REVISION — Approval for document updates
- EXCEPTION — Approval for policy exceptions
- RETIREMENT — Approval for retiring a document

## Workflow Statuses
PENDING → IN_PROGRESS → APPROVED or REJECTED or CANCELLED or ESCALATED

## Approval Step Statuses
PENDING → IN_REVIEW → APPROVED or REJECTED or SKIPPED or DELEGATED

## Approval Decisions
- APPROVE — Accept as-is
- APPROVE_WITH_CHANGES — Accept with minor modifications
- REJECT — Decline, requires rework
- REQUEST_CHANGES — Return for specific changes
- DELEGATE — Transfer approval authority

## Review Types
- SCHEDULED — Regular periodic review
- TRIGGERED — Event-driven review
- AUDIT_FINDING — Review after audit finding
- INCIDENT_RESPONSE — Review after security incident
- REGULATORY_CHANGE — Review due to regulation change
- REQUEST — Ad-hoc review request

## Review Outcomes
NO_CHANGES, MINOR_CHANGES, MAJOR_CHANGES, SUPERSEDE, RETIRE`,
      }],
    }),
  );

  server.resource(
    'data-integrity',
    'policies://data-integrity',
    {
      description: 'Data integrity rules for the policies MCP server.',
      mimeType: 'text/plain',
    },
    async () => ({
      contents: [{
        uri: 'policies://data-integrity',
        mimeType: 'text/plain',
        text: `# Policies MCP Server — Data Integrity Rules

1. NEVER FABRICATE DATA. If a tool returns empty results, zero counts, or "not found", report exactly.
2. CITE TOOL RESULTS. Reference which tool returned data.
3. DISTINGUISH ABSENCE FROM ERROR. "No records found" ≠ "tool call failed".
4. NO INVENTED IDENTIFIERS. UUIDs, document IDs, exception IDs must come from tool responses.
5. WHEN UNCERTAIN, QUERY AGAIN. Use search_policy_documents or list_policy_documents with different filters.
6. ZERO IS A VALID ANSWER. If counts are 0, coverage is 0%, present truthfully.
7. All mutations go through the proposal queue (McpPendingAction) and require human approval.
8. Document IDs follow the pattern: POL-001, STD-002-01, etc. — always query first, never guess.`,
      }],
    }),
  );
}
