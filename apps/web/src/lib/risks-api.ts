// Risks Module API Service

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

export type RiskTier = 'CORE' | 'EXTENDED' | 'ADVANCED';
export type RiskStatus = 'IDENTIFIED' | 'ASSESSED' | 'TREATING' | 'ACCEPTED' | 'CLOSED';
export type ControlFramework = 'ISO' | 'SOC2' | 'NIS2' | 'DORA';
export type RAGStatus = 'GREEN' | 'AMBER' | 'RED' | 'NOT_MEASURED';
export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'NEW';
export type CollectionFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'PER_EVENT' | 'PER_INCIDENT';

export interface UserBasic {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export type User = UserBasic;

export interface RiskTreatmentPlanSummary {
  id: string;
  treatmentId: string;
  title: string;
  treatmentType: TreatmentType;
  priority: TreatmentPriority;
  status: TreatmentStatus;
  progressPercentage: number;
  targetEndDate?: string;
}

export interface RiskToleranceSummary {
  id: string;
  rtsId: string;
  title: string;
  domain?: string;
  proposedToleranceLevel: ToleranceLevel;
  status: RTSStatus;
  proposedRTS: string;
}

export interface Risk {
  id: string;
  riskId: string;
  title: string;
  description?: string;
  tier: RiskTier;
  orgSize?: string;
  status: RiskStatus;
  framework: ControlFramework;
  soc2Criteria?: string;
  tscCategory?: string;
  // Applicability (automatic, regulatory scope)
  applicable: boolean;
  justificationIfNa?: string;
  // Manual enable/disable (separate from regulatory applicability)
  enabled: boolean;
  disabledReason?: string;
  disabledAt?: string;
  disabledById?: string;
  disabledBy?: UserBasic;
  // Assessment
  likelihood?: string;
  impact?: string;
  inherentScore?: number;
  residualScore?: number;
  riskOwner?: string;
  treatmentPlan?: string;
  acceptanceCriteria?: string;
  organisationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
  updatedBy?: UserBasic;
  _count?: { scenarios: number; kris: number; treatmentPlans?: number; toleranceStatements?: number };
  scenarios?: RiskScenario[];
  kris?: KeyRiskIndicator[];
  controls?: { id: string; controlId: string; name: string; theme: string; framework: string }[];
  treatmentPlans?: RiskTreatmentPlanSummary[];
  toleranceStatements?: RiskToleranceSummary[];
}

export type LikelihoodLevel = 'RARE' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'ALMOST_CERTAIN';
export type ImpactLevel = 'NEGLIGIBLE' | 'MINOR' | 'MODERATE' | 'MAJOR' | 'SEVERE';
export type ImpactCategory = 'FINANCIAL' | 'OPERATIONAL' | 'LEGAL_REGULATORY' | 'REPUTATIONAL' | 'STRATEGIC';

export type ScenarioStatus =
  | 'DRAFT'
  | 'ASSESSED'
  | 'EVALUATED'
  | 'TREATING'
  | 'TREATED'
  | 'ACCEPTED'
  | 'MONITORING'
  | 'ESCALATED'
  | 'REVIEW'
  | 'CLOSED'
  | 'ARCHIVED';

export interface ScenarioImpactAssessment {
  id: string;
  scenarioId: string;
  category: ImpactCategory;
  level: ImpactLevel;
  value: number;
  rationale?: string;
  isResidual: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EffectiveThreshold {
  category: ImpactCategory;
  level: ImpactLevel;
  value: number;
  description: string;
  minAmount?: number;
  maxAmount?: number;
  duration?: string;
  isRegulatoryMinimum: boolean;
  regulatorySource?: string;
  isOverridden: boolean;
  overrideRationale?: string;
}

// Subset of TreatmentPlan returned when nested in RiskScenario
export interface ScenarioTreatmentPlanSummary {
  id: string;
  treatmentId: string;
  title: string;
  description: string;
  treatmentType: TreatmentType;
  status: TreatmentStatus;
  priority: TreatmentPriority;
  progressPercentage: number;
  targetResidualScore?: number;
  targetStartDate?: string;
  targetEndDate?: string;
  createdAt: string;
}

export interface RiskScenario {
  id: string;
  scenarioId: string;
  title: string;
  cause?: string;
  event?: string;
  consequence?: string;
  sleLow?: number;
  sleLikely?: number;
  sleHigh?: number;
  aro?: number;
  ale?: number;

  // Workflow status (CRITICAL - Issue #1 fix)
  status: ScenarioStatus;
  statusChangedAt?: string;
  statusChangedBy?: UserBasic;

  // Tolerance evaluation
  toleranceStatus?: 'WITHIN' | 'EXCEEDS' | 'CRITICAL';
  toleranceThreshold?: number;
  toleranceGap?: number;

  // Inherent assessment (before controls)
  likelihood?: LikelihoodLevel;
  impact?: ImpactLevel;
  inherentScore?: number;

  // Residual assessment (after controls)
  residualLikelihood?: LikelihoodLevel;
  residualImpact?: ImpactLevel;
  residualScore?: number;

  // System-calculated residual (from control effectiveness)
  calculatedResidualLikelihood?: LikelihoodLevel;
  calculatedResidualImpact?: ImpactLevel;
  calculatedResidualScore?: number;

  // Override tracking
  residualOverridden?: boolean;
  residualOverrideJustification?: string;

  // BIRT weighted impact
  weightedImpact?: number;
  residualWeightedImpact?: number;
  impactAssessments?: ScenarioImpactAssessment[];

