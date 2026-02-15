import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerResources(server: McpServer) {
  server.resource(
    'cmdb-classification',
    'itsm://reference/cmdb-classification',
    {
      description: 'CMDB asset classification taxonomy and reference data',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'itsm://reference/cmdb-classification',
        text: `# CMDB Asset Classification Taxonomy

## Asset Types

### Hardware
- SERVER, WORKSTATION, LAPTOP, MOBILE_DEVICE, NETWORK_DEVICE, STORAGE_DEVICE, SECURITY_APPLIANCE, IOT_DEVICE, PRINTER, OTHER_HARDWARE

### Software
- OPERATING_SYSTEM, APPLICATION, DATABASE, MIDDLEWARE

### Cloud
- CLOUD_VM, CLOUD_CONTAINER, CLOUD_DATABASE, CLOUD_STORAGE, CLOUD_NETWORK, CLOUD_SERVERLESS, CLOUD_KUBERNETES

### Services
- INTERNAL_SERVICE, EXTERNAL_SERVICE, SAAS_APPLICATION, API_ENDPOINT

### Data
- DATA_STORE, DATA_FLOW

### Other
- OTHER

## Business Criticality Levels
- **CRITICAL**: Asset failure causes immediate, severe business impact. Maximum protection required.
- **HIGH**: Asset failure causes significant business disruption. Priority protection.
- **MEDIUM**: Asset failure causes moderate impact. Standard protection.
- **LOW**: Asset failure causes minimal business impact. Basic protection.

## Data Classification Levels
- **PUBLIC**: Information approved for public access.
- **INTERNAL**: General internal information, not for external distribution.
- **CONFIDENTIAL**: Sensitive business information requiring access controls.
- **RESTRICTED**: Highly sensitive data (PII, financial, health). Strictest controls required.

## Asset Status Lifecycle
\`\`\`
PLANNED → PROCUREMENT → DEVELOPMENT → STAGING → ACTIVE → MAINTENANCE → RETIRING → DISPOSED
\`\`\`

## Cloud Providers
AWS, AZURE, GCP, ORACLE_CLOUD, IBM_CLOUD, ALIBABA_CLOUD, DIGITAL_OCEAN, PRIVATE_CLOUD, ON_PREMISES

## Relationship Types
### Dependency
DEPENDS_ON

### Hosting
RUNS_ON, HOSTED_ON, DEPLOYED_TO

### Network
CONNECTS_TO

### Data
STORES_DATA_ON, READS_FROM, WRITES_TO, REPLICATES_TO

### Management
MANAGED_BY, MONITORED_BY

### Backup & DR
BACKED_UP_TO, FAILS_OVER_TO

### Security
PROTECTED_BY, AUTHENTICATES_VIA

### Logical
MEMBER_OF, CONTAINS`,
      }],
    }),
  );

  server.resource(
    'change-management',
    'itsm://process/change-management',
    {
      description: 'Change management process reference including types, categories, and lifecycle',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'itsm://process/change-management',
        text: `# Change Management Process

## Change Types (ITSMChangeType)
- **STANDARD**: Pre-approved, low-risk changes. May use templates with auto-approval.
- **NORMAL**: Requires formal approval through the change process.
- **EMERGENCY**: Urgent changes requiring expedited approval. Post-implementation review mandatory.

## Change Categories
- ACCESS_CONTROL, CONFIGURATION, INFRASTRUCTURE, APPLICATION, DATABASE, SECURITY, NETWORK, BACKUP_DR, MONITORING, VENDOR, DOCUMENTATION, OTHER

## Security Impact Levels
- **CRITICAL**: Change directly affects critical security controls or highly sensitive data.
- **HIGH**: Change affects security controls or sensitive data handling.
- **MEDIUM**: Change has moderate security implications.
- **LOW**: Change has minimal security implications.
- **NONE**: Change has no security impact.

## Change Status Lifecycle
\`\`\`
DRAFTED → SUBMITTED → PENDING_APPROVAL → APPROVED → SCHEDULED → IMPLEMENTING → IN_PROGRESS → COMPLETED → REVIEWED
                          ↓                                                          ↓
                      NEEDS_INFO                                                   FAILED → ROLLED_BACK
                          ↓
                       REJECTED
                                                                                 CANCELLED (from any active state)
\`\`\`

## Approval Process
1. Requester creates change (DRAFTED)
2. Change submitted for approval (SUBMITTED → PENDING_APPROVAL)
3. Approvers review and decide (APPROVED / REJECTED / NEEDS_INFO)
4. For NORMAL/EMERGENCY: CAB (Change Advisory Board) review may be required
5. Approved changes are scheduled and implemented

## CAB Procedures
- cabRequired: Whether CAB review is needed
- cabMeetingDate: Scheduled CAB meeting
- cabDecision: CAB's formal decision
- Emergency changes: Expedited CAB review, PIR required

## Post-Implementation Review (PIR)
- Required for EMERGENCY changes and optionally for others
- Documents lessons learned and success/failure analysis
- Tracks pirCompleted, pirDate, pirNotes, lessonsLearned`,
      }],
    }),
  );

  server.resource(
    'capacity-management',
    'itsm://process/capacity-management',
    {
      description: 'Capacity management process reference for NIS2 compliance',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'itsm://process/capacity-management',
        text: `# Capacity Management Process

## NIS2 Requirements
NIS2 (Article 21) requires essential and important entities to implement measures ensuring the availability and resilience of network and information systems. Capacity management is a key component.

## Capacity Status Levels
- **NORMAL**: Resource utilization within acceptable thresholds.
- **WARNING**: Utilization approaching thresholds. Planning action recommended.
- **CRITICAL**: Utilization exceeding thresholds. Immediate action required.
- **EXHAUSTED**: Resource capacity fully consumed. Service degradation imminent or occurring.
- **UNKNOWN**: Capacity data not available or not monitored.

## Default Thresholds
- CPU: 80% (cpuThresholdPercent)
- Memory: 80% (memoryThresholdPercent)
- Storage: 80% (storageThresholdPercent)

Thresholds are configurable per asset. When utilization exceeds the threshold, alerts are generated.

## Capacity Planning
1. Monitor current utilization via CapacityRecord snapshots
2. Identify trends and growth rates (growthRatePercent, capacityTrend)
3. Project exhaustion dates (projectedExhaustionDate)
4. Create CapacityPlan with recommendations
5. Approve and implement capacity changes

## Capacity Plan Status
\`\`\`
DRAFT → PENDING_APPROVAL → APPROVED → IN_PROGRESS → COMPLETED
                                                        ↓
                                                    CANCELLED
\`\`\`

## Key Metrics
- cpuUsagePercent, memoryUsagePercent, storageUsagePercent
- networkBandwidthMbps, networkUsagePercent
- projectedGrowthPercent, projectionPeriodMonths
- estimatedCost for upgrades/expansion

## Best Practices
- Review capacity at least quarterly for CRITICAL assets
- Set thresholds based on business criticality (lower thresholds for critical assets)
- Track capacity trends over time using CapacityRecord history
- Create proactive capacity plans before reaching WARNING status
- Include cost projections in capacity plans for budget planning`,
      }],
    }),
  );

  server.resource(
    'data-integrity',
    'itsm://data-integrity',
    {
      description: 'Data integrity and anti-hallucination guidance for AI consumers of this ITSM MCP server',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'itsm://data-integrity',
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
- All UUIDs are system-generated (cuid format). Never construct, guess, or interpolate UUIDs.
- Asset tags (e.g. "AST-SRV-001") are user-assigned. They must come from tool responses.
- Change refs (e.g. "CHG-2026-001") are user-assigned. They must come from tool responses.
- Template codes (e.g. "STD-PATCH-001") are user-assigned. They must come from tool responses.

## Counts and Statistics
- A count of 0 is a valid answer — it means no records match, not that the query was wrong.
- Risk scores of 0 or null mean the asset has not been scored yet.
- Utilization percentages of 0 mean no utilization, not missing data.
- These are normal states for a newly deployed or in-progress system.

## Error vs. Absence
- **Tool error** (isError: true): The operation failed — e.g. invalid UUID, database error. Report the error.
- **Empty result** (isError: false, count: 0): The operation succeeded but found no matching records. Report the absence.
- Never confuse these two cases. They require different responses.

## Prohibited Actions
- Do not fabricate asset names, tags, IP addresses, or configurations
- Do not invent change request details, approval decisions, or status transitions
- Do not guess at relationships between assets or their dependencies
- Do not assume vulnerability counts, risk scores, or capacity metrics
- Do not assume data exists because it "should" — verify with a tool call`,
      }],
    }),
  );
}
