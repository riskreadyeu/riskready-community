/**
 * ISO 27001/27002 reference pointers for Wave 3 documents.
 * Operational procedures (STD-005 through STD-009).
 *
 * IMPORTANT: The actual ISO/IEC 27001:2022 and 27002:2022 standard text is
 * copyrighted by ISO/IEC and cannot be distributed in open-source software.
 * These entries contain only clause references. Organisations using RiskReady
 * should purchase the standards from https://www.iso.org and populate
 * their own reference library, or rely on the AI generation engine's
 * knowledge of publicly available clause summaries.
 */

export const WAVE3_REFERENCES: Record<string, string> = {
  'STD-005': `Refer to ISO/IEC 27002:2022 — Controls 8.13 (Information backup) and 8.14 (Redundancy of information processing facilities).`,

  'STD-006': `Refer to ISO/IEC 27002:2022 — Controls 8.15 (Logging) and 8.16 (Monitoring activities), and ISO/IEC 27001:2022 — Clause 9.1 (Monitoring, measurement, analysis and evaluation).`,

  'STD-007': `Refer to ISO/IEC 27002:2022 — Controls 5.24 (Information security incident management planning and preparation), 5.25 (Assessment and decision on information security events), 5.26 (Response to information security incidents), 5.27 (Learning from information security incidents), and 5.28 (Collection of evidence).`,

  'STD-008': `Refer to ISO/IEC 27002:2022 — Controls 5.19 (Information security in supplier relationships), 5.20 (Addressing information security within supplier agreements), 5.21 (Managing information security in the ICT supply chain), 5.22 (Monitoring, review and change management of supplier services), and 5.23 (Information security for use of cloud services).`,

  'STD-009': `Refer to ISO/IEC 27002:2022 — Controls 8.25 (Secure development life cycle), 8.26 (Application security requirements), 8.27 (Secure system architecture and engineering principles), 8.28 (Secure coding), 8.29 (Security testing in development and acceptance), 8.31 (Separation of development, test and production environments), and 8.32 (Change management).`,
};
