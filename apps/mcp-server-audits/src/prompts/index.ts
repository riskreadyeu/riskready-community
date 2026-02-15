import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerPrompts(server: McpServer) {
  server.prompt(
    'nc-review',
    'Review open nonconformities and prioritize based on severity, aging, and CAP status',
    {},
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Review all open nonconformities and provide a prioritized action plan.

Steps:
1. Use get_nc_stats to understand the overall NC landscape
2. Use list_nonconformities with status filters to identify open NCs (OPEN, IN_PROGRESS, AWAITING_VERIFICATION)
3. Use get_nc_aging_report to check which NCs have been open the longest
4. Use get_cap_status_report to identify NCs with undefined or rejected CAPs
5. Prioritize based on:
   - Severity (MAJOR before MINOR before OBSERVATION)
   - Age (older NCs first — especially those 90+ days)
   - CAP status (NOT_DEFINED needs immediate attention)
   - Overdue target closure dates
6. Present findings in a structured report with:
   - Executive summary (total open, overdue count, severity breakdown)
   - Top priority NCs requiring immediate attention
   - CAP pipeline status
   - Recommended next actions for each priority NC
   - Aging analysis with risk assessment`,
        },
      }],
    }),
  );

  server.prompt(
    'cap-planning',
    'Help plan corrective actions for a specific nonconformity',
    { ncId: z.string().describe('Nonconformity UUID to plan CAP for') },
    async ({ ncId }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Help me plan a corrective action for nonconformity ID: ${ncId}.

Steps:
1. Use get_nonconformity with id="${ncId}" to get full NC details
2. Analyze the NC details:
   - What was found (findings)?
   - What control is affected?
   - What is the severity and category?
   - Is there already a root cause analysis?
3. If a control is linked, consider the control's implementation status
4. Use get_nc_by_control to check if this control has recurring NCs (pattern analysis)
5. Recommend a corrective action plan including:
   - Root cause analysis (if not already defined)
   - Specific corrective actions to address the root cause
   - Recommended target closure date based on severity
   - Suggested verification method (RE_TEST, RE_AUDIT, DOCUMENT_REVIEW, WALKTHROUGH)
   - Impact assessment
   - Any preventive actions to avoid recurrence
6. If the plan looks good, I can use propose_submit_cap to submit it for approval`,
        },
      }],
    }),
  );

  server.prompt(
    'audit-readiness',
    'Assess audit readiness by checking open NCs, overdue CAPs, and verification status',
    {},
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Assess our audit readiness by reviewing the current state of nonconformities and corrective actions.

Steps:
1. Use get_nc_stats for overall NC statistics
2. Use list_nonconformities with status="OPEN" to check for unaddressed NCs
3. Use get_nc_aging_report to identify long-standing open items
4. Use get_cap_status_report to review the CAP pipeline
5. Use list_nonconformities with status="AWAITING_VERIFICATION" to check pending verifications
6. Use get_nc_by_control to identify controls with multiple NCs (systemic issues)
7. Evaluate audit readiness based on:
   - Number of open MAJOR nonconformities (should be 0 for certification)
   - Number of open MINOR nonconformities (should be minimal)
   - CAP completion rate (all approved and implemented)
   - Verification completion rate
   - Age of oldest open NC
   - Recurring issues on the same controls
8. Present an audit readiness report with:
   - Overall readiness score (RED/AMBER/GREEN)
   - Blockers that must be resolved before audit
   - Risks that could affect audit outcome
   - Recommended actions with timeline
   - Positive findings (verified effective NCs, closed items)`,
        },
      }],
    }),
  );
}
