/**
 * ISO 27001/27002 reference pointers for Wave 2 documents.
 * Annex A policies (POL-014 through POL-021).
 *
 * IMPORTANT: The actual ISO/IEC 27001:2022 and 27002:2022 standard text is
 * copyrighted by ISO/IEC and cannot be distributed in open-source software.
 * These entries contain only clause references. Organisations using RiskReady
 * should purchase the standards from https://www.iso.org and populate
 * their own reference library, or rely on the AI generation engine's
 * knowledge of publicly available clause summaries.
 */

export const WAVE2_REFERENCES: Record<string, string> = {
  'POL-014': `Refer to ISO/IEC 27002:2022 — People Controls (Section 6), including Controls 6.1 (Screening), 6.2 (Terms and conditions of employment), 6.3 (Information security awareness, education and training), 6.4 (Disciplinary process), 6.5 (Responsibilities after termination or change of employment), 6.6 (Confidentiality or non-disclosure agreements), 6.7 (Remote working), and 6.8 (Information security event reporting).`,

  'POL-015': `Refer to ISO/IEC 27002:2022 — Physical Controls (Section 7), including Controls 7.1 (Physical security perimeters), 7.2 (Physical entry), 7.3 (Securing offices, rooms and facilities), 7.4 (Physical security monitoring), 7.5 (Protecting against physical and environmental threats), 7.6 (Working in secure areas), and 7.7 (Clear desk and clear screen).`,

  'POL-016': `Refer to ISO/IEC 27002:2022 — Technology Controls for access management, including Controls 8.2 (Privileged access rights), 8.3 (Information access restriction), 8.4 (Access to source code), 8.5 (Secure authentication), and 5.15 (Access control), 5.16 (Identity management), 5.17 (Authentication information), 5.18 (Access rights).`,

  'POL-017': `Refer to ISO/IEC 27002:2022 — Technology Controls for change and vulnerability management, including Controls 8.8 (Management of technical vulnerabilities), 8.9 (Configuration management), 8.19 (Installation of software on operational systems), 8.25 (Secure development life cycle), 8.26 (Application security requirements), 8.27 (Secure system architecture and engineering principles), 8.28 (Secure coding), 8.31 (Separation of development, test and production environments), and 8.32 (Change management).`,

  'POL-018': `Refer to ISO/IEC 27002:2022 — Controls for incident management, including 5.24 (Information security incident management planning and preparation), 5.25 (Assessment and decision on information security events), 5.26 (Response to information security incidents), 5.27 (Learning from information security incidents), and 5.28 (Collection of evidence).`,

  'POL-019': `Refer to ISO/IEC 27002:2022 — Controls for business continuity, including 5.29 (Information security during disruption), 5.30 (ICT readiness for business continuity), 8.13 (Information backup), and 8.14 (Redundancy of information processing facilities).`,

  'POL-020': `Refer to ISO/IEC 27002:2022 — Controls for supplier relationships, including 5.19 (Information security in supplier relationships), 5.20 (Addressing information security within supplier agreements), 5.21 (Managing information security in the ICT supply chain), 5.22 (Monitoring, review and change management of supplier services), and 5.23 (Information security for use of cloud services).`,

  'POL-021': `Refer to ISO/IEC 27002:2022 — Controls for data protection and classification, including 5.9 (Inventory of information and other associated assets), 5.10 (Acceptable use of information and other associated assets), 5.12 (Classification of information), 5.13 (Labelling of information), 5.14 (Information transfer), 8.10 (Information deletion), 8.11 (Data masking), and 8.12 (Data leakage prevention).`,
};
