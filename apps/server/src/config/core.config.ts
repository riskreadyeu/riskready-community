/**
 * Core Configuration
 *
 * Shared configuration values used across multiple modules.
 * These are app-wide constants that should remain consistent.
 */

export const CORE_CONFIG = {
  /**
   * Time period constants (in days)
   */
  time: {
    DAYS_PER_WEEK: 7,
    DAYS_PER_MONTH: 30,
    DAYS_PER_QUARTER: 90,
    DAYS_PER_HALF_YEAR: 180,
    DAYS_PER_YEAR: 365,
  },

  /**
   * Severity levels used across the application
   */
  severity: {
    levels: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const,
  },

  /**
   * Default notification timing (days before due date)
   */
  notifications: {
    reminderDays: [7, 3, 1] as const,
    defaultLeadTimeDays: 7,
  },

  /**
   * Review frequency mappings (in days)
   */
  reviewFrequencies: {
    WEEKLY: 7,
    MONTHLY: 30,
    QUARTERLY: 90,
    SEMI_ANNUALLY: 180,
    ANNUALLY: 365,
  },

  /**
   * Retention and archival settings
   */
  retention: {
    archiveAfterDays: 90,
    auditLogRetentionDays: 365,
  },

  /**
   * Monetary calculations
   */
  monetary: {
    baseValuePerPoint: 10000,
    currency: 'USD',
  },
} as const;

// Type exports for use in services
export type SeverityLevel = (typeof CORE_CONFIG.severity.levels)[number];
export type ReviewFrequency = keyof typeof CORE_CONFIG.reviewFrequencies;
