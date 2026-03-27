import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerOrgProfileTools } from './tools/org-profile-tools.js';
import { registerStructureTools } from './tools/structure-tools.js';
import { registerProcessTools } from './tools/process-tools.js';
import { registerGovernanceTools } from './tools/governance-tools.js';
import { registerReferenceTools } from './tools/reference-tools.js';
import { registerAnalysisTools } from './tools/analysis-tools.js';
import { registerMutationTools } from './tools/mutation-tools.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';

const server = new McpServer(
  {
    name: 'riskready-organisation',
    version: '0.1.0',
  },
  {
    instructions: `You are querying a live organisation management database via MCP tools. This covers organisation profiles, departments, locations, business processes, external dependencies, governance committees, meetings, regulators, frameworks, key personnel, context issues, and interested parties. Follow these rules strictly:

1. NEVER FABRICATE DATA. If a tool returns empty results, zero counts, or "not found", report that outcome exactly. Do not invent department names, location codes, committee names, or any other values.
2. CITE TOOL RESULTS. When presenting data, always reference which tool returned it (e.g. "list_departments returned 0 results").
3. DISTINGUISH ABSENCE FROM ERROR. "No records found" (tool succeeded, result set is empty) is different from "tool call failed" (an error occurred). Communicate the difference clearly.
4. NO INVENTED IDENTIFIERS. UUIDs, department codes, process codes, and all other identifiers must come from a tool response — never construct or guess them.
5. WHEN UNCERTAIN, QUERY AGAIN. Use different filters before concluding that data does not exist.
6. ZERO IS A VALID ANSWER. If counts are 0, present those numbers truthfully.`,
    capabilities: {
      logging: {},
    },
  },
);

// Register all tools
registerOrgProfileTools(server);
registerStructureTools(server);
registerProcessTools(server);
registerGovernanceTools(server);
registerReferenceTools(server);
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
