/**
 * ISO 27001/27002 reference pointers for Wave 1 documents.
 * Only non-seeded Wave 1 documents need references (POL-009 through POL-013).
 *
 * IMPORTANT: The actual ISO/IEC 27001:2022 and 27002:2022 standard text is
 * copyrighted by ISO/IEC and cannot be distributed in open-source software.
 * These entries contain only clause references. Organisations using RiskReady
 * should purchase the standards from https://www.iso.org and populate
 * their own reference library, or rely on the AI generation engine's
 * knowledge of publicly available clause summaries.
 */

export const WAVE1_REFERENCES: Record<string, string> = {
  'POL-009': `Refer to ISO/IEC 27001:2022 — Clauses 6.1.2 (Information security risk assessment), 6.1.3 (Information security risk treatment), 8.2 (Information security risk assessment), and 8.3 (Information security risk treatment).`,

  'POL-010': `Refer to ISO/IEC 27001:2022 — Clause 7.5 (Documented information), including 7.5.1 (General), 7.5.2 (Creating and updating), and 7.5.3 (Control of documented information).`,

  'POL-011': `Refer to ISO/IEC 27001:2022 — Clause 9.2 (Internal audit), including 9.2.1 (General) and 9.2.2 (Internal audit programme).`,

  'POL-012': `Refer to ISO/IEC 27001:2022 — Clause 9.3 (Management review), including 9.3.1 (General), 9.3.2 (Management review inputs), and 9.3.3 (Management review results).`,

  'POL-013': `Refer to ISO/IEC 27001:2022 — Clauses 7.2 (Competence), 7.3 (Awareness), and ISO/IEC 27002:2022 — Control 6.3 (Information security awareness, education and training).`,
};
