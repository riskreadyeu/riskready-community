// gateway/src/config.ts

export interface GatewayConfig {
  port: number;
  databaseUrl: string;
  anthropicApiKey?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  queue: {
    maxDepthPerUser: number;
    jobTimeoutMs: number;
  };
  skills: {
    configPath: string;
    idleTimeoutMs: number;
  };
  slack?: {
    botToken: string;
    appToken: string;
    signingSecret: string;
  };
  discord?: {
    botToken: string;
  };
  gatewaySecret?: string;
}

export function loadConfig(): GatewayConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');

  return {
    port: Number(process.env.GATEWAY_PORT ?? 3100),
    databaseUrl,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    logLevel: (process.env.LOG_LEVEL as GatewayConfig['logLevel']) ?? 'info',
    queue: {
      maxDepthPerUser: Number(process.env.QUEUE_MAX_DEPTH ?? 5),
      jobTimeoutMs: Number(process.env.QUEUE_TIMEOUT_MS ?? 300_000),
    },
    skills: {
      configPath: process.env.SKILLS_CONFIG ?? './skills.yaml',
      idleTimeoutMs: Number(process.env.SKILL_IDLE_MS ?? 600_000),
    },
    slack: (process.env.SLACK_BOT_TOKEN && process.env.SLACK_APP_TOKEN && process.env.SLACK_SIGNING_SECRET)
      ? {
          botToken: process.env.SLACK_BOT_TOKEN,
          appToken: process.env.SLACK_APP_TOKEN,
          signingSecret: process.env.SLACK_SIGNING_SECRET,
        }
      : undefined,
    discord: process.env.DISCORD_BOT_TOKEN ? {
      botToken: process.env.DISCORD_BOT_TOKEN,
    } : undefined,
    gatewaySecret: process.env.GATEWAY_SECRET,
  };
}
