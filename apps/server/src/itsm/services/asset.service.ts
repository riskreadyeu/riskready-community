import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AssetService {
  constructor(private prisma: PrismaService) { }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.AssetWhereInput;
    orderBy?: Prisma.AssetOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.asset.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        select: {
          id: true,
          assetTag: true,
          name: true,
          assetType: true,
          assetSubtype: true,
          status: true,
          businessCriticality: true,
          dataClassification: true,
          riskScore: true,
          createdAt: true,
          // Compliance scope flags (used by DORA Report & Cloud Dashboard)
          inDoraScope: true,
          inNis2Scope: true,
          inIsmsScope: true,
          // Data handling flags (used by DORA Report)
          handlesPersonalData: true,
          handlesFinancialData: true,
          // Cloud fields (used by Cloud Dashboard)
          cloudProvider: true,
          cloudRegion: true,
          // Resilience fields (used by DORA Report)
          rtoMinutes: true,
          ownerId: true,
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
          _count: {
            select: {
              outgoingRelationships: true,
              incomingRelationships: true,
              controlLinks: true,
              changeLinks: true,
            },
          },
        },
      }),
      this.prisma.asset.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        custodian: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, departmentCode: true } },
        location: { select: { id: true, name: true, locationCode: true, city: true, country: true } },
        vendor: { select: { id: true, name: true, dependencyType: true, criticalityLevel: true } },
        outgoingRelationships: {
          include: {
            toAsset: { select: { id: true, assetTag: true, name: true, assetType: true, status: true } },
          },
        },
        incomingRelationships: {
          include: {
            fromAsset: { select: { id: true, assetTag: true, name: true, assetType: true, status: true } },
          },
        },
        businessProcessLinks: {
          include: {
            businessProcess: { select: { id: true, name: true, processCode: true, criticalityLevel: true } },
          },
        },
        controlLinks: {
          include: {
            control: { select: { id: true, controlId: true, name: true, framework: true } },
          },
        },
        changeLinks: {
          include: {
            change: { select: { id: true, changeRef: true, title: true, status: true } },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        installedSoftware: {
          select: {
            id: true,
            softwareName: true,
            softwareVersion: true,
            vendor: true,
            licenseType: true,
            isApproved: true,
            installDate: true,
          },
        },
        capacityRecords: {
          take: 30,
          orderBy: { recordedAt: 'desc' },
          select: {
            id: true,
            cpuUsagePercent: true,
            memoryUsagePercent: true,
            storageUsagePercent: true,
            networkUsagePercent: true,
            recordedAt: true,
            source: true,
          },
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return asset;
  }

  async findByAssetTag(assetTag: string) {
    return this.prisma.asset.findUnique({
      where: { assetTag },
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, departmentCode: true } },
      },
    });
  }

  async create(data: Prisma.AssetCreateInput) {
    return this.prisma.asset.create({
      data,
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, departmentCode: true } },
        location: { select: { id: true, name: true, locationCode: true } },
      },
    });
  }

  async update(id: string, data: Prisma.AssetUpdateInput) {
    return this.prisma.asset.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, departmentCode: true } },
        location: { select: { id: true, name: true, locationCode: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.asset.delete({ where: { id } });
  }

  async getSummary() {
    const [
      total,
      active,
      critical,
      byType,
      byStatus,
      byCriticality,
      capacityWarning,
      inScope,
    ] = await Promise.all([
      this.prisma.asset.count(),
      this.prisma.asset.count({ where: { status: 'ACTIVE' } }),
      this.prisma.asset.count({ where: { businessCriticality: 'CRITICAL' } }),
      this.prisma.asset.groupBy({
        by: ['assetType'],
        _count: { _all: true },
      }),
      this.prisma.asset.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.asset.groupBy({
        by: ['businessCriticality'],
        _count: { _all: true },
      }),
      this.prisma.asset.count({
        where: {
          capacityStatus: { in: ['WARNING', 'CRITICAL', 'EXHAUSTED'] },
        },
      }),
      this.prisma.asset.count({ where: { inIsmsScope: true } }),
    ]);

    return {
      total,
      active,
      critical,
      capacityWarning,
      inScope,
      byType: byType.reduce((acc, item) => {
        acc[item.assetType] = item._count._all;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      }, {} as Record<string, number>),
      byCriticality: byCriticality.reduce((acc, item) => {
        acc[item.businessCriticality] = item._count._all;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async getImpactAnalysis(id: string) {
    // Get all assets that depend on this asset (direct and transitive)
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        incomingRelationships: {
          where: { relationshipType: 'DEPENDS_ON' },
          include: {
            fromAsset: {
              select: {
                id: true,
                assetTag: true,
                name: true,
                assetType: true,
                businessCriticality: true,
                status: true,
              },
            },
          },
        },
        businessProcessLinks: {
          include: {
            businessProcess: {
              select: {
                id: true,
                name: true,
                processCode: true,
                criticalityLevel: true,
              },
            },
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    // Count impacted assets by criticality
    const directlyImpacted = asset.incomingRelationships.map((rel) => rel.fromAsset);
    const impactedByBusinessCriticality = directlyImpacted.reduce(
      (acc, a) => {
        acc[a.businessCriticality] = (acc[a.businessCriticality] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      asset: {
        id: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        assetType: asset.assetType,
        businessCriticality: asset.businessCriticality,
      },
      directlyImpactedAssets: directlyImpacted,
      impactedBusinessProcesses: asset.businessProcessLinks.map((l) => l.businessProcess),
      summary: {
        totalDirectlyImpacted: directlyImpacted.length,
        impactedByBusinessCriticality,
        impactedProcessCount: asset.businessProcessLinks.length,
      },
    };
  }

  async generateAssetTag(assetType: string): Promise<string> {
    // Generate asset tag like AST-SRV-001
    const prefix = this.getAssetTypePrefix(assetType);
    const lastAsset = await this.prisma.asset.findFirst({
      where: {
        assetTag: { startsWith: prefix },
      },
      orderBy: { assetTag: 'desc' },
    });

    let nextNumber = 1;
    if (lastAsset) {
      const match = lastAsset.assetTag.match(/-(\d+)$/);
      if (match?.[1]) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  }

  private getAssetTypePrefix(assetType: string): string {
    const prefixes: Record<string, string> = {
      SERVER: 'AST-SRV',
      WORKSTATION: 'AST-WKS',
      LAPTOP: 'AST-LPT',
      MOBILE_DEVICE: 'AST-MOB',
      NETWORK_DEVICE: 'AST-NET',
      STORAGE_DEVICE: 'AST-STR',
      DATABASE: 'AST-DB',
      APPLICATION: 'AST-APP',
      CLOUD_VM: 'AST-CVM',
      CLOUD_DATABASE: 'AST-CDB',
      CLOUD_STORAGE: 'AST-CST',
      SAAS_APPLICATION: 'AST-SAS',
      INTERNAL_SERVICE: 'AST-ISV',
      EXTERNAL_SERVICE: 'AST-ESV',
    };
    return prefixes[assetType] || 'AST-OTH';
  }

  async importAssets(assets: any[]): Promise<{
    imported: number;
    updated: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const results = {
      imported: 0,
      updated: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    for (let i = 0; i < assets.length; i++) {
      const row = assets[i];
      try {
        // Check if asset with this tag already exists
        const existing = row.assetTag
          ? await this.prisma.asset.findUnique({
            where: { assetTag: row.assetTag },
          })
          : null;

        const data = {
          assetTag: row.assetTag || (await this.generateAssetTag(row.assetType || 'OTHER')),
          name: row.name,
          displayName: row.displayName || undefined,
          description: row.description || undefined,
          assetType: row.assetType || 'OTHER',
          assetSubtype: row.assetSubtype || undefined,
          businessCriticality: row.businessCriticality || 'MEDIUM',
          dataClassification: row.dataClassification || 'INTERNAL',
          handlesPersonalData: row.handlesPersonalData === 'true' || row.handlesPersonalData === true,
          handlesFinancialData: row.handlesFinancialData === 'true' || row.handlesFinancialData === true,
          handlesHealthData: row.handlesHealthData === 'true' || row.handlesHealthData === true,
          handlesConfidentialData: row.handlesConfidentialData === 'true' || row.handlesConfidentialData === true,
          inIsmsScope: row.inIsmsScope !== 'false' && row.inIsmsScope !== false,
          inPciScope: row.inPciScope === 'true' || row.inPciScope === true,
          inDoraScope: row.inDoraScope === 'true' || row.inDoraScope === true,
          inGdprScope: row.inGdprScope === 'true' || row.inGdprScope === true,
          inNis2Scope: row.inNis2Scope === 'true' || row.inNis2Scope === true,
          inSoc2Scope: row.inSoc2Scope === 'true' || row.inSoc2Scope === true,
          status: row.status || 'ACTIVE',
          cloudProvider: row.cloudProvider || undefined,
          cloudRegion: row.cloudRegion || undefined,
          fqdn: row.fqdn || undefined,
          operatingSystem: row.operatingSystem || undefined,
          osVersion: row.osVersion || undefined,
          manufacturer: row.manufacturer || undefined,
          model: row.model || undefined,
          serialNumber: row.serialNumber || undefined,
          rtoMinutes: row.rtoMinutes ? parseInt(row.rtoMinutes) : undefined,
          rpoMinutes: row.rpoMinutes ? parseInt(row.rpoMinutes) : undefined,
          targetAvailability: row.targetAvailability ? parseFloat(row.targetAvailability) : undefined,
          hasRedundancy: row.hasRedundancy === 'true' || row.hasRedundancy === true,
        };

        if (existing) {
          await this.prisma.asset.update({
            where: { id: existing.id },
            data,
          });
          results.updated++;
        } else {
          await this.prisma.asset.create({ data });
          results.imported++;
        }
      } catch (error: any) {
        results.errors.push({
          row: i + 1,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }

  getImportTemplate() {
    return {
      columns: [
        { field: 'assetTag', label: 'Asset Tag', required: false, description: 'Auto-generated if not provided' },
        { field: 'name', label: 'Name', required: true, description: 'Asset name' },
        { field: 'displayName', label: 'Display Name', required: false },
        { field: 'description', label: 'Description', required: false },
        {
          field: 'assetType', label: 'Asset Type', required: true, values: [
            'SERVER', 'WORKSTATION', 'LAPTOP', 'MOBILE_DEVICE', 'NETWORK_DEVICE', 'STORAGE_DEVICE',
            'DATABASE', 'APPLICATION', 'OPERATING_SYSTEM', 'MIDDLEWARE',
            'CLOUD_VM', 'CLOUD_CONTAINER', 'CLOUD_DATABASE', 'CLOUD_STORAGE', 'CLOUD_SERVERLESS',
            'INTERNAL_SERVICE', 'EXTERNAL_SERVICE', 'SAAS_APPLICATION', 'API_ENDPOINT', 'OTHER'
          ]
        },
        { field: 'assetSubtype', label: 'Subtype', required: false },
        { field: 'businessCriticality', label: 'Business Criticality', required: false, values: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
        { field: 'dataClassification', label: 'Data Classification', required: false, values: ['RESTRICTED', 'CONFIDENTIAL', 'INTERNAL', 'PUBLIC'], default: 'INTERNAL' },
        { field: 'status', label: 'Status', required: false, values: ['PLANNED', 'PROCUREMENT', 'DEVELOPMENT', 'STAGING', 'ACTIVE', 'MAINTENANCE', 'RETIRING', 'DISPOSED'], default: 'ACTIVE' },
        { field: 'handlesPersonalData', label: 'Handles Personal Data', required: false, values: ['true', 'false'], default: 'false' },
        { field: 'handlesFinancialData', label: 'Handles Financial Data', required: false, values: ['true', 'false'], default: 'false' },
        { field: 'handlesHealthData', label: 'Handles Health Data', required: false, values: ['true', 'false'], default: 'false' },
        { field: 'handlesConfidentialData', label: 'Handles Confidential Data', required: false, values: ['true', 'false'], default: 'false' },
        { field: 'inIsmsScope', label: 'In ISMS Scope', required: false, values: ['true', 'false'], default: 'true' },
        { field: 'inPciScope', label: 'In PCI Scope', required: false, values: ['true', 'false'], default: 'false' },
        { field: 'inDoraScope', label: 'In DORA Scope', required: false, values: ['true', 'false'], default: 'false' },
        { field: 'inGdprScope', label: 'In GDPR Scope', required: false, values: ['true', 'false'], default: 'false' },
        { field: 'inNis2Scope', label: 'In NIS2 Scope', required: false, values: ['true', 'false'], default: 'false' },
        { field: 'inSoc2Scope', label: 'In SOC2 Scope', required: false, values: ['true', 'false'], default: 'false' },
        { field: 'cloudProvider', label: 'Cloud Provider', required: false, values: ['AWS', 'AZURE', 'GCP', 'ORACLE_CLOUD', 'IBM_CLOUD', 'DIGITAL_OCEAN', 'PRIVATE_CLOUD', 'ON_PREMISES'] },
        { field: 'cloudRegion', label: 'Cloud Region', required: false },
        { field: 'fqdn', label: 'FQDN', required: false },
        { field: 'operatingSystem', label: 'Operating System', required: false },
        { field: 'osVersion', label: 'OS Version', required: false },
        { field: 'manufacturer', label: 'Manufacturer', required: false },
        { field: 'model', label: 'Model', required: false },
        { field: 'serialNumber', label: 'Serial Number', required: false },
        { field: 'rtoMinutes', label: 'RTO (minutes)', required: false },
        { field: 'rpoMinutes', label: 'RPO (minutes)', required: false },
        { field: 'targetAvailability', label: 'Target Availability (%)', required: false },
        { field: 'hasRedundancy', label: 'Has Redundancy', required: false, values: ['true', 'false'], default: 'false' },
      ],
      sampleData: [
        {
          name: 'Production Database Server',
          assetType: 'SERVER',
          businessCriticality: 'CRITICAL',
          dataClassification: 'RESTRICTED',
          handlesPersonalData: 'true',
          inIsmsScope: 'true',
          operatingSystem: 'Ubuntu',
          osVersion: '22.04 LTS',
          rtoMinutes: '60',
          rpoMinutes: '15',
        },
        {
          name: 'AWS EC2 Web Server',
          assetType: 'CLOUD_VM',
          businessCriticality: 'HIGH',
          cloudProvider: 'AWS',
          cloudRegion: 'us-east-1',
          inDoraScope: 'true',
        },
      ],
    };
  }

  async getDataQuality(): Promise<{
    totalAssets: number;
    completeness: {
      withOwner: number;
      withDepartment: number;
      withLocation: number;
      withDescription: number;
      withDataClassification: number;
      withCriticality: number;
      withRto: number;
      withRpo: number;
    };
    percentages: {
      ownerPercent: number;
      departmentPercent: number;
      locationPercent: number;
      descriptionPercent: number;
      rtoRpoPercent: number;
      overallScore: number;
    };
    issues: Array<{
      type: string;
      count: number;
      severity: 'high' | 'medium' | 'low';
      description: string;
    }>;
  }> {
    const [
      totalAssets,
      withOwner,
      withDepartment,
      withLocation,
      withDescription,
      withRto,
      withRpo,
      criticalWithoutOwner,
      activeWithoutLocation,
    ] = await Promise.all([
      this.prisma.asset.count(),
      this.prisma.asset.count({ where: { ownerId: { not: null } } }),
      this.prisma.asset.count({ where: { departmentId: { not: null } } }),
      this.prisma.asset.count({
        where: {
          OR: [
            { locationId: { not: null } },
            { cloudProvider: { not: null } },
          ],
        },
      }),
      this.prisma.asset.count({
        where: {
          description: { not: null },
          NOT: { description: '' },
        },
      }),
      this.prisma.asset.count({ where: { rtoMinutes: { not: null } } }),
      this.prisma.asset.count({ where: { rpoMinutes: { not: null } } }),
      this.prisma.asset.count({
        where: {
          businessCriticality: 'CRITICAL',
          ownerId: null,
        },
      }),
      this.prisma.asset.count({
        where: {
          status: 'ACTIVE',
          locationId: null,
          cloudProvider: null,
        },
      }),
    ]);

    // businessCriticality has a default value so it's never null
    const withoutCriticality = 0;

    const ownerPercent = totalAssets > 0 ? Math.round((withOwner / totalAssets) * 100) : 0;
    const departmentPercent = totalAssets > 0 ? Math.round((withDepartment / totalAssets) * 100) : 0;
    const locationPercent = totalAssets > 0 ? Math.round((withLocation / totalAssets) * 100) : 0;
    const descriptionPercent = totalAssets > 0 ? Math.round((withDescription / totalAssets) * 100) : 0;
    const rtoRpoPercent = totalAssets > 0 ? Math.round(((withRto + withRpo) / 2 / totalAssets) * 100) : 0;

    // Calculate overall data quality score (weighted average)
    const overallScore = Math.round(
      ownerPercent * 0.25 +
      departmentPercent * 0.15 +
      locationPercent * 0.2 +
      descriptionPercent * 0.15 +
      rtoRpoPercent * 0.25
    );

    const issues: Array<{
      type: string;
      count: number;
      severity: 'high' | 'medium' | 'low';
      description: string;
    }> = [];

    if (criticalWithoutOwner > 0) {
      issues.push({
        type: 'critical_no_owner',
        count: criticalWithoutOwner,
        severity: 'high',
        description: 'Critical assets without an assigned owner',
      });
    }

    if (activeWithoutLocation > 0) {
      issues.push({
        type: 'active_no_location',
        count: activeWithoutLocation,
        severity: 'medium',
        description: 'Active assets without location or cloud provider',
      });
    }

    if (totalAssets - withDescription > 0) {
      issues.push({
        type: 'missing_description',
        count: totalAssets - withDescription,
        severity: 'low',
        description: 'Assets without description',
      });
    }

    if (totalAssets - withRto > 0) {
      issues.push({
        type: 'missing_rto',
        count: totalAssets - withRto,
        severity: 'medium',
        description: 'Assets without RTO defined (NIS2 requirement)',
      });
    }

    return {
      totalAssets,
      completeness: {
        withOwner,
        withDepartment,
        withLocation,
        withDescription,
        withDataClassification: totalAssets, // All have default
        withCriticality: totalAssets - withoutCriticality,
        withRto,
        withRpo,
      },
      percentages: {
        ownerPercent,
        departmentPercent,
        locationPercent,
        descriptionPercent,
        rtoRpoPercent,
        overallScore,
      },
      issues,
    };
  }

  // ============================================
  // RISK SCORE CALCULATION
  // ============================================

  /**
   * Get vulnerabilities linked to an asset
   * VulnerabilityAsset model not available in Community Edition
   */
  async getAssetVulnerabilities(_assetId: string) {
    return [];
  }

  /**
   * Update vulnerability counts for an asset
   * VulnerabilityAsset model not available in Community Edition
   */
  async updateVulnerabilityCounts(_assetId: string) {
    return { critical: 0, high: 0, medium: 0, low: 0, slaBreached: 0 };
  }

  /**
   * Calculate risk score using category-weighted model with control effectiveness
   *
   * Model: Residual Risk = Inherent Risk × (1 - Control Effectiveness × 0.8)
   *
   * Inherent Risk Categories (each normalized 0-100, then weighted):
   * - Vulnerability Risk (35%): CVSS-weighted vulnerability score
   * - Business Impact (25%): Criticality + Data Classification
   * - Access Control Risk (20%): Privileged users ratio + auth failures
   * - Lifecycle Risk (20%): EOL/EOS status
   *
   * Control Effectiveness: SCA Score / 100 (CIS Benchmark compliance)
   */
  async calculateRiskScore(assetId: string): Promise<number> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        businessCriticality: true,
        dataClassification: true,
        endOfLife: true,
        endOfSupport: true,
        openVulnsCritical: true,
        openVulnsHigh: true,
        openVulnsMedium: true,
        openVulnsLow: true,
        slaBreachedVulns: true,
        // GRC fields from Wazuh
        scaScore: true,
        privilegedUserCount: true,
        humanUserCount: true,
        serviceAccountCount: true,
        lastAuthFailureCount: true,
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    // ==========================================
    // CATEGORY 1: Vulnerability Risk (35% weight)
    // ==========================================
    // CVSS-weighted score normalized to 0-100
    const criticalVulns = asset.openVulnsCritical || 0;
    const highVulns = asset.openVulnsHigh || 0;
    const mediumVulns = asset.openVulnsMedium || 0;
    const lowVulns = asset.openVulnsLow || 0;
    const totalVulns = criticalVulns + highVulns + mediumVulns + lowVulns;
    const slaBreached = asset.slaBreachedVulns || 0;

    let vulnScore = 0;
    if (totalVulns > 0) {
      // Weighted severity score (CVSS-aligned weights)
      const weightedSum = (criticalVulns * 10) + (highVulns * 7) + (mediumVulns * 4) + (lowVulns * 1);
      const maxPossible = totalVulns * 10;
      const severityScore = (weightedSum / maxPossible) * 60; // Up to 60 points for severity mix

      // Volume factor using logarithmic scale (diminishing returns)
      const volumeScore = Math.min(25, Math.log10(totalVulns + 1) * 15); // Up to 25 points

      // SLA breach penalty
      const slaScore = Math.min(15, slaBreached * 3); // Up to 15 points

      vulnScore = Math.min(100, severityScore + volumeScore + slaScore);
    }

    // ==========================================
    // CATEGORY 2: Business Impact (25% weight)
    // ==========================================
    const criticalityScores: Record<string, number> = {
      CRITICAL: 50,
      HIGH: 35,
      MEDIUM: 20,
      LOW: 5,
    };
    const classificationScores: Record<string, number> = {
      RESTRICTED: 50,
      CONFIDENTIAL: 35,
      INTERNAL: 15,
      PUBLIC: 0,
    };
    const businessScore =
      (criticalityScores[asset.businessCriticality] || 0) +
      (classificationScores[asset.dataClassification] || 0);

    // ==========================================
    // CATEGORY 3: Access Control Risk (20% weight)
    // ==========================================
    const privilegedUsers = asset.privilegedUserCount || 0;
    const humanUsers = asset.humanUserCount || 0;
    const totalUsers = humanUsers + (asset.serviceAccountCount || 0);
    const authFailures = asset.lastAuthFailureCount || 0;

    let accessScore = 0;

    // Privileged user ratio (if we have user data)
    if (totalUsers > 0 && privilegedUsers > 0) {
      const privRatio = privilegedUsers / totalUsers;
      // More than 20% privileged is concerning
      if (privRatio > 0.5) accessScore += 40;
      else if (privRatio > 0.3) accessScore += 30;
      else if (privRatio > 0.2) accessScore += 20;
      else if (privRatio > 0.1) accessScore += 10;
    }

    // Absolute privileged count (even low ratio can be risky with many admins)
    if (privilegedUsers > 10) accessScore += 20;
    else if (privilegedUsers > 5) accessScore += 10;

    // Auth failures (logarithmic to handle large numbers)
    if (authFailures > 0) {
      accessScore += Math.min(40, Math.log10(authFailures + 1) * 20);
    }

    accessScore = Math.min(100, accessScore);

    // ==========================================
    // CATEGORY 4: Lifecycle Risk (20% weight)
    // ==========================================
    let lifecycleScore = 0;
    const now = new Date();

    if (asset.endOfLife && new Date(asset.endOfLife) < now) {
      lifecycleScore = 100; // End of Life = maximum lifecycle risk
    } else if (asset.endOfSupport && new Date(asset.endOfSupport) < now) {
      lifecycleScore = 70; // End of Support = high lifecycle risk
    } else if (asset.endOfSupport) {
      // Approaching EOS (within 6 months)
      const eosDate = new Date(asset.endOfSupport);
      const monthsToEos = (eosDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsToEos < 6) {
        lifecycleScore = 40;
      } else if (monthsToEos < 12) {
        lifecycleScore = 20;
      }
    }

    // ==========================================
    // CALCULATE INHERENT RISK (weighted sum)
    // ==========================================
    const inherentRisk =
      (vulnScore * 0.35) +      // 35% weight
      (businessScore * 0.25) +   // 25% weight
      (accessScore * 0.20) +     // 20% weight
      (lifecycleScore * 0.20);   // 20% weight

    // ==========================================
    // APPLY CONTROL EFFECTIVENESS (SCA-based)
    // ==========================================
    // SCA Score represents technical control implementation
    // Based on CIS Benchmarks which map to ISO 27001 Annex A
    //
    // Formula: Residual = Inherent × (1 - Effectiveness × 0.8)
    // - Max 80% reduction (even perfect controls can't eliminate all risk)
    // - No SCA data = assume 0% effectiveness (full inherent risk)

    let controlEffectiveness = 0;
    if (asset.scaScore !== null && asset.scaScore !== undefined) {
      controlEffectiveness = asset.scaScore / 100;
    }

    const riskReductionFactor = 1 - (controlEffectiveness * 0.8);
    const residualRisk = Math.round(inherentRisk * riskReductionFactor);

    // Save the score
    await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        riskScore: residualRisk,
        riskScoreCalculatedAt: new Date(),
      },
    });

    return residualRisk;
  }

  /**
   * Recalculate risk scores for all assets
   */
  async calculateAllRiskScores(): Promise<{ updated: number }> {
    const assets = await this.prisma.asset.findMany({
      where: { status: { in: ['ACTIVE', 'MAINTENANCE', 'STAGING'] } },
      select: { id: true },
    });

    let updated = 0;
    for (const asset of assets) {
      try {
        await this.updateVulnerabilityCounts(asset.id);
        await this.calculateRiskScore(asset.id);
        updated++;
      } catch (err) {
        console.error(`Failed to calculate risk score for asset ${asset.id}:`, err);
      }
    }

    return { updated };
  }
}

