import { PrismaClient } from '@prisma/client';
import { DemoContext } from './index';

// ============================================
// Helper: date relative to now
// ============================================
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function hoursAfter(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

// ============================================
// DEMO INCIDENTS FOR CLEARSTREAM PAYMENTS
// ============================================

export async function seedIncidentsDemo(
  prisma: PrismaClient,
  ctx: DemoContext,
): Promise<void> {
  // ------------------------------------------
  // Incident 1: INC-2026-001 — Phishing campaign
  // ------------------------------------------
  const inc1DetectedAt = daysAgo(75);
  const inc1ContainedAt = daysAgo(74);
  const inc1ClosedAt = daysAgo(68);

  const inc1 = await prisma.incident.create({
    data: {
      referenceNumber: 'INC-2026-001',
      title: 'Phishing email campaign targeting operations staff',
      description:
        'A coordinated phishing email campaign was detected targeting members of the Dublin operations team. The emails impersonated a well-known payment scheme provider and contained links to a credential-harvesting page. Automated email gateway filters flagged the initial batch, but three staff members received messages before quarantine rules propagated.',
      severity: 'MEDIUM',
      status: 'CLOSED',
      category: 'PHISHING',
      source: 'AUTOMATED',
      detectedAt: inc1DetectedAt,
      containedAt: inc1ContainedAt,
      closedAt: inc1ClosedAt,
      reporterId: ctx.users.securityLead,
      handlerId: ctx.users.securityLead,
      incidentManagerId: ctx.users.ciso,
      isConfirmed: true,
      confidentialityBreach: false,
      integrityBreach: false,
      availabilityBreach: false,
      resolutionType: 'RESOLVED',
      evidencePreserved: true,
      rootCauseIdentified: true,
      lessonsLearnedCompleted: true,
      correctiveActionsIdentified: true,
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });

  // INC-001 Timeline (5 entries)
  await prisma.incidentTimelineEntry.createMany({
    data: [
      {
        incidentId: inc1.id,
        timestamp: inc1DetectedAt,
        entryType: 'STATUS_CHANGE',
        title: 'Incident detected by email gateway',
        description:
          'Proofpoint email gateway flagged a cluster of 47 inbound emails matching known phishing indicators. Automated alert raised to SOC dashboard.',
        visibility: 'INTERNAL',
        isAutomated: true,
        sourceSystem: 'Proofpoint',
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc1.id,
        timestamp: hoursAfter(inc1DetectedAt, 1),
        entryType: 'ACTION_TAKEN',
        title: 'Quarantine rules applied and affected mailboxes scanned',
        description:
          'Security team quarantined all matching messages and performed retroactive mailbox scans across the operations department. Three users had received the message prior to quarantine; none clicked the malicious link.',
        visibility: 'INTERNAL',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc1.id,
        timestamp: hoursAfter(inc1DetectedAt, 3),
        entryType: 'COMMUNICATION',
        title: 'Advisory issued to all staff',
        description:
          'An email advisory was sent to all ClearStream employees warning of the phishing campaign, including screenshots of the fraudulent email and guidance on identifying similar threats.',
        visibility: 'INTERNAL',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc1.id,
        timestamp: inc1ContainedAt,
        entryType: 'STATUS_CHANGE',
        title: 'Incident contained — no credential compromise confirmed',
        description:
          'Log analysis confirmed no credentials were submitted to the phishing domain. DNS sinkhole applied for the malicious domain. Incident status moved to CONTAINED.',
        visibility: 'INTERNAL',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc1.id,
        timestamp: inc1ClosedAt,
        entryType: 'STATUS_CHANGE',
        title: 'Post-incident review complete — incident closed',
        description:
          'Post-incident review conducted with operations team. Phishing simulation scheduled for next quarter. Indicator of compromise (IoC) shared with sector ISAC. Incident closed.',
        visibility: 'MANAGEMENT',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
    ],
  });

  // ------------------------------------------
  // Incident 2: INC-2026-002 — AWS AZ degradation
  // ------------------------------------------
  const inc2DetectedAt = daysAgo(60);
  const inc2ContainedAt = daysAgo(59);
  const inc2ClosedAt = daysAgo(55);

  const inc2 = await prisma.incident.create({
    data: {
      referenceNumber: 'INC-2026-002',
      title: 'AWS availability zone degradation affecting payment processing',
      description:
        'AWS eu-west-1a availability zone experienced intermittent network connectivity degradation, causing elevated latency and transaction timeouts for the payment processing service. Failover to eu-west-1b was triggered automatically but resulted in a 12-minute partial outage window impacting approximately 3,200 transactions.',
      severity: 'HIGH',
      status: 'CLOSED',
      category: 'SYSTEM_FAILURE',
      source: 'AUTOMATED',
      detectedAt: inc2DetectedAt,
      containedAt: inc2ContainedAt,
      closedAt: inc2ClosedAt,
      reporterId: ctx.users.cto,
      handlerId: ctx.users.securityLead,
      incidentManagerId: ctx.users.ciso,
      isConfirmed: true,
      confidentialityBreach: false,
      integrityBreach: false,
      availabilityBreach: true,
      resolutionType: 'RESOLVED',
      evidencePreserved: true,
      rootCauseIdentified: true,
      lessonsLearnedCompleted: true,
      correctiveActionsIdentified: true,
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });

  // INC-002 Timeline (4 entries)
  await prisma.incidentTimelineEntry.createMany({
    data: [
      {
        incidentId: inc2.id,
        timestamp: inc2DetectedAt,
        entryType: 'STATUS_CHANGE',
        title: 'Elevated API latency detected by Datadog monitors',
        description:
          'Datadog alert triggered: payment API p99 latency exceeded 2000ms threshold. CloudWatch metrics confirmed eu-west-1a network packet loss rates above 15%.',
        visibility: 'INTERNAL',
        isAutomated: true,
        sourceSystem: 'Datadog',
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc2.id,
        timestamp: hoursAfter(inc2DetectedAt, 0.5),
        entryType: 'ACTION_TAKEN',
        title: 'Failover initiated to secondary availability zone',
        description:
          'On-call SRE initiated Route 53 weighted failover to eu-west-1b. Full traffic migration completed within 12 minutes. AWS Health Dashboard confirmed eu-west-1a degradation.',
        visibility: 'INTERNAL',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc2.id,
        timestamp: hoursAfter(inc2DetectedAt, 2),
        entryType: 'COMMUNICATION',
        title: 'Merchant notification sent regarding processing delays',
        description:
          'Merchant-facing status page updated. Email notification dispatched to Tier 1 merchants advising of temporary processing delays and successful failover. No data loss reported.',
        visibility: 'MANAGEMENT',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc2.id,
        timestamp: inc2ClosedAt,
        entryType: 'STATUS_CHANGE',
        title: 'Post-incident review complete — incident closed',
        description:
          'AWS confirmed root cause as a fibre optic cable fault in the eu-west-1a data centre. ClearStream post-incident review identified improvements to multi-AZ failover automation. Incident closed.',
        visibility: 'MANAGEMENT',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
    ],
  });

  // ------------------------------------------
  // Incident 3: INC-2026-003 — Unauthorized API access attempt
  // ------------------------------------------
  const inc3DetectedAt = daysAgo(50);
  const inc3ClosedAt = daysAgo(42);

  const inc3 = await prisma.incident.create({
    data: {
      referenceNumber: 'INC-2026-003',
      title: 'Unauthorized API access attempt using stolen merchant credentials',
      description:
        'SIEM correlation rules detected a series of API authentication attempts using valid merchant credentials originating from an IP range in Eastern Europe not associated with the merchant account. The API gateway rate limiter and geo-blocking rules prevented any successful data access. Investigation confirmed the credentials were likely obtained from a third-party breach.',
      severity: 'HIGH',
      status: 'CLOSED',
      category: 'UNAUTHORIZED_ACCESS',
      source: 'SIEM',
      detectedAt: inc3DetectedAt,
      closedAt: inc3ClosedAt,
      reporterId: ctx.users.securityLead,
      handlerId: ctx.users.securityLead,
      incidentManagerId: ctx.users.ciso,
      isConfirmed: true,
      confidentialityBreach: false,
      integrityBreach: false,
      availabilityBreach: false,
      resolutionType: 'RESOLVED',
      evidencePreserved: true,
      rootCauseIdentified: true,
      lessonsLearnedCompleted: true,
      correctiveActionsIdentified: true,
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });

  // INC-003 Timeline (4 entries)
  await prisma.incidentTimelineEntry.createMany({
    data: [
      {
        incidentId: inc3.id,
        timestamp: inc3DetectedAt,
        entryType: 'STATUS_CHANGE',
        title: 'SIEM alert: anomalous API authentication pattern detected',
        description:
          'Splunk SIEM raised a high-confidence alert after detecting 1,240 failed API authentication attempts across 14 merchant accounts within a 20-minute window. Source IPs traced to an autonomous system in Romania.',
        visibility: 'INTERNAL',
        isAutomated: true,
        sourceSystem: 'Splunk',
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc3.id,
        timestamp: hoursAfter(inc3DetectedAt, 1),
        entryType: 'ACTION_TAKEN',
        title: 'Affected merchant API keys rotated and IP range blocked',
        description:
          'Security team rotated API keys for all 14 affected merchant accounts and added the offending /16 IP range to the WAF deny list. Affected merchants were contacted to verify their credential security posture.',
        visibility: 'INTERNAL',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc3.id,
        timestamp: hoursAfter(inc3DetectedAt, 24),
        entryType: 'ESCALATION',
        title: 'Escalated to CISO for regulatory assessment',
        description:
          'Incident escalated to CISO to determine whether notification obligations apply under DORA and GDPR. Assessment concluded that since no data was accessed, regulatory notification was not required but the event was logged in the DORA ICT incident register.',
        visibility: 'MANAGEMENT',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc3.id,
        timestamp: inc3ClosedAt,
        entryType: 'STATUS_CHANGE',
        title: 'Investigation complete — incident closed',
        description:
          'Forensic analysis confirmed zero successful authentications from the malicious source. Credential source traced to a public breach database. Mandatory API key rotation policy implemented for all merchants. Incident closed.',
        visibility: 'MANAGEMENT',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
    ],
  });

  // ------------------------------------------
  // Incident 4: INC-2026-004 — Merchant portal XSS
  // ------------------------------------------
  const inc4DetectedAt = daysAgo(40);
  const inc4ClosedAt = daysAgo(32);

  const inc4 = await prisma.incident.create({
    data: {
      referenceNumber: 'INC-2026-004',
      title: 'Merchant portal reflected XSS vulnerability exploited',
      description:
        'A merchant reported unusual behaviour in the ClearStream merchant self-service portal. Investigation revealed a reflected cross-site scripting (XSS) vulnerability in the transaction search parameter. Evidence suggests a limited exploitation attempt that injected a script to capture session tokens, though no merchant sessions were confirmed as hijacked.',
      severity: 'MEDIUM',
      status: 'CLOSED',
      category: 'UNAUTHORIZED_ACCESS',
      source: 'USER_REPORT',
      detectedAt: inc4DetectedAt,
      closedAt: inc4ClosedAt,
      reporterId: ctx.users.riskAnalyst,
      handlerId: ctx.users.securityLead,
      incidentManagerId: ctx.users.ciso,
      isConfirmed: true,
      confidentialityBreach: false,
      integrityBreach: true,
      availabilityBreach: false,
      resolutionType: 'RESOLVED',
      evidencePreserved: true,
      rootCauseIdentified: true,
      lessonsLearnedCompleted: false,
      correctiveActionsIdentified: true,
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });

  // INC-004 Timeline (3 entries)
  await prisma.incidentTimelineEntry.createMany({
    data: [
      {
        incidentId: inc4.id,
        timestamp: inc4DetectedAt,
        entryType: 'STATUS_CHANGE',
        title: 'Merchant reported suspicious portal behaviour',
        description:
          'A Tier 2 merchant contacted ClearStream support reporting that a transaction search URL received via email caused unexpected script execution in their browser. Support escalated to the security team.',
        visibility: 'INTERNAL',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc4.id,
        timestamp: hoursAfter(inc4DetectedAt, 4),
        entryType: 'ACTION_TAKEN',
        title: 'XSS vulnerability patched and WAF rules deployed',
        description:
          'Engineering team identified the reflected XSS in the /transactions/search endpoint. Input sanitisation was applied, and a Content Security Policy header was deployed. WAF rules updated to block XSS payloads. Hotfix deployed to production within 4 hours.',
        visibility: 'INTERNAL',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc4.id,
        timestamp: inc4ClosedAt,
        entryType: 'STATUS_CHANGE',
        title: 'Remediation verified — incident closed',
        description:
          'Penetration testing team verified the fix. Session token rotation was forced for all active merchant portal sessions. No evidence of session hijacking found in access logs. Incident closed.',
        visibility: 'MANAGEMENT',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
    ],
  });

  // ------------------------------------------
  // Incident 5: INC-2026-005 — USB drive in Dublin office
  // ------------------------------------------
  const inc5DetectedAt = daysAgo(30);
  const inc5ClosedAt = daysAgo(28);

  const inc5 = await prisma.incident.create({
    data: {
      referenceNumber: 'INC-2026-005',
      title: 'Unidentified USB drive found in Dublin office reception area',
      description:
        'A member of the facilities team found an unmarked USB drive in the reception area of the Dublin headquarters. Following the physical security incident procedure, the device was collected and submitted to the security team for forensic analysis. The USB drive contained only marketing materials from a recent industry conference and posed no threat.',
      severity: 'LOW',
      status: 'CLOSED',
      category: 'PHYSICAL',
      source: 'USER_REPORT',
      detectedAt: inc5DetectedAt,
      closedAt: inc5ClosedAt,
      reporterId: ctx.users.ismsManager,
      handlerId: ctx.users.securityLead,
      incidentManagerId: ctx.users.ciso,
      isConfirmed: true,
      confidentialityBreach: false,
      integrityBreach: false,
      availabilityBreach: false,
      resolutionType: 'FALSE_POSITIVE',
      evidencePreserved: true,
      rootCauseIdentified: true,
      lessonsLearnedCompleted: false,
      correctiveActionsIdentified: false,
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });

  // INC-005 Timeline (3 entries)
  await prisma.incidentTimelineEntry.createMany({
    data: [
      {
        incidentId: inc5.id,
        timestamp: inc5DetectedAt,
        entryType: 'STATUS_CHANGE',
        title: 'USB device reported by facilities team member',
        description:
          'Facilities coordinator found an unmarked USB flash drive on the reception desk and reported it to the security team per the physical security incident procedure. Device was placed in a tamper-evident evidence bag.',
        visibility: 'INTERNAL',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc5.id,
        timestamp: hoursAfter(inc5DetectedAt, 6),
        entryType: 'ACTION_TAKEN',
        title: 'Forensic analysis of USB device completed',
        description:
          'USB device was analysed in a sandboxed forensic workstation. The drive contained only PDF brochures and a PowerPoint presentation from the European Payments Summit 2025. No malicious payloads, autorun configurations, or suspicious files detected.',
        visibility: 'INTERNAL',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc5.id,
        timestamp: inc5ClosedAt,
        entryType: 'STATUS_CHANGE',
        title: 'Classified as false positive — incident closed',
        description:
          'USB device confirmed as benign conference material likely left by a visitor. Incident classified as false positive. Reminder sent to reception staff regarding visitor device policy. Incident closed.',
        visibility: 'INTERNAL',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
    ],
  });

  // ------------------------------------------
  // Incident 6: INC-2026-006 — Suspicious login pattern
  // ------------------------------------------
  const inc6DetectedAt = daysAgo(5);

  const inc6 = await prisma.incident.create({
    data: {
      referenceNumber: 'INC-2026-006',
      title: 'Suspicious login pattern from new geography for privileged account',
      description:
        'SIEM detected a successful login to the ClearStream admin portal from an IP address geolocated to Lagos, Nigeria. The account belongs to a Berlin-based infrastructure engineer who has no travel scheduled. MFA was satisfied, raising the possibility of a session token theft or MFA fatigue attack. Investigation is underway.',
      severity: 'MEDIUM',
      status: 'INVESTIGATING',
      category: 'UNAUTHORIZED_ACCESS',
      source: 'SIEM',
      detectedAt: inc6DetectedAt,
      reporterId: ctx.users.securityLead,
      handlerId: ctx.users.securityLead,
      incidentManagerId: ctx.users.ciso,
      isConfirmed: false,
      confidentialityBreach: false,
      integrityBreach: false,
      availabilityBreach: false,
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });

  // INC-006 Timeline (2 entries)
  await prisma.incidentTimelineEntry.createMany({
    data: [
      {
        incidentId: inc6.id,
        timestamp: inc6DetectedAt,
        entryType: 'STATUS_CHANGE',
        title: 'SIEM alert: impossible travel detected for admin account',
        description:
          'Splunk SIEM impossible travel rule triggered. Admin user authenticated from Berlin at 08:12 UTC and from Lagos at 08:47 UTC on the same day. Risk score calculated at 87/100.',
        visibility: 'INTERNAL',
        isAutomated: true,
        sourceSystem: 'Splunk',
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc6.id,
        timestamp: hoursAfter(inc6DetectedAt, 2),
        entryType: 'ACTION_TAKEN',
        title: 'Account sessions revoked and user contacted',
        description:
          'All active sessions for the affected admin account were revoked. MFA tokens were reset. The Berlin-based engineer was contacted and confirmed they did not travel or share credentials. Investigating potential session hijacking or VPN proxy usage.',
        visibility: 'INTERNAL',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
    ],
  });

  // ------------------------------------------
  // Incident 7: INC-2026-007 — DDoS attempt on payment API
  // ------------------------------------------
  const inc7DetectedAt = daysAgo(2);

  const inc7 = await prisma.incident.create({
    data: {
      referenceNumber: 'INC-2026-007',
      title: 'Distributed denial-of-service attack targeting payment API gateway',
      description:
        'A volumetric DDoS attack was detected targeting the primary payment API gateway endpoint. Peak traffic reached approximately 14 Gbps from a botnet comprising IoT devices across multiple geographies. AWS Shield Advanced mitigated the bulk of the traffic, but intermittent latency spikes were observed for legitimate transactions. Containment measures are actively being applied.',
      severity: 'HIGH',
      status: 'CONTAINING',
      category: 'DENIAL_OF_SERVICE',
      source: 'AUTOMATED',
      detectedAt: inc7DetectedAt,
      containedAt: null,
      reporterId: ctx.users.cto,
      handlerId: ctx.users.securityLead,
      incidentManagerId: ctx.users.ciso,
      isConfirmed: true,
      confidentialityBreach: false,
      integrityBreach: false,
      availabilityBreach: true,
      organisationId: ctx.orgId,
      createdById: ctx.users.securityLead,
    },
  });

  // INC-007 Timeline (3 entries)
  await prisma.incidentTimelineEntry.createMany({
    data: [
      {
        incidentId: inc7.id,
        timestamp: inc7DetectedAt,
        entryType: 'STATUS_CHANGE',
        title: 'DDoS attack detected by AWS Shield Advanced',
        description:
          'AWS Shield Advanced detected a volumetric DDoS attack on the /v2/payments endpoint. Traffic analysis showed UDP flood and HTTP GET flood vectors peaking at 14 Gbps. Automated mitigation engaged.',
        visibility: 'INTERNAL',
        isAutomated: true,
        sourceSystem: 'AWS Shield',
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc7.id,
        timestamp: hoursAfter(inc7DetectedAt, 1),
        entryType: 'ACTION_TAKEN',
        title: 'Additional rate limiting and geo-blocking rules deployed',
        description:
          'CloudFront WAF rules updated with stricter rate limiting thresholds. Geo-blocking applied for traffic from regions with no active merchants. AWS Support engaged for enhanced DDoS response team assistance.',
        visibility: 'INTERNAL',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
      {
        incidentId: inc7.id,
        timestamp: hoursAfter(inc7DetectedAt, 3),
        entryType: 'COMMUNICATION',
        title: 'Merchant advisory issued regarding potential latency',
        description:
          'Status page updated to "Degraded Performance" for the payments API. Direct notification sent to Tier 1 and Tier 2 merchants advising of potential intermittent latency. Internal Slack war room established for ongoing coordination.',
        visibility: 'MANAGEMENT',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
    ],
  });

  // ------------------------------------------
  // Incident 8: INC-2026-008 — Vendor DPA violation
  // ------------------------------------------
  const inc8DetectedAt = daysAgo(1);

  const inc8 = await prisma.incident.create({
    data: {
      referenceNumber: 'INC-2026-008',
      title: 'Vendor data processing agreement violation — transaction analytics provider',
      description:
        'ClearStream received a notification from its transaction analytics vendor indicating that a subset of anonymised transaction data was inadvertently processed in a US-based data centre, in violation of the data processing agreement which restricts processing to EU locations. The vendor has confirmed the data has been deleted from the non-EU facility. Assessment of GDPR implications is pending.',
      severity: 'MEDIUM',
      status: 'DETECTED',
      category: 'OTHER',
      source: 'THIRD_PARTY',
      detectedAt: inc8DetectedAt,
      reporterId: ctx.users.dpo,
      handlerId: ctx.users.complianceOfficer,
      incidentManagerId: ctx.users.ciso,
      isConfirmed: false,
      confidentialityBreach: false,
      integrityBreach: false,
      availabilityBreach: false,
      organisationId: ctx.orgId,
      createdById: ctx.users.complianceOfficer,
    },
  });

  // INC-008 Timeline (1 entry)
  await prisma.incidentTimelineEntry.createMany({
    data: [
      {
        incidentId: inc8.id,
        timestamp: inc8DetectedAt,
        entryType: 'NOTIFICATION_SENT',
        title: 'Vendor self-reported data processing agreement breach',
        description:
          'Transaction analytics vendor (DataInsight GmbH) proactively notified ClearStream that anonymised transaction data for the period 10-17 December was processed in their US-East-1 region due to a misconfigured data routing rule. The vendor confirmed immediate remediation and deletion of data from the US facility. DPO notified for GDPR impact assessment.',
        visibility: 'MANAGEMENT',
        isAutomated: false,
        createdById: ctx.users.securityLead,
      },
    ],
  });

  // ============================================
  // LESSONS LEARNED
  // ============================================

  // Lessons for INC-2026-001 (Phishing campaign) — 2 lessons
  await prisma.incidentLessonsLearned.createMany({
    data: [
      {
        incidentId: inc1.id,
        category: 'DETECTION',
        observation:
          'The email gateway correctly identified and quarantined the phishing campaign, but there was a propagation delay of approximately 18 minutes during which three emails reached user inboxes. This delay was caused by the quarantine rule distribution mechanism across regional email nodes.',
        recommendation:
          'Implement real-time push-based quarantine rule distribution across all email gateway nodes to eliminate propagation delay. Evaluate upgrading to the Proofpoint Adaptive Email Security module for sub-minute rule deployment.',
        status: 'IMPLEMENTED',
        priority: 2,
        targetDate: daysAgo(60),
        completedDate: daysAgo(62),
        assignedToId: ctx.users.securityLead,
        createdById: ctx.users.ciso,
      },
      {
        incidentId: inc1.id,
        category: 'PROCESS',
        observation:
          'Staff in the operations department had not completed the quarterly phishing awareness training at the time of the incident. The training completion rate for Q4 was only 72% for the operations team, below the organisational target of 95%.',
        recommendation:
          'Enforce mandatory completion of phishing awareness training with automated reminders at 7-day and 3-day intervals before deadline. Implement access restrictions for staff who fail to complete training within the compliance window.',
        status: 'IN_PROGRESS',
        priority: 2,
        targetDate: daysAgo(30),
        assignedToId: ctx.users.ismsManager,
        createdById: ctx.users.ciso,
      },
    ],
  });

  // Lessons for INC-2026-002 (AWS AZ degradation) — 2 lessons
  await prisma.incidentLessonsLearned.createMany({
    data: [
      {
        incidentId: inc2.id,
        category: 'RESPONSE',
        observation:
          'The automated failover to the secondary availability zone took 12 minutes, which exceeded the target RTO of 5 minutes defined in the business continuity plan. The delay was attributed to DNS TTL settings and health check intervals that were not optimised for rapid failover.',
        recommendation:
          'Reduce Route 53 health check interval from 30 seconds to 10 seconds and lower DNS TTL from 300 seconds to 60 seconds for the payment API endpoint. Implement active-active multi-AZ architecture to eliminate single-AZ dependency.',
        status: 'IN_PROGRESS',
        priority: 1,
        targetDate: daysAgo(20),
        assignedToId: ctx.users.cto,
        createdById: ctx.users.ciso,
      },
      {
        incidentId: inc2.id,
        category: 'TOOLING',
        observation:
          'The monitoring dashboard did not clearly display the AZ-level health status, which delayed the on-call engineer\'s initial diagnosis by approximately 4 minutes. The existing Datadog dashboards showed aggregate metrics but did not break down performance by availability zone.',
        recommendation:
          'Create dedicated AZ-level health dashboards in Datadog with real-time network, compute, and storage metrics per zone. Add AZ-specific alerting rules to enable faster root cause identification during infrastructure incidents.',
        status: 'IMPLEMENTED',
        priority: 2,
        targetDate: daysAgo(45),
        completedDate: daysAgo(48),
        assignedToId: ctx.users.securityLead,
        createdById: ctx.users.ciso,
      },
    ],
  });

  // Lessons for INC-2026-003 (Unauthorized API access) — 1 lesson
  await prisma.incidentLessonsLearned.createMany({
    data: [
      {
        incidentId: inc3.id,
        category: 'DETECTION',
        observation:
          'The SIEM correlation rule that detected the credential stuffing attack fired after 1,240 failed attempts had already been made. The threshold was set at 1,000 failed attempts within 30 minutes, which is too permissive for high-value API endpoints handling payment data.',
        recommendation:
          'Lower the SIEM detection threshold for merchant API authentication failures to 50 attempts within 5 minutes per source IP. Implement adaptive rate limiting at the API gateway level that dynamically adjusts based on historical baseline traffic for each merchant account.',
        status: 'IDENTIFIED',
        priority: 1,
        targetDate: daysAgo(10),
        assignedToId: ctx.users.securityLead,
        createdById: ctx.users.ciso,
      },
    ],
  });
}
