import { PrismaClient, IncidentCategory, IncidentSeverity } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// INCIDENT TYPES (ISO 27001 Aligned)
// ============================================

const incidentTypes = [
  // Malware
  { name: 'Ransomware Attack', description: 'Encryption of systems or data by malicious actors demanding ransom', category: 'MALWARE', defaultSeverity: 'CRITICAL', typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: true, requiresLawEnforcement: true, sortOrder: 1 },
  { name: 'Virus Infection', description: 'System infection by self-replicating malicious code', category: 'MALWARE', defaultSeverity: 'HIGH', typicalConfidentialityImpact: false, typicalIntegrityImpact: true, typicalAvailabilityImpact: true, requiresLawEnforcement: false, sortOrder: 2 },
  { name: 'Trojan/Backdoor', description: 'Malicious software disguised as legitimate providing unauthorized access', category: 'MALWARE', defaultSeverity: 'HIGH', typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 3 },
  { name: 'Spyware/Keylogger', description: 'Software designed to collect information without user knowledge', category: 'MALWARE', defaultSeverity: 'HIGH', typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 4 },
  { name: 'Cryptominer', description: 'Unauthorized cryptocurrency mining software consuming resources', category: 'MALWARE', defaultSeverity: 'MEDIUM', typicalConfidentialityImpact: false, typicalIntegrityImpact: false, typicalAvailabilityImpact: true, requiresLawEnforcement: false, sortOrder: 5 },

  // Phishing
  { name: 'Phishing - Credential Theft', description: 'Deceptive attempt to steal user credentials', category: 'PHISHING', defaultSeverity: 'HIGH', typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: false, sortOrder: 10 },
  { name: 'Spear Phishing', description: 'Targeted phishing attack against specific individuals', category: 'PHISHING', defaultSeverity: 'HIGH', typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 11 },
  { name: 'Business Email Compromise (BEC)', description: 'Email fraud targeting business financial transactions', category: 'PHISHING', defaultSeverity: 'CRITICAL', typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 12 },
  { name: 'Whaling', description: 'Phishing attack targeting senior executives', category: 'PHISHING', defaultSeverity: 'CRITICAL', typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 13 },

  // Denial of Service
  { name: 'DDoS Attack', description: 'Distributed denial of service attack overwhelming systems', category: 'DENIAL_OF_SERVICE', defaultSeverity: 'HIGH', typicalConfidentialityImpact: false, typicalIntegrityImpact: false, typicalAvailabilityImpact: true, requiresLawEnforcement: true, sortOrder: 20 },
  { name: 'Application Layer DoS', description: 'Attack targeting application layer to exhaust resources', category: 'DENIAL_OF_SERVICE', defaultSeverity: 'HIGH', typicalConfidentialityImpact: false, typicalIntegrityImpact: false, typicalAvailabilityImpact: true, requiresLawEnforcement: false, sortOrder: 21 },

  // Data Breach
  { name: 'Personal Data Breach', description: 'Unauthorized access or disclosure of personal data (GDPR)', category: 'DATA_BREACH', defaultSeverity: 'CRITICAL', typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 30 },
  { name: 'Financial Data Breach', description: 'Unauthorized access to financial or payment data', category: 'DATA_BREACH', defaultSeverity: 'CRITICAL', typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 31 },
  { name: 'Intellectual Property Theft', description: 'Unauthorized access or exfiltration of proprietary information', category: 'DATA_BREACH', defaultSeverity: 'HIGH', typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 32 },
  { name: 'Data Exfiltration', description: 'Unauthorized transfer of data outside the organization', category: 'DATA_BREACH', defaultSeverity: 'CRITICAL', typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 33 },

  // Unauthorized Access
  { name: 'Account Compromise', description: 'Unauthorized access to user account', category: 'UNAUTHORIZED_ACCESS', defaultSeverity: 'HIGH', typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: false, requiresLawEnforcement: false, sortOrder: 40 },
  { name: 'Privilege Escalation', description: 'Unauthorized elevation of access privileges', category: 'UNAUTHORIZED_ACCESS', defaultSeverity: 'HIGH', typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 41 },
  { name: 'Unauthorized System Access', description: 'Unauthorized access to systems or networks', category: 'UNAUTHORIZED_ACCESS', defaultSeverity: 'HIGH', typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 42 },
  { name: 'Brute Force Attack', description: 'Systematic password guessing attack', category: 'UNAUTHORIZED_ACCESS', defaultSeverity: 'MEDIUM', typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: false, sortOrder: 43 },

  // Insider Threat
  { name: 'Malicious Insider', description: 'Intentional harmful actions by authorized user', category: 'INSIDER_THREAT', defaultSeverity: 'CRITICAL', typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: true, requiresLawEnforcement: true, sortOrder: 50 },
  { name: 'Negligent Insider', description: 'Unintentional security incident caused by authorized user', category: 'INSIDER_THREAT', defaultSeverity: 'MEDIUM', typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: false, sortOrder: 51 },
  { name: 'Policy Violation', description: 'Violation of security policies by authorized user', category: 'INSIDER_THREAT', defaultSeverity: 'LOW', typicalConfidentialityImpact: false, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: false, sortOrder: 52 },

  // Physical
  { name: 'Physical Intrusion', description: 'Unauthorized physical access to secure areas', category: 'PHYSICAL', defaultSeverity: 'HIGH', typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 60 },
  { name: 'Device Theft', description: 'Theft of computing devices or storage media', category: 'PHYSICAL', defaultSeverity: 'HIGH', typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: true, requiresLawEnforcement: true, sortOrder: 61 },
  { name: 'Environmental Incident', description: 'Fire, flood, or other environmental damage to IT assets', category: 'PHYSICAL', defaultSeverity: 'HIGH', typicalConfidentialityImpact: false, typicalIntegrityImpact: true, typicalAvailabilityImpact: true, requiresLawEnforcement: false, sortOrder: 62 },

  // Supply Chain
  { name: 'Third-Party Breach', description: 'Security incident at supplier affecting organization', category: 'SUPPLY_CHAIN', defaultSeverity: 'HIGH', typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: true, requiresLawEnforcement: true, sortOrder: 70 },
  { name: 'Software Supply Chain Attack', description: 'Compromise of software through supply chain', category: 'SUPPLY_CHAIN', defaultSeverity: 'CRITICAL', typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 71 },
  { name: 'Cloud Service Outage', description: 'Disruption of cloud service provider', category: 'SUPPLY_CHAIN', defaultSeverity: 'HIGH', typicalConfidentialityImpact: false, typicalIntegrityImpact: false, typicalAvailabilityImpact: true, requiresLawEnforcement: false, sortOrder: 72 },

  // System Failure
  { name: 'Hardware Failure', description: 'Critical hardware component failure', category: 'SYSTEM_FAILURE', defaultSeverity: 'MEDIUM', typicalConfidentialityImpact: false, typicalIntegrityImpact: true, typicalAvailabilityImpact: true, requiresLawEnforcement: false, sortOrder: 80 },
  { name: 'Software Failure', description: 'Critical software malfunction or crash', category: 'SYSTEM_FAILURE', defaultSeverity: 'MEDIUM', typicalConfidentialityImpact: false, typicalIntegrityImpact: true, typicalAvailabilityImpact: true, requiresLawEnforcement: false, sortOrder: 81 },
  { name: 'Database Corruption', description: 'Data integrity issues in database systems', category: 'SYSTEM_FAILURE', defaultSeverity: 'HIGH', typicalConfidentialityImpact: false, typicalIntegrityImpact: true, typicalAvailabilityImpact: true, requiresLawEnforcement: false, sortOrder: 82 },

  // Configuration Error
  { name: 'Misconfiguration', description: 'Security weakness due to configuration error', category: 'CONFIGURATION_ERROR', defaultSeverity: 'MEDIUM', typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: false, sortOrder: 90 },
  { name: 'Exposed Service', description: 'Unintended exposure of service or data to internet', category: 'CONFIGURATION_ERROR', defaultSeverity: 'HIGH', typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: false, sortOrder: 91 },
  { name: 'Certificate Expiry', description: 'SSL/TLS certificate expiration causing service issues', category: 'CONFIGURATION_ERROR', defaultSeverity: 'MEDIUM', typicalConfidentialityImpact: false, typicalIntegrityImpact: false, typicalAvailabilityImpact: true, requiresLawEnforcement: false, sortOrder: 92 },
];

