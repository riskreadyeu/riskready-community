/**
 * Asset Type Profiles and Utilities
 *
 * Defines which UI elements and features are applicable for each asset type.
 * Not all assets support Wazuh monitoring - the UI should adapt accordingly.
 */

/**
 * Asset type profiles based on monitoring capabilities
 */
export const ASSET_TYPE_PROFILES = {
  /**
   * Full Wazuh agent support - shows all security UI
   * These assets can have Wazuh agent installed and provide:
   * - Vulnerability scanning
   * - SCA compliance checks
   * - User account monitoring
   * - Open ports detection
   * - File integrity monitoring
   */
  WAZUH_FULL: [
    'SERVER',
    'WORKSTATION',
    'LAPTOP',
    'CLOUD_VM',
    'CLOUD_CONTAINER',
    'CLOUD_KUBERNETES',
  ],

  /**
   * Wazuh Agentless support - SSH-based SCA
   * No agent installed, but Wazuh server connects via SSH to:
   * - Run commands (e.g., show running-config)
   * - Compare output against CIS/STIG policies
   * - Generate SCA compliance scores
   *
   * Supports: Cisco IOS, Juniper, Palo Alto, etc.
   */
  WAZUH_AGENTLESS: [
    'NETWORK_DEVICE',
    'SECURITY_APPLIANCE',
  ],

  /**
   * Syslog-only Wazuh support - log forwarding only
   * No agent, no SSH access - just syslog collection
   */
  WAZUH_SYSLOG: [
    'STORAGE_DEVICE',
  ],

  /**
   * Cloud-native security tools (AWS Inspector, Azure Defender, GCP SCC)
   * No Wazuh agent - use cloud provider security APIs
   */
  CLOUD_NATIVE: [
    'CLOUD_DATABASE',
    'CLOUD_STORAGE',
    'CLOUD_NETWORK',
    'CLOUD_SERVERLESS',
  ],

  /**
   * Limited or no monitoring capability
   * Basic asset tracking only
   */
  LIMITED: [
    'IOT_DEVICE',
    'MOBILE_DEVICE',
    'PRINTER',
    'OTHER_HARDWARE',
    'OTHER',
  ],

  /**
   * Data assets - governance focused
   * Track data classification, lineage, access controls
   */
  DATA: [
    'DATA_STORE',
    'DATA_FLOW',
  ],
} as const;

export type AssetTypeProfile = keyof typeof ASSET_TYPE_PROFILES;

/**
 * Get the profile category for an asset type
 */
export function getAssetProfile(assetType: string): AssetTypeProfile {
  for (const [profile, types] of Object.entries(ASSET_TYPE_PROFILES)) {
    if ((types as readonly string[]).includes(assetType)) {
      return profile as AssetTypeProfile;
    }
  }
  return 'LIMITED';
}

/**
 * Check if asset type supports full Wazuh agent monitoring
 */
export function supportsWazuhFull(assetType: string): boolean {
  return (ASSET_TYPE_PROFILES.WAZUH_FULL as readonly string[]).includes(assetType);
}

/**
 * Check if asset type supports Wazuh agentless monitoring (SSH-based SCA)
 */
export function supportsWazuhAgentless(assetType: string): boolean {
  return (ASSET_TYPE_PROFILES.WAZUH_AGENTLESS as readonly string[]).includes(assetType);
}

/**
 * Check if asset type supports syslog-only Wazuh monitoring
 */
export function supportsWazuhSyslog(assetType: string): boolean {
  return (ASSET_TYPE_PROFILES.WAZUH_SYSLOG as readonly string[]).includes(assetType);
}

/**
 * Check if asset type supports any Wazuh integration
 */
export function supportsWazuh(assetType: string): boolean {
  return supportsWazuhFull(assetType) || supportsWazuhAgentless(assetType) || supportsWazuhSyslog(assetType);
}

/**
 * Check if asset type supports SCA compliance (agent or agentless)
 */
export function supportsSCA(assetType: string): boolean {
  return supportsWazuhFull(assetType) || supportsWazuhAgentless(assetType);
}

/**
 * Check if asset type uses cloud-native security tools
 */
export function supportsCloudNative(assetType: string): boolean {
  return (ASSET_TYPE_PROFILES.CLOUD_NATIVE as readonly string[]).includes(assetType);
}

/**
 * Check if asset type is a data asset (governance focused)
 */
export function isDataAsset(assetType: string): boolean {
  return (ASSET_TYPE_PROFILES.DATA as readonly string[]).includes(assetType);
}

/**
 * Check if asset type has limited monitoring capabilities
 */
export function isLimitedAsset(assetType: string): boolean {
  return (ASSET_TYPE_PROFILES.LIMITED as readonly string[]).includes(assetType);
}

/**
 * UI visibility helper - what to show for each profile
 */
export interface AssetUIVisibility {
  // Cards to show
  showWazuhStatus: boolean;
  showScaCompliance: boolean;
  showUserAccounts: boolean;
  showOpenPorts: boolean;
  showVulnerabilities: boolean;
  showCloudConfig: boolean;
  showDataGovernance: boolean;

  // Risk calculation factors
  showVulnerabilityRisk: boolean;
  showAccessControlRisk: boolean;
  showLifecycleRisk: boolean;
  showControlEffectiveness: boolean;

