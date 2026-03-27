/**
 * Scan text for accidentally leaked credentials.
 * Returns sanitized text with credentials redacted.
 */

const CREDENTIAL_PATTERNS = [
  // Anthropic API keys
  { pattern: /sk-ant-[a-zA-Z0-9_-]{20,}/g, replacement: '[REDACTED_ANTHROPIC_KEY]' },
  // RiskReady MCP API keys
  { pattern: /rr_sk_[a-f0-9]{20,}/g, replacement: '[REDACTED_MCP_KEY]' },
  // Generic API keys (common patterns)
  { pattern: /(?:api[_-]?key|apikey|secret[_-]?key|access[_-]?token)\s*[:=]\s*["']?[a-zA-Z0-9_\-]{20,}["']?/gi, replacement: '[REDACTED_CREDENTIAL]' },
  // AWS keys
  { pattern: /AKIA[0-9A-Z]{16}/g, replacement: '[REDACTED_AWS_KEY]' },
  // JWT tokens (long base64 with dots)
  { pattern: /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/g, replacement: '[REDACTED_JWT]' },
  // Connection strings with passwords
  { pattern: /postgresql:\/\/[^:]+:[^@]+@/gi, replacement: 'postgresql://[REDACTED]@' },
];

export function scanAndRedactCredentials(text: string): { text: string; credentialsFound: boolean } {
  let credentialsFound = false;
  let result = text;

  for (const { pattern, replacement } of CREDENTIAL_PATTERNS) {
    // Reset regex state for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(result)) {
      credentialsFound = true;
      pattern.lastIndex = 0;
      result = result.replace(pattern, replacement);
    }
  }

  return { text: result, credentialsFound };
}
