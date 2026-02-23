// Control Browser Types
import type {
  Control,
  ControlTheme,
  ControlFramework,
  ImplementationStatus,
  TestResult,
  RAGStatus,
} from "@/lib/controls-api";

export type { Control, ControlTheme, ControlFramework, ImplementationStatus, TestResult, RAGStatus };

// Minimal test result shape used within layer data
export interface LayerTestResult {
  id?: string;
  result?: string;
  [key: string]: unknown;
}

// Legacy layer shape kept locally for control-browser components.
// The four-layer framework types have been removed from controls-api.
export interface ControlLayerBasic {
  id: string;
  controlId: string;
  layer: string;
  description?: string;
  protectionScore: number;
  testsPassed: number;
  testsTotal: number;
  tests?: LayerTestResult[];
  [key: string]: unknown;
}

export interface ControlWithLayers extends Control {
  layers: LayerWithStatus[];
  effectivenessScore?: number;
  effectivenessRating?: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'NOT_EFFECTIVE' | 'NOT_TESTED';
}

export interface LayerWithStatus extends ControlLayerBasic {
  latestAssessment?: {
    protectionScore: number;
    targetScore: number;
    gap: number;
  };
  effectivenessStatus?: {
    testsPassed: number;
    testsTotal: number;
    overall: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'NOT_EFFECTIVE' | 'NOT_TESTED';
  };
  metricsStatus?: {
    total: number;
    green: number;
    amber: number;
    red: number;
    notMeasured: number;
  };
}

export interface ControlBrowserFilters {
  framework: ControlFramework | 'all';
  theme: ControlTheme | 'all';
  status: ImplementationStatus | 'all';
  applicable: boolean | 'all';
  search: string;
  effectivenessRating: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'NOT_EFFECTIVE' | 'NOT_TESTED' | 'all';
}

export interface ControlBrowserState {
  expandedControls: Set<string>;
  selectedControls: Set<string>;
  selectedLayers: Set<string>;
  activeControlId: string | null;
  activeLayerId: string | null;
}

export const FRAMEWORK_LABELS: Record<ControlFramework, string> = {
  ISO: 'ISO 27001',
  SOC2: 'SOC 2',
  NIS2: 'NIS2',
  DORA: 'DORA',
};

export const FRAMEWORK_COLORS: Record<ControlFramework, string> = {
  ISO: 'bg-blue-500',
  SOC2: 'bg-purple-500',
  NIS2: 'bg-emerald-500',
  DORA: 'bg-orange-500',
};

export const THEME_LABELS: Record<ControlTheme, string> = {
  ORGANISATIONAL: 'Organisational',
  PEOPLE: 'People',
  PHYSICAL: 'Physical',
  TECHNOLOGICAL: 'Technological',
};

export const THEME_ICONS: Record<ControlTheme, string> = {
  ORGANISATIONAL: '🏢',
  PEOPLE: '👥',
  PHYSICAL: '🔒',
  TECHNOLOGICAL: '💻',
};

export const THEME_COLORS: Record<ControlTheme, string> = {
  ORGANISATIONAL: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  PEOPLE: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  PHYSICAL: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  TECHNOLOGICAL: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

export const STATUS_LABELS: Record<ImplementationStatus, string> = {
  IMPLEMENTED: 'Implemented',
  PARTIAL: 'Partial',
  NOT_STARTED: 'Not Started',
};

export const STATUS_COLORS: Record<ImplementationStatus, { bg: string; text: string; border: string }> = {
  IMPLEMENTED: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
  PARTIAL: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
  NOT_STARTED: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
};


export const EFFECTIVENESS_LABELS: Record<string, string> = {
  EFFECTIVE: 'Effective',
  PARTIALLY_EFFECTIVE: 'Partially Effective',
  NOT_EFFECTIVE: 'Not Effective',
  NOT_TESTED: 'Not Tested',
};

export const EFFECTIVENESS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  EFFECTIVE: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
  PARTIALLY_EFFECTIVE: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
  NOT_EFFECTIVE: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
  NOT_TESTED: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
};

export const TEST_RESULT_COLORS: Record<TestResult, string> = {
  PASS: 'text-success',
  PARTIAL: 'text-warning',
  FAIL: 'text-destructive',
  NOT_TESTED: 'text-muted-foreground',
  NOT_APPLICABLE: 'text-muted-foreground',
};

export const MATURITY_COLORS: Record<number, string> = {
  0: 'bg-red-500',
  1: 'bg-orange-500',
  2: 'bg-yellow-500',
  3: 'bg-blue-500',
  4: 'bg-emerald-500',
  5: 'bg-green-500',
};

export const MATURITY_LABELS: Record<number, string> = {
  0: 'Non-existent',
  1: 'Initial',
  2: 'Developing',
  3: 'Defined',
  4: 'Managed',
  5: 'Optimizing',
};


export const RAG_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  GREEN: { bg: 'bg-success/10', text: 'text-success' },
  AMBER: { bg: 'bg-warning/10', text: 'text-warning' },
  RED: { bg: 'bg-destructive/10', text: 'text-destructive' },
  NOT_MEASURED: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

export type ScopeType = 'APPLICATION' | 'ASSET_CLASS' | 'LOCATION' | 'PERSONNEL_TYPE' | 'BUSINESS_UNIT' | 'PLATFORM' | 'PROVIDER' | 'NETWORK_ZONE' | 'PROCESS';
export type ScopeCriticality = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export const SCOPE_TYPE_LABELS: Record<ScopeType, string> = {
  APPLICATION: 'Application',
  ASSET_CLASS: 'Asset Class',
  LOCATION: 'Location',
  PERSONNEL_TYPE: 'Personnel Type',
  BUSINESS_UNIT: 'Business Unit',
  PLATFORM: 'Platform',
  PROVIDER: 'Provider',
  NETWORK_ZONE: 'Network Zone',
  PROCESS: 'Process',
};

export const SCOPE_CRITICALITY_LABELS: Record<ScopeCriticality, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const SCOPE_CRITICALITY_COLORS: Record<ScopeCriticality, { bg: string; text: string; dot: string }> = {
  CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
  HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500' },
  MEDIUM: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', dot: 'bg-yellow-500' },
  LOW: { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' },
};
