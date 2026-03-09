// gateway/src/config.ts

import type { DeliberationPattern } from './council/council-types.js';

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
  council: {
    enabled: boolean;
    classifierMode: 'heuristic' | 'llm';
    maxMembersPerSession: number;
    maxTurnsPerMember: number;
    defaultPattern: DeliberationPattern;
    memberModel?: string;
  };
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
    council: {
      enabled: process.env.COUNCIL_ENABLED !== 'false',
      classifierMode: (process.env.COUNCIL_CLASSIFIER_MODE as 'heuristic' | 'llm') ?? 'heuristic',
      maxMembersPerSession: Number(process.env.COUNCIL_MAX_MEMBERS ?? 6),
      maxTurnsPerMember: Number(process.env.COUNCIL_MAX_TURNS_PER_MEMBER ?? 15),
      defaultPattern: (process.env.COUNCIL_DEFAULT_PATTERN as DeliberationPattern) ?? 'parallel_then_synthesis',
      memberModel: process.env.COUNCIL_MEMBER_MODEL || undefined,
    },
  };
}
