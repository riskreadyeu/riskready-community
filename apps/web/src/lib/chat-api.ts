import { api } from "@/lib/api";

export type ChatModelOption = {
  id: string;
  label: string;
};

export type ChatConversation = {
  id: string;
  title: string | null;
  model: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  toolCalls?: Array<{ name: string; server: string; status: string }> | null;
  actionIds: string[];
  blocks?: Array<{ type: string; [key: string]: unknown }> | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  model?: string | null;
  createdAt: string;
};

export type ChatEvent =
  | { type: "text_delta"; text?: string }
  | { type: "tool_start"; tool?: string; server?: string }
  | { type: "tool_done"; tool?: string; status?: string }
  | { type: "action_proposed"; actionId?: string; summary?: string }
  | { type: "council_start" | "council_member_start" | "council_member_done" | "council_synthesis" | "council_done"; message?: string; agentRole?: string; members?: string[] }
  | { type: "done"; messageId?: string }
  | { type: "error"; message?: string }
  | { type: "block"; block?: { type: string; [key: string]: unknown } };

type PaginatedResponse<T> = {
  results: T[];
  count: number;
};

export function listModels() {
  return api.get<PaginatedResponse<ChatModelOption>>("/chat/models");
}

export function listConversations() {
  return api.get<PaginatedResponse<ChatConversation>>("/chat/conversations");
}

export function createConversation(data: { model: string }) {
  return api.post<ChatConversation>("/chat/conversations", data);
}

export function getMessages(conversationId: string) {
  return api.get<PaginatedResponse<ChatMessage>>(`/chat/conversations/${conversationId}/messages`);
}

export function sendMessage(conversationId: string, data: { text: string }) {
  return api.post<{ runId: string }>(`/chat/conversations/${conversationId}/messages`, data);
}
