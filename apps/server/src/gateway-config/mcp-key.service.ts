import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';

const KEY_PREFIX = 'rr_sk_';
const KEY_LENGTH = 40; // hex chars after prefix
const BCRYPT_ROUNDS = 10;

@Injectable()
export class McpKeyService {
  constructor(private prisma: PrismaService) {}

  async createKey(userId: string, organisationId: string, name: string) {
    const rawKey = KEY_PREFIX + randomBytes(KEY_LENGTH / 2).toString('hex');
    const prefix = rawKey.slice(0, 8);
    const keyHash = await bcrypt.hash(rawKey, BCRYPT_ROUNDS);

    const record = await this.prisma.mcpApiKey.create({
      data: { prefix, keyHash, name, userId, organisationId },
      select: { id: true, prefix: true, name: true, createdAt: true },
    });

    // Return full key ONCE — never stored in plain text
    return { ...record, key: rawKey };
  }

  async listKeys(userId: string, organisationId: string) {
    return this.prisma.mcpApiKey.findMany({
      where: { userId, organisationId, revokedAt: null },
      select: {
        id: true,
        prefix: true,
        name: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeKey(id: string, userId: string) {
    return this.prisma.mcpApiKey.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async validateKey(
    rawKey: string,
  ): Promise<{ valid: boolean; userId?: string; organisationId?: string }> {
    if (!rawKey.startsWith(KEY_PREFIX)) return { valid: false };

    const prefix = rawKey.slice(0, 8);
    const candidates = await this.prisma.mcpApiKey.findMany({
      where: { prefix, revokedAt: null },
      select: { id: true, keyHash: true, userId: true, organisationId: true },
    });

    for (const candidate of candidates) {
      const match = await bcrypt.compare(rawKey, candidate.keyHash);
      if (match) {
        // Update lastUsedAt (non-blocking)
        this.prisma.mcpApiKey
          .update({
            where: { id: candidate.id },
            data: { lastUsedAt: new Date() },
          })
          .catch(() => {});

        return {
          valid: true,
          userId: candidate.userId,
          organisationId: candidate.organisationId,
        };
      }
    }

    return { valid: false };
  }
}
