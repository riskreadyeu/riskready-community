/**
 * Risk Scoring Utility
 * 
 * Provides functions and constants for calculating risk scores
 * using the standard 5x5 Likelihood × Impact matrix.
 * 
 * Aligned with:
 * - POL-002: Information Risk Management Policy (Section 5.3.2)
 * - STD-002-01: Risk Assessment Methodology Standard (Section 6.2)
 * - STD-002-02: Risk Treatment Standard (Section 10.3)
 * - PRO-002-01: Risk Assessment Procedure
 * - PRO-002-03: Risk Acceptance Procedure
 * 
 * Score Range: 1-25 (Per POL-002 Section 5.3.2)
 * - 1-7:   Low (Green) - Acceptable with monitoring, optional treatment
 * - 8-14:  Medium (Yellow) - Generally unacceptable, treatment within 90 days
 * - 15-19: High (Orange) - Unacceptable, treatment within 30 days, CISO approval
 * - 20-25: Critical (Red) - Immediate treatment, escalate to executive
 * 
 * Also provides:
 * - BIRT (Business Impact Reference Table) weighted impact calculation
 * - Control effectiveness reduction calculations
 * - Risk acceptance period validation
 */

import { LikelihoodLevel, ImpactLevel, ImpactCategory } from '@prisma/client';
import { RISKS_CONFIG } from '../../config';

// ============================================
// RISK LEVEL DEFINITIONS (Per POL-002 Section 5.3.2)
// ============================================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE';

// Derive thresholds from config
const { thresholds } = RISKS_CONFIG.scoring;

/**
 * Risk level thresholds aligned with POL-002 Section 5.3.2
 * STD-002-01 Section 6.2, and STD-002-02 Section 10.3
 *
 * Values are derived from RISKS_CONFIG.scoring.thresholds
 */
export const RISK_LEVEL_THRESHOLDS = {
  LOW: { min: 1, max: thresholds.LOW, color: 'green', label: 'Low', tolerance: 'Acceptable with monitoring' },
  MEDIUM: { min: thresholds.LOW + 1, max: thresholds.MEDIUM, color: 'yellow', label: 'Medium', tolerance: 'Generally unacceptable' },
  HIGH: { min: thresholds.MEDIUM + 1, max: thresholds.HIGH, color: 'orange', label: 'High', tolerance: 'Unacceptable' },
  CRITICAL: { min: thresholds.HIGH + 1, max: thresholds.CRITICAL, color: 'red', label: 'Critical', tolerance: 'Unacceptable' },
} as const;


// Likelihood value mapping (1-5)
export const LIKELIHOOD_VALUES: Record<LikelihoodLevel, number> = {
  RARE: 1,
  UNLIKELY: 2,
  POSSIBLE: 3,
  LIKELY: 4,
  ALMOST_CERTAIN: 5,
};

// Impact value mapping (1-5)
export const IMPACT_VALUES: Record<ImpactLevel, number> = {
  NEGLIGIBLE: 1,
  MINOR: 2,
  MODERATE: 3,
  MAJOR: 4,
  SEVERE: 5,
};

// Reverse mappings for display
export const LIKELIHOOD_LABELS: Record<LikelihoodLevel, string> = {
  RARE: 'Rare',
  UNLIKELY: 'Unlikely',
  POSSIBLE: 'Possible',
  LIKELY: 'Likely',
  ALMOST_CERTAIN: 'Almost Certain',
};

export const IMPACT_LABELS: Record<ImpactLevel, string> = {
  NEGLIGIBLE: 'Negligible',
  MINOR: 'Minor',
  MODERATE: 'Moderate',
  MAJOR: 'Major',
  SEVERE: 'Severe',
};

/**
 * Calculate risk score from likelihood and impact
 * @param likelihood - Likelihood level (enum or string)
 * @param impact - Impact level (enum or string)
 * @returns Score from 1-25, or 0 if either value is missing/invalid
 */
