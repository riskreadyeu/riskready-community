/**
 * Cross-Reference Seed Script
 * 
 * Seeds the FrameworkCrossReference and ControlDomain tables with
 * mapping data from the Framework Cross-Reference Matrix.
 * 
 * Run with: npx ts-node prisma/seeds/cross-reference-seed.ts
 */

import { PrismaClient, ControlFramework, MappingType } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// DOMAIN DATA (from Sheet 1: Domain Matrix)
// ============================================

const domains = [
  {
    name: 'Governance & Policy',
    sortOrder: 1,
    isoControls: 'A.5.1,A.5.2,A.5.3,A.5.4',
    soc2Criteria: 'CC1.1,CC1.2,CC1.3,CC1.4,CC1.5,CC2.1,CC5.1,CC5.2',
    nis2Articles: 'Art.20.1,Art.20.2,Art.20.3,Art.21.2(a)',
    doraArticles: 'Art.5,Art.9.2,Art.13.3',
    controlAreas: [
      { name: 'Information Security Policy', iso: 'A.5.1', soc2: 'CC1.1,CC2.1,CC5.1,CC5.2', nis2: 'Art.21.2(a)', dora: 'Art.5,Art.9.2' },
      { name: 'Security Roles & Responsibilities', iso: 'A.5.2', soc2: 'CC1.3,CC1.5', nis2: 'Art.21.2(a)', dora: 'Art.5' },
      { name: 'Segregation of Duties', iso: 'A.5.3', soc2: 'CC1.2,CC1.3', nis2: 'Art.21.2(a)', dora: 'Art.5' },
      { name: 'Management Commitment', iso: 'A.5.4', soc2: 'CC1.1,CC1.2', nis2: 'Art.20.1,Art.20.2', dora: 'Art.5' },
    ],
  },
  {
    name: 'Risk Management',
    sortOrder: 2,
    isoControls: 'A.5.8,A.5.9,A.5.10',
    soc2Criteria: 'CC3.1,CC3.2,CC3.3,CC3.4,CC4.1,CC4.2',
    nis2Articles: 'Art.21.1,Art.21.2(a)',
    doraArticles: 'Art.5,Art.6,Art.8',
    controlAreas: [
      { name: 'Information Security Risk Assessment', iso: 'A.5.8', soc2: 'CC3.1,CC3.2', nis2: 'Art.21.1', dora: 'Art.5,Art.6' },
      { name: 'Risk Treatment', iso: 'A.5.9', soc2: 'CC3.3,CC3.4', nis2: 'Art.21.2(a)', dora: 'Art.6' },
      { name: 'Risk Monitoring', iso: 'A.5.10', soc2: 'CC4.1,CC4.2', nis2: 'Art.21.2(a)', dora: 'Art.8' },
    ],
  },
  {
    name: 'Asset Management',
    sortOrder: 3,
    isoControls: 'A.5.9,A.5.10,A.5.11,A.5.12,A.5.13',
    soc2Criteria: 'CC6.1,CC6.2,CC6.7',
    nis2Articles: 'Art.21.2(a)',
    doraArticles: 'Art.6,Art.7',
    controlAreas: [
      { name: 'Asset Inventory', iso: 'A.5.9', soc2: 'CC6.1', nis2: 'Art.21.2(a)', dora: 'Art.6' },
      { name: 'Asset Classification', iso: 'A.5.12,A.5.13', soc2: 'CC6.1,CC6.2', nis2: 'Art.21.2(a)', dora: 'Art.6' },
    ],
  },
  {
    name: 'Access Control',
    sortOrder: 4,
    isoControls: 'A.5.15,A.5.16,A.5.17,A.5.18,A.8.2,A.8.3,A.8.4,A.8.5',
    soc2Criteria: 'CC6.1,CC6.2,CC6.3,CC6.4,CC6.5,CC6.6',
    nis2Articles: 'Art.21.2(d),Art.21.2(i)',
    doraArticles: 'Art.9,Art.9.4',
    controlAreas: [
      { name: 'Access Control Policy', iso: 'A.5.15', soc2: 'CC6.1', nis2: 'Art.21.2(d)', dora: 'Art.9' },
      { name: 'Identity Management', iso: 'A.5.16', soc2: 'CC6.1,CC6.2', nis2: 'Art.21.2(i)', dora: 'Art.9.4' },
      { name: 'Authentication', iso: 'A.5.17,A.8.5', soc2: 'CC6.1,CC6.3', nis2: 'Art.21.2(i)', dora: 'Art.9.4' },
      { name: 'Access Rights Management', iso: 'A.5.18', soc2: 'CC6.2,CC6.3', nis2: 'Art.21.2(d)', dora: 'Art.9' },
      { name: 'Privileged Access', iso: 'A.8.2,A.8.3,A.8.4', soc2: 'CC6.4,CC6.5,CC6.6', nis2: 'Art.21.2(d)', dora: 'Art.9.4' },
    ],
  },
  {
    name: 'Cryptography',
    sortOrder: 5,
    isoControls: 'A.8.24',
    soc2Criteria: 'CC6.1,CC6.7',
    nis2Articles: 'Art.21.2(h)',
    doraArticles: 'Art.9.4(c)',
    controlAreas: [
      { name: 'Cryptographic Controls', iso: 'A.8.24', soc2: 'CC6.1,CC6.7', nis2: 'Art.21.2(h)', dora: 'Art.9.4(c)' },
    ],
  },
  {
    name: 'Operations Security',
    sortOrder: 6,
    isoControls: 'A.8.7,A.8.8,A.8.9,A.8.13,A.8.14,A.8.15,A.8.16',
    soc2Criteria: 'CC6.8,CC7.1,CC7.2,CC7.3,CC8.1',
    nis2Articles: 'Art.21.2(b),Art.21.2(e)',
    doraArticles: 'Art.7,Art.9,Art.10',
    controlAreas: [
      { name: 'Malware Protection', iso: 'A.8.7', soc2: 'CC6.8', nis2: 'Art.21.2(e)', dora: 'Art.9' },
      { name: 'Vulnerability Management', iso: 'A.8.8', soc2: 'CC7.1', nis2: 'Art.21.2(e)', dora: 'Art.7' },
      { name: 'Configuration Management', iso: 'A.8.9', soc2: 'CC5.3,CC6.6', nis2: 'Art.21.2(e)', dora: 'Art.7' },
      { name: 'Backup', iso: 'A.8.13', soc2: 'CC7.5', nis2: 'Art.21.2(c)', dora: 'Art.11' },
      { name: 'Logging and Monitoring', iso: 'A.8.15,A.8.16', soc2: 'CC7.2,CC7.3', nis2: 'Art.21.2(b)', dora: 'Art.10' },
    ],
  },
  {
    name: 'Network Security',
    sortOrder: 7,
    isoControls: 'A.8.20,A.8.21,A.8.22,A.8.23',
    soc2Criteria: 'CC6.6,CC6.7',
    nis2Articles: 'Art.21.2(e)',
    doraArticles: 'Art.9.2,Art.9.4',
    controlAreas: [
      { name: 'Network Security', iso: 'A.8.20,A.8.21', soc2: 'CC6.6', nis2: 'Art.21.2(e)', dora: 'Art.9.2' },
      { name: 'Network Segmentation', iso: 'A.8.22', soc2: 'CC6.6', nis2: 'Art.21.2(e)', dora: 'Art.9.4' },
      { name: 'Web Filtering', iso: 'A.8.23', soc2: 'CC6.7', nis2: 'Art.21.2(e)', dora: 'Art.9' },
    ],
  },
  {
    name: 'Incident Management',
    sortOrder: 8,
    isoControls: 'A.5.24,A.5.25,A.5.26,A.5.27,A.5.28',
    soc2Criteria: 'CC7.4,CC7.5',
    nis2Articles: 'Art.21.2(b),Art.23',
    doraArticles: 'Art.17,Art.18,Art.19',
    controlAreas: [
      { name: 'Incident Response Planning', iso: 'A.5.24', soc2: 'CC7.4', nis2: 'Art.21.2(b)', dora: 'Art.17' },
      { name: 'Incident Assessment', iso: 'A.5.25', soc2: 'CC7.4', nis2: 'Art.21.2(b)', dora: 'Art.17' },
      { name: 'Incident Response', iso: 'A.5.26', soc2: 'CC7.4', nis2: 'Art.23', dora: 'Art.18' },
      { name: 'Evidence Collection', iso: 'A.5.28', soc2: 'CC7.5', nis2: 'Art.21.2(b)', dora: 'Art.17' },
    ],
  },
  {
    name: 'Business Continuity',
    sortOrder: 9,
    isoControls: 'A.5.29,A.5.30',
    soc2Criteria: 'A1.1,A1.2,A1.3',
    nis2Articles: 'Art.21.2(c)',
    doraArticles: 'Art.11,Art.12',
    controlAreas: [
      { name: 'Business Continuity Planning', iso: 'A.5.29', soc2: 'A1.1,A1.2', nis2: 'Art.21.2(c)', dora: 'Art.11' },
      { name: 'ICT Readiness', iso: 'A.5.30', soc2: 'A1.2,A1.3', nis2: 'Art.21.2(c)', dora: 'Art.11,Art.12' },
    ],
  },
  {
    name: 'Supplier Management',
    sortOrder: 10,
    isoControls: 'A.5.19,A.5.20,A.5.21,A.5.22,A.5.23',
    soc2Criteria: 'CC9.1,CC9.2',
    nis2Articles: 'Art.21.2(e)',
    doraArticles: 'Art.28,Art.29,Art.30',
    controlAreas: [
      { name: 'Supplier Security Policy', iso: 'A.5.19', soc2: 'CC9.1', nis2: 'Art.21.2(e)', dora: 'Art.28' },
      { name: 'Supplier Agreements', iso: 'A.5.20', soc2: 'CC9.1,CC9.2', nis2: 'Art.21.2(e)', dora: 'Art.28,Art.29' },
      { name: 'Supplier Monitoring', iso: 'A.5.22', soc2: 'CC9.2', nis2: 'Art.21.2(e)', dora: 'Art.30' },
    ],
  },
  {
    name: 'Compliance',
    sortOrder: 11,
    isoControls: 'A.5.31,A.5.32,A.5.33,A.5.34,A.5.35,A.5.36,A.5.37',
    soc2Criteria: 'CC2.2,CC2.3,CC4.1,CC4.2',
    nis2Articles: 'Art.20,Art.32',
    doraArticles: 'Art.5,Art.6',
    controlAreas: [
      { name: 'Legal & Regulatory Requirements', iso: 'A.5.31', soc2: 'CC2.2', nis2: 'Art.20', dora: 'Art.5' },
      { name: 'Privacy Protection', iso: 'A.5.34', soc2: 'CC2.3', nis2: 'Art.32', dora: 'Art.6' },
      { name: 'Independent Review', iso: 'A.5.35', soc2: 'CC4.1,CC4.2', nis2: 'Art.20', dora: 'Art.6' },
    ],
  },
  {
    name: 'Human Resources',
    sortOrder: 12,
    isoControls: 'A.6.1,A.6.2,A.6.3,A.6.4,A.6.5,A.6.6,A.6.7,A.6.8',
    soc2Criteria: 'CC1.4,CC2.2',
    nis2Articles: 'Art.20.3,Art.21.2(g)',
    doraArticles: 'Art.13.3,Art.13.4',
    controlAreas: [
      { name: 'Screening', iso: 'A.6.1', soc2: 'CC1.4', nis2: 'Art.21.2(g)', dora: 'Art.13.4' },
      { name: 'Security Awareness', iso: 'A.6.3', soc2: 'CC1.4,CC2.2', nis2: 'Art.20.3', dora: 'Art.13.3' },
      { name: 'Remote Working', iso: 'A.6.7', soc2: 'CC6.7', nis2: 'Art.21.2(g)', dora: 'Art.9' },
    ],
  },
  {
    name: 'Physical Security',
    sortOrder: 13,
    isoControls: 'A.7.1,A.7.2,A.7.3,A.7.4,A.7.5,A.7.6,A.7.7,A.7.8,A.7.9,A.7.10,A.7.11,A.7.12,A.7.13,A.7.14',
    soc2Criteria: 'CC6.4,CC6.5',
    nis2Articles: 'Art.21.2(g)',
    doraArticles: 'Art.9.4(f)',
    controlAreas: [
      { name: 'Physical Security Perimeters', iso: 'A.7.1,A.7.2', soc2: 'CC6.4', nis2: 'Art.21.2(g)', dora: 'Art.9.4(f)' },
      { name: 'Physical Entry', iso: 'A.7.2,A.7.3', soc2: 'CC6.4,CC6.5', nis2: 'Art.21.2(g)', dora: 'Art.9.4(f)' },
      { name: 'Equipment Protection', iso: 'A.7.8,A.7.9,A.7.10', soc2: 'CC6.4', nis2: 'Art.21.2(g)', dora: 'Art.9.4(f)' },
    ],
  },
];

