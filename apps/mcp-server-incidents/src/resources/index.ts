import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerResources(server: McpServer) {
  server.resource(
    'incident-lifecycle',
    'incidents://lifecycle',
    {
      description: 'Incident status lifecycle and transitions',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'incidents://lifecycle',
        text: `# Incident Lifecycle

## Status Flow
\`\`\`
DETECTED → TRIAGED → INVESTIGATING → CONTAINING → ERADICATING → RECOVERING → POST_INCIDENT → CLOSED
\`\`\`

## Statuses

### DETECTED
Initial detection. Incident has been identified but not yet triaged.

### TRIAGED
Severity and category assigned. Initial assessment complete.

### INVESTIGATING
Active investigation underway. Gathering evidence, identifying scope.

### CONTAINING
Containment measures being implemented. Limiting damage spread.

### ERADICATING
Root cause being eliminated. Removing threat actors, malware, etc.

### RECOVERING
Systems being restored to normal operation. Verification of clean state.

### POST_INCIDENT
Post-incident review phase. Lessons learned, corrective actions.

### CLOSED
Incident fully resolved and documented.

## Resolution Types
- **RESOLVED**: Successfully remediated
- **FALSE_POSITIVE**: Not an actual incident
- **ACCEPTED_RISK**: Risk accepted by management
- **DUPLICATE**: Merged with another incident
- **TRANSFERRED**: Transferred to external party

## ISO 27001 Requirements
- Evidence must be preserved (evidencePreserved flag)
- Chain of custody maintained (chainOfCustodyMaintained flag)
- Root cause identified (rootCauseIdentified flag)
- Lessons learned completed (lessonsLearnedCompleted flag)
- Corrective actions identified (correctiveActionsIdentified flag)`,
      }],
    }),
  );

  server.resource(
    'severity-guide',
    'incidents://severity',
    {
      description: 'Incident severity classification guide',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'incidents://severity',
        text: `# Incident Severity Guide

## CRITICAL
- Active data breach or exfiltration
- Complete system compromise
- Regulatory notification required within 24-72 hours (NIS2/DORA)
- Business operations severely impacted

## HIGH
- Significant security control bypass
- Partial data exposure or unauthorized access
- Important systems affected
- Potential regulatory implications

## MEDIUM
- Isolated security event
- Limited scope of impact
- Contained to non-critical systems
- No data exposure confirmed

## LOW
- Minor security event
- No confirmed impact
- Informational or near-miss
- Single user or system affected

## CIA Impact Flags
Each incident tracks three breach flags:
- **Confidentiality**: Unauthorized information disclosure
- **Integrity**: Unauthorized modification of data
- **Availability**: Disruption of service availability`,
      }],
    }),
  );

  server.resource(
    'regulatory-reporting',
    'incidents://regulatory-reporting',
    {
      description: 'Regulatory incident reporting requirements (NIS2, DORA)',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'incidents://regulatory-reporting',
        text: `# Regulatory Incident Reporting

## NIS2 Directive
- **Early Warning**: Within 24 hours of becoming aware of a significant incident
- **Incident Notification**: Within 72 hours with initial assessment
- **Final Report**: Within 1 month of notification

## DORA
- **Initial Report**: Without undue delay, classify as major/not major
- **Intermediate Report**: Within 72 hours if major
- **Final Report**: Within 1 month of resolution

## Key Fields for Reporting
- classifiedAt: When the regulatory clock starts
- detectedAt: Initial detection timestamp
- containedAt: When containment was achieved
- closedAt: Final resolution

## Reporting Criteria
An incident is reportable when:
1. It affects critical/important functions
2. It impacts data confidentiality, integrity, or availability
3. It affects a significant number of users or systems
4. It involves personal data (GDPR crossover)`,
      }],
    }),
  );

  server.resource(
    'data-integrity',
    'incidents://data-integrity',
    {
      description: 'Data integrity and anti-hallucination guidance for AI consumers',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'incidents://data-integrity',
        text: `# Data Integrity Guidelines

## Source of Truth
All data returned by this MCP server comes exclusively from a PostgreSQL database accessed via Prisma ORM. Tool responses are the single source of truth.

## Empty Results
When a tool returns an empty array or a count of zero, it means the data genuinely does not exist in the database yet. Empty results are a valid, meaningful state. Report them as-is.

## Identifiers
- All UUIDs are system-generated (v4 format). Never construct, guess, or interpolate UUIDs.
- Incident reference numbers (e.g. "INC-2025-001") are user-assigned. They must come from tool responses.

## Counts and Statistics
- A count of 0 is a valid answer — it means no records match.
- MTTR of null means no closed incidents exist to calculate from.
- Zero open incidents means no active incidents — a good state.

## Error vs. Absence
- **Tool error** (isError: true): The operation failed. Report the error.
- **Empty result** (isError: false, count: 0): The operation succeeded but found no matching records.

## Prohibited Actions
- Do not fabricate incident details, timeline entries, or severity levels
- Do not invent affected assets or control links
- Do not guess at CIA impact flags
- Do not assume regulatory reporting obligations — verify with tool data`,
      }],
    }),
  );
}
