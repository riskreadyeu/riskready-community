/**
 * Model capability detection.
 * tool_search_tool_bm25 is only supported on newer models.
 */

const TOOL_SEARCH_SUPPORTED_PREFIXES = [
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-sonnet-4-5',
  'claude-haiku-4-5',
];

export function supportsToolSearch(model: string): boolean {
  return TOOL_SEARCH_SUPPORTED_PREFIXES.some((prefix) => model.startsWith(prefix));
}
