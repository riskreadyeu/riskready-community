/**
 * Risk Scoring Utility (Frontend)
 * 
 * Client-side utilities for risk score calculation and display
 * Including BIRT (Business Impact Reference Table) weighted impact calculation
 */

import type { LikelihoodLevel, ImpactLevel, ImpactCategory } from './risks-api';

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

// Labels for display
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

// Ordered lists for dropdowns
export const LIKELIHOOD_LEVELS: LikelihoodLevel[] = [
  'RARE',
  'UNLIKELY', 
  'POSSIBLE',
  'LIKELY',
  'ALMOST_CERTAIN',
];

export const IMPACT_LEVELS: ImpactLevel[] = [
  'NEGLIGIBLE',
  'MINOR',
  'MODERATE',
  'MAJOR',
  'SEVERE',
];

/**
 * Calculate risk score from likelihood and impact
 */
export function calculateScore(
  likelihood: LikelihoodLevel | undefined | null,
  impact: ImpactLevel | undefined | null
): number {
  if (!likelihood || !impact) return 0;
  return LIKELIHOOD_VALUES[likelihood] * IMPACT_VALUES[impact];
}

/**
 * Get risk level category
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE';

/**
 * Get risk level category based on score
 * Aligned with POL-002 Section 5.3.2
 *
 * Thresholds:
 * - LOW: 1-7 (Acceptable with monitoring)
 * - MEDIUM: 8-14 (Generally unacceptable, 90 day treatment)
 * - HIGH: 15-19 (Unacceptable, 30 day treatment)
 * - CRITICAL: 20-25 (Immediate treatment required)
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score <= 0) return 'NONE';
  if (score <= 7) return 'LOW';
  if (score <= 14) return 'MEDIUM';
  if (score <= 19) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Get color class for risk score
 * Aligned with POL-002 Section 5.3.2 thresholds
 */
export function getRiskScoreColor(score: number | undefined | null): string {
  if (!score) return 'text-muted-foreground';
  if (score <= 7) return 'text-success';      // LOW (1-7)
  if (score <= 14) return 'text-warning';     // MEDIUM (8-14)
  if (score <= 19) return 'text-orange-600';  // HIGH (15-19)
  return 'text-destructive';                   // CRITICAL (20-25)
}

/**
 * Get background color class for risk score
 * Aligned with POL-002 Section 5.3.2 thresholds
 */
export function getRiskScoreBgColor(score: number | undefined | null): string {
  if (!score) return 'bg-muted';
  if (score <= 7) return 'bg-success/10';      // LOW (1-7)
  if (score <= 14) return 'bg-warning/10';     // MEDIUM (8-14)
  if (score <= 19) return 'bg-orange-600/10';  // HIGH (15-19)
  return 'bg-destructive/10';                   // CRITICAL (20-25)
}

/**
 * Get risk level label
 */
export function getRiskLevelLabel(score: number | undefined | null): string {
  const level = getRiskLevel(score || 0);
  switch (level) {
    case 'LOW': return 'Low';
    case 'MEDIUM': return 'Medium';
    case 'HIGH': return 'High';
    case 'CRITICAL': return 'Critical';
    default: return 'Not Assessed';
  }
}

/**
 * Calculate risk reduction percentage
 */
export function calculateRiskReduction(
  inherentScore: number | undefined | null,
  residualScore: number | undefined | null
): number | null {
  if (!inherentScore || inherentScore === 0) return null;
  if (!residualScore) return 100;
  
  const reduction = ((inherentScore - residualScore) / inherentScore) * 100;
  return Math.max(0, Math.round(reduction));
}

/**
 * Generate 5x5 risk matrix data
 */
export function getRiskMatrix(): { likelihood: LikelihoodLevel; impact: ImpactLevel; score: number }[][] {
  return LIKELIHOOD_LEVELS.map(likelihood => 
    IMPACT_LEVELS.map(impact => ({
      likelihood,
      impact,
      score: calculateScore(likelihood, impact),
    }))
  ).reverse(); // Reverse so highest likelihood is at top
}

// ============================================
// BIRT (Business Impact Reference Table)
// Weighted Impact Calculation
// ============================================

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
 * Impact categories in order
 */
export const IMPACT_CATEGORIES: ImpactCategory[] = [
  'FINANCIAL',
  'OPERATIONAL',
  'LEGAL_REGULATORY',
  'REPUTATIONAL',
  'STRATEGIC',
];

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
 * Calculate weighted impact from category assessments
 *
 * IMPORTANT: All 5 BIRT categories must be assessed for accurate calculation.
 * Unassessed categories are treated as 0 (not contributing to score), and
 * the calculation always divides by 100% to prevent inflation from partial assessments.
 *
 * @param assessments - Array of category assessments with values (1-5)
 * @param weights - Array of category weights (percentages, should sum to 100)
 * @returns Weighted average impact (1-5), or 0 if no assessments
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
  const assessedCategories = new Set(assessments.map((a) => a.category));

  const missingCategories = IMPACT_CATEGORIES.filter(
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
 * Calculate risk score using weighted impact
 *
 * @param likelihood - Likelihood level
 * @param assessments - Category impact assessments
 * @param weights - Category weights (optional, uses defaults if not provided)
 * @returns Risk score (1-25)
 */
export function calculateScoreWithWeightedImpact(
  likelihood: LikelihoodLevel | undefined | null,
  assessments: CategoryAssessment[],
  weights?: CategoryWeight[]
): number {
  if (!likelihood || !assessments || assessments.length === 0) {
    return 0;
  }

  const likelihoodValue = LIKELIHOOD_VALUES[likelihood];
  const weightedImpact = calculateWeightedImpact(assessments, weights);

  return likelihoodValue * weightedImpact;
}

/**
 * Convert weighted impact value (1-5) to ImpactLevel
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
 * Get category-specific color
 */
export function getCategoryColor(category: ImpactCategory): string {
  switch (category) {
    case 'FINANCIAL': return 'text-green-600';
    case 'OPERATIONAL': return 'text-orange-600';
    case 'LEGAL_REGULATORY': return 'text-blue-600';
    case 'REPUTATIONAL': return 'text-purple-600';
    case 'STRATEGIC': return 'text-indigo-600';
    default: return 'text-muted-foreground';
  }
}

/**
 * Get category-specific background color
 */
export function getCategoryBgColor(category: ImpactCategory): string {
  switch (category) {
    case 'FINANCIAL': return 'bg-green-500/10';
    case 'OPERATIONAL': return 'bg-orange-500/10';
    case 'LEGAL_REGULATORY': return 'bg-blue-500/10';
    case 'REPUTATIONAL': return 'bg-purple-500/10';
    case 'STRATEGIC': return 'bg-indigo-500/10';
    default: return 'bg-muted';
  }
}

/**
 * Validate that weights sum to 100%
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
