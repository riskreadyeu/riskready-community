import { useQuery } from '@tanstack/react-query';
import {
  getControls,
  getControl,
  getControlStats,
  getControlsByIds,
  getEffectivenessReport,
  getMaturityHeatmap,
  getGapAnalysis,
  getCapabilities,
  getCapability,
  getCapabilitiesByControl,
  getCapabilityStats,
  getAssessments,
  getAssessment,
  getMetrics,
  getMetric,
  getMetricsDashboard,
  getSOAs,
  getSOA,
  getLatestSOA,
  getSOAStats,
  getAllEffectivenessTests,
  getEffectivenessTests,
  getEffectivenessSummary,
  fetchScopeItems,
  fetchScopeItem,
  fetchAssessments as fetchControlAssessments,
  fetchAssessment as fetchControlAssessment,
  fetchAssessmentTests,
  type ControlTheme,
  type ControlFramework,
  type ImplementationStatus,
  type ScopeType,
  type ControlAssessmentStatus,
} from '@/lib/controls-api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const controlKeys = {
  all: ['controls'] as const,
  lists: () => [...controlKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...controlKeys.lists(), params] as const,
  details: () => [...controlKeys.all, 'detail'] as const,
  detail: (id: string) => [...controlKeys.details(), id] as const,
  byIds: (ids: string[]) => [...controlKeys.all, 'byIds', ids] as const,
  stats: (organisationId?: string) => [...controlKeys.all, 'stats', organisationId] as const,
  effectiveness: (organisationId?: string) => [...controlKeys.all, 'effectiveness', organisationId] as const,
  maturityHeatmap: (organisationId?: string) => [...controlKeys.all, 'maturityHeatmap', organisationId] as const,
  gapAnalysis: (organisationId?: string) => [...controlKeys.all, 'gapAnalysis', organisationId] as const,
};

export const capabilityKeys = {
  all: ['capabilities'] as const,
  lists: () => [...capabilityKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...capabilityKeys.lists(), params] as const,
  details: () => [...capabilityKeys.all, 'detail'] as const,
  detail: (id: string) => [...capabilityKeys.details(), id] as const,
  byControl: (controlId: string) => [...capabilityKeys.all, 'byControl', controlId] as const,
  stats: () => [...capabilityKeys.all, 'stats'] as const,
};

export const soaKeys = {
  all: ['soas'] as const,
  lists: () => [...soaKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...soaKeys.lists(), params] as const,
  details: () => [...soaKeys.all, 'detail'] as const,
  detail: (id: string) => [...soaKeys.details(), id] as const,
  latest: (organisationId: string) => [...soaKeys.all, 'latest', organisationId] as const,
  stats: (organisationId?: string) => [...soaKeys.all, 'stats', organisationId] as const,
};

export const assessmentKeys = {
  all: ['assessments'] as const,
  lists: () => [...assessmentKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...assessmentKeys.lists(), params] as const,
  details: () => [...assessmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...assessmentKeys.details(), id] as const,
  tests: (assessmentId: string, status?: string) => [...assessmentKeys.detail(assessmentId), 'tests', status] as const,
};

export const scopeKeys = {
  all: ['scope'] as const,
  list: (orgId: string, scopeType?: ScopeType) => [...scopeKeys.all, 'list', orgId, scopeType] as const,
  detail: (id: string) => [...scopeKeys.all, 'detail', id] as const,
};

// ---------------------------------------------------------------------------
// Control hooks
// ---------------------------------------------------------------------------

export function useControls(params?: {
  skip?: number;
  take?: number;
  theme?: ControlTheme | string;
  implementationStatus?: ImplementationStatus | string;
  framework?: ControlFramework | string;
  activeOnly?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: controlKeys.list(params ?? {}),
    queryFn: () => getControls(params as Parameters<typeof getControls>[0]),
  });
}

export function useControl(id: string) {
  return useQuery({
    queryKey: controlKeys.detail(id),
    queryFn: () => getControl(id),
    enabled: !!id,
  });
}

export function useControlsByIds(ids: string[]) {
  return useQuery({
    queryKey: controlKeys.byIds(ids),
    queryFn: () => getControlsByIds(ids),
    enabled: ids.length > 0,
  });
}

export function useControlStats(organisationId?: string) {
  return useQuery({
    queryKey: controlKeys.stats(organisationId),
    queryFn: () => getControlStats(organisationId),
  });
}

export function useEffectivenessReport(organisationId?: string) {
  return useQuery({
    queryKey: controlKeys.effectiveness(organisationId),
    queryFn: () => getEffectivenessReport(organisationId),
  });
}

export function useMaturityHeatmap(organisationId?: string) {
  return useQuery({
    queryKey: controlKeys.maturityHeatmap(organisationId),
    queryFn: () => getMaturityHeatmap(organisationId),
  });
}

export function useGapAnalysis(organisationId?: string) {
  return useQuery({
    queryKey: controlKeys.gapAnalysis(organisationId),
    queryFn: () => getGapAnalysis(organisationId),
  });
}

// ---------------------------------------------------------------------------
// Capability hooks
// ---------------------------------------------------------------------------

