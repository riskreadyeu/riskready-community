/**
 * Demo Organisation Seed Data
 *
 * Company: NexusGuard Technologies B.V.
 * Industry: Digital Infrastructure / ICT Service Provider (NIS2 Sector)
 * Size: Medium (~350 employees)
 * ISO 27001 Status: Planning phase
 * NIS2 Status: In scope - Important Entity
 *
 * This seed creates realistic demo data for presentations and testing.
 */

import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient(); // Removed to allow injection

// ============================================
// ORGANISATIONAL UNITS
// ============================================
export const organisationalUnits = [
  { name: 'Board of Directors', code: 'UNIT-BOARD', type: 'board', description: 'Supervisory Board' },
  { name: 'Executive Management', code: 'UNIT-EXEC', type: 'c-suite', description: 'Operational Executive Team', parentCode: 'UNIT-BOARD' },
  { name: 'Technology & Operations', code: 'UNIT-TECH', type: 'division', description: 'Technology Division', parentCode: 'UNIT-EXEC' },
  { name: 'Commercial & Sales', code: 'UNIT-COMM', type: 'division', description: 'Commercial Division', parentCode: 'UNIT-EXEC' },
  { name: 'Corporate Functions', code: 'UNIT-CORP', type: 'division', description: 'Support Functions', parentCode: 'UNIT-EXEC' },
];

// ============================================
// DEPARTMENT MEMBERSHIP MAPPING
// ============================================
export const departmentAssignments: Record<string, string> = {
  // Execs
  'martijn.devries@nexusguard.eu': 'DEPT-EXEC',
  'anna.schmidt@nexusguard.eu': 'DEPT-EXEC',
  'thomas.muller@nexusguard.eu': 'DEPT-EXEC',
  'eva.lindberg@nexusguard.eu': 'DEPT-EXEC',
  // Security
  'jan.bakker@nexusguard.eu': 'DEPT-INFOSEC',
  'sophie.vanderberg@nexusguard.eu': 'DEPT-INFOSEC',
  'peter.janssen@nexusguard.eu': 'DEPT-INFOSEC',
  'lisa.huber@nexusguard.eu': 'DEPT-INFOSEC',
  // IT Ops
  'marcus.weber@nexusguard.eu': 'DEPT-ITOPS',
  'lucas.meyer@nexusguard.eu': 'DEPT-ITOPS',
  'tom.dejong@nexusguard.eu': 'DEPT-ITOPS',
  // SOC
  'karin.andersson@nexusguard.eu': 'DEPT-SOC',
  'ana.garcia@nexusguard.eu': 'DEPT-SOC',
  // NetOps
  'david.oconnor@nexusguard.eu': 'DEPT-NETOPS',
  // Dev
  'julia.kowalski@nexusguard.eu': 'DEPT-DEV',
  'sarah.murphy@nexusguard.eu': 'DEPT-DEV',
  // Data Center
  'frank.becker@nexusguard.eu': 'DEPT-DCO',
  // CS & Sales
  'maria.santos@nexusguard.eu': 'DEPT-CS',
  'erik.nielsen@nexusguard.eu': 'DEPT-SALES',
  // Corporate
  'claire.dubois@nexusguard.eu': 'DEPT-EXEC', // HR often falls under Corp or Exec in smaller setups
  'michael.brennan@nexusguard.eu': 'DEPT-EXEC',
  'nina.petrova@nexusguard.eu': 'DEPT-EXEC',
  'stefan.hoffmann@nexusguard.eu': 'DEPT-EXEC',
  'emma.vanwijk@nexusguard.eu': 'DEPT-EXEC',
};

// ============================================
// COMMITTEE MEMBERSHIP MAPPING
// ============================================
export const committeeMembershipDefinitions = [
  { committee: 'ISMS Steering Committee', members: ['martijn.devries@nexusguard.eu', 'jan.bakker@nexusguard.eu', 'thomas.muller@nexusguard.eu', 'eva.lindberg@nexusguard.eu'] },
  { committee: 'Risk Management Committee', members: ['jan.bakker@nexusguard.eu', 'lisa.huber@nexusguard.eu', 'anna.schmidt@nexusguard.eu', 'nina.petrova@nexusguard.eu'] },
  { committee: 'Change Advisory Board', members: ['thomas.muller@nexusguard.eu', 'marcus.weber@nexusguard.eu', 'julia.kowalski@nexusguard.eu', 'jan.bakker@nexusguard.eu'] },
];

// ============================================
// USERS (Demo Personnel)
// ============================================
export const demoUsers = [
  // Executive Team
  { email: 'martijn.devries@nexusguard.eu', firstName: 'Martijn', lastName: 'de Vries', role: 'CEO' },
  { email: 'anna.schmidt@nexusguard.eu', firstName: 'Anna', lastName: 'Schmidt', role: 'CFO' },
  { email: 'thomas.muller@nexusguard.eu', firstName: 'Thomas', lastName: 'Müller', role: 'CTO' },
  { email: 'eva.lindberg@nexusguard.eu', firstName: 'Eva', lastName: 'Lindberg', role: 'COO' },

  // Security & Compliance
  { email: 'jan.bakker@nexusguard.eu', firstName: 'Jan', lastName: 'Bakker', role: 'CISO' },
  { email: 'sophie.vanderberg@nexusguard.eu', firstName: 'Sophie', lastName: 'van der Berg', role: 'DPO' },
  { email: 'peter.janssen@nexusguard.eu', firstName: 'Peter', lastName: 'Janssen', role: 'Compliance Manager' },
  { email: 'lisa.huber@nexusguard.eu', firstName: 'Lisa', lastName: 'Huber', role: 'Risk Manager' },

  // Department Heads
  { email: 'marcus.weber@nexusguard.eu', firstName: 'Marcus', lastName: 'Weber', role: 'IT Operations Director' },
  { email: 'karin.andersson@nexusguard.eu', firstName: 'Karin', lastName: 'Andersson', role: 'SOC Manager' },
  { email: 'david.oconnor@nexusguard.eu', firstName: 'David', lastName: 'O\'Connor', role: 'Network Operations Manager' },
  { email: 'julia.kowalski@nexusguard.eu', firstName: 'Julia', lastName: 'Kowalski', role: 'Software Development Lead' },
  { email: 'frank.becker@nexusguard.eu', firstName: 'Frank', lastName: 'Becker', role: 'Data Center Manager' },
  { email: 'maria.santos@nexusguard.eu', firstName: 'Maria', lastName: 'Santos', role: 'Customer Success Director' },
  { email: 'erik.nielsen@nexusguard.eu', firstName: 'Erik', lastName: 'Nielsen', role: 'Sales Director' },
  { email: 'claire.dubois@nexusguard.eu', firstName: 'Claire', lastName: 'Dubois', role: 'HR Director' },
  { email: 'michael.brennan@nexusguard.eu', firstName: 'Michael', lastName: 'Brennan', role: 'Finance Manager' },
  { email: 'nina.petrova@nexusguard.eu', firstName: 'Nina', lastName: 'Petrova', role: 'Legal Counsel' },
  { email: 'stefan.hoffmann@nexusguard.eu', firstName: 'Stefan', lastName: 'Hoffmann', role: 'Quality Assurance Manager' },
  { email: 'emma.vanwijk@nexusguard.eu', firstName: 'Emma', lastName: 'van Wijk', role: 'Product Manager' },

  // Security Champions & Key Staff
  { email: 'lucas.meyer@nexusguard.eu', firstName: 'Lucas', lastName: 'Meyer', role: 'Security Engineer' },
  { email: 'sarah.murphy@nexusguard.eu', firstName: 'Sarah', lastName: 'Murphy', role: 'Senior Developer' },
  { email: 'tom.dejong@nexusguard.eu', firstName: 'Tom', lastName: 'de Jong', role: 'Infrastructure Architect' },
  { email: 'ana.garcia@nexusguard.eu', firstName: 'Ana', lastName: 'Garcia', role: 'SOC Analyst Lead' },
];

// ============================================
// ORGANISATION PROFILE
// ============================================
export const organisationProfile = {
  name: 'NexusGuard Technologies',
  legalName: 'NexusGuard Technologies B.V.',
  description: 'NexusGuard Technologies is a leading European managed services and cloud infrastructure provider, delivering secure hosting solutions, managed security services, and IT infrastructure management to enterprises across the EU. Founded in 2012, we serve over 200 enterprise clients with mission-critical infrastructure needs.',
  logoUrl: 'https://ui-avatars.com/api/?name=Nexus+Guard&background=0D8ABC&color=fff&size=200',

  // Industry Information
  industrySector: 'technology',
  industrySubsector: 'Digital Infrastructure & ICT Services',
  industryCode: '63.11',
  marketPosition: 'challenger',
  primaryCompetitors: ['CloudFirst AG', 'SecureHost GmbH', 'EuroCloud Solutions', 'TechVault B.V.'],

  // Financial Information
  annualRevenue: 45000000,
  revenueCurrency: 'EUR',
  revenueStreams: ['Managed Hosting Services', 'Managed Security Services (MSSP)', 'Cloud Infrastructure (IaaS)', 'Professional Services', 'Support & Maintenance Contracts'],
  revenueTrend: 'growing',
  fiscalYearStart: '01-01',
  fiscalYearEnd: new Date('2025-12-31'),
  reportingCurrency: 'EUR',

  // Employee Information
  employeeCount: 274,
  employeeCategories: { 'full_time': 312, 'part_time': 18, 'contractors': 17 },
  employeeLocations: { 'netherlands': 185, 'germany': 92, 'ireland': 45, 'remote': 25 },
  employeeGrowthRate: 12.5,
  remoteWorkPercentage: 25,
  size: 'medium',

  // Corporate Structure
  parentOrganization: null,
  subsidiaries: ['NexusGuard Deutschland GmbH', 'NexusGuard Ireland Ltd'],
  operatingCountries: ['Netherlands', 'Germany', 'Ireland', 'Belgium', 'Austria', 'Switzerland'],

  // Contact Information
  headquartersAddress: 'Herikerbergweg 292, 1101 CT Amsterdam, Netherlands',
  registeredAddress: 'Herikerbergweg 292, 1101 CT Amsterdam, Netherlands',
  contactEmail: 'info@nexusguard.eu',
  contactPhone: '+31 20 123 4567',
  website: 'https://www.nexusguard.eu',

  // Legal Information
  registrationNumber: 'KVK 12345678',
  taxIdentification: 'NL123456789B01',
  dunsNumber: '987654321',
  stockSymbol: 'NXG',
  leiCode: '529900T8BM49AURSDO55',
  naceCode: '63.11',
  sicCode: '7374',
  foundedYear: 2012,

  // Strategic Information
  missionStatement: 'To provide European enterprises with secure, reliable, and compliant digital infrastructure that enables business growth while ensuring data sovereignty and regulatory compliance.',
  visionStatement: 'To become the most trusted digital infrastructure partner for European enterprises requiring the highest standards of security and compliance.',
  coreValues: ['Security First', 'Customer Partnership', 'Operational Excellence', 'Transparency', 'Innovation', 'European Data Sovereignty'],
  strategicObjectives: [
    'Maintain ISO 27001 certification and expand scope',
    'Full NIS2 compliance by October 2024',
    'Expand SOC 2 Type II coverage to all services',
    'Launch new Kubernetes managed platform',
    'Achieve 99.99% uptime SLA across all services',
    'Grow MSSP revenue by 40%'
  ],
  businessModel: 'B2B Managed Services with tiered subscription model and professional services add-ons',
  valueProposition: 'European-sovereign cloud infrastructure with built-in compliance for ISO 27001, NIS2, and GDPR - delivered by security experts who understand regulatory requirements.',

  // ISMS Information (ISO 27001 Clause 4.3)
  ismsScope: 'The Information Security Management System covers the provision of managed hosting services, managed security services (SOC), cloud infrastructure services, and associated support functions. This includes all information assets, personnel, processes, and technology platforms used to deliver these services from our Amsterdam headquarters, Frankfurt data center, and Dublin operations center.',
  ismsPolicy: 'NexusGuard Technologies is committed to protecting the confidentiality, integrity, and availability of client data and our own information assets. We implement industry-leading security controls aligned with ISO 27001, continuously monitor threats, and maintain compliance with NIS2 and GDPR requirements.',
  ismsObjectives: [
    'Zero critical security incidents affecting client data',
    'Maintain 99.95% availability for all managed services',
    '100% security awareness training completion annually',
    'Quarterly vulnerability assessments with <48h critical remediation',
    'Annual penetration testing with findings remediated within 30 days',
    'Maintain ISO 27001 certification'
  ],

  // ISMS Scope Details
  productsServicesInScope: ['Managed Hosting', 'Managed Security (SOC)', 'Cloud Infrastructure (IaaS)', 'Backup & Disaster Recovery', 'Network Services'],
  departmentsInScope: ['IT Operations', 'Security Operations Center', 'Network Operations', 'Data Center Operations', 'Customer Success', 'Software Development'],
  locationsInScope: ['Amsterdam HQ', 'Frankfurt Data Center', 'Dublin Operations Center'],
  processesInScope: ['Incident Management', 'Change Management', 'Access Management', 'Vulnerability Management', 'Backup & Recovery', 'Service Delivery'],
  systemsInScope: ['VMware vSphere', 'Kubernetes Platform', 'SIEM (Splunk)', 'Ticketing System (ServiceNow)', 'Identity Management (Okta)', 'Network Infrastructure'],
  scopeExclusions: 'Sales and Marketing activities, HR administration systems, and corporate finance systems are excluded from the initial ISMS scope.',
  exclusionJustification: 'These functions do not directly process client data or provide customer-facing services. They will be considered for inclusion in future scope expansions.',
  scopeBoundaries: 'The ISMS boundary includes all systems, networks, and personnel involved in service delivery. External boundaries are defined at customer demarcation points and third-party API integrations.',

  // ISO Certification
  isoCertificationStatus: 'certified',
  certificationBody: 'BSI Group',
  certificationDate: new Date('2023-11-15'),
  certificationExpiry: new Date('2026-11-14'),
  certificateNumber: 'IS 765432',
  nextAuditDate: new Date('2024-11-15'),

  // Risk Management
  riskAppetite: 'Low risk appetite for security and compliance risks. Moderate appetite for strategic growth initiatives. Zero tolerance for risks that could impact client data confidentiality or service availability.',
  riskTolerance: {
    'security': 'very_low',
    'compliance': 'very_low',
    'operational': 'low',
    'financial': 'moderate',
    'strategic': 'moderate',
    'reputational': 'low'
  },

  // Digital Transformation
  digitalTransformationStage: 'optimizing',
  technologyAdoptionRate: 82,
  innovationFocus: ['Zero Trust Architecture', 'AI-Powered Security Operations', 'Infrastructure as Code', 'Kubernetes & Container Security', 'Edge Computing'],

  // Sustainability
  sustainabilityGoals: ['Carbon neutral operations by 2027', '100% renewable energy for data centers by 2025', 'E-waste recycling program', 'Green procurement policy'],
  esgRating: 'B+',

  // DORA Applicability (Not applicable - not a financial entity)
  isDoraApplicable: false,
  doraEntityType: 'ICT Third-Party Provider',
  doraRegime: 'Critical', // As a critical 3rd party provider
  doraExemptionReason: 'Directly subject to oversight framework for critical ICT third-party service providers.',

  // NIS2 Applicability
  isNis2Applicable: true,
  nis2EntityClassification: 'important',
  nis2Sector: 'digital_infrastructure',
  nis2AnnexType: 'annex_i',

  // Supervisory Authority
  primarySupervisoryAuthority: 'Rijksinspectie Digitale Infrastructuur (RDI)',
  supervisoryAuthorityCountry: 'Netherlands',
  supervisoryRegistrationNumber: 'RDI-REG-2024-889',
  supervisoryRegistrationDate: new Date('2024-01-15'),

  // Survey Linkage
  lastDoraAssessmentId: null,
  lastNis2AssessmentId: null,
  regulatoryProfileUpdatedAt: new Date(),
};

