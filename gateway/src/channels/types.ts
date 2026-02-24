// gateway/src/channels/types.ts

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
  storedFileId?: string;
}

export interface UnifiedMessage {
  id: string;
  channel: 'web' | 'slack' | 'discord';
  channelMessageId: string;
  channelId: string;
  userId: string;
  organisationId: string;
  text: string;
  attachments: Attachment[];
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export interface AgentResponse {
  text: string;
  toolCalls?: Array<{ name: string; server: string; status: string }>;
  actionIds?: string[];
}

export type AIBlock =
  | { type: 'text'; content: string }
  | { type: 'risk_table'; data: unknown[]; title?: string }
  | { type: 'risk_detail'; data: Record<string, unknown> }
  | { type: 'heatmap'; data: Record<string, unknown> }
  | { type: 'control_table'; data: unknown[]; title?: string }
  | { type: 'action_card'; data: { actionId: string; summary: string; actionType: string } }
  | { type: 'council_deliberation'; data: Record<string, unknown> };

export type ChatEventType =
  | 'text_delta'
  | 'tool_start'
  | 'tool_done'
  | 'action_proposed'
  | 'block'
  | 'done'
  | 'error'
  // Council events
  | 'council_start'
  | 'council_member_start'
  | 'council_member_done'
  | 'council_synthesis'
  | 'council_done';

export interface ChatEvent {
  type: ChatEventType;
  text?: string;
  tool?: string;
  server?: string;
  status?: string;
  actionId?: string;
  summary?: string;
  messageId?: string;
  message?: string;
  block?: AIBlock;
  // Council-specific fields
  agentRole?: string;
  members?: string[];
  sessionId?: string;
}
