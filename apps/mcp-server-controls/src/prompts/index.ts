import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerPrompts(server: McpServer) {
  server.prompt(
    'gap-analysis',
    'Analyze control gaps from assessment results and recommend prioritized remediations',
    { assessmentId: z.string().optional().describe('Assessment UUID (uses latest completed if omitted)') },
    async ({ assessmentId }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Perform a comprehensive gap analysis of our control assessment${assessmentId ? ` (assessment ID: ${assessmentId})` : ''}.

Steps:
1. Use get_gap_analysis${assessmentId ? ` with assessmentId="${assessmentId}"` : ''} to identify controls with FAIL or PARTIAL results
2. For each gap, analyze the root cause and remediation effort
3. Group gaps by theme (Organisational, People, Physical, Technological)
4. Prioritize remediations based on:
   - Severity (FAIL before PARTIAL)
   - Root cause category
   - Remediation effort (quick wins first)
5. Present findings in a structured report with:
   - Executive summary
   - Gap count by theme and severity
   - Top 10 priority remediations with justification
   - Recommended timeline`,
        },
      }],
    }),
  );

  server.prompt(
    'soa-review',
    'Review Statement of Applicability for completeness and compliance',
    { soaId: z.string().describe('SOA UUID to review') },
    async ({ soaId }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Review the Statement of Applicability (SOA ID: ${soaId}) for completeness and compliance.

Steps:
1. Use get_soa with id="${soaId}" to retrieve the full SOA
2. Check for:
   - Controls marked as not applicable without justification
   - Controls with NOT_STARTED implementation status that should be prioritized
   - Consistency between implementation status and descriptions
   - Any gaps in coverage across all four themes
3. Compare with get_control_stats to verify alignment with control library
4. Present findings:
   - Overall completeness score
   - Issues requiring attention (missing justifications, inconsistencies)
   - Recommendations for improving the SOA
   - Controls that may need re-evaluation`,
        },
      }],
    }),
  );

  server.prompt(
    'assessment-plan',
    'Plan a new control assessment with scope, team, and timeline',
    {
      scope: z.string().optional().describe('Description of desired assessment scope'),
      framework: z.string().optional().describe('Target framework (ISO, SOC2, NIS2, DORA)'),
    },
    async ({ scope, framework }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Help me plan a new control assessment${scope ? ` focused on: ${scope}` : ''}${framework ? ` for the ${framework} framework` : ''}.

Steps:
1. Use get_control_stats to understand the current control landscape
2. Use list_controls${framework ? ` with framework="${framework}"` : ''} to identify controls in scope
3. Use get_assessment_stats to review past assessment coverage
4. Use get_gap_analysis to identify areas needing re-assessment
5. Recommend:
   - Which controls to include in the assessment
   - Suggested scope items to test against
   - Estimated number of tests
   - Recommended timeline and team size
   - Priority areas based on previous gaps
6. If the plan looks good, I can use propose_assessment to create it`,
        },
      }],
    }),
  );

  server.prompt(
    'control-posture',
    'Summarize the overall control posture and security status',
    {},
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Provide a comprehensive summary of our current control posture.

Steps:
1. Use get_control_stats for overall control landscape
2. Use get_assessment_stats for assessment coverage
3. Use get_metric_dashboard for operational metrics health
4. Use list_soas to check SOA status
5. Use get_gap_analysis for current gaps
6. Use get_overdue_tests to identify testing gaps
7. Present:
   - Executive summary (1-2 paragraphs)
   - Implementation status breakdown with percentages
   - Assessment coverage and recent results
   - Metric health (RAG distribution)
   - Top risks and gaps requiring attention
   - SOA status and compliance readiness
   - Recommended next actions`,
        },
      }],
    }),
  );
}
