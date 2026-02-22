// gateway/src/db-config.ts
// Loads GatewayConfig from the database, falling back to env vars.
// Duplicates the server's AES-256-GCM decryption since the gateway
// is a standalone Fastify app with its own build.

import { prisma } from './prisma.js';
import { logger } from './logger.js';
import { createDecipheriv, scryptSync } from 'node:crypto';

const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function decryptCredential(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!key) throw new Error('ENCRYPTION_KEY or JWT_SECRET required');

  const combined = Buffer.from(encryptedData, 'base64');

  // New format: salt (32) + IV (16) + authTag (16) + data
  if (combined.length >= SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    try {
      const salt = combined.subarray(0, SALT_LENGTH);
      const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
      const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
      const derivedKey = scryptSync(key, salt, 32);
      const decipher = createDecipheriv('aes-256-gcm', derivedKey, iv);
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    } catch {
      // Fall through to legacy format
    }
  }

  // Legacy format: IV (16) + authTag (16) + data with hardcoded salt
  try {
    const derivedKey = scryptSync(key, 'riskready-credential-salt', 32);
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    throw new Error('Failed to decrypt credential');
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