// ============================================
// CROSS-REFERENCE MAPPINGS (from Sheets 2-5)
// ============================================

interface Mapping {
  sourceFramework: ControlFramework;
  sourceControlId: string;
  sourceName?: string;
  targetFramework: ControlFramework;
  targetControlId: string;
  targetName?: string;
  mappingType?: MappingType;
}

// ISO 27001 to other frameworks (Sheet 2)
const isoMappings: Array<{
  isoControl: string;
  name: string;
  soc2: string;
  nis2: string;
  dora: string;
}> = [
  { isoControl: 'A.5.1', name: 'Policies for information security', soc2: 'CC1.1,CC2.1,CC5.1,CC5.2', nis2: 'Art.21.2(a)', dora: 'Art.5,Art.9.2' },
  { isoControl: 'A.5.2', name: 'Information security roles and responsibilities', soc2: 'CC1.3,CC1.5', nis2: 'Art.21.2(a)', dora: 'Art.5' },
  { isoControl: 'A.5.3', name: 'Segregation of duties', soc2: 'CC1.2,CC1.3', nis2: 'Art.21.2(a)', dora: 'Art.5' },
  { isoControl: 'A.5.4', name: 'Management responsibilities', soc2: 'CC1.1,CC1.2', nis2: 'Art.20.1,Art.20.2', dora: 'Art.5' },
  { isoControl: 'A.5.5', name: 'Contact with authorities', soc2: 'CC2.2', nis2: 'Art.23', dora: 'Art.17' },
  { isoControl: 'A.5.6', name: 'Contact with special interest groups', soc2: 'CC2.2', nis2: 'Art.21.2(a)', dora: 'Art.5' },
  { isoControl: 'A.5.7', name: 'Threat intelligence', soc2: 'CC3.2', nis2: 'Art.21.2(a)', dora: 'Art.8' },
  { isoControl: 'A.5.8', name: 'Information security in project management', soc2: 'CC3.1,CC3.2', nis2: 'Art.21.2(a)', dora: 'Art.5,Art.6' },
  { isoControl: 'A.5.9', name: 'Inventory of information and other assets', soc2: 'CC6.1', nis2: 'Art.21.2(a)', dora: 'Art.6' },
  { isoControl: 'A.5.10', name: 'Acceptable use of information and assets', soc2: 'CC6.1', nis2: 'Art.21.2(a)', dora: 'Art.6' },
  { isoControl: 'A.5.11', name: 'Return of assets', soc2: 'CC6.5', nis2: 'Art.21.2(a)', dora: 'Art.6' },
  { isoControl: 'A.5.12', name: 'Classification of information', soc2: 'CC6.1', nis2: 'Art.21.2(a)', dora: 'Art.6' },
  { isoControl: 'A.5.13', name: 'Labelling of information', soc2: 'CC6.1', nis2: 'Art.21.2(a)', dora: 'Art.6' },
  { isoControl: 'A.5.14', name: 'Information transfer', soc2: 'CC6.7', nis2: 'Art.21.2(e)', dora: 'Art.9' },
  { isoControl: 'A.5.15', name: 'Access control', soc2: 'CC6.1,CC6.3', nis2: 'Art.21.2(d)', dora: 'Art.9' },
  { isoControl: 'A.5.16', name: 'Identity management', soc2: 'CC6.1,CC6.2', nis2: 'Art.21.2(i)', dora: 'Art.9.4' },
  { isoControl: 'A.5.17', name: 'Authentication information', soc2: 'CC6.1', nis2: 'Art.21.2(i)', dora: 'Art.9.4' },
  { isoControl: 'A.5.18', name: 'Access rights', soc2: 'CC6.2,CC6.3', nis2: 'Art.21.2(d)', dora: 'Art.9' },
  { isoControl: 'A.5.19', name: 'Information security in supplier relationships', soc2: 'CC9.1', nis2: 'Art.21.2(e)', dora: 'Art.28' },
  { isoControl: 'A.5.20', name: 'Addressing security in supplier agreements', soc2: 'CC9.1,CC9.2', nis2: 'Art.21.2(e)', dora: 'Art.28,Art.29' },
  { isoControl: 'A.5.21', name: 'Managing ICT supply chain security', soc2: 'CC9.1,CC9.2', nis2: 'Art.21.2(e)', dora: 'Art.28' },
  { isoControl: 'A.5.22', name: 'Monitoring and review of supplier services', soc2: 'CC9.2', nis2: 'Art.21.2(e)', dora: 'Art.30' },
  { isoControl: 'A.5.23', name: 'Information security for cloud services', soc2: 'CC9.1', nis2: 'Art.21.2(e)', dora: 'Art.28' },
  { isoControl: 'A.5.24', name: 'Incident management planning and preparation', soc2: 'CC7.4', nis2: 'Art.21.2(b)', dora: 'Art.17' },
  { isoControl: 'A.5.25', name: 'Assessment and decision on information security events', soc2: 'CC7.4', nis2: 'Art.21.2(b)', dora: 'Art.17' },
  { isoControl: 'A.5.26', name: 'Response to information security incidents', soc2: 'CC7.4', nis2: 'Art.23', dora: 'Art.18' },
  { isoControl: 'A.5.27', name: 'Learning from information security incidents', soc2: 'CC7.5', nis2: 'Art.21.2(b)', dora: 'Art.17' },
  { isoControl: 'A.5.28', name: 'Collection of evidence', soc2: 'CC7.5', nis2: 'Art.21.2(b)', dora: 'Art.17' },
  { isoControl: 'A.5.29', name: 'Information security during disruption', soc2: 'A1.1,A1.2', nis2: 'Art.21.2(c)', dora: 'Art.11' },
  { isoControl: 'A.5.30', name: 'ICT readiness for business continuity', soc2: 'A1.2,A1.3', nis2: 'Art.21.2(c)', dora: 'Art.11,Art.12' },
  { isoControl: 'A.5.31', name: 'Legal, statutory, regulatory and contractual requirements', soc2: 'CC2.2', nis2: 'Art.20', dora: 'Art.5' },
  { isoControl: 'A.5.32', name: 'Intellectual property rights', soc2: 'CC2.3', nis2: '-', dora: '-' },
  { isoControl: 'A.5.33', name: 'Protection of records', soc2: 'CC6.1', nis2: 'Art.21.2(a)', dora: 'Art.6' },
  { isoControl: 'A.5.34', name: 'Privacy and protection of PII', soc2: 'P1-P8', nis2: 'Art.32', dora: 'Art.6' },
  { isoControl: 'A.5.35', name: 'Independent review of information security', soc2: 'CC4.1,CC4.2', nis2: 'Art.20', dora: 'Art.6' },
  { isoControl: 'A.5.36', name: 'Compliance with policies and standards', soc2: 'CC4.1', nis2: 'Art.20', dora: 'Art.5' },
  { isoControl: 'A.5.37', name: 'Documented operating procedures', soc2: 'CC5.3', nis2: 'Art.21.2(a)', dora: 'Art.5,Art.9.2' },
  { isoControl: 'A.6.1', name: 'Screening', soc2: 'CC1.4', nis2: 'Art.21.2(g)', dora: 'Art.13.4' },
  { isoControl: 'A.6.2', name: 'Terms and conditions of employment', soc2: 'CC1.4', nis2: 'Art.21.2(g)', dora: 'Art.13' },
  { isoControl: 'A.6.3', name: 'Information security awareness, education and training', soc2: 'CC1.4,CC2.2', nis2: 'Art.20.3', dora: 'Art.13.3' },
  { isoControl: 'A.6.4', name: 'Disciplinary process', soc2: 'CC1.4', nis2: 'Art.21.2(g)', dora: 'Art.13' },
  { isoControl: 'A.6.5', name: 'Responsibilities after termination', soc2: 'CC1.4,CC6.5', nis2: 'Art.21.2(g)', dora: 'Art.13' },
  { isoControl: 'A.6.6', name: 'Confidentiality or non-disclosure agreements', soc2: 'CC1.4', nis2: 'Art.21.2(g)', dora: 'Art.13' },
  { isoControl: 'A.6.7', name: 'Remote working', soc2: 'CC6.7', nis2: 'Art.21.2(g)', dora: 'Art.9' },
  { isoControl: 'A.6.8', name: 'Information security event reporting', soc2: 'CC7.4', nis2: 'Art.21.2(b)', dora: 'Art.17' },
  { isoControl: 'A.7.1', name: 'Physical security perimeters', soc2: 'CC6.4', nis2: 'Art.21.2(g)', dora: 'Art.9.4(f)' },
  { isoControl: 'A.7.2', name: 'Physical entry', soc2: 'CC6.4,CC6.5', nis2: 'Art.21.2(g)', dora: 'Art.9.4(f)' },
  { isoControl: 'A.8.1', name: 'User endpoint devices', soc2: 'CC6.7', nis2: 'Art.21.2(e)', dora: 'Art.9' },
  { isoControl: 'A.8.2', name: 'Privileged access rights', soc2: 'CC6.3', nis2: 'Art.21.2(d)', dora: 'Art.9.4' },
  { isoControl: 'A.8.3', name: 'Information access restriction', soc2: 'CC6.3', nis2: 'Art.21.2(d)', dora: 'Art.9' },
  { isoControl: 'A.8.4', name: 'Access to source code', soc2: 'CC6.3', nis2: 'Art.21.2(d)', dora: 'Art.9' },
  { isoControl: 'A.8.5', name: 'Secure authentication', soc2: 'CC6.1', nis2: 'Art.21.2(i)', dora: 'Art.9.4' },
  { isoControl: 'A.8.7', name: 'Protection against malware', soc2: 'CC6.8', nis2: 'Art.21.2(e)', dora: 'Art.9' },
  { isoControl: 'A.8.8', name: 'Management of technical vulnerabilities', soc2: 'CC7.1', nis2: 'Art.21.2(e)', dora: 'Art.7' },
  { isoControl: 'A.8.9', name: 'Configuration management', soc2: 'CC5.3,CC6.6', nis2: 'Art.21.2(e)', dora: 'Art.7' },
  { isoControl: 'A.8.10', name: 'Information deletion', soc2: 'CC6.5', nis2: 'Art.21.2(a)', dora: 'Art.6' },
  { isoControl: 'A.8.11', name: 'Data masking', soc2: 'CC6.1', nis2: 'Art.21.2(a)', dora: 'Art.6' },
  { isoControl: 'A.8.12', name: 'Data leakage prevention', soc2: 'CC6.7', nis2: 'Art.21.2(e)', dora: 'Art.9' },
  { isoControl: 'A.8.13', name: 'Information backup', soc2: 'CC7.5', nis2: 'Art.21.2(c)', dora: 'Art.11' },
  { isoControl: 'A.8.14', name: 'Redundancy of information processing facilities', soc2: 'A1.2', nis2: 'Art.21.2(c)', dora: 'Art.11' },
  { isoControl: 'A.8.15', name: 'Logging', soc2: 'CC7.2', nis2: 'Art.21.2(b)', dora: 'Art.10' },
  { isoControl: 'A.8.16', name: 'Monitoring activities', soc2: 'CC7.2,CC7.3', nis2: 'Art.21.2(b)', dora: 'Art.10' },
  { isoControl: 'A.8.17', name: 'Clock synchronization', soc2: 'CC7.2', nis2: 'Art.21.2(b)', dora: 'Art.10' },
  { isoControl: 'A.8.20', name: 'Networks security', soc2: 'CC6.6', nis2: 'Art.21.2(e)', dora: 'Art.9.2' },
  { isoControl: 'A.8.21', name: 'Security of network services', soc2: 'CC6.6', nis2: 'Art.21.2(e)', dora: 'Art.9.2' },
  { isoControl: 'A.8.22', name: 'Segregation of networks', soc2: 'CC6.6', nis2: 'Art.21.2(e)', dora: 'Art.9.4' },
  { isoControl: 'A.8.23', name: 'Web filtering', soc2: 'CC6.7', nis2: 'Art.21.2(e)', dora: 'Art.9' },
  { isoControl: 'A.8.24', name: 'Use of cryptography', soc2: 'CC6.1,CC6.7', nis2: 'Art.21.2(h)', dora: 'Art.9.4(c)' },
  { isoControl: 'A.8.25', name: 'Secure development lifecycle', soc2: 'CC8.1', nis2: 'Art.21.2(e)', dora: 'Art.7' },
  { isoControl: 'A.8.26', name: 'Application security requirements', soc2: 'CC8.1', nis2: 'Art.21.2(e)', dora: 'Art.7' },
  { isoControl: 'A.8.27', name: 'Secure system architecture', soc2: 'CC5.3', nis2: 'Art.21.2(e)', dora: 'Art.7' },
  { isoControl: 'A.8.28', name: 'Secure coding', soc2: 'CC8.1', nis2: 'Art.21.2(e)', dora: 'Art.7' },
  { isoControl: 'A.8.29', name: 'Security testing in development', soc2: 'CC8.1', nis2: 'Art.21.2(e)', dora: 'Art.7' },
  { isoControl: 'A.8.30', name: 'Outsourced development', soc2: 'CC9.2', nis2: 'Art.21.2(e)', dora: 'Art.28' },
  { isoControl: 'A.8.31', name: 'Separation of environments', soc2: 'CC8.1', nis2: 'Art.21.2(e)', dora: 'Art.7' },
  { isoControl: 'A.8.32', name: 'Change management', soc2: 'CC8.1', nis2: 'Art.21.2(e)', dora: 'Art.8' },
  { isoControl: 'A.8.33', name: 'Test information', soc2: 'CC8.1', nis2: 'Art.21.2(e)', dora: 'Art.7' },
  { isoControl: 'A.8.34', name: 'Protection of systems during audit testing', soc2: 'CC4.1', nis2: 'Art.20', dora: 'Art.6' },
];