// ============================================
// ATTACK VECTORS (MITRE ATT&CK Aligned)
// ============================================

const attackVectors = [
  // Initial Access
  { name: 'Phishing', mitreAttackId: 'T1566', mitreAttackName: 'Phishing', mitreTactics: ['initial-access'], description: 'Adversaries may send phishing messages to gain access to victim systems' },
  { name: 'Drive-by Compromise', mitreAttackId: 'T1189', mitreAttackName: 'Drive-by Compromise', mitreTactics: ['initial-access'], description: 'Adversaries may gain access through users visiting malicious websites' },
  { name: 'Exploit Public-Facing Application', mitreAttackId: 'T1190', mitreAttackName: 'Exploit Public-Facing Application', mitreTactics: ['initial-access'], description: 'Adversaries may exploit vulnerabilities in internet-facing applications' },
  { name: 'External Remote Services', mitreAttackId: 'T1133', mitreAttackName: 'External Remote Services', mitreTactics: ['initial-access', 'persistence'], description: 'Adversaries may leverage external remote services to initially access or persist' },
  { name: 'Supply Chain Compromise', mitreAttackId: 'T1195', mitreAttackName: 'Supply Chain Compromise', mitreTactics: ['initial-access'], description: 'Adversaries may manipulate products or delivery mechanisms prior to receipt' },
  { name: 'Trusted Relationship', mitreAttackId: 'T1199', mitreAttackName: 'Trusted Relationship', mitreTactics: ['initial-access'], description: 'Adversaries may breach trusted third parties to gain access' },
  { name: 'Valid Accounts', mitreAttackId: 'T1078', mitreAttackName: 'Valid Accounts', mitreTactics: ['defense-evasion', 'persistence', 'privilege-escalation', 'initial-access'], description: 'Adversaries may obtain and abuse credentials of existing accounts' },

  // Execution
  { name: 'Command and Scripting Interpreter', mitreAttackId: 'T1059', mitreAttackName: 'Command and Scripting Interpreter', mitreTactics: ['execution'], description: 'Adversaries may abuse command and script interpreters to execute commands' },
  { name: 'User Execution', mitreAttackId: 'T1204', mitreAttackName: 'User Execution', mitreTactics: ['execution'], description: 'Adversaries may rely on user interaction to execute malicious content' },

  // Persistence
  { name: 'Account Manipulation', mitreAttackId: 'T1098', mitreAttackName: 'Account Manipulation', mitreTactics: ['persistence'], description: 'Adversaries may manipulate accounts to maintain access' },
  { name: 'Create Account', mitreAttackId: 'T1136', mitreAttackName: 'Create Account', mitreTactics: ['persistence'], description: 'Adversaries may create accounts to maintain access' },

  // Privilege Escalation
  { name: 'Exploitation for Privilege Escalation', mitreAttackId: 'T1068', mitreAttackName: 'Exploitation for Privilege Escalation', mitreTactics: ['privilege-escalation'], description: 'Adversaries may exploit vulnerabilities to escalate privileges' },

  // Credential Access
  { name: 'Brute Force', mitreAttackId: 'T1110', mitreAttackName: 'Brute Force', mitreTactics: ['credential-access'], description: 'Adversaries may use brute force techniques to gain access to accounts' },
  { name: 'Credential Dumping', mitreAttackId: 'T1003', mitreAttackName: 'OS Credential Dumping', mitreTactics: ['credential-access'], description: 'Adversaries may dump credentials from operating systems' },

  // Lateral Movement
  { name: 'Remote Services', mitreAttackId: 'T1021', mitreAttackName: 'Remote Services', mitreTactics: ['lateral-movement'], description: 'Adversaries may use remote services to move laterally' },

  // Exfiltration
  { name: 'Exfiltration Over Web Service', mitreAttackId: 'T1567', mitreAttackName: 'Exfiltration Over Web Service', mitreTactics: ['exfiltration'], description: 'Adversaries may use web services to exfiltrate data' },
  { name: 'Automated Exfiltration', mitreAttackId: 'T1020', mitreAttackName: 'Automated Exfiltration', mitreTactics: ['exfiltration'], description: 'Adversaries may exfiltrate data automatically' },

  // Impact
  { name: 'Data Encrypted for Impact', mitreAttackId: 'T1486', mitreAttackName: 'Data Encrypted for Impact', mitreTactics: ['impact'], description: 'Adversaries may encrypt data to interrupt availability' },
  { name: 'Defacement', mitreAttackId: 'T1491', mitreAttackName: 'Defacement', mitreTactics: ['impact'], description: 'Adversaries may modify visual content to deliver messaging' },
  { name: 'Service Stop', mitreAttackId: 'T1489', mitreAttackName: 'Service Stop', mitreTactics: ['impact'], description: 'Adversaries may stop or disable services' },
];

