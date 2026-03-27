import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerResources(server: McpServer) {
  server.resource(
    'iso31000-framework',
    'risks://frameworks/iso31000',
    {
      description: 'ISO 31000 risk management framework structure',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'risks://frameworks/iso31000',
        text: `# ISO 31000 Risk Management Framework

## Risk Management Process
1. **Communication and Consultation** — Engage stakeholders throughout the process
2. **Scope, Context, Criteria** — Define the external/internal context and risk criteria
3. **Risk Assessment**:
   - **Risk Identification** — Find, recognize, and describe risks
   - **Risk Analysis** — Understand the nature and determine the level of risk
   - **Risk Evaluation** — Compare results against criteria to determine response
4. **Risk Treatment** — Select and implement options for addressing risk
5. **Monitoring and Review** — Ensure controls are effective and current
6. **Recording and Reporting** — Document and communicate findings

## Risk Levels
- **VERY_HIGH** (5): Almost certain / Catastrophic
- **HIGH** (4): Likely / Major
- **MEDIUM** (3): Possible / Moderate
- **LOW** (2): Unlikely / Minor
- **VERY_LOW** (1): Rare / Insignificant

## Risk Score Matrix
Risk Score = Likelihood x Impact (1-25)
- Critical: 20-25
- High: 12-19
- Medium: 6-11
- Low: 1-5`,
      }],
    }),
  );

  server.resource(
    'scoring-methodology',
    'risks://scoring/methodology',
    {
      description: 'Factor-based risk scoring methodology',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'risks://scoring/methodology',
        text: `# Risk Scoring Methodology

## Factor-Based Likelihood Model (F1-F6)
### Primary Factors (weighted):
- **F1 (34%)**: Threat Frequency — How often do attackers attempt this type of attack?
- **F2 (33%)**: Vulnerability/Ease of Exploit — How easy is it to exploit?
- **F3 (33%)**: Attack Surface — How many entry points exist?

### Supplementary Factors (0% weight, informational):
- **F4**: Incident History — Past occurrence frequency
- **F5**: Attack Surface (from Assets) — Asset-derived attack surface
- **F6**: Environmental — Threat intelligence and environmental factors

## Impact Categories (I1-I5)
- **I1**: Financial Impact
- **I2**: Operational Impact
- **I3**: Regulatory Impact
- **I4**: Reputational Impact
- **I5**: Strategic Impact

Overall Impact = MAX(I1, I2, I3, I4, I5)

## Risk Scoring
Risk is scored on a 5×5 Likelihood × Impact matrix (1-25). Likelihood and Impact are assessed on a 1-5 scale. Controls reduce residual scores based on effectiveness.

## Tolerance Status
- **WITHIN**: Score <= threshold
- **EXCEEDS**: Score > threshold AND <= threshold + 4
- **CRITICAL**: Score > threshold + 4`,
      }],
    }),
  );

  server.resource(
    'tolerance-guidance',
    'risks://tolerance/guidance',
    {
      description: 'Risk tolerance and appetite framework guidance',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'risks://tolerance/guidance',
        text: `# Risk Tolerance & Appetite Guidance

## Risk Tolerance Statements (RTS)
Each RTS defines acceptable risk levels for a specific domain.

### RTS Lifecycle
1. **DRAFT** → Initial creation
2. **PENDING_APPROVAL** → Submitted for review
3. **APPROVED** → Formally approved
4. **ACTIVE** → Currently enforced
5. **SUPERSEDED** → Replaced by newer version
6. **RETIRED** → No longer applicable

### Tolerance Levels
- **HIGH**: Organisation willing to accept significant risk in this area
- **MEDIUM**: Moderate risk acceptance with monitoring
- **LOW**: Minimal risk tolerance, aggressive treatment required

### Appetite Levels
- **MINIMAL**: Near-zero tolerance
- **LOW**: Limited tolerance with strict controls
- **MODERATE**: Balanced approach
- **HIGH**: Aggressive risk-taking acceptable

### Breach Handling
When a scenario exceeds its tolerance threshold:
1. Alert generated automatically
2. Scenario marked as EXCEEDS or CRITICAL tolerance status
3. Treatment plan required or acceptance renewal needed
4. Escalation to risk authority if CRITICAL`,
      }],
    }),
  );

  server.resource(
    'treatment-workflow',
    'risks://treatment/workflow',
    {
      description: 'Treatment plan lifecycle and action tracking workflow',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'risks://treatment/workflow',
        text: `# Treatment Plan Workflow

## Treatment Types
- **MITIGATE**: Reduce risk through controls (most common)
- **TRANSFER**: Transfer risk to a third party (e.g., insurance)
- **ACCEPT**: Accept the risk with formal justification
- **AVOID**: Eliminate the risk source entirely
- **SHARE**: Share risk with partners

## Treatment Lifecycle
\`\`\`
DRAFT → PROPOSED → APPROVED → IN_PROGRESS → COMPLETED
  ↓        ↓          ↓            ↓
  └────────┴──────────┴────────────┴──→ ON_HOLD / CANCELLED
\`\`\`

## Treatment Actions
Each plan contains individual actions:
- NOT_STARTED → IN_PROGRESS → COMPLETED
- Can be BLOCKED or CANCELLED

## Dependencies
Treatment plans can have dependencies:
- **BLOCKS**: Must complete before the target can start
- **REQUIRES**: Needs the target to complete first
- **RELATED**: Informational relationship

## Progress Tracking
- Progress percentage (0-100%)
- Individual action completion drives plan progress
- History tracks all changes for audit trail`,
      }],
    }),
  );

  server.resource(
    'data-integrity',
    'risks://data-integrity',
    {
      description: 'Data integrity and anti-hallucination guidance for AI consumers of this MCP server',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'risks://data-integrity',
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
- All UUIDs are system-generated (CUID format). Never construct, guess, or interpolate UUIDs.
- Risk IDs (e.g. "R-01") follow organisational numbering. They must come from tool responses.
- Scenario IDs (e.g. "R-01-S01") follow risk-scenario numbering. They must come from tool responses.
- KRI IDs (e.g. "KRI-001") are user-assigned. They must come from tool responses.
- RTS IDs (e.g. "RTS-001") are user-assigned. They must come from tool responses.
- Treatment IDs (e.g. "TP-001") are user-assigned. They must come from tool responses.

## Counts and Statistics
- A count of 0 is a valid answer — it means no records match, not that the query was wrong.
- Risk scores of 0 or null mean the scenario has not been assessed yet.
- Treatment progress of 0% means the treatment has not started.
- These are normal states for a newly deployed or in-progress system.

## Error vs. Absence
- **Tool error** (isError: true): The operation failed — e.g. invalid UUID, database error. Report the error.
- **Empty result** (isError: false, count: 0): The operation succeeded but found no matching records. Report the absence.
- Never confuse these two cases. They require different responses.

## Prohibited Actions
- Do not fabricate risk titles, descriptions, or scores
- Do not invent scenario assessments, factor scores, or tolerance evaluations
- Do not guess at relationships between entities (risk-to-control, scenario-to-treatment)
- Do not assume data exists because it "should" — verify with a tool call`,
      }],
    }),
  );
}
