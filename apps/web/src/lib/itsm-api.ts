// ITSM Module API Service
// Asset Management & Change Management

import { fetchWithAuth } from './fetch-with-auth';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithAuth(path, init);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed (${res.status})`);
  }

  const text = await res.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response from ${path}`);
  }
}

// Types
export interface PaginatedResponse<T> {
  results: T[];
  count: number;
}

export interface UserBasic {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface DepartmentBasic {
  id: string;
  name: string;
  departmentCode: string;
}

export interface LocationBasic {
  id: string;
  name: string;
  locationCode?: string;
  city?: string;
  country?: string;
}

// Asset Types
export type AssetType =
  | 'SERVER'
  | 'WORKSTATION'
  | 'LAPTOP'
  | 'MOBILE_DEVICE'
  | 'NETWORK_DEVICE'
  | 'STORAGE_DEVICE'
  | 'SECURITY_APPLIANCE'
  | 'IOT_DEVICE'
  | 'PRINTER'
  | 'OTHER_HARDWARE'
  | 'OPERATING_SYSTEM'
  | 'APPLICATION'
  | 'DATABASE'
  | 'MIDDLEWARE'
  | 'CLOUD_VM'
  | 'CLOUD_CONTAINER'
  | 'CLOUD_DATABASE'
  | 'CLOUD_STORAGE'
  | 'CLOUD_NETWORK'
  | 'CLOUD_SERVERLESS'
  | 'CLOUD_KUBERNETES'
  | 'INTERNAL_SERVICE'
  | 'EXTERNAL_SERVICE'
  | 'SAAS_APPLICATION'
  | 'API_ENDPOINT'
  | 'DATA_STORE'
  | 'DATA_FLOW'
  | 'OTHER';

export type AssetStatus =
  | 'PLANNED'
  | 'PROCUREMENT'
  | 'DEVELOPMENT'
  | 'STAGING'
  | 'ACTIVE'
  | 'MAINTENANCE'
  | 'RETIRING'
  | 'DISPOSED';

export type BusinessCriticality = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type DataClassification = 'RESTRICTED' | 'CONFIDENTIAL' | 'INTERNAL' | 'PUBLIC';
export type CapacityStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EXHAUSTED' | 'UNKNOWN';
export type CloudProvider = 'AWS' | 'AZURE' | 'GCP' | 'ORACLE_CLOUD' | 'IBM_CLOUD' | 'ALIBABA_CLOUD' | 'DIGITAL_OCEAN' | 'PRIVATE_CLOUD' | 'ON_PREMISES';

export interface Asset {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Identification
  assetTag: string;
  name: string;
  displayName?: string;
  description?: string;
  assetType: AssetType;
  assetSubtype?: string;

  // Classification
  businessCriticality: BusinessCriticality;
  dataClassification: DataClassification;
  handlesPersonalData: boolean;
  handlesFinancialData: boolean;
  handlesHealthData: boolean;
  handlesConfidentialData: boolean;

  // Compliance Scope
  inIsmsScope: boolean;
  inPciScope: boolean;
  inDoraScope: boolean;
  inGdprScope: boolean;
  inNis2Scope: boolean;
  inSoc2Scope: boolean;
  scopeNotes?: string;

  // Ownership & Responsibility
  ownerId?: string;
  owner?: UserBasic;
  custodianId?: string;
  custodian?: UserBasic;
  departmentId?: string;
  department?: DepartmentBasic;

  // Location
  locationId?: string;
  location?: LocationBasic;
  cloudProvider?: CloudProvider;
  cloudRegion?: string;
  cloudAccountId?: string;
  cloudResourceId?: string;
  datacenter?: string;
  rack?: string;
  rackPosition?: number;

  // Lifecycle
  status: AssetStatus;
  purchaseDate?: string;
  deploymentDate?: string;
  warrantyExpiry?: string;
  endOfLife?: string;
  endOfSupport?: string;
  disposalDate?: string;
  lifecycleNotes?: string;

