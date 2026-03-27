import { PrismaClient } from '@prisma/client';
import { DemoContext } from './index';

export async function seedOrganisation(prisma: PrismaClient, ctx: DemoContext): Promise<void> {
  // ============================================
  // 1. Organisation Profile
  // ============================================
  const org = await prisma.organisationProfile.create({
    data: {
      name: 'ClearStream Payments Ltd',
      legalName: 'ClearStream Payments Limited',
      description:
        'Mid-size European fintech specialising in payment processing, regulated under DORA and NIS2',
      industrySector: 'financial_services',
      industrySubsector: 'Payment Processing',
      marketPosition: 'niche_player',
      employeeCount: 156,
      size: 'medium',
      annualRevenue: 28000000,
      revenueCurrency: 'EUR',
      revenueTrend: 'growing',
      headquartersAddress: '42 Grand Canal Dock, Dublin 2, Ireland',
      registeredAddress: '42 Grand Canal Dock, Dublin 2, D02 HW94, Ireland',
      contactEmail: 'info@clearstream-payments.ie',
      contactPhone: '+353 1 234 5678',
      website: 'https://www.clearstream-payments.ie',
      foundedYear: 2018,
      registrationNumber: 'IE654321',
      taxIdentification: 'IE9876543W',
      naceCode: '64.19',
      sicCode: '6159',
      operatingCountries: ['Ireland', 'Germany', 'Portugal'],
      revenueStreams: [
        'Transaction Fees',
        'Platform Subscriptions',
        'Fraud Detection SaaS',
        'Premium Support',
      ],
      fiscalYearStart: '01-01',
      reportingCurrency: 'EUR',
      employeeGrowthRate: 22,
      remoteWorkPercentage: 35,
      missionStatement: 'Making payments seamless, secure, and compliant across Europe',
      visionStatement: 'The most trusted payment infrastructure for European merchants',
      coreValues: ['Security First', 'Regulatory Excellence', 'Customer Trust', 'Innovation'],
      strategicObjectives: [
        'Maintain ISO 27001 certification',
        'Achieve DORA compliance by Q2 2025',
        'Expand to 5 new EU markets',
        'Reduce fraud rate below 0.01%',
      ],
      businessModel: 'B2B payment processing with SaaS fraud detection',
      valueProposition:
        'PCI-DSS Level 1 compliant payment gateway with AI-powered fraud detection, reducing merchant chargeback rates by 60%',
      ismsScope:
        'The ISMS covers all information assets, systems, and processes related to payment processing, merchant portal, and fraud detection services across all ClearStream offices and cloud infrastructure.',
      ismsPolicy:
        'ClearStream Payments is committed to protecting the confidentiality, integrity, and availability of all payment data and information assets.',
      ismsObjectives: [
        'Maintain zero critical payment data breaches',
        'Achieve 99.99% payment gateway availability',
        'Complete security awareness training for 100% of staff quarterly',
        'Conduct monthly vulnerability assessments',
      ],
      departmentsInScope: [
        'Executive',
        'Engineering',
        'Information Security',
        'Operations',
        'Finance',
        'People & Culture',
      ],
      locationsInScope: ['Dublin HQ', 'Berlin Office', 'Lisbon Office'],
      scopeExclusions: 'Marketing activities and brand management',
      exclusionJustification:
        'Marketing activities do not handle payment data or sensitive customer information',
      isoCertificationStatus: 'certified',
      certificationBody: 'BSI Group',
      certificateNumber: 'IS 789012',
      certificationDate: new Date('2024-03-15'),
      certificationExpiry: new Date('2026-09-15'),
      nextAuditDate: new Date('2026-06-15'),
      riskAppetite:
        'Conservative risk appetite with very low tolerance for payment security and regulatory compliance risks. Moderate appetite for innovation and market expansion.',
      stackType: 'Cloud_Native',
      securityMaturity: 'Managed',
      usersHaveLocalAdmin: false,
      internetExposure: 'High',
      marginHealth: 'Standard',
      hasInsurance: true,
      insuranceDeductible: 50000,
      maxTolerableDowntime: 4,
      riskPhilosophy: 'Fortress',
      riskAcceptanceThreshold: 6,
      dataVolumeClassification: 'High',
      aiUsageLevel: 'Enterprise',
      digitalTransformationStage: 'managed',
      technologyAdoptionRate: 80,
      innovationFocus: [
        'AI/ML Fraud Detection',
        'Real-time Payment Processing',
        'Open Banking APIs',
        'Blockchain Settlement',
      ],
      sustainabilityGoals: [
        'Carbon neutral operations by 2028',
        '100% renewable energy for cloud workloads',
      ],
      esgRating: 'B+',
      isDoraApplicable: true,
      doraEntityType: 'payment_institution',
      doraRegime: 'full',
      isNis2Applicable: true,
      nis2EntityClassification: 'important',
      nis2Sector: 'banking',
      nis2AnnexType: 'annex_i',
      primarySupervisoryAuthority: 'Central Bank of Ireland',
      supervisoryAuthorityCountry: 'Ireland',
      createdById: ctx.users.admin,
    },
  });

  ctx.orgId = org.id;

  // ============================================
  // 2. Locations
  // ============================================
  const dublinHQ = await prisma.location.create({
    data: {
      locationCode: 'LOC-DUB-HQ',
      name: 'Dublin Headquarters',
      locationType: 'headquarters',
      address: '42 Grand Canal Dock',
      city: 'Dublin',
      state: 'Leinster',
      country: 'Ireland',
      postalCode: 'D02 HW94',
      region: 'EMEA',
      timezone: 'Europe/Dublin',
      latitude: 53.3389,
      longitude: -6.2389,
      employeeCount: 86,
      maxCapacity: 120,
      physicalSecurityLevel: 'high',
      accessControlType: 'biometric',
      securityFeatures: [
        '24/7 Security',
        'CCTV',
        'Biometric Access',
        'Visitor Management',
        'Man-trap Entry',
      ],
      isDataCenter: false,
      hasServerRoom: true,
      networkType: 'fiber',
      backupPower: true,
      inIsmsScope: true,
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  const berlinOffice = await prisma.location.create({
    data: {
      locationCode: 'LOC-BER',
      name: 'Berlin Engineering Office',
      locationType: 'branch_office',
      address: '15 Friedrichstraße',
      city: 'Berlin',
      country: 'Germany',
      postalCode: '10117',
      region: 'EMEA',
      timezone: 'Europe/Berlin',
      latitude: 52.52,
      longitude: 13.405,
      employeeCount: 48,
      maxCapacity: 60,
      physicalSecurityLevel: 'high',
      accessControlType: 'card_access',
      securityFeatures: ['CCTV', 'Access Cards', 'Reception Security'],
      isDataCenter: false,
      hasServerRoom: false,
      networkType: 'fiber',
      backupPower: false,
      inIsmsScope: true,
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  const lisbonOffice = await prisma.location.create({
    data: {
      locationCode: 'LOC-LIS',
      name: 'Lisbon Support Centre',
      locationType: 'branch_office',
      address: '88 Avenida da Liberdade',
      city: 'Lisbon',
      country: 'Portugal',
      postalCode: '1250-096',
      region: 'EMEA',
      timezone: 'Europe/Lisbon',
      latitude: 38.7223,
      longitude: -9.1393,
      employeeCount: 22,
      maxCapacity: 40,
      physicalSecurityLevel: 'medium',
      accessControlType: 'card_access',
      securityFeatures: ['CCTV', 'Access Cards', 'Building Security'],
      isDataCenter: false,
      hasServerRoom: false,
      networkType: 'fiber',
      backupPower: false,
      inIsmsScope: true,
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  ctx.locations = {
    dublin: dublinHQ.id,
    berlin: berlinOffice.id,
    lisbon: lisbonOffice.id,
  };

  // ============================================
  // 3. Departments
  // ============================================
  const executive = await prisma.department.create({
    data: {
      name: 'Executive',
      departmentCode: 'CS-EXEC',
      description:
        'Senior leadership team responsible for strategic direction, corporate governance, and overall business performance of ClearStream Payments.',
      departmentCategory: 'management',
      functionType: 'management',
      criticalityLevel: 'critical',
      headcount: 5,
      budget: 1500000,
      budgetCurrency: 'EUR',
      departmentHeadId: ctx.users.admin,
      keyResponsibilities: [
        'Corporate strategy and vision',
        'Regulatory relationship management',
        'Board governance and reporting',
        'Capital allocation and M&A',
        'ISMS management review',
      ],
      contactEmail: 'executive@clearstream-payments.ie',
      isActive: true,
      handlesPersonalData: true,
      handlesFinancialData: true,
      createdById: ctx.users.admin,
    },
  });

  const engineering = await prisma.department.create({
    data: {
      name: 'Engineering',
      departmentCode: 'CS-ENG',
      description:
        'Core engineering team building and maintaining the payment gateway, merchant portal, and fraud detection engine. Responsible for platform reliability and security.',
      departmentCategory: 'revenue_generating',
      functionType: 'core_business',
      criticalityLevel: 'critical',
      headcount: 62,
      budget: 8000000,
      budgetCurrency: 'EUR',
      departmentHeadId: ctx.users.cto,
      keyResponsibilities: [
        'Payment gateway development and maintenance',
        'Fraud detection engine development',
        'Merchant portal development',
        'Platform reliability and SRE',
        'Security-by-design implementation',
        'CI/CD pipeline management',
      ],
      contactEmail: 'engineering@clearstream-payments.ie',
      isActive: true,
      handlesPersonalData: true,
      handlesFinancialData: true,
      createdById: ctx.users.admin,
    },
  });

  const infoSec = await prisma.department.create({
    data: {
      name: 'Information Security',
      departmentCode: 'CS-ISEC',
      description:
        'Information security team responsible for the ISMS, security operations, vulnerability management, and regulatory compliance (DORA, NIS2, PCI-DSS).',
      departmentCategory: 'compliance_regulatory',
      functionType: 'support',
      criticalityLevel: 'critical',
      headcount: 14,
      budget: 2200000,
      budgetCurrency: 'EUR',
      departmentHeadId: ctx.users.ciso,
      keyResponsibilities: [
        'ISMS management and ISO 27001 compliance',
        'Security operations centre (SOC)',
        'Vulnerability management and penetration testing',
        'DORA and NIS2 compliance',
        'Security awareness training',
        'Incident response coordination',
        'Third-party risk assessments',
      ],
      contactEmail: 'security@clearstream-payments.ie',
      isActive: true,
      handlesPersonalData: true,
      handlesFinancialData: false,
      createdById: ctx.users.admin,
    },
  });

  const operations = await prisma.department.create({
    data: {
      name: 'Operations',
      departmentCode: 'CS-OPS',
      description:
        'Operations team managing payment processing workflows, merchant onboarding, transaction monitoring, and customer support operations.',
      departmentCategory: 'support_function',
      functionType: 'support',
      criticalityLevel: 'high',
      headcount: 28,
      budget: 1800000,
      budgetCurrency: 'EUR',
      keyResponsibilities: [
        'Payment processing operations',
        'Merchant onboarding and KYC',
        'Transaction monitoring and reconciliation',
        'Customer support (Tier 1 & 2)',
        'Operational risk management',
        'Service level management',
      ],
      contactEmail: 'operations@clearstream-payments.ie',
      isActive: true,
      handlesPersonalData: true,
      handlesFinancialData: true,
      createdById: ctx.users.admin,
    },
  });

  const finance = await prisma.department.create({
    data: {
      name: 'Finance',
      departmentCode: 'CS-FIN',
      description:
        'Finance department overseeing financial planning, treasury, regulatory reporting, and compliance with financial regulations across all jurisdictions.',
      departmentCategory: 'support_function',
      functionType: 'support',
      criticalityLevel: 'high',
      headcount: 18,
      budget: 1200000,
      budgetCurrency: 'EUR',
      departmentHeadId: ctx.users.cfo,
      keyResponsibilities: [
        'Financial planning and analysis',
        'Treasury and cash management',
        'Regulatory financial reporting',
        'Tax compliance across jurisdictions',
        'Budget management and cost control',
        'Audit liaison',
      ],
      contactEmail: 'finance@clearstream-payments.ie',
      isActive: true,
      handlesPersonalData: true,
      handlesFinancialData: true,
      createdById: ctx.users.admin,
    },
  });

  const peopleCulture = await prisma.department.create({
    data: {
      name: 'People & Culture',
      departmentCode: 'CS-P&C',
      description:
        'People and culture team managing talent acquisition, employee development, HR operations, and workplace culture across all three offices.',
      departmentCategory: 'support_function',
      functionType: 'support',
      criticalityLevel: 'medium',
      headcount: 12,
      budget: 800000,
      budgetCurrency: 'EUR',
      keyResponsibilities: [
        'Talent acquisition and recruitment',
        'Employee onboarding and offboarding',
        'Learning and development',
        'Performance management',
        'Compensation and benefits',
        'Workplace culture and engagement',
      ],
      contactEmail: 'people@clearstream-payments.ie',
      isActive: true,
      handlesPersonalData: true,
      handlesFinancialData: false,
      createdById: ctx.users.admin,
    },
  });

  ctx.departments = {
    executive: executive.id,
    engineering: engineering.id,
    infoSec: infoSec.id,
    operations: operations.id,
    finance: finance.id,
    peopleCulture: peopleCulture.id,
  };

  // ============================================
  // 4. Business Processes
  // ============================================
  await prisma.businessProcess.create({
    data: {
      name: 'Payment Processing',
      processCode: 'PROC-PAY',
      description:
        'End-to-end payment transaction processing including authorisation, clearing, and settlement for merchant transactions across all supported payment methods and currencies.',
      processType: 'core',
      criticalityLevel: 'critical',
      departmentId: operations.id,
      processOwnerId: ctx.users.admin,
      inputs: [
        'Merchant transaction requests',
        'Cardholder payment data',
        'Currency exchange rates',
        'Fraud scoring results',
      ],
      outputs: [
        'Transaction authorisation responses',
        'Settlement files',
        'Transaction receipts',
        'Reconciliation reports',
      ],
      keyActivities: [
        'Transaction authorisation',
        'Fraud screening',
        'Currency conversion',
        'Clearing and settlement',
        'Reconciliation',
        'Chargeback processing',
      ],
      stakeholders: [
        'Merchants',
        'Acquiring banks',
        'Card networks',
        'Payment schemes',
        'Operations team',
      ],
      systemDependencies: [
        'Payment Gateway',
        'Fraud Detection Engine',
        'Core Banking System',
        'Card Network Interfaces',
      ],
      frequency: 'continuous',
      automationLevel: 'fully_automated',
      bcpEnabled: true,
      bcpCriticality: 'critical',
      recoveryTimeObjectiveMinutes: 15,
      recoveryPointObjectiveMinutes: 1,
      maximumTolerableDowntimeMinutes: 60,
      minimumStaff: 5,
      biaStatus: 'completed',
      biaCompletedAt: new Date('2025-09-15'),
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.businessProcess.create({
    data: {
      name: 'Merchant Onboarding',
      processCode: 'PROC-ONBOARD',
      description:
        'End-to-end merchant onboarding process including KYC/KYB verification, risk assessment, contract execution, and technical integration for new payment processing clients.',
      processType: 'core',
      criticalityLevel: 'high',
      departmentId: operations.id,
      processOwnerId: ctx.users.admin,
      inputs: [
        'Merchant application forms',
        'KYC/KYB documentation',
        'Business registration documents',
        'Financial statements',
      ],
      outputs: [
        'Approved merchant accounts',
        'API credentials',
        'Integration documentation',
        'Risk assessment reports',
      ],
      keyActivities: [
        'Application review',
        'KYC/KYB verification',
        'Risk assessment',
        'Contract negotiation and execution',
        'Technical integration support',
        'Go-live validation',
      ],
      stakeholders: [
        'Prospective merchants',
        'Compliance team',
        'Sales team',
        'Engineering team',
      ],
      systemDependencies: [
        'CRM System',
        'KYC Platform',
        'Merchant Portal',
        'Document Management System',
      ],
      frequency: 'daily',
      automationLevel: 'partially_automated',
      cycleTimeHours: 72,
      bcpEnabled: true,
      bcpCriticality: 'high',
      recoveryTimeObjectiveMinutes: 480,
      recoveryPointObjectiveMinutes: 60,
      maximumTolerableDowntimeMinutes: 1440,
      minimumStaff: 3,
      biaStatus: 'completed',
      biaCompletedAt: new Date('2025-09-20'),
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.businessProcess.create({
    data: {
      name: 'Fraud Detection',
      processCode: 'PROC-FRAUD',
      description:
        'Real-time and batch fraud detection using AI/ML models, rules engines, and behavioural analytics to identify and prevent fraudulent payment transactions.',
      processType: 'core',
      criticalityLevel: 'critical',
      departmentId: engineering.id,
      processOwnerId: ctx.users.cto,
      inputs: [
        'Transaction data streams',
        'Historical fraud patterns',
        'Device fingerprints',
        'Behavioural analytics data',
        'Third-party fraud intelligence feeds',
      ],
      outputs: [
        'Fraud risk scores',
        'Transaction block/allow decisions',
        'Fraud alert notifications',
        'Model performance reports',
        'Fraud trend analytics',
      ],
      keyActivities: [
        'Real-time transaction scoring',
        'ML model training and deployment',
        'Rule engine management',
        'False positive review',
        'Fraud pattern analysis',
        'Model performance monitoring',
      ],
      stakeholders: [
        'Engineering team',
        'Operations team',
        'Merchants',
        'Card networks',
        'Data science team',
      ],
      systemDependencies: [
        'Fraud Detection Engine',
        'ML Platform',
        'Payment Gateway',
        'Data Warehouse',
      ],
      frequency: 'continuous',
      automationLevel: 'fully_automated',
      bcpEnabled: true,
      bcpCriticality: 'critical',
      recoveryTimeObjectiveMinutes: 5,
      recoveryPointObjectiveMinutes: 0,
      maximumTolerableDowntimeMinutes: 30,
      minimumStaff: 3,
      biaStatus: 'completed',
      biaCompletedAt: new Date('2025-09-10'),
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.businessProcess.create({
    data: {
      name: 'Regulatory Reporting',
      processCode: 'PROC-REG',
      description:
        'Preparation and submission of regulatory reports to the Central Bank of Ireland, BaFin, and other supervisory authorities as required under DORA, NIS2, and payment regulations.',
      processType: 'support',
      criticalityLevel: 'high',
      departmentId: finance.id,
      processOwnerId: ctx.users.cfo,
      inputs: [
        'Transaction volume data',
        'Financial statements',
        'Incident reports',
        'Compliance assessment results',
        'Risk register data',
      ],
      outputs: [
        'Regulatory filings',
        'Supervisory reports',
        'Compliance dashboards',
        'Audit trail documentation',
      ],
      keyActivities: [
        'Data collection and validation',
        'Report generation',
        'Internal review and approval',
        'Regulatory submission',
        'Regulator query response',
        'Filing archive management',
      ],
      stakeholders: [
        'Central Bank of Ireland',
        'BaFin',
        'Finance team',
        'Compliance team',
        'External auditors',
      ],
      systemDependencies: [
        'Financial Reporting System',
        'Data Warehouse',
        'Document Management System',
      ],
      frequency: 'monthly',
      automationLevel: 'partially_automated',
      bcpEnabled: true,
      bcpCriticality: 'high',
      recoveryTimeObjectiveMinutes: 240,
      recoveryPointObjectiveMinutes: 60,
      maximumTolerableDowntimeMinutes: 480,
      minimumStaff: 2,
      biaStatus: 'completed',
      biaCompletedAt: new Date('2025-10-01'),
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.businessProcess.create({
    data: {
      name: 'Incident Response',
      processCode: 'PROC-IR',
      description:
        'Security and operational incident detection, triage, containment, eradication, and recovery process aligned with ISO 27001 Annex A controls and DORA incident reporting requirements.',
      processType: 'support',
      criticalityLevel: 'critical',
      departmentId: infoSec.id,
      processOwnerId: ctx.users.ciso,
      inputs: [
        'Security alerts and alarms',
        'SOC monitoring feeds',
        'User-reported incidents',
        'Threat intelligence feeds',
        'Vulnerability scan results',
      ],
      outputs: [
        'Incident reports',
        'Root cause analyses',
        'Lessons learned documents',
        'Regulatory incident notifications',
        'Remediation action plans',
      ],
      keyActivities: [
        'Incident detection and triage',
        'Severity classification',
        'Containment and isolation',
        'Evidence preservation',
        'Eradication and recovery',
        'Post-incident review',
        'Regulatory notification (DORA Art. 19)',
      ],
      stakeholders: [
        'Information Security team',
        'Engineering team',
        'Executive team',
        'Regulators',
        'Affected merchants',
      ],
      systemDependencies: ['SIEM', 'Ticketing System', 'Communication Platform', 'Forensics Tools'],
      frequency: 'event_driven',
      automationLevel: 'partially_automated',
      bcpEnabled: true,
      bcpCriticality: 'critical',
      recoveryTimeObjectiveMinutes: 30,
      recoveryPointObjectiveMinutes: 5,
      maximumTolerableDowntimeMinutes: 120,
      minimumStaff: 4,
      biaStatus: 'completed',
      biaCompletedAt: new Date('2025-09-05'),
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  // ============================================
  // 5. Security Committees
  // ============================================
  const ismsSteeringCommittee = await prisma.securityCommittee.create({
    data: {
      name: 'ISMS Steering Committee',
      committeeType: 'steering',
      description:
        'Senior management committee responsible for strategic direction, resource allocation, and management review of the Information Security Management System.',
      chairId: ctx.users.admin,
      authorityLevel: 'strategic',
      meetingFrequency: 'quarterly',
      isActive: true,
      establishedDate: new Date('2023-01-15'),
      createdById: ctx.users.admin,
    },
  });

  const riskCommittee = await prisma.securityCommittee.create({
    data: {
      name: 'Risk Committee',
      committeeType: 'risk',
      description:
        'Committee responsible for overseeing risk identification, assessment, treatment, and monitoring across the organisation. Reviews risk register and treatment plans.',
      chairId: ctx.users.ciso,
      authorityLevel: 'tactical',
      meetingFrequency: 'monthly',
      isActive: true,
      establishedDate: new Date('2023-03-01'),
      createdById: ctx.users.admin,
    },
  });

  const cab = await prisma.securityCommittee.create({
    data: {
      name: 'Change Advisory Board',
      committeeType: 'advisory',
      description:
        'Technical advisory board responsible for evaluating, prioritising, and approving changes to production systems and infrastructure.',
      chairId: ctx.users.cto,
      authorityLevel: 'operational',
      meetingFrequency: 'weekly',
      isActive: true,
      establishedDate: new Date('2023-02-01'),
      createdById: ctx.users.admin,
    },
  });

  // ============================================
  // 6. Committee Memberships
  // ============================================

  // ISMS Steering Committee memberships
  const ismsMembershipCeo = await prisma.committeeMembership.create({
    data: {
      userId: ctx.users.admin,
      committeeId: ismsSteeringCommittee.id,
      role: 'Chair',
      responsibilities: 'Chairs meetings, sets strategic direction for ISMS, approves resource allocation',
      votingRights: true,
      isActive: true,
      startDate: new Date('2023-01-15'),
      createdById: ctx.users.admin,
    },
  });

  const ismsMembershipCiso = await prisma.committeeMembership.create({
    data: {
      userId: ctx.users.ciso,
      committeeId: ismsSteeringCommittee.id,
      role: 'ISMS Representative',
      responsibilities:
        'Reports on ISMS performance, presents risk updates, recommends security improvements',
      votingRights: true,
      isActive: true,
      startDate: new Date('2023-01-15'),
      createdById: ctx.users.admin,
    },
  });

  const ismsMembershipCto = await prisma.committeeMembership.create({
    data: {
      userId: ctx.users.cto,
      committeeId: ismsSteeringCommittee.id,
      role: 'Technology Representative',
      responsibilities: 'Advises on technical security architecture and engineering capacity',
      votingRights: true,
      isActive: true,
      startDate: new Date('2023-01-15'),
      createdById: ctx.users.admin,
    },
  });

  const ismsMembershipCfo = await prisma.committeeMembership.create({
    data: {
      userId: ctx.users.cfo,
      committeeId: ismsSteeringCommittee.id,
      role: 'Finance Representative',
      responsibilities: 'Reviews budget implications, approves security investment business cases',
      votingRights: true,
      isActive: true,
      startDate: new Date('2023-01-15'),
      createdById: ctx.users.admin,
    },
  });

  // Risk Committee memberships
  const riskMembershipCiso = await prisma.committeeMembership.create({
    data: {
      userId: ctx.users.ciso,
      committeeId: riskCommittee.id,
      role: 'Chair',
      responsibilities: 'Chairs risk committee, presents risk register updates, drives risk treatment',
      votingRights: true,
      isActive: true,
      startDate: new Date('2023-03-01'),
      createdById: ctx.users.admin,
    },
  });

  const riskMembershipIsmsManager = await prisma.committeeMembership.create({
    data: {
      userId: ctx.users.ismsManager,
      committeeId: riskCommittee.id,
      role: 'ISMS Manager',
      responsibilities: 'Maintains risk register, coordinates risk assessments, tracks treatment plans',
      votingRights: true,
      isActive: true,
      startDate: new Date('2023-03-01'),
      createdById: ctx.users.admin,
    },
  });

  const riskMembershipRiskAnalyst = await prisma.committeeMembership.create({
    data: {
      userId: ctx.users.riskAnalyst,
      committeeId: riskCommittee.id,
      role: 'Risk Analyst',
      responsibilities: 'Performs quantitative risk analysis, prepares risk reports and dashboards',
      votingRights: false,
      isActive: true,
      startDate: new Date('2023-03-01'),
      createdById: ctx.users.admin,
    },
  });

  const riskMembershipDpo = await prisma.committeeMembership.create({
    data: {
      userId: ctx.users.dpo,
      committeeId: riskCommittee.id,
      role: 'Data Protection Advisor',
      responsibilities: 'Advises on data protection risks, DPIA requirements, and privacy impact',
      votingRights: true,
      isActive: true,
      startDate: new Date('2023-03-01'),
      createdById: ctx.users.admin,
    },
  });

  // Change Advisory Board memberships
  await prisma.committeeMembership.create({
    data: {
      userId: ctx.users.cto,
      committeeId: cab.id,
      role: 'Chair',
      responsibilities: 'Chairs CAB meetings, makes final approval decisions on changes',
      votingRights: true,
      isActive: true,
      startDate: new Date('2023-02-01'),
      createdById: ctx.users.admin,
    },
  });

  await prisma.committeeMembership.create({
    data: {
      userId: ctx.users.securityLead,
      committeeId: cab.id,
      role: 'Security Reviewer',
      responsibilities:
        'Reviews change requests for security implications, approves security-related changes',
      votingRights: true,
      isActive: true,
      startDate: new Date('2023-02-01'),
      createdById: ctx.users.admin,
    },
  });

  await prisma.committeeMembership.create({
    data: {
      userId: ctx.users.ciso,
      committeeId: cab.id,
      role: 'Security Advisor',
      responsibilities: 'Provides security oversight for high-risk changes',
      votingRights: true,
      isActive: true,
      startDate: new Date('2023-02-01'),
      createdById: ctx.users.admin,
    },
  });

  // ============================================
  // 7. Committee Meetings
  // ============================================

  // Meeting 1: Q4 2025 ISMS Review (3 weeks ago)
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
  threeWeeksAgo.setHours(10, 0, 0, 0);

  const meeting1 = await prisma.committeeMeeting.create({
    data: {
      committeeId: ismsSteeringCommittee.id,
      meetingNumber: 'ISMS-2025-Q4',
      title: 'Q4 2025 ISMS Review',
      meetingType: 'regular',
      meetingDate: threeWeeksAgo,
      startTime: '10:00',
      endTime: '12:00',
      durationMinutes: 120,
      locationType: 'hybrid',
      physicalLocation: 'Dublin HQ - Board Room',
      virtualMeetingLink: 'https://meet.clearstream-payments.ie/isms-q4-2025',
      agenda:
        '1. Review of Q4 2025 security metrics\n2. DORA compliance progress update\n3. Risk register review\n4. Internal audit findings\n5. 2026 security budget approval',
      objectives:
        'Review ISMS performance for Q4 2025, approve 2026 security budget, and assess DORA readiness',
      minutes:
        'The committee reviewed Q4 2025 metrics showing 99.98% gateway uptime. DORA compliance reached 72%. Three medium risks were accepted. The 2026 security budget of EUR 2.4M was approved. Internal audit found two minor nonconformities in access review processes.',
      chairId: ctx.users.admin,
      secretaryId: ctx.users.ismsManager,
      expectedAttendeesCount: 4,
      actualAttendeesCount: 4,
      status: 'completed',
      quorumAchieved: true,
      quorumRequirement: 3,
      followUpRequired: true,
      nextMeetingScheduled: true,
      createdById: ctx.users.admin,
    },
  });

  // Meeting 1 - Attendance
  await prisma.meetingAttendance.create({
    data: {
      meetingId: meeting1.id,
      memberId: ctx.users.admin,
      membershipId: ismsMembershipCeo.id,
      attendanceStatus: 'present',
      arrivalTime: '10:00',
      departureTime: '12:00',
      participatedInVoting: true,
      contributedToDiscussion: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.meetingAttendance.create({
    data: {
      meetingId: meeting1.id,
      memberId: ctx.users.ciso,
      membershipId: ismsMembershipCiso.id,
      attendanceStatus: 'present',
      arrivalTime: '10:00',
      departureTime: '12:00',
      participatedInVoting: true,
      contributedToDiscussion: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.meetingAttendance.create({
    data: {
      meetingId: meeting1.id,
      memberId: ctx.users.cto,
      membershipId: ismsMembershipCto.id,
      attendanceStatus: 'present',
      arrivalTime: '10:00',
      departureTime: '12:00',
      participatedInVoting: true,
      contributedToDiscussion: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.meetingAttendance.create({
    data: {
      meetingId: meeting1.id,
      memberId: ctx.users.cfo,
      membershipId: ismsMembershipCfo.id,
      attendanceStatus: 'present',
      arrivalTime: '10:05',
      departureTime: '12:00',
      participatedInVoting: true,
      contributedToDiscussion: true,
      createdById: ctx.users.admin,
    },
  });

  // Meeting 1 - Decisions
  await prisma.meetingDecision.create({
    data: {
      meetingId: meeting1.id,
      decisionNumber: 'ISMS-2025-Q4-D1',
      title: 'Approve 2026 Security Budget',
      description:
        'Approved the 2026 information security budget of EUR 2.4M, representing a 9% increase over 2025 to cover DORA compliance tooling and additional SOC analyst headcount.',
      decisionType: 'approval',
      rationale:
        'Increased budget required to meet DORA technical standards and expand SOC coverage to 24/7.',
      voteType: 'unanimous',
      votesFor: 4,
      votesAgainst: 0,
      votesAbstain: 0,
      responsiblePartyId: ctx.users.cfo,
      effectiveDate: new Date('2026-01-01'),
      implemented: false,
      createdById: ctx.users.admin,
    },
  });

  await prisma.meetingDecision.create({
    data: {
      meetingId: meeting1.id,
      decisionNumber: 'ISMS-2025-Q4-D2',
      title: 'Accept Residual Risk for Legacy Merchant API',
      description:
        'Accepted the residual medium risk associated with the legacy merchant API v1 endpoint, with planned deprecation by Q3 2026.',
      decisionType: 'risk_acceptance',
      rationale:
        'Migration of remaining 12 merchants to API v2 is in progress. Risk is mitigated by enhanced monitoring and rate limiting.',
      voteType: 'majority',
      votesFor: 3,
      votesAgainst: 1,
      votesAbstain: 0,
      responsiblePartyId: ctx.users.cto,
      effectiveDate: threeWeeksAgo,
      reviewDate: new Date('2026-06-30'),
      implemented: true,
      implementationDate: threeWeeksAgo,
      implementationNotes:
        'Risk accepted and documented in risk register. Enhanced monitoring deployed.',
      createdById: ctx.users.admin,
    },
  });

  await prisma.meetingDecision.create({
    data: {
      meetingId: meeting1.id,
      decisionNumber: 'ISMS-2025-Q4-D3',
      title: 'Mandate Quarterly Access Reviews',
      description:
        'Mandated quarterly access reviews for all privileged accounts across production systems, addressing internal audit finding.',
      decisionType: 'policy',
      rationale:
        'Internal audit identified gaps in access review frequency for service accounts. Quarterly reviews will ensure compliance with ISO 27001 A.9.2.5.',
      voteType: 'unanimous',
      votesFor: 4,
      votesAgainst: 0,
      votesAbstain: 0,
      responsiblePartyId: ctx.users.ciso,
      effectiveDate: new Date('2026-01-01'),
      implementationDeadline: new Date('2026-02-28'),
      implemented: false,
      createdById: ctx.users.admin,
    },
  });

  // Meeting 1 - Action Items
  const actionDueDate1 = new Date();
  actionDueDate1.setDate(actionDueDate1.getDate() + 14);

  await prisma.meetingActionItem.create({
    data: {
      meetingId: meeting1.id,
      actionNumber: 'ISMS-2025-Q4-A1',
      title: 'Implement quarterly privileged access review process',
      description:
        'Design and implement an automated quarterly access review process for all privileged accounts across production Kubernetes clusters and AWS IAM roles.',
      assignedToId: ctx.users.securityLead,
      assignedById: ctx.users.ciso,
      priority: 'high',
      dueDate: new Date('2026-02-28'),
      status: 'in_progress',
      progressPercentage: 40,
      lastUpdateNotes:
        'Access review tooling evaluated. Shortlisted ConductorOne and Veza. POC scheduled for Feb.',
      requiresCommitteeReview: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.meetingActionItem.create({
    data: {
      meetingId: meeting1.id,
      actionNumber: 'ISMS-2025-Q4-A2',
      title: 'Complete DORA ICT risk management framework gap assessment',
      description:
        'Perform a detailed gap assessment of ClearStream ICT risk management practices against DORA Chapter II requirements and produce a remediation roadmap.',
      assignedToId: ctx.users.ismsManager,
      assignedById: ctx.users.ciso,
      priority: 'high',
      dueDate: new Date('2026-03-15'),
      status: 'in_progress',
      progressPercentage: 25,
      lastUpdateNotes: 'Gap assessment template drafted. Data collection from engineering started.',
      requiresCommitteeReview: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.meetingActionItem.create({
    data: {
      meetingId: meeting1.id,
      actionNumber: 'ISMS-2025-Q4-A3',
      title: 'Prepare legacy API v1 deprecation communication plan',
      description:
        'Draft and distribute a merchant communication plan for the deprecation of API v1, including migration support resources and timeline.',
      assignedToId: ctx.users.cto,
      assignedById: ctx.users.admin,
      priority: 'medium',
      dueDate: actionDueDate1,
      status: 'open',
      progressPercentage: 0,
      requiresCommitteeReview: false,
      createdById: ctx.users.admin,
    },
  });

  // Meeting 2: Q3 2025 ISMS Review (6 weeks ago)
  const sixWeeksAgo = new Date();
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
  sixWeeksAgo.setHours(10, 0, 0, 0);

  const meeting2 = await prisma.committeeMeeting.create({
    data: {
      committeeId: ismsSteeringCommittee.id,
      meetingNumber: 'ISMS-2025-Q3',
      title: 'Q3 2025 ISMS Review',
      meetingType: 'regular',
      meetingDate: sixWeeksAgo,
      startTime: '10:00',
      endTime: '11:45',
      durationMinutes: 105,
      locationType: 'hybrid',
      physicalLocation: 'Dublin HQ - Board Room',
      virtualMeetingLink: 'https://meet.clearstream-payments.ie/isms-q3-2025',
      agenda:
        '1. Review of Q3 2025 security metrics\n2. ISO 27001 surveillance audit results\n3. NIS2 compliance update\n4. Security incident summary\n5. Penetration test results',
      objectives:
        'Review Q3 ISMS performance, discuss surveillance audit results, and assess NIS2 compliance progress',
      minutes:
        'The committee reviewed Q3 2025 security metrics. ISO 27001 surveillance audit was passed with zero major nonconformities and two observations. NIS2 compliance reached 74%. One P2 incident involving a DDoS attack was reviewed. Penetration test results showed improvement with no critical findings.',
      chairId: ctx.users.admin,
      secretaryId: ctx.users.ismsManager,
      expectedAttendeesCount: 4,
      actualAttendeesCount: 3,
      status: 'completed',
      quorumAchieved: true,
      quorumRequirement: 3,
      followUpRequired: true,
      nextMeetingScheduled: true,
      createdById: ctx.users.admin,
    },
  });

  // Meeting 2 - Attendance
  await prisma.meetingAttendance.create({
    data: {
      meetingId: meeting2.id,
      memberId: ctx.users.admin,
      membershipId: ismsMembershipCeo.id,
      attendanceStatus: 'present',
      arrivalTime: '10:00',
      departureTime: '11:45',
      participatedInVoting: true,
      contributedToDiscussion: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.meetingAttendance.create({
    data: {
      meetingId: meeting2.id,
      memberId: ctx.users.ciso,
      membershipId: ismsMembershipCiso.id,
      attendanceStatus: 'present',
      arrivalTime: '10:00',
      departureTime: '11:45',
      participatedInVoting: true,
      contributedToDiscussion: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.meetingAttendance.create({
    data: {
      meetingId: meeting2.id,
      memberId: ctx.users.cto,
      membershipId: ismsMembershipCto.id,
      attendanceStatus: 'present',
      arrivalTime: '10:00',
      departureTime: '11:45',
      participatedInVoting: true,
      contributedToDiscussion: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.meetingAttendance.create({
    data: {
      meetingId: meeting2.id,
      memberId: ctx.users.cfo,
      membershipId: ismsMembershipCfo.id,
      attendanceStatus: 'absent',
      absenceReason: 'Attending investor conference in Frankfurt',
      createdById: ctx.users.admin,
    },
  });

  // Meeting 2 - Decisions
  await prisma.meetingDecision.create({
    data: {
      meetingId: meeting2.id,
      decisionNumber: 'ISMS-2025-Q3-D1',
      title: 'Approve NIS2 Compliance Roadmap',
      description:
        'Approved the NIS2 compliance roadmap with a target of 90% compliance by Q2 2026, including investment in supply chain risk management tooling.',
      decisionType: 'approval',
      rationale:
        'NIS2 transposition deadline is approaching. Early compliance reduces regulatory risk and demonstrates commitment to supervisory authorities.',
      voteType: 'unanimous',
      votesFor: 3,
      votesAgainst: 0,
      votesAbstain: 0,
      responsiblePartyId: ctx.users.ciso,
      effectiveDate: sixWeeksAgo,
      implemented: true,
      implementationDate: sixWeeksAgo,
      implementationNotes: 'Roadmap published to all department heads. Workstreams initiated.',
      createdById: ctx.users.admin,
    },
  });

  await prisma.meetingDecision.create({
    data: {
      meetingId: meeting2.id,
      decisionNumber: 'ISMS-2025-Q3-D2',
      title: 'Approve DDoS Mitigation Enhancement',
      description:
        'Approved procurement of enhanced DDoS mitigation service (Cloudflare Enterprise) following Q3 DDoS incident, with an annual cost of EUR 48,000.',
      decisionType: 'approval',
      rationale:
        'Q3 DDoS incident caused 23 minutes of degraded service. Enhanced mitigation will improve resilience and support 99.99% SLA target.',
      voteType: 'unanimous',
      votesFor: 3,
      votesAgainst: 0,
      votesAbstain: 0,
      responsiblePartyId: ctx.users.cto,
      effectiveDate: sixWeeksAgo,
      implementationDeadline: new Date('2025-12-31'),
      implemented: true,
      implementationDate: new Date('2025-11-15'),
      implementationNotes:
        'Cloudflare Enterprise deployed to all edge endpoints. DDoS protection active.',
      createdById: ctx.users.admin,
    },
  });

  // Meeting 2 - Action Items
  await prisma.meetingActionItem.create({
    data: {
      meetingId: meeting2.id,
      actionNumber: 'ISMS-2025-Q3-A1',
      title: 'Address surveillance audit observations',
      description:
        'Develop and implement corrective actions for the two observations raised in the ISO 27001 surveillance audit: (1) document control versioning inconsistencies, (2) supplier security assessment gaps.',
      assignedToId: ctx.users.ismsManager,
      assignedById: ctx.users.ciso,
      priority: 'high',
      dueDate: new Date('2025-12-31'),
      status: 'completed',
      completionDate: new Date('2025-12-18'),
      completionNotes:
        'Both observations addressed. Document control process updated with automated versioning. Supplier assessment questionnaire revised and 3 outstanding assessments completed.',
      progressPercentage: 100,
      requiresCommitteeReview: true,
      reviewed: true,
      reviewDate: threeWeeksAgo,
      createdById: ctx.users.admin,
    },
  });

  await prisma.meetingActionItem.create({
    data: {
      meetingId: meeting2.id,
      actionNumber: 'ISMS-2025-Q3-A2',
      title: 'Deploy Cloudflare Enterprise DDoS mitigation',
      description:
        'Procure, configure, and deploy Cloudflare Enterprise DDoS mitigation across all public-facing payment endpoints and the merchant portal.',
      assignedToId: ctx.users.cto,
      assignedById: ctx.users.admin,
      priority: 'high',
      dueDate: new Date('2025-12-31'),
      status: 'completed',
      completionDate: new Date('2025-11-15'),
      completionNotes:
        'Cloudflare Enterprise deployed. Traffic routing confirmed. Runbook updated.',
      progressPercentage: 100,
      requiresCommitteeReview: false,
      reviewed: true,
      reviewDate: threeWeeksAgo,
      createdById: ctx.users.admin,
    },
  });

  await prisma.meetingActionItem.create({
    data: {
      meetingId: meeting2.id,
      actionNumber: 'ISMS-2025-Q3-A3',
      title: 'Initiate supply chain risk management programme',
      description:
        'Design a supply chain risk management programme aligned with NIS2 Article 21(2)(d) requirements, including critical supplier identification and assessment methodology.',
      assignedToId: ctx.users.complianceOfficer,
      assignedById: ctx.users.ciso,
      priority: 'medium',
      dueDate: new Date('2026-03-31'),
      status: 'in_progress',
      progressPercentage: 55,
      lastUpdateNotes:
        'Critical supplier list finalised (14 suppliers). Assessment questionnaire drafted. First batch of assessments sent.',
      requiresCommitteeReview: true,
      createdById: ctx.users.admin,
    },
  });

  // ============================================
  // 8. Executive Positions
  // ============================================
  const ceoPosition = await prisma.executivePosition.create({
    data: {
      title: 'Chief Executive Officer',
      executiveLevel: 'c_suite',
      personId: ctx.users.admin,
      authorityLevel: 'full',
      securityResponsibilities:
        'Ultimate accountability for information security, ISMS management review, and regulatory compliance. Approves security policy and risk appetite.',
      riskAuthorityLevel: 'full',
      budgetAuthority: true,
      isActive: true,
      isCeo: true,
      isSecurityCommitteeMember: true,
      startDate: new Date('2018-06-01'),
      createdById: ctx.users.admin,
    },
  });

  await prisma.executivePosition.create({
    data: {
      title: 'Chief Technology Officer',
      executiveLevel: 'c_suite',
      personId: ctx.users.cto,
      reportsToId: ceoPosition.id,
      authorityLevel: 'high',
      securityResponsibilities:
        'Responsible for secure architecture, engineering practices, and technical security controls implementation. Chairs the Change Advisory Board.',
      riskAuthorityLevel: 'high',
      budgetAuthority: true,
      isActive: true,
      isCeo: false,
      isSecurityCommitteeMember: true,
      startDate: new Date('2019-01-15'),
      createdById: ctx.users.admin,
    },
  });

  await prisma.executivePosition.create({
    data: {
      title: 'Chief Information Security Officer',
      executiveLevel: 'c_suite',
      personId: ctx.users.ciso,
      reportsToId: ceoPosition.id,
      authorityLevel: 'high',
      securityResponsibilities:
        'Owns the ISMS, leads security strategy, manages SOC operations, and ensures DORA/NIS2 compliance. Chairs the Risk Committee.',
      riskAuthorityLevel: 'high',
      budgetAuthority: true,
      isActive: true,
      isCeo: false,
      isSecurityCommitteeMember: true,
      startDate: new Date('2019-03-01'),
      createdById: ctx.users.admin,
    },
  });

  await prisma.executivePosition.create({
    data: {
      title: 'Chief Financial Officer',
      executiveLevel: 'c_suite',
      personId: ctx.users.cfo,
      reportsToId: ceoPosition.id,
      authorityLevel: 'high',
      securityResponsibilities:
        'Ensures financial data security, oversees regulatory financial reporting, and approves security investment business cases.',
      riskAuthorityLevel: 'medium',
      budgetAuthority: true,
      isActive: true,
      isCeo: false,
      isSecurityCommitteeMember: true,
      startDate: new Date('2019-06-01'),
      createdById: ctx.users.admin,
    },
  });

  await prisma.executivePosition.create({
    data: {
      title: 'Data Protection Officer',
      executiveLevel: 'senior_management',
      personId: ctx.users.dpo,
      reportsToId: ceoPosition.id,
      authorityLevel: 'advisory',
      securityResponsibilities:
        'Ensures GDPR compliance, conducts DPIAs, advises on data protection matters, and acts as liaison with the Data Protection Commission.',
      riskAuthorityLevel: 'advisory',
      budgetAuthority: false,
      isActive: true,
      isCeo: false,
      isSecurityCommitteeMember: true,
      startDate: new Date('2020-02-01'),
      createdById: ctx.users.admin,
    },
  });

  // ============================================
  // 9. Key Personnel (ISMS roles)
  // ============================================
  await prisma.keyPersonnel.create({
    data: {
      personCode: 'CS-KP-001',
      userId: ctx.users.ismsManager,
      name: 'Roisín Kelly',
      jobTitle: 'ISMS Manager',
      email: 'isms.manager@clearstream.ie',
      phone: '+353 1 234 5680',
      departmentId: infoSec.id,
      ismsRole: 'isms_manager',
      securityResponsibilities:
        'Maintains the ISMS documentation, coordinates internal audits, manages the risk register, and drives continual improvement activities.',
      authorityLevel: 'operational',
      trainingCompleted: true,
      lastTrainingDate: new Date('2025-09-01'),
      certifications: ['ISO 27001 Lead Implementer', 'CISM', 'ISO 22301 Lead Implementer'],
      isActive: true,
      startDate: new Date('2022-04-01'),
      createdById: ctx.users.admin,
    },
  });

  await prisma.keyPersonnel.create({
    data: {
      personCode: 'CS-KP-002',
      userId: ctx.users.securityLead,
      name: 'Markus Weber',
      jobTitle: 'IT Security Lead',
      email: 'security.lead@clearstream.ie',
      phone: '+49 30 123 4567',
      departmentId: infoSec.id,
      ismsRole: 'security_lead',
      securityResponsibilities:
        'Leads technical security operations, manages vulnerability assessments, oversees penetration testing, and coordinates incident response.',
      authorityLevel: 'operational',
      trainingCompleted: true,
      lastTrainingDate: new Date('2025-10-15'),
      certifications: ['CISSP', 'OSCP', 'AWS Security Specialty'],
      isActive: true,
      startDate: new Date('2022-01-15'),
      createdById: ctx.users.admin,
    },
  });

  await prisma.keyPersonnel.create({
    data: {
      personCode: 'CS-KP-003',
      userId: ctx.users.complianceOfficer,
      name: 'Sofia Ferreira',
      jobTitle: 'Compliance Officer',
      email: 'compliance@clearstream.ie',
      phone: '+351 21 123 4567',
      departmentId: infoSec.id,
      ismsRole: 'compliance_officer',
      securityResponsibilities:
        'Manages regulatory compliance programmes for DORA, NIS2, and PCI-DSS. Coordinates with supervisory authorities and prepares compliance reports.',
      authorityLevel: 'operational',
      trainingCompleted: true,
      lastTrainingDate: new Date('2025-08-20'),
      certifications: ['CISA', 'ISO 27001 Lead Auditor', 'PCI QSA'],
      isActive: true,
      startDate: new Date('2023-02-01'),
      createdById: ctx.users.admin,
    },
  });

  await prisma.keyPersonnel.create({
    data: {
      personCode: 'CS-KP-004',
      userId: ctx.users.riskAnalyst,
      name: 'Cian Doyle',
      jobTitle: 'Risk Analyst',
      email: 'risk.analyst@clearstream.ie',
      phone: '+353 1 234 5682',
      departmentId: infoSec.id,
      ismsRole: 'risk_analyst',
      securityResponsibilities:
        'Performs quantitative and qualitative risk assessments, maintains risk dashboards, and supports the Risk Committee with analysis and reporting.',
      authorityLevel: 'operational',
      trainingCompleted: true,
      lastTrainingDate: new Date('2025-11-01'),
      certifications: ['CRISC', 'ISO 27005 Risk Manager'],
      isActive: true,
      startDate: new Date('2023-06-01'),
      createdById: ctx.users.admin,
    },
  });

  // ============================================
  // 10. Security Champions
  // ============================================
  await prisma.securityChampion.create({
    data: {
      userId: ctx.users.cto,
      departmentId: engineering.id,
      championLevel: 'senior',
      responsibilities:
        'Promotes secure coding practices in Dublin engineering team, conducts code security reviews, and mentors junior developers on OWASP Top 10.',
      trainingCompleted: true,
      lastTrainingDate: new Date('2025-07-15'),
      isActive: true,
      startDate: new Date('2023-06-01'),
      createdById: ctx.users.admin,
    },
  });

  await prisma.securityChampion.create({
    data: {
      userId: ctx.users.securityLead,
      departmentId: engineering.id,
      championLevel: 'lead',
      responsibilities:
        'Leads security champion programme for Berlin engineering office, conducts threat modelling sessions, and manages security testing in CI/CD pipelines.',
      trainingCompleted: true,
      lastTrainingDate: new Date('2025-10-15'),
      isActive: true,
      startDate: new Date('2023-06-01'),
      createdById: ctx.users.admin,
    },
  });

  await prisma.securityChampion.create({
    data: {
      userId: ctx.users.complianceOfficer,
      departmentId: operations.id,
      championLevel: 'standard',
      responsibilities:
        'Promotes security awareness in Lisbon support operations, ensures secure handling of merchant data, and reports security concerns.',
      trainingCompleted: true,
      lastTrainingDate: new Date('2025-09-01'),
      isActive: true,
      startDate: new Date('2024-01-15'),
      createdById: ctx.users.admin,
    },
  });

  // ============================================
  // 11. External Dependencies
  // ============================================
  await prisma.externalDependency.create({
    data: {
      name: 'Amazon Web Services (AWS)',
      dependencyType: 'cloud_service_provider',
      description:
        'Primary cloud infrastructure provider hosting all ClearStream production workloads including payment gateway, fraud detection engine, and data warehouse across eu-west-1 (Ireland) and eu-central-1 (Frankfurt) regions.',
      vendorWebsite: 'https://aws.amazon.com',
      criticalityLevel: 'critical',
      businessImpact:
        'Total service outage if AWS eu-west-1 becomes unavailable without failover. Critical to all business operations.',
      singlePointOfFailure: false,
      contractReference: 'AWS-CS-2023-001',
      contractStart: new Date('2023-01-01'),
      contractEnd: new Date('2026-12-31'),
      annualCost: 420000,
      paymentTerms: 'Monthly usage-based with reserved instance commitments',
      slaDetails: {
        uptime: '99.99%',
        supportTier: 'Enterprise',
        responseTime: '15 minutes for critical issues',
      },
      dataProcessed: [
        'Payment transaction data',
        'Merchant PII',
        'Cardholder data (tokenised)',
        'Application logs',
      ],
      dataLocation: 'EU (Ireland and Frankfurt)',
      complianceCertifications: [
        'ISO 27001',
        'SOC 2 Type II',
        'PCI-DSS Level 1',
        'C5 (Germany)',
      ],
      lastAssessmentDate: new Date('2025-06-15'),
      riskRating: 'low',
      primaryContact: 'AWS Enterprise Support',
      contactEmail: 'enterprise-support@amazon.com',
      contactPhone: '+1 206 266 4064',
      alternativeProviders: ['Google Cloud Platform', 'Microsoft Azure'],
      exitStrategy:
        'Multi-cloud architecture using Kubernetes enables workload portability. 6-month migration plan documented.',
      createdById: ctx.users.admin,
    },
  });

  await prisma.externalDependency.create({
    data: {
      name: 'Stripe',
      dependencyType: 'payment_processor',
      description:
        'Payment processing partner providing acquiring bank connections and card network interfaces for ClearStream payment gateway.',
      vendorWebsite: 'https://stripe.com',
      criticalityLevel: 'critical',
      businessImpact:
        'Direct revenue impact if Stripe connectivity is lost. Fallback to secondary processor covers 40% of transaction volume.',
      singlePointOfFailure: false,
      contractReference: 'STRIPE-CS-2023-002',
      contractStart: new Date('2023-03-01'),
      contractEnd: new Date('2026-02-28'),
      annualCost: 180000,
      paymentTerms: 'Monthly based on transaction volume',
      slaDetails: {
        uptime: '99.99%',
        apiResponseTime: '200ms p99',
        supportTier: 'Premium',
      },
      dataProcessed: [
        'Payment card numbers (encrypted)',
        'Transaction amounts',
        'Merchant identifiers',
      ],
      dataLocation: 'EU',
      complianceCertifications: ['PCI-DSS Level 1', 'SOC 2 Type II', 'ISO 27001'],
      lastAssessmentDate: new Date('2025-08-01'),
      riskRating: 'low',
      primaryContact: 'Stripe Enterprise Partnerships',
      contactEmail: 'partnerships@stripe.com',
      alternativeProviders: ['Adyen', 'Worldpay'],
      exitStrategy:
        'Secondary processor (Adyen) handles 40% of volume. Full migration possible within 3 months.',
      createdById: ctx.users.admin,
    },
  });

  await prisma.externalDependency.create({
    data: {
      name: 'Okta',
      dependencyType: 'saas_application',
      description:
        'Identity and Access Management (IAM) platform providing SSO, MFA, and lifecycle management for all ClearStream employees and service accounts.',
      vendorWebsite: 'https://www.okta.com',
      criticalityLevel: 'critical',
      businessImpact:
        'Complete loss of authentication capability for internal systems. Manual access procedures available for critical payment operations.',
      singlePointOfFailure: true,
      contractReference: 'OKTA-CS-2023-003',
      contractStart: new Date('2023-06-01'),
      contractEnd: new Date('2026-05-31'),
      annualCost: 32000,
      paymentTerms: 'Annual prepaid',
      slaDetails: {
        uptime: '99.99%',
        supportTier: 'Premium',
        responseTime: '1 hour for critical issues',
      },
      dataProcessed: ['Employee PII', 'Authentication logs', 'Access policies'],
      dataLocation: 'EU (Frankfurt)',
      complianceCertifications: ['ISO 27001', 'SOC 2 Type II', 'FedRAMP'],
      lastAssessmentDate: new Date('2025-07-20'),
      riskRating: 'medium',
      primaryContact: 'Okta Customer Success',
      contactEmail: 'support@okta.com',
      alternativeProviders: ['Microsoft Entra ID', 'Ping Identity'],
      exitStrategy:
        'Migration to alternative IdP requires 4-6 months. SCIM integration enables user data portability.',
      createdById: ctx.users.admin,
    },
  });

  await prisma.externalDependency.create({
    data: {
      name: 'PricewaterhouseCoopers (PwC)',
      dependencyType: 'professional_service',
      description:
        'External audit firm providing ISO 27001 internal audit services, DORA readiness assessments, and regulatory compliance advisory.',
      vendorWebsite: 'https://www.pwc.ie',
      criticalityLevel: 'medium',
      businessImpact:
        'Delay in audit activities could impact certification timeline. Alternative audit firms available.',
      singlePointOfFailure: false,
      contractReference: 'PWC-CS-2024-001',
      contractStart: new Date('2024-01-01'),
      contractEnd: new Date('2026-12-31'),
      annualCost: 95000,
      paymentTerms: 'Quarterly milestone-based',
      slaDetails: {
        engagementResponse: '5 business days',
        reportDelivery: '10 business days after fieldwork',
      },
      dataProcessed: ['ISMS documentation', 'Audit evidence', 'Risk assessments'],
      dataLocation: 'Ireland',
      complianceCertifications: ['ISO 27001'],
      lastAssessmentDate: new Date('2025-01-15'),
      riskRating: 'low',
      primaryContact: 'Sarah McCarthy, Engagement Partner',
      contactEmail: 'sarah.mccarthy@pwc.ie',
      contactPhone: '+353 1 792 6000',
      alternativeProviders: ['Deloitte', 'KPMG', 'EY'],
      exitStrategy:
        'Standard audit engagement. Transition to alternative firm requires 2-month handover period.',
      createdById: ctx.users.admin,
    },
  });

  // ============================================
  // 12. Regulators
  // ============================================
  await prisma.regulator.create({
    data: {
      name: 'Central Bank of Ireland',
      acronym: 'CBI',
      regulatorType: 'financial_regulator',
      jurisdiction: 'Ireland',
      jurisdictionLevel: 'national',
      description:
        'Primary supervisory authority for ClearStream Payments as an authorised payment institution under the Payment Services Directive (PSD2) and DORA.',
      website: 'https://www.centralbank.ie',
      contactEmail: 'enquiries@centralbank.ie',
      contactPhone: '+353 1 224 6000',
      contactAddress: 'New Wapping Street, North Wall Quay, Dublin 1, D01 F7X3',
      keyRegulations: [
        'Payment Services Directive (PSD2)',
        'Digital Operational Resilience Act (DORA)',
        'Anti-Money Laundering Directive',
        'European Banking Authority Guidelines',
      ],
      registrationStatus: 'registered',
      registrationNumber: 'C123456',
      registrationDate: new Date('2019-06-15'),
      reportingFrequency: 'quarterly',
      lastReportDate: new Date('2025-12-31'),
      nextReportDate: new Date('2026-03-31'),
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.regulator.create({
    data: {
      name: 'Bundesanstalt für Finanzdienstleistungsaufsicht',
      acronym: 'BaFin',
      regulatorType: 'financial_regulator',
      jurisdiction: 'Germany',
      jurisdictionLevel: 'national',
      description:
        'German financial supervisory authority overseeing ClearStream operations in Germany, including payment processing and IT security requirements under BAIT.',
      website: 'https://www.bafin.de',
      contactEmail: 'poststelle@bafin.de',
      contactPhone: '+49 228 4108 0',
      contactAddress: 'Graurheindorfer Str. 108, 53117 Bonn, Germany',
      keyRegulations: [
        'Payment Services Supervision Act (ZAG)',
        'IT Requirements for Financial Institutions (BAIT)',
        'Digital Operational Resilience Act (DORA)',
      ],
      registrationStatus: 'registered',
      registrationNumber: 'DE-FI-2020-0042',
      registrationDate: new Date('2020-03-01'),
      reportingFrequency: 'annual',
      lastReportDate: new Date('2025-06-30'),
      nextReportDate: new Date('2026-06-30'),
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.regulator.create({
    data: {
      name: 'European Union Agency for Cybersecurity',
      acronym: 'ENISA',
      regulatorType: 'government_agency',
      jurisdiction: 'EU',
      jurisdictionLevel: 'regional',
      description:
        'EU agency providing cybersecurity guidance and standards. Relevant to ClearStream through NIS2 Directive implementation and cyber resilience frameworks.',
      website: 'https://www.enisa.europa.eu',
      contactEmail: 'info@enisa.europa.eu',
      contactPhone: '+30 2814 409 710',
      contactAddress: 'Vasilissis Sofias 1, Marousi 151 24, Athens, Greece',
      keyRegulations: [
        'NIS2 Directive',
        'EU Cybersecurity Act',
        'ENISA Threat Landscape Reports',
        'Cloud Security Guidance',
      ],
      registrationStatus: 'not_required',
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  // ============================================
  // 13. Applicable Frameworks
  // ============================================
  await prisma.applicableFramework.create({
    data: {
      frameworkCode: 'ISO-27001',
      name: 'ISO/IEC 27001:2022',
      frameworkType: 'international_standard',
      description:
        'International standard for information security management systems. ClearStream is certified and maintains compliance across all operations.',
      version: '2022',
      isApplicable: true,
      applicabilityReason:
        'Required for payment processing operations and contractually mandated by tier-1 merchant clients.',
      applicabilityDate: new Date('2023-06-01'),
      complianceStatus: 'certified',
      compliancePercentage: 88,
      lastAssessmentDate: new Date('2025-09-15'),
      nextAssessmentDate: new Date('2026-03-15'),
      supervisoryAuthority: 'BSI Group',
      isCertifiable: true,
      certificationStatus: 'certified',
      certificationBody: 'BSI Group',
      certificateNumber: 'IS 789012',
      certificationDate: new Date('2024-03-15'),
      certificationExpiry: new Date('2026-09-15'),
      keyRequirements: [
        'Risk assessment and treatment',
        'Statement of Applicability',
        'Internal audit programme',
        'Management review',
        'Continual improvement',
        'Annex A controls implementation',
      ],
      createdById: ctx.users.admin,
    },
  });

  await prisma.applicableFramework.create({
    data: {
      frameworkCode: 'CS-DORA',
      name: 'Digital Operational Resilience Act (DORA)',
      frameworkType: 'eu_regulation',
      description:
        'EU regulation on digital operational resilience for the financial sector. Applicable to ClearStream as an authorised payment institution.',
      version: 'Regulation (EU) 2022/2554',
      isApplicable: true,
      applicabilityReason:
        'ClearStream is an authorised payment institution under PSD2, making it a financial entity under DORA Article 2(1).',
      applicabilityDate: new Date('2025-01-17'),
      complianceStatus: 'in_progress',
      compliancePercentage: 72,
      lastAssessmentDate: new Date('2025-11-01'),
      nextAssessmentDate: new Date('2026-05-01'),
      supervisoryAuthority: 'Central Bank of Ireland',
      isCertifiable: false,
      keyRequirements: [
        'ICT risk management framework (Chapter II)',
        'ICT-related incident management (Chapter III)',
        'Digital operational resilience testing (Chapter IV)',
        'ICT third-party risk management (Chapter V)',
        'Information sharing arrangements (Chapter VI)',
      ],
      createdById: ctx.users.admin,
    },
  });

  await prisma.applicableFramework.create({
    data: {
      frameworkCode: 'CS-NIS2',
      name: 'NIS2 Directive',
      frameworkType: 'eu_directive',
      description:
        'EU directive on measures for a high common level of cybersecurity. Applicable to ClearStream as an important entity in the banking sector.',
      version: 'Directive (EU) 2022/2555',
      isApplicable: true,
      applicabilityReason:
        'ClearStream qualifies as an important entity under NIS2 Annex I (banking sector) based on employee count and revenue thresholds.',
      applicabilityDate: new Date('2024-10-18'),
      complianceStatus: 'in_progress',
      compliancePercentage: 79,
      lastAssessmentDate: new Date('2025-10-15'),
      nextAssessmentDate: new Date('2026-04-15'),
      supervisoryAuthority: 'National Cyber Security Centre (Ireland)',
      isCertifiable: false,
      keyRequirements: [
        'Risk management measures (Article 21)',
        'Incident reporting obligations (Article 23)',
        'Supply chain security (Article 21(2)(d))',
        'Business continuity management (Article 21(2)(c))',
        'Cybersecurity training (Article 20(2))',
      ],
      createdById: ctx.users.admin,
    },
  });

  // ============================================
  // 14. Technology Platforms
  // ============================================
  await prisma.technologyPlatform.create({
    data: {
      platformCode: 'PLAT-AWS',
      name: 'Amazon Web Services',
      platformType: 'cloud',
      description:
        'Primary cloud infrastructure platform hosting all production workloads across eu-west-1 and eu-central-1 regions. Running EKS, RDS, S3, and Lambda services.',
      vendor: 'Amazon Web Services',
      vendorWebsite: 'https://aws.amazon.com',
      licenseType: 'Pay-as-you-go with reserved instances',
      hostingLocation: 'EU (Ireland, Frankfurt)',
      cloudProvider: 'AWS',
      deploymentModel: 'public_cloud',
      version: 'Multi-service',
      architecture: 'Multi-region active-passive',
      integrations: ['Kubernetes (EKS)', 'PostgreSQL (RDS)', 'Datadog', 'GitHub Actions'],
      dataStorageLocation: 'EU only',
      criticalityLevel: 'critical',
      businessImpact: 'Total business disruption if primary and secondary regions fail',
      riskRating: 'low',
      implementationDate: new Date('2023-01-15'),
      complianceCertifications: ['ISO 27001', 'SOC 2', 'PCI-DSS', 'C5'],
      dataClassification: 'confidential',
      inIsmsScope: true,
      isActive: true,
      environments: ['production', 'staging', 'development', 'sandbox'],
      createdById: ctx.users.admin,
    },
  });

  await prisma.technologyPlatform.create({
    data: {
      platformCode: 'PLAT-K8S',
      name: 'Kubernetes (EKS)',
      platformType: 'container_orchestration',
      description:
        'Container orchestration platform running on AWS EKS, managing all microservices including payment gateway, fraud detection, and merchant portal.',
      vendor: 'Amazon / CNCF',
      vendorWebsite: 'https://kubernetes.io',
      licenseType: 'Open source (managed service)',
      hostingLocation: 'EU (Ireland)',
      cloudProvider: 'AWS',
      deploymentModel: 'managed_service',
      version: '1.28',
      architecture: 'Multi-AZ with autoscaling node groups',
      integrations: ['AWS EKS', 'Helm', 'ArgoCD', 'Datadog', 'OPA Gatekeeper'],
      criticalityLevel: 'critical',
      businessImpact: 'All microservices depend on Kubernetes for orchestration and scaling',
      riskRating: 'low',
      implementationDate: new Date('2023-03-01'),
      complianceCertifications: ['CIS Kubernetes Benchmark'],
      dataClassification: 'internal',
      inIsmsScope: true,
      isActive: true,
      environments: ['production', 'staging', 'development'],
      createdById: ctx.users.admin,
    },
  });

  await prisma.technologyPlatform.create({
    data: {
      platformCode: 'PLAT-PG',
      name: 'PostgreSQL (RDS)',
      platformType: 'database',
      description:
        'Primary relational database platform running on AWS RDS PostgreSQL, storing payment transactions, merchant data, and fraud detection models.',
      vendor: 'Amazon (RDS) / PostgreSQL Global Development Group',
      vendorWebsite: 'https://www.postgresql.org',
      licenseType: 'Open source (managed service)',
      hostingLocation: 'EU (Ireland)',
      cloudProvider: 'AWS',
      deploymentModel: 'managed_service',
      version: '16.1',
      architecture: 'Multi-AZ with read replicas',
      integrations: ['AWS RDS', 'pgBouncer', 'pg_cron', 'Datadog Database Monitoring'],
      dataStorageLocation: 'EU (Ireland)',
      criticalityLevel: 'critical',
      businessImpact: 'All payment data and merchant records stored in PostgreSQL',
      riskRating: 'low',
      implementationDate: new Date('2023-01-20'),
      complianceCertifications: ['Encrypted at rest (AES-256)', 'Encrypted in transit (TLS 1.3)'],
      dataClassification: 'confidential',
      inIsmsScope: true,
      isActive: true,
      environments: ['production', 'staging', 'development'],
      createdById: ctx.users.admin,
    },
  });

  await prisma.technologyPlatform.create({
    data: {
      platformCode: 'PLAT-DD',
      name: 'Datadog',
      platformType: 'monitoring',
      description:
        'Unified monitoring, logging, and APM platform providing observability across all ClearStream infrastructure and applications.',
      vendor: 'Datadog Inc.',
      vendorWebsite: 'https://www.datadoghq.com',
      licenseType: 'SaaS subscription',
      hostingLocation: 'EU (Frankfurt)',
      cloudProvider: 'Datadog',
      deploymentModel: 'saas',
      version: 'Latest',
      architecture: 'SaaS with local agents',
      integrations: [
        'AWS CloudWatch',
        'Kubernetes',
        'PostgreSQL',
        'PagerDuty',
        'Slack',
        'GitHub',
      ],
      criticalityLevel: 'high',
      businessImpact:
        'Loss of monitoring visibility; incident detection capability degraded but not eliminated',
      riskRating: 'medium',
      implementationDate: new Date('2023-04-01'),
      complianceCertifications: ['SOC 2 Type II', 'ISO 27001'],
      dataClassification: 'internal',
      inIsmsScope: true,
      isActive: true,
      environments: ['production', 'staging'],
      createdById: ctx.users.admin,
    },
  });

  await prisma.technologyPlatform.create({
    data: {
      platformCode: 'PLAT-GH',
      name: 'GitHub Enterprise',
      platformType: 'source_control',
      description:
        'Source code management and CI/CD platform hosting all ClearStream repositories, managing code reviews, and running automated build/deploy pipelines.',
      vendor: 'GitHub / Microsoft',
      vendorWebsite: 'https://github.com',
      licenseType: 'Enterprise Cloud subscription',
      hostingLocation: 'EU',
      cloudProvider: 'GitHub',
      deploymentModel: 'saas',
      version: 'Enterprise Cloud',
      architecture: 'SaaS with self-hosted runners for CI/CD',
      integrations: [
        'GitHub Actions',
        'Dependabot',
        'CodeQL',
        'ArgoCD',
        'Slack',
        'Datadog CI Visibility',
      ],
      criticalityLevel: 'high',
      businessImpact:
        'Engineering productivity halted; deployments blocked but production continues operating',
      riskRating: 'low',
      implementationDate: new Date('2023-01-10'),
      complianceCertifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP'],
      dataClassification: 'confidential',
      inIsmsScope: true,
      isActive: true,
      environments: ['production', 'development'],
      createdById: ctx.users.admin,
    },
  });

  // ============================================
  // 15. Products/Services
  // ============================================
  await prisma.productService.create({
    data: {
      productCode: 'PRD-PG',
      name: 'Payment Gateway',
      productType: 'platform',
      description:
        'PCI-DSS Level 1 compliant payment gateway supporting card payments, SEPA transfers, and instant payments across 18 European countries. Processes over 2 million transactions daily.',
      category: 'Payment Infrastructure',
      customerFacing: true,
      internalOnly: false,
      revenueContribution: 'primary',
      pricingModel: 'Transaction-based with volume tiers',
      targetMarket: 'European e-commerce merchants',
      lifecycleStage: 'growth',
      launchDate: new Date('2019-06-01'),
      dataClassification: 'restricted',
      containsPersonalData: true,
      containsSensitiveData: true,
      complianceRequirements: ['PCI-DSS Level 1', 'PSD2 SCA', 'DORA', 'NIS2'],
      inIsmsScope: true,
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.productService.create({
    data: {
      productCode: 'PRD-MP',
      name: 'Merchant Portal',
      productType: 'application',
      description:
        'Self-service web portal for merchants to manage their payment integration, view transaction analytics, configure fraud rules, and access financial reports.',
      category: 'Merchant Tools',
      customerFacing: true,
      internalOnly: false,
      revenueContribution: 'supporting',
      pricingModel: 'Included in platform subscription',
      targetMarket: 'Existing ClearStream merchants',
      lifecycleStage: 'mature',
      launchDate: new Date('2020-01-15'),
      dataClassification: 'confidential',
      containsPersonalData: true,
      containsSensitiveData: false,
      complianceRequirements: ['GDPR', 'PCI-DSS (SAQ-A)', 'Accessibility (WCAG 2.1 AA)'],
      inIsmsScope: true,
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.productService.create({
    data: {
      productCode: 'PRD-FDE',
      name: 'Fraud Detection Engine',
      productType: 'service',
      description:
        'AI/ML-powered fraud detection engine using real-time behavioural analytics, device fingerprinting, and ensemble models to score transaction risk. Achieves 99.7% accuracy with 0.02% false positive rate.',
      category: 'Risk & Compliance',
      customerFacing: false,
      internalOnly: true,
      revenueContribution: 'supporting',
      pricingModel: 'Internal service (cost centre)',
      targetMarket: 'Internal use for payment processing',
      lifecycleStage: 'growth',
      launchDate: new Date('2021-09-01'),
      dataClassification: 'confidential',
      containsPersonalData: true,
      containsSensitiveData: true,
      complianceRequirements: ['EU AI Act (high-risk)', 'GDPR (automated decision-making)', 'DORA'],
      inIsmsScope: true,
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  // ============================================
  // 16. Interested Parties
  // ============================================
  await prisma.interestedParty.create({
    data: {
      partyCode: 'IP-SHARE',
      name: 'Shareholders',
      partyType: 'investor',
      description:
        'ClearStream shareholders including founding team, venture capital investors, and angel investors who have a financial interest in the company.',
      expectations:
        'Sustainable growth, strong governance, regulatory compliance, and protection of company valuation.',
      requirements:
        'Regular financial reporting, transparent risk management, and demonstration of regulatory compliance.',
      informationNeeds: [
        'Quarterly financial reports',
        'Annual risk assessment summary',
        'Regulatory compliance status',
        'Security incident summary (anonymised)',
      ],
      powerLevel: 'high',
      interestLevel: 'high',
      influenceLevel: 'high',
      engagementStrategy: 'Proactive engagement through board meetings and investor updates',
      communicationMethod: 'Board meetings, quarterly reports, ad-hoc briefings',
      communicationFrequency: 'quarterly',
      ismsRelevance:
        'Shareholders expect robust information security as it directly impacts business valuation and regulatory standing.',
      securityExpectations:
        'ISO 27001 certification maintained, zero material data breaches, strong regulatory compliance posture.',
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.interestedParty.create({
    data: {
      partyCode: 'IP-REG',
      name: 'Regulators',
      partyType: 'regulator',
      description:
        'Supervisory authorities including the Central Bank of Ireland, BaFin, and data protection authorities overseeing ClearStream operations.',
      expectations:
        'Full compliance with applicable regulations including DORA, NIS2, PSD2, and GDPR. Timely reporting and cooperation with supervisory activities.',
      requirements:
        'Regulatory reporting, incident notification, audit access, and cooperation with inspections.',
      informationNeeds: [
        'Regulatory filings and reports',
        'Incident notifications (within prescribed timelines)',
        'Audit evidence and documentation',
        'Risk management framework documentation',
      ],
      powerLevel: 'high',
      interestLevel: 'high',
      influenceLevel: 'high',
      engagementStrategy: 'Proactive compliance with open communication channels',
      communicationMethod: 'Regulatory filings, formal correspondence, supervisory meetings',
      communicationFrequency: 'as_required',
      ismsRelevance:
        'Regulators directly mandate information security requirements through DORA and NIS2.',
      securityExpectations:
        'DORA-compliant ICT risk management, timely incident reporting, regular resilience testing, third-party risk management.',
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.interestedParty.create({
    data: {
      partyCode: 'IP-MERCH',
      name: 'Merchants',
      partyType: 'customer',
      description:
        'Over 2,400 e-commerce merchants across 18 European countries who use ClearStream payment gateway and merchant portal services.',
      expectations:
        'Reliable, secure, and compliant payment processing with high availability, competitive pricing, and responsive support.',
      requirements:
        'PCI-DSS compliance, 99.99% uptime SLA, data protection, transparent security practices, and timely incident communication.',
      informationNeeds: [
        'Service status updates',
        'Security certifications (ISO 27001, PCI-DSS)',
        'Incident notifications',
        'Product roadmap updates',
        'API documentation',
      ],
      powerLevel: 'high',
      interestLevel: 'high',
      influenceLevel: 'medium',
      engagementStrategy:
        'Regular communication through merchant portal, email updates, and dedicated account management',
      communicationMethod: 'Merchant portal, email, status page, account manager',
      communicationFrequency: 'monthly',
      ismsRelevance:
        'Merchants are the primary users of ClearStream services and their data must be protected.',
      securityExpectations:
        'PCI-DSS Level 1 compliance, secure APIs, encrypted data at rest and in transit, incident notification within 4 hours.',
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.interestedParty.create({
    data: {
      partyCode: 'IP-CARD',
      name: 'Cardholders',
      partyType: 'end_user',
      description:
        'End consumers whose payment card data is processed through ClearStream payment gateway when making purchases from ClearStream merchants.',
      expectations:
        'Secure processing of payment data, protection against fraud, and privacy of personal information.',
      requirements:
        'PCI-DSS compliance, GDPR data subject rights, fraud protection, and secure transaction processing.',
      informationNeeds: [
        'Privacy notice',
        'Data processing information',
        'Fraud protection information',
        'Data breach notifications (if applicable)',
      ],
      powerLevel: 'low',
      interestLevel: 'medium',
      influenceLevel: 'low',
      engagementStrategy: 'Indirect engagement through merchants and privacy documentation',
      communicationMethod: 'Privacy notices, merchant communication',
      communicationFrequency: 'as_required',
      ismsRelevance:
        'Cardholder data is the most sensitive data processed by ClearStream. PCI-DSS compliance is mandatory.',
      securityExpectations:
        'Payment card data tokenised at point of entry, strong encryption, no storage of CVV/CVC, fraud detection.',
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.interestedParty.create({
    data: {
      partyCode: 'IP-EMP',
      name: 'Employees',
      partyType: 'internal',
      description:
        'All 156 ClearStream employees across Dublin, Berlin, and Lisbon offices who contribute to company operations and are subject to security policies.',
      expectations:
        'Secure and productive work environment, clear security policies, adequate training, and protection of personal data.',
      requirements:
        'Security awareness training, clear acceptable use policies, secure remote working capabilities, and GDPR compliance for employee data.',
      informationNeeds: [
        'Security policies and procedures',
        'Security awareness training materials',
        'Incident reporting procedures',
        'Remote working security guidelines',
        'Data protection rights information',
      ],
      powerLevel: 'medium',
      interestLevel: 'medium',
      influenceLevel: 'medium',
      engagementStrategy:
        'Regular training, clear communication of policies, and security champion programme',
      communicationMethod: 'Intranet, email, training platform, all-hands meetings',
      communicationFrequency: 'quarterly',
      ismsRelevance:
        'Employees are both users and custodians of information assets. Their behaviour directly impacts security posture.',
      securityExpectations:
        'Regular security training, clear escalation paths, secure tools for remote work, and protection of personal employment data.',
      isActive: true,
      createdById: ctx.users.admin,
    },
  });

  // ============================================
  // 17. Context Issues
  // ============================================
  await prisma.contextIssue.create({
    data: {
      issueCode: 'CTX-001',
      issueType: 'external',
      category: 'threat',
      title: 'Evolving cyber threat landscape',
      description:
        'The financial services sector faces increasingly sophisticated cyber attacks including ransomware, supply chain compromises, and AI-powered social engineering. Payment processors are high-value targets for financially motivated threat actors.',
      impactType: 'negative',
      impactLevel: 'high',
      likelihood: 'high',
      ismsRelevance:
        'Directly impacts all ISMS controls and requires continual adaptation of security measures.',
      affectedAreas: [
        'Payment Gateway',
        'Fraud Detection',
        'Customer Data',
        'Business Continuity',
      ],
      controlImplications:
        'Requires enhanced threat intelligence, SOC capabilities, and regular penetration testing.',
      responseStrategy: 'mitigate',
      mitigationActions: [
        'Enhanced SOC monitoring (24/7)',
        'Quarterly penetration testing',
        'Threat intelligence feed integration',
        'Security awareness training programme',
      ],
      monitoringFrequency: 'continuous',
      lastReviewDate: new Date('2025-12-01'),
      nextReviewDate: new Date('2026-03-01'),
      trendDirection: 'increasing',
      status: 'active',
      isActive: true,
      escalatedToRisk: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.contextIssue.create({
    data: {
      issueCode: 'CTX-002',
      issueType: 'external',
      category: 'regulatory',
      title: 'Regulatory complexity (DORA/NIS2)',
      description:
        'The simultaneous implementation of DORA and NIS2 creates a complex regulatory landscape requiring significant compliance investment. Overlapping requirements between frameworks need careful management to avoid duplication of effort.',
      impactType: 'negative',
      impactLevel: 'high',
      likelihood: 'certain',
      ismsRelevance:
        'DORA and NIS2 impose specific information security requirements that extend existing ISO 27001 controls.',
      affectedAreas: [
        'ISMS Scope',
        'Risk Management',
        'Incident Reporting',
        'Third-Party Management',
        'Resilience Testing',
      ],
      controlImplications:
        'Requires mapping of DORA/NIS2 requirements to ISO 27001 controls and gap remediation.',
      responseStrategy: 'mitigate',
      mitigationActions: [
        'Integrated compliance framework mapping',
        'Dedicated DORA compliance workstream',
        'NIS2 gap assessment and remediation',
        'Regular regulatory horizon scanning',
      ],
      monitoringFrequency: 'monthly',
      lastReviewDate: new Date('2025-11-15'),
      nextReviewDate: new Date('2026-02-15'),
      trendDirection: 'stable',
      status: 'active',
      isActive: true,
      escalatedToRisk: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.contextIssue.create({
    data: {
      issueCode: 'CTX-003',
      issueType: 'external',
      category: 'technology',
      title: 'Cloud concentration risk',
      description:
        'Heavy reliance on AWS for all production workloads creates concentration risk. A major AWS outage in EU regions could impact all ClearStream services simultaneously.',
      impactType: 'negative',
      impactLevel: 'high',
      likelihood: 'low',
      ismsRelevance:
        'Cloud concentration risk affects availability controls and business continuity planning.',
      affectedAreas: [
        'Payment Gateway',
        'Merchant Portal',
        'Fraud Detection',
        'All Infrastructure',
      ],
      controlImplications:
        'Requires multi-region architecture, backup strategies, and cloud exit planning.',
      responseStrategy: 'mitigate',
      mitigationActions: [
        'Multi-AZ deployment architecture',
        'Cross-region failover capability',
        'Cloud exit strategy documentation',
        'Regular disaster recovery testing',
      ],
      monitoringFrequency: 'monthly',
      lastReviewDate: new Date('2025-10-01'),
      nextReviewDate: new Date('2026-01-01'),
      trendDirection: 'stable',
      status: 'active',
      isActive: true,
      escalatedToRisk: true,
      createdById: ctx.users.admin,
    },
  });

  await prisma.contextIssue.create({
    data: {
      issueCode: 'CTX-004',
      issueType: 'external',
      category: 'market',
      title: 'Talent market competition',
      description:
        'Intense competition for experienced security engineers, DevSecOps specialists, and compliance professionals in the European fintech market. Key person risk for specialised ISMS roles.',
      impactType: 'negative',
      impactLevel: 'medium',
      likelihood: 'high',
      ismsRelevance:
        'Talent shortages can impact ability to maintain security operations and ISMS effectiveness.',
      affectedAreas: [
        'Information Security Team',
        'Engineering Team',
        'Compliance Function',
        'SOC Operations',
      ],
      controlImplications:
        'Requires succession planning, knowledge management, and competitive retention strategies.',
      responseStrategy: 'mitigate',
      mitigationActions: [
        'Competitive compensation benchmarking',
        'Security champion programme expansion',
        'Cross-training and knowledge documentation',
        'Graduate security programme',
      ],
      monitoringFrequency: 'quarterly',
      lastReviewDate: new Date('2025-09-15'),
      nextReviewDate: new Date('2026-03-15'),
      trendDirection: 'increasing',
      status: 'active',
      isActive: true,
      escalatedToRisk: false,
      createdById: ctx.users.admin,
    },
  });
}