  // F1-F6 Likelihood Factor Scores
  f1ThreatFrequency?: number;
  f1Source?: string;
  f1Override?: boolean;
  f1OverrideJustification?: string;
  f2ControlEffectiveness?: number;
  f2Source?: string;
  f2Override?: boolean;
  f2OverrideJustification?: string;
  f3GapVulnerability?: number;
  f3Source?: string;
  f3Override?: boolean;
  f3OverrideJustification?: string;
  f4IncidentHistory?: number;
  f4Source?: string;
  f4Override?: boolean;
  f4OverrideJustification?: string;
  f5AttackSurface?: number;
  f5Source?: string;
  f5Override?: boolean;
  f5OverrideJustification?: string;
  f6Environmental?: number;
  f6Source?: string;
  f6Override?: boolean;
  f6OverrideJustification?: string;

  // I1-I5 Impact Factor Scores
  i1Financial?: number;
  i1Breakdown?: Record<string, unknown>;
  i2Operational?: number;
  i2Breakdown?: Record<string, unknown>;
  i3Regulatory?: number;
  i3Breakdown?: Record<string, unknown>;
  i4Reputational?: number;
  i4Breakdown?: Record<string, unknown>;
  i5Strategic?: number;
  i5Breakdown?: Record<string, unknown>;

  // Calculated aggregated scores
  calculatedLikelihood?: number;
  calculatedImpact?: number;
  targetResidualScore?: number;

  // Calculation metadata
  lastCalculatedAt?: string;
  lastCalculatedBy?: UserBasic;
  calculationTrigger?: string;
  calculationTrace?: Record<string, unknown>;

  // Calculation history for trend charts
  calculationHistory?: Array<{
    id: string;
    calculatedAt: string;
    trigger: string;
    inherentScore: number | null;
    residualScore: number | null;
    previousResidualScore: number | null;
    scoreChange: number | null;
  }>;

  // FAIR Monte Carlo quantitative analysis
  quantitativeMode?: boolean;
  tefMin?: number;
  tefMode?: number;
  tefMax?: number;
  fairVulnerability?: number;
  primaryLossMin?: number;
  primaryLossMode?: number;
  primaryLossMax?: number;
  secondaryLossMin?: number;
  secondaryLossMode?: number;
  secondaryLossMax?: number;
  secondaryLossProbability?: number;
  simulationResult?: Record<string, unknown>;

  // Linked treatment plans
  treatmentPlans?: ScenarioTreatmentPlanSummary[];

  // Linked entities
  controlLinks?: Array<{
    id: string;
    controlId: string;
    effectivenessWeight?: number;
    isPrimaryControl?: boolean;
  }>;
  assetLinks?: Array<{
    id: string;
    assetId: string;
    isPrimaryTarget?: boolean;
  }>;
  vendorLinks?: Array<{
    id: string;
    vendorId: string;
  }>;
  applicationLinks?: Array<{
    id: string;
    applicationId: string;
    isPrimaryTarget?: boolean;
  }>;

  framework: ControlFramework;
  controlIds?: string;
  riskId: string;
  risk?: { id: string; riskId: string; title: string; tier: RiskTier; framework: ControlFramework };

