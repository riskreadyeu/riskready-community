import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpActionType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { createPendingAction, getDefaultOrganisationId, withErrorHandling } from '#mcp-shared';

// ========================================
// ASSET MUTATIONS
// ========================================

function registerAssetMutations(server: McpServer) {
  server.tool(
    'propose_asset',
    'Propose creating a new asset in the CMDB. The proposal goes into an approval queue for human review before execution.',
    {
      name: z.string().describe('Asset name'),
      assetTag: z.string().describe('Unique asset tag (e.g. AST-SRV-001)'),
      assetType: z.enum([
        'SERVER', 'WORKSTATION', 'LAPTOP', 'MOBILE_DEVICE', 'NETWORK_DEVICE', 'STORAGE_DEVICE',
        'SECURITY_APPLIANCE', 'IOT_DEVICE', 'PRINTER', 'OTHER_HARDWARE',
        'OPERATING_SYSTEM', 'APPLICATION', 'DATABASE', 'MIDDLEWARE',
        'CLOUD_VM', 'CLOUD_CONTAINER', 'CLOUD_DATABASE', 'CLOUD_STORAGE', 'CLOUD_NETWORK',
        'CLOUD_SERVERLESS', 'CLOUD_KUBERNETES',
        'INTERNAL_SERVICE', 'EXTERNAL_SERVICE', 'SAAS_APPLICATION', 'API_ENDPOINT',
        'DATA_STORE', 'DATA_FLOW', 'OTHER',
      ]).describe('Asset type classification'),
      displayName: z.string().optional().describe('Display name'),
      assetSubtype: z.string().optional().describe('Asset subtype'),
      status: z.enum([
        'PLANNED', 'PROCUREMENT', 'DEVELOPMENT', 'STAGING', 'ACTIVE',
        'MAINTENANCE', 'RETIRING', 'DISPOSED',
      ]).optional().describe('Asset lifecycle status (defaults to ACTIVE)'),
      description: z.string().optional().describe('Asset description'),
      businessCriticality: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Business criticality level'),
      dataClassification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional().describe('Data classification level'),
      ownerId: z.string().optional().describe('Owner user UUID'),
      custodianId: z.string().optional().describe('Custodian user UUID'),
      departmentId: z.string().optional().describe('Department UUID'),
      locationId: z.string().optional().describe('Location UUID'),
      fqdn: z.string().optional().describe('Fully qualified domain name'),
      cloudProvider: z.enum([
        'AWS', 'AZURE', 'GCP', 'ORACLE_CLOUD', 'IBM_CLOUD', 'ALIBABA_CLOUD',
        'DIGITAL_OCEAN', 'PRIVATE_CLOUD', 'ON_PREMISES',
      ]).optional().describe('Cloud provider'),
      cloudRegion: z.string().optional().describe('Cloud region'),
      cloudAccountId: z.string().optional().describe('Cloud account ID'),
      cloudResourceId: z.string().optional().describe('Cloud resource ID'),
      inIsmsScope: z.boolean().optional().describe('Whether asset is in ISMS scope'),
      // Data handling
      handlesPersonalData: z.boolean().optional().describe('Whether asset handles personal data'),
      handlesFinancialData: z.boolean().optional().describe('Whether asset handles financial data'),
      handlesHealthData: z.boolean().optional().describe('Whether asset handles health data'),
      handlesConfidentialData: z.boolean().optional().describe('Whether asset handles confidential data'),
      // Compliance scope
      inPciScope: z.boolean().optional().describe('Whether asset is in PCI scope'),
      inDoraScope: z.boolean().optional().describe('Whether asset is in DORA scope'),
      inGdprScope: z.boolean().optional().describe('Whether asset is in GDPR scope'),
      inNis2Scope: z.boolean().optional().describe('Whether asset is in NIS2 scope'),
      inSoc2Scope: z.boolean().optional().describe('Whether asset is in SOC2 scope'),
      scopeNotes: z.string().optional().describe('Scope notes'),
      // Physical location
      datacenter: z.string().optional().describe('Datacenter name'),
      rack: z.string().optional().describe('Rack identifier'),
      rackPosition: z.string().optional().describe('Rack position (e.g. U1-U4)'),
      // Lifecycle
      purchaseDate: z.string().datetime().optional().describe('Purchase date (ISO 8601)'),
      deploymentDate: z.string().datetime().optional().describe('Deployment date (ISO 8601)'),
      warrantyExpiry: z.string().datetime().optional().describe('Warranty expiry date (ISO 8601)'),
      endOfLife: z.string().datetime().optional().describe('End of life date (ISO 8601)'),
      endOfSupport: z.string().datetime().optional().describe('End of support date (ISO 8601)'),
      disposalDate: z.string().datetime().optional().describe('Disposal date (ISO 8601)'),
      lifecycleNotes: z.string().optional().describe('Lifecycle notes'),
      // Technical
      ipAddresses: z.array(z.string()).optional().describe('IP addresses (JSON array)'),
      macAddresses: z.array(z.string()).optional().describe('MAC addresses (JSON array)'),
      operatingSystem: z.string().optional().describe('Operating system'),
      osVersion: z.string().optional().describe('OS version'),
      version: z.string().optional().describe('Software/firmware version'),
      patchLevel: z.string().optional().describe('Current patch level'),
      // Vendor
      manufacturer: z.string().optional().describe('Manufacturer'),
      model: z.string().optional().describe('Model'),
      serialNumber: z.string().optional().describe('Serial number'),
      supportContract: z.string().optional().describe('Support contract reference'),
      supportExpiry: z.string().datetime().optional().describe('Support contract expiry (ISO 8601)'),
      supportTier: z.string().optional().describe('Support tier (e.g. Gold, Silver)'),
      vendorId: z.string().optional().describe('Vendor/external dependency UUID'),
      // Financial
      purchaseCost: z.number().optional().describe('Purchase cost'),
      costCurrency: z.string().optional().describe('Cost currency (e.g. USD, EUR)'),
      annualCost: z.number().optional().describe('Annual cost'),
      costCenter: z.string().optional().describe('Cost center'),
      // Security posture
      encryptionAtRest: z.boolean().optional().describe('Whether encryption at rest is enabled'),
      encryptionInTransit: z.boolean().optional().describe('Whether encryption in transit is enabled'),
      encryptionMethod: z.string().optional().describe('Encryption method'),
      backupEnabled: z.boolean().optional().describe('Whether backups are enabled'),
      backupFrequency: z.string().optional().describe('Backup frequency'),
      backupRetention: z.string().optional().describe('Backup retention period'),
      monitoringEnabled: z.boolean().optional().describe('Whether monitoring is enabled'),
      loggingEnabled: z.boolean().optional().describe('Whether logging is enabled'),
      // Capacity
      cpuCapacity: z.string().optional().describe('CPU capacity'),
      memoryCapacityGB: z.number().optional().describe('Memory capacity in GB'),
      storageCapacityGB: z.number().optional().describe('Storage capacity in GB'),
      networkBandwidthMbps: z.number().optional().describe('Network bandwidth in Mbps'),
      cpuThresholdPercent: z.number().optional().describe('CPU threshold percent'),
      memoryThresholdPercent: z.number().optional().describe('Memory threshold percent'),
      storageThresholdPercent: z.number().optional().describe('Storage threshold percent'),
      capacityNotes: z.string().optional().describe('Capacity notes'),
      // Resilience
      rtoMinutes: z.number().int().optional().describe('Recovery Time Objective in minutes'),
      rpoMinutes: z.number().int().optional().describe('Recovery Point Objective in minutes'),
      mtpdMinutes: z.number().int().optional().describe('Maximum Tolerable Period of Disruption in minutes'),
      targetAvailability: z.number().optional().describe('Target availability percentage (e.g. 99.9)'),
      hasRedundancy: z.boolean().optional().describe('Whether redundancy is configured'),
      redundancyType: z.string().optional().describe('Redundancy type (e.g. active-active, active-passive)'),
      failoverAssetId: z.string().optional().describe('Failover asset UUID'),
      // Metadata
      typeAttributes: z.record(z.string(), z.unknown()).optional().describe('Type-specific attributes (JSON object)'),
      tags: z.array(z.string()).optional().describe('Tags (JSON array)'),
      discoverySource: z.string().optional().describe('Discovery source'),
      organisationId: z.string().optional().describe('Organisation UUID (uses default if omitted)'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_asset', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_ASSET,
        summary: `Create ${params.assetType} asset "${params.name}"${params.businessCriticality ? ` (${params.businessCriticality} criticality)` : ''}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_asset',
        organisationId: params.organisationId,
      });
    }),
  );

  server.tool(
    'propose_asset_update',
    'Propose updating an existing asset. Validates the asset exists before creating the proposal. Requires human approval.',
    {
      assetId: z.string().describe('Asset UUID to update'),
      name: z.string().optional().describe('New asset name'),
      displayName: z.string().optional().describe('New display name'),
      assetSubtype: z.string().optional().describe('New asset subtype'),
      fqdn: z.string().optional().describe('Fully qualified domain name'),
      cloudProvider: z.enum([
        'AWS', 'AZURE', 'GCP', 'ORACLE_CLOUD', 'IBM_CLOUD', 'ALIBABA_CLOUD',
        'DIGITAL_OCEAN', 'PRIVATE_CLOUD', 'ON_PREMISES',
      ]).optional().describe('Cloud provider'),
      status: z.enum([
        'PLANNED', 'PROCUREMENT', 'DEVELOPMENT', 'STAGING', 'ACTIVE',
        'MAINTENANCE', 'RETIRING', 'DISPOSED',
      ]).optional().describe('New lifecycle status'),
      description: z.string().optional().describe('New description'),
      businessCriticality: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('New business criticality'),
      dataClassification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional().describe('New data classification'),
      ownerId: z.string().optional().describe('New owner user UUID'),
      custodianId: z.string().optional().describe('New custodian user UUID'),
      departmentId: z.string().optional().describe('New department UUID'),
      locationId: z.string().optional().describe('New location UUID'),
      inIsmsScope: z.boolean().optional().describe('New ISMS scope setting'),
      // Data handling
      handlesPersonalData: z.boolean().optional().describe('Whether asset handles personal data'),
      handlesFinancialData: z.boolean().optional().describe('Whether asset handles financial data'),
      handlesHealthData: z.boolean().optional().describe('Whether asset handles health data'),
      handlesConfidentialData: z.boolean().optional().describe('Whether asset handles confidential data'),
      // Compliance scope
      inPciScope: z.boolean().optional().describe('Whether asset is in PCI scope'),
      inDoraScope: z.boolean().optional().describe('Whether asset is in DORA scope'),
      inGdprScope: z.boolean().optional().describe('Whether asset is in GDPR scope'),
      inNis2Scope: z.boolean().optional().describe('Whether asset is in NIS2 scope'),
      inSoc2Scope: z.boolean().optional().describe('Whether asset is in SOC2 scope'),
      scopeNotes: z.string().optional().describe('Scope notes'),
      // Cloud location
      cloudRegion: z.string().optional().describe('Cloud region'),
      cloudAccountId: z.string().optional().describe('Cloud account ID'),
      cloudResourceId: z.string().optional().describe('Cloud resource ID'),
      // Physical location
      datacenter: z.string().optional().describe('Datacenter name'),
      rack: z.string().optional().describe('Rack identifier'),
      rackPosition: z.string().optional().describe('Rack position'),
      // Lifecycle
      purchaseDate: z.string().datetime().optional().describe('Purchase date (ISO 8601)'),
      deploymentDate: z.string().datetime().optional().describe('Deployment date (ISO 8601)'),
      warrantyExpiry: z.string().datetime().optional().describe('Warranty expiry date (ISO 8601)'),
      endOfLife: z.string().datetime().optional().describe('End of life date (ISO 8601)'),
      endOfSupport: z.string().datetime().optional().describe('End of support date (ISO 8601)'),
      disposalDate: z.string().datetime().optional().describe('Disposal date (ISO 8601)'),
      lifecycleNotes: z.string().optional().describe('Lifecycle notes'),
      // Technical
      ipAddresses: z.array(z.string()).optional().describe('IP addresses (JSON array)'),
      macAddresses: z.array(z.string()).optional().describe('MAC addresses (JSON array)'),
      operatingSystem: z.string().optional().describe('Operating system'),
      osVersion: z.string().optional().describe('OS version'),
      version: z.string().optional().describe('Software/firmware version'),
      patchLevel: z.string().optional().describe('Current patch level'),
      // Vendor
      manufacturer: z.string().optional().describe('Manufacturer'),
      model: z.string().optional().describe('Model'),
      serialNumber: z.string().optional().describe('Serial number'),
      supportContract: z.string().optional().describe('Support contract reference'),
      supportExpiry: z.string().datetime().optional().describe('Support contract expiry (ISO 8601)'),
      supportTier: z.string().optional().describe('Support tier'),
      vendorId: z.string().optional().describe('Vendor/external dependency UUID'),
      // Financial
      purchaseCost: z.number().optional().describe('Purchase cost'),
      costCurrency: z.string().optional().describe('Cost currency'),
      annualCost: z.number().optional().describe('Annual cost'),
      costCenter: z.string().optional().describe('Cost center'),
      // Security posture
      encryptionAtRest: z.boolean().optional().describe('Whether encryption at rest is enabled'),
      encryptionInTransit: z.boolean().optional().describe('Whether encryption in transit is enabled'),
      encryptionMethod: z.string().optional().describe('Encryption method'),
      backupEnabled: z.boolean().optional().describe('Whether backups are enabled'),
      backupFrequency: z.string().optional().describe('Backup frequency'),
      backupRetention: z.string().optional().describe('Backup retention period'),
      monitoringEnabled: z.boolean().optional().describe('Whether monitoring is enabled'),
      loggingEnabled: z.boolean().optional().describe('Whether logging is enabled'),
      // Capacity
      cpuCapacity: z.string().optional().describe('CPU capacity'),
      memoryCapacityGB: z.number().optional().describe('Memory capacity in GB'),
      storageCapacityGB: z.number().optional().describe('Storage capacity in GB'),
      networkBandwidthMbps: z.number().optional().describe('Network bandwidth in Mbps'),
      cpuThresholdPercent: z.number().optional().describe('CPU threshold percent'),
      memoryThresholdPercent: z.number().optional().describe('Memory threshold percent'),
      storageThresholdPercent: z.number().optional().describe('Storage threshold percent'),
      capacityNotes: z.string().optional().describe('Capacity notes'),
      // Resilience
      rtoMinutes: z.number().int().optional().describe('Recovery Time Objective in minutes'),
      rpoMinutes: z.number().int().optional().describe('Recovery Point Objective in minutes'),
      mtpdMinutes: z.number().int().optional().describe('Maximum Tolerable Period of Disruption in minutes'),
      targetAvailability: z.number().optional().describe('Target availability percentage'),
      hasRedundancy: z.boolean().optional().describe('Whether redundancy is configured'),
      redundancyType: z.string().optional().describe('Redundancy type'),
      failoverAssetId: z.string().optional().describe('Failover asset UUID'),
      // Metadata
      typeAttributes: z.record(z.string(), z.unknown()).optional().describe('Type-specific attributes (JSON object)'),
      tags: z.array(z.string()).optional().describe('Tags (JSON array)'),
      discoverySource: z.string().optional().describe('Discovery source'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_asset_update', async (params) => {
      const asset = await prisma.asset.findUnique({
        where: { id: params.assetId },
        select: { id: true, assetTag: true, name: true },
      });
      if (!asset) {
        return { content: [{ type: 'text' as const, text: `Asset ${params.assetId} not found` }], isError: true };
      }

      const orgId = await getDefaultOrganisationId();

      return createPendingAction({
        actionType: McpActionType.UPDATE_ASSET,
        summary: `Update asset ${asset.assetTag} (${asset.name})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_asset_update',
        organisationId: orgId,
      });
    }),
  );

  server.tool(
    'propose_asset_relationship',
    'Propose creating a relationship between two assets (dependency, hosting, network, data flow, etc.). Requires human approval.',
    {
      fromAssetId: z.string().describe('Source asset UUID'),
      toAssetId: z.string().describe('Target asset UUID'),
      relationshipType: z.enum([
        'DEPENDS_ON', 'RUNS_ON', 'HOSTED_ON', 'DEPLOYED_TO', 'CONNECTS_TO',
        'STORES_DATA_ON', 'READS_FROM', 'WRITES_TO', 'REPLICATES_TO',
        'MANAGED_BY', 'MONITORED_BY', 'BACKED_UP_TO', 'FAILS_OVER_TO',
        'PROTECTED_BY', 'AUTHENTICATES_VIA', 'MEMBER_OF', 'CONTAINS',
      ]).describe('Type of relationship between assets'),
      isCritical: z.boolean().optional().describe('Whether this is a critical dependency'),
      description: z.string().optional().describe('Relationship description'),
      notes: z.string().optional().describe('Additional notes about the relationship'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_asset_relationship', async (params) => {
      // Validate both assets exist
      const [fromAsset, toAsset] = await Promise.all([
        prisma.asset.findUnique({ where: { id: params.fromAssetId }, select: { id: true, assetTag: true, name: true } }),
        prisma.asset.findUnique({ where: { id: params.toAssetId }, select: { id: true, assetTag: true, name: true } }),
      ]);
      if (!fromAsset) {
        return { content: [{ type: 'text' as const, text: `Source asset ${params.fromAssetId} not found` }], isError: true };
      }
      if (!toAsset) {
        return { content: [{ type: 'text' as const, text: `Target asset ${params.toAssetId} not found` }], isError: true };
      }

      const orgId = await getDefaultOrganisationId();

      return createPendingAction({
        actionType: McpActionType.CREATE_ASSET_RELATIONSHIP,
        summary: `Create relationship: ${fromAsset.assetTag} ${params.relationshipType} ${toAsset.assetTag}${params.isCritical ? ' (CRITICAL)' : ''}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_asset_relationship',
        organisationId: orgId,
      });
    }),
  );

  server.tool(
    'propose_link_asset_control',
    'Propose linking an asset to a security control. Tracks which controls protect which assets. Requires human approval.',
    {
      assetId: z.string().describe('Asset UUID'),
      controlId: z.string().describe('Control UUID'),
      status: z.string().optional().describe('Implementation status (e.g. "planned", "implemented", "verified")'),
      implementationNotes: z.string().optional().describe('Notes about how the control is implemented for this asset'),
      implementedDate: z.string().datetime().optional().describe('Date the control was implemented (ISO 8601)'),
      evidenceUrl: z.string().optional().describe('URL to implementation evidence'),
      lastVerified: z.string().datetime().optional().describe('Date the implementation was last verified (ISO 8601)'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_link_asset_control', async (params) => {
      const [asset, control] = await Promise.all([
        prisma.asset.findUnique({ where: { id: params.assetId }, select: { id: true, assetTag: true, name: true } }),
        prisma.control.findUnique({ where: { id: params.controlId }, select: { id: true, controlId: true, name: true, organisationId: true } }),
      ]);
      if (!asset) {
        return { content: [{ type: 'text' as const, text: `Asset ${params.assetId} not found` }], isError: true };
      }
      if (!control) {
        return { content: [{ type: 'text' as const, text: `Control ${params.controlId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.LINK_ASSET_CONTROL,
        summary: `Link asset ${asset.assetTag} to control ${control.controlId} (${control.name})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_link_asset_control',
        organisationId: control.organisationId,
      });
    }),
  );

  server.tool(
    'propose_link_asset_risk',
    'Propose linking an asset to a risk. Tracks which risks affect which assets. Requires human approval.',
    {
      assetId: z.string().describe('Asset UUID'),
      riskId: z.string().describe('Risk UUID'),
      impactLevel: z.string().optional().describe('Impact level if this asset is compromised (critical, high, medium, low)'),
      notes: z.string().optional().describe('Notes about the risk-asset relationship'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_link_asset_risk', async (params) => {
      const [asset, risk] = await Promise.all([
        prisma.asset.findUnique({ where: { id: params.assetId }, select: { id: true, assetTag: true, name: true } }),
        prisma.risk.findUnique({ where: { id: params.riskId }, select: { id: true, riskId: true, title: true, organisationId: true } }),
      ]);
      if (!asset) {
        return { content: [{ type: 'text' as const, text: `Asset ${params.assetId} not found` }], isError: true };
      }
      if (!risk) {
        return { content: [{ type: 'text' as const, text: `Risk ${params.riskId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.LINK_ASSET_RISK,
        summary: `Link asset ${asset.assetTag} to risk ${risk.riskId} (${risk.title})${params.impactLevel ? ` — ${params.impactLevel} impact` : ''}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_link_asset_risk',
        organisationId: risk.organisationId,
      });
    }),
  );

  server.tool(
    'propose_delete_asset',
    'Propose deleting/disposing an asset from the CMDB. Validates the asset exists before creating the proposal. Requires human approval.',
    {
      assetId: z.string().describe('Asset UUID to delete/dispose'),
      disposalReason: z.string().describe('Reason for disposing the asset'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_delete_asset', async (params) => {
      const asset = await prisma.asset.findUnique({
        where: { id: params.assetId },
        select: { id: true, assetTag: true, name: true },
      });
      if (!asset) {
        return { content: [{ type: 'text' as const, text: `Asset ${params.assetId} not found` }], isError: true };
      }

      const orgId = await getDefaultOrganisationId();

      return createPendingAction({
        actionType: McpActionType.DELETE_ASSET,
        summary: `Delete/dispose asset ${asset.assetTag} (${asset.name}): ${params.disposalReason}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_delete_asset',
        organisationId: orgId,
      });
    }),
  );
}

// ========================================
// CHANGE MUTATIONS
// ========================================

function registerChangeMutations(server: McpServer) {
  server.tool(
    'propose_change',
    'Propose creating a new change request. The proposal goes into an approval queue for human review before execution.',
    {
      title: z.string().describe('Change request title'),
      description: z.string().describe('Change request description'),
      changeType: z.enum(['STANDARD', 'NORMAL', 'EMERGENCY']).describe('Change type classification'),
      category: z.enum([
        'ACCESS_CONTROL', 'CONFIGURATION', 'INFRASTRUCTURE', 'APPLICATION', 'DATABASE',
        'SECURITY', 'NETWORK', 'BACKUP_DR', 'MONITORING', 'VENDOR', 'DOCUMENTATION', 'OTHER',
      ]).describe('Change category'),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Priority level'),
      securityImpact: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).optional().describe('Security impact level'),
      businessJustification: z.string().optional().describe('Business justification for the change'),
      plannedStart: z.string().datetime().optional().describe('Planned start date (ISO 8601)'),
      plannedEnd: z.string().datetime().optional().describe('Planned end date (ISO 8601)'),
      backoutPlan: z.string().optional().describe('Backout/rollback plan'),
      impactAssessment: z.string().optional().describe('Impact assessment'),
      affectedServices: z.string().optional().describe('Affected services'),
      userImpact: z.string().optional().describe('User impact description'),
      riskLevel: z.string().optional().describe('Risk level'),
      riskAssessment: z.string().optional().describe('Risk assessment'),
      rollbackTime: z.string().optional().describe('Estimated rollback time'),
      testPlan: z.string().optional().describe('Test plan'),
      maintenanceWindow: z.string().optional().describe('Maintenance window'),
      outageRequired: z.boolean().optional().describe('Whether an outage is required'),
      estimatedDowntime: z.string().optional().describe('Estimated downtime'),
      cabRequired: z.boolean().optional().describe('Whether CAB review is required'),
      cabMeetingDate: z.string().datetime().optional().describe('CAB meeting date (ISO 8601)'),
      successCriteria: z.string().optional().describe('Success criteria'),
      parentChangeId: z.string().optional().describe('Parent change UUID'),
      incidentId: z.string().optional().describe('Related incident UUID'),
      implementerId: z.string().optional().describe('Implementer user UUID'),
      departmentId: z.string().optional().describe('Department UUID'),
      vendorId: z.string().optional().describe('Vendor/external dependency UUID'),
      organisationId: z.string().optional().describe('Organisation UUID (uses default if omitted)'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_change', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_CHANGE,
        summary: `Create ${params.changeType} change "${params.title}" (${params.category}, ${params.securityImpact || 'LOW'} security impact)`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_change',
        organisationId: params.organisationId,
      });
    }),
  );

  server.tool(
    'propose_update_change',
    'Propose updating a change request. Validates the change exists before creating the proposal. Requires human approval.',
    {
      changeId: z.string().describe('Change UUID to update'),
      title: z.string().optional().describe('New change title'),
      description: z.string().optional().describe('New change description'),
      changeType: z.enum(['STANDARD', 'NORMAL', 'EMERGENCY']).optional().describe('New change type'),
      category: z.enum([
        'ACCESS_CONTROL', 'CONFIGURATION', 'INFRASTRUCTURE', 'APPLICATION', 'DATABASE',
        'SECURITY', 'NETWORK', 'BACKUP_DR', 'MONITORING', 'VENDOR', 'DOCUMENTATION', 'OTHER',
      ]).optional().describe('New change category'),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('New priority level'),
      securityImpact: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).optional().describe('New security impact level'),
      businessJustification: z.string().optional().describe('Business justification'),
      status: z.enum([
        'DRAFTED', 'SUBMITTED', 'PENDING_APPROVAL', 'NEEDS_INFO', 'APPROVED', 'REJECTED',
        'SCHEDULED', 'IMPLEMENTING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK',
        'CANCELLED', 'REVIEWED',
      ]).optional().describe('New change status'),
      impactAssessment: z.string().optional().describe('Impact assessment'),
      affectedServices: z.string().optional().describe('Affected services'),
      userImpact: z.string().optional().describe('User impact description'),
      riskLevel: z.string().optional().describe('Risk level'),
      riskAssessment: z.string().optional().describe('Risk assessment'),
      backoutPlan: z.string().optional().describe('Backout/rollback plan'),
      rollbackTime: z.string().optional().describe('Estimated rollback time'),
      testPlan: z.string().optional().describe('Test plan'),
      plannedStart: z.string().datetime().optional().describe('Planned start date (ISO 8601)'),
      plannedEnd: z.string().datetime().optional().describe('Planned end date (ISO 8601)'),
      actualStart: z.string().datetime().optional().describe('Actual start date (ISO 8601)'),
      actualEnd: z.string().datetime().optional().describe('Actual end date (ISO 8601)'),
      maintenanceWindow: z.string().optional().describe('Maintenance window'),
      outageRequired: z.boolean().optional().describe('Whether an outage is required'),
      estimatedDowntime: z.string().optional().describe('Estimated downtime'),
      implementationNotes: z.string().optional().describe('Implementation notes'),
      successCriteria: z.string().optional().describe('Success criteria'),
      implementerId: z.string().optional().describe('Implementer user UUID'),
      departmentId: z.string().optional().describe('Department UUID'),
      parentChangeId: z.string().optional().describe('Parent change UUID'),
      vendorId: z.string().optional().describe('Vendor/external dependency UUID'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_update_change', async (params) => {
      const change = await prisma.change.findUnique({
        where: { id: params.changeId },
        select: { id: true, changeRef: true, title: true },
      });
      if (!change) {
        return { content: [{ type: 'text' as const, text: `Change ${params.changeId} not found` }], isError: true };
      }

      const orgId = await getDefaultOrganisationId();

      return createPendingAction({
        actionType: McpActionType.UPDATE_CHANGE,
        summary: `Update change ${change.changeRef} (${change.title})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_change',
        organisationId: orgId,
      });
    }),
  );

  server.tool(
    'propose_approve_change',
    'Propose approving a change request. Validates the change exists before creating the proposal. Requires human approval.',
    {
      changeId: z.string().describe('Change UUID to approve'),
      comments: z.string().optional().describe('Approval comments'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_approve_change', async (params) => {
      const change = await prisma.change.findUnique({
        where: { id: params.changeId },
        select: { id: true, changeRef: true, title: true },
      });
      if (!change) {
        return { content: [{ type: 'text' as const, text: `Change ${params.changeId} not found` }], isError: true };
      }

      const orgId = await getDefaultOrganisationId();

      return createPendingAction({
        actionType: McpActionType.APPROVE_CHANGE,
        summary: `Approve change ${change.changeRef} (${change.title})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_approve_change',
        organisationId: orgId,
      });
    }),
  );

  server.tool(
    'propose_reject_change',
    'Propose rejecting a change request. Validates the change exists before creating the proposal. Requires human approval.',
    {
      changeId: z.string().describe('Change UUID to reject'),
      rejectionReason: z.string().describe('Reason for rejecting the change'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_reject_change', async (params) => {
      const change = await prisma.change.findUnique({
        where: { id: params.changeId },
        select: { id: true, changeRef: true, title: true },
      });
      if (!change) {
        return { content: [{ type: 'text' as const, text: `Change ${params.changeId} not found` }], isError: true };
      }

      const orgId = await getDefaultOrganisationId();

      return createPendingAction({
        actionType: McpActionType.REJECT_CHANGE,
        summary: `Reject change ${change.changeRef} (${change.title}): ${params.rejectionReason}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_reject_change',
        organisationId: orgId,
      });
    }),
  );

  server.tool(
    'propose_implement_change',
    'Propose marking a change request as implementing. Validates the change exists before creating the proposal. Requires human approval.',
    {
      changeId: z.string().describe('Change UUID to mark as implementing'),
      implementationNotes: z.string().optional().describe('Implementation notes'),
      actualStart: z.string().datetime().optional().describe('Actual start date (ISO 8601)'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_implement_change', async (params) => {
      const change = await prisma.change.findUnique({
        where: { id: params.changeId },
        select: { id: true, changeRef: true, title: true },
      });
      if (!change) {
        return { content: [{ type: 'text' as const, text: `Change ${params.changeId} not found` }], isError: true };
      }

      const orgId = await getDefaultOrganisationId();

      return createPendingAction({
        actionType: McpActionType.IMPLEMENT_CHANGE,
        summary: `Mark change ${change.changeRef} (${change.title}) as implementing`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_implement_change',
        organisationId: orgId,
      });
    }),
  );

  server.tool(
    'propose_complete_change',
    'Propose completing a change request. Validates the change exists before creating the proposal. Requires human approval.',
    {
      changeId: z.string().describe('Change UUID to complete'),
      successful: z.boolean().describe('Whether the change was successful'),
      completionNotes: z.string().optional().describe('Completion notes'),
      testResults: z.string().optional().describe('Test results'),
      lessonsLearned: z.string().optional().describe('Lessons learned'),
      pirRequired: z.boolean().optional().describe('Whether post-implementation review is required'),
      pirNotes: z.string().optional().describe('Post-implementation review notes'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_complete_change', async (params) => {
      const change = await prisma.change.findUnique({
        where: { id: params.changeId },
        select: { id: true, changeRef: true, title: true },
      });
      if (!change) {
        return { content: [{ type: 'text' as const, text: `Change ${params.changeId} not found` }], isError: true };
      }

      const orgId = await getDefaultOrganisationId();

      return createPendingAction({
        actionType: McpActionType.COMPLETE_CHANGE,
        summary: `Complete change ${change.changeRef} (${change.title}) — ${params.successful ? 'successful' : 'unsuccessful'}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_complete_change',
        organisationId: orgId,
      });
    }),
  );

  server.tool(
    'propose_cancel_change',
    'Propose cancelling a change request. Validates the change exists before creating the proposal. Requires human approval.',
    {
      changeId: z.string().describe('Change UUID to cancel'),
      cancellationReason: z.string().describe('Reason for cancelling the change'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_cancel_change', async (params) => {
      const change = await prisma.change.findUnique({
        where: { id: params.changeId },
        select: { id: true, changeRef: true, title: true },
      });
      if (!change) {
        return { content: [{ type: 'text' as const, text: `Change ${params.changeId} not found` }], isError: true };
      }

      const orgId = await getDefaultOrganisationId();

      return createPendingAction({
        actionType: McpActionType.CANCEL_CHANGE,
        summary: `Cancel change ${change.changeRef} (${change.title}): ${params.cancellationReason}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_cancel_change',
        organisationId: orgId,
      });
    }),
  );
}

// ========================================
// ITSM INCIDENT MUTATIONS
// ========================================

function registerIncidentItsmMutations(_server: McpServer) {
  // Placeholder for future ITSM incident mutation tools.
  // Incident mutations are currently handled by the dedicated mcp-server-incidents.
}

// ========================================
// CAPACITY MUTATIONS
// ========================================

function registerCapacityMutations(server: McpServer) {
  server.tool(
    'propose_capacity_plan',
    'Propose creating a new capacity plan for an asset. Supports NIS2 capacity management requirements. Requires human approval.',
    {
      title: z.string().describe('Capacity plan title'),
      assetId: z.string().optional().describe('Asset UUID (optional if planning for a group)'),
      assetGroup: z.string().optional().describe('Asset group name (alternative to specific assetId)'),
      description: z.string().optional().describe('Plan description'),
      currentCapacity: z.string().describe('Description of current capacity'),
      currentUtilizationPercent: z.number().int().min(0).max(100).optional().describe('Current utilization percentage'),
      projectedGrowthPercent: z.number().optional().describe('Projected growth percentage'),
      projectionPeriodMonths: z.number().int().optional().describe('Projection period in months'),
      recommendedAction: z.string().optional().describe('Recommended action to address capacity'),
      estimatedCost: z.number().optional().describe('Estimated cost for the recommended action'),
      projectedExhaustionDate: z.string().datetime().optional().describe('Projected capacity exhaustion date (ISO 8601)'),
      recommendedDate: z.string().datetime().optional().describe('Recommended action date (ISO 8601)'),
      costCurrency: z.string().optional().describe('Cost currency (e.g. USD, EUR)'),
      reviewDate: z.string().datetime().optional().describe('Next review date (ISO 8601)'),
      organisationId: z.string().optional().describe('Organisation UUID (uses default if omitted)'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_capacity_plan', async (params) => {
      // Validate asset if provided
      if (params.assetId) {
        const asset = await prisma.asset.findUnique({
          where: { id: params.assetId },
          select: { id: true, assetTag: true, name: true },
        });
        if (!asset) {
          return { content: [{ type: 'text' as const, text: `Asset ${params.assetId} not found` }], isError: true };
        }
      }

      return createPendingAction({
        actionType: McpActionType.CREATE_CAPACITY_PLAN,
        summary: `Create capacity plan "${params.title}"${params.projectedGrowthPercent ? ` (${params.projectedGrowthPercent}% projected growth)` : ''}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_capacity_plan',
        organisationId: params.organisationId,
      });
    }),
  );

  server.tool(
    'propose_update_capacity_plan',
    'Propose updating a capacity plan. Validates the capacity plan exists before creating the proposal. Requires human approval.',
    {
      capacityPlanId: z.string().describe('Capacity plan UUID to update'),
      title: z.string().optional().describe('New capacity plan title'),
      description: z.string().optional().describe('New description'),
      status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional().describe('New capacity plan status'),
      currentCapacity: z.string().optional().describe('Current capacity description'),
      currentUtilizationPercent: z.number().int().min(0).max(100).optional().describe('Current utilization percentage'),
      projectedGrowthPercent: z.number().optional().describe('New projected growth percentage'),
      projectionPeriodMonths: z.number().int().optional().describe('Projection period in months'),
      projectedExhaustionDate: z.string().datetime().optional().describe('Projected capacity exhaustion date (ISO 8601)'),
      recommendedAction: z.string().optional().describe('New recommended action'),
      estimatedCost: z.number().optional().describe('Estimated cost'),
      costCurrency: z.string().optional().describe('Cost currency'),
      reviewDate: z.string().datetime().optional().describe('Next review date (ISO 8601)'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_update_capacity_plan', async (params) => {
      const plan = await prisma.capacityPlan.findUnique({
        where: { id: params.capacityPlanId },
        select: { id: true, title: true },
      });
      if (!plan) {
        return { content: [{ type: 'text' as const, text: `Capacity plan ${params.capacityPlanId} not found` }], isError: true };
      }

      const orgId = await getDefaultOrganisationId();

      return createPendingAction({
        actionType: McpActionType.UPDATE_CAPACITY_PLAN,
        summary: `Update capacity plan "${plan.title}"`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_capacity_plan',
        organisationId: orgId,
      });
    }),
  );
}

// ========================================
// ORCHESTRATOR
// ========================================

export function registerMutationTools(server: McpServer) {
  registerAssetMutations(server);
  registerChangeMutations(server);
  registerIncidentItsmMutations(server);
  registerCapacityMutations(server);
}
