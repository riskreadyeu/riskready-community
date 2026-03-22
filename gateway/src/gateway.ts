// gateway/src/gateway.ts

import type { GatewayConfig } from './config.js';
import { logger } from './logger.js';
import { LaneQueue } from './queue/lane-queue.js';
import { InternalAdapter } from './channels/internal.adapter.js';
import type { ChannelAdapter } from './channels/channel.interface.js';
import type { UnifiedMessage, ChatEvent } from './channels/types.js';
import type { Job, JobResult } from './queue/types.js';
import { incrementConcurrent, decrementConcurrent } from './middleware/rate-limit.js';
import { AgentRunner } from './agent/agent-runner.js';
import { SkillRegistry } from './agent/skill-registry.js';
import { Router } from './router/router.js';
import { ToolCatalog } from './catalog/tool-catalog.js';
import { loadToolSchemas } from './agent/tool-schema-loader.js';
import type { FullToolSchema } from './agent/tool-schema-loader.js';

import { MemoryService } from './memory/memory.service.js';
import { SearchService } from './memory/search.service.js';
import { MemoryDistiller } from './memory/distiller.js';
import { prisma, disconnectPrisma } from './prisma.js';
import { join } from 'node:path';
import { registerMcpTransport } from './channels/mcp-http-transport.js';
import { RunManager } from './run/run-manager.js';
import Anthropic from '@anthropic-ai/sdk';
import { loadDbConfig } from './db-config.js';
import { SchedulerService } from './scheduler/scheduler.service.js';
import { CouncilOrchestrator } from './council/council-orchestrator.js';

export class Gateway {
  private config: GatewayConfig;
  private queue: LaneQueue;
  private adapters: ChannelAdapter[] = [];
  private internalAdapter: InternalAdapter;
  private runManager = new RunManager();
  private agentRunner: AgentRunner;
  private skillRegistry: SkillRegistry;
  private readonly hotReloadSkills: boolean;
  private router: Router;
  private toolCatalog: ToolCatalog;
  private scheduler: SchedulerService;
  private toolSchemas: FullToolSchema[] = [];
  private councilOrchestrator: CouncilOrchestrator | null = null;
  private readonly projectRoot: string;