export function calculateScore(
  likelihood: LikelihoodLevel | string | null | undefined,
  impact: ImpactLevel | string | null | undefined
): number {
  if (!likelihood || !impact) return 0;
  
  const likelihoodValue = LIKELIHOOD_VALUES[likelihood as LikelihoodLevel] || 0;
  const impactValue = IMPACT_VALUES[impact as ImpactLevel] || 0;
  
  return likelihoodValue * impactValue;
}

/**
 * Get risk level category based on score
 * Aligned with POL-002 Section 5.3.2
 * 
 * Thresholds:
 * - LOW: 1-7 (Acceptable with monitoring)
 * - MEDIUM: 8-14 (Generally unacceptable, 90 day treatment)
 * - HIGH: 15-19 (Unacceptable, 30 day treatment)
 * - CRITICAL: 20-25 (Immediate treatment required)
 * 
 * @param score - Risk score (1-25)
 * @returns Risk level category
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score <= 0) return 'NONE';
  if (score <= thresholds.LOW) return 'LOW';
  if (score <= thresholds.MEDIUM) return 'MEDIUM';
  if (score <= thresholds.HIGH) return 'HIGH';
  return 'CRITICAL';
}

/**
 * @deprecated Use getRiskLevel instead - kept for backward compatibility
 */
export function getRiskLevelSimple(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE' {
  return getRiskLevel(score);
}

/**
 * Get risk level details including color and thresholds
 * @param score - Risk score (1-25)
 * @returns Detailed risk level information
 */
export function getRiskLevelDetails(score: number): {
  level: RiskLevel;
  score: number;
  threshold: typeof RISK_LEVEL_THRESHOLDS[keyof typeof RISK_LEVEL_THRESHOLDS] | null;
} {
  const level = getRiskLevel(score);

  if (level === 'NONE') {
    return { level, score, threshold: null };
  }

  return {
    level,
    score,
    threshold: RISK_LEVEL_THRESHOLDS[level],
  };
}

/**
 * Check if a risk score exceeds risk appetite
 * Per POL-002, risks at MEDIUM and above generally require treatment
 * @param score - Risk score (1-25)
 * @returns Whether the risk exceeds appetite
 */
export function exceedsRiskAppetite(score: number): boolean {
  const level = getRiskLevel(score);
  return level === 'MEDIUM' || level === 'HIGH' || level === 'CRITICAL';
}

/**
 * Check if a risk score is acceptable (within tolerance)
 *
 * When a tolerance threshold is provided (e.g., from RTS), the score is compared
 * against that specific threshold. Otherwise, falls back to the policy-based check
 * where only LOW risks (1-7) are acceptable per POL-002 Section 5.3.2.
 *
 * @param score - Risk score (1-25)
 * @param toleranceThreshold - Optional tolerance threshold from RTS (default: uses policy-based level check)
 * @returns Whether the risk is within tolerance
 */
export function isWithinTolerance(score: number, toleranceThreshold?: number | null): boolean {
  // If a specific tolerance threshold is provided, use it
  if (toleranceThreshold !== undefined && toleranceThreshold !== null) {
    return score <= toleranceThreshold;
  }

  // Fall back to policy-based check (LOW/NONE only)
  const level = getRiskLevel(score);
  return level === 'LOW' || level === 'NONE';
}

/**
 * Scenario score interface for aggregation
 */
interface ScenarioScore {
  inherentScore?: number | null;
  residualScore?: number | null;
}

/**
 * Aggregate scenario scores to parent risk level
 * Uses MAX aggregation - the highest scenario score becomes the risk score
 * 
 * @param scenarios - Array of scenarios with scores
 * @returns Aggregated inherent and residual scores
 */
export function aggregateScores(scenarios: ScenarioScore[]): {
  inherentScore: number;
  residualScore: number;
} {
  if (!scenarios || scenarios.length === 0) {
    return { inherentScore: 0, residualScore: 0 };
  }

  const inherentScores = scenarios
    .map(s => s.inherentScore || 0)
    .filter(s => s > 0);
  
  const residualScores = scenarios
    .map(s => s.residualScore || 0)
    .filter(s => s > 0);

  return {
    inherentScore: inherentScores.length > 0 ? Math.max(...inherentScores) : 0,
    residualScore: residualScores.length > 0 ? Math.max(...residualScores) : 0,
  };
}

