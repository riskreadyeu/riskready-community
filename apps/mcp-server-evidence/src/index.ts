import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerEvidenceTools } from './tools/evidence-tools.js';
import { registerEvidenceRequestTools } from './tools/evidence-request-tools.js';
import { registerAnalysisTools } from './tools/analysis-tools.js';
import { registerMutationTools } from './tools/mutation-tools.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';

const server = new McpServer(
  {
    name: 'riskready-evidence',
    version: '0.1.0',
  },
  {
    instructions: `You are querying a live evidence management database via MCP tools. This covers evidence records, evidence requests, link management (controls, risks, incidents, assets, policies), and expiry tracking. Follow these rules strictly:

1. NEVER FABRICATE DATA. If a tool returns empty results, zero counts, or "not found", report that outcome exactly. Do not invent evidence titles, references, file details, or any other values.
2. CITE TOOL RESULTS. When presenting data, always reference which tool returned it (e.g. "list_evidence returned 0 results").
3. DISTINGUISH ABSENCE FROM ERROR. "No records found" (tool succeeded, result set is empty) is different from "tool call failed" (an error occurred). Communicate the difference clearly.
4. NO INVENTED IDENTIFIERS. UUIDs, evidence references (e.g. EVD-2025-0001), request references (e.g. REQ-2025-0001), and all other identifiers must come from a tool response — never construct or guess them.
5. WHEN UNCERTAIN, QUERY AGAIN. Use search_evidence or list_evidence with different filters before concluding that data does not exist.
6. ZERO IS A VALID ANSWER. If counts are 0, expiring evidence is 0, or result sets are empty, present those numbers truthfully.`,
    capabilities: {
      logging: {},
    },
  },
);

// Register all tools
registerEvidenceTools(server);
registerEvidenceRequestTools(server);
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
