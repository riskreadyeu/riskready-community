import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerPrompts(server: McpServer) {
  server.prompt(
    'policy-review',
    'Review policies due for review — identifies overdue and upcoming reviews, flags gaps.',
    {},
    async () => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Please perform a comprehensive policy review analysis:

1. Use get_review_calendar to identify overdue and upcoming reviews
2. Use get_policy_stats to get overall policy health metrics
3. Use list_policy_documents with status PUBLISHED to see active policies

For each overdue policy:
- Note how many days overdue
- Identify the document owner
- Flag the review frequency

Provide a prioritised action plan for completing overdue reviews and preparing for upcoming ones.`,
        },
      }],
    }),
  );

  server.prompt(
    'compliance-mapping',
    'Analyse policy-to-control mapping coverage and identify gaps.',
    {},
    async () => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Please perform a policy compliance mapping analysis:

1. Use get_policy_compliance_matrix to identify control coverage
2. Use get_policy_stats to understand the policy landscape
3. Use list_policy_documents to review document types and statuses

For the analysis:
- Identify controls without policy coverage
- Group uncovered controls by theme (Organisational, People, Physical, Technological)
- Check if existing policies need broader control mappings
- Identify policies that may be redundant or overlapping

Provide recommendations for improving policy coverage across all applicable controls.`,
        },
      }],
    }),
  );

  server.prompt(
    'policy-health-check',
    'Comprehensive policy management health check covering lifecycle, exceptions, and acknowledgments.',
    {},
    async () => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Please perform a comprehensive policy health check:

1. Use get_policy_stats for overall metrics
2. Use get_review_calendar for review status
3. Use get_exception_report for active exceptions
4. Use get_policy_hierarchy to check document structure
5. Use list_policy_documents to review all documents

Assess the following areas:
- **Lifecycle Health**: Are documents in appropriate statuses? Any stuck in DRAFT or PENDING?
- **Review Compliance**: What percentage of reviews are on schedule?
- **Exception Management**: Are exceptions being tracked and reviewed? Any expired?
- **Document Structure**: Is the hierarchy well-organised? Parent-child relationships correct?
- **Coverage**: Are all document types represented? Any gaps in the policy framework?

Provide an overall health score and prioritised recommendations.`,
        },
      }],
    }),
  );
}
