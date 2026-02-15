/**
 * Likelihood Factors Calculation Utility
 *
 * INHERENT LIKELIHOOD MODEL (3-Factor)
 * =====================================
 * Only 3 factors contribute to INHERENT likelihood:
 * - F1: Threat Frequency - How often do attackers TRY to attack?
 * - F2: Vulnerability/Ease of Exploit - How easy is it to exploit technically?
 * - F3: Attack Surface - How many entry points exist?
 *
 * CONTROL EFFECTIVENESS is NOT included in inherent likelihood.
 * This prevents "double dipping" where controls affect both inherent and residual.
 *
 * Control effectiveness only applies when calculating RESIDUAL risk:
 * Residual = Inherent × (1 - Control Effectiveness%)
 *
 * SUPPLEMENTARY FACTORS (informational only, 0% weight):
 * - Incident history (from Incident records)
 * - KRI status (from KeyRiskIndicator RED/AMBER/GREEN)
 * - Nonconformities (open issues affecting controls)
 * - Control maturity (tracked but NOT used for inherent)
 */

import { LikelihoodLevel, RAGStatus } from '@prisma/client';
import { LIKELIHOOD_VALUES, valueToLikelihoodLevel } from './risk-scoring';

// ============================================
// FACTOR TYPES AND WEIGHTS
// ============================================

/**
 * Individual likelihood factor with its contribution
 */
export interface LikelihoodFactor {
  id: string;
  name: string;
  category: LikelihoodFactorCategory;
  value: number; // 1-5 contribution to likelihood
  weight: number; // 0-100 weight percentage
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'; // Data quality indicator
  source: string; // Where this data comes from
  details?: string; // Additional context
  dataPoints?: number; // Number of data points used
}

/**
 * Categories of likelihood factors
 *
 * INHERENT FACTORS (contribute to inherent likelihood):
 * - THREAT_FREQUENCY: How often do attackers try?
 * - VULNERABILITY_EXPOSURE: How easy is it to exploit?
 * - ATTACK_SURFACE: How many entry points exist?
 *
 * SUPPLEMENTARY FACTORS (tracked but 0% weight):
 * - CONTROL_MATURITY: Tracked for residual calculation only
 * - INCIDENT_HISTORY: Past incidents of similar type
 * - KRI_STATUS: Key risk indicator trends
 * - NONCONFORMITY: Open audit findings
 * - EXTERNAL_FACTORS: Regulatory, geopolitical, industry
 */
export type LikelihoodFactorCategory =
  | 'THREAT_FREQUENCY'       // F1: How often do attackers TRY to attack?
  | 'VULNERABILITY_EXPOSURE' // F2: How easy is it to exploit technically?
  | 'ATTACK_SURFACE'         // F3: How many entry points exist?
  | 'CONTROL_MATURITY'       // NOT used for inherent - affects residual only
  | 'INCIDENT_HISTORY'       // Supplementary - informational
  | 'KRI_STATUS'             // Supplementary - informational
  | 'NONCONFORMITY'          // Supplementary - informational
  | 'EXTERNAL_FACTORS';      // Supplementary - future expansion

/**
 * Factor category labels and descriptions
 *
 * Note: defaultWeight values reflect the 3-factor INHERENT model
 * Only F1, F2, F3 contribute to inherent likelihood
 */