/**
 * Calculate risk reduction percentage
 * @param inherentScore - Score before controls
 * @param residualScore - Score after controls
 * @returns Reduction percentage (0-100)
 */
export function calculateRiskReduction(
  inherentScore: number | null | undefined,
  residualScore: number | null | undefined
): number {
  if (!inherentScore || inherentScore === 0) return 0;
  if (!residualScore) return 100; // Fully mitigated
  
  const reduction = ((inherentScore - residualScore) / inherentScore) * 100;
  return Math.max(0, Math.round(reduction));
}

/**
 * Calculate target residual score based on expected reduction percentage
 * Used for treatment planning to estimate post-treatment risk score
 * @param currentScore - Current risk score (1-25)
 * @param reductionPercentage - Expected reduction percentage (0-100)
 * @returns Target residual score after treatment
 */
export function calculateTargetResidualScore(
  currentScore: number,
  reductionPercentage: number
): number {
  if (!currentScore || currentScore <= 0) return 0;
  if (reductionPercentage >= 100) return 0; // Fully mitigated
  if (reductionPercentage <= 0) return currentScore; // No reduction
  
  const reductionFactor = (100 - reductionPercentage) / 100;
  const targetScore = currentScore * reductionFactor;
  
  // Round to nearest integer and ensure within valid range
  return Math.max(1, Math.min(25, Math.round(targetScore)));
}

/**
 * Calculate expected reduction percentage from current and target scores
 * Inverse of calculateTargetResidualScore
 * @param currentScore - Current risk score (1-25)
 * @param targetScore - Target risk score (1-25)
 * @returns Expected reduction percentage (0-100)
 */
export function calculateExpectedReduction(
  currentScore: number,
  targetScore: number
): number {
  if (!currentScore || currentScore <= 0) return 0;
  if (!targetScore || targetScore <= 0) return 100; // Full mitigation
  if (targetScore >= currentScore) return 0; // No reduction
  
  const reduction = ((currentScore - targetScore) / currentScore) * 100;
  return Math.max(0, Math.min(100, Math.round(reduction)));
}

/**
 * Get all likelihood levels in order
 */
