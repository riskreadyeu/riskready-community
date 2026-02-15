// gateway/src/agent/block-extractor.ts
import type { AIBlock } from '../channels/types.js';

type ToolBlockMapping = {
  blockType: AIBlock['type'];
  transform: (parsed: unknown) => AIBlock | null;
};

const TOOL_BLOCK_MAP: Record<string, ToolBlockMapping> = {
  'mcp__riskready-controls__list_controls': {
    blockType: 'control_table',
    transform: (parsed) => {
      const data = (parsed as any)?.results;
      if (!Array.isArray(data)) return null;
      return { type: 'control_table', data, title: `${data.length} controls` };
    },
  },
  'mcp__riskready-controls__search_controls': {
    blockType: 'control_table',
    transform: (parsed) => {
      const data = (parsed as any)?.results;
      if (!Array.isArray(data)) return null;
      return { type: 'control_table', data, title: `${data.length} controls` };
    },
  },
};

export function extractBlock(toolName: string, toolResultJson: string): AIBlock | null {
  const mapping = TOOL_BLOCK_MAP[toolName];
  if (!mapping) return null;

  try {
    const parsed = JSON.parse(toolResultJson);
    return mapping.transform(parsed);
  } catch {
    return null;
  }
}

/** Check if a tool name has a block mapping (for filtering). */
export function hasBlockMapping(toolName: string): boolean {
  return toolName in TOOL_BLOCK_MAP;
}