// ============================================
// DEPARTMENTS
// ============================================
export const departments = [
  {
    name: 'Executive Management',
    departmentCode: 'DEPT-EXEC',
    description: 'Executive leadership team responsible for strategic direction, corporate governance, and overall company performance.',
    departmentCategory: 'management',
    functionType: 'strategic',
    criticalityLevel: 'critical',
    headcount: 5,
    contractorCount: 0,
    keyResponsibilities: ['Strategic planning', 'Corporate governance', 'Stakeholder management', 'Risk oversight', 'M&A decisions'],
    regulatoryObligations: ['NIS2 management accountability', 'GDPR controller responsibilities', 'Corporate governance requirements'],
    costCenter: 'CC-1000',
    budget: 800000,
    budgetCurrency: 'EUR',
    location: 'Amsterdam HQ',
    businessHours: { 'monday-friday': '08:00-18:00' },
    contactEmail: 'executive@nexusguard.eu',
    isActive: true,
    establishedDate: new Date('2012-03-15'),
    handlesPersonalData: true,
    handlesFinancialData: true,
  },
  {
    name: 'Information Security',
    departmentCode: 'DEPT-INFOSEC',
    description: 'Responsible for information security strategy, policy development, risk management, and security compliance across the organization.',
    departmentCategory: 'security',
    functionType: 'governance',
    criticalityLevel: 'critical',
    headcount: 12,
    contractorCount: 2,
    keyResponsibilities: ['Security strategy', 'Policy management', 'Risk assessment', 'Compliance monitoring', 'Security awareness', 'Incident response coordination', 'Vendor security assessment'],
    regulatoryObligations: ['NIS2 security requirements', 'GDPR security measures', 'ISO 27001 implementation'],
    costCenter: 'CC-1100',
    budget: 950000,
    budgetCurrency: 'EUR',
    location: 'Amsterdam HQ',
    businessHours: { 'monday-friday': '08:00-18:00', 'on-call': '24/7' },
    contactEmail: 'security@nexusguard.eu',
    isActive: true,
    establishedDate: new Date('2015-06-01'),
    handlesPersonalData: true,
    handlesFinancialData: false,
  },
  {
    name: 'Security Operations Center (SOC)',
    departmentCode: 'DEPT-SOC',
    description: '24/7 Security Operations Center providing threat detection, incident response, and security monitoring services for NexusGuard and managed security clients.',
    departmentCategory: 'operations',
    functionType: 'operational',
    criticalityLevel: 'critical',
    headcount: 28,
    contractorCount: 4,
    keyResponsibilities: ['24/7 security monitoring', 'Threat detection & analysis', 'Incident response', 'SIEM management', 'Threat intelligence', 'Security alerting', 'Forensic analysis'],
    regulatoryObligations: ['NIS2 incident handling', 'Client SLA compliance', 'Evidence preservation requirements'],
    costCenter: 'CC-1200',
    budget: 2100000,
    budgetCurrency: 'EUR',
    location: 'Amsterdam HQ',
    businessHours: { 'all-days': '24/7' },
    contactEmail: 'soc@nexusguard.eu',
    contactPhone: '+31 20 123 4599',
    emergencyContact: { name: 'SOC Duty Manager', phone: '+31 6 1234 5678', email: 'soc-emergency@nexusguard.eu' },
    isActive: true,
    establishedDate: new Date('2016-01-15'),
    handlesPersonalData: true,
    handlesFinancialData: false,
  },
  {
    name: 'IT Operations',
    departmentCode: 'DEPT-ITOPS',
    description: 'Manages internal IT infrastructure, end-user computing, and IT service management for NexusGuard employees.',
    departmentCategory: 'technology',
    functionType: 'operational',
    criticalityLevel: 'high',
    headcount: 18,
    contractorCount: 2,
    keyResponsibilities: ['Internal IT support', 'Endpoint management', 'Identity & access management', 'IT procurement', 'License management', 'IT asset management'],
    regulatoryObligations: ['GDPR data protection', 'Software license compliance'],
    costCenter: 'CC-1300',
    budget: 1200000,
    budgetCurrency: 'EUR',
    location: 'Amsterdam HQ',
    businessHours: { 'monday-friday': '07:00-19:00', 'saturday': '09:00-13:00' },
    contactEmail: 'it-support@nexusguard.eu',
    isActive: true,
    establishedDate: new Date('2012-03-15'),
    handlesPersonalData: true,
    handlesFinancialData: false,
  },
  {
    name: 'Network Operations',
    departmentCode: 'DEPT-NETOPS',
    description: 'Manages network infrastructure, connectivity services, and network security for both internal and client-facing services.',
    departmentCategory: 'technology',
    functionType: 'operational',
    criticalityLevel: 'critical',
    headcount: 22,
    contractorCount: 3,
    keyResponsibilities: ['Network design & architecture', 'Firewall management', 'Load balancing', 'DDoS protection', 'VPN services', 'Network monitoring', 'Capacity planning'],
    regulatoryObligations: ['NIS2 network security', 'Client SLA compliance', 'Traffic logging requirements'],
    costCenter: 'CC-1400',
    budget: 1800000,
    budgetCurrency: 'EUR',
    location: 'Frankfurt Data Center',
    businessHours: { 'all-days': '24/7' },
    contactEmail: 'noc@nexusguard.eu',
    emergencyContact: { name: 'NOC Duty Manager', phone: '+49 69 1234 5678', email: 'noc-emergency@nexusguard.eu' },
    isActive: true,
    establishedDate: new Date('2013-09-01'),
    handlesPersonalData: false,
    handlesFinancialData: false,
  },
  {
    name: 'Data Center Operations',
    departmentCode: 'DEPT-DCO',
    description: 'Manages physical data center facilities, hardware infrastructure, and environmental systems across all NexusGuard data center locations.',
    departmentCategory: 'operations',
    functionType: 'operational',
    criticalityLevel: 'critical',
    headcount: 32,
    contractorCount: 0,
    keyResponsibilities: ['Hardware provisioning', 'Rack management', 'Power & cooling', 'Physical security', 'Cabling infrastructure', 'Capacity management', 'Environmental monitoring'],
    regulatoryObligations: ['Physical security requirements', 'Environmental compliance', 'Fire safety regulations'],
    costCenter: 'CC-1500',
    budget: 3500000,
    budgetCurrency: 'EUR',
    location: 'Frankfurt Data Center',
    businessHours: { 'all-days': '24/7' },
    contactEmail: 'datacenter@nexusguard.eu',
    emergencyContact: { name: 'DC Facility Manager', phone: '+49 69 1234 9999', email: 'dc-emergency@nexusguard.eu' },
    isActive: true,
    establishedDate: new Date('2014-04-01'),
    handlesPersonalData: false,
    handlesFinancialData: false,
  },
  {
    name: 'Software Development',
    departmentCode: 'DEPT-DEV',
    description: 'Develops and maintains internal tools, customer portals, automation systems, and platform integrations.',
    departmentCategory: 'technology',
    functionType: 'development',
    criticalityLevel: 'high',
    headcount: 35,
    contractorCount: 5,
    keyResponsibilities: ['Portal development', 'API development', 'Automation tooling', 'DevOps practices', 'Code security', 'Platform integrations'],
    regulatoryObligations: ['Secure development lifecycle', 'GDPR privacy by design'],
    costCenter: 'CC-1600',
    budget: 2800000,
    budgetCurrency: 'EUR',
    location: 'Amsterdam HQ',
    businessHours: { 'monday-friday': '09:00-18:00' },
    contactEmail: 'development@nexusguard.eu',
    isActive: true,
    establishedDate: new Date('2014-01-15'),
    handlesPersonalData: true,
    handlesFinancialData: false,
  },
  {
    name: 'Customer Success',
    departmentCode: 'DEPT-CS',
    description: 'Manages customer relationships, service delivery coordination, and ensures client satisfaction and retention.',
    departmentCategory: 'commercial',
    functionType: 'customer-facing',
    criticalityLevel: 'high',
    headcount: 38,
    contractorCount: 0,
    keyResponsibilities: ['Customer onboarding', 'Service coordination', 'Escalation management', 'Customer communication', 'SLA management', 'Client reporting', 'Renewal management'],
    regulatoryObligations: ['Contract compliance', 'SLA reporting', 'GDPR data subject requests'],
    costCenter: 'CC-1700',
    budget: 1600000,
    budgetCurrency: 'EUR',
    location: 'Dublin Operations Center',
    businessHours: { 'monday-friday': '08:00-20:00', 'saturday': '09:00-17:00' },
    contactEmail: 'customer-success@nexusguard.eu',
    isActive: true,
    establishedDate: new Date('2015-03-01'),
    handlesPersonalData: true,
    handlesFinancialData: false,
  },
  {
    name: 'Sales & Business Development',
    departmentCode: 'DEPT-SALES',
    description: 'Responsible for new business acquisition, account management, and revenue growth across all service lines.',
    departmentCategory: 'commercial',
    functionType: 'commercial',
    criticalityLevel: 'medium',
    headcount: 24,
    contractorCount: 0,
    keyResponsibilities: ['New business development', 'Account management', 'Proposal development', 'Contract negotiation', 'Pipeline management', 'Partner relationships'],
    regulatoryObligations: ['Contract law compliance', 'Anti-bribery requirements'],
    costCenter: 'CC-1800',
    budget: 1400000,
    budgetCurrency: 'EUR',
    location: 'Amsterdam HQ',
    businessHours: { 'monday-friday': '09:00-18:00' },
    contactEmail: 'sales@nexusguard.eu',
    isActive: true,
    establishedDate: new Date('2012-03-15'),
    handlesPersonalData: true,
    handlesFinancialData: false,
  },
  {
    name: 'Marketing',
    departmentCode: 'DEPT-MKT',
    description: 'Manages brand, marketing communications, demand generation, and market positioning.',
    departmentCategory: 'commercial',
    functionType: 'commercial',
    criticalityLevel: 'low',
    headcount: 12,
    contractorCount: 3,
    keyResponsibilities: ['Brand management', 'Content marketing', 'Lead generation', 'Event management', 'PR & communications', 'Website management'],
    regulatoryObligations: ['GDPR marketing consent', 'Cookie compliance'],
    costCenter: 'CC-1900',
    budget: 650000,
    budgetCurrency: 'EUR',
    location: 'Amsterdam HQ',
    businessHours: { 'monday-friday': '09:00-17:30' },
    contactEmail: 'marketing@nexusguard.eu',
    isActive: true,
    establishedDate: new Date('2013-06-01'),
    handlesPersonalData: true,
    handlesFinancialData: false,
  },
  {
    name: 'Human Resources',
    departmentCode: 'DEPT-HR',
    description: 'Manages talent acquisition, employee development, HR operations, and workplace culture.',
    departmentCategory: 'support',
    functionType: 'support',
    criticalityLevel: 'medium',
    headcount: 14,
    contractorCount: 0,
    keyResponsibilities: ['Recruitment', 'Onboarding/offboarding', 'Performance management', 'Training & development', 'Compensation & benefits', 'Employee relations', 'HR compliance'],
    regulatoryObligations: ['Employment law compliance', 'GDPR employee data', 'Works council requirements'],
    costCenter: 'CC-2000',
    budget: 580000,
    budgetCurrency: 'EUR',
    location: 'Amsterdam HQ',
    businessHours: { 'monday-friday': '09:00-17:30' },
    contactEmail: 'hr@nexusguard.eu',
    isActive: true,
    establishedDate: new Date('2012-03-15'),
    handlesPersonalData: true,
    handlesFinancialData: true,
  },
  {
    name: 'Finance & Accounting',
    departmentCode: 'DEPT-FIN',
    description: 'Manages financial planning, accounting, billing, and financial reporting.',
    departmentCategory: 'support',
    functionType: 'support',
    criticalityLevel: 'high',
    headcount: 16,
    contractorCount: 0,
    keyResponsibilities: ['Financial planning', 'Accounts payable/receivable', 'Billing operations', 'Financial reporting', 'Tax compliance', 'Treasury management', 'Audit coordination'],
    regulatoryObligations: ['Dutch GAAP compliance', 'Tax regulations', 'Audit requirements'],
    costCenter: 'CC-2100',
    budget: 720000,
    budgetCurrency: 'EUR',
    location: 'Amsterdam HQ',
    businessHours: { 'monday-friday': '09:00-17:30' },
    contactEmail: 'finance@nexusguard.eu',
    isActive: true,
    establishedDate: new Date('2012-03-15'),
    handlesPersonalData: true,
    handlesFinancialData: true,
  },
  {
    name: 'Legal & Compliance',
    departmentCode: 'DEPT-LEGAL',
    description: 'Manages legal affairs, contract management, regulatory compliance, and data protection.',
    departmentCategory: 'support',
    functionType: 'governance',
    criticalityLevel: 'high',
    headcount: 8,
    contractorCount: 2,
    keyResponsibilities: ['Contract management', 'Legal advice', 'Regulatory compliance', 'Data protection (DPO)', 'Dispute resolution', 'IP management', 'Policy development'],
    regulatoryObligations: ['GDPR DPO requirements', 'NIS2 compliance', 'Contract law', 'Corporate governance'],
    costCenter: 'CC-2200',
    budget: 520000,
    budgetCurrency: 'EUR',
    location: 'Amsterdam HQ',
    businessHours: { 'monday-friday': '09:00-17:30' },
    contactEmail: 'legal@nexusguard.eu',
    isActive: true,
    establishedDate: new Date('2014-09-01'),
    handlesPersonalData: true,
    handlesFinancialData: false,
  },
  {
    name: 'Quality Assurance',
    departmentCode: 'DEPT-QA',
    description: 'Ensures service quality, process improvement, and maintains quality management systems.',
    departmentCategory: 'support',
    functionType: 'governance',
    criticalityLevel: 'medium',
    headcount: 10,
    contractorCount: 0,
    keyResponsibilities: ['Quality management', 'Process improvement', 'Internal audits', 'Certification management', 'Documentation control', 'Performance metrics'],
    regulatoryObligations: ['ISO 27001 requirements', 'Audit requirements'],
    costCenter: 'CC-2300',
    budget: 380000,
    budgetCurrency: 'EUR',
    location: 'Amsterdam HQ',
    businessHours: { 'monday-friday': '09:00-17:30' },
    contactEmail: 'quality@nexusguard.eu',
    isActive: true,
    establishedDate: new Date('2017-01-15'),
    handlesPersonalData: false,
    handlesFinancialData: false,
  },
];

