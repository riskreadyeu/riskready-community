import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerResources(server: McpServer) {
  server.resource(
    'iso27001-context',
    'organisation://iso27001-context',
    {
      description: 'ISO 27001 context of the organisation requirements (Clauses 4.1-4.4).',
      mimeType: 'text/plain',
    },
    async () => ({
      contents: [{
        uri: 'organisation://iso27001-context',
        mimeType: 'text/plain',
        text: `# ISO 27001:2022 — Context of the Organisation

## Clause 4.1 — Understanding the Organisation and Its Context
Determine external and internal issues relevant to the ISMS purpose and strategic direction.
- External: legal, regulatory, economic, competitive, technological, cultural
- Internal: governance, structure, roles, policies, objectives, culture, capabilities, information systems

Use list_context_issues to query context issues in the system.

## Clause 4.2 — Understanding the Needs and Expectations of Interested Parties
Identify interested parties and their requirements relevant to the ISMS.
- Customers, regulators, employees, suppliers, shareholders, partners

Use list_interested_parties to query interested parties.

## Clause 4.3 — Determining the Scope of the ISMS
Define boundaries and applicability. Scope includes:
- Internal/external issues (4.1)
- Requirements of interested parties (4.2)
- Interfaces and dependencies

Use get_organisation_profile to see the ISMS scope details.

## Clause 4.4 — Information Security Management System
Establish, implement, maintain, and continually improve the ISMS.`,
      }],
    }),
  );

  server.resource(
    'isms-scope',
    'organisation://isms-scope',
    {
      description: 'ISMS scope definition including departments, locations, processes, and systems.',
      mimeType: 'text/plain',
    },
    async () => ({
      contents: [{
        uri: 'organisation://isms-scope',
        mimeType: 'text/plain',
        text: `# ISMS Scope Definition

## Scope Components
The ISMS scope is defined by the following in-scope elements:
- **Departments**: Use list_departments to see all departments
- **Locations**: Use list_locations to see locations (check inIsmsScope field)
- **Business Processes**: Use list_business_processes to see processes
- **External Dependencies**: Use list_external_dependencies for third-party scope

## Exclusions
Any scope exclusions and their justifications are stored in the organisation profile.
Use get_organisation_profile to see scopeExclusions and exclusionJustification.

## Regulatory Scope
- DORA applicability: Check isDoraApplicable in regulatory profile
- NIS2 applicability: Check isNis2Applicable in regulatory profile
Use get_regulatory_profile to see the full regulatory profile.

## Certification
ISO certification status, body, dates, and certificate number are in the organisation profile.`,
      }],
    }),
  );

  server.resource(
    'governance-structure',
    'organisation://governance-structure',
    {
      description: 'Governance structure including committees, key personnel, and reporting lines.',
      mimeType: 'text/plain',
    },
    async () => ({
      contents: [{
        uri: 'organisation://governance-structure',
        mimeType: 'text/plain',
        text: `# Governance Structure

## Security Committees
Use list_committees to see all governance committees.
Each committee has:
- Committee type (e.g. security steering, risk, audit)
- Meeting frequency
- Chair and members
- Decisions and action items from meetings

## Key Personnel (ISMS Roles)
Use list_key_personnel to see key ISMS roles including:
- CISO, DPO, Information Security Manager, Risk Manager
- Authority levels and security responsibilities
- Backup persons for succession planning
- Training completion status

## Meeting Governance
Use list_committee_meetings to see meeting history.
Use list_meeting_action_items to track governance actions.
Use get_governance_activity_report for a governance health overview.

## Department Structure
Use list_departments to see the organisational hierarchy.
Each department tracks headcount, criticality, and data handling classifications.`,
      }],
    }),
  );

  server.resource(
    'data-integrity',
    'organisation://data-integrity',
    {
      description: 'Data integrity rules for the organisation MCP server.',
      mimeType: 'text/plain',
    },
    async () => ({
      contents: [{
        uri: 'organisation://data-integrity',
        mimeType: 'text/plain',
        text: `# Organisation MCP Server — Data Integrity Rules

1. NEVER FABRICATE DATA. If a tool returns empty results, zero counts, or "not found", report exactly.
2. CITE TOOL RESULTS. Reference which tool returned data.
3. DISTINGUISH ABSENCE FROM ERROR. "No records found" ≠ "tool call failed".
4. NO INVENTED IDENTIFIERS. UUIDs, department codes, process codes, location codes must come from tool responses.
5. WHEN UNCERTAIN, QUERY AGAIN. Use different filters before concluding that data does not exist.
6. ZERO IS A VALID ANSWER. If counts are 0, present truthfully.
7. All mutations go through the proposal queue (McpPendingAction) and require human approval.
8. The organisation profile contains sensitive data — present factually, never extrapolate.`,
      }],
    }),
  );
}
