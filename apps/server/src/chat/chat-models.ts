export const CHAT_MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-5-20250929',
  'claude-sonnet-4-6-20250929',
  'claude-opus-4-6-20250918',
] as const;

export type ChatModel = (typeof CHAT_MODELS)[number];

export function isChatModel(value: string): value is ChatModel {
  return CHAT_MODELS.includes(value as ChatModel);
}
