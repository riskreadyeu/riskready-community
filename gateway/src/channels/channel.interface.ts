// gateway/src/channels/channel.interface.ts

import type { UnifiedMessage, AgentResponse, ChatEvent } from './types.js';

export type MessageHandler = (msg: UnifiedMessage) => void;

export interface ChannelAdapter {
  readonly name: string;

  start(): Promise<void>;
  stop(): Promise<void>;

  onMessage(handler: MessageHandler): void;

  sendResponse(channelId: string, response: AgentResponse): Promise<void>;
  sendDelta(channelId: string, delta: string): Promise<void>;
  finalize(channelId: string): Promise<void>;
}