  // Technical Details
  fqdn?: string;
  ipAddresses?: string[];
  macAddresses?: string[];
  operatingSystem?: string;
  osVersion?: string;
  version?: string;
  patchLevel?: string;

  // Vendor & Support
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  supportContract?: string;
  supportExpiry?: string;
  supportTier?: string;
  vendorId?: string;
  vendor?: { id: string; name: string };

  // Financial
  purchaseCost?: number;
  costCurrency: string;
  annualCost?: number;
  costCenter?: string;

  // Security Posture
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  encryptionMethod?: string;
  backupEnabled: boolean;
  backupFrequency?: string;
  backupRetention?: string;
  lastBackupDate?: string;
  monitoringEnabled: boolean;
  loggingEnabled: boolean;
  lastVulnScan?: string;
  vulnerabilityCount?: number;
  criticalVulnCount?: number;

  // Capacity Management (NIS2)
  cpuCapacity?: number;
  cpuUsagePercent?: number;
  memoryCapacityGB?: number;
  memoryUsagePercent?: number;
  storageCapacityGB?: number;
  storageUsagePercent?: number;
  networkBandwidthMbps?: number;
  cpuThresholdPercent?: number;
  memoryThresholdPercent?: number;
  storageThresholdPercent?: number;
  capacityStatus: CapacityStatus;
  capacityNotes?: string;
  lastCapacityReview?: string;
  nextCapacityReview?: string;
  capacityTrend?: string;
  growthRatePercent?: number;
  projectedExhaustionDate?: string;

  // Resilience & Availability (NIS2)
  rtoMinutes?: number;
  rpoMinutes?: number;
  mtpdMinutes?: number;
  targetAvailability?: number;
  actualAvailability?: number;
  hasRedundancy: boolean;
  redundancyType?: string;
  failoverAssetId?: string;
  lastOutageDate?: string;
  lastOutageDurationMin?: number;
  outageCount12Months?: number;

  // Metadata
  typeAttributes?: Record<string, unknown>;
  tags?: string[];
  discoverySource?: string;
  lastVerified?: string;
  verifiedById?: string;

  // Counts
  _count?: {
    outgoingRelationships: number;
    incomingRelationships: number;
    controlLinks: number;
    changeLinks: number;
  };

  // Risk Scoring
  riskScore?: number;
  riskScoreCalculatedAt?: string;
  complianceScore?: number;
  openVulnsCritical?: number;
  openVulnsHigh?: number;
  openVulnsMedium?: number;
  openVulnsLow?: number;
  slaBreachedVulns?: number;

  // Wazuh Agent Data
  wazuhAgentId?: string;
  wazuhAgentStatus?: string;
  wazuhLastCheckIn?: string;
  wazuhAgentVersion?: string;

  // SCA Compliance Data (from Wazuh)
  scaScore?: number;
  scaPolicyName?: string;
  scaPassCount?: number;
  scaFailCount?: number;
  scaLastAssessment?: string;

  // User Account Summary (from Wazuh)
  humanUserCount?: number;
  privilegedUserCount?: number;
  serviceAccountCount?: number;
  lastAuthFailureCount?: number;

  // Network Exposure
  openPortsCount?: number;
  criticalPortsOpen?: number[];

  // Wazuh Deep Link
  wazuhDashboardUrl?: string;

