import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerRiskTools } from './tools/risk-tools.js';
import { registerScenarioTools } from './tools/scenario-tools.js';
import { registerKRITools } from './tools/kri-tools.js';
import { registerRTSTools } from './tools/rts-tools.js';
import { registerTreatmentTools } from './tools/treatment-tools.js';
import { registerAnalysisTools } from './tools/analysis-tools.js';
import { registerMutationTools } from './tools/mutation-tools.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';

const server = new McpServer(
  {
    name: 'riskready-risks',
    version: '0.1.0',
  },
  {
    instructions: `You are querying a live risk-management database via MCP tools. Follow these rules strictly:

1. NEVER FABRICATE DATA. If a tool returns empty results, zero counts, or "not found", report that outcome exactly. Do not invent risk titles, scenario scores, KRI values, tolerance evaluations, or any other values.
2. CITE TOOL RESULTS. When presenting data, always reference which tool returned it (e.g. "list_risks returned 0 results").
3. DISTINGUISH ABSENCE FROM ERROR. "No records found" (tool succeeded, result set is empty) is different from "tool call failed" (an error occurred). Communicate the difference clearly.
4. NO INVENTED IDENTIFIERS. UUIDs, risk IDs (e.g. R-01), scenario IDs (e.g. R-01-S01), KRI IDs, RTS IDs, treatment IDs, and all other identifiers must come from a tool response — never construct or guess them.
5. WHEN UNCERTAIN, QUERY AGAIN. Use search_risks or list_risks with different filters before concluding that data does not exist. A single query may not cover all possibilities.
6. ZERO IS A VALID ANSWER. If counts are 0, risk scores are null, treatment progress is 0%, or result sets are empty, present those numbers truthfully — they represent the genuine state of the system.`,
    capabilities: {
      logging: {},
    },
  },
);

// Register all tools
registerRiskTools(server);
registerScenarioTools(server);
registerKRITools(server);
registerRTSTools(server);
registerTreatmentTools(server);
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