// ============================================
// LOCATIONS
// ============================================
export const locations = [
  {
    name: 'Amsterdam Headquarters',
    locationCode: 'LOC-AMS-HQ',
    locationType: 'headquarters',
    address: 'Herikerbergweg 292',
    city: 'Amsterdam',
    state: 'Noord-Holland',
    country: 'Netherlands',
    postalCode: '1101 CT',
    region: 'Western Europe',
    timezone: 'Europe/Amsterdam',
    contactEmail: 'amsterdam@nexusguard.eu',
    contactPhone: '+31 20 123 4567',
    employeeCount: 185,
    maxCapacity: 220,
    floorSpace: 3200,
    floorSpaceUnit: 'sqm',
    physicalSecurityLevel: 'high',
    accessControlType: 'card_and_pin',
    securityFeatures: ['24/7 Reception', 'CCTV Monitoring', 'Access Card System', 'Visitor Management', 'Secure Areas', 'Alarm System'],
    isDataCenter: false,
    hasServerRoom: true,
    networkType: 'fiber',
    internetProvider: 'KPN Business',
    backupPower: true,
    complianceCertifications: ['ISO 27001 (in progress)'],
    inIsmsScope: true,
    scopeJustification: 'Primary business operations, management, and SOC location',
    isActive: true,
    operationalSince: new Date('2012-03-15'),
  },
  {
    name: 'Frankfurt Data Center',
    locationCode: 'LOC-FRA-DC1',
    locationType: 'data_center',
    address: 'Hanauer Landstraße 298',
    city: 'Frankfurt am Main',
    state: 'Hessen',
    country: 'Germany',
    postalCode: '60314',
    region: 'Western Europe',
    timezone: 'Europe/Berlin',
    contactEmail: 'frankfurt-dc@nexusguard.eu',
    contactPhone: '+49 69 1234 5678',
    employeeCount: 92,
    maxCapacity: 120,
    floorSpace: 4500,
    floorSpaceUnit: 'sqm',
    physicalSecurityLevel: 'critical',
    accessControlType: 'biometric_and_mantrap',
    securityFeatures: ['24/7 Manned Security', 'Biometric Access', 'Mantrap Entry', 'CCTV with 90-day Retention', 'Perimeter Fencing', 'Vehicle Barriers', 'Intrusion Detection'],
    isDataCenter: true,
    hasServerRoom: true,
    networkType: 'fiber_redundant',
    internetProvider: 'DE-CIX Direct',
    backupPower: true,
    complianceCertifications: ['ISO 27001', 'SOC 2 Type II', 'EN 50600'],
    inIsmsScope: true,
    scopeJustification: 'Primary data center for all managed hosting and cloud services',
    isActive: true,
    operationalSince: new Date('2014-04-01'),
  },
  {
    name: 'Dublin Operations Center',
    locationCode: 'LOC-DUB-OPS',
    locationType: 'office',
    address: 'Grand Canal Square 3',
    city: 'Dublin',
    state: 'Leinster',
    country: 'Ireland',
    postalCode: 'D02 P820',
    region: 'Western Europe',
    timezone: 'Europe/Dublin',
    contactEmail: 'dublin@nexusguard.eu',
    contactPhone: '+353 1 234 5678',
    employeeCount: 45,
    maxCapacity: 60,
    floorSpace: 850,
    floorSpaceUnit: 'sqm',
    physicalSecurityLevel: 'medium',
    accessControlType: 'card',
    securityFeatures: ['Reception', 'CCTV', 'Access Card System', 'Visitor Badges'],
    isDataCenter: false,
    hasServerRoom: false,
    networkType: 'fiber',
    internetProvider: 'Eir Business',
    backupPower: false,
    complianceCertifications: [],
    inIsmsScope: true,
    scopeJustification: 'Customer Success and extended support operations',
    isActive: true,
    operationalSince: new Date('2018-09-01'),
  },
  {
    name: 'Amsterdam DR Site',
    locationCode: 'LOC-AMS-DR',
    locationType: 'disaster_recovery',
    address: 'Science Park 400',
    city: 'Amsterdam',
    state: 'Noord-Holland',
    country: 'Netherlands',
    postalCode: '1098 XH',
    region: 'Western Europe',
    timezone: 'Europe/Amsterdam',
    contactEmail: 'dr-site@nexusguard.eu',
    contactPhone: '+31 20 987 6543',
    employeeCount: 5,
    maxCapacity: 30,
    floorSpace: 600,
    floorSpaceUnit: 'sqm',
    physicalSecurityLevel: 'high',
    accessControlType: 'biometric',
    securityFeatures: ['Biometric Access', 'CCTV', '24/7 Remote Monitoring', 'Alarm System'],
    isDataCenter: true,
    hasServerRoom: true,
    networkType: 'fiber_redundant',
    internetProvider: 'AMS-IX Direct',
    backupPower: true,
    complianceCertifications: ['EN 50600 Level 3'],
    inIsmsScope: true,
    scopeJustification: 'Disaster recovery and business continuity site',
    isActive: true,
    operationalSince: new Date('2019-03-01'),
  },
];