  // Installed Software (populated on detail view)
  installedSoftware?: AssetSoftware[];
}

export interface AssetRelationship {
  id: string;
  fromAssetId: string;
  fromAsset?: { id: string; assetTag: string; name: string; assetType: AssetType };
  toAssetId: string;
  toAsset?: { id: string; assetTag: string; name: string; assetType: AssetType };
  relationshipType: string;
  description?: string;
  isCritical: boolean;
}

export interface AssetSummary {
  total: number;
  active: number;
  critical: number;
  capacityWarning: number;
  inScope: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byCriticality: Record<string, number>;
}

// Change Types
export type ITSMChangeType = 'STANDARD' | 'NORMAL' | 'EMERGENCY';
export type ChangeCategory =
  | 'ACCESS_CONTROL'
  | 'CONFIGURATION'
  | 'INFRASTRUCTURE'
  | 'APPLICATION'
  | 'DATABASE'
  | 'SECURITY'
  | 'NETWORK'
  | 'BACKUP_DR'
  | 'MONITORING'
  | 'VENDOR'
  | 'DOCUMENTATION'
  | 'OTHER';
export type ChangePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ChangeStatus =
  | 'DRAFTED'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'NEEDS_INFO'
  | 'APPROVED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'IMPLEMENTING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'CANCELLED'
  | 'REVIEWED';
export type SecurityImpact = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface ChangeAssetLink {
  id: string;
  impactType: string;
  notes?: string;
  asset: {
    id: string;
    assetTag: string;
    name: string;
    assetType: string;
    businessCriticality: string;
  };
}

export interface ChangeHistoryEntry {
  id: string;
  field: string;
  oldValue?: string;
  newValue: string;
  changedBy?: UserBasic;
  createdAt: string;
}

export interface ChangeAttachment {
  id: string;
  fileName?: string;
  name?: string;
  fileSize?: number;
}

export interface ChangeChildSummary {
  id: string;
  changeRef: string;
  title: string;
}

export interface Change {
  id: string;
  createdAt: string;
  updatedAt: string;
  changeRef: string;
  title: string;
  description: string;
  changeType: ITSMChangeType;
  category: ChangeCategory;
  priority: ChangePriority;
  securityImpact: SecurityImpact;
  status: ChangeStatus;

  requesterId: string;
  requester?: UserBasic;
  implementerId?: string;
  implementer?: UserBasic;
  departmentId?: string;
  department?: DepartmentBasic;

  businessJustification?: string;
  impactAssessment?: string;
  riskLevel: string;
  riskAssessment?: string;
  backoutPlan?: string;
  testPlan?: string;
  testResults?: string;

  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;

  cabRequired: boolean;
  pirRequired: boolean;
  successful?: boolean;

  // Scheduling & Operations
  maintenanceWindow?: boolean;
  outageRequired?: boolean;
  estimatedDowntime?: number;
  rollbackTime?: number;
  affectedServices?: string[];
  successCriteria?: string;
  userImpact?: string;

  // Hierarchy
  parentChangeId?: string;
  parentChange?: ChangeChildSummary;
  childChanges?: ChangeChildSummary[];

  // Related data (populated on detail views)
  assetLinks?: ChangeAssetLink[];
  attachments?: ChangeAttachment[];
  history?: ChangeHistoryEntry[];

