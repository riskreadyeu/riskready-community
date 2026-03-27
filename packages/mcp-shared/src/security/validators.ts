const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CUID_REGEX = /^c[a-z0-9]{24,}$/;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value) || CUID_REGEX.test(value);
}

export function truncateString(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + '[TRUNCATED]';
}
