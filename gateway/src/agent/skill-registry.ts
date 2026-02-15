import { readFileSync, watchFile, unwatchFile } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { join } from 'node:path';
import { type ChildProcess, spawn } from 'node:child_process';
import { logger } from '../logger.js';

export interface SkillDefinition {
  name: string;
  description: string;
  tags: string[];
  capabilities: string[];
  command: string;
  args: string[];
  requiresDb: boolean;
}

interface ActiveSkill {
  definition: SkillDefinition;
  process: ChildProcess | null;
  lastUsed: number;
}

export class SkillRegistry {
  private definitions = new Map<string, SkillDefinition>();
  private active = new Map<string, ActiveSkill>();
  private reapInterval: ReturnType<typeof setInterval> | null = null;

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

  startWatching(configPath: string, idleTimeoutMs: number): void {
    watchFile(configPath, { interval: 5000 }, () => {
      logger.info('Skill config changed, reloading...');
      try {
        this.loadFromFile(configPath);
        logger.info({ count: this.definitions.size }, 'Skills reloaded');
      } catch (err) {
        logger.error({ err }, 'Failed to reload skills');
      }
    });
    this.reapInterval = setInterval(() => {
      this.reapIdle(idleTimeoutMs);
    }, 60_000);
  }

  stopWatching(configPath: string): void {
    unwatchFile(configPath);
    if (this.reapInterval) {
      clearInterval(this.reapInterval);
      this.reapInterval = null;
    }
  }

  private reapIdle(maxIdleMs: number): void {
    const now = Date.now();
    for (const [name, active] of this.active) {
      if (active.process && now - active.lastUsed > maxIdleMs) {
        logger.info({ skill: name }, 'Reaping idle skill');
        active.process.kill();
        active.process = null;
        this.active.delete(name);
      }
    }
  }
}
