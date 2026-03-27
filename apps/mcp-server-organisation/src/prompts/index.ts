import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerPrompts(server: McpServer) {
  server.prompt(
    'isms-scope-review',
    'Review the ISMS scope — departments, locations, processes, and exclusions.',
    {},
    async () => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Please perform an ISMS scope review:

1. Use get_organisation_profile to review the defined ISMS scope, exclusions, and justifications
2. Use list_departments to see all departments and their data handling classifications
3. Use list_locations to check which locations are in ISMS scope
4. Use list_business_processes to review processes and their criticality
5. Use list_external_dependencies to review third-party scope

Assess:
- Are all critical departments and locations included?
- Are scope exclusions properly justified?
- Are high-criticality processes covered?
- Are single-point-of-failure dependencies in scope?
- Does the scope align with ISO 27001 Clause 4.3 requirements?

Provide a scope completeness assessment and any recommendations.`,
        },
      }],
    }),
  );

  server.prompt(
    'context-analysis',
    'Analyse the context of the organisation per ISO 27001 Clauses 4.1 and 4.2.',
    {},
    async () => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Please perform an ISO 27001 context analysis:

1. Use list_context_issues to review all internal and external issues
2. Use list_interested_parties to review stakeholder requirements
3. Use get_regulatory_profile to check regulatory applicability
4. Use list_regulators to see regulatory landscape
5. Use list_applicable_frameworks to see compliance framework coverage

Analyse:
- **Clause 4.1**: Are internal and external issues properly identified and current?
- **Clause 4.2**: Are all relevant interested parties captured with their requirements?
- Are any issues overdue for review?
- Have any issues been escalated to the risk register?
- Is the regulatory profile up to date?

Provide a context completeness score and gap analysis.`,
        },
      }],
    }),
  );

  server.prompt(
    'governance-assessment',
    'Assess governance effectiveness — committee activity, action completion, meeting cadence.',
    {},
    async () => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Please perform a governance effectiveness assessment:

1. Use list_committees to see all committees and their status
2. Use get_governance_activity_report for recent activity metrics
3. Use list_meeting_action_items with status "open" to find outstanding actions
4. Use list_key_personnel to review ISMS role coverage
5. Use get_org_dashboard for overall organisational health

Assess:
- **Meeting Cadence**: Are committees meeting at their defined frequency?
- **Quorum**: Are meetings achieving quorum?
- **Action Completion**: What is the action item completion rate?
- **Overdue Items**: How many action items are overdue?
- **Role Coverage**: Are all key ISMS roles filled with trained personnel?
- **Succession Planning**: Do key personnel have designated backups?

Provide a governance maturity rating and recommendations for improvement.`,
        },
      }],
    }),
  );
}
