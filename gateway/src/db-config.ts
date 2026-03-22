// gateway/src/db-config.ts
// Loads GatewayConfig from the database, falling back to env vars.
// Duplicates the server's AES-256-GCM decryption since the gateway
// is a standalone Fastify app with its own build.

import { prisma } from './prisma.js';
import { logger } from './logger.js';
import { createDecipheriv, createCipheriv, scryptSync, randomBytes } from 'node:crypto';

const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function encryptCredential(plaintext: string): string {
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!key) throw new Error('ENCRYPTION_KEY or JWT_SECRET required');
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const derivedKey = scryptSync(key, salt, 32);
  const cipher = createCipheriv('aes-256-gcm', derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, authTag, encrypted]).toString('base64');
}

function decryptCredential(encryptedData: string): { plaintext: string; isLegacy: boolean } {
  if (!encryptedData) return { plaintext: encryptedData, isLegacy: false };
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
      const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
      return { plaintext, isLegacy: false };
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
    const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    return { plaintext, isLegacy: true };
  } catch {
    throw new Error('Failed to decrypt credential');
  }
}

export interface DbGatewayConfig {
  anthropicApiKey?: string;
  agentModel: string;
  maxAgentTurns: number;
}

export async function loadDbConfig(organisationId: string): Promise<DbGatewayConfig | null> {
  try {
    const row = await (prisma as any).gatewayConfig.findUnique({
      where: { organisationId },
    });
    if (!row) return null;

    let anthropicApiKey: string | undefined;
    if (row.anthropicApiKey) {
      const { plaintext, isLegacy } = decryptCredential(row.anthropicApiKey);
      anthropicApiKey = plaintext;
      if (isLegacy) {
        logger.info({ organisationId }, 'Migrating legacy encryption format to new format with random salt');
        try {
          const reEncrypted = encryptCredential(plaintext);
          await (prisma as any).gatewayConfig.update({
            where: { organisationId },
            data: { anthropicApiKey: reEncrypted },
          });
        } catch (migrateErr) {
          // TODO: retry migration on next load — non-fatal, old format still works
          logger.warn({ err: migrateErr, organisationId }, 'Failed to migrate legacy credential encryption — will retry on next load');
        }
      }
    }

    return {
      anthropicApiKey,
      agentModel: row.agentModel,
      maxAgentTurns: row.maxAgentTurns,
    };
  } catch (err) {
    logger.warn({ err }, 'Failed to load GatewayConfig from DB, using env vars');
    return null;
  }
}
