import type {
  ITSMChangeType,
  ChangeCategory,
  ChangePriority,
  SecurityImpact,
  Asset,
} from '@/lib/itsm-api';

export interface ChangeFormState {
  title: string;
  description: string;
  changeType: ITSMChangeType;
  category: ChangeCategory;
  priority: ChangePriority;
  securityImpact: SecurityImpact;
  departmentId: string;
  businessJustification: string;
  impactAssessment: string;
  userImpact: string;
  riskLevel: string;
  riskAssessment: string;
  backoutPlan: string;
  rollbackTime: string;
  testPlan: string;
  plannedStart: string;
  plannedEnd: string;
  maintenanceWindow: boolean;
  outageRequired: boolean;
  estimatedDowntime: string;
  cabRequired: boolean;
  pirRequired: boolean;
  successCriteria: string;
}

export interface ImpactedAsset {
  assetId: string;
  assetName: string;
  assetTag: string;
  assetType: string;
  impactType: string;
  notes?: string;
}

export interface ImpactedProcess {
  processId: string;
  processName: string;
  notes?: string;
}

// Impact types for assets
export const IMPACT_TYPES = [
  { value: 'DIRECT', label: 'Direct - Will be modified' },
  { value: 'INDIRECT', label: 'Indirect - May be affected' },
  { value: 'DEPENDENCY', label: 'Dependency - Relies on changed component' },
  { value: 'TESTING', label: 'Testing - Used for validation' },
];

export const CHANGE_CATEGORIES: { value: ChangeCategory; label: string }[] = [
  { value: 'ACCESS_CONTROL', label: 'Access Control' },
  { value: 'CONFIGURATION', label: 'Configuration' },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
  { value: 'APPLICATION', label: 'Application' },
  { value: 'DATABASE', label: 'Database' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'NETWORK', label: 'Network' },
  { value: 'BACKUP_DR', label: 'Backup & DR' },
  { value: 'MONITORING', label: 'Monitoring' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
  { value: 'OTHER', label: 'Other' },
];
