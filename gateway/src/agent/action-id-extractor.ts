import { isValidUUID } from '../shared/prompt-helpers.js';

interface ToolResultContent {
  type?: string;
  text?: string;
}

interface ToolResult {
  content?: string | ToolResultContent[];
}

export function extractActionIdsFromToolResults(toolResults: ToolResult[]): string[] {
  const actionIds: string[] = [];

  for (const result of toolResults) {
    const texts: string[] = [];

    if (typeof result.content === 'string') {
      texts.push(result.content);
    } else if (Array.isArray(result.content)) {
      for (const block of result.content) {
        if (block.text) texts.push(block.text);
      }
    }

    for (const text of texts) {
      try {
        const parsed = JSON.parse(text);
        if (parsed?.actionId && typeof parsed.actionId === 'string' && isValidUUID(parsed.actionId)) {
          actionIds.push(parsed.actionId);
        }
      } catch {
        // Not JSON, skip
      }
    }
  }

  return actionIds;
}
