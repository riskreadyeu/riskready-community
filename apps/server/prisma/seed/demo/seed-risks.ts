import { PrismaClient } from '@prisma/client';
import { DemoContext } from './index';

export async function seedRisks(prisma: PrismaClient, ctx: DemoContext): Promise<void> {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // ============================================================
  // 15 RISKS
  // ============================================================

  const riskDefs = [
    {
      riskId: 'R-01',
      title: 'Ransomware attack on payment infrastructure',
      description:
        'Threat actors deploy ransomware targeting ClearStream payment processing systems, encrypting transaction databases and demanding cryptocurrency payment. A successful attack could halt all payment processing for 24-72 hours, affecting thousands of merchants and resulting in significant financial and reputational damage.',
      tier: 'CORE' as const,
      status: 'TREATING' as const,
      likelihood: 'LIKELY' as const,
      impact: 'SEVERE' as const,
      inherentScore: 20,
      residualScore: 9,
    },
    {
      riskId: 'R-02',
      title: 'Third-party payment processor outage',
      description:
        'ClearStream relies on upstream payment processors and card network gateways that may experience unplanned downtime. A prolonged outage at a critical third-party provider could cascade through the payment chain, preventing transaction settlement and causing SLA breaches with merchant clients.',
      tier: 'CORE' as const,
      status: 'ASSESSED' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MAJOR' as const,
      inherentScore: 12,
      residualScore: 8,
    },
    {
      riskId: 'R-03',
      title: 'Customer data breach via API vulnerability',
      description:
        'Exploitation of an API vulnerability in the merchant-facing payment gateway could expose cardholder data, PII, and transaction records. Given the volume of data processed daily, a breach could trigger PCI DSS non-compliance penalties and mandatory breach notification across multiple EU jurisdictions.',
      tier: 'CORE' as const,
      status: 'TREATING' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'SEVERE' as const,
      inherentScore: 15,
      residualScore: 10,
    },
    {
      riskId: 'R-04',
      title: 'Insider fraud in transaction processing',
      description:
        'A malicious insider with privileged access to transaction processing systems could manipulate payment routing, skim funds, or alter settlement amounts. The complexity of payment flows and volume of daily transactions could allow small-scale fraud to go undetected for extended periods.',
      tier: 'CORE' as const,
      status: 'ASSESSED' as const,
      likelihood: 'UNLIKELY' as const,
      impact: 'MAJOR' as const,
      inherentScore: 8,
      residualScore: 6,
    },
    {
      riskId: 'R-05',
      title: 'Regulatory non-compliance (DORA/NIS2)',
      description:
        'Failure to meet the requirements of the Digital Operational Resilience Act (DORA) and NIS2 Directive by their respective compliance deadlines. Non-compliance could result in administrative fines of up to 2% of global annual turnover and potential restrictions on operating within the EU financial services market.',
      tier: 'CORE' as const,
      status: 'TREATING' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MAJOR' as const,
      inherentScore: 12,
      residualScore: 8,
    },
    {
      riskId: 'R-06',
      title: 'DDoS attack during peak transaction period',
      description:
        'A distributed denial-of-service attack targeting payment APIs during high-volume periods such as Black Friday or end-of-month settlement windows. Even brief service degradation during peak periods could cause transaction timeouts, failed payments, and loss of merchant confidence.',
      tier: 'EXTENDED' as const,
      status: 'ASSESSED' as const,
      likelihood: 'LIKELY' as const,
      impact: 'MODERATE' as const,
      inherentScore: 12,
      residualScore: 6,
    },
    {
      riskId: 'R-07',
      title: 'Cloud infrastructure failure',
      description:
        'A major outage or data loss event in the primary cloud provider (AWS eu-west-1) hosting ClearStream production workloads. While multi-AZ redundancy is in place, a regional failure could exceed recovery capabilities and impact payment processing availability beyond acceptable RTO thresholds.',
      tier: 'EXTENDED' as const,
      status: 'ACCEPTED' as const,
      likelihood: 'UNLIKELY' as const,
      impact: 'MAJOR' as const,
      inherentScore: 8,
      residualScore: 4,
    },
    {
      riskId: 'R-08',
      title: 'Phishing campaign targeting finance team',
      description:
        'Sophisticated spear-phishing attacks directed at finance and treasury personnel with the goal of initiating fraudulent wire transfers or gaining access to banking credentials. Finance team members have elevated access to payment systems and bank account management tools.',
      tier: 'EXTENDED' as const,
      status: 'TREATING' as const,
      likelihood: 'LIKELY' as const,
      impact: 'MODERATE' as const,
      inherentScore: 12,
      residualScore: 8,
    },
    {
      riskId: 'R-09',
      title: 'Cryptographic key compromise',
      description:
        'Compromise of HSM-stored cryptographic keys used for transaction signing, TLS termination, or tokenisation. Key compromise could enable transaction forgery, man-in-the-middle attacks on payment flows, or decryption of stored cardholder data in violation of PCI DSS requirements.',
      tier: 'EXTENDED' as const,
      status: 'ASSESSED' as const,
      likelihood: 'RARE' as const,
      impact: 'SEVERE' as const,
      inherentScore: 5,
      residualScore: 3,
    },
    {
      riskId: 'R-10',
      title: 'Software supply chain attack',
      description:
        'Injection of malicious code through a compromised open-source dependency or build pipeline component. ClearStream uses hundreds of third-party libraries in its payment stack, and a supply chain compromise could introduce backdoors or data exfiltration capabilities into production systems.',
      tier: 'EXTENDED' as const,
      status: 'TREATING' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MAJOR' as const,
      inherentScore: 12,
      residualScore: 9,
    },
    {
      riskId: 'R-11',
      title: 'Business continuity failure',
      description:
        'Inability to maintain critical payment processing operations during a major disruptive event such as a pandemic, natural disaster, or civil unrest affecting key office locations. Failure to execute BCP effectively could result in extended service outages and breach of contractual SLAs with financial institution clients.',
      tier: 'EXTENDED' as const,
      status: 'ASSESSED' as const,
      likelihood: 'UNLIKELY' as const,
      impact: 'SEVERE' as const,
      inherentScore: 10,
      residualScore: 6,
    },
    {
      riskId: 'R-12',
      title: 'Privilege escalation in merchant portal',
      description:
        'A vulnerability in the merchant self-service portal allowing a standard merchant user to escalate privileges and access other merchants\' transaction data, settlement reports, or configuration settings. This could lead to cross-merchant data leakage and PCI DSS scope violations.',
      tier: 'ADVANCED' as const,
      status: 'ASSESSED' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MODERATE' as const,
      inherentScore: 9,
      residualScore: 6,
    },
    {
      riskId: 'R-13',
      title: 'AI model poisoning in fraud detection',
      description:
        'Adversarial manipulation of the machine learning models used for real-time fraud detection, causing the system to misclassify fraudulent transactions as legitimate. An attacker with knowledge of the model training pipeline could systematically degrade detection accuracy over time.',
      tier: 'ADVANCED' as const,
      status: 'IDENTIFIED' as const,
      likelihood: 'UNLIKELY' as const,
      impact: 'MAJOR' as const,
      inherentScore: 8,
      residualScore: 8,
    },
    {
      riskId: 'R-14',
      title: 'Cross-border data transfer violation',
      description:
        'Unlawful transfer of personal and financial data between EU and non-EU jurisdictions without adequate safeguards under GDPR and local data protection regulations. ClearStream processes transactions across 12 EU member states and relies on data mirroring to US-based analytics platforms.',
      tier: 'ADVANCED' as const,
      status: 'TREATING' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MODERATE' as const,
      inherentScore: 9,
      residualScore: 6,
    },
    {
      riskId: 'R-15',
      title: 'Shadow IT in engineering teams',
      description:
        'Use of unsanctioned SaaS tools, code repositories, and cloud services by engineering teams outside of approved procurement and security review processes. Shadow IT creates unmonitored attack surfaces and potential data leakage paths that bypass security controls and compliance monitoring.',
      tier: 'ADVANCED' as const,
      status: 'ASSESSED' as const,
      likelihood: 'LIKELY' as const,
      impact: 'MINOR' as const,
      inherentScore: 8,
      residualScore: 6,
    },
  ];

  for (const def of riskDefs) {
    const risk = await prisma.risk.create({
      data: {
        riskId: def.riskId,
        title: def.title,
        description: def.description,
        tier: def.tier,
        status: def.status,
        likelihood: def.likelihood,
        impact: def.impact,
        inherentScore: def.inherentScore,
        residualScore: def.residualScore,
        organisationId: ctx.orgId,
        createdById: ctx.users.ciso,
      },
    });
    ctx.riskIds[def.riskId] = risk.id;
  }

  // ============================================================
  // 30 RISK SCENARIOS (2 per risk)
  // ============================================================
  // Distribution targets: 3 critical (15-25), 7 high (10-14), 12 medium (5-9), 8 low (1-4)

  const scenarioDefs = [
    // R-01 scenarios
    {
      scenarioId: 'R-01-S01',
      riskRef: 'R-01',
      title: 'Ransomware via phishing email to payment ops team',
      cause: 'Payment operations staff member opens a malicious email attachment containing ransomware dropper disguised as a settlement report.',
      event: 'Ransomware payload executes, encrypts payment processing databases and transaction logs, and propagates laterally to connected systems.',
      consequence: 'Complete payment processing halt for 48-72 hours, potential data loss of in-flight transactions, regulatory notification requirements, and ransom demand.',
      status: 'TREATING' as const,
      likelihood: 'LIKELY' as const,
      impact: 'SEVERE' as const,
      inherentScore: 20,
      residualLikelihood: 'POSSIBLE' as const,
      residualImpact: 'MAJOR' as const,
      residualScore: 12,
      f1ThreatFrequency: 4,
      f2ControlEffectiveness: 3,
      f3GapVulnerability: 4,
    },
    {
      scenarioId: 'R-01-S02',
      riskRef: 'R-01',
      title: 'Ransomware via compromised vendor VPN access',
      cause: 'Third-party maintenance vendor credentials are compromised through credential stuffing, granting VPN access to the internal network.',
      event: 'Attacker uses vendor VPN tunnel to deploy ransomware across payment infrastructure, targeting backup systems first to prevent recovery.',
      consequence: 'Extended outage exceeding 72 hours due to backup encryption, significant data recovery costs, and loss of merchant trust.',
      status: 'MONITORING' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MAJOR' as const,
      inherentScore: 12,
      residualLikelihood: 'UNLIKELY' as const,
      residualImpact: 'MODERATE' as const,
      residualScore: 6,
      f1ThreatFrequency: 3,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 3,
    },
    // R-02 scenarios
    {
      scenarioId: 'R-02-S01',
      riskRef: 'R-02',
      title: 'Primary card network gateway prolonged outage',
      cause: 'Major card network provider experiences a catastrophic infrastructure failure affecting their European processing centre.',
      event: 'All card transactions routed through the primary gateway fail, and failover to the secondary processor takes longer than the 15-minute RTO.',
      consequence: 'Transaction failures for 2-4 hours during peak period, merchant SLA breaches, and estimated revenue loss of EUR 500K per hour of downtime.',
      status: 'ASSESSED' as const,
      likelihood: 'LIKELY' as const,
      impact: 'MAJOR' as const,
      inherentScore: 16,
      residualLikelihood: 'UNLIKELY' as const,
      residualImpact: 'MAJOR' as const,
      residualScore: 8,
      f1ThreatFrequency: 4,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 3,
    },
    {
      scenarioId: 'R-02-S02',
      riskRef: 'R-02',
      title: 'Settlement processor data corruption event',
      cause: 'Software bug at the settlement processor causes transaction data corruption during batch processing.',
      event: 'Corrupted settlement files are distributed to acquiring banks, causing reconciliation failures across the merchant portfolio.',
      consequence: 'Multi-day settlement delays, manual reconciliation effort, potential regulatory scrutiny, and merchant compensation claims.',
      status: 'DRAFT' as const,
      likelihood: 'RARE' as const,
      impact: 'MODERATE' as const,
      inherentScore: 3,
      residualLikelihood: 'RARE' as const,
      residualImpact: 'MODERATE' as const,
      residualScore: 3,
      f1ThreatFrequency: 1,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 2,
    },
    // R-03 scenarios
    {
      scenarioId: 'R-03-S01',
      riskRef: 'R-03',
      title: 'SQL injection in payment API endpoint',
      cause: 'Insufficient input validation on the merchant transaction query API allows crafted SQL injection payloads.',
      event: 'Attacker extracts cardholder data, transaction history, and merchant credentials from the production database through the vulnerable endpoint.',
      consequence: 'Breach of 500K+ cardholder records, mandatory PCI forensic investigation, potential card brand fines of EUR 5-25M, and loss of PCI DSS certification.',
      status: 'TREATING' as const,
      likelihood: 'LIKELY' as const,
      impact: 'SEVERE' as const,
      inherentScore: 20,
      residualLikelihood: 'UNLIKELY' as const,
      residualImpact: 'SEVERE' as const,
      residualScore: 10,
      f1ThreatFrequency: 4,
      f2ControlEffectiveness: 3,
      f3GapVulnerability: 3,
    },
    {
      scenarioId: 'R-03-S02',
      riskRef: 'R-03',
      title: 'Broken authentication on merchant onboarding API',
      cause: 'JWT token validation flaw in the merchant onboarding API allows token forgery and session hijacking.',
      event: 'Attacker forges authentication tokens to access multiple merchant accounts and exfiltrate stored payment credentials and customer PII.',
      consequence: 'Cross-merchant data exposure, regulatory fines under GDPR Article 83, and mandatory 72-hour breach notification to DPAs across affected jurisdictions.',
      status: 'ASSESSED' as const,
      likelihood: 'UNLIKELY' as const,
      impact: 'MAJOR' as const,
      inherentScore: 8,
      residualLikelihood: 'RARE' as const,
      residualImpact: 'MAJOR' as const,
      residualScore: 4,
      f1ThreatFrequency: 3,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 2,
    },
    // R-04 scenarios
    {
      scenarioId: 'R-04-S01',
      riskRef: 'R-04',
      title: 'Privileged admin manipulates settlement amounts',
      cause: 'Database administrator with direct production access modifies settlement batch amounts to redirect funds to a controlled account.',
      event: 'Small amounts are systematically skimmed from high-volume merchant settlements over a period of months, evading standard reconciliation checks.',
      consequence: 'Cumulative financial loss of EUR 200-500K before detection, regulatory investigation, and erosion of merchant trust in settlement accuracy.',
      status: 'ASSESSED' as const,
      likelihood: 'UNLIKELY' as const,
      impact: 'MAJOR' as const,
      inherentScore: 8,
      residualLikelihood: 'RARE' as const,
      residualImpact: 'MODERATE' as const,
      residualScore: 3,
      f1ThreatFrequency: 2,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 3,
    },
    {
      scenarioId: 'R-04-S02',
      riskRef: 'R-04',
      title: 'Support agent accesses cardholder data for sale',
      cause: 'Customer support agent with elevated access to transaction lookup tools copies cardholder data for sale on dark web markets.',
      event: 'Bulk extraction of cardholder names, PANs, and transaction details via support tool screenshots and manual data export over several weeks.',
      consequence: 'Data breach affecting thousands of cardholders, PCI DSS compliance failure, potential card brand penalties, and criminal prosecution.',
      status: 'EVALUATED' as const,
      likelihood: 'RARE' as const,
      impact: 'MODERATE' as const,
      inherentScore: 3,
      residualLikelihood: 'RARE' as const,
      residualImpact: 'MINOR' as const,
      residualScore: 2,
      f1ThreatFrequency: 1,
      f2ControlEffectiveness: 3,
      f3GapVulnerability: 2,
    },
    // R-05 scenarios
    {
      scenarioId: 'R-05-S01',
      riskRef: 'R-05',
      title: 'DORA ICT risk management framework gap',
      cause: 'Incomplete implementation of DORA Article 6 ICT risk management framework requirements ahead of the January 2025 compliance deadline.',
      event: 'Regulatory examination identifies material gaps in ICT risk governance, third-party oversight, and incident reporting capabilities.',
      consequence: 'Administrative fine up to 1% of average daily worldwide turnover, remediation order with tight deadlines, and increased supervisory scrutiny.',
      status: 'TREATING' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MAJOR' as const,
      inherentScore: 12,
      residualLikelihood: 'UNLIKELY' as const,
      residualImpact: 'MAJOR' as const,
      residualScore: 8,
      f1ThreatFrequency: 3,
      f2ControlEffectiveness: 3,
      f3GapVulnerability: 3,
    },
    {
      scenarioId: 'R-05-S02',
      riskRef: 'R-05',
      title: 'NIS2 incident reporting failure',
      cause: 'Lack of automated incident classification and reporting workflows aligned with NIS2 Directive notification timelines.',
      event: 'A significant security incident occurs but is not reported to the national CSIRT within the mandatory 24-hour early warning and 72-hour notification windows.',
      consequence: 'NIS2 enforcement action with fines up to EUR 10M or 2% of global turnover, public disclosure of the reporting failure, and loss of essential entity status.',
      status: 'ACCEPTED' as const,
      likelihood: 'RARE' as const,
      impact: 'MAJOR' as const,
      inherentScore: 4,
      residualLikelihood: 'RARE' as const,
      residualImpact: 'MODERATE' as const,
      residualScore: 3,
      f1ThreatFrequency: 1,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 3,
    },
    // R-06 scenarios
    {
      scenarioId: 'R-06-S01',
      riskRef: 'R-06',
      title: 'Volumetric DDoS exceeding mitigation capacity',
      cause: 'Botnet launches a multi-vector DDoS attack exceeding 500 Gbps against ClearStream payment API endpoints during Black Friday.',
      event: 'DDoS mitigation service capacity is overwhelmed, causing payment API latency to exceed 30 seconds and transaction timeouts across all merchants.',
      consequence: 'Four hours of degraded service during the highest transaction volume day, estimated revenue impact of EUR 2M, and merchant compensation claims.',
      status: 'ASSESSED' as const,
      likelihood: 'LIKELY' as const,
      impact: 'MODERATE' as const,
      inherentScore: 12,
      residualLikelihood: 'POSSIBLE' as const,
      residualImpact: 'MINOR' as const,
      residualScore: 6,
      f1ThreatFrequency: 4,
      f2ControlEffectiveness: 3,
      f3GapVulnerability: 3,
    },
    {
      scenarioId: 'R-06-S02',
      riskRef: 'R-06',
      title: 'Application-layer DDoS on authentication service',
      cause: 'Sophisticated application-layer attack targets the merchant authentication and token refresh endpoints with legitimate-looking requests.',
      event: 'Authentication service becomes saturated, preventing legitimate merchants from obtaining session tokens and processing transactions.',
      consequence: 'Widespread merchant lockout for 1-2 hours, customer complaints, and need for emergency rate limiting that may affect legitimate high-volume merchants.',
      status: 'MONITORING' as const,
      likelihood: 'UNLIKELY' as const,
      impact: 'MINOR' as const,
      inherentScore: 4,
      residualLikelihood: 'RARE' as const,
      residualImpact: 'MINOR' as const,
      residualScore: 2,
      f1ThreatFrequency: 2,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 2,
    },
    // R-07 scenarios
    {
      scenarioId: 'R-07-S01',
      riskRef: 'R-07',
      title: 'AWS eu-west-1 regional outage exceeding 4 hours',
      cause: 'Major AWS infrastructure failure affects the entire eu-west-1 region including all availability zones simultaneously.',
      event: 'All production services become unavailable, and cross-region failover to eu-central-1 activates but encounters configuration drift issues.',
      consequence: 'Payment processing downtime of 4-8 hours, data consistency challenges during failover, and potential transaction loss for in-flight payments.',
      status: 'ACCEPTED' as const,
      likelihood: 'RARE' as const,
      impact: 'MAJOR' as const,
      inherentScore: 4,
      residualLikelihood: 'RARE' as const,
      residualImpact: 'MODERATE' as const,
      residualScore: 3,
      f1ThreatFrequency: 1,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 2,
    },
    {
      scenarioId: 'R-07-S02',
      riskRef: 'R-07',
      title: 'Cloud storage service data durability failure',
      cause: 'S3 storage service experiences a rare data durability failure affecting objects stored in the primary region.',
      event: 'Transaction archive data and merchant configuration files become partially corrupted or inaccessible.',
      consequence: 'Loss of historical transaction records required for regulatory audit, need for manual data reconstruction from backup sources.',
      status: 'ACCEPTED' as const,
      likelihood: 'RARE' as const,
      impact: 'MINOR' as const,
      inherentScore: 2,
      residualLikelihood: 'RARE' as const,
      residualImpact: 'NEGLIGIBLE' as const,
      residualScore: 1,
      f1ThreatFrequency: 1,
      f2ControlEffectiveness: 1,
      f3GapVulnerability: 1,
    },
    // R-08 scenarios
    {
      scenarioId: 'R-08-S01',
      riskRef: 'R-08',
      title: 'CEO fraud targeting CFO for wire transfer',
      cause: 'Attacker researches ClearStream executive team and crafts a convincing impersonation of the CEO requesting an urgent wire transfer.',
      event: 'CFO receives a spoofed email appearing to come from the CEO directing an immediate EUR 500K wire transfer to a purported acquisition escrow account.',
      consequence: 'If successful, direct financial loss of EUR 500K, reputational damage, and need for enhanced dual-authorisation controls on all wire transfers.',
      status: 'TREATING' as const,
      likelihood: 'LIKELY' as const,
      impact: 'MODERATE' as const,
      inherentScore: 12,
      residualLikelihood: 'POSSIBLE' as const,
      residualImpact: 'MODERATE' as const,
      residualScore: 9,
      f1ThreatFrequency: 4,
      f2ControlEffectiveness: 3,
      f3GapVulnerability: 3,
    },
    {
      scenarioId: 'R-08-S02',
      riskRef: 'R-08',
      title: 'Credential harvesting via fake SSO portal',
      cause: 'Phishing email directs finance team members to a cloned single sign-on portal that captures corporate credentials.',
      event: 'Multiple finance team credentials are harvested and used to access internal financial systems and payment administration tools.',
      consequence: 'Unauthorised access to treasury systems, potential for fraudulent payment initiation, and requirement to reset credentials across all finance applications.',
      status: 'ASSESSED' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MODERATE' as const,
      inherentScore: 9,
      residualLikelihood: 'UNLIKELY' as const,
      residualImpact: 'MINOR' as const,
      residualScore: 4,
      f1ThreatFrequency: 3,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 3,
    },
    // R-09 scenarios
    {
      scenarioId: 'R-09-S01',
      riskRef: 'R-09',
      title: 'HSM firmware vulnerability enables key extraction',
      cause: 'A zero-day vulnerability in the HSM firmware allows an attacker with physical or remote administrative access to extract stored private keys.',
      event: 'Transaction signing keys are extracted from the HSM, enabling the attacker to forge signed payment messages and bypass integrity checks.',
      consequence: 'Potential for large-scale transaction forgery, complete loss of trust in payment message integrity, and need for emergency key rotation across all systems.',
      status: 'ASSESSED' as const,
      likelihood: 'RARE' as const,
      impact: 'SEVERE' as const,
      inherentScore: 5,
      residualLikelihood: 'RARE' as const,
      residualImpact: 'MAJOR' as const,
      residualScore: 4,
      f1ThreatFrequency: 1,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 1,
    },
    {
      scenarioId: 'R-09-S02',
      riskRef: 'R-09',
      title: 'TLS certificate private key compromise via backup exposure',
      cause: 'Automated backup process inadvertently includes unencrypted TLS private key material in a storage bucket with overly permissive access controls.',
      event: 'Attacker discovers and downloads the exposed private keys, enabling man-in-the-middle interception of payment API traffic.',
      consequence: 'Interception of cardholder data in transit, PCI DSS non-compliance, emergency certificate revocation and reissuance across all endpoints.',
      status: 'EVALUATED' as const,
      likelihood: 'RARE' as const,
      impact: 'MODERATE' as const,
      inherentScore: 3,
      residualLikelihood: 'RARE' as const,
      residualImpact: 'MINOR' as const,
      residualScore: 2,
      f1ThreatFrequency: 1,
      f2ControlEffectiveness: 1,
      f3GapVulnerability: 2,
    },
    // R-10 scenarios
    {
      scenarioId: 'R-10-S01',
      riskRef: 'R-10',
      title: 'Malicious npm package in payment SDK dependency tree',
      cause: 'A widely-used npm package in the payment SDK dependency tree is compromised by an attacker who publishes a malicious version.',
      event: 'The compromised package exfiltrates environment variables including database credentials and API keys during the CI/CD build process.',
      consequence: 'Full production credential exposure, potential for follow-on attacks using stolen credentials, and need for comprehensive secret rotation.',
      status: 'TREATING' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MAJOR' as const,
      inherentScore: 12,
      residualLikelihood: 'UNLIKELY' as const,
      residualImpact: 'MAJOR' as const,
      residualScore: 8,
      f1ThreatFrequency: 3,
      f2ControlEffectiveness: 3,
      f3GapVulnerability: 3,
    },
    {
      scenarioId: 'R-10-S02',
      riskRef: 'R-10',
      title: 'Compromised CI/CD pipeline injects backdoor',
      cause: 'Attacker gains access to the CI/CD platform and modifies build scripts to inject a backdoor into the payment processing microservice.',
      event: 'Backdoored code is deployed to production through the normal release pipeline, bypassing code review due to pipeline-level injection.',
      consequence: 'Persistent backdoor access to production payment systems, potential for ongoing data exfiltration, and need for full supply chain audit.',
      status: 'ASSESSED' as const,
      likelihood: 'UNLIKELY' as const,
      impact: 'MAJOR' as const,
      inherentScore: 8,
      residualLikelihood: 'UNLIKELY' as const,
      residualImpact: 'MODERATE' as const,
      residualScore: 6,
      f1ThreatFrequency: 2,
      f2ControlEffectiveness: 3,
      f3GapVulnerability: 2,
    },
    // R-11 scenarios
    {
      scenarioId: 'R-11-S01',
      riskRef: 'R-11',
      title: 'Pandemic forces simultaneous site closures',
      cause: 'A new pandemic variant forces government-mandated closure of all three ClearStream office locations simultaneously.',
      event: 'Key operational staff cannot access secure facilities required for HSM operations, certificate management, and incident response.',
      consequence: 'Degraded operational capability for 2-4 weeks, inability to perform key management operations, and reliance on untested remote procedures.',
      status: 'ASSESSED' as const,
      likelihood: 'UNLIKELY' as const,
      impact: 'MAJOR' as const,
      inherentScore: 8,
      residualLikelihood: 'UNLIKELY' as const,
      residualImpact: 'MODERATE' as const,
      residualScore: 6,
      f1ThreatFrequency: 2,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 3,
    },
    {
      scenarioId: 'R-11-S02',
      riskRef: 'R-11',
      title: 'Dublin data centre power and cooling failure',
      cause: 'Extended power grid failure combined with backup generator malfunction at the Dublin co-location facility housing on-premises HSM infrastructure.',
      event: 'HSM and key management infrastructure becomes unavailable, preventing transaction signing and new key generation operations.',
      consequence: 'Payment signing operations halt for 12-24 hours until mobile HSM units are deployed, affecting all merchants requiring real-time authorisation.',
      status: 'MONITORING' as const,
      likelihood: 'UNLIKELY' as const,
      impact: 'MODERATE' as const,
      inherentScore: 6,
      residualLikelihood: 'RARE' as const,
      residualImpact: 'MINOR' as const,
      residualScore: 2,
      f1ThreatFrequency: 2,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 2,
    },
    // R-12 scenarios
    {
      scenarioId: 'R-12-S01',
      riskRef: 'R-12',
      title: 'IDOR vulnerability exposes merchant transaction data',
      cause: 'Insecure direct object reference in the merchant portal allows manipulation of transaction IDs in API requests.',
      event: 'A merchant discovers they can view transaction details of other merchants by modifying transaction ID parameters in the portal URL.',
      consequence: 'Cross-merchant data exposure, breach notification to affected merchants, and emergency patch deployment to the merchant portal.',
      status: 'TREATING' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MODERATE' as const,
      inherentScore: 9,
      residualLikelihood: 'UNLIKELY' as const,
      residualImpact: 'MODERATE' as const,
      residualScore: 6,
      f1ThreatFrequency: 3,
      f2ControlEffectiveness: 3,
      f3GapVulnerability: 3,
    },
    {
      scenarioId: 'R-12-S02',
      riskRef: 'R-12',
      title: 'Role bypass in merchant admin panel',
      cause: 'Missing server-side authorisation check on merchant portal admin endpoints allows standard users to access admin-only functions.',
      event: 'A merchant user accesses admin functions including user management, API key rotation, and webhook configuration for their merchant account.',
      consequence: 'Potential for unauthorised API key generation, webhook redirection for data interception, and merchant account takeover.',
      status: 'ASSESSED' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MODERATE' as const,
      inherentScore: 9,
      residualLikelihood: 'RARE' as const,
      residualImpact: 'MINOR' as const,
      residualScore: 2,
      f1ThreatFrequency: 3,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 3,
    },
    // R-13 scenarios
    {
      scenarioId: 'R-13-S01',
      riskRef: 'R-13',
      title: 'Training data poisoning via compromised data pipeline',
      cause: 'Attacker gains access to the fraud detection model training data pipeline and injects carefully crafted adversarial samples.',
      event: 'Retrained fraud model learns to classify specific fraud patterns as legitimate, creating blind spots in real-time detection.',
      consequence: 'Increased fraud losses over several months before detection, estimated EUR 1-3M in undetected fraudulent transactions.',
      status: 'DRAFT' as const,
      likelihood: 'UNLIKELY' as const,
      impact: 'MAJOR' as const,
      inherentScore: 8,
      residualLikelihood: 'UNLIKELY' as const,
      residualImpact: 'MAJOR' as const,
      residualScore: 8,
      f1ThreatFrequency: 2,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 2,
    },
    {
      scenarioId: 'R-13-S02',
      riskRef: 'R-13',
      title: 'Adversarial evasion of real-time fraud scoring',
      cause: 'Sophisticated fraud ring reverse-engineers the fraud detection model behaviour through systematic probing of the transaction API.',
      event: 'Fraud ring develops transaction patterns that consistently score below the fraud threshold, enabling large-scale card-not-present fraud.',
      consequence: 'Significant increase in chargebacks, merchant losses, and potential loss of card brand certification for fraud monitoring compliance.',
      status: 'DRAFT' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MAJOR' as const,
      inherentScore: 12,
      residualLikelihood: 'UNLIKELY' as const,
      residualImpact: 'MODERATE' as const,
      residualScore: 6,
      f1ThreatFrequency: 3,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 3,
    },
    // R-14 scenarios
    {
      scenarioId: 'R-14-S01',
      riskRef: 'R-14',
      title: 'Schrems II invalidation of US analytics data transfer',
      cause: 'EU regulatory authority challenges the legal basis for transferring transaction analytics data to the US-based fraud analytics platform.',
      event: 'DPA issues an enforcement notice requiring immediate suspension of data transfers to the US analytics provider pending adequacy review.',
      consequence: 'Loss of real-time fraud analytics capability, need for emergency migration to EU-hosted analytics, and potential GDPR fine.',
      status: 'TREATING' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MODERATE' as const,
      inherentScore: 9,
      residualLikelihood: 'UNLIKELY' as const,
      residualImpact: 'MODERATE' as const,
      residualScore: 6,
      f1ThreatFrequency: 3,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 3,
    },
    {
      scenarioId: 'R-14-S02',
      riskRef: 'R-14',
      title: 'Inadvertent PII transfer via logging infrastructure',
      cause: 'Application logging configuration inadvertently captures and transmits PII to a centralised logging platform hosted outside the EU.',
      event: 'Audit reveals that cardholder names and partial PANs are being logged and replicated to a US-based log aggregation service.',
      consequence: 'GDPR Article 44 violation, mandatory breach notification, remediation of logging configuration, and potential fine of up to EUR 20M.',
      status: 'ASSESSED' as const,
      likelihood: 'UNLIKELY' as const,
      impact: 'MINOR' as const,
      inherentScore: 4,
      residualLikelihood: 'RARE' as const,
      residualImpact: 'MINOR' as const,
      residualScore: 2,
      f1ThreatFrequency: 2,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 2,
    },
    // R-15 scenarios
    {
      scenarioId: 'R-15-S01',
      riskRef: 'R-15',
      title: 'Engineers using unapproved SaaS code collaboration tool',
      cause: 'Engineering teams adopt a third-party code collaboration platform without going through the security review and vendor assessment process.',
      event: 'Proprietary payment processing source code and internal API documentation are uploaded to the unapproved platform.',
      consequence: 'Potential intellectual property exposure, unmonitored data leakage channel, and violation of ClearStream data classification policy.',
      status: 'ASSESSED' as const,
      likelihood: 'LIKELY' as const,
      impact: 'MINOR' as const,
      inherentScore: 8,
      residualLikelihood: 'POSSIBLE' as const,
      residualImpact: 'MINOR' as const,
      residualScore: 6,
      f1ThreatFrequency: 4,
      f2ControlEffectiveness: 2,
      f3GapVulnerability: 3,
    },
    {
      scenarioId: 'R-15-S02',
      riskRef: 'R-15',
      title: 'Personal cloud storage used for production credentials',
      cause: 'Developer stores production database credentials and API keys in a personal cloud storage account for convenience.',
      event: 'Personal cloud account is compromised through credential reuse, exposing production credentials to an attacker.',
      consequence: 'Production credential exposure, emergency secret rotation, potential unauthorised access to payment databases, and disciplinary action.',
      status: 'EVALUATED' as const,
      likelihood: 'POSSIBLE' as const,
      impact: 'MAJOR' as const,
      inherentScore: 12,
      residualLikelihood: 'UNLIKELY' as const,
      residualImpact: 'MINOR' as const,
      residualScore: 4,
      f1ThreatFrequency: 3,
      f2ControlEffectiveness: 3,
      f3GapVulnerability: 3,
    },
  ];

  for (const def of scenarioDefs) {
    const scenario = await prisma.riskScenario.create({
      data: {
        scenarioId: def.scenarioId,
        title: def.title,
        cause: def.cause,
        event: def.event,
        consequence: def.consequence,
        status: def.status,
        likelihood: def.likelihood,
        impact: def.impact,
        inherentScore: def.inherentScore,
        residualLikelihood: def.residualLikelihood,
        residualImpact: def.residualImpact,
        residualScore: def.residualScore,
        f1ThreatFrequency: def.f1ThreatFrequency,
        f2ControlEffectiveness: def.f2ControlEffectiveness,
        f3GapVulnerability: def.f3GapVulnerability,
        riskId: ctx.riskIds[def.riskRef]!,
        createdById: ctx.users.ciso,
      },
    });
    ctx.scenarioIds[def.scenarioId] = scenario.id;
  }

  // ============================================================
  // 8 KRIs WITH 3 MONTHS OF HISTORY
  // ============================================================

  // KRI-001: Patch compliance rate
  const kri001 = await prisma.keyRiskIndicator.create({
    data: {
      kriId: 'KRI-001',
      name: 'Patch compliance rate',
      description: 'Percentage of critical and high-severity patches applied within the defined SLA window across all payment infrastructure systems.',
      unit: '%',
      thresholdGreen: '>=95%',
      thresholdAmber: '80-94%',
      thresholdRed: '<80%',
      currentValue: '96',
      status: 'GREEN',
      trend: 'STABLE',
      frequency: 'MONTHLY',
      lastMeasured: now,
      riskId: ctx.riskIds['R-01']!,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.kRIHistory.create({
    data: {
      value: '94',
      status: 'AMBER',
      measuredAt: threeMonthsAgo,
      kriId: kri001.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '95',
      status: 'GREEN',
      measuredAt: twoMonthsAgo,
      kriId: kri001.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '96',
      status: 'GREEN',
      measuredAt: oneMonthAgo,
      kriId: kri001.id,
    },
  });

  // KRI-002: Mean time to detect incidents
  const kri002 = await prisma.keyRiskIndicator.create({
    data: {
      kriId: 'KRI-002',
      name: 'Mean time to detect incidents',
      description: 'Average elapsed time from initial compromise or incident occurrence to detection by security monitoring systems or personnel.',
      unit: 'Hours',
      thresholdGreen: '<=2h',
      thresholdAmber: '2-6h',
      thresholdRed: '>6h',
      currentValue: '4.2',
      status: 'AMBER',
      trend: 'IMPROVING',
      frequency: 'MONTHLY',
      lastMeasured: now,
      riskId: ctx.riskIds['R-03']!,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.kRIHistory.create({
    data: {
      value: '7.8',
      status: 'RED',
      measuredAt: threeMonthsAgo,
      kriId: kri002.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '5.5',
      status: 'AMBER',
      measuredAt: twoMonthsAgo,
      kriId: kri002.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '4.2',
      status: 'AMBER',
      measuredAt: oneMonthAgo,
      kriId: kri002.id,
    },
  });

  // KRI-003: Failed login attempts per day
  const kri003 = await prisma.keyRiskIndicator.create({
    data: {
      kriId: 'KRI-003',
      name: 'Failed login attempts per day',
      description: 'Average number of failed authentication attempts per day across all ClearStream systems, indicating potential brute-force or credential stuffing activity.',
      unit: 'Count',
      thresholdGreen: '<=20',
      thresholdAmber: '21-50',
      thresholdRed: '>50',
      currentValue: '12',
      status: 'GREEN',
      trend: 'STABLE',
      frequency: 'MONTHLY',
      lastMeasured: now,
      riskId: ctx.riskIds['R-04']!,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.kRIHistory.create({
    data: {
      value: '15',
      status: 'GREEN',
      measuredAt: threeMonthsAgo,
      kriId: kri003.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '14',
      status: 'GREEN',
      measuredAt: twoMonthsAgo,
      kriId: kri003.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '12',
      status: 'GREEN',
      measuredAt: oneMonthAgo,
      kriId: kri003.id,
    },
  });

  // KRI-004: Vulnerability scan pass rate
  const kri004 = await prisma.keyRiskIndicator.create({
    data: {
      kriId: 'KRI-004',
      name: 'Vulnerability scan pass rate',
      description: 'Percentage of systems passing vulnerability scans without critical or high-severity findings during the monthly assessment cycle.',
      unit: '%',
      thresholdGreen: '>=95%',
      thresholdAmber: '80-94%',
      thresholdRed: '<80%',
      currentValue: '87',
      status: 'AMBER',
      trend: 'IMPROVING',
      frequency: 'MONTHLY',
      lastMeasured: now,
      riskId: ctx.riskIds['R-03']!,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.kRIHistory.create({
    data: {
      value: '78',
      status: 'RED',
      measuredAt: threeMonthsAgo,
      kriId: kri004.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '82',
      status: 'AMBER',
      measuredAt: twoMonthsAgo,
      kriId: kri004.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '87',
      status: 'AMBER',
      measuredAt: oneMonthAgo,
      kriId: kri004.id,
    },
  });

  // KRI-005: Security training completion
  const kri005 = await prisma.keyRiskIndicator.create({
    data: {
      kriId: 'KRI-005',
      name: 'Security training completion',
      description: 'Percentage of staff who have completed mandatory security awareness training within the current quarter, including phishing simulation exercises.',
      unit: '%',
      thresholdGreen: '>=90%',
      thresholdAmber: '70-89%',
      thresholdRed: '<70%',
      currentValue: '94',
      status: 'GREEN',
      trend: 'STABLE',
      frequency: 'MONTHLY',
      lastMeasured: now,
      riskId: ctx.riskIds['R-08']!,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.kRIHistory.create({
    data: {
      value: '91',
      status: 'GREEN',
      measuredAt: threeMonthsAgo,
      kriId: kri005.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '93',
      status: 'GREEN',
      measuredAt: twoMonthsAgo,
      kriId: kri005.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '94',
      status: 'GREEN',
      measuredAt: oneMonthAgo,
      kriId: kri005.id,
    },
  });

  // KRI-006: Third-party risk reviews overdue
  const kri006 = await prisma.keyRiskIndicator.create({
    data: {
      kriId: 'KRI-006',
      name: 'Third-party risk reviews overdue',
      description: 'Number of third-party vendor risk assessments that have exceeded their scheduled review date without completion.',
      unit: 'Count',
      thresholdGreen: '0',
      thresholdAmber: '1-2',
      thresholdRed: '>=3',
      currentValue: '3',
      status: 'RED',
      trend: 'DECLINING',
      frequency: 'MONTHLY',
      lastMeasured: now,
      riskId: ctx.riskIds['R-02']!,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.kRIHistory.create({
    data: {
      value: '1',
      status: 'AMBER',
      measuredAt: threeMonthsAgo,
      kriId: kri006.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '2',
      status: 'AMBER',
      measuredAt: twoMonthsAgo,
      kriId: kri006.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '3',
      status: 'RED',
      measuredAt: oneMonthAgo,
      kriId: kri006.id,
    },
  });

  // KRI-007: Encryption coverage
  const kri007 = await prisma.keyRiskIndicator.create({
    data: {
      kriId: 'KRI-007',
      name: 'Encryption coverage',
      description: 'Percentage of data at rest and in transit that is protected by approved encryption standards (AES-256 for at-rest, TLS 1.3 for in-transit).',
      unit: '%',
      thresholdGreen: '>=99%',
      thresholdAmber: '95-98%',
      thresholdRed: '<95%',
      currentValue: '99.1',
      status: 'GREEN',
      trend: 'STABLE',
      frequency: 'MONTHLY',
      lastMeasured: now,
      riskId: ctx.riskIds['R-09']!,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.kRIHistory.create({
    data: {
      value: '98.8',
      status: 'AMBER',
      measuredAt: threeMonthsAgo,
      kriId: kri007.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '99.0',
      status: 'GREEN',
      measuredAt: twoMonthsAgo,
      kriId: kri007.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '99.1',
      status: 'GREEN',
      measuredAt: oneMonthAgo,
      kriId: kri007.id,
    },
  });

  // KRI-008: Change failure rate
  const kri008 = await prisma.keyRiskIndicator.create({
    data: {
      kriId: 'KRI-008',
      name: 'Change failure rate',
      description: 'Percentage of production deployments that result in a rollback, hotfix, or incident within 24 hours of release.',
      unit: '%',
      thresholdGreen: '<=5%',
      thresholdAmber: '5-10%',
      thresholdRed: '>10%',
      currentValue: '8',
      status: 'AMBER',
      trend: 'IMPROVING',
      frequency: 'MONTHLY',
      lastMeasured: now,
      riskId: ctx.riskIds['R-10']!,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.kRIHistory.create({
    data: {
      value: '14',
      status: 'RED',
      measuredAt: threeMonthsAgo,
      kriId: kri008.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '11',
      status: 'RED',
      measuredAt: twoMonthsAgo,
      kriId: kri008.id,
    },
  });
  await prisma.kRIHistory.create({
    data: {
      value: '8',
      status: 'AMBER',
      measuredAt: oneMonthAgo,
      kriId: kri008.id,
    },
  });

  // ============================================================
  // 6 TREATMENT PLANS
  // ============================================================

  await prisma.treatmentPlan.create({
    data: {
      treatmentId: 'TP-001',
      title: 'Ransomware defence hardening',
      description:
        'Comprehensive programme to harden ClearStream payment infrastructure against ransomware threats. Includes deployment of endpoint detection and response (EDR) across all payment processing servers, implementation of network segmentation between payment zones, immutable backup strategy with air-gapped copies, and regular ransomware simulation exercises. The programme also covers staff awareness training focused on ransomware delivery vectors.',
      treatmentType: 'MITIGATE',
      status: 'COMPLETED',
      priority: 'CRITICAL',
      progressPercentage: 100,
      estimatedCost: 280000,
      targetStartDate: new Date(now.getFullYear(), now.getMonth() - 6, 1),
      targetEndDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      actualStartDate: new Date(now.getFullYear(), now.getMonth() - 6, 5),
      actualEndDate: new Date(now.getFullYear(), now.getMonth() - 1, 10),
      targetResidualScore: 8,
      currentResidualScore: 9,
      expectedReduction: 55,
      riskId: ctx.riskIds['R-01']!,
      organisationId: ctx.orgId,
      riskOwnerId: ctx.users.ciso,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.treatmentPlan.create({
    data: {
      treatmentId: 'TP-002',
      title: 'API security enhancement program',
      description:
        'End-to-end API security improvement programme covering the merchant-facing payment gateway and internal microservice APIs. Deliverables include implementation of API gateway with rate limiting and schema validation, deployment of runtime application self-protection (RASP), automated DAST scanning in CI/CD pipeline, and migration to OAuth 2.0 with PKCE for all merchant API authentication. Includes third-party penetration testing of all public-facing API endpoints.',
      treatmentType: 'MITIGATE',
      status: 'COMPLETED',
      priority: 'HIGH',
      progressPercentage: 100,
      estimatedCost: 195000,
      targetStartDate: new Date(now.getFullYear(), now.getMonth() - 8, 1),
      targetEndDate: new Date(now.getFullYear(), now.getMonth() - 2, 28),
      actualStartDate: new Date(now.getFullYear(), now.getMonth() - 8, 3),
      actualEndDate: new Date(now.getFullYear(), now.getMonth() - 2, 20),
      targetResidualScore: 8,
      currentResidualScore: 10,
      expectedReduction: 33,
      riskId: ctx.riskIds['R-03']!,
      organisationId: ctx.orgId,
      riskOwnerId: ctx.users.ciso,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.treatmentPlan.create({
    data: {
      treatmentId: 'TP-003',
      title: 'DORA compliance implementation',
      description:
        'Structured programme to achieve full compliance with the Digital Operational Resilience Act (DORA) across all five pillars: ICT risk management, incident reporting, digital operational resilience testing, third-party risk management, and information sharing. Includes gap analysis against the regulatory technical standards, implementation of the ICT risk management framework, establishment of the major ICT-related incident reporting process, and development of the TLPT programme.',
      treatmentType: 'MITIGATE',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      progressPercentage: 65,
      estimatedCost: 450000,
      targetStartDate: new Date(now.getFullYear(), now.getMonth() - 10, 1),
      targetEndDate: new Date(now.getFullYear(), now.getMonth() + 3, 30),
      actualStartDate: new Date(now.getFullYear(), now.getMonth() - 10, 8),
      targetResidualScore: 6,
      currentResidualScore: 8,
      expectedReduction: 33,
      riskId: ctx.riskIds['R-05']!,
      organisationId: ctx.orgId,
      riskOwnerId: ctx.users.ciso,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.treatmentPlan.create({
    data: {
      treatmentId: 'TP-004',
      title: 'Anti-phishing controls upgrade',
      description:
        'Upgrade of email security and anti-phishing controls for the finance and treasury teams. Includes deployment of advanced email filtering with AI-based impersonation detection, implementation of DMARC/DKIM/SPF enforcement, rollout of hardware security keys (FIDO2) for all finance personnel, enhanced phishing simulation programme with monthly exercises, and deployment of browser isolation for accessing financial platforms.',
      treatmentType: 'MITIGATE',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      progressPercentage: 40,
      estimatedCost: 120000,
      targetStartDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      targetEndDate: new Date(now.getFullYear(), now.getMonth() + 4, 30),
      actualStartDate: new Date(now.getFullYear(), now.getMonth() - 3, 10),
      targetResidualScore: 4,
      currentResidualScore: 8,
      expectedReduction: 33,
      riskId: ctx.riskIds['R-08']!,
      organisationId: ctx.orgId,
      riskOwnerId: ctx.users.ciso,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.treatmentPlan.create({
    data: {
      treatmentId: 'TP-005',
      title: 'Supply chain security program',
      description:
        'Establishment of a comprehensive software supply chain security programme. Includes implementation of software bill of materials (SBOM) generation for all payment applications, deployment of dependency scanning in CI/CD pipelines with automated blocking of vulnerable packages, vendor security assessment programme for all critical software suppliers, and adoption of SLSA framework for build provenance verification. Also covers implementation of signed commits and reproducible builds.',
      treatmentType: 'MITIGATE',
      status: 'APPROVED',
      priority: 'HIGH',
      progressPercentage: 0,
      estimatedCost: 175000,
      targetStartDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      targetEndDate: new Date(now.getFullYear(), now.getMonth() + 7, 30),
      targetResidualScore: 5,
      currentResidualScore: 9,
      expectedReduction: 44,
      riskId: ctx.riskIds['R-10']!,
      organisationId: ctx.orgId,
      riskOwnerId: ctx.users.ciso,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.treatmentPlan.create({
    data: {
      treatmentId: 'TP-006',
      title: 'Cloud resilience risk transfer',
      description:
        'Evaluation and procurement of a cyber insurance policy with specific coverage for cloud infrastructure failures and business interruption. Includes assessment of cloud provider SLA gap insurance products, negotiation of coverage terms for multi-region outages, and alignment of insurance coverage with the organisation risk appetite for cloud availability risks. The policy should cover direct financial losses from cloud downtime exceeding defined RTO thresholds.',
      treatmentType: 'TRANSFER',
      status: 'DRAFT',
      priority: 'MEDIUM',
      progressPercentage: 0,
      estimatedCost: 85000,
      targetStartDate: new Date(now.getFullYear(), now.getMonth() + 2, 1),
      targetEndDate: new Date(now.getFullYear(), now.getMonth() + 5, 30),
      targetResidualScore: 3,
      currentResidualScore: 4,
      expectedReduction: 25,
      riskId: ctx.riskIds['R-07']!,
      organisationId: ctx.orgId,
      riskOwnerId: ctx.users.ciso,
      createdById: ctx.users.ciso,
    },
  });

  // ============================================================
  // 5 RISK TOLERANCE STATEMENTS
  // ============================================================

  await prisma.riskToleranceStatement.create({
    data: {
      rtsId: 'RTS-001',
      title: 'Payment Data Security Tolerance',
      objective:
        'Ensure that residual risk scores for all payment data security scenarios remain within acceptable thresholds to protect cardholder data and maintain PCI DSS compliance. No single scenario involving cardholder data exposure shall exceed a residual score of 6.',
      domain: 'Payment Security',
      proposedToleranceLevel: 'LOW',
      proposedRTS:
        'ClearStream Payments maintains a low tolerance for risks to payment data security. All scenarios involving potential cardholder data exposure, API vulnerabilities, or payment infrastructure compromise must be treated to a residual risk score of 6 or below. Any scenario exceeding this threshold requires immediate escalation to the CISO and mandatory treatment plan activation within 5 business days.',
      category: 'FINANCIAL',
      toleranceThreshold: 6,
      status: 'ACTIVE',
      approvedDate: new Date(now.getFullYear(), now.getMonth() - 6, 15),
      effectiveDate: new Date(now.getFullYear(), now.getMonth() - 6, 15),
      reviewDate: new Date(now.getFullYear(), now.getMonth() + 6, 15),
      framework: 'ISO',
      organisationId: ctx.orgId,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.riskToleranceStatement.create({
    data: {
      rtsId: 'RTS-002',
      title: 'Operational Resilience Tolerance',
      objective:
        'Maintain operational resilience levels that ensure payment processing continuity and compliance with DORA Article 11 requirements for digital operational resilience. Business-critical payment services must achieve 99.95% availability.',
      domain: 'Business Continuity',
      proposedToleranceLevel: 'LOW',
      proposedRTS:
        'ClearStream Payments maintains a low tolerance for operational resilience risks. All scenarios that could result in payment processing downtime exceeding 15 minutes must have a residual risk score of 8 or below. Scenarios involving simultaneous failure of primary and backup systems require annual resilience testing and must not exceed a residual score of 6. Any breach of this tolerance triggers automatic escalation to the CTO and CEO.',
      category: 'OPERATIONAL',
      toleranceThreshold: 8,
      status: 'ACTIVE',
      approvedDate: new Date(now.getFullYear(), now.getMonth() - 6, 15),
      effectiveDate: new Date(now.getFullYear(), now.getMonth() - 6, 15),
      reviewDate: new Date(now.getFullYear(), now.getMonth() + 6, 15),
      framework: 'ISO',
      organisationId: ctx.orgId,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.riskToleranceStatement.create({
    data: {
      rtsId: 'RTS-003',
      title: 'Regulatory Compliance Tolerance',
      objective:
        'Ensure full compliance with applicable financial regulations including DORA, NIS2, GDPR, and PCI DSS. No regulatory non-compliance scenario shall remain untreated beyond one quarter of identification.',
      domain: 'Compliance',
      proposedToleranceLevel: 'LOW',
      proposedRTS:
        'ClearStream Payments maintains a low tolerance for regulatory compliance risks. Any scenario involving potential non-compliance with DORA, NIS2, GDPR, or PCI DSS must be treated to a residual risk score of 6 or below. Identified compliance gaps must have an approved treatment plan within 30 days and must be remediated within the regulatory compliance timeline. The DPO and Compliance Officer must be notified of any scenario scoring above the tolerance threshold.',
      category: 'LEGAL_REGULATORY',
      toleranceThreshold: 6,
      status: 'ACTIVE',
      approvedDate: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      effectiveDate: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      reviewDate: new Date(now.getFullYear(), now.getMonth() + 7, 1),
      framework: 'ISO',
      organisationId: ctx.orgId,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.riskToleranceStatement.create({
    data: {
      rtsId: 'RTS-004',
      title: 'Technology Innovation Tolerance',
      objective:
        'Enable controlled adoption of new technologies including AI/ML and cloud-native architectures while maintaining acceptable security postures. Innovation risks are accepted at moderate levels to support business growth.',
      domain: 'Innovation',
      proposedToleranceLevel: 'MEDIUM',
      proposedRTS:
        'ClearStream Payments maintains a medium tolerance for technology innovation risks. Scenarios involving emerging technologies such as AI model integrity, new cloud services, or novel payment methods may have residual risk scores up to 12. Innovation-related risks must be reviewed quarterly and must not impact the security posture of core payment processing systems. Any innovation risk that could cascade to core payment infrastructure must be treated to the Payment Data Security tolerance level.',
      category: 'STRATEGIC',
      toleranceThreshold: 12,
      status: 'APPROVED',
      approvedDate: new Date(now.getFullYear(), now.getMonth() - 3, 20),
      effectiveDate: new Date(now.getFullYear(), now.getMonth() - 3, 20),
      reviewDate: new Date(now.getFullYear(), now.getMonth() + 9, 20),
      framework: 'ISO',
      organisationId: ctx.orgId,
      createdById: ctx.users.ciso,
    },
  });

  await prisma.riskToleranceStatement.create({
    data: {
      rtsId: 'RTS-005',
      title: 'Third-party Risk Tolerance',
      objective:
        'Manage risks arising from third-party vendors and service providers to ensure they do not introduce unacceptable risk to ClearStream payment operations or compromise the security of customer data.',
      domain: 'Vendor Management',
      proposedToleranceLevel: 'LOW',
      proposedRTS:
        'ClearStream Payments maintains a low tolerance for third-party risks. All critical and high-risk vendors must complete annual security assessments, and any scenario involving third-party compromise or service failure must have a residual risk score of 8 or below. Vendors with overdue risk assessments must be escalated for review within 14 days. Any third-party incident affecting cardholder data triggers immediate invocation of the third-party incident response procedure and vendor risk re-assessment.',
      category: 'OPERATIONAL',
      toleranceThreshold: 8,
      status: 'ACTIVE',
      approvedDate: new Date(now.getFullYear(), now.getMonth() - 4, 10),
      effectiveDate: new Date(now.getFullYear(), now.getMonth() - 4, 10),
      reviewDate: new Date(now.getFullYear(), now.getMonth() + 8, 10),
      framework: 'ISO',
      organisationId: ctx.orgId,
      createdById: ctx.users.ciso,
    },
  });
}