// ============================================
// BUSINESS PROCESSES
// ============================================
export const businessProcesses = [
  {
    name: 'Incident Management',
    processCode: 'PROC-INC-001',
    description: 'End-to-end process for detecting, responding to, and resolving security and operational incidents affecting NexusGuard services or client environments.',
    processType: 'operational',
    criticalityLevel: 'critical',
    inputs: ['Security alerts', 'Customer tickets', 'Monitoring alerts', 'Threat intelligence'],
    outputs: ['Incident reports', 'Root cause analysis', 'Remediation actions', 'Customer notifications'],
    keyActivities: ['Incident detection', 'Triage and classification', 'Investigation', 'Containment', 'Eradication', 'Recovery', 'Post-incident review'],
    stakeholders: ['SOC Team', 'Network Operations', 'Customer Success', 'CISO', 'Affected Clients'],
    kpis: [
      { name: 'Mean Time to Detect (MTTD)', target: '<15 minutes', actual: '12 minutes' },
      { name: 'Mean Time to Respond (MTTR)', target: '<30 minutes', actual: '25 minutes' },
      { name: 'Critical Incident SLA Compliance', target: '99%', actual: '99.2%' },
    ],
    cycleTimeHours: null,
    frequency: 'event-driven',
    automationLevel: 'high',
    complianceRequirements: ['NIS2 incident reporting', 'GDPR breach notification', 'ISO 27001 A.16'],
    riskRating: 'high',
    isActive: true,
    biaStatus: 'completed',
    bcpEnabled: true,
    bcpCriticality: 'critical',
    recoveryTimeObjectiveMinutes: 15,
    recoveryPointObjectiveMinutes: 0,
    maximumTolerableDowntimeMinutes: 60,
    minimumStaff: 4,
    operatingHours: { 'all-days': '24/7' },
    peakPeriods: { 'business-hours': 'higher volume', 'patch-tuesday': 'elevated' },
    criticalRoles: ['SOC Manager', 'Incident Commander', 'SOC Analyst'],
    requiredSkills: ['SIEM operation', 'Forensic analysis', 'Network analysis', 'Malware analysis'],
    systemDependencies: ['SIEM (Splunk)', 'Ticketing (ServiceNow)', 'Communication (Slack)', 'SOAR Platform'],
    supplierDependencies: ['Threat intelligence feeds', 'EDR vendor support'],
    alternateProcesses: 'Manual incident handling via phone bridge and email',
    workaroundProcedures: 'Predefined incident response playbooks available offline',
    manualProcedures: 'Paper-based incident forms and manual escalation tree',
    recoveryStrategies: ['Activate backup SOC workstations', 'Switch to DR SIEM instance', 'Enable phone-based coordination'],
  },
  {
    name: 'Change Management',
    processCode: 'PROC-CHG-001',
    description: 'Structured process for managing changes to production systems, ensuring proper review, approval, and implementation with minimal service disruption.',
    processType: 'operational',
    criticalityLevel: 'high',
    inputs: ['Change requests', 'Project requirements', 'Security patches', 'Customer requests'],
    outputs: ['Approved changes', 'Implementation plans', 'Rollback procedures', 'Change records'],
    keyActivities: ['Request submission', 'Impact assessment', 'CAB review', 'Approval', 'Scheduling', 'Implementation', 'Verification', 'Closure'],
    stakeholders: ['Change Manager', 'CAB Members', 'Technical Teams', 'Customer Success'],
    kpis: [
      { name: 'Change Success Rate', target: '>95%', actual: '97.3%' },
      { name: 'Emergency Change Ratio', target: '<10%', actual: '7%' },
      { name: 'Mean Lead Time', target: '<5 days', actual: '4.2 days' },
    ],
    cycleTimeHours: 72,
    frequency: 'continuous',
    automationLevel: 'medium',
    complianceRequirements: ['ISO 27001 A.12.1.2', 'SOC 2 Change Management'],
    riskRating: 'medium',
    isActive: true,
    biaStatus: 'completed',
    bcpEnabled: true,
    bcpCriticality: 'high',
    recoveryTimeObjectiveMinutes: 60,
    recoveryPointObjectiveMinutes: 30,
    maximumTolerableDowntimeMinutes: 240,
    minimumStaff: 2,
    operatingHours: { 'monday-friday': '08:00-18:00' },
    criticalRoles: ['Change Manager', 'CAB Chair'],
    requiredSkills: ['ITIL Change Management', 'Risk assessment'],
    systemDependencies: ['ServiceNow', 'Deployment tools', 'Monitoring systems'],
  },
  {
    name: 'Access Management',
    processCode: 'PROC-ACC-001',
    description: 'Process for managing user access rights, including provisioning, modification, and deprovisioning of access to systems and data.',
    processType: 'operational',
    criticalityLevel: 'critical',
    inputs: ['Access requests', 'HR notifications', 'Role changes', 'Audit findings'],
    outputs: ['Provisioned accounts', 'Access reviews', 'Audit logs', 'Compliance reports'],
    keyActivities: ['Request validation', 'Approval workflow', 'Account provisioning', 'Access review', 'Deprovisioning', 'Audit logging'],
    stakeholders: ['IT Operations', 'HR', 'Department Managers', 'Security Team'],
    kpis: [
      { name: 'Provisioning SLA', target: '<24 hours', actual: '18 hours' },
      { name: 'Deprovisioning SLA (termination)', target: '<4 hours', actual: '2 hours' },
      { name: 'Access Review Completion', target: '100%', actual: '100%' },
    ],
    cycleTimeHours: 24,
    frequency: 'continuous',
    automationLevel: 'high',
    complianceRequirements: ['ISO 27001 A.9', 'GDPR access controls', 'NIS2 access management'],
    riskRating: 'high',
    isActive: true,
    biaStatus: 'completed',
    bcpEnabled: true,
    bcpCriticality: 'critical',
    recoveryTimeObjectiveMinutes: 30,
    recoveryPointObjectiveMinutes: 15,
    maximumTolerableDowntimeMinutes: 120,
    minimumStaff: 2,
    operatingHours: { 'monday-friday': '07:00-19:00' },
    criticalRoles: ['IAM Administrator', 'IT Operations Lead'],
    requiredSkills: ['Identity management', 'Okta administration', 'Access control principles'],
    systemDependencies: ['Okta', 'Active Directory', 'ServiceNow', 'HR System'],
  },
  {
    name: 'Vulnerability Management',
    processCode: 'PROC-VUL-001',
    description: 'Continuous process for identifying, assessing, prioritizing, and remediating security vulnerabilities across infrastructure and applications.',
    processType: 'security',
    criticalityLevel: 'critical',
    inputs: ['Vulnerability scans', 'Threat intelligence', 'Penetration test results', 'Vendor advisories'],
    outputs: ['Vulnerability reports', 'Remediation tasks', 'Risk assessments', 'Compliance metrics'],
    keyActivities: ['Asset discovery', 'Vulnerability scanning', 'Risk prioritization', 'Remediation planning', 'Patch deployment', 'Verification', 'Reporting'],
    stakeholders: ['Security Team', 'System Administrators', 'Development Team', 'CISO'],
    kpis: [
      { name: 'Critical Vulnerability Remediation', target: '<48 hours', actual: '36 hours' },
      { name: 'High Vulnerability Remediation', target: '<7 days', actual: '5 days' },
      { name: 'Scan Coverage', target: '100%', actual: '98.5%' },
    ],
    cycleTimeHours: 168,
    frequency: 'weekly',
    automationLevel: 'high',
    complianceRequirements: ['ISO 27001 A.12.6', 'NIS2 vulnerability handling', 'SOC 2'],
    riskRating: 'high',
    isActive: true,
    biaStatus: 'completed',
    bcpEnabled: true,
    bcpCriticality: 'high',
    recoveryTimeObjectiveMinutes: 120,
    recoveryPointObjectiveMinutes: 60,
    maximumTolerableDowntimeMinutes: 480,
    minimumStaff: 2,
    operatingHours: { 'monday-friday': '08:00-18:00', 'on-call': '24/7' },
    criticalRoles: ['Security Engineer', 'Vulnerability Analyst'],
    requiredSkills: ['Vulnerability assessment', 'Risk analysis', 'Patch management'],
    systemDependencies: ['Qualys', 'Tenable', 'Patch management tools', 'CMDB'],
  },
  {
    name: 'Backup & Recovery',
    processCode: 'PROC-BCK-001',
    description: 'Process for backing up critical data and systems, and restoring them in case of data loss or system failure.',
    processType: 'operational',
    criticalityLevel: 'critical',
    inputs: ['Backup schedules', 'Data classification', 'Recovery requirements', 'Storage capacity'],
    outputs: ['Backup completion reports', 'Recovery test results', 'Compliance evidence'],
    keyActivities: ['Backup scheduling', 'Backup execution', 'Integrity verification', 'Offsite replication', 'Recovery testing', 'Retention management'],
    stakeholders: ['Data Center Operations', 'System Administrators', 'Customer Success'],
    kpis: [
      { name: 'Backup Success Rate', target: '99.9%', actual: '99.95%' },
      { name: 'Recovery Test Success', target: '100%', actual: '100%' },
      { name: 'RPO Compliance', target: '100%', actual: '99.8%' },
    ],
    cycleTimeHours: 24,
    frequency: 'daily',
    automationLevel: 'high',
    complianceRequirements: ['ISO 27001 A.12.3', 'Client SLAs', 'GDPR data protection'],
    riskRating: 'medium',
    isActive: true,
    biaStatus: 'completed',
    bcpEnabled: true,
    bcpCriticality: 'critical',
    recoveryTimeObjectiveMinutes: 60,
    recoveryPointObjectiveMinutes: 240,
    maximumTolerableDowntimeMinutes: 480,
    minimumStaff: 2,
    operatingHours: { 'all-days': '24/7' },
    criticalRoles: ['Backup Administrator', 'DC Operations Lead'],
    requiredSkills: ['Backup technologies', 'Storage management', 'DR procedures'],
    systemDependencies: ['Veeam', 'NetApp', 'Offsite replication', 'Tape library'],
  },
  {
    name: 'Customer Onboarding',
    processCode: 'PROC-ONB-001',
    description: 'End-to-end process for onboarding new customers, from contract signing to service activation and handover to BAU support.',
    processType: 'commercial',
    criticalityLevel: 'high',
    inputs: ['Signed contracts', 'Technical requirements', 'Customer data', 'Project timeline'],
    outputs: ['Provisioned services', 'Customer documentation', 'Access credentials', 'Go-live confirmation'],
    keyActivities: ['Kickoff meeting', 'Requirements gathering', 'Environment provisioning', 'Data migration', 'Testing', 'Training', 'Go-live', 'Handover'],
    stakeholders: ['Customer Success', 'Technical Teams', 'Sales', 'Customer'],
    kpis: [
      { name: 'Onboarding Duration', target: '<30 days', actual: '25 days' },
      { name: 'Customer Satisfaction', target: '>90%', actual: '92%' },
      { name: 'First-time-right Rate', target: '>95%', actual: '94%' },
    ],
    cycleTimeHours: 720,
    frequency: 'project-based',
    automationLevel: 'medium',
    complianceRequirements: ['GDPR data processing', 'Contract compliance'],
    riskRating: 'medium',
    isActive: true,
    biaStatus: 'completed',
    bcpEnabled: false,
    bcpCriticality: null,
    minimumStaff: 3,
    operatingHours: { 'monday-friday': '09:00-18:00' },
    criticalRoles: ['Project Manager', 'Technical Lead', 'Customer Success Manager'],
    requiredSkills: ['Project management', 'Technical implementation', 'Customer communication'],
    systemDependencies: ['CRM', 'Project management tools', 'Provisioning systems'],
  },
  {
    name: 'Security Monitoring',
    processCode: 'PROC-MON-001',
    description: '24/7 security monitoring process for detecting threats, anomalies, and security events across client and internal environments.',
    processType: 'security',
    criticalityLevel: 'critical',
    inputs: ['Log data', 'Network traffic', 'Endpoint telemetry', 'Threat intelligence'],
    outputs: ['Security alerts', 'Threat reports', 'Compliance dashboards', 'Detection metrics'],
    keyActivities: ['Log collection', 'Event correlation', 'Threat detection', 'Alert triage', 'Threat hunting', 'Reporting'],
    stakeholders: ['SOC Team', 'CISO', 'Customers'],
    kpis: [
      { name: 'Detection Coverage', target: '>95%', actual: '97%' },
      { name: 'False Positive Rate', target: '<5%', actual: '3.2%' },
      { name: 'Alert Response Time', target: '<15 min', actual: '10 min' },
    ],
    cycleTimeHours: null,
    frequency: 'continuous',
    automationLevel: 'high',
    complianceRequirements: ['NIS2 monitoring', 'ISO 27001 A.12.4', 'SOC 2'],
    riskRating: 'high',
    isActive: true,
    biaStatus: 'completed',
    bcpEnabled: true,
    bcpCriticality: 'critical',
    recoveryTimeObjectiveMinutes: 15,
    recoveryPointObjectiveMinutes: 5,
    maximumTolerableDowntimeMinutes: 30,
    minimumStaff: 6,
    operatingHours: { 'all-days': '24/7' },
    criticalRoles: ['SOC Manager', 'SOC Analyst', 'Threat Hunter'],
    requiredSkills: ['SIEM expertise', 'Threat analysis', 'Log analysis', 'Network forensics'],
    systemDependencies: ['Splunk SIEM', 'EDR platforms', 'Network sensors', 'Threat intel feeds'],
  },
  {
    name: 'Supplier Management',
    processCode: 'PROC-SUP-001',
    description: 'Process for managing relationships with third-party suppliers, including selection, contracting, performance monitoring, and risk assessment.',
    processType: 'governance',
    criticalityLevel: 'high',
    inputs: ['Procurement requests', 'Vendor assessments', 'Contract renewals', 'Performance data'],
    outputs: ['Approved vendors', 'Contracts', 'Risk assessments', 'Performance reports'],
    keyActivities: ['Vendor selection', 'Due diligence', 'Contract negotiation', 'Risk assessment', 'Performance monitoring', 'Review meetings'],
    stakeholders: ['Procurement', 'Security Team', 'Legal', 'Business Owners'],
    kpis: [
      { name: 'Vendor Risk Assessment Completion', target: '100%', actual: '95%' },
      { name: 'Contract Renewal on Time', target: '>90%', actual: '88%' },
      { name: 'Critical Vendor SLA Compliance', target: '>95%', actual: '96%' },
    ],
    cycleTimeHours: 480,
    frequency: 'continuous',
    automationLevel: 'low',
    complianceRequirements: ['ISO 27001 A.15', 'NIS2 supply chain security', 'GDPR processor requirements'],
    riskRating: 'medium',
    isActive: true,
    biaStatus: 'completed',
    bcpEnabled: false,
    bcpCriticality: null,
    minimumStaff: 1,
    operatingHours: { 'monday-friday': '09:00-17:30' },
    criticalRoles: ['Procurement Manager', 'Vendor Risk Analyst'],
    requiredSkills: ['Vendor management', 'Risk assessment', 'Contract negotiation'],
    systemDependencies: ['Vendor management system', 'Contract repository', 'Risk register'],
  },
];