export function getLikelihoodLevels(): LikelihoodLevel[] {
  return ['RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'ALMOST_CERTAIN'];
}

/**
 * Get all impact levels in order
 */
export function getImpactLevels(): ImpactLevel[] {
  return ['NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'SEVERE'];
}

// ============================================
// BIRT (Business Impact Reference Table)
// Weighted Impact Calculation
// ============================================

/**
 * Impact category assessment
 */
export interface CategoryAssessment {
  category: ImpactCategory;
  value: number; // 1-5
}

/**
 * Category weight configuration
 */
export interface CategoryWeight {
  category: ImpactCategory;
  weight: number; // Percentage (0-100)
}

/**
 * Default category weights (equal distribution)
 */
export const DEFAULT_CATEGORY_WEIGHTS: CategoryWeight[] = [
  { category: 'FINANCIAL', weight: 20 },
  { category: 'OPERATIONAL', weight: 20 },
  { category: 'LEGAL_REGULATORY', weight: 20 },
  { category: 'REPUTATIONAL', weight: 20 },
  { category: 'STRATEGIC', weight: 20 },
];

/**
 * Impact category labels
 */
export const IMPACT_CATEGORY_LABELS: Record<ImpactCategory, string> = {
  FINANCIAL: 'Financial',
  OPERATIONAL: 'Operational',
  LEGAL_REGULATORY: 'Legal/Regulatory',
  REPUTATIONAL: 'Reputational',
  STRATEGIC: 'Strategic',
};

/**
 * Get all impact categories in order
 */
export function getImpactCategories(): ImpactCategory[] {
  return ['FINANCIAL', 'OPERATIONAL', 'LEGAL_REGULATORY', 'REPUTATIONAL', 'STRATEGIC'];
}

/**
 * Calculate weighted impact from category assessments
 *
 * IMPORTANT: All 5 BIRT categories must be assessed for accurate calculation.
 * Unassessed categories are treated as 0 (not contributing to score), and
 * the calculation always divides by 100% to prevent inflation from partial assessments.
 *
 * @param assessments - Array of category assessments with values (1-5)
 * @param weights - Array of category weights (percentages, should sum to 100)
 * @returns Weighted average impact (1-5), or 0 if no assessments
 *
 * @example
 * // Financial=4, Operational=3, Legal=3, Reputational=2, Strategic=3
 * // With equal weights (20% each):
 * // (4*20 + 3*20 + 3*20 + 2*20 + 3*20) / 100 = 3.0 -> MODERATE impact
 */
export function calculateWeightedImpact(
  assessments: CategoryAssessment[],
  weights?: CategoryWeight[]
): number {
  if (!assessments || assessments.length === 0) {
    return 0;
  }

  const effectiveWeights = weights || DEFAULT_CATEGORY_WEIGHTS;

  // Build a map of assessed categories for quick lookup
  const assessmentMap = new Map<ImpactCategory, number>();
  for (const assessment of assessments) {
    assessmentMap.set(assessment.category, assessment.value);
  }

  // Calculate weighted sum for ALL categories (unassessed = 0)
  let weightedSum = 0;
  for (const categoryWeight of effectiveWeights) {
    const assessedValue = assessmentMap.get(categoryWeight.category) || 0;
    weightedSum += assessedValue * categoryWeight.weight;
  }

  // Always divide by 100 (total weight) to prevent partial assessment inflation
  // This ensures that if only 2 of 5 categories are assessed, the score reflects
  // that the unassessed categories contribute 0 to the weighted average
  const result = Math.round(weightedSum / 100);

  // Clamp result to valid range (1-5), returning 0 only if no valid assessments
  if (result <= 0 && assessments.length > 0) {
    return 1; // Minimum impact if any assessment exists
  }

  return Math.min(5, Math.max(0, result));
}

/**
 * Validate that all 5 BIRT categories are assessed
 *
 * @param assessments - Array of category assessments
 * @returns Validation result with missing categories if incomplete
 */
export function validateBirtAssessments(
  assessments: CategoryAssessment[]
): { complete: boolean; missingCategories: ImpactCategory[]; message?: string } {
  const requiredCategories = getImpactCategories();
  const assessedCategories = new Set(assessments.map((a) => a.category));

  const missingCategories = requiredCategories.filter(
    (cat) => !assessedCategories.has(cat)
  );

  if (missingCategories.length > 0) {
    const missingLabels = missingCategories.map(
      (cat) => IMPACT_CATEGORY_LABELS[cat]
    );
    return {
      complete: false,
      missingCategories,
      message: `Missing BIRT categories: ${missingLabels.join(', ')}. All 5 categories must be assessed.`,
    };
  }

  return { complete: true, missingCategories: [] };
}

/**
 * Get effective weight for a category
 * Uses org weight if available, otherwise system default
 *
 * @param orgWeights - Organization-specific weights (may be partial)
 * @param systemWeights - System default weights
 * @param category - The category to get weight for
 * @returns The effective weight (percentage)
 */
export function getEffectiveWeight(
  orgWeights: Partial<Record<ImpactCategory, number | null>> | undefined,
  systemWeights: CategoryWeight[],
  category: ImpactCategory
): number {
  // Check org weight first
  if (orgWeights && orgWeights[category] !== null && orgWeights[category] !== undefined) {
    return orgWeights[category]!;
  }

  // Fall back to system weight
  const systemWeight = systemWeights.find((w) => w.category === category);
  if (systemWeight) {
    return systemWeight.weight;
  }

  // Default to 25 if nothing found
  return 25;
}

/**
 * Convert weighted impact value (1-5) to ImpactLevel enum
 * 
 * @param weightedValue - Weighted impact value (1-5)
 * @returns ImpactLevel enum value
 */
export function weightedImpactToLevel(weightedValue: number): ImpactLevel | null {
  if (weightedValue <= 0) return null;
  if (weightedValue <= 1) return 'NEGLIGIBLE';
  if (weightedValue <= 2) return 'MINOR';
  if (weightedValue <= 3) return 'MODERATE';
  if (weightedValue <= 4) return 'MAJOR';
  return 'SEVERE';
}

/**
 * Calculate risk score using weighted impact
 * 
 * @param likelihood - Likelihood level
 * @param assessments - Category impact assessments
 * @param weights - Category weights (optional, uses defaults if not provided)
 * @returns Risk score (1-25)
 */
export function calculateScoreWithWeightedImpact(
  likelihood: LikelihoodLevel | string | null | undefined,
  assessments: CategoryAssessment[],
  weights?: CategoryWeight[]
): number {
  if (!likelihood || !assessments || assessments.length === 0) {
    return 0;
  }

  const likelihoodValue = LIKELIHOOD_VALUES[likelihood as LikelihoodLevel] || 0;
  const weightedImpact = calculateWeightedImpact(assessments, weights);

  return likelihoodValue * weightedImpact;
}

/**
 * Validate that weights sum to 100%
 * 
 * @param weights - Array of category weights
 * @returns Validation result with total
 */
export function validateWeights(
  weights: CategoryWeight[]
): { valid: boolean; total: number; message?: string } {
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  
  if (total !== 100) {
    return {
      valid: false,
      total,
      message: `Weights must sum to 100%. Current sum: ${total}%`,
    };
  }

  return { valid: true, total };
}

// ============================================
// CONTROL EFFECTIVENESS (Per PRO-002-01 Section 5.4)
// ============================================

/**
 * Control effectiveness/strength ratings
 * Per PRO-002-01 Section 5.4 and STD-002-01
 */
export type ControlStrength = 'NONE' | 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';

/**
 * Control effectiveness definitions with reduction values
 * Per PRO-002-01 Section 6.4
 */
export const CONTROL_EFFECTIVENESS = {
  NONE: {
    label: 'None',
    description: 'No control exists; no mitigating measures in place',
    likelihoodReduction: 0,
    impactReduction: 0,
    percentage: 0,
  },
  WEAK: {
    label: 'Weak',
    description: 'Control exists but is largely ineffective; provides minimal risk reduction',
    likelihoodReduction: 1, // Reduces likelihood by 1 level
    impactReduction: 0,
    percentage: 20,
  },
  MODERATE: {
    label: 'Moderate',
    description: 'Control provides partial mitigation; inconsistent application or monitoring',
    likelihoodReduction: 1,
    impactReduction: 1,
    percentage: 50,
  },
  STRONG: {
    label: 'Strong',
    description: 'Control is effective and reliable; well-designed, consistently implemented',
    likelihoodReduction: 2,
    impactReduction: 1,
    percentage: 75,
  },
  VERY_STRONG: {
    label: 'Very Strong',
    description: 'Control is highly effective and optimized; provides maximum risk reduction',
    likelihoodReduction: 3,
    impactReduction: 2,
    percentage: 90,
  },
} as const;

/**
 * Calculate residual likelihood after applying control effectiveness
 * Per PRO-002-01 Section 6.4
 * 
 * @param inherentLikelihood - Likelihood level before controls
 * @param controlStrength - Effectiveness of preventive controls
 * @returns Reduced likelihood value (1-5)
 */
export function calculateResidualLikelihood(
  inherentLikelihood: LikelihoodLevel | string | null | undefined,
  controlStrength: ControlStrength
): number {
  if (!inherentLikelihood) return 0;
  
  const inherentValue = LIKELIHOOD_VALUES[inherentLikelihood as LikelihoodLevel] || 0;
  if (inherentValue === 0) return 0;

  const reduction = CONTROL_EFFECTIVENESS[controlStrength]?.likelihoodReduction || 0;
  const residual = Math.max(1, inherentValue - reduction);
  
  return residual;
}

/**
 * Calculate residual impact after applying control effectiveness
 * Per PRO-002-01 Section 6.4
 * 
 * @param inherentImpact - Impact level before controls
 * @param controlStrength - Effectiveness of detective/corrective controls
 * @returns Reduced impact value (1-5)
 */
export function calculateResidualImpact(
  inherentImpact: ImpactLevel | string | null | undefined,
  controlStrength: ControlStrength
): number {
  if (!inherentImpact) return 0;
  
  const inherentValue = IMPACT_VALUES[inherentImpact as ImpactLevel] || 0;
  if (inherentValue === 0) return 0;

  const reduction = CONTROL_EFFECTIVENESS[controlStrength]?.impactReduction || 0;
  const residual = Math.max(1, inherentValue - reduction);
  
  return residual;
}

/**
 * Calculate residual risk score after applying controls
 * 
 * @param inherentLikelihood - Likelihood before controls
 * @param inherentImpact - Impact before controls
 * @param preventiveControlStrength - Effectiveness of preventive controls (reduces likelihood)
 * @param detectiveControlStrength - Effectiveness of detective/corrective controls (reduces impact)
 * @returns Calculated residual score
 */
export function calculateResidualScore(
  inherentLikelihood: LikelihoodLevel | string | null | undefined,
  inherentImpact: ImpactLevel | string | null | undefined,
  preventiveControlStrength: ControlStrength = 'NONE',
  detectiveControlStrength: ControlStrength = 'NONE'
): number {
  const residualLikelihood = calculateResidualLikelihood(inherentLikelihood, preventiveControlStrength);
  const residualImpact = calculateResidualImpact(inherentImpact, detectiveControlStrength);
  
  return residualLikelihood * residualImpact;
}

/**
 * Convert numeric value back to likelihood level
 * @param value - Numeric value (1-5)
 * @returns LikelihoodLevel enum value
 */
export function valueToLikelihoodLevel(value: number): LikelihoodLevel | null {
  if (value <= 0) return null;
  if (value <= 1) return 'RARE';
  if (value <= 2) return 'UNLIKELY';
  if (value <= 3) return 'POSSIBLE';
  if (value <= 4) return 'LIKELY';
  return 'ALMOST_CERTAIN';
}

/**
 * Convert numeric value back to impact level
 * @param value - Numeric value (1-5)
 * @returns ImpactLevel enum value
 */
export function valueToImpactLevel(value: number): ImpactLevel | null {
  if (value <= 0) return null;
  if (value <= 1) return 'NEGLIGIBLE';
  if (value <= 2) return 'MINOR';
  if (value <= 3) return 'MODERATE';
  if (value <= 4) return 'MAJOR';
  return 'SEVERE';
}

// ============================================
// CONTROL EFFECTIVENESS TO STRENGTH MAPPING
// Maps control module effectiveness ratings to ControlStrength
// ============================================

/**
 * Control effectiveness rating from Control Module
 * Based on calculateControlEffectiveness() in control.service.ts
 */
export type ControlEffectivenessRating = 
  | 'Effective'           // >= 90% pass rate
  | 'Partially Effective' // >= 70% pass rate
  | 'Not Effective'       // < 70% pass rate
  | 'Not Assessed';       // No tests performed

/**
 * Map control effectiveness score (0-100) to ControlStrength
 * 
 * Mapping:
 * - 90-100%: VERY_STRONG (highly effective, 3 likelihood reduction, 2 impact reduction)
 * - 80-89%:  STRONG (effective, 2 likelihood reduction, 1 impact reduction)
 * - 70-79%:  MODERATE (partial, 1 likelihood reduction, 1 impact reduction)
 * - 50-69%:  WEAK (minimal, 1 likelihood reduction, 0 impact reduction)
 * - 0-49%:   NONE (ineffective, 0 reductions)
 * 
 * @param score - Effectiveness score (0-100)
 * @returns ControlStrength enum value
 */
export function mapEffectivenessScoreToStrength(score: number): ControlStrength {
  if (score >= 90) return 'VERY_STRONG';
  if (score >= 80) return 'STRONG';
  if (score >= 70) return 'MODERATE';
  if (score >= 50) return 'WEAK';
  return 'NONE';
}

/**
 * Map control effectiveness rating to ControlStrength
 * 
 * @param rating - Effectiveness rating from control module
 * @returns ControlStrength enum value
 */
export function mapEffectivenessRatingToStrength(
  rating: ControlEffectivenessRating
): ControlStrength {
  switch (rating) {
    case 'Effective':
      return 'VERY_STRONG';
    case 'Partially Effective':
      return 'MODERATE';
    case 'Not Effective':
      return 'WEAK';
    case 'Not Assessed':
    default:
      return 'NONE';
  }
}

/**
 * Control effectiveness summary from linked controls
 */
export interface AggregatedControlEffectiveness {
  controlCount: number;
  averageScore: number;
  overallStrength: ControlStrength;
  preventiveStrength: ControlStrength;  // For likelihood reduction
  detectiveStrength: ControlStrength;   // For impact reduction
  controlDetails: Array<{
    controlId: string;
    controlName: string;
    score: number;
    rating: string;
    strength: ControlStrength;
  }>;
}

/**
 * Aggregate effectiveness from multiple controls
 * Uses the average score of all linked controls
 * 
 * @param controls - Array of control effectiveness data
 * @returns Aggregated effectiveness with overall strength
 */
export function aggregateControlEffectiveness(
  controls: Array<{ 
    controlId: string; 
    controlName: string;
    score: number; 
    rating: string;
  }>
): AggregatedControlEffectiveness {
  if (!controls || controls.length === 0) {
    return {
      controlCount: 0,
      averageScore: 0,
      overallStrength: 'NONE',
      preventiveStrength: 'NONE',
      detectiveStrength: 'NONE',
      controlDetails: [],
    };
  }

  // Calculate average score
  const totalScore = controls.reduce((sum, c) => sum + c.score, 0);
  const averageScore = Math.round(totalScore / controls.length);
  
  // Map to overall strength
  const overallStrength = mapEffectivenessScoreToStrength(averageScore);
  
  // Build control details
  const controlDetails = controls.map(c => ({
    controlId: c.controlId,
    controlName: c.controlName,
    score: c.score,
    rating: c.rating,
    strength: mapEffectivenessScoreToStrength(c.score),
  }));

  return {
    controlCount: controls.length,
    averageScore,
    overallStrength,
    preventiveStrength: overallStrength, // Same strength for both
    detectiveStrength: overallStrength,  // Can be refined based on control type
    controlDetails,
  };
}

/**
 * Calculate residual risk using aggregated control effectiveness
 * 
 * @param inherentLikelihood - Likelihood before controls
 * @param inherentImpact - Impact before controls
 * @param controlEffectiveness - Aggregated control effectiveness
 * @returns Residual score and levels
 */
export function calculateResidualFromControlEffectiveness(
  inherentLikelihood: LikelihoodLevel | string | null | undefined,
  inherentImpact: ImpactLevel | string | null | undefined,
  controlEffectiveness: AggregatedControlEffectiveness
): {
  residualLikelihood: LikelihoodLevel | null;
  residualImpact: ImpactLevel | null;
  residualScore: number;
  riskReduction: number;
  inherentScore: number;
} {
  const inherentScore = calculateScore(inherentLikelihood, inherentImpact);
  
  if (inherentScore === 0 || controlEffectiveness.controlCount === 0) {
    return {
      residualLikelihood: null,
      residualImpact: null,
      residualScore: inherentScore,
      riskReduction: 0,
      inherentScore,
    };
  }

  // Calculate residual values using control effectiveness
  const residualLikelihoodValue = calculateResidualLikelihood(
    inherentLikelihood,
    controlEffectiveness.preventiveStrength
  );
  const residualImpactValue = calculateResidualImpact(
    inherentImpact,
    controlEffectiveness.detectiveStrength
  );

  const residualScore = residualLikelihoodValue * residualImpactValue;
  const riskReduction = calculateRiskReduction(inherentScore, residualScore);

  return {
    residualLikelihood: valueToLikelihoodLevel(residualLikelihoodValue),
    residualImpact: valueToImpactLevel(residualImpactValue),
    residualScore,
    riskReduction,
    inherentScore,
  };
}