  _count?: {
    approvals: number;
    assetLinks: number;
  };
}

export interface ChangeApproval {
  id: string;
  changeId: string;
  approverId: string;
  approver?: UserBasic;
  approverRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ABSTAINED' | 'EXPIRED';
  decision?: string;
  decidedAt?: string;
  comments?: string;
  conditions?: string;
  isRequired: boolean;
  change?: Partial<Change>;
}

export interface ChangeSummary {
  total: number;
  pendingApproval: number;
  thisMonth: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface CapacitySummary {
  totalActive: number;
  criticalAtRisk: number;
  byStatus: Record<string, number>;
}

export interface ITSMDashboard {
  assets: AssetSummary;
  changes: ChangeSummary;
  capacity: CapacitySummary;
  assetsAtRisk: Asset[];
}

// ============================================
// ASSET API
// ============================================

export async function getAssets(params?: {
  skip?: number;
  take?: number;
  assetType?: AssetType;
  status?: AssetStatus;
  businessCriticality?: BusinessCriticality;
  dataClassification?: DataClassification;
  departmentId?: string;
  locationId?: string;
  ownerId?: string;
  cloudProvider?: CloudProvider;
  inIsmsScope?: boolean;
  capacityStatus?: CapacityStatus;
  search?: string;
}): Promise<PaginatedResponse<Asset>> {
  const query = new URLSearchParams();
  if (params?.skip) query.set('skip', String(params.skip));
  if (params?.take) query.set('take', String(params.take));
  if (params?.assetType) query.set('assetType', params.assetType);
  if (params?.status) query.set('status', params.status);
  if (params?.businessCriticality) query.set('businessCriticality', params.businessCriticality);
  if (params?.dataClassification) query.set('dataClassification', params.dataClassification);
  if (params?.departmentId) query.set('departmentId', params.departmentId);
  if (params?.locationId) query.set('locationId', params.locationId);
  if (params?.ownerId) query.set('ownerId', params.ownerId);
  if (params?.cloudProvider) query.set('cloudProvider', params.cloudProvider);
  if (params?.inIsmsScope !== undefined) query.set('inIsmsScope', String(params.inIsmsScope));
  if (params?.capacityStatus) query.set('capacityStatus', params.capacityStatus);
  if (params?.search) query.set('search', params.search);
  return request(`/api/itsm/assets?${query}`);
}

export async function getAsset(id: string): Promise<Asset> {
  return request(`/api/itsm/assets/${id}`);
}

export async function getAssetSummary(): Promise<AssetSummary> {
  return request('/api/itsm/assets/summary');
}

export interface AssetImpactAnalysis {
  asset: Partial<Asset>;
  directlyImpactedAssets: Partial<Asset>[];
  impactedBusinessProcesses: { id: string; name: string; processCode: string; criticalityLevel: string }[];
  summary: {
    totalDirectlyImpacted: number;
    impactedByBusinessCriticality: Record<string, number>;
    impactedProcessCount: number;
  };
}

export async function getAssetImpact(id: string): Promise<AssetImpactAnalysis> {
  return request(`/api/itsm/assets/${id}/impact`);
}

export async function generateAssetTag(assetType: string): Promise<{ assetTag: string }> {
  return request(`/api/itsm/assets/generate-tag/${assetType}`);
}

export async function createAsset(data: Partial<Asset>): Promise<Asset> {
  return request('/api/itsm/assets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAsset(id: string, data: Partial<Asset>): Promise<Asset> {
  return request(`/api/itsm/assets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAsset(id: string): Promise<void> {
  return request(`/api/itsm/assets/${id}`, { method: 'DELETE' });
}

export async function importAssets(assets: Record<string, string | boolean | undefined>[]): Promise<{
  imported: number;
  updated: number;
  errors: Array<{ row: number; error: string }>;
}> {
  return request('/api/itsm/assets/import', {
    method: 'POST',
    body: JSON.stringify({ assets }),
  });
}

export async function getImportTemplate(): Promise<{
  columns: Array<{
    field: string;
    label: string;
    required: boolean;
    description?: string;
    values?: string[];
    default?: string;
  }>;
  sampleData: Record<string, unknown>[];
}> {
  return request('/api/itsm/assets/export/template');
}

export async function getDataQuality(): Promise<{
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
  return request('/api/itsm/assets/data-quality');
}

// Asset Vulnerabilities
export interface AssetVulnerability {
  id: string;
  assetId: string;
  vulnerabilityId: string;
  discoveredAt?: string;
  port?: number;
  protocol?: string;
  vulnerability: {
    id: string;
    referenceNumber: string;
    cveId?: string;
    title: string;
    severity: string;
    status: string;
    slaDeadline?: string;
    slaBreached?: boolean;
    detectedAt?: string;
    cvssScore?: number;
  };
}

export async function getAssetVulnerabilities(assetId: string): Promise<AssetVulnerability[]> {
  return request(`/api/itsm/assets/${assetId}/vulnerabilities`);
}

export async function calculateAssetRiskScore(assetId: string): Promise<{ riskScore: number }> {
  return request(`/api/itsm/assets/${assetId}/calculate-risk`, { method: 'POST' });
}

// ============================================
// ASSET RISK LINKING API
// ============================================

export interface AssetRisk {
  id: string;
  assetId: string;
  riskId: string;
  impactLevel?: string;
  notes?: string;
  asset?: {
    id: string;
    assetTag: string;
    name: string;
    assetType: AssetType;
    businessCriticality: string;
  };
  risk?: {
    id: string;
    riskId: string;
    title: string;
    tier?: string;
    status?: string;
    inherentScore?: number;
    residualScore?: number;
  };
}

export async function getAssetRisksByAsset(assetId: string): Promise<AssetRisk[]> {
  return request(`/api/itsm/asset-risks/by-asset/${assetId}`);
}

export async function getAssetRisksByRisk(riskId: string): Promise<AssetRisk[]> {
  return request(`/api/itsm/asset-risks/by-risk/${riskId}`);
}

export async function linkAssetToRisk(data: {
  assetId: string;
  riskId: string;
  impactLevel?: string;
  notes?: string;
}): Promise<AssetRisk> {
  return request('/api/itsm/asset-risks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function bulkLinkAssetsToRisk(
  riskId: string,
  assets: Array<{ assetId: string; impactLevel?: string; notes?: string }>
): Promise<void> {
  return request(`/api/itsm/asset-risks/bulk/${riskId}`, {
    method: 'POST',
    body: JSON.stringify({ assets }),
  });
}

export async function unlinkAssetFromRisk(assetId: string, riskId: string): Promise<void> {
  return request(`/api/itsm/asset-risks/${assetId}/${riskId}`, { method: 'DELETE' });
}

// ============================================
// ASSET RELATIONSHIPS API
// ============================================

export async function getAssetRelationships(assetId: string, direction?: 'outgoing' | 'incoming' | 'all'): Promise<AssetRelationship[]> {
  const query = direction ? `?direction=${direction}` : '';
  return request(`/api/itsm/asset-relationships/by-asset/${assetId}${query}`);
}

export async function getDependencyChain(assetId: string, depth?: number): Promise<{
  level: number;
  fromAssetId: string;
  toAsset: Partial<Asset>;
  isCritical: boolean;
}[]> {
  const query = depth ? `?depth=${depth}` : '';
  return request(`/api/itsm/asset-relationships/dependency-chain/${assetId}${query}`);
}

export async function createAssetRelationship(data: {
  fromAssetId: string;
  toAssetId: string;
  relationshipType: string;
  description?: string;
  isCritical?: boolean;
}): Promise<AssetRelationship> {
  return request('/api/itsm/asset-relationships', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAssetRelationship(id: string): Promise<void> {
  return request(`/api/itsm/asset-relationships/${id}`, { method: 'DELETE' });
}

// ============================================
// CHANGE API
// ============================================

export async function getChanges(params?: {
  skip?: number;
  take?: number;
  status?: ChangeStatus;
  changeType?: ITSMChangeType;
  category?: ChangeCategory;
  priority?: ChangePriority;
  securityImpact?: SecurityImpact;
  requesterId?: string;
  departmentId?: string;
  search?: string;
}): Promise<PaginatedResponse<Change>> {
  const query = new URLSearchParams();
  if (params?.skip) query.set('skip', String(params.skip));
  if (params?.take) query.set('take', String(params.take));
  if (params?.status) query.set('status', params.status);
  if (params?.changeType) query.set('changeType', params.changeType);
  if (params?.category) query.set('category', params.category);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.securityImpact) query.set('securityImpact', params.securityImpact);
  if (params?.requesterId) query.set('requesterId', params.requesterId);
  if (params?.departmentId) query.set('departmentId', params.departmentId);
  if (params?.search) query.set('search', params.search);
  return request(`/api/itsm/changes?${query}`);
}

export async function getChange(id: string): Promise<Change> {
  return request(`/api/itsm/changes/${id}`);
}

export async function getChangeSummary(): Promise<ChangeSummary> {
  return request('/api/itsm/changes/summary');
}

export async function createChange(data: Partial<Change>): Promise<Change> {
  return request('/api/itsm/changes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateChange(id: string, data: Partial<Change>): Promise<Change> {
  return request(`/api/itsm/changes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function submitChange(id: string): Promise<Change> {
  return request(`/api/itsm/changes/${id}/submit`, { method: 'POST' });
}

export async function linkAssetsToChange(
  changeId: string,
  assets: Array<{ assetId: string; impactType: string; notes?: string }>
): Promise<void> {
  return request(`/api/itsm/changes/${changeId}/assets`, {
    method: 'POST',
    body: JSON.stringify({ assets }),
  });
}

export async function deleteChange(id: string): Promise<void> {
  return request(`/api/itsm/changes/${id}`, { method: 'DELETE' });
}

export async function getChangeHistory(id: string): Promise<Array<{
  id: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  action: string;
  notes?: string;
  createdAt: string;
  changedBy?: UserBasic;
}>> {
  return request(`/api/itsm/changes/${id}/history`);
}

export async function getChangeCalendar(startDate?: string, endDate?: string): Promise<{
  startDate: string;
  endDate: string;
  changes: Array<{
    id: string;
    changeRef: string;
    title: string;
    changeType: ITSMChangeType;
    category: ChangeCategory;
    priority: ChangePriority;
    status: ChangeStatus;
    plannedStart?: string;
    plannedEnd?: string;
    maintenanceWindow: boolean;
    outageRequired: boolean;
    estimatedDowntime?: number;
    requester?: UserBasic;
    assetLinks: Array<{ asset: { id: string; assetTag: string; name: string; businessCriticality: string } }>;
  }>;
}> {
  const query = new URLSearchParams();
  if (startDate) query.set('startDate', startDate);
  if (endDate) query.set('endDate', endDate);
  return request(`/api/itsm/changes/calendar?${query}`);
}

export async function getCabDashboard(): Promise<{
  pendingApproval: Change[];
  awaitingCab: number;
  upcomingChanges: Change[];
  stats: {
    recentApproved: number;
    recentRejected: number;
    emergencyThisMonth: number;
    successRate: number;
  };
}> {
  return request('/api/itsm/changes/cab-dashboard');
}

// ============================================
// CHANGE TEMPLATE API
// ============================================

export interface ChangeTemplate {
  id: string;
  templateCode: string;
  name: string;
  description: string;
  category: ChangeCategory;
  securityImpact: SecurityImpact;
  riskLevel: string;
  instructions: string;
  backoutPlan: string;
  testPlan?: string;
  autoApprove: boolean;
  maxDuration?: number;
  applicableAssetTypes?: string[];
  isActive: boolean;
  lastReviewDate?: string;
  nextReviewDate?: string;
  reviewedById?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
}

export async function getChangeTemplates(params?: {
  skip?: number;
  take?: number;
  isActive?: boolean;
  category?: ChangeCategory;
  search?: string;
}): Promise<PaginatedResponse<ChangeTemplate>> {
  const query = new URLSearchParams();
  if (params?.skip) query.set('skip', String(params.skip));
  if (params?.take) query.set('take', String(params.take));
  if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  return request(`/api/itsm/change-templates?${query}`);
}

export async function getChangeTemplate(id: string): Promise<ChangeTemplate> {
  return request(`/api/itsm/change-templates/${id}`);
}

export async function createChangeTemplate(data: Partial<ChangeTemplate>): Promise<ChangeTemplate> {
  return request('/api/itsm/change-templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateChangeTemplate(id: string, data: Partial<ChangeTemplate>): Promise<ChangeTemplate> {
  return request(`/api/itsm/change-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteChangeTemplate(id: string): Promise<void> {
  return request(`/api/itsm/change-templates/${id}`, { method: 'DELETE' });
}

export async function createChangeFromTemplate(
  templateId: string,
  data: {
    title?: string;
    description?: string;
    plannedStart?: string;
    plannedEnd?: string;
  }
): Promise<Change> {
  return request(`/api/itsm/change-templates/${templateId}/create-change`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function generateTemplateCode(category: string): Promise<{ templateCode: string }> {
  return request(`/api/itsm/change-templates/generate-code/${category}`);
}

// ============================================
// CHANGE APPROVAL API
// ============================================

export async function getPendingApprovals(): Promise<ChangeApproval[]> {
  return request('/api/itsm/change-approvals/pending');
}

export async function getApprovalsByChange(changeId: string): Promise<ChangeApproval[]> {
  return request(`/api/itsm/change-approvals/by-change/${changeId}`);
}

export async function requestApproval(
  changeId: string,
  approvers: Array<{ userId: string; role: string; isRequired?: boolean }>
): Promise<void> {
  return request(`/api/itsm/change-approvals/request/${changeId}`, {
    method: 'POST',
    body: JSON.stringify({ approvers }),
  });
}

export async function approveChange(approvalId: string, data: { comments?: string; conditions?: string }): Promise<ChangeApproval> {
  return request(`/api/itsm/change-approvals/${approvalId}/approve`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function rejectChange(approvalId: string, comments: string): Promise<ChangeApproval> {
  return request(`/api/itsm/change-approvals/${approvalId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ comments }),
  });
}

// ============================================
// CAPACITY API
// ============================================

export async function getCapacitySummary(): Promise<CapacitySummary> {
  return request('/api/itsm/capacity/summary');
}

export async function getAssetsAtRisk(): Promise<Asset[]> {
  return request('/api/itsm/capacity/at-risk');
}

export async function getCapacityHistory(assetId: string, days?: number): Promise<{
  id: string;
  recordedAt: string;
  cpuUsagePercent?: number;
  memoryUsagePercent?: number;
  storageUsagePercent?: number;
}[]> {
  const query = days ? `?days=${days}` : '';
  return request(`/api/itsm/capacity/history/${assetId}${query}`);
}

export async function recordCapacity(assetId: string, data: {
  cpuUsagePercent?: number;
  memoryUsagePercent?: number;
  storageUsagePercent?: number;
  networkUsagePercent?: number;
  source?: string;
}): Promise<void> {
  return request(`/api/itsm/capacity/record/${assetId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// CAPACITY PLAN API
// ============================================

export interface CapacityPlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  assetId?: string;
  asset?: { id: string; assetTag: string; name: string; assetType: string; status?: string };
  assetGroup?: string;
  title: string;
  description?: string;
  currentCapacity: string;
  currentUtilizationPercent?: number;
  projectedGrowthPercent?: number;
  projectionPeriodMonths?: number;
  projectedExhaustionDate?: string;
  recommendedAction?: string;
  recommendedDate?: string;
  estimatedCost?: number;
  costCurrency: string;
  status: string;
  approvedById?: string;
  approvedAt?: string;
  implementedAt?: string;
  reviewDate?: string;
  nextReviewDate?: string;
  createdBy?: UserBasic;
}

export async function getCapacityPlans(params?: {
  skip?: number;
  take?: number;
  status?: string;
  assetId?: string;
}): Promise<PaginatedResponse<CapacityPlan>> {
  const query = new URLSearchParams();
  if (params?.skip) query.set('skip', String(params.skip));
  if (params?.take) query.set('take', String(params.take));
  if (params?.status) query.set('status', params.status);
  if (params?.assetId) query.set('assetId', params.assetId);
  return request(`/api/itsm/capacity/plans?${query}`);
}

export async function getCapacityPlan(id: string): Promise<CapacityPlan> {
  return request(`/api/itsm/capacity/plans/${id}`);
}

export async function createCapacityPlan(data: Partial<CapacityPlan>): Promise<CapacityPlan> {
  return request('/api/itsm/capacity/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCapacityPlan(id: string, data: Partial<CapacityPlan>): Promise<CapacityPlan> {
  return request(`/api/itsm/capacity/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============================================
// ASSET SOFTWARE (returned inline via getAsset)
// ============================================

export interface AssetSoftware {
  id: string;
  hardwareAssetId: string;
  softwareName: string;
  softwareVersion?: string;
  vendor?: string;
  installDate?: string;
  installPath?: string;
  licenseType?: string;
  licenseKey?: string;
  licenseExpiry?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DASHBOARD API
// ============================================

export async function getITSMDashboard(): Promise<ITSMDashboard> {
  return request('/api/itsm/dashboard');
}