// ============================================
// EXTERNAL DEPENDENCIES
// ============================================
export const externalDependencies = [
  {
    name: 'Amazon Web Services (AWS)',
    dependencyType: 'cloud_provider',
    description: 'Primary public cloud provider for IaaS services, used for customer workloads requiring public cloud deployment.',
    vendorWebsite: 'https://aws.amazon.com',
    criticalityLevel: 'critical',
    businessImpact: 'Service delivery for cloud-hosted customers would be severely impacted',
    singlePointOfFailure: false,
    contractReference: 'AWS-ENT-2024-001',
    contractStart: new Date('2024-01-01'),
    contractEnd: new Date('2026-12-31'),
    annualCost: 850000,
    paymentTerms: 'Monthly in arrears',
    slaDetails: { availability: '99.99%', responseTime: '1 hour', resolutionTime: 'varies by severity' },
    dataProcessed: ['Customer application data', 'System logs', 'Backup data'],
    dataLocation: 'EU (Frankfurt, Ireland)',
    complianceCertifications: ['ISO 27001', 'SOC 2 Type II', 'C5'],
    lastAssessmentDate: new Date('2024-06-15'),
    riskRating: 'low',
    primaryContact: 'AWS Enterprise Support',
    contactEmail: 'enterprise-support@amazon.com',
    alternativeProviders: ['Microsoft Azure', 'Google Cloud Platform'],
    exitStrategy: 'Multi-cloud architecture allows workload migration within 30 days',
    dataRecoveryProcedure: 'Cross-region replication and regular backup exports',
  },
  {
    name: 'Equinix',
    dependencyType: 'colocation_provider',
    description: 'Colocation provider for Frankfurt data center facility, providing physical space, power, and cooling.',
    vendorWebsite: 'https://www.equinix.com',
    criticalityLevel: 'critical',
    businessImpact: 'Complete service outage for all managed hosting customers',
    singlePointOfFailure: false,
    contractReference: 'EQX-NL-2023-456',
    contractStart: new Date('2023-04-01'),
    contractEnd: new Date('2028-03-31'),
    annualCost: 1200000,
    paymentTerms: 'Quarterly in advance',
    slaDetails: { availability: '99.9999%', responseTime: '15 minutes', resolutionTime: '4 hours' },
    dataProcessed: ['Physical access logs'],
    dataLocation: 'Germany (Frankfurt)',
    complianceCertifications: ['ISO 27001', 'SOC 2 Type II', 'EN 50600'],
    lastAssessmentDate: new Date('2024-03-20'),
    riskRating: 'low',
    primaryContact: 'Account Manager - Europe',
    contactEmail: 'support-emea@equinix.com',
    contactPhone: '+49 69 1234 0000',
    alternativeProviders: ['Interxion', 'NTT Global Data Centers'],
    exitStrategy: 'DR site in Amsterdam can assume primary role within 4 hours',
    dataRecoveryProcedure: 'N/A - Physical facility provider',
  },
  {
    name: 'Splunk',
    dependencyType: 'software_vendor',
    description: 'SIEM platform for security monitoring, log management, and threat detection.',
    vendorWebsite: 'https://www.splunk.com',
    criticalityLevel: 'critical',
    businessImpact: 'SOC operations severely degraded, security monitoring capability lost',
    singlePointOfFailure: true,
    contractReference: 'SPL-ENT-2024-789',
    contractStart: new Date('2024-01-15'),
    contractEnd: new Date('2027-01-14'),
    annualCost: 320000,
    paymentTerms: 'Annual in advance',
    slaDetails: { availability: '99.9%', responseTime: '2 hours', resolutionTime: '24 hours' },
    dataProcessed: ['Security logs', 'System events', 'Network flows'],
    dataLocation: 'EU (Germany)',
    complianceCertifications: ['ISO 27001', 'SOC 2 Type II', 'FedRAMP'],
    lastAssessmentDate: new Date('2024-02-28'),
    riskRating: 'medium',
    primaryContact: 'Technical Account Manager',
    contactEmail: 'support@splunk.com',
    alternativeProviders: ['Microsoft Sentinel', 'Elastic Security'],
    exitStrategy: 'Migration plan to alternative SIEM estimated at 6 months',
    dataRecoveryProcedure: 'Local backup of Splunk configurations and dashboards',
  },
  {
    name: 'Okta',
    dependencyType: 'software_vendor',
    description: 'Identity and access management platform for SSO, MFA, and user provisioning.',
    vendorWebsite: 'https://www.okta.com',
    criticalityLevel: 'critical',
    businessImpact: 'User authentication failure across all systems',
    singlePointOfFailure: true,
    contractReference: 'OKT-2023-321',
    contractStart: new Date('2023-07-01'),
    contractEnd: new Date('2026-06-30'),
    annualCost: 85000,
    paymentTerms: 'Annual in advance',
    slaDetails: { availability: '99.99%', responseTime: '1 hour', resolutionTime: 'varies' },
    dataProcessed: ['User identities', 'Authentication logs', 'Access policies'],
    dataLocation: 'EU (Germany, Ireland)',
    complianceCertifications: ['ISO 27001', 'SOC 2 Type II', 'GDPR compliant'],
    lastAssessmentDate: new Date('2024-05-10'),
    riskRating: 'medium',
    primaryContact: 'Customer Success Manager',
    contactEmail: 'support@okta.com',
    alternativeProviders: ['Microsoft Entra ID', 'Ping Identity'],
    exitStrategy: 'Fallback to local AD authentication possible within 2 hours',
    dataRecoveryProcedure: 'Regular export of user directory and configurations',
  },
  {
    name: 'KPN Business',
    dependencyType: 'connectivity_provider',
    description: 'Primary internet and MPLS connectivity provider for Amsterdam locations.',
    vendorWebsite: 'https://www.kpn.com/zakelijk',
    criticalityLevel: 'high',
    businessImpact: 'Amsterdam office connectivity loss, DR failover required',
    singlePointOfFailure: false,
    contractReference: 'KPN-BUS-2024-555',
    contractStart: new Date('2024-02-01'),
    contractEnd: new Date('2027-01-31'),
    annualCost: 48000,
    paymentTerms: 'Monthly in advance',
    slaDetails: { availability: '99.9%', responseTime: '4 hours', resolutionTime: '8 hours' },
    dataProcessed: ['Network traffic metadata'],
    dataLocation: 'Netherlands',
    complianceCertifications: ['ISO 27001'],
    lastAssessmentDate: new Date('2024-01-15'),
    riskRating: 'low',
    primaryContact: 'Business Support',
    contactEmail: 'zakelijk@kpn.com',
    contactPhone: '+31 88 123 4567',
    alternativeProviders: ['Tele2 Business', 'Eurofiber'],
    exitStrategy: 'Secondary ISP connection available for immediate failover',
    dataRecoveryProcedure: 'N/A - Network provider',
  },
  {
    name: 'ServiceNow',
    dependencyType: 'software_vendor',
    description: 'IT Service Management platform for ticketing, change management, and CMDB.',
    vendorWebsite: 'https://www.servicenow.com',
    criticalityLevel: 'high',
    businessImpact: 'ITSM processes degraded, manual workarounds required',
    singlePointOfFailure: false,
    contractReference: 'SNOW-2023-777',
    contractStart: new Date('2023-10-01'),
    contractEnd: new Date('2026-09-30'),
    annualCost: 145000,
    paymentTerms: 'Annual in advance',
    slaDetails: { availability: '99.8%', responseTime: '2 hours', resolutionTime: '24 hours' },
    dataProcessed: ['Ticket data', 'CMDB records', 'Change records'],
    dataLocation: 'EU (Netherlands)',
    complianceCertifications: ['ISO 27001', 'SOC 2 Type II'],
    lastAssessmentDate: new Date('2024-04-22'),
    riskRating: 'low',
    primaryContact: 'Technical Account Manager',
    contactEmail: 'support@servicenow.com',
    alternativeProviders: ['Jira Service Management', 'Freshservice'],
    exitStrategy: 'Email and phone-based support possible as interim measure',
    dataRecoveryProcedure: 'Regular data exports and API backup scripts',
  },
];

// ============================================
// INTERESTED PARTIES (ISO 27001 Clause 4.2)
// ============================================
export const interestedParties = [
  {
    partyCode: 'IP-CUST-001',
    name: 'Enterprise Customers',
    partyType: 'customer',
    description: 'Large enterprise clients using managed hosting and security services',
    expectations: 'Secure, reliable services with guaranteed uptime and data protection',
    requirements: 'SLA compliance, security certifications, GDPR compliance, incident response',
    informationNeeds: ['Service availability reports', 'Security posture updates', 'Compliance certificates', 'Incident notifications'],
    powerLevel: 'high',
    interestLevel: 'high',
    influenceLevel: 'high',
    engagementStrategy: 'Partnership approach with dedicated account management',
    communicationMethod: 'Regular review meetings, portal access, email',
    communicationFrequency: 'Monthly reviews, real-time for incidents',
    primaryContact: 'Customer Success Team',
    contactEmail: 'customer-success@nexusguard.eu',
    ismsRelevance: 'Primary stakeholder - service delivery depends on effective ISMS',
    securityExpectations: 'ISO 27001 certification, SOC 2 reports, penetration testing, vulnerability management',
    isActive: true,
  },
  {
    partyCode: 'IP-REG-001',
    name: 'Dutch Data Protection Authority (AP)',
    partyType: 'regulator',
    description: 'National data protection supervisory authority for GDPR compliance',
    expectations: 'Compliance with GDPR, timely breach notifications, cooperation with inquiries',
    requirements: 'GDPR compliance, DPO appointment, breach notification within 72 hours',
    informationNeeds: ['Data processing activities', 'Security measures', 'Breach reports'],
    powerLevel: 'high',
    interestLevel: 'medium',
    influenceLevel: 'high',
    engagementStrategy: 'Proactive compliance, transparent communication',
    communicationMethod: 'Formal correspondence, online portal',
    communicationFrequency: 'As required, annual registration updates',
    primaryContact: 'DPO',
    contactEmail: 'dpo@nexusguard.eu',
    ismsRelevance: 'Regulatory compliance is core ISMS objective',
    securityExpectations: 'Appropriate technical and organizational measures per GDPR Article 32',
    isActive: true,
  },
  {
    partyCode: 'IP-REG-002',
    name: 'Rijksinspectie Digitale Infrastructuur (RDI)',
    partyType: 'regulator',
    description: 'Dutch supervisory authority for NIS2 compliance',
    expectations: 'NIS2 compliance, incident reporting, security measures',
    requirements: 'NIS2 risk management, incident reporting within 24/72 hours, security policies',
    informationNeeds: ['Security posture', 'Incident reports', 'Risk assessments'],
    powerLevel: 'high',
    interestLevel: 'high',
    influenceLevel: 'high',
    engagementStrategy: 'Full compliance, proactive engagement',
    communicationMethod: 'Formal channels, designated contact point',
    communicationFrequency: 'Annual registration, incident-driven',
    primaryContact: 'CISO',
    contactEmail: 'ciso@nexusguard.eu',
    ismsRelevance: 'NIS2 compliance integrated into ISMS',
    securityExpectations: 'State-of-the-art security measures, supply chain security, business continuity',
    isActive: true,
  },
  {
    partyCode: 'IP-EMP-001',
    name: 'Employees',
    partyType: 'internal',
    description: 'All NexusGuard employees across all locations',
    expectations: 'Safe working environment, clear policies, job security',
    requirements: 'Security awareness training, clear security policies, reporting mechanisms',
    informationNeeds: ['Security policies', 'Training materials', 'Incident reporting procedures'],
    powerLevel: 'medium',
    interestLevel: 'high',
    influenceLevel: 'medium',
    engagementStrategy: 'Regular communication, training, feedback channels',
    communicationMethod: 'Intranet, email, team meetings',
    communicationFrequency: 'Continuous, monthly updates',
    primaryContact: 'HR Department',
    contactEmail: 'hr@nexusguard.eu',
    ismsRelevance: 'Employees are key to ISMS success - human element',
    securityExpectations: 'Training, clear guidelines, tools to work securely',
    isActive: true,
  },
  {
    partyCode: 'IP-PART-001',
    name: 'Technology Partners',
    partyType: 'partner',
    description: 'Strategic technology partners and resellers',
    expectations: 'Reliable partnership, technical excellence, security standards',
    requirements: 'Security certifications, technical competence, confidentiality',
    informationNeeds: ['Partnership terms', 'Technical documentation', 'Security posture'],
    powerLevel: 'medium',
    interestLevel: 'medium',
    influenceLevel: 'medium',
    engagementStrategy: 'Strategic partnership with regular alignment',
    communicationMethod: 'Partner portal, email, quarterly reviews',
    communicationFrequency: 'Quarterly reviews, as-needed basis',
    primaryContact: 'Partner Management',
    contactEmail: 'partners@nexusguard.eu',
    ismsRelevance: 'Partners may access systems, security requirements apply',
    securityExpectations: 'NDA compliance, security questionnaire completion',
    isActive: true,
  },
  {
    partyCode: 'IP-SHARE-001',
    name: 'Shareholders & Board',
    partyType: 'internal',
    description: 'Company shareholders and board of directors',
    expectations: 'Business growth, risk management, governance',
    requirements: 'Risk reporting, compliance assurance, strategic alignment',
    informationNeeds: ['Risk reports', 'Compliance status', 'Security investments'],
    powerLevel: 'high',
    interestLevel: 'high',
    influenceLevel: 'high',
    engagementStrategy: 'Regular board reporting, strategic consultation',
    communicationMethod: 'Board meetings, executive reports',
    communicationFrequency: 'Quarterly board meetings',
    primaryContact: 'CEO',
    contactEmail: 'ceo@nexusguard.eu',
    ismsRelevance: 'ISMS provides assurance on security and compliance risks',
    securityExpectations: 'Adequate security investment, certification achievement',
    isActive: true,
  },
];