  // Linked Risk Tolerance Statements
  toleranceStatements?: Array<{
    id: string;
    rtsId: string;
    title: string;
    proposedToleranceLevel: ToleranceLevel;
    domain?: string;
    status: RTSStatus;
  }>;

  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
  updatedBy?: UserBasic;
}

export interface KeyRiskIndicator {
  id: string;
  kriId: string;
  name: string;
  description?: string;
  formula?: string;
  unit: string;
  thresholdGreen?: string;
  thresholdAmber?: string;
  thresholdRed?: string;
  frequency: CollectionFrequency;
  dataSource?: string;
  automated: boolean;
  tier: RiskTier;
  currentValue?: string;
  status?: RAGStatus;
  trend?: TrendDirection;
  lastMeasured?: string;
  framework: ControlFramework;
  soc2Criteria?: string;
  riskId: string;
  risk?: { id: string; riskId: string; title: string; tier: RiskTier; framework: ControlFramework };
  history?: KRIHistory[];
  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
  updatedBy?: UserBasic;
}

export interface KRIHistory {
  id: string;
  value: string;
  status: RAGStatus;
  measuredAt: string;
  measuredBy?: string;
  notes?: string;
  kriId: string;
  createdAt: string;
}

export interface RiskStats {
  total: number;
  scenarioCount: number;
  kriCount: number;
  byTier: Record<RiskTier, number>;
  byStatus: Record<RiskStatus, number>;
  byFramework: Record<ControlFramework, number>;
}

export interface KRIDashboard {
  total: number;
  statusCounts: Record<RAGStatus, number>;
  byTier: Record<RiskTier, { total: number; green: number; amber: number; red: number }>;
}

// ============================================
// Risk API
// ============================================

export async function getRisks(params?: {
  skip?: number;
  take?: number;
  tier?: RiskTier;
  status?: RiskStatus;
  framework?: ControlFramework;
  organisationId?: string;
  search?: string;
}): Promise<PaginatedResponse<Risk>> {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.tier) searchParams.set('tier', params.tier);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.framework) searchParams.set('framework', params.framework);
  if (params?.organisationId) searchParams.set('organisationId', params.organisationId);
  if (params?.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  return request<PaginatedResponse<Risk>>(`/api/risks${query ? `?${query}` : ''}`);
}

export async function getRisk(id: string): Promise<Risk> {
  return request<Risk>(`/api/risks/${id}`);
}

export async function getRiskStats(organisationId?: string): Promise<RiskStats> {
  const query = organisationId ? `?organisationId=${organisationId}` : '';
  return request<RiskStats>(`/api/risks/stats${query}`);
}

export async function createRisk(data: {
  riskId: string;
  title: string;
  description?: string;
  tier?: RiskTier;
  status?: RiskStatus;
  framework?: ControlFramework;
  riskOwner?: string;
  likelihood?: string;
  impact?: string;
  applicable?: boolean;
  justificationIfNa?: string;
  soc2Criteria?: string;
  tscCategory?: string;
  orgSize?: string;
  organisationId?: string;
}): Promise<Risk> {
  return request<Risk>('/api/risks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRisk(id: string, data: Partial<Risk>): Promise<Risk> {
  return request<Risk>(`/api/risks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Disable a risk manually
 * Requires a reason for audit trail
 */
export async function disableRisk(id: string, reason: string): Promise<Risk> {
  return request<Risk>(`/api/risks/${id}/disable`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Enable a risk manually
 * Cannot enable if risk is not applicable (regulatory scope takes precedence)
 */
export async function enableRisk(id: string): Promise<Risk> {
  return request<Risk>(`/api/risks/${id}/enable`, {
    method: 'POST',
  });
}

// ============================================
// Risk Scenario API
// ============================================

export async function getRiskScenarios(params?: {
  skip?: number;
  take?: number;
}): Promise<PaginatedResponse<RiskScenario>> {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));

  const query = searchParams.toString();
  return request<PaginatedResponse<RiskScenario>>(`/api/risk-scenarios${query ? `?${query}` : ''}`);
}

export async function getRiskScenario(id: string): Promise<RiskScenario> {
  return request<RiskScenario>(`/api/risk-scenarios/${id}`);
}

export async function getScenariosByRisk(riskId: string): Promise<RiskScenario[]> {
  return request<RiskScenario[]>(`/api/risk-scenarios/risk/${riskId}`);
}

// ============================================
// F1-F6 Factor Scores API
// 3-Factor INHERENT Likelihood Model:
//   F1 (34%): Threat Frequency - How often do attackers try?
//   F2 (33%): Vulnerability/Ease of Exploit - How easy is it to exploit?
//   F3 (33%): Attack Surface - How many entry points exist?
// F4-F6 are supplementary (0% weight) for informational tracking
//
// NOTE: Field names are legacy and don't match semantic meaning:
//   f2ControlEffectiveness → actually means Vulnerability/Ease of Exploit
//   f3GapVulnerability → actually means Attack Surface
// ============================================

export interface FactorScores {
  /** F1: Threat Frequency - How often do attackers attempt this attack type? */
  f1ThreatFrequency: number | null;
  /** F2: Vulnerability/Ease of Exploit (legacy name: ControlEffectiveness) */
  f2ControlEffectiveness: number | null;
  /** F3: Attack Surface (legacy name: GapVulnerability) */
  f3GapVulnerability: number | null;
  /** F4: Incident History (informational, 0% weight) */
  f4IncidentHistory: number | null;
  /** F5: External Exposure - legacy, merged into F3 (informational, 0% weight) */
  f5AttackSurface: number | null;
  /** F6: Environmental factors (informational, 0% weight) */
  f6Environmental: number | null;
}

export interface FactorScoresResponse {
  scores: FactorScores;
  overrides: {
    f1Override?: boolean;
    f1OverrideJustification?: string;
    f2Override?: boolean;
    f2OverrideJustification?: string;
    f3Override?: boolean;
    f3OverrideJustification?: string;
    f4Override?: boolean;
    f4OverrideJustification?: string;
    f5Override?: boolean;
    f5OverrideJustification?: string;
    f6Override?: boolean;
    f6OverrideJustification?: string;
  };
  sources: {
    f1Source?: string;
    f2Source?: string;
    f3Source?: string;
    f4Source?: string;
    f5Source?: string;
    f6Source?: string;
  };
  justifications?: {
    f1Justification?: string;
    f1References?: { fsisac?: string; dbir?: string };
    f2Justification?: string;
    f3Justification?: string;
    f4Justification?: string;
    f5Justification?: string;
    f6Justification?: string;
  };
  calculatedLikelihood: number | null;
  lastCalculatedAt: string | null;
  allScored: boolean;
}

// ============================================
// Factor Evidence Types
// Evidence data sources for each F1-F6 factor
// ============================================

export interface FactorEvidence {
  f1?: {
    baseFrequency?: number;
    trend?: 'INCREASING' | 'STABLE' | 'DECREASING';
    fsisacAlert?: string;
    dbirReference?: string;
    lastUpdated?: string;
  };
  f2?: {
    linkedControls?: Array<{
      id: string;
      controlId: string;
      name: string;
      effectiveness: number;
      lastTested?: string;
      maturity?: string;
    }>;
    averageEffectiveness?: number;
    gapCount?: number;
  };
  f3?: {
    openVulnerabilities?: number;
    criticalVulnerabilities?: number;
    auditFindings?: number;
    lastScanDate?: string;
    source?: string;
  };
  f4?: {
    incidents?: Array<{
      id: string;
      incidentId: string;
      title: string;
      severity: string;
      date: string;
    }>;
    incidentCount?: number;
    lastIncidentDate?: string;
  };
  f5?: {
    externalAssets?: number;
    internetFacing?: boolean;
    thirdPartyConnections?: number;
    cloudExposure?: string;
    source?: string;
  };
  f6?: {
    regulatoryPressure?: 'LOW' | 'MEDIUM' | 'HIGH';
    industryTargeting?: boolean;
    geopoliticalRisk?: string;
    recentAlerts?: string[];
  };
}

/**
 * Get F1-F6 likelihood factor scores for a scenario
 * These are the manual/stored factor scores required for T01 transition
 */
export async function getFactorScores(scenarioId: string): Promise<FactorScoresResponse> {
  return request<FactorScoresResponse>(`/api/risk-scenarios/${scenarioId}/factor-scores`);
}

/**
 * Get evidence data for F1-F6 likelihood factors
 * Returns linked data from controls, incidents, etc.
 */
export async function getFactorEvidence(scenarioId: string): Promise<FactorEvidence> {
  return request<FactorEvidence>(`/api/risk-scenarios/${scenarioId}/factor-evidence`);
}

/**
 * Update F1-F6 likelihood factor scores for a scenario
 */
export async function updateFactorScores(
  scenarioId: string,
  scores: Partial<FactorScores>
): Promise<FactorScoresResponse> {
  return request<FactorScoresResponse>(`/api/risk-scenarios/${scenarioId}/factor-scores`, {
    method: 'PUT',
    body: JSON.stringify(scores),
  });
}

export async function createRiskScenario(data: {
  scenarioId: string;
  title: string;
  cause?: string;
  event?: string;
  consequence?: string;
  framework?: ControlFramework;
  likelihood?: LikelihoodLevel;
  impact?: ImpactLevel;
  residualLikelihood?: LikelihoodLevel;
  residualImpact?: ImpactLevel;
  sleLow?: number;
  sleLikely?: number;
  sleHigh?: number;
  aro?: number;
  ale?: number;
  controlIds?: string;
  riskId?: string;
}): Promise<RiskScenario> {
  return request<RiskScenario>('/api/risk-scenarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRiskScenario(id: string, data: {
  title?: string;
  cause?: string;
  event?: string;
  consequence?: string;
  framework?: ControlFramework;
  likelihood?: LikelihoodLevel;
  impact?: ImpactLevel;
  residualLikelihood?: LikelihoodLevel;
  residualImpact?: ImpactLevel;
  residualOverrideJustification?: string;
  sleLow?: number;
  sleLikely?: number;
  sleHigh?: number;
  aro?: number;
  ale?: number;
  controlIds?: string;
}): Promise<RiskScenario> {
  return request<RiskScenario>(`/api/risk-scenarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRiskScenario(id: string): Promise<void> {
  await request(`/api/risk-scenarios/${id}`, { method: 'DELETE' });
}

// ============================================
// BIRT Impact Assessment API
// ============================================

/**
 * Get effective thresholds for impact assessment
 * NOTE: The BIRT effective-thresholds endpoint is not yet implemented on the backend.
 * This stub returns empty data so the UI renders without errors.
 */
export async function getEffectiveThresholds(
  _organisationId: string
): Promise<{ weights: CategoryWeight[]; thresholds: EffectiveThreshold[] }> {
  return { weights: [], thresholds: [] };
}

/**
 * Save scenario impact assessments (BIRT methodology)
 * Backend endpoint: POST /api/risk-scenarios/:id/impact-assessments
 */
export async function saveScenarioImpactAssessments(
  scenarioId: string,
  assessments: Array<{
    category: ImpactCategory;
    level: ImpactLevel;
    value: number;
    rationale?: string;
  }>,
  isResidual: boolean = false,
  organisationId?: string
): Promise<{
  scenarioId: string;
  isResidual: boolean;
  assessments: ScenarioImpactAssessment[];
  weightedImpact: number;
}> {
  return request(`/api/risk-scenarios/${scenarioId}/impact-assessments`, {
    method: 'POST',
    body: JSON.stringify({ assessments, isResidual, organisationId }),
  });
}

// ============================================
// Control-Risk Integration API
// Automatic residual calculation from control effectiveness
// ============================================

export interface ControlEffectivenessSummary {
  hasControls: boolean;
  summary: string;
  strength: 'NONE' | 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
  details: Array<{
    controlId: string;
    name: string;
    score: number;
    rating: string;
    strength: string;
    likelihoodReduction: number;
    impactReduction: number;
  }>;
}

export interface ResidualCalculationResult {
  scenarioId: string;
  inherentScore: number;
  residualScore: number;
  residualLikelihood: LikelihoodLevel | null;
  residualImpact: ImpactLevel | null;
  riskReduction: number;
  controlEffectiveness: {
    controlCount: number;
    averageScore: number;
    overallStrength: string;
  };
}

export async function getControlEffectivenessForRisk(riskId: string): Promise<ControlEffectivenessSummary> {
  return request<ControlEffectivenessSummary>(`/api/risks/control-effectiveness/risk/${riskId}`);
}

export async function getControlEffectivenessForScenario(scenarioId: string): Promise<ControlEffectivenessSummary> {
  return request<ControlEffectivenessSummary>(`/api/risks/control-effectiveness/scenario/${scenarioId}`);
}

export async function calculateResidualFromControls(scenarioId: string): Promise<ResidualCalculationResult> {
  return request<ResidualCalculationResult>(`/api/risks/control-effectiveness/scenario/${scenarioId}/calculate-residual`, {
    method: 'POST',
  });
}

export async function recalculateAllScenarioResiduals(riskId: string): Promise<{
  riskId: string;
  updatedScenarios: number;
  newRiskScore: { inherent: number; residual: number };
}> {
  return request(`/api/risks/control-effectiveness/risk/${riskId}/recalculate-all`, {
    method: 'POST',
  });
}

// ============================================
// Control Linkage API (DEPRECATED)
// NOTE: Risk-level control linking has been removed.
// Use Scenario Control Linkage API below instead.
// ============================================

export interface LinkedControl {
  id: string;
  controlId: string;
  name: string;
  theme?: string;
  framework?: string;
  implementationStatus?: string;
}

/**
 * @deprecated Risk-level control linking has been removed.
 * Use getScenarioLinkedControls(scenarioId) instead.
 */
export async function getLinkedControls(_riskId: string): Promise<LinkedControl[]> {
  console.warn('[DEPRECATED] getLinkedControls: Risk-level control linking removed. Use getScenarioLinkedControls instead.');
  return [];
}

/**
 * @deprecated Risk-level control linking has been removed.
 * Use linkControlToScenario(scenarioId, controlId, data) instead.
 */
export async function linkControlToRisk(_riskId: string, _controlId: string): Promise<Risk> {
  console.warn('[DEPRECATED] linkControlToRisk: Risk-level control linking removed. Use linkControlToScenario instead.');
  throw new Error('Risk-level control linking has been removed. Use linkControlToScenario instead.');
}

/**
 * @deprecated Risk-level control linking has been removed.
 * Use unlinkControlFromScenario(scenarioId, controlId) instead.
 */
export async function unlinkControlFromRisk(_riskId: string, _controlId: string): Promise<Risk> {
  console.warn('[DEPRECATED] unlinkControlFromRisk: Risk-level control linking removed. Use unlinkControlFromScenario instead.');
  throw new Error('Risk-level control linking has been removed. Use unlinkControlFromScenario instead.');
}

// ============================================
// Scenario Control Linkage API
// ============================================

export interface ScenarioControlLink {
  id: string;
  scenarioId: string;
  controlId: string;
  effectivenessWeight: number;
  isPrimaryControl: boolean;
  notes?: string;
  createdAt: string;
  control: {
    id: string;
    controlId: string;
    name: string;
    theme?: string;
    framework?: string;
    implementationStatus?: string;
  };
}

export async function getScenarioLinkedControls(scenarioId: string): Promise<ScenarioControlLink[]> {
  return request<ScenarioControlLink[]>(`/api/risk-scenarios/${scenarioId}/controls`);
}

export async function linkControlToScenario(
  scenarioId: string,
  controlId: string,
  data?: { effectivenessWeight?: number; isPrimaryControl?: boolean; notes?: string }
): Promise<ScenarioControlLink> {
  return request<ScenarioControlLink>(`/api/risk-scenarios/${scenarioId}/controls`, {
    method: 'POST',
    body: JSON.stringify({ controlId, ...data }),
  });
}

export async function updateScenarioControlLink(
  scenarioId: string,
  controlId: string,
  data: { effectivenessWeight?: number; isPrimaryControl?: boolean; notes?: string }
): Promise<ScenarioControlLink> {
  return request<ScenarioControlLink>(`/api/risk-scenarios/${scenarioId}/controls/${controlId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function unlinkControlFromScenario(scenarioId: string, controlId: string): Promise<void> {
  await request<{ success: boolean }>(`/api/risk-scenarios/${scenarioId}/controls/${controlId}`, {
    method: 'DELETE',
  });
}

// ============================================
// KRI API
// ============================================

export async function getKRIs(params?: {
  skip?: number;
  take?: number;
  status?: RAGStatus;
  tier?: RiskTier;
}): Promise<PaginatedResponse<KeyRiskIndicator>> {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.tier) searchParams.set('tier', params.tier);

  const query = searchParams.toString();
  return request<PaginatedResponse<KeyRiskIndicator>>(`/api/kris${query ? `?${query}` : ''}`);
}

export async function getKRI(id: string): Promise<KeyRiskIndicator> {
  return request<KeyRiskIndicator>(`/api/kris/${id}`);
}

export async function getKRIsByRisk(riskId: string): Promise<KeyRiskIndicator[]> {
  return request<KeyRiskIndicator[]>(`/api/kris/risk/${riskId}`);
}

export async function getKRIDashboard(organisationId?: string): Promise<KRIDashboard> {
  const query = organisationId ? `?organisationId=${organisationId}` : '';
  return request<KRIDashboard>(`/api/kris/dashboard${query}`);
}

export async function createKRI(data: {
  kriId: string;
  name: string;
  description?: string;
  tier?: RiskTier;
  framework?: ControlFramework;
  frequency?: CollectionFrequency;
  unit?: string;
  formula?: string;
  dataSource?: string;
  automated?: boolean;
  thresholdGreen?: string;
  thresholdAmber?: string;
  thresholdRed?: string;
  soc2Criteria?: string;
  riskId?: string;
}): Promise<KeyRiskIndicator> {
  return request<KeyRiskIndicator>('/api/kris', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateKRI(id: string, data: Partial<KeyRiskIndicator>): Promise<KeyRiskIndicator> {
  return request<KeyRiskIndicator>(`/api/kris/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateKRIValue(
  id: string,
  value: string,
  userId?: string,
  notes?: string
): Promise<KeyRiskIndicator> {
  return request<KeyRiskIndicator>(`/api/kris/${id}/value`, {
    method: 'PUT',
    body: JSON.stringify({ value, notes }),
  });
}

// ============================================
// Risk Tolerance Statement Types
// ============================================

export type ToleranceLevel = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
export type RTSStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'SUPERSEDED' | 'RETIRED';

export interface RTSCondition {
  level: ToleranceLevel;
  description: string;
  proposedRts: string;
  conditions: string[];
  anticipatedImpact: string;
}

export interface RiskToleranceStatement {
  id: string;
  rtsId: string;
  title: string;
  objective: string;
  domain?: string;
  proposedToleranceLevel: ToleranceLevel;
  proposedRTS: string;
  conditions: RTSCondition[];
  anticipatedOperationalImpact?: string;
  rationale?: string;
  status: RTSStatus;
  approvedDate?: string;
  effectiveDate?: string;
  reviewDate?: string;
  framework: ControlFramework;
  controlIds?: string;
  appetiteLevel?: AppetiteLevel;
  category?: ImpactCategory;
  toleranceThreshold?: number;
  organisationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
  updatedBy?: UserBasic;
  approvedBy?: UserBasic;
  _count?: { risks: number; scenarios: number; kris: number };
  risks?: { id: string; riskId: string; title: string; tier: RiskTier; status: RiskStatus }[];
  scenarios?: { id: string; scenarioId: string; title: string }[];
  kris?: { id: string; kriId: string; name: string; status?: RAGStatus }[];
}

export interface RTSStats {
  total: number;
  byStatus: Record<RTSStatus, number>;
  byLevel: Record<ToleranceLevel, number>;
  byDomain: { domain: string; count: number }[];
}

// ============================================
// Treatment Plan Types
// ============================================

export type TreatmentType = 'MITIGATE' | 'TRANSFER' | 'ACCEPT' | 'AVOID' | 'SHARE';
export type TreatmentStatus = 'DRAFT' | 'PROPOSED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type TreatmentPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';

export interface TreatmentAction {
  id: string;
  actionId: string;
  title: string;
  description?: string;
  status: ActionStatus;
  priority: TreatmentPriority;
  dueDate?: string;
  completedDate?: string;
  assignedToId?: string;
  assignedTo?: UserBasic;
  estimatedHours?: number;
  actualHours?: number;
  completionNotes?: string;
  blockerNotes?: string;
  treatmentPlanId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
}

export interface TreatmentPlan {
  id: string;
  treatmentId: string;
  title: string;
  description: string;
  treatmentType: TreatmentType;
  priority: TreatmentPriority;
  status: TreatmentStatus;
  targetResidualScore?: number;
  currentResidualScore?: number;
  expectedReduction?: number;
  estimatedCost?: number;
  actualCost?: number;
  costBenefit?: string;
  roi?: number;
  proposedDate?: string;
  approvedDate?: string;
  targetStartDate?: string;
  targetEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  riskOwnerId?: string;
  riskOwner?: UserBasic;
  implementerId?: string;
  implementer?: UserBasic;
  approvedById?: string;
  approvedBy?: UserBasic;
  acceptanceRationale?: string;
  acceptanceCriteria?: string;
  acceptanceConditions?: any[];
  acceptanceExpiryDate?: string;
  progressPercentage: number;
  progressNotes?: string;
  controlIds?: string;
  riskId: string;
  risk?: { id: string; riskId: string; title: string; tier?: RiskTier; status?: RiskStatus; inherentScore?: number; residualScore?: number };
  organisationId: string;
  actions?: TreatmentAction[];
  _count?: { actions: number };
  createdAt: string;
  updatedAt: string;
  createdBy?: UserBasic;
  updatedBy?: UserBasic;
  // Fields auto-computed by backend when missing (for display purposes)
  _computed?: string[];
}

export interface TreatmentPlanMilestone {
  id: string;
  title: string;
  dueDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  treatmentPlanId: string;
  treatmentPlanTitle?: string;
}

export interface TreatmentPlanStats {
  total: number;
  overdueCount: number;
  completedThisMonth: number;
  byStatus: Record<TreatmentStatus, number>;
  byType: Record<TreatmentType, number>;
  byPriority: Record<TreatmentPriority, number>;
  upcomingMilestones?: TreatmentPlanMilestone[];
}

// ============================================
// Risk Tolerance Statement API
// ============================================

export async function getRTSList(params?: {
  skip?: number;
  take?: number;
  status?: RTSStatus;
  level?: ToleranceLevel;
  domain?: string;
  organisationId?: string;
}): Promise<PaginatedResponse<RiskToleranceStatement>> {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.level) searchParams.set('level', params.level);
  if (params?.domain) searchParams.set('domain', params.domain);
  if (params?.organisationId) searchParams.set('organisationId', params.organisationId);

  const query = searchParams.toString();
  return request<PaginatedResponse<RiskToleranceStatement>>(`/api/risks/rts${query ? `?${query}` : ''}`);
}

export async function getRTS(id: string): Promise<RiskToleranceStatement> {
  return request<RiskToleranceStatement>(`/api/risks/rts/${id}`);
}

export async function getRTSStats(organisationId?: string): Promise<RTSStats> {
  const query = organisationId ? `?organisationId=${organisationId}` : '';
  return request<RTSStats>(`/api/risks/rts/stats${query}`);
}

export async function createRTS(data: {
  rtsId: string;
  title: string;
  objective: string;
  domain?: string;
  proposedToleranceLevel?: ToleranceLevel;
  proposedRTS: string;
  conditions?: any;
  anticipatedOperationalImpact?: string;
  rationale?: string;
  status?: RTSStatus;
  framework?: ControlFramework;
  controlIds?: string;
  appetiteLevel?: AppetiteLevel;
  category?: ImpactCategory;
  toleranceThreshold?: number;
  effectiveDate?: string;
  reviewDate?: string;
  riskIds?: string[];
  scenarioIds?: string[];
  kriIds?: string[];
  organisationId?: string;
}): Promise<RiskToleranceStatement> {
  return request<RiskToleranceStatement>('/api/risks/rts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRTS(id: string, data: Partial<RiskToleranceStatement> & {
  riskIds?: string[];
  scenarioIds?: string[];
  kriIds?: string[];
}): Promise<RiskToleranceStatement> {
  return request<RiskToleranceStatement>(`/api/risks/rts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function approveRTS(id: string): Promise<RiskToleranceStatement> {
  return request<RiskToleranceStatement>(`/api/risks/rts/${id}/approve`, {
    method: 'PUT',
  });
}

export async function deleteRTS(id: string): Promise<void> {
  await request(`/api/risks/rts/${id}`, { method: 'DELETE' });
}

export async function getRTSByRisk(riskId: string): Promise<RiskToleranceStatement[]> {
  return request<RiskToleranceStatement[]>(`/api/risks/rts/by-risk/${riskId}`);
}

export async function linkRisksToRTS(rtsId: string, riskIds: string[]): Promise<RiskToleranceStatement> {
  return request<RiskToleranceStatement>(`/api/risks/rts/${rtsId}/link-risks`, {
    method: 'PUT',
    body: JSON.stringify({ riskIds }),
  });
}

export async function unlinkRisksFromRTS(rtsId: string, riskIds: string[]): Promise<RiskToleranceStatement> {
  return request<RiskToleranceStatement>(`/api/risks/rts/${rtsId}/unlink-risks`, {
    method: 'PUT',
    body: JSON.stringify({ riskIds }),
  });
}

// ============================================
// Treatment Plan API
// ============================================

export async function getTreatmentPlans(params?: {
  skip?: number;
  take?: number;
  status?: TreatmentStatus;
  type?: TreatmentType;
  priority?: TreatmentPriority;
  riskId?: string;
  organisationId?: string;
}): Promise<PaginatedResponse<TreatmentPlan>> {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.type) searchParams.set('type', params.type);
  if (params?.priority) searchParams.set('priority', params.priority);
  if (params?.riskId) searchParams.set('riskId', params.riskId);
  if (params?.organisationId) searchParams.set('organisationId', params.organisationId);

  const query = searchParams.toString();
  return request<PaginatedResponse<TreatmentPlan>>(`/api/risks/treatment-plans${query ? `?${query}` : ''}`);
}

export async function getTreatmentPlan(id: string): Promise<TreatmentPlan> {
  return request<TreatmentPlan>(`/api/risks/treatment-plans/${id}`);
}

export async function getTreatmentPlansByRisk(riskId: string): Promise<TreatmentPlan[]> {
  return request<TreatmentPlan[]>(`/api/risks/treatment-plans/by-risk/${riskId}`);
}

export async function getTreatmentPlanStats(organisationId?: string): Promise<TreatmentPlanStats> {
  const query = organisationId ? `?organisationId=${organisationId}` : '';
  return request<TreatmentPlanStats>(`/api/risks/treatment-plans/stats${query}`);
}

export async function createTreatmentPlan(data: {
  treatmentId: string;
  title: string;
  description: string;
  treatmentType?: TreatmentType;
  priority?: TreatmentPriority;
  status?: TreatmentStatus;
  targetResidualScore?: number;
  estimatedCost?: number;
  costBenefit?: string;
  targetStartDate?: string;
  targetEndDate?: string;
  riskOwnerId?: string;
  implementerId?: string;
  acceptanceRationale?: string;
  acceptanceCriteria?: string;
  acceptanceConditions?: any;
  acceptanceExpiryDate?: string;
  controlIds?: string;
  riskId: string;
  scenarioId?: string;
  organisationId?: string;
}): Promise<TreatmentPlan> {
  return request<TreatmentPlan>('/api/risks/treatment-plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTreatmentPlan(id: string, data: Partial<TreatmentPlan>): Promise<TreatmentPlan> {
  return request<TreatmentPlan>(`/api/risks/treatment-plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function approveTreatmentPlan(id: string): Promise<TreatmentPlan> {
  return request<TreatmentPlan>(`/api/risks/treatment-plans/${id}/approve`, {
    method: 'PUT',
  });
}

export async function updateTreatmentPlanProgress(
  id: string,
  progressPercentage: number,
  progressNotes?: string
): Promise<TreatmentPlan> {
  return request<TreatmentPlan>(`/api/risks/treatment-plans/${id}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ progressPercentage, progressNotes }),
  });
}

export async function deleteTreatmentPlan(id: string): Promise<void> {
  await request(`/api/risks/treatment-plans/${id}`, { method: 'DELETE' });
}

// Treatment Actions
export async function createTreatmentAction(treatmentPlanId: string, data: {
  actionId: string;
  title: string;
  description?: string;
  status?: ActionStatus;
  priority?: TreatmentPriority;
  dueDate?: string;
  assignedToId?: string;
  estimatedHours?: number;
}): Promise<TreatmentAction> {
  return request<TreatmentAction>(`/api/risks/treatment-plans/${treatmentPlanId}/actions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTreatmentAction(actionId: string, data: Partial<TreatmentAction>): Promise<TreatmentAction> {
  return request<TreatmentAction>(`/api/risks/treatment-plans/actions/${actionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTreatmentAction(actionId: string): Promise<void> {
  await request(`/api/risks/treatment-plans/actions/${actionId}`, { method: 'DELETE' });
}

// ============================================
// User API
// ============================================

/**
 * Get all users for dropdown selections
 */
export async function getUsers(): Promise<User[]> {
  const response = await request<{ results: User[]; count: number }>('/api/auth/users');
  return response.results;
}

// ============================================
// RISK SCORING API (Remote)
// ============================================

export interface CategoryAssessment {
  category: ImpactCategory;
  value: number; // 1-5
}

export interface CategoryWeight {
  category: ImpactCategory;
  weight: number; // Percentage (0-100)
}

/**
 * Calculate risk score remotely via API to ensure consistency with backend
 */
export async function calculateScoreRemote(
  likelihood: LikelihoodLevel,
  impact: ImpactLevel
): Promise<{ score: number }> {
  return request('/api/risks/scoring/calculate', {
    method: 'POST',
    body: JSON.stringify({ likelihood, impact }),
  });
}

/**
 * Calculate weighted impact remotely via API
 */
export async function calculateWeightedImpactRemote(
  assessments: CategoryAssessment[],
  weights?: CategoryWeight[]
): Promise<{ weightedImpact: number }> {
  return request('/api/risks/scoring/calculate-weighted-impact', {
    method: 'POST',
    body: JSON.stringify({ assessments, weights }),
  });
}

export type AppetiteLevel = 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH';

export const APPETITE_LEVEL_LABELS: Record<AppetiteLevel, string> = {
  MINIMAL: 'Minimal (Risk Averse)',
  LOW: 'Low (Cautious)',
  MODERATE: 'Moderate (Balanced)',
  HIGH: 'High (Open)',
};

// ============================================
// RESIDUAL LIKELIHOOD FACTOR SCORES API
// Control-adjusted F1-F3 factors for residual risk
// ============================================

export interface ResidualFactorScores {
  f1Residual: number | null;
  f2Residual: number | null;
  f3Residual: number | null;
}

export interface ControlFactorReduction {
  id: string; // Database ID for linking to control detail page
  controlId: string;
  controlName: string;
  effectiveness: number;
  affectedFactors: ('F1' | 'F2' | 'F3')[];
  reductionPerFactor: {
    f1: number;
    f2: number;
    f3: number;
  };
}

export interface ResidualFactorScoresResponse {
  scenarioId: string;
  inherentScores: {
    f1ThreatFrequency: number | null;
    f2ControlEffectiveness: number | null;
    f3GapVulnerability: number | null;
  };
  residualScores: ResidualFactorScores;
  calculatedResidualScores: ResidualFactorScores;
  controlReductions: {
    f1: number;
    f2: number;
    f3: number;
    totalReduction: number;
  };
  calculatedResidualLikelihood: number | null;
  overrides: {
    f1Override?: boolean;
    f1OverrideJustification?: string;
    f2Override?: boolean;
    f2OverrideJustification?: string;
    f3Override?: boolean;
    f3OverrideJustification?: string;
  };
  linkedControls: ControlFactorReduction[];
}

/**
 * Get residual likelihood factor scores for a scenario
 * Shows control-adjusted F1-F3 values with reduction breakdown
 */
export async function getResidualFactorScores(scenarioId: string): Promise<ResidualFactorScoresResponse> {
  return request<ResidualFactorScoresResponse>(`/api/risk-scenarios/${scenarioId}/residual-factor-scores`);
}

/**
 * Update residual likelihood factor scores for a scenario
 * Used when overriding calculated residual factors
 */
export async function updateResidualFactorScores(
  scenarioId: string,
  data: {
    scores?: Partial<ResidualFactorScores>;
    overrides?: {
      f1Override?: boolean;
      f1OverrideJustification?: string;
      f2Override?: boolean;
      f2OverrideJustification?: string;
      f3Override?: boolean;
      f3OverrideJustification?: string;
    };
  }
): Promise<ResidualFactorScoresResponse> {
  return request<ResidualFactorScoresResponse>(`/api/risk-scenarios/${scenarioId}/residual-factor-scores`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============================================
// Scenario State Machine Types & API
// ============================================

export type TransitionCode = string;

export interface StateTransition {
  id: string;
  scenarioId: string;
  fromStatus: ScenarioStatus;
  toStatus: ScenarioStatus;
  transitionCode: string;
  transitionName: string;
  triggeredBy: string;
  justification?: string;
  reviewOutcome?: string;
  escalationDecision?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy?: UserBasic;
}

export interface AvailableTransition {
  code: string;
  name: string;
  targetStatus: ScenarioStatus;
  requiresJustification: boolean;
  requiresTreatmentPlan: boolean;
  requiresEscalationDecision: boolean;
  requiresReviewOutcome: boolean;
}

/**
 * Get available transitions for a scenario based on its current status.
 * NOTE: The state machine transition endpoints are not yet implemented on the backend.
 * This stub returns empty data so the UI renders without errors.
 */
export async function getAvailableTransitions(
  _scenarioId: string
): Promise<{ availableTransitions: AvailableTransition[] }> {
  return { availableTransitions: [] };
}

/**
 * Execute a state transition on a scenario.
 * NOTE: The state machine transition endpoints are not yet implemented on the backend.
 * This stub throws an error to indicate the feature is not available.
 */
export async function executeTransition(
  _scenarioId: string,
  _transitionCode: TransitionCode,
  _data?: {
    justification?: string;
    treatmentPlanId?: string;
    escalationDecision?: string;
    reviewOutcome?: string;
  }
): Promise<void> {
  throw new Error('State machine transitions are not yet implemented on the backend.');
}

/**
 * Get transition history for a scenario.
 * NOTE: The state machine transition endpoints are not yet implemented on the backend.
 * This stub returns empty data so the UI renders without errors.
 */
export async function getTransitionHistory(
  _scenarioId: string,
  _params?: { limit?: number }
): Promise<{ history: StateTransition[]; total: number }> {
  return { history: [], total: 0 };
}

