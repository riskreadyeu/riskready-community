/**
 * MIME type validation using magic byte signatures.
 * Prevents upload of files that claim one MIME type but contain another.
 */

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'image/png',
  'image/jpeg',
  'text/csv',
  'text/plain',
]);

interface MimeValidationResult {
  valid: boolean;
  detectedType: string;
}

/**
 * Magic byte signatures for common file types.
 * Each entry maps a detected MIME type to a check function.
 */
const MAGIC_SIGNATURES: Array<{
  mimeType: string;
  check: (buf: Buffer) => boolean;
}> = [
  {
    // PDF: starts with %PDF
    mimeType: 'application/pdf',
    check: (buf) => buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46,
  },
  {
    // PNG: starts with 0x89504E47
    mimeType: 'image/png',
    check: (buf) => buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47,
  },
  {
    // JPEG: starts with 0xFFD8FF
    mimeType: 'image/jpeg',
    check: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  {
    // ZIP-based (docx, xlsx, pptx): starts with PK (0x504B0304)
    mimeType: 'application/zip',
    check: (buf) => buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04,
  },
];

/** MIME types that are ZIP-based (Office Open XML) */
const ZIP_BASED_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

/** MIME types that are plain text and have no reliable magic bytes */
const TEXT_MIMES = new Set(['text/csv', 'text/plain']);

/**
 * Validates that a file buffer's magic bytes match its claimed MIME type
 * and that the MIME type is in the allow list.
 */
export function validateFileMimeType(buffer: Buffer, claimedMimeType: string): MimeValidationResult {
  // Check if MIME type is allowed at all
  if (!ALLOWED_MIME_TYPES.has(claimedMimeType)) {
    return { valid: false, detectedType: claimedMimeType };
  }

  // Text-based formats have no reliable magic bytes — allow them through
  if (TEXT_MIMES.has(claimedMimeType)) {
    return { valid: true, detectedType: claimedMimeType };
  }

  // Detect actual type from magic bytes
  let detectedType = 'unknown';
  for (const sig of MAGIC_SIGNATURES) {
    if (sig.check(buffer)) {
      detectedType = sig.mimeType;
      break;
    }
  }

  // ZIP-based Office formats: magic bytes show as application/zip
  if (ZIP_BASED_MIMES.has(claimedMimeType)) {
    if (detectedType === 'application/zip') {
      return { valid: true, detectedType: claimedMimeType };
    }
    return { valid: false, detectedType };
  }

  // Direct match for non-ZIP types
  if (detectedType === claimedMimeType) {
    return { valid: true, detectedType };
  }

  return { valid: false, detectedType };
}
