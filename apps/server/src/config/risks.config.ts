/**
 * Risk Module Configuration
 *
 * All configurable values for the risk management module.
 * Centralizes hardcoded values that were scattered across risk services.
 */

import { CORE_CONFIG } from './core.config';

export const RISKS_CONFIG = {
  /**
   * Risk score thresholds for level classification
   * Score range: 1-25 (likelihood 1-5 × impact 1-5)
   */
  scoring: {
    thresholds: {
      LOW: 7, // 1-7 = LOW
      MEDIUM: 14, // 8-14 = MEDIUM
      HIGH: 19, // 15-19 = HIGH
      CRITICAL: 25, // 20-25 = CRITICAL
    },
    minScore: 1,
    maxScore: 25,
    maxLikelihood: 5,
    maxImpact: 5,
  },

  /**
   * Tolerance threshold defaults and levels
   */
  tolerance: {
    levels: {
      VERY_LOW: 5,
      LOW: 8,
      MEDIUM: 12,
      HIGH: 16,
      VERY_HIGH: 20,
    },
    defaultThreshold: 15,
    /**
     * Gap thresholds for alert severity classification
     * gap = score - threshold
     */
    gapAlerts: {
      CRITICAL: 8, // gap > 8 = CRITICAL
      HIGH: 4, // gap > 4 = HIGH
      MEDIUM: 2, // gap > 2 = MEDIUM
      // gap <= 2 = LOW
    },
  },

  /**
   * F1-F6 Likelihood factor weights (must sum to 100)
   */
  factors: {
    weights: {
      F1_THREAT_FREQUENCY: 25,
      F2_CONTROL_EFFECTIVENESS: 25,
      F3_GAP_VULNERABILITY: 20,
      F4_INCIDENT_HISTORY: 15,
      F5_ATTACK_SURFACE: 10,
      F6_ENVIRONMENTAL: 5,
    },
    /**
     * Alternative factor weight configuration
     */
    alternativeWeights: {
      THREAT_FREQUENCY: 20,
      VULNERABILITY_EXPOSURE: 20,
      CONTROL_MATURITY: 20,
      INCIDENT_HISTORY: 15,
      KRI_STATUS: 15,
      NONCONFORMITY: 10,
      EXTERNAL_FACTORS: 0,
    },
  },

  /**
   * Treatment plan configuration
   */
  treatment: {
    /**
     * Default deadlines by severity (in days)
     */
    deadlines: {
      EMERGENCY: 7,
      STANDARD: 14,
      CRITICAL: 30,
      EXCEEDS: 60,
      DEFAULT: 90,
    },
    /**
     * Target score calculation: threshold - offset
     */
    targetScoreOffset: 2,
  },

  /**
   * Risk acceptance configuration
   */
  acceptance: {
    /**
     * Maximum validity periods by risk level (in days)
     */
    validity: {
      CRITICAL: 180, // 6 months
      HIGH: 365, // 1 year
      MEDIUM: 730, // 2 years
      LOW: 1095, // 3 years
    },
    /**
     * Acceptance period limits for renewals
     */
    limits: {
      CRITICAL: {
        initialMonths: 6,
        renewalMonths: 6,
        maxCumulativeMonths: 18,
        maxRenewals: 3,
        requiresBoardNotification: true,
      },
      HIGH: {
        initialMonths: 12,
        renewalMonths: 12,
        maxCumulativeMonths: 36,
        maxRenewals: 3,
        requiresBoardNotification: true,
      },
      MEDIUM: {
        initialMonths: 24,
        renewalMonths: 24,
        maxCumulativeMonths: null, // unlimited
        maxRenewals: null, // unlimited
        requiresBoardNotification: false,
      },
      LOW: {
        initialMonths: 36,
        renewalMonths: 36,
        maxCumulativeMonths: null,
        maxRenewals: null,
        requiresBoardNotification: false,
      },
    },
  },

  /**
   * Scheduler configuration
   */
  scheduler: {
    draftTimeoutDays: 7,
    acceptanceExpiryWarningDays: 30,
    treatmentActionDueDays: 14,
    escalationThresholds: {
      acceptanceExpiryHighPriority: 7, // days until expiry
      treatmentActionOverdue: 14, // days overdue before escalation
      treatmentActionCritical: 30, // days overdue for CRITICAL severity
      reviewOverdueHigh: 7, // days overdue for HIGH severity
    },
  },

  /**
   * Control effectiveness scoring
   */
  controlEffectiveness: {
    testResults: {
      EFFECTIVE: 90,
      PARTIALLY_EFFECTIVE: 60,
      INEFFECTIVE: 20,
      NOT_TESTED: 50,
    },
    strengthThresholds: {
      VERY_STRONG: 90, // 90-100%
      STRONG: 80, // 80-89%
      MODERATE: 70, // 70-79%
      WEAK: 50, // 50-69%
      NONE: 0, // 0-49%
    },
    reductions: {
      VERY_STRONG: { likelihood: 3, impact: 2, percentage: 90 },
      STRONG: { likelihood: 2, impact: 1, percentage: 75 },
      MODERATE: { likelihood: 1, impact: 1, percentage: 50 },
      WEAK: { likelihood: 1, impact: 0, percentage: 20 },
      NONE: { likelihood: 0, impact: 0, percentage: 0 },
    },
    /**
     * Weight multipliers for control links
     */
    linkWeights: {
      explicit: 1.5,
      category: 50,
    },
  },

  /**
   * Incident history factor scoring
   */
  incidentScoring: {
    thresholds: {
      0: 1, // 0 incidents = score 1
      1: 2, // 1 incident = score 2
      3: 3, // 2-3 incidents = score 3
      5: 4, // 4-5 incidents = score 4
      6: 5, // 6+ incidents = score 5
    },
    lookbackMonths: 24,
    severeCountBoostThreshold: 3,
  },

  /**
   * Default threat frequency scores by type
   */
  threatFrequency: {
    RANSOMWARE: 4,
    PHISHING: 4,
    DATA_BREACH: 3,
    DDOS: 3,
    SUPPLY_CHAIN: 2,
    INSIDER_THREAT: 2,
    GENERIC: 3, // default
  },

  /**
   * BIRT (Business Impact Reference Table) weights
   */
  birt: {
    defaultWeights: {
      FINANCIAL: 20,
      OPERATIONAL: 20,
      LEGAL_REGULATORY: 20,
      REPUTATIONAL: 20,
      STRATEGIC: 20,
    },
  },

  /**
   * ROI recommendation thresholds
   */
  roi: {
    thresholds: {
      HIGHLY_RECOMMENDED: 100, // roi > 100
      RECOMMENDED: 50, // roi > 50
      CONSIDER: 0, // roi > 0
      MARGINAL: -25, // roi > -25
      // roi <= -25 = NOT_RECOMMENDED
    },
    riskLevelMultipliers: {
      CRITICAL: 5.0,
      HIGH: 3.0,
      MEDIUM: 1.5,
      LOW: 1.0,
      DEFAULT: 0.5,
    },
  },

  /**
   * Approval authorities by risk level
   */
  approvalAuthority: {
    CRITICAL: {
      primary: 'CEO',
      secondary: 'Board/Steering Committee',
      notificationTiming: 'IMMEDIATE',
    },
    HIGH: {
      primary: 'CISO',
      secondary: 'Steering Committee',
      notificationTimingDays: 5,
    },
    MEDIUM: {
      primary: 'CISO',
      secondary: null,
      notificationFrequency: 'QUARTERLY',
    },
    LOW: {
      primary: 'Risk Owner',
      secondary: null,
      notificationFrequency: 'ANNUAL',
    },
  },

  /**
   * Review frequencies by risk level
   */
  reviewFrequencies: {
    CRITICAL: 'QUARTERLY',
    HIGH: 'MONTHLY',
    MEDIUM: 'QUARTERLY',
    LOW: 'ANNUALLY',
  },

  /**
   * Alert configuration
   */
  alerts: {
    scoreChangeThreshold: 4, // points change to trigger alert
  },

  // Inherit shared time values from core
  time: CORE_CONFIG.time,
  monetary: CORE_CONFIG.monetary,
} as const;

// Type exports
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ToleranceLevel = keyof typeof RISKS_CONFIG.tolerance.levels;
export type ThreatType = keyof typeof RISKS_CONFIG.threatFrequency;
export type ControlStrength = keyof typeof RISKS_CONFIG.controlEffectiveness.reductions;