export function useCapabilities(params?: { skip?: number; take?: number; controlId?: string }) {
  return useQuery({
    queryKey: capabilityKeys.list(params ?? {}),
    queryFn: () => getCapabilities(params),
  });
}

export function useCapability(id: string) {
  return useQuery({
    queryKey: capabilityKeys.detail(id),
    queryFn: () => getCapability(id),
    enabled: !!id,
  });
}

export function useCapabilitiesByControl(controlId: string) {
  return useQuery({
    queryKey: capabilityKeys.byControl(controlId),
    queryFn: () => getCapabilitiesByControl(controlId),
    enabled: !!controlId,
  });
}

export function useCapabilityStats() {
  return useQuery({
    queryKey: capabilityKeys.stats(),
    queryFn: () => getCapabilityStats(),
  });
}

// ---------------------------------------------------------------------------
// Assessment hooks
// ---------------------------------------------------------------------------

export function useAssessments(params?: { skip?: number; take?: number; capabilityId?: string }) {
  return useQuery({
    queryKey: assessmentKeys.list(params ?? {}),
    queryFn: () => getAssessments(params),
  });
}

export function useAssessment(id: string) {
  return useQuery({
    queryKey: assessmentKeys.detail(id),
    queryFn: () => getAssessment(id),
    enabled: !!id,
  });
}

export function useControlAssessments(organisationId: string, status?: ControlAssessmentStatus) {
  return useQuery({
    queryKey: assessmentKeys.list({ organisationId, status }),
    queryFn: () => fetchControlAssessments(organisationId, status),
    enabled: !!organisationId,
  });
}

export function useControlAssessment(id: string) {
  return useQuery({
    queryKey: assessmentKeys.detail(id),
    queryFn: () => fetchControlAssessment(id),
    enabled: !!id,
  });
}

export function useAssessmentTests(assessmentId: string, status?: string) {
  return useQuery({
    queryKey: assessmentKeys.tests(assessmentId, status),
    queryFn: () => fetchAssessmentTests(assessmentId, status),
    enabled: !!assessmentId,
  });
}

// ---------------------------------------------------------------------------
// Metrics hooks
// ---------------------------------------------------------------------------

export function useMetrics(params?: { skip?: number; take?: number; capabilityId?: string }) {
  return useQuery({
    queryKey: ['metrics', 'list', params ?? {}],
    queryFn: () => getMetrics(params),
  });
}

export function useMetric(id: string) {
  return useQuery({
    queryKey: ['metrics', 'detail', id],
    queryFn: () => getMetric(id),
    enabled: !!id,
  });
}

export function useMetricsDashboard(organisationId: string) {
  return useQuery({
    queryKey: ['metrics', 'dashboard', organisationId],
    queryFn: () => getMetricsDashboard(organisationId),
    enabled: !!organisationId,
  });
}

// ---------------------------------------------------------------------------
// SOA hooks
// ---------------------------------------------------------------------------

export function useSOAs(params?: Parameters<typeof getSOAs>[0]) {
  return useQuery({
    queryKey: soaKeys.list((params ?? {}) as Record<string, unknown>),
    queryFn: () => getSOAs(params),
  });
}

export function useSOA(id: string) {
  return useQuery({
    queryKey: soaKeys.detail(id),
    queryFn: () => getSOA(id),
    enabled: !!id,
  });
}

export function useLatestSOA(organisationId: string) {
  return useQuery({
    queryKey: soaKeys.latest(organisationId),
    queryFn: () => getLatestSOA(organisationId),
    enabled: !!organisationId,
  });
}

export function useSOAStats(organisationId?: string) {
  return useQuery({
    queryKey: soaKeys.stats(organisationId),
    queryFn: () => getSOAStats(organisationId),
  });
}

// ---------------------------------------------------------------------------
// Effectiveness test hooks
// ---------------------------------------------------------------------------

export function useAllEffectivenessTests(params?: { skip?: number; take?: number; capabilityId?: string }) {
  return useQuery({
    queryKey: ['effectivenessTests', 'list', params ?? {}],
    queryFn: () => getAllEffectivenessTests(params),
  });
}

export function useEffectivenessTests(capabilityId: string) {
  return useQuery({
    queryKey: ['effectivenessTests', 'byCapability', capabilityId],
    queryFn: () => getEffectivenessTests(capabilityId),
    enabled: !!capabilityId,
  });
}

export function useEffectivenessSummary(capabilityId: string) {
  return useQuery({
    queryKey: ['effectivenessTests', 'summary', capabilityId],
    queryFn: () => getEffectivenessSummary(capabilityId),
    enabled: !!capabilityId,
  });
}

// ---------------------------------------------------------------------------
// Scope hooks
// ---------------------------------------------------------------------------

export function useScopeItems(orgId: string, scopeType?: ScopeType) {
  return useQuery({
    queryKey: scopeKeys.list(orgId, scopeType),
    queryFn: () => fetchScopeItems(orgId, scopeType),
    enabled: !!orgId,
  });
}

export function useScopeItem(id: string) {
  return useQuery({
    queryKey: scopeKeys.detail(id),
    queryFn: () => fetchScopeItem(id),
    enabled: !!id,
  });
}