export const FACTOR_CATEGORY_INFO: Record<LikelihoodFactorCategory, {
  label: string;
  description: string;
  defaultWeight: number;
  isInherentFactor: boolean; // Does this affect inherent likelihood?
}> = {
  // INHERENT FACTORS - contribute to inherent likelihood
  THREAT_FREQUENCY: {
    label: 'F1: Threat Frequency',
    description: 'How often do attackers TRY to attack anyone in our industry?',
    defaultWeight: 34,
    isInherentFactor: true,
  },
  VULNERABILITY_EXPOSURE: {
    label: 'F2: Vulnerability / Ease of Exploit',
    description: 'How easy is it to exploit this scenario technically?',
    defaultWeight: 33,
    isInherentFactor: true,
  },
  ATTACK_SURFACE: {
    label: 'F3: Attack Surface',
    description: 'How many entry points / opportunities exist for this attack?',
    defaultWeight: 33,
    isInherentFactor: true,
  },

  // SUPPLEMENTARY FACTORS - tracked but do NOT affect inherent
  CONTROL_MATURITY: {
    label: 'Control Maturity (Residual Only)',
    description: 'NOT used for inherent. Control effectiveness applies only to residual calculation.',
    defaultWeight: 0,
    isInherentFactor: false,
  },
  INCIDENT_HISTORY: {
    label: 'Incident History (Informational)',
    description: 'Past occurrences of similar events - tracked for context only',
    defaultWeight: 0,
    isInherentFactor: false,
  },
  KRI_STATUS: {
    label: 'KRI Status (Informational)',
    description: 'Current key risk indicator trends - tracked for context only',
    defaultWeight: 0,
    isInherentFactor: false,
  },
  NONCONFORMITY: {
    label: 'Open Nonconformities (Informational)',
    description: 'Unresolved audit findings - affects residual via control effectiveness',
    defaultWeight: 0,
    isInherentFactor: false,
  },
  EXTERNAL_FACTORS: {
    label: 'External Factors (Informational)',
    description: 'Regulatory changes, geopolitical events, industry trends',
    defaultWeight: 0,
    isInherentFactor: false,
  },
};

/**
 * Default weights for INHERENT likelihood factors
 * Only 3 factors contribute to inherent (sum to 100)
 * Control-related factors have 0% weight to prevent double-dipping
 */
export const DEFAULT_FACTOR_WEIGHTS: Record<LikelihoodFactorCategory, number> = {
  // INHERENT FACTORS (contribute to inherent likelihood)
  THREAT_FREQUENCY: 34,      // F1: How often do attackers try?
  VULNERABILITY_EXPOSURE: 33, // F2: How easy to exploit?
  ATTACK_SURFACE: 33,        // F3: How many entry points? (new)

  // SUPPLEMENTARY FACTORS (tracked but 0% weight for inherent)
  CONTROL_MATURITY: 0,       // Does NOT affect inherent - only residual
  INCIDENT_HISTORY: 0,       // Informational only
  KRI_STATUS: 0,             // Informational only
  NONCONFORMITY: 0,          // Informational only (affects residual via controls)
  EXTERNAL_FACTORS: 0,       // Not automated yet
};

/**
 * Legacy weights - for backward compatibility reporting
 */
export const LEGACY_FACTOR_WEIGHTS: Record<LikelihoodFactorCategory, number> = {
  THREAT_FREQUENCY: 20,
  VULNERABILITY_EXPOSURE: 20,
  ATTACK_SURFACE: 0,
  CONTROL_MATURITY: 20, // Was included in old model
  INCIDENT_HISTORY: 15,
  KRI_STATUS: 15,
  NONCONFORMITY: 10,
  EXTERNAL_FACTORS: 0,
};

// ============================================
// FACTOR CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate threat frequency factor from ThreatCatalog
 *
 * @param baseLikelihood - The threat's base likelihood from catalog (1-5)
 * @param threatName - Name of the threat
 * @returns LikelihoodFactor
 */
export function calculateThreatFrequencyFactor(
  baseLikelihood: number | null | undefined,
  threatName?: string
): LikelihoodFactor | null {
  if (!baseLikelihood || baseLikelihood < 1 || baseLikelihood > 5) {
    return null;
  }

  return {
    id: 'threat-frequency',
    name: 'Threat Base Likelihood',
    category: 'THREAT_FREQUENCY',
    value: baseLikelihood,
    weight: DEFAULT_FACTOR_WEIGHTS.THREAT_FREQUENCY,
    confidence: 'HIGH',
    source: 'ThreatCatalog',
    details: threatName ? `Based on ${threatName} threat profile` : 'Based on linked threat profile',
    dataPoints: 1,
  };
}

/**
 * Calculate vulnerability exposure factor from vulnerability entries
 *
 * @param vulnerabilities - Array of vulnerability entries with severity (1-5)
 * @returns LikelihoodFactor
 */