/**
 * Generate all cross-reference mappings
 */
function generateMappings(): Mapping[] {
  const mappings: Mapping[] = [];

  for (const iso of isoMappings) {
    // Parse SOC2 criteria
    if (iso.soc2 && iso.soc2 !== '-') {
      const soc2Items = iso.soc2.split(',').map(s => s.trim());
      for (const soc2 of soc2Items) {
        if (soc2) {
          mappings.push({
            sourceFramework: 'ISO',
            sourceControlId: iso.isoControl,
            sourceName: iso.name,
            targetFramework: 'SOC2',
            targetControlId: soc2,
            mappingType: 'RELATED',
          });
        }
      }
    }

    // Parse NIS2 articles
    if (iso.nis2 && iso.nis2 !== '-') {
      const nis2Items = iso.nis2.split(',').map(s => s.trim());
      for (const nis2 of nis2Items) {
        if (nis2) {
          mappings.push({
            sourceFramework: 'ISO',
            sourceControlId: iso.isoControl,
            sourceName: iso.name,
            targetFramework: 'NIS2',
            targetControlId: nis2,
            mappingType: 'RELATED',
          });
        }
      }
    }

    // Parse DORA articles
    if (iso.dora && iso.dora !== '-') {
      const doraItems = iso.dora.split(',').map(s => s.trim());
      for (const dora of doraItems) {
        if (dora) {
          mappings.push({
            sourceFramework: 'ISO',
            sourceControlId: iso.isoControl,
            sourceName: iso.name,
            targetFramework: 'DORA',
            targetControlId: dora,
            mappingType: 'RELATED',
          });
        }
      }
    }
  }

  return mappings;
}