// ============================================
// CONTEXT ISSUES (ISO 27001 Clause 4.1)
// ============================================
export const contextIssues = [
  {
    issueCode: 'CTX-EXT-001',
    issueType: 'external',
    category: 'regulatory',
    title: 'NIS2 Directive Implementation',
    description: 'The NIS2 Directive requires enhanced security measures, incident reporting, and supply chain risk management for digital infrastructure providers.',
    impactType: 'compliance',
    impactLevel: 'high',
    likelihood: 'certain',
    ismsRelevance: 'Direct impact on ISMS scope and controls',
    affectedAreas: ['Security Operations', 'Incident Management', 'Supply Chain', 'Risk Management'],
    controlImplications: 'Requires enhanced incident reporting, supply chain security assessment, and management accountability',
    responseStrategy: 'Proactive compliance program with gap assessment and remediation plan',
    mitigationActions: ['Complete NIS2 gap assessment', 'Implement enhanced incident reporting', 'Assess critical suppliers', 'Train management on obligations'],
    monitoringFrequency: 'monthly',
    lastReviewDate: new Date('2024-10-15'),
    nextReviewDate: new Date('2025-01-15'),
    trendDirection: 'increasing',
    status: 'active',
    isActive: true,
    escalatedToRisk: true,
  },
  {
    issueCode: 'CTX-EXT-002',
    issueType: 'external',
    category: 'threat_landscape',
    title: 'Evolving Cyber Threat Landscape',
    description: 'Increasing sophistication of cyber attacks, including ransomware, supply chain attacks, and nation-state threats targeting critical infrastructure.',
    impactType: 'security',
    impactLevel: 'high',
    likelihood: 'likely',
    ismsRelevance: 'Drives continuous improvement of security controls',
    affectedAreas: ['SOC', 'Network Operations', 'Vulnerability Management', 'All customer services'],
    controlImplications: 'Requires advanced threat detection, zero trust architecture, and improved resilience',
    responseStrategy: 'Continuous security improvement with threat intelligence integration',
    mitigationActions: ['Enhance threat intelligence capabilities', 'Implement zero trust principles', 'Increase security monitoring coverage', 'Regular red team exercises'],
    monitoringFrequency: 'weekly',
    lastReviewDate: new Date('2024-11-01'),
    nextReviewDate: new Date('2025-02-01'),
    trendDirection: 'increasing',
    status: 'active',
    isActive: true,
    escalatedToRisk: true,
  },
  {
    issueCode: 'CTX-EXT-003',
    issueType: 'external',
    category: 'market',
    title: 'Customer Security Requirements',
    description: 'Enterprise customers increasingly requiring ISO 27001, SOC 2, and NIS2 compliance as prerequisites for doing business.',
    impactType: 'business',
    impactLevel: 'high',
    likelihood: 'certain',
    ismsRelevance: 'Primary driver for ISMS implementation',
    affectedAreas: ['Sales', 'Customer Success', 'All service delivery departments'],
    controlImplications: 'Must achieve and maintain certifications to remain competitive',
    responseStrategy: 'Achieve ISO 27001 certification and expand SOC 2 coverage',
    mitigationActions: ['Complete ISO 27001 implementation', 'Maintain SOC 2 Type II', 'Develop compliance evidence library'],
    monitoringFrequency: 'monthly',
    lastReviewDate: new Date('2024-10-01'),
    nextReviewDate: new Date('2025-01-01'),
    trendDirection: 'stable',
    status: 'active',
    isActive: true,
    escalatedToRisk: false,
  },
  {
    issueCode: 'CTX-INT-001',
    issueType: 'internal',
    category: 'organizational',
    title: 'Rapid Growth and Scaling',
    description: 'Company growth from 250 to 350 employees in 2 years, creating challenges in maintaining security culture and consistent controls.',
    impactType: 'operational',
    impactLevel: 'medium',
    likelihood: 'certain',
    ismsRelevance: 'Growth must not compromise security posture',
    affectedAreas: ['HR', 'IT Operations', 'All departments'],
    controlImplications: 'Need scalable security processes and enhanced onboarding',
    responseStrategy: 'Security-first approach to scaling with automation',
    mitigationActions: ['Automate security onboarding', 'Scale security awareness program', 'Implement security champions network'],
    monitoringFrequency: 'quarterly',
    lastReviewDate: new Date('2024-09-15'),
    nextReviewDate: new Date('2024-12-15'),
    trendDirection: 'stable',
    status: 'active',
    isActive: true,
    escalatedToRisk: false,
  },
  {
    issueCode: 'CTX-INT-002',
    issueType: 'internal',
    category: 'technical',
    title: 'Technical Debt in Legacy Systems',
    description: 'Some legacy systems and tools have accumulated technical debt, making security updates and compliance more challenging.',
    impactType: 'security',
    impactLevel: 'medium',
    likelihood: 'likely',
    ismsRelevance: 'Legacy systems may have security gaps',
    affectedAreas: ['IT Operations', 'Software Development', 'Data Center Operations'],
    controlImplications: 'Need modernization roadmap and compensating controls',
    responseStrategy: 'Phased modernization with risk-based prioritization',
    mitigationActions: ['Inventory legacy systems', 'Prioritize modernization based on risk', 'Implement compensating controls', 'Plan migration projects'],
    monitoringFrequency: 'quarterly',
    lastReviewDate: new Date('2024-08-20'),
    nextReviewDate: new Date('2024-11-20'),
    trendDirection: 'improving',
    status: 'active',
    isActive: true,
    escalatedToRisk: true,
  },
  {
    issueCode: 'CTX-EXT-004',
    issueType: 'external',
    category: 'economic',
    title: 'IT Talent Shortage',
    description: 'Competitive market for cybersecurity and IT professionals in the Netherlands and EU, making recruitment and retention challenging.',
    impactType: 'operational',
    impactLevel: 'medium',
    likelihood: 'likely',
    ismsRelevance: 'Staffing affects security operation capabilities',
    affectedAreas: ['SOC', 'Information Security', 'Network Operations'],
    controlImplications: 'Need retention strategies and skills development',
    responseStrategy: 'Invest in employee development and competitive compensation',
    mitigationActions: ['Competitive compensation review', 'Training and certification programs', 'Career development paths', 'Flexible working policies'],
    monitoringFrequency: 'quarterly',
    lastReviewDate: new Date('2024-07-15'),
    nextReviewDate: new Date('2024-10-15'),
    trendDirection: 'stable',
    status: 'active',
    isActive: true,
    escalatedToRisk: false,
  },
];

// ============================================
// APPLICABLE FRAMEWORKS
// ============================================
export const applicableFrameworks = [
  {
    frameworkCode: 'FW-ISO27001',
    name: 'ISO/IEC 27001:2022',
    frameworkType: 'certification',
    description: 'International standard for information security management systems',
    version: '2022',
    isApplicable: true,
    applicabilityReason: 'Required by customers and forms the foundation of our security program',
    applicabilityDate: new Date('2024-01-01'),
    complianceStatus: 'in_progress',
    compliancePercentage: 65,
    lastAssessmentDate: new Date('2024-09-15'),
    nextAssessmentDate: new Date('2025-03-15'),
    isCertifiable: true,
    certificationStatus: 'planning',
    keyRequirements: ['ISMS establishment', 'Risk assessment', 'Statement of Applicability', 'Internal audit', 'Management review'],
    notes: 'Gap assessment completed. Implementation in progress. Target certification Q4 2025.',
  },
  {
    frameworkCode: 'FW-NIS2',
    name: 'NIS2 Directive',
    frameworkType: 'regulation',
    description: 'EU directive on security of network and information systems',
    version: '2022/2555',
    isApplicable: true,
    applicabilityReason: 'Digital infrastructure provider classified as Important Entity under NIS2',
    applicabilityDate: new Date('2024-10-17'),
    complianceStatus: 'in_progress',
    compliancePercentage: 55,
    lastAssessmentDate: new Date('2024-10-01'),
    nextAssessmentDate: new Date('2025-04-01'),
    supervisoryAuthority: 'Rijksinspectie Digitale Infrastructuur (RDI)',
    authorityContact: 'nis2@rdi.nl',
    isCertifiable: false,
    keyRequirements: ['Risk management measures', 'Incident handling', 'Business continuity', 'Supply chain security', 'Vulnerability disclosure'],
    notes: 'NIS2 transposition into Dutch law effective October 2024. Compliance program underway.',
  },
  {
    frameworkCode: 'FW-GDPR',
    name: 'General Data Protection Regulation',
    frameworkType: 'regulation',
    description: 'EU regulation on data protection and privacy',
    version: '2016/679',
    isApplicable: true,
    applicabilityReason: 'Process personal data of EU individuals as both controller and processor',
    applicabilityDate: new Date('2018-05-25'),
    complianceStatus: 'compliant',
    compliancePercentage: 92,
    lastAssessmentDate: new Date('2024-06-01'),
    nextAssessmentDate: new Date('2025-06-01'),
    supervisoryAuthority: 'Autoriteit Persoonsgegevens',
    authorityContact: 'info@autoriteitpersoonsgegevens.nl',
    isCertifiable: false,
    keyRequirements: ['Lawful processing', 'Data subject rights', 'Security measures', 'DPO appointment', 'Breach notification'],
    notes: 'DPO appointed. ROPA maintained. Annual DPIA reviews conducted.',
  },
  {
    frameworkCode: 'FW-SOC2',
    name: 'SOC 2 Type II',
    frameworkType: 'attestation',
    description: 'AICPA attestation for service organization controls',
    version: '2017',
    isApplicable: true,
    applicabilityReason: 'Customer requirement for managed services assurance',
    applicabilityDate: new Date('2020-01-01'),
    complianceStatus: 'compliant',
    compliancePercentage: 100,
    lastAssessmentDate: new Date('2024-08-15'),
    nextAssessmentDate: new Date('2025-08-15'),
    isCertifiable: true,
    certificationStatus: 'certified',
    certificationBody: 'Deloitte',
    certificateNumber: 'SOC2-2024-NXG-001',
    certificationDate: new Date('2024-09-01'),
    certificationExpiry: new Date('2025-08-31'),
    keyRequirements: ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy'],
    notes: 'Annual SOC 2 Type II report issued. Covers Security and Availability trust principles.',
  },
];

// ============================================
// REGULATORS
// ============================================
export const regulators = [
  {
    name: 'Autoriteit Persoonsgegevens',
    acronym: 'AP',
    regulatorType: 'data_protection',
    jurisdiction: 'Netherlands',
    jurisdictionLevel: 'national',
    description: 'Dutch Data Protection Authority responsible for GDPR enforcement',
    website: 'https://autoriteitpersoonsgegevens.nl',
    contactEmail: 'info@autoriteitpersoonsgegevens.nl',
    contactPhone: '+31 88 1805 250',
    contactAddress: 'Bezuidenhoutseweg 30, 2594 AV Den Haag',
    keyRegulations: ['GDPR', 'Dutch GDPR Implementation Act (UAVG)'],
    registrationStatus: 'registered',
    registrationNumber: 'FG-12345',
    registrationDate: new Date('2018-05-25'),
    reportingFrequency: 'as-required',
    isActive: true,
  },
  {
    name: 'Rijksinspectie Digitale Infrastructuur',
    acronym: 'RDI',
    regulatorType: 'cybersecurity',
    jurisdiction: 'Netherlands',
    jurisdictionLevel: 'national',
    description: 'Dutch supervisory authority for NIS2 and telecommunications',
    website: 'https://www.rdi.nl',
    contactEmail: 'info@rdi.nl',
    contactPhone: '+31 70 889 0200',
    contactAddress: 'Koningskade 4, 2596 AA Den Haag',
    keyRegulations: ['NIS2 Directive', 'Telecommunications Act'],
    registrationStatus: 'pending',
    reportingFrequency: 'incident-driven',
    isActive: true,
  },
  {
    name: 'Bundesamt für Sicherheit in der Informationstechnik',
    acronym: 'BSI',
    regulatorType: 'cybersecurity',
    jurisdiction: 'Germany',
    jurisdictionLevel: 'national',
    description: 'German Federal Office for Information Security',
    website: 'https://www.bsi.bund.de',
    contactEmail: 'bsi@bsi.bund.de',
    contactPhone: '+49 228 99 9582 0',
    contactAddress: 'Godesberger Allee 185-189, 53175 Bonn',
    keyRegulations: ['BSI Act', 'IT Security Act 2.0', 'NIS2 (German implementation)'],
    registrationStatus: 'not_required',
    reportingFrequency: 'incident-driven',
    complianceNotes: 'Relevant for Frankfurt data center operations. Monitor German NIS2 implementation.',
    isActive: true,
  },
];

// ============================================
// SECURITY COMMITTEES
// ============================================
export const securityCommittees = [
  {
    name: 'ISMS Steering Committee',
    committeeType: 'steering',
    description: 'Executive committee responsible for ISMS governance, strategic direction, and resource allocation for information security.',
    authorityLevel: 'strategic',
    meetingFrequency: 'monthly',
    establishedDate: new Date('2024-01-15'),
    isActive: true,
  },
  {
    name: 'Risk Management Committee',
    committeeType: 'risk',
    description: 'Committee responsible for enterprise risk oversight, including security, compliance, and operational risks.',
    authorityLevel: 'tactical',
    meetingFrequency: 'monthly',
    establishedDate: new Date('2020-03-01'),
    isActive: true,
  },
  {
    name: 'Change Advisory Board',
    committeeType: 'operational',
    description: 'Technical committee for reviewing and approving changes to production systems.',
    authorityLevel: 'operational',
    meetingFrequency: 'weekly',
    establishedDate: new Date('2016-06-01'),
    isActive: true,
  },
  {
    name: 'Incident Response Team',
    committeeType: 'incident',
    description: 'Cross-functional team activated for major security or operational incidents.',
    authorityLevel: 'operational',
    meetingFrequency: 'as-needed',
    establishedDate: new Date('2017-01-15'),
    isActive: true,
  },
];

// ============================================
// SECURITY CHAMPIONS
// ============================================
export const securityChampions = [
  {
    userName: 'Lucas Meyer',
    departmentCode: 'DEPT-ITOPS',
    championLevel: 'level_2',
    responsibilities: 'Promote security best practices in IT Operations. Assist with vulnerability remediation.',
    startDate: new Date('2023-01-15'),
  },
  {
    userName: 'Sarah Murphy',
    departmentCode: 'DEPT-DEV',
    championLevel: 'level_3',
    responsibilities: 'Lead secure coding initiatives. Review PRs for security issues. Mentor junior developers.',
    startDate: new Date('2022-06-01'),
  },
  {
    userName: 'Ana Garcia',
    departmentCode: 'DEPT-SOC',
    championLevel: 'level_3',
    responsibilities: 'Bridge gap between SOC and engineering. Improve threat detection rules.',
    startDate: new Date('2023-03-01'),
  },
];

// ============================================
// COMMITTEE MEETINGS
// ============================================
export const committeeMeetings = [
  {
    committeeName: 'ISMS Steering Committee',
    title: 'Q1 2024 Strategic Review',
    meetingDate: new Date('2024-03-15T10:00:00Z'),
    startTime: '10:00',
    durationMinutes: 90,
    status: 'completed',
    agenda: '1. ISMS Performance Review\n2. Risk Assessment Results\n3. Resource Allocation\n4. Certification Roadmap',
    minutes: 'Meeting held to review Q1 performance. Risk assessment approved. Budget increased for SOC expansion.',
    attendees: ['martijn.devries@nexusguard.eu', 'jan.bakker@nexusguard.eu', 'thomas.muller@nexusguard.eu', 'eva.lindberg@nexusguard.eu'],
    actionItems: [
      { title: 'Draft updated ISMS Scope Document', assignedTo: 'jan.bakker@nexusguard.eu', description: 'Update scope to include Dublin', dueDate: new Date('2024-04-01') },
    ],
    decisions: [
      {
        title: 'Approve ISO 27001 Scope Statement',
        description: 'The committee approved the updated ISMS scope statement v2.1 including the new Dublin Operations Center.',
        decisionType: 'strategic',
        voteType: 'unanimous',
        votesFor: 5,
        implemented: true,
      },
      {
        title: 'Approve Q2 Security Budget',
        description: 'Approved 15% budget increase for Q2 to cover new SIEM licensing costs.',
        decisionType: 'financial',
        voteType: 'majority',
        votesFor: 4,
        votesAgainst: 1,
        implemented: true,
      },
    ],
  },
  {
    committeeName: 'Risk Management Committee',
    title: 'February Risk Assessment Review',
    meetingDate: new Date('2024-02-20T14:00:00Z'),
    startTime: '14:00',
    durationMinutes: 60,
    status: 'completed',
    agenda: '1. Review High Risks\n2. Risk Treatment Plans\n3. Emerging Threats',
    attendees: ['jan.bakker@nexusguard.eu', 'lisa.huber@nexusguard.eu', 'anna.schmidt@nexusguard.eu', 'nina.petrova@nexusguard.eu'],
    actionItems: [
      { title: 'Present Q1 Risk Report', assignedTo: 'lisa.huber@nexusguard.eu', description: 'Prepare dashboard', dueDate: new Date('2024-03-01') },
    ],
    decisions: [
      {
        title: 'Accept Risk R-001 (Legacy System)',
        description: 'Accepted residual risk for Legacy CRM system until planned migration in Q4.',
        decisionType: 'risk_acceptance',
        voteType: 'consensus',
        votesFor: 6,
        implemented: true,
      },
    ],
  },
  {
    committeeName: 'Change Advisory Board',
    title: 'Weekly CAB',
    meetingDate: new Date(new Date().setDate(new Date().getDate() + 2)), // Future date
    startTime: '09:00',
    durationMinutes: 45,
    status: 'scheduled',
    agenda: '1. Review RFCs\n2. Post-Implementation Reviews',
    decisions: [],
  },
];

