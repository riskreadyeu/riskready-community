import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerPrompts(server: McpServer) {
  server.prompt(
    'incident-response',
    'Guide incident response workflow for a specific incident',
    { incidentId: z.string().describe('Incident UUID') },
    async ({ incidentId }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Guide me through the incident response workflow for incident ID: ${incidentId}.

Steps:
1. Use get_incident with id="${incidentId}" to get current incident details
2. Use list_incident_timeline with incidentId="${incidentId}" to see what actions have been taken
3. Use get_incident_assets with incidentId="${incidentId}" to understand affected assets
4. Use get_incident_controls with incidentId="${incidentId}" to see control performance
5. Based on the current status, recommend:
   - Immediate actions needed
   - Next status transition
   - Evidence to collect
   - People to notify
   - Regulatory reporting obligations (check classifiedAt for clock)
6. If needed, propose timeline entries or status transitions`,
        },
      }],
    }),
  );

  server.prompt(
    'post-incident-review',
    'Conduct a post-incident review for a closed or post-incident phase incident',
    { incidentId: z.string().describe('Incident UUID') },
    async ({ incidentId }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Conduct a post-incident review for incident ID: ${incidentId}.

Steps:
1. Use get_incident with id="${incidentId}" to get full incident details
2. Use list_incident_timeline with incidentId="${incidentId}" to reconstruct the timeline
3. Use get_incident_assets with incidentId="${incidentId}" to review affected assets
4. Use get_incident_controls with incidentId="${incidentId}" to evaluate control effectiveness
5. Use list_incident_lessons with incidentId="${incidentId}" to see existing lessons learned
6. Analyze and present:
   - Incident chronology (detection to resolution)
   - Time metrics (time to detect, contain, resolve)
   - Root cause analysis
   - Control failures and gaps
   - What went well
   - Areas for improvement
   - Recommended corrective actions
7. If lessons are missing, suggest creating them with propose_create_lesson`,
        },
      }],
    }),
  );

  server.prompt(
    'incident-reporting',
    'Generate an incident status report suitable for management or regulators',
    {
      scope: z.string().optional().describe('Report scope (e.g. "last 30 days", "critical incidents", "all open")'),
    },
    async ({ scope }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Generate an incident status report${scope ? ` focused on: ${scope}` : ''}.

Steps:
1. Use get_incident_stats to get overall incident statistics
2. Use get_incident_trending to see incident trends over time
3. Use get_mttr_report to get response time metrics
4. Use get_incident_control_gaps to identify systemic control issues
5. Use list_incidents to get details of relevant incidents
6. Present a structured report:
   - Executive summary
   - Key metrics (total incidents, open/closed, by severity)
   - Trend analysis (increasing/decreasing, new patterns)
   - Mean Time To Respond/Resolve by severity
   - CIA breach analysis
   - Control gaps and recommended improvements
   - Regulatory reporting status
   - Recommended actions`,
        },
      }],
    }),
  );
}
