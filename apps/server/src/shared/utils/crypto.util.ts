import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Get encryption key from environment
 * Uses ENCRYPTION_KEY if available, otherwise derives from JWT_SECRET
 */
function getEncryptionKey(): Buffer {
    const key = process.env['ENCRYPTION_KEY'] || process.env['JWT_SECRET'];
    if (!key) {
        throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set for credential encryption');
    }
    // Use scrypt to derive a 32-byte key from the secret
    return scryptSync(key, 'riskready-credential-salt', 32);
}

/**
 * Encrypt sensitive data (e.g., API keys)
 * Returns base64-encoded string containing IV + auth tag + encrypted data
 */
export function encryptCredential(plaintext: string): string {
    if (!plaintext) return plaintext;

    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Combine IV + auth tag + encrypted data
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('base64');
}

/**
 * Decrypt sensitive data
 * Expects base64-encoded string from encryptCredential
 */
export function decryptCredential(encryptedData: string): string {
    if (!encryptedData) return encryptedData;

    try {
        const key = getEncryptionKey();
        const combined = Buffer.from(encryptedData, 'base64');

        // Extract IV, auth tag, and encrypted data
        const iv = combined.subarray(0, IV_LENGTH);
        const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]);

        return decrypted.toString('utf8');
    } catch (error) {
        // If decryption fails, the data might be stored unencrypted (legacy)
        // Return as-is to allow gradual migration
        console.warn('Failed to decrypt credential, returning as-is (may be legacy unencrypted data)');
        return encryptedData;
    }
}

/**
 * Check if a string appears to be encrypted (base64 with correct length)
 */
export function isEncrypted(data: string): boolean {
    if (!data) return false;
    try {
        const decoded = Buffer.from(data, 'base64');
        // Minimum length: IV (16) + auth tag (16) + at least 1 byte of data
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
