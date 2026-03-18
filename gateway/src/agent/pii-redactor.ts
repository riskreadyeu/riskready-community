const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;

export function redactPII(text: string): string {
  if (!text) return text;
  return text
    .replace(EMAIL_REGEX, '[EMAIL REDACTED]')
    .replace(PHONE_REGEX, '[PHONE REDACTED]');
}
