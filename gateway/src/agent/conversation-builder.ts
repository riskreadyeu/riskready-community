interface HistoryMessage {
  role: 'USER' | 'ASSISTANT';
  content: string;
  toolCalls?: unknown[];
}

interface MessageParam {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 10_000;

export function buildConversationMessages(
  history: HistoryMessage[],
  currentMessage: string,
): MessageParam[] {
  // Cap history
  const recent = history.length > MAX_HISTORY
    ? history.slice(-MAX_HISTORY)
    : history;

  // Convert to MessageParam with text-only content (no tool blocks)
  const messages: MessageParam[] = [];
  for (const msg of recent) {
    const role = msg.role === 'USER' ? 'user' : 'assistant';
    const content = msg.content.length > MAX_MESSAGE_LENGTH
      ? msg.content.slice(0, MAX_MESSAGE_LENGTH) + '\n[TRUNCATED]'
      : msg.content;

    // Merge consecutive same-role messages (Anthropic API requires alternation)
    if (messages.length > 0 && messages[messages.length - 1].role === role) {
      messages[messages.length - 1].content += '\n\n' + content;
    } else {
      messages.push({ role, content });
    }
  }

  // Append current user message
  if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
    messages[messages.length - 1].content += '\n\n' + currentMessage;
  } else {
    messages.push({ role: 'user', content: currentMessage });
  }

  return messages;
}
