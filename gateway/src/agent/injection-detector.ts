interface DetectionResult {
  suspicious: boolean;
  patterns: string[];
}

const INJECTION_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'instruction_override', regex: /ignore\s+(previous|above|all)\s+(instructions|rules|guidelines)/i },
  { name: 'instruction_override', regex: /override\s+(your|the|all)\s+(rules|instructions)/i },
  { name: 'prompt_extraction', regex: /reveal\s+(your|the)\s+(system\s+)?prompt/i },
  { name: 'prompt_extraction', regex: /show\s+(me\s+)?(your|the)\s+(system\s+)?instructions/i },
  { name: 'prompt_extraction', regex: /what\s+are\s+your\s+(system\s+)?instructions/i },
  { name: 'role_impersonation', regex: /you\s+are\s+now\s+/i },
  { name: 'role_impersonation', regex: /act\s+as\s+(a|an)\s+/i },
  { name: 'role_impersonation', regex: /pretend\s+to\s+be\s+/i },
  { name: 'delimiter_escape', regex: /<\/(?:RECALLED_MEMORIES|TASK_CONTEXT|USER_QUESTION|COUNCIL_FINDINGS|TOOL_DATA)>/i },
];

export function detectInjectionPatterns(text: string): DetectionResult {
  if (!text) return { suspicious: false, patterns: [] };

  const matched: string[] = [];
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.regex.test(text)) {
      matched.push(pattern.name);
    }
  }

  return {
    suspicious: matched.length > 0,
    patterns: [...new Set(matched)],
  };
}
