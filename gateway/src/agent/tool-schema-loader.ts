import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from '../logger.js';
import type { SkillRegistry } from './skill-registry.js';

export interface FullToolSchema {
  name: string;          // e.g. 'list_risks'
  fullName: string;      // e.g. 'mcp__riskready-risks__list_risks'
  description: string;
  inputSchema: Record<string, unknown>;
  serverName: string;
}

export async function loadToolSchemas(
  registry: SkillRegistry,
  databaseUrl: string,
  basePath: string,
): Promise<FullToolSchema[]> {
  const allSchemas: FullToolSchema[] = [];
  const allSkills = registry.listAll();

  for (const skill of allSkills) {
    const serverConfigs = registry.getMcpServers([skill.name], databaseUrl, basePath);
    const config = serverConfigs[skill.name];
    if (!config) continue;

    try {
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: { ...process.env, ...config.env } as Record<string, string>,
      });

      const client = new Client({ name: 'schema-loader', version: '1.0.0' });
      await client.connect(transport);

      const { tools } = await client.listTools();

      for (const tool of tools) {
        allSchemas.push({
          name: tool.name,
          fullName: `mcp__${skill.name}__${tool.name}`,
          description: tool.description ?? '',
          inputSchema: (tool.inputSchema as Record<string, unknown>) ?? { type: 'object', properties: {} },
          serverName: skill.name,
        });
      }

      await client.close();
      logger.debug({ server: skill.name, tools: tools.length }, 'Loaded tool schemas');
    } catch (err) {
      logger.error({ err, server: skill.name }, 'Failed to load tool schemas');
    }
  }

  logger.info({ totalTools: allSchemas.length }, 'Tool schemas loaded');
  return allSchemas;
}
