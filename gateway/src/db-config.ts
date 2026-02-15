// gateway/src/db-config.ts
// Loads GatewayConfig from the database, falling back to env vars.
// Duplicates the server's AES-256-GCM decryption since the gateway
// is a standalone Fastify app with its own build.

import { prisma } from './prisma.js';
import { logger } from './logger.js';
import { createDecipheriv, scryptSync } from 'node:crypto';

const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function decryptCredential(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  try {
    const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!key) return encryptedData;
    const derivedKey = scryptSync(key, 'riskready-credential-salt', 32);
    const combined = Buffer.from(encryptedData, 'base64');
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    // If decryption fails, return as-is (may be legacy unencrypted)
    return encryptedData;
  }
}

export interface DbGatewayConfig {
  anthropicApiKey?: string;
  agentModel: string;
  maxAgentTurns: number;
}

/**
 * Load the first available GatewayConfig from any organisation.
 * Community Edition typically has one org, so this finds its config.
 * Returns null if no config row exists (caller falls back to env vars).
 */
export async function loadFirstDbConfig(): Promise<DbGatewayConfig | null> {
  try {
    const row = await (prisma as any).gatewayConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (!row) return null;

    return {
      anthropicApiKey: row.anthropicApiKey
        ? decryptCredential(row.anthropicApiKey)
        : undefined,
      agentModel: row.agentModel,
      maxAgentTurns: row.maxAgentTurns,
    };
  } catch (err) {
    logger.warn({ err }, 'Failed to load GatewayConfig from DB, using env vars');
    return null;
  }
}