  // Tabs to show
  showTechnicalTab: boolean;
  showLifecycleTab: boolean;
  showFinancialTab: boolean;
  showCapacityTab: boolean;

  // Actions
  showSyncWazuhButton: boolean;
  showOpenWazuhButton: boolean;
}

/**
 * Get UI visibility settings for an asset type
 */
export function getAssetUIVisibility(assetType: string): AssetUIVisibility {
  const profile = getAssetProfile(assetType);

  switch (profile) {
    case 'WAZUH_FULL':
      return {
        showWazuhStatus: true,
        showScaCompliance: true,
        showUserAccounts: true,
        showOpenPorts: true,
        showVulnerabilities: true,
        showCloudConfig: false,
        showDataGovernance: false,
        showVulnerabilityRisk: true,
        showAccessControlRisk: true,
        showLifecycleRisk: true,
        showControlEffectiveness: true,
        showTechnicalTab: true,
        showLifecycleTab: true,
        showFinancialTab: true,
        showCapacityTab: true,
        showSyncWazuhButton: true,
        showOpenWazuhButton: true,
      };

    case 'WAZUH_AGENTLESS':
      // Network devices with SSH-based agentless SCA
      // Can have SCA scores but no user accounts, FIM, etc.
      return {
        showWazuhStatus: true,
        showScaCompliance: true,  // SSH-based SCA IS supported
        showUserAccounts: false,  // No user inventory from Wazuh
        showOpenPorts: false,     // No syscollector
        showVulnerabilities: true, // Can have vulns from other scanners
        showCloudConfig: false,
        showDataGovernance: false,
        showVulnerabilityRisk: true,
        showAccessControlRisk: false,
        showLifecycleRisk: true,
        showControlEffectiveness: true, // SCA provides this
        showTechnicalTab: true,
        showLifecycleTab: true,
        showFinancialTab: true,
        showCapacityTab: false,   // No capacity metrics from Wazuh
        showSyncWazuhButton: true,
        showOpenWazuhButton: true,
      };

    case 'WAZUH_SYSLOG':
      // Syslog-only devices - no SCA, just log collection
      return {
        showWazuhStatus: true,
        showScaCompliance: false,
        showUserAccounts: false,
        showOpenPorts: false,
        showVulnerabilities: true,
        showCloudConfig: false,
        showDataGovernance: false,
        showVulnerabilityRisk: true,
        showAccessControlRisk: false,
        showLifecycleRisk: true,
        showControlEffectiveness: false,
        showTechnicalTab: true,
        showLifecycleTab: true,
        showFinancialTab: true,
        showCapacityTab: false,
        showSyncWazuhButton: false,
        showOpenWazuhButton: true,
      };

    case 'CLOUD_NATIVE':
      return {
        showWazuhStatus: false,
        showScaCompliance: false,
        showUserAccounts: false,
        showOpenPorts: false,
        showVulnerabilities: true,
        showCloudConfig: true,
        showDataGovernance: false,
        showVulnerabilityRisk: true,
        showAccessControlRisk: false,
        showLifecycleRisk: true,
        showControlEffectiveness: false,
        showTechnicalTab: true,
        showLifecycleTab: true,
        showFinancialTab: true,
        showCapacityTab: true,
        showSyncWazuhButton: false,
        showOpenWazuhButton: false,
      };

    case 'DATA':
      return {
        showWazuhStatus: false,
        showScaCompliance: false,
        showUserAccounts: true, // Data access tracking
        showOpenPorts: false,
        showVulnerabilities: false,
        showCloudConfig: false,
        showDataGovernance: true,
        showVulnerabilityRisk: false,
        showAccessControlRisk: true,
        showLifecycleRisk: false,
        showControlEffectiveness: false,
        showTechnicalTab: false,
        showLifecycleTab: false,
        showFinancialTab: false,
        showCapacityTab: false,
        showSyncWazuhButton: false,
        showOpenWazuhButton: false,
      };

    case 'LIMITED':
    default:
      return {
        showWazuhStatus: false,
        showScaCompliance: false,
        showUserAccounts: false,
        showOpenPorts: false,
        showVulnerabilities: false,
        showCloudConfig: false,
        showDataGovernance: false,
        showVulnerabilityRisk: false,
        showAccessControlRisk: false,
        showLifecycleRisk: true,
        showControlEffectiveness: false,
        showTechnicalTab: true,
        showLifecycleTab: true,
        showFinancialTab: true,
        showCapacityTab: false,
        showSyncWazuhButton: false,
        showOpenWazuhButton: false,
      };
  }
}

/**
 * Get human-readable description of asset profile
 */
export function getAssetProfileDescription(assetType: string): string {
  const profile = getAssetProfile(assetType);

  switch (profile) {
    case 'WAZUH_FULL':
      return 'Full security monitoring via Wazuh agent';
    case 'WAZUH_AGENTLESS':
      return 'Agentless SCA via SSH (CIS/STIG compliance)';
    case 'WAZUH_SYSLOG':
      return 'Syslog monitoring only';
    case 'CLOUD_NATIVE':
      return 'Cloud-native security tools (no agent)';
    case 'DATA':
      return 'Data governance and access control';
    case 'LIMITED':
    default:
      return 'Basic asset tracking';
  }
}
