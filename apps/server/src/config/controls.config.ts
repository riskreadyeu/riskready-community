/**
 * Controls Module Configuration
 *
 * All configurable values for the controls management module.
 * Centralizes hardcoded values that were scattered across control services.
 */

import { CORE_CONFIG } from './core.config';

export const CONTROLS_CONFIG = {
  /**
   * Control effectiveness thresholds (percentage-based)
   * Used to classify control effectiveness rating
   */
  effectiveness: {
    thresholds: {
      EFFECTIVE: 90, // >= 90% = Effective
      PARTIALLY_EFFECTIVE: 70, // >= 70% = Partially Effective
      NOT_EFFECTIVE: 0, // < 70% = Not Effective
    },
    /**
     * Scoring weights for capability assessment results
     */
    scoring: {
      PASS: 3,
      PARTIAL: 2,
      FAIL: 1,
      MAX_PER_CAPABILITY: 3,
    },
  },

  /**
   * Control metrics configuration
   */
  metrics: {
    /**
     * Default threshold definitions for metrics (RAG status)
     */
    defaultThresholds: {
      green: '>=90',
      amber: '>=70',
      red: '<70',
    },
    /**
     * Collection frequency intervals (in days)
     * Used to determine if metrics are overdue for collection
     */
    frequencies: {
      DAILY: 1,
      WEEKLY: 7,
      MONTHLY: 30,
      QUARTERLY: 90,
      ANNUAL: 365,
    },
    /**
     * Trend change threshold (percentage as decimal)
     * Values within this threshold are considered STABLE
     */
    trendThreshold: 0.05, // 5%
  },

  /**
   * Gap analysis configuration
   */
  gaps: {
    /**
     * Maturity gap thresholds for priority classification
     * gap = target maturity - current maturity
     */
    priorities: {
      CRITICAL: 3, // gap >= 3 = Critical
      HIGH: 2, // gap >= 2 = High
      MEDIUM: 0, // gap < 2 = Medium
    },
  },

  /**
   * Maturity model configuration (CMM-style 5-level model)
   */
  maturity: {
    levels: {
      MIN: 0, // Not implemented
      MAX: 5, // Optimizing
    },
    /**
     * Maturity level labels
     */
    labels: {
      0: 'Non-existent',
      1: 'Initial',
      2: 'Repeatable',
      3: 'Defined',
      4: 'Managed',
      5: 'Optimizing',
    },
  },

  /**
   * Pagination and query limits
   */
  pagination: {
    metricHistory: 30,
    metricHistoryShort: 5,
    latestRecord: 1,
  },

  /**
   * Search configuration
   */
  search: {
    minQueryLength: 2,
  },

  /**
   * Effectiveness test result configuration
   */
  testResults: {
    /**
     * Number of capabilities that must pass for EFFECTIVE status
     */
    passCountForEffective: 3,
    /**
     * Status determination logic thresholds
     */
    statusThresholds: {
      NOT_TESTED: 0, // testedCount === 0
      NOT_EFFECTIVE: 1, // failCount > 0
    },
  },

  /**
   * SOA (Statement of Applicability) workflow statuses
   */
  soa: {
    initialStatus: 'DRAFT',
    reviewStatus: 'PENDING_REVIEW',
    approvedStatus: 'APPROVED',
    supersededStatus: 'SUPERSEDED',
  },

  /**
   * Assessment configuration
   */
  assessment: {
    /**
     * Default values for new assessments
     */
    defaults: {
      targetMaturity: 3, // Default target is "Defined"
    },
  },

  // Inherit shared time values from core
  time: CORE_CONFIG.time,
} as const;

// Type exports
export type EffectivenessRating = 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'NOT_EFFECTIVE';
export type MaturityLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type MetricFrequency = keyof typeof CONTROLS_CONFIG.metrics.frequencies;
export type GapPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM';
