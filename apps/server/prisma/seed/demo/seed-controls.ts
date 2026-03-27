import { PrismaClient } from '@prisma/client';
import { DemoContext } from './index';

export async function seedControls(prisma: PrismaClient, ctx: DemoContext): Promise<void> {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // ============================================
  // 1. SCOPE ITEMS (6)
  // ============================================

  const scopeItemDefs = [
    { scopeType: 'APPLICATION' as const, code: 'APP-PG', name: 'Payment Gateway Application', criticality: 'CRITICAL' as const },
    { scopeType: 'APPLICATION' as const, code: 'APP-MP', name: 'Merchant Portal Application', criticality: 'HIGH' as const },
    { scopeType: 'PLATFORM' as const, code: 'PLAT-AWS', name: 'AWS Production Environment', criticality: 'CRITICAL' as const },
    { scopeType: 'LOCATION' as const, code: 'LOC-DUB', name: 'Dublin Data Centre', criticality: 'CRITICAL' as const },
    { scopeType: 'APPLICATION' as const, code: 'APP-CDB', name: 'Customer Database', criticality: 'CRITICAL' as const },
    { scopeType: 'APPLICATION' as const, code: 'APP-FDE', name: 'Fraud Detection Engine', criticality: 'HIGH' as const },
  ];

  const scopeItems: { id: string; code: string }[] = [];
  for (const def of scopeItemDefs) {
    const item = await prisma.scopeItem.create({
      data: {
        organisationId: ctx.orgId,
        scopeType: def.scopeType,
        code: def.code,
        name: def.name,
        criticality: def.criticality,
        createdById: ctx.users.ciso,
      },
    });
    scopeItems.push({ id: item.id, code: def.code });
  }

  // ============================================
  // 2. CONTROLS (40)
  // ============================================

  const controlDefs: {
    controlId: string;
    name: string;
    theme: 'ORGANISATIONAL' | 'PEOPLE' | 'PHYSICAL' | 'TECHNOLOGICAL';
    implementationStatus: 'IMPLEMENTED' | 'PARTIAL' | 'NOT_STARTED';
    description: string;
  }[] = [
    // ORGANISATIONAL (12)
    {
      controlId: '5.1',
      name: 'Policies for information security',
      theme: 'ORGANISATIONAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Information security policies governing payment processing operations, PCI DSS alignment, and data protection standards across ClearStream Payments.',
    },
    {
      controlId: '5.2',
      name: 'Information security roles and responsibilities',
      theme: 'ORGANISATIONAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Defined roles for CISO, DPO, security champions, and payment operations staff with clear accountability for cardholder data protection.',
    },
    {
      controlId: '5.3',
      name: 'Segregation of duties',
      theme: 'ORGANISATIONAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Separation of payment authorisation, settlement, and reconciliation duties to prevent fraud and ensure transaction integrity.',
    },
    {
      controlId: '5.4',
      name: 'Management responsibilities',
      theme: 'ORGANISATIONAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Executive commitment to information security with quarterly board reporting on payment security posture and regulatory compliance.',
    },
    {
      controlId: '5.5',
      name: 'Contact with authorities',
      theme: 'ORGANISATIONAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Established communication channels with the Central Bank of Ireland, Data Protection Commission, and relevant CERT teams for incident reporting.',
    },
    {
      controlId: '5.8',
      name: 'Information security in project management',
      theme: 'ORGANISATIONAL',
      implementationStatus: 'PARTIAL',
      description: 'Security review gates integrated into the SDLC for payment gateway features; API integration projects require threat modelling before approval.',
    },
    {
      controlId: '5.10',
      name: 'Acceptable use of information',
      theme: 'ORGANISATIONAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Acceptable use policies covering cardholder data handling, merchant credentials, and production database access restrictions.',
    },
    {
      controlId: '5.12',
      name: 'Classification of information',
      theme: 'ORGANISATIONAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Four-tier classification scheme (Public, Internal, Confidential, Restricted) with cardholder data classified as Restricted by default.',
    },
    {
      controlId: '5.15',
      name: 'Access control',
      theme: 'ORGANISATIONAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Role-based access control for payment systems with quarterly access reviews and just-in-time privileged access for production environments.',
    },
    {
      controlId: '5.23',
      name: 'Information security for cloud services',
      theme: 'ORGANISATIONAL',
      implementationStatus: 'PARTIAL',
      description: 'AWS security baseline with GuardDuty, Config Rules, and CloudTrail; multi-region encryption for payment data at rest and in transit.',
    },
    {
      controlId: '5.24',
      name: 'Information security incident management planning',
      theme: 'ORGANISATIONAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Incident response plan with payment-specific playbooks for card data breaches, merchant account compromise, and fraud detection escalation.',
    },
    {
      controlId: '5.29',
      name: 'Information security during disruption',
      theme: 'ORGANISATIONAL',
      implementationStatus: 'PARTIAL',
      description: 'Business continuity plans for payment processing with failover to secondary AWS region; DR testing conducted semi-annually.',
    },
    // PEOPLE (6)
    {
      controlId: '6.1',
      name: 'Screening',
      theme: 'PEOPLE',
      implementationStatus: 'IMPLEMENTED',
      description: 'Enhanced background checks for staff with access to payment systems including criminal record, credit, and sanctions screening.',
    },
    {
      controlId: '6.2',
      name: 'Terms and conditions of employment',
      theme: 'PEOPLE',
      implementationStatus: 'IMPLEMENTED',
      description: 'Employment contracts include confidentiality clauses for cardholder data, non-disclosure agreements, and acceptable use terms.',
    },
    {
      controlId: '6.3',
      name: 'Information security awareness, education and training',
      theme: 'PEOPLE',
      implementationStatus: 'IMPLEMENTED',
      description: 'Mandatory quarterly security awareness training covering phishing, social engineering, PCI DSS requirements, and payment fraud scenarios.',
    },
    {
      controlId: '6.4',
      name: 'Disciplinary process',
      theme: 'PEOPLE',
      implementationStatus: 'IMPLEMENTED',
      description: 'Formal disciplinary procedures for security policy violations including immediate access revocation for payment system breaches.',
    },
    {
      controlId: '6.5',
      name: 'Responsibilities after termination',
      theme: 'PEOPLE',
      implementationStatus: 'PARTIAL',
      description: 'Offboarding procedures including access revocation checklists for payment systems; contractor offboarding process needs improvement.',
    },
    {
      controlId: '6.7',
      name: 'Remote working',
      theme: 'PEOPLE',
      implementationStatus: 'IMPLEMENTED',
      description: 'Secure remote access via VPN with MFA for all payment system access; split-tunnel restrictions prevent direct internet access to cardholder data.',
    },
    // PHYSICAL (5)
    {
      controlId: '7.1',
      name: 'Physical security perimeters',
      theme: 'PHYSICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Dublin data centre secured with reinforced perimeter, mantrap entry, and 24/7 security staffing for payment processing infrastructure.',
    },
    {
      controlId: '7.2',
      name: 'Physical entry',
      theme: 'PHYSICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Biometric and smart card dual-factor access control for data centre and server rooms housing payment processing equipment.',
    },
    {
      controlId: '7.4',
      name: 'Physical security monitoring',
      theme: 'PHYSICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'CCTV coverage with 90-day retention at all entry points, server rooms, and sensitive areas; integrated with SIEM for alert correlation.',
    },
    {
      controlId: '7.8',
      name: 'Equipment siting and protection',
      theme: 'PHYSICAL',
      implementationStatus: 'NOT_STARTED',
      description: 'Environmental controls for payment processing servers including UPS, fire suppression, and climate monitoring; formal policy pending.',
    },
    {
      controlId: '7.10',
      name: 'Storage media',
      theme: 'PHYSICAL',
      implementationStatus: 'PARTIAL',
      description: 'Encrypted removable media policy in place; secure destruction procedures for media containing cardholder data need documentation.',
    },
    // TECHNOLOGICAL (17)
    {
      controlId: '8.1',
      name: 'User endpoint devices',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'MDM-managed endpoints with full disk encryption, EDR agents, and application allowlisting for staff accessing payment systems.',
    },
    {
      controlId: '8.2',
      name: 'Privileged access rights',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'PAM solution with session recording for production payment infrastructure; time-limited break-glass access with mandatory justification.',
    },
    {
      controlId: '8.3',
      name: 'Information access restriction',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Fine-grained access controls on merchant and cardholder databases; data masking applied to PAN fields in non-production environments.',
    },
    {
      controlId: '8.5',
      name: 'Secure authentication',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'MFA enforced for all payment system access; FIDO2 hardware keys for privileged accounts; adaptive authentication for merchant portal.',
    },
    {
      controlId: '8.7',
      name: 'Protection against malware',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Next-generation endpoint protection with behavioural analysis across all payment processing servers and developer workstations.',
    },
    {
      controlId: '8.8',
      name: 'Management of technical vulnerabilities',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'PARTIAL',
      description: 'Weekly vulnerability scanning of payment infrastructure; critical patches applied within 72 hours, but patch validation process needs formalisation.',
    },
    {
      controlId: '8.9',
      name: 'Configuration management',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Infrastructure-as-Code for payment environments with drift detection; CIS benchmarks applied to all production servers.',
    },
    {
      controlId: '8.12',
      name: 'Data leakage prevention',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'PARTIAL',
      description: 'DLP policies monitoring for PAN and cardholder data exfiltration via email and web; API egress monitoring in progress.',
    },
    {
      controlId: '8.15',
      name: 'Logging',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Centralised logging of all payment transactions, authentication events, and administrative actions with tamper-proof log storage.',
    },
    {
      controlId: '8.16',
      name: 'Monitoring activities',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Real-time SIEM monitoring with payment-specific correlation rules for fraud detection, unusual transaction patterns, and access anomalies.',
    },
    {
      controlId: '8.20',
      name: 'Networks security',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Network segmentation isolating cardholder data environment; micro-segmentation between payment gateway, processing, and settlement zones.',
    },
    {
      controlId: '8.22',
      name: 'Web filtering',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'DNS-layer filtering and web proxy controls for all corporate and payment processing networks with category-based blocking.',
    },
    {
      controlId: '8.24',
      name: 'Use of cryptography',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'AES-256 encryption for cardholder data at rest; TLS 1.3 for all payment API communications; HSM-managed keys for transaction signing.',
    },
    {
      controlId: '8.25',
      name: 'Secure development lifecycle',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Secure SDLC with mandatory threat modelling for payment features, SAST/DAST integration in CI/CD, and peer security code reviews.',
    },
    {
      controlId: '8.28',
      name: 'Secure coding',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'IMPLEMENTED',
      description: 'Secure coding standards based on OWASP Top 10 and PCI DSS requirements; automated code scanning for injection and cryptographic weaknesses.',
    },
    {
      controlId: '8.29',
      name: 'Security testing',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'NOT_STARTED',
      description: 'Annual penetration testing scope defined for payment gateway and merchant portal; initial engagement with external testing firm pending.',
    },
    {
      controlId: '8.32',
      name: 'Change management',
      theme: 'TECHNOLOGICAL',
      implementationStatus: 'NOT_STARTED',
      description: 'Formal change management process for payment infrastructure changes; CAB approval required for production deployments being established.',
    },
  ];

  for (const def of controlDefs) {
    const control = await prisma.control.create({
      data: {
        controlId: def.controlId,
        name: def.name,
        theme: def.theme,
        description: def.description,
        framework: 'ISO',
        implementationStatus: def.implementationStatus,
        organisationId: ctx.orgId,
        createdById: ctx.users.ciso,
      },
    });
    ctx.controlIds[def.controlId] = control.id;
  }

  // ============================================
  // 3. STATEMENT OF APPLICABILITY (SOA)
  // ============================================

  const soa = await prisma.statementOfApplicability.create({
    data: {
      version: '2.0',
      status: 'APPROVED',
      name: 'ClearStream SOA 2025',
      approvedAt: oneMonthAgo,
      approvedById: ctx.users.admin,
      organisationId: ctx.orgId,
      createdById: ctx.users.ciso,
    },
  });

  for (const def of controlDefs) {
    await prisma.sOAEntry.create({
      data: {
        controlId: def.controlId,
        controlName: def.name,
        theme: def.theme,
        applicable: true,
        implementationStatus: def.implementationStatus,
        controlRecordId: ctx.controlIds[def.controlId]!,
        soaId: soa.id,
      },
    });
  }

  // ============================================
  // 4. ASSESSMENT 1 - Completed Q4-2025 Annual
  // ============================================

  const assessment1 = await prisma.assessment.create({
    data: {
      organisationId: ctx.orgId,
      assessmentRef: 'ASM-2025-Q4',
      title: 'Q4 2025 Annual Control Assessment',
      status: 'COMPLETED',
      plannedStartDate: threeMonthsAgo,
      actualEndDate: oneMonthAgo,
      totalTests: 40,
      completedTests: 40,
      passedTests: 34,
      failedTests: 6,
      createdById: ctx.users.ciso,
      leadTesterId: ctx.users.securityLead,
      reviewerId: ctx.users.ciso,
    },
  });

  // Link all 40 controls to assessment 1
  for (const def of controlDefs) {
    await prisma.assessmentControl.create({
      data: {
        assessmentId: assessment1.id,
        controlId: ctx.controlIds[def.controlId]!,
      },
    });
  }

  // Link all 6 scope items to assessment 1
  for (const si of scopeItems) {
    await prisma.assessmentScope.create({
      data: {
        assessmentId: assessment1.id,
        scopeItemId: si.id,
      },
    });
  }

  // Assessment 1: 40 tests - 34 PASS, 4 PARTIAL, 2 FAIL
  // Deterministic results based on control implementation status
  const a1TestResults: { controlId: string; result: 'PASS' | 'PARTIAL' | 'FAIL' }[] = [
    { controlId: '5.1', result: 'PASS' },
    { controlId: '5.2', result: 'PASS' },
    { controlId: '5.3', result: 'PASS' },
    { controlId: '5.4', result: 'PASS' },
    { controlId: '5.5', result: 'PASS' },
    { controlId: '5.8', result: 'PARTIAL' },
    { controlId: '5.10', result: 'PASS' },
    { controlId: '5.12', result: 'PASS' },
    { controlId: '5.15', result: 'PASS' },
    { controlId: '5.23', result: 'PARTIAL' },
    { controlId: '5.24', result: 'PASS' },
    { controlId: '5.29', result: 'PARTIAL' },
    { controlId: '6.1', result: 'PASS' },
    { controlId: '6.2', result: 'PASS' },
    { controlId: '6.3', result: 'PASS' },
    { controlId: '6.4', result: 'PASS' },
    { controlId: '6.5', result: 'PASS' },
    { controlId: '6.7', result: 'PASS' },
    { controlId: '7.1', result: 'PASS' },
    { controlId: '7.2', result: 'PASS' },
    { controlId: '7.4', result: 'PASS' },
    { controlId: '7.8', result: 'FAIL' },
    { controlId: '7.10', result: 'PARTIAL' },
    { controlId: '8.1', result: 'PASS' },
    { controlId: '8.2', result: 'PASS' },
    { controlId: '8.3', result: 'PASS' },
    { controlId: '8.5', result: 'PASS' },
    { controlId: '8.7', result: 'PASS' },
    { controlId: '8.8', result: 'PASS' },
    { controlId: '8.9', result: 'PASS' },
    { controlId: '8.12', result: 'PASS' },
    { controlId: '8.15', result: 'PASS' },
    { controlId: '8.16', result: 'PASS' },
    { controlId: '8.20', result: 'PASS' },
    { controlId: '8.22', result: 'PASS' },
    { controlId: '8.24', result: 'PASS' },
    { controlId: '8.25', result: 'PASS' },
    { controlId: '8.28', result: 'PASS' },
    { controlId: '8.29', result: 'FAIL' },
    { controlId: '8.32', result: 'PASS' },
  ];

  for (const tr of a1TestResults) {
    const controlDef = controlDefs.find((c) => c.controlId === tr.controlId)!;
    const test = await prisma.assessmentTest.create({
      data: {
        assessmentId: assessment1.id,
        testCode: `T-${tr.controlId}`,
        testName: `Test ${controlDef.name}`,
        status: 'COMPLETED',
        result: tr.result,
        assignedTesterId: ctx.users.securityLead,
      },
    });

    await prisma.assessmentExecution.create({
      data: {
        assessmentTestId: test.id,
        executionDate: oneMonthAgo,
        testerId: ctx.users.securityLead,
        result: tr.result,
        findings: tr.result === 'PASS'
          ? `Control ${tr.controlId} operating effectively within the payment processing environment.`
          : tr.result === 'PARTIAL'
            ? `Control ${tr.controlId} partially implemented; remediation actions identified for full compliance.`
            : `Control ${tr.controlId} not yet operational; immediate remediation required for payment infrastructure compliance.`,
      },
    });
  }

  // ============================================
  // 5. ASSESSMENT 2 - In Progress Q1-2026
  // ============================================

  const assessment2 = await prisma.assessment.create({
    data: {
      organisationId: ctx.orgId,
      assessmentRef: 'ASM-2026-Q1',
      title: 'Q1 2026 Quarterly Review',
      status: 'IN_PROGRESS',
      plannedStartDate: twoWeeksAgo,
      totalTests: 40,
      completedTests: 24,
      passedTests: 20,
      failedTests: 4,
      createdById: ctx.users.ciso,
      leadTesterId: ctx.users.securityLead,
    },
  });

  // Link all 40 controls to assessment 2
  for (const def of controlDefs) {
    await prisma.assessmentControl.create({
      data: {
        assessmentId: assessment2.id,
        controlId: ctx.controlIds[def.controlId]!,
      },
    });
  }

  // Link all 6 scope items to assessment 2
  for (const si of scopeItems) {
    await prisma.assessmentScope.create({
      data: {
        assessmentId: assessment2.id,
        scopeItemId: si.id,
      },
    });
  }

  // Assessment 2: 24 COMPLETED (20 PASS, 4 FAIL), 16 PENDING
  const a2TestResults: { controlId: string; status: 'COMPLETED' | 'PENDING'; result: 'PASS' | 'PARTIAL' | 'FAIL' | null }[] = [
    { controlId: '5.1', status: 'COMPLETED', result: 'PASS' },
    { controlId: '5.2', status: 'COMPLETED', result: 'PASS' },
    { controlId: '5.3', status: 'COMPLETED', result: 'PASS' },
    { controlId: '5.4', status: 'COMPLETED', result: 'PASS' },
    { controlId: '5.5', status: 'COMPLETED', result: 'PASS' },
    { controlId: '5.8', status: 'COMPLETED', result: 'FAIL' },
    { controlId: '5.10', status: 'COMPLETED', result: 'PASS' },
    { controlId: '5.12', status: 'COMPLETED', result: 'PASS' },
    { controlId: '5.15', status: 'COMPLETED', result: 'PASS' },
    { controlId: '5.23', status: 'COMPLETED', result: 'FAIL' },
    { controlId: '5.24', status: 'COMPLETED', result: 'PASS' },
    { controlId: '5.29', status: 'COMPLETED', result: 'FAIL' },
    { controlId: '6.1', status: 'COMPLETED', result: 'PASS' },
    { controlId: '6.2', status: 'COMPLETED', result: 'PASS' },
    { controlId: '6.3', status: 'COMPLETED', result: 'PASS' },
    { controlId: '6.4', status: 'COMPLETED', result: 'PASS' },
    { controlId: '6.5', status: 'COMPLETED', result: 'FAIL' },
    { controlId: '6.7', status: 'COMPLETED', result: 'PASS' },
    { controlId: '7.1', status: 'COMPLETED', result: 'PASS' },
    { controlId: '7.2', status: 'COMPLETED', result: 'PASS' },
    { controlId: '7.4', status: 'COMPLETED', result: 'PASS' },
    { controlId: '7.8', status: 'COMPLETED', result: 'PASS' },
    { controlId: '7.10', status: 'COMPLETED', result: 'PASS' },
    { controlId: '8.1', status: 'COMPLETED', result: 'PASS' },
    { controlId: '8.2', status: 'PENDING', result: null },
    { controlId: '8.3', status: 'PENDING', result: null },
    { controlId: '8.5', status: 'PENDING', result: null },
    { controlId: '8.7', status: 'PENDING', result: null },
    { controlId: '8.8', status: 'PENDING', result: null },
    { controlId: '8.9', status: 'PENDING', result: null },
    { controlId: '8.12', status: 'PENDING', result: null },
    { controlId: '8.15', status: 'PENDING', result: null },
    { controlId: '8.16', status: 'PENDING', result: null },
    { controlId: '8.20', status: 'PENDING', result: null },
    { controlId: '8.22', status: 'PENDING', result: null },
    { controlId: '8.24', status: 'PENDING', result: null },
    { controlId: '8.25', status: 'PENDING', result: null },
    { controlId: '8.28', status: 'PENDING', result: null },
    { controlId: '8.29', status: 'PENDING', result: null },
    { controlId: '8.32', status: 'PENDING', result: null },
  ];

  for (const tr of a2TestResults) {
    const controlDef = controlDefs.find((c) => c.controlId === tr.controlId)!;
    const test = await prisma.assessmentTest.create({
      data: {
        assessmentId: assessment2.id,
        testCode: `T-${tr.controlId}`,
        testName: `Test ${controlDef.name}`,
        status: tr.status,
        result: tr.result,
        assignedTesterId: ctx.users.securityLead,
      },
    });

    if (tr.status === 'COMPLETED' && tr.result !== null) {
      await prisma.assessmentExecution.create({
        data: {
          assessmentTestId: test.id,
          executionDate: new Date(twoWeeksAgo.getTime() + Math.floor(Math.random() * 12) * 24 * 60 * 60 * 1000),
          testerId: ctx.users.securityLead,
          result: tr.result,
          findings: tr.result === 'PASS'
            ? `Q1 2026 review: Control ${tr.controlId} continues to operate effectively for payment operations.`
            : `Q1 2026 review: Control ${tr.controlId} deficiencies identified; remediation plan being developed.`,
        },
      });
    }
  }

  // ============================================
  // 6. CONTROL METRICS (8) + HISTORY (3 per metric)
  // ============================================

  // Metric 1: Policy review completion rate (5.1)
  const metric1 = await prisma.controlMetric.create({
    data: {
      controlId: ctx.controlIds['5.1']!,
      metricId: 'M-5.1-001',
      name: 'Policy review completion rate',
      description: 'Percentage of information security policies reviewed within their scheduled review cycle.',
      unit: '%',
      greenThreshold: '>=90%',
      amberThreshold: '70-89%',
      redThreshold: '<70%',
      currentValue: '95',
      status: 'GREEN',
      trend: 'STABLE',
      lastMeasured: oneMonthAgo,
      collectionFrequency: 'MONTHLY',
      createdById: ctx.users.ciso,
    },
  });

  await prisma.controlMetricHistory.create({
    data: { metricId: metric1.id, value: '93', status: 'GREEN', measuredAt: threeMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric1.id, value: '94', status: 'GREEN', measuredAt: twoMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric1.id, value: '95', status: 'GREEN', measuredAt: oneMonthAgo },
  });

  // Metric 2: Access review completion (5.15)
  const metric2 = await prisma.controlMetric.create({
    data: {
      controlId: ctx.controlIds['5.15']!,
      metricId: 'M-5.15-001',
      name: 'Access review completion',
      description: 'Percentage of user access reviews completed on schedule for payment systems.',
      unit: '%',
      greenThreshold: '>=90%',
      amberThreshold: '70-89%',
      redThreshold: '<70%',
      currentValue: '82',
      status: 'AMBER',
      trend: 'IMPROVING',
      lastMeasured: oneMonthAgo,
      collectionFrequency: 'MONTHLY',
      createdById: ctx.users.ciso,
    },
  });

  await prisma.controlMetricHistory.create({
    data: { metricId: metric2.id, value: '74', status: 'AMBER', measuredAt: threeMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric2.id, value: '78', status: 'AMBER', measuredAt: twoMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric2.id, value: '82', status: 'AMBER', measuredAt: oneMonthAgo },
  });

  // Metric 3: Security training completion (6.3)
  const metric3 = await prisma.controlMetric.create({
    data: {
      controlId: ctx.controlIds['6.3']!,
      metricId: 'M-6.3-001',
      name: 'Security training completion',
      description: 'Percentage of employees who have completed mandatory security awareness training.',
      unit: '%',
      greenThreshold: '>=90%',
      amberThreshold: '70-89%',
      redThreshold: '<70%',
      currentValue: '94',
      status: 'GREEN',
      trend: 'IMPROVING',
      lastMeasured: oneMonthAgo,
      collectionFrequency: 'MONTHLY',
      createdById: ctx.users.ciso,
    },
  });

  await prisma.controlMetricHistory.create({
    data: { metricId: metric3.id, value: '88', status: 'AMBER', measuredAt: threeMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric3.id, value: '91', status: 'GREEN', measuredAt: twoMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric3.id, value: '94', status: 'GREEN', measuredAt: oneMonthAgo },
  });

  // Metric 4: Endpoint compliance rate (8.1)
  const metric4 = await prisma.controlMetric.create({
    data: {
      controlId: ctx.controlIds['8.1']!,
      metricId: 'M-8.1-001',
      name: 'Endpoint compliance rate',
      description: 'Percentage of managed endpoints meeting security baseline configuration requirements.',
      unit: '%',
      greenThreshold: '>=95%',
      amberThreshold: '85-94%',
      redThreshold: '<85%',
      currentValue: '97',
      status: 'GREEN',
      trend: 'STABLE',
      lastMeasured: oneMonthAgo,
      collectionFrequency: 'MONTHLY',
      createdById: ctx.users.ciso,
    },
  });

  await prisma.controlMetricHistory.create({
    data: { metricId: metric4.id, value: '96', status: 'GREEN', measuredAt: threeMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric4.id, value: '97', status: 'GREEN', measuredAt: twoMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric4.id, value: '97', status: 'GREEN', measuredAt: oneMonthAgo },
  });

  // Metric 5: Malware detection rate (8.7)
  const metric5 = await prisma.controlMetric.create({
    data: {
      controlId: ctx.controlIds['8.7']!,
      metricId: 'M-8.7-001',
      name: 'Malware detection rate',
      description: 'Percentage of known malware samples detected by endpoint protection across payment infrastructure.',
      unit: '%',
      greenThreshold: '>=99%',
      amberThreshold: '95-98%',
      redThreshold: '<95%',
      currentValue: '99.8',
      status: 'GREEN',
      trend: 'STABLE',
      lastMeasured: oneMonthAgo,
      collectionFrequency: 'MONTHLY',
      createdById: ctx.users.ciso,
    },
  });

  await prisma.controlMetricHistory.create({
    data: { metricId: metric5.id, value: '99.7', status: 'GREEN', measuredAt: threeMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric5.id, value: '99.8', status: 'GREEN', measuredAt: twoMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric5.id, value: '99.8', status: 'GREEN', measuredAt: oneMonthAgo },
  });

  // Metric 6: Critical vulnerability remediation (8.8)
  const metric6 = await prisma.controlMetric.create({
    data: {
      controlId: ctx.controlIds['8.8']!,
      metricId: 'M-8.8-001',
      name: 'Critical vulnerability remediation',
      description: 'Average number of days to remediate critical vulnerabilities in payment processing infrastructure.',
      unit: 'Days',
      greenThreshold: '<=7',
      amberThreshold: '8-14',
      redThreshold: '>14',
      currentValue: '11',
      status: 'AMBER',
      trend: 'IMPROVING',
      lastMeasured: oneMonthAgo,
      collectionFrequency: 'MONTHLY',
      createdById: ctx.users.ciso,
    },
  });

  await prisma.controlMetricHistory.create({
    data: { metricId: metric6.id, value: '16', status: 'RED', measuredAt: threeMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric6.id, value: '13', status: 'AMBER', measuredAt: twoMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric6.id, value: '11', status: 'AMBER', measuredAt: oneMonthAgo },
  });

  // Metric 7: Log coverage (8.15)
  const metric7 = await prisma.controlMetric.create({
    data: {
      controlId: ctx.controlIds['8.15']!,
      metricId: 'M-8.15-001',
      name: 'Log coverage',
      description: 'Percentage of critical payment systems with centralised logging enabled and monitored.',
      unit: '%',
      greenThreshold: '>=95%',
      amberThreshold: '85-94%',
      redThreshold: '<85%',
      currentValue: '96',
      status: 'GREEN',
      trend: 'STABLE',
      lastMeasured: oneMonthAgo,
      collectionFrequency: 'MONTHLY',
      createdById: ctx.users.ciso,
    },
  });

  await prisma.controlMetricHistory.create({
    data: { metricId: metric7.id, value: '95', status: 'GREEN', measuredAt: threeMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric7.id, value: '96', status: 'GREEN', measuredAt: twoMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric7.id, value: '96', status: 'GREEN', measuredAt: oneMonthAgo },
  });

  // Metric 8: Encryption coverage (8.24)
  const metric8 = await prisma.controlMetric.create({
    data: {
      controlId: ctx.controlIds['8.24']!,
      metricId: 'M-8.24-001',
      name: 'Encryption coverage',
      description: 'Percentage of cardholder data stores and payment API channels using approved encryption standards.',
      unit: '%',
      greenThreshold: '>=99%',
      amberThreshold: '95-98%',
      redThreshold: '<95%',
      currentValue: '99.1',
      status: 'GREEN',
      trend: 'STABLE',
      lastMeasured: oneMonthAgo,
      collectionFrequency: 'MONTHLY',
      createdById: ctx.users.ciso,
    },
  });

  await prisma.controlMetricHistory.create({
    data: { metricId: metric8.id, value: '98.9', status: 'AMBER', measuredAt: threeMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric8.id, value: '99.0', status: 'GREEN', measuredAt: twoMonthsAgo },
  });
  await prisma.controlMetricHistory.create({
    data: { metricId: metric8.id, value: '99.1', status: 'GREEN', measuredAt: oneMonthAgo },
  });
}