export function calculateVulnerabilityFactor(
  vulnerabilities: Array<{ severity: number; status: string; name?: string }>
): LikelihoodFactor | null {
  if (!vulnerabilities || vulnerabilities.length === 0) {
    return null;
  }

  // Only consider OPEN vulnerabilities
  const openVulns = vulnerabilities.filter(v => v.status === 'OPEN');
  if (openVulns.length === 0) {
    // All vulnerabilities mitigated - reduces likelihood
    return {
      id: 'vulnerability-exposure',
      name: 'Vulnerability Exposure',
      category: 'VULNERABILITY_EXPOSURE',
      value: 1, // Minimal exposure
      weight: DEFAULT_FACTOR_WEIGHTS.VULNERABILITY_EXPOSURE,
      confidence: 'HIGH',
      source: 'VulnerabilityEntry',
      details: `All ${vulnerabilities.length} vulnerabilities are mitigated`,
      dataPoints: vulnerabilities.length,
    };
  }

  // Use maximum severity of open vulnerabilities
  const maxSeverity = Math.max(...openVulns.map(v => v.severity));

  // Average severity for more nuanced view
  const avgSeverity = openVulns.reduce((sum, v) => sum + v.severity, 0) / openVulns.length;

  // Weight towards max but consider average (70% max, 30% avg)
  const exposureValue = Math.round(maxSeverity * 0.7 + avgSeverity * 0.3);

  return {
    id: 'vulnerability-exposure',
    name: 'Vulnerability Exposure',
    category: 'VULNERABILITY_EXPOSURE',
    value: Math.min(5, Math.max(1, exposureValue)),
    weight: DEFAULT_FACTOR_WEIGHTS.VULNERABILITY_EXPOSURE,
    confidence: openVulns.length >= 3 ? 'HIGH' : 'MEDIUM',
    source: 'VulnerabilityEntry',
    details: `${openVulns.length} open vulnerabilities (max severity: ${maxSeverity})`,
    dataPoints: openVulns.length,
  };
}

/**
 * Calculate control maturity factor from capability assessments
 * Higher maturity = lower likelihood contribution
 *
 * @param assessments - Array of capability maturity assessments (0-5)
 * @returns LikelihoodFactor
 */
export function calculateControlMaturityFactor(
  assessments: Array<{ currentMaturity: number | null; targetMaturity?: number | null }>
): LikelihoodFactor | null {
  if (!assessments || assessments.length === 0) {
    return null;
  }

  const validAssessments = assessments.filter(a => a.currentMaturity !== null && a.currentMaturity !== undefined);
  if (validAssessments.length === 0) {
    return null;
  }

  // Calculate average maturity (0-5)
  const avgMaturity = validAssessments.reduce((sum, a) => sum + (a.currentMaturity || 0), 0) / validAssessments.length;

  // Invert: High maturity (5) = Low likelihood contribution (1)
  // Low maturity (0) = High likelihood contribution (5)
  const likelihoodContribution = Math.round(5 - avgMaturity);

  // Maturity 0-1 = likelihood 5
  // Maturity 2 = likelihood 3
  // Maturity 3 = likelihood 2
  // Maturity 4-5 = likelihood 1

  return {
    id: 'control-maturity',
    name: 'Control Maturity',
    category: 'CONTROL_MATURITY',
    value: Math.min(5, Math.max(1, likelihoodContribution)),
    weight: DEFAULT_FACTOR_WEIGHTS.CONTROL_MATURITY,
    confidence: validAssessments.length >= 3 ? 'HIGH' : validAssessments.length >= 1 ? 'MEDIUM' : 'LOW',
    source: 'LayerTest',
    details: `Average maturity: ${avgMaturity.toFixed(1)}/5 across ${validAssessments.length} layers`,
    dataPoints: validAssessments.length,
  };
}

/**
 * Calculate incident history factor from past incidents
 * More frequent/recent incidents = higher likelihood
 *
 * @param incidents - Array of incidents with dates and severity
 * @param lookbackMonths - How far back to look (default 24 months)
 * @returns LikelihoodFactor
 */
