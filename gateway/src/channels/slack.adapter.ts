// gateway/src/channels/slack.adapter.ts

import { App as SlackApp } from '@slack/bolt';
import { randomUUID } from 'node:crypto';
import type { ChannelAdapter, MessageHandler } from './channel.interface.js';
import type { AgentResponse } from './types.js';
import { logger } from '../logger.js';

interface SlackAdapterOptions {
  botToken: string;
  appToken: string;
  signingSecret: string;
  resolveUser: (slackUserId: string, slackTeamId: string) => Promise<{ userId: string; organisationId: string } | null>;
}

export class SlackAdapter implements ChannelAdapter {
  readonly name = 'slack';
  private app: SlackApp;
  private handler: MessageHandler | null = null;
  private opts: SlackAdapterOptions;
  private activeMessages = new Map<string, { channel: string; ts: string; text: string; pendingFlush: NodeJS.Timeout | null }>();

  constructor(opts: SlackAdapterOptions) {
    this.opts = opts;
    this.app = new SlackApp({
      token: opts.botToken,
      appToken: opts.appToken,
      signingSecret: opts.signingSecret,
      socketMode: true,
    });
    this.setupListeners();
  }

  private setupListeners() {
    this.app.message(async ({ message, say }) => {
      if (message.subtype) return;
      const msg = message as { user: string; text: string; ts: string; team?: string; channel: string };
      if (!msg.text || !msg.user) return;
      await this.handleIncoming(msg.user, msg.team ?? '', msg.channel, msg.ts, msg.text);
    });

    this.app.event('app_mention', async ({ event }) => {
      const { user, text, ts, team, channel } = event;
      if (!text || !user) return;
      const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim();
      if (!cleanText) return;
      await this.handleIncoming(user, team ?? '', channel, ts, cleanText);
    });
  }

  private async handleIncoming(
    slackUserId: string,
    slackTeamId: string,
    channel: string,
    ts: string,
    text: string,
  ) {
    const resolved = await this.opts.resolveUser(slackUserId, slackTeamId);
    if (!resolved) {
      await this.app.client.chat.postMessage({
        channel,
        thread_ts: ts,
        text: 'I don\'t recognize your account. Please link your Slack account to RiskReady in Settings > Integrations.',
      });
      return;
    }

    const runId = randomUUID();
    const msg = {
      id: runId,
      channel: 'slack' as const,
      channelMessageId: ts,
      channelId: `${channel}:${ts}`,
      userId: resolved.userId,
      organisationId: resolved.organisationId,
      text,
      attachments: [],
      metadata: { slackChannel: channel, slackTs: ts, slackTeamId },
      timestamp: new Date(),
    };

    const response = await this.app.client.chat.postMessage({
      channel,
      thread_ts: ts,
      text: '_Thinking..._',
    });

    if (response.ts) {
      this.activeMessages.set(runId, { channel, ts: response.ts, text: '', pendingFlush: null });
    }

    if (this.handler) this.handler(msg);
  }

  onMessage(handler: MessageHandler): void {
    this.handler = handler;
  }

  async sendResponse(channelId: string, response: AgentResponse): Promise<void> {
    const [channel, threadTs] = channelId.split(':');
    await this.app.client.chat.postMessage({
      channel,
      thread_ts: threadTs,
      text: response.text,
    });
  }

  async sendDelta(runId: string, delta: string): Promise<void> {
    const active = this.activeMessages.get(runId);
    if (!active) return;
    active.text += delta;
    // Throttle updates to at most once per second to respect Slack rate limits
    if (!active.pendingFlush) {
      active.pendingFlush = setTimeout(async () => {
        active.pendingFlush = null;
        try {
          await this.app.client.chat.update({
            channel: active.channel,
            ts: active.ts,
            text: active.text,
          });
        } catch (err) {
          logger.warn({ err }, 'Slack: failed to update message during streaming');
        }
      }, 1000);
    }
  }

  async finalize(runId: string): Promise<void> {
    const active = this.activeMessages.get(runId);
    if (!active) return;
    if (active.pendingFlush) {
      clearTimeout(active.pendingFlush);
      active.pendingFlush = null;
    }
    await this.app.client.chat.update({
      channel: active.channel,
      ts: active.ts,
      text: active.text || '_No response generated._',
    });
    this.activeMessages.delete(runId);
  }

  async start(): Promise<void> {
    await this.app.start();
    logger.info('Slack: connected via Socket Mode');
  }

  async stop(): Promise<void> {
    await this.app.stop();
  }
}
