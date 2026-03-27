import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerPrompts(server: McpServer) {
  server.prompt(
    'asset-risk-assessment',
    'Perform a comprehensive security and risk assessment of a specific asset',
    { assetId: z.string().describe('Asset UUID to assess') },
    async ({ assetId }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Perform a comprehensive security and risk assessment of asset (ID: ${assetId}).

Steps:
1. Use get_asset with id="${assetId}" to retrieve full asset details
2. Use get_asset_security_posture with id="${assetId}" to review security configuration
3. Use get_asset_relationships with assetId="${assetId}" to understand dependencies and exposure
4. Use get_asset_risks with assetId="${assetId}" to review linked risks
5. Use get_asset_controls with assetId="${assetId}" to review applied controls
6. Analyze the findings and present:
   - Asset overview (type, criticality, classification, scope)
   - Security posture assessment (encryption, backup, monitoring, vulnerabilities)
   - Dependency analysis (critical dependencies, single points of failure)
   - Risk exposure (linked risks, unmitigated threats)
   - Control coverage (gaps in control application)
   - Risk score interpretation (inherent vs residual, SCA score)
   - Prioritized recommendations for improvement
7. Highlight any critical findings that require immediate attention`,
        },
      }],
    }),
  );

  server.prompt(
    'change-impact-analysis',
    'Analyze the potential impact of a change request across affected assets and dependencies',
    { changeId: z.string().describe('Change UUID to analyze') },
    async ({ changeId }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Perform a comprehensive impact analysis for change request (ID: ${changeId}).

Steps:
1. Use get_change with id="${changeId}" to retrieve full change details
2. For each asset linked to the change (from assetLinks), use get_asset_relationships to map the dependency chain
3. Use search_changes to find related or concurrent changes that may conflict
4. Analyze the findings and present:
   - Change overview (type, category, priority, security impact)
   - Directly affected assets and their business criticality
   - Dependency cascade (assets indirectly affected through relationships)
   - Service impact assessment (which business processes may be affected)
   - Risk assessment (what could go wrong, likelihood, impact)
   - Concurrent change conflicts (overlapping maintenance windows)
   - Approval status and outstanding approvals
   - Recommendations for the change (proceed, modify, or postpone)
   - Suggested backout plan validation points`,
        },
      }],
    }),
  );

  server.prompt(
    'capacity-planning-review',
    'Review capacity status across the infrastructure and identify assets needing attention',
    {},
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Perform a comprehensive capacity planning review across the infrastructure.

Steps:
1. Use get_capacity_alerts to identify assets currently exceeding thresholds
2. Use list_capacity_plans to review existing capacity plans and their status
3. Use get_itsm_dashboard to get the overall capacity and asset health picture
4. For any critical alerts, use get_asset with the asset ID to review full details
5. Analyze the findings and present:
   - Executive summary of capacity health
   - Critical alerts requiring immediate action (assets over threshold)
   - Capacity plans in progress and their status
   - Assets approaching thresholds (warning status)
   - Projected exhaustion dates for at-risk assets
   - NIS2 compliance considerations for capacity management
   - Prioritized recommendations:
     * Immediate actions (critical/exhausted)
     * Short-term actions (warning, approaching threshold)
     * Strategic planning (growth projections, budget planning)
   - Suggested new capacity plans for unaddressed issues`,
        },
      }],
    }),
  );
}
