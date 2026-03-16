import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  const user = {
    id: 'user-1',
    email: 'ciso@clearstream.ie',
    role: 'USER' as const,
    organisationId: 'org-1',
  };

  let prisma: any;
  let gatewayConfigService: any;
  let service: ChatService;

  beforeEach(() => {
    prisma = {
      chatConversation: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      chatMessage: {
        findMany: jest.fn(),
      },
    };
    gatewayConfigService = {
      getConfig: jest.fn().mockResolvedValue({
        gatewayUrl: 'http://localhost:3100',
        agentModel: 'claude-sonnet-4-5-20250929',
        anthropicApiKey: null,
        anthropicApiKeySet: false,
        maxAgentTurns: 25,
        updatedAt: new Date().toISOString(),
      }),
    };
    service = new ChatService(prisma, gatewayConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env['GATEWAY_SECRET'];
  });

  it('creates a conversation with a validated fixed model', async () => {
    prisma.chatConversation.create.mockResolvedValue({
      id: 'conv-1',
      title: null,
      model: 'claude-sonnet-4-5-20250929',
      userId: user.id,
      organisationId: user.organisationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.createConversation(user, { model: 'claude-sonnet-4-5-20250929' });

    expect(prisma.chatConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: user.id,
          organisationId: user.organisationId,
          model: 'claude-sonnet-4-5-20250929',
        }),
      }),
    );
  });

  it('rejects unsupported models', async () => {
    await expect(service.createConversation(user, { model: 'gpt-5' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists only the current user conversations', async () => {
    prisma.chatConversation.findMany.mockResolvedValue([]);

    await service.listConversations(user);

    expect(prisma.chatConversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: user.id,
          organisationId: user.organisationId,
        },
      }),
    );
  });

  it('rejects access to a foreign conversation', async () => {
    prisma.chatConversation.findFirst.mockResolvedValue(null);

    await expect(service.getConversation(user, 'foreign-conv')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('dispatches a message to the gateway with trusted identity headers', async () => {
    prisma.chatConversation.findFirst.mockResolvedValue({
      id: 'conv-1',
      userId: user.id,
      organisationId: user.organisationId,
      model: 'claude-sonnet-4-5-20250929',
    });
    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ runId: 'run-1' }),
      text: async () => '',
    } as Response);

    const result = await service.sendMessage(user, 'conv-1', { text: 'Show me top risks' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3100/dispatch',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-user-id': user.id,
          'x-organisation-id': user.organisationId,
          'x-conversation-id': 'conv-1',
        }),
      }),
    );
    expect(result).toEqual({ runId: 'run-1' });
  });
});
