import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerPrompts(server: McpServer) {
  server.prompt(
    'evidence-collection',
    'Plan evidence collection for a control or audit, identifying gaps and creating requests',
    {
      controlId: z.string().optional().describe('Control ID to collect evidence for'),
      scope: z.string().optional().describe('Description of collection scope'),
    },
    async ({ controlId, scope }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Help me plan evidence collection${controlId ? ` for control ${controlId}` : ''}${scope ? ` with scope: ${scope}` : ''}.

Steps:
1. Use get_evidence_coverage to understand current evidence gaps
2. Use list_evidence to see what evidence already exists${controlId ? ` (search for related evidence)` : ''}
3. Use get_request_aging to check for existing open requests
4. Identify what evidence is needed but missing
5. Recommend:
   - Evidence types to collect for each gap
   - Priority of collection
   - Suggested assignees
   - Due dates based on compliance deadlines
6. If needed, use propose_create_request to create evidence requests`,
        },
      }],
    }),
  );

  server.prompt(
    'expiry-review',
    'Review expiring evidence and plan renewals',
    {
      days: z.string().optional().describe('Number of days to look ahead (default 30)'),
    },
    async ({ days }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Review evidence expiring${days ? ` within ${days} days` : ' soon'} and plan renewals.

Steps:
1. Use get_expiring_evidence${days ? ` with days=${days}` : ''} to find evidence approaching expiry
2. Use get_evidence_stats to understand the overall evidence landscape
3. For each expiring item, check:
   - How many controls depend on it (via link counts)
   - Whether it's renewal-required
   - Current status
4. Present a prioritized renewal plan:
   - Evidence items ranked by urgency
   - Number of dependent controls/entities
   - Recommended renewal actions
   - Suggested evidence request creation`,
        },
      }],
    }),
  );

  server.prompt(
    'evidence-gap-analysis',
    'Analyze evidence coverage gaps across the control framework',
    {},
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Perform an evidence gap analysis across the control framework.

Steps:
1. Use get_evidence_coverage to identify controls without evidence
2. Use get_evidence_stats for overall evidence health
3. Use get_expiring_evidence to find soon-to-expire coverage
4. Use get_request_aging to check pending requests
5. Present:
   - Overall coverage percentage
   - Controls without any evidence (grouped by theme)
   - Evidence approaching expiry that will create new gaps
   - Overdue evidence requests
   - Prioritized remediation plan
   - Quick wins (controls that likely have evidence elsewhere)`,
        },
      }],
    }),
  );
}