// ============================================
// REGULATORY AUTHORITIES (EU Focus)
// ============================================

const regulatoryAuthorities = [
  // CSIRTs (NIS2)
  { name: 'CERT-EU', shortName: 'CERT-EU', countryCode: 'EU', authorityType: 'CSIRT', frameworks: ['NIS2'], submissionPortalUrl: 'https://cert.europa.eu', submissionEmail: 'cert@cert.europa.eu', timezone: 'Europe/Brussels' },
  { name: 'BSI - CERT-Bund', shortName: 'CERT-Bund', countryCode: 'DE', authorityType: 'CSIRT', frameworks: ['NIS2'], submissionPortalUrl: 'https://www.bsi.bund.de', submissionEmail: 'certbund@bsi.bund.de', timezone: 'Europe/Berlin' },
  { name: 'ANSSI - CERT-FR', shortName: 'CERT-FR', countryCode: 'FR', authorityType: 'CSIRT', frameworks: ['NIS2'], submissionPortalUrl: 'https://www.cert.ssi.gouv.fr', submissionEmail: 'cert-fr@ssi.gouv.fr', timezone: 'Europe/Paris' },
  { name: 'NCSC-NL', shortName: 'NCSC-NL', countryCode: 'NL', authorityType: 'CSIRT', frameworks: ['NIS2'], submissionPortalUrl: 'https://www.ncsc.nl', submissionEmail: 'cert@ncsc.nl', timezone: 'Europe/Amsterdam' },
  { name: 'NCSC-UK', shortName: 'NCSC', countryCode: 'GB', authorityType: 'CSIRT', frameworks: ['NIS2'], submissionPortalUrl: 'https://www.ncsc.gov.uk', submissionEmail: 'incidents@ncsc.gov.uk', timezone: 'Europe/London' },
  { name: 'INCIBE-CERT', shortName: 'INCIBE-CERT', countryCode: 'ES', authorityType: 'CSIRT', frameworks: ['NIS2'], submissionPortalUrl: 'https://www.incibe-cert.es', submissionEmail: 'incidencias@incibe-cert.es', timezone: 'Europe/Madrid' },
  { name: 'CSIRT Italia', shortName: 'CSIRT-IT', countryCode: 'IT', authorityType: 'CSIRT', frameworks: ['NIS2'], submissionPortalUrl: 'https://www.csirt.gov.it', submissionEmail: 'segnalazioni@csirt.gov.it', timezone: 'Europe/Rome' },
  { name: 'CERT.be', shortName: 'CERT.be', countryCode: 'BE', authorityType: 'CSIRT', frameworks: ['NIS2'], submissionPortalUrl: 'https://cert.be', submissionEmail: 'cert@cert.be', timezone: 'Europe/Brussels' },
  { name: 'CERT.at', shortName: 'CERT.at', countryCode: 'AT', authorityType: 'CSIRT', frameworks: ['NIS2'], submissionPortalUrl: 'https://www.cert.at', submissionEmail: 'reports@cert.at', timezone: 'Europe/Vienna' },
  { name: 'CERT.pl', shortName: 'CERT.pl', countryCode: 'PL', authorityType: 'CSIRT', frameworks: ['NIS2'], submissionPortalUrl: 'https://www.cert.pl', submissionEmail: 'cert@cert.pl', timezone: 'Europe/Warsaw' },
  { name: 'NCSC-IE', shortName: 'NCSC-IE', countryCode: 'IE', authorityType: 'CSIRT', frameworks: ['NIS2'], submissionPortalUrl: 'https://www.ncsc.gov.ie', submissionEmail: 'incidents@ncsc.gov.ie', timezone: 'Europe/Dublin' },

  // Financial Supervisors (DORA)
  { name: 'European Central Bank', shortName: 'ECB', countryCode: 'EU', authorityType: 'FINANCIAL_SUPERVISOR', frameworks: ['DORA'], submissionPortalUrl: 'https://www.bankingsupervision.europa.eu', timezone: 'Europe/Frankfurt' },
  { name: 'European Securities and Markets Authority', shortName: 'ESMA', countryCode: 'EU', authorityType: 'FINANCIAL_SUPERVISOR', frameworks: ['DORA'], submissionPortalUrl: 'https://www.esma.europa.eu', timezone: 'Europe/Paris' },
  { name: 'European Insurance and Occupational Pensions Authority', shortName: 'EIOPA', countryCode: 'EU', authorityType: 'FINANCIAL_SUPERVISOR', frameworks: ['DORA'], submissionPortalUrl: 'https://www.eiopa.europa.eu', timezone: 'Europe/Frankfurt' },
  { name: 'BaFin - Federal Financial Supervisory Authority', shortName: 'BaFin', countryCode: 'DE', authorityType: 'FINANCIAL_SUPERVISOR', frameworks: ['DORA'], submissionPortalUrl: 'https://www.bafin.de', submissionEmail: 'poststelle@bafin.de', timezone: 'Europe/Berlin' },
  { name: 'Autorité des marchés financiers', shortName: 'AMF', countryCode: 'FR', authorityType: 'FINANCIAL_SUPERVISOR', frameworks: ['DORA'], submissionPortalUrl: 'https://www.amf-france.org', timezone: 'Europe/Paris' },
  { name: 'De Nederlandsche Bank', shortName: 'DNB', countryCode: 'NL', authorityType: 'FINANCIAL_SUPERVISOR', frameworks: ['DORA'], submissionPortalUrl: 'https://www.dnb.nl', timezone: 'Europe/Amsterdam' },
  { name: 'Financial Conduct Authority', shortName: 'FCA', countryCode: 'GB', authorityType: 'FINANCIAL_SUPERVISOR', frameworks: ['DORA'], submissionPortalUrl: 'https://www.fca.org.uk', timezone: 'Europe/London' },
  { name: 'Central Bank of Ireland', shortName: 'CBI', countryCode: 'IE', authorityType: 'FINANCIAL_SUPERVISOR', frameworks: ['DORA'], submissionPortalUrl: 'https://www.centralbank.ie', timezone: 'Europe/Dublin' },
  { name: 'CONSOB', shortName: 'CONSOB', countryCode: 'IT', authorityType: 'FINANCIAL_SUPERVISOR', frameworks: ['DORA'], submissionPortalUrl: 'https://www.consob.it', timezone: 'Europe/Rome' },
  { name: 'CNMV', shortName: 'CNMV', countryCode: 'ES', authorityType: 'FINANCIAL_SUPERVISOR', frameworks: ['DORA'], submissionPortalUrl: 'https://www.cnmv.es', timezone: 'Europe/Madrid' },

  // Data Protection Authorities (GDPR)
  { name: 'European Data Protection Board', shortName: 'EDPB', countryCode: 'EU', authorityType: 'DATA_PROTECTION_AUTHORITY', frameworks: ['GDPR'], submissionPortalUrl: 'https://edpb.europa.eu', timezone: 'Europe/Brussels' },
  { name: 'Bundesbeauftragter für den Datenschutz', shortName: 'BfDI', countryCode: 'DE', authorityType: 'DATA_PROTECTION_AUTHORITY', frameworks: ['GDPR'], submissionPortalUrl: 'https://www.bfdi.bund.de', timezone: 'Europe/Berlin' },
  { name: 'Commission Nationale de l\'Informatique et des Libertés', shortName: 'CNIL', countryCode: 'FR', authorityType: 'DATA_PROTECTION_AUTHORITY', frameworks: ['GDPR'], submissionPortalUrl: 'https://www.cnil.fr', timezone: 'Europe/Paris' },
  { name: 'Autoriteit Persoonsgegevens', shortName: 'AP', countryCode: 'NL', authorityType: 'DATA_PROTECTION_AUTHORITY', frameworks: ['GDPR'], submissionPortalUrl: 'https://autoriteitpersoonsgegevens.nl', timezone: 'Europe/Amsterdam' },
  { name: 'Information Commissioner\'s Office', shortName: 'ICO', countryCode: 'GB', authorityType: 'DATA_PROTECTION_AUTHORITY', frameworks: ['GDPR'], submissionPortalUrl: 'https://ico.org.uk', timezone: 'Europe/London' },
  { name: 'Data Protection Commission', shortName: 'DPC', countryCode: 'IE', authorityType: 'DATA_PROTECTION_AUTHORITY', frameworks: ['GDPR'], submissionPortalUrl: 'https://www.dataprotection.ie', timezone: 'Europe/Dublin' },
  { name: 'Garante per la protezione dei dati personali', shortName: 'Garante', countryCode: 'IT', authorityType: 'DATA_PROTECTION_AUTHORITY', frameworks: ['GDPR'], submissionPortalUrl: 'https://www.garanteprivacy.it', timezone: 'Europe/Rome' },
  { name: 'Agencia Española de Protección de Datos', shortName: 'AEPD', countryCode: 'ES', authorityType: 'DATA_PROTECTION_AUTHORITY', frameworks: ['GDPR'], submissionPortalUrl: 'https://www.aepd.es', timezone: 'Europe/Madrid' },
];

