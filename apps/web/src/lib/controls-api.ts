// Controls Module API Service

import type { Evidence } from "@/lib/evidence-api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed (${res.status})`);
  }

  const text = await res.text();
  if (!text) {
    throw new Error('Empty response from server');
  }
  
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid JSON response from server');
  }
}

// ============================================
// Types
// ============================================

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

export type ControlTheme = 'ORGANISATIONAL' | 'PEOPLE' | 'PHYSICAL' | 'TECHNOLOGICAL';
export type ControlFramework = 'ISO' | 'SOC2' | 'NIS2' | 'DORA';
export type CapabilityType = 'PROCESS' | 'TECHNOLOGY' | 'PEOPLE' | 'PHYSICAL';
export type ImplementationStatus = 'NOT_STARTED' | 'PARTIAL' | 'IMPLEMENTED';
export type TestResult = 'PASS' | 'PARTIAL' | 'FAIL' | 'NOT_TESTED' | 'NOT_APPLICABLE';
export type RAGStatus = 'GREEN' | 'AMBER' | 'RED' | 'NOT_MEASURED';
export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'NEW';
export type CollectionFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'PER_EVENT' | 'PER_INCIDENT';
export type EffectivenessTestType = 'DESIGN' | 'IMPLEMENTATION' | 'OPERATING';

export interface ControlEffectiveness {
  score: number;
  rating: string;
  passCount: number;
  partialCount: number;
  failCount: number;
  notTestedCount: number;
  totalLayers: number;
}

export interface Control {
  id: string;
  controlId: string;
  theme: ControlTheme;
  name: string;
  description?: string;
  // Multi-framework support
  framework?: ControlFramework;
  sourceStandard?: string;
  soc2Criteria?: string;
  tscCategory?: string;
  // SoA fields - applicability (automatic, regulatory scope)
  applicable: boolean;
  justificationIfNa?: string;
  // Manual enable/disable (separate from regulatory applicability)
  enabled: boolean;
  disabledReason?: string;
  disabledAt?: string;
  disabledById?: string;
  disabledBy?: UserBasic;
  // Implementation
  implementationStatus: ImplementationStatus;
  implementationDesc?: string;
  organisationId: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;
  createdBy?: UserBasic;
  updatedBy?: UserBasic;
  effectiveness?: ControlEffectiveness;
  // Backend may include joined layers and relation counts
  layers?: any[];
  _count?: Record<string, number>;
}

