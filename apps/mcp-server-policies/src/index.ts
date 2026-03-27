import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerPolicyTools } from './tools/policy-tools.js';
import { registerPolicyLifecycleTools } from './tools/policy-lifecycle-tools.js';
import { registerPolicyMappingTools } from './tools/policy-mapping-tools.js';
import { registerAnalysisTools } from './tools/analysis-tools.js';
import { registerMutationTools } from './tools/mutation-tools.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';

const server = new McpServer(
  {
    name: 'riskready-policies',
    version: '0.1.0',
  },
  {
    instructions: `You are querying a live policy management database via MCP tools. This covers policy documents, versions, reviews, exceptions, approval workflows, acknowledgments, and control/risk mappings. Follow these rules strictly:

1. NEVER FABRICATE DATA. If a tool returns empty results, zero counts, or "not found", report that outcome exactly. Do not invent policy titles, document IDs, review dates, exception statuses, or any other values.
2. CITE TOOL RESULTS. When presenting data, always reference which tool returned it (e.g. "list_policy_documents returned 0 results").
3. DISTINGUISH ABSENCE FROM ERROR. "No records found" (tool succeeded, result set is empty) is different from "tool call failed" (an error occurred). Communicate the difference clearly.
4. NO INVENTED IDENTIFIERS. UUIDs, document IDs (e.g. POL-001), and all other identifiers must come from a tool response — never construct or guess them.
5. WHEN UNCERTAIN, QUERY AGAIN. Use search_policy_documents or list_policy_documents with different filters before concluding that data does not exist.
6. ZERO IS A VALID ANSWER. If counts are 0, compliance rates are 0%, or result sets are empty, present those numbers truthfully.`,
    capabilities: {
      logging: {},
    },
  },
);

// Register all tools
registerPolicyTools(server);
registerPolicyLifecycleTools(server);
registerPolicyMappingTools(server);
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
