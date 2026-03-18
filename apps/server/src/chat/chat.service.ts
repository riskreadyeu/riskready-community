import { BadGatewayException, BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayConfigService } from '../gateway-config/gateway-config.service';
import type { JwtUser } from '../shared/types';
import { CHAT_MODELS, isChatModel } from './chat-models';
import type { CreateConversationDto, SendMessageDto } from './chat.dto';

@Injectable()
export class ChatService {
  /** Maps runId → userId for stream ownership verification */
  private readonly runOwners = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayConfigService: GatewayConfigService,
  ) {}

  listModels() {
    return {
      results: CHAT_MODELS.map((id) => ({ id, label: id })),
      count: CHAT_MODELS.length,
    };
  }

  async listConversations(user: JwtUser) {
    const organisationId = this.getOrganisationId(user);
    const results = await this.prisma.chatConversation.findMany({
      where: {
        userId: user.id,
        organisationId,
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        model: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { results, count: results.length };
  }

  async createConversation(user: JwtUser, dto: CreateConversationDto) {
    const organisationId = this.getOrganisationId(user);
    const model = this.validateModel(dto.model);

    return this.prisma.chatConversation.create({
      data: {
        userId: user.id,
        organisationId,
        model,
      },
      select: {
        id: true,
        title: true,
        model: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getConversation(user: JwtUser, conversationId: string) {
    return this.findOwnedConversation(user, conversationId);
  }

  async listMessages(user: JwtUser, conversationId: string) {
    await this.findOwnedConversation(user, conversationId);

    const results = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        toolCalls: true,
        actionIds: true,
        blocks: true,
        inputTokens: true,
        outputTokens: true,
        model: true,
        createdAt: true,
      },
    });

    return { results, count: results.length };
  }

  async sendMessage(user: JwtUser, conversationId: string, dto: SendMessageDto) {
    await this.findOwnedConversation(user, conversationId);
    const organisationId = this.getOrganisationId(user);
    const gatewayUrl = await this.getGatewayUrl(organisationId);

    const response = await fetch(`${gatewayUrl}/dispatch`, {
      method: 'POST',
      headers: this.buildGatewayHeaders(user, conversationId),
      body: JSON.stringify({ text: dto.text }),
    });

    if (!response.ok) {
      throw new BadGatewayException(await this.readGatewayError(response));
    }

    const result = await response.json() as { runId: string };

    // Track run ownership so proxyRunStream can verify the caller
    this.runOwners.set(result.runId, user.id);
    setTimeout(() => this.runOwners.delete(result.runId), 10 * 60_000);

    return result;
  }

  async proxyRunStream(user: JwtUser, runId: string, res: ExpressResponse) {
    // Verify the requesting user owns this run
    const ownerId = this.runOwners.get(runId);
    if (!ownerId || ownerId !== user.id) {
      throw new ForbiddenException('Run not found');
    }

    const organisationId = this.getOrganisationId(user);
    const gatewayUrl = await this.getGatewayUrl(organisationId);
    const response = await fetch(`${gatewayUrl}/stream/${runId}`, {
      headers: this.buildGatewayHeaders(user),
    });

    if (!response.ok || !response.body) {
      throw new BadGatewayException(await this.readGatewayError(response));
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();

    // Abort the upstream read when the client disconnects
    const onClose = () => reader.cancel();
    res.on('close', onClose);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    } catch {
      // reader.cancel() from client disconnect causes a read rejection — expected
    } finally {
      res.off('close', onClose);
      reader.releaseLock();
      res.end();
    }
  }

  private async findOwnedConversation(user: JwtUser, conversationId: string) {
    const organisationId = this.getOrganisationId(user);
    const conversation = await this.prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
        organisationId,
      },
      select: {
        id: true,
        title: true,
        model: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        organisationId: true,
      },
    });

    if (!conversation) {
      throw new ForbiddenException('Conversation not found');
    }

    return conversation;
  }

  private getOrganisationId(user: JwtUser): string {
    if (!user.organisationId) {
      throw new BadRequestException('User organisation is required');
    }

    return user.organisationId;
  }

  private validateModel(model: string) {
    if (!isChatModel(model)) {
      throw new BadRequestException('Unsupported chat model');
    }

    return model;
  }

  private async getGatewayUrl(organisationId: string) {
    const config = await this.gatewayConfigService.getConfig(organisationId);
    return config.gatewayUrl;
  }

  private buildGatewayHeaders(user: JwtUser, conversationId?: string) {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-user-id': user.id,
      'x-organisation-id': this.getOrganisationId(user),
    };

    if (conversationId) {
      headers['x-conversation-id'] = conversationId;
    }

    const gatewaySecret = process.env['GATEWAY_SECRET'] || process.env['JWT_SECRET'];
    if (gatewaySecret) {
      headers['x-gateway-secret'] = gatewaySecret;
    }

    return headers;
  }

  private async readGatewayError(response: globalThis.Response) {
    const text = await response.text().catch(() => '');
    return text || `Gateway request failed (${response.status})`;
  }
}
