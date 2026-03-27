import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerPrompts(server: McpServer) {
  server.prompt(
    'risk-assessment-workflow',
    'Guide through a complete risk assessment: identify, analyze, evaluate, and recommend treatment.',
    async () => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Please guide me through a complete risk assessment workflow. Follow these steps:

1. **Identify Risks**: Use list_risks and get_risk_stats to understand the current risk landscape.
2. **Analyze Scenarios**: For each risk, use list_scenarios to find scenarios that need assessment. Use get_scenario_scores to review factor scores.
3. **Evaluate Tolerance**: Use get_tolerance_breaches to identify scenarios exceeding tolerance. Check get_rts_stats for coverage.
4. **Review KRIs**: Use get_kri_alerts and get_kri_dashboard to identify warning indicators.
5. **Treatment Status**: Use get_treatment_progress and get_overdue_treatments to check mitigation progress.
6. **Recommend Actions**: Based on findings, propose specific actions using proposal tools.

Present findings in a structured report with clear priorities.`,
          },
        },
      ],
    }),
  );

  server.prompt(
    'tolerance-review',
    'Review all tolerance breaches and recommend remediation actions.',
    async () => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Perform a tolerance breach review:

1. Use get_tolerance_breaches to find all scenarios exceeding tolerance.
2. For each breach, use get_scenario to understand the full context.
3. Use list_rts to review the applicable tolerance statements.
4. Check get_treatment_progress for any existing treatments addressing these breaches.
5. For unaddressed breaches, recommend whether to:
   - Create a new treatment plan (propose_create_treatment_plan)
   - Update tolerance levels (propose_approve_rts with new thresholds)
   - Escalate to risk authority
6. Summarize findings with severity ranking.`,
          },
        },
      ],
    }),
  );

  server.prompt(
    'treatment-effectiveness',
    'Analyze treatment plan progress and identify gaps in risk mitigation.',
    async () => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Analyze the effectiveness of current treatment plans:

1. Use get_treatment_stats to understand overall treatment distribution.
2. Use get_treatment_progress to review active treatments and their completion status.
3. Use get_overdue_treatments to identify delayed mitigations.
4. For each overdue treatment, use get_treatment_plan to understand blockers and dependencies.
5. Cross-reference with get_tolerance_breaches to identify untreated high-risk scenarios.
6. Provide recommendations:
   - Which treatments need acceleration?
   - Which risks lack treatment plans entirely?
   - What is the estimated timeline to full mitigation?`,
          },
        },
      ],
    }),
  );

  server.prompt(
    'kri-trend-analysis',
    'Analyze KRI trends and predict potential risk increases.',
    async () => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Perform a KRI trend analysis:

1. Use get_kri_dashboard for an overview of KRI health.
2. Use get_kri_alerts to identify KRIs in RED or with declining trends.
3. For each alerting KRI, use get_kri to review measurement history.
4. Identify patterns:
   - Which KRIs have been declining for 3+ consecutive measurements?
   - Which KRIs crossed from GREEN to AMBER recently?
   - Which KRIs are overdue for measurement?
5. Cross-reference with list_risks to map KRI alerts to risk impact.
6. Recommend actions:
   - Immediate attention for RED/declining KRIs
   - Threshold adjustments if needed
   - New KRIs to fill monitoring gaps`,
          },
        },
      ],
    }),
  );
}
