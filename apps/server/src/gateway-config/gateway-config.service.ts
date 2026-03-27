import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { encryptCredential, decryptCredential, maskCredential } from '../shared/utils/crypto.util';
import { isUrlSafe } from '../shared/utils/url-validation.util';

export interface GatewayConfigResponse {
  anthropicApiKey: string | null;
  anthropicApiKeySet: boolean;
  agentModel: string;
  gatewayUrl: string;
  maxAgentTurns: number;
  updatedAt: string;
}

@Injectable()
export class GatewayConfigService {
  constructor(private prisma: PrismaService) {}

  private getDefaultGatewayUrl(): string {
    return process.env['GATEWAY_URL'] || 'http://localhost:3100';
  }

  async getConfig(organisationId: string): Promise<GatewayConfigResponse> {
    const config = await this.prisma.gatewayConfig.findUnique({
      where: { organisationId },
    });

    if (!config) {
      return {
        anthropicApiKey: null,
        anthropicApiKeySet: false,
        agentModel: 'claude-haiku-4-5-20251001',
        gatewayUrl: this.getDefaultGatewayUrl(),
        maxAgentTurns: 25,
        updatedAt: new Date().toISOString(),
      };
    }

    const decryptedKey = config.anthropicApiKey
      ? decryptCredential(config.anthropicApiKey)
      : null;

    return {
      anthropicApiKey: maskCredential(decryptedKey),
      anthropicApiKeySet: !!config.anthropicApiKey,
      agentModel: config.agentModel,
      gatewayUrl: config.gatewayUrl,
      maxAgentTurns: config.maxAgentTurns,
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  async getUsage(organisationId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    // Get conversation IDs for this org
    const conversations = await this.prisma.chatConversation.findMany({
      where: { organisationId },
      select: { id: true },
    });
    const conversationIds = conversations.map((c) => c.id);

    if (conversationIds.length === 0) {
      return {
        period: { start: startOfMonth.toISOString(), end: endOfMonth.toISOString() },
        totals: { messageCount: 0, inputTokens: 0, outputTokens: 0 },
        byModel: [],
      };
    }

    // Aggregate token usage by model
    const messages = await this.prisma.chatMessage.groupBy({
      by: ['model'],
      where: {
        role: 'ASSISTANT',
        conversationId: { in: conversationIds },
        createdAt: { gte: startOfMonth, lt: endOfMonth },
      },
      _count: true,
      _sum: { inputTokens: true, outputTokens: true },
    });

    const byModel = messages.map((m) => ({
      model: m.model || 'unknown',
      messageCount: m._count,
      inputTokens: m._sum.inputTokens || 0,
      outputTokens: m._sum.outputTokens || 0,
    }));

    const totals = {
      messageCount: byModel.reduce((sum, m) => sum + m.messageCount, 0),
      inputTokens: byModel.reduce((sum, m) => sum + m.inputTokens, 0),
      outputTokens: byModel.reduce((sum, m) => sum + m.outputTokens, 0),
    };

    return {
      period: { start: startOfMonth.toISOString(), end: endOfMonth.toISOString() },
      totals,
      byModel,
    };
  }

  async upsertConfig(
    organisationId: string,
    dto: {
      anthropicApiKey?: string | null;
      agentModel?: string;
      gatewayUrl?: string;
      maxAgentTurns?: number;
    },
    userId?: string,
  ): Promise<GatewayConfigResponse> {
    // Determine API key update
    let encryptedKey: string | null | undefined = undefined;
    if (dto.anthropicApiKey !== undefined) {
      if (dto.anthropicApiKey === null || dto.anthropicApiKey === '') {
        encryptedKey = null;
      } else if (!dto.anthropicApiKey.includes('...')) {
        encryptedKey = encryptCredential(dto.anthropicApiKey);
      }
      // If it contains "...", it's the masked value — skip updating
    }

    const updateData: Record<string, unknown> = {
      updatedById: userId ?? null,
    };
    if (dto.agentModel !== undefined) updateData['agentModel'] = dto.agentModel;
    if (dto.gatewayUrl !== undefined) {
      const urlCheck = isUrlSafe(dto.gatewayUrl);
      if (!urlCheck.safe) {
        throw new BadRequestException(`Invalid gatewayUrl: ${urlCheck.reason}`);
      }
      updateData['gatewayUrl'] = dto.gatewayUrl;
    }
    if (dto.maxAgentTurns !== undefined) updateData['maxAgentTurns'] = dto.maxAgentTurns;
    if (encryptedKey !== undefined) updateData['anthropicApiKey'] = encryptedKey;

    const config = await this.prisma.gatewayConfig.upsert({
      where: { organisationId },
      create: {
        organisationId,
        agentModel: dto.agentModel ?? 'claude-haiku-4-5-20251001',
        gatewayUrl: dto.gatewayUrl ?? this.getDefaultGatewayUrl(),
        maxAgentTurns: dto.maxAgentTurns ?? 25,
        anthropicApiKey: encryptedKey ?? null,
        updatedById: userId ?? null,
      },
      update: updateData,
    });

    const decryptedKey = config.anthropicApiKey
      ? decryptCredential(config.anthropicApiKey)
      : null;

    return {
      anthropicApiKey: maskCredential(decryptedKey),
      anthropicApiKeySet: !!config.anthropicApiKey,
      agentModel: config.agentModel,
      gatewayUrl: config.gatewayUrl,
      maxAgentTurns: config.maxAgentTurns,
      updatedAt: config.updatedAt.toISOString(),
    };
  }
}
