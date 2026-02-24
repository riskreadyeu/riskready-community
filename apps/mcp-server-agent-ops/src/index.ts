import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerActionTools } from './tools/action-tools.js';
import { registerTaskTools } from './tools/task-tools.js';

const server = new McpServer(
  {
    name: 'riskready-agent-ops',
    version: '0.1.0',
  },
  {
    instructions: `Agent operations server for self-awareness and task management.

This server provides tools for the AI agent to:
1. Check the status of previously proposed actions (approved, rejected, executed, failed)
2. List pending and recent actions to maintain awareness of proposal outcomes
3. Create and track multi-step tasks across conversation sessions

RULES:
- Use check_action_status after proposing changes to close the feedback loop
- If a proposal was REJECTED, read the reviewNotes and offer a revised proposal
- If a proposal FAILED, read the errorMessage and suggest fixes
- For complex multi-step work, create tasks with create_agent_task to track progress
- Update tasks as you progress: IN_PROGRESS when working, AWAITING_APPROVAL when proposals are pending, COMPLETED when done
- Never fabricate action IDs or task IDs — only use IDs returned by tools`,
    capabilities: {
      logging: {},
    },
  },
);

// Register tools
registerActionTools(server);
registerTaskTools(server);

// Connect via stdio transport
const transport = new StdioServerTransport();
try {
  await server.connect(transport);
} catch (error) {
  console.error('Failed to start agent-ops MCP server:', error);
  process.exit(1);
}
