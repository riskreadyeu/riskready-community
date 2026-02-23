import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { Logger } from '@nestjs/common';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const logger = new Logger('CryptoUtil');

/**
 * Derive encryption key using scrypt with a salt.
 */
function deriveKey(salt: Buffer): Buffer {
    const key = process.env['ENCRYPTION_KEY'] || process.env['JWT_SECRET'];
    if (!key) {
        throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set for credential encryption');
    }
    return scryptSync(key, salt, 32);
}

/**
 * Encrypt sensitive data (e.g., API keys)
 * Returns base64-encoded string containing salt + IV + auth tag + encrypted data
 */
export function encryptCredential(plaintext: string): string {
    if (!plaintext) return plaintext;

    const salt = randomBytes(SALT_LENGTH);
    const key = deriveKey(salt);
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Combine salt + IV + auth tag + encrypted data
    const combined = Buffer.concat([salt, iv, authTag, encrypted]);
    return combined.toString('base64');
}

/**
 * Decrypt sensitive data
 * Supports new format (salt + IV + authTag + data) and legacy format (IV + authTag + data with hardcoded salt)
 */
export function decryptCredential(encryptedData: string): string {
    if (!encryptedData) return encryptedData;

    const combined = Buffer.from(encryptedData, 'base64');

    // New format: salt (32) + IV (16) + authTag (16) + data = minimum 65 bytes
    // Legacy format: IV (16) + authTag (16) + data = minimum 33 bytes
    if (combined.length >= SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1) {
        try {
            const salt = combined.subarray(0, SALT_LENGTH);
            const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
            const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
            const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

            const key = deriveKey(salt);
            const decipher = createDecipheriv(ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);

            const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
            return decrypted.toString('utf8');
        } catch {
            // Fall through to legacy format
        }
    }

    // Legacy format: hardcoded salt
    // Migration: Re-encrypt all values using the new salt format. See docs/crypto-migration.md
    try {
        logger.warn('[DEPRECATION] Legacy encryption salt detected. Please rotate credentials using the new encryption method.');
        const legacyKey = process.env['ENCRYPTION_KEY'] || process.env['JWT_SECRET'];
        if (!legacyKey) throw new Error('No encryption key');
        const key = scryptSync(legacyKey, 'riskready-credential-salt', 32);

        const iv = combined.subarray(0, IV_LENGTH);
        const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    } catch {
        throw new Error('Failed to decrypt credential');
    }
}

/**
 * Check if a string appears to be encrypted (base64 with correct length)
 */
export function isEncrypted(data: string): boolean {
    if (!data) return false;
    try {
        const decoded = Buffer.from(data, 'base64');
        // Minimum length: IV (16) + auth tag (16) + at least 1 byte of data (legacy)
        // New format is longer: salt (32) + IV (16) + auth tag (16) + data
        return decoded.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1;
    } catch {
        return false;
    }
}

/**
 * Mask a credential for display (shows first 4 chars and last 4 chars)
 */
export function maskCredential(credential: string | null | undefined): string | null {
    if (!credential) return null;
    if (credential.length <= 8) return '********';
    return `${credential.substring(0, 4)}...${credential.substring(credential.length - 4)}`;
}
