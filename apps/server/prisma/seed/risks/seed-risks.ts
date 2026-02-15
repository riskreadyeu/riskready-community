
import { PrismaClient, RiskTier, RiskStatus, ControlFramework, LikelihoodLevel, ImpactLevel, ScenarioStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// DATA MAPPING UTILITIES
// ============================================

function mapTier(tier: string): RiskTier {
  const t = tier.toUpperCase();
  if (t.includes('CORE')) return 'CORE';
  if (t.includes('EXTENDED') || t.includes('STANDARD')) return 'EXTENDED';
  if (t.includes('ADVANCED')) return 'ADVANCED';
  return 'CORE';
}

function mapFramework(frameworkStr: string): ControlFramework {
  const f = frameworkStr.toUpperCase();
  if (f.includes('ISO')) return 'ISO';
  if (f.includes('SOC2')) return 'SOC2';
  if (f.includes('NIS2')) return 'NIS2';
  if (f.includes('DORA')) return 'DORA';
  return 'ISO'; // Default
}

// ============================================
// RAW DATA SOURCE
// ============================================

const risksSource = [
  { id: 'R-01', title: 'Information Security Governance', description: 'Risk of inadequate governance structure, missing policies, and unclear roles leading to lack of oversight.', tier: 'Core', owner: 'CISO', compliance: 'ISO 27001' },
  { id: 'R-02', title: 'External Parties & Threat Intel', description: 'Risk of inadequate relationships with authorities/groups and lack of threat intelligence leading to reactive posture.', tier: 'Standard', owner: 'CISO', compliance: 'ISO 27001' },
  { id: 'R-03', title: 'Security in Projects & Change', description: 'Risk of security not being integrated into project management and change processes (DevSecOps failures).', tier: 'Standard', owner: 'PMO', compliance: 'ISO 27001' },
  { id: 'R-04', title: 'Asset Management', description: 'Risk of unknown, unmanaged, or shadow assets creating hidden attack surfaces.', tier: 'Core', owner: 'IT Director', compliance: 'ISO 27001' },
  { id: 'R-05', title: 'Data Classification & Handling', description: 'Risk of mishandling sensitive data throughout its lifecycle (Classification, Transfer, Deletion).', tier: 'Core', owner: 'DPO', compliance: 'ISO 27001' },
  { id: 'R-06', title: 'Identity & Access Management', description: 'Risk of unauthorized access due to weak authentication, excessive privileges, or account lifecycle failures.', tier: 'Core', owner: 'IAM Manager', compliance: 'ISO 27001' },
  { id: 'R-07', title: 'Third-Party & Supply Chain', description: 'Risk from third-party relationships including vendor data breaches and software supply chain attacks.', tier: 'Core', owner: 'Vendor Mgr', compliance: 'ISO 27001 / DORA' },
  { id: 'R-08', title: 'Cloud Security', description: 'Risk of cloud-specific threats including misconfiguration, identity compromise, and shared responsibility gaps.', tier: 'Core', owner: 'Cloud Lead', compliance: 'ISO 27001' },
  { id: 'R-09', title: 'Personnel Security Lifecycle', description: 'Risk from inadequate personnel security including insufficient screening and insecure termination.', tier: 'Standard', owner: 'HR Director', compliance: 'ISO 27001' },
  { id: 'R-10', title: 'Security Awareness & Culture', description: 'Risk of human error and social engineering due to inadequate training or poor reporting culture.', tier: 'Core', owner: 'Awareness Lead', compliance: 'ISO 27001' },
  { id: 'R-11', title: 'Remote & Mobile Working', description: 'Risk from remote working arrangements including insecure home networks and unmanaged mobile devices.', tier: 'Standard', owner: 'IT Director', compliance: 'ISO 27001' },
  { id: 'R-12', title: 'Physical Security', description: 'Risk of unauthorized physical access to facilities, secure areas, and equipment.', tier: 'Standard', owner: 'Facilities Mgr', compliance: 'ISO 27001' },
  { id: 'R-13', title: 'Environmental Security', description: 'Risk of environmental threats to data centers including fire, flood, and power failure.', tier: 'Extended', owner: 'Facilities Mgr', compliance: 'ISO 27001' },
  { id: 'R-14', title: 'Equipment Security', description: 'Risk related to hardware including theft, improper disposal, and media handling.', tier: 'Standard', owner: 'IT Ops', compliance: 'ISO 27001' },
  { id: 'R-15', title: 'Endpoint Security', description: 'Risk from endpoints including unmanaged devices (BYOD), USB threats, and shadow software.', tier: 'Core', owner: 'IT Ops', compliance: 'ISO 27001' },
  { id: 'R-16', title: 'Malware & Ransomware', description: 'Risk of malware infection including ransomware encryption and double extortion (exfiltration).', tier: 'Core', owner: 'SOC Manager', compliance: 'ISO 27001' },
  { id: 'R-17', title: 'Network Security', description: 'Risk of network-based attacks including lateral movement, DDoS, and lack of segmentation.', tier: 'Core', owner: 'Network Lead', compliance: 'ISO 27001' },
  { id: 'R-18', title: 'Vulnerability Management', description: 'Risk of exploitation of technical vulnerabilities including unpatched systems and zero-days.', tier: 'Core', owner: 'Vuln Manager', compliance: 'ISO 27001' },
  { id: 'R-19', title: 'Secure Development Lifecycle', description: 'Risk of insecure software development including missing security requirements and insecure coding.', tier: 'Standard', owner: 'AppSec Lead', compliance: 'ISO 27001' },
  { id: 'R-20', title: 'Application Security', description: 'Risk of application-level vulnerabilities including vulnerable dependencies (SCA) and API abuse.', tier: 'Standard', owner: 'AppSec Lead', compliance: 'ISO 27001' },
  { id: 'R-21', title: 'Cryptographic Failures', description: 'Risk of cryptographic weaknesses including weak algorithms and poor key management.', tier: 'Core', owner: 'Security Arch', compliance: 'ISO 27001' },
  { id: 'R-22', title: 'Logging & Monitoring', description: 'Risk of inadequate security monitoring including missing logs, lack of SIEM, and detection failure.', tier: 'Core', owner: 'SOC Manager', compliance: 'ISO 27001' },
  { id: 'R-23', title: 'Incident Management', description: 'Risk of inadequate incident management including poor planning and failure to learn from incidents.', tier: 'Core', owner: 'IR Manager', compliance: 'ISO 27001 / NIS2' },
  { id: 'R-24', title: 'Business Continuity & DR', description: 'Risk of inability to recover from disruptions including failed backups and inadequate DR planning.', tier: 'Core', owner: 'BC/DR Manager', compliance: 'ISO 27001 / DORA' },
  { id: 'R-25', title: 'Compliance & Legal', description: 'Risk of non-compliance with legal/regulatory requirements including Privacy (GDPR) and IP laws.', tier: 'Core', owner: 'Compliance Mgr', compliance: 'ISO 27001' },
  { id: 'R-26', title: 'ICT Supply Chain (DORA/NIS2)', description: 'Risk of critical provider concentration (Cloud) and unmonitored sub-outsourcing chains.', tier: 'Core', owner: 'Vendor Mgr', compliance: 'DORA / NIS2' },
  { id: 'R-27', title: 'Regulatory Reporting (DORA/NIS2)', description: 'Risk of failing to meet strict regulatory reporting deadlines (24h Early Warning).', tier: 'Core', owner: 'Legal', compliance: 'DORA / NIS2' },
  { id: 'R-28', title: 'Operational Resilience (DORA)', description: 'Risk of exceeding impact tolerances for critical business functions during disruption.', tier: 'Core', owner: 'COO', compliance: 'DORA' },
  { id: 'R-29', title: 'Exec Accountability (NIS2)', description: 'Risk of personal liability for management bodies due to lack of training or oversight.', tier: 'Standard', owner: 'Board/CEO', compliance: 'NIS2' },
  { id: 'R-30', title: 'Advanced Testing (DORA)', description: 'Risk of failure to perform or pass Threat-Led Penetration Testing (TLPT).', tier: 'Extended', owner: 'CISO', compliance: 'DORA' },
  { id: 'R-31', title: 'AI Governance (EU AI Act)', description: 'Risk of Shadow AI usage, IP/Copyright infringement, and non-compliance with AI Regulation.', tier: 'Core', owner: 'CISO / Legal', compliance: 'EU AI Act' },
  { id: 'R-32', title: 'AI Security (Technical)', description: 'Risk of adversarial attacks on AI models including Prompt Injection and Model Theft.', tier: 'Core', owner: 'AppSec Lead', compliance: 'OWASP LLM' }
];

const scenariosSource = [
  { id: 'R-01-S01', riskId: 'R-01', title: 'Absence of Information Security Policy', cause: 'Lack of management commitment and governance structure.', event: 'Organization operates without documented or approved security policies.', consequence: 'Inconsistent practices, inability to enforce standards, and immediate audit failure.' },
  { id: 'R-01-S02', riskId: 'R-01', title: 'Unclear Security Roles & Responsibilities', cause: 'Undefined RACI matrix and lack of formal security job descriptions.', event: 'Security tasks are dropped during an incident due to confusion over who is responsible.', consequence: 'Delayed incident response, blame culture, and increased impact of breaches.' },
  { id: 'R-01-S03', riskId: 'R-01', title: 'Inadequate Segregation of Duties', cause: 'Small team size or lack of role-based access control (RBAC) design.', event: 'Single individual initiates, approves, and executes a sensitive transaction.', consequence: 'Internal fraud, embezzlement, or undetected error leading to financial loss.' },
  { id: 'R-02-S01', riskId: 'R-02', title: 'No Established Authority Contacts', cause: 'Lack of pre-established relationships or legal retainer.', event: 'Breach occurs and organization delays contacting law enforcement or regulators.', consequence: 'Loss of legal privilege, delayed assistance, and increased regulatory fines.' },
  { id: 'R-02-S02', riskId: 'R-02', title: 'No Security Community Engagement', cause: 'Isolation from industry peers and ISACs.', event: 'Organization fails to receive warning of an industry-specific attack campaign.', consequence: 'Compromise by a threat actor that could have been blocked proactively.' },
  { id: 'R-02-S03', riskId: 'R-02', title: 'No Threat Intelligence Program', cause: 'Reliance solely on reactive tools (Firewall/AV) without external intel feeds.', event: 'Zero-day or emerging threat exploits the organization before internal teams are aware.', consequence: 'Extended dwell time of attackers and inability to detect advanced threats.' },
  { id: 'R-03-S01', riskId: 'R-03', title: 'Security Not Integrated in Projects', cause: 'Pressure to release features quickly; Security engaged only at go-live.', event: 'New system deployed to production containing critical vulnerabilities.', consequence: 'Costly emergency refactoring, immediate breach risk, or project delay.' },
  { id: 'R-03-S02', riskId: 'R-03', title: 'Undocumented Operating Procedures', cause: 'Reliance on "tribal knowledge" and key individuals.', event: 'Key staff member leaves or is unavailable during a crisis.', consequence: 'Operational failure, extended outage, or inability to recover systems.' },
  { id: 'R-03-S03', riskId: 'R-03', title: 'Unauthorized Production Changes', cause: 'Lack of Change Advisory Board (CAB) or automated gates.', event: 'Developer pushes unapproved code directly to production.', consequence: 'System outage, introduction of security holes, or data corruption.' },
  { id: 'R-04-S01', riskId: 'R-04', title: 'Unknown Shadow IT Assets', cause: 'Decentralized purchasing and lack of CASB monitoring.', event: 'Business unit stores sensitive data in an unmanaged SaaS tool.', consequence: 'Data leakage, compliance violation, and inability to protect assets.' },
  { id: 'R-04-S02', riskId: 'R-04', title: 'Misuse of Information Assets', cause: 'Lack of Acceptable Use Policy (AUP) or monitoring.', event: 'Employee uses corporate infrastructure for crypto mining or piracy.', consequence: 'Legal liability, network performance degradation, and malware introduction.' },
  { id: 'R-04-S03', riskId: 'R-04', title: 'Assets Not Returned at Termination', cause: 'Disjointed offboarding process between HR and IT.', event: 'Terminated employee retains laptop and access to cloud data.', consequence: 'Data theft, unauthorized access after employment, and hardware loss.' },
  { id: 'R-05-S01', riskId: 'R-05', title: 'Misclassified Sensitive Data', cause: 'Lack of data discovery tools and user training.', event: 'Confidential PII or IP stored on open network shares.', consequence: 'Internal data leakage, regulatory fines (GDPR), and competitive loss.' },
  { id: 'R-05-S02', riskId: 'R-05', title: 'Insecure Data Transfer', cause: 'User convenience and lack of secure transfer tools.', event: 'Sensitive data sent via unencrypted email or public file sharing.', consequence: 'Interception of data in transit (MitM) and data exposure.' },
  { id: 'R-05-S03', riskId: 'R-05', title: 'Improper Data Deletion', cause: 'No automated retention policy or deletion scripts.', event: 'Data retained beyond legal requirements or "deleted" files remaining recoverable.', consequence: 'GDPR/Privacy violation and increased liability during legal discovery.' },
  { id: 'R-05-S04', riskId: 'R-05', title: 'Unmasked Data in Non-Production', cause: 'Lazy development practices and lack of masking tools.', event: 'Production database with real PII copied to Dev/Test environment.', consequence: 'Access to sensitive data by third-party developers and wider attack surface.' },
  { id: 'R-06-S01', riskId: 'R-06', title: 'Weak Authentication (No MFA)', cause: 'Legacy systems or user resistance to friction.', event: 'Attacker uses stolen credentials (credential stuffing) to log in.', consequence: 'Account takeover, unauthorized access, and initial foothold for ransomware.' },
  { id: 'R-06-S02', riskId: 'R-06', title: 'Excessive User Privileges', cause: 'Lack of "Least Privilege" and access reviews.', event: 'User account compromised; attacker inherits full Admin rights.', consequence: 'Rapid lateral movement, total domain compromise, and data exfiltration.' },
  { id: 'R-06-S03', riskId: 'R-06', title: 'Orphaned Accounts', cause: 'Failure to revoke access immediately upon termination.', event: 'Former employee or attacker uses active "zombie" account.', consequence: 'Undetected persistence in the network and data theft.' },
  { id: 'R-06-S04', riskId: 'R-06', title: 'Shared/Generic Accounts', cause: 'Legacy app requirements or saving money on licenses.', event: 'Malicious activity performed via "Admin" account; specific user cannot be identified.', consequence: 'Loss of accountability, audit failure, and inability to prosecute.' },
  { id: 'R-06-S05', riskId: 'R-06', title: 'MFA Fatigue / Push Bombing', cause: 'MFA implemented without "Number Matching" or rate limiting.', event: 'Attacker spams user with push notifications until they accept.', consequence: 'Bypass of MFA controls and successful account takeover.' },
  { id: 'R-07-S01', riskId: 'R-07', title: 'Third-Party Data Breach', cause: 'Vendor has poor security posture and holds org data.', event: 'Vendor suffers a breach; Organization\'s data is exposed.', consequence: 'Regulatory notification requirements, reputational damage, and IP loss.' },
  { id: 'R-07-S02', riskId: 'R-07', title: 'Software Supply Chain Attack', cause: 'Blind trust in software updates/libraries.', event: 'Malicious code inserted into trusted software update (e.g. SolarWinds).', consequence: 'Backdoor access to internal network bypassing perimeter defenses.' },
  { id: 'R-07-S03', riskId: 'R-07', title: 'Vendor Access Abuse', cause: 'Vendor given permanent VPN access without monitoring.', event: 'Vendor employee exploits legitimate access to steal data.', consequence: 'Insider threat via third party, data theft, and system sabotage.' },
  { id: 'R-07-S04', riskId: 'R-07', title: 'Insecure Cloud Service Usage', cause: 'Business units signing up for SaaS without security review.', event: 'Sensitive data uploaded to a non-compliant/insecure cloud provider.', consequence: 'Data exposure, lack of ownership, and jurisdictional compliance issues.' },
  { id: 'R-07-S05', riskId: 'R-07', title: 'Insecure Outsourced Development', cause: 'No security standards in vendor contracts.', event: 'Outsourced code delivered with hardcoded secrets or backdoors.', consequence: 'Vulnerable production application and expensive code remediation.' },
  { id: 'R-08-S01', riskId: 'R-08', title: 'Cloud Admin Compromise', cause: 'Lack of MFA on Root accounts or phishing.', event: 'Attacker gains administrative access to Cloud Console (AWS/Azure).', consequence: 'Total environment destruction, data deletion, and resource hijacking.' },
  { id: 'R-08-S02', riskId: 'R-08', title: 'Cloud Misconfiguration', cause: 'Human error or lack of Infrastructure as Code (IaC) scanning.', event: 'S3 Buckets or Databases exposed to the public internet.', consequence: 'Massive data breach, regulatory fines, and reputational collapse.' },
  { id: 'R-08-S03', riskId: 'R-08', title: 'Shared Responsibility Gaps', cause: 'Misunderstanding of what the Cloud Provider protects.', event: 'Security control (e.g. backup/firewall) not implemented by anyone.', consequence: 'Security breach where neither the org nor the provider accepts liability.' },
  { id: 'R-09-S01', riskId: 'R-09', title: 'Inadequate Background Screening', cause: 'Hiring pressure and cost-cutting on vetting.', event: 'Malicious actor or unqualified individual hired into sensitive role.', consequence: 'Insider fraud, data theft, or sabotage by employee.' },
  { id: 'R-09-S02', riskId: 'R-09', title: 'Missing Security Terms', cause: 'Legal contracts not reviewed by security.', event: 'Employee leaves and shares trade secrets without legal consequence.', consequence: 'Loss of IP with no legal recourse or ability to sue.' },
  { id: 'R-09-S03', riskId: 'R-09', title: 'No Disciplinary Process', cause: 'HR reluctance to enforce security policies.', event: 'Employees repeatedly violate security rules without consequence.', consequence: 'Degradation of security culture and increased negligence.' },
  { id: 'R-09-S04', riskId: 'R-09', title: 'Insecure Termination', cause: 'Disconnect between HR and IT offboarding.', event: 'Terminated employee retains VPN or Cloud access.', consequence: 'Data theft, vengeful deletion of data, or unauthorized re-entry.' },
  { id: 'R-10-S01', riskId: 'R-10', title: 'Phishing Attack Success', cause: 'Lack of training and realistic simulations.', event: 'Employee clicks malicious link or opens infected attachment.', consequence: 'Malware infection, credential theft, or ransomware entry.' },
  { id: 'R-10-S02', riskId: 'R-10', title: 'Social Engineering (Vishing)', cause: 'Lack of verification procedures for phone requests.', event: 'Attacker manipulates helpdesk or finance via phone call.', consequence: 'Password reset for attacker or fraudulent wire transfer.' },
  { id: 'R-10-S03', riskId: 'R-10', title: 'Unreported Security Events', cause: 'Culture of fear or "Blame Culture."', event: 'Employee makes a mistake but hides it from IT.', consequence: 'Incident grows in severity and dwell time increases significantly.' },
  { id: 'R-11-S01', riskId: 'R-11', title: 'Insecure Remote Access', cause: 'Lack of VPN/Zero Trust and split-tunneling.', event: 'Malware jumps from insecure home network to corporate network.', consequence: 'Network compromise bypassing perimeter firewalls.' },
  { id: 'R-11-S02', riskId: 'R-11', title: 'Mobile Device Theft', cause: 'Lack of MDM or disk encryption.', event: 'Laptop or phone containing data is lost or stolen.', consequence: 'Data breach notification requirement and asset loss.' },
  { id: 'R-12-S01', riskId: 'R-12', title: 'Unauthorized Physical Access', cause: 'Tailgating or weak entry controls.', event: 'Attacker walks into office or server room unescorted.', consequence: 'Hardware theft, planting of listening devices, or direct console access.' },
  { id: 'R-12-S02', riskId: 'R-12', title: 'Lack of Monitoring', cause: 'No CCTV or logs aimed at critical entry points.', event: 'Physical intrusion occurs without evidence.', consequence: 'Inability to investigate theft or identify the intruder.' },
  { id: 'R-12-S03', riskId: 'R-12', title: 'Clear Desk Violation', cause: 'Paper records left accessible/visible.', event: 'Visitor or cleaner views sensitive passwords/PII on desks.', consequence: 'Information leakage and visual hacking.' },
  { id: 'R-12-S04', riskId: 'R-12', title: 'Unescorted Visitors', cause: 'Lack of visitor badge policy.', event: 'Stranger roams freely in secure areas.', consequence: 'Potential for physical sabotage or social engineering.' },
  { id: 'R-13-S01', riskId: 'R-13', title: 'Environmental Damage', cause: 'Lack of fire suppression or flood sensors.', event: 'Fire or water damages on-premise server room.', consequence: 'Physical destruction of data and hardware; extended outage.' },
  { id: 'R-13-S02', riskId: 'R-13', title: 'Utility Failure', cause: 'Single power feed and failed UPS/Generator.', event: 'Power outage causes ungraceful shutdown of systems.', consequence: 'Data corruption, hardware failure, and service unavailability.' },
  { id: 'R-13-S03', riskId: 'R-13', title: 'Cabling Damage', cause: 'Exposed cabling and poor cable management.', event: 'Network cables accidentally cut or unplugged.', consequence: 'Network interruption and service downtime.' },
  { id: 'R-14-S01', riskId: 'R-14', title: 'Equipment Theft (Office)', cause: 'Lack of physical locks or asset tagging.', event: 'Hardware stolen from office premises.', consequence: 'Loss of asset and potential data exposure.' },
  { id: 'R-14-S02', riskId: 'R-14', title: 'Improper Media Handling', cause: 'Use of unencrypted USBs or tapes.', event: 'Removable media containing data is lost or stolen.', consequence: 'Portable data breach and inability to track lost data.' },
  { id: 'R-14-S03', riskId: 'R-14', title: 'Insecure Disposal', cause: 'Failure to wipe/shred disks before disposal.', event: 'Data recovered from discarded or sold hardware.', consequence: 'Data breach and privacy compliance violation.' },
  { id: 'R-15-S01', riskId: 'R-15', title: 'Unmanaged BYOD', cause: 'Employees using personal devices for work.', event: 'Infected personal device syncs malicious file to corporate cloud.', consequence: 'Malware entry and data leakage to unmanaged devices.' },
  { id: 'R-15-S02', riskId: 'R-15', title: 'Unauthorized Software (Shadow IT)', cause: 'Local Admin rights given to users.', event: 'User installs risky software (Tor, torrents, pirated apps).', consequence: 'Malware infection, license violation, and network exposure.' },
  { id: 'R-15-S03', riskId: 'R-15', title: 'USB Malware Infection', cause: 'USB ports left open (No blocking policy).', event: 'Malicious USB inserted (dropped drive or personal drive).', consequence: 'Air-gap jumped, malware installed, or data exfiltrated.' },
  { id: 'R-16-S01', riskId: 'R-16', title: 'Ransomware (Encryption)', cause: 'Failure of EDR or unpatched vulnerability.', event: 'Malware encrypts all servers and backups.', consequence: 'Total operational shutdown, data loss, and ransom demand.' },
  { id: 'R-16-S02', riskId: 'R-16', title: 'Double Extortion (Exfiltration)', cause: 'Lack of egress filtering or DLP.', event: 'Attacker steals data before encrypting it.', consequence: 'Data breach notification, regulatory fines, and public blackmail.' },
  { id: 'R-17-S01', riskId: 'R-17', title: 'Flat Network Lateral Movement', cause: 'Lack of network segmentation (VLANs/ACLs).', event: 'Attacker pivots from one infected PC to the Domain Controller.', consequence: 'Minor breach becomes total domain compromise.' },
  { id: 'R-17-S02', riskId: 'R-17', title: 'Insecure Network Services', cause: 'Exposing RDP/SMB directly to the internet.', event: 'Attacker scans and exploits open port.', consequence: 'Remote Code Execution and unauthorized network entry.' },
  { id: 'R-17-S03', riskId: 'R-17', title: 'Unrestricted Web Access', cause: 'Lack of web content filtering.', event: 'User visits malicious website (Drive-by download).', consequence: 'Malware infection or C2 (Command & Control) communication established.' },
  { id: 'R-18-S01', riskId: 'R-18', title: 'Unpatched Critical Vulnerability', cause: 'Slow patching process or lack of scanning.', event: 'Known CVE exploited in internet-facing system.', consequence: 'Server compromise, data theft, or ransomware entry.' },
  { id: 'R-18-S02', riskId: 'R-18', title: 'System Misconfiguration', cause: 'Default passwords or weak hardening standards.', event: 'Attacker exploits default credentials or weak setting.', consequence: 'Easy unauthorized access to systems or devices.' },
  { id: 'R-18-S03', riskId: 'R-18', title: 'Zero-Day Exploitation', cause: 'Reliance only on signature-based defenses.', event: 'Attacker uses unknown vulnerability (no patch exists).', consequence: 'Breach occurs with no immediate remediation available. ' },
  { id: 'R-19-S01', riskId: 'R-19', title: 'Missing Security Requirements', cause: 'Security team excluded from design phase.', event: 'App built without auth/encryption controls.', consequence: 'Costly redesign or fundamentally insecure application.' },
  { id: 'R-19-S02', riskId: 'R-19', title: 'Insecure Code Deployment', cause: 'Lack of SAST/DAST scanning tools.', event: 'Code containing XSS/SQLi pushed to production.', consequence: 'Web application compromise and database breach.' },
  { id: 'R-19-S03', riskId: 'R-19', title: 'No Penetration Testing', cause: 'Go-live deadlines prioritized over security.', event: 'App goes live with discoverable vulnerabilities.', consequence: 'Public breach or exploitation by researchers/attackers.' },
  { id: 'R-19-S04', riskId: 'R-19', title: 'Mixed Environments', cause: 'Cost saving or lazy configuration.', event: 'Production connected to Test; Developers access Prod data.', consequence: 'Data leakage and potential to break production from test.' },
  { id: 'R-20-S01', riskId: 'R-20', title: 'Vulnerable Libraries', cause: 'Lack of Software Composition Analysis (SCA).', event: 'App uses outdated library (e.g. Log4j).', consequence: 'Remote Code Execution via third-party component.' },
  { id: 'R-20-S02', riskId: 'R-20', title: 'Source Code Exposure', cause: 'Git repositories configured as Public or lack of secret scanning.', event: 'Secrets/Code leaked to public GitHub.', consequence: 'Credential theft and exposure of proprietary logic.' },
  { id: 'R-20-S03', riskId: 'R-20', title: 'Insecure API', cause: 'API endpoints exposed without auth or rate limiting.', event: 'API abused for mass data scraping or injection.', consequence: 'Bulk data theft and service degradation.' },
  { id: 'R-21-S01', riskId: 'R-21', title: 'Weak Encryption', cause: 'Use of deprecated algorithms (MD5/DES/SHA1).', event: 'Attacker cracks encryption or forges certificates.', consequence: 'Data exposure and loss of trust.' },
  { id: 'R-21-S02', riskId: 'R-21', title: 'Poor Key Management', cause: 'Keys hardcoded in code or stored with data.', event: 'Encryption keys compromised or lost.', consequence: 'Encrypted data becomes accessible to attacker or permanently lost.' },
  { id: 'R-22-S01', riskId: 'R-22', title: 'No Security Logging', cause: 'Logging disabled to save space/performance.', event: 'Breach occurs with no audit trail.', consequence: 'Inability to investigate, prove scope, or identify attacker.' },
  { id: 'R-22-S02', riskId: 'R-22', title: 'Failure to Detect (No SIEM)', cause: 'Logs collected but never analyzed/alerted.', event: 'Attacker operates undetected for months (Dwell Time).', consequence: 'Massive data exfiltration and persistent compromise.' },
  { id: 'R-22-S03', riskId: 'R-22', title: 'Time Sync Failure', cause: 'Lack of NTP synchronization.', event: 'Logs have different timestamps across systems.', consequence: 'Forensic reconstruction fails; evidence inadmissible.' },
  { id: 'R-23-S01', riskId: 'R-23', title: 'No Response Plan', cause: 'Lack of playbooks or incident roles.', event: 'Chaos and delay during a breach.', consequence: 'Increased damage, longer outage, and poor communication.' },
  { id: 'R-23-S02', riskId: 'R-23', title: 'Evidence Contamination', cause: 'Untrained staff rebooting or modifying infected systems.', event: 'Forensic evidence destroyed or altered.', consequence: 'Inability to prosecute or determine root cause.' },
  { id: 'R-23-S03', riskId: 'R-23', title: 'No Lessons Learned', cause: 'Rush to close tickets without review.', event: 'Root cause not fixed; same attack happens again.', consequence: 'Wasted resources and recurring breaches.' },
  { id: 'R-24-S01', riskId: 'R-24', title: 'Backup Restoration Failure', cause: 'Backups never tested or media degradation.', event: 'Attempt to restore fails during a crisis.', consequence: 'Permanent data loss and potential business failure.' },
  { id: 'R-24-S02', riskId: 'R-24', title: 'No Disaster Recovery Plan', cause: 'Lack of secondary site or failover strategy.', event: 'Primary site destroyed (Fire/Cyber).', consequence: 'Total business shutdown with no recovery path.' },
  { id: 'R-24-S03', riskId: 'R-24', title: 'ICT Continuity Failure', cause: 'IT systems cannot be recovered within RTO.', event: 'Business processes stalled due to IT outage.', consequence: 'Financial loss and breach of Service Level Agreements (SLAs).' },
  { id: 'R-25-S01', riskId: 'R-25', title: 'GDPR / Privacy Violation', cause: 'Unlawful processing or lack of consent.', event: 'Personal data processed illegally or breached.', consequence: 'Regulatory fines (4% turnover) and lawsuits.' },
  { id: 'R-25-S02', riskId: 'R-25', title: 'Intellectual Property Loss', cause: 'Weak access controls on trade secrets.', event: 'Competitor or nation-state steals IP.', consequence: 'Loss of competitive advantage and revenue.' },
  { id: 'R-25-S03', riskId: 'R-25', title: 'Records Management Failure', cause: 'Data retention policies not enforced.', event: 'Records cannot be produced for court/audit.', consequence: 'Legal penalties and adverse judgments.' },
  { id: 'R-25-S04', riskId: 'R-25', title: 'No Independent Audit', cause: 'Reliance on self-assessment only.', event: 'Security gaps remain hidden until a breach.', consequence: 'False sense of security and certification failure.' },
  { id: 'R-26-S01', riskId: 'R-26', title: 'Critical Provider Concentration', cause: 'Strategic reliance on single provider (e.g. AWS).', event: 'Primary provider fails; no failover exists.', consequence: 'Total business stoppage and DORA non-compliance.' },
  { id: 'R-26-S02', riskId: 'R-26', title: 'Unmonitored Sub-outsourcing', cause: 'Vendor outsources to 4th party without notice.', event: '4th party breached; Org data exposed.', consequence: 'Unmanaged supply chain risk and contract breach.' },
  { id: 'R-27-S01', riskId: 'R-27', title: 'Missed 24h Early Warning', cause: 'Slow incident triage and legal hesitation.', event: 'Significant incident not reported within 24 hours.', consequence: 'Regulatory fines and loss of standing with authority.' },
  { id: 'R-27-S02', riskId: 'R-27', title: 'Inaccurate Reporting', cause: 'Lack of accurate data during crisis.', event: 'Regulator misled about scope/impact.', consequence: 'Additional penalties for misleading authorities.' },
  { id: 'R-28-S01', riskId: 'R-28', title: 'Breach of Impact Tolerance', cause: 'Inadequate BCP for critical functions.', event: 'Critical service down longer than MTD.', consequence: 'Severe market harm and regulatory intervention.' },
  { id: 'R-29-S01', riskId: 'R-29', title: 'Executive Personal Liability', cause: 'Board views security as IT problem (negligence).', event: 'Regulator finds Board liable for lack of oversight.', consequence: 'Personal fines and suspension of Board members.' },
  { id: 'R-30-S01', riskId: 'R-30', title: 'TLPT / Red Team Failure', cause: 'Defenses untested against advanced threats.', event: 'Mandated Red Team successfully compromises critical systems.', consequence: 'Forced remediation and increased regulatory scrutiny.' },
  { id: 'R-31-S01', riskId: 'R-31', title: 'Shadow AI Data Leakage', cause: 'Employees using public AI for work efficiency.', event: 'Proprietary data/PII pasted into ChatGPT.', consequence: 'Data leaks to public models and loss of IP.' },
  { id: 'R-31-S02', riskId: 'R-31', title: 'EU AI Act Non-Compliance', cause: 'Deploying "High Risk" AI without assessment.', event: 'AI system deployed illegally.', consequence: 'Fines up to 7% of global turnover.' },
  { id: 'R-31-S03', riskId: 'R-31', title: 'AI Copyright Infringement', cause: 'Using AI code generators without checks.', event: 'Code violates IP/Open Source licenses.', consequence: 'Lawsuits and forced code rewrites.' },
  { id: 'R-32-S01', riskId: 'R-32', title: 'Prompt Injection', cause: 'Lack of input validation on LLM.', event: 'Attacker bypasses safety filters via prompt.', consequence: 'Data extraction or unauthorized actions via AI.' },
  { id: 'R-32-S02', riskId: 'R-32', title: 'AI Hallucination', cause: 'Blind reliance on AI output.', event: 'AI gives factually wrong critical advice.', consequence: 'Operational error or liability for bad advice.' },
  { id: 'R-32-S03', riskId: 'R-32', title: 'AI Model Theft', cause: 'API exposed without rate limiting.', event: 'Attacker reconstructs model via queries.', consequence: 'Loss of proprietary model and competitive advantage.' }
];

export async function seedRisks(prismaArg?: PrismaClient): Promise<void> {
  const db = prismaArg || prisma;

  console.log('🌱 Starting Risks Replacement Seed...');

  // ============================================
  // 1. CONTEXT LOOKUPS
  // ============================================
  const org = await db.organisationProfile.findFirst();
  const user = await db.user.findFirst();

  if (!org || !user) {
    console.error('❌ Organisation or User not found. Run main seed first.');
    return;
  }

  // ============================================
  // 2. CLEANUP EXISTING DATA
  // ============================================
  // We delete existing risks to avoid duplicates and ensure a clean slate
  console.log(`🗑️  Cleaning up existing risk data for Organisation: ${org.name}...`);
  const deleted = await db.risk.deleteMany({
    where: { organisationId: org.id },
  });
  console.log(`   Deleted ${deleted.count} existing risks.`);

  // ============================================
  // 3. SEED NEW RISKS
  // ============================================
  console.log('📝 Seeding new Risks...');
  const riskMap = new Map<string, string>(); // Map CSV RiskID -> DB Risk UUID

  for (const r of risksSource) {
    const risk = await db.risk.create({
      data: {
        riskId: r.id,
        title: r.title,
        description: r.description,
        tier: mapTier(r.tier),
        status: RiskStatus.IDENTIFIED, // Default to IDENTIFIED
        riskOwner: r.owner,
        framework: mapFramework(r.compliance),
        organisationId: org.id,
        createdById: user.id,
        // Initialize with defaults so calculations work in UI
        likelihood: LikelihoodLevel.POSSIBLE,
        impact: ImpactLevel.MODERATE,
        inherentScore: 9, // Possible(3) * Moderate(3)
        residualScore: 9,
      },
    });
    riskMap.set(r.id, risk.id);
  }
  console.log(`   ✅ Created ${risksSource.length} risks.`);

  // ============================================
  // 4. SEED NEW SCENARIOS
  // ============================================
  console.log('📝 Seeding new Risk Scenarios...');
  let scenariosCreated = 0;

  for (const s of scenariosSource) {
    const parentRiskId = riskMap.get(s.riskId);

    if (!parentRiskId) {
      console.warn(`   ⚠️  Skipping Scenario ${s.id}: Parent Risk ${s.riskId} not found.`);
      continue;
    }

    // Determine framework from parent risk
    const parentRisk = risksSource.find(r => r.id === s.riskId);
    const framework = parentRisk ? mapFramework(parentRisk.compliance) : 'ISO';

    await db.riskScenario.create({
      data: {
        scenarioId: s.id,
        title: s.title,
        cause: s.cause,
        event: s.event,
        consequence: s.consequence,
        status: ScenarioStatus.DRAFT,
        riskId: parentRiskId,
        createdById: user.id,
        framework: framework,
        // Initialize Assessment Fields with defaults
        likelihood: LikelihoodLevel.POSSIBLE,
        impact: ImpactLevel.MODERATE,
        inherentScore: 9,
        // Initialize Factor scores to baseline (e.g. 1) to avoid broken calculation UI
        f1ThreatFrequency: 1,
        f2ControlEffectiveness: 1,
        f3GapVulnerability: 1,
        f4IncidentHistory: 1,
        f5AttackSurface: 1,
        f6Environmental: 1,
        i1Financial: 1,
        i2Operational: 1,
        i3Regulatory: 1,
        i4Reputational: 1,
        i5Strategic: 1,
      },
    });
    scenariosCreated++;
  }
  console.log(`   ✅ Created ${scenariosCreated} scenarios.`);
}

async function main() {
  try {
    await seedRisks();
    console.log('\n✅ Risk Data Replacement Completed Successfully.');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run directly if this file is executed
if (require.main === module) {
  main();
}
