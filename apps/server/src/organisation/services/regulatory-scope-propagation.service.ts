import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PropagationResult {
  applicationsUpdated: number;
  assetsUpdated: number;
  vendorsUpdated: number;
  controlsUpdated: number;
  controlsEnabled: number;
  controlsDisabled: number;
  risksUpdated: number;
  risksEnabled: number;
  risksDisabled: number;
  errors: string[];
}

export interface RegulatoryProfile {
  isDoraApplicable: boolean;
  doraEntityType?: string;
  doraRegime?: string;
  isNis2Applicable: boolean;
  nis2EntityClassification?: string;
  nis2Sector?: string;
  nis2AnnexType?: string;
  primarySupervisoryAuthority?: string;
  supervisoryAuthorityCountry?: string;
}

@Injectable()
export class RegulatoryScopePropagationService {
  private readonly logger = new Logger(RegulatoryScopePropagationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Propagate regulatory scope from OrganisationProfile to all related entities
   * Called when a regulatory eligibility survey is completed
   */
  async propagateRegulatoryScope(
    organisationId: string,
    profile: RegulatoryProfile,
  ): Promise<PropagationResult> {
    const result: PropagationResult = {
      applicationsUpdated: 0,
      assetsUpdated: 0,
      vendorsUpdated: 0,
      controlsUpdated: 0,
      controlsEnabled: 0,
      controlsDisabled: 0,
      risksUpdated: 0,
      risksEnabled: 0,
      risksDisabled: 0,
      errors: [],
    };

    try {
      // Update OrganisationProfile with regulatory profile
      await this.prisma.organisationProfile.update({
        where: { id: organisationId },
        data: {
          isDoraApplicable: profile.isDoraApplicable,
          doraEntityType: profile.doraEntityType,
          doraRegime: profile.doraRegime,
          isNis2Applicable: profile.isNis2Applicable,
          nis2EntityClassification: profile.nis2EntityClassification,
          nis2Sector: profile.nis2Sector,
          nis2AnnexType: profile.nis2AnnexType,
          primarySupervisoryAuthority: profile.primarySupervisoryAuthority,
          supervisoryAuthorityCountry: profile.supervisoryAuthorityCountry,
          regulatoryProfileUpdatedAt: new Date(),
        },
      });

      // Propagate to Applications
      result.applicationsUpdated = await this.propagateToApplications(profile);

      // Propagate to Assets
      result.assetsUpdated = await this.propagateToAssets(profile);

      // Propagate to Vendors
      result.vendorsUpdated = await this.propagateToVendors(profile);

      // Update Controls based on regulatory scope
      const controlResult = await this.updateControlApplicability(
        organisationId,
        profile,
      );
      result.controlsUpdated = controlResult.total;
      result.controlsEnabled = controlResult.enabled;
      result.controlsDisabled = controlResult.disabled;

      // Update Risks based on regulatory scope
      const riskResult = await this.updateRiskApplicability(
        organisationId,
        profile,
      );
      result.risksUpdated = riskResult.total;
      result.risksEnabled = riskResult.enabled;
      result.risksDisabled = riskResult.disabled;

      this.logger.log(
        `Regulatory scope propagated: ${result.applicationsUpdated} apps, ${result.assetsUpdated} assets, ${result.vendorsUpdated} vendors, ` +
        `${result.controlsEnabled} controls enabled, ${result.controlsDisabled} controls disabled, ` +
        `${result.risksEnabled} risks enabled, ${result.risksDisabled} risks disabled`,
      );
    } catch (error) {
      this.logger.error('Error propagating regulatory scope', error);
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    return result;
  }

  /**
   * Propagate DORA/NIS2 scope to all Applications
   */
  private async propagateToApplications(
    _profile: RegulatoryProfile,
  ): Promise<number> {
    // Application model not yet available in community edition
    return 0;
  }

  /**
   * Propagate DORA/NIS2 scope to all Assets
   */
  private async propagateToAssets(profile: RegulatoryProfile): Promise<number> {
    const updateResult = await this.prisma.asset.updateMany({
      data: {
        inDoraScope: profile.isDoraApplicable,
        inNis2Scope: profile.isNis2Applicable,
      },
    });
    return updateResult.count;
  }

  /**
   * Propagate DORA/NIS2 scope to all Vendors
   */
  private async propagateToVendors(
    _profile: RegulatoryProfile,
  ): Promise<number> {
    // Vendor model not yet available in community edition
    return 0;
  }

  /**
   * Update control applicability based on regulatory profile
   * - Enables DORA/NIS2 controls when organisation IS in scope
   * - Disables DORA/NIS2 controls when organisation is NOT in scope
   */
  private async updateControlApplicability(
    organisationId: string,
    profile: RegulatoryProfile,
  ): Promise<{ total: number; enabled: number; disabled: number }> {
    let enabled = 0;
    let disabled = 0;

    // Get all controls for this organisation
    const controls = await this.prisma.control.findMany({
      where: { organisationId },
      select: {
        id: true,
        controlId: true,
        framework: true,
        applicable: true,
      },
    });

    for (const control of controls) {
      const isDora = control.framework === 'DORA';
      const isNis2 = control.framework === 'NIS2';

      // Skip controls that aren't DORA or NIS2 - they're not affected by regulatory scope
      if (!isDora && !isNis2) continue;

      // Determine if control should be applicable based on regulatory profile
      let shouldBeApplicable = true;
      let justification: string | null = null;

      if (isDora && !profile.isDoraApplicable) {
        shouldBeApplicable = false;
        justification = 'Organisation is not in scope of DORA regulation';
      }
      if (isNis2 && !profile.isNis2Applicable) {
        shouldBeApplicable = false;
        justification = 'Organisation is not in scope of NIS2 regulation';
      }

      // Update control if its applicability needs to change
      if (control.applicable !== shouldBeApplicable) {
        await this.prisma.control.update({
          where: { id: control.id },
          data: {
            applicable: shouldBeApplicable,
            justificationIfNa: shouldBeApplicable ? null : justification,
          },
        });

        if (shouldBeApplicable) {
          enabled++;
          this.logger.debug(`Enabled control ${control.controlId} (${control.framework})`);
        } else {
          disabled++;
          this.logger.debug(`Disabled control ${control.controlId} (${control.framework}): ${justification}`);
        }
      }
    }

    // Also update SOA entries for consistency
    await this.updateSOAEntries(organisationId, profile);

    return { total: enabled + disabled, enabled, disabled };
  }

  /**
   * Update SOA entries to match control applicability
   */
  private async updateSOAEntries(
    organisationId: string,
    profile: RegulatoryProfile,
  ): Promise<void> {
    // Get all SOA entries for this organisation with their control records
    const soaEntries = await this.prisma.sOAEntry.findMany({
      where: {
        soa: {
          organisationId,
        },
      },
      include: {
        controlRecord: true,
      },
    });

    for (const entry of soaEntries) {
      const controlRecord = entry.controlRecord;
      if (!controlRecord) continue;

      const isDora = controlRecord.framework === 'DORA';
      const isNis2 = controlRecord.framework === 'NIS2';

      // Skip controls that aren't DORA or NIS2
      if (!isDora && !isNis2) continue;

      let shouldBeApplicable = true;
      let justification: string | null = null;

      if (isDora && !profile.isDoraApplicable) {
        shouldBeApplicable = false;
        justification = 'Organisation is not in scope of DORA regulation';
      }
      if (isNis2 && !profile.isNis2Applicable) {
        shouldBeApplicable = false;
        justification = 'Organisation is not in scope of NIS2 regulation';
      }

      // Update SOA entry if needed
      if (entry.applicable !== shouldBeApplicable) {
        await this.prisma.sOAEntry.update({
          where: { id: entry.id },
          data: {
            applicable: shouldBeApplicable,
            justificationIfNa: shouldBeApplicable ? null : justification,
          },
        });
      }
    }
  }

  /**
   * Update risk applicability based on regulatory profile
   * - Enables DORA/NIS2 risks when organisation IS in scope
   * - Disables DORA/NIS2 risks when organisation is NOT in scope
   */
  private async updateRiskApplicability(
    organisationId: string,
    profile: RegulatoryProfile,
  ): Promise<{ total: number; enabled: number; disabled: number }> {
    let enabled = 0;
    let disabled = 0;

    // Get all risks for this organisation
    const risks = await this.prisma.risk.findMany({
      where: { organisationId },
      select: {
        id: true,
        riskId: true,
        framework: true,
        applicable: true,
      },
    });

    for (const risk of risks) {
      const isDora = risk.framework === 'DORA';
      const isNis2 = risk.framework === 'NIS2';

      // Skip risks that aren't DORA or NIS2 - they're not affected by regulatory scope
      if (!isDora && !isNis2) continue;

      // Determine if risk should be applicable based on regulatory profile
      let shouldBeApplicable = true;
      let justification: string | null = null;

      if (isDora && !profile.isDoraApplicable) {
        shouldBeApplicable = false;
        justification = 'Organisation is not in scope of DORA regulation';
      }
      if (isNis2 && !profile.isNis2Applicable) {
        shouldBeApplicable = false;
        justification = 'Organisation is not in scope of NIS2 regulation';
      }

      // Update risk if its applicability needs to change
      if (risk.applicable !== shouldBeApplicable) {
        await this.prisma.risk.update({
          where: { id: risk.id },
          data: {
            applicable: shouldBeApplicable,
            justificationIfNa: shouldBeApplicable ? null : justification,
          },
        });

        if (shouldBeApplicable) {
          enabled++;
          this.logger.debug(`Enabled risk ${risk.riskId} (${risk.framework})`);
        } else {
          disabled++;
          this.logger.debug(`Disabled risk ${risk.riskId} (${risk.framework}): ${justification}`);
        }
      }
    }

    return { total: enabled + disabled, enabled, disabled };
  }

  /**
   * Get current propagation status for preview before applying
   */
  async getPropagatioPreview(): Promise<{
    applicationCount: number;
    assetCount: number;
    vendorCount: number;
    controlCount: number;
  }> {
    const [applicationCount, assetCount, vendorCount, controlCount] =
      await Promise.all([
        Promise.resolve(0), // Application model not yet available
        this.prisma.asset.count(),
        Promise.resolve(0), // Vendor model not yet available
        // Count controls that have DORA or NIS2 in their framework mappings
        this.prisma.control.count(),
      ]);

    return {
      applicationCount,
      assetCount,
      vendorCount,
      controlCount,
    };
  }

  /**
   * Parse survey results to determine regulatory profile
   */
  parseDoraResult(survey: {
    isApplicable?: boolean;
    entityClassification?: string;
    regulatoryRegime?: string;
  }): Partial<RegulatoryProfile> {
    return {
      isDoraApplicable: survey.isApplicable ?? false,
      doraEntityType: survey.entityClassification,
      doraRegime: survey.regulatoryRegime,
    };
  }

  parseNis2Result(survey: {
    isApplicable?: boolean;
    entityClassification?: string;
    regulatoryRegime?: string;
  }): Partial<RegulatoryProfile> {
    // Map entity classification to NIS2 specific fields
    const classification = survey.entityClassification?.toLowerCase();
    let nis2EntityClassification: string | undefined;
    let nis2AnnexType: string | undefined;

    if (classification?.includes('essential')) {
      nis2EntityClassification = 'essential';
      nis2AnnexType = 'annex_i';
    } else if (classification?.includes('important')) {
      nis2EntityClassification = 'important';
      nis2AnnexType = 'annex_ii';
    }

    return {
      isNis2Applicable: survey.isApplicable ?? false,
      nis2EntityClassification,
      nis2Sector: survey.regulatoryRegime,
      nis2AnnexType,
    };
  }
}