  constructor(config: GatewayConfig) {
    this.config = config;
    this.hotReloadSkills = process.env.SKILLS_HOT_RELOAD === 'true';
    this.queue = new LaneQueue({
      maxDepthPerUser: config.queue.maxDepthPerUser,
      jobTimeoutMs: config.queue.jobTimeoutMs,
    });
    this.internalAdapter = new InternalAdapter({ port: config.port, secret: config.gatewaySecret, rateLimit: config.rateLimit });
    this.adapters.push(this.internalAdapter);

    // Load skill registry
    this.skillRegistry = new SkillRegistry();
    this.skillRegistry.loadFromFile(config.skills.configPath);
    logger.info({ count: this.skillRegistry.listAll().length, path: config.skills.configPath }, 'Skills loaded');

    // Create router (fallback) and tool catalog (primary)
    this.router = new Router(this.skillRegistry);
    this.toolCatalog = new ToolCatalog(this.skillRegistry.getToolSets());
    logger.info({ tools: this.toolCatalog.getAllEntries().length }, 'Tool catalog initialized');

    // Wire memory services
    const memoryService = new MemoryService(prisma);
    const searchService = new SearchService(prisma);
    const distiller = new MemoryDistiller(memoryService, async (prompt: string, organisationId: string) => {
      const dbConfig = await loadDbConfig(organisationId);
      const apiKey = dbConfig?.anthropicApiKey ?? config.anthropicApiKey;
      if (!apiKey) {
        return '[]';
      }

      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model: dbConfig?.agentModel || 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });
      return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
    });

    this.projectRoot = join(process.cwd(), '..');
    this.agentRunner = new AgentRunner({
      databaseUrl: config.databaseUrl,
      getMcpServers: (messageText?: string) => {
        if (messageText) {
          // Use BM25 catalog search for server selection
          const results = this.toolCatalog.search(messageText, 15);
          const serverNames = this.toolCatalog.getServersForTools(results);
          logger.debug({ query: messageText.substring(0, 80), servers: serverNames, matches: results.length }, 'Catalog routing');
          return this.skillRegistry.getMcpServers(serverNames, config.databaseUrl, join(this.projectRoot, 'apps'));
        }
        // Fallback: all servers
        const allSkillNames = this.skillRegistry.listAll().map(s => s.name);
        return this.skillRegistry.getMcpServers(allSkillNames, config.databaseUrl, join(this.projectRoot, 'apps'));
      },
      memoryService,
      searchService,
      distiller,
      getDbConfig: loadDbConfig,
      toolSchemas: this.toolSchemas,
      skillRegistry: this.skillRegistry,
      basePath: join(this.projectRoot, 'apps'),
      maxTokenBudget: config.maxTokenBudget,
    });

    // Council orchestrator for multi-agent deliberation
    if (config.council.enabled) {
      const councilOrchestrator = new CouncilOrchestrator({
        router: this.router,
        config: config.council,
        toolSchemas: this.toolSchemas,
        skillRegistry: this.skillRegistry,
        databaseUrl: config.databaseUrl,
        basePath: join(this.projectRoot, 'apps'),
      });
      this.councilOrchestrator = councilOrchestrator;
      this.agentRunner.setCouncilHook({
        shouldConvene: (message: string) => councilOrchestrator.shouldConvene(message),
        deliberate: (question, organisationId, conversationId, signal, emit, mcpServers, getDbConfig) =>
          councilOrchestrator.deliberate(question, organisationId, conversationId, signal, emit, mcpServers, getDbConfig),
      });
    }

    // Scheduler for autonomous runs — routed through LaneQueue
    this.scheduler = new SchedulerService(this.agentRunner, this.queue);

  }

  async start(): Promise<void> {
    // Load tool schemas from all MCP servers
    this.toolSchemas = await loadToolSchemas(
      this.skillRegistry,
      this.config.databaseUrl,
      join(this.projectRoot, 'apps'),
    );
    // Update the AgentRunner and Council with the loaded schemas
    this.agentRunner.updateToolSchemas(this.toolSchemas);
    if (this.councilOrchestrator) {
      this.councilOrchestrator.updateToolSchemas(this.toolSchemas);
    }
    logger.info({ tools: this.toolSchemas.length }, 'Tool schemas loaded');

    // Register MCP HTTP transport for remote MCP clients (e.g. Claude Desktop)
    registerMcpTransport(this.internalAdapter.getServer(), {
      toolSchemas: this.toolSchemas,
      getServerConfig: (serverName) => {
        const configs = this.skillRegistry.getMcpServers([serverName], this.config.databaseUrl, join(this.projectRoot, 'apps'));
        return configs[serverName];
      },
      validateApiKey: async (key) => {
        const gatewaySecret = this.config.gatewaySecret;
        const serverUrl = process.env.GATEWAY_URL?.replace(/:\d+/, ':3000') || 'http://localhost:3000';
        const res = await fetch(`${serverUrl}/api/gateway-config/mcp-keys/validate`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-gateway-secret': gatewaySecret || '' },
          body: JSON.stringify({ key }),
        });
        if (!res.ok) return { valid: false };
        return res.json();
      },
      databaseUrl: this.config.databaseUrl,
    });

    // Start skill watching for hot-reload
    if (this.hotReloadSkills) {
      this.skillRegistry.startWatching(this.config.skills.configPath);
      logger.info({ path: this.config.skills.configPath }, 'Skills hot-reload enabled');
    }

    // Wire up message handler for all adapters
    for (const adapter of this.adapters) {
      adapter.onMessage((msg) => this.dispatch(msg));
    }

    // Wire SSE handler
    this.internalAdapter.setSseHandler((runId, callback) => {
      return this.subscribe(runId, callback);
    });

    // Wire cancel handler
    this.internalAdapter.setCancelHandler((runId) => {
      this.runManager.cancel(runId);
    });

    // Start all adapters
    for (const adapter of this.adapters) {
      await adapter.start();
      logger.info({ adapter: adapter.name }, 'Channel adapter started');
    }

    // Start scheduler for autonomous runs
    this.scheduler.start();

    logger.info({ port: this.config.port }, 'Listening');
  }

  async stop(): Promise<void> {
    this.scheduler.stop();
    if (this.hotReloadSkills) {
      this.skillRegistry.stopWatching(this.config.skills.configPath);
    }

    // Stop accepting new connections
    for (const adapter of this.adapters) {
      await adapter.stop();
    }

    // Wait for active jobs to complete (up to 30s)
    await this.queue.drain(30_000);

    this.runManager.clear();
    await disconnectPrisma();
    logger.info('Gateway stopped');
  }

  addAdapter(adapter: ChannelAdapter): void {
    this.adapters.push(adapter);
  }

  subscribe(runId: string, callback: (event: ChatEvent) => void): () => void {
    return this.runManager.subscribe(runId, callback);
  }

  private emit(runId: string, event: ChatEvent): void {
    this.runManager.emit(runId, event);
  }

  private dispatch(msg: UnifiedMessage): void {
    this.runManager.createRun(msg.id);

    const job: Job = {
      id: msg.id,
      userId: msg.userId,
      execute: async (signal) => this.executeJob(msg, signal),
    };

    this.runManager.registerCancel(msg.id, () => {
      this.queue.cancel(msg.userId, msg.id);
    });

    this.queue
      .enqueue(job)
      .then(() => {
        // Job completed normally
      })
      .catch((err) => {
        this.runManager.emit(msg.id, { type: 'error', message: err.message });
      });
  }

  private async executeJob(msg: UnifiedMessage, signal: AbortSignal): Promise<JobResult> {
    incrementConcurrent();
    try {
      const result = await this.agentRunner.execute(msg, signal, (event) => this.emit(msg.id, event));
      return { success: true, data: result };
    } finally {
      decrementConcurrent();
    }
  }
}
