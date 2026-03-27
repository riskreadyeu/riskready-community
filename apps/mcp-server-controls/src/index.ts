import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerControlTools } from './tools/control-tools.js';
import { registerAssessmentTools } from './tools/assessment-tools.js';
import { registerTestTools } from './tools/test-tools.js';
import { registerMetricTools } from './tools/metric-tools.js';
import { registerSOATools } from './tools/soa-tools.js';
import { registerAnalysisTools } from './tools/analysis-tools.js';
import { registerMutationTools } from './tools/mutation-tools.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';

const server = new McpServer(
  {
    name: 'riskready-controls',
    version: '0.1.0',
  },
  {
    instructions: `You are querying a live controls-management database via MCP tools. Follow these rules strictly:

1. NEVER FABRICATE DATA. If a tool returns empty results, zero counts, or "not found", report that outcome exactly. Do not invent control names, IDs, statistics, dates, or any other values.
2. CITE TOOL RESULTS. When presenting data, always reference which tool returned it (e.g. "list_controls returned 0 results").
3. DISTINGUISH ABSENCE FROM ERROR. "No records found" (tool succeeded, result set is empty) is different from "tool call failed" (an error occurred). Communicate the difference clearly.
4. NO INVENTED IDENTIFIERS. UUIDs, control IDs (e.g. A.5.1), assessment refs, metric IDs, and all other identifiers must come from a tool response — never construct or guess them.
5. WHEN UNCERTAIN, QUERY AGAIN. Use search_controls or list_controls with different filters before concluding that data does not exist. A single query may not cover all possibilities.
6. ZERO IS A VALID ANSWER. If counts are 0, implementation rates are 0%, or result sets are empty, present those numbers truthfully — they represent the genuine state of the system.`,
    capabilities: {
      logging: {},
    },
  },
);

// Register all tools
registerControlTools(server);
registerAssessmentTools(server);
registerTestTools(server);
registerMetricTools(server);
registerSOATools(server);
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
