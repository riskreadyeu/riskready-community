const DEFAULT_MODEL = 'claude-sonnet-4-5-20250514';

interface ResolveConversationModelOptions {
  envModel?: string | null;
  dbModel?: string | null;
  conversationModel?: string | null;
}

export function resolveConversationModel(options: ResolveConversationModelOptions): string {
  return options.conversationModel
    || options.dbModel
    || options.envModel
    || DEFAULT_MODEL;
}