// ============================================
// KEY PERSONNEL
// ============================================
export const keyPersonnel = [
  {
    personCode: 'KP-CISO-001',
    name: 'Jan Bakker',
    jobTitle: 'Chief Information Security Officer',
    email: 'jan.bakker@nexusguard.eu',
    phone: '+31 6 1234 5678',
    ismsRole: 'ISMS Manager',
    securityResponsibilities: 'Overall responsibility for ISMS, security strategy, risk management, and compliance',
    authorityLevel: 'executive',
    trainingCompleted: true,
    lastTrainingDate: new Date('2024-09-01'),
    certifications: ['CISSP', 'CISM', 'ISO 27001 Lead Auditor'],
    isActive: true,
    startDate: new Date('2019-03-15'),
  },
  {
    personCode: 'KP-DPO-001',
    name: 'Sophie van der Berg',
    jobTitle: 'Data Protection Officer',
    email: 'sophie.vanderberg@nexusguard.eu',
    phone: '+31 6 2345 6789',
    ismsRole: 'DPO',
    securityResponsibilities: 'GDPR compliance, data protection advice, DPA liaison, DSAR handling',
    authorityLevel: 'advisory',
    trainingCompleted: true,
    lastTrainingDate: new Date('2024-06-15'),
    certifications: ['CIPP/E', 'CIPM', 'FIP'],
    isActive: true,
    startDate: new Date('2018-05-01'),
  },
  {
    personCode: 'KP-RISKM-001',
    name: 'Lisa Huber',
    jobTitle: 'Risk Manager',
    email: 'lisa.huber@nexusguard.eu',
    phone: '+31 6 3456 7890',
    ismsRole: 'Risk Manager',
    securityResponsibilities: 'Enterprise risk management, risk assessments, risk reporting',
    authorityLevel: 'tactical',
    trainingCompleted: true,
    lastTrainingDate: new Date('2024-07-20'),
    certifications: ['CRISC', 'ISO 31000 Practitioner'],
    isActive: true,
    startDate: new Date('2021-02-01'),
  },
  {
    personCode: 'KP-COMP-001',
    name: 'Peter Janssen',
    jobTitle: 'Compliance Manager',
    email: 'peter.janssen@nexusguard.eu',
    phone: '+31 6 4567 8901',
    ismsRole: 'Compliance Manager',
    securityResponsibilities: 'Regulatory compliance, audit coordination, policy management',
    authorityLevel: 'tactical',
    trainingCompleted: true,
    lastTrainingDate: new Date('2024-08-10'),
    certifications: ['CCEP', 'ISO 27001 Lead Implementer'],
    isActive: true,
    startDate: new Date('2020-09-01'),
  },
  {
    personCode: 'KP-SOCM-001',
    name: 'Karin Andersson',
    jobTitle: 'SOC Manager',
    email: 'karin.andersson@nexusguard.eu',
    phone: '+31 6 5678 9012',
    ismsRole: 'Security Operations Manager',
    securityResponsibilities: '24/7 security monitoring, incident response, threat detection',
    authorityLevel: 'operational',
    trainingCompleted: true,
    lastTrainingDate: new Date('2024-10-01'),
    certifications: ['GSOM', 'GCIH', 'GCIA'],
    isActive: true,
    startDate: new Date('2018-01-15'),
  },
];

// ============================================
// EXECUTIVE POSITIONS
// ============================================
export const executivePositions = [
  {
    title: 'Chief Executive Officer',
    executiveLevel: 'c-level',
    authorityLevel: 'full',
    securityResponsibilities: 'Ultimate accountability for information security. Ensures adequate resources for ISMS. Reports to Board on security matters.',
    riskAuthorityLevel: 'approve',
    budgetAuthority: true,
    isActive: true,
    isCeo: true,
    isSecurityCommitteeMember: true,
    startDate: new Date('2012-03-15'),
  },
  {
    title: 'Chief Financial Officer',
    executiveLevel: 'c-level',
    authorityLevel: 'functional',
    securityResponsibilities: 'Security budget oversight. Financial risk assessment. Fraud prevention controls.',
    riskAuthorityLevel: 'recommend',
    budgetAuthority: true,
    isActive: true,
    isCeo: false,
    isSecurityCommitteeMember: true,
    startDate: new Date('2014-06-01'),
  },
  {
    title: 'Chief Technology Officer',
    executiveLevel: 'c-level',
    authorityLevel: 'functional',
    securityResponsibilities: 'Technical security architecture. Technology risk management. Secure development practices.',
    riskAuthorityLevel: 'approve',
    budgetAuthority: true,
    isActive: true,
    isCeo: false,
    isSecurityCommitteeMember: true,
    startDate: new Date('2013-09-15'),
  },
  {
    title: 'Chief Operating Officer',
    executiveLevel: 'c-level',
    authorityLevel: 'functional',
    securityResponsibilities: 'Operational security. Business continuity. Physical security oversight.',
    riskAuthorityLevel: 'approve',
    budgetAuthority: true,
    isActive: true,
    isCeo: false,
    isSecurityCommitteeMember: true,
    startDate: new Date('2016-02-01'),
  },
  {
    title: 'Chief Information Security Officer',
    executiveLevel: 'senior',
    authorityLevel: 'functional',
    securityResponsibilities: 'ISMS ownership. Security strategy. Compliance oversight. Risk management. Incident response.',
    riskAuthorityLevel: 'approve',
    budgetAuthority: true,
    isActive: true,
    isCeo: false,
    isSecurityCommitteeMember: true,
    startDate: new Date('2019-03-15'),
  },
];

// ============================================
// PRODUCTS & SERVICES
// ============================================
export const productsServices = [
  {
    productCode: 'SVC-MH-001',
    name: 'Managed Hosting',
    productType: 'service',
    description: 'Fully managed dedicated and virtual server hosting with 24/7 support, monitoring, and maintenance.',
    category: 'infrastructure',
    customerFacing: true,
    internalOnly: false,
    revenueContribution: '35%',
    pricingModel: 'monthly_subscription',
    targetMarket: 'Enterprise',
    lifecycleStage: 'mature',
    launchDate: new Date('2014-01-01'),
    dataClassification: 'confidential',
    containsPersonalData: true,
    containsSensitiveData: true,
    complianceRequirements: ['ISO 27001', 'SOC 2', 'GDPR'],
    inIsmsScope: true,
    scopeJustification: 'Core revenue-generating service handling customer data',
    isActive: true,
  },
  {
    productCode: 'SVC-MSSP-001',
    name: 'Managed Security Services',
    productType: 'service',
    description: '24/7 security monitoring, threat detection, incident response, and vulnerability management services.',
    category: 'security',
    customerFacing: true,
    internalOnly: false,
    revenueContribution: '28%',
    pricingModel: 'tiered_subscription',
    targetMarket: 'Enterprise',
    lifecycleStage: 'growth',
    launchDate: new Date('2017-06-01'),
    dataClassification: 'confidential',
    containsPersonalData: true,
    containsSensitiveData: true,
    complianceRequirements: ['ISO 27001', 'SOC 2', 'NIS2'],
    inIsmsScope: true,
    scopeJustification: 'Security-critical service with access to customer security data',
    isActive: true,
  },
  {
    productCode: 'SVC-CLOUD-001',
    name: 'Cloud Infrastructure (IaaS)',
    productType: 'service',
    description: 'Scalable cloud computing resources including virtual machines, storage, and networking.',
    category: 'infrastructure',
    customerFacing: true,
    internalOnly: false,
    revenueContribution: '22%',
    pricingModel: 'usage_based',
    targetMarket: 'Enterprise & Mid-Market',
    lifecycleStage: 'growth',
    launchDate: new Date('2019-03-01'),
    dataClassification: 'confidential',
    containsPersonalData: true,
    containsSensitiveData: true,
    complianceRequirements: ['ISO 27001', 'SOC 2', 'GDPR'],
    inIsmsScope: true,
    scopeJustification: 'Cloud platform hosting customer workloads and data',
    isActive: true,
  },
  {
    productCode: 'SVC-BDR-001',
    name: 'Backup & Disaster Recovery',
    productType: 'service',
    description: 'Enterprise backup solutions with offsite replication and disaster recovery capabilities.',
    category: 'infrastructure',
    customerFacing: true,
    internalOnly: false,
    revenueContribution: '10%',
    pricingModel: 'capacity_based',
    targetMarket: 'Enterprise',
    lifecycleStage: 'mature',
    launchDate: new Date('2015-09-01'),
    dataClassification: 'confidential',
    containsPersonalData: true,
    containsSensitiveData: true,
    complianceRequirements: ['ISO 27001', 'SOC 2'],
    inIsmsScope: true,
    scopeJustification: 'Handles customer backup data requiring protection',
    isActive: true,
  },
  {
    productCode: 'SVC-PS-001',
    name: 'Professional Services',
    productType: 'service',
    description: 'Consulting, implementation, and migration services for infrastructure projects.',
    category: 'consulting',
    customerFacing: true,
    internalOnly: false,
    revenueContribution: '5%',
    pricingModel: 'time_and_materials',
    targetMarket: 'Enterprise',
    lifecycleStage: 'mature',
    launchDate: new Date('2014-06-01'),
    dataClassification: 'internal',
    containsPersonalData: false,
    containsSensitiveData: false,
    complianceRequirements: ['GDPR'],
    inIsmsScope: false,
    scopeJustification: 'Advisory services with limited system access',
    isActive: true,
  },
];

// ============================================
// TECHNOLOGY PLATFORMS
// ============================================
export const technologyPlatforms = [
  {
    platformCode: 'PLAT-VMWARE-001',
    name: 'VMware vSphere',
    platformType: 'virtualization',
    description: 'Enterprise virtualization platform for managed hosting and cloud services',
    vendor: 'VMware (Broadcom)',
    vendorWebsite: 'https://www.vmware.com',
    licenseType: 'enterprise',
    hostingLocation: 'Frankfurt Data Center',
    deploymentModel: 'on-premises',
    version: '8.0 U2',
    architecture: 'Clustered vCenter with HA',
    integrations: ['vRealize Operations', 'NSX-T', 'vSAN'],
    dataStorageLocation: 'Germany',
    criticalityLevel: 'critical',
    businessImpact: 'Service outage for all hosted customers',
    riskRating: 'medium',
    implementationDate: new Date('2015-01-15'),
    lastUpgradeDate: new Date('2024-06-01'),
    nextUpgradeDate: new Date('2025-06-01'),
    complianceCertifications: ['SOC 2', 'ISO 27001'],
    dataClassification: 'confidential',
    inIsmsScope: true,
    scopeJustification: 'Core platform for service delivery',
    isActive: true,
  },
  {
    platformCode: 'PLAT-K8S-001',
    name: 'Kubernetes Platform',
    platformType: 'container_orchestration',
    description: 'Container orchestration platform for modern application workloads',
    vendor: 'Open Source (CNCF)',
    licenseType: 'open_source',
    hostingLocation: 'Frankfurt Data Center',
    deploymentModel: 'on-premises',
    version: '1.29',
    architecture: 'Multi-cluster with Rancher management',
    integrations: ['Harbor Registry', 'Prometheus', 'Grafana', 'Istio'],
    dataStorageLocation: 'Germany',
    criticalityLevel: 'high',
    businessImpact: 'Container workload disruption',
    riskRating: 'medium',
    implementationDate: new Date('2021-03-01'),
    lastUpgradeDate: new Date('2024-09-15'),
    nextUpgradeDate: new Date('2025-03-15'),
    complianceCertifications: ['CIS Benchmark compliant'],
    dataClassification: 'confidential',
    inIsmsScope: true,
    scopeJustification: 'Hosts customer container workloads',
    isActive: true,
  },
  {
    platformCode: 'PLAT-SIEM-001',
    name: 'Splunk Enterprise Security',
    platformType: 'siem',
    description: 'Security information and event management platform for SOC operations',
    vendor: 'Splunk (Cisco)',
    vendorWebsite: 'https://www.splunk.com',
    licenseType: 'enterprise',
    hostingLocation: 'Amsterdam HQ',
    cloudProvider: null,
    deploymentModel: 'on-premises',
    version: '9.1',
    architecture: 'Distributed deployment with search head cluster',
    integrations: ['SOAR', 'Threat Intelligence feeds', 'EDR platforms'],
    dataStorageLocation: 'Netherlands',
    criticalityLevel: 'critical',
    businessImpact: 'Complete loss of security monitoring capability',
    riskRating: 'high',
    implementationDate: new Date('2018-01-15'),
    lastUpgradeDate: new Date('2024-03-01'),
    nextUpgradeDate: new Date('2025-03-01'),
    complianceCertifications: ['SOC 2'],
    dataClassification: 'confidential',
    inIsmsScope: true,
    scopeJustification: 'Critical security monitoring platform',
    isActive: true,
  },
  {
    platformCode: 'PLAT-IAM-001',
    name: 'Okta Identity Cloud',
    platformType: 'identity_management',
    description: 'Identity and access management platform for SSO, MFA, and lifecycle management',
    vendor: 'Okta',
    vendorWebsite: 'https://www.okta.com',
    licenseType: 'saas',
    hostingLocation: 'EU (Germany)',
    cloudProvider: 'Okta Cloud',
    deploymentModel: 'saas',
    version: 'Latest (SaaS)',
    architecture: 'Multi-tenant SaaS',
    integrations: ['Active Directory', 'ServiceNow', 'All SaaS applications'],
    dataStorageLocation: 'Germany',
    criticalityLevel: 'critical',
    businessImpact: 'Authentication failure for all users',
    riskRating: 'medium',
    implementationDate: new Date('2020-06-01'),
    complianceCertifications: ['SOC 2 Type II', 'ISO 27001'],
    dataClassification: 'confidential',
    inIsmsScope: true,
    scopeJustification: 'Central identity platform for access control',
    isActive: true,
  },
];

