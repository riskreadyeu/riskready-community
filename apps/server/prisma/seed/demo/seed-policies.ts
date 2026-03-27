import { PrismaClient } from '@prisma/client';
import { DemoContext } from './index';

// ============================================
// Helper: relative date computation
// ============================================
function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

function monthsFromNow(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d;
}

function weeksAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return d;
}

function weeksFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n * 7);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ============================================
// SEED POLICIES
// ============================================

export async function seedPolicies(prisma: PrismaClient, ctx: DemoContext): Promise<void> {
  // ──────────────────────────────────────────
  // 1. Policy Documents (12 total)
  // ──────────────────────────────────────────

  const pol001 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-001',
      title: 'Information Security Policy',
      documentType: 'POLICY',
      status: 'PUBLISHED',
      version: '3.0',
      majorVersion: 3,
      minorVersion: 0,
      classification: 'INTERNAL',
      approvalLevel: 'BOARD',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CISO',
      documentOwnerId: ctx.users.ciso,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CEO',
      approverId: ctx.users.admin,
      approvalDate: monthsAgo(4),
      effectiveDate: monthsAgo(4),
      nextReviewDate: monthsFromNow(8),
      purpose: 'Establish the strategic direction for information security across ClearStream Payments, ensuring the confidentiality, integrity, and availability of all information assets in alignment with ISO 27001:2022, PCI DSS, and applicable EU financial-services regulations.',
      scope: 'This policy applies to all ClearStream Payments employees, contractors, consultants, temporary staff, and third-party service providers who access, process, store, or transmit ClearStream information assets. It covers all information systems, networks, applications, and data — whether hosted on-premises, in the cloud, or accessed remotely.',
      content: `## 1. Management Commitment

The Board of Directors and Executive Leadership of ClearStream Payments are committed to protecting the organisation's information assets. Information security is a strategic priority that underpins our ability to operate as a licensed payment institution under the European Central Bank and Central Bank of Ireland regulatory framework.

## 2. Information Security Objectives

ClearStream Payments shall:
- Protect customer payment data and personal information from unauthorised access, disclosure, or modification.
- Maintain the availability and resilience of critical payment processing systems with a target uptime of 99.95%.
- Comply with ISO 27001:2022, PCI DSS v4.0, DORA, NIS2, and GDPR requirements.
- Foster a culture of security awareness among all employees and contractors.
- Continuously improve the ISMS through regular risk assessments, internal audits, and management reviews.

## 3. Risk-Based Approach

Information security controls shall be selected and implemented based on a formal risk assessment process. Risks are evaluated using the ClearStream Risk Management Framework (see POL-003) and prioritised according to their potential impact on payment operations, regulatory standing, and customer trust.

## 4. Roles and Responsibilities

- **Board of Directors**: Approve the Information Security Policy and provide strategic oversight.
- **CEO (Fiona Murphy)**: Accountable for information security as a business function.
- **CISO (Siobhan O'Brien)**: Responsible for the design, implementation, and operation of the ISMS.
- **ISMS Manager (Roisin Kelly)**: Day-to-day management of the ISMS, including documentation and audit coordination.
- **All Employees**: Comply with security policies and report incidents promptly.

## 5. Compliance and Enforcement

Violations of this policy may result in disciplinary action up to and including termination of employment or contract. Suspected breaches must be reported to the CISO within 24 hours via the incident management portal.`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'ISMS', 'information security'],
      keywords: ['information security', 'ISMS', 'board policy'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['POL-001'] = pol001.id;

  const pol002 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-002',
      title: 'Acceptable Use Policy',
      documentType: 'POLICY',
      status: 'PUBLISHED',
      version: '2.1',
      majorVersion: 2,
      minorVersion: 1,
      classification: 'INTERNAL',
      approvalLevel: 'EXECUTIVE',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CISO',
      documentOwnerId: ctx.users.ciso,
      author: 'Security Lead',
      authorId: ctx.users.securityLead,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: monthsAgo(6),
      effectiveDate: monthsAgo(6),
      nextReviewDate: monthsFromNow(6),
      purpose: 'Define the acceptable use of ClearStream Payments information systems, networks, and devices to protect organisational assets and ensure regulatory compliance.',
      scope: 'This policy covers all employees, contractors, and third-party users who access ClearStream IT resources including workstations, mobile devices, email, internet, cloud services, and payment processing systems.',
      content: `## 1. General Principles

All users of ClearStream Payments information systems are expected to exercise responsible and ethical behaviour. IT resources are provided primarily for business purposes, and limited personal use is permitted provided it does not interfere with work duties, violate any laws, or compromise security.

## 2. Permitted Use

Users may:
- Access systems and data necessary to perform their job functions.
- Use corporate email for professional communications.
- Access the internet for work-related research and tasks.
- Use approved collaboration platforms (Slack, Microsoft Teams, Confluence).

## 3. Prohibited Activities

Users must not:
- Share credentials or authentication tokens with others.
- Install unauthorised software on corporate devices.
- Access, download, or distribute offensive, illegal, or inappropriate material.
- Connect personal devices to the production payment network.
- Use corporate systems for cryptocurrency mining or personal commercial ventures.
- Bypass or disable security controls, firewalls, or endpoint protection.
- Exfiltrate company data to personal storage accounts.

## 4. Monitoring and Privacy

ClearStream reserves the right to monitor the use of its IT resources in accordance with GDPR, the Irish Data Protection Act 2018, and the Employee Monitoring Policy. Monitoring is conducted for security, compliance, and operational purposes.

## 5. Enforcement

Breaches of this policy will be handled through the disciplinary process. Serious violations — particularly those involving payment data or customer information — may result in immediate suspension of access and referral to the relevant regulatory authority.`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'acceptable use', 'employee policy'],
      keywords: ['acceptable use', 'IT resources', 'prohibited activities'],
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });
  ctx.policyIds['POL-002'] = pol002.id;

  const pol003 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-003',
      title: 'Access Control Policy',
      documentType: 'POLICY',
      status: 'PUBLISHED',
      version: '2.0',
      majorVersion: 2,
      minorVersion: 0,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'EXECUTIVE',
      reviewFrequency: 'SEMI_ANNUAL',
      documentOwner: 'CISO',
      documentOwnerId: ctx.users.ciso,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CTO',
      approverId: ctx.users.cto,
      approvalDate: monthsAgo(3),
      effectiveDate: monthsAgo(3),
      nextReviewDate: monthsFromNow(3),
      purpose: 'Establish principles and requirements for controlling logical and physical access to ClearStream Payments information assets, payment systems, and data processing environments.',
      scope: 'Applies to all access to ClearStream systems, applications, databases, network infrastructure, cloud environments, and physical facilities across all locations (Dublin, Berlin, Lisbon).',
      content: `## 1. Access Control Principles

ClearStream Payments operates on the principles of least privilege and need-to-know. All access to information systems and data must be formally authorised, documented, and regularly reviewed.

## 2. Identity and Authentication

- All users must be uniquely identified with a personal account. Shared accounts are prohibited except for documented service accounts approved by the CISO.
- Multi-factor authentication (MFA) is mandatory for all remote access, administrative access, and access to payment systems.
- Passwords must meet complexity requirements: minimum 14 characters, combination of upper/lower case, numbers, and special characters.
- Privileged accounts must use hardware security keys (FIDO2) as a second factor.

## 3. Authorisation and Role-Based Access

- Access rights are assigned based on predefined roles aligned to job functions.
- Access to PCI DSS Cardholder Data Environment (CDE) requires explicit approval from the CISO.
- Temporary elevated access must be requested via the access management portal and is limited to 8 hours unless extended by the approver.

## 4. Access Reviews

- User access rights are reviewed quarterly for critical systems and semi-annually for all other systems.
- Privileged access is reviewed monthly by the Security Lead.
- Leavers have access revoked within 4 hours of their termination date via the automated HR-ITSM integration.

## 5. Remote Access

- Remote access is permitted only via the corporate VPN or approved zero-trust network access (ZTNA) solution.
- Split tunnelling is disabled on all corporate VPN configurations.
- Personal devices may not be used to access production payment systems.`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'access control', 'identity management'],
      keywords: ['access control', 'MFA', 'least privilege', 'RBAC'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['POL-003'] = pol003.id;

  const pol004 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-004',
      title: 'Data Classification Policy',
      documentType: 'POLICY',
      status: 'PUBLISHED',
      version: '1.2',
      majorVersion: 1,
      minorVersion: 2,
      classification: 'INTERNAL',
      approvalLevel: 'EXECUTIVE',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'DPO',
      documentOwnerId: ctx.users.dpo,
      author: 'Compliance Officer',
      authorId: ctx.users.complianceOfficer,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: monthsAgo(5),
      effectiveDate: monthsAgo(5),
      nextReviewDate: monthsFromNow(7),
      purpose: 'Define the classification levels for ClearStream Payments information assets and prescribe handling, storage, transmission, and disposal requirements for each classification level.',
      scope: 'Covers all information created, received, processed, or stored by ClearStream Payments in any format — digital, paper, verbal — across all business units and geographic locations.',
      content: `## 1. Classification Levels

ClearStream Payments uses four classification levels:

| Level | Label | Description |
|-------|-------|-------------|
| 1 | PUBLIC | Information approved for external distribution. Marketing materials, published reports. |
| 2 | INTERNAL | General business information for internal use. Not intended for external disclosure. |
| 3 | CONFIDENTIAL | Sensitive business information. Customer PII, financial reports, strategic plans. |
| 4 | RESTRICTED | Highly sensitive information. Payment card data, cryptographic keys, security architecture. |

## 2. Labelling Requirements

- All documents must display their classification level in the header or footer.
- Electronic files must include classification metadata.
- Emails containing CONFIDENTIAL or RESTRICTED data must use the approved email encryption gateway.

## 3. Handling Requirements

- **RESTRICTED** data must be encrypted at rest (AES-256) and in transit (TLS 1.3). Access is logged and monitored in real time.
- **CONFIDENTIAL** data must be encrypted in transit and stored in access-controlled systems. Sharing requires management approval.
- **INTERNAL** data must not be shared externally without explicit authorisation.
- **PUBLIC** data may be freely distributed but must be approved by the Communications team before release.

## 4. Data Retention and Disposal

Data retention periods are defined by legal, regulatory, and business requirements. When data reaches end-of-life:
- Digital media must be sanitised using NIST SP 800-88 guidelines.
- Paper records must be cross-cut shredded (DIN 66399 Level P-4 minimum).
- Disposal of RESTRICTED data must be witnessed and documented.`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['ISO 27001', 'data classification', 'GDPR'],
      keywords: ['data classification', 'labelling', 'handling', 'retention'],
      organisationId: ctx.orgId,
      createdById: ctx.users.complianceOfficer,
    },
  });
  ctx.policyIds['POL-004'] = pol004.id;

  const std001 = await prisma.policyDocument.create({
    data: {
      documentId: 'STD-001',
      title: 'Incident Response Procedure',
      documentType: 'PROCEDURE',
      status: 'PUBLISHED',
      version: '2.5',
      majorVersion: 2,
      minorVersion: 5,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'SENIOR_MANAGEMENT',
      reviewFrequency: 'SEMI_ANNUAL',
      documentOwner: 'Security Lead',
      documentOwnerId: ctx.users.securityLead,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: monthsAgo(2),
      effectiveDate: monthsAgo(2),
      nextReviewDate: monthsFromNow(4),
      purpose: 'Provide a structured and repeatable procedure for detecting, reporting, triaging, containing, eradicating, and recovering from information security incidents at ClearStream Payments.',
      scope: 'Covers all security events and incidents affecting ClearStream systems, data, personnel, or third-party services. This includes incidents detected by automated monitoring, reported by staff, or notified by external parties.',
      content: `## 1. Incident Classification

Incidents are classified using four severity levels:

| Severity | Description | Response SLA | Escalation |
|----------|-------------|-------------|------------|
| CRITICAL | Payment system breach, active data exfiltration, ransomware | 15 minutes | CISO + CEO immediately |
| HIGH | Successful phishing, unauthorised admin access, DDoS | 1 hour | CISO within 2 hours |
| MEDIUM | Malware detection, policy violation, suspicious activity | 4 hours | Security Lead within 8 hours |
| LOW | Failed login attempts, spam campaigns, minor misconfigurations | 24 hours | Logged and reviewed weekly |

## 2. Detection and Reporting

- All employees must report suspected incidents via the ServiceDesk portal or by emailing security@clearstream.ie.
- SIEM alerts are triaged by the Security Operations team within the defined SLA.
- Third-party notifications (e.g., from CERT-EU, Central Bank of Ireland) are escalated to the CISO immediately.

## 3. Containment and Eradication

Upon confirmation of an incident:
1. Isolate affected systems from the network where possible without destroying evidence.
2. Preserve forensic evidence — create disk images before remediation.
3. Identify the root cause and attack vector.
4. Remove malicious artefacts and close the attack vector.
5. Verify eradication through targeted scans and log analysis.

## 4. Recovery and Post-Incident Review

- Restore systems from verified clean backups.
- Monitor restored systems for 72 hours for signs of reinfection.
- Conduct a post-incident review within 5 business days.
- Update the risk register and control assessments as needed.
- Notify regulators (CBI, DPC) within required timeframes per DORA/GDPR.`,
      requiresAcknowledgment: false,
      tags: ['ISO 27001', 'incident response', 'DORA', 'CSIRT'],
      keywords: ['incident response', 'containment', 'eradication', 'recovery'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['STD-001'] = std001.id;

  const std002 = await prisma.policyDocument.create({
    data: {
      documentId: 'STD-002',
      title: 'Business Continuity Plan',
      documentType: 'PROCEDURE',
      status: 'PUBLISHED',
      version: '1.1',
      majorVersion: 1,
      minorVersion: 1,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'EXECUTIVE',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CTO',
      documentOwnerId: ctx.users.cto,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CEO',
      approverId: ctx.users.admin,
      approvalDate: monthsAgo(7),
      effectiveDate: monthsAgo(7),
      nextReviewDate: monthsFromNow(5),
      purpose: 'Ensure the continuity of critical payment processing services and business functions in the event of a disruptive incident, and define recovery time and recovery point objectives for ClearStream Payments.',
      scope: 'Covers all critical business processes including payment processing, settlement, reconciliation, customer onboarding, and regulatory reporting. Applies to Dublin (primary), Berlin, and Lisbon offices.',
      content: `## 1. Business Impact Analysis Summary

Critical functions and their recovery objectives:

| Function | RTO | RPO | MTPD | Priority |
|----------|-----|-----|------|----------|
| Payment Processing (SEPA/SWIFT) | 2 hours | 0 (zero data loss) | 4 hours | P1 |
| Card Acquiring Platform | 4 hours | 15 minutes | 8 hours | P1 |
| Customer Portal | 8 hours | 1 hour | 24 hours | P2 |
| Internal Systems (Email, HR) | 24 hours | 4 hours | 48 hours | P3 |
| Regulatory Reporting | 48 hours | 24 hours | 72 hours | P3 |

## 2. Recovery Strategies

- **Primary Data Centre (Dublin)**: Active-active configuration with real-time replication to the disaster recovery site.
- **DR Site (Frankfurt)**: Warm standby capable of assuming full production load within 2 hours. Tested quarterly.
- **Cloud Failover**: Critical microservices run in multi-region Kubernetes clusters (AWS eu-west-1 and eu-central-1).
- **Communication**: Emergency communication via the ClearStream Crisis App (mobile) and pre-configured conference bridge.

## 3. Plan Activation

The Business Continuity Manager (or designated deputy) may activate the plan when:
- A disruptive event has occurred or is imminent.
- Normal recovery procedures are insufficient.
- The event is expected to exceed the MTPD for any P1 function.

## 4. Testing and Exercises

- Full DR failover test: conducted annually (next scheduled: Q2 2026).
- Tabletop exercise: conducted semi-annually with senior leadership.
- Communication cascade test: conducted quarterly.
- Lessons learned from each exercise are documented and tracked to closure.`,
      requiresAcknowledgment: false,
      tags: ['ISO 27001', 'BCP', 'disaster recovery', 'DORA'],
      keywords: ['business continuity', 'disaster recovery', 'RTO', 'RPO'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['STD-002'] = std002.id;

  const std003 = await prisma.policyDocument.create({
    data: {
      documentId: 'STD-003',
      title: 'Cryptographic Controls Standard',
      documentType: 'STANDARD',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'SENIOR_MANAGEMENT',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CTO',
      documentOwnerId: ctx.users.cto,
      author: 'Security Lead',
      authorId: ctx.users.securityLead,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: monthsAgo(8),
      effectiveDate: monthsAgo(8),
      nextReviewDate: monthsFromNow(4),
      purpose: 'Define the approved cryptographic algorithms, key lengths, protocols, and key management practices for ClearStream Payments to ensure data protection in line with PCI DSS, eIDAS, and ISO 27001 Annex A 8.24.',
      scope: 'Applies to all encryption and cryptographic operations across ClearStream systems, including payment data encryption, TLS configurations, digital signatures, certificate management, and HSM operations.',
      content: `## 1. Approved Algorithms and Key Lengths

| Use Case | Algorithm | Minimum Key Length | Notes |
|----------|-----------|-------------------|-------|
| Symmetric encryption (data at rest) | AES | 256-bit | GCM mode preferred |
| Symmetric encryption (data in transit) | AES | 128-bit | Within TLS 1.3 |
| Asymmetric encryption | RSA | 3072-bit | 4096-bit for new deployments |
| Asymmetric encryption | ECDSA | P-256 (256-bit) | P-384 for payment signing |
| Hashing | SHA-2 | SHA-256 minimum | SHA-3 accepted |
| Key derivation | HKDF / PBKDF2 | - | Minimum 100,000 iterations for PBKDF2 |

## 2. Prohibited Algorithms

The following are explicitly prohibited: MD5, SHA-1, DES, 3DES, RC4, RSA < 2048-bit, and SSL/TLS versions below TLS 1.2.

## 3. TLS Configuration

- All external-facing services must use TLS 1.3.
- Internal services must use TLS 1.2 or higher.
- Certificate pinning is required for mobile applications connecting to payment APIs.
- Certificates must be issued by approved CAs and have a maximum validity of 13 months.

## 4. Key Management

- Cryptographic keys for payment processing are stored in FIPS 140-2 Level 3 certified HSMs.
- Key rotation schedule: symmetric keys rotated annually; asymmetric keys rotated every 2 years.
- Key ceremony procedures require dual control and split knowledge.
- Emergency key revocation must be achievable within 1 hour.

## 5. Certificate Lifecycle

All TLS and code-signing certificates are managed via the centralised certificate management platform. Automated alerts trigger 60 days before expiry, and renewal is automated where possible.`,
      requiresAcknowledgment: false,
      tags: ['ISO 27001', 'cryptography', 'PCI DSS', 'key management'],
      keywords: ['encryption', 'TLS', 'HSM', 'key management', 'certificates'],
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });
  ctx.policyIds['STD-003'] = std003.id;

  const std004 = await prisma.policyDocument.create({
    data: {
      documentId: 'STD-004',
      title: 'Change Management Procedure',
      documentType: 'PROCEDURE',
      status: 'PENDING_REVIEW',
      version: '1.3',
      majorVersion: 1,
      minorVersion: 3,
      classification: 'INTERNAL',
      approvalLevel: 'MANAGEMENT',
      reviewFrequency: 'QUARTERLY',
      documentOwner: 'CTO',
      documentOwnerId: ctx.users.cto,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CTO',
      approverId: ctx.users.cto,
      approvalDate: monthsAgo(4),
      effectiveDate: monthsAgo(4),
      nextReviewDate: weeksAgo(2),
      purpose: 'Define the procedure for requesting, evaluating, approving, implementing, and reviewing changes to ClearStream Payments information systems, infrastructure, and applications.',
      scope: 'Covers all changes to production and pre-production environments, including infrastructure, applications, database schemas, network configurations, security controls, and third-party integrations.',
      content: `## 1. Change Categories

| Category | Description | Approval Required | Lead Time |
|----------|-------------|-------------------|-----------|
| Standard | Pre-approved, low-risk, routine changes | Pre-approved by CAB | 24 hours |
| Normal | Changes requiring individual assessment | CAB approval | 5 business days |
| Emergency | Critical changes to resolve P1/P2 incidents | Emergency CAB (2 approvers) | Immediate |

## 2. Change Request Process

1. **Submission**: Requestor completes the change request form in ServiceDesk, including business justification, risk assessment, rollback plan, and test evidence.
2. **Review**: Change Manager reviews for completeness and assigns to the Change Advisory Board (CAB).
3. **CAB Evaluation**: Weekly CAB meeting evaluates risk, impact, resource requirements, and scheduling conflicts.
4. **Approval/Rejection**: CAB decision is documented. Rejected changes include feedback for resubmission.
5. **Implementation**: Change is executed during the approved maintenance window by the designated implementer.
6. **Post-Implementation Review**: Implementer confirms success within 4 hours. Failed changes trigger rollback.

## 3. Change Advisory Board

The CAB meets every Wednesday at 10:00 CET and consists of:
- CTO (Chair)
- Security Lead
- Platform Engineering Lead
- QA Lead
- Compliance Officer (for regulatory changes)

## 4. Emergency Changes

Emergency changes bypass the standard CAB process but require approval from at least two of: CTO, CISO, or Security Lead. Retrospective CAB review is conducted within 48 hours.

## 5. Metrics

- Change success rate target: 98%.
- Emergency change ratio target: less than 5% of total changes.
- Mean time to approve normal changes: less than 3 business days.`,
      requiresAcknowledgment: false,
      tags: ['ISO 27001', 'change management', 'ITIL'],
      keywords: ['change management', 'CAB', 'release management'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['STD-004'] = std004.id;

  const pol005 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-005',
      title: 'Third-Party Risk Management Policy',
      documentType: 'POLICY',
      status: 'DRAFT',
      version: '0.9',
      majorVersion: 0,
      minorVersion: 9,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'EXECUTIVE',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'Compliance Officer',
      documentOwnerId: ctx.users.complianceOfficer,
      author: 'Risk Analyst',
      authorId: ctx.users.riskAnalyst,
      purpose: 'Establish the framework for identifying, assessing, managing, and monitoring risks arising from ClearStream Payments relationships with third-party suppliers, vendors, and service providers.',
      scope: 'Applies to all third-party relationships where the supplier has access to ClearStream data, systems, or facilities, or where the supplier provides services critical to payment processing operations.',
      content: `## 1. Third-Party Classification

Suppliers are classified based on the criticality of services provided and the level of data access:

| Tier | Criteria | Due Diligence Level | Review Frequency |
|------|----------|-------------------|-----------------|
| Critical | Payment processing, core infrastructure, data hosting | Full assessment + on-site audit | Quarterly |
| Important | IT support, security tools, cloud SaaS | Detailed questionnaire + evidence review | Semi-annual |
| Standard | Office supplies, non-IT services, consultants | Basic questionnaire | Annual |

## 2. Onboarding Process

Before engaging a new supplier:
1. Complete a Third-Party Risk Assessment (TPRA) questionnaire.
2. Review SOC 2 Type II report (or equivalent) for Critical and Important suppliers.
3. Conduct DORA ICT concentration risk assessment for Critical suppliers.
4. Negotiate contractual security requirements including data processing agreements (GDPR Art. 28).
5. Obtain CISO approval for Critical suppliers; Compliance Officer approval for Important suppliers.

## 3. Ongoing Monitoring

- Continuous monitoring of Critical suppliers via threat intelligence feeds and financial health indicators.
- Annual reassessment of all active suppliers.
- Immediate reassessment triggered by: security incidents at the supplier, significant organisational changes, or regulatory findings.

## 4. Exit Strategy

All Critical and Important supplier contracts must include exit provisions ensuring:
- Data portability and return of all ClearStream data within 30 days.
- Secure destruction certification for all ClearStream data held by the supplier.
- Transition support for a minimum of 90 days.
- No vendor lock-in for proprietary data formats.

## 5. DORA Alignment

This policy incorporates requirements from DORA Articles 28-30 regarding ICT third-party risk management, including the register of ICT third-party providers and concentration risk monitoring.`,
      requiresAcknowledgment: false,
      tags: ['ISO 27001', 'TPRM', 'vendor management', 'DORA'],
      keywords: ['third-party risk', 'vendor management', 'supply chain', 'DORA'],
      organisationId: ctx.orgId,
      createdById: ctx.users.riskAnalyst,
    },
  });
  ctx.policyIds['POL-005'] = pol005.id;

  const pol006 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-006',
      title: 'AI & ML Governance Policy',
      documentType: 'POLICY',
      status: 'DRAFT',
      version: '0.1',
      majorVersion: 0,
      minorVersion: 1,
      classification: 'INTERNAL',
      approvalLevel: 'BOARD',
      reviewFrequency: 'SEMI_ANNUAL',
      documentOwner: 'CTO',
      documentOwnerId: ctx.users.cto,
      author: 'CISO',
      authorId: ctx.users.ciso,
      purpose: 'Establish governance principles, risk management requirements, and operational guardrails for the development, deployment, and use of artificial intelligence and machine learning systems within ClearStream Payments.',
      scope: 'Covers all AI and ML systems used or developed by ClearStream Payments, including fraud detection models, transaction risk scoring, customer service chatbots, AML screening algorithms, and any third-party AI services integrated into operations.',
      content: `## 1. Governance Principles

ClearStream Payments adopts the following principles for AI governance, aligned with the EU AI Act and ECB supervisory expectations:

- **Transparency**: AI-driven decisions affecting customers must be explainable. Black-box models are prohibited for credit and fraud decisions.
- **Fairness**: Models must be tested for bias across protected characteristics before deployment.
- **Accountability**: Each AI system must have a designated Model Owner and a documented model risk assessment.
- **Privacy by Design**: AI systems must comply with GDPR data minimisation principles. Automated decision-making under GDPR Art. 22 requires explicit consent.

## 2. Risk Classification

AI systems are classified using the EU AI Act risk framework:

| Risk Level | Examples | Requirements |
|-----------|----------|-------------|
| High Risk | Fraud detection, credit scoring, AML screening | Full model validation, bias testing, continuous monitoring, human oversight |
| Limited Risk | Customer chatbots, document summarisation | Transparency obligations, user disclosure |
| Minimal Risk | Internal analytics, reporting automation | Standard development practices |

## 3. Model Lifecycle

1. **Design**: Document intended use, training data sources, and expected performance metrics.
2. **Development**: Use version-controlled, reproducible pipelines. Segregate training and validation datasets.
3. **Validation**: Independent model validation by the Risk team before production deployment.
4. **Deployment**: Staged rollout with shadow mode testing. Rollback capability mandatory.
5. **Monitoring**: Continuous performance monitoring with automated drift detection.
6. **Retirement**: Documented decommissioning including data retention and archival.

## 4. Prohibited Uses

ClearStream Payments prohibits the use of AI for:
- Social scoring of employees or customers.
- Real-time biometric identification in the workplace.
- Fully automated decision-making on loan applications without human review.
- Generation of synthetic customer data for external use without DPO approval.`,
      requiresAcknowledgment: false,
      tags: ['AI governance', 'EU AI Act', 'machine learning', 'model risk'],
      keywords: ['artificial intelligence', 'machine learning', 'EU AI Act', 'model governance'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ciso,
    },
  });
  ctx.policyIds['POL-006'] = pol006.id;

  const pol007 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-007',
      title: 'DORA ICT Risk Management Policy',
      documentType: 'POLICY',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'CONFIDENTIAL',
      approvalLevel: 'BOARD',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'CISO',
      documentOwnerId: ctx.users.ciso,
      author: 'Compliance Officer',
      authorId: ctx.users.complianceOfficer,
      approvedBy: 'CEO',
      approverId: ctx.users.admin,
      approvalDate: monthsAgo(3),
      effectiveDate: monthsAgo(3),
      nextReviewDate: monthsFromNow(9),
      purpose: 'Fulfil the requirements of the Digital Operational Resilience Act (DORA - Regulation (EU) 2022/2554) by establishing ClearStream Payments ICT risk management framework, digital operational resilience strategy, and governance arrangements.',
      scope: 'Applies to all ICT systems, services, and processes supporting ClearStream Payments financial services operations, including on-premises infrastructure, cloud services, third-party ICT providers, and internal development activities.',
      content: `## 1. DORA Compliance Framework

ClearStream Payments has established this policy to address the five pillars of DORA:

1. **ICT Risk Management** (Articles 5-16)
2. **ICT-Related Incident Management** (Articles 17-23)
3. **Digital Operational Resilience Testing** (Articles 24-27)
4. **ICT Third-Party Risk Management** (Articles 28-44)
5. **Information Sharing** (Article 45)

## 2. ICT Risk Management Framework

The management body (Board of Directors) bears ultimate responsibility for the ICT risk management framework. The Board:
- Defines and approves the digital operational resilience strategy annually.
- Allocates sufficient budget for ICT security and resilience.
- Reviews ICT risk reports quarterly.
- Ensures at least one Board member has ICT expertise (Lars Becker, CTO).

## 3. ICT Asset Management

ClearStream maintains a comprehensive register of all ICT assets including:
- All information assets and ICT assets, including remote sites.
- ICT third-party service providers and inter-dependencies.
- Network topology and data flows for critical business functions.
- Legacy systems identified and documented with migration plans.

## 4. Protection and Prevention

- Multi-layered security architecture with defense-in-depth.
- Network segmentation isolating payment processing from corporate functions.
- Automated vulnerability scanning (weekly) and penetration testing (annual + after significant changes).
- Patch management: critical patches within 48 hours, high within 7 days.

## 5. Detection and Response

- 24/7 monitoring capability via SIEM with correlation rules for payment fraud patterns.
- Defined ICT-related incident classification and reporting thresholds per DORA Article 18.
- Major ICT-related incident reporting to CBI within 4 hours (initial) and 72 hours (intermediate).`,
      requiresAcknowledgment: true,
      acknowledgmentDeadline: 30,
      tags: ['DORA', 'ICT risk', 'digital operational resilience', 'EU regulation'],
      keywords: ['DORA', 'ICT risk management', 'operational resilience', 'Regulation 2022/2554'],
      organisationId: ctx.orgId,
      createdById: ctx.users.complianceOfficer,
    },
  });
  ctx.policyIds['POL-007'] = pol007.id;

  const pol008 = await prisma.policyDocument.create({
    data: {
      documentId: 'POL-008',
      title: 'NIS2 Compliance Procedure',
      documentType: 'PROCEDURE',
      status: 'PUBLISHED',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      classification: 'INTERNAL',
      approvalLevel: 'SENIOR_MANAGEMENT',
      reviewFrequency: 'ANNUAL',
      documentOwner: 'Compliance Officer',
      documentOwnerId: ctx.users.complianceOfficer,
      author: 'ISMS Manager',
      authorId: ctx.users.ismsManager,
      approvedBy: 'CISO',
      approverId: ctx.users.ciso,
      approvalDate: monthsAgo(2),
      effectiveDate: monthsAgo(2),
      nextReviewDate: monthsFromNow(10),
      purpose: 'Define the operational procedures for ClearStream Payments to comply with the NIS2 Directive (Directive (EU) 2022/2555), including cybersecurity risk management measures, incident reporting obligations, and supply chain security requirements.',
      scope: 'Applies to all network and information systems operated by ClearStream Payments that support the provision of payment services within the EU, as ClearStream is classified as an essential entity under NIS2.',
      content: `## 1. NIS2 Applicability

ClearStream Payments is classified as an **essential entity** under NIS2 Article 3, as a payment institution providing services within the EU internal market. This classification requires compliance with the enhanced obligations under Chapter IV of the Directive.

## 2. Cybersecurity Risk Management Measures (Article 21)

ClearStream implements the following minimum measures:

1. **Risk analysis and information system security policies** — governed by POL-001 and this procedure.
2. **Incident handling** — see STD-001 Incident Response Procedure.
3. **Business continuity and crisis management** — see STD-002 Business Continuity Plan.
4. **Supply chain security** — see POL-005 Third-Party Risk Management Policy.
5. **Security in network and information systems acquisition** — addressed in the Secure Development Lifecycle standard.
6. **Vulnerability handling and disclosure** — coordinated via the ClearStream Vulnerability Disclosure Programme.
7. **Cybersecurity testing** — penetration testing and red team exercises per the annual testing programme.
8. **Cryptography and encryption** — see STD-003 Cryptographic Controls Standard.
9. **Human resources security and access control** — see POL-003 Access Control Policy.
10. **Multi-factor authentication and continuous authentication** — mandatory per the Access Control Policy.

## 3. Incident Notification (Article 23)

ClearStream must notify the designated CSIRT (CSIRT-IE) and competent authority:
- **Early warning**: Within 24 hours of becoming aware of a significant incident.
- **Incident notification**: Within 72 hours with an initial assessment including severity and impact.
- **Final report**: Within one month, including root cause analysis and remediation measures.

Significant incident criteria:
- Affects more than 100,000 payment transactions or users.
- Causes financial loss exceeding EUR 500,000.
- Causes significant reputational damage.
- Compromises the security of payment data.

## 4. Governance and Accountability

The management body (Board of Directors) must:
- Approve the cybersecurity risk management measures.
- Oversee their implementation.
- Undertake regular cybersecurity training (annually).
- Be held personally liable for infringements under Article 32.

## 5. Penalties Awareness

Non-compliance with NIS2 can result in administrative fines of up to EUR 10,000,000 or 2% of global annual turnover for essential entities. ClearStream treats NIS2 compliance as a Board-level priority.`,
      requiresAcknowledgment: false,
      tags: ['NIS2', 'EU directive', 'cybersecurity', 'essential entity'],
      keywords: ['NIS2', 'Directive 2022/2555', 'incident notification', 'CSIRT'],
      organisationId: ctx.orgId,
      createdById: ctx.users.ismsManager,
    },
  });
  ctx.policyIds['POL-008'] = pol008.id;

  // ──────────────────────────────────────────
  // 2. Document Reviews (3 total)
  // ──────────────────────────────────────────

  // Review 1: Completed review of POL-001 (3 months ago)
  await prisma.documentReview.create({
    data: {
      documentId: pol001.id,
      reviewType: 'SCHEDULED',
      reviewDate: monthsAgo(3),
      reviewedById: ctx.users.ciso,
      outcome: 'NO_CHANGES',
      findings: 'Annual review of the Information Security Policy completed. The policy remains aligned with ISO 27001:2022, PCI DSS v4.0, and DORA requirements. No gaps identified in the current control framework.',
      recommendations: 'Consider adding explicit reference to the new AI & ML Governance Policy (POL-006) once it reaches PUBLISHED status. Update the DORA compliance cross-reference table in the next revision cycle.',
      actionItems: 'No immediate action items. Minor editorial updates to be bundled with the next planned revision.',
      changesRequired: false,
      nextReviewDate: monthsFromNow(9),
    },
  });

  // Review 2: Overdue review of STD-004 (was due 2 weeks ago)
  await prisma.documentReview.create({
    data: {
      documentId: std004.id,
      reviewType: 'SCHEDULED',
      reviewDate: weeksAgo(2),
      reviewedById: ctx.users.ismsManager,
      outcome: 'MINOR_CHANGES',
      findings: 'Quarterly review identified that the emergency change process does not align with the updated DORA incident reporting timeline (4-hour initial notification). The CAB membership list requires updating following the departure of the previous QA Lead.',
      recommendations: 'Update emergency change SLA to reference DORA Article 19 reporting obligations. Add the new QA Lead to the CAB membership. Consider automating the post-implementation review checklist.',
      actionItems: '1. Update Section 4 (Emergency Changes) to align with DORA timelines. 2. Update CAB membership list. 3. Evaluate ServiceDesk automation for PIR checklists.',
      changesRequired: true,
      changeDescription: 'Minor updates to emergency change process and CAB membership. No structural changes to the overall change management procedure.',
      nextReviewDate: monthsFromNow(3),
    },
  });

  // Review 3: Upcoming review of POL-003 (due in 3 weeks)
  await prisma.documentReview.create({
    data: {
      documentId: pol003.id,
      reviewType: 'SCHEDULED',
      reviewDate: weeksFromNow(3),
      reviewedById: ctx.users.securityLead,
      outcome: 'NO_CHANGES',
      findings: 'Scheduled semi-annual review. Preliminary assessment indicates the policy is current. The legacy payment terminal exception (EXC-001) should be reviewed in context of the upcoming PCI DSS v4.0 migration deadline.',
      recommendations: 'Assess whether the legacy payment terminal exception can be retired before its expiry date. Review MFA requirements against PCI DSS v4.0 Requirement 8.4.2.',
      actionItems: 'Prepare review materials and schedule review meeting with CISO and CTO.',
      changesRequired: false,
      nextReviewDate: monthsFromNow(6),
    },
  });

  // ──────────────────────────────────────────
  // 3. Policy Exceptions (2 total)
  // ──────────────────────────────────────────

  // Exception 1: Active exception for POL-003 (Access Control)
  await prisma.documentException.create({
    data: {
      exceptionId: 'EXC-001',
      documentId: pol003.id,
      title: 'Legacy payment terminal access exception',
      description: 'A subset of legacy Ingenico iCT250 payment terminals deployed at partner merchant locations do not support modern authentication protocols (FIDO2, TOTP). These terminals use legacy certificate-based authentication with static credentials stored in tamper-resistant secure elements.',
      justification: 'The terminals are scheduled for replacement under the PCI DSS v4.0 migration programme (Project ATLAS). Immediate replacement is not feasible due to contractual obligations with merchant partners and the lead time for provisioning next-generation Android-based terminals. An interim exception is required to permit continued operation under compensating controls.',
      scope: 'Applies to 142 legacy Ingenico iCT250 terminals across 38 merchant partner locations in Ireland and Germany. These terminals connect to the ClearStream acquiring platform via the dedicated PCI network segment (VLAN 410).',
      affectedEntities: ['Merchant acquiring operations', 'PCI CDE network segment', 'Terminal management system'],
      riskAssessment: 'Residual risk is assessed as MEDIUM. The terminals operate within a segmented network with restricted communication paths. TLS 1.2 is enforced on all terminal connections. Network monitoring detects anomalous terminal behaviour. The tamper-resistant secure elements provide physical protection for stored credentials.',
      residualRisk: 'MEDIUM',
      compensatingControls: 'Network segmentation (VLAN 410 with strict ACLs), enhanced monitoring via SIEM rules specific to terminal traffic patterns, quarterly vulnerability scans of terminal management infrastructure, physical tamper detection on all deployed terminals, and merchant partner security awareness programme.',
      status: 'ACTIVE',
      requestedById: ctx.users.cto,
      requestedAt: monthsAgo(2),
      startDate: monthsAgo(2),
      expiryDate: monthsFromNow(4),
      approvalLevel: 'SENIOR_MANAGEMENT',
      approvedById: ctx.users.ciso,
      approvalDate: monthsAgo(2),
      approvalComments: 'Exception approved with the condition that Project ATLAS terminal replacement milestones are tracked monthly. Exception will be revoked if replacement falls behind schedule by more than 30 days.',
      reviewFrequency: 'QUARTERLY',
      lastReviewDate: monthsAgo(1),
      nextReviewDate: monthsFromNow(2),
      organisationId: ctx.orgId,
    },
  });

  // Exception 2: Expired exception for STD-003 (Crypto)
  await prisma.documentException.create({
    data: {
      exceptionId: 'EXC-002',
      documentId: std003.id,
      title: 'TLS 1.2 backward compatibility exception',
      description: 'Several partner bank SWIFT connectivity gateways required TLS 1.2 with CBC cipher suites that are deprecated under the ClearStream Cryptographic Controls Standard. The standard mandates TLS 1.3 for all external connections, but these legacy bank gateways did not support TLS 1.3 at the time.',
      justification: 'SWIFT network connectivity with three correspondent banks (Bank of Ireland, Deutsche Bank AG, Banco BPI) required TLS 1.2 with AES-256-CBC cipher suites. These banks were on published upgrade roadmaps to TLS 1.3 support. Disconnecting would halt SEPA and SWIFT payment processing, resulting in regulatory and financial impact.',
      scope: 'Limited to SWIFT connectivity gateways for three correspondent bank relationships. Traffic is isolated to the SWIFT secure zone (VLAN 500) with dedicated firewall rules.',
      affectedEntities: ['SWIFT gateway infrastructure', 'Correspondent banking relationships', 'Payment processing (SEPA/SWIFT)'],
      riskAssessment: 'Residual risk was assessed as LOW. TLS 1.2 with AES-256-CBC remains cryptographically sound. The connections were point-to-point over the SWIFT network, which provides its own security layer. Enhanced logging and anomaly detection were deployed on the gateway infrastructure.',
      residualRisk: 'LOW',
      compensatingControls: 'Point-to-point connections over SWIFTNet with Alliance Lite2 security. Enhanced IDS rules monitoring for cipher downgrade attacks. Monthly review of correspondent bank TLS upgrade status. Quarterly penetration testing of SWIFT gateway infrastructure.',
      status: 'EXPIRED',
      requestedById: ctx.users.securityLead,
      requestedAt: monthsAgo(8),
      startDate: monthsAgo(8),
      expiryDate: monthsAgo(2),
      approvalLevel: 'SENIOR_MANAGEMENT',
      approvedById: ctx.users.ciso,
      approvalDate: monthsAgo(8),
      approvalComments: 'Exception approved. All three banks have confirmed TLS 1.3 migration timelines within the exception period. Monthly status updates required.',
      reviewFrequency: 'QUARTERLY',
      lastReviewDate: monthsAgo(3),
      nextReviewDate: monthsAgo(1),
      closedAt: monthsAgo(2),
      closureReason: 'All three correspondent banks completed their TLS 1.3 migrations. SWIFT gateway configurations updated to enforce TLS 1.3 only. Exception closed as planned.',
      organisationId: ctx.orgId,
    },
  });

  // ──────────────────────────────────────────
  // 4. Acknowledgment Records for POL-001
  // ──────────────────────────────────────────

  // 7 acknowledged users, 2 not acknowledged (overdue: CFO and Risk Analyst)

  // Acknowledged records
  await prisma.documentAcknowledgment.create({
    data: {
      documentId: pol001.id,
      documentVersion: '3.0',
      userId: ctx.users.admin,
      isAcknowledged: true,
      acknowledgedAt: daysAgo(115),
      method: 'WEB_PORTAL',
      ipAddress: '10.10.1.10',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      dueDate: daysAgo(90),
      remindersSent: 0,
      isOverdue: false,
    },
  });

  await prisma.documentAcknowledgment.create({
    data: {
      documentId: pol001.id,
      documentVersion: '3.0',
      userId: ctx.users.cto,
      isAcknowledged: true,
      acknowledgedAt: daysAgo(112),
      method: 'WEB_PORTAL',
      ipAddress: '10.10.2.15',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      dueDate: daysAgo(90),
      remindersSent: 0,
      isOverdue: false,
    },
  });

  await prisma.documentAcknowledgment.create({
    data: {
      documentId: pol001.id,
      documentVersion: '3.0',
      userId: ctx.users.ciso,
      isAcknowledged: true,
      acknowledgedAt: daysAgo(118),
      method: 'WEB_PORTAL',
      ipAddress: '10.10.1.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      dueDate: daysAgo(90),
      remindersSent: 0,
      isOverdue: false,
    },
  });

  await prisma.documentAcknowledgment.create({
    data: {
      documentId: pol001.id,
      documentVersion: '3.0',
      userId: ctx.users.dpo,
      isAcknowledged: true,
      acknowledgedAt: daysAgo(105),
      method: 'WEB_PORTAL',
      ipAddress: '10.10.3.8',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      dueDate: daysAgo(90),
      remindersSent: 0,
      isOverdue: false,
    },
  });

  await prisma.documentAcknowledgment.create({
    data: {
      documentId: pol001.id,
      documentVersion: '3.0',
      userId: ctx.users.ismsManager,
      isAcknowledged: true,
      acknowledgedAt: daysAgo(119),
      method: 'WEB_PORTAL',
      ipAddress: '10.10.1.30',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      dueDate: daysAgo(90),
      remindersSent: 0,
      isOverdue: false,
    },
  });

  await prisma.documentAcknowledgment.create({
    data: {
      documentId: pol001.id,
      documentVersion: '3.0',
      userId: ctx.users.securityLead,
      isAcknowledged: true,
      acknowledgedAt: daysAgo(110),
      method: 'WEB_PORTAL',
      ipAddress: '10.10.2.44',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      dueDate: daysAgo(90),
      remindersSent: 0,
      isOverdue: false,
    },
  });

  await prisma.documentAcknowledgment.create({
    data: {
      documentId: pol001.id,
      documentVersion: '3.0',
      userId: ctx.users.complianceOfficer,
      isAcknowledged: true,
      acknowledgedAt: daysAgo(108),
      method: 'WEB_PORTAL',
      ipAddress: '10.10.3.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      dueDate: daysAgo(90),
      remindersSent: 0,
      isOverdue: false,
    },
  });

  // Overdue / not-acknowledged records
  await prisma.documentAcknowledgment.create({
    data: {
      documentId: pol001.id,
      documentVersion: '3.0',
      userId: ctx.users.cfo,
      isAcknowledged: false,
      dueDate: daysAgo(90),
      remindersSent: 3,
      lastReminderAt: daysAgo(7),
      isOverdue: true,
    },
  });

  await prisma.documentAcknowledgment.create({
    data: {
      documentId: pol001.id,
      documentVersion: '3.0',
      userId: ctx.users.riskAnalyst,
      isAcknowledged: false,
      dueDate: daysAgo(90),
      remindersSent: 2,
      lastReminderAt: daysAgo(14),
      isOverdue: true,
    },
  });
}
