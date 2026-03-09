import { readFileSync, watchFile, unwatchFile } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { join } from 'node:path';
import { logger } from '../logger.js';

export interface ToolMetadata {
  name: string;
  description: string;
  args: string[];
}

export interface SkillDefinition {
  name: string;
  description: string;
  tags: string[];
  capabilities: string[];
  command: string;
  args: string[];
  requiresDb: boolean;
  tools?: ToolMetadata[];
}

export interface ServerToolSet {
  serverName: string;
  tools: ToolMetadata[];
}

export class SkillRegistry {
  private definitions = new Map<string, SkillDefinition>();

  loadFromFile(path: string): void {
    const content = readFileSync(path, 'utf-8');
    this.loadFromString(content);
  }

  loadFromString(yamlContent: string): void {
    const parsed = parseYaml(yamlContent) as { skills: SkillDefinition[] };
    this.definitions.clear();
    for (const skill of parsed.skills) {
      this.definitions.set(skill.name, skill);
    }
  }

  listAll(): SkillDefinition[] {
    return Array.from(this.definitions.values());
  }

  get(name: string): SkillDefinition | undefined {
    return this.definitions.get(name);
  }

  findByTags(tags: string[]): SkillDefinition[] {
    const tagSet = new Set(tags.map((t) => t.toLowerCase()));
    return this.listAll().filter((skill) =>
      skill.tags.some((t) => tagSet.has(t.toLowerCase())),
    );
  }

  findByCapability(capability: string): SkillDefinition[] {
    return this.listAll().filter((skill) =>
      skill.capabilities.includes(capability),
    );
  }

  getMcpServers(
    skillNames: string[],
    databaseUrl: string,
    basePath: string,
  ): Record<string, { command: string; args: string[]; env?: Record<string, string> }> {
    const servers: Record<string, { command: string; args: string[]; env?: Record<string, string> }> = {};
    for (const name of skillNames) {
      const skill = this.definitions.get(name);
      if (!skill) continue;
      const resolvedArgs = skill.args.map((arg) =>
        arg.startsWith('../') ? join(basePath, arg) : arg,
      );
      servers[name] = {
        command: skill.command,
        args: resolvedArgs,
        ...(skill.requiresDb ? { env: { DATABASE_URL: databaseUrl } } : {}),
      };
    }
    return servers;
  }

  getToolSets(): ServerToolSet[] {
    return Array.from(this.definitions.values()).map((skill) => ({
      serverName: skill.name,
      tools: skill.tools ?? [],
    }));
  }

  startWatching(configPath: string): void {
    watchFile(configPath, { interval: 5000 }, () => {
      logger.info('Skill config changed, reloading...');
      try {
        this.loadFromFile(configPath);
        logger.info({ count: this.definitions.size }, 'Skills reloaded');
      } catch (err) {
        logger.error({ err }, 'Failed to reload skills');
      }
    });
  }

  stopWatching(configPath: string): void {
    unwatchFile(configPath);
  }
}
