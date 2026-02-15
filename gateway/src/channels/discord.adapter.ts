// gateway/src/channels/discord.adapter.ts

import { Client, GatewayIntentBits, Events, type Message } from 'discord.js';
import { randomUUID } from 'node:crypto';
import type { ChannelAdapter, MessageHandler } from './channel.interface.js';
import type { AgentResponse } from './types.js';
import { logger } from '../logger.js';

interface DiscordAdapterOptions {
  botToken: string;
  resolveUser: (discordUserId: string, guildId: string) => Promise<{ userId: string; organisationId: string } | null>;
}

export class DiscordAdapter implements ChannelAdapter {
  readonly name = 'discord';
  private client: Client;
  private handler: MessageHandler | null = null;
  private opts: DiscordAdapterOptions;
  private activeMessages = new Map<string, { message: Message; text: string }>();

  constructor(opts: DiscordAdapterOptions) {
    this.opts = opts;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.setupListeners();
  }

  private setupListeners() {
    this.client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;
      if (!this.client.user) return;
      const isDM = !message.guild;
      const isMentioned = message.mentions.has(this.client.user);
      if (!isDM && !isMentioned) return;

      let text = message.content;
      if (this.client.user) {
        text = text.replace(new RegExp(`<@!?${this.client.user.id}>`, 'g'), '').trim();
      }
      if (!text) return;

      const guildId = message.guild?.id ?? 'dm';
      const resolved = await this.opts.resolveUser(message.author.id, guildId);
      if (!resolved) {
        await message.reply(
          'I don\'t recognize your account. Please link your Discord account to RiskReady in Settings > Integrations.',
        );
        return;
      }

      const runId = randomUUID();
      const threadId = message.channel.isThread()
        ? message.channel.id
        : message.id;

      const reply = await message.reply('*Thinking...*');
      this.activeMessages.set(runId, { message: reply, text: '' });

      const unifiedMsg = {
        id: runId,
        channel: 'discord' as const,
        channelMessageId: message.id,
        channelId: `${message.channel.id}:${threadId}`,
        userId: resolved.userId,
        organisationId: resolved.organisationId,
        text,
        attachments: [],
        metadata: { discordGuildId: guildId, discordChannelId: message.channel.id },
        timestamp: new Date(),
      };

      if (this.handler) this.handler(unifiedMsg);
    });
  }

  onMessage(handler: MessageHandler): void {
    this.handler = handler;
  }

  async sendResponse(channelId: string, response: AgentResponse): Promise<void> {
    const [channelPart] = channelId.split(':');
    const channel = await this.client.channels.fetch(channelPart);
    if (channel?.isSendable()) {
      await channel.send(response.text);
    }
  }

  async sendDelta(runId: string, delta: string): Promise<void> {
    const active = this.activeMessages.get(runId);
    if (!active) return;
    active.text += delta;
    const displayText = active.text.length > 1950
      ? active.text.slice(-1950) + '...'
      : active.text;
    try {
      await active.message.edit(displayText);
    } catch (err) {
      logger.warn({ err }, 'Discord: failed to edit message during streaming');
    }
  }

  async finalize(runId: string): Promise<void> {
    const active = this.activeMessages.get(runId);
    if (!active) return;
    const finalText = active.text || '*No response generated.*';
    if (finalText.length > 2000) {
      await active.message.edit(finalText.slice(0, 2000));
      for (let i = 2000; i < finalText.length; i += 2000) {
        await active.message.reply(finalText.slice(i, i + 2000));
      }
    } else {
      await active.message.edit(finalText);
    }
    this.activeMessages.delete(runId);
  }

  async start(): Promise<void> {
    await this.client.login(this.opts.botToken);
    logger.info({ tag: this.client.user?.tag }, 'Discord: connected');
  }

  async stop(): Promise<void> {
    this.client.destroy();
  }
}
