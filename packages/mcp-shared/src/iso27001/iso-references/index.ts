import { WAVE1_REFERENCES } from './wave1.js';
import { WAVE2_REFERENCES } from './wave2.js';
import { WAVE3_REFERENCES } from './wave3.js';

const ALL_REFERENCES: Record<string, string> = {
  ...WAVE1_REFERENCES,
  ...WAVE2_REFERENCES,
  ...WAVE3_REFERENCES,
};

/**
 * Retrieve the ISO 27001/27002 reference excerpt for a given document ID.
 * Returns an empty string if no reference is available (e.g. for seeded documents).
 */
export function getIsoReference(documentId: string): string {
  return ALL_REFERENCES[documentId] ?? '';
}