export function calculateIncidentHistoryFactor(
  incidents: Array<{
    occurredAt?: Date | null;
    severity?: string | null;
    status?: string | null;
  }>,
  lookbackMonths: number = 24
): LikelihoodFactor | null {
  if (!incidents || incidents.length === 0) {
    // No incidents = low likelihood (but not zero, as absence of evidence isn't evidence of absence)
    return {
      id: 'incident-history',
      name: 'Incident History',
      category: 'INCIDENT_HISTORY',
      value: 1,
      weight: DEFAULT_FACTOR_WEIGHTS.INCIDENT_HISTORY,
      confidence: 'MEDIUM',
      source: 'Incident',
      details: 'No related incidents in the lookback period',
      dataPoints: 0,
    };
  }

  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - lookbackMonths, now.getDate());

  // Filter to incidents within lookback period
  const recentIncidents = incidents.filter(i => {
    if (!i.occurredAt) return false;
    return new Date(i.occurredAt) >= cutoffDate;
  });

  if (recentIncidents.length === 0) {
    return {
      id: 'incident-history',
      name: 'Incident History',
      category: 'INCIDENT_HISTORY',
      value: 1,
      weight: DEFAULT_FACTOR_WEIGHTS.INCIDENT_HISTORY,
      confidence: 'MEDIUM',
      source: 'Incident',
      details: `No incidents in last ${lookbackMonths} months (${incidents.length} older incidents)`,
      dataPoints: 0,
    };
  }

  // Calculate frequency-based likelihood
  // 1 incident in 24 months = likelihood 2
  // 2-3 incidents = likelihood 3
  // 4-6 incidents = likelihood 4
  // 7+ incidents = likelihood 5
  let frequencyValue: number;
  if (recentIncidents.length >= 7) {
    frequencyValue = 5;
  } else if (recentIncidents.length >= 4) {
    frequencyValue = 4;
  } else if (recentIncidents.length >= 2) {
    frequencyValue = 3;
  } else {
    frequencyValue = 2;
  }

  // Boost if any incidents are HIGH or CRITICAL severity
  const highSeverityCount = recentIncidents.filter(
    i => i.severity === 'HIGH' || i.severity === 'CRITICAL'
  ).length;

  if (highSeverityCount > 0 && frequencyValue < 5) {
    frequencyValue = Math.min(5, frequencyValue + 1);
  }

  return {
    id: 'incident-history',
    name: 'Incident History',
    category: 'INCIDENT_HISTORY',
    value: frequencyValue,
    weight: DEFAULT_FACTOR_WEIGHTS.INCIDENT_HISTORY,
    confidence: recentIncidents.length >= 3 ? 'HIGH' : 'MEDIUM',
    source: 'Incident',
    details: `${recentIncidents.length} incidents in last ${lookbackMonths} months${highSeverityCount > 0 ? ` (${highSeverityCount} high/critical)` : ''}`,
    dataPoints: recentIncidents.length,
  };
}

/**
 * Calculate KRI status factor from key risk indicators
 * RED KRIs indicate increased likelihood
 *
 * @param kris - Array of KRIs with current status
 * @returns LikelihoodFactor
 */
export function calculateKRIStatusFactor(
  kris: Array<{ status: RAGStatus | null; trend?: string | null; name?: string }>
): LikelihoodFactor | null {
  if (!kris || kris.length === 0) {
    return null;
  }

  const validKris = kris.filter(k => k.status !== null);
  if (validKris.length === 0) {
    return null;
  }

  // Count by status
  const redCount = validKris.filter(k => k.status === 'RED').length;
  const amberCount = validKris.filter(k => k.status === 'AMBER').length;
  const greenCount = validKris.filter(k => k.status === 'GREEN').length;

  // Calculate weighted score
  // RED = 5, AMBER = 3, GREEN = 1
  const totalScore = redCount * 5 + amberCount * 3 + greenCount * 1;
  const avgScore = totalScore / validKris.length;

  // Round to nearest integer (1-5)
  const likelihoodValue = Math.min(5, Math.max(1, Math.round(avgScore)));

  let details: string;
  if (redCount > 0) {
    details = `${redCount} RED, ${amberCount} AMBER, ${greenCount} GREEN KRIs`;
  } else if (amberCount > 0) {
    details = `${amberCount} AMBER, ${greenCount} GREEN KRIs`;
  } else {
    details = `All ${greenCount} KRIs are GREEN`;
  }

  return {
    id: 'kri-status',
    name: 'KRI Status',
    category: 'KRI_STATUS',
    value: likelihoodValue,
    weight: DEFAULT_FACTOR_WEIGHTS.KRI_STATUS,
    confidence: validKris.length >= 3 ? 'HIGH' : validKris.length >= 1 ? 'MEDIUM' : 'LOW',
    source: 'KeyRiskIndicator',
    details,
    dataPoints: validKris.length,
  };
}

