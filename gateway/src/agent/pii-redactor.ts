const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Require either a country code (+XX) or parenthesized area code to reduce false positives
const PHONE_REGEX = /(?:\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}|\(\d{2,4}\)[-.\s]?\d{3,4}[-.\s]?\d{3,4})/g;
const CREDIT_CARD_REGEX = /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g;
const IBAN_REGEX = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g;

export function redactPII(text: string): string {
  if (!text) return text;
  return text
    .replace(EMAIL_REGEX, '[EMAIL REDACTED]')
    .replace(PHONE_REGEX, '[PHONE REDACTED]')
    .replace(CREDIT_CARD_REGEX, '[CARD REDACTED]')
    .replace(IBAN_REGEX, '[IBAN REDACTED]');
}