// ============================================
// MAIN SEED FUNCTION
// ============================================
// ============================================
// MAIN SEED FUNCTION
// ============================================
export async function seedDemoOrganisation(prisma: PrismaClient, passwordHash: string) {
  console.log('\n🏢 Seeding Demo Organisation: NexusGuard Technologies...');

  // Create users first
  const createdUsers: Record<string, { id: string; email: string }> = {};

  for (const user of demoUsers) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: true,
      },
    });
    createdUsers[user.email] = { id: created.id, email: created.email };
  }
  console.log(`  ✅ Created ${Object.keys(createdUsers).length} demo users`);

  // Get admin user for createdById
  const adminUser = createdUsers['martijn.devries@nexusguard.eu'] || Object.values(createdUsers)[0];
  const cisoUser = createdUsers['jan.bakker@nexusguard.eu'];

  // Create Organisation Profile
  const orgProfile = await prisma.organisationProfile.create({
    data: {
      ...organisationProfile,
      createdById: adminUser.id,
    },
  });
  console.log('  ✅ Created organisation profile');

  // Create Locations
  const createdLocations: Record<string, string> = {};
  for (const location of locations) {
    const created = await prisma.location.create({
      data: {
        ...location,
        createdById: adminUser.id,
      },
    });
    createdLocations[location.locationCode] = created.id;
  }
  console.log(`  ✅ Created ${locations.length} locations`);

  // Create Departments
  const createdDepartments: Record<string, string> = {};
  for (const dept of departments) {
    const created = await prisma.department.create({
      data: {
        ...dept,
        createdById: adminUser.id,
      },
    });
    createdDepartments[dept.departmentCode] = created.id;
  }
  console.log(`  ✅ Created ${departments.length} departments`);

  // Create Business Processes
  const createdProcesses: Record<string, string> = {};
  for (const process of businessProcesses) {
    const { biaStatus, ...processData } = process;
    const created = await prisma.businessProcess.create({
      data: {
        ...processData,
        biaStatus: biaStatus || 'pending',
        createdById: adminUser.id,
        departmentId: createdDepartments['DEPT-SOC'] || createdDepartments['DEPT-INFOSEC'],
      },
    });
    createdProcesses[process.processCode] = created.id;
  }
  console.log(`  ✅ Created ${businessProcesses.length} business processes`);

  // Create External Dependencies
  for (const dependency of externalDependencies) {
    await prisma.externalDependency.create({
      data: {
        ...dependency,
        createdById: adminUser.id,
      },
    });
  }
  console.log(`  ✅ Created ${externalDependencies.length} external dependencies`);

  // Create Interested Parties
  for (const party of interestedParties) {
    await prisma.interestedParty.create({
      data: {
        ...party,
        createdById: adminUser.id,
      },
    });
  }
  console.log(`  ✅ Created ${interestedParties.length} interested parties`);

  // Create Context Issues
  for (const issue of contextIssues) {
    await prisma.contextIssue.create({
      data: {
        ...issue,
        createdById: adminUser.id,
        responsiblePartyId: cisoUser?.id,
      },
    });
  }
  console.log(`  ✅ Created ${contextIssues.length} context issues`);

  // Create Applicable Frameworks
  for (const framework of applicableFrameworks) {
    await prisma.applicableFramework.create({
      data: {
        ...framework,
        createdById: adminUser.id,
        assessedById: cisoUser?.id,
      },
    });
  }
  console.log(`  ✅ Created ${applicableFrameworks.length} applicable frameworks`);

  // Create Regulators
  for (const regulator of regulators) {
    await prisma.regulator.create({
      data: {
        ...regulator,
        createdById: adminUser.id,
      },
    });
  }
  console.log(`  ✅ Created ${regulators.length} regulators`);

  // Create Security Committees
  const createdCommittees: Record<string, string> = {};
  for (const committee of securityCommittees) {
    const created = await prisma.securityCommittee.create({
      data: {
        ...committee,
        chairId: cisoUser?.id,
        createdById: adminUser.id,
      },
    });
    createdCommittees[committee.name] = created.id;
  }
  console.log(`  ✅ Created ${securityCommittees.length} security committees`);

  // Create Security Champions
  for (const champion of securityChampions) {
    const userMatch = Object.entries(createdUsers).find(([email]) =>
      email.includes(champion.userName.toLowerCase().split(' ')[0].toLowerCase())
    );
    const deptId = createdDepartments[champion.departmentCode];

    if (userMatch && deptId) {
      await prisma.securityChampion.create({
        data: {
          userId: userMatch[1].id,
          departmentId: deptId,
          championLevel: champion.championLevel,
          responsibilities: champion.responsibilities,
          startDate: champion.startDate,
          createdById: adminUser.id,
        },
      });
    }
  }
  console.log(`  ✅ Created ${securityChampions.length} security champions`);

  // Create Committee Memberships
  const createdMemberships: Record<string, string> = {}; // key: committeeId_userId -> membershipId
  for (const def of committeeMembershipDefinitions) {
    const committeeId = createdCommittees[def.committee];
    for (const email of def.members) {
      const userId = createdUsers[email]?.id;
      if (committeeId && userId) {
        const membership = await prisma.committeeMembership.create({
          data: {
            committeeId,
            userId,
            role: 'member',
            startDate: new Date('2024-01-01'),
            createdById: adminUser.id,
          },
        });
        createdMemberships[`${committeeId}_${userId}`] = membership.id;
      }
    }
  }
  console.log(`  ✅ Created committee memberships`);

  // Create Committee Meetings & Decisions
  for (const meeting of committeeMeetings) {
    const committeeId = createdCommittees[meeting.committeeName];
    if (committeeId) {
      // Destructure fields that are NOT in Prisma create input
      const { decisions, attendees: meetingAttendees, actionItems: meetingActionItems, committeeName, ...prismaData } = meeting as any;

      const createdMeeting = await prisma.committeeMeeting.create({
        data: {
          ...prismaData,
          committeeId,
          createdById: cisoUser?.id,
        },
      });

      // Create Decisions for this meeting
      for (const decision of decisions) {
        await prisma.meetingDecision.create({
          data: {
            ...decision,
            meetingId: createdMeeting.id,
            createdById: cisoUser?.id,
          },
        });
      }

      // Create Action Items
      if (meetingActionItems && Array.isArray(meetingActionItems)) {
        for (const item of meetingActionItems) {
          const assignedToId = createdUsers[item.assignedTo]?.id;
          const { assignedTo, ...itemData } = item;
          await prisma.meetingActionItem.create({
            data: {
              ...itemData,
              assignedToId,
              meetingId: createdMeeting.id,
              createdById: cisoUser?.id,
            }
          });
        }
      }

      // Create Attendance
      if (meetingAttendees && Array.isArray(meetingAttendees)) {
        for (const email of meetingAttendees) {
          const userId = createdUsers[email]?.id;
          const membershipId = createdMemberships[`${committeeId}_${userId}`];

          if (userId) {
            await prisma.meetingAttendance.create({
              data: {
                meetingId: createdMeeting.id,
                memberId: userId,
                membershipId: membershipId, // can be null if not a permanent member
                attendanceStatus: 'present',
                createdById: cisoUser?.id
              }
            });
          }
        }
      }
    }
  }
  console.log(`  ✅ Created ${committeeMeetings.length} committee meetings with decisions, actions, and attendance.`);

  // Create Organisational Units
  const createdUnits: Record<string, string> = {};
  for (const unit of organisationalUnits) {
    const parentId = unit.parentCode ? createdUnits[unit.parentCode] : null;
    const { parentCode, type, ...unitData } = unit;
    const created = await prisma.organisationalUnit.create({
      data: {
        ...unitData,
        unitType: type,
        parentId,
        createdById: adminUser.id,
      },
    });
    createdUnits[unit.code] = created.id;
  }
  console.log(`  ✅ Created ${organisationalUnits.length} organisational units`);

  // Create Department Memberships
  let membershipCount = 0;
  for (const [email, deptCode] of Object.entries(departmentAssignments)) {
    const userId = createdUsers[email]?.id;
    const deptId = createdDepartments[deptCode];
    if (userId && deptId) {
      await prisma.departmentMember.create({
        data: {
          userId,
          departmentId: deptId,
        },
      });
      membershipCount++;
    }
  }
  console.log(`  ✅ Created ${membershipCount} department memberships`);

  // Create Committee Memberships


  // Update Meetings with Attendance & Action Items
  // (We iterate committeeMeetings again, finding the created meeting by title/committee since we didn't store IDs specifically,
  // OR we could have done this inside the loop above. To be safe/clean let's do it here by querying or just merging the logic above.
  // Actually, let's look at the previous loop. We can move this logic TO the previous loop (lines 2145-2167 in original, now around ~2100).
  // But wait, we need membership IDs for attendance? Or just user IDs?
  // Schema for MeetingAttendance: memberId (User) AND membershipId (CommitteeMembership) are fields.
  // Let's modify the PREVIOUS loop instead of adding a new one, but I already requested this chunk to be appended.
  // I will add a separate loop here that finds the meetings.
  // OR simpler: I can't easily find the created meetings without querying.
  // CRITICAL: The previous loop created the meetings. I should have added the logic there.
  // I will use a separate block that iterates existing `committeeMeetings` and finds them in DB? No that's slow.
  // I will REWRITE the Committee Meeting loop entirely in a separate edit to include this logic.
  // For now, let's just add the Org Units and Dept Members here.
  // I will do the Committee Meeting logic update in a separate call to replace the EXISTING loop.)

  // Create Key Personnel
  for (const person of keyPersonnel) {
    const userMatch = Object.entries(createdUsers).find(([email]) =>
      email.includes(person.name.toLowerCase().split(' ')[0].toLowerCase())
    );

    await prisma.keyPersonnel.create({
      data: {
        ...person,
        userId: userMatch?.[1]?.id,
        departmentId: createdDepartments['DEPT-INFOSEC'],
        createdById: adminUser.id,
      },
    });
  }
  console.log(`  ✅ Created ${keyPersonnel.length} key personnel`);

  // Create Executive Positions
  const userMapping: Record<string, string> = {
    'Chief Executive Officer': 'martijn.devries@nexusguard.eu',
    'Chief Financial Officer': 'anna.schmidt@nexusguard.eu',
    'Chief Technology Officer': 'thomas.muller@nexusguard.eu',
    'Chief Operating Officer': 'eva.lindberg@nexusguard.eu',
    'Chief Information Security Officer': 'jan.bakker@nexusguard.eu',
  };

  let ceoPositionId: string | null = null;
  for (const position of executivePositions) {
    const userEmail = userMapping[position.title];
    const userId = userEmail ? createdUsers[userEmail]?.id : null;

    const created: any = await prisma.executivePosition.create({
      data: {
        ...position,
        personId: userId,
        reportsToId: position.isCeo ? null : ceoPositionId,
        createdById: adminUser.id,
      },
    });

    if (position.isCeo) {
      ceoPositionId = created.id;
    }
  }
  console.log(`  ✅ Created ${executivePositions.length} executive positions`);

  // Create Products & Services
  for (const product of productsServices) {
    await prisma.productService.create({
      data: {
        ...product,
        createdById: adminUser.id,
      },
    });
  }
  console.log(`  ✅ Created ${productsServices.length} products & services`);

  // Create Technology Platforms
  for (const platform of technologyPlatforms) {
    await prisma.technologyPlatform.create({
      data: {
        ...platform,
        createdById: adminUser.id,
      },
    });
  }
  console.log(`  ✅ Created ${technologyPlatforms.length} technology platforms`);

  console.log('\n✅ Demo Organisation seed completed successfully!');
  console.log('   Organisation: NexusGuard Technologies B.V.');
  console.log('   Industry: Digital Infrastructure (NIS2 Important Entity)');
  console.log('   Size: 347 employees');
  console.log('   ISO 27001 Status: Planning phase');

  return {
    organisationProfile: orgProfile,
    users: createdUsers,
    departments: createdDepartments,
    locations: createdLocations,
    processes: createdProcesses,
    committees: createdCommittees,
  };
}
