import { PrismaClient } from '@prisma/client';
import { DemoContext } from './index';

export async function seedAudits(prisma: PrismaClient, ctx: DemoContext): Promise<void> {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

  // NC-001: Incomplete access review logs
  const nc1 = await prisma.nonconformity.create({
    data: {
      ncId: 'NC-2026-001',
      dateRaised: daysAgo(45),
      source: 'INTERNAL_AUDIT',
      isoClause: 'A.5.15',
      severity: 'MINOR',
      category: 'DOCUMENTATION',
      title: 'Incomplete access review logs for payment systems',
      description: 'During the Q4 2025 internal audit, it was found that access review logs for the payment processing systems were incomplete for September and October 2025. Three quarterly access reviews were not documented with full evidence of reviewer sign-off.',
      findings: 'Access reviews were performed but evidence was not properly retained in the central repository. Email confirmations existed but were not linked to the formal review records.',
      rootCause: 'The access review process relied on manual email-based sign-off which was not consistently captured in the evidence management system. No automated workflow existed to ensure completion.',
      impact: 'Inability to demonstrate continuous compliance with access control policy. Potential audit finding during ISO 27001 surveillance audit.',
      controlId: ctx.controlIds['5.15'] || null,
      correctiveAction: 'Implement automated access review workflow with mandatory evidence upload. Migrate all access reviews to the GRC platform with digital sign-off. Backfill missing evidence for Q3-Q4 2025.',
      responsibleUserId: ctx.users.ismsManager,
      targetClosureDate: daysFromNow(30),
      status: 'IN_PROGRESS',
      capStatus: 'APPROVED',
      capDraftedAt: daysAgo(40),
      capDraftedById: ctx.users.ismsManager,
      capSubmittedAt: daysAgo(38),
      capApprovedAt: daysAgo(35),
      capApprovedById: ctx.users.ciso,
      raisedById: ctx.users.complianceOfficer,
    },
  });
  ctx.ncIds['NC-2026-001'] = nc1.id;

  // NC-002: Missing encryption at rest for staging DB
  const nc2 = await prisma.nonconformity.create({
    data: {
      ncId: 'NC-2026-002',
      dateRaised: daysAgo(30),
      source: 'INTERNAL_AUDIT',
      isoClause: 'A.8.24',
      severity: 'MAJOR',
      category: 'TECHNICAL',
      title: 'Missing encryption at rest for staging database',
      description: 'The analytics staging database (analytics-db-staging) was found to lack encryption at rest. While the production database is properly encrypted with AES-256, the staging environment contains a subset of anonymised production data without encryption enabled.',
      findings: 'AWS RDS instance analytics-staging-db has StorageEncrypted set to false. The instance was provisioned 6 months ago during a data pipeline migration and encryption was not enabled at creation time.',
      rootCause: 'Infrastructure-as-code template for staging environments did not enforce encryption at rest. The staging provisioning pipeline lacked the security baseline checks that exist for production.',
      impact: 'Non-compliance with Data Classification Policy and Cryptographic Controls Standard. Although data is anonymised, the gap represents a control weakness that could extend to other staging resources.',
      controlId: ctx.controlIds['8.24'] || null,
      correctiveAction: 'Create encrypted snapshot of staging DB and restore to new encrypted instance. Update IaC templates to enforce encryption. Add pre-deployment security gate to CI/CD pipeline.',
      responsibleUserId: ctx.users.securityLead,
      targetClosureDate: daysFromNow(21),
      status: 'IN_PROGRESS',
      capStatus: 'APPROVED',
      capDraftedAt: daysAgo(25),
      capDraftedById: ctx.users.securityLead,
      capSubmittedAt: daysAgo(23),
      capApprovedAt: daysAgo(20),
      capApprovedById: ctx.users.ciso,
      raisedById: ctx.users.securityLead,
    },
  });
  ctx.ncIds['NC-2026-002'] = nc2.id;

  // NC-003: Outdated network diagram
  const nc3 = await prisma.nonconformity.create({
    data: {
      ncId: 'NC-2026-003',
      dateRaised: daysAgo(60),
      source: 'INTERNAL_AUDIT',
      isoClause: 'A.8.20',
      severity: 'OBSERVATION',
      category: 'DOCUMENTATION',
      title: 'Outdated network diagram missing Berlin office VPN segment',
      description: 'The network architecture diagram in the ISMS document repository (last updated March 2025) does not reflect the Berlin office VPN segment added in June 2025. The diagram is referenced by the network security policy.',
      findings: 'Network diagram version 2.3 does not include the Berlin-Dublin VPN tunnel or the Berlin office network segment. The actual network topology has diverged from documentation.',
      rootCause: 'No trigger in the change management process to update network diagrams when infrastructure changes are deployed.',
      impact: 'Low impact - documentation gap only. No security weakness identified.',
      controlId: ctx.controlIds['8.20'] || null,
      correctiveAction: 'Network diagram updated to version 2.4 including all current segments.',
      responsibleUserId: ctx.users.securityLead,
      targetClosureDate: daysAgo(40),
      status: 'CLOSED',
      capStatus: 'NOT_REQUIRED',
      closedAt: daysAgo(42),
      closedById: ctx.users.ciso,
      verificationMethod: 'DOCUMENT_REVIEW',
      verificationDate: daysAgo(42),
      verifiedById: ctx.users.ciso,
      verificationResult: 'EFFECTIVE',
      verificationNotes: 'Updated network diagram v2.4 reviewed and confirmed accurate against current infrastructure.',
      raisedById: ctx.users.complianceOfficer,
    },
  });
  ctx.ncIds['NC-2026-003'] = nc3.id;

  // NC-004: Insufficient penetration test scope
  const nc4 = await prisma.nonconformity.create({
    data: {
      ncId: 'NC-2026-004',
      dateRaised: daysAgo(20),
      source: 'EXTERNAL_AUDIT',
      isoClause: 'A.8.29',
      severity: 'MINOR',
      category: 'PROCESS',
      title: 'Insufficient penetration test scope - merchant portal API excluded',
      description: 'The annual penetration test conducted by the external firm did not include the merchant portal API endpoints (v2 API launched in August 2025). The test scope document was based on the previous year\'s asset inventory.',
      findings: 'Penetration test report from external assessor covers payment-api.clearstream.ie but not merchant-api.clearstream.ie. The v2 merchant API handles authentication and merchant data access.',
      rootCause: 'Pen test scope definition process does not include a mandatory asset inventory refresh before engagement. The scope was carried forward from the previous year.',
      impact: 'Potential unidentified vulnerabilities in merchant-facing API. Gap in compliance evidence for ISO 27001 A.8.29.',
      controlId: ctx.controlIds['8.29'] || null,
      responsibleUserId: ctx.users.securityLead,
      targetClosureDate: daysFromNow(45),
      status: 'OPEN',
      capStatus: 'NOT_DEFINED',
      raisedById: ctx.users.complianceOfficer,
    },
  });
  ctx.ncIds['NC-2026-004'] = nc4.id;

  // NC-005: Third-party SLA monitoring gaps
  const nc5 = await prisma.nonconformity.create({
    data: {
      ncId: 'NC-2026-005',
      dateRaised: daysAgo(15),
      source: 'SELF_ASSESSMENT',
      isoClause: 'A.5.23',
      severity: 'MINOR',
      category: 'PROCESS',
      title: 'Third-party SLA monitoring gaps for cloud services',
      description: 'Self-assessment revealed that SLA compliance monitoring for 2 of 4 critical cloud service providers is not being performed at the contracted frequency. AWS and Okta SLA reports are reviewed monthly, but Stripe and Datadog SLA reviews have not been performed since September 2025.',
      findings: 'SLA review tracker shows last Stripe review on 2025-09-15 and last Datadog review on 2025-09-01. Monthly reviews are contractually required.',
      rootCause: 'SLA monitoring responsibility was assigned to a team member who changed roles in October 2025. The handover did not include the SLA review schedule.',
      impact: 'Unable to identify SLA breaches or performance degradation trends for critical service providers. Risk of undetected service quality issues.',
      controlId: ctx.controlIds['5.23'] || null,
      responsibleUserId: ctx.users.riskAnalyst,
      targetClosureDate: daysFromNow(30),
      status: 'OPEN',
      capStatus: 'DRAFT',
      capDraftedAt: daysAgo(10),
      capDraftedById: ctx.users.riskAnalyst,
      correctiveAction: 'Assign SLA monitoring to Operations team with backup. Implement automated SLA data collection from provider dashboards. Create monthly SLA review calendar with reminders.',
      raisedById: ctx.users.riskAnalyst,
    },
  });
  ctx.ncIds['NC-2026-005'] = nc5.id;

  console.log('    5 nonconformities created');
}
