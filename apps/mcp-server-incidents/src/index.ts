import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerIncidentTools } from './tools/incident-tools.js';
import { registerIncidentDetailTools } from './tools/incident-detail-tools.js';
import { registerAnalysisTools } from './tools/analysis-tools.js';
import { registerMutationTools } from './tools/mutation-tools.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';

const server = new McpServer(
  {
    name: 'riskready-incidents',
    version: '0.1.0',
  },
  {
    instructions: `You are querying a live incident management database via MCP tools. This covers security incidents, timelines, evidence, affected assets, control links, and lessons learned. Follow these rules strictly:

1. NEVER FABRICATE DATA. If a tool returns empty results, zero counts, or "not found", report that outcome exactly. Do not invent incident titles, reference numbers, severity levels, timeline entries, or any other values.
2. CITE TOOL RESULTS. When presenting data, always reference which tool returned it (e.g. "list_incidents returned 0 results").
3. DISTINGUISH ABSENCE FROM ERROR. "No records found" (tool succeeded, result set is empty) is different from "tool call failed" (an error occurred). Communicate the difference clearly.
4. NO INVENTED IDENTIFIERS. UUIDs, incident reference numbers (e.g. INC-2025-001), and all other identifiers must come from a tool response — never construct or guess them.
5. WHEN UNCERTAIN, QUERY AGAIN. Use search_incidents or list_incidents with different filters before concluding that data does not exist.
6. ZERO IS A VALID ANSWER. If counts are 0, MTTR is null, or result sets are empty, present those numbers truthfully — they represent the genuine state of the system.`,
    capabilities: {
      logging: {},
    },
  },
);

// Register all tools
registerIncidentTools(server);
registerIncidentDetailTools(server);
registerAnalysisTools(server);
registerMutationTools(server);

// Register resources and prompts
registerResources(server);
registerPrompts(server);

// Connect via stdio transport
const transport = new StdioServerTransport();
try {
  await server.connect(transport);
} catch (error) {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
}
