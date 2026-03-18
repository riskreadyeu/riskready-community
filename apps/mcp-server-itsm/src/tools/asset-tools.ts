import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { withErrorHandling, userSelectSafe } from '#mcp-shared';

export function registerAssetTools(server: McpServer) {
  server.tool(
    'list_assets',
    'List assets from the CMDB with optional filters. Returns asset tag, name, type, status, criticality, classification, and ownership.',
    {
      assetType: z.enum([
        'SERVER', 'WORKSTATION', 'LAPTOP', 'MOBILE_DEVICE', 'NETWORK_DEVICE', 'STORAGE_DEVICE',
        'SECURITY_APPLIANCE', 'IOT_DEVICE', 'PRINTER', 'OTHER_HARDWARE',
        'OPERATING_SYSTEM', 'APPLICATION', 'DATABASE', 'MIDDLEWARE',
        'CLOUD_VM', 'CLOUD_CONTAINER', 'CLOUD_DATABASE', 'CLOUD_STORAGE', 'CLOUD_NETWORK',
        'CLOUD_SERVERLESS', 'CLOUD_KUBERNETES',
        'INTERNAL_SERVICE', 'EXTERNAL_SERVICE', 'SAAS_APPLICATION', 'API_ENDPOINT',
        'DATA_STORE', 'DATA_FLOW', 'OTHER',
      ]).optional().describe('Filter by asset type'),
      status: z.enum([
        'PLANNED', 'PROCUREMENT', 'DEVELOPMENT', 'STAGING', 'ACTIVE',
        'MAINTENANCE', 'RETIRING', 'DISPOSED',
      ]).optional().describe('Filter by asset lifecycle status'),
      businessCriticality: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Filter by business criticality'),
      dataClassification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional().describe('Filter by data classification'),
      departmentId: z.string().optional().describe('Filter by department UUID'),
      inIsmsScope: z.boolean().optional().describe('Filter by ISMS scope inclusion'),
      skip: z.number().int().min(0).default(0).describe('Pagination offset'),
      take: z.number().int().min(1).max(200).default(50).describe('Page size (max 200)'),
    },
    withErrorHandling('list_assets', async ({ assetType, status, businessCriticality, dataClassification, departmentId, inIsmsScope, skip, take }) => {
      const where: Record<string, unknown> = {};
      if (assetType) where.assetType = assetType;
      if (status) where.status = status;
      if (businessCriticality) where.businessCriticality = businessCriticality;
      if (dataClassification) where.dataClassification = dataClassification;
      if (departmentId) where.departmentId = departmentId;
      if (inIsmsScope !== undefined) where.inIsmsScope = inIsmsScope;

      const [results, count] = await Promise.all([
        prisma.asset.findMany({
          where,
          skip,
          take,
          orderBy: { assetTag: 'asc' },
          select: {
            id: true,
            assetTag: true,
            name: true,
            displayName: true,
            description: true,
            assetType: true,
            assetSubtype: true,
            status: true,
            businessCriticality: true,
            dataClassification: true,
            inIsmsScope: true,
            fqdn: true,
            cloudProvider: true,
            createdAt: true,
            updatedAt: true,
            owner: { select: userSelectSafe },
            department: { select: { id: true, name: true } },
            location: { select: { id: true, name: true, city: true, country: true } },
          },
        }),
        prisma.asset.count({ where }),
      ]);

      const response: Record<string, unknown> = { results, total: count, skip, take };
      if (count === 0) {
        response.note = 'No assets found matching the specified filters.';
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(response, null, 2),
        }],
      };
    }),
  );

  server.tool(
    'get_asset',
    'Get a single asset with full details including relationships, controls, risks, installed software, and capacity records.',
    {
      id: z.string().describe('Asset UUID'),
    },
    withErrorHandling('get_asset', async ({ id }) => {
      const asset = await prisma.asset.findUnique({
        where: { id },
        include: {
          owner: { select: userSelectSafe },
          custodian: { select: userSelectSafe },
          department: { select: { id: true, name: true } },
          location: { select: { id: true, name: true, city: true, country: true } },
          vendor: { select: { id: true, name: true, dependencyType: true } },
          controlLinks: {
            include: {
              control: { select: { id: true, controlId: true, name: true, implementationStatus: true } },
            },
          },
          riskLinks: {
            include: {
              risk: { select: { id: true, riskId: true, title: true, tier: true } },
            },
          },
          installedSoftware: {
            select: {
              id: true,
              softwareName: true,
              softwareVersion: true,
              vendor: true,
              licenseType: true,
              licenseExpiry: true,
              isApproved: true,
            },
          },
          capacityRecords: {
            take: 10,
            orderBy: { recordedAt: 'desc' },
            select: {
              id: true,
              recordedAt: true,
              cpuUsagePercent: true,
              memoryUsagePercent: true,
              storageUsagePercent: true,
              networkUsagePercent: true,
            },
          },
        },
      });

      if (!asset) {
        return { content: [{ type: 'text' as const, text: `Asset with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(asset, null, 2) }],
      };
    }),
  );

  server.tool(
    'search_assets',
    'Search assets by name, asset tag, or FQDN. Returns matching assets with basic info.',
    {
      query: z.string().max(200).describe('Search term (matches against name, assetTag, and fqdn)'),
      assetType: z.enum([
        'SERVER', 'WORKSTATION', 'LAPTOP', 'MOBILE_DEVICE', 'NETWORK_DEVICE', 'STORAGE_DEVICE',
        'SECURITY_APPLIANCE', 'IOT_DEVICE', 'PRINTER', 'OTHER_HARDWARE',
        'OPERATING_SYSTEM', 'APPLICATION', 'DATABASE', 'MIDDLEWARE',
        'CLOUD_VM', 'CLOUD_CONTAINER', 'CLOUD_DATABASE', 'CLOUD_STORAGE', 'CLOUD_NETWORK',
        'CLOUD_SERVERLESS', 'CLOUD_KUBERNETES',
        'INTERNAL_SERVICE', 'EXTERNAL_SERVICE', 'SAAS_APPLICATION', 'API_ENDPOINT',
        'DATA_STORE', 'DATA_FLOW', 'OTHER',
      ]).optional().describe('Limit search to a specific asset type'),
    },
    withErrorHandling('search_assets', async ({ query, assetType }) => {
      const where: Record<string, unknown> = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { assetTag: { contains: query, mode: 'insensitive' } },
          { fqdn: { contains: query, mode: 'insensitive' } },
        ],
      };
      if (assetType) where.assetType = assetType;

      const results = await prisma.asset.findMany({
        where,
        take: 50,
        orderBy: { assetTag: 'asc' },
        select: {
          id: true,
          assetTag: true,
          name: true,
          displayName: true,
          description: true,
          assetType: true,
          status: true,
          businessCriticality: true,
          dataClassification: true,
          fqdn: true,
          cloudProvider: true,
          owner: { select: userSelectSafe },
          department: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
        },
      });

      const response: Record<string, unknown> = { results, count: results.length };
      if (results.length === 0) {
        response.note = `No assets matched the search query '${query}'.`;
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_asset_security_posture',
    'Get asset security posture including encryption, backup, monitoring, vulnerability counts, SCA score, and risk score.',
    {
      id: z.string().describe('Asset UUID'),
    },
    withErrorHandling('get_asset_security_posture', async ({ id }) => {
      const asset = await prisma.asset.findUnique({
        where: { id },
        select: {
          id: true,
          assetTag: true,
          name: true,
          assetType: true,
          businessCriticality: true,
          dataClassification: true,
          // Security posture
          encryptionAtRest: true,
          encryptionInTransit: true,
          encryptionMethod: true,
          backupEnabled: true,
          backupFrequency: true,
          backupRetention: true,
          lastBackupDate: true,
          monitoringEnabled: true,
          loggingEnabled: true,
          // Vulnerabilities
          lastVulnScan: true,
          vulnerabilityCount: true,
          criticalVulnCount: true,
          openVulnsCritical: true,
          openVulnsHigh: true,
          openVulnsMedium: true,
          openVulnsLow: true,
          slaBreachedVulns: true,
          oldestUnpatchedDays: true,
          // SCA
          scaScore: true,
          scaPolicyName: true,
          scaPassCount: true,
          scaFailCount: true,
          scaTotalChecks: true,
          scaLastAssessment: true,
          // Risk scoring
          inherentRiskScore: true,
          riskScore: true,
          controlEffectiveness: true,
          riskScoreCalculatedAt: true,
          complianceScore: true,
          // Wazuh
          wazuhAgentId: true,
          wazuhAgentStatus: true,
          wazuhLastCheckIn: true,
          humanUserCount: true,
          privilegedUserCount: true,
          serviceAccountCount: true,
          openPortsCount: true,
          criticalPortsOpen: true,
        },
      });

      if (!asset) {
        return { content: [{ type: 'text' as const, text: `Asset with ID ${id} not found` }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(asset, null, 2) }],
      };
    }),
  );
}