/**
 * Calculate nonconformity factor from open audit findings
 * Open NCs, especially MAJOR ones, increase likelihood
 *
 * @param nonconformities - Array of nonconformities with status and severity
 * @returns LikelihoodFactor
 */
export function calculateNonconformityFactor(
  nonconformities: Array<{
    status: string;
    severity: string;
    isoClause?: string | null;
  }>
): LikelihoodFactor | null {
  if (!nonconformities || nonconformities.length === 0) {
    // No NCs = good control environment
    return {
      id: 'nonconformity',
      name: 'Nonconformities',
      category: 'NONCONFORMITY',
      value: 1,
      weight: DEFAULT_FACTOR_WEIGHTS.NONCONFORMITY,
      confidence: 'MEDIUM',
      source: 'Nonconformity',
      details: 'No related nonconformities',
      dataPoints: 0,
    };
  }

  // Filter to open NCs only
  const openNCs = nonconformities.filter(nc =>
    nc.status !== 'CLOSED' && nc.status !== 'VERIFIED'
  );

  if (openNCs.length === 0) {
    return {
      id: 'nonconformity',
      name: 'Nonconformities',
      category: 'NONCONFORMITY',
      value: 1,
      weight: DEFAULT_FACTOR_WEIGHTS.NONCONFORMITY,
      confidence: 'HIGH',
      source: 'Nonconformity',
      details: `All ${nonconformities.length} nonconformities are closed`,
      dataPoints: nonconformities.length,
    };
  }

  // Count by severity
  const majorCount = openNCs.filter(nc => nc.severity === 'MAJOR').length;
  const minorCount = openNCs.filter(nc => nc.severity === 'MINOR').length;

  // Calculate likelihood contribution
  // MAJOR NC = likelihood 5
  // 3+ MINOR NCs = likelihood 4
  // 1-2 MINOR NCs = likelihood 3
  let likelihoodValue: number;
  if (majorCount > 0) {
    likelihoodValue = 5;
  } else if (minorCount >= 3) {
    likelihoodValue = 4;
  } else if (minorCount >= 1) {
    likelihoodValue = 3;
  } else {
    likelihoodValue = 2; // Other open NCs (OFI, etc.)
  }

  return {
    id: 'nonconformity',
    name: 'Open Nonconformities',
    category: 'NONCONFORMITY',
    value: likelihoodValue,
    weight: DEFAULT_FACTOR_WEIGHTS.NONCONFORMITY,
    confidence: 'HIGH',
    source: 'Nonconformity',
    details: `${openNCs.length} open NCs (${majorCount} major, ${minorCount} minor)`,
    dataPoints: openNCs.length,
  };
}

// ============================================
// AGGREGATION AND CALCULATION
// ============================================

/**
 * Aggregated likelihood assessment result
 */
export interface LikelihoodAssessment {
  suggestedValue: number; // Weighted average (1-5)
  suggestedLevel: LikelihoodLevel | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  factors: LikelihoodFactor[];
  factorBreakdown: Record<LikelihoodFactorCategory, LikelihoodFactor | null>;
  totalWeight: number; // Sum of active factor weights
  missingFactors: LikelihoodFactorCategory[];
  dataQuality: {
    totalDataPoints: number;
    highConfidenceFactors: number;
    coverage: number; // Percentage of factors with data
  };
}

