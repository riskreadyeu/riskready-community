import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerResources(server: McpServer) {
  server.resource(
    'evidence-types',
    'evidence://types',
    {
      description: 'Evidence type classifications and descriptions',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'evidence://types',
        text: `# Evidence Types

## Documents
- **DOCUMENT**: General document evidence
- **CERTIFICATE**: Certificates (SSL, ISO, SOC2, etc.)
- **REPORT**: Formal reports
- **POLICY**: Policy documents
- **PROCEDURE**: Procedure documentation
- **SCREENSHOT**: Screenshot evidence

## Technical
- **LOG**: System, application, or security logs
- **CONFIGURATION**: System configuration snapshots
- **NETWORK_CAPTURE**: Network traffic captures (PCAP)
- **MEMORY_DUMP**: Memory forensic dumps
- **DISK_IMAGE**: Disk forensic images
- **MALWARE_SAMPLE**: Malware samples (handle with care)

## Communications
- **EMAIL**: Email evidence
- **MEETING_NOTES**: Meeting minutes and notes
- **APPROVAL_RECORD**: Formal approval records

## Assessments
- **AUDIT_REPORT**: Internal/external audit reports
- **ASSESSMENT_RESULT**: Assessment outcomes
- **TEST_RESULT**: Control test results
- **SCAN_RESULT**: Vulnerability/compliance scan results

## Classifications
- **PUBLIC**: Can be shared externally
- **INTERNAL**: Internal use only
- **CONFIDENTIAL**: Restricted distribution
- **RESTRICTED**: Need-to-know basis only`,
      }],
    }),
  );

  server.resource(
    'retention-guidance',
    'evidence://retention',
    {
      description: 'Evidence retention and validity guidance',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'evidence://retention',
        text: `# Evidence Retention Guidance

## Validity Periods
Evidence records track validity through:
- **validFrom**: When the evidence becomes valid
- **validUntil**: Expiry date (triggers renewal workflow)
- **retainUntil**: Minimum retention period

## Renewal
- **renewalRequired**: Whether evidence must be renewed before expiry
- **renewalReminderDays**: Days before expiry to send reminders (default 30)

## Evidence Lifecycle
1. **PENDING**: Uploaded, awaiting review
2. **UNDER_REVIEW**: Being reviewed by authorized personnel
3. **APPROVED**: Reviewed and accepted as valid evidence
4. **REJECTED**: Reviewed and found insufficient
5. **EXPIRED**: Past validity date (auto or manual)
6. **ARCHIVED**: No longer active but retained for compliance

## ISO 27001 Requirements
- Evidence of ISMS operation must be retained (Clause 7.5)
- Retention periods should align with legal and contractual obligations
- Evidence must be protected from unauthorized modification
- Chain of custody must be maintained for forensic evidence`,
      }],
    }),
  );

  server.resource(
    'request-workflow',
    'evidence://request-workflow',
    {
      description: 'Evidence request workflow and statuses',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'evidence://request-workflow',
        text: `# Evidence Request Workflow

## Request Lifecycle
\`\`\`
OPEN → IN_PROGRESS → SUBMITTED → ACCEPTED
                                → REJECTED (back to IN_PROGRESS)
     → CANCELLED
     → OVERDUE (automatic when past due date)
\`\`\`

## Request Context
Each request can be linked to a context:
- **contextType**: What module needs the evidence (Control, Test, Audit, Incident, etc.)
- **contextId**: The specific entity ID
- **contextRef**: Human-readable reference (e.g., "A.5.1", "NC-2025-001")

## Fulfillment
Requests are fulfilled by linking existing Evidence records via EvidenceRequestFulfillment. A single request can be fulfilled by multiple evidence records.

## Priorities
- **CRITICAL**: Urgent — regulatory or audit deadline
- **HIGH**: Important — compliance gap
- **MEDIUM**: Standard collection cycle
- **LOW**: Nice to have, no deadline pressure`,
      }],
    }),
  );

  server.resource(
    'data-integrity',
    'evidence://data-integrity',
    {
      description: 'Data integrity and anti-hallucination guidance for AI consumers',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'evidence://data-integrity',
        text: `# Data Integrity Guidelines

## Source of Truth
All data returned by this MCP server comes exclusively from a PostgreSQL database accessed via Prisma ORM. Tool responses are the single source of truth.

## Empty Results
When a tool returns an empty array or a count of zero, it means the data genuinely does not exist in the database yet. Empty results are a valid, meaningful state.

## Identifiers
- All UUIDs are system-generated. Never construct or guess them.
- Evidence references (e.g. "EVD-2025-0001") must come from tool responses.
- Request references (e.g. "REQ-2025-0001") must come from tool responses.

## Prohibited Actions
- Do not fabricate evidence records, file names, or hash values
- Do not invent link relationships between evidence and other entities
- Do not guess at validity dates or classification levels
- Do not assume evidence exists because a control exists — verify with tool calls`,
      }],
    }),
  );
}
