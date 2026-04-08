import { PrismaClient } from '@prisma/client';
import { DemoContext } from './index';

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function seedRelationships(
  prisma: PrismaClient,
  ctx: DemoContext,
): Promise<void> {
  // ============================================
  // 1. INCIDENT TYPES (12)
  // ============================================

  const incidentTypeDefs = [
    { name: 'Ransomware Attack', description: 'Malicious software that encrypts data and demands payment for decryption keys. Includes crypto-ransomware, locker ransomware, and double extortion variants.', category: 'MALWARE' as const, defaultSeverity: 'CRITICAL' as const, typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: true, requiresLawEnforcement: true, sortOrder: 1 },
    { name: 'Phishing Campaign', description: 'Social engineering attacks using fraudulent emails, messages, or websites to trick users into revealing credentials, installing malware, or transferring funds.', category: 'PHISHING' as const, defaultSeverity: 'MEDIUM' as const, typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: false, sortOrder: 2 },
    { name: 'Spear Phishing / BEC', description: 'Targeted phishing directed at specific individuals or roles, including business email compromise (BEC) and CEO fraud attempts.', category: 'PHISHING' as const, defaultSeverity: 'HIGH' as const, typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 3 },
    { name: 'DDoS Attack', description: 'Distributed denial-of-service attacks aimed at overwhelming network bandwidth or application resources to disrupt service availability.', category: 'DENIAL_OF_SERVICE' as const, defaultSeverity: 'HIGH' as const, typicalConfidentialityImpact: false, typicalIntegrityImpact: false, typicalAvailabilityImpact: true, requiresLawEnforcement: false, sortOrder: 4 },
    { name: 'Credential Stuffing', description: 'Automated use of stolen username/password pairs from third-party breaches to gain unauthorised access to accounts and systems.', category: 'UNAUTHORIZED_ACCESS' as const, defaultSeverity: 'HIGH' as const, typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: false, sortOrder: 5 },
    { name: 'Web Application Attack', description: 'Exploitation of web application vulnerabilities including XSS, SQL injection, CSRF, SSRF, and insecure deserialization.', category: 'UNAUTHORIZED_ACCESS' as const, defaultSeverity: 'MEDIUM' as const, typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: false, requiresLawEnforcement: false, sortOrder: 6 },
    { name: 'Cloud Infrastructure Failure', description: 'Unplanned outages or degradation of cloud infrastructure services affecting availability of hosted applications and data.', category: 'SYSTEM_FAILURE' as const, defaultSeverity: 'HIGH' as const, typicalConfidentialityImpact: false, typicalIntegrityImpact: false, typicalAvailabilityImpact: true, requiresLawEnforcement: false, sortOrder: 7 },
    { name: 'Insider Threat', description: 'Malicious or negligent actions by employees, contractors, or trusted third parties that compromise information security.', category: 'INSIDER_THREAT' as const, defaultSeverity: 'HIGH' as const, typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 8 },
    { name: 'Supply Chain Compromise', description: 'Attack conducted through a trusted third-party vendor, software dependency, or service provider.', category: 'SUPPLY_CHAIN' as const, defaultSeverity: 'CRITICAL' as const, typicalConfidentialityImpact: true, typicalIntegrityImpact: true, typicalAvailabilityImpact: true, requiresLawEnforcement: true, sortOrder: 9 },
    { name: 'Data Breach / Exfiltration', description: 'Unauthorised access to and extraction of sensitive data including PII, cardholder data, or trade secrets.', category: 'DATA_BREACH' as const, defaultSeverity: 'CRITICAL' as const, typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: true, sortOrder: 10 },
    { name: 'Physical Security Incident', description: 'Unauthorised physical access, tailgating, theft of equipment, or suspicious items found on premises.', category: 'PHYSICAL' as const, defaultSeverity: 'LOW' as const, typicalConfidentialityImpact: false, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: false, sortOrder: 11 },
    { name: 'Third-Party Data Processing Violation', description: 'Vendor or partner breaches data processing agreement terms, including unauthorised data transfers, processing outside agreed jurisdictions, or failure to meet security requirements.', category: 'OTHER' as const, defaultSeverity: 'MEDIUM' as const, typicalConfidentialityImpact: true, typicalIntegrityImpact: false, typicalAvailabilityImpact: false, requiresLawEnforcement: false, sortOrder: 12 },
  ];

  const incidentTypeIds: Record<string, string> = {};
  for (const def of incidentTypeDefs) {
    const it = await prisma.incidentType.create({
      data: { ...def, organisationId: ctx.orgId, createdById: ctx.users.ciso },
    });
    incidentTypeIds[def.name] = it.id;
  }
  console.log('    12 incident types created');

  // ============================================
  // 2. ATTACK VECTORS (10, MITRE ATT&CK aligned)
  // ============================================

  const attackVectorDefs = [
    { name: 'Phishing', description: 'Adversaries send phishing messages to gain access to victim systems.', mitreAttackId: 'T1566', mitreAttackName: 'Phishing', mitreTactics: ['initial-access'] },
    { name: 'Exploit Public-Facing Application', description: 'Adversaries exploit vulnerabilities in internet-facing applications such as web servers, APIs, and portals.', mitreAttackId: 'T1190', mitreAttackName: 'Exploit Public-Facing Application', mitreTactics: ['initial-access'] },
    { name: 'Valid Accounts', description: 'Adversaries obtain and abuse credentials of existing accounts to gain initial access, persistence, or privilege escalation.', mitreAttackId: 'T1078', mitreAttackName: 'Valid Accounts', mitreTactics: ['defense-evasion', 'persistence', 'privilege-escalation', 'initial-access'] },
    { name: 'Network Denial of Service', description: 'Adversaries perform network-based denial of service attacks to degrade or block availability of targeted resources.', mitreAttackId: 'T1498', mitreAttackName: 'Network Denial of Service', mitreTactics: ['impact'] },
    { name: 'Supply Chain Compromise', description: 'Adversaries manipulate products or product delivery mechanisms prior to receipt by the final consumer.', mitreAttackId: 'T1195', mitreAttackName: 'Supply Chain Compromise', mitreTactics: ['initial-access'] },
    { name: 'Drive-by Compromise', description: 'Adversaries gain access to a system through a user visiting a website during normal browsing, exploiting browser vulnerabilities.', mitreAttackId: 'T1189', mitreAttackName: 'Drive-by Compromise', mitreTactics: ['initial-access'] },
    { name: 'Brute Force', description: 'Adversaries use brute force techniques to attempt access to accounts when passwords are unknown or password hashes are obtained.', mitreAttackId: 'T1110', mitreAttackName: 'Brute Force', mitreTactics: ['credential-access'] },
    { name: 'Data Encrypted for Impact', description: 'Adversaries encrypt data on target systems to interrupt availability, including ransomware.', mitreAttackId: 'T1486', mitreAttackName: 'Data Encrypted for Impact', mitreTactics: ['impact'] },
    { name: 'Exfiltration Over Web Service', description: 'Adversaries use existing, legitimate external web services to exfiltrate data from a network.', mitreAttackId: 'T1567', mitreAttackName: 'Exfiltration Over Web Service', mitreTactics: ['exfiltration'] },
    { name: 'Exploitation for Privilege Escalation', description: 'Adversaries exploit software vulnerabilities to escalate privileges on a system.', mitreAttackId: 'T1068', mitreAttackName: 'Exploitation for Privilege Escalation', mitreTactics: ['privilege-escalation'] },
  ];

  const attackVectorIds: Record<string, string> = {};
  for (const def of attackVectorDefs) {
    const av = await prisma.attackVector.create({ data: def });
    attackVectorIds[def.mitreAttackId] = av.id;
  }
  console.log('    10 attack vectors created');

  // ============================================
  // 3. LINK INCIDENTS TO TYPES & ATTACK VECTORS
  // ============================================

  const incidentTypeLinks: { incRef: string; typeName: string; attackVectorMitre?: string }[] = [
    { incRef: 'INC-2026-001', typeName: 'Phishing Campaign', attackVectorMitre: 'T1566' },
    { incRef: 'INC-2026-002', typeName: 'Cloud Infrastructure Failure' },
    { incRef: 'INC-2026-003', typeName: 'Credential Stuffing', attackVectorMitre: 'T1078' },
    { incRef: 'INC-2026-004', typeName: 'Web Application Attack', attackVectorMitre: 'T1190' },
    { incRef: 'INC-2026-005', typeName: 'Physical Security Incident' },
    { incRef: 'INC-2026-006', typeName: 'Credential Stuffing', attackVectorMitre: 'T1078' },
    { incRef: 'INC-2026-007', typeName: 'DDoS Attack', attackVectorMitre: 'T1498' },
    { incRef: 'INC-2026-008', typeName: 'Third-Party Data Processing Violation' },
  ];

  for (const link of incidentTypeLinks) {
    const incId = ctx.incidentIds[link.incRef];
    if (!incId) continue;
    const updateData: Record<string, string> = {};
    if (incidentTypeIds[link.typeName]) {
      updateData['incidentTypeId'] = incidentTypeIds[link.typeName]!;
    }
    if (link.attackVectorMitre && attackVectorIds[link.attackVectorMitre]) {
      updateData['attackVectorId'] = attackVectorIds[link.attackVectorMitre]!;
    }
    if (Object.keys(updateData).length > 0) {
      await prisma.incident.update({ where: { id: incId }, data: updateData });
    }
  }
  console.log('    8 incidents linked to types and attack vectors');

  // ============================================
  // 4. INCIDENT-ASSET LINKS (15)
  // Which assets were affected by each incident?
  // ============================================

  const incidentAssetLinks: { incRef: string; assetTag: string; impactType: 'COMPROMISED' | 'AFFECTED' | 'AT_RISK'; notes: string }[] = [
    // INC-001 Phishing — affected email systems and operations endpoints
    { incRef: 'INC-2026-001', assetTag: 'AST-LPT-001', impactType: 'AT_RISK', notes: 'Executive laptop potentially targeted by phishing campaign' },
    { incRef: 'INC-2026-001', assetTag: 'AST-NET-003', impactType: 'AT_RISK', notes: 'VPN gateway — credential compromise could have enabled remote access' },
    // INC-002 AWS AZ degradation — payment servers affected
    { incRef: 'INC-2026-002', assetTag: 'AST-SRV-001', impactType: 'AFFECTED', notes: 'Payment API server 1 experienced latency spikes during AZ degradation' },
    { incRef: 'INC-2026-002', assetTag: 'AST-SRV-002', impactType: 'AFFECTED', notes: 'Payment API server 2 activated as failover during AZ degradation' },
    { incRef: 'INC-2026-002', assetTag: 'AST-CLD-001', impactType: 'AFFECTED', notes: 'AWS production account eu-west-1a zone degraded' },
    // INC-003 Unauthorized API access — payment gateway and customer DB targeted
    { incRef: 'INC-2026-003', assetTag: 'AST-APP-001', impactType: 'COMPROMISED', notes: 'Payment gateway API endpoint targeted with stolen merchant credentials' },
    { incRef: 'INC-2026-003', assetTag: 'AST-DB-001', impactType: 'AT_RISK', notes: 'Customer database was the target of credential stuffing attack' },
    // INC-004 XSS vulnerability — merchant portal affected
    { incRef: 'INC-2026-004', assetTag: 'AST-APP-002', impactType: 'COMPROMISED', notes: 'Reflected XSS vulnerability exploited in merchant portal search endpoint' },
    { incRef: 'INC-2026-004', assetTag: 'AST-SRV-003', impactType: 'AFFECTED', notes: 'Merchant portal server hosting the vulnerable application' },
    // INC-006 Suspicious login — admin portal and VPN
    { incRef: 'INC-2026-006', assetTag: 'AST-NET-003', impactType: 'AT_RISK', notes: 'VPN gateway used for impossible travel login' },
    { incRef: 'INC-2026-006', assetTag: 'AST-LPT-002', impactType: 'AT_RISK', notes: 'CISO laptop — admin portal access from anomalous location' },
    // INC-007 DDoS — payment API and cloud infra
    { incRef: 'INC-2026-007', assetTag: 'AST-APP-001', impactType: 'AFFECTED', notes: 'Payment gateway API under direct DDoS attack targeting /v2/payments endpoint' },
    { incRef: 'INC-2026-007', assetTag: 'AST-SRV-001', impactType: 'AFFECTED', notes: 'Primary payment server experiencing traffic saturation' },
    { incRef: 'INC-2026-007', assetTag: 'AST-SRV-002', impactType: 'AFFECTED', notes: 'Secondary payment server absorbing overflow traffic' },
    { incRef: 'INC-2026-007', assetTag: 'AST-NET-001', impactType: 'AFFECTED', notes: 'Dublin firewall processing elevated traffic volumes' },
  ];

  for (const link of incidentAssetLinks) {
    const incId = ctx.incidentIds[link.incRef];
    const assetId = ctx.assetIds[link.assetTag];
    if (incId && assetId) {
      await prisma.incidentAsset.create({
        data: { incidentId: incId, assetId, impactType: link.impactType, notes: link.notes },
      });
    }
  }
  console.log('    15 incident-asset links created');

  // ============================================
  // 5. INCIDENT-CONTROL LINKS (12)
  // Which controls failed, were bypassed, or were effective?
  // ============================================

  const incidentControlLinks: { incRef: string; controlId: string; linkType: string; notes: string }[] = [
    // INC-001 Phishing
    { incRef: 'INC-2026-001', controlId: '6.3', linkType: 'effective', notes: 'Security awareness training enabled staff to avoid clicking links' },
    { incRef: 'INC-2026-001', controlId: '8.23', linkType: 'effective', notes: 'Email gateway web filtering blocked malicious URLs' },
    // INC-002 AWS AZ
    { incRef: 'INC-2026-002', controlId: '5.30', linkType: 'effective', notes: 'BCP procedures triggered failover to secondary AZ' },
    { incRef: 'INC-2026-002', controlId: '8.14', linkType: 'failed', notes: 'Redundancy failover took 12 mins, exceeding 5-min RTO target' },
    // INC-003 Credential stuffing
    { incRef: 'INC-2026-003', controlId: '8.5', linkType: 'effective', notes: 'API gateway rate limiter prevented successful authentication' },
    { incRef: 'INC-2026-003', controlId: '5.15', linkType: 'effective', notes: 'Access controls prevented data access despite valid credentials' },
    // INC-004 XSS
    { incRef: 'INC-2026-004', controlId: '8.28', linkType: 'failed', notes: 'Secure coding practices not applied — input sanitisation missing' },
    { incRef: 'INC-2026-004', controlId: '8.29', linkType: 'bypassed', notes: 'XSS was not detected in last penetration test — scope gap' },
    // INC-006 Suspicious login
    { incRef: 'INC-2026-006', controlId: '8.16', linkType: 'effective', notes: 'SIEM impossible travel rule detected anomalous login' },
    { incRef: 'INC-2026-006', controlId: '8.5', linkType: 'effective', notes: 'MFA was satisfied but session was revoked promptly' },
    // INC-007 DDoS
    { incRef: 'INC-2026-007', controlId: '8.20', linkType: 'effective', notes: 'Network controls and AWS Shield mitigated bulk of DDoS traffic' },
    { incRef: 'INC-2026-007', controlId: '5.30', linkType: 'effective', notes: 'Incident response and BCP procedures activated for merchant notification' },
  ];

  for (const link of incidentControlLinks) {
    const incId = ctx.incidentIds[link.incRef];
    const controlDbId = ctx.controlIds[link.controlId];
    if (incId && controlDbId) {
      await prisma.incidentControl.create({
        data: { incidentId: incId, controlId: controlDbId, linkType: link.linkType, notes: link.notes },
      });
    }
  }
  console.log('    12 incident-control links created');

  // ============================================
  // 6. INCIDENT-NONCONFORMITY LINKS (4)
  // ============================================

  const incidentNcLinks: { incRef: string; ncId: string; linkType: string; notes: string }[] = [
    { incRef: 'INC-2026-003', ncId: 'NC-2026-001', linkType: 'revealed_by', notes: 'Credential stuffing incident highlighted incomplete access review logs' },
    { incRef: 'INC-2026-004', ncId: 'NC-2026-004', linkType: 'caused_by', notes: 'XSS vulnerability was in scope excluded from pen test — NC raised' },
    { incRef: 'INC-2026-002', ncId: 'NC-2026-002', linkType: 'revealed_by', notes: 'AZ degradation exposed staging DB encryption gap during failover analysis' },
    { incRef: 'INC-2026-008', ncId: 'NC-2026-005', linkType: 'revealed_by', notes: 'Vendor DPA violation highlighted third-party SLA monitoring gaps' },
  ];

  for (const link of incidentNcLinks) {
    const incId = ctx.incidentIds[link.incRef];
    const ncDbId = ctx.ncIds[link.ncId];
    if (incId && ncDbId) {
      await prisma.incidentNonconformity.create({
        data: { incidentId: incId, nonconformityId: ncDbId, linkType: link.linkType, notes: link.notes },
      });
    }
  }
  console.log('    4 incident-nonconformity links created');

  // ============================================
  // 7. INCIDENT RELATIONS (3)
  // ============================================

  const incidentRelations: { sourceRef: string; relatedRef: string; relationType: string; notes: string }[] = [
    { sourceRef: 'INC-2026-006', relatedRef: 'INC-2026-003', relationType: 'related_to', notes: 'Both incidents involve credential-based attacks — possible same threat actor' },
    { sourceRef: 'INC-2026-007', relatedRef: 'INC-2026-002', relationType: 'related_to', notes: 'Both impact payment API availability — shared BCP playbook' },
    { sourceRef: 'INC-2026-004', relatedRef: 'INC-2026-003', relationType: 'related_to', notes: 'Both target merchant-facing services — may indicate reconnaissance campaign' },
  ];

  for (const rel of incidentRelations) {
    const srcId = ctx.incidentIds[rel.sourceRef];
    const relId = ctx.incidentIds[rel.relatedRef];
    if (srcId && relId) {
      await prisma.incidentRelation.create({
        data: { sourceIncidentId: srcId, relatedIncidentId: relId, relationType: rel.relationType, notes: rel.notes, createdById: ctx.users.ciso },
      });
    }
  }
  console.log('    3 incident relations created');

  // ============================================
  // 8. INCIDENT-SCENARIO LINKS (8)
  // Which risk scenarios materialized as actual incidents?
  // ============================================

  const incidentScenarioLinks: { incRef: string; scenarioId: string; linkType: 'MATERIALIZED' | 'RELATED' | 'NEAR_MISS'; notes: string; actualImpactLevel?: number }[] = [
    { incRef: 'INC-2026-001', scenarioId: 'R-08-S02', linkType: 'NEAR_MISS', notes: 'Phishing campaign matches credential harvesting via fake SSO scenario — no credentials compromised', actualImpactLevel: 2 },
    { incRef: 'INC-2026-002', scenarioId: 'R-07-S01', linkType: 'RELATED', notes: 'AWS AZ degradation is related to but less severe than full regional outage scenario', actualImpactLevel: 3 },
    { incRef: 'INC-2026-003', scenarioId: 'R-03-S02', linkType: 'NEAR_MISS', notes: 'API credential stuffing mirrors broken authentication scenario — rate limiter prevented exploitation', actualImpactLevel: 2 },
    { incRef: 'INC-2026-004', scenarioId: 'R-12-S01', linkType: 'MATERIALIZED', notes: 'XSS vulnerability exploitation is a materialization of web app attack scenario on merchant portal', actualImpactLevel: 3 },
    { incRef: 'INC-2026-006', scenarioId: 'R-03-S02', linkType: 'RELATED', notes: 'Suspicious login may indicate compromised credentials — related to authentication scenario', actualImpactLevel: 2 },
    { incRef: 'INC-2026-007', scenarioId: 'R-06-S01', linkType: 'MATERIALIZED', notes: 'DDoS attack on payment API is a direct materialization of the volumetric DDoS scenario', actualImpactLevel: 3 },
    { incRef: 'INC-2026-007', scenarioId: 'R-06-S02', linkType: 'RELATED', notes: 'DDoS also had application-layer components targeting auth endpoints', actualImpactLevel: 2 },
    { incRef: 'INC-2026-008', scenarioId: 'R-14-S02', linkType: 'MATERIALIZED', notes: 'Vendor processing data outside EU directly materializes cross-border transfer violation scenario', actualImpactLevel: 2 },
  ];

  for (const link of incidentScenarioLinks) {
    const incId = ctx.incidentIds[link.incRef];
    const scenId = ctx.scenarioIds[link.scenarioId];
    if (incId && scenId) {
      await prisma.incidentScenario.create({
        data: {
          incidentId: incId,
          scenarioId: scenId,
          linkType: link.linkType,
          linkNotes: link.notes,
          actualImpactLevel: link.actualImpactLevel,
          triggeredReassessment: link.linkType === 'MATERIALIZED',
          reassessmentDate: link.linkType === 'MATERIALIZED' ? daysAgo(7) : undefined,
          createdById: ctx.users.ciso,
        },
      });
    }
  }
  console.log('    8 incident-scenario links created');

  // ============================================
  // 9. INCIDENT EVIDENCE (8)
  // Forensic evidence collected per incident
  // ============================================

  const incidentEvidenceDefs: { incRef: string; evidenceType: 'LOG' | 'SCREENSHOT' | 'EMAIL' | 'NETWORK_CAPTURE' | 'DOCUMENT'; title: string; description: string; collectedAtDaysAgo: number }[] = [
    { incRef: 'INC-2026-001', evidenceType: 'EMAIL', title: 'Phishing email sample — quarantined', description: 'Original phishing email with full headers, extracted from Proofpoint quarantine. Contains malicious URL and sender domain spoofing evidence.', collectedAtDaysAgo: 74 },
    { incRef: 'INC-2026-001', evidenceType: 'LOG', title: 'Email gateway quarantine logs', description: 'Proofpoint email gateway logs showing all 47 quarantined emails with sender IPs, timestamps, and matching rule IDs.', collectedAtDaysAgo: 74 },
    { incRef: 'INC-2026-002', evidenceType: 'LOG', title: 'AWS CloudWatch metrics during AZ degradation', description: 'CloudWatch metrics export showing eu-west-1a network packet loss rates, API latency p99, and Route 53 failover events during the incident window.', collectedAtDaysAgo: 59 },
    { incRef: 'INC-2026-003', evidenceType: 'LOG', title: 'Splunk SIEM correlation rule output', description: 'SIEM alert details showing 1,240 failed API auth attempts across 14 merchant accounts within 20-minute window from Romanian ASN.', collectedAtDaysAgo: 49 },
    { incRef: 'INC-2026-004', evidenceType: 'SCREENSHOT', title: 'XSS payload captured in WAF logs', description: 'WAF log excerpt showing the reflected XSS payload in the /transactions/search endpoint parameter, plus CSP violation report.', collectedAtDaysAgo: 39 },
    { incRef: 'INC-2026-006', evidenceType: 'LOG', title: 'Impossible travel SIEM alert details', description: 'Splunk alert showing admin user authentication from Berlin at 08:12 UTC and Lagos at 08:47 UTC with risk score 87/100.', collectedAtDaysAgo: 4 },
    { incRef: 'INC-2026-007', evidenceType: 'NETWORK_CAPTURE', title: 'DDoS traffic analysis from AWS Shield', description: 'AWS Shield Advanced mitigation report showing attack vectors (UDP flood, HTTP GET flood), peak traffic 14 Gbps, and source botnet analysis.', collectedAtDaysAgo: 1 },
    { incRef: 'INC-2026-008', evidenceType: 'DOCUMENT', title: 'Vendor self-disclosure notification', description: 'Written notification from DataInsight GmbH confirming unauthorised data processing in US-East-1 region with remediation evidence and deletion confirmation.', collectedAtDaysAgo: 0 },
  ];

  for (const evd of incidentEvidenceDefs) {
    const incId = ctx.incidentIds[evd.incRef];
    if (incId) {
      await prisma.incidentEvidence.create({
        data: {
          incidentId: incId,
          evidenceType: evd.evidenceType,
          title: evd.title,
          description: evd.description,
          collectedAt: daysAgo(evd.collectedAtDaysAgo),
          collectedById: ctx.users.securityLead,
          isForensicallySound: true,
          storageLocation: 'ISMS Evidence Repository / Incidents',
          createdById: ctx.users.securityLead,
        },
      });
    }
  }
  console.log('    8 incident evidence records created');

  // ============================================
  // 10. ASSET RELATIONSHIPS (25)
  // Infrastructure dependency graph
  // ============================================

  const assetRelDefs: { from: string; to: string; type: 'DEPENDS_ON' | 'RUNS_ON' | 'HOSTED_ON' | 'CONNECTS_TO' | 'STORES_DATA_ON' | 'READS_FROM' | 'PROTECTED_BY' | 'MONITORED_BY' | 'BACKED_UP_TO' | 'FAILS_OVER_TO' | 'AUTHENTICATES_VIA' | 'CONTAINS'; isCritical: boolean; description: string }[] = [
    // Payment Gateway App runs on servers
    { from: 'AST-APP-001', to: 'AST-SRV-001', type: 'RUNS_ON', isCritical: true, description: 'Payment gateway primary instance runs on payment API server 1' },
    { from: 'AST-APP-001', to: 'AST-SRV-002', type: 'RUNS_ON', isCritical: true, description: 'Payment gateway secondary instance runs on payment API server 2' },
    // Merchant Portal runs on its server
    { from: 'AST-APP-002', to: 'AST-SRV-003', type: 'RUNS_ON', isCritical: true, description: 'Merchant portal application runs on dedicated merchant portal server' },
    // Fraud Detection runs on its server
    { from: 'AST-APP-003', to: 'AST-SRV-004', type: 'RUNS_ON', isCritical: true, description: 'Fraud detection engine runs on dedicated high-performance server' },
    // Servers run on K8s worker nodes
    { from: 'AST-SRV-001', to: 'AST-VM-001', type: 'HOSTED_ON', isCritical: true, description: 'Payment API server hosted on Kubernetes worker node 1' },
    { from: 'AST-SRV-002', to: 'AST-VM-002', type: 'HOSTED_ON', isCritical: true, description: 'Payment API server 2 hosted on Kubernetes worker node 2' },
    // K8s nodes hosted on AWS
    { from: 'AST-VM-001', to: 'AST-CLD-001', type: 'HOSTED_ON', isCritical: true, description: 'K8s worker node 1 in AWS production account' },
    { from: 'AST-VM-002', to: 'AST-CLD-001', type: 'HOSTED_ON', isCritical: true, description: 'K8s worker node 2 in AWS production account' },
    // Applications depend on databases
    { from: 'AST-APP-001', to: 'AST-DB-001', type: 'DEPENDS_ON', isCritical: true, description: 'Payment gateway reads/writes customer records and merchant profiles' },
    { from: 'AST-APP-001', to: 'AST-DB-002', type: 'DEPENDS_ON', isCritical: true, description: 'Payment gateway writes all transaction records' },
    { from: 'AST-APP-002', to: 'AST-DB-001', type: 'READS_FROM', isCritical: true, description: 'Merchant portal reads customer and merchant data' },
    { from: 'AST-APP-003', to: 'AST-DB-002', type: 'READS_FROM', isCritical: true, description: 'Fraud engine reads transaction patterns for ML scoring' },
    { from: 'AST-DB-003', to: 'AST-DB-002', type: 'READS_FROM', isCritical: false, description: 'Analytics DB replicates aggregated data from transactions DB' },
    // Databases hosted on AWS
    { from: 'AST-DB-001', to: 'AST-CLD-001', type: 'HOSTED_ON', isCritical: true, description: 'Customer database on AWS RDS in production account' },
    { from: 'AST-DB-002', to: 'AST-CLD-001', type: 'HOSTED_ON', isCritical: true, description: 'Transaction database on AWS RDS in production account' },
    { from: 'AST-DB-003', to: 'AST-CLD-001', type: 'HOSTED_ON', isCritical: false, description: 'Analytics database on AWS RDS in production account' },
    // Network dependencies
    { from: 'AST-SRV-001', to: 'AST-NET-001', type: 'PROTECTED_BY', isCritical: true, description: 'Payment server protected by Dublin firewall' },
    { from: 'AST-SRV-002', to: 'AST-NET-001', type: 'PROTECTED_BY', isCritical: true, description: 'Payment server 2 protected by Dublin firewall' },
    { from: 'AST-NET-002', to: 'AST-NET-001', type: 'CONNECTS_TO', isCritical: true, description: 'Berlin firewall connects to Dublin via IPSec tunnel' },
    { from: 'AST-NET-003', to: 'AST-CLD-001', type: 'HOSTED_ON', isCritical: true, description: 'VPN gateway hosted in AWS production account' },
    // Failover relationships
    { from: 'AST-SRV-001', to: 'AST-SRV-002', type: 'FAILS_OVER_TO', isCritical: true, description: 'Primary payment server fails over to secondary' },
    // Laptops connect via VPN
    { from: 'AST-LPT-001', to: 'AST-NET-003', type: 'AUTHENTICATES_VIA', isCritical: false, description: 'CEO laptop connects to corporate network via VPN' },
    { from: 'AST-LPT-002', to: 'AST-NET-003', type: 'AUTHENTICATES_VIA', isCritical: false, description: 'CISO laptop connects to corporate network via VPN' },
    { from: 'AST-LPT-003', to: 'AST-NET-003', type: 'AUTHENTICATES_VIA', isCritical: false, description: 'CTO laptop connects to corporate network via VPN' },
    // Fraud detection depends on payment gateway (inline scoring)
    { from: 'AST-APP-001', to: 'AST-APP-003', type: 'DEPENDS_ON', isCritical: true, description: 'Payment gateway calls fraud engine for real-time transaction scoring' },
  ];

  for (const rel of assetRelDefs) {
    const fromId = ctx.assetIds[rel.from];
    const toId = ctx.assetIds[rel.to];
    if (fromId && toId) {
      await prisma.assetRelationship.create({
        data: { fromAssetId: fromId, toAssetId: toId, relationshipType: rel.type, isCritical: rel.isCritical, description: rel.description, createdById: ctx.users.cto },
      });
    }
  }
  console.log('    25 asset relationships created');

  // ============================================
  // 11. ASSET-BUSINESS PROCESS LINKS (20)
  // ============================================

  const assetBpLinks: { assetTag: string; processCode: string; criticality: string; role: string }[] = [
    // Payment Processing process
    { assetTag: 'AST-APP-001', processCode: 'PROC-PAY', criticality: 'critical', role: 'Core payment gateway — processes all transactions' },
    { assetTag: 'AST-SRV-001', processCode: 'PROC-PAY', criticality: 'critical', role: 'Primary compute for payment processing' },
    { assetTag: 'AST-SRV-002', processCode: 'PROC-PAY', criticality: 'critical', role: 'Redundant compute for payment processing' },
    { assetTag: 'AST-DB-002', processCode: 'PROC-PAY', criticality: 'critical', role: 'Transaction data persistence' },
    { assetTag: 'AST-NET-001', processCode: 'PROC-PAY', criticality: 'critical', role: 'Network perimeter protection for payment traffic' },
    // Merchant Onboarding process
    { assetTag: 'AST-APP-002', processCode: 'PROC-ONBOARD', criticality: 'critical', role: 'Merchant self-service portal for onboarding' },
    { assetTag: 'AST-DB-001', processCode: 'PROC-ONBOARD', criticality: 'critical', role: 'Stores merchant profiles and KYC data' },
    { assetTag: 'AST-SRV-003', processCode: 'PROC-ONBOARD', criticality: 'high', role: 'Hosts merchant portal application' },
    // Fraud Detection process
    { assetTag: 'AST-APP-003', processCode: 'PROC-FRAUD', criticality: 'critical', role: 'Real-time fraud scoring engine' },
    { assetTag: 'AST-SRV-004', processCode: 'PROC-FRAUD', criticality: 'critical', role: 'Compute for ML model inference' },
    { assetTag: 'AST-DB-002', processCode: 'PROC-FRAUD', criticality: 'high', role: 'Transaction pattern data source' },
    { assetTag: 'AST-DB-003', processCode: 'PROC-FRAUD', criticality: 'medium', role: 'Historical analytics for model training' },
    // Regulatory Reporting process
    { assetTag: 'AST-DB-003', processCode: 'PROC-REG', criticality: 'high', role: 'Analytics database for regulatory report generation' },
    { assetTag: 'AST-DB-002', processCode: 'PROC-REG', criticality: 'high', role: 'Transaction records for regulatory audit trail' },
    { assetTag: 'AST-DB-001', processCode: 'PROC-REG', criticality: 'medium', role: 'Customer data for GDPR and KYC reporting' },
    // Incident Response process
    { assetTag: 'AST-NET-001', processCode: 'PROC-IR', criticality: 'critical', role: 'Firewall logs for incident investigation' },
    { assetTag: 'AST-NET-003', processCode: 'PROC-IR', criticality: 'high', role: 'VPN access logs for remote incident response' },
    { assetTag: 'AST-LPT-002', processCode: 'PROC-IR', criticality: 'high', role: 'CISO endpoint for incident management' },
    { assetTag: 'AST-CLD-001', processCode: 'PROC-IR', criticality: 'critical', role: 'AWS CloudTrail and CloudWatch for cloud forensics' },
    { assetTag: 'AST-NET-002', processCode: 'PROC-IR', criticality: 'medium', role: 'Berlin office firewall logs for incident investigation' },
  ];

  for (const link of assetBpLinks) {
    const assetId = ctx.assetIds[link.assetTag];
    const bpId = ctx.businessProcessIds[link.processCode];
    if (assetId && bpId) {
      await prisma.assetBusinessProcess.create({
        data: { assetId, businessProcessId: bpId, criticality: link.criticality, role: link.role },
      });
    }
  }
  console.log('    20 asset-business process links created');

  // ============================================
  // 12. ASSET-CONTROL LINKS (25)
  // Which controls protect which assets?
  // ============================================

  const assetControlLinks: { assetTag: string; controlId: string; status: string; notes: string }[] = [
    // Payment gateway — critical controls
    { assetTag: 'AST-APP-001', controlId: '8.24', status: 'implemented', notes: 'TLS 1.3 and AES-256-GCM encryption in transit and at rest' },
    { assetTag: 'AST-APP-001', controlId: '8.28', status: 'implemented', notes: 'Secure coding practices with SAST/DAST in CI/CD' },
    { assetTag: 'AST-APP-001', controlId: '8.5', status: 'implemented', notes: 'OAuth 2.0 with PKCE for merchant API authentication' },
    { assetTag: 'AST-APP-001', controlId: '8.29', status: 'partial', notes: 'Annual pen test — v2 API scope gap identified in NC-2026-004' },
    // Customer DB — data protection controls
    { assetTag: 'AST-DB-001', controlId: '8.24', status: 'implemented', notes: 'AWS KMS encryption with customer-managed keys' },
    { assetTag: 'AST-DB-001', controlId: '5.15', status: 'implemented', notes: 'Role-based access with quarterly access reviews' },
    { assetTag: 'AST-DB-001', controlId: '8.15', status: 'implemented', notes: 'Database activity logging via AWS CloudTrail and RDS audit logs' },
    // Transaction DB
    { assetTag: 'AST-DB-002', controlId: '8.24', status: 'implemented', notes: 'AES-256-GCM encryption with continuous WAL backup' },
    { assetTag: 'AST-DB-002', controlId: '8.13', status: 'implemented', notes: 'Continuous WAL streaming with 7-year retention for PCI compliance' },
    { assetTag: 'AST-DB-002', controlId: '8.15', status: 'implemented', notes: 'Full query logging for financial audit trail' },
    // Merchant Portal
    { assetTag: 'AST-APP-002', controlId: '8.28', status: 'partial', notes: 'Secure coding in place but XSS was found — remediation completed' },
    { assetTag: 'AST-APP-002', controlId: '8.5', status: 'implemented', notes: 'Session management with MFA for merchant admin users' },
    // Fraud Detection
    { assetTag: 'AST-APP-003', controlId: '8.24', status: 'implemented', notes: 'Encrypted model inference and data pipelines' },
    { assetTag: 'AST-APP-003', controlId: '8.16', status: 'implemented', notes: 'Real-time monitoring of model performance and anomaly detection' },
    // Dublin Firewall
    { assetTag: 'AST-NET-001', controlId: '8.20', status: 'implemented', notes: 'PCI DSS network segmentation and IPS enforcement' },
    { assetTag: 'AST-NET-001', controlId: '8.15', status: 'implemented', notes: 'Firewall rule change logging with SIEM integration' },
    // VPN Gateway
    { assetTag: 'AST-NET-003', controlId: '8.5', status: 'implemented', notes: 'MFA enforced for all VPN connections via Okta' },
    { assetTag: 'AST-NET-003', controlId: '8.24', status: 'implemented', notes: 'WireGuard/IPSec encryption for all VPN tunnels' },
    // K8s Workers
    { assetTag: 'AST-VM-001', controlId: '8.8', status: 'implemented', notes: 'Automated vulnerability scanning and patching via Bottlerocket' },
    { assetTag: 'AST-VM-002', controlId: '8.8', status: 'implemented', notes: 'Automated vulnerability scanning and patching via Bottlerocket' },
    // AWS Production Account
    { assetTag: 'AST-CLD-001', controlId: '5.23', status: 'implemented', notes: 'AWS Organizations SCPs and security baseline configuration' },
    { assetTag: 'AST-CLD-001', controlId: '8.15', status: 'implemented', notes: 'CloudTrail logging for all API calls across the account' },
    // Laptops
    { assetTag: 'AST-LPT-001', controlId: '8.1', status: 'implemented', notes: 'MDM enrollment with FileVault disk encryption' },
    { assetTag: 'AST-LPT-002', controlId: '8.1', status: 'implemented', notes: 'MDM enrollment with EDR and FileVault encryption' },
    { assetTag: 'AST-LPT-003', controlId: '8.1', status: 'implemented', notes: 'MDM enrollment with FileVault disk encryption' },
  ];

  for (const link of assetControlLinks) {
    const assetId = ctx.assetIds[link.assetTag];
    const controlDbId = ctx.controlIds[link.controlId];
    if (assetId && controlDbId) {
      await prisma.assetControl.create({
        data: { assetId, controlId: controlDbId, status: link.status, implementationNotes: link.notes, implementedDate: link.status === 'implemented' ? daysAgo(90) : undefined },
      });
    }
  }
  console.log('    25 asset-control links created');

  // ============================================
  // 13. ASSET-RISK LINKS (15)
  // Which risks affect which assets?
  // ============================================

  const assetRiskLinks: { assetTag: string; riskId: string; impactLevel: string; notes: string }[] = [
    { assetTag: 'AST-APP-001', riskId: 'R-01', impactLevel: 'critical', notes: 'Payment gateway is primary ransomware target' },
    { assetTag: 'AST-DB-002', riskId: 'R-01', impactLevel: 'critical', notes: 'Transaction database encryption would halt all processing' },
    { assetTag: 'AST-APP-001', riskId: 'R-03', impactLevel: 'critical', notes: 'Payment gateway API is the attack surface for data breach' },
    { assetTag: 'AST-DB-001', riskId: 'R-03', impactLevel: 'critical', notes: 'Customer database contains targeted cardholder data' },
    { assetTag: 'AST-APP-001', riskId: 'R-06', impactLevel: 'critical', notes: 'Payment API is the primary DDoS target' },
    { assetTag: 'AST-SRV-001', riskId: 'R-06', impactLevel: 'high', notes: 'Primary server directly impacted by DDoS traffic' },
    { assetTag: 'AST-CLD-001', riskId: 'R-07', impactLevel: 'critical', notes: 'AWS production account hosts all workloads affected by regional outage' },
    { assetTag: 'AST-APP-002', riskId: 'R-12', impactLevel: 'high', notes: 'Merchant portal is the attack surface for privilege escalation' },
    { assetTag: 'AST-APP-003', riskId: 'R-13', impactLevel: 'critical', notes: 'Fraud detection application directly targeted by model poisoning' },
    { assetTag: 'AST-DB-002', riskId: 'R-04', impactLevel: 'critical', notes: 'Transaction database is target for insider settlement manipulation' },
    { assetTag: 'AST-NET-003', riskId: 'R-08', impactLevel: 'high', notes: 'VPN gateway — phished credentials could enable remote access' },
    { assetTag: 'AST-APP-001', riskId: 'R-10', impactLevel: 'critical', notes: 'Payment gateway uses npm dependencies vulnerable to supply chain attack' },
    { assetTag: 'AST-VM-001', riskId: 'R-10', impactLevel: 'high', notes: 'K8s worker runs containers built from potentially compromised CI/CD' },
    { assetTag: 'AST-DB-003', riskId: 'R-14', impactLevel: 'medium', notes: 'Analytics DB may contain data subject to cross-border transfer rules' },
    { assetTag: 'AST-CLD-002', riskId: 'R-15', impactLevel: 'low', notes: 'Staging account could be used for shadow IT experiments' },
  ];

  for (const link of assetRiskLinks) {
    const assetId = ctx.assetIds[link.assetTag];
    const riskDbId = ctx.riskIds[link.riskId];
    if (assetId && riskDbId) {
      await prisma.assetRisk.create({
        data: { assetId, riskId: riskDbId, impactLevel: link.impactLevel, notes: link.notes },
      });
    }
  }
  console.log('    15 asset-risk links created');

  // ============================================
  // 14. CHANGE-ASSET LINKS (8)
  // Which assets are affected by each change?
  // ============================================

  const changeAssetLinks: { changeRef: string; assetTag: string; impactType: string; notes: string }[] = [
    { changeRef: 'CHG-2026-001', assetTag: 'AST-SRV-001', impactType: 'modified', notes: 'TLS configuration updated on payment server 1' },
    { changeRef: 'CHG-2026-001', assetTag: 'AST-SRV-002', impactType: 'modified', notes: 'TLS configuration updated on payment server 2' },
    { changeRef: 'CHG-2026-002', assetTag: 'AST-DB-001', impactType: 'modified', notes: 'PostgreSQL 15 to 16 upgrade — customer database' },
    { changeRef: 'CHG-2026-002', assetTag: 'AST-DB-002', impactType: 'modified', notes: 'PostgreSQL 15 to 16 upgrade — transaction database' },
    { changeRef: 'CHG-2026-002', assetTag: 'AST-DB-003', impactType: 'modified', notes: 'PostgreSQL 15 to 16 upgrade — analytics database' },
    { changeRef: 'CHG-2026-003', assetTag: 'AST-NET-001', impactType: 'modified', notes: 'Firewall rules reconfigured for PCI CDE zone segmentation' },
    { changeRef: 'CHG-2026-004', assetTag: 'AST-VM-001', impactType: 'modified', notes: 'Log4j patched containers redeployed to K8s node 1' },
    { changeRef: 'CHG-2026-004', assetTag: 'AST-VM-002', impactType: 'modified', notes: 'Log4j patched containers redeployed to K8s node 2' },
  ];

  for (const link of changeAssetLinks) {
    const changeId = ctx.changeIds[link.changeRef];
    const assetId = ctx.assetIds[link.assetTag];
    if (changeId && assetId) {
      await prisma.changeAsset.create({
        data: { changeId, assetId, impactType: link.impactType, notes: link.notes },
      });
    }
  }
  console.log('    8 change-asset links created');

  // ============================================
  // 15. RISK SCENARIO - ASSET LINKS (20)
  // Which assets are targeted by each scenario?
  // ============================================

  const scenarioAssetLinks: { scenarioId: string; assetTag: string; isPrimaryTarget: boolean; notes: string }[] = [
    // R-01 Ransomware scenarios
    { scenarioId: 'R-01-S01', assetTag: 'AST-DB-002', isPrimaryTarget: true, notes: 'Transaction database is primary ransomware encryption target' },
    { scenarioId: 'R-01-S01', assetTag: 'AST-SRV-001', isPrimaryTarget: false, notes: 'Payment server lateral movement target' },
    { scenarioId: 'R-01-S02', assetTag: 'AST-NET-003', isPrimaryTarget: true, notes: 'VPN gateway used as entry point via compromised vendor' },
    { scenarioId: 'R-01-S02', assetTag: 'AST-DB-002', isPrimaryTarget: false, notes: 'Transaction database targeted after VPN access' },
    // R-03 API breach scenarios
    { scenarioId: 'R-03-S01', assetTag: 'AST-APP-001', isPrimaryTarget: true, notes: 'Payment gateway API exploited via SQL injection' },
    { scenarioId: 'R-03-S01', assetTag: 'AST-DB-001', isPrimaryTarget: false, notes: 'Customer database exfiltrated through vulnerable API' },
    { scenarioId: 'R-03-S02', assetTag: 'AST-APP-002', isPrimaryTarget: true, notes: 'Merchant portal auth bypass target' },
    // R-06 DDoS scenarios
    { scenarioId: 'R-06-S01', assetTag: 'AST-APP-001', isPrimaryTarget: true, notes: 'Payment API is primary DDoS target' },
    { scenarioId: 'R-06-S01', assetTag: 'AST-NET-001', isPrimaryTarget: false, notes: 'Firewall saturated during volumetric attack' },
    { scenarioId: 'R-06-S02', assetTag: 'AST-APP-001', isPrimaryTarget: true, notes: 'Auth endpoint targeted in application-layer DDoS' },
    // R-07 Cloud failure
    { scenarioId: 'R-07-S01', assetTag: 'AST-CLD-001', isPrimaryTarget: true, notes: 'AWS production account — full regional outage' },
    { scenarioId: 'R-07-S01', assetTag: 'AST-DB-001', isPrimaryTarget: false, notes: 'Customer DB unavailable during regional failure' },
    // R-10 Supply chain
    { scenarioId: 'R-10-S01', assetTag: 'AST-APP-001', isPrimaryTarget: true, notes: 'Payment SDK compromised dependency' },
    { scenarioId: 'R-10-S02', assetTag: 'AST-VM-001', isPrimaryTarget: true, notes: 'K8s nodes run backdoored containers' },
    // R-12 Privilege escalation
    { scenarioId: 'R-12-S01', assetTag: 'AST-APP-002', isPrimaryTarget: true, notes: 'Merchant portal IDOR vulnerability' },
    { scenarioId: 'R-12-S02', assetTag: 'AST-APP-002', isPrimaryTarget: true, notes: 'Merchant admin panel role bypass' },
    // R-13 AI model poisoning
    { scenarioId: 'R-13-S01', assetTag: 'AST-APP-003', isPrimaryTarget: true, notes: 'Fraud detection model training data pipeline compromised' },
    { scenarioId: 'R-13-S02', assetTag: 'AST-APP-003', isPrimaryTarget: true, notes: 'Fraud scoring model reverse-engineered via API probing' },
    // R-14 Cross-border
    { scenarioId: 'R-14-S01', assetTag: 'AST-DB-003', isPrimaryTarget: true, notes: 'Analytics data transferred to US-based platform' },
    { scenarioId: 'R-14-S02', assetTag: 'AST-CLD-001', isPrimaryTarget: false, notes: 'AWS logging configuration leaks PII to non-EU region' },
  ];

  for (const link of scenarioAssetLinks) {
    const scenId = ctx.scenarioIds[link.scenarioId];
    const assetId = ctx.assetIds[link.assetTag];
    if (scenId && assetId) {
      await prisma.riskScenarioAsset.create({
        data: { scenarioId: scenId, assetId, isPrimaryTarget: link.isPrimaryTarget, notes: link.notes },
      });
    }
  }
  console.log('    20 risk scenario-asset links created');

  // ============================================
  // 16. RISK SCENARIO - CONTROL LINKS (20)
  // Which controls mitigate each scenario?
  // ============================================

  const scenarioControlLinks: { scenarioId: string; controlId: string; isPrimaryControl: boolean; effectivenessWeight: number; notes: string }[] = [
    // R-01-S01 Ransomware via phishing
    { scenarioId: 'R-01-S01', controlId: '6.3', isPrimaryControl: false, effectivenessWeight: 60, notes: 'Security awareness training reduces phishing success rate' },
    { scenarioId: 'R-01-S01', controlId: '8.8', isPrimaryControl: true, effectivenessWeight: 80, notes: 'Vulnerability management prevents exploitation of known vulns' },
    { scenarioId: 'R-01-S01', controlId: '8.13', isPrimaryControl: true, effectivenessWeight: 90, notes: 'Immutable backups enable recovery without paying ransom' },
    // R-03-S01 SQL injection
    { scenarioId: 'R-03-S01', controlId: '8.28', isPrimaryControl: true, effectivenessWeight: 90, notes: 'Secure coding with input validation prevents SQLi' },
    { scenarioId: 'R-03-S01', controlId: '8.29', isPrimaryControl: true, effectivenessWeight: 85, notes: 'Penetration testing identifies injection vulnerabilities' },
    { scenarioId: 'R-03-S01', controlId: '8.5', isPrimaryControl: false, effectivenessWeight: 70, notes: 'Authentication controls limit attack surface' },
    // R-06-S01 Volumetric DDoS
    { scenarioId: 'R-06-S01', controlId: '8.20', isPrimaryControl: true, effectivenessWeight: 85, notes: 'Network controls and DDoS mitigation services' },
    { scenarioId: 'R-06-S01', controlId: '5.30', isPrimaryControl: false, effectivenessWeight: 70, notes: 'BCP ensures business continuity during DDoS' },
    // R-07-S01 AWS regional outage
    { scenarioId: 'R-07-S01', controlId: '8.14', isPrimaryControl: true, effectivenessWeight: 85, notes: 'Redundancy and failover mechanisms' },
    { scenarioId: 'R-07-S01', controlId: '8.13', isPrimaryControl: true, effectivenessWeight: 80, notes: 'Backup and recovery procedures' },
    // R-10-S01 Supply chain npm
    { scenarioId: 'R-10-S01', controlId: '8.28', isPrimaryControl: true, effectivenessWeight: 75, notes: 'Secure development with dependency scanning' },
    { scenarioId: 'R-10-S01', controlId: '8.8', isPrimaryControl: false, effectivenessWeight: 70, notes: 'Vulnerability management detects known compromised packages' },
    // R-12-S01 IDOR
    { scenarioId: 'R-12-S01', controlId: '8.28', isPrimaryControl: true, effectivenessWeight: 90, notes: 'Secure coding with access control enforcement' },
    { scenarioId: 'R-12-S01', controlId: '8.29', isPrimaryControl: true, effectivenessWeight: 85, notes: 'Pen testing to identify IDOR vulnerabilities' },
    // R-13-S01 Model poisoning
    { scenarioId: 'R-13-S01', controlId: '5.15', isPrimaryControl: true, effectivenessWeight: 80, notes: 'Access control on training data pipeline' },
    { scenarioId: 'R-13-S01', controlId: '8.16', isPrimaryControl: false, effectivenessWeight: 70, notes: 'Monitoring detects model performance degradation' },
    // R-08-S01 CEO fraud
    { scenarioId: 'R-08-S01', controlId: '6.3', isPrimaryControl: true, effectivenessWeight: 80, notes: 'Anti-phishing training for finance team' },
    { scenarioId: 'R-08-S01', controlId: '5.3', isPrimaryControl: true, effectivenessWeight: 90, notes: 'Segregation of duties — dual authorisation for wire transfers' },
    // R-04-S01 Insider fraud
    { scenarioId: 'R-04-S01', controlId: '5.3', isPrimaryControl: true, effectivenessWeight: 90, notes: 'Segregation of duties in settlement processing' },
    { scenarioId: 'R-04-S01', controlId: '8.15', isPrimaryControl: true, effectivenessWeight: 85, notes: 'Activity logging for privileged database operations' },
  ];

  for (const link of scenarioControlLinks) {
    const scenId = ctx.scenarioIds[link.scenarioId];
    const controlDbId = ctx.controlIds[link.controlId];
    if (scenId && controlDbId) {
      await prisma.riskScenarioControl.create({
        data: { scenarioId: scenId, controlId: controlDbId, isPrimaryControl: link.isPrimaryControl, effectivenessWeight: link.effectivenessWeight, notes: link.notes },
      });
    }
  }
  console.log('    20 risk scenario-control links created');

  // ============================================
  // 17. SCENARIO STATE HISTORY (10)
  // ============================================

  const stateHistoryDefs: { scenarioId: string; fromStatus: string | null; toStatus: string; triggeredBy: string; reason: string; daysAgoVal: number }[] = [
    { scenarioId: 'R-01-S01', fromStatus: 'DRAFT', toStatus: 'ASSESSED', triggeredBy: 'USER', reason: 'Initial risk assessment completed by risk analyst', daysAgoVal: 180 },
    { scenarioId: 'R-01-S01', fromStatus: 'ASSESSED', toStatus: 'EVALUATED', triggeredBy: 'USER', reason: 'Compared against risk appetite — exceeds tolerance threshold', daysAgoVal: 170 },
    { scenarioId: 'R-01-S01', fromStatus: 'EVALUATED', toStatus: 'TREATING', triggeredBy: 'USER', reason: 'Treatment plan TP-001 approved — ransomware defence hardening', daysAgoVal: 160 },
    { scenarioId: 'R-03-S01', fromStatus: 'DRAFT', toStatus: 'ASSESSED', triggeredBy: 'USER', reason: 'Initial assessment of SQL injection scenario', daysAgoVal: 150 },
    { scenarioId: 'R-03-S01', fromStatus: 'ASSESSED', toStatus: 'TREATING', triggeredBy: 'USER', reason: 'API security enhancement program TP-002 initiated', daysAgoVal: 140 },
    { scenarioId: 'R-06-S01', fromStatus: 'DRAFT', toStatus: 'ASSESSED', triggeredBy: 'USER', reason: 'DDoS scenario assessed after industry threat intelligence', daysAgoVal: 120 },
    { scenarioId: 'R-07-S01', fromStatus: 'ASSESSED', toStatus: 'ACCEPTED', triggeredBy: 'USER', reason: 'CISO accepts residual risk — multi-AZ redundancy deemed sufficient', daysAgoVal: 90 },
    { scenarioId: 'R-12-S01', fromStatus: 'ASSESSED', toStatus: 'TREATING', triggeredBy: 'INCIDENT_CREATED', reason: 'INC-2026-004 XSS incident triggered treatment of merchant portal scenarios', daysAgoVal: 38 },
    { scenarioId: 'R-06-S01', fromStatus: 'ASSESSED', toStatus: 'MONITORING', triggeredBy: 'INCIDENT_CREATED', reason: 'INC-2026-007 DDoS incident — monitoring mode activated with enhanced KRI tracking', daysAgoVal: 1 },
    { scenarioId: 'R-01-S02', fromStatus: 'TREATING', toStatus: 'MONITORING', triggeredBy: 'TREATMENT_COMPLETED', reason: 'TP-001 ransomware defence hardening completed — vendor VPN scenario now monitored', daysAgoVal: 30 },
  ];

  for (const def of stateHistoryDefs) {
    const scenId = ctx.scenarioIds[def.scenarioId];
    if (scenId) {
      await prisma.scenarioStateHistory.create({
        data: {
          scenarioId: scenId,
          fromStatus: def.fromStatus as any,
          toStatus: def.toStatus as any,
          triggeredBy: def.triggeredBy,
          reason: def.reason,
          actorId: ctx.users.ciso,
          isSystemAction: def.triggeredBy !== 'USER',
          createdAt: daysAgo(def.daysAgoVal),
        },
      });
    }
  }
  console.log('    10 scenario state history records created');

  // ============================================
  // 18. TOLERANCE EVALUATIONS (5)
  // ============================================

  const toleranceEvalDefs: { riskId: string; status: string; riskScore: number; toleranceThreshold: number; gap: number; recommendedActions: string[] }[] = [
    { riskId: 'R-01', status: 'EXCEEDS', riskScore: 9, toleranceThreshold: 6, gap: 3, recommendedActions: ['Continue ransomware defence hardening TP-001', 'Increase backup testing frequency', 'Deploy immutable backup solution'] },
    { riskId: 'R-03', status: 'EXCEEDS', riskScore: 10, toleranceThreshold: 8, gap: 2, recommendedActions: ['Complete API security enhancement TP-002', 'Expand pen test scope to include v2 merchant API', 'Implement runtime application self-protection'] },
    { riskId: 'R-05', status: 'EXCEEDS', riskScore: 8, toleranceThreshold: 6, gap: 2, recommendedActions: ['Accelerate DORA compliance implementation TP-003', 'Complete NIS2 gap remediation', 'Hire dedicated regulatory compliance analyst'] },
    { riskId: 'R-06', status: 'WITHIN', riskScore: 6, toleranceThreshold: 8, gap: -2, recommendedActions: ['Maintain current DDoS mitigation posture', 'Review AWS Shield Advanced configuration quarterly'] },
    { riskId: 'R-07', status: 'WITHIN', riskScore: 4, toleranceThreshold: 8, gap: -4, recommendedActions: ['Risk accepted — maintain multi-AZ architecture', 'Annual BCP test to validate failover'] },
  ];

  for (const def of toleranceEvalDefs) {
    const riskDbId = ctx.riskIds[def.riskId];
    if (riskDbId) {
      await prisma.toleranceEvaluation.create({
        data: {
          riskId: riskDbId,
          status: def.status,
          riskScore: def.riskScore,
          toleranceThreshold: def.toleranceThreshold,
          gap: def.gap,
          recommendedActions: def.recommendedActions,
          evaluatedById: ctx.users.ciso,
          evaluatedAt: daysAgo(14),
        },
      });
    }
  }
  console.log('    5 tolerance evaluations created');

  // ============================================
  // 19. EVIDENCE - INCIDENT LINKS (6)
  // ============================================

  const evidenceIncidentLinks: { evidenceRef: string; incRef: string; linkType: string; notes: string }[] = [
    { evidenceRef: 'EVD-2025-0002', incRef: 'INC-2026-004', linkType: 'forensic', notes: 'Vulnerability scan report that identified the vulnerable endpoint class' },
    { evidenceRef: 'EVD-2025-0004', incRef: 'INC-2026-004', linkType: 'forensic', notes: 'Pen test report that missed the XSS — scope gap evidence' },
    { evidenceRef: 'EVD-2025-0007', incRef: 'INC-2026-003', linkType: 'forensic', notes: 'SIEM log retention config proving logs were available for investigation' },
    { evidenceRef: 'EVD-2026-0007', incRef: 'INC-2026-008', linkType: 'notification', notes: 'DORA ICT risk assessment — vendor processing violation context' },
    { evidenceRef: 'EVD-2025-0006', incRef: 'INC-2026-002', linkType: 'lessons_learned', notes: 'BCP test results used in post-incident review of AZ failover' },
    { evidenceRef: 'EVD-2026-0003', incRef: 'INC-2026-008', linkType: 'forensic', notes: 'Vendor risk assessment for analytics provider — DPA terms reference' },
  ];

  for (const link of evidenceIncidentLinks) {
    const evdId = ctx.evidenceIds[link.evidenceRef];
    const incId = ctx.incidentIds[link.incRef];
    if (evdId && incId) {
      await prisma.evidenceIncident.create({
        data: { evidenceId: evdId, incidentId: incId, linkType: link.linkType, notes: link.notes, createdById: ctx.users.ciso },
      });
    }
  }
  console.log('    6 evidence-incident links created');

  // ============================================
  // 20. EVIDENCE - RISK LINKS (6)
  // ============================================

  const evidenceRiskLinks: { evidenceRef: string; riskId: string; linkType: string; notes: string }[] = [
    { evidenceRef: 'EVD-2025-0002', riskId: 'R-03', linkType: 'assessment', notes: 'Vuln scan results inform API breach risk scoring' },
    { evidenceRef: 'EVD-2025-0004', riskId: 'R-03', linkType: 'assessment', notes: 'Pen test results evidence API security posture' },
    { evidenceRef: 'EVD-2025-0006', riskId: 'R-11', linkType: 'assessment', notes: 'BCP test results evidence business continuity readiness' },
    { evidenceRef: 'EVD-2026-0003', riskId: 'R-02', linkType: 'assessment', notes: 'Stripe vendor assessment evidences third-party risk management' },
    { evidenceRef: 'EVD-2026-0007', riskId: 'R-05', linkType: 'assessment', notes: 'DORA ICT assessment evidences regulatory compliance posture' },
    { evidenceRef: 'EVD-2026-0008', riskId: 'R-05', linkType: 'assessment', notes: 'NIS2 gap analysis evidences NIS2 compliance status' },
  ];

  for (const link of evidenceRiskLinks) {
    const evdId = ctx.evidenceIds[link.evidenceRef];
    const riskDbId = ctx.riskIds[link.riskId];
    if (evdId && riskDbId) {
      await prisma.evidenceRisk.create({
        data: { evidenceId: evdId, riskId: riskDbId, linkType: link.linkType, notes: link.notes, createdById: ctx.users.ciso },
      });
    }
  }
  console.log('    6 evidence-risk links created');

  // ============================================
  // 21. EVIDENCE - NONCONFORMITY LINKS (4)
  // ============================================

  const evidenceNcLinks: { evidenceRef: string; ncId: string; linkType: string; notes: string }[] = [
    { evidenceRef: 'EVD-2025-0005', ncId: 'NC-2026-001', linkType: 'finding', notes: 'Access review evidence — showing the incomplete documentation gap' },
    { evidenceRef: 'EVD-2025-0004', ncId: 'NC-2026-004', linkType: 'finding', notes: 'Pen test report showing merchant portal API was excluded from scope' },
    { evidenceRef: 'EVD-2026-0003', ncId: 'NC-2026-005', linkType: 'finding', notes: 'Stripe vendor assessment — highlights SLA monitoring gap' },
    { evidenceRef: 'EVD-2025-0008', ncId: 'NC-2026-003', linkType: 'verification', notes: 'Firewall review — confirms network diagram was outdated' },
  ];

  for (const link of evidenceNcLinks) {
    const evdId = ctx.evidenceIds[link.evidenceRef];
    const ncDbId = ctx.ncIds[link.ncId];
    if (evdId && ncDbId) {
      await prisma.evidenceNonconformity.create({
        data: { evidenceId: evdId, nonconformityId: ncDbId, linkType: link.linkType, notes: link.notes, createdById: ctx.users.ciso },
      });
    }
  }
  console.log('    4 evidence-nonconformity links created');

  // ============================================
  // 22. EVIDENCE - ASSET LINKS (5)
  // ============================================

  const evidenceAssetLinks: { evidenceRef: string; assetTag: string; linkType: string; notes: string }[] = [
    { evidenceRef: 'EVD-2025-0002', assetTag: 'AST-APP-001', linkType: 'vulnerability_scan', notes: 'Quarterly vuln scan covering payment gateway' },
    { evidenceRef: 'EVD-2025-0004', assetTag: 'AST-APP-001', linkType: 'vulnerability_scan', notes: 'Pen test covering payment gateway application' },
    { evidenceRef: 'EVD-2026-0009', assetTag: 'AST-SRV-001', linkType: 'configuration', notes: 'TLS 1.3 migration evidence for payment server 1' },
    { evidenceRef: 'EVD-2025-0008', assetTag: 'AST-NET-001', linkType: 'configuration', notes: 'Firewall rule review for Dublin perimeter' },
    { evidenceRef: 'EVD-2026-0010', assetTag: 'AST-NET-003', linkType: 'configuration', notes: 'Okta MFA enforcement covering VPN gateway access' },
  ];

  for (const link of evidenceAssetLinks) {
    const evdId = ctx.evidenceIds[link.evidenceRef];
    const assetId = ctx.assetIds[link.assetTag];
    if (evdId && assetId) {
      await prisma.evidenceAsset.create({
        data: { evidenceId: evdId, assetId, linkType: link.linkType, notes: link.notes, createdById: ctx.users.ciso },
      });
    }
  }
  console.log('    5 evidence-asset links created');

  // ============================================
  // 23. EVIDENCE - CHANGE LINKS (4)
  // ============================================

  const evidenceChangeLinks: { evidenceRef: string; changeRef: string; linkType: string; notes: string }[] = [
    { evidenceRef: 'EVD-2026-0009', changeRef: 'CHG-2026-001', linkType: 'test_result', notes: 'TLS 1.3 migration completion screenshots' },
    { evidenceRef: 'EVD-2026-0006', changeRef: 'CHG-2026-001', linkType: 'approval', notes: 'CAB minutes approving TLS migration' },
    { evidenceRef: 'EVD-2025-0002', changeRef: 'CHG-2026-004', linkType: 'test_result', notes: 'Vuln scan confirming Log4j remediation' },
    { evidenceRef: 'EVD-2026-0004', changeRef: 'CHG-2026-002', linkType: 'approval', notes: 'ISMS management review approving PG16 upgrade' },
  ];

  for (const link of evidenceChangeLinks) {
    const evdId = ctx.evidenceIds[link.evidenceRef];
    const changeId = ctx.changeIds[link.changeRef];
    if (evdId && changeId) {
      await prisma.evidenceChange.create({
        data: { evidenceId: evdId, changeId, linkType: link.linkType, notes: link.notes, createdById: ctx.users.ciso },
      });
    }
  }
  console.log('    4 evidence-change links created');

  // ============================================
  // 24. EVIDENCE - TREATMENT LINKS (4)
  // ============================================

  const evidenceTreatmentLinks: { evidenceRef: string; treatmentId: string; linkType: string; notes: string }[] = [
    { evidenceRef: 'EVD-2025-0004', treatmentId: 'TP-002', linkType: 'implementation', notes: 'Pen test results evidencing API security improvements' },
    { evidenceRef: 'EVD-2026-0009', treatmentId: 'TP-002', linkType: 'implementation', notes: 'TLS 1.3 migration as part of API security program' },
    { evidenceRef: 'EVD-2026-0007', treatmentId: 'TP-003', linkType: 'progress', notes: 'DORA ICT assessment tracking compliance implementation progress' },
    { evidenceRef: 'EVD-2026-0008', treatmentId: 'TP-003', linkType: 'progress', notes: 'NIS2 gap analysis informing regulatory compliance treatment' },
  ];

  for (const link of evidenceTreatmentLinks) {
    const evdId = ctx.evidenceIds[link.evidenceRef];
    const treatId = ctx.treatmentIds[link.treatmentId];
    if (evdId && treatId) {
      await prisma.evidenceTreatment.create({
        data: { evidenceId: evdId, treatmentId: treatId, linkType: link.linkType, notes: link.notes, createdById: ctx.users.ciso },
      });
    }
  }
  console.log('    4 evidence-treatment links created');

  // ============================================
  // 25. DOCUMENT-CONTROL MAPPINGS (15)
  // Which policies implement which controls?
  // ============================================

  const docControlLinks: { policyDocId: string; controlId: string; mappingType: 'IMPLEMENTS' | 'SUPPORTS' | 'REFERENCES'; coverage: 'FULL' | 'PARTIAL' }[] = [
    { policyDocId: 'POL-001', controlId: '5.1', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    { policyDocId: 'POL-001', controlId: '5.2', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    { policyDocId: 'POL-001', controlId: '5.4', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    { policyDocId: 'POL-002', controlId: '5.5', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    { policyDocId: 'POL-003', controlId: '5.15', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    { policyDocId: 'POL-003', controlId: '8.5', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    { policyDocId: 'POL-004', controlId: '5.12', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    { policyDocId: 'POL-005', controlId: '5.19', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    { policyDocId: 'POL-005', controlId: '5.23', mappingType: 'IMPLEMENTS', coverage: 'PARTIAL' },
    { policyDocId: 'POL-006', controlId: '5.24', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    { policyDocId: 'POL-006', controlId: '5.25', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    { policyDocId: 'POL-006', controlId: '5.26', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    { policyDocId: 'POL-007', controlId: '5.30', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    { policyDocId: 'POL-008', controlId: '5.34', mappingType: 'IMPLEMENTS', coverage: 'FULL' },
    { policyDocId: 'POL-003', controlId: '8.2', mappingType: 'SUPPORTS', coverage: 'PARTIAL' },
  ];

  for (const link of docControlLinks) {
    const policyId = ctx.policyIds[link.policyDocId];
    const controlDbId = ctx.controlIds[link.controlId];
    if (policyId && controlDbId) {
      await prisma.documentControlMapping.create({
        data: { documentId: policyId, controlId: controlDbId, mappingType: link.mappingType, coverage: link.coverage, createdById: ctx.users.ciso },
      });
    }
  }
  console.log('    15 policy-control mappings created');

  // ============================================
  // 26. DOCUMENT-RISK MAPPINGS (8)
  // ============================================

  const docRiskLinks: { policyDocId: string; riskId: string; relationshipType: 'MITIGATES' | 'ADDRESSES' | 'MONITORS' }[] = [
    { policyDocId: 'POL-001', riskId: 'R-05', relationshipType: 'ADDRESSES' },
    { policyDocId: 'POL-002', riskId: 'R-01', relationshipType: 'MITIGATES' },
    { policyDocId: 'POL-003', riskId: 'R-03', relationshipType: 'MITIGATES' },
    { policyDocId: 'POL-003', riskId: 'R-04', relationshipType: 'MITIGATES' },
    { policyDocId: 'POL-005', riskId: 'R-02', relationshipType: 'MITIGATES' },
    { policyDocId: 'POL-006', riskId: 'R-06', relationshipType: 'ADDRESSES' },
    { policyDocId: 'POL-007', riskId: 'R-11', relationshipType: 'MITIGATES' },
    { policyDocId: 'POL-008', riskId: 'R-14', relationshipType: 'MITIGATES' },
  ];

  for (const link of docRiskLinks) {
    const policyId = ctx.policyIds[link.policyDocId];
    const riskDbId = ctx.riskIds[link.riskId];
    if (policyId && riskDbId) {
      await prisma.documentRiskMapping.create({
        data: { documentId: policyId, riskId: riskDbId, relationshipType: link.relationshipType, createdById: ctx.users.ciso },
      });
    }
  }
  console.log('    8 policy-risk mappings created');

  // ============================================
  // 27. DOCUMENT RELATIONS (6)
  // Policy cross-references
  // ============================================

  const docRelations: { sourceDocId: string; targetDocId: string; relationType: 'PARENT_OF' | 'REFERENCES' | 'COMPLEMENTS' | 'DEPENDS_ON' }[] = [
    { sourceDocId: 'POL-001', targetDocId: 'POL-002', relationType: 'PARENT_OF' },
    { sourceDocId: 'POL-001', targetDocId: 'POL-003', relationType: 'PARENT_OF' },
    { sourceDocId: 'POL-001', targetDocId: 'POL-006', relationType: 'PARENT_OF' },
    { sourceDocId: 'POL-006', targetDocId: 'POL-007', relationType: 'COMPLEMENTS' },
    { sourceDocId: 'POL-005', targetDocId: 'POL-008', relationType: 'REFERENCES' },
    { sourceDocId: 'POL-003', targetDocId: 'POL-004', relationType: 'REFERENCES' },
  ];

  for (const rel of docRelations) {
    const srcId = ctx.policyIds[rel.sourceDocId];
    const tgtId = ctx.policyIds[rel.targetDocId];
    if (srcId && tgtId) {
      await prisma.documentRelation.create({
        data: { sourceDocumentId: srcId, targetDocumentId: tgtId, relationType: rel.relationType, createdById: ctx.users.ciso },
      });
    }
  }
  console.log('    6 document relations created');

  // ============================================
  // 28. TREATMENT ACTIONS (12)
  // Concrete action items for treatment plans
  // ============================================

  const treatmentActionDefs: { treatmentId: string; actionId: string; title: string; description: string; status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'; priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'; assignedTo: string; dueDaysFromNow: number; completedDaysAgo?: number }[] = [
    // TP-001 Ransomware defence
    { treatmentId: 'TP-001', actionId: 'TP-001-A01', title: 'Deploy EDR on all payment servers', description: 'Install and configure CrowdStrike Falcon on AST-SRV-001 through AST-SRV-004 with custom payment workload policies.', status: 'COMPLETED', priority: 'CRITICAL', assignedTo: 'securityLead', dueDaysFromNow: -60, completedDaysAgo: 65 },
    { treatmentId: 'TP-001', actionId: 'TP-001-A02', title: 'Implement immutable backup for transaction DB', description: 'Configure AWS Backup with immutable vault locks for AST-DB-002 with 30-day immutability window.', status: 'COMPLETED', priority: 'CRITICAL', assignedTo: 'cto', dueDaysFromNow: -45, completedDaysAgo: 50 },
    { treatmentId: 'TP-001', actionId: 'TP-001-A03', title: 'Conduct ransomware tabletop exercise', description: 'Run full tabletop exercise simulating ransomware attack on payment infrastructure with all key stakeholders.', status: 'COMPLETED', priority: 'HIGH', assignedTo: 'ciso', dueDaysFromNow: -30, completedDaysAgo: 35 },
    // TP-002 API security
    { treatmentId: 'TP-002', actionId: 'TP-002-A01', title: 'Deploy API gateway with rate limiting', description: 'Implement Kong API gateway with rate limiting, schema validation, and IP-based throttling for all public API endpoints.', status: 'COMPLETED', priority: 'HIGH', assignedTo: 'cto', dueDaysFromNow: -90, completedDaysAgo: 95 },
    { treatmentId: 'TP-002', actionId: 'TP-002-A02', title: 'Migrate merchant auth to OAuth 2.0 + PKCE', description: 'Replace legacy API key auth with OAuth 2.0 + PKCE flow for all merchant portal and API integrations.', status: 'COMPLETED', priority: 'HIGH', assignedTo: 'cto', dueDaysFromNow: -60, completedDaysAgo: 70 },
    { treatmentId: 'TP-002', actionId: 'TP-002-A03', title: 'Add DAST scanning to CI/CD pipeline', description: 'Integrate OWASP ZAP into the GitHub Actions pipeline for automated DAST on every PR to main.', status: 'COMPLETED', priority: 'MEDIUM', assignedTo: 'securityLead', dueDaysFromNow: -45, completedDaysAgo: 55 },
    // TP-003 DORA compliance
    { treatmentId: 'TP-003', actionId: 'TP-003-A01', title: 'Complete DORA ICT risk management framework gap analysis', description: 'Perform detailed gap analysis against DORA Article 6 RTS requirements and map current controls to DORA requirements.', status: 'COMPLETED', priority: 'HIGH', assignedTo: 'complianceOfficer', dueDaysFromNow: -30, completedDaysAgo: 40 },
    { treatmentId: 'TP-003', actionId: 'TP-003-A02', title: 'Establish DORA incident reporting workflow', description: 'Build automated incident classification and reporting workflow aligned with DORA major ICT incident notification timelines.', status: 'IN_PROGRESS', priority: 'CRITICAL', assignedTo: 'ciso', dueDaysFromNow: 30 },
    { treatmentId: 'TP-003', actionId: 'TP-003-A03', title: 'Develop TLPT programme', description: 'Design threat-led penetration testing programme per DORA Article 26 requirements including scope, frequency, and red team provider selection.', status: 'NOT_STARTED', priority: 'HIGH', assignedTo: 'securityLead', dueDaysFromNow: 60 },
    { treatmentId: 'TP-003', actionId: 'TP-003-A04', title: 'Complete third-party ICT provider register', description: 'Build comprehensive register of all third-party ICT service providers with criticality assessment per DORA Article 28.', status: 'IN_PROGRESS', priority: 'HIGH', assignedTo: 'riskAnalyst', dueDaysFromNow: 21 },
    // TP-004 (assuming it exists for insider fraud)
    { treatmentId: 'TP-004', actionId: 'TP-004-A01', title: 'Implement privileged access monitoring', description: 'Deploy real-time monitoring of all privileged database sessions with automated alerts for anomalous query patterns.', status: 'IN_PROGRESS', priority: 'HIGH', assignedTo: 'securityLead', dueDaysFromNow: 30 },
    { treatmentId: 'TP-004', actionId: 'TP-004-A02', title: 'Deploy dual-authorisation for settlement batches', description: 'Implement maker-checker workflow requiring two authorisers for all settlement batch approvals over EUR 10,000.', status: 'NOT_STARTED', priority: 'CRITICAL', assignedTo: 'cto', dueDaysFromNow: 45 },
  ];

  for (const def of treatmentActionDefs) {
    const treatId = ctx.treatmentIds[def.treatmentId];
    const assigneeId = ctx.users[def.assignedTo as keyof typeof ctx.users];
    if (treatId) {
      await prisma.treatmentAction.create({
        data: {
          treatmentPlanId: treatId,
          actionId: def.actionId,
          title: def.title,
          description: def.description,
          status: def.status,
          priority: def.priority,
          assignedToId: assigneeId,
          dueDate: def.dueDaysFromNow >= 0 ? new Date(Date.now() + def.dueDaysFromNow * 86400000) : new Date(Date.now() + def.dueDaysFromNow * 86400000),
          completedDate: def.completedDaysAgo ? daysAgo(def.completedDaysAgo) : undefined,
        },
      });
    }
  }
  console.log('    12 treatment actions created');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('    ---');
  console.log('    Cross-entity relationship seeding complete!');
  console.log('    ~350 relationship records created across 20+ model types');
}
