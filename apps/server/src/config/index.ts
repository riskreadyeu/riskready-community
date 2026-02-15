/**
 * Application Configuration
 *
 * Centralized configuration exports for the entire application.
 * Import from '@/config' or './config' to access any config.
 *
 * @example
 * import { RISKS_CONFIG, CORE_CONFIG } from '@/config';
 * const threshold = RISKS_CONFIG.scoring.thresholds.HIGH;
 */

// Core shared configuration
export { CORE_CONFIG } from './core.config';
export type { SeverityLevel, ReviewFrequency } from './core.config';

// Risk module configuration
export { RISKS_CONFIG } from './risks.config';
export type {
  RiskLevel,
  ToleranceLevel,
  ThreatType,
  ControlStrength,
} from './risks.config';

// Controls module configuration
export { CONTROLS_CONFIG } from './controls.config';
export type {
  EffectivenessRating,
  MaturityLevel,
  MetricFrequency,
  GapPriority,
} from './controls.config';

// Future module configs will be added here:
// export { AUDITS_CONFIG } from './audits.config';
// export { INCIDENTS_CONFIG } from './incidents.config';
