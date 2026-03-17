import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from '../logger.js';

export const TOOL_NAME_PATTERN = /^mcp__[a-z][a-z0-9-]*__[a-z][a-z0-9_]*$/;

const TOOL_TIMEOUT_MS = 30_000;
const IDLE_TIMEOUT_MS = 60_000;

export interface ToolResult {
  content: string;
  isError: boolean;
}

interface ServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface ServerConnection {
  client: Client;
  transport: StdioClientTransport;
  lastUsed: number;
  idleTimer?: ReturnType<typeof setTimeout>;
}

interface McpToolExecutorOptions {
  organisationId: string;
  getServerConfig: (serverName: string) => ServerConfig | undefined;
  _testCallTool?: (serverName: string, toolName: string, input: Record<string, unknown>) => Promise<ToolResult>;
}

export class McpToolExecutor {
  private organisationId: string;
  private getServerConfig: (serverName: string) => ServerConfig | undefined;
  private connections = new Map<string, ServerConnection>();
  private testCallTool?: McpToolExecutorOptions['_testCallTool'];

  constructor(options: McpToolExecutorOptions) {
    this.organisationId = options.organisationId;
    this.getServerConfig = options.getServerConfig;
    this.testCallTool = options._testCallTool;
  }

  static parseToolName(fullName: string): { serverName: string; toolName: string } | null {
    const parts = fullName.split('__');
    if (parts.length !== 3 || parts[0] !== 'mcp') return null;
    return { serverName: parts[1], toolName: parts[2] };
  }

  async execute(fullToolName: string, input: Record<string, unknown>): Promise<ToolResult> {
    if (!TOOL_NAME_PATTERN.test(fullToolName)) {
      return { content: `Invalid tool name: ${fullToolName}`, isError: true };
    }

    const parsed = McpToolExecutor.parseToolName(fullToolName);
    if (!parsed) {
      return { content: `Cannot parse tool name: ${fullToolName}`, isError: true };
    }

    // A01: Force org scoping — always overwrite any model-supplied value
    input.organisationId = this.organisationId;

    if (this.testCallTool) {
      return this.testCallTool(parsed.serverName, parsed.toolName, input);
    }

    const config = this.getServerConfig(parsed.serverName);
    if (!config) {
      return { content: `Server config not found for: ${parsed.serverName}`, isError: true };
    }

    try {
      const connection = await this.getOrSpawnServer(parsed.serverName, config);
      connection.lastUsed = Date.now();
      this.resetIdleTimer(parsed.serverName, connection);

      const result = await Promise.race([
        connection.client.callTool({ name: parsed.toolName, arguments: input }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tool call timed out')), TOOL_TIMEOUT_MS),
        ),
      ]);

      const text =
        (result.content as Array<{ type?: string; text?: string }>)
          ?.filter((c) => c.type === 'text')
          .map((c) => c.text ?? '')
          .join('\n') ?? JSON.stringify(result.content);

      logger.debug({ tool: fullToolName, org: this.organisationId }, 'Tool executed');

      return { content: text, isError: (result.isError as boolean) ?? false };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, tool: fullToolName }, 'Tool execution failed');
      return { content: `Tool execution error: ${message}`, isError: true };
    }
  }

  async shutdown(): Promise<void> {
    for (const [name, conn] of this.connections) {
      if (conn.idleTimer) clearTimeout(conn.idleTimer);
      try {
        await conn.client.close();
      } catch {
        // Best effort
      }
      logger.debug({ server: name }, 'MCP server connection closed');
    }
    this.connections.clear();
  }

  private async getOrSpawnServer(serverName: string, config: ServerConfig): Promise<ServerConnection> {
    const existing = this.connections.get(serverName);
    if (existing) return existing;

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: { ...process.env, ...config.env } as Record<string, string>,
    });

    const client = new Client({ name: `executor-${serverName}`, version: '1.0.0' });
    await client.connect(transport);

    const connection: ServerConnection = { client, transport, lastUsed: Date.now() };
    this.connections.set(serverName, connection);
    logger.debug({ server: serverName }, 'MCP server spawned');
    return connection;
  }

  private resetIdleTimer(serverName: string, connection: ServerConnection): void {
    if (connection.idleTimer) clearTimeout(connection.idleTimer);
    connection.idleTimer = setTimeout(async () => {
      try {
        await connection.client.close();
      } catch {
        // best effort
      }
      this.connections.delete(serverName);
      logger.debug({ server: serverName }, 'MCP server idle-closed');
    }, IDLE_TIMEOUT_MS);
  }
}
