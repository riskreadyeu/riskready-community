import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAssetTools } from './tools/asset-tools.js';
import { registerAssetRelationshipTools } from './tools/asset-relationship-tools.js';
import { registerSoftwareTools } from './tools/software-tools.js';
import { registerCapacityTools } from './tools/capacity-tools.js';
import { registerChangeTools } from './tools/change-tools.js';
import { registerChangeSupportTools } from './tools/change-support-tools.js';
import { registerAnalysisTools } from './tools/analysis-tools.js';
import { registerMutationTools } from './tools/mutation-tools.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';

const server = new McpServer(
  {
    name: 'riskready-itsm',
    version: '0.1.0',
  },
  {
    instructions: `You are querying a live ITSM (IT Service Management) database via MCP tools. This includes CMDB (Configuration Management Database) assets, change management, and capacity management data. Follow these rules strictly:

1. NEVER FABRICATE DATA. If a tool returns empty results, zero counts, or "not found", report that outcome exactly. Do not invent asset names, tags, IP addresses, configurations, change requests, approval decisions, or any other values.
2. CITE TOOL RESULTS. When presenting data, always reference which tool returned it (e.g. "list_assets returned 0 results").
3. DISTINGUISH ABSENCE FROM ERROR. "No records found" (tool succeeded, result set is empty) is different from "tool call failed" (an error occurred). Communicate the difference clearly.
4. NO INVENTED IDENTIFIERS. UUIDs, asset tags (e.g. AST-SRV-001), change refs (e.g. CHG-2026-001), template codes, and all other identifiers must come from a tool response — never construct or guess them.
5. WHEN UNCERTAIN, QUERY AGAIN. Use search_assets or list_assets with different filters before concluding that data does not exist. A single query may not cover all possibilities.
6. ZERO IS A VALID ANSWER. If counts are 0, risk scores are null, utilization is 0%, or result sets are empty, present those numbers truthfully — they represent the genuine state of the system.`,
    capabilities: {
      logging: {},
    },
  },
);

// Register all tools
registerAssetTools(server);
registerAssetRelationshipTools(server);
registerSoftwareTools(server);
registerCapacityTools(server);
registerChangeTools(server);
registerChangeSupportTools(server);
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