// ============================================
// SEED FUNCTION
// ============================================

export async function seedIncidents() {
  console.log('🚨 Seeding Incident Management data...');

  // Seed Incident Types
  console.log('  → Seeding incident types...');
  for (const type of incidentTypes) {
    // Check if exists first, then create or skip
    const existing = await prisma.incidentType.findFirst({
      where: { name: type.name, organisationId: null },
    });
    if (!existing) {
      await prisma.incidentType.create({
        data: {
          name: type.name,
          description: type.description,
          category: type.category as IncidentCategory,
          defaultSeverity: type.defaultSeverity as IncidentSeverity,
          typicalConfidentialityImpact: type.typicalConfidentialityImpact,
          typicalIntegrityImpact: type.typicalIntegrityImpact,
          typicalAvailabilityImpact: type.typicalAvailabilityImpact,
          requiresLawEnforcement: type.requiresLawEnforcement,
          sortOrder: type.sortOrder,
          isActive: true,
          organisationId: null, // System default
        },
      });
    }
  }
  console.log(`    ✓ ${incidentTypes.length} incident types seeded`);

  // Seed Attack Vectors
  console.log('  → Seeding attack vectors...');
  for (const vector of attackVectors) {
    await prisma.attackVector.upsert({
      where: { mitreAttackId: vector.mitreAttackId },
      update: {},
      create: {
        name: vector.name,
        description: vector.description,
        mitreAttackId: vector.mitreAttackId,
        mitreAttackName: vector.mitreAttackName,
        mitreTactics: vector.mitreTactics,
        isActive: true,
      },
    });
  }
  console.log(`    ✓ ${attackVectors.length} attack vectors seeded`);

  // Note: Regulatory authorities removed (model no longer in schema)

  console.log('✅ Incident Management seed complete!\n');
}

// Run if executed directly
if (require.main === module) {
  seedIncidents()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

