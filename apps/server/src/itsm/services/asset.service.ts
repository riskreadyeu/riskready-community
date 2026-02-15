import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface AssetImportRow {
  assetTag?: string;
  name?: string;
  displayName?: string;
  description?: string;
  assetType?: string;
  assetSubtype?: string;
  businessCriticality?: string;
  dataClassification?: string;
  handlesPersonalData?: string | boolean;
  handlesFinancialData?: string | boolean;
  handlesHealthData?: string | boolean;
  handlesConfidentialData?: string | boolean;
  inIsmsScope?: string | boolean;
  inPciScope?: string | boolean;
  inDoraScope?: string | boolean;
  inGdprScope?: string | boolean;
  inNis2Scope?: string | boolean;
  inSoc2Scope?: string | boolean;
  status?: string;
  cloudProvider?: string;
  cloudRegion?: string;
  fqdn?: string;
  operatingSystem?: string;
  osVersion?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  rtoMinutes?: string;
  rpoMinutes?: string;
  targetAvailability?: string;
  hasRedundancy?: string | boolean;
}

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);
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

  async importAssets(assets: AssetImportRow[]): Promise<{
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
      const row = assets[i]!;
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
            data: data as Prisma.AssetUpdateInput,
          });
          results.updated++;
        } else {
          await this.prisma.asset.create({ data: data as Prisma.AssetCreateInput });
          results.imported++;
        }
      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
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
    const counts = await this.fetchDataQualityCounts();
    const percentages = this.computeDataQualityPercentages(counts);
    const issues = this.identifyDataQualityIssues(counts);

    return {
      totalAssets: counts.totalAssets,
      completeness: {
        withOwner: counts.withOwner,
        withDepartment: counts.withDepartment,
        withLocation: counts.withLocation,
        withDescription: counts.withDescription,
        withDataClassification: counts.totalAssets, // All have default
        withCriticality: counts.totalAssets, // businessCriticality always has a default
        withRto: counts.withRto,
        withRpo: counts.withRpo,
      },
      percentages,
      issues,
    };
  }

  private async fetchDataQualityCounts() {
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
        where: { businessCriticality: 'CRITICAL', ownerId: null },
      }),
      this.prisma.asset.count({
        where: { status: 'ACTIVE', locationId: null, cloudProvider: null },
      }),
    ]);

    return {
      totalAssets, withOwner, withDepartment, withLocation,
      withDescription, withRto, withRpo, criticalWithoutOwner, activeWithoutLocation,
    };
  }

  private computeDataQualityPercentages(counts: {
    totalAssets: number;
    withOwner: number;
    withDepartment: number;
    withLocation: number;
    withDescription: number;
    withRto: number;
    withRpo: number;
  }) {
    const pct = (n: number) => counts.totalAssets > 0 ? Math.round((n / counts.totalAssets) * 100) : 0;

    const ownerPercent = pct(counts.withOwner);
    const departmentPercent = pct(counts.withDepartment);
    const locationPercent = pct(counts.withLocation);
    const descriptionPercent = pct(counts.withDescription);
    const rtoRpoPercent = counts.totalAssets > 0
      ? Math.round(((counts.withRto + counts.withRpo) / 2 / counts.totalAssets) * 100)
      : 0;

    const overallScore = Math.round(
      ownerPercent * 0.25 +
      departmentPercent * 0.15 +
      locationPercent * 0.2 +
      descriptionPercent * 0.15 +
      rtoRpoPercent * 0.25
    );

    return { ownerPercent, departmentPercent, locationPercent, descriptionPercent, rtoRpoPercent, overallScore };
  }

  private identifyDataQualityIssues(counts: {
    totalAssets: number;
    withDescription: number;
    withRto: number;
    criticalWithoutOwner: number;
    activeWithoutLocation: number;
  }): Array<{ type: string; count: number; severity: 'high' | 'medium' | 'low'; description: string }> {
    const issues: Array<{ type: string; count: number; severity: 'high' | 'medium' | 'low'; description: string }> = [];

    if (counts.criticalWithoutOwner > 0) {
      issues.push({
        type: 'critical_no_owner',
        count: counts.criticalWithoutOwner,
        severity: 'high',
        description: 'Critical assets without an assigned owner',
      });
    }

    if (counts.activeWithoutLocation > 0) {
      issues.push({
        type: 'active_no_location',
        count: counts.activeWithoutLocation,
        severity: 'medium',
        description: 'Active assets without location or cloud provider',
      });
    }

    if (counts.totalAssets - counts.withDescription > 0) {
      issues.push({
        type: 'missing_description',
        count: counts.totalAssets - counts.withDescription,
        severity: 'low',
        description: 'Assets without description',
      });
    }

    if (counts.totalAssets - counts.withRto > 0) {
      issues.push({
        type: 'missing_rto',
        count: counts.totalAssets - counts.withRto,
        severity: 'medium',
        description: 'Assets without RTO defined (NIS2 requirement)',
      });
    }

    return issues;
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

    const vulnScore = this.calculateVulnerabilityScore(asset);
    const businessScore = this.calculateBusinessImpactScore(asset);
    const accessScore = this.calculateAccessControlScore(asset);
    const lifecycleScore = this.calculateLifecycleScore(asset);

    // Inherent risk: weighted sum of all categories
    const inherentRisk =
      (vulnScore * 0.35) +      // 35% weight
      (businessScore * 0.25) +   // 25% weight
      (accessScore * 0.20) +     // 20% weight
      (lifecycleScore * 0.20);   // 20% weight

    // Apply control effectiveness (SCA-based)
    // Formula: Residual = Inherent × (1 - Effectiveness × 0.8)
    // Max 80% reduction (even perfect controls can't eliminate all risk)
    const controlEffectiveness = (asset.scaScore != null) ? asset.scaScore / 100 : 0;
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
   * Vulnerability risk score (0-100) using CVSS-weighted severity and SLA breach penalty
   */
  private calculateVulnerabilityScore(asset: {
    openVulnsCritical: number | null;
    openVulnsHigh: number | null;
    openVulnsMedium: number | null;
    openVulnsLow: number | null;
    slaBreachedVulns: number | null;
  }): number {
    const criticalVulns = asset.openVulnsCritical || 0;
    const highVulns = asset.openVulnsHigh || 0;
    const mediumVulns = asset.openVulnsMedium || 0;
    const lowVulns = asset.openVulnsLow || 0;
    const totalVulns = criticalVulns + highVulns + mediumVulns + lowVulns;
    const slaBreached = asset.slaBreachedVulns || 0;

    if (totalVulns === 0) return 0;

    // Weighted severity score (CVSS-aligned weights)
    const weightedSum = (criticalVulns * 10) + (highVulns * 7) + (mediumVulns * 4) + (lowVulns * 1);
    const maxPossible = totalVulns * 10;
    const severityScore = (weightedSum / maxPossible) * 60; // Up to 60 points for severity mix

    // Volume factor using logarithmic scale (diminishing returns)
    const volumeScore = Math.min(25, Math.log10(totalVulns + 1) * 15); // Up to 25 points

    // SLA breach penalty
    const slaScore = Math.min(15, slaBreached * 3); // Up to 15 points

    return Math.min(100, severityScore + volumeScore + slaScore);
  }

  /**
   * Business impact score (0-100) from criticality and data classification
   */
  private calculateBusinessImpactScore(asset: {
    businessCriticality: string;
    dataClassification: string;
  }): number {
    const criticalityScores: Record<string, number> = {
      CRITICAL: 50, HIGH: 35, MEDIUM: 20, LOW: 5,
    };
    const classificationScores: Record<string, number> = {
      RESTRICTED: 50, CONFIDENTIAL: 35, INTERNAL: 15, PUBLIC: 0,
    };
    return (criticalityScores[asset.businessCriticality] || 0) +
      (classificationScores[asset.dataClassification] || 0);
  }

  /**
   * Access control risk score (0-100) from privileged user ratio and auth failures
   */
  private calculateAccessControlScore(asset: {
    privilegedUserCount: number | null;
    humanUserCount: number | null;
    serviceAccountCount: number | null;
    lastAuthFailureCount: number | null;
  }): number {
    const privilegedUsers = asset.privilegedUserCount || 0;
    const humanUsers = asset.humanUserCount || 0;
    const totalUsers = humanUsers + (asset.serviceAccountCount || 0);
    const authFailures = asset.lastAuthFailureCount || 0;

    let score = 0;

    // Privileged user ratio (if we have user data)
    if (totalUsers > 0 && privilegedUsers > 0) {
      const privRatio = privilegedUsers / totalUsers;
      if (privRatio > 0.5) score += 40;
      else if (privRatio > 0.3) score += 30;
      else if (privRatio > 0.2) score += 20;
      else if (privRatio > 0.1) score += 10;
    }

    // Absolute privileged count (even low ratio can be risky with many admins)
    if (privilegedUsers > 10) score += 20;
    else if (privilegedUsers > 5) score += 10;

    // Auth failures (logarithmic to handle large numbers)
    if (authFailures > 0) {
      score += Math.min(40, Math.log10(authFailures + 1) * 20);
    }

    return Math.min(100, score);
  }

  /**
   * Lifecycle risk score (0-100) from EOL/EOS status
   */
  private calculateLifecycleScore(asset: {
    endOfLife: Date | null;
    endOfSupport: Date | null;
  }): number {
    const now = new Date();

    if (asset.endOfLife && new Date(asset.endOfLife) < now) {
      return 100; // End of Life = maximum lifecycle risk
    }
    if (asset.endOfSupport && new Date(asset.endOfSupport) < now) {
      return 70; // End of Support = high lifecycle risk
    }
    if (asset.endOfSupport) {
      // Approaching EOS
      const eosDate = new Date(asset.endOfSupport);
      const monthsToEos = (eosDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsToEos < 6) return 40;
      if (monthsToEos < 12) return 20;
    }
    return 0;
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
        this.logger.error(`Failed to calculate risk score for asset ${asset.id}`, err instanceof Error ? err.stack : String(err));
      }
    }

    return { updated };
  }
}

