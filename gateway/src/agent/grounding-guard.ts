import { logger } from '../logger.js';

// Patterns that look like record IDs in the GRC domain
const ID_PATTERNS = [
  /\b[A-Z]{1,5}-\d{2,5}(?:-\d{1,5})?\b/g, // R-01, CTRL-042, INC-2025-001, NC-2025-001
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, // UUIDs
  /\b(?:EVD|REQ|POL|CHG|AST)-\d{4}-\d{4,}\b/g, // Evidence, request, policy, change, asset refs
];

export interface GroundingResult {
  suspectedFabricatedIds: string[];
}

export function checkGrounding(
  responseText: string,
  toolResultIds: string[],
): GroundingResult {
  const knownIds = new Set(toolResultIds.map((id) => id.toLowerCase()));
  const foundIds = new Set<string>();

  for (const pattern of ID_PATTERNS) {
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(responseText)) !== null) {
      foundIds.add(match[0]);
    }
  }

  const suspectedFabricatedIds = Array.from(foundIds).filter(
    (id) => !knownIds.has(id.toLowerCase()),
  );

  return { suspectedFabricatedIds };
}

export function logGroundingMetrics(result: GroundingResult, totalIdsChecked: number): void {
  logger.info({
    groundingCheck: {
      totalIdsChecked,
      fabricatedIdsFound: result.suspectedFabricatedIds.length,
      fabricatedIds: result.suspectedFabricatedIds,
    },
  }, 'Grounding guard check completed');

  if (result.suspectedFabricatedIds.length > 0) {
    logger.warn({
      fabricatedIds: result.suspectedFabricatedIds,
    }, 'Grounding guard detected possible fabricated IDs');
  }
}