/**
 * Generate reverse mappings (SOC2/NIS2/DORA to ISO)
 */
function generateReverseMappings(mappings: Mapping[]): Mapping[] {
  const reverseMappings: Mapping[] = [];

  for (const m of mappings) {
    reverseMappings.push({
      sourceFramework: m.targetFramework,
      sourceControlId: m.targetControlId,
      sourceName: m.targetName,
      targetFramework: m.sourceFramework,
      targetControlId: m.sourceControlId,
      targetName: m.sourceName,
      mappingType: m.mappingType,
    });
  }

  return reverseMappings;
}

async function main() {
  console.log('Starting cross-reference seed...');

  try {
    // Seed domains
    console.log('Seeding control domains...');
    for (const domain of domains) {
      await prisma.controlDomain.upsert({
        where: { name: domain.name },
        create: {
          name: domain.name,
          sortOrder: domain.sortOrder,
          isoControls: domain.isoControls,
          soc2Criteria: domain.soc2Criteria,
          nis2Articles: domain.nis2Articles,
          doraArticles: domain.doraArticles,
          controlAreas: domain.controlAreas,
        },
        update: {
          sortOrder: domain.sortOrder,
          isoControls: domain.isoControls,
          soc2Criteria: domain.soc2Criteria,
          nis2Articles: domain.nis2Articles,
          doraArticles: domain.doraArticles,
          controlAreas: domain.controlAreas,
        },
      });
    }
    console.log(`Seeded ${domains.length} control domains`);

    // Generate and seed mappings
    console.log('Generating cross-reference mappings...');
    const forwardMappings = generateMappings();
    const reverseMappings = generateReverseMappings(forwardMappings);
    const allMappings = [...forwardMappings, ...reverseMappings];

    console.log(`Generated ${allMappings.length} mappings`);

    // Bulk insert with skipDuplicates
    const result = await prisma.frameworkCrossReference.createMany({
      data: allMappings.map(m => ({
        sourceFramework: m.sourceFramework,
        sourceControlId: m.sourceControlId,
        sourceName: m.sourceName,
        targetFramework: m.targetFramework,
        targetControlId: m.targetControlId,
        targetName: m.targetName,
        mappingType: m.mappingType || 'RELATED',
      })),
      skipDuplicates: true,
    });

    console.log(`Inserted ${result.count} cross-reference mappings`);
    console.log('Cross-reference seed completed successfully!');
  } catch (error) {
    console.error('Error seeding cross-references:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
