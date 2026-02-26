/**
 * Risk Scoring Utility (Frontend)
 * 
 * Client-side utilities for risk score calculation and display
 * Simple 5×5 likelihood × impact matrix
 */

import type { LikelihoodLevel, ImpactLevel } from './risks-api';

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