/**
 * Calculate overall likelihood from all factors
 * Uses weighted average of available factors
 *
 * @param factors - Array of likelihood factors
 * @param customWeights - Optional custom weights override
 * @returns LikelihoodAssessment with suggested level and breakdown
 */
export function calculateLikelihoodFromFactors(
  factors: (LikelihoodFactor | null)[],
  customWeights?: Partial<Record<LikelihoodFactorCategory, number>>
): LikelihoodAssessment {
  // Filter out null factors
  const validFactors = factors.filter((f): f is LikelihoodFactor => f !== null);

  // Apply custom weights if provided
  const effectiveFactors = validFactors.map(f => ({
    ...f,
    weight: customWeights?.[f.category] ?? f.weight,
  }));

  // Calculate total weight of available factors
  const totalWeight = effectiveFactors.reduce((sum, f) => sum + f.weight, 0);

  // Build factor breakdown
  const factorBreakdown: Record<LikelihoodFactorCategory, LikelihoodFactor | null> = {
    THREAT_FREQUENCY: null,
    VULNERABILITY_EXPOSURE: null,
    ATTACK_SURFACE: null,
    CONTROL_MATURITY: null,
    INCIDENT_HISTORY: null,
    KRI_STATUS: null,
    NONCONFORMITY: null,
    EXTERNAL_FACTORS: null,
  };

  for (const factor of effectiveFactors) {
    factorBreakdown[factor.category] = factor;
  }

  // Identify missing factors
  const allCategories: LikelihoodFactorCategory[] = [
    'THREAT_FREQUENCY',
    'VULNERABILITY_EXPOSURE',
    'CONTROL_MATURITY',
    'INCIDENT_HISTORY',
    'KRI_STATUS',
    'NONCONFORMITY',
  ];
  const missingFactors = allCategories.filter(cat =>
    factorBreakdown[cat] === null && DEFAULT_FACTOR_WEIGHTS[cat] > 0
  );

  // Calculate data quality metrics
  const totalDataPoints = effectiveFactors.reduce((sum, f) => sum + (f.dataPoints || 0), 0);
  const highConfidenceFactors = effectiveFactors.filter(f => f.confidence === 'HIGH').length;
  const coverage = allCategories.length > 0
    ? (allCategories.length - missingFactors.length) / allCategories.length * 100
    : 0;

  // Calculate weighted average
  if (totalWeight === 0 || effectiveFactors.length === 0) {
    return {
      suggestedValue: 0,
      suggestedLevel: null,
      confidence: 'LOW',
      factors: effectiveFactors,
      factorBreakdown,
      totalWeight: 0,
      missingFactors,
      dataQuality: {
        totalDataPoints,
        highConfidenceFactors,
        coverage,
      },
    };
  }

  // Weighted sum
  const weightedSum = effectiveFactors.reduce((sum, f) => sum + (f.value * f.weight), 0);
  const suggestedValue = Math.round(weightedSum / totalWeight);

  // Determine overall confidence
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  if (coverage >= 80 && highConfidenceFactors >= 3) {
    confidence = 'HIGH';
  } else if (coverage >= 50 || highConfidenceFactors >= 2) {
    confidence = 'MEDIUM';
  } else {
    confidence = 'LOW';
  }

  // Convert to likelihood level
  const suggestedLevel = valueToLikelihoodLevel(suggestedValue);

  return {
    suggestedValue: Math.min(5, Math.max(1, suggestedValue)),
    suggestedLevel,
    confidence,
    factors: effectiveFactors,
    factorBreakdown,
    totalWeight,
    missingFactors,
    dataQuality: {
      totalDataPoints,
      highConfidenceFactors,
      coverage: Math.round(coverage),
    },
  };
}

/**
 * Compare manual likelihood with calculated likelihood
 * Returns analysis of the difference
 */
