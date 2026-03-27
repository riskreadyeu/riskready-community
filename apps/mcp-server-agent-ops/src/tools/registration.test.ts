import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerActionTools } from './action-tools.js';
import { registerTaskTools } from './task-tools.js';

describe('agent-ops tool registration', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test-agent-ops', version: '0.1.0' });
  });

  it('registers all action and task tools without throwing', () => {
    const toolSpy = vi.spyOn(server, 'tool');

    expect(() => {
      registerActionTools(server);
      registerTaskTools(server);
    }).not.toThrow();

    const registeredNames = toolSpy.mock.calls.map((call) => call[0]);

    expect(registeredNames).toEqual([
      'check_action_status',
      'list_pending_actions',
      'list_recent_actions',
      'create_agent_task',
      'update_agent_task',
      'get_agent_task',
      'list_agent_tasks',
    ]);
  });
});
