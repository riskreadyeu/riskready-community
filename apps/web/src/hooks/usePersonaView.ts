import { useState, useCallback, useMemo } from 'react';

// ============================================
// PERSONA VIEW HOOK
// Manages risk module view modes based on user persona
// Provides view-specific configuration and filtering
// ============================================

export type RiskPersona =
  | 'executive'      // C-level: Aggregate metrics, top risks, compliance status
  | 'analyst'        // Risk analyst: Detailed scenarios, calculations, factors
  | 'operator'       // Operations: Tasks, treatments, pending reviews
  | 'auditor';       // Auditor: Version history, snapshots, audit trail

export interface PersonaViewConfig {
  persona: RiskPersona;
  label: string;
  description: string;
  defaultRiskView: 'grid' | 'list' | 'matrix';
  showFactorDetails: boolean;
  showCalculationTrace: boolean;
  showVersionHistory: boolean;
  showPendingTasks: boolean;
  showComplianceStatus: boolean;
  showTreatmentProgress: boolean;
  primaryMetrics: string[];
  visibleSections: string[];
  defaultFilters: Record<string, unknown>;
}

const PERSONA_CONFIGS: Record<RiskPersona, PersonaViewConfig> = {
  executive: {
    persona: 'executive',
    label: 'Executive View',
    description: 'High-level risk overview with aggregate metrics and compliance status',
    defaultRiskView: 'matrix',
    showFactorDetails: false,
    showCalculationTrace: false,
    showVersionHistory: false,
    showPendingTasks: false,
    showComplianceStatus: true,
    showTreatmentProgress: true,
    primaryMetrics: [
      'totalRisks',
      'criticalRisks',
      'riskTrend',
      'toleranceCompliance',
      'topRisks',
    ],
    visibleSections: [
      'riskHeatmap',
      'toleranceStatus',
      'topRisks',
      'trendChart',
      'kriAlerts',
    ],
    defaultFilters: {
      minResidualScore: 12, // Show only TREAT and TERMINATE zone
      sortBy: 'residualScore',
      sortOrder: 'desc',
    },
  },
  analyst: {
    persona: 'analyst',
    label: 'Analyst View',
    description: 'Detailed risk analysis with scenarios, factors, and calculation traces',
    defaultRiskView: 'list',
    showFactorDetails: true,
    showCalculationTrace: true,
    showVersionHistory: true,
    showPendingTasks: false,
    showComplianceStatus: false,
    showTreatmentProgress: true,
    primaryMetrics: [
      'totalScenarios',
      'activeScenarios',
      'avgLikelihood',
      'avgImpact',
      'controlCoverage',
    ],
    visibleSections: [
      'scenarioList',
      'factorBreakdown',
      'calculationHistory',
      'linkedEntities',
      'versionComparison',
    ],
    defaultFilters: {
      includeInactive: false,
      sortBy: 'lastCalculatedAt',
      sortOrder: 'desc',
    },
  },
  operator: {
    persona: 'operator',
    label: 'Operator View',
    description: 'Task-focused view with treatment plans, pending reviews, and action items',
    defaultRiskView: 'list',
    showFactorDetails: false,
    showCalculationTrace: false,
    showVersionHistory: false,
    showPendingTasks: true,
    showComplianceStatus: false,
    showTreatmentProgress: true,
    primaryMetrics: [
      'pendingReviews',
      'overdueTasks',
      'treatmentsInProgress',
      'upcomingDeadlines',
      'myAssignedRisks',
    ],
    visibleSections: [
      'taskQueue',
      'treatmentProgress',
      'reviewSchedule',
      'kriMonitoring',
      'recentAlerts',
    ],
    defaultFilters: {
      assignedToMe: true,
      hasPendingTasks: true,
      sortBy: 'nextReviewDate',
      sortOrder: 'asc',
    },
  },
  auditor: {
    persona: 'auditor',
    label: 'Auditor View',
    description: 'Audit trail with version history, snapshots, and compliance evidence',
    defaultRiskView: 'list',
    showFactorDetails: true,
    showCalculationTrace: true,
    showVersionHistory: true,
    showPendingTasks: false,
    showComplianceStatus: true,
    showTreatmentProgress: false,
    primaryMetrics: [
      'snapshotCount',
      'approvedVersions',
      'reviewCompletionRate',
      'eventCount',
      'complianceGaps',
    ],
    visibleSections: [
      'versionHistory',
      'snapshotTimeline',
      'eventLog',
      'approvalWorkflow',
      'complianceEvidence',
    ],
    defaultFilters: {
      includeSnapshots: true,
      sortBy: 'snapshotDate',
      sortOrder: 'desc',
    },
  },
};

export interface UsePersonaViewReturn {
  // Current state
  persona: RiskPersona;
  config: PersonaViewConfig;

  // Actions
  setPersona: (persona: RiskPersona) => void;
  resetToDefault: () => void;

  // Configuration helpers
  getPersonaLabel: () => string;
  getPersonaDescription: () => string;
  getVisibleSections: () => string[];
  getPrimaryMetrics: () => string[];
  getDefaultFilters: () => Record<string, unknown>;

  // View state helpers
  shouldShowSection: (section: string) => boolean;
  shouldShowMetric: (metric: string) => boolean;

  // All personas for selector UI
  allPersonas: Array<{ value: RiskPersona; label: string; description: string }>;
}

const DEFAULT_PERSONA: RiskPersona = 'analyst';
const STORAGE_KEY = 'riskready:persona-view';

export function usePersonaView(initialPersona?: RiskPersona): UsePersonaViewReturn {
  // Try to load from localStorage, fallback to initial or default
  const [persona, setPersonaState] = useState<RiskPersona>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in PERSONA_CONFIGS) {
        return stored as RiskPersona;
      }
    }
    return initialPersona ?? DEFAULT_PERSONA;
  });

  const config = useMemo(() => PERSONA_CONFIGS[persona], [persona]);

  const setPersona = useCallback((newPersona: RiskPersona) => {
    setPersonaState(newPersona);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newPersona);
    }
  }, []);

  const resetToDefault = useCallback(() => {
    setPersona(DEFAULT_PERSONA);
  }, [setPersona]);

  const getPersonaLabel = useCallback(() => config.label, [config]);

  const getPersonaDescription = useCallback(() => config.description, [config]);

  const getVisibleSections = useCallback(() => config.visibleSections, [config]);

  const getPrimaryMetrics = useCallback(() => config.primaryMetrics, [config]);

  const getDefaultFilters = useCallback(() => config.defaultFilters, [config]);

  const shouldShowSection = useCallback(
    (section: string) => config.visibleSections.includes(section),
    [config],
  );

  const shouldShowMetric = useCallback(
    (metric: string) => config.primaryMetrics.includes(metric),
    [config],
  );

  const allPersonas = useMemo(
    () =>
      Object.values(PERSONA_CONFIGS).map((c) => ({
        value: c.persona,
        label: c.label,
        description: c.description,
      })),
    [],
  );

  return {
    persona,
    config,
    setPersona,
    resetToDefault,
    getPersonaLabel,
    getPersonaDescription,
    getVisibleSections,
    getPrimaryMetrics,
    getDefaultFilters,
    shouldShowSection,
    shouldShowMetric,
    allPersonas,
  };
}

// ============================================
// PERSONA SELECTOR COMPONENT (optional export)
// ============================================

export interface PersonaSelectorProps {
  value: RiskPersona;
  onChange: (persona: RiskPersona) => void;
  className?: string;
}

// Note: The actual component would be in a .tsx file
// This is just the type export for use in components
