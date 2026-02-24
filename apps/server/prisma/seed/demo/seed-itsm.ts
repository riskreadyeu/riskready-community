import { PrismaClient } from '@prisma/client';
import { DemoContext } from './index';

/**
 * Seed ITSM data for ClearStream Payments demo.
 *
 * Creates:
 * - 20 IT assets (servers, databases, VMs, network devices, cloud services, apps, laptops)
 * - 4 changes (TLS migration, PostgreSQL upgrade, network segmentation, emergency patch)
 *
 * Populates ctx.assetIds and ctx.changeIds.
 */
export async function seedItsm(
  prisma: PrismaClient,
  ctx: DemoContext,
): Promise<void> {
  const now = new Date();

  // ============================================
  // HELPER: relative dates
  // ============================================
  function weeksAgo(n: number): Date {
    const d = new Date(now);
    d.setDate(d.getDate() - n * 7);
    return d;
  }

  function weeksFromNow(n: number): Date {
    const d = new Date(now);
    d.setDate(d.getDate() + n * 7);
    return d;
  }

  function daysAgo(n: number): Date {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
  }

  // ============================================
  // 20 IT ASSETS
  // ============================================

  // --- 1. AST-SRV-001 ---
  const astSrv001 = await prisma.asset.create({
    data: {
      assetTag: 'AST-SRV-001',
      name: 'payment-api-prod-1',
      displayName: 'Payment API Production Server 1',
      description:
        'Primary payment API server handling real-time transaction processing for all merchant integrations. Hosts the core payment gateway microservice with TLS 1.3 termination.',
      assetType: 'SERVER',
      businessCriticality: 'CRITICAL',
      dataClassification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      cloudProvider: 'AWS',
      cloudRegion: 'eu-west-1',
      cloudAccountId: '112233445566',
      operatingSystem: 'Linux',
      osVersion: 'Amazon Linux 2023',
      inIsmsScope: true,
      inDoraScope: true,
      inPciScope: true,
      inNis2Scope: true,
      handlesFinancialData: true,
      handlesPersonalData: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'AES-256-GCM',
      monitoringEnabled: true,
      loggingEnabled: true,
      backupEnabled: true,
      backupFrequency: 'Daily',
      backupRetention: '30 days',
      cpuUsagePercent: 65,
      memoryUsagePercent: 72,
      capacityStatus: 'NORMAL',
      rtoMinutes: 15,
      rpoMinutes: 5,
      hasRedundancy: true,
      redundancyType: 'Active-Active',
      locationId: ctx.locations.dublin,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-SRV-001'] = astSrv001.id;

  // --- 2. AST-SRV-002 ---
  const astSrv002 = await prisma.asset.create({
    data: {
      assetTag: 'AST-SRV-002',
      name: 'payment-api-prod-2',
      displayName: 'Payment API Production Server 2',
      description:
        'Secondary payment API server providing redundancy for the core payment gateway. Load-balanced with AST-SRV-001 for high availability.',
      assetType: 'SERVER',
      businessCriticality: 'CRITICAL',
      dataClassification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      cloudProvider: 'AWS',
      cloudRegion: 'eu-west-1',
      cloudAccountId: '112233445566',
      operatingSystem: 'Linux',
      osVersion: 'Amazon Linux 2023',
      inIsmsScope: true,
      inDoraScope: true,
      inPciScope: true,
      inNis2Scope: true,
      handlesFinancialData: true,
      handlesPersonalData: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'AES-256-GCM',
      monitoringEnabled: true,
      loggingEnabled: true,
      backupEnabled: true,
      backupFrequency: 'Daily',
      backupRetention: '30 days',
      cpuUsagePercent: 58,
      memoryUsagePercent: 72,
      capacityStatus: 'NORMAL',
      rtoMinutes: 15,
      rpoMinutes: 5,
      hasRedundancy: true,
      redundancyType: 'Active-Active',
      locationId: ctx.locations.dublin,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-SRV-002'] = astSrv002.id;

  // --- 3. AST-SRV-003 ---
  const astSrv003 = await prisma.asset.create({
    data: {
      assetTag: 'AST-SRV-003',
      name: 'merchant-portal-prod',
      displayName: 'Merchant Portal Production Server',
      description:
        'Production server hosting the merchant self-service portal. Provides dashboard, reporting, and configuration capabilities for onboarded merchants.',
      assetType: 'SERVER',
      businessCriticality: 'HIGH',
      dataClassification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      cloudProvider: 'AWS',
      cloudRegion: 'eu-west-1',
      cloudAccountId: '112233445566',
      operatingSystem: 'Linux',
      osVersion: 'Amazon Linux 2023',
      inIsmsScope: true,
      inDoraScope: true,
      inPciScope: true,
      handlesFinancialData: true,
      handlesPersonalData: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'AES-256-GCM',
      monitoringEnabled: true,
      loggingEnabled: true,
      backupEnabled: true,
      backupFrequency: 'Daily',
      backupRetention: '30 days',
      cpuUsagePercent: 45,
      memoryUsagePercent: 60,
      capacityStatus: 'NORMAL',
      rtoMinutes: 30,
      rpoMinutes: 15,
      hasRedundancy: true,
      redundancyType: 'Active-Passive',
      locationId: ctx.locations.dublin,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-SRV-003'] = astSrv003.id;

  // --- 4. AST-SRV-004 ---
  const astSrv004 = await prisma.asset.create({
    data: {
      assetTag: 'AST-SRV-004',
      name: 'fraud-engine-prod',
      displayName: 'Fraud Detection Engine Production',
      description:
        'Real-time fraud detection engine processing all payment transactions. Uses ML-based scoring models to identify suspicious activity with sub-100ms latency requirements.',
      assetType: 'SERVER',
      businessCriticality: 'CRITICAL',
      dataClassification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      cloudProvider: 'AWS',
      cloudRegion: 'eu-west-1',
      cloudAccountId: '112233445566',
      operatingSystem: 'Linux',
      osVersion: 'Amazon Linux 2023',
      inIsmsScope: true,
      inDoraScope: true,
      inPciScope: true,
      inNis2Scope: true,
      handlesFinancialData: true,
      handlesPersonalData: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'AES-256-GCM',
      monitoringEnabled: true,
      loggingEnabled: true,
      backupEnabled: true,
      backupFrequency: 'Hourly',
      backupRetention: '90 days',
      cpuUsagePercent: 82,
      memoryUsagePercent: 78,
      capacityStatus: 'WARNING',
      rtoMinutes: 10,
      rpoMinutes: 1,
      hasRedundancy: true,
      redundancyType: 'Active-Active',
      locationId: ctx.locations.dublin,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-SRV-004'] = astSrv004.id;

  // --- 5. AST-DB-001 ---
  const astDb001 = await prisma.asset.create({
    data: {
      assetTag: 'AST-DB-001',
      name: 'customers-db',
      displayName: 'Customer Database (Primary)',
      description:
        'Primary PostgreSQL database storing all customer records, KYC data, merchant profiles, and authentication credentials. Subject to GDPR and PCI DSS requirements.',
      assetType: 'DATABASE',
      businessCriticality: 'CRITICAL',
      dataClassification: 'RESTRICTED',
      status: 'ACTIVE',
      cloudProvider: 'AWS',
      cloudRegion: 'eu-west-1',
      operatingSystem: 'Linux',
      osVersion: 'Amazon Linux 2023',
      version: 'PostgreSQL 15.4',
      inIsmsScope: true,
      inDoraScope: true,
      inPciScope: true,
      inGdprScope: true,
      inNis2Scope: true,
      handlesPersonalData: true,
      handlesFinancialData: true,
      handlesConfidentialData: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'AES-256-GCM with AWS KMS',
      monitoringEnabled: true,
      loggingEnabled: true,
      backupEnabled: true,
      backupFrequency: 'Continuous (WAL streaming)',
      backupRetention: '90 days',
      cpuUsagePercent: 55,
      memoryUsagePercent: 68,
      capacityStatus: 'NORMAL',
      rtoMinutes: 10,
      rpoMinutes: 1,
      hasRedundancy: true,
      redundancyType: 'Multi-AZ with read replicas',
      locationId: ctx.locations.dublin,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-DB-001'] = astDb001.id;

  // --- 6. AST-DB-002 ---
  const astDb002 = await prisma.asset.create({
    data: {
      assetTag: 'AST-DB-002',
      name: 'transactions-db',
      displayName: 'Transaction Database (Primary)',
      description:
        'Core transactional database storing all payment records, settlement data, and financial audit trails. High-throughput write-optimised with strict ACID compliance.',
      assetType: 'DATABASE',
      businessCriticality: 'CRITICAL',
      dataClassification: 'RESTRICTED',
      status: 'ACTIVE',
      cloudProvider: 'AWS',
      cloudRegion: 'eu-west-1',
      operatingSystem: 'Linux',
      osVersion: 'Amazon Linux 2023',
      version: 'PostgreSQL 15.4',
      inIsmsScope: true,
      inDoraScope: true,
      inPciScope: true,
      inNis2Scope: true,
      handlesFinancialData: true,
      handlesPersonalData: true,
      handlesConfidentialData: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'AES-256-GCM with AWS KMS',
      monitoringEnabled: true,
      loggingEnabled: true,
      backupEnabled: true,
      backupFrequency: 'Continuous (WAL streaming)',
      backupRetention: '7 years',
      cpuUsagePercent: 70,
      memoryUsagePercent: 75,
      capacityStatus: 'NORMAL',
      rtoMinutes: 5,
      rpoMinutes: 0,
      hasRedundancy: true,
      redundancyType: 'Multi-AZ with synchronous replication',
      locationId: ctx.locations.dublin,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-DB-002'] = astDb002.id;

  // --- 7. AST-DB-003 ---
  const astDb003 = await prisma.asset.create({
    data: {
      assetTag: 'AST-DB-003',
      name: 'analytics-db',
      displayName: 'Analytics Database',
      description:
        'Read-optimised analytics database used for business intelligence, reporting dashboards, and trend analysis. Contains aggregated and anonymised transaction metrics.',
      assetType: 'DATABASE',
      businessCriticality: 'MEDIUM',
      dataClassification: 'INTERNAL',
      status: 'ACTIVE',
      cloudProvider: 'AWS',
      cloudRegion: 'eu-west-1',
      operatingSystem: 'Linux',
      osVersion: 'Amazon Linux 2023',
      version: 'PostgreSQL 15.4',
      inIsmsScope: true,
      inDoraScope: false,
      inPciScope: false,
      handlesFinancialData: false,
      handlesPersonalData: false,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'AES-256-GCM',
      monitoringEnabled: true,
      loggingEnabled: true,
      backupEnabled: true,
      backupFrequency: 'Daily',
      backupRetention: '30 days',
      cpuUsagePercent: 40,
      memoryUsagePercent: 55,
      capacityStatus: 'NORMAL',
      rtoMinutes: 120,
      rpoMinutes: 60,
      hasRedundancy: false,
      locationId: ctx.locations.dublin,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-DB-003'] = astDb003.id;

  // --- 8. AST-VM-001 ---
  const astVm001 = await prisma.asset.create({
    data: {
      assetTag: 'AST-VM-001',
      name: 'k8s-worker-1',
      displayName: 'Kubernetes Worker Node 1',
      description:
        'Kubernetes worker node running payment microservices workloads. Part of the production EKS cluster in eu-west-1. Hosts payment-api, settlement-service, and notification-service pods.',
      assetType: 'CLOUD_VM',
      businessCriticality: 'HIGH',
      dataClassification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      cloudProvider: 'AWS',
      cloudRegion: 'eu-west-1',
      cloudAccountId: '112233445566',
      operatingSystem: 'Linux',
      osVersion: 'Bottlerocket OS 1.19',
      inIsmsScope: true,
      inDoraScope: true,
      inPciScope: true,
      handlesFinancialData: true,
      handlesPersonalData: false,
      encryptionAtRest: true,
      encryptionInTransit: true,
      monitoringEnabled: true,
      loggingEnabled: true,
      cpuUsagePercent: 60,
      memoryUsagePercent: 68,
      capacityStatus: 'NORMAL',
      rtoMinutes: 5,
      rpoMinutes: 0,
      hasRedundancy: true,
      redundancyType: 'EKS Auto Scaling Group',
      locationId: ctx.locations.dublin,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-VM-001'] = astVm001.id;

  // --- 9. AST-VM-002 ---
  const astVm002 = await prisma.asset.create({
    data: {
      assetTag: 'AST-VM-002',
      name: 'k8s-worker-2',
      displayName: 'Kubernetes Worker Node 2',
      description:
        'Kubernetes worker node running payment microservices workloads. Part of the production EKS cluster in eu-west-1. Currently experiencing elevated memory pressure due to increased transaction volume.',
      assetType: 'CLOUD_VM',
      businessCriticality: 'HIGH',
      dataClassification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      cloudProvider: 'AWS',
      cloudRegion: 'eu-west-1',
      cloudAccountId: '112233445566',
      operatingSystem: 'Linux',
      osVersion: 'Bottlerocket OS 1.19',
      inIsmsScope: true,
      inDoraScope: true,
      inPciScope: true,
      handlesFinancialData: true,
      handlesPersonalData: false,
      encryptionAtRest: true,
      encryptionInTransit: true,
      monitoringEnabled: true,
      loggingEnabled: true,
      cpuUsagePercent: 62,
      memoryUsagePercent: 85,
      capacityStatus: 'WARNING',
      capacityNotes: 'Memory usage trending upward due to Q1 transaction volume growth. Scale-up planned.',
      rtoMinutes: 5,
      rpoMinutes: 0,
      hasRedundancy: true,
      redundancyType: 'EKS Auto Scaling Group',
      locationId: ctx.locations.dublin,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-VM-002'] = astVm002.id;

  // --- 10. AST-NET-001 ---
  const astNet001 = await prisma.asset.create({
    data: {
      assetTag: 'AST-NET-001',
      name: 'fw-dublin-01',
      displayName: 'Dublin Data Centre Firewall',
      description:
        'Primary perimeter firewall for Dublin data centre. Enforces PCI DSS network segmentation between cardholder data environment (CDE) and corporate LAN. Stateful inspection with IPS enabled.',
      assetType: 'NETWORK_DEVICE',
      businessCriticality: 'CRITICAL',
      dataClassification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      cloudProvider: 'ON_PREMISES',
      operatingSystem: 'Palo Alto PAN-OS',
      osVersion: '11.1.2',
      manufacturer: 'Palo Alto Networks',
      model: 'PA-3260',
      inIsmsScope: true,
      inDoraScope: true,
      inPciScope: true,
      inNis2Scope: true,
      handlesFinancialData: false,
      handlesPersonalData: false,
      encryptionAtRest: false,
      encryptionInTransit: true,
      monitoringEnabled: true,
      loggingEnabled: true,
      cpuUsagePercent: 35,
      memoryUsagePercent: 50,
      capacityStatus: 'NORMAL',
      rtoMinutes: 5,
      rpoMinutes: 0,
      hasRedundancy: true,
      redundancyType: 'Active-Passive HA pair',
      locationId: ctx.locations.dublin,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-NET-001'] = astNet001.id;

  // --- 11. AST-NET-002 ---
  const astNet002 = await prisma.asset.create({
    data: {
      assetTag: 'AST-NET-002',
      name: 'fw-berlin-01',
      displayName: 'Berlin Office Firewall',
      description:
        'Perimeter firewall for Berlin office. Provides network security, VPN termination for remote workers, and web filtering. Connected to Dublin DC via site-to-site IPSec tunnel.',
      assetType: 'NETWORK_DEVICE',
      businessCriticality: 'HIGH',
      dataClassification: 'INTERNAL',
      status: 'ACTIVE',
      cloudProvider: 'ON_PREMISES',
      operatingSystem: 'Palo Alto PAN-OS',
      osVersion: '11.1.2',
      manufacturer: 'Palo Alto Networks',
      model: 'PA-850',
      inIsmsScope: true,
      inDoraScope: false,
      inPciScope: false,
      handlesFinancialData: false,
      handlesPersonalData: false,
      encryptionAtRest: false,
      encryptionInTransit: true,
      monitoringEnabled: true,
      loggingEnabled: true,
      cpuUsagePercent: 25,
      memoryUsagePercent: 40,
      capacityStatus: 'NORMAL',
      rtoMinutes: 30,
      rpoMinutes: 0,
      hasRedundancy: false,
      locationId: ctx.locations.berlin,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-NET-002'] = astNet002.id;

  // --- 12. AST-NET-003 ---
  const astNet003 = await prisma.asset.create({
    data: {
      assetTag: 'AST-NET-003',
      name: 'vpn-gateway',
      displayName: 'Corporate VPN Gateway',
      description:
        'Corporate VPN gateway providing secure remote access for all employees. Supports WireGuard and IPSec protocols with MFA enforcement. Handles approximately 200 concurrent connections.',
      assetType: 'NETWORK_DEVICE',
      businessCriticality: 'HIGH',
      dataClassification: 'INTERNAL',
      status: 'ACTIVE',
      cloudProvider: 'AWS',
      cloudRegion: 'eu-west-1',
      operatingSystem: 'Linux',
      osVersion: 'Ubuntu 22.04 LTS',
      inIsmsScope: true,
      inDoraScope: false,
      inPciScope: false,
      handlesFinancialData: false,
      handlesPersonalData: false,
      encryptionAtRest: false,
      encryptionInTransit: true,
      encryptionMethod: 'WireGuard / IPSec IKEv2',
      monitoringEnabled: true,
      loggingEnabled: true,
      cpuUsagePercent: 30,
      memoryUsagePercent: 45,
      capacityStatus: 'NORMAL',
      rtoMinutes: 15,
      rpoMinutes: 0,
      hasRedundancy: true,
      redundancyType: 'Multi-AZ deployment',
      locationId: ctx.locations.dublin,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-NET-003'] = astNet003.id;

  // --- 13. AST-CLD-001 ---
  const astCld001 = await prisma.asset.create({
    data: {
      assetTag: 'AST-CLD-001',
      name: 'aws-prod-account',
      displayName: 'AWS Production Account',
      description:
        'Primary AWS account hosting all production workloads for ClearStream Payments. Contains EKS clusters, RDS instances, S3 buckets, and supporting infrastructure. Governed by AWS Organizations SCPs.',
      assetType: 'EXTERNAL_SERVICE',
      businessCriticality: 'CRITICAL',
      dataClassification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      cloudProvider: 'AWS',
      cloudRegion: 'eu-west-1',
      cloudAccountId: '112233445566',
      inIsmsScope: true,
      inDoraScope: true,
      inPciScope: true,
      inNis2Scope: true,
      handlesFinancialData: true,
      handlesPersonalData: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'AWS KMS with CMK',
      monitoringEnabled: true,
      loggingEnabled: true,
      backupEnabled: true,
      backupFrequency: 'Continuous (per-service)',
      backupRetention: '90 days',
      capacityStatus: 'NORMAL',
      rtoMinutes: 60,
      rpoMinutes: 15,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-CLD-001'] = astCld001.id;

  // --- 14. AST-CLD-002 ---
  const astCld002 = await prisma.asset.create({
    data: {
      assetTag: 'AST-CLD-002',
      name: 'aws-staging-account',
      displayName: 'AWS Staging Account',
      description:
        'AWS staging/pre-production account used for integration testing, UAT, and release validation. Mirrors production topology but with reduced instance sizing. No real customer data permitted.',
      assetType: 'EXTERNAL_SERVICE',
      businessCriticality: 'MEDIUM',
      dataClassification: 'INTERNAL',
      status: 'ACTIVE',
      cloudProvider: 'AWS',
      cloudRegion: 'eu-west-1',
      cloudAccountId: '998877665544',
      inIsmsScope: true,
      inDoraScope: false,
      inPciScope: false,
      handlesFinancialData: false,
      handlesPersonalData: false,
      encryptionAtRest: true,
      encryptionInTransit: true,
      monitoringEnabled: true,
      loggingEnabled: true,
      backupEnabled: false,
      capacityStatus: 'NORMAL',
      rtoMinutes: 240,
      rpoMinutes: 120,
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-CLD-002'] = astCld002.id;

  // --- 15. AST-APP-001 ---
  const astApp001 = await prisma.asset.create({
    data: {
      assetTag: 'AST-APP-001',
      name: 'payment-gateway-app',
      displayName: 'Payment Gateway Application',
      description:
        'Core payment gateway application processing card-present and card-not-present transactions. Implements PCI DSS Level 1 controls, 3-D Secure authentication, and tokenisation services.',
      assetType: 'APPLICATION',
      businessCriticality: 'CRITICAL',
      dataClassification: 'RESTRICTED',
      status: 'ACTIVE',
      version: '4.12.3',
      inIsmsScope: true,
      inDoraScope: true,
      inPciScope: true,
      inNis2Scope: true,
      handlesFinancialData: true,
      handlesPersonalData: true,
      handlesConfidentialData: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'TLS 1.3 / AES-256-GCM',
      monitoringEnabled: true,
      loggingEnabled: true,
      rtoMinutes: 5,
      rpoMinutes: 0,
      hasRedundancy: true,
      redundancyType: 'Multi-instance with load balancing',
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-APP-001'] = astApp001.id;

  // --- 16. AST-APP-002 ---
  const astApp002 = await prisma.asset.create({
    data: {
      assetTag: 'AST-APP-002',
      name: 'merchant-portal-app',
      displayName: 'Merchant Portal Application',
      description:
        'Web-based merchant self-service portal. Provides transaction reporting, settlement views, dispute management, and API key management for integrated merchants.',
      assetType: 'APPLICATION',
      businessCriticality: 'HIGH',
      dataClassification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      version: '3.8.1',
      inIsmsScope: true,
      inDoraScope: true,
      inPciScope: true,
      handlesFinancialData: true,
      handlesPersonalData: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'TLS 1.3',
      monitoringEnabled: true,
      loggingEnabled: true,
      rtoMinutes: 30,
      rpoMinutes: 15,
      hasRedundancy: true,
      redundancyType: 'Active-Passive',
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-APP-002'] = astApp002.id;

  // --- 17. AST-APP-003 ---
  const astApp003 = await prisma.asset.create({
    data: {
      assetTag: 'AST-APP-003',
      name: 'fraud-detection-app',
      displayName: 'Fraud Detection Application',
      description:
        'Machine-learning based fraud detection application. Analyses transaction patterns in real-time and assigns risk scores. Integrates with payment gateway for automatic transaction blocking.',
      assetType: 'APPLICATION',
      businessCriticality: 'CRITICAL',
      dataClassification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      version: '2.5.0',
      inIsmsScope: true,
      inDoraScope: true,
      inPciScope: true,
      inNis2Scope: true,
      handlesFinancialData: true,
      handlesPersonalData: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'TLS 1.3 / AES-256-GCM',
      monitoringEnabled: true,
      loggingEnabled: true,
      rtoMinutes: 10,
      rpoMinutes: 1,
      hasRedundancy: true,
      redundancyType: 'Active-Active',
      departmentId: ctx.departments.engineering,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-APP-003'] = astApp003.id;

  // --- 18. AST-LPT-001 ---
  const astLpt001 = await prisma.asset.create({
    data: {
      assetTag: 'AST-LPT-001',
      name: 'EXEC-LPT-001',
      displayName: 'CEO Laptop - Fiona Murphy',
      description:
        'Executive laptop assigned to CEO. FileVault encrypted with MDM enrollment. Used for board communications, strategic planning, and executive dashboards.',
      assetType: 'LAPTOP',
      businessCriticality: 'MEDIUM',
      dataClassification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      operatingSystem: 'macOS',
      osVersion: 'macOS 15.2 Sequoia',
      manufacturer: 'Apple',
      model: 'MacBook Pro 16" M4 Pro',
      inIsmsScope: true,
      inDoraScope: false,
      inPciScope: false,
      handlesFinancialData: false,
      handlesPersonalData: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'FileVault 2 (AES-256-XTS)',
      monitoringEnabled: true,
      loggingEnabled: true,
      capacityStatus: 'NORMAL',
      ownerId: ctx.users.admin,
      departmentId: ctx.departments.executive,
      locationId: ctx.locations.dublin,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-LPT-001'] = astLpt001.id;

  // --- 19. AST-LPT-002 ---
  const astLpt002 = await prisma.asset.create({
    data: {
      assetTag: 'AST-LPT-002',
      name: 'EXEC-LPT-002',
      displayName: 'CISO Laptop - Siobhan O\'Brien',
      description:
        'Executive laptop assigned to CISO. Hardened configuration with endpoint detection and response (EDR). Used for security operations, incident management, and compliance reporting.',
      assetType: 'LAPTOP',
      businessCriticality: 'MEDIUM',
      dataClassification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      operatingSystem: 'macOS',
      osVersion: 'macOS 15.2 Sequoia',
      manufacturer: 'Apple',
      model: 'MacBook Pro 16" M4 Pro',
      inIsmsScope: true,
      inDoraScope: false,
      inPciScope: false,
      handlesFinancialData: false,
      handlesPersonalData: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'FileVault 2 (AES-256-XTS)',
      monitoringEnabled: true,
      loggingEnabled: true,
      capacityStatus: 'NORMAL',
      ownerId: ctx.users.ciso,
      departmentId: ctx.departments.infoSec,
      locationId: ctx.locations.dublin,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-LPT-002'] = astLpt002.id;

  // --- 20. AST-LPT-003 ---
  const astLpt003 = await prisma.asset.create({
    data: {
      assetTag: 'AST-LPT-003',
      name: 'EXEC-LPT-003',
      displayName: 'CTO Laptop - Lars Becker',
      description:
        'Executive laptop assigned to CTO. Development-configured with container tools and IDE. Used for architecture reviews, code reviews, and infrastructure management.',
      assetType: 'LAPTOP',
      businessCriticality: 'LOW',
      dataClassification: 'INTERNAL',
      status: 'ACTIVE',
      operatingSystem: 'macOS',
      osVersion: 'macOS 15.2 Sequoia',
      manufacturer: 'Apple',
      model: 'MacBook Pro 14" M4 Max',
      inIsmsScope: true,
      inDoraScope: false,
      inPciScope: false,
      handlesFinancialData: false,
      handlesPersonalData: false,
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionMethod: 'FileVault 2 (AES-256-XTS)',
      monitoringEnabled: true,
      loggingEnabled: true,
      capacityStatus: 'NORMAL',
      ownerId: ctx.users.cto,
      departmentId: ctx.departments.engineering,
      locationId: ctx.locations.berlin,
      createdById: ctx.users.cto,
    },
  });
  ctx.assetIds['AST-LPT-003'] = astLpt003.id;

  // ============================================
  // 4 CHANGES
  // ============================================

  // --- CHG-2026-001: TLS 1.3 migration ---
  const chg001 = await prisma.change.create({
    data: {
      changeRef: 'CHG-2026-001',
      title: 'TLS 1.3 migration for payment API',
      description:
        'Migrate all payment API endpoints from TLS 1.2 to TLS 1.3 to strengthen cryptographic posture. This change affects both production payment API servers (AST-SRV-001, AST-SRV-002) and requires coordinated certificate rotation, load balancer reconfiguration, and merchant notification. PCI DSS 4.0 requirement 4.2.1 mandates strong cryptography for cardholder data transmission.',
      changeType: 'NORMAL',
      category: 'SECURITY',
      priority: 'HIGH',
      securityImpact: 'HIGH',
      status: 'COMPLETED',
      successful: true,
      requesterId: ctx.users.securityLead,
      implementerId: ctx.users.cto,
      departmentId: ctx.departments.engineering,
      riskLevel: 'high',
      impactAssessment:
        'All merchant integrations using TLS 1.2 will need to upgrade their client libraries. Estimated 3% of merchants still on legacy stacks. 48-hour grace period with dual-protocol support before hard cutover.',
      backoutPlan:
        'Revert ALB listener configuration to accept TLS 1.2. Restore previous certificate chain. Rollback estimated at 15 minutes. Pre-staged rollback scripts in /ops/tls-rollback/.',
      testPlan:
        'Phase 1: Enable TLS 1.3 on staging environment and run full merchant integration test suite. Phase 2: Canary deployment to 5% of production traffic for 24 hours. Phase 3: Gradual rollout to 25%, 50%, 100% with automated health checks.',
      testResults:
        'Staging: All 847 integration tests passed. Canary (5%): No errors after 24h, p99 latency improved by 12ms. Full rollout: Completed successfully with zero transaction failures. 2 merchants contacted for TLS 1.2 deprecation support.',
      plannedStart: weeksAgo(6),
      plannedEnd: weeksAgo(4),
      actualStart: weeksAgo(6),
      actualEnd: weeksAgo(4),
      maintenanceWindow: true,
      outageRequired: false,
      implementationNotes:
        'Deployed in three phases over two weeks. All merchants successfully migrated. Performance improvement observed: average handshake time reduced by 30%.',
      successCriteria:
        'All payment API endpoints exclusively using TLS 1.3. Zero transaction failures during migration. All merchant integrations verified.',
      pirRequired: true,
      pirCompleted: true,
      pirDate: weeksAgo(3),
      pirNotes:
        'Migration completed ahead of schedule. Recommend similar approach for merchant portal TLS upgrade in Q2.',
      lessonsLearned:
        'Early merchant communication (4 weeks ahead) reduced support tickets. Canary deployment approach proved effective for zero-downtime migration.',
      createdById: ctx.users.securityLead,
      approvals: {
        create: {
          approverId: ctx.users.ciso,
          approverRole: 'CISO',
          status: 'APPROVED',
          decision: 'Approved',
          decidedAt: weeksAgo(7),
          comments:
            'Approved. TLS 1.3 migration aligns with PCI DSS 4.0 roadmap and strengthens our cryptographic baseline.',
        },
      },
    },
  });
  ctx.changeIds['CHG-2026-001'] = chg001.id;

  // --- CHG-2026-002: PostgreSQL 16 upgrade ---
  const chg002 = await prisma.change.create({
    data: {
      changeRef: 'CHG-2026-002',
      title: 'PostgreSQL 16 version upgrade',
      description:
        'Upgrade all PostgreSQL database instances from version 15.4 to 16.x. Includes customers-db (AST-DB-001), transactions-db (AST-DB-002), and analytics-db (AST-DB-003). Upgrade provides improved query performance, enhanced logical replication, and security patches addressing CVE-2024-XXXXX.',
      changeType: 'NORMAL',
      category: 'DATABASE',
      priority: 'MEDIUM',
      securityImpact: 'MEDIUM',
      status: 'APPROVED',
      requesterId: ctx.users.cto,
      implementerId: ctx.users.cto,
      departmentId: ctx.departments.engineering,
      riskLevel: 'medium',
      impactAssessment:
        'Database downtime required for major version upgrade. Estimated 30 minutes per instance using pg_upgrade with --link mode. Application connection pools will need recycling. Read replicas will be rebuilt post-upgrade.',
      backoutPlan:
        'Full pg_basebackup snapshots taken pre-upgrade. RDS automated snapshots retained for 7 days. Rollback procedure: restore from snapshot, point application connection strings to restored instance. Estimated rollback time: 45 minutes.',
      testPlan:
        'Phase 1: Upgrade staging databases and run full regression test suite. Phase 2: Performance benchmarking with production-representative dataset. Phase 3: Upgrade analytics-db first (lowest risk), then customers-db, then transactions-db during maintenance window.',
      plannedStart: weeksFromNow(2),
      plannedEnd: weeksFromNow(3),
      maintenanceWindow: true,
      outageRequired: true,
      estimatedDowntime: 90,
      businessJustification:
        'PostgreSQL 15 approaching end of community support. Version 16 provides 20% query performance improvement for our workload patterns and addresses known security vulnerabilities.',
      successCriteria:
        'All three database instances running PostgreSQL 16. Zero data loss. Application performance equal to or better than baseline. All automated health checks passing.',
      createdById: ctx.users.cto,
      approvals: {
        create: {
          approverId: ctx.users.ciso,
          approverRole: 'CISO',
          status: 'APPROVED',
          decision: 'Approved',
          decidedAt: daysAgo(3),
          comments:
            'Approved. Ensure full backups are verified before proceeding. Security patches in PG16 address medium-severity vulnerabilities.',
        },
      },
    },
  });
  ctx.changeIds['CHG-2026-002'] = chg002.id;

  // --- CHG-2026-003: Network segmentation ---
  const chg003 = await prisma.change.create({
    data: {
      changeRef: 'CHG-2026-003',
      title: 'Network segmentation update for PCI zone',
      description:
        'Reconfigure network segmentation to create a dedicated PCI DSS Cardholder Data Environment (CDE) zone. This involves updating firewall rules on fw-dublin-01 (AST-NET-001), creating new VLANs, and implementing micro-segmentation policies to restrict lateral movement between payment processing and corporate network segments.',
      changeType: 'NORMAL',
      category: 'NETWORK',
      priority: 'HIGH',
      securityImpact: 'HIGH',
      status: 'SUBMITTED',
      requesterId: ctx.users.securityLead,
      departmentId: ctx.departments.engineering,
      riskLevel: 'high',
      impactAssessment:
        'Network reconfiguration will temporarily affect routing between segments during cutover. Payment processing may experience 2-5 second interruptions during firewall rule activation. All internal services accessing PCI zone will require updated ACLs.',
      backoutPlan:
        'Firewall configuration snapshots saved pre-change. Rollback script restores previous rule set and VLAN configuration within 10 minutes. DNS and routing changes can be reverted independently.',
      testPlan:
        'Phase 1: Deploy segmentation in staging network and validate with penetration testing. Phase 2: Implement in production during maintenance window with real-time transaction monitoring. Phase 3: Post-implementation penetration test to verify isolation.',
      plannedStart: weeksFromNow(4),
      plannedEnd: weeksFromNow(5),
      maintenanceWindow: true,
      outageRequired: false,
      estimatedDowntime: 5,
      businessJustification:
        'Required for PCI DSS v4.0 compliance. Current flat network architecture does not meet segmentation requirements defined in PCI DSS Requirement 1.3. Audit finding NC-2025-003 references this gap.',
      successCriteria:
        'PCI CDE zone fully isolated with verified micro-segmentation. Penetration test confirms no lateral movement possible. All payment processing functioning normally.',
      createdById: ctx.users.securityLead,
      approvals: {
        create: {
          approverId: ctx.users.ciso,
          approverRole: 'CISO',
          status: 'PENDING',
          comments: null,
        },
      },
    },
  });
  ctx.changeIds['CHG-2026-003'] = chg003.id;

  // --- CHG-2026-004: Emergency Log4j patch ---
  const chg004 = await prisma.change.create({
    data: {
      changeRef: 'CHG-2026-004',
      title: 'Emergency patch - Log4j follow-up remediation',
      description:
        'Emergency remediation for residual Log4j vulnerability exposure identified during quarterly vulnerability scan. Follow-up to original Log4Shell response. Three internal Java-based microservices found with transitive Log4j 2.x dependencies not fully patched: settlement-reconciliation-service, merchant-notification-service, and reporting-export-service.',
      changeType: 'EMERGENCY',
      category: 'SECURITY',
      priority: 'CRITICAL',
      securityImpact: 'CRITICAL',
      status: 'COMPLETED',
      successful: true,
      requesterId: ctx.users.ciso,
      implementerId: ctx.users.cto,
      departmentId: ctx.departments.engineering,
      riskLevel: 'critical',
      impactAssessment:
        'Vulnerable services are internal-facing only but process financial data. Exploitation could lead to remote code execution within the Kubernetes cluster. CVSS score 10.0. Immediate patching required per incident response SLA.',
      backoutPlan:
        'Container image rollback via Kubernetes deployment revision history. Previous container images retained in ECR. Rollback command: kubectl rollout undo deployment/<service-name>. Estimated rollback time: 2 minutes per service.',
      testPlan:
        'Rapid smoke test per service after dependency update. Verify Log4j version in container image via SBOM scan. Run OWASP dependency-check to confirm no remaining vulnerable transitive dependencies.',
      testResults:
        'All three services rebuilt with Log4j 2.23.1. SBOM scan confirmed zero remaining vulnerable Log4j instances. Smoke tests passed. OWASP dependency-check clean. Vulnerability scan re-run confirmed remediation.',
      plannedStart: daysAgo(10),
      plannedEnd: daysAgo(9),
      actualStart: daysAgo(10),
      actualEnd: daysAgo(9),
      maintenanceWindow: false,
      outageRequired: false,
      implementationNotes:
        'Emergency change executed outside maintenance window per CISO authorisation. All three services rebuilt and redeployed within 8 hours of discovery. No service interruption.',
      successCriteria:
        'All transitive Log4j dependencies updated to 2.23.1+. Vulnerability scan shows zero Log4j findings. SBOM updated in asset inventory.',
      pirRequired: true,
      pirCompleted: true,
      pirDate: daysAgo(7),
      pirNotes:
        'Root cause: transitive dependency not captured in original Log4Shell remediation sweep. SBOM process gap identified.',
      lessonsLearned:
        'Need to implement automated SBOM generation in CI/CD pipeline to catch transitive dependency vulnerabilities. Quarterly vulnerability scans should include container image layer analysis.',
      createdById: ctx.users.ciso,
      approvals: {
        create: {
          approverId: ctx.users.admin,
          approverRole: 'CEO',
          status: 'APPROVED',
          decision: 'Approved',
          decidedAt: daysAgo(10),
          comments:
            'Emergency approval granted. Critical vulnerability with active exploitation in the wild. Proceed immediately.',
        },
      },
    },
  });
  ctx.changeIds['CHG-2026-004'] = chg004.id;
}