export function compareLikelihoodAssessment(
  manualLikelihood: LikelihoodLevel | null | undefined,
  calculatedAssessment: LikelihoodAssessment
): {
  difference: number; // Positive = manual is higher, negative = calculated is higher
  differenceLabel: string;
  isConsistent: boolean;
  recommendation: string;
} {
  if (!manualLikelihood || !calculatedAssessment.suggestedLevel) {
    return {
      difference: 0,
      differenceLabel: 'Unable to compare',
      isConsistent: true,
      recommendation: 'Insufficient data for comparison',
    };
  }

  const manualValue = LIKELIHOOD_VALUES[manualLikelihood];
  const calculatedValue = calculatedAssessment.suggestedValue;
  const difference = manualValue - calculatedValue;

  let differenceLabel: string;
  let recommendation: string;

  if (Math.abs(difference) <= 1) {
    differenceLabel = 'Consistent';
    recommendation = 'Manual assessment aligns with evidence-based factors';
  } else if (difference > 0) {
    differenceLabel = `Manual is ${difference} level(s) higher`;
    recommendation = calculatedAssessment.confidence === 'HIGH'
      ? 'Consider reviewing - evidence suggests lower likelihood may be appropriate'
      : 'Manual assessment is more conservative; review supporting evidence';
  } else {
    differenceLabel = `Manual is ${Math.abs(difference)} level(s) lower`;
    recommendation = calculatedAssessment.confidence === 'HIGH'
      ? 'Consider reviewing - evidence suggests higher likelihood may be warranted'
      : 'Manual assessment is less conservative; review supporting evidence';
  }

  return {
    difference,
    differenceLabel,
    isConsistent: Math.abs(difference) <= 1,
    recommendation,
  };
}

// ============================================
// INPUT INTERFACES FOR SERVICE LAYER
// ============================================

/**
 * Input data for likelihood factor calculation
 * This interface defines what data the service layer should provide
 */
export interface LikelihoodFactorInput {
  // From ThreatCatalog linked to the risk
  threat?: {
    baseLikelihood: number;
    name?: string;
  } | null;

  // From VulnerabilityEntry linked to assets/applications
  vulnerabilities?: Array<{
    severity: number;
    status: string;
    name?: string;
  }>;

  // From CapabilityAssessment for linked controls
  controlMaturity?: Array<{
    currentMaturity: number | null;
    targetMaturity?: number | null;
  }>;

  // From Incident records linked to risk or similar
  incidents?: Array<{
    occurredAt?: Date | null;
    severity?: string | null;
    status?: string | null;
  }>;

  // From KeyRiskIndicator linked to risk
  kris?: Array<{
    status: RAGStatus | null;
    trend?: string | null;
    name?: string;
  }>;

  // From Nonconformity linked to controls
  nonconformities?: Array<{
    status: string;
    severity: string;
    isoClause?: string | null;
  }>;

  // Custom weights override
  customWeights?: Partial<Record<LikelihoodFactorCategory, number>>;
}

/**
 * Calculate likelihood assessment from all available input data
 *
 * @param input - All available factor data
 * @returns Complete likelihood assessment
 */
export function calculateLikelihoodAssessment(
  input: LikelihoodFactorInput
): LikelihoodAssessment {
  const factors: (LikelihoodFactor | null)[] = [];

  // Calculate each factor
  if (input.threat) {
    factors.push(calculateThreatFrequencyFactor(
      input.threat.baseLikelihood,
      input.threat.name
    ));
  }

  if (input.vulnerabilities && input.vulnerabilities.length > 0) {
    factors.push(calculateVulnerabilityFactor(input.vulnerabilities));
  }

  if (input.controlMaturity && input.controlMaturity.length > 0) {
    factors.push(calculateControlMaturityFactor(input.controlMaturity));
  }

  // Always include incident history factor (even if no incidents)
  factors.push(calculateIncidentHistoryFactor(input.incidents || []));

  if (input.kris && input.kris.length > 0) {
    factors.push(calculateKRIStatusFactor(input.kris));
  }

  // Always include nonconformity factor
  factors.push(calculateNonconformityFactor(input.nonconformities || []));

  // Calculate overall assessment
  return calculateLikelihoodFromFactors(factors, input.customWeights);
}
