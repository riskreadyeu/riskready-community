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
  gatewaySecret?: string;
  maxTokenBudget: number;
  council: {
    enabled: boolean;
    classifierMode: 'heuristic' | 'llm';
    maxMembersPerSession: number;
    maxTurnsPerMember: number;
    defaultPattern: DeliberationPattern;
    memberModel?: string;
    maxTokenBudgetPerMember: number;
    domainThreshold: number;
  };
  rateLimit: {
    perUserHour: number;
    perOrgHour: number;
    maxConcurrent: number;
  };
}

export function loadConfig(): GatewayConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  const gatewaySecret = process.env.GATEWAY_SECRET;
  if (!gatewaySecret) {
    console.error('[gateway] GATEWAY_SECRET is not set. This variable is required and must be a unique, random secret (min 32 chars). Do NOT reuse JWT_SECRET.');
    throw new Error('GATEWAY_SECRET environment variable is required');
  }
  if (process.env.JWT_SECRET && gatewaySecret === process.env.JWT_SECRET) {
    console.warn('[gateway] WARNING: GATEWAY_SECRET is identical to JWT_SECRET. For security, use a separate secret for the gateway.');
  }

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
    gatewaySecret,
    maxTokenBudget: Number(process.env.MAX_TOKEN_BUDGET ?? 500_000),
    council: {
      enabled: process.env.COUNCIL_ENABLED !== 'false',
      classifierMode: (process.env.COUNCIL_CLASSIFIER_MODE as 'heuristic' | 'llm') ?? 'heuristic',
      maxMembersPerSession: Number(process.env.COUNCIL_MAX_MEMBERS ?? 6),
      maxTurnsPerMember: Number(process.env.COUNCIL_MAX_TURNS_PER_MEMBER ?? 15),
      defaultPattern: (process.env.COUNCIL_DEFAULT_PATTERN as DeliberationPattern) ?? 'parallel_then_synthesis',
      memberModel: process.env.COUNCIL_MEMBER_MODEL || undefined,
      maxTokenBudgetPerMember: parseInt(process.env.COUNCIL_MAX_TOKENS_PER_MEMBER || '80000', 10),
      domainThreshold: parseInt(process.env.COUNCIL_DOMAIN_THRESHOLD || '3', 10),
    },
    rateLimit: {
      perUserHour: Number(process.env.RATE_LIMIT_PER_USER_HOUR ?? 30),
      perOrgHour: Number(process.env.RATE_LIMIT_PER_ORG_HOUR ?? 100),
      maxConcurrent: Number(process.env.RATE_LIMIT_CONCURRENT ?? 20),
    },
  };
}
