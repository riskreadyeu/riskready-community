type ToolResultStatus = 'success' | 'error';

export interface GuardToolResult {
  toolName: string;
  status: ToolResultStatus;
  rawResult: unknown;
}

export interface GroundingGuardInput {
  text: string;
  toolResults: GuardToolResult[];
}

export interface GroundingGuardResult {
  text: string;
  wasRewritten: boolean;
}

export interface GuardToolCall {
  name: string;
  status: string;
}

const UNSUPPORTED_FAILURE_CLAIMS = [
  'i don\'t have permission',
  'i do not have permission',
  'i don\'t have access',
  'i do not have access',
  'i cannot access',
  'i can\'t access',
  'access denied',
  'i am unauthorized',
  'i am not authorised',
  'i am not authorized',
  'request was unauthorized',
  'returned unauthorized',
  'returned not authorized',
  'not enabled for this',
  'configuration issue',
  'configuration problem',
  'module is disabled',
  'module is not enabled',
  'preventing me from accessing',
  'appears to be disabled',
  'doesn\'t appear to be enabled',
  'does not appear to be enabled',
  'unable to access the',
  'could not access the',
];

const SUPPORTED_ERROR_MARKERS = [
  'permission denied',
  'access denied',
  'unauthorized',
  'forbidden',
  'not authorized',
  'not authorised',
  'authentication failed',
];

function extractText(rawResult: unknown): string {
  if (!rawResult || typeof rawResult !== 'object') {
    return '';
  }

  const content = (rawResult as { content?: Array<{ text?: string }> }).content;
  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((item) => (typeof item?.text === 'string' ? item.text : ''))
    .filter(Boolean)
    .join('\n');
}

function parseSummary(text: string): string | null {
  if (!text.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const parts: string[] = [];

    if (typeof parsed.total === 'number') {
      parts.push(`total=${parsed.total}`);
    }
    if (typeof parsed.count === 'number') {
      parts.push(`count=${parsed.count}`);
    }
    if (typeof parsed.activeCount === 'number') {
      parts.push(`activeCount=${parsed.activeCount}`);
    }
    if (typeof parsed.overdueCount === 'number') {
      parts.push(`overdueCount=${parsed.overdueCount}`);
    }
    if (parsed.note && typeof parsed.note === 'string') {
      parts.push(`note=${parsed.note}`);
    }
    if (parsed.risks && typeof parsed.risks === 'object') {
      const total = (parsed.risks as { total?: unknown }).total;
      if (typeof total === 'number') {
        parts.push(`risks.total=${total}`);
      }
    }

    if (Array.isArray(parsed.results)) {
      parts.push(`results=${parsed.results.length}`);
      const first = parsed.results[0] as Record<string, unknown> | undefined;
      if (first && typeof first.riskId === 'string' && typeof first.title === 'string') {
        parts.push(`first=${first.riskId} ${first.title}`);
      }
    }

    return parts.length > 0 ? parts.join(', ') : text.slice(0, 180);
  } catch {
    return text.slice(0, 180);
  }
}

function hasUnsupportedClaim(text: string): boolean {
  const normalized = text.toLowerCase();
  return UNSUPPORTED_FAILURE_CLAIMS.some((claim) => normalized.includes(claim));
}

function hasSupportedFailure(toolResults: GuardToolResult[]): boolean {
  return toolResults.some((result) => {
    if (result.status === 'error') {
      return true;
    }

    const text = extractText(result.rawResult).toLowerCase();
    return SUPPORTED_ERROR_MARKERS.some((marker) => text.includes(marker));
  });
}

function buildFallback(toolResults: GuardToolResult[]): string {
  const lines = [`I queried ${toolResults.length} tool(s) successfully. Here is what they returned:`];

  for (const result of toolResults) {
    const summary = parseSummary(extractText(result.rawResult));
    lines.push(`- ${result.toolName}: ${summary || 'returned data successfully'}`);
  }

  lines.push('I cannot conclude there is a permission, access, or configuration problem because the tool results did not report one.');
  return lines.join('\n');
}

export function withFallbackGroundingToolResults(
  toolResults: GuardToolResult[],
  toolCalls: GuardToolCall[],
): GuardToolResult[] {
  if (toolResults.length > 0) {
    return toolResults;
  }

  const completedToolNames = [...new Set(
    toolCalls
      .filter((toolCall) => toolCall.status === 'done')
      .map((toolCall) => toolCall.name),
  )];

  return completedToolNames.map((toolName) => ({
    toolName,
    status: 'success' as const,
    rawResult: { content: [] },
  }));
}

export function applyGroundingGuard(input: GroundingGuardInput): GroundingGuardResult {
  if (!input.toolResults.length) {
    return { text: input.text, wasRewritten: false };
  }

  if (!hasUnsupportedClaim(input.text)) {
    return { text: input.text, wasRewritten: false };
  }

  if (hasSupportedFailure(input.toolResults)) {
    return { text: input.text, wasRewritten: false };
  }

  return {
    text: buildFallback(input.toolResults),
    wasRewritten: true,
  };
}
