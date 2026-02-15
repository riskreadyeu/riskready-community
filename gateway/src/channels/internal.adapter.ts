// gateway/src/channels/internal.adapter.ts

import Fastify, { type FastifyInstance } from 'fastify';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import type { ChannelAdapter, MessageHandler } from './channel.interface.js';
import type { UnifiedMessage, AgentResponse, ChatEvent } from './types.js';

interface InternalAdapterOptions {
  port: number;
  secret?: string;
}

export class InternalAdapter implements ChannelAdapter {
  readonly name = 'web';
  private server: FastifyInstance;
  private handler: MessageHandler | null = null;
  private port: number;
  private secret?: string;
  private cancelHandler: ((runId: string) => void) | null = null;
  private sseHandler: ((runId: string, callback: (event: ChatEvent) => void) => () => void) | null = null;

  constructor(opts: InternalAdapterOptions) {
    this.port = opts.port;
    this.secret = opts.secret;
    this.server = Fastify({ logger: false });
    this.setupRoutes();
  }

  private setupRoutes() {
    if (this.secret) {
      this.server.addHook('onRequest', async (request, reply) => {
        if (request.url === '/health') return;
        const provided = request.headers['x-gateway-secret'];
        if (typeof provided !== 'string' ||
            provided.length !== this.secret!.length ||
            !timingSafeEqual(Buffer.from(provided), Buffer.from(this.secret!))) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      });
    }

    this.server.post('/dispatch', async (request, reply) => {
      const body = request.body as {
        userId?: string;
        organisationId?: string;
        conversationId?: string;
        text?: string;
        fileIds?: string[];
      };

      if (!body?.text?.trim() || !body.userId || !body.organisationId) {
        return reply.status(400).send({ error: 'userId, organisationId, and text are required' });
      }

      const runId = randomUUID();
      const msg: UnifiedMessage = {
        id: runId,
        channel: 'web',
        channelMessageId: body.conversationId ?? runId,
        channelId: body.conversationId ?? runId,
        userId: body.userId,
        organisationId: body.organisationId,
        text: body.text.trim(),
        attachments: (body.fileIds ?? []).map((fid) => ({
          id: fid,
          filename: '',
          mimeType: '',
          sizeBytes: 0,
          storedFileId: fid,
        })),
        metadata: { conversationId: body.conversationId },
        timestamp: new Date(),
      };

      if (this.handler) {
        this.handler(msg);
      }

      return reply.status(202).send({ runId });
    });

    this.server.post<{ Params: { runId: string } }>('/cancel/:runId', async (request, reply) => {
      const { runId } = request.params;
      if (this.cancelHandler) this.cancelHandler(runId);
      return reply.status(200).send({ cancelled: true });
    });

    this.server.get('/health', async (_request, reply) => {
      return reply.status(200).send({ status: 'ok', adapter: 'internal', timestamp: new Date().toISOString() });
    });

    this.server.get<{ Params: { runId: string } }>('/stream/:runId', async (request, reply) => {
      const { runId } = request.params;

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      const callback = (event: ChatEvent) => {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
        if (event.type === 'done' || event.type === 'error') {
          reply.raw.end();
        }
      };

      if (this.sseHandler) {
        const unsubscribe = this.sseHandler(runId, callback);
        request.raw.on('close', () => unsubscribe());
      } else {
        reply.raw.write(`data: ${JSON.stringify({ type: 'error', message: 'No SSE handler' })}\n\n`);
        reply.raw.end();
      }
    });
  }

  setSseHandler(handler: (runId: string, callback: (event: ChatEvent) => void) => () => void): void {
    this.sseHandler = handler;
  }

  setCancelHandler(handler: (runId: string) => void): void {
    this.cancelHandler = handler;
  }

  onMessage(handler: MessageHandler): void {
    this.handler = handler;
  }

  async start(): Promise<void> {
    await this.server.listen({ port: this.port, host: '0.0.0.0' });
  }

  async stop(): Promise<void> {
    await this.server.close();
  }

  async sendResponse(_channelId: string, _response: AgentResponse): Promise<void> {
    // No-op for internal adapter: NestJS reads via SSE stream
  }

  async sendDelta(_channelId: string, _delta: string): Promise<void> {
    // No-op for internal adapter
  }

  async finalize(_channelId: string): Promise<void> {
    // No-op for internal adapter
  }
}
