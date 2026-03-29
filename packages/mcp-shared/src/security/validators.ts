import { z } from 'zod';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CUID_REGEX = /^c[a-z0-9]{19,29}$/;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value) || CUID_REGEX.test(value);
}

/** Reusable Zod schema for ID parameters that validates UUID v4 or CUID format. */
export const zodUuidOrCuid = z.string().min(1).max(128).refine(
  (val) => UUID_REGEX.test(val) || CUID_REGEX.test(val),
  { message: 'Must be a valid UUID or CUID' },
);

export function truncateString(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + '[TRUNCATED]';
}