export interface Capability {
  id: string;
  capabilityId: string;
  name: string;
  type: CapabilityType;
  description?: string;
  testCriteria: string;
  evidenceRequired: string;
  maxMaturityLevel: number;
  dependsOn?: string;
  l1Criteria?: string;
  l1Evidence?: string;
  l2Criteria?: string;
  l2Evidence?: string;
  l3Criteria?: string;
  l3Evidence?: string;
  l4Criteria?: string;
  l4Evidence?: string;
  l5Criteria?: string;
  l5Evidence?: string;
  // Effectiveness test criteria (3 layers)
  designTestCriteria?: string;
  designEvidenceRequired?: string;
  implementationTestCriteria?: string;
  implementationEvidenceRequired?: string;
  operatingTestCriteria?: string;
  operatingEvidenceRequired?: string;
  controlId: string;
  control?: {
    id: string;
    controlId: string;
    name: string;
    theme: ControlTheme;
    applicable?: boolean;
    enabled?: boolean;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
  updatedBy?: UserBasic;
  _count?: { metrics: number; assessments: number; effectivenessTests: number };
  metrics?: CapabilityMetric[];
  assessments?: CapabilityAssessment[];
  effectivenessTests?: CapabilityEffectivenessTest[];
}

export interface CapabilityMetric {
  id: string;
  metricId: string;
  name: string;
  formula: string;
  unit: string;
  greenThreshold: string;
  amberThreshold: string;
  redThreshold: string;
  collectionFrequency: CollectionFrequency;
  dataSource: string;
  currentValue?: string;
  status?: RAGStatus;
  trend?: TrendDirection;
  lastCollection?: string;
  owner?: string;
  notes?: string;
  capabilityId: string;
  capability?: Capability;
  history?: MetricHistory[];
  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
  updatedBy?: UserBasic;
}

export interface MetricHistory {
  id: string;
  value: string;
  status: RAGStatus;
  collectedAt: string;
  collectedBy?: string;
  notes?: string;
  metricId: string;
  createdAt: string;
}

export interface CapabilityAssessment {
  id: string;
  currentMaturity?: number;
  targetMaturity?: number;
  gap?: number;
  l1Met?: boolean;
  l2Met?: boolean;
  l3Met?: boolean;
  l4Met?: boolean;
  l5Met?: boolean;
  assessor?: string;
  assessmentDate?: string;
  nextReview?: string;
  notes?: string;
  capabilityId: string;
  capability?: Capability;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
  updatedBy?: UserBasic;
}

export interface CapabilityEffectivenessTest {
  id: string;
  testType: EffectivenessTestType;
  testResult: TestResult;
  testDate?: string;
  tester?: string;
  // Test objective and steps
  objective?: string;
  testSteps?: string;
  testCriteria?: string; // Legacy combined field
  // Evidence
  evidenceRequired?: string;
  evidenceLocation?: string;
  evidenceNotes?: string;
  // SOA and pass criteria
  soaCriteria?: string;
  passCriteria?: string;
  // Results
  findings?: string;
  recommendations?: string;
  // Relations
  capabilityId: string;
  capability?: Capability;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
  updatedBy?: UserBasic;
}

export interface EffectivenessSummary {
  design: CapabilityEffectivenessTest | null;
  implementation: CapabilityEffectivenessTest | null;
  operating: CapabilityEffectivenessTest | null;
  overallStatus: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'NOT_EFFECTIVE' | 'NOT_TESTED';
  passCount: number;
  testedCount: number;
}

export interface ControlStats {
  total: number;
  applicable: number;
  notApplicable: number;
  implemented: number;
  partial: number;
  notStarted: number;
  byTheme: Record<string, number>;
}

export interface CapabilityStats {
  total: number;
  byType: Record<string, number>;
}

export interface MetricsDashboard {
  total: number;
  statusCounts: Record<RAGStatus, number>;
  byFrequency: Record<string, number>;
  byType: Record<string, { total: number; green: number; amber: number; red: number }>;
}

export interface EffectivenessReport {
  controls: Array<{
    id: string;
    controlId: string;
    name: string;
    theme: ControlTheme;
    score: number;
    rating: string;
    passCount: number;
    partialCount: number;
    failCount: number;
    notTestedCount: number;
    totalLayers: number;
  }>;
  byTheme: Record<string, { controls: any[]; avgScore: number }>;
}

export interface MaturityHeatmapItem {
  capabilityId: string;
  capabilityName: string;
  controlId: string;
  controlName: string;
  theme: ControlTheme;
  type: CapabilityType;
  currentMaturity: number | null;
  targetMaturity: number | null;
  gap: number | null;
}

export interface GapAnalysisItem {
  testId?: string;
  testCode?: string;
  testName?: string;
  capabilityId: string;
  capabilityName: string;
  controlId: string;
  controlName: string;
  theme: ControlTheme;
  type: CapabilityType;
  layer?: string;
  result?: TestResult | null;
  findings?: string | null;
  recommendations?: string | null;
  currentMaturity: number;
  targetMaturity: number;
  gap: number;
  priority: 'Critical' | 'High' | 'Medium';
  rootCause?: string | null;
  remediationEffort?: string | null;
  estimatedHours?: number | null;
  estimatedCost?: number | null;
}

export interface GapAnalysis {
  gaps: GapAnalysisItem[];
  summary: {
    totalGaps: number;
    criticalGaps: number;
    highGaps: number;
    mediumGaps: number;
    byRootCause?: Record<string, number>;
    byEffort?: Record<string, number>;
    totalEstimatedHours?: number;
    totalEstimatedCost?: number;
  };
}

// ============================================
// Control API
// ============================================

export async function createControl(data: {
  controlId: string;
  theme: ControlTheme;
  name: string;
  description?: string;
  framework?: ControlFramework;
  sourceStandard?: string;
  soc2Criteria?: string;
  tscCategory?: string;
  applicable?: boolean;
  justificationIfNa?: string;
  implementationStatus?: ImplementationStatus;
  implementationDesc?: string;
  organisationId: string;
}): Promise<Control> {
  return request<Control>('/api/controls', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getControls(params?: {
  skip?: number;
  take?: number;
  theme?: ControlTheme;
  framework?: ControlFramework;
  implementationStatus?: ImplementationStatus;
  applicable?: boolean;
  enabled?: boolean;
  activeOnly?: boolean;
  organisationId?: string;
  search?: string;
}): Promise<PaginatedResponse<Control>> {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.theme) searchParams.set('theme', params.theme);
  if (params?.framework) searchParams.set('framework', params.framework);
  if (params?.implementationStatus) searchParams.set('implementationStatus', params.implementationStatus);
  if (params?.applicable !== undefined) searchParams.set('applicable', String(params.applicable));
  if (params?.enabled !== undefined) searchParams.set('enabled', String(params.enabled));
  if (params?.activeOnly !== undefined) searchParams.set('activeOnly', String(params.activeOnly));
  if (params?.organisationId) searchParams.set('organisationId', params.organisationId);
  if (params?.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  return request<PaginatedResponse<Control>>(`/api/controls${query ? `?${query}` : ''}`);
}

export async function getControl(id: string): Promise<Control> {
  return request<Control>(`/api/controls/${id}`);
}

export async function updateControl(id: string, data: Partial<Control>): Promise<Control> {
  return request<Control>(`/api/controls/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getControlStats(organisationId?: string): Promise<ControlStats> {
  const query = organisationId ? `?organisationId=${organisationId}` : '';
  return request<ControlStats>(`/api/controls/stats${query}`);
}

export async function getEffectivenessReport(organisationId?: string): Promise<EffectivenessReport> {
  const query = organisationId ? `?organisationId=${organisationId}` : '';
  return request<EffectivenessReport>(`/api/controls/effectiveness${query}`);
}

export async function getMaturityHeatmap(organisationId?: string): Promise<MaturityHeatmapItem[]> {
  const query = organisationId ? `?organisationId=${organisationId}` : '';
  return request<MaturityHeatmapItem[]>(`/api/controls/maturity-heatmap${query}`);
}

export async function getGapAnalysis(organisationId?: string): Promise<GapAnalysis> {
  const query = organisationId ? `?organisationId=${organisationId}` : '';
  return request<GapAnalysis>(`/api/controls/gap-analysis${query}`);
}

/**
 * Get multiple controls by their IDs
 * Optimized for fetching specific controls linked to risk scenarios
 */
export async function getControlsByIds(ids: string[]): Promise<Control[]> {
  if (!ids || ids.length === 0) {
    return [];
  }
  return request<Control[]>('/api/controls/by-ids', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

/**
 * Disable a control manually
 * Requires a reason for audit trail
 */
export async function disableControl(id: string, reason: string): Promise<Control> {
  return request<Control>(`/api/controls/${id}/disable`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Enable a control manually
 * Cannot enable if control is not applicable (regulatory scope takes precedence)
 */
export async function enableControl(id: string): Promise<Control> {
  return request<Control>(`/api/controls/${id}/enable`, {
    method: 'POST',
  });
}

// ============================================
// Capability API
// ============================================

export async function getCapabilities(params?: {
  skip?: number;
  take?: number;
  type?: CapabilityType;
  controlId?: string;
  activeControlsOnly?: boolean;
  search?: string;
}): Promise<PaginatedResponse<Capability>> {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.type) searchParams.set('type', params.type);
  if (params?.controlId) searchParams.set('controlId', params.controlId);
  if (params?.activeControlsOnly !== undefined) searchParams.set('activeControlsOnly', String(params.activeControlsOnly));
  if (params?.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  return request<PaginatedResponse<Capability>>(`/api/capabilities${query ? `?${query}` : ''}`);
}

export async function getCapability(id: string): Promise<Capability> {
  return request<Capability>(`/api/capabilities/${id}`);
}

export async function getCapabilitiesByControl(controlId: string): Promise<Capability[]> {
  return request<Capability[]>(`/api/capabilities/by-control/${controlId}`);
}

export async function getCapabilityStats(): Promise<CapabilityStats> {
  return request<CapabilityStats>('/api/capabilities/stats');
}

// ============================================
// Assessment API
// ============================================

export async function getAssessments(params?: {
  skip?: number;
  take?: number;
  capabilityId?: string;
  testResult?: TestResult;
}): Promise<PaginatedResponse<CapabilityAssessment>> {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.capabilityId) searchParams.set('capabilityId', params.capabilityId);
  if (params?.testResult) searchParams.set('testResult', params.testResult);
  
  const query = searchParams.toString();
  return request<PaginatedResponse<CapabilityAssessment>>(`/api/assessments${query ? `?${query}` : ''}`);
}

export async function getAssessment(id: string): Promise<CapabilityAssessment> {
  return request<CapabilityAssessment>(`/api/assessments/${id}`);
}

export async function getAssessmentsByCapability(capabilityId: string): Promise<CapabilityAssessment[]> {
  return request<CapabilityAssessment[]>(`/api/assessments/by-capability/${capabilityId}`);
}

export async function createAssessment(data: Partial<CapabilityAssessment>): Promise<CapabilityAssessment> {
  return request<CapabilityAssessment>('/api/assessments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAssessment(id: string, data: Partial<CapabilityAssessment>): Promise<CapabilityAssessment> {
  return request<CapabilityAssessment>(`/api/assessments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAssessment(id: string): Promise<void> {
  return request<void>(`/api/assessments/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// Metric API
// ============================================

export async function getMetrics(params?: {
  skip?: number;
  take?: number;
  capabilityId?: string;
  status?: RAGStatus;
  collectionFrequency?: CollectionFrequency;
}): Promise<PaginatedResponse<CapabilityMetric>> {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.capabilityId) searchParams.set('capabilityId', params.capabilityId);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.collectionFrequency) searchParams.set('collectionFrequency', params.collectionFrequency);
  
  const query = searchParams.toString();
  return request<PaginatedResponse<CapabilityMetric>>(`/api/metrics${query ? `?${query}` : ''}`);
}

export async function getMetric(id: string): Promise<CapabilityMetric> {
  return request<CapabilityMetric>(`/api/metrics/${id}`);
}

export async function getMetricsByCapability(capabilityId: string): Promise<CapabilityMetric[]> {
  return request<CapabilityMetric[]>(`/api/metrics/by-capability/${capabilityId}`);
}

export async function updateMetricValue(
  id: string,
  value: string,
  userId?: string,
  notes?: string
): Promise<CapabilityMetric> {
  return request<CapabilityMetric>(`/api/metrics/${id}/value`, {
    method: 'PUT',
    body: JSON.stringify({ value, userId, notes }),
  });
}

export async function getMetricsDashboard(organisationId: string): Promise<MetricsDashboard> {
  return request<MetricsDashboard>(`/api/metrics/dashboard?organisationId=${organisationId}`);
}

export async function getMetricsDueForCollection(organisationId: string): Promise<CapabilityMetric[]> {
  return request<CapabilityMetric[]>(`/api/metrics/due?organisationId=${organisationId}`);
}

// ============================================
// SOA Types
// ============================================

export type SOAStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'SUPERSEDED';

export interface SOAEntry {
  id: string;
  controlId: string;
  controlName: string;
  theme: ControlTheme;
  applicable: boolean;
  justificationIfNa?: string;
  implementationStatus: ImplementationStatus;
  implementationDesc?: string;
  parentRiskId?: string;
  scenarioIds?: string;
  controlRecordId?: string;
  soaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatementOfApplicability {
  id: string;
  version: string;
  status: SOAStatus;
  name?: string;
  notes?: string;
  approvedAt?: string;
  approvedById?: string;
  approvedBy?: UserBasic;
  organisationId: string;
  entries?: SOAEntry[];
  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
  updatedBy?: UserBasic;
  _count?: { entries: number };
}

export interface SOAStats {
  totalVersions: number;
  latestVersion: string | null;
  latestStatus: SOAStatus | null;
  applicableCount: number;
  notApplicableCount: number;
  implementedCount: number;
  partialCount: number;
  notStartedCount: number;
}

// ============================================
// SOA API Functions
// ============================================

export async function getSOAs(params?: {
  skip?: number;
  take?: number;
  organisationId?: string;
  status?: SOAStatus;
}): Promise<{ data: StatementOfApplicability[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.organisationId) searchParams.set('organisationId', params.organisationId);
  if (params?.status) searchParams.set('status', params.status);
  
  const query = searchParams.toString();
  return request<{ data: StatementOfApplicability[]; total: number }>(`/api/soa${query ? `?${query}` : ''}`);
}

export async function getSOA(id: string): Promise<StatementOfApplicability> {
  return request<StatementOfApplicability>(`/api/soa/${id}`);
}

export async function getLatestSOA(organisationId: string): Promise<StatementOfApplicability> {
  return request<StatementOfApplicability>(`/api/soa/latest?organisationId=${organisationId}`);
}

export async function getSOAStats(organisationId?: string): Promise<SOAStats> {
  const params = organisationId ? `?organisationId=${organisationId}` : '';
  return request<SOAStats>(`/api/soa/stats${params}`);
}

export async function createSOA(data: {
  version: string;
  name?: string;
  notes?: string;
  organisationId: string;
  createdById?: string;
}): Promise<StatementOfApplicability> {
  return request<StatementOfApplicability>('/api/soa', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createSOAFromControls(data: {
  version: string;
  name?: string;
  notes?: string;
  organisationId: string;
  createdById?: string;
}): Promise<StatementOfApplicability> {
  return request<StatementOfApplicability>('/api/soa/from-controls', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createSOANewVersion(
  sourceId: string,
  data: {
    version: string;
    name?: string;
    notes?: string;
    createdById?: string;
  }
): Promise<StatementOfApplicability> {
  return request<StatementOfApplicability>(`/api/soa/${sourceId}/new-version`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSOA(
  id: string,
  data: {
    name?: string;
    notes?: string;
    updatedById?: string;
  }
): Promise<StatementOfApplicability> {
  return request<StatementOfApplicability>(`/api/soa/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function submitSOAForReview(
  id: string,
  updatedById?: string
): Promise<StatementOfApplicability> {
  return request<StatementOfApplicability>(`/api/soa/${id}/submit`, {
    method: 'PUT',
    body: JSON.stringify({ updatedById }),
  });
}

export async function approveSOA(
  id: string,
  approvedById: string
): Promise<StatementOfApplicability> {
  return request<StatementOfApplicability>(`/api/soa/${id}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ approvedById }),
  });
}

export async function deleteSOA(id: string): Promise<void> {
  await request<StatementOfApplicability>(`/api/soa/${id}`, {
    method: 'DELETE',
  });
}

export async function updateSOAEntry(
  entryId: string,
  data: {
    applicable?: boolean;
    justificationIfNa?: string;
    implementationStatus?: string;
    implementationDesc?: string;
    parentRiskId?: string;
    scenarioIds?: string;
  }
): Promise<SOAEntry> {
  return request<SOAEntry>(`/api/soa/entries/${entryId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function bulkUpdateSOAEntries(
  soaId: string,
  updates: Array<{
    controlId: string;
    applicable?: boolean;
    justificationIfNa?: string;
    implementationStatus?: string;
    implementationDesc?: string;
  }>
): Promise<void> {
  await request(`/api/soa/${soaId}/entries/bulk`, {
    method: 'PUT',
    body: JSON.stringify({ updates }),
  });
}

export async function syncSOAToControls(soaId: string): Promise<{ updatedCount: number }> {
  return request<{ updatedCount: number }>(`/api/soa/${soaId}/sync-to-controls`, {
    method: 'PUT',
  });
}

// ============================================
// Effectiveness Test API
// ============================================

export async function getAllEffectivenessTests(params?: {
  skip?: number;
  take?: number;
  testType?: EffectivenessTestType;
  testResult?: TestResult;
}): Promise<PaginatedResponse<CapabilityEffectivenessTest>> {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.testType) searchParams.set('testType', params.testType);
  if (params?.testResult) searchParams.set('testResult', params.testResult);
  
  const query = searchParams.toString();
  return request<PaginatedResponse<CapabilityEffectivenessTest>>(`/api/effectiveness-tests${query ? `?${query}` : ''}`);
}

export async function getEffectivenessTests(capabilityId: string): Promise<CapabilityEffectivenessTest[]> {
  return request<CapabilityEffectivenessTest[]>(`/api/effectiveness-tests/capability/${capabilityId}`);
}

export async function getEffectivenessSummary(capabilityId: string): Promise<EffectivenessSummary> {
  return request<EffectivenessSummary>(`/api/effectiveness-tests/capability/${capabilityId}/summary`);
}

export async function getEffectivenessTest(id: string): Promise<CapabilityEffectivenessTest> {
  return request<CapabilityEffectivenessTest>(`/api/effectiveness-tests/${id}`);
}

export async function createEffectivenessTest(data: {
  capabilityId: string;
  testType: EffectivenessTestType;
  testResult?: TestResult;
  testDate?: string;
  tester?: string;
  testCriteria?: string;
  evidenceRequired?: string;
  evidenceLocation?: string;
  evidenceNotes?: string;
  findings?: string;
  recommendations?: string;
  createdById?: string;
}): Promise<CapabilityEffectivenessTest> {
  return request<CapabilityEffectivenessTest>('/api/effectiveness-tests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEffectivenessTest(
  id: string,
  data: Partial<CapabilityEffectivenessTest>
): Promise<CapabilityEffectivenessTest> {
  return request<CapabilityEffectivenessTest>(`/api/effectiveness-tests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEffectivenessTest(id: string): Promise<void> {
  return request<void>(`/api/effectiveness-tests/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// Assessment Model Types
// ============================================

export type ControlAssessmentStatus = 'DRAFT' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type AssessmentTestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type RootCauseCategory = 'PEOPLE' | 'PROCESS' | 'TECHNOLOGY' | 'BUDGET' | 'THIRD_PARTY' | 'DESIGN' | 'UNKNOWN';
export type RemediationEffort = 'TRIVIAL' | 'MINOR' | 'MODERATE' | 'MAJOR' | 'STRATEGIC';
export type TestMethod = 'MANUAL' | 'SELF_ASSESSMENT' | 'AUTOMATED';

export interface Assessment {
  id: string;
  organisationId: string;
  assessmentRef: string;
  title: string;
  description?: string;
  status: ControlAssessmentStatus;
  leadTesterId?: string;
  leadTester?: UserBasic;
  reviewerId?: string;
  reviewer?: UserBasic;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  dueDate?: string;
  periodStart?: string;
  periodEnd?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  totalTests: number;
  completedTests: number;
  passedTests: number;
  failedTests: number;
  controls?: AssessmentControl[];
  scopeItems?: AssessmentScope[];
  tests?: AssessmentTest[];
  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
}

export interface AssessmentControl {
  id: string;
  assessmentId: string;
  controlId: string;
  control?: Control;
}

export interface AssessmentScope {
  id: string;
  assessmentId: string;
  scopeItemId: string;
  scopeItem?: ScopeItem;
}

export interface AssessmentTest {
  id: string;
  assessmentId: string;
  assessment?: Assessment;
  layerTestId: string;
  layerTest?: any;
  scopeItemId?: string;
  scopeItem?: ScopeItem;
  status: AssessmentTestStatus;
  result?: TestResult;
  assignedTesterId?: string;
  assignedTester?: UserBasic;
  testMethod?: TestMethod;
  ownerId?: string;
  owner?: UserBasic;
  assessorId?: string;
  assessor?: UserBasic;
  findings?: string;
  recommendations?: string;
  rootCause?: RootCauseCategory;
  rootCauseNotes?: string;
  remediationEffort?: RemediationEffort;
  estimatedHours?: number;
  estimatedCost?: number;
  skipJustification?: string;
  executions?: AssessmentExecution[];
  _count?: { executions: number };
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentExecution {
  id: string;
  assessmentTestId: string;
  assessmentTest?: AssessmentTest;
  executionDate: string;
  testerId: string;
  tester?: UserBasic;
  result: TestResult;
  findings?: string;
  recommendations?: string;
  evidenceLocation?: string;
  evidenceNotes?: string;
  evidenceFileIds: string[];
  durationMinutes?: number;
  samplesReviewed?: number;
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
}

// ============================================
// Scope Types
// ============================================

export type ScopeType = 'APPLICATION' | 'ASSET_CLASS' | 'LOCATION' | 'PERSONNEL_TYPE' | 'BUSINESS_UNIT' | 'PLATFORM' | 'PROVIDER' | 'NETWORK_ZONE' | 'PROCESS';
export type ScopeCriticality = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ScopeItem {
  id: string;
  organisationId: string;
  scopeType: ScopeType;
  code: string;
  name: string;
  description?: string;
  criticality: ScopeCriticality;
  isActive: boolean;
  _count?: { tests: number };
  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
}

// ============================================
// Scope Item API
// ============================================

export async function fetchScopeItems(orgId: string, scopeType?: ScopeType): Promise<ScopeItem[]> {
  const params = new URLSearchParams({ orgId });
  if (scopeType) params.set('scopeType', scopeType);
  return request<ScopeItem[]>(`/api/scope-items?${params}`);
}

export async function fetchScopeItem(id: string): Promise<ScopeItem> {
  return request<ScopeItem>(`/api/scope-items/${id}`);
}

export async function createScopeItem(data: {
  organisationId: string;
  scopeType: ScopeType;
  code: string;
  name: string;
  description?: string;
  criticality?: ScopeCriticality;
}): Promise<ScopeItem> {
  return request<ScopeItem>('/api/scope-items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateScopeItem(id: string, data: {
  name?: string;
  description?: string;
  criticality?: ScopeCriticality;
  isActive?: boolean;
}): Promise<ScopeItem> {
  return request<ScopeItem>(`/api/scope-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteScopeItem(id: string): Promise<void> {
  await request<void>(`/api/scope-items/${id}`, { method: 'DELETE' });
}

// ============================================
// Assessment API (new assessment-based model)
// ============================================

export async function fetchAssessments(organisationId: string, status?: ControlAssessmentStatus): Promise<Assessment[]> {
  const params = new URLSearchParams({ organisationId });
  if (status) params.set('status', status);
  return request<Assessment[]>(`/api/assessments?${params}`);
}

export async function fetchAssessment(id: string): Promise<Assessment> {
  return request<Assessment>(`/api/assessments/${id}`);
}

export async function createNewAssessment(data: {
  organisationId: string;
  title: string;
  description?: string;
  assessmentRef?: string;
  leadTesterId?: string;
  reviewerId?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  dueDate?: string;
  periodStart?: string;
  periodEnd?: string;
  controlIds?: string[];
  scopeItemIds?: string[];
}): Promise<Assessment> {
  return request<Assessment>('/api/assessments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateExistingAssessment(id: string, data: Partial<Assessment>): Promise<Assessment> {
  return request<Assessment>(`/api/assessments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteExistingAssessment(id: string): Promise<void> {
  await request<void>(`/api/assessments/${id}`, { method: 'DELETE' });
}

// Lifecycle
export async function startAssessment(id: string): Promise<Assessment> {
  return request<Assessment>(`/api/assessments/${id}/start`, { method: 'POST' });
}

export async function submitAssessmentForReview(id: string): Promise<Assessment> {
  return request<Assessment>(`/api/assessments/${id}/submit-review`, { method: 'POST' });
}

export async function completeAssessment(id: string, reviewNotes?: string): Promise<Assessment> {
  return request<Assessment>(`/api/assessments/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ reviewNotes }),
  });
}

export async function cancelAssessment(id: string, reason: string): Promise<Assessment> {
  return request<Assessment>(`/api/assessments/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// Scope
export async function addControlsToAssessment(id: string, controlIds: string[]): Promise<void> {
  await request<void>(`/api/assessments/${id}/controls`, {
    method: 'POST',
    body: JSON.stringify({ controlIds }),
  });
}

export async function removeControlFromAssessment(id: string, controlId: string): Promise<void> {
  await request<void>(`/api/assessments/${id}/controls/${controlId}`, { method: 'DELETE' });
}

export async function addScopeItemsToAssessment(id: string, scopeItemIds: string[]): Promise<void> {
  await request<void>(`/api/assessments/${id}/scope-items`, {
    method: 'POST',
    body: JSON.stringify({ scopeItemIds }),
  });
}

export async function removeScopeItemFromAssessment(id: string, scopeItemId: string): Promise<void> {
  await request<void>(`/api/assessments/${id}/scope-items/${scopeItemId}`, { method: 'DELETE' });
}

// Test Population
export async function populateAssessmentTests(id: string): Promise<Assessment> {
  return request<Assessment>(`/api/assessments/${id}/populate`, { method: 'POST' });
}

// Assessment Tests
export async function fetchAssessmentTests(assessmentId: string, status?: string): Promise<AssessmentTest[]> {
  const params = status ? `?status=${status}` : '';
  return request<AssessmentTest[]>(`/api/assessments/${assessmentId}/tests${params}`);
}

export async function fetchAssessmentTest(testId: string): Promise<AssessmentTest> {
  return request<AssessmentTest>(`/api/assessment-tests/${testId}`);
}

export async function executeAssessmentTest(testId: string, data: {
  result: TestResult;
  findings?: string;
  recommendations?: string;
  evidenceLocation?: string;
  evidenceNotes?: string;
  evidenceFileIds?: string[];
  durationMinutes?: number;
  samplesReviewed?: number;
  periodStart?: string;
  periodEnd?: string;
}): Promise<AssessmentTest> {
  return request<AssessmentTest>(`/api/assessment-tests/${testId}/execute`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function assignAssessmentTestTester(testId: string, testerId: string): Promise<AssessmentTest> {
  return request<AssessmentTest>(`/api/assessment-tests/${testId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ testerId }),
  });
}

export async function updateAssessmentTestRootCause(testId: string, data: {
  rootCause?: RootCauseCategory;
  rootCauseNotes?: string;
  remediationEffort?: RemediationEffort;
  estimatedHours?: number;
  estimatedCost?: number;
}): Promise<AssessmentTest> {
  return request<AssessmentTest>(`/api/assessment-tests/${testId}/root-cause`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function skipAssessmentTest(testId: string, justification: string): Promise<AssessmentTest> {
  return request<AssessmentTest>(`/api/assessment-tests/${testId}/skip`, {
    method: 'POST',
    body: JSON.stringify({ justification }),
  });
}

export async function fetchAssessmentTestExecutions(testId: string): Promise<AssessmentExecution[]> {
  return request<AssessmentExecution[]>(`/api/assessment-tests/${testId}/executions`);
}

export async function updateAssessmentTest(testId: string, data: {
  testMethod?: TestMethod;
  ownerId?: string;
  assessorId?: string;
  assignedTesterId?: string;
}): Promise<AssessmentTest> {
  return request<AssessmentTest>(`/api/assessment-tests/${testId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getControlsUsers(): Promise<UserBasic[]> {
  const response = await request<{ results: UserBasic[]; count: number }>('/api/auth/users');
  return response.results;
}

// My Tests
export async function getMyAssessmentTests(filters?: {
  status?: string;
  testMethod?: string;
  role?: 'owner' | 'tester' | 'assessor';
}): Promise<AssessmentTest[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.testMethod) params.set('testMethod', filters.testMethod);
  if (filters?.role) params.set('role', filters.role);
  const qs = params.toString();
  return request<AssessmentTest[]>(`/api/my-tests${qs ? `?${qs}` : ''}`);
}

export async function getMyAssessmentTestsCount(): Promise<number> {
  return request<number>('/api/my-tests/count');
}

// Bulk Assign
export async function bulkAssignAssessmentTests(testIds: string[], assignments: {
  assignedTesterId?: string;
  ownerId?: string;
  assessorId?: string;
  testMethod?: TestMethod;
}): Promise<{ count: number }> {
  return request<{ count: number }>('/api/assessment-tests/bulk-assign', {
    method: 'PATCH',
    body: JSON.stringify({ testIds, ...assignments }),
  });
}
